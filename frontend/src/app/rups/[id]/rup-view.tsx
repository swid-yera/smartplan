import { type FC, type ReactNode, useState } from 'react'

import { PageTitle, ResponsibleUsersCard, StatusBadge } from '@components'
import { createKriptoApprovalProof, extractKriptoApprovalMetadata, formatHours, hasRole, normalizeStudyForm, parseKriptoFileText } from '@helpers'
import { services } from '@services'
import {
	Button,
	ButtonGroup,
	Checkbox,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@shadcn'
import { type IRup, RoleEnum, StatusEnum } from '@types'
import { CheckCircle, Search, SendToBack, ShieldAlert, Timer } from 'lucide-react'
import { toast } from 'sonner'

import { ContactsView, DisciplineView, ExplorationView, TopicsView } from '../components'
import { BasicView } from '../components/view/basic-view'

interface IRupViewProps {
	data: IRup
	role: RoleEnum
	onStatusChange: (
		newStatus: StatusEnum,
		options?: { reason?: string; keyId?: string; userId?: string; publicKey?: string; challenge?: string; signature?: string },
	) => void
	actions?: ReactNode
}

export const RupView: FC<IRupViewProps> = ({ data, role, onStatusChange, actions }) => {
	const [generalComment, setGeneralComment] = useState('')
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false)
	const [keyId, setKeyId] = useState('')
	const [userId, setUserId] = useState('')
	const [kriptoFileText, setKriptoFileText] = useState('')
	const [kriptoPassword, setKriptoPassword] = useState('')
	const [fileName, setFileName] = useState('')
	const [checked, setChecked] = useState(false)
	const isMethodistReview = hasRole(role, RoleEnum.METHODIST, true) && data.status === StatusEnum.IN_REVIEW

	const onApproveFileUpload = async (file?: File) => {
		if (!file) return
		if (!file.name.toLowerCase().endsWith('.kripto')) {
			toast.error('Поддерживаются только .kripto v3')
			return
		}

		const content = await file.text()
		const parsed = parseKriptoFileText(content)
		const metadata = extractKriptoApprovalMetadata(parsed)

		setKeyId(metadata.keyId)
		setUserId(metadata.userId)
		setKriptoFileText(content)
		setFileName(file.name)
		toast.success('Файл ЭЦП успешно разобран')
	}

	return (
		<div className='w-full mx-auto relative'>
			<PageTitle
				sticky
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
									onClick={() => setIsApproveSheetOpen(true)}
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
					hasRole(role, RoleEnum.METHODIST)
						? 'Проверка рабочей учебной программы.'
						: 'Просмотр рабочей учебной программы. Редактирование запрещено.'
				}
			>
				{` ${data.name || 'Рабочая учебная программа '} `}
				<StatusBadge status={data.status} />
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
				{data.status === StatusEnum.IN_REVIEW && (
					<div className='rounded-lg border border-secondary/50 bg-secondary/5 p-4 text-secondary'>
						<div className='flex items-center gap-2 font-semibold'>
							<Timer className='h-5 w-5' />
							Ожидайте пока методист проверит ваш документ
						</div>
					</div>
				)}
				{data.status === StatusEnum.DRAFT && (
					<div className='rounded-lg border border-primary/50 bg-primary/5 p-4 text-primary'>
						<div className='flex items-center gap-2 font-semibold'>
							<Search className='h-5 w-5' />
							Проверьте документ и отправьте на согласование
						</div>
					</div>
				)}
				{data.status === StatusEnum.APPROVED && (
					<div className='rounded-lg border border-muted-foreground/50 bg-muted-foreground/5 p-4 text-muted-foreground'>
						<div className='flex items-center gap-2 font-semibold'>
							<Search className='h-5 w-5' />
							Редактирование запрещено, файл сгенерирован.
						</div>
					</div>
				)}

				<div className='mt-6 grid gap-6 xl:grid-cols-4 lg:grid-cols-3'>
					<BasicView
						className='xl:col-span-3 lg:col-span-2'
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
									<ul className='list-decimal ml-3'>
										{data.contacts.map((c) => (
											<li key={c.keycloakId}>{`${c.firstName} ${c.lastName}`}</li>
										))}
									</ul>
								),
							},
						]}
						title='Рабочая учебная программа по модулю'
					/>

					<ResponsibleUsersCard
						createdAt={data.createdAt}
						methodist={data.methodist}
						teacher={data.teacher}
						updatedAt={data.updatedAt}
					/>
				</div>

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
								onStatusChange(StatusEnum.REJECTED, { reason: generalComment })
								setIsRejectSheetOpen(false)
							}}
						>
							Отклонить
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<Sheet open={isApproveSheetOpen} onOpenChange={setIsApproveSheetOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Подтверждение РУП</SheetTitle>
						<SheetDescription>
							Загрузите .kripto v3, введите пароль и подпишите challenge для проверки владения ключом.
						</SheetDescription>
					</SheetHeader>
					<div className='px-4 grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='approve-kripto-file'>Файл ЭЦП (.kripto)</Label>
							<Input
								accept='.kripto,application/json'
								id='approve-kripto-file'
								type='file'
								onChange={(e) => {
									const file = e.target.files?.[0]
									onApproveFileUpload(file).catch((err) => {
										toast.error(err.message || 'Ошибка при чтении файла ЭЦП')
									})
								}}
							/>
							{fileName && <p className='text-xs text-muted-foreground'>Файл: {fileName}</p>}
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='approve-key-id'>Определенный key_id</Label>
							<Input
								id='approve-key-id'
								placeholder='UUID ключа'
								readOnly
								value={keyId}
							/>
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='approve-kripto-password'>Пароль .kripto</Label>
							<Input
								id='approve-kripto-password'
								type='password'
								value={kriptoPassword}
								onChange={(e) => setKriptoPassword(e.target.value)}
							/>
						</div>

						<label className='flex items-center gap-2 text-sm'>
							<Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
							<span>Подтверждаю, что ключ должен быть проверен в kripto перед утверждением</span>
						</label>
					</div>
					<SheetFooter>
						<Button variant='outline' onClick={() => setIsApproveSheetOpen(false)}>
							Отмена
						</Button>
						<Button
							onClick={async () => {
								if (!kriptoFileText || !keyId.trim() || !userId.trim()) {
									toast.error('Загрузите .kripto v3 файл')
									return
								}
								if (!kriptoPassword) {
									toast.error('Введите пароль от .kripto')
									return
								}
								if (!checked) {
									toast.error('Подтвердите галочкой проверку ключа')
									return
								}

								try {
									const { challenge } = await services.rup.createApproveChallenge(data.id, {
										key_id: keyId,
										user_id: userId,
									})
									const proof = await createKriptoApprovalProof(kriptoFileText, kriptoPassword, challenge)
									onStatusChange(StatusEnum.APPROVED, {
										keyId: proof.keyId,
										userId: proof.userId,
										publicKey: proof.publicKey,
										challenge: proof.challenge,
										signature: proof.signature,
									})
									setIsApproveSheetOpen(false)
									setKeyId('')
									setUserId('')
									setKriptoFileText('')
									setKriptoPassword('')
									setFileName('')
									setChecked(false)
								} catch (err) {
									toast.error(err instanceof Error ? err.message : 'Ошибка проверки .kripto')
								}
							}}
						>
							Утвердить
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	)
}
