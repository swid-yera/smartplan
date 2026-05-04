package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"eduplan/backend/config"

	"github.com/sirupsen/logrus"
)

type AIService interface {
	GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error)
	GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error)
	GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]GeneratedDiscipline, error)
	GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]GeneratedTopic, error)
	GenerateLesson(ctx context.Context, req GenerateLessonRequest) (*GenerateLessonResponse, error)
}

type aiService struct {
	httpClient *http.Client
	cfg        *config.GeminiConfig
	log        *logrus.Logger
}

func NewAIService(httpClient *http.Client, cfg *config.GeminiConfig, log *logrus.Logger) AIService {
	return &aiService{
		httpClient: httpClient,
		cfg:        cfg,
		log:        log,
	}
}

type GenerateRupMetaRequest struct {
	Name           string           `json:"name"`
	Type           string           `json:"type"`
	StudyForm      string           `json:"studyForm"`
	StudyYear      string           `json:"studyYear"`
	Course         int              `json:"course"`
	Group          GenerateRupGroup `json:"group"`
	Prerequisites  string           `json:"prerequisites"`
	Postrequisites string           `json:"postrequisites"`
	Message        string           `json:"message"`
}

type GenerateRupGroup struct {
	Name          string `json:"name"`
	Specialty     string `json:"specialty"`
	Qualification string `json:"qualification"`
}

type GenerateRupMetaResponse struct {
	Basis        string `json:"basis"`
	Goals        string `json:"goals"`
	Competencies string `json:"competencies"`
}

type GenerateResourcesRequest struct {
	Name           string `json:"name"`
	Prerequisites  string `json:"prerequisites"`
	Postrequisites string `json:"postrequisites"`
	Basic          string `json:"basic"`
	Goals          string `json:"goals"`
	Competencies   string `json:"competencies"`
	Message        string `json:"message"`
}

type GenerateResourcesResponse struct {
	InternetResources  []GeneratedResource `json:"internetResources"`
	TechnicalResources []GeneratedResource `json:"technicalResources"`
}

type GeneratedResource struct {
	Name string `json:"name"`
	Link string `json:"link,omitempty"`
}

type GenerateDisciplinesRequest struct {
	Name            string `json:"name"`
	Course          int    `json:"course"`
	Goals           string `json:"goals"`
	Competencies    string `json:"competencies"`
	WantsHours      int    `json:"wantsHours"`
	DisciplineCount int    `json:"disciplineCount"`
	Message         string `json:"message"`
}

type GenerateTopicsForDisciplineRequest struct {
	RupName         string `json:"rupName"`
	RupType         string `json:"rupType"`
	Goals           string `json:"goals"`
	Competencies    string `json:"competencies"`
	DisciplineName  string `json:"disciplineName"`
	DisciplineHours int    `json:"disciplineHours"`
	Message         string `json:"message"`
}

type GeneratedDiscipline struct {
	Name      string              `json:"name"`
	Semesters []GeneratedSemester `json:"semesters"`
	Topics    []GeneratedTopic    `json:"topics"`
}

type GeneratedSemester struct {
	Semester   int `json:"semester"`
	TotalHours int `json:"totalHours"`
}

type GeneratedTopic struct {
	Name            string `json:"name"`
	Type            string `json:"type"`
	TheoryHours     int    `json:"theoryHours"`
	PracticeHours   int    `json:"practiceHours"`
	IndividualHours int    `json:"individualHours"`
	SrspHours       int    `json:"srspHours"`
	SrsHours        int    `json:"srsHours"`
}

