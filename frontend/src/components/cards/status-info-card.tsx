'use client'

import type { FC } from 'react'

import { StatusEnum } from '@types'
import { useLocaleStore } from '@store'
import { Search, ShieldAlert, Timer } from 'lucide-react'

import locale from './locale.json'

interface IStatusInfoCardMessages {
	draft: string
	inReview: string
	approved: string
}

interface IStatusInfoCardProps {
	status: StatusEnum
	reason?: string | null
	messages?: Partial<IStatusInfoCardMessages>
}

export const StatusInfoCard: FC<IStatusInfoCardProps> = ({ status, reason, messages }) => {
	const currentLocale = useLocaleStore((state) => state.locale)
	const t = locale[currentLocale] ?? locale.ru
	const mergedMessages: IStatusInfoCardMessages = {
		draft: t.statusInfo.draft,
		inReview: t.statusInfo.inReview,
		approved: t.statusInfo.approved,
		...messages,
	}

	if (status === StatusEnum.REJECTED) {
		return (
			<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
				<div className='flex items-center gap-2 font-medium'>
					<ShieldAlert className='h-5 w-5' />
					{t.statusInfo.rejectedTitle}
				</div>
				<div className='mt-2 text-sm whitespace-pre-wrap'>{reason || t.statusInfo.emptyReason}</div>
			</div>
		)
	}

	if (status === StatusEnum.IN_REVIEW) {
		return (
			<div className='rounded-lg border border-secondary/50 bg-secondary/5 p-4 text-secondary'>
				<div className='flex items-center gap-2 font-semibold'>
					<Timer className='h-5 w-5' />
					{mergedMessages.inReview}
				</div>
			</div>
		)
	}

	if (status === StatusEnum.DRAFT) {
		return (
			<div className='rounded-lg border border-primary/50 bg-primary/5 p-4 text-primary'>
				<div className='flex items-center gap-2 font-semibold'>
					<Search className='h-5 w-5' />
					{mergedMessages.draft}
				</div>
			</div>
		)
	}

	if (status === StatusEnum.APPROVED) {
		return (
			<div className='rounded-lg border border-muted-foreground/50 bg-muted-foreground/5 p-4 text-muted-foreground'>
				<div className='flex items-center gap-2 font-semibold'>
					<Search className='h-5 w-5' />
					{mergedMessages.approved}
				</div>
			</div>
		)
	}

	return null
}
