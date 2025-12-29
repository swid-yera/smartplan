package service

import (
	"context"
	"io"
)

type FileStorage interface {
	UploadFile(ctx context.Context, fileName string, reader io.Reader, size int64) error
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
