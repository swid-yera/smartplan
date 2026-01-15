'use client'

import { Button } from '@ui'
import { Users } from 'lucide-react'

import useUserRoleStore from './user-role.store'

export const RoleSwitcher = () => {
	const { role, toggleRole } = useUserRoleStore()

	return (
		<div className='fixed bottom-4 right-4 z-50'>
			<Button size='lg' onClick={toggleRole}>
				<Users className='mr-2' />
				Переключить на {role === 'TEACHER' ? 'Методиста' : 'Преподавателя'}
			</Button>
		</div>
	)
}
