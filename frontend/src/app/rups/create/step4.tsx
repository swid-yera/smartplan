import { useState } from 'react'

import { getTotalDisciplineHours } from '@helpers'
import { services } from '@services'
import type { IGenerateTopicsForDiscipline, RupTypeEnum, TopicTypeEnum } from '@types'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { type TopicsDisciplineGenerateOptions, TopicsEdit } from '../components'

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
	const [generatingDisciplineIndex, setGeneratingDisciplineIndex] = useState<number | null>(null)

	const buildMappedData = (
		discipline: Discipline,
		options?: TopicsDisciplineGenerateOptions,
	): IGenerateTopicsForDiscipline => {
		const values = getValues()
		const includeCurrentContent = options?.includeCurrentContent ?? false
		const additionalMessage = options?.additionalMessage?.trim()

		return {
			rupName: values.name,
			rupType: values.type,
			goals: values.goals,
			competencies: values.competencies,

			disciplineName: discipline.name,
			disciplineHours: getTotalDisciplineHours(discipline.semesters),

			additionalMessage: additionalMessage ? additionalMessage : undefined,
			includeCurrentContent,
			currentValues: includeCurrentContent ? { topics: discipline.topics } : undefined,
			currentTopics: includeCurrentContent ? discipline.topics : undefined,

			preferredCombinedCount: options?.preferredCombinedCount,
			preferredPracticalCount: options?.preferredPracticalCount,
			preferredSnzCount: options?.preferredSnzCount,
		}
	}

	const generateOneDiscipline = async (disciplineIndex: number, options?: TopicsDisciplineGenerateOptions) => {
		const values = getValues()
		const discipline = values.disciplines?.[disciplineIndex]

		if (!discipline) {
			throw new Error('Дисциплина не найдена')
		}

		const mappedData = buildMappedData(discipline, options)
		const result = await services.ai.generateTopicsForDiscipline(mappedData)

		setValue(`disciplines.${disciplineIndex}.topics` as Path<T>, result as PathValue<T, Path<T>>)

		return discipline.name
	}

	const handleGenerateDiscipline = async (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => {
		if (generatingDisciplineIndex !== null) return

		const discipline = getValues().disciplines?.[disciplineIndex]

		if (!discipline) {
			toast.error('Дисциплина не найдена')

			return
		}

		const toastId = `rup-topics-generate-${discipline.name}-${disciplineIndex}`

		try {
			setGeneratingDisciplineIndex(disciplineIndex)
			toast.loading(`Генерация тем занятий для ${discipline.name}`, { id: toastId })

			const disciplineName = await generateOneDiscipline(disciplineIndex, options)

			toast.success(`Успешно сгенерировано тем занятий для ${disciplineName}`, {
				id: toastId,
			})
		} catch (err) {
			toast.error(`Ошибка при генерации тем для ${discipline.name}: ${err}`, { id: toastId })
		} finally {
			setGeneratingDisciplineIndex(null)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<TopicsEdit
				generatingDisciplineIndex={generatingDisciplineIndex}
				onGenerateDiscipline={handleGenerateDiscipline}
			/>
		</div>
	)
}
