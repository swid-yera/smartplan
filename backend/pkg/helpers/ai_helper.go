package helpers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type GenerateRupMetaRequest struct {
	SourceLanguage        string           `json:"sourceLanguage"`
	Name                  string           `json:"name"`
	Type                  string           `json:"type"`
	StudyForm             string           `json:"studyForm"`
	StudyYear             string           `json:"studyYear"`
	Course                int              `json:"course"`
	Group                 GenerateRupGroup `json:"group"`
	Prerequisites         string           `json:"prerequisites"`
	Postrequisites        string           `json:"postrequisites"`
	Message               string           `json:"message"`
	IncludeCurrentContent bool             `json:"includeCurrentContent"`
	CurrentValues         json.RawMessage  `json:"currentValues"`
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
	SourceLanguage        string          `json:"sourceLanguage"`
	Name                  string          `json:"name"`
	Prerequisites         string          `json:"prerequisites"`
	Postrequisites        string          `json:"postrequisites"`
	Basic                 string          `json:"basic"`
	Goals                 string          `json:"goals"`
	Competencies          string          `json:"competencies"`
	Message               string          `json:"message"`
	IncludeCurrentContent bool            `json:"includeCurrentContent"`
	CurrentValues         json.RawMessage `json:"currentValues"`
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
	SourceLanguage        string          `json:"sourceLanguage"`
	Name                  string          `json:"name"`
	Course                int             `json:"course"`
	Goals                 string          `json:"goals"`
	Competencies          string          `json:"competencies"`
	WantsHours            int             `json:"wantsHours"`
	DisciplineCount       int             `json:"disciplineCount"`
	Message               string          `json:"message"`
	IncludeCurrentContent bool            `json:"includeCurrentContent"`
	CurrentValues         json.RawMessage `json:"currentValues"`
}

type GenerateTopicsForDisciplineRequest struct {
	SourceLanguage          string          `json:"sourceLanguage"`
	RupName                 string          `json:"rupName"`
	RupType                 string          `json:"rupType"`
	Goals                   string          `json:"goals"`
	Competencies            string          `json:"competencies"`
	DisciplineName          string          `json:"disciplineName"`
	DisciplineHours         int             `json:"disciplineHours"`
	Message                 string          `json:"message"`
	IncludeCurrentContent   bool            `json:"includeCurrentContent"`
	CurrentValues           json.RawMessage `json:"currentValues"`
	PreferredPracticalCount int             `json:"preferredPracticalCount"`
	PreferredSnzCount       int             `json:"preferredSnzCount"`
	PreferredCombinedCount  int             `json:"preferredCombinedCount"`
	PreferredSrspCount      int             `json:"preferredSrspCount"`
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
	DurationHours   int    `json:"durationHours"`
	TheoryHours     int    `json:"theoryHours"`
	PracticeHours   int    `json:"practiceHours"`
	IndividualHours int    `json:"individualHours"`
	SrspHours       int    `json:"srspHours"`
	SrsHours        int    `json:"srsHours"`
}

type GenerateLessonRequest struct {
	SourceLanguage     string   `json:"sourceLanguage"`
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
	Prerequisites      string   `json:"prerequisites"`
	Postrequisites     string   `json:"postrequisites"`
	InternetResources  []string `json:"internetResources"`
	TechnicalResources []string `json:"technicalResources"`
	PreviousLessons    []string `json:"previousLessons"`
	Message            string   `json:"message"`
}

type GenerateLessonResponse struct {
	Type               string                        `json:"type"`
	Goals              string                        `json:"goals"`
	Tasks              string                        `json:"tasks"`
	Expected           string                        `json:"expected"`
	InternetResources  []GeneratedResource           `json:"internetResources"`
	TechnicalResources []GeneratedResource           `json:"technicalResources"`
	LessonProgress     []GeneratedLessonProgressStep `json:"lessonProgress"`
}

type GeneratedLessonProgressStep struct {
	Name       string   `json:"name"`
	FirstTime  int32    `json:"firstTime"`
	SecondTime int32    `json:"secondTime"`
	ThirdTime  int32    `json:"thirdTime"`
	Content    []string `json:"content"`
}

type GeminiGenerateContentRequest struct {
	Contents         []GeminiContent `json:"contents"`
	GenerationConfig struct {
		ResponseMimeType string `json:"responseMimeType"`
	} `json:"generationConfig"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiGenerateContentResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type GeminiErrorResponse struct {
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error"`
}

