'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import type { IRup } from '@types'
import { mockRUP } from '@types'
import { Button, Card, CardContent, Heading } from '@ui'

import { CompetenciesTab } from './competencies-tab'
import { GeneralInfoTab } from './general-info-tab'
import { NotesTab } from './notes-tab'
import { SubjectsTab } from './subjects-tab'

const Page = () => {
	const params = useParams()
	const id = params.id as string
	const [rup, setRup] = useState<IRup | null>(null)
	const [activeTab, setActiveTab] = useState('general')

	const updateRup = (updates: Partial<IRup>) => {
		setRup((prev) => (prev ? { ...prev, ...updates } : null))
	}

	const [validationErrors, setValidationErrors] = useState<string[]>([])

	const validateRUP = () => {
		const errors: string[] = []

		// Check total hours
		const totalSubjectHours = rup!.subjects.reduce((sum, s) => sum + s.semester1Hours + s.semester2Hours, 0)

		if (totalSubjectHours !== rup!.totalHours) {
			errors.push(
				`Общее количество часов дисциплин (${totalSubjectHours}) не совпадает с общим количеством часов (${rup!.totalHours})`,
			)
		}

		// Check control types
		const subjectsWithoutControl = rup!.subjects.filter((s) => !s.controlType)

		if (subjectsWithoutControl.length > 0) {
			errors.push(`Дисциплины без формы контроля: ${subjectsWithoutControl.map((s) => s.name).join(', ')}`)
		}

		return errors
	}

	const saveDraft = () => {
		const errors = validateRUP()

		setValidationErrors(errors)
		if (errors.length === 0) {
			// Mock save
			alert('Черновик сохранен успешно!')
		}
	}

	const submitForApproval = () => {
		const errors = validateRUP()

		setValidationErrors(errors)
		if (errors.length === 0) {
			// Mock submit
			alert('Отправлено на утверждение!')
		}
	}

	useEffect(() => {
		if (id === 'new') {
			setRup({
				programName: '',
				academicYear: '',
				specialtyCode: '',
				formOfStudy: '',
				totalWeeks: 0,
				totalHours: 0,
				subjects: [],
				explanatoryNote: '',
				competencies: [],
			})
		} else {
			// Mock load
			setRup(mockRUP)
		}
	}, [id])

	if (!rup) return <div>Loading...</div>

	const tabs = [
		{ id: 'general', label: 'Общая информация' },
		{ id: 'subjects', label: 'Дисциплины' },
		{ id: 'notes', label: 'Пояснительная записка' },
		{ id: 'competencies', label: 'Компетенции' },
	]

	return (
		<div className='container mx-auto p-6'>
			{/* Header */}
			<Heading align='left' className='mb-6' size='h3'>
				РУП: {rup.programName || 'Новая программа'} | {rup.academicYear || 'Учебный год'}
			</Heading>

			{/* Tabs */}
			<div className='flex space-x-1 mb-6'>
				{tabs.map((tab) => (
					<Button
						key={tab.id}
						variant={activeTab === tab.id ? 'default' : 'outline'}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.label}
					</Button>
				))}
			</div>

			{/* Tab Content */}
			<Card>
				<CardContent className='p-6'>
					{activeTab === 'general' && <GeneralInfoTab rup={rup} updateRup={updateRup} />}
					{activeTab === 'subjects' && <SubjectsTab rup={rup} updateRup={updateRup} />}
					{activeTab === 'notes' && <NotesTab rup={rup} updateRup={updateRup} />}
					{activeTab === 'competencies' && <CompetenciesTab rup={rup} updateRup={updateRup} />}
				</CardContent>
			</Card>

			{/* Validation Errors */}
			{validationErrors.length > 0 && (
				<Card className='mt-6 border-red-500'>
					<CardContent className='p-4'>
						<h3 className='text-red-600 font-semibold mb-2'>Ошибки валидации:</h3>
						<ul className='list-disc list-inside text-red-600'>
							{validationErrors.map((error, index) => (
								<li key={index}>{error}</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			{/* Save Buttons */}
			<div className='flex justify-end space-x-4 mt-6'>
				<Button variant='outline' onClick={saveDraft}>
					Сохранить черновик
				</Button>
				<Button onClick={submitForApproval}>Отправить на утверждение</Button>
			</div>
		</div>
	)
}

export default Page
