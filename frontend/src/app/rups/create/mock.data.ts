import { type IDiscipline, type IGroup, TopicTypeEnum } from '@types'

export const groupData: IGroup[] = [
	{
		id: 1234,
		name: 'Т24-1А',
		qualification: 'Техник сетевого и системного администрирования',
		specialty: '06120100 "Вычислительная техника и информационные сети" (по видам)',
	},
	{
		id: 123,
		name: 'Т22-4А',
		qualification: 'Техник сетевого и системного администрирования',
		specialty: '06120100 "Вычислительная техника и информационные сети" (по видам)',
	},
	{
		id: 135,
		name: 'Т22-2Б',
		qualification: 'Техник сетевого и системного администрирования',
		specialty: '06120100 "Вычислительная техника и информационные сети" (по видам)',
	},
	{
		id: 134,
		name: 'Т23-3Б',
		qualification: 'Техник сетевого и системного администрирования',
		specialty: '06120100 "Вычислительная техника и информационные сети" (по видам)',
	},
]

export const disciplineData: IDiscipline[] = [
	{
		code: 'РО5.6',
		name: 'Тестировка Postgresql',
		totalCredits: 6,
		topics: [
			{
				hours: 2,
				name: '',
				type: TopicTypeEnum.Theoretical,
			},
		],
		semesters: [
			{
				semester: 1,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 2,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 3,
				credits: 6,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 4,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 5,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 6,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 7,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 8,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
		],
	},
	{
		code: 'РО5.7',
		name: 'Практика Postgresql',
		totalCredits: 6,
		topics: [
			{
				hours: 2,
				name: '',
				type: TopicTypeEnum.Theoretical,
			},
		],
		semesters: [
			{
				semester: 1,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 2,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 3,
				credits: 3,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 4,
				credits: 3,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 5,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 6,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 7,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
			{
				semester: 8,
				credits: 0,
				theoryCredits: 0,
				practiceCredits: 0,
				individualCredits: 0,
			},
		],
	},
]