type GenerateLessonRequest struct {
	RupName            string   `json:"rupName"`
	DisciplineName     string   `json:"disciplineName"`
	TopicName          string   `json:"topicName"`
	TopicType          string   `json:"topicType"`
	TotalHours         int32    `json:"totalHours"`
	TheoryHours        int32    `json:"theoryHours"`
	PracticeHours      int32    `json:"practiceHours"`
	IndividualHours    int32    `json:"individualHours"`
	SrspHours          int32    `json:"srspHours"`
	SrsHours           int32    `json:"srsHours"`
	GroupName          string   `json:"groupName"`
	GroupSpecialty     string   `json:"groupSpecialty"`
	GroupQualification string   `json:"groupQualification"`
	ExplorationGoals   string   `json:"explorationGoals"`
	ExplorationSummary string   `json:"explorationSummary"`
	Prerequisites      string   `json:"prerequisites"`
	Postrequisites     string   `json:"postrequisites"`
	InternetResources  []string `json:"internetResources"`
	TechnicalResources []string `json:"technicalResources"`
	PreviousLessons    []string `json:"previousLessons"`
	Message            string   `json:"message"`
}

type GenerateLessonResponse struct {
	Type           string                        `json:"type"`
	Goals          string                        `json:"goals"`
	Tasks          string                        `json:"tasks"`
	Expected       string                        `json:"expected"`
	LessonProgress []GeneratedLessonProgressStep `json:"lessonProgress"`
}

type GeneratedLessonProgressStep struct {
	Name        string   `json:"name"`
	StartMinute int32    `json:"startMinute"`
	EndMinute   int32    `json:"endMinute"`
	Content     []string `json:"content"`
}

type geminiGenerateContentRequest struct {
	Contents         []geminiContent `json:"contents"`
	GenerationConfig struct {
		ResponseMimeType string `json:"responseMimeType"`
	} `json:"generationConfig"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerateContentResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type geminiErrorResponse struct {
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error"`
}

type geminiRequestError struct {
	StatusCode int
	Message    string
	Status     string
}

func (e *geminiRequestError) Error() string {
	if e.Message == "" {
		return fmt.Sprintf("gemini request failed with status %d", e.StatusCode)
	}
	return fmt.Sprintf("gemini request failed with status %d: %s", e.StatusCode, e.Message)
}

func (e *geminiRequestError) IsRateLimit() bool {
	if e.StatusCode == http.StatusTooManyRequests {
		return true
	}
	if strings.EqualFold(e.Status, "RESOURCE_EXHAUSTED") {
		return true
	}
	return strings.Contains(e.Message, "429")
}

