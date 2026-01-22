import { type FC, type ReactNode, useState } from 'react'

import { PageTitle, RupStatusBadge } from '@components'
import { formatHours, hasRole, normalizeStudyForm } from '@helpers'
import { type IRup, StatusEnum, UserRoleEnum } from '@types'
import {
	Button,
	ButtonGroup,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@ui'
import { CheckCircle, SendToBack, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { ContactsView, DisciplineView, ExplorationView, TopicsView } from '../components'
import { BasicView } from '../components/view/basic-view'

interface IRupViewProps {
	data: IRup
	role: UserRoleEnum
	onStatusChange: (newStatus: StatusEnum, reason?: string) => void
	actions?: ReactNode
}

export const RupView: FC<IRupViewProps> = ({ data, role, onStatusChange, actions }) => {
	const [generalComment, setGeneralComment] = useState('')
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const isMethodistReview = hasRole(role, UserRoleEnum.METHODIST, true) && data.status === StatusEnum.IN_REVIEW

	console.log(data)

	return (
		<div className='w-full mx-auto relative'>
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
									onClick={() => setIsRejectSheetOpen(true)}
								>
									<SendToBack className='mr-2 h-4 w-4' />
									Отклонить
								</Button>

								<Button
									className='hover:text-primary'
									size='sm'
									variant='outline'
									onClick={() => onStatusChange(StatusEnum.APPROVED)}
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
				sticky={true}
			>
				{` ${data.name || 'Рабочий учебный план'} `}
				<RupStatusBadge status={data.status} />
			</PageTitle>

			<div className='space-y-6 px-4 py-6'>
				{data.status === StatusEnum.REJECTED && (
					<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
						<div className='flex items-center gap-2 font-medium'>
							<ShieldAlert className='h-5 w-5' />
							Причина отказа
						</div>
						<div className='mt-2 text-sm whitespace-pre-wrap'>{data.reason || 'Пусто'}</div>
					</div>
				)}
				<BasicView
					rows={[
						{
							label: 'Наименование модуля',
							subLabel: '(наименование модуля или дисциплины)',
							value: data.name,
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
							value: formatHours(data.totalHours),
						},
						{
							label: 'Кредитов',
							value: data.totalHours / 24,
						},
						{
							label: 'Курс',
							value: `${data.course} курс`,
						},
						{
							label: 'Группа',
							value: data.groups[0].name,
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
					title='Рабочая учебная программа по модулю'
				/>

				<ExplorationView data={data} />

				<ContactsView contacts={data.contacts} creatorId={data.teacher.keycloakId} />

				<DisciplineView disciplines={data.disciplines} rupName={data.name} />

				<TopicsView disciplines={data.disciplines} type={data.type} />
			</div>

			<Sheet open={isRejectSheetOpen} onOpenChange={setIsRejectSheetOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Отклонить РУП</SheetTitle>
						<SheetDescription>
							Укажите причину отклонения (проблемы), чтобы преподаватель мог их исправить.
						</SheetDescription>
					</SheetHeader>
					<div className='px-4 grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='reject-reason'>Причина отказа</Label>
							<Textarea
								id='reject-reason'
								placeholder='Опишите проблемы...'
								rows={12}
								value={generalComment}
								onChange={(e) => setGeneralComment(e.target.value)}
							/>
						</div>
					</div>
					<SheetFooter>
						<Button variant='outline' onClick={() => setIsRejectSheetOpen(false)}>
							Отмена
						</Button>
						<Button
							disabled={!generalComment}
							variant='destructive'
							onClick={() => {
								if (!generalComment.trim()) {
									toast.error('Пожалуйста, укажите причину отклонения')

									return
								}
								onStatusChange(StatusEnum.REJECTED, generalComment)
								setIsRejectSheetOpen(false)
							}}
						>
							Отклонить
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	)
}
