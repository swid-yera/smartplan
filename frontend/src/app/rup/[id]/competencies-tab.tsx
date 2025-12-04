'use client'

import { useState } from 'react'

import type { ICompetency, IRup } from '@types'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@ui'

interface CompetenciesTabProps {
	rup: IRup
	updateRup: (updates: Partial<IRup>) => void
}

export const CompetenciesTab = ({ rup, updateRup }: CompetenciesTabProps) => {
	const [newCompetencyTexts, setNewCompetencyTexts] = useState<Record<string, string>>({})

	const addCompetency = (subjectId: string) => {
		const text = newCompetencyTexts[subjectId]?.trim()

		if (!text) return

		const newCompetency: ICompetency = {
			id: Date.now().toString(),
			subjectId,
			description: text,
		}

		updateRup({
			competencies: [...rup.competencies, newCompetency],
		})

		setNewCompetencyTexts((prev) => ({ ...prev, [subjectId]: '' }))
	}

	const updateCompetencyText = (subjectId: string, text: string) => {
		setNewCompetencyTexts((prev) => ({ ...prev, [subjectId]: text }))
	}

	return (
		<div className='space-y-4'>
			{rup.subjects.map((subject) => (
				<Card key={subject.id}>
					<CardHeader>
						<CardTitle>
							{subject.name} ({subject.code})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-2'>
							{rup.competencies
								.filter((comp) => comp.subjectId === subject.id)
								.map((comp) => (
									<div key={comp.id} className='p-2 rounded bg-accent'>
										{comp.description}
									</div>
								))}
							<div className='flex space-x-2'>
								<Input
									placeholder='Добавить компетенцию...'
									value={newCompetencyTexts[subject.id] || ''}
									onChange={(e) => updateCompetencyText(subject.id, e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											addCompetency(subject.id)
										}
									}}
								/>
								<Button size='sm' onClick={() => addCompetency(subject.id)}>
									Добавить
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