func (s *aiService) GenerateRupMeta(ctx context.Context, req GenerateRupMetaRequest) (*GenerateRupMetaResponse, error) {
	prompt := fmt.Sprintf(`
Ты — методист и эксперт по разработке рабочих учебных программ (РУП)
для организаций технического и профессионального образования
Республики Казахстан.

Ты хорошо знаком с:
- Приказом Министра просвещения РК №348 от 03.08.2022
- изменениями от 15.04.2025
- профессиональными стандартами НПП «Атамекен»
- стандартами WorldSkills
- практикой оформления РУП и ПМ в колледжах РК

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "%s"
- Тип обучения: "%s" (THEORY — теоретическое, PRACTICE — практическое)
- Форма обучения: "%s"
- Пререквизиты: "%s"
- Постреквизиты: "%s"
- Учебный год: "%s"
- Учебная группа: %s
- Специальность группы: %s
- Квалификация группы: %s
- Курс: %d
- Дополнительный комментарий преподавателя: "%s"

ТВОЯ ЗАДАЧА:
Сгенерировать СТРОГО JSON-ОБЪЕКТ без markdown, без комментариев, без пояснений, и по комментарию от преподователя.

ЗАПРЕЩЕНО:
- использовать массивы для "basis", "goals", "competencies"
- использовать списки, маркеры, нумерацию
- сокращать официальные формулировки
- добавлять вымышленные нормативные документы

ОБЯЗАТЕЛЬНО:
- стиль официально-деловой, методический
- язык ответа: РУССКИЙ
- текст должен быть пригоден для прямой вставки в РУП
- ответ должен соответствовать тому, что преподаватель хочет по его комментарию

СТРОГИЙ ФОРМАТ ОТВЕТА:

{
  "basis": string,
  "goals": string,
  "competencies": string,
}

--------------------
ТРЕБОВАНИЯ К ПОЛЯМ
--------------------

1. "basis":
Один развернутый абзац официального текста.
Текст ДОЛЖЕН БЫТЬ СТИЛИСТИЧЕСКИ ПОХОЖ на следующий пример:

«Рабочая учебная программа по профессиональному модулю разработана на основе
Приказа Министра просвещения Республики Казахстан от 3 августа 2022 года №348
учитывая внесенные изменения от 15.04.2025 года, профессиональных стандартов
„Сетевые, системные администраторы и администраторы серверов“
(дополнение №5 к приказу НПП „Атамекен“ №222 от 05.12.2022),
стандартов WorldSkills „Сетевое и системное администрирование“
для специальности „06120100 Вычислительная техника и информационные сети“
и квалификации „Техник сетевого и системного администрирования“».

Обязательно упомянуть:
- Приказ №348
- изменения от 15.04.2025
- НПП «Атамекен»
- WorldSkills
- специальность и квалификацию

2. "goals":
ОДИН связный текст.
Начинать строго с фразы:
«Целью освоения профессионального модуля является …»

Текст должен быть ПОХОЖ по структуре, стилю и объему на данный пример:
описание целей, затем перечисление знаний и навыков в рамках одного или двух предложений.

Обязательно отразить:
- обслуживание и администрирование ЛВС
- обеспечение информационной безопасности
- анализ угроз и уязвимостей
- настройку и конфигурацию средств защиты
- управление безопасностью сетевых устройств и ПО

3. "competencies":
ОДНА строка.
Начинать строго с:
«Формируемые компетенции:»

Далее — связный текст через точку с запятой.
Без кодов (ПК, ОК).

Обязательно указать:
- владение методами и средствами обеспечения безопасности ЛВС
- работу с подключенными ресурсами
- соблюдение охраны труда и техники безопасности
- установку, настройку и управление операционными системами и ПО

--------------------
ФИНАЛЬНОЕ ТРЕБОВАНИЕ
--------------------
Верни ТОЛЬКО валидный JSON, полностью соответствующий структуре.
`,
		escapePromptValue(req.Name),
		escapePromptValue(req.Type),
		escapePromptValue(req.StudyForm),
		escapePromptValue(req.Prerequisites),
		escapePromptValue(req.Postrequisites),
		escapePromptValue(req.StudyYear),
		escapePromptValue(req.Group.Name),
		escapePromptValue(req.Group.Specialty),
		escapePromptValue(req.Group.Qualification),
		req.Course,
		escapePromptValue(req.Message),
	)

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate rup meta: %w", err)
	}

	var out GenerateRupMetaResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode rup meta response: %w", err)
	}

	return &out, nil
}

