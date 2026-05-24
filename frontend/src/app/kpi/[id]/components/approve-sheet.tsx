'use client'

import { useEffect, useState } from 'react'

import { getLocaleText, getUILocaleSection } from '@helpers'
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
import { useLocaleStore } from '@store'
import { CriteriaMethodEnum, type ICriteria } from '@types'
import localeDictionary from './locale.json'

interface IApproveSheetProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onStatusChange: (awardPoints: number) => void
	criteria: ICriteria
}

export const ApproveSheet = ({ isOpen, onOpenChange, onStatusChange, criteria }: IApproveSheetProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).approveSheet
	const isMeasuring = criteria.method === CriteriaMethodEnum.MEASURING

	const min = criteria.points[0]
	const max = criteria.points[1] ?? criteria.points[0]
	const criteriaName = getLocaleText(criteria.name, locale)

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
					<SheetTitle>{t.title}</SheetTitle>
					<SheetDescription>{t.description}</SheetDescription>
				</SheetHeader>

				<div className='px-3 space-y-3 text-sm'>
					<p>
						<span className='text-muted-foreground'>{t.criteriaLabel}:</span>{' '}
						<span className='font-medium'>{criteriaName}</span>
					</p>

					<p>
						<span className='text-muted-foreground'>{t.methodLabel}:</span>{' '}
						<span className='font-medium'>
							{criteria.method === CriteriaMethodEnum.NORMAL ? t.methodFixed : t.methodMeasuring}
						</span>
					</p>

					{criteria.method === CriteriaMethodEnum.NORMAL && (
						<div className='rounded-md border px-3 py-2 bg-muted'>
							<p>
								{t.pointsLabel}: <span className='font-semibold'>{criteria.points[0]}</span>
							</p>
						</div>
					)}

					{isMeasuring && (
						<div className='space-y-2'>
							<Label htmlFor='points'>
								{t.scoreLabel} ({min} - {max})
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
						{t.cancel}
					</Button>
					<Button variant='default' onClick={handleApprove}>
						{t.approve}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
