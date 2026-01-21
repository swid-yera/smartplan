'use client'

import { type FC, type ReactNode, useState } from 'react'

import Link from 'next/link'

import { PageTitle } from '@components'
import { hasRole, normalizeRupStatus, normalizeStudyForm, rupStatusVariants } from '@helpers'
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
	Separator,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@ui'
import { CheckCircle, ExternalLink, MessageSquarePlus, MessageSquareText, SendToBack } from 'lucide-react'
import { toast } from 'sonner'

import { DisciplineView } from '../components/view/discipline-view'
import { TopicsView } from '../components/view/topics-view'
import { InfoTable } from './info-table'

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

	console.log(data)

	return (
		<div className='w-full mx-auto px-4 py-6 space-y-6'>
			<PageTitle
				actions={
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
				}
				backHref='/rups'
				description={
					hasRole(role, UserRoleEnum.METHODIST)
						? 'Проверка рабочего учебного плана.'
						: 'Просмотр рабочего учебного плана. Редактирование запрещено.'
				}
			>
				{` ${data.name || 'Рабочий учебный план'} `}
				<Badge variant={rupStatusVariants[data.status] ?? 'outline'}>{normalizeRupStatus(data.status)}</Badge>
			</PageTitle>

			<div className='space-y-6'>
				<InfoTable
					title='Рабочая учебная программа по модулю'
					rows={[
						{
							label: 'Наименование модуля',
							subLabel: '(наименование модуля или дисциплины)',
							value: data.name,
							commentSlot: isMethodistReview && (
								<CommentControl comments={comments} fieldId='title' onCommentChange={handleCommentChange} />
							),
						},
						{
							label: 'Специальность',
							subLabel: '(код и наименование)',
							value: data.groups[0]?.specialty,
						},
						{
							label: 'Квалификация',
							subLabel: '(код и наименование)',
							value: data.groups[0]?.qualification,
						},
						{
							label: 'Форма обучения',
							value: normalizeStudyForm(data.studyForm),
						},
						{
							label: 'Общее количество часов',
							value: data.totalHours,
						},
						{
							label: 'Курс / Группа',
							value: `${data.course} / ${data.groups[0]?.name}`,
						},
						{
							label: 'Разработчики',
							value: (
								<ul>
									{data.contacts.map((c) => (
										<li key={c.keycloakId}>{c.firstName + c.lastName}</li>
									))}
								</ul>
							),
						},
					]}
				/>

				{/*  exploration note */}
				<Card>
					<CardHeader>
						<CardTitle>Пояснительная записка</CardTitle>
						{isMethodistReview && (
							<CardAction>
								<CommentControl comments={comments} fieldId='goals' onCommentChange={handleCommentChange} />
							</CardAction>
						)}
					</CardHeader>

					<CardContent>
						<p className='leading-relaxed indent-4'>{data.explorationNote.basis || '—'}</p>
						<p className='leading-relaxed indent-4'>{data.explorationNote.goals || '—'}</p>
						<p className='leading-relaxed indent-4'>
							<span className='font-bold'>Формируемые компетенции: </span>
							{data.explorationNote.competencies || '—'}
						</p>

						<Separator className='my-2' />

						<p className='leading-relaxed indent-4'>
							<span className='font-bold'>Пререквизиты: </span>
							{data.explorationNote.prerequisites || '—'}
						</p>
						<p className='leading-relaxed indent-4'>
							<span className='font-bold'>Постреквизиты: </span>
							{data.explorationNote.postrequisites || '—'}
						</p>

						<Separator className='my-2' />

						<p className='font-bold indent-4'>Необходимые средства обучения, оборудование:</p>
						<p className='font-bold indent-4'>
							Учебно-методическое оснащение, справочная литература/интернет-ресурсы:
						</p>
						<ol className='list-decimal space-y-2 pl-5'>
							{data.explorationNote.internetResources.map((res, i) => (
								<li key={i} className='group ml-2'>
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
						</ol>

						<p className='font-bold indent-4'>Технические средства и материалы:</p>
						<ol className='list-decimal space-y-2 pl-5'>
							{data.explorationNote.internetResources.map((res, i) => (
								<li key={i} className='group ml-2'>
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
						</ol>
					</CardContent>
				</Card>

				{/* disciplines view */}
				<DisciplineView
					commentSlot={
						isMethodistReview && (
							<CommentControl comments={comments} fieldId='disciplines' onCommentChange={handleCommentChange} />
						)
					}
					disciplines={data.disciplines}
				/>

				{/* topics view */}
				<TopicsView disciplines={data.disciplines} type={data.type} />

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