func (s *aiService) GenerateResources(ctx context.Context, req GenerateResourcesRequest) (*GenerateResourcesResponse, error) {
	prompt := fmt.Sprintf(`
Ты — эксперт по разработке учебных программ и образовательных ресурсов для колледжей и техникумов Республики Казахстан.
Нужно сгенерировать учебные и технические ресурсы для курса, соответствующие профессиональному модулю.

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "%s"
- Пререквизиты: "%s"
- Постреквизиты: "%s"
- Пояснительная записка: "%s"
- Цели освоения профессионального модуля: "%s"
- Формируемые компетенции: "%s"
- Дополнительный комментарий преподавателя: "%s"

1. Формат результата:
Ты возвращаешь строго JSON, который соответствует интерфейсу:

{
  "internetResources": {
    "name": string,
    "link"?: string
  }[],
  "technicalResources": {
    "name": string,
    "link"?: string
  }[]
}

Запрещено:
- использовать title/url
- добавлять лишние поля
- использовать markdown или комментарии
- генерировать пустые или вымышленные ссылки (link опционально)

Требования к содержимому:
- internetResources: учебные материалы, книги, электронные комплексы, стандарты, пособия, статьи по теме курса. Можно без ссылок, но текст должен быть информативным и конкретным.
- technicalResources: оборудование, программное обеспечение, операционные системы, инструменты, лабораторные стенды, цифровые ресурсы, комплексы тестов — всё, что нужно для практической части курса.

- Каждое поле name должно быть связным текстом, максимально информативным, без списков или маркеров внутри.
- Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по основным требованиям выше.

Пример желаемого формата:

{
  "internetResources": [
    { "name": "Электронный учебно-методический комплекс «Введение в сетевые технологии» курса CCNA сетевой академии Cisco", "link": "https://www.csu.ru/resources/ccna-network-intro.pdf" },
    { "name": "Б. В. Левин, А. В. Левина, А. А. Кириллов. «Информационная безопасность сети». Подробное объяснение принципов, технологий и методов защиты сетей", "link": "" }
  ],
  "technicalResources": [
    { "name": "Программное обеспечение: Open Source инструменты; документация по использованию Snort, Wireshark для анализа сетевого трафика и обнаружения угроз", "link": "https://habr.com/ru/companies/selectel/articles/744478/" },
    { "name": "Операционные системы: Windows, Linux, macOS", "link": "" }
  ]
}

Сгенерируй JSON с 5–7 ресурсами для internetResources и 4–6 для technicalResources, релевантными к курсу "%s".
`,
		escapePromptValue(req.Name),
		escapePromptValue(req.Prerequisites),
		escapePromptValue(req.Postrequisites),
		escapePromptValue(req.Basic),
		escapePromptValue(req.Goals),
		escapePromptValue(req.Competencies),
		escapePromptValue(req.Message),
		escapePromptValue(req.Name),
	)

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate resources: %w", err)
	}

	var out GenerateResourcesResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode resources response: %w", err)
	}

	return &out, nil
}

func (s *aiService) GenerateDisciplines(ctx context.Context, req GenerateDisciplinesRequest) ([]GeneratedDiscipline, error) {
	prompt := fmt.Sprintf(`
Ты — методист по разработке учебных программ для колледжей и техникумов РК.

Задача: распределить %d часов по %d дисциплинам
для %d-го курса модуля "%s".

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "%s"
- Цели освоения профессионального модуля: "%s"
- Формируемые компетенции: "%s"
- Дополнительный комментарий преподавателя: "%s"

Особые правила:

1. JSON-формат строго:

{
  "disciplines": [
    {
      "name": string,
      "code": string,  // уникальный код РО(Название, а именно номер).1, Например: РО6.1. РО6.2…
      "semesters": [number, number, number, number, number, number, number, number]
    }
  ]
}

2. semesters:
- массив из 8 чисел, по одному на каждый семестр
- для семестров курса (см. ниже) распределяем часы
  • курс 1 → семестры 1 и 2
  • курс 2 → семестры 3 и 4
  • курс 3 → семестры 5 и 6
  • курс 4 → семестры 7 и 8
- семестры вне курса = 0
- сумма чисел в семестрах курса = общему количеству часов дисциплины
- **последовательность дисциплин:** первая дисциплина начинает курс с самого начала семестра, следующая дисциплина начинается с того места, где закончилась предыдущая
- часы можно распределять равномерно между двумя семестрами курса, но последовательность должна сохраняться

3. Дисциплины:
- количество = %d
- name: связное информативное название дисциплины
- code: уникальный код РО7.1, РО7.2 и т.д.

4. Не использовать markdown, комментарии или текст вне JSON
5. Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по правилам выше.

Пример для 3-го курса (семестры 5 и 6), 2 дисциплины, 72 часа каждая, последовательность:

{
  "disciplines": [
    {
      "name": "Основы сетевых технологий",
      "code": "РО5.1",
      "semesters": [0, 0, 0, 0, 36, 36, 0, 0]
    },
    {
      "name": "Информационная безопасность ЛВС",
      "code": "РО5.2",
      "semesters": [0, 0, 0, 0, 0, 72, 0, 0]
    }
  ]
}

Сгенерируй JSON для %d дисциплин с распределением часов **последовательно по семестрам курса %d**.
`,
		req.WantsHours,
		req.DisciplineCount,
		req.Course,
		escapePromptValue(req.Name),
		escapePromptValue(req.Name),
		escapePromptValue(req.Goals),
		escapePromptValue(req.Competencies),
		escapePromptValue(req.Message),
		req.DisciplineCount,
		req.DisciplineCount,
		req.Course,
	)

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate disciplines: %w", err)
	}

	var raw struct {
		Disciplines []struct {
			Name      string `json:"name"`
			Code      string `json:"code"`
			Semesters []int  `json:"semesters"`
		} `json:"disciplines"`
	}

	if err := decodeJSONObject(responseText, &raw); err != nil {
		return nil, fmt.Errorf("decode disciplines response: %w", err)
	}

	result := make([]GeneratedDiscipline, 0, len(raw.Disciplines))
	for _, discipline := range raw.Disciplines {
		normalized := normalizeSemesterHours(discipline.Semesters)
		semesters := make([]GeneratedSemester, 0, len(normalized))
		for i, hours := range normalized {
			semesters = append(semesters, GeneratedSemester{
				Semester:   i + 1,
				TotalHours: hours,
			})
		}

		name := strings.TrimSpace(strings.TrimSpace(discipline.Code) + " " + strings.TrimSpace(discipline.Name))
		result = append(result, GeneratedDiscipline{
			Name:      name,
			Semesters: semesters,
			Topics:    []GeneratedTopic{},
		})
	}

	return result, nil
}

