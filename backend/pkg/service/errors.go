package service

import (
	"errors"
	"regexp"
	"strings"
)

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

var apiErrorExactTranslations = map[string]string{
	"admin permissions cannot be modified":                                 "Права администратора нельзя изменять",
	"AI service is not configured":                                         "AI-сервис не настроен",
	"translation service is not configured":                                "Сервис перевода не настроен",
	"award can only be submitted for review from draft or rejected status": "Награду можно отправить на проверку только из статуса черновика или отклонённой",
	"award can only be deleted from draft or rejected status":              "Награду можно удалить только из статуса черновика или отклонённой",
	"award type not found":                                                 "Тип награды не найден",
	"category is used by awards":                                           "Категория используется наградами",
	"category not found":                                                   "Категория не найдена",
	"data field is required":                                               "Поле data обязательно",
	"department not found":                                                 "Отделение не найдено",
	"Failed to process event":                                              "Не удалось обработать событие",
	"Failed to generate disciplines":                                       "Не удалось сгенерировать дисциплины",
	"Failed to generate resources":                                         "Не удалось сгенерировать ресурсы",
	"Failed to generate lesson":                                            "Не удалось сгенерировать занятие",
	"Failed to generate topics for discipline":                             "Не удалось сгенерировать темы для дисциплины",
	"failed to parse form":                                                 "Не удалось разобрать форму",
	"failed to resolve current award":                                      "Не удалось определить текущую награду",
	"failed to create award":                                               "Не удалось создать награду",
	"field key is required":                                                "Ключ поля обязателен",
	"field label is required":                                              "Название поля обязательно",
	"forbidden":                                                            "Доступ запрещён",
	"invalid award ID":                                                     "Некорректный ID награды",
	"invalid award type ID":                                                "Некорректный ID типа награды",
	"invalid AwardType ID":                                                 "Некорректный ID типа награды",
	"invalid category ID":                                                  "Некорректный ID категории",
	"invalid department id":                                                "Некорректный ID отделения",
	"invalid id":                                                           "Некорректный ID",
	"invalid JSON format inside data field":                                "Некорректный формат JSON в поле data",
	"invalid payload":                                                      "Некорректный payload",
	"invalid request body":                                                 "Некорректное тело запроса",
	"invalid signature":                                                    "Неверная подпись",
	"invalid source language":                                              "Некорректный исходный язык",
	"invalid teacher_id":                                                   "Некорректный teacher_id",
	"invalid penalty_id":                                                   "Некорректный penalty_id",
	"invalid user_id":                                                      "Некорректный user_id",
	"invalid violation_id":                                                 "Некорректный violation_id",
	"invalid blockedAfterDate":                                             "Некорректная дата ограничения KPI",
	"invalid exceptionUserIds":                                             "Некорректный список исключений KPI",
	"Invalid JSON payload":                                                 "Некорректный JSON payload",
	"Invalid user context":                                                 "Некорректный контекст пользователя",
	"keycloak login service account":                                       "Ошибка входа сервисного аккаунта Keycloak",
	"kripto authorization failed":                                          "Ошибка авторизации Kripto",
	"kripto client is not configured":                                      "Kripto-клиент не настроен",
	"kripto request failed":                                                "Ошибка запроса Kripto",
	"kripto temporary error":                                               "Временная ошибка Kripto",
	"failed to get RUP signature artifact":                                 "Не удалось получить артефакт подписи RUP",
	"signature artifact not found":                                         "Артефакт подписи не найден",
	"signature is required for approved status":                            "Для статуса APPROVED требуется подпись",
	"language generation is already in progress":                           "Генерация языка уже выполняется",
	"missing bearer token":                                                 "Отсутствует Bearer-токен",
	"methodist not found":                                                  "Методист не найден",
	"no session":                                                           "Сессия не найдена",
	"note is required":                                                     "Комментарий обязателен",
	"points must be greater than 0":                                        "Баллы должны быть больше 0",
	"regeneration is allowed only for draft RUP":                           "Повторная генерация доступна только для черновика РУП",
	"Session expired":                                                      "Сессия истекла",
	"session expired or invalid":                                           "Сессия истекла или недействительна",
	"Session not found":                                                    "Сессия не найдена",
	"sort must be 'asc' or 'desc'":                                         "Сортировка должна быть 'asc' или 'desc'",
	"teacher not found":                                                    "Преподаватель не найден",
	"teachers can only submit awards for review":                           "Можно только отправить награду на проверку",
	"kpi uploads are disabled after configured date":                       "Загрузка KPI после установленной даты запрещена",
	"kpi exception user not found":                                         "Один из пользователей в исключениях не найден",
	"token inactive":                                                       "Токен неактивен",
	"token introspect failed":                                              "Не удалось проверить токен",
	"User not authenticated":                                               "Пользователь не аутентифицирован",
	"user not found":                                                       "Пользователь не найден",
	"violation not found":                                                  "Нарушение не найдено",
	"issuer not found":                                                     "Отправитель не найден",
	"auth handler not configured":                                          "Обработчик аутентификации не настроен",
	"no content in sse response":                                           "В SSE-ответе нет содержимого",
	"empty translation response":                                           "Пустой ответ перевода",
	"sourceLanguage and targetLanguage are required":                       "Исходный и целевой языки обязательны",
	"teacher group id is not configured":                                   "ID группы преподавателей не настроен",
	"teacher departments tree is empty":                                    "Дерево отделений преподавателей пустое",
	"Students group not found in keycloak":                                 "Группа студентов не найдена в Keycloak",
	"invalid event":                                                        "Некорректное событие",
	"unsupported event type":                                               "Неподдерживаемый тип события",
	"event already handled":                                                "Событие уже обработано",
	"validation failed":                                                    "Проверка данных не пройдена",
	"group not found":                                                      "Группа не найдена",
	"rup has no groups":                                                    "У РУП нет групп",
	"rup document not found for id":                                        "Документ РУП не найден",
	"user not found in context":                                            "Пользователь не найден в контексте",
	"invalid departmentId":                                                 "Некорректный departmentId",
	"invalid access token":                                                 "Некорректный access token",
	"Access token validation failed":                                       "Проверка access token не пройдена",
	"Invalid token issuer":                                                 "Некорректный issuer токена",
	"Invalid authorized party (azp)":                                       "Некорректный authorized party (azp) токена",
	"Invalid subject in access token":                                      "Некорректный subject в access token",
}