type GeminiRequestError struct {
	StatusCode int
	Message    string
	Status     string
}

func (e *GeminiRequestError) Error() string {
	if e.Message == "" {
		return fmt.Sprintf("gemini request failed with status %d", e.StatusCode)
	}
	return fmt.Sprintf("gemini request failed with status %d: %s", e.StatusCode, e.Message)
}

func (e *GeminiRequestError) IsRateLimit() bool {
	if e.StatusCode == http.StatusTooManyRequests {
		return true
	}
	if strings.EqualFold(e.Status, "RESOURCE_EXHAUSTED") {
		return true
	}
	return strings.Contains(e.Message, "429")
}

type GenerateRupMetaPromptInput struct {
	SourceLanguage       string
	Name                 string
	Type                 string
	StudyForm            string
	Prerequisites        string
	Postrequisites       string
	StudyYear            string
	GroupName            string
	GroupSpecialty       string
	GroupQualification   string
	Course               int
	Message              string
	CurrentValuesContext string
}

type GenerateResourcesPromptInput struct {
	SourceLanguage       string
	Name                 string
	Prerequisites        string
	Postrequisites       string
	Basic                string
	Goals                string
	Competencies         string
	Message              string
	CurrentValuesContext string
}

type GenerateDisciplinesPromptInput struct {
	SourceLanguage       string
	WantsHours           int
	DisciplineCount      int
	Course               int
	Name                 string
	Goals                string
	Competencies         string
	Message              string
	CurrentValuesContext string
}

type GenerateTopicsForDisciplinePromptInput struct {
	SourceLanguage          string
	DisciplineName          string
	RupName                 string
	DisciplineHours         int
	RupType                 string
	Goals                   string
	Competencies            string
	Message                 string
	TopicCount              int
	BatchContext            string
	PreferredPracticalCount int
	PreferredSnzCount       int
	PreferredCombinedCount  int
	PreferredSrspCount      int
	CurrentValuesContext    string
}

type GenerateLessonPromptInput struct {
	SourceLanguage         string
	RupName                string
	DisciplineName         string
	TopicName              string
	TopicType              string
	TotalHours             int32
	TheoryHours            int32
	PracticeHours          int32
	IndividualHours        int32
	SrspHours              int32
	SrsHours               int32
	GroupName              string
	GroupSpecialty         string
	GroupQualification     string
	ExplorationGoals       string
	Prerequisites          string
	Postrequisites         string
	InternetResourcesJSON  string
	TechnicalResourcesJSON string
	PreviousLessonsJSON    string
	Message                string
	LessonMinutes          int32
}

func BuildGenerateRupMetaPrompt(in GenerateRupMetaPromptInput) string {
	responseLanguage := resolveRupAIGenerationLanguage(in.SourceLanguage)

	return fmt.Sprintf(`
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
- Тип обучения: "%s" (THEORY — теоретическое, PRACTICE — лабораторно-практическое)
- Форма обучения: "%s"
- Пререквизиты: "%s"
- Постреквизиты: "%s"
- Учебный год: "%s"
- Учебная группа: %s
- Специальность группы: %s
- Квалификация группы: %s
- Курс: %d
- Дополнительный комментарий преподавателя: "%s"
- Данные вписанные в поля прямо сейчас: %s

ТВОЯ ЗАДАЧА:
Сгенерировать СТРОГО JSON-ОБЪЕКТ без markdown, без комментариев, без пояснений, и по комментарию от преподователя.
Если переданы currentValues(Данные вписанные в поля прямо сейчас), считай это старой версией текста и перегенерируй обновлённую версию с учетом актуальных данных формы и комментария.

ЗАПРЕЩЕНО:
- использовать массивы для "basis", "goals", "competencies"
- использовать списки, маркеры, нумерацию
- сокращать официальные формулировки
- добавлять вымышленные нормативные документы

ОБЯЗАТЕЛЬНО:
- стиль официально-деловой, методический
- язык ответа: %s
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
		escapePromptValue(in.Name),
		escapePromptValue(in.Type),
		escapePromptValue(in.StudyForm),
		escapePromptValue(in.Prerequisites),
		escapePromptValue(in.Postrequisites),
		escapePromptValue(in.StudyYear),
		escapePromptValue(in.GroupName),
		escapePromptValue(in.GroupSpecialty),
		escapePromptValue(in.GroupQualification),
		in.Course,
		escapePromptValue(in.Message),
		in.CurrentValuesContext,
		responseLanguage,
	)
}

func BuildGenerateResourcesPrompt(in GenerateResourcesPromptInput) string {
	responseLanguage := resolveRupAIGenerationLanguage(in.SourceLanguage)

	return fmt.Sprintf(`
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
- Данные вписанные в поля прямо сейчас: %s

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
- Язык всех полей name: %s.

- Каждое поле name должно быть связным текстом, максимально информативным, без списков или маркеров внутри.
- Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по основным требованиям выше.
- Если переданы currentValues(Данные вписанные в поля прямо сейчас), воспринимай их как старую версию ресурсов и сгенерируй обновленный вариант на основе актуальных данных.

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
		escapePromptValue(in.Name),
		escapePromptValue(in.Prerequisites),
		escapePromptValue(in.Postrequisites),
		escapePromptValue(in.Basic),
		escapePromptValue(in.Goals),
		escapePromptValue(in.Competencies),
		escapePromptValue(in.Message),
		in.CurrentValuesContext,
		responseLanguage,
		escapePromptValue(in.Name),
	)
}

