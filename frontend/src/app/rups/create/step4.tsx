import { useState } from 'react'

import { type IGenerateTopicsForDiscipline, generateTopicsForDiscipline } from '@actions'
import { getTotalDisciplineHours } from '@helpers'
import type { RupTypeEnum, TopicTypeEnum } from '@types'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { GenerateCard, type TopicsDisciplineGenerateOptions, TopicsEdit } from '../components'

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
		const result = await generateTopicsForDiscipline(mappedData)

		setValue(`disciplines.${disciplineIndex}.topics` as Path<T>, result)

		return discipline.name
	}

	const handleGenerate = async () => {
		if (isLoading || generatingDisciplineIndex !== null) return

		try {
			setIsLoading(true)
			toast.info('Генерируется результаты темы занятий', { id: 'rup-topics-generate' })

			const values = getValues()

			if (!values.disciplines || values.disciplines.length == 0) {
				return toast.error('Заполните результаты обучения', { id: 'rup-topics-generate' })
			}

			for (let i = 0; i < values.disciplines.length; i++) {
				const currentDiscipline = values.disciplines[i]

				try {
					toast.loading(`Генерация тем занятий для ${currentDiscipline.name}`, {
						id: `rup-topics-generate-${currentDiscipline.name}`,
					})

					await generateOneDiscipline(i)
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

	const handleGenerateDiscipline = async (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => {
		if (isLoading || generatingDisciplineIndex !== null) return

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
			<GenerateCard
				buttonText={isLoading ? 'Генерация…' : 'Сгенерировать все'}
				description='Текст и часы будут сформированы на основе базовых данных модуля, называния и часов дисциплины. После генерации вы сможете отредактировать их вручную.'
				disabled={isLoading || generatingDisciplineIndex !== null}
				disabledReason='Заполните данные модуля и дисциплины'
				title='Автоматическая генерация тем занятий'
				onClick={() => handleGenerate()}
			/>

			<TopicsEdit
				generatingDisciplineIndex={generatingDisciplineIndex}
				isGeneratingAll={isLoading}
				onGenerateDiscipline={handleGenerateDiscipline}
			/>
		</div>
	)
}
