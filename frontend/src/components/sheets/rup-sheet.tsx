import type { FC } from 'react'

import Link from 'next/link'

import { formatHours, normalizeStudyForm } from '@helpers'
import {
	Button,
	Separator,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@shadcn'
import type { IRup } from '@types'
import { BookOpen, Clock, ComponentIcon, Users } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'

interface IRupSheet {
	onSelect: (rup: IRup | null) => void
	rup: IRup | null
}

export const RupSheet: FC<IRupSheet> = ({ rup, onSelect }) => {
	return (
		<Sheet open={!!rup} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent className='overflow-y-auto sm:max-w-md w-full'>
				{rup && (
					<>
						<SheetHeader>
							<SheetTitle className='mt-2'>
								{rup.name + ' '}
								<StatusBadge status={rup.status} />
							</SheetTitle>
							<SheetDescription>Краткая информация о рабочей учебной программе .</SheetDescription>
						</SheetHeader>

						<div className='grid flex-1 auto-rows-min gap-6 px-4'>
							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<BookOpen className='w-4 h-4 mr-2' /> Основное
								</h4>

								<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
									<p className='font-medium'>Статус:</p>
									<StatusBadge status={rup.status} />

									{rup?.reason && (
										<>
											<p className='font-medium'>Причина отказа:</p>
											<p>{rup?.reason}</p>
										</>
									)}

									<p className='font-medium'>Наименование:</p>
									<p>{rup.name}</p>

									<p className='font-medium'>Форма обучения:</p>
									<p>{normalizeStudyForm(rup.studyForm)}</p>
								</div>
							</div>

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Users className='w-4 h-4 mr-2' /> Ответственные
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>Преподаватель:</p>
									<p>
										{rup.teacher ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${rup.teacher.keycloakId}`}
											>
												{rup.teacher.firstName} {rup.teacher.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>

									<p className='font-medium'>Методист:</p>
									<p>
										{rup.methodist ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${rup.methodist.keycloakId}`}
											>
												{rup.methodist.firstName} {rup.methodist.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>
								</div>
							</div>

							{rup.groups[0] && (
								<>
									<Separator />

									<div className='space-y-3'>
										<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
											<ComponentIcon className='w-4 h-4 mr-2' /> Группа
										</h4>

										<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
											<p className='font-medium'>Называние:</p>
											<p>{rup.groups[0]?.name}</p>

											<p className='font-medium'>Курс:</p>
											<p>{rup.course}</p>

											<p className='font-medium'>Учебный год:</p>
											<p>{rup.studyYear}</p>

											<p className='font-medium'>Специальность:</p>
											<p>{rup.groups[0]?.specialty}</p>

											<p className='font-medium'>Квалификация:</p>
											<p>{rup.groups[0]?.qualification}</p>
										</div>
									</div>
								</>
							)}

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Clock className='w-4 h-4 mr-2' /> Часы
								</h4>

								<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
									<p className='font-medium'>Всего часов:</p>
									<p>{formatHours(rup.totalHours)}</p>
								</div>
							</div>
						</div>

						<SheetFooter className='mt-4'>
							<Button asChild className='w-full'>
								<Link href={`/rups/${rup.id}`}>Открыть полную страницу</Link>
							</Button>
							<SheetClose asChild>
								<Button variant='outline'>Закрыть</Button>
							</SheetClose>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>
	)
}