var apiErrorRegexTranslations = []struct {
	re   *regexp.Regexp
	repl string
}{
	{regexp.MustCompile(`^invalid (.+) ID$`), "Некорректный ID $1"},
	{regexp.MustCompile(`^invalid (.+)_id$`), "Некорректный $1"},
	{regexp.MustCompile(`^invalid (.+) UUID format$`), "Некорректный формат UUID: $1"},
	{regexp.MustCompile(`^invalid status: (.+)$`), "Некорректный статус: $1"},
	{regexp.MustCompile(`^field (.+) must be a string$`), "Поле $1 должно быть строкой"},
	{regexp.MustCompile(`^field (.+) must not be empty$`), "Поле $1 не должно быть пустым"},
	{regexp.MustCompile(`^field (.+) must be a number$`), "Поле $1 должно быть числом"},
	{regexp.MustCompile(`^field (.+) must be a valid URL$`), "Поле $1 должно быть корректным URL"},
	{regexp.MustCompile(`^field (.+) must contain URL strings$`), "Поле $1 должно содержать строки URL"},
	{regexp.MustCompile(`^field (.+) must be a string or array of strings$`), "Поле $1 должно быть строкой или массивом строк"},
	{regexp.MustCompile(`^field (.+) must contain ([^ ]+) strings$`), "Поле $1 должно содержать строки $2"},
	{regexp.MustCompile(`^required field is missing: (.+)$`), "Обязательное поле отсутствует: $1"},
	{regexp.MustCompile(`^required field is empty: (.+)$`), "Обязательное поле пустое: $1"},
	{regexp.MustCompile(`^duplicate field key: (.+)$`), "Дублирующийся ключ поля: $1"},
	{regexp.MustCompile(`^duplicate multi_fields subfield key: (.+)$`), "Дублирующийся ключ подполя multi_fields: $1"},
	{regexp.MustCompile(`^unknown fieldValues key: (.+)$`), "Неизвестный ключ fieldValues: $1"},
	{regexp.MustCompile(`^unknown multi_fields key (.+) in (.+)\[(.+)\]$`), "Неизвестный ключ multi_fields $1 в $2[$3]"},
	{regexp.MustCompile(`^unsupported field type: (.+)$`), "Неподдерживаемый тип поля: $1"},
	{regexp.MustCompile(`^unsupported multi_fields subfield type: (.+)$`), "Неподдерживаемый тип подполя multi_fields: $1"},
	{regexp.MustCompile(`^unsupported multi_fields subfield type for (.+)$`), "Неподдерживаемый тип подполя multi_fields для $1"},
	{regexp.MustCompile(`^field (.+) must be an array of objects$`), "Поле $1 должно быть массивом объектов"},
	{regexp.MustCompile(`^field (.+) must contain (\d+) strings$`), "Поле $1 должно содержать $2 строк"},
	{regexp.MustCompile(`^field (.+) must be a valid URL$`), "Поле $1 должно быть корректным URL"},
	{regexp.MustCompile(`^field (.+) must contain URL strings$`), "Поле $1 должно содержать URL-строки"},
	{regexp.MustCompile(`^field (.+) must be a string or array of strings$`), "Поле $1 должно быть строкой или массивом строк"},
	{regexp.MustCompile(`^([A-Za-z0-9_]+) is required$`), "Поле $1 обязательно"},
	{regexp.MustCompile(`^([A-Za-z0-9_]+) is not attached to (.+)$`), "$1 не привязан к $2"},
	{regexp.MustCompile(`^(.+) does not exist$`), "$1 не существует"},
	{regexp.MustCompile(`^(.+) not found$`), "$1 не найден"},
	{regexp.MustCompile(`^(.+) not found in keycloak$`), "$1 не найден в Keycloak"},
	{regexp.MustCompile(`^(.+) is nil$`), "$1 не задан"},
	{regexp.MustCompile(`^(.+) has no groups$`), "У $1 нет групп"},
	{regexp.MustCompile(`^invalid (.+)$`), "Некорректный $1"},
}

// TranslateAPIErrorMessage converts backend user-facing error messages to Russian.
// It is intended for API responses only; logs should keep the original English text.
func TranslateAPIErrorMessage(message string) string {
	trimmed := strings.TrimSpace(message)
	if trimmed == "" {
		return "Внутренняя ошибка сервера"
	}

	if translated, ok := apiErrorExactTranslations[trimmed]; ok {
		return translated
	}

	for _, item := range apiErrorRegexTranslations {
		if item.re.MatchString(trimmed) {
			return item.re.ReplaceAllString(trimmed, item.repl)
		}
	}

	if idx := strings.Index(trimmed, ": "); idx > 0 {
		prefix := trimmed[:idx]
		suffix := strings.TrimSpace(trimmed[idx+2:])

		switch prefix {
		case "validation failed", "create award", "update award", "create lesson", "update lesson", "get lesson", "create rup", "update rup", "get rup", "create category", "update category", "get category", "create penalty", "update violation", "create violation", "create discipline", "update discipline", "create topic", "update topic", "create group", "update group":
			if suffix != "" {
				return TranslateAPIErrorMessage(suffix)
			}
		}
	}

	return "Внутренняя ошибка сервера"
}