func (s *aiService) GenerateTopicsForDiscipline(ctx context.Context, req GenerateTopicsForDisciplineRequest) ([]GeneratedTopic, error) {
	topicHours := 2
	if strings.EqualFold(req.RupType, "PRACTICE") {
		topicHours = 6
	}
	topicCount := req.DisciplineHours / topicHours

	prompt := fmt.Sprintf(`
Ты — методист по разработке учебных программ для колледжей и техникумов Республики Казахстан.

Сгенерируй учебный план (темы уроков) для дисциплины "%s" модуля "%s".
Общее количество часов: %d.

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "%s"
- Тип РУП: %s
- Цели освоения профессионального модуля: "%s"
- Формируемые компетенции: "%s"
- Название дисциплины: "%s"
- Дополнительный комментарий преподавателя: "%s"

ПРАВИЛА ГЕНЕРАЦИИ ТЕМ:

1. Количество и длительность тем:
- Если тип РУП = PRACTICE:
  - каждая тема = 6 часов
  - все темы = "PRACTICAL"
  - theoryHours = 0
  - practiceHours = 6
- Если тип РУП = THEORY:
  - каждая тема = 2 часа
  - темы могут быть "COMBINED" или "PRACTICAL"
  - суммарно theoryHours + practiceHours = 2

2. Названия тем (КРИТИЧЕСКИ ВАЖНО):
- Название темы ДОЛЖНО:
  - начинаться с глагола действия
  - НЕ содержать в начале слов:
    "Практическое занятие", "Практическая работа", "Теоретическое занятие", "Лекция"
- Использовать глаголы, соответствующие таксономии Блума (уровень СПО/ТиПО):

Допустимые глаголы:
- Понимание:
  "Объясняет", "Описывает", "Характеризует", "Интерпретирует"
- Применение:
  "Применяет", "Использует", "Выполняет", "Реализовывает", "Настраивает"
- Анализ:
  "Анализирует", "Сравнивает", "Классифицирует", "Определяет"
- Оценка:
  "Оценивает", "Проверяет", "Диагностирует"
- Создание:
  "Разрабатывает", "Проектирует", "Моделирует", "Составляет"

Примеры ПРАВИЛЬНЫХ названий:
- "Применяет базовые алгоритмы обработки данных"
- "Настраивает параметры программного обеспечения"
- "Анализирует результаты выполнения алгоритмов"
- "Разрабатывает простой программный модуль"

Примеры НЕПРАВИЛЬНЫХ названий:
- "Практическое занятие: применение алгоритмов"
- "Практическая работа по настройке ПО"
- "Лекция. Основы алгоритмов"

3. Структура каждой темы — строго объект:
{
  "name": string,
  "type": "COMBINED" | "PRACTICAL",
  "theoryHours": number,
  "practiceHours": number
}

4. Требования к содержанию:
- Темы должны быть логически связаны с целями (goals) и компетенциями (competencies) модуля
- Формулировки должны соответствовать официально-деловому, методическому стилю РК
- Не использовать разговорные или учебно-бытовые формулировки

5. Ограничения:
- Все часы суммируются строго в totalHours = %d
- Количество тем = %d
- Для PRACTICE все темы = "PRACTICAL"
- Для THEORY допускается mix, но каждая тема = 2 часа, темы подходящие по смыслу к практическим могут иметь тип "PRACTICAL", а остальные "COMBINED"

6. Формат ответа:
- Верни ТОЛЬКО валидный JSON
- Без комментариев, markdown, пояснений или дополнительного текста
- В конце снова перепроверяй длительность всех тем чтобы они в точности совпали с totalHours
7. Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по правилам выше.
`,
		escapePromptValue(req.DisciplineName),
		escapePromptValue(req.RupName),
		req.DisciplineHours,
		escapePromptValue(req.RupName),
		escapePromptValue(req.RupType),
		escapePromptValue(req.Goals),
		escapePromptValue(req.Competencies),
		escapePromptValue(req.DisciplineName),
		escapePromptValue(req.Message),
		req.DisciplineHours,
		topicCount,
	)

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate topics for discipline: %w", err)
	}

	var rawTopics []struct {
		Name          string `json:"name"`
		Type          string `json:"type"`
		TheoryHours   int    `json:"theoryHours"`
		PracticeHours int    `json:"practiceHours"`
	}

	if err := decodeJSONObject(responseText, &rawTopics); err != nil {
		var wrapped struct {
			Topics []struct {
				Name          string `json:"name"`
				Type          string `json:"type"`
				TheoryHours   int    `json:"theoryHours"`
				PracticeHours int    `json:"practiceHours"`
			} `json:"topics"`
		}
		if wrappedErr := decodeJSONObject(responseText, &wrapped); wrappedErr != nil {
			return nil, fmt.Errorf("decode topics response: %w", err)
		}
		rawTopics = wrapped.Topics
	}

	result := make([]GeneratedTopic, 0, len(rawTopics))
	for _, topic := range rawTopics {
		result = append(result, GeneratedTopic{
			Name:            topic.Name,
			Type:            strings.ToUpper(strings.TrimSpace(topic.Type)),
			TheoryHours:     topic.TheoryHours,
			PracticeHours:   topic.PracticeHours,
			IndividualHours: 0,
			SrspHours:       0,
			SrsHours:        0,
		})
	}

	return result, nil
}

