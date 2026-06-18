import { useState } from 'react'

import { getLocaleText, getTotalDisciplineHours, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import type { IGenerateTopicsForDiscipline, Locale, LocaleText, RupTypeEnum, TopicTypeEnum } from '@types'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { type TopicsDisciplineGenerateOptions, TopicsEdit } from '../components'
import localeDictionary from './locale.json'

type Topic = {
	name: LocaleText
	type: TopicTypeEnum
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: LocaleText
	type: RupTypeEnum
	semesters: Semester[]
	topics: Topic[]
}

type IProps = FieldValues & {
	name: LocaleText
	type: RupTypeEnum
	goals: LocaleText
	competencies: LocaleText

	disciplines: Discipline[]
}

export function Step4<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).step4
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [generatingDisciplineIndex, setGeneratingDisciplineIndex] = useState<number | null>(null)
	const mapGeneratedText = (value: string): LocaleText =>
		activeLocale === 'ru' ? { ru: getLocaleText(value, 'ru'), kz: '' } : { ru: '', kz: getLocaleText(value, 'kk') }

	const buildMappedData = (
		discipline: Discipline,
		options?: TopicsDisciplineGenerateOptions,
	): IGenerateTopicsForDiscipline => {
		const values = getValues()
		const includeCurrentContent = options?.includeCurrentContent ?? false
		const additionalMessage = options?.additionalMessage?.trim()

		return {
			sourceLanguage: activeLocale,
			rupName: getLocaleText(values.name, activeLocale),
			rupType: values.type,
			disciplineType: discipline.type,
			goals: getLocaleText(values.goals, activeLocale),
			competencies: getLocaleText(values.competencies, activeLocale),

			disciplineName: getLocaleText(discipline.name, activeLocale),
			disciplineHours: getTotalDisciplineHours(discipline.semesters),

			additionalMessage: additionalMessage ? additionalMessage : undefined,
			includeCurrentContent,
			currentValues: includeCurrentContent
				? {
						topics: discipline.topics.map((topic) => ({
							...topic,
							name: getLocaleText(topic.name, activeLocale),
						})),
					}
				: undefined,
			currentTopics: includeCurrentContent
				? discipline.topics.map((topic) => ({
						...topic,
						name: getLocaleText(topic.name, activeLocale),
					}))
				: undefined,

			preferredCombinedCount: options?.preferredCombinedCount,
			preferredPracticalCount: options?.preferredPracticalCount,
			preferredSnzCount: options?.preferredSnzCount,
			preferredSrspCount: options?.preferredSrspCount,
		}
	}

	const generateOneDiscipline = async (disciplineIndex: number, options?: TopicsDisciplineGenerateOptions) => {
		const values = getValues()
		const discipline = values.disciplines?.[disciplineIndex]

		if (!discipline) {
			throw new Error(t.disciplineNotFound)
		}

		const mappedData = buildMappedData(discipline, options)
		const result = await services.ai.generateTopicsForDiscipline(mappedData)
		const localizedTopics = result.map((topic) => ({
			...topic,
			name: mapGeneratedText(topic.name),
		}))

		setValue(`disciplines.${disciplineIndex}.topics` as Path<T>, localizedTopics as PathValue<T, Path<T>>)

		return getLocaleText(discipline.name, activeLocale)
	}

	const handleGenerateDiscipline = async (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => {
		if (generatingDisciplineIndex !== null) return

		const discipline = getValues().disciplines?.[disciplineIndex]

		if (!discipline) {
			toast.error(t.disciplineNotFound)

			return
		}

		const disciplineLabel = getLocaleText(discipline.name, activeLocale)
		const toastId = `rup-topics-generate-${disciplineLabel}-${disciplineIndex}`

		try {
			setGeneratingDisciplineIndex(disciplineIndex)
			toast.loading(interpolateUILocaleText(t.topicsLoading, { name: disciplineLabel }), { id: toastId })

			const disciplineName = await generateOneDiscipline(disciplineIndex, options)

			toast.success(interpolateUILocaleText(t.topicsSuccess, { name: disciplineName }), {
				id: toastId,
			})
		} catch (err) {
			toast.error(interpolateUILocaleText(t.topicsError, { error: String(err), name: disciplineLabel }), {
				id: toastId,
			})
		} finally {
			setGeneratingDisciplineIndex(null)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<TopicsEdit
				activeLocale={activeLocale}
				generatingDisciplineIndex={generatingDisciplineIndex}
				onGenerateDiscipline={handleGenerateDiscipline}
			/>
		</div>
	)
}
