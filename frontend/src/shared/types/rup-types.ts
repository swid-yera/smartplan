export interface IRup {
	id?: string
	programName: string
	academicYear: string
	specialtyCode: string
	formOfStudy: string
	totalWeeks: number
	totalHours: number
	subjects: ISubject[]
	explanatoryNote: string
	competencies: ICompetency[]
}

export interface ISubject {
	id: string
	code: string
	name: string
	semester1Hours: number
	semester2Hours: number
	lecture: number
	lab: number
	practice: number
	srs: number // Self-Study
	project: number
	controlType: string
	description: string
	competencies: string[]
	semesterDistribution: ISemesterDistribution[]
	assessmentForms: string[]
	prerequisites: string[]
	recommendedResources: IRecommendedResource[]
}

export interface ISemesterDistribution {
	semester: number
	lecture: number
	lab: number
	practice: number
	srs: number
	project: number
	total: number
}

export interface IRecommendedResource {
	id: string
	type: string
	title: string
	author: string
	year: number
}

// Timetable types
export interface IGroup {
	id: string
	name: string
	specialty: string
	semester: number
	studentCount: number
}

export interface ITeacher {
	id: string
	name: string
	subjects: string[] // subject codes
}

export interface IRoom {
	id: string
	name: string
	capacity: number
	type: 'lecture' | 'lab' | 'practice'
}

export interface ILesson {
	id: string
	subjectId: string
	teacherId: string
	roomId: string
	groupId: string
	dayOfWeek: number // 1-7 (Monday-Sunday)
	timeSlot: number // 1-8 (time slots)
	duration: number // in slots
	weekType?: 'odd' | 'even' | 'both' // for alternating weeks
}

export interface ITimeSlot {
	id: number
	startTime: string
	endTime: string
	label: string
}

export interface ITimetable {
	groupId: string
	lessons: ILesson[]
	holidays: string[] // dates in YYYY-MM-DD format
	shortDays: string[] // dates in YYYY-MM-DD format
}

// AI Import types
export interface IAIParsingResult {
	id: string
	subjectCode: string
	subjectName: string
	totalHours: number
	semester1Hours: number
	semester2Hours: number
	lecture: number
	lab: number
	practice: number
	srs: number
	controlType: string
	confidence: number // 0-100
}

export interface IAIImportSession {
	id: string
	fileName: string
	fileType: 'pdf' | 'docx'
	uploadDate: string
	status: 'uploading' | 'parsing' | 'completed' | 'error'
	progress: number // 0-100
	programName: string
	academicYear: string
	parsedData: IAIParsingResult[]
	errorMessage?: string
}

// AI Import mock data
export const mockAIParsingResults: IAIParsingResult[] = [
	{
		id: '1',
		subjectCode: 'MATH101',
		subjectName: 'Математика',
		totalHours: 120,
		semester1Hours: 60,
		semester2Hours: 60,
		lecture: 30,
		lab: 20,
		practice: 10,
		srs: 60,
		controlType: 'Экзамен',
		confidence: 50,
	},
	{
		id: '2',
		subjectCode: 'PROG101',
		subjectName: 'Программирование',
		totalHours: 160,
		semester1Hours: 80,
		semester2Hours: 80,
		lecture: 40,
		lab: 30,
		practice: 10,
		srs: 80,
		controlType: 'Проект',
		confidence: 88,
	},
	{
		id: '3',
		subjectCode: 'PHYS101',
		subjectName: 'Физика',
		totalHours: 100,
		semester1Hours: 50,
		semester2Hours: 50,
		lecture: 25,
		lab: 15,
		practice: 10,
		srs: 50,
		controlType: 'Зачет',
		confidence: 92,
	},
]

export const mockAIImportSession: IAIImportSession = {
	id: 'session-1',
	fileName: 'rup-document.pdf',
	fileType: 'pdf',
	uploadDate: new Date().toISOString(),
	status: 'completed',
	progress: 100,
	programName: 'Информатика',
	academicYear: '2025-2026',
	parsedData: mockAIParsingResults,
}

export interface ICompetency {
	id: string
	subjectId: string
	description: string
}