func BuildGenerateDisciplinesPrompt(in GenerateDisciplinesPromptInput) string {
	responseLanguage := resolveRupAIGenerationLanguage(in.SourceLanguage)

	return fmt.Sprintf(`
Ты — методист по разработке учебных программ для колледжей и техникумов РК.

Задача: распределить %d часов по %d дисциплинам
для %d-го курса модуля "%s".

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "%s"
- Цели освоения профессионального модуля: "%s"
- Формируемые компетенции: "%s"
- Дополнительный комментарий преподавателя: "%s"
- Данные вписанные в поля прямо сейчас: %s

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
- Язык поля name: %s.

4. Не использовать markdown, комментарии или текст вне JSON
5. Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по правилам выше.
6. Если переданы currentValues(Данные вписанные в поля прямо сейчас), считай их старой версией дисциплин и выполни перегенерацию под новые входные данные.

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
		in.WantsHours,
		in.DisciplineCount,
		in.Course,
		escapePromptValue(in.Name),
		escapePromptValue(in.Name),
		escapePromptValue(in.Goals),
		escapePromptValue(in.Competencies),
		escapePromptValue(in.Message),
		in.CurrentValuesContext,
		in.DisciplineCount,
		responseLanguage,
		in.DisciplineCount,
		in.Course,
	)
}

func BuildGenerateTopicsForDisciplinePrompt(in GenerateTopicsForDisciplinePromptInput) string {
	responseLanguage := resolveRupAIGenerationLanguage(in.SourceLanguage)

	return fmt.Sprintf(`
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
- Данные вписанные в поля прямо сейчас: %s
- Контекст пакетной генерации: "%s"
- Предпочтения по количеству тем:
  - PRACTICAL: %d
  - SNZ: %d
  - COMBINED: %d
  - SRSP: %d
- Если переданы currentValues, считай их старой версией тем и перегенерируй темы как новую версию, учитывая актуальный контекст.

ПРАВИЛА ГЕНЕРАЦИИ ТЕМ:

1. Количество и длительность тем:
- Каждая обычная тема = 2 часа.
- Темы типа "PRACTICAL" могут иметь durationHours = 2 или 6.
- Для "PRACTICAL": theoryHours = 0, practiceHours = durationHours.
- Для "COMBINED": durationHours = 2, theoryHours + practiceHours = 2.
- Для "SNZ": durationHours = 2, individualHours = 2.
- Для "SRSP": durationHours = 2, srspHours = 2.
- Темы типа "SRSP" являются ДОПОЛНИТЕЛЬНЫМИ и не должны уменьшать количество обычных тем по totalHours.
- totalHours покрывает только обычные темы, а темы "SRSP" добавляются сверх этого объема как отдельные темы.

2. Названия тем (КРИТИЧЕСКИ ВАЖНО):
- Название темы ДОЛЖНО:
  - начинаться с глагола действия
  - НЕ содержать в начале слов:
    "Лабораторно-практическое занятие", "Лабораторно-практическая работа", "Теоретическое занятие", "Лекция"
- Использовать глаголы, соответствующие таксономии Блума, от уровня знаний и понимания до уровня анализа и синтеза, по возрастающей уровня понимания (уровень СПО/ТиПО):
- Язык названий и всех текстов: %s.

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
- "Лабораторно-практическое занятие: применение алгоритмов"
- "Лабораторно-практическая работа по настройке ПО"
- "Лекция. Основы алгоритмов"

3. Структура каждой темы — строго объект:
{
  "name": string,
  "type": "COMBINED" | "PRACTICAL" | "SNZ" | "SRSP",
  "durationHours": number,
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
- Для каждой темы обязательно указывай durationHours
- durationHours может быть только 2 или 6 для "PRACTICAL"
- Для "COMBINED", "SNZ" и "SRSP" durationHours всегда 2
- Если переданы предпочтения по количеству типов тем, старайся их соблюдать без нарушения ограничений по сумме часов.

6. Формат ответа:
- Верни ТОЛЬКО валидный JSON
- Без комментариев, markdown, пояснений или дополнительного текста
- В конце снова перепроверяй длительность всех тем чтобы они в точности совпали с totalHours
7. Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по правилам выше.
`,
		escapePromptValue(in.DisciplineName),
		escapePromptValue(in.RupName),
		in.DisciplineHours,
		escapePromptValue(in.RupName),
		escapePromptValue(in.RupType),
		escapePromptValue(in.Goals),
		escapePromptValue(in.Competencies),
		escapePromptValue(in.DisciplineName),
		escapePromptValue(in.Message),
		in.CurrentValuesContext,
		escapePromptValue(in.BatchContext),
		in.PreferredPracticalCount,
		in.PreferredSnzCount,
		in.PreferredCombinedCount,
		in.PreferredSrspCount,
		responseLanguage,
		in.DisciplineHours,
		in.TopicCount,
	)
}

func resolveRupAIGenerationLanguage(sourceLanguage string) string {
	if strings.EqualFold(strings.TrimSpace(sourceLanguage), "kk") {
		return "ҚАЗАҚ"
	}

	return "РУССКИЙ"
}

func resolveLessonAIGenerationLanguage(sourceLanguage string) string {
	if strings.EqualFold(strings.TrimSpace(sourceLanguage), "kk") || strings.EqualFold(strings.TrimSpace(sourceLanguage), "kz") {
		return "казахском"
	}

	return "русском"
}

func BuildGenerateLessonPrompt(in GenerateLessonPromptInput) string {
	responseLanguage := resolveLessonAIGenerationLanguage(in.SourceLanguage)

	return fmt.Sprintf(`
Ты — методист колледжа Республики Казахстан. Подготовь поурочный план по теме дисциплины.

КОНТЕКСТ:
- Название РУП: "%s"
- Дисциплина: "%s"
- Тема: "%s"
- Тип темы: "%s" (SNZ / PRACTICAL / COMBINED / SRSP)
- Часы темы: total=%d, theory=%d, practice=%d, individual=%d, srsp=%d, srs=%d
- Группа: "%s"
- Специальность: "%s"
- Квалификация: "%s"
- Цели РУП: "%s"
- Пререквизиты: "%s"
- Постреквизиты: "%s"
- Интернет-ресурсы: %s
- Тех.ресурсы: %s
- 3 предыдущих темы уроков: %s
- Дополнительный комментарий преподавателя: "%s"

КРИТИЧЕСКИ ВАЖНО - ЯЗЫК ОТВЕТА:
ВСЕ поля JSON должны быть СТРОГО на %s языке:
- "goals" (цели/мақсаттар) - на %s языке
- "tasks" (задачи/міндеттер) - на %s языке
- "expected" (ожидаемые результаты/күтілетін нәтижелер) - на %s языке
- "internetResources[].name" (названия ресурсов) - на %s языке
- "technicalResources[].name" (названия ресурсов) - на %s языке
- "lessonProgress[].content[]" (содержимое) - на %s языке

НИ ОДНО текстовое поле НЕ должно содержать текст на другом языке!

ТРЕБОВАНИЯ:
1) Верни СТРОГО один JSON-объект без markdown и комментариев.
2) Поле "type" только "PRACTICE" или "THEORY".
3) "goals", "tasks", "expected" — связный методический текст на %s языке.
4) "lessonProgress" — массив этапов занятия.
5) Названия этапов и время уже зафиксированы системой и НЕ ДОЛЖНЫ генерироваться.
6) Верни в "lessonProgress" ровно 7 элементов строго в этом порядке:
   1. Организационно-мотивационный момент
   2. Актуализация знаний
   3. Формирование новых знаний и навыков
   4. Закрепление новой темы
   5. Рефлексия
   6. Оценивание
   7. Домашнее задание
