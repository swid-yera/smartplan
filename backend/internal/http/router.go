package http

import (
	"github.com/go-chi/chi/v5"
)

func NewRouter(h *Handler) *chi.Mux {
	r := chi.NewRouter()

	r.Post("/create-object", h.CreateObject)
	r.Get("/get-object", h.GetObject)
	r.Get("/get-all-objects", h.GetAllObjects)
	r.Put("/update-object", h.UpdateObject)
	r.Delete("/delete-object", h.DeleteObject)

	return r
}