func (s *aiService) GenerateLesson(ctx context.Context, req GenerateLessonRequest) (*GenerateLessonResponse, error) {
	internetResourcesJSON, err := json.Marshal(req.InternetResources)
	if err != nil {
		return nil, fmt.Errorf("marshal internet resources: %w", err)
	}
	technicalResourcesJSON, err := json.Marshal(req.TechnicalResources)
	if err != nil {
		return nil, fmt.Errorf("marshal technical resources: %w", err)
	}
	previousLessonsJSON, err := json.Marshal(req.PreviousLessons)
	if err != nil {
		return nil, fmt.Errorf("marshal previous lessons: %w", err)
	}

	lessonMinutes := req.TotalHours * 45
	if lessonMinutes <= 0 {
		lessonMinutes = 90
	}

	prompt := fmt.Sprintf(`
Ты — методист колледжа Республики Казахстан. Подготовь поурочный план по теме дисциплины.

КОНТЕКСТ:
- Название РУП: "%s"
- Дисциплина: "%s"
- Тема: "%s"
- Тип темы: "%s" (SNZ / PRACTICAL / COMBINED)
- Часы темы: total=%d, theory=%d, practice=%d, individual=%d, srsp=%d, srs=%d
- Группа: "%s"
- Специальность: "%s"
- Квалификация: "%s"
- Цели РУП: "%s"
- Краткое содержание (summary): "%s"
- Пререквизиты: "%s"
- Постреквизиты: "%s"
- Интернет-ресурсы: %s
- Тех.ресурсы: %s
- 3 предыдущих темы уроков: %s
- Дополнительный комментарий преподавателя: "%s"

ТРЕБОВАНИЯ:
1) Верни СТРОГО один JSON-объект без markdown и комментариев.
2) Поле "type" только "PRACTICE" или "THEORY".
3) "goals", "tasks", "expected" — связный методический текст на русском языке.
4) "lessonProgress" — массив этапов занятия.
5) Каждый этап должен содержать:
   - name: название этапа
   - startMinute: начало этапа в минутах от начала занятия
   - endMinute: конец этапа в минутах от начала занятия
   - content: массив конкретных действий преподавателя и обучающихся
6) Для "PRACTICE" endMinute обязателен и должен быть > startMinute (0 использовать нельзя).
7) Для "PRACTICE" этапы должны идти непрерывно по времени:
   - у первого этапа startMinute = 0
   - у каждого следующего этапа startMinute равен endMinute предыдущего этапа
   - endMinute последнего этапа должен быть близок к %d минутам
8) Для "THEORY" допускается endMinute = 0, если этап без отдельного конечного интервала.
9) Формулировки должны соответствовать теме, не повторять дословно предыдущие уроки.
10) Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по требованиям выше.

ФОРМАТ ОТВЕТА:
{
  "type": "PRACTICE" | "THEORY",
  "goals": string,
  "tasks": string,
  "expected": string,
  "lessonProgress": [
    {
      "name": string,
      "startMinute": number,
      "endMinute": number,
      "content": [string]
    }
  ]
}
`,
		escapePromptValue(req.RupName),
		escapePromptValue(req.DisciplineName),
		escapePromptValue(req.TopicName),
		escapePromptValue(req.TopicType),
		req.TotalHours,
		req.TheoryHours,
		req.PracticeHours,
		req.IndividualHours,
		req.SrspHours,
		req.SrsHours,
		escapePromptValue(req.GroupName),
		escapePromptValue(req.GroupSpecialty),
		escapePromptValue(req.GroupQualification),
		escapePromptValue(req.ExplorationGoals),
		escapePromptValue(req.ExplorationSummary),
		escapePromptValue(req.Prerequisites),
		escapePromptValue(req.Postrequisites),
		string(internetResourcesJSON),
		string(technicalResourcesJSON),
		string(previousLessonsJSON),
		escapePromptValue(req.Message),
		lessonMinutes,
	)

	responseText, err := s.generateContentWithFallback(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("generate lesson: %w", err)
	}

	var out GenerateLessonResponse
	if err := decodeJSONObject(responseText, &out); err != nil {
		return nil, fmt.Errorf("decode lesson response: %w", err)
	}

	out.Type = strings.ToUpper(strings.TrimSpace(out.Type))
	out.Goals = strings.TrimSpace(out.Goals)
	out.Tasks = strings.TrimSpace(out.Tasks)
	out.Expected = strings.TrimSpace(out.Expected)
	for i := range out.LessonProgress {
		out.LessonProgress[i].Name = strings.TrimSpace(out.LessonProgress[i].Name)
		for j := range out.LessonProgress[i].Content {
			out.LessonProgress[i].Content[j] = strings.TrimSpace(out.LessonProgress[i].Content[j])
		}
	}

	return &out, nil
}