7) Каждый элемент "lessonProgress" должен содержать только:
   - content: массив конкретных действий преподавателя и обучающихся на %s языке
8) Для каждого этапа content должен быть кратким, предметным и методически корректным, без повторения названия этапа.
9) Формулировки должны соответствовать теме, не повторять дословно предыдущие уроки.
10) Обязательно учти комментарий преподавателя. Если комментарий пустой, действуй по требованиям выше.
11) Добавь "internetResources" (4-7 шт.) и "technicalResources" (3-6 шт.):
   - каждый элемент: { "name": string, "link": string }
   - "name" должно быть на %s языке
   - link должен быть корректным URL (https://...), если ссылка известна
   - запрещены заглушки и мусорные значения (например: "asdf", "test", "qwerty")
   - если точной ссылки нет, укажи "link": ""

ФОРМАТ ОТВЕТА:
{
  "type": "PRACTICE" | "THEORY",
  "goals": string,
  "tasks": string,
  "expected": string,
  "internetResources": [
    { "name": string, "link": string }
  ],
  "technicalResources": [
    { "name": string, "link": string }
  ],
  "lessonProgress": [
    {
      "content": [string]
    }
  ]
}
`,
		escapePromptValue(in.RupName),
		escapePromptValue(in.DisciplineName),
		escapePromptValue(in.TopicName),
		escapePromptValue(in.TopicType),
		in.TotalHours,
		in.TheoryHours,
		in.PracticeHours,
		in.IndividualHours,
		in.SrspHours,
		in.SrsHours,
		escapePromptValue(in.GroupName),
		escapePromptValue(in.GroupSpecialty),
		escapePromptValue(in.GroupQualification),
		escapePromptValue(in.ExplorationGoals),
		escapePromptValue(in.Prerequisites),
		escapePromptValue(in.Postrequisites),
		in.InternetResourcesJSON,
		in.TechnicalResourcesJSON,
		in.PreviousLessonsJSON,
		escapePromptValue(in.Message),
		responseLanguage, // "КРИТИЧЕСКИ ВАЖНО - ЯЗЫК ОТВЕТА"
		responseLanguage, // goals
		responseLanguage, // tasks
		responseLanguage, // expected
		responseLanguage, // internetResources
		responseLanguage, // technicalResources
		responseLanguage, // lessonProgress content
		responseLanguage, // "goals", "tasks", "expected"
		responseLanguage, // content этапа
		responseLanguage, // "name" для ресурсов
	)
}

func BuildCurrentValuesContext(includeCurrentContent bool, currentValues json.RawMessage, label string) string {
	if !includeCurrentContent {
		return ""
	}

	trimmed := strings.TrimSpace(string(currentValues))
	if trimmed == "" || trimmed == "null" {
		return fmt.Sprintf("\n%s:\nне переданы.\n", label)
	}

	var payload any
	if err := json.Unmarshal(currentValues, &payload); err == nil {
		if !hasMeaningfulContent(payload) {
			return fmt.Sprintf("\n%s:\nне переданы.\n", label)
		}

		formatted, formatErr := json.MarshalIndent(payload, "", "  ")
		if formatErr == nil {
			return fmt.Sprintf("\n%s:\n%s\n", label, string(formatted))
		}
	}

	return fmt.Sprintf("\n%s:\n%s\n", label, trimmed)
}

func hasMeaningfulContent(value any) bool {
	switch v := value.(type) {
	case nil:
		return false
	case string:
		return strings.TrimSpace(v) != ""
	case bool:
		return true
	case float64:
		return true
	case []any:
		return len(v) > 0
	case map[string]any:
		for _, nested := range v {
			if hasMeaningfulContent(nested) {
				return true
			}
		}

		return false
	default:
		return true
	}
}

func escapePromptValue(value string) string {
	replacer := strings.NewReplacer(`\\`, `\\\\`, `"`, `\\"`)
	return replacer.Replace(strings.TrimSpace(value))
}
