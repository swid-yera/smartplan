package service

type Service struct {
	Auth     AuthService
	User     UserService
	Webhooks WebhooksService
}
