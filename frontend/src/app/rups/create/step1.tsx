import { useState } from 'react'

import { getLocaleText, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Checkbox, Label, Textarea } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { type IGenerateRupMeta, type Locale, type LocaleText, RupTypeEnum, StudyFormEnum } from '@types'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { BasicEdit, GenerateCard, GroupEdit, NoteEdit } from '../components'
import localeDictionary from './locale.json'

type IProps = FieldValues & {
	name: LocaleText
	type: RupTypeEnum
	studyForm: StudyFormEnum
	prerequisites: LocaleText
	postrequisites: LocaleText
	studyYear: string
	course: number
	groupId: string

	basis: LocaleText
	goals: LocaleText
	competencies: LocaleText
}

export function Step1<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).step1
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [isLoading, setIsLoading] = useState(false)
	const [additionalMessage, setAdditionalMessage] = useState('')
	const [includeCurrentContent, setIncludeCurrentContent] = useState(true)
	// query
	const { data: groupsData = [], isLoading: groupLoading } = useQuery({
		...services.group.getAllOptions(),
		enabled: true,
	})
	const mapGeneratedText = (value: string): LocaleText =>
		activeLocale === 'ru' ? { ru: value.trim(), kz: '' } : { ru: '', kz: value.trim() }

	const handleGenerate = async () => {
		if (isLoading || groupLoading) return

		try {
			setIsLoading(true)
			toast.loading(t.metaLoading, { id: 'rup-meta-generate' })

			const values = getValues()
			const group = groupsData.find((g) => g.keycloakId === values.groupId)

			if (!group) throw new Error('Group not found')

			const mappedData: IGenerateRupMeta = {
				sourceLanguage: activeLocale,
				name: getLocaleText(values.name, activeLocale),
				course: values.course,
				group: {
					name: group.name,
					specialty: getLocaleText(group.specialty, activeLocale),
					qualification: getLocaleText(group.qualification, activeLocale),
				},
				prerequisites: getLocaleText(values.prerequisites, activeLocale),
				postrequisites: getLocaleText(values.postrequisites, activeLocale),
				type: values.type,
				studyForm: values.studyForm,
				studyYear: values.studyYear,
				message: additionalMessage.trim() || undefined,
				includeCurrentContent,
				currentValues: includeCurrentContent
					? {
							description: getLocaleText(values.basis, activeLocale),
							goals: getLocaleText(values.goals, activeLocale),
							competence: getLocaleText(values.competencies, activeLocale),
							basis: getLocaleText(values.basis, activeLocale),
							competencies: getLocaleText(values.competencies, activeLocale),
						}
					: undefined,
			}

			const meta = await services.ai.generateRupMeta(mappedData)

			// write
			setValue(
				'basis' as Path<T>,
				mapGeneratedText(meta.basis) as PathValue<T, Path<T>>,
				{ shouldDirty: true },
			)
			setValue(
				'goals' as Path<T>,
				mapGeneratedText(meta.goals) as PathValue<T, Path<T>>,
				{ shouldDirty: true },
			)
			setValue(
				'competencies' as Path<T>,
				mapGeneratedText(meta.competencies) as PathValue<T, Path<T>>,
				{ shouldDirty: true },
			)

			toast.success(t.metaSuccess, { id: 'rup-meta-generate' })
		} catch (err) {
			toast.error(`${t.metaError}: ${err}`, { id: 'rup-meta-generate' })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<div className='grid gap-4 xl:grid-cols-2'>
				<BasicEdit activeLocale={activeLocale} />
				<GroupEdit />
			</div>

			<GenerateCard
				buttonText={isLoading ? t.generatingButton : t.generateButton}
				confirmContent={
					<div className='grid gap-4'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='rup-meta-additional-message'>{t.additionalMessageLabel}</Label>
							<Textarea
								id='rup-meta-additional-message'
								placeholder={t.additionalMessagePlaceholder}
								rows={4}
								value={additionalMessage}
								onChange={(event) => setAdditionalMessage(event.target.value)}
							/>
						</div>

						<div className='flex items-center gap-2'>
							<Checkbox
								checked={includeCurrentContent}
								id='rup-meta-include-current-content'
								onCheckedChange={(checked) => setIncludeCurrentContent(checked === true)}
							/>
							<Label htmlFor='rup-meta-include-current-content'>{t.includeCurrentContent}</Label>
						</div>
					</div>
				}
				description={t.generateDescription}
				disabled={isLoading || groupLoading}
				disabledReason={t.generateDisabledReason}
				title={t.generateTitle}
				onClick={() => handleGenerate()}
			/>

			<NoteEdit
				activeLocale={activeLocale}
				description={t.basisDescription}
				label={t.basisLabel}
				name='basis'
				placeholder={t.basisPlaceholder}
				rows={8}
				title={t.basisTitle}
			/>

			<div className='grid gap-4 xl:grid-cols-2'>
				<NoteEdit
					activeLocale={activeLocale}
					description={t.goalsDescription}
					label={t.goalsLabel}
					name='goals'
					placeholder={t.goalsPlaceholder}
					title={t.goalsTitle}
				/>
				<NoteEdit
					activeLocale={activeLocale}
					description={t.competenciesDescription}
					label={t.competenciesLabel}
					name='competencies'
					placeholder={t.competenciesPlaceholder}
					title={t.competenciesTitle}
				/>
			</div>
		</div>
	)
}
