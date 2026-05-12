import { useState } from 'react'

import { type IGenerateResources, generateResources } from '@actions'
import { Loader } from '@components'
import { services } from '@services'
import { Checkbox, Label, Textarea } from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { ContactsEdit, GenerateCard, ResourceEdit } from '../components'

type ResourcesType = {
	name: string
	link?: string
}

type IProps = FieldValues & {
	name: string
	prerequisites: string
	postrequisites: string

	basis: string
	goals: string
	competencies: string

	internetResources: ResourcesType[]
	technicalResources: ResourcesType[]
}

export function Step2<T extends IProps>() {
	// store, form
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

	const handleGenerate = async () => {
		if (isLoading || teacherLoading) return

		try {
			setIsLoading(true)
			toast.loading('Генерируется ресурсы', { id: 'rup-resource-generate' })

			const values = getValues()

			const mappedData: IGenerateResources = {
				name: values.name,
				prerequisites: values.prerequisites,
				postrequisites: values.postrequisites,

				basic: values.basis,
				goals: values.goals,
				competencies: values.competencies,
				message: additionalMessage.trim() || undefined,
				includeCurrentContent,
				currentValues: includeCurrentContent
					? {
							internetResources: values.internetResources,
							technicalResources: values.technicalResources,
						}
					: undefined,
			}

			const resources = await generateResources(mappedData)

			// write
			setValue('internetResources' as Path<T>, resources.internetResources, { shouldDirty: true })
			setValue('technicalResources' as Path<T>, resources.technicalResources, { shouldDirty: true })
			toast.success('Успешно сгенерировано ресурсы', { id: 'rup-resource-generate' })
		} catch (err) {
			toast.error(`Ошибка при генерации ресурсов ${err}`, { id: 'rup-resource-generate' })
		} finally {
			setIsLoading(false)
		}
	}

	if (authLoading || !user) return <Loader type='data' />

	return (
		<div className='w-full space-y-5'>
			<ContactsEdit creatorId={user.keycloakId} teachersData={teachersData?.data || []} />

			<GenerateCard
				buttonText={isLoading ? 'Генерация…' : 'Сгенерировать'}
				confirmContent={
					<div className='grid gap-4'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='rup-meta-additional-message'>Дополнительное сообщение</Label>
							<Textarea
								id='rup-meta-additional-message'
								placeholder='Уточните, что нужно учесть при генерации'
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
							<Label htmlFor='rup-meta-include-current-content'>Включить текущий написанный контент</Label>
						</div>
					</div>
				}
				description='Тексты будут сформированы на основе базовых данных модуля и описания модуля. После генерации вы сможете отредактировать их вручную.'
				disabled={isLoading || teacherLoading}
				disabledReason='Заполните данные модуля и описание'
				title='Автоматическая генерация ресурсов'
				onClick={() => handleGenerate()}
			/>

			{isLoading ? (
				<Loader type='ai' />
			) : (
				<div className='grid xl:grid-cols-2 gap-4'>
					{/* internet  */}
					<ResourceEdit
						buttonText='Добавить ресурс'
						description={
							<>
								Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
							</>
						}
						label='Учебно-методический ресурсы'
						name='internetResources'
						placeholder='Откуда был взят материал для учебной программы'
						title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
					/>

					{/* technical */}
					<ResourceEdit
						buttonText='Добавить материал'
						description='Введите список технических средств которые обязательны для учебного программы'
						label='Технические средства и материалы'
						name='technicalResources'
						placeholder='Что нужно при прохождении учебного программы'
						title='Технические средства и материалы'
					/>
				</div>
			)}
		</div>
	)
}
