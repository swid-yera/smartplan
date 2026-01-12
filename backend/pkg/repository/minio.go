package repository

import (
	"context"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

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
