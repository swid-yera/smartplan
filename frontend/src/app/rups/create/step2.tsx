import type { FC } from 'react'

import { Loader } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'

import { ContactsEdit, ResourceEdit } from '../components'

export const Step2: FC = () => {
	const { authLoading, user } = useAuthStore()

	const { data: teachersData, isLoading } = useQuery({
		...services.user.getAllOptions({ currentPage: 1, pageSize: 100, search: '' }),
		enabled: true,
	})

	if (authLoading || !user || isLoading) return <Loader type='data' />

	return (
		<div className='w-full space-y-5'>
			<ContactsEdit creatorId={user.keycloakId} teachersData={teachersData?.data || []} />

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
					placeholder='Откуда был взят материал для учебного плана'
					title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
				/>

				{/* technical */}
				<ResourceEdit
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
