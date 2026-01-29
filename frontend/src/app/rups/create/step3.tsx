import { useState } from 'react'

import { type IGenerateDisciplines, generateDisciplines } from '@actions'
import { NumericInput } from '@components'
import { Label } from '@shadcn'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { DisciplineEdit, GenerateCard } from '../components'

type IProps = FieldValues & {
	name: string
	course: number
	goals: string
	competencies: string
}

export function Step3<T extends IProps>() {
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [wantsHours, setWantsHours] = useState<number | undefined>(undefined)
	const [disciplineCount, setDisciplineCount] = useState<number | undefined>(undefined)

	const handleGenerate = async () => {
		if (isLoading) return
		if (!disciplineCount || !wantsHours) {
			return toast.error('заполните общее количество часов модуля и количество дисциплин')
		}

		try {
			setIsLoading(true)
			toast.loading('Генерируется результаты обучения', { id: 'rup-disciplines-generate' })

			const values = getValues()

			const mappedData: IGenerateDisciplines = {
				name: values.name,
				course: values.course,
				goals: values.goals,
				competencies: values.competencies,

				wantsHours: wantsHours,
				disciplineCount: disciplineCount,
			}

			const generatedDisciplines = await generateDisciplines(mappedData)

			// write
			setValue('disciplines' as Path<T>, generatedDisciplines, { shouldDirty: true })
			toast.success('Успешно сгенерировано результаты обучения', { id: 'rup-disciplines-generate' })
		} catch (err) {
			toast.error(`Ошибка при генерации результатов Обучений ${err}`, { id: 'rup-disciplines-generate' })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<GenerateCard
				buttonText={isLoading ? 'Генерация…' : 'Сгенерировать'}
				description='Текст и часы будут сформированы на основе базовых данных модуля и описания модуля. Заполните общее количество часов модуля (например 288) и количество дисциплин (например 3), после Искусственный Интеллект распределит часы (288) на дисциплины (3). После генерации вы сможете отредактировать их вручную.'
				disabled={isLoading}
				disabledReason='Заполните данные модуля, описание и общее количество часов модуля'
				title='Автоматическая генерация дисциплин'
				onClick={() => handleGenerate()}
			>
				<>
					<Label>Общее количество часов модуля</Label>
					<NumericInput
						min={0}
						placeholder='шаг по 24'
						step={24}
						value={wantsHours ?? ''}
						onChange={(e) => setWantsHours(Number(e))}
					/>

					<Label>Количество дисциплин</Label>
					<NumericInput
						min={0}
						placeholder='Количество дисциплин'
						value={disciplineCount ?? ''}
						onChange={(e) => setDisciplineCount(Number(e))}
					/>
				</>
			</GenerateCard>

			<DisciplineEdit />
		</div>
	)
}
