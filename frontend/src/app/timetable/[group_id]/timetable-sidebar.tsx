import type { IRoom, ISubject, ITeacher } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface SidebarProps {
	subjects: ISubject[]
	teachers: ITeacher[]
	rooms: IRoom[]
}

export const TimetableSidebar = ({ subjects, teachers, rooms }: SidebarProps) => {
	return (
		<div className='col-span-3 space-y-4'>
			{/* Subjects List */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Предметы</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						{subjects.map((subject) => (
							<div key={subject.id} draggable className='p-2 rounded cursor-pointer'>
								<div className='font-medium'>{subject.name}</div>
								<div className='text-sm text-gray-600'>{subject.code}</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Teachers List */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Преподаватели</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						{teachers.map((teacher) => (
							<div key={teacher.id} className='p-2 rounded'>
								<div className='font-medium'>{teacher.name}</div>
								<div className='text-sm text-gray-600'>{teacher.subjects.join(', ')}</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Rooms List */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Аудитории</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						{rooms.map((room) => (
							<div key={room.id} className='p-2 rounded'>
								<div className='font-medium'>{room.name}</div>
								<div className='text-sm text-gray-600'>Вместимость: {room.capacity}</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* AI Suggestions */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>AI Предложения</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						<div className='p-2 rounded text-sm'>Оптимизировать распределение нагрузки</div>
						<div className='p-2 rounded text-sm'>Избегать конфликтов аудиторий</div>
						<div className='p-2 rounded text-sm'>Учитывать предпочтения преподавателей</div>
					</div>
				</CardContent>
			</Card>

			{/* Holidays/Short Days */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Праздники/Короткие дни</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						<label className='flex items-center space-x-2'>
							<input type='checkbox' />
							<span className='text-sm'>Короткий день</span>
						</label>
						<label className='flex items-center space-x-2'>
							<input type='checkbox' />
							<span className='text-sm'>Праздник</span>
						</label>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
