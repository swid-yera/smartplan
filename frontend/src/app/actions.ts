'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { type IGroup, RupTypeEnum, type StudyFormEnum, TopicTypeEnum } from '@types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const GENERATION_CONFIG = {
	responseMimeType: 'application/json',
}

// model config with 99.99% json response
// const model = genAI.getGenerativeModel({
// 	model: 'gemini-2.5-flash-lite',
// 	generationConfig: GENERATION_CONFIG,
// })

// generate content with fallback
async function generateContentWithFallback(prompt: string) {
	// primary
	const primaryModel = genAI.getGenerativeModel({
		model: 'gemini-2.5-flash-lite',
		generationConfig: GENERATION_CONFIG,
	})

	// fallback model
	const fallbackModel = genAI.getGenerativeModel({
		model: 'gemini-2.5-flash',
		generationConfig: GENERATION_CONFIG,
	})

	// try with primary model
	try {
		return await primaryModel.generateContent(prompt)
	} catch (error) {
		// check for quota
		// @ts-ignore
		const isRateLimit = error?.message?.includes('429') || error?.status === 429

		if (isRateLimit) {
			console.warn('Лимит исчерпан. Переключаюсь на запасную модель...')
			// try with fallback model
			try {
				return await fallbackModel.generateContent(prompt)
			} catch (fallbackError) {
				console.error('Обе модели недоступны')
				throw fallbackError
			}
		}

		// Если ошибка не связана с лимитами, просто пробрасываем её дальше
		throw error
	}
}

// generate rup meta
export interface IGenerateRupMeta {
	name: string
	type: RupTypeEnum
	studyForm: StudyFormEnum
	studyYear: string
	course: number
	group: IGroup

	prerequisites: string
	postrequisites: string
}

export async function generateRupMeta(baseData: IGenerateRupMeta) {
	const prompt = `
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
- Название: "${baseData.name}"
- Тип обучения: "${baseData.type}" (THEORY — теоретическое, PRACTICE — практическое)
- Форма обучения: "${baseData.studyForm}"
- Пререквизиты: "${baseData.prerequisites}"
- Постреквизиты: "${baseData.postrequisites}"
- Учебный год: "${baseData.studyYear}"
- Учебная группа: ${baseData.group.name}
- Специальность группы: ${baseData.group.specialty}
- Квалификация группы: ${baseData.group.qualification}
- Курс: ${baseData.course}

ТВОЯ ЗАДАЧА:
Сгенерировать СТРОГО JSON-ОБЪЕКТ без markdown, без комментариев, без пояснений.

ЗАПРЕЩЕНО:
- использовать массивы для "basis", "goals", "competencies"
- использовать списки, маркеры, нумерацию
- сокращать официальные формулировки
- добавлять вымышленные нормативные документы

ОБЯЗАТЕЛЬНО:
- стиль официально-деловой, методический
- язык ответа: РУССКИЙ
- текст должен быть пригоден для прямой вставки в РУП

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
`

	try {
		const result = await generateContentWithFallback(prompt)

		return JSON.parse(result.response.text())
	} catch (e) {
		console.error('failed to generate rups meta data:', e)
		throw new Error('Не удалось сгенерировать метаданные')
	}
}

// generate resources
export interface IGenerateResources {
	name: string
	prerequisites: string
	postrequisites: string

	basic: string
	goals: string
	competencies: string
}

