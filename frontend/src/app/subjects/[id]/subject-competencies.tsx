'use client'

import { useState } from 'react'

import type { ISubject } from '@types'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@ui'

interface SubjectCompetenciesProps {
	subject: ISubject
	updateSubject: (updates: Partial<ISubject>) => void
}

export const SubjectCompetencies = ({ subject, updateSubject }: SubjectCompetenciesProps) => {
	const [newCompetency, setNewCompetency] = useState('')

	const addCompetency = () => {
		if (newCompetency.trim()) {
			updateSubject({
				competencies: [...subject.competencies, newCompetency.trim()],
			})
			setNewCompetency('')
		}
	}

	const removeCompetency = (index: number) => {
		updateSubject({
			competencies: subject.competencies.filter((_, i) => i !== index),
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Компетенции</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='flex flex-wrap gap-2 mb-4'>
					{subject.competencies.map((comp, index) => (
						<span key={index} className='bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1'>
							{comp}
							<button className='text-blue-600 hover:text-blue-800' onClick={() => removeCompetency(index)}>
								×
							</button>
						</span>
					))}
				</div>
				<div className='flex gap-2'>
					<Input
						placeholder='Добавить компетенцию...'
						value={newCompetency}
						onChange={(e) => setNewCompetency(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter') {
								addCompetency()
							}
						}}
					/>
					<Button onClick={addCompetency}>Добавить</Button>
				</div>
			</CardContent>
		</Card>
	)
}