func (s *aiService) generateContentWithFallback(ctx context.Context, prompt string) (string, error) {
	responseText, err := s.generateContent(ctx, s.cfg.PrimaryModel, prompt)
	if err == nil {
		return responseText, nil
	}

	var reqErr *geminiRequestError
	if errors.As(err, &reqErr) && reqErr.IsRateLimit() && s.cfg.FallbackModel != "" && s.cfg.FallbackModel != s.cfg.PrimaryModel {
		s.log.WithField("primary_model", s.cfg.PrimaryModel).WithField("fallback_model", s.cfg.FallbackModel).Warn("Gemini limit reached, switching to fallback model")
		return s.generateContent(ctx, s.cfg.FallbackModel, prompt)
	}

	return "", err
}

func (s *aiService) generateContent(ctx context.Context, model string, prompt string) (string, error) {
	if strings.TrimSpace(s.cfg.APIKey) == "" {
		return "", errors.New("GEMINI_API_KEY is not configured")
	}
	if strings.TrimSpace(model) == "" {
		return "", errors.New("gemini model is not configured")
	}

	requestPayload := geminiGenerateContentRequest{
		Contents: []geminiContent{{
			Parts: []geminiPart{{Text: prompt}},
		}},
	}
	requestPayload.GenerationConfig.ResponseMimeType = "application/json"

	body, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("marshal gemini request: %w", err)
	}

	endpoint, err := buildGeminiEndpoint(s.cfg.BaseURL, model, s.cfg.APIKey)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create gemini request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("send gemini request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read gemini response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResp geminiErrorResponse
		if err := json.Unmarshal(respBody, &errorResp); err == nil {
			return "", &geminiRequestError{
				StatusCode: resp.StatusCode,
				Message:    strings.TrimSpace(errorResp.Error.Message),
				Status:     strings.TrimSpace(errorResp.Error.Status),
			}
		}

		return "", &geminiRequestError{
			StatusCode: resp.StatusCode,
			Message:    strings.TrimSpace(string(respBody)),
		}
	}

	var geminiResp geminiGenerateContentResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", fmt.Errorf("decode gemini success response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("gemini returned empty candidates")
	}

	text := strings.TrimSpace(geminiResp.Candidates[0].Content.Parts[0].Text)
	if text == "" {
		return "", errors.New("gemini returned empty response text")
	}

	return text, nil
}

