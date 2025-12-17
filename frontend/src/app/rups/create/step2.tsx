import type { FC } from 'react'

import { ContactsCard, ResourceListCard } from '../components'

export const Step2: FC = () => {
	return (
		<div className='w-full space-y-5'>
			<ContactsCard />

			<div className='grid md:grid-cols-2 gap-4'>
				{/* internet  */}
				<ResourceListCard
					buttonText='Добавить ресурс'
					description={
						<>
							Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
						</>
					}
					label='Учебно-методический ресурсы'
					name='internetResources'
					placeholder='Откуда был взят материал для учебного плана'
					title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
				/>

				{/* technical */}
				<ResourceListCard
					buttonText='Добавить материал'
					description='Введите список технических средств которые обязательны для учебного плана'
					label='Технические средства и материалы'
					name='technicalResources'
					placeholder='Что нужно при прохождении учебного плана'
					title='Технические средства и материалы'
				/>
			</div>
		</div>
	)
}
