import type { FC } from 'react'

import { useFieldArray, useFormContext } from 'react-hook-form'

import { ContactsCard, ResourceListCard } from '../components'
import type { RUPFormData } from './form-schema'

export const Step2: FC = () => {
	const form = useFormContext<RUPFormData>()

	const {
		fields: internetResourceFields,
		append: appendInternetResource,
		remove: removeInternetResource,
	} = useFieldArray({ control: form.control, name: 'internetResources' })
	const {
		fields: technicalResourceFields,
		append: appendTechnicalResource,
		remove: removeTechnicalResource,
	} = useFieldArray({ control: form.control, name: 'technicalResources' })

	return (
		<div className='w-full space-y-5'>
			<ContactsCard />

			<div className='grid md:grid-cols-2 gap-4'>
				{/* internet  */}
				<ResourceListCard
					append={appendInternetResource}
					buttonText='Добавить ресурс'
					control={form.control}
					description={
						<>
							Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
						</>
					}
					fields={internetResourceFields}
					label='Учебно-методический ресурсы'
					name='internetResources'
					placeholder='Откуда был взят материал для учебного плана'
					remove={removeInternetResource}
					title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
				/>

				{/* technical */}
				<ResourceListCard
					append={appendTechnicalResource}
					buttonText='Добавить материал'
					control={form.control}
					description='Введите список технических средств которые обязательны для учебного плана'
					fields={technicalResourceFields}
					label='Технические средства и материалы'
					name='technicalResources'
					placeholder='Что нужно при прохождении учебного плана'
					remove={removeTechnicalResource}
					title='Технические средства и материалы'
				/>
			</div>
		</div>
	)
}
