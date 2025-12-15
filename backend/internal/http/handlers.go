package http

import (
	"encoding/json"
	"net/http"
	"rup_database/internal/models"
	"rup_database/internal/repository"
)

type Handler struct {
	repo *repository.ObjectRepo
}

func NewHandler(repo *repository.ObjectRepo) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) CreateObject(w http.ResponseWriter, r *http.Request) {
	var wrapper models.CreateObjectDTO
	if err := json.NewDecoder(r.Body).Decode(&wrapper); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	var inner models.InnerCreateObjectDTO
	if err := json.Unmarshal(wrapper.Data, &inner); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	obj, err := h.repo.Create(r.Context(), inner)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(obj)
}

func (h *Handler) GetObject(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id required", 400)
		return
	}

	obj, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}

	json.NewEncoder(w).Encode(obj)
}

func (h *Handler) GetAllObjects(w http.ResponseWriter, r *http.Request) {
	objects, err := h.repo.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(objects)
}

func (h *Handler) UpdateObject(w http.ResponseWriter, r *http.Request) {
	var wrapper models.UpdateObjectDTO
	if err := json.NewDecoder(r.Body).Decode(&wrapper); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	var inner models.InnerUpdateObjectDTO
	if err := json.Unmarshal(wrapper.Data, &inner); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	inner.ID = wrapper.ID

	obj, err := h.repo.Update(r.Context(), inner)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(obj)
}

func (h *Handler) DeleteObject(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id required", 400)
		return
	}

	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.WriteHeader(204)
}
