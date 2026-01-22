import type { FC } from 'react'

import { AwardStatusBadge } from '@components'
import { formatAsDash } from '@helpers'
import type { IAward } from '@types'
import { Button, Separator, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@ui'

interface IProps {
	award: IAward | null
	onClose: () => void
	isMethodist?: boolean
}

export const AwardDetailsSheet: FC<IProps> = ({ award, onClose, isMethodist }) => {
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
								<strong>Преподаватель:</strong> {award.teacher.lastName}
							</div>

							<div>
								<strong>Методист:</strong> {formatAsDash(award?.methodist?.firstName)}
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

						{isMethodist && award.status === 'IN_REVIEW' && (
							<SheetFooter className='mt-6 gap-2 sm:justify-start'>
								<Button className='w-full sm:w-auto' variant='default'>
									Подтвердить
								</Button>
								<Button className='w-full sm:w-auto' variant='destructive'>
									Отклонить
								</Button>
							</SheetFooter>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	)
}
