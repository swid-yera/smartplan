'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import type { ISubject } from '@types'
import { mockDetailedSubject } from '@types'
import { Button } from '@ui'

import { SubjectAssessmentForms } from './subject-assessment-forms'
import { SubjectCompetencies } from './subject-competencies'
import { SubjectDescription } from './subject-description'
import { SubjectHeader } from './subject-header'
import { SubjectHoursBreakdown } from './subject-hours-breakdown'
import { SubjectPrerequisites } from './subject-prerequisites'
import { SubjectRecommendedResources } from './subject-recommended-resources'
import { SubjectSemesterDistribution } from './subject-semester-distribution'

const Page = () => {
	const params = useParams()
	const id = params.id as string
	const [subject, setSubject] = useState<ISubject | null>(null)

	useEffect(() => {
		if (id === 'new') {
			setSubject({
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
		} else {
			// Mock load
			setSubject(mockDetailedSubject)
		}
	}, [id])

	const updateSubject = (updates: Partial<ISubject>) => {
		setSubject((prev) => (prev ? { ...prev, ...updates } : null))
	}

	const handleSave = () => {
		// Mock save
		alert('Предмет сохранен!')
	}

	const handleCancel = () => {
		// Mock cancel
		window.history.back()
	}

	if (!subject) return <div>Загрузка...</div>

	return (
		<div className='container mx-auto p-6 max-w-4xl'>
			<SubjectHeader subject={subject} />

			<div className='space-y-6'>
				<SubjectDescription subject={subject} updateSubject={updateSubject} />
				<SubjectCompetencies subject={subject} updateSubject={updateSubject} />
				<SubjectHoursBreakdown subject={subject} updateSubject={updateSubject} />
				<SubjectSemesterDistribution subject={subject} />
				<SubjectAssessmentForms subject={subject} updateSubject={updateSubject} />
				<SubjectPrerequisites subject={subject} updateSubject={updateSubject} />
				<SubjectRecommendedResources subject={subject} />
			</div>

			{/* Save/Cancel Buttons */}
			<div className='flex justify-end space-x-4 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					Отмена
				</Button>
				<Button onClick={handleSave}>Сохранить</Button>
			</div>
		</div>
	)
}

export default Page
