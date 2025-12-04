'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import type { IGroup, IRoom, ISubject, ITeacher, ITimeSlot, ITimetable } from '@types'
import { mockGroups, mockRUP, mockRooms, mockTeachers, mockTimeSlots, mockTimetable } from '@types'

import { ActionButtons } from './action-buttons'
import { CalendarGrid } from './calendar-grid'
import { TimetableHeader } from './timetable-header'
import { TimetableSidebar } from './timetable-sidebar'

const Page = () => {
	const params = useParams()
	const groupId = params.group_id as string
	const [group, setGroup] = useState<IGroup | null>(null)
	const [timetable, setTimetable] = useState<ITimetable | null>(null)
	const [timeSlots] = useState<ITimeSlot[]>(mockTimeSlots)
	const [subjects] = useState<ISubject[]>(mockRUP.subjects)
	const [teachers] = useState<ITeacher[]>(mockTeachers)
	const [rooms] = useState<IRoom[]>(mockRooms)

	useEffect(() => {
		// Load group data
		const foundGroup = mockGroups.find((g) => g.id === groupId)

		if (foundGroup) {
			setGroup(foundGroup)
		}

		// Load timetable data
		if (groupId === 'cs-2025-a') {
			setTimetable(mockTimetable)
		} else {
			setTimetable({
				groupId,
				lessons: [],
				holidays: [],
				shortDays: [],
			})
		}
	}, [groupId])

	const handleSave = () => {
		alert('Расписание сохранено!')
	}

	const handleAutoOptimize = () => {
		alert('Автооптимизация запущена!')
	}

	const handleExport = (format: 'pdf' | 'excel') => {
		alert(`Экспорт в ${format.toUpperCase()} запущен!`)
	}

	if (!group || !timetable) return <div>Загрузка...</div>

	return (
		<div className='container mx-auto p-6'>
			<TimetableHeader group={group} />

			<div className='grid grid-cols-12 gap-6'>
				<TimetableSidebar rooms={rooms} subjects={subjects} teachers={teachers} />
				<CalendarGrid
					rooms={rooms}
					subjects={subjects}
					teachers={teachers}
					timeSlots={timeSlots}
					timetable={timetable}
				/>
			</div>

			<ActionButtons onAutoOptimize={handleAutoOptimize} onExport={handleExport} onSave={handleSave} />
		</div>
	)
}

export default Page
