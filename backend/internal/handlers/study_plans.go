package handlers

import (
	"eduplan/internal/db"
	"eduplan/internal/models"

	"github.com/gofiber/fiber/v2"
)

func GetStudyPlans(c *fiber.Ctx) error {
	var plans []models.StudyPlan
	if err := db.DB.Find(&plans).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(plans)
}

func GetStudyPlan(c *fiber.Ctx) error {
	id := c.Params("id")
	var plan models.StudyPlan
	if err := db.DB.First(&plan, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "not found"})
	}
	return c.JSON(plan)
}

func CreateStudyPlan(c *fiber.Ctx) error {
	var plan models.StudyPlan
	if err := c.BodyParser(&plan); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := db.DB.Create(&plan).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(plan)
}

func UpdateStudyPlan(c *fiber.Ctx) error {
	id := c.Params("id")
	var plan models.StudyPlan
	if err := db.DB.First(&plan, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "not found"})
	}
	if err := c.BodyParser(&plan); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := db.DB.Save(&plan).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(plan)
}

func DeleteStudyPlan(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := db.DB.Delete(&models.StudyPlan{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
