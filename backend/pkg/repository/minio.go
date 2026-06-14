package repository

import (
	"context"
	"errors"
	"io"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type FileInfo struct {
	Key          string
	LastModified time.Time
}

type MinioRepository struct {
	Client *minio.Client
	Bucket string
}

func NewMinioRepository(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*MinioRepository, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}

	return &MinioRepository{
		Client: client,
		Bucket: bucket,
	}, nil
}

func (r *MinioRepository) UploadFile(ctx context.Context, fileName string, reader io.Reader, size int64) error {
	_, err := r.Client.PutObject(ctx, r.Bucket, fileName, reader, size, minio.PutObjectOptions{})
	return err
}

func (r *MinioRepository) DeleteFile(ctx context.Context, fileName string) error {
	return r.Client.RemoveObject(ctx, r.Bucket, fileName, minio.RemoveObjectOptions{})
}

func (r *MinioRepository) DownloadFile(ctx context.Context, fileName string) (io.ReadCloser, error) {
	object, err := r.Client.GetObject(ctx, r.Bucket, fileName, minio.GetObjectOptions{})
	if err != nil {
		return nil, err
	}
	return object, nil
}

func (r *MinioRepository) FileExists(ctx context.Context, fileName string) (bool, error) {
	_, err := r.Client.StatObject(ctx, r.Bucket, fileName, minio.StatObjectOptions{})
	if err != nil {
		var responseErr minio.ErrorResponse
		if errors.As(err, &responseErr) {
			if responseErr.StatusCode == 404 || responseErr.Code == "NoSuchKey" || responseErr.Code == "NoSuchObject" {
				return false, nil
			}
		}
		return false, err
	}

	return true, nil
}

func (r *MinioRepository) GetDownloadFileURL(ctx context.Context, fileName string, expiry time.Duration) (string, error) {
	presignedURL, err := r.Client.PresignedGetObject(ctx, r.Bucket, fileName, expiry, nil)
	if err != nil {
		return "", err
	}
	return presignedURL.String(), nil
}

func (r *MinioRepository) ListFiles(ctx context.Context, prefix string) ([]FileInfo, error) {
	var result []FileInfo
	opts := minio.ListObjectsOptions{Prefix: prefix, Recursive: true}
	for obj := range r.Client.ListObjects(ctx, r.Bucket, opts) {
		if obj.Err != nil {
			return nil, obj.Err
		}
		result = append(result, FileInfo{Key: obj.Key, LastModified: obj.LastModified})
	}
	return result, nil
}
