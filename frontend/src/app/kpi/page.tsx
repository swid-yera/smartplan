'use client'

import { useState } from 'react'

import { Button } from '@ui'

import { MethodistView } from './components/methodist-view'
import { TeacherView } from './components/teacher-view'

const Page = () => {
	const [role, setRole] = useState<'teacher' | 'methodist'>('methodist')

	return (
		<div className='space-y-4'>
			<div className='flex justify-end px-4 pt-4'>
				<Button variant='outline' onClick={() => setRole((r) => (r === 'teacher' ? 'methodist' : 'teacher'))}>
					Переключить на {role === 'teacher' ? 'Методиста' : 'Преподавателя'}
				</Button>
			</div>
			{role === 'methodist' ? <MethodistView /> : <TeacherView />}
		</div>
	)
}

export default Page
