import type { FC } from 'react'

import { normalizeViolation } from '@helpers'
import { Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IUser, ViolationEnum } from '@types'

import localeDictionary from '../cards/locale.json'

interface IViolationBadgeProps {
	user: IUser
	showSeparator?: boolean
}

export const ViolationBadge: FC<IViolationBadgeProps> = ({ user, showSeparator = true }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale]?.userCard ?? localeDictionary.ru.userCard
	const violations = user.violations ?? []
	const latestViolation = [...violations].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)[0]
	const hasViolation = (user.violation && user.violation !== ViolationEnum.NONE) || violations.length > 0

	if (!hasViolation) return null

	return (
		<>
			{showSeparator && <Separator />}
			<div className='rounded-md border border-destructive/50 bg-destructive/5 p-3'>
				<p className='mb-1 font-semibold text-destructive'>{t.violationTitle}</p>
				<p className='text-sm'>
					<span className='text-muted-foreground'>{t.violationLevel}: </span>
					{normalizeViolation(user.violation ?? ViolationEnum.NONE, locale)}
				</p>
				<p className='text-sm'>
					<span className='text-muted-foreground'>{t.violationCount}: </span>
					{violations.length}
				</p>
				<p className='text-sm'>
					<span className='text-muted-foreground'>{t.violationLastNote}: </span>
					{latestViolation?.note || t.none}
				</p>
			</div>
		</>
	)
}
