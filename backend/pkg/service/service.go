package service

type Service struct {
	Auth     AuthService
	User     UserService
	Webhooks WebhooksService
	Rup      RupService
	Award    AwardService
	Lesson   LessonService
}