func decodeJSONObject(responseText string, out interface{}) error {
	normalized := normalizeJSONText(responseText)
	if normalized == "" {
		return errors.New("empty response body")
	}

	if err := json.Unmarshal([]byte(normalized), out); err != nil {
		return fmt.Errorf("invalid json payload: %w", err)
	}

	return nil
}

func normalizeJSONText(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}

	if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimPrefix(trimmed, "```")
		trimmed = strings.TrimSpace(trimmed)
		if len(trimmed) >= 4 && strings.EqualFold(trimmed[:4], "json") {
			trimmed = strings.TrimSpace(trimmed[4:])
		}
		if idx := strings.LastIndex(trimmed, "```"); idx >= 0 {
			trimmed = strings.TrimSpace(trimmed[:idx])
		}
	}

	if strings.HasPrefix(trimmed, "`") && strings.HasSuffix(trimmed, "`") {
		trimmed = strings.Trim(trimmed, "`")
		trimmed = strings.TrimSpace(trimmed)
	}

	return trimmed
}

func normalizeSemesterHours(hours []int) []int {
	result := make([]int, 8)
	for i := 0; i < len(result) && i < len(hours); i++ {
		result[i] = hours[i]
	}
	return result
}

func escapePromptValue(value string) string {
	replacer := strings.NewReplacer(`\\`, `\\\\`, `"`, `\\"`)
	return replacer.Replace(strings.TrimSpace(value))
}

func buildGeminiEndpoint(baseURL string, model string, apiKey string) (string, error) {
	base := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if base == "" {
		base = "https://generativelanguage.googleapis.com/v1beta"
	}

	u, err := url.Parse(base + "/models/" + model + ":generateContent")
	if err != nil {
		return "", fmt.Errorf("parse gemini endpoint: %w", err)
	}

	q := u.Query()
	q.Set("key", apiKey)
	u.RawQuery = q.Encode()

	return u.String(), nil
}
