package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"rup_database/internal/config"
	db "rup_database/internal/db"
	httpHandlers "rup_database/internal/http"
	"rup_database/internal/repository"
)

func main() {
	cfg := config.Load()

	database, err := db.Connect(cfg)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	// Run migrations
	migrationSQL, err := os.ReadFile("internal/db/migrations/0001_init.sql")
	if err != nil {
		log.Fatal("failed to read migration file: ", err)
	}
	_, err = database.Exec(string(migrationSQL))
	if err != nil {
		log.Fatal("failed to run migrations: ", err)
	}

	repo := repository.NewObjectRepo(database)
	handler := httpHandlers.NewHandler(repo)
	router := httpHandlers.NewRouter(handler)

	addr := fmt.Sprintf(":%d", cfg.AppPort)

	log.Println("Server started on", addr)
	http.ListenAndServe(addr, router)
}
