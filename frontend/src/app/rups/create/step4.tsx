import { useState } from 'react'

import { type IGenerateTopicsForDiscipline, generateTopicsForDiscipline } from '@actions'
import { getTotalDisciplineHours } from '@helpers'
import type { RupTypeEnum, TopicTypeEnum } from '@types'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

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

	const handleGenerate = async () => {
		if (isLoading) return

		try {
			setIsLoading(true)

			const values = getValues()

			for (let i = 0; i < values.disciplines.length; i++) {
				const currentDiscipline = values.disciplines[i]

				const mappedData: IGenerateTopicsForDiscipline = {
					rupName: values.name,
					rupType: values.type,
					goals: values.goals,
					competencies: values.competencies,

					disciplineName: currentDiscipline.name,
					disciplineHours: getTotalDisciplineHours(currentDiscipline.semesters),
				}

				try {
					const result = await generateTopicsForDiscipline(mappedData)

					setValue(`disciplines.${i}.topics` as Path<T>, result)
				} catch (error) {
					console.error(`Ошибка при генерации тем для ${currentDiscipline.name}:`, error)
					toast.error(`Ошибка при генерации тем для ${currentDiscipline.name}:`)
				}
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<GenerateCard
				buttonText={isLoading ? 'Генерация…' : 'Сгенерировать'}
				description='Текст и часы будут сформированы на основе базовых данных модуля, называния и часов дисциплины. После генерации вы сможете отредактировать их вручную.'
				disabled={isLoading}
				disabledReason='Заполните данные модуля и дисциплины'
				title='Автоматическая генерация тем занятий'
				onClick={() => handleGenerate()}
			/>

			<TopicsEdit />
		</div>
	)
}