export async function generateResources(baseData: IGenerateResources) {
	const prompt = `
Ты — эксперт по разработке учебных программ и образовательных ресурсов для колледжей и техникумов Республики Казахстан.
Нужно сгенерировать учебные и технические ресурсы для курса, соответствующие профессиональному модулю.

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "${baseData.name}"
- Пререквизиты: "${baseData.prerequisites}"
- Постреквизиты: "${baseData.postrequisites}"
- Пояснительная записка: "${baseData.basic}"
- Цели освоения профессионального модуля: "${baseData.goals}"
- Формируемые компетенции: "${baseData.competencies}"

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

Пример желаемого формата:

{
  "internetResources": [
    { "name": "Электронный учебно-методический комплекс «Введение в сетевые технологии» курса CCNA сетевой академии Cisco", "link": "https://www.csu.ru/faculties/Documents/IPKPK/%D0%92%D0%B2%D0%B5%D0%B4%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%B2%20%D1%81%D0%B5%D1%82%D0%B5%D0%B2%D1%8B%D0%B5%20%D1%82%D0%B5%D1%85%D0%BD%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D0%B8.pdf" },
    { "name": "Б. В. Левин, А. В. Левина, А. А. Кириллов. «Информационная безопасность сети». Подробное объяснение принципов, технологий и методов защиты сетей", "link": "" }
  ],
  "technicalResources": [
    { "name": "Программное обеспечение: Open Source инструменты; документация по использованию Snort, Wireshark для анализа сетевого трафика и обнаружения угроз", "link": "https://habr.com/ru/companies/selectel/articles/744478/" },
    { "name": "Операционные системы: Windows, Linux, macOS", "link": "" }
  ]
}

Сгенерируй JSON с 5–7 ресурсами для internetResources и 4–6 для technicalResources, релевантными к курсу "${baseData.name}".
`

	try {
		const result = await generateContentWithFallback(prompt)

		return JSON.parse(result.response.text())
	} catch (e) {
		console.error('failed to generate rups resources data:', e)
		throw new Error('Не удалось сгенерировать метаданные')
	}
}

// generate rup disciplines
export interface IGenerateDisciplines {
	name: string
	course: number
	goals: string
	competencies: string

	wantsHours: number
	disciplineCount: number
}

export async function generateDisciplines(baseData: IGenerateDisciplines) {
	const prompt = `
Ты — методист по разработке учебных программ для колледжей и техникумов РК.

Задача: распределить ${baseData.wantsHours} часов по ${baseData.disciplineCount} дисциплинам
для ${baseData.course}-го курса модуля "${baseData.name}".

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "${baseData.name}"
- Цели освоения профессионального модуля: "${baseData.goals}"
- Формируемые компетенции: "${baseData.competencies}"

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
- количество = ${baseData.disciplineCount}
- name: связное информативное название дисциплины
- code: уникальный код РО7.1, РО7.2 и т.д.

4. Не использовать markdown, комментарии или текст вне JSON

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

Сгенерируй JSON для ${baseData.disciplineCount} дисциплин с распределением часов **последовательно по семестрам курса ${baseData.course}**.
`

	try {
		const result = await generateContentWithFallback(prompt)

		const data = JSON.parse(result.response.text())

		const response = data.disciplines.map((d) => ({
			name: `${d.code} ${d.name}`,
			semesters: d.semesters.map((hours, index) => ({
				semester: index + 1,
				totalHours: hours,
			})),
			topics: [],
		}))

		return response
	} catch (e) {
		console.error('failed to generate rups disciplines:', e)
		throw new Error('Ошибка распределения часов')
	}
}

// generate topics for one discipline (do loop)
export interface IGenerateTopicsForDiscipline {
	rupName: string
	rupType: RupTypeEnum
	goals: string
	competencies: string

	disciplineName: string
	disciplineHours: number

	additionalMessage?: string
	includeCurrentContent?: boolean
	currentTopics?: {
		name: string
		type: TopicTypeEnum
		theoryHours: number
		practiceHours: number
		individualHours?: number
		srspHours?: number
		srsHours?: number
	}[]
	preferredPracticalCount?: number
	preferredSnzCount?: number
	preferredCombinedCount?: number
}

