import {
	type IGroup,
	type IRupModule,
	type IUser,
	RupModuleStatus,
	RupModuleTypeEnum,
	StudyFormEnum,
	TopicTypeEnum,
} from '@types'

const mockUser = {
	id: 'u1',
	email: 'teacher@example.com',
	firstName: 'John',
	lastName: 'Doe',
} as unknown as IUser

const mockUser2 = {
	id: 'u2',
	email: 'teacher@example.com',
	firstName: 'John',
	lastName: 'Doe',
} as unknown as IUser

const mockGroup = {
	id: 'g1',
	name: 'П25-1Г',
	qualification: 'Программное обеспечение',
	specialty: 'Программное обеспечение',
} as IGroup

export const mockRupModules: IRupModule[] = [
	{
		id: '1',
		status: RupModuleStatus.APPROVED,
		title: 'Web Development Fundamentals',
		studyForm: StudyFormEnum.FullTime,
		explorationNote: 'Comprehensive introduction to modern web technologies.',
		goals: 'To master HTML, CSS, and JavaScript basics.',
		prerequisites: 'Computer Science 101',
		postrequisites: 'Advanced Frontend Frameworks',
		internetResources: [{ value: 'https://developer.mozilla.org' }, { value: 'https://javascript.info' }],
		technicalResources: [{ value: 'VS Code' }, { value: 'Google Chrome' }],
		contacts: [mockUser],
		year: '2023-2024',
		type: RupModuleTypeEnum.THEORY,
		group: mockGroup,
		disciplines: [
			{
				name: 'Client-Side Scripting',
				code: 'WEB-101',
				totalHours: 90,
				semesters: [
					{
						semester: 1,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
				],
				topics: [
					{
						name: 'DOM Manipulation',
						type: TopicTypeEnum.Combined,
						totalHours: 10,
						theoryHours: 2,
						practiceHours: 4,
						individualHours: 4,
						SRSP: 2,
						SRS: 2,
					},
					{
						name: 'Event Handling',
						type: TopicTypeEnum.Practical,
						totalHours: 8,
						theoryHours: 1,
						practiceHours: 4,
						individualHours: 3,
						SRSP: 1,
						SRS: 1,
					},
				],
			},
		],
	},
	{
		id: '2',
		status: RupModuleStatus.DRAFT,
		title: 'Database Management Systems',
		studyForm: StudyFormEnum.Correspondence,
		explorationNote: 'Study of relational database design and SQL.',
		goals: 'Design and implement normalized databases.',
		prerequisites: 'Data Structures',
		postrequisites: 'Big Data Analytics',
		internetResources: [{ value: 'https://www.postgresql.org/docs/' }],
		technicalResources: [{ value: 'PostgreSQL Server' }],
		contacts: [mockUser],
		year: '2024-2025',
		type: RupModuleTypeEnum.THEORY,
		group: mockGroup,
		disciplines: [
			{
				name: 'SQL & Normalization',
				code: 'DB-201',
				totalHours: 60,
				semesters: [
					{
						semester: 2,
						totalHours: 60,
						theoryHours: 20,
						practiceHours: 20,
						individualHours: 20,
					},
				],
				topics: [
					{
						name: 'ER Diagrams',
						type: TopicTypeEnum.SNZ,
						totalHours: 6,
						theoryHours: 2,
						practiceHours: 0,
						individualHours: 4,
						SRSP: 1,
						SRS: 1,
					},
				],
			},
		],
	},
	{
		id: '3',
		status: RupModuleStatus.IN_REVIEW,
		title: 'Industrial Practice Internship',
		studyForm: StudyFormEnum.FullTime,
		explorationNote:
			'Ea deserunt illum. Assumenda nostrum quo. Non temporibus rerum fugit rerum. Reiciendis laudantium voluptas nostrum ratione. Voluptatum eos occaecati rerum ut. Sunt magnam maiores maiores corporis error dolor necessitatibus sit. Dolorem maxime enim quos dolor dolorem molestiae sunt. Magnam ea ut facilis consequatur nisi. Ea deserunt illum. Assumenda nostrum quo. Non temporibus rerum fugit rerum. Reiciendis laudantium voluptas nostrum ratione. Voluptatum eos occaecati rerum ut. Sunt magnam maiores maiores corporis error dolor necessitatibus sit. Dolorem maxime enim quos dolor dolorem molestiae sunt.',
		goals: 'Ea deserunt illum. Assumenda nostrum quo. Non temporibus rerum fugit rerum. Reiciendis laudantium voluptas nostrum ratione. Voluptatum eos occaecati rerum ut. Sunt magnam maiores maiores corporis error dolor necessitatibus sit. Dolorem maxime enim quos dolor dolorem molestiae sunt. Magnam ea ut facilis consequatur nisi.',
		prerequisites: 'Completion of 3rd Year',
		postrequisites: 'Diploma Thesis',
		internetResources: [
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
		],
		technicalResources: [
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
			{
				value: 'hic aliquam voluptatem',
			},
		],
		contacts: [mockUser, mockUser2],
		year: '2023-2024',
		type: RupModuleTypeEnum.PRACTICE,
		group: mockGroup,
		disciplines: [
			{
				name: 'Client-Side Scripting',
				code: 'WEB-101',
				totalHours: 90,
				semesters: [
					{
						semester: 1,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 2,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 3,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 4,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 5,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 6,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 7,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
					{
						semester: 8,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
				],
				topics: [
					{
						name: 'DOM Manipulation',
						type: TopicTypeEnum.Combined,
						totalHours: 10,
						theoryHours: 2,
						practiceHours: 4,
						individualHours: 4,
						SRSP: 2,
						SRS: 2,
					},
					{
						name: 'Event Handling',
						type: TopicTypeEnum.Practical,
						totalHours: 8,
						theoryHours: 1,
						practiceHours: 4,
						individualHours: 3,
						SRSP: 1,
						SRS: 1,
					},
				],
			},
		],
	},
	{
		id: '4',
		status: RupModuleStatus.REJECTED,
		title: 'Web Development Fundamentals',
		studyForm: StudyFormEnum.FullTime,
		explorationNote: 'Comprehensive introduction to modern web technologies.',
		goals: 'To master HTML, CSS, and JavaScript basics.',
		prerequisites: 'Computer Science 101',
		postrequisites: 'Advanced Frontend Frameworks',
		internetResources: [{ value: 'https://developer.mozilla.org' }, { value: 'https://javascript.info' }],
		technicalResources: [{ value: 'VS Code' }, { value: 'Google Chrome' }],
		contacts: [mockUser],
		year: '2023-2024',
		type: RupModuleTypeEnum.THEORY,
		group: mockGroup,
		disciplines: [
			{
				name: 'Client-Side Scripting',
				code: 'WEB-101',
				totalHours: 90,
				semesters: [
					{
						semester: 1,
						totalHours: 90,
						theoryHours: 30,
						practiceHours: 30,
						individualHours: 30,
					},
				],
				topics: [
					{
						name: 'DOM Manipulation',
						type: TopicTypeEnum.Combined,
						totalHours: 10,
						theoryHours: 2,
						practiceHours: 4,
						individualHours: 4,
						SRSP: 2,
						SRS: 2,
					},
					{
						name: 'Event Handling',
						type: TopicTypeEnum.Practical,
						totalHours: 8,
						theoryHours: 1,
						practiceHours: 4,
						individualHours: 3,
						SRSP: 1,
						SRS: 1,
					},
				],
			},
		],
	},
]
