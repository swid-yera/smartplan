package service

import "errors"

var (
	ErrInvalidEvent   = errors.New("invalid event")
	ErrUnsupported    = errors.New("unsupported event type")
	ErrAlreadyHandled = errors.New("event already handled")
)

type HTTPStatusError struct {
	StatusCode int
	Message    string
}

func (e *HTTPStatusError) Error() string {
	if e == nil {
		return "http status error"
	}
	return e.Message
}
