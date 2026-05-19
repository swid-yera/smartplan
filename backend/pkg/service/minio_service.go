package service

import (
	"context"
	"io"
	"time"
)

type FileStorage interface {
	UploadFile(ctx context.Context, fileName string, reader io.Reader, size int64) error
	DownloadFile(ctx context.Context, fileName string) (io.ReadCloser, error)
	FileExists(ctx context.Context, fileName string) (bool, error)
	GetDownloadFileURL(ctx context.Context, fileName string, expiry time.Duration) (string, error)
}

type StorageService struct {
	repo FileStorage
}

func NewStorageService(repo FileStorage) *StorageService {
	return &StorageService{repo: repo}
}

func (s *StorageService) SaveUserAvatar(ctx context.Context, userID string, file io.Reader, size int64) error {
	fileName := "kpi/" + userID + ".docx"
	return s.repo.UploadFile(ctx, fileName, file, size)
}
