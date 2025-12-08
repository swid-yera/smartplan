package main

import (
	"eduplan/internal/auth"
	"eduplan/internal/config"
	"eduplan/internal/db"
	"eduplan/internal/handlers"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	_ "github.com/joho/godotenv/autoload"
)

func main() {
	cfg := config.Load()
	auth.Init(cfg.KeycloakRealmURL)
	db.Init(cfg.DBDSN)

	app := fiber.New()
	app.Use(logger.New())

	app.Use(auth.AuthMiddleware(cfg.KeycloakAudience))

	// Study Plans (RUP) routes
	app.Get("/api/v1/rups", auth.RequireRole("teacher"), handlers.GetStudyPlans)
	app.Post("/api/v1/rups", auth.RequireRole("teacher"), handlers.CreateStudyPlan)
	app.Get("/api/v1/rups/:id", auth.RequireRole("student"), handlers.GetStudyPlan)
	app.Put("/api/v1/rups/:id", auth.RequireRole("teacher"), handlers.UpdateStudyPlan)
	app.Delete("/api/v1/rups/:id", auth.RequireRole("admin"), handlers.DeleteStudyPlan)

	// Protected endpoint for testing
	app.Get("/api/v1/protected", auth.RequireRole("student"), func(c *fiber.Ctx) error {
		userID := c.Locals("user_id")
		roles := c.Locals("roles")
		groups := c.Locals("groups")
		return c.JSON(fiber.Map{
			"user_id": userID,
			"roles":   roles,
			"groups":  groups,
		})
	})

	log.Printf("Starting server on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
