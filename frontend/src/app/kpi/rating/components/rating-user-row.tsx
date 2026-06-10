'use client'

import type { FC } from 'react'

import Link from 'next/link'

import { getLocaleText, getUILocaleSection, getUserTotalPoints, normalizeViolation } from '@helpers'
import { TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IUser, ViolationEnum } from '@types'
import { AlertTriangle, Crown, Medal } from 'lucide-react'

import cardsLocale from '../../../../components/cards/locale.json'

interface IProps {
	index: number
	user: IUser
}

const getPlaceStyle = (index: number) => {
	if (index === 0) return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
	if (index === 1) return 'bg-gray-50 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300'
	if (index === 2) return 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'

	return ''
}

const getPlaceIcon = (index: number) => {
	if (index === 0) return <Crown className='h-4 w-4 text-yellow-500' />
	if (index === 1) return <Medal className='h-4 w-4 text-gray-500' />
	if (index === 2) return <Medal className='h-4 w-4 text-orange-500' />

	return null
}

export const RatingUserRow: FC<IProps> = ({ index, user }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(cardsLocale, locale).userCard
	const placeStyle = getPlaceStyle(index)
	const placeIcon = getPlaceIcon(index)
	const departmentNames = (user.departments ?? [])
		.map((department) => getLocaleText(department.name, locale))
		.filter(Boolean)
	const departmentLabel = departmentNames.join(', ')
	const violations = user.violations ?? []
	const latestViolation = [...violations].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)[0]
	const hasViolation = (user.violation && user.violation !== ViolationEnum.NONE) || violations.length > 0
	const fullName = `${user.firstName} ${user.lastName}`.trim()
	const totalPoints = getUserTotalPoints(user)

	return (
		<TableRow className={placeStyle}>
			<TableCell className='w-16 text-center font-semibold'>{index + 1}</TableCell>

			<TableCell className='py-4'>
				<div className='flex items-start gap-2'>
					<div className='min-w-0 flex-1 space-y-1'>
						<Link
							className='flex items-center gap-2 text-base font-medium hover:underline'
							href={`/users/${user.keycloakId}`}
						>
							{placeIcon}
							<span className='truncate'>{fullName}</span>
						</Link>

						{departmentLabel && (
							<p className='truncate text-xs text-muted-foreground' title={departmentLabel}>
								{departmentLabel}
							</p>
						)}
					</div>

					{hasViolation && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									aria-label={t.violationTitle}
									className='mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10'
									type='button'
								>
									<AlertTriangle className='h-4 w-4' />
								</button>
							</TooltipTrigger>
							<TooltipContent side='top' sideOffset={8}>
								<div className='max-w-xs space-y-1'>
									<p className='text-sm font-semibold text-destructive'>{t.violationTitle}</p>
									<p className='text-sm'>
										<span className='text-muted-foreground'>{t.violationLevel}: </span>
										{normalizeViolation(user.violation ?? ViolationEnum.NONE, locale)}
									</p>
									<p className='text-sm'>
										<span className='text-muted-foreground'>{t.violationLastNote}: </span>
										{latestViolation?.note || t.none}
									</p>
								</div>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</TableCell>

			<TableCell className='pr-10 text-right text-base font-semibold whitespace-nowrap'>
				{totalPoints}
			</TableCell>
		</TableRow>
	)
}
