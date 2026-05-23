'use client'

import { useEffect, useState } from 'react'

import {
	Button,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@shadcn'
import { CriteriaMethodEnum, type ICriteria } from '@types'

interface IApproveSheetProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onStatusChange: (awardPoints: number) => void
	criteria: ICriteria
}

export const ApproveSheet = ({ isOpen, onOpenChange, onStatusChange, criteria }: IApproveSheetProps) => {
	const isMeasuring = criteria.method === CriteriaMethodEnum.MEASURING

	const min = criteria.points[0]
	const max = criteria.points[1] ?? criteria.points[0]

	const [awardPoints, setAwardPoints] = useState<number>(min)

	useEffect(() => {
		setAwardPoints(min)
	}, [criteria.id, min])

	const handleApprove = () => {
		onStatusChange(awardPoints)
		onOpenChange(false)
	}

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Утвердить</SheetTitle>
					<SheetDescription>Проверка и утверждение баллов</SheetDescription>
				</SheetHeader>

				<div className='px-3 space-y-3 text-sm'>
					<p>
						<span className='text-muted-foreground'>Критерий:</span>{' '}
						<span className='font-medium'>{criteria.name}</span>
					</p>

					<p>
						<span className='text-muted-foreground'>Метод:</span>{' '}
						<span className='font-medium'>
							{criteria.method === CriteriaMethodEnum.NORMAL ? 'Фиксированный' : 'Измеряемый'}
						</span>
					</p>

					{criteria.method === CriteriaMethodEnum.NORMAL && (
						<div className='rounded-md border px-3 py-2 bg-muted'>
							<p>
								Балл за критерий: <span className='font-semibold'>{criteria.points[0]}</span>
							</p>
						</div>
					)}

					{isMeasuring && (
						<div className='space-y-2'>
							<Label htmlFor='points'>
								Балл ({min} - {max})
							</Label>
							<Input
								id='points'
								max={max}
								min={min}
								type='number'
								value={awardPoints}
								onChange={(e) => {
									const value = Number(e.target.value)

									if (Number.isNaN(value)) return

									setAwardPoints(Math.min(Math.max(value, min), max))
								}}
							/>
						</div>
					)}
				</div>

				<SheetFooter className='mt-4'>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button variant='default' onClick={handleApprove}>
						Утвердить
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
