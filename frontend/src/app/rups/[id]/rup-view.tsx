'use client'

import { type FC, type ReactNode, useState } from 'react'

import Link from 'next/link'

import { hasRole, normalizeRupStatus, rupStatusVariants } from '@helpers'
import { type IRup, RupStatusEnum, UserRoleEnum } from '@types'
import {
	Badge,
	Button,
	ButtonGroup,
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Heading,
	Separator,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@ui'
import { ArrowLeft, CheckCircle, ExternalLink, MessageSquarePlus, MessageSquareText, SendToBack } from 'lucide-react'
import { toast } from 'sonner'

import { DisciplineCardView } from '../components/discipline-card-view'
import { TopicsCardView } from '../components/topics-view'

interface IRupViewProps {
	data: IRup
	role: UserRoleEnum
	onStatusChange: (newStatus: RupStatusEnum, reason?: string) => void
	actions?: ReactNode
}

export const RupView: FC<IRupViewProps> = ({ data, role, onStatusChange, actions }) => {
	const isMethodistReview = hasRole(role, UserRoleEnum.METHODIST) && data.status === RupStatusEnum.IN_REVIEW
	const [comments, setComments] = useState<Record<string, string>>({})
	const [generalComment, setGeneralComment] = useState('')

	const handleCommentChange = (fieldId: string, text: string) => {
		setComments((prev) => ({ ...prev, [fieldId]: text }))
	}

	return (
		<div className='w-full mx-auto px-4 py-6 space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button asChild size='icon' type='button' variant='outline'>
					<Link href='/rups'>
						<ArrowLeft />
					</Link>
				</Button>

				<div className='w-full'>
					<Heading align='left' size='h1'>
						{data.name || 'Рабочий учебный план'}{' '}
						<Badge variant={rupStatusVariants[data.status] ?? 'outline'}>{normalizeRupStatus(data.status)}</Badge>
					</Heading>

					<p className='text-muted-foreground'>
						{hasRole(role, UserRoleEnum.METHODIST)
							? 'Проверка рабочего учебного плана.'
							: 'Просмотр рабочего учебного плана. Редактирование запрещено.'}
					</p>
				</div>

				<ButtonGroup>
					{actions}
					{isMethodistReview && (
						<ButtonGroup>
							<Button
								className='hover:text-destructive'
								size='sm'
								variant='outline'
								onClick={() => {
									if (!generalComment.trim()) {
										toast.error('Пожалуйста, укажите причину отклонения в поле "Общий комментарий"')

										return
									}

									onStatusChange(RupStatusEnum.REJECTED, generalComment)
								}}
							>
								<SendToBack className='mr-2 h-4 w-4' />
								Отклонить
							</Button>

							<Button
								className='hover:text-primary'
								size='sm'
								variant='outline'
								onClick={() => onStatusChange(RupStatusEnum.APPROVED)}
							>
								<CheckCircle className='mr-2 h-4 w-4' />
								Утвердить
							</Button>
						</ButtonGroup>
					)}
				</ButtonGroup>
			</div>

			<div className='space-y-6'>
				{/* base & group */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* base */}
					<Card>
						<CardHeader>
							<CardTitle>Общие сведения</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='title'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Наименование модуля'
							>
								{data?.code} {data?.name}
							</InfoItem>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='type'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Тип модуля'
							>
								{data?.type}
							</InfoItem>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='studyForm'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Форма обучения'
							>
								{data?.studyForm}
							</InfoItem>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='year'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Год'
							>
								{data?.studyYear}
							</InfoItem>
						</CardContent>
					</Card>

					{/* group  */}
					<Card>
						<CardHeader>
							<CardTitle>Группа и специальность</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='group'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Группа'
							>
								{data.groups[0]?.name}
							</InfoItem>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='specialty'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Специальность'
							>
								{data.groups[0]?.specialty}
							</InfoItem>
							<InfoItem
								commentSlot={
									isMethodistReview && (
										<CommentControl
											comments={comments}
											fieldId='qualification'
											onCommentChange={handleCommentChange}
										/>
									)
								}
								label='Квалификация'
							>
								{data.groups[0]?.qualification}
							</InfoItem>
						</CardContent>
					</Card>
				</div>

				{/* goals and exploration */}
				<Card>
					{/* goals */}
					<CardHeader>
						<CardTitle>Цели и задачи</CardTitle>
						{isMethodistReview && (
							<CardAction>
								<CommentControl comments={comments} fieldId='goals' onCommentChange={handleCommentChange} />
							</CardAction>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-sm leading-relaxed'>{data.explorationNote.goals || '—'}</p>
					</CardContent>

					<Separator />

					{/* exploration */}
					<CardHeader className='flex items-center justify-between'>
						<CardTitle>Пояснительная записка</CardTitle>
						{isMethodistReview && (
							<CardAction>
								<CommentControl
									comments={comments}
									fieldId='explorationNote'
									onCommentChange={handleCommentChange}
								/>
							</CardAction>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-sm leading-relaxed'>{data.explorationNote.basis || '—'}</p>
					</CardContent>
				</Card>

				{/* resources */}
				<Card className='grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6'>
					{/* internet resources */}
					<div>
						<CardHeader className='flex-row items-center justify-between'>
							<CardTitle>Учебно-методические ресурсы</CardTitle>
							{isMethodistReview && (
								<CardAction>
									<CommentControl
										comments={comments}
										fieldId='internetResources'
										onCommentChange={handleCommentChange}
									/>
								</CardAction>
							)}
						</CardHeader>
						<CardContent>
							{data.explorationNote.internetResources?.length > 0 ? (
								<ul className='list-disc space-y-2 pl-5 text-sm'>
									{data.explorationNote.internetResources.map((res, i) => (
										<li key={i} className='group'>
											<div className='flex items-center gap-2'>
												<span>{res.name}</span>

												{res.link && (
													<Link
														className='inline-flex items-center text-primary hover:underline underline-offset-4'
														href={res.link}
														rel='noopener noreferrer'
														target='_blank'
													>
														<ExternalLink className='h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity' />
													</Link>
												)}
											</div>
										</li>
									))}
								</ul>
							) : (
								<p className='text-sm text-muted-foreground'>Ресурсы не указаны.</p>
							)}
						</CardContent>
					</div>

					{/* Responsive Separator */}
					<div>
						<Separator className='lg:hidden' />
						<Separator className='hidden lg:block' orientation='vertical' />
					</div>

					{/* technical resources */}
					<div>
						<CardHeader className='flex-row items-center justify-between'>
							<CardTitle>Технические средства и материалы</CardTitle>
							{isMethodistReview && (
								<CardAction>
									<CommentControl
										comments={comments}
										fieldId='technicalResources'
										onCommentChange={handleCommentChange}
									/>
								</CardAction>
							)}
						</CardHeader>
						<CardContent>
							{data.explorationNote.technicalResources?.length > 0 ? (
								<ul className='list-disc space-y-2 pl-5 text-sm'>
									{data.explorationNote.technicalResources.map((res, i) => (
										<li key={i} className='group'>
											<div className='flex items-center gap-2'>
												<span>{res.name}</span>

												{res.link && (
													<Link
														className='inline-flex items-center text-primary hover:underline underline-offset-4'
														href={res.link}
														rel='noopener noreferrer'
														target='_blank'
													>
														<ExternalLink className='h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity' />
													</Link>
												)}
											</div>
										</li>
									))}
								</ul>
							) : (
								<p className='text-sm text-muted-foreground'>Материалы не указаны.</p>
							)}
						</CardContent>
					</div>
				</Card>

				{/* disciplines view */}
				<DisciplineCardView
					commentSlot={
						isMethodistReview && (
							<CommentControl comments={comments} fieldId='disciplines' onCommentChange={handleCommentChange} />
						)
					}
					disciplines={data.disciplines}
				/>

				{/* topics view */}
				<TopicsCardView disciplines={data.disciplines} type={data.type} />

				{isMethodistReview && (
					<Card>
						<CardHeader>
							<CardTitle>Общий комментарий к РУП</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								placeholder='Оставьте общий комментарий или замечания по всему рабочему плану...'
								rows={6}
								value={generalComment}
								onChange={(e) => setGeneralComment(e.target.value)}
							/>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}

const CommentControl: FC<{
	fieldId: string
	comments: Record<string, string>
	onCommentChange: (fieldId: string, text: string) => void
}> = ({ fieldId, comments, onCommentChange }) => {
	const [isCommenting, setIsCommenting] = useState(false)
	const comment = comments[fieldId]

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button size='icon' variant='ghost' onClick={() => setIsCommenting(true)}>
							{comment ? (
								<MessageSquareText className='h-4 w-4 text-blue-500' />
							) : (
								<MessageSquarePlus className='h-4 w-4 text-muted-foreground' />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{comment ? 'Редактировать комментарий' : 'Добавить комментарий'}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			{isCommenting && (
				<Dialog open={isCommenting} onOpenChange={setIsCommenting}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Комментарий к полю</DialogTitle>
						</DialogHeader>
						<Textarea
							placeholder='Введите ваш комментарий...'
							rows={5}
							value={comment || ''}
							onChange={(e) => onCommentChange(fieldId, e.target.value)}
						/>
						<DialogFooter>
							<Button onClick={() => setIsCommenting(false)}>Сохранить</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</>
	)
}

const InfoItem: FC<{ label: string; children: ReactNode; commentSlot?: ReactNode }> = ({
	label,
	children,
	commentSlot,
}) => (
	<div className='flex justify-between items-start gap-4'>
		<div>
			<p className='text-sm text-muted-foreground'>{label}</p>
			<div className='text-base font-semibold'>{children || '—'}</div>
		</div>
		{commentSlot}
	</div>
)