// Mock data
export const mockRUP: IRup = {
	id: '1',
	programName: 'Информатика и вычислительная техника',
	academicYear: '2025-2026',
	specialtyCode: 'CS101',
	formOfStudy: 'Full-time',
	totalWeeks: 36,
	totalHours: 2160,
	subjects: [
		{
			id: '1',
			code: 'MATH101',
			name: 'Математика',
			semester1Hours: 60,
			semester2Hours: 60,
			lecture: 30,
			lab: 20,
			practice: 10,
			srs: 60,
			project: 0,
			controlType: 'Exam',
			description: 'Курс математики для программистов',
			competencies: ['Математическое мышление', 'Логическое мышление'],
			semesterDistribution: [
				{ semester: 1, lecture: 15, lab: 10, practice: 5, srs: 30, project: 0, total: 60 },
				{ semester: 2, lecture: 15, lab: 10, practice: 5, srs: 30, project: 0, total: 60 },
			],
			assessmentForms: ['Экзамен'],
			prerequisites: [],
			recommendedResources: [
				{ id: '1', type: 'Книга', title: 'Математика для программистов', author: 'Иванов И.И.', year: 2020 },
			],
		},
		{
			id: '2',
			code: 'PROG101',
			name: 'Программирование',
			semester1Hours: 80,
			semester2Hours: 80,
			lecture: 40,
			lab: 30,
			practice: 10,
			srs: 80,
			project: 20,
			controlType: 'Project',
			description: 'Основы программирования на Python',
			competencies: ['Навыки программирования', 'Алгоритмическое мышление'],
			semesterDistribution: [
				{ semester: 1, lecture: 20, lab: 15, practice: 5, srs: 40, project: 10, total: 90 },
				{ semester: 2, lecture: 20, lab: 15, practice: 5, srs: 40, project: 10, total: 90 },
			],
			assessmentForms: ['Проект', 'Зачет'],
			prerequisites: ['MATH101'],
			recommendedResources: [
				{ id: '2', type: 'Книга', title: 'Python для начинающих', author: 'Петров П.П.', year: 2021 },
			],
		},
	],
	explanatoryNote: 'Это образец пояснительной записки.',
	competencies: [
		{
			id: '1',
			subjectId: '1',
			description: 'Математическое мышление',
		},
		{
			id: '2',
			subjectId: '2',
			description: 'Навыки программирования',
		},
	],
}

// Export types
export interface IExportJob {
	id: string
	rupId: string
	rupName: string
	programName: string
	academicYear: string
	exportType: 'pdf' | 'excel'
	status: 'pending' | 'processing' | 'completed' | 'failed'
	createdAt: string
	completedAt?: string
	fileSize?: number
	downloadUrl?: string
	errorMessage?: string
}

export interface IExportFilters {
	programName?: string
	rupName?: string
	academicYear?: string
	exportType?: 'pdf' | 'excel'
	status?: 'pending' | 'processing' | 'completed' | 'failed'
}

// Export mock data
export const mockExportJobs: IExportJob[] = [
	{
		id: 'exp-1',
		rupId: '1',
		rupName: 'РУП Информатика 2025-2026',
		programName: 'Информатика и вычислительная техника',
		academicYear: '2025-2026',
		exportType: 'pdf',
		status: 'completed',
		createdAt: '2025-12-01T10:00:00Z',
		completedAt: '2025-12-01T10:05:00Z',
		fileSize: 2457600, // 2.4 MB
		downloadUrl: '/downloads/rup-1-2025-2026.pdf',
	},
	{
		id: 'exp-2',
		rupId: '1',
		rupName: 'РУП Информатика 2025-2026',
		programName: 'Информатика и вычислительная техника',
		academicYear: '2025-2026',
		exportType: 'excel',
		status: 'completed',
		createdAt: '2025-12-02T14:30:00Z',
		completedAt: '2025-12-02T14:32:00Z',
		fileSize: 512000, // 512 KB
		downloadUrl: '/downloads/rup-1-2025-2026.xlsx',
	},
	{
		id: 'exp-3',
		rupId: '2',
		rupName: 'РУП Математика 2025-2026',
		programName: 'Математика',
		academicYear: '2025-2026',
		exportType: 'pdf',
		status: 'processing',
		createdAt: '2025-12-04T09:15:00Z',
	},
	{
		id: 'exp-4',
		rupId: '3',
		rupName: 'РУП Физика 2024-2025',
		programName: 'Физика',
		academicYear: '2024-2025',
		exportType: 'excel',
		status: 'failed',
		createdAt: '2025-12-03T16:45:00Z',
		errorMessage: 'Ошибка генерации файла',
	},
]

