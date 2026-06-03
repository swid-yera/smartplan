'use client'

import { useEffect, useMemo, useState } from 'react'

import { getLocaleText, getUILocaleSection } from '@helpers'
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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
	onStatusChange: (criteriaId: string, awardPoints: number) => void
	criteriaOptions: ICriteria[]
	selectedCriteria?: ICriteria | null
}

export const ApproveSheet = ({
	isOpen,
	onOpenChange,
	onStatusChange,
	criteriaOptions = [],
	selectedCriteria = null,
}: IApproveSheetProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).approveSheet
	const [currentCriteriaId, setCurrentCriteriaId] = useState(selectedCriteria?.id ?? criteriaOptions[0]?.id ?? '')
	const selectedCriteriaFallback = selectedCriteria ?? criteriaOptions[0] ?? null
	const currentCriteria = useMemo(
		() => criteriaOptions.find((criteria) => criteria.id === currentCriteriaId) || selectedCriteriaFallback || null,
		[currentCriteriaId, criteriaOptions, selectedCriteriaFallback],
	)
	const currentPoints = currentCriteria?.points ?? []
	const isMeasuring = currentCriteria?.method === CriteriaMethodEnum.MEASURING
	const min = currentPoints[0] ?? 0
	const max = currentPoints[currentPoints.length - 1] ?? min
	const criteriaName = currentCriteria ? getLocaleText(currentCriteria.name, locale) : ''
	const [awardPoints, setAwardPoints] = useState<number>(min)

	useEffect(() => {
		const nextCriteriaId = selectedCriteria?.id ?? criteriaOptions[0]?.id ?? ''

		setCurrentCriteriaId(nextCriteriaId)
	}, [criteriaOptions, isOpen, selectedCriteria])

	useEffect(() => {
		setAwardPoints(min)
	}, [currentCriteria?.id, min])

	const handleApprove = () => {
		if (!currentCriteria) return

		onStatusChange(currentCriteria.id, awardPoints)
		onOpenChange(false)
	}

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{t.title}</SheetTitle>
					<SheetDescription>{t.description}</SheetDescription>
				</SheetHeader>

				<div className='space-y-3 px-3 text-sm'>
					{criteriaOptions.length > 1 && (
						<div className='space-y-2'>
							<Label htmlFor='criteria-select'>{t.criteriaSelectLabel}</Label>
							<Select
								value={currentCriteriaId}
								onValueChange={(value) => {
									setCurrentCriteriaId(value)
								}}
							>
								<SelectTrigger className='w-full' id='criteria-select'>
									<SelectValue placeholder={t.criteriaSelectPlaceholder} />
								</SelectTrigger>
								<SelectContent>
									{criteriaOptions.map((criteria) => (
										<SelectItem key={criteria.id} value={criteria.id}>
											{getLocaleText(criteria.name, locale)} ({criteria.points.join('-')} баллов)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<p>
						<span className='text-muted-foreground'>{t.criteriaLabel}:</span>{' '}
						<span className='font-medium'>{criteriaName}</span>
					</p>

					<p>
						<span className='text-muted-foreground'>{t.methodLabel}:</span>{' '}
						<span className='font-medium'>
							{currentCriteria?.method === CriteriaMethodEnum.NORMAL ? t.methodFixed : t.methodMeasuring}
						</span>
					</p>

					{currentCriteria?.method === CriteriaMethodEnum.NORMAL && (
						<div className='rounded-md border bg-muted px-3 py-2'>
							<p>
								{t.pointsLabel}: <span className='font-semibold'>{currentCriteria.points[0]}</span>
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
					<Button disabled={!currentCriteria} variant='default' onClick={handleApprove}>
						{t.approve}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
