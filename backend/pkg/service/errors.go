package service

import "errors"

var (
	ErrInvalidEvent   = errors.New("invalid event")
	ErrUnsupported    = errors.New("unsupported event type")
	ErrAlreadyHandled = errors.New("event already handled")
)
