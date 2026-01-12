import type { FC } from 'react'

import { AwardStatusBadge } from '@components'
import type { IAward } from '@types'
import { Separator, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@ui'

interface IProps {
	award: IAward | null
	onClose: () => void
}

export const AwardDetailsSheet: FC<IProps> = ({ award, onClose }) => {
	return (
		<Sheet open={!!award} onOpenChange={onClose}>
			<SheetContent className='w-full sm:max-w-lg'>
				{award && (
					<>
						<SheetHeader>
							<SheetTitle>{award.title}</SheetTitle>
							<SheetDescription>Подробная информация о награде</SheetDescription>
						</SheetHeader>

						<div className='mt-6 space-y-4 text-sm px-4'>
							<div>
								<strong>Статус:</strong> <AwardStatusBadge status={award.status} />
							</div>

							<div>
								<strong>Преподаватель:</strong> {award.teacher.name}
							</div>

							<div>
								<strong>Методист:</strong> {award?.methodist?.name ?? '—'}
							</div>

							<div>
								<strong>Дата:</strong> {award.createdAt}
							</div>

							<Separator />

							<div>
								<strong>Описание</strong>
								<p className='text-muted-foreground mt-1'>{award.text ?? 'Описание отсутствует'}</p>
							</div>

							<div>
								<strong>Файлы</strong>
								<ul className='mt-2 list-disc pl-4 text-muted-foreground'>
									{award.images?.map((file, i) => <li key={i}>{file}</li>) ?? '—'}
								</ul>
							</div>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	)
}
