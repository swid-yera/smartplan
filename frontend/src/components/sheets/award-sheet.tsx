import type { FC } from 'react'

import Link from 'next/link'

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
import { type IAward, StatusEnum } from '@types'
import { BookOpen, Download, FileText, Files, SearchCode, Users } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'

import { StatusBadge } from '../badges/status-badge'

interface IAwardSheet {
	onSelect: (award: IAward | null) => void
	award: IAward | null
}

export const AwardSheet: FC<IAwardSheet> = ({ award, onSelect }) => {
	const totalPoints =
		award?.status !== StatusEnum.APPROVED ? 'Баллы зачисляются после утверждений методиста' : award.totalPoints

	return (
		<Sheet open={!!award} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent className='overflow-y-auto sm:max-w-md w-full'>
				{award && (
					<>
						<SheetHeader>
							<SheetTitle className='mt-2'>
								{`${award.variant.name}, ${award.criteria.name} `}
								<StatusBadge status={award.status} />
							</SheetTitle>
							<SheetDescription>Краткая информация о рабочей учебной программы.</SheetDescription>
						</SheetHeader>

						<div className='grid flex-1 auto-rows-min gap-6 px-4'>
							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<BookOpen className='w-4 h-4 mr-2' /> Основное
								</h4>

								<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
									<p className='font-medium'>Статус:</p>
									<StatusBadge status={award.status} />

									{award?.reason && (
										<>
											<p className='font-medium'>Причина отказа:</p>
											<p>{award?.reason}</p>
										</>
									)}

									<p className='font-medium'>Критерия:</p>
									<p>
										{award.variant.name}, {award.criteria.name}
									</p>

									<p className='font-medium'>Количество баллов:</p>
									<p>{totalPoints}</p>

									<p className='font-medium'>Описание:</p>
									<p>{award.text || 'Пусто'}</p>
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
										{award.teacher ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${award.teacher.keycloakId}`}
											>
												{award.teacher.firstName} {award.teacher.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>

									<p className='font-medium'>Методист:</p>
									<p>
										{award.methodist ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${award.methodist.keycloakId}`}
											>
												{award.methodist.firstName} {award.methodist.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>
								</div>
							</div>

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<SearchCode className='w-4 h-4 mr-2' /> Подробности
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>Критерия оценок:</p>
									<p>{award.type.name || 'Пусто'}</p>

									<p className='font-medium'>Вариант:</p>
									<p>{award.variant.name || 'Пусто'}</p>

									<p className='font-medium'>Критерий:</p>
									<p className='font-semibold'>{award.criteria.name || 'Пусто'}</p>

									<p className='font-medium'>Баллы за критерию:</p>
									<p className='font-bold'>{award.criteria.points.join('-') || 'Пусто'}</p>
								</div>
							</div>

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Files className='w-4 h-4 mr-2' /> Документы
								</h4>

								<div className='space-y-4'>
									{(award?.files || []).map((file, idx) => {
										const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(file)

										if (isImage) {
											return (
												<div key={idx} className='space-y-2 max-w-md'>
													<Zoom>
														<img
															alt='preview'
															className='cursor-zoom-in rounded-lg'
															height={300}
															src={file}
															width={400}
														/>
													</Zoom>
													<Button asChild size='sm' variant='outline'>
														<a download href={file} rel='noopener noreferrer' target='_blank'>
															<Download className='mr-2 h-4 w-4' />
															Скачать
														</a>
													</Button>
												</div>
											)
										}

										return (
											<div key={idx} className='text-sm flex items-center gap-2'>
												<FileText className='h-4 w-4 text-muted-foreground' />
												<a
													download
													className='truncate max-w-[300px] hover:underline text-primary'
													href={file}
													rel='noopener noreferrer'
													target='_blank'
												>
													{file}
												</a>
											</div>
										)
									})}
								</div>
							</div>
						</div>

						<SheetFooter className='mt-4'>
							<Button asChild className='w-full'>
								<Link href={`/kpi/${award.id}`}>Открыть полную страницу</Link>
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
