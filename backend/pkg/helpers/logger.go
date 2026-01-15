package helpers

import (
	"io"
	"os"

	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

func NewLogger() *logrus.Logger {
	// ✅ гарантируем наличие директории
	if err := os.MkdirAll("logs", 0755); err != nil {
		panic("cannot create logs directory: " + err.Error())
	}

	log := logrus.New()

	fileLogger := &lumberjack.Logger{
		Filename:   "logs/app.log",
		MaxSize:    50,
		MaxBackups: 10,
		MaxAge:     14,
		Compress:   true,
	}

	log.SetOutput(io.MultiWriter(os.Stdout, fileLogger))
	log.SetLevel(logrus.InfoLevel)

	if os.Getenv("GIN_MODE") == "release" {
		log.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
		})
	} else {
		log.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05",
			ForceColors:     true,
		})
	}

	return log
}
