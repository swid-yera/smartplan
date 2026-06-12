'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatCriteriaPoints, getLocaleText, getUILocaleSection } from '@helpers'
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
import { type IAward } from '@types'

import localeDictionary from './locale.json'

interface IChangePointsSheetProps {
	award: IAward | null
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onSave: (totalPoints: number) => void
}

export const ChangePointsSheet = ({ award, isOpen, onOpenChange, onSave }: IChangePointsSheetProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).changePointsSheet
	const [draftPoints, setDraftPoints] = useState('')

	const criteriaName = useMemo(
		() => (award ? getLocaleText(award.criteria.name, locale) : ''),
		[award, locale],
	)
	const criteriaPoints = useMemo(
		() => (award ? formatCriteriaPoints(award.criteria.points) : ''),
		[award],
	)

	useEffect(() => {
		if (!isOpen || !award) return

		setDraftPoints(String(award.totalPoints))
	}, [award, isOpen])

	const currentPoints = award?.totalPoints ?? 0
	const parsedPoints = Number(draftPoints)
	const isPointsValid = draftPoints.trim() !== '' && Number.isFinite(parsedPoints)

	return (
		<Sheet open={isOpen && !!award} onOpenChange={onOpenChange}>
			<SheetContent className='flex w-full flex-col sm:max-w-md'>
				<SheetHeader className='px-4'>
					<SheetTitle>{t.title}</SheetTitle>
					<SheetDescription>{t.description}</SheetDescription>
				</SheetHeader>

				<div className='space-y-4 px-4 pb-4 text-sm'>
					<div className='rounded-lg border bg-muted/40 p-4 space-y-3'>
						<div className='grid gap-1'>
							<p className='text-xs text-muted-foreground'>{t.criteriaLabel}</p>
							<p className='font-medium'>{criteriaName || t.empty}</p>
						</div>
						<div className='grid gap-1'>
							<p className='text-xs text-muted-foreground'>{t.criteriaPointsLabel}</p>
							<p className='font-medium'>{criteriaPoints || t.empty}</p>
						</div>
						<div className='grid gap-1'>
							<p className='text-xs text-muted-foreground'>{t.currentPointsLabel}</p>
							<p className='text-lg font-semibold leading-none'>{currentPoints}</p>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='total-points'>{t.newPointsLabel}</Label>
						<Input
							id='total-points'
							inputMode='numeric'
							step='1'
							type='number'
							value={draftPoints}
							onChange={(event) => setDraftPoints(event.target.value)}
						/>
					</div>
				</div>

				<SheetFooter className='mt-auto border-t px-4 py-4'>
					<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
						{t.cancel}
					</Button>
					<Button
						disabled={!award || !isPointsValid}
						type='button'
						onClick={() => {
							if (!isPointsValid) return

							onSave(parsedPoints)
						}}
					>
						{t.save}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
