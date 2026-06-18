import { useCallback, useMemo, useRef, useState } from 'react'

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
	durationHours?: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: LocaleText
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
	const step4Text = useMemo(() => getUILocaleSection(localeDictionary, locale).step4, [locale])
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [generatingDisciplineIndex, setGeneratingDisciplineIndex] = useState<number | null>(null)
	const generationLockRef = useRef<number | null>(null)

	const mapGeneratedText = useCallback(
		(value: string): LocaleText =>
			activeLocale === 'ru'
				? { ru: getLocaleText(value, 'ru'), kz: '' }
				: { ru: '', kz: getLocaleText(value, 'kk') },
		[activeLocale],
	)

	const buildMappedData = useCallback(
		(discipline: Discipline, options?: TopicsDisciplineGenerateOptions): IGenerateTopicsForDiscipline => {
			const values = getValues()
			const includeCurrentContent = options?.includeCurrentContent ?? false
			const additionalMessage = options?.additionalMessage?.trim()
			const currentTopics = includeCurrentContent
				? discipline.topics.map((topic) => ({
						...topic,
						name: getLocaleText(topic.name, activeLocale),
					}))
				: undefined

			return {
				sourceLanguage: activeLocale,
				rupName: getLocaleText(values.name, activeLocale),
				rupType: values.type,
				goals: getLocaleText(values.goals, activeLocale),
				competencies: getLocaleText(values.competencies, activeLocale),

				disciplineName: getLocaleText(discipline.name, activeLocale),
				disciplineHours: getTotalDisciplineHours(discipline.semesters),

				additionalMessage: additionalMessage ? additionalMessage : undefined,
				includeCurrentContent,
				currentTopics,
				currentValues: currentTopics ? { topics: currentTopics } : undefined,

				preferredCombinedCount: options?.preferredCombinedCount,
				preferredPracticalCount: options?.preferredPracticalCount,
				preferredSnzCount: options?.preferredSnzCount,
				preferredSrspCount: options?.preferredSrspCount,
			}
		},
		[activeLocale, getValues],
	)

	const generateOneDiscipline = useCallback(
		async (disciplineIndex: number, options?: TopicsDisciplineGenerateOptions) => {
			const values = getValues()
			const discipline = values.disciplines?.[disciplineIndex]

			if (!discipline) {
				throw new Error(step4Text.disciplineNotFound)
			}

			const mappedData = buildMappedData(discipline, options)
			const result = await services.ai.generateTopicsForDiscipline(mappedData)
			const localizedTopics = result.map((topic) => ({
				...topic,
				name: mapGeneratedText(topic.name),
			}))

			setValue(`disciplines.${disciplineIndex}.topics` as Path<T>, localizedTopics as PathValue<T, Path<T>>)

			return getLocaleText(discipline.name, activeLocale)
		},
		[activeLocale, buildMappedData, getValues, mapGeneratedText, setValue, step4Text.disciplineNotFound],
	)

	const handleGenerateDiscipline = useCallback(
		async (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => {
			if (generationLockRef.current !== null) return

			const discipline = getValues().disciplines?.[disciplineIndex]

			if (!discipline) {
				toast.error(step4Text.disciplineNotFound)

				return
			}

			const disciplineLabel = getLocaleText(discipline.name, activeLocale)
			const toastId = `rup-topics-generate-${disciplineLabel}-${disciplineIndex}`

			try {
				generationLockRef.current = disciplineIndex
				setGeneratingDisciplineIndex(disciplineIndex)
				toast.loading(interpolateUILocaleText(step4Text.topicsLoading, { name: disciplineLabel }), { id: toastId })

				const disciplineName = await generateOneDiscipline(disciplineIndex, options)

				toast.success(interpolateUILocaleText(step4Text.topicsSuccess, { name: disciplineName }), {
					id: toastId,
				})
			} catch (err) {
				toast.error(interpolateUILocaleText(step4Text.topicsError, { error: String(err), name: disciplineLabel }), {
					id: toastId,
				})
			} finally {
				generationLockRef.current = null
				setGeneratingDisciplineIndex(null)
			}
		},
		[
			activeLocale,
			generateOneDiscipline,
			getValues,
			step4Text.disciplineNotFound,
			step4Text.topicsError,
			step4Text.topicsLoading,
			step4Text.topicsSuccess,
		],
	)

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