export async function generateTopicsForDiscipline(baseData: IGenerateTopicsForDiscipline) {
	const topicHours = baseData.rupType === RupTypeEnum.PRACTICE ? 6 : 2
	const hasPreferredTopicCounts =
		(baseData.preferredPracticalCount ?? 0) > 0 ||
		(baseData.preferredSnzCount ?? 0) > 0 ||
		(baseData.preferredCombinedCount ?? 0) > 0
	const preferredTopicCount =
		(baseData.preferredPracticalCount ?? 0) +
		(baseData.preferredSnzCount ?? 0) +
		(baseData.preferredCombinedCount ?? 0)
	const shouldUsePreferredTopicCount =
		baseData.rupType !== RupTypeEnum.PRACTICE && hasPreferredTopicCounts && preferredTopicCount > 0

	// the logic for calculating the number of topics (if rup type == PRACTICE, every 6 hours - a new topic, if THEORY every 2 hours - a new topic)
	const topicCount = shouldUsePreferredTopicCount
		? preferredTopicCount
		: Math.floor(baseData.disciplineHours / topicHours)

	const additionalMessageContext = baseData.additionalMessage?.trim()
		? `\nДОПОЛНИТЕЛЬНЫЕ ПОЖЕЛАНИЯ ПОЛЬЗОВАТЕЛЯ:\n${baseData.additionalMessage.trim()}\n`
		: ''
	const currentTopicsContext =
		baseData.includeCurrentContent && baseData.currentTopics && baseData.currentTopics.length > 0
			? `\nТЕКУЩИЙ КОНТЕНТ ДИСЦИПЛИНЫ (учти его при генерации):\n${JSON.stringify(baseData.currentTopics)}\n`
			: ''
	const preferredCountsContext = hasPreferredTopicCounts
		? `\nПРЕДПОЧТЕНИЯ ПО КОЛИЧЕСТВУ ТЕМ:\n- PRACTICAL: ${baseData.preferredPracticalCount ?? 0}\n- SNZ: ${baseData.preferredSnzCount ?? 0}\n- COMBINED: ${baseData.preferredCombinedCount ?? 0}\n`
		: ''

	const prompt = `
Ты — методист по разработке учебных программ для колледжей и техникумов Республики Казахстан.

Сгенерируй учебный план (темы уроков) для дисциплины "${baseData.disciplineName}" модуля "${baseData.rupName}".
Общее количество часов: ${baseData.disciplineHours}.

ДАННЫЕ ПРОФЕССИОНАЛЬНОГО МОДУЛЯ:
- Название: "${baseData.rupName}"
- Тип РУП: ${baseData.rupType}
- Цели освоения профессионального модуля: "${baseData.goals}"
- Формируемые компетенции: "${baseData.competencies}"
- Название дисциплины: "${baseData.disciplineName}"
${additionalMessageContext}${currentTopicsContext}${preferredCountsContext}

ПРАВИЛА ГЕНЕРАЦИИ ТЕМ:

1. Количество и длительность тем:
- Если тип РУП = PRACTICE:
  - каждая тема = 6 часов
  - все темы = "PRACTICAL"
  - theoryHours = 0
  - practiceHours = 6
- Если тип РУП = THEORY:
  - каждая тема = 2 часа
  - темы могут быть "COMBINED", "PRACTICAL" или "SNZ"
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
  "type": "COMBINED" | "PRACTICAL" | "SNZ",
  "theoryHours": number,
  "practiceHours": number
}

4. Требования к содержанию:
- Темы должны быть логически связаны с целями (goals) и компетенциями (competencies) модуля
- Формулировки должны соответствовать официально-деловому, методическому стилю РК
- Не использовать разговорные или учебно-бытовые формулировки

5. Ограничения:
- Все часы суммируются строго в totalHours = ${baseData.disciplineHours}
- Количество тем = ${topicCount}
- Для PRACTICE все темы = "PRACTICAL"
- Для THEORY допускается mix, но каждая тема = 2 часа, темы подходящие по смыслу к практическим могут иметь тип "PRACTICAL", а остальные "COMBINED" или "SNZ"
- Если переданы предпочтения по количеству типов тем, старайся их соблюдать без нарушения ограничений по сумме часов.

6. Формат ответа:
- Верни ТОЛЬКО валидный JSON
- Без комментариев, markdown, пояснений или дополнительного текста
`

	try {
		const result = await generateContentWithFallback(prompt)

		const data = JSON.parse(result.response.text())

		const response = data.map((topic) => ({
			name: topic.name,
			type: topic.type as TopicTypeEnum,
			theoryHours: topic.theoryHours,
			practiceHours: topic.practiceHours,
			individualHours: 0,
			srspHours: 0,
			srsHours: 0,
		}))

		return response
	} catch (e) {
		console.error(`Ошибка в темах для ${baseData.disciplineName}:`, e)

		return []
	}
}
