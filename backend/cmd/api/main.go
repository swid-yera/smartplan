package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq" // The blank import for the postgres driver
	"github.com/rs/cors"

	httphandlers "rup_database/internal/http"
	"rup_database/internal/repository"
)

func main() {
	_ = godotenv.Load("../../.env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("could not connect to database: %v", err)
	}
	defer db.Close()

	repo := repository.NewObjectRepo(db)
	h := httphandlers.NewHandler(repo)

	// 1. Create the router
	r := chi.NewRouter()
	// 2. Apply middleware
	r.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}).Handler)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 3. Setup the routes
	httphandlers.SetupRoutes(r, h)

	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("could not start server: %s\n", err)
	}
}
