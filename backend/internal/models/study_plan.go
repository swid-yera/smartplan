package models

import (
	"time"
)

type StudyPlan struct {
	ID                      uint                      `gorm:"primaryKey" json:"id"`
	OpID                    *uint                     `json:"op_id"`
	Code                    *string                   `json:"code"`
	StudyYear               *string                   `json:"study_year"`
	Semesters               []int                     `gorm:"type:integer[]" json:"semesters"`
	WeeksCountBySemester    []int                     `gorm:"type:integer[]" json:"weeks_count_by_semester"`
	StudyDaysByWeek         int                       `json:"study_days_by_week"`
	TotalHours              int                       `json:"total_hours"`
	CreatorKcID             *string                   `json:"creator_kc_id"`
	Status                  string                    `json:"status"`
	Metadata                map[string]interface{}   `gorm:"type:jsonb" json:"metadata"`
	CreatedAt               time.Time                 `json:"created_at"`
	UpdatedAt               time.Time                 `json:"updated_at"`
	TotalHoursActual        *int                      `json:"total_hours_actual"`
}
