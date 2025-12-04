'use client'

import { useState } from 'react'

import type { IRup, ISubject } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@ui'

interface SubjectsTabProps {
	rup: IRup
	updateRup: (updates: Partial<IRup>) => void
}

export const SubjectsTab = ({ rup, updateRup }: SubjectsTabProps) => {
	const [editingSubject, setEditingSubject] = useState<ISubject | null>(null)
	const [isAddingSubject, setIsAddingSubject] = useState(false)

	const addSubject = () => {
		setIsAddingSubject(true)
		setEditingSubject({
			id: Date.now().toString(),
			code: '',
			name: '',
			semester1Hours: 0,
			semester2Hours: 0,
			lecture: 0,
			lab: 0,
			practice: 0,
			srs: 0,
			project: 0,
			controlType: '',
			description: '',
			competencies: [],
			semesterDistribution: [],
			assessmentForms: [],
			prerequisites: [],
			recommendedResources: [],
		})
	}

	const editSubject = (subject: ISubject) => {
		setEditingSubject({ ...subject })
		setIsAddingSubject(false)
	}

	const saveSubject = () => {
		if (!editingSubject) return
		if (isAddingSubject) {
			updateRup({ subjects: [...rup.subjects, editingSubject] })
		} else {
			updateRup({
				subjects: rup.subjects.map((s) => (s.id === editingSubject.id ? editingSubject : s)),
			})
		}
		setEditingSubject(null)
		setIsAddingSubject(false)
	}

	const deleteSubject = (id: string) => {
		updateRup({ subjects: rup.subjects.filter((s) => s.id !== id) })
	}

	return (
		<div className='space-y-4'>
			<div className='flex justify-between'>
				<Button onClick={addSubject}>Добавить дисциплину</Button>
				<Button variant='outline'>ИИ-помощник</Button>
			</div>
			{editingSubject && (
				<Card>
					<CardHeader>
						<CardTitle>{isAddingSubject ? 'Добавить дисциплину' : 'Редактировать дисциплину'}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='subjectCode'>Код дисциплины</Label>
							<Input
								id='subjectCode'
								value={editingSubject.code}
								onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='subjectName'>Название дисциплины</Label>
							<Input
								id='subjectName'
								value={editingSubject.name}
								onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='sem1'>Часы семестр 1</Label>
								<Input
									id='sem1'
									type='number'
									value={editingSubject.semester1Hours}
									onChange={(e) =>
										setEditingSubject({
											...editingSubject,
											semester1Hours: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='sem2'>Часы семестр 2</Label>
								<Input
									id='sem2'
									type='number'
									value={editingSubject.semester2Hours}
									onChange={(e) =>
										setEditingSubject({
											...editingSubject,
											semester2Hours: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
						</div>
						<div className='grid grid-cols-4 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='lecture'>Лекции</Label>
								<Input
									id='lecture'
									type='number'
									value={editingSubject.lecture}
									onChange={(e) =>
										setEditingSubject({
											...editingSubject,
											lecture: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='lab'>Лабораторные</Label>
								<Input
									id='lab'
									type='number'
									value={editingSubject.lab}
									onChange={(e) =>
										setEditingSubject({ ...editingSubject, lab: parseInt(e.target.value) || 0 })
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='practice'>Практика</Label>
								<Input
									id='practice'
									type='number'
									value={editingSubject.practice}
									onChange={(e) =>
										setEditingSubject({
											...editingSubject,
											practice: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='srs'>СРС</Label>
								<Input
									id='srs'
									type='number'
									value={editingSubject.srs}
									onChange={(e) =>
										setEditingSubject({ ...editingSubject, srs: parseInt(e.target.value) || 0 })
									}
								/>
							</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='controlType'>Форма контроля</Label>
							<Select
								value={editingSubject.controlType}
								onValueChange={(value) => setEditingSubject({ ...editingSubject, controlType: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder='Выберите форму контроля' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='Exam'>Экзамен</SelectItem>
									<SelectItem value='Test'>Зачет</SelectItem>
									<SelectItem value='Project'>Курсовая работа</SelectItem>
									<SelectItem value='Credit'>Зачет</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='flex space-x-2'>
							<Button onClick={saveSubject}>Сохранить</Button>
							<Button variant='outline' onClick={() => setEditingSubject(null)}>
								Отмена
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
			<table className='w-full border-collapse border'>
				<thead>
					<tr>
						<th className='border p-2'>Код</th>
						<th className='border p-2'>Название</th>
						<th className='border p-2'>Сем1</th>
						<th className='border p-2'>Сем2</th>
						<th className='border p-2'>Л</th>
						<th className='border p-2'>Лаб</th>
						<th className='border p-2'>Практ</th>
						<th className='border p-2'>СРС</th>
						<th className='border p-2'>Контроль</th>
						<th className='border p-2'>Действия</th>
					</tr>
				</thead>
				<tbody>
					{rup.subjects.map((subject) => (
						<tr key={subject.id}>
							<td className='border p-2'>{subject.code}</td>
							<td className='border p-2'>{subject.name}</td>
							<td className='border p-2'>{subject.semester1Hours}</td>
							<td className='border p-2'>{subject.semester2Hours}</td>
							<td className='border p-2'>{subject.lecture}</td>
							<td className='border p-2'>{subject.lab}</td>
							<td className='border p-2'>{subject.practice}</td>
							<td className='border p-2'>{subject.srs}</td>
							<td className='border p-2'>{subject.controlType}</td>
							<td className='border p-2'>
								<Button className='mr-2' size='sm' variant='outline' onClick={() => editSubject(subject)}>
									Редактировать
								</Button>
								<Button size='sm' variant='destructive' onClick={() => deleteSubject(subject.id)}>
									Удалить
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
