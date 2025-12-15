package models

import (
	"encoding/json"
	"time"
)

type Object struct {
	ID                 string      `json:"id"`
	Title              interface{} `json:"title,omitempty"`
	Year               interface{} `json:"year,omitempty"`
	Type               interface{} `json:"type,omitempty"`
	Course             interface{} `json:"course,omitempty"`
	StudyForm          interface{} `json:"studyForm,omitempty"`
	ExplorationNote    interface{} `json:"explorationNote,omitempty"`
	Goals              interface{} `json:"goals,omitempty"`
	Prerequisites      interface{} `json:"prerequisites,omitempty"`
	Postrequisites     interface{} `json:"postrequisites,omitempty"`
	GroupID            interface{} `json:"groupId,omitempty"`
	Contacts           interface{} `json:"contacts,omitempty"`
	InternetResources  interface{} `json:"internetResources,omitempty"`
	TechnicalResources interface{} `json:"technicalResources,omitempty"`
	RupType            interface{} `json:"rupType,omitempty"`
	Disciplines        interface{} `json:"disciplines,omitempty"`
	CreatedAt          time.Time   `json:"created_at"`
	UpdatedAt          time.Time   `json:"updated_at"`
}

type CreateObjectDTO struct {
	Data json.RawMessage `json:"data"`
}

type InnerCreateObjectDTO struct {
	Title              json.RawMessage `json:"title"`
	Year               json.RawMessage `json:"year"`
	Type               json.RawMessage `json:"type"`
	Course             json.RawMessage `json:"course"`
	StudyForm          json.RawMessage `json:"studyForm"`
	ExplorationNote    json.RawMessage `json:"explorationNote"`
	Goals              json.RawMessage `json:"goals"`
	Prerequisites      json.RawMessage `json:"prerequisites"`
	Postrequisites     json.RawMessage `json:"postrequisites"`
	GroupID            json.RawMessage `json:"groupId"`
	Contacts           json.RawMessage `json:"contacts"`
	InternetResources  json.RawMessage `json:"internetResources"`
	TechnicalResources json.RawMessage `json:"technicalResources"`
	RupType            json.RawMessage `json:"rupType"`
	Disciplines        json.RawMessage `json:"disciplines"`
}

type UpdateObjectDTO struct {
	Data json.RawMessage `json:"data"`
	ID   json.RawMessage `json:"id"`
}

type InnerUpdateObjectDTO struct {
	ID                 json.RawMessage `json:"id"`
	Title              json.RawMessage `json:"title"`
	Year               json.RawMessage `json:"year"`
	Type               json.RawMessage `json:"type"`
	Course             json.RawMessage `json:"course"`
	StudyForm          json.RawMessage `json:"studyForm"`
	ExplorationNote    json.RawMessage `json:"explorationNote"`
	Goals              json.RawMessage `json:"goals"`
	Prerequisites      json.RawMessage `json:"prerequisites"`
	Postrequisites     json.RawMessage `json:"postrequisites"`
	GroupID            json.RawMessage `json:"groupId"`
	Contacts           json.RawMessage `json:"contacts"`
	InternetResources  json.RawMessage `json:"internetResources"`
	TechnicalResources json.RawMessage `json:"technicalResources"`
	RupType            json.RawMessage `json:"rupType"`
	Disciplines        json.RawMessage `json:"disciplines"`
}

type GetObjectDTO struct {
	ID string `json:"id"`
}

type DeleteObjectDTO struct {
	ID string `json:"id"`
}
