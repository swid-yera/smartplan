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
			toast.info('Генерируется результаты темы занятий', { id: 'rup-topics-generate' })

			const values = getValues()

			if (!values.disciplines || values.disciplines.length == 0) {
				return toast.error('Заполните результаты обучения', { id: 'rup-topics-generate' })
			}

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
					toast.loading(`Генерация тем занятий для ${currentDiscipline.name}`, {
						id: `rup-topics-generate-${currentDiscipline.name}`,
					})

					const result = await generateTopicsForDiscipline(mappedData)

					setValue(`disciplines.${i}.topics` as Path<T>, result)
					toast.success(`Успешно сгенерировано тем занятий для ${currentDiscipline.name}`, {
						id: `rup-topics-generate-${currentDiscipline.name}`,
					})
				} catch (err) {
					toast.error(`Ошибка при генерации тем для ${currentDiscipline.name}: ${err}`, {
						id: `rup-topics-generate-${currentDiscipline.name}`,
					})
				}
			}
		} catch (err) {
			toast.error(`Ошибка при генерации тем занятий ${err}`, { id: 'rup-topics-generate' })
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
