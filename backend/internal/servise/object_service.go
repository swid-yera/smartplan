package services

import (
	"context"
	"encoding/json"
	"rup_database/internal/models"
	"rup_database/internal/repository"
)

type ObjectService struct {
	repo repository.ObjectRepository
}

func NewObjectService(repo repository.ObjectRepository) *ObjectService {
	return &ObjectService{repo: repo}
}

func (s *ObjectService) Create(ctx context.Context, input models.CreateObjectDTO) (*models.Object, error) {
	var inner models.InnerCreateObjectDTO
	if err := json.Unmarshal(input.Data, &inner); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, inner)
}

func (s *ObjectService) GetByID(ctx context.Context, id string) (*models.Object, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ObjectService) List(ctx context.Context) ([]*models.Object, error) {
	return s.repo.List(ctx)
}

func (s *ObjectService) Update(ctx context.Context, input models.UpdateObjectDTO) (*models.Object, error) {
	var inner models.InnerUpdateObjectDTO
	if err := json.Unmarshal(input.Data, &inner); err != nil {
		return nil, err
	}
	inner.ID = input.ID
	return s.repo.Update(ctx, inner)
}

func (s *ObjectService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