// Timetable mock data
export const mockGroups: IGroup[] = [
	{
		id: 'cs-2025-a',
		name: 'CS-2025-A',
		specialty: 'Информатика',
		semester: 1,
		studentCount: 25,
	},
	{
		id: 'math-2025-b',
		name: 'MATH-2025-B',
		specialty: 'Математика',
		semester: 2,
		studentCount: 20,
	},
]

export const mockTeachers: ITeacher[] = [
	{
		id: 'ivanov',
		name: 'Иванов И.И.',
		subjects: ['MATH101', 'PROG101'],
	},
	{
		id: 'petrova',
		name: 'Петрова А.С.',
		subjects: ['PROG101', 'ALGO101'],
	},
	{
		id: 'sidorov',
		name: 'Сидоров П.П.',
		subjects: ['PHYS101', 'CHEM101'],
	},
]

export const mockRooms: IRoom[] = [
	{
		id: '101',
		name: 'Аудитория 101',
		capacity: 50,
		type: 'lecture',
	},
	{
		id: 'lab1',
		name: 'Лаборатория 1',
		capacity: 20,
		type: 'lab',
	},
	{
		id: 'practice1',
		name: 'Практическая 1',
		capacity: 30,
		type: 'practice',
	},
]

export const mockTimeSlots: ITimeSlot[] = [
	{ id: 1, startTime: '09:00', endTime: '10:30', label: '09:00' },
	{ id: 2, startTime: '10:40', endTime: '12:10', label: '10:40' },
	{ id: 3, startTime: '12:20', endTime: '13:50', label: '12:20' },
	{ id: 4, startTime: '14:00', endTime: '15:30', label: '14:00' },
	{ id: 5, startTime: '15:40', endTime: '17:10', label: '15:40' },
	{ id: 6, startTime: '17:20', endTime: '18:50', label: '17:20' },
]

export const mockTimetable: ITimetable = {
	groupId: 'cs-2025-a',
	lessons: [
		{
			id: '1',
			subjectId: 'MATH101',
			teacherId: 'ivanov',
			roomId: '101',
			groupId: 'cs-2025-a',
			dayOfWeek: 1, // Monday
			timeSlot: 1, // 09:00
			duration: 2,
		},
		{
			id: '2',
			subjectId: 'PROG101',
			teacherId: 'petrova',
			roomId: 'lab1',
			groupId: 'cs-2025-a',
			dayOfWeek: 2, // Tuesday
			timeSlot: 2, // 10:40
			duration: 1,
		},
	],
	holidays: ['2025-01-01', '2025-01-07'],
	shortDays: ['2025-02-23'],
}

// Mock detailed subject for subject editor
export const mockDetailedSubject: ISubject = {
	id: '1',
	code: 'MATH101',
	name: 'Математика',
	semester1Hours: 60,
	semester2Hours: 60,
	lecture: 30,
	lab: 20,
	practice: 10,
	srs: 60,
	project: 0,
	controlType: 'Exam',
	description:
		'Курс математики для программистов, включающий дискретную математику, математическую логику и основы алгебры.',
	competencies: ['Математическое мышление', 'Логическое мышление', 'Алгоритмическое мышление'],
	semesterDistribution: [
		{ semester: 1, lecture: 15, lab: 10, practice: 5, srs: 30, project: 0, total: 60 },
		{ semester: 2, lecture: 15, lab: 10, practice: 5, srs: 30, project: 0, total: 60 },
		{ semester: 3, lecture: 12, lab: 8, practice: 4, srs: 24, project: 2, total: 50 },
		{ semester: 4, lecture: 12, lab: 8, practice: 4, srs: 24, project: 2, total: 50 },
	],
	assessmentForms: ['Экзамен', 'Зачет'],
	prerequisites: [],
	recommendedResources: [
		{ id: '1', type: 'Книга', title: 'Дискретная математика', author: 'Иванов И.И.', year: 2020 },
		{ id: '2', type: 'Учебник', title: 'Математическая логика', author: 'Петров П.П.', year: 2019 },
		{
			id: '3',
			type: 'Статья',
			title: 'Применение математики в программировании',
			author: 'Сидоров С.С.',
			year: 2021,
		},
	],
}
