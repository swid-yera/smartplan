import { useState } from 'react'

import { getLocaleText } from '@helpers'
import { getUILocaleSection } from '@helpers'
import { NumericInput } from '@components'
import { services } from '@services'
import { Checkbox, Label, Textarea } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IGenerateDisciplines, Locale, LocaleText, TopicTypeEnum } from '@types'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { DisciplineEdit, GenerateCard } from '../components'
import localeDictionary from './locale.json'

type IProps = FieldValues & {
	name: LocaleText
	course: number
	goals: LocaleText
	competencies: LocaleText
	disciplines: {
		name: LocaleText
		semesters: { semester: number; totalHours: number }[]
		topics: {
			name: LocaleText
			type: TopicTypeEnum
			theoryHours: number
			practiceHours: number
			individualHours?: number
			srspHours?: number
			srsHours?: number
		}[]
	}[]
}

export function Step3<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).step3
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [wantsHours, setWantsHours] = useState<number | undefined>(undefined)
	const [disciplineCount, setDisciplineCount] = useState<number | undefined>(undefined)
	const [additionalMessage, setAdditionalMessage] = useState('')
	const [includeCurrentContent, setIncludeCurrentContent] = useState(true)
	const mapGeneratedText = (value: string): LocaleText =>
		activeLocale === 'ru' ? { ru: value.trim(), kz: '' } : { ru: '', kz: value.trim() }

	const handleGenerate = async () => {
		if (isLoading) return
		if (activeLocale !== 'ru') {
			toast.error(t.aiRuOnly)
			return
		}
		if (!disciplineCount || !wantsHours) {
			return toast.error(t.validationError)
		}

		try {
			setIsLoading(true)
			toast.loading(t.disciplinesLoading, { id: 'rup-disciplines-generate' })

			const values = getValues()

			const mappedData: IGenerateDisciplines = {
				name: getLocaleText(values.name, 'ru'),
				course: values.course,
				goals: getLocaleText(values.goals, 'ru'),
				competencies: getLocaleText(values.competencies, 'ru'),

				wantsHours: wantsHours,
				disciplineCount: disciplineCount,
				message: additionalMessage.trim() || undefined,
				includeCurrentContent,
				currentValues: includeCurrentContent
					? {
							disciplines: values.disciplines.map((discipline) => ({
								name: getLocaleText(discipline.name, 'ru'),
								semesters: discipline.semesters,
								topics: discipline.topics.map((topic) => ({
									...topic,
									name: getLocaleText(topic.name, 'ru'),
								})),
							})),
						}
					: undefined,
			}

			const generatedDisciplines = await services.ai.generateDisciplines(mappedData)
			const localizedDisciplines = generatedDisciplines.map((discipline) => ({
				...discipline,
				name: mapGeneratedText(discipline.name),
				topics: discipline.topics.map((topic) => ({
					...topic,
					name: mapGeneratedText(topic.name),
				})),
			}))

			// write
			setValue('disciplines' as Path<T>, localizedDisciplines as PathValue<T, Path<T>>, { shouldDirty: true })
			toast.success(t.disciplinesSuccess, { id: 'rup-disciplines-generate' })
		} catch (err) {
			toast.error(`${t.disciplinesError}: ${err}`, { id: 'rup-disciplines-generate' })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<GenerateCard
				buttonText={isLoading ? t.generatingButton : t.generateButton}
				confirmContent={
					<div className='grid gap-4'>
						<div className='flex flex-col gap-2'>
							<Label>{t.totalHoursLabel}</Label>
							<NumericInput
								min={0}
								placeholder={t.totalHoursPlaceholder}
								step={24}
								value={wantsHours ?? ''}
								onChange={(value) => setWantsHours(Number(value))}
							/>
						</div>

						<div className='flex flex-col gap-2'>
							<Label>{t.disciplineCountLabel}</Label>
							<NumericInput
								min={0}
								placeholder={t.disciplineCountPlaceholder}
								value={disciplineCount ?? ''}
								onChange={(value) => setDisciplineCount(Number(value))}
							/>
						</div>

						<div className='flex flex-col gap-2'>
							<Label htmlFor='rup-disciplines-additional-message'>{t.additionalMessageLabel}</Label>
							<Textarea
								id='rup-disciplines-additional-message'
								placeholder={t.additionalMessagePlaceholder}
								rows={4}
								value={additionalMessage}
								onChange={(event) => setAdditionalMessage(event.target.value)}
							/>
						</div>

						<div className='flex items-center gap-2'>
							<Checkbox
								checked={includeCurrentContent}
								id='rup-disciplines-include-current-content'
								onCheckedChange={(checked) => setIncludeCurrentContent(checked === true)}
							/>
							<Label htmlFor='rup-disciplines-include-current-content'>
								{t.includeCurrentContent}
							</Label>
						</div>
					</div>
				}
				description={t.generateDescription}
				disabled={isLoading}
				disabledReason={t.generateDisabledReason}
				title={t.generateTitle}
				onClick={() => handleGenerate()}
			/>

			<DisciplineEdit activeLocale={activeLocale} />
		</div>
	)
}
