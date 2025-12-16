package http

import (
	"github.com/go-chi/chi/v5"
)

// SetupRoutes configures the routes for the application.
func SetupRoutes(r *chi.Mux, h *Handler) {
	r.Post("/create-object", h.CreateObject)
	r.Get("/get-object", h.GetObject)
	r.Get("/get-all-objects", h.GetAllObjects)
	r.Put("/update-object", h.UpdateObject)
	r.Delete("/delete-object", h.DeleteObject)
}
