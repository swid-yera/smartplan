import type { ISubject } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface SubjectAssessmentFormsProps {
	subject: ISubject
	updateSubject: (updates: Partial<ISubject>) => void
}

export const SubjectAssessmentForms = ({ subject, updateSubject }: SubjectAssessmentFormsProps) => {
	const assessmentOptions = ['Экзамен', 'Зачет', 'Курсовая работа', 'Проект']

	const toggleAssessmentForm = (form: string) => {
		const newForms = subject.assessmentForms.includes(form)
			? subject.assessmentForms.filter((f) => f !== form)
			: [...subject.assessmentForms, form]

		updateSubject({ assessmentForms: newForms })
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Формы оценки</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					{assessmentOptions.map((form) => (
						<label key={form} className='flex items-center space-x-2'>
							<input
								checked={subject.assessmentForms.includes(form)}
								type='checkbox'
								onChange={() => toggleAssessmentForm(form)}
							/>
							<span>{form}</span>
						</label>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
