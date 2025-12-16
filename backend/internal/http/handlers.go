package http

import (
	"encoding/json"
	"net/http"
	"rup_database/internal/models"
	"rup_database/internal/service"
)

type Handler struct {
	service *service.ObjectService
}

func NewHandler(service *service.ObjectService) *Handler {
	return &Handler{service: service}
}

// respondJSON is a helper to write JSON responses.
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		// If encoding fails, it's a server-side issue.
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (h *Handler) CreateObject(w http.ResponseWriter, r *http.Request) {
	var wrapper models.CreateObjectDTO
	if err := json.NewDecoder(r.Body).Decode(&wrapper); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var inner models.InnerCreateObjectDTO
	if err := json.Unmarshal(wrapper.Data, &inner); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	obj, err := h.service.Create(r.Context(), inner)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusCreated, obj)
}

func (h *Handler) GetObject(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id required", http.StatusBadRequest)
		return
	}

	obj, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		// You might want to check for a specific "not found" error from the repo
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	respondJSON(w, http.StatusOK, obj)
}

func (h *Handler) GetAllObjects(w http.ResponseWriter, r *http.Request) {
	objects, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, objects)
}

func (h *Handler) UpdateObject(w http.ResponseWriter, r *http.Request) {
	var wrapper models.UpdateObjectDTO
	if err := json.NewDecoder(r.Body).Decode(&wrapper); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var inner models.InnerUpdateObjectDTO
	if err := json.Unmarshal(wrapper.Data, &inner); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	inner.ID = wrapper.ID

	obj, err := h.service.Update(r.Context(), inner)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, obj)
}

func (h *Handler) DeleteObject(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id required", http.StatusBadRequest)
		return
	}

	err := h.service.Delete(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetDraftedObjects(w http.ResponseWriter, r *http.Request) {
	objects, err := h.service.GetByStatus(r.Context(), "DRAFT")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, objects)
}

func (h *Handler) GetInReviewObjects(w http.ResponseWriter, r *http.Request) {
	objects, err := h.service.GetByStatus(r.Context(), "IN_REVIEW")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, objects)
}

func (h *Handler) GetApprovedObjects(w http.ResponseWriter, r *http.Request) {
	objects, err := h.service.GetByStatus(r.Context(), "APPROVED")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, objects)
}
