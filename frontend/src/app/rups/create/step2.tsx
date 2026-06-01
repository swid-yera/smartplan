import { useState } from 'react'

import { getLocaleText } from '@helpers'
import { getUILocaleSection } from '@helpers'
import { Loader } from '@components'
import { services } from '@services'
import { Checkbox, Label, Textarea } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { IGenerateResources, Locale, LocaleText } from '@types'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { ContactsEdit, GenerateCard, ResourceEdit } from '../components'
import localeDictionary from './locale.json'

type ResourcesType = {
	name: LocaleText
	link?: string
}

type IProps = FieldValues & {
	name: LocaleText
	prerequisites: LocaleText
	postrequisites: LocaleText

	basis: LocaleText
	goals: LocaleText
	competencies: LocaleText

	internetResources: ResourcesType[]
	technicalResources: ResourcesType[]
}

export function Step2<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	// store, form
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).step2
	const { authLoading, user } = useAuthStore()
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [isLoading, setIsLoading] = useState(false)
	const [additionalMessage, setAdditionalMessage] = useState('')
	const [includeCurrentContent, setIncludeCurrentContent] = useState(true)

	const { data: teachersData, isLoading: teacherLoading } = useQuery({
		...services.user.getAllOptions({ currentPage: 1, pageSize: 100, search: '' }),
		enabled: true,
	})
	const mapGeneratedText = (value: string): LocaleText =>
		activeLocale === 'ru' ? { ru: value.trim(), kz: '' } : { ru: '', kz: value.trim() }

	const handleGenerate = async () => {
		if (isLoading || teacherLoading) return

		try {
			setIsLoading(true)
			toast.loading(t.resourcesLoading, { id: 'rup-resource-generate' })

			const values = getValues()

			const mappedData: IGenerateResources = {
				sourceLanguage: activeLocale,
				name: getLocaleText(values.name, activeLocale),
				prerequisites: getLocaleText(values.prerequisites, activeLocale),
				postrequisites: getLocaleText(values.postrequisites, activeLocale),

				basic: getLocaleText(values.basis, activeLocale),
				goals: getLocaleText(values.goals, activeLocale),
				competencies: getLocaleText(values.competencies, activeLocale),
				message: additionalMessage.trim() || undefined,
				includeCurrentContent,
				currentValues: includeCurrentContent
					? {
							internetResources: values.internetResources.map((resource) => ({
								name: getLocaleText(resource.name, activeLocale),
								link: resource.link,
							})),
							technicalResources: values.technicalResources.map((resource) => ({
								name: getLocaleText(resource.name, activeLocale),
								link: resource.link,
							})),
						}
					: undefined,
			}

			const resources = await services.ai.generateResources(mappedData)
			const mappedInternetResources = resources.internetResources.map((resource) => ({
				...resource,
				name: mapGeneratedText(resource.name),
			}))
			const mappedTechnicalResources = resources.technicalResources.map((resource) => ({
				...resource,
				name: mapGeneratedText(resource.name),
			}))

			// write
			setValue('internetResources' as Path<T>, mappedInternetResources as PathValue<T, Path<T>>, {
				shouldDirty: true,
			})
			setValue('technicalResources' as Path<T>, mappedTechnicalResources as PathValue<T, Path<T>>, {
				shouldDirty: true,
			})
			toast.success(t.resourcesSuccess, { id: 'rup-resource-generate' })
		} catch (err) {
			toast.error(`${t.resourcesError}: ${err}`, { id: 'rup-resource-generate' })
		} finally {
			setIsLoading(false)
		}
	}

	if (authLoading || !user) return <Loader type='data' />

	return (
		<div className='w-full space-y-5'>
			<ContactsEdit creatorId={user.keycloakId} teachersData={teachersData?.data || []} />

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
				disabled={isLoading || teacherLoading}
				disabledReason={t.generateDisabledReason}
				title={t.generateTitle}
				onClick={() => handleGenerate()}
			/>

			{isLoading ? (
				<Loader type='ai' />
			) : (
				<div className='grid xl:grid-cols-2 gap-4'>
					{/* internet  */}
					<ResourceEdit
						activeLocale={activeLocale}
						buttonText={t.internetButton}
						description={t.internetDescription}
						label={t.internetLabel}
						name='internetResources'
						placeholder={t.internetPlaceholder}
						title={t.internetTitle}
					/>

					{/* technical */}
					<ResourceEdit
						activeLocale={activeLocale}
						buttonText={t.technicalButton}
						description={t.technicalDescription}
						label={t.technicalLabel}
						name='technicalResources'
						placeholder={t.technicalPlaceholder}
						title={t.technicalTitle}
					/>
				</div>
			)}
		</div>
	)
}
