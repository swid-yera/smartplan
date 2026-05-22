import type { FC } from 'react'

import { StatusEnum } from '@types'
import { Search, ShieldAlert, Timer } from 'lucide-react'

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

const DEFAULT_MESSAGES: IStatusInfoCardMessages = {
	draft: 'Проверьте документ и отправьте на согласование',
	inReview: 'Ожидайте пока методист проверит ваш документ',
	approved: 'Редактирование запрещено, файл сгенерирован.',
}

export const StatusInfoCard: FC<IStatusInfoCardProps> = ({ status, reason, messages }) => {
	const mergedMessages: IStatusInfoCardMessages = {
		...DEFAULT_MESSAGES,
		...messages,
	}

	if (status === StatusEnum.REJECTED) {
		return (
			<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
				<div className='flex items-center gap-2 font-medium'>
					<ShieldAlert className='h-5 w-5' />
					Причина отказа
				</div>
				<div className='mt-2 text-sm whitespace-pre-wrap'>{reason || 'Пусто'}</div>
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
