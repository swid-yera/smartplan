import { useState } from 'react'

import type { RupTypeEnum, TopicTypeEnum } from '@types'
import { type FieldValues, useFormContext } from 'react-hook-form'

import { GenerateCard, TopicsEdit } from '../components'

type Topic = {
	name: string
	type: TopicTypeEnum
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: string
	semesters: Semester[]
	topics: Topic[]
}

type IProps = FieldValues & {
	name: string
	type: RupTypeEnum
	goals: string
	competencies: string

	disciplines: Discipline[]
}

export function Step4<T extends IProps>() {
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [isLoading, setIsLoading] = useState(false)

	// const handleGenerate = async () => {
	// 	if (isLoading) return
	// 	if (disciplineCount === 0 || wantsHours === 0) {
	// 		return toast.error('заполните общее количество часов модуля и количество дисциплин')
	// 	}

	// 	try {
	// 		setIsLoading(true)

	// 		const values = getValues()

	// 		const mappedData: IGenerateDisciplines = {
	// 			name: values.name,
	// 			course: values.course,
	// 			goals: values.goals,
	// 			competencies: values.competencies,

	// 			wantsHours: wantsHours,
	// 			disciplineCount: disciplineCount,
	// 		}

	// 		const generatedDisciplines = await generateDisciplines(mappedData)

	// 		// write
	// 		setValue('disciplines' as Path<T>, generatedDisciplines, { shouldDirty: true })
	// 	} finally {
	// 		setIsLoading(false)
	// 	}
	// }

	return (
		<div className='w-full space-y-5'>
			<GenerateCard
				buttonText={isLoading ? 'Генерация…' : 'Сгенерировать'}
				description='Текст и часы будут сформированы на основе базовых данных модуля и описания модуля. Заполните общее количество часов модуля (например 288) и количество дисциплин (например 3), после Искусственный Интеллект распределит часы (288) на дисциплины (3). После генерации вы сможете отредактировать их вручную.'
				disabled={isLoading}
				disabledReason='Заполните данные модуля, описание и общее количество часов модуля'
				title='Автоматическая генерация дисциплин'
				onClick={() => handleGenerate()}
			/>

			<TopicsEdit />
		</div>
	)
}
