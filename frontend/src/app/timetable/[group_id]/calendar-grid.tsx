import type { IRoom, ISubject, ITeacher, ITimeSlot, ITimetable } from '@types'
import { Card, CardContent } from '@ui'

interface CalendarGridProps {
	timetable: ITimetable
	timeSlots: ITimeSlot[]
	subjects: ISubject[]
	teachers: ITeacher[]
	rooms: IRoom[]
}

export const CalendarGrid = ({ timetable, timeSlots, subjects, teachers, rooms }: CalendarGridProps) => {
	const daysOfWeek = [
		{ id: 1, name: 'Пн' },
		{ id: 2, name: 'Вт' },
		{ id: 3, name: 'Ср' },
		{ id: 4, name: 'Чт' },
		{ id: 5, name: 'Пт' },
		{ id: 6, name: 'Сб' },
	]

	return (
		<div className='col-span-9'>
			<Card>
				<CardContent className='p-4'>
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse border'>
							<thead>
								<tr>
									<th className='border p-2'>Время</th>
									{daysOfWeek.map((day) => (
										<th key={day.id} className='border p-2 min-w-32'>
											{day.name}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{timeSlots.map((slot) => (
									<tr key={slot.id}>
										<td className='border p-2  font-medium text-center'>{slot.label}</td>
										{daysOfWeek.map((day) => {
											const lesson = timetable.lessons.find(
												(l) => l.dayOfWeek === day.id && l.timeSlot === slot.id,
											)

											return (
												<td key={`${day.id}-${slot.id}`} className='border p-1 min-h-16 relative'>
													{lesson && (
														<div className=' border  rounded p-1 text-xs'>
															<div className='font-medium'>
																{subjects.find((s) => s.id === lesson.subjectId)?.name}
															</div>
															<div className=''>
																{teachers.find((t) => t.id === lesson.teacherId)?.name}
															</div>
															<div className=''>{rooms.find((r) => r.id === lesson.roomId)?.name}</div>
														</div>
													)}
												</td>
											)
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
