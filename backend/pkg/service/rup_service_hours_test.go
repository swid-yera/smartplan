package service

import "testing"

func TestCalculateDisciplineTotalHoursUsesSemesterHoursOnly(t *testing.T) {
	discipline := &DisciplineRequest{
		Semesters: []*SemesterRequest{
			{Semester: 1, TotalHours: 96},
			{Semester: 2, TotalHours: 24},
			{Semester: 3, TotalHours: 0},
			{Semester: 4, TotalHours: 0},
			{Semester: 5, TotalHours: 0},
			{Semester: 6, TotalHours: 0},
			{Semester: 7, TotalHours: 0},
			{Semester: 8, TotalHours: 0},
		},
		Topics: []*TopicRequest{
			{SrspHours: 24},
			{SrspHours: 24},
		},
	}

	got := calculateDisciplineTotalHours(discipline)
	const want int32 = 120

	if got != want {
		t.Fatalf("calculateDisciplineTotalHours() = %d, want %d", got, want)
	}
}

func TestCalculateRupTotalHoursUsesSemesterHoursOnly(t *testing.T) {
	disciplines := []*DisciplineRequest{
		{
			Semesters: []*SemesterRequest{
				{Semester: 1, TotalHours: 0},
				{Semester: 2, TotalHours: 0},
				{Semester: 3, TotalHours: 0},
				{Semester: 4, TotalHours: 120},
				{Semester: 5, TotalHours: 0},
				{Semester: 6, TotalHours: 0},
				{Semester: 7, TotalHours: 0},
				{Semester: 8, TotalHours: 0},
			},
			Topics: []*TopicRequest{
				{SrspHours: 24},
			},
		},
		{
			Semesters: []*SemesterRequest{
				{Semester: 1, TotalHours: 0},
				{Semester: 2, TotalHours: 0},
				{Semester: 3, TotalHours: 0},
				{Semester: 4, TotalHours: 144},
				{Semester: 5, TotalHours: 0},
				{Semester: 6, TotalHours: 0},
				{Semester: 7, TotalHours: 0},
				{Semester: 8, TotalHours: 0},
			},
			Topics: []*TopicRequest{
				{SrspHours: 24},
			},
		},
	}

	got := calculateRupTotalHours(disciplines)
	const want int32 = 264

	if got != want {
		t.Fatalf("calculateRupTotalHours() = %d, want %d", got, want)
	}
}
