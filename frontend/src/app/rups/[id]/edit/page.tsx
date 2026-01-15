'use client'

import { type FC, type KeyboardEvent, useEffect, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { deleteRupModuleById, getRupModuleById, updateRupModule } from '@services'
import { RoleSwitcher } from '@store'
import { type IRupModule, RupModuleStatus } from '@types'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Heading,
	Spinner,
	buttonVariants,
} from '@ui'
import { ArrowLeft } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import useUserRoleStore from '../../../../store/user-role.store'
import {
	BasicDataCard,
	ContactsCard,
	DisciplineCard,
	ExplorationNoteCard,
	GoalsCard,
	GroupCard,
	ResourceListCard,
	TopicsCard,
} from '../../components'
import { type RUPFormData, formSchema } from '../../create/form-schema'
import { groupData } from '../../create/mock.data'
import { mockRupModules } from '../../mock.data'

const defaultValues: RUPFormData = {
	title: '',
	type: '',
	studyForm: '',
	explorationNote: '',
	goals: '',
	prerequisites: '',
	postrequisites: '',
	year: '',
	groupId: '',
	contacts: [],
	internetResources: [],
	technicalResources: [],
	disciplines: [],
}

const EditPage: FC = () => {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const [rupData, setRupData] = useState<IRupModule | null>(mockRupModules[1])
	const [loading, setLoading] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const { role } = useUserRoleStore()

	const methods = useForm<RUPFormData>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		shouldUnregister: false,
		defaultValues,
	})

	// fetch rup
	useEffect(() => {
		// fetchRup()
	}, [params.id])

	const fetchRup = async () => {
		setLoading(true)
		const data = await getRupModuleById(params.id)

		if (!data) {
			setRupData(null)
		} else {
			console.log(data)
			setRupData(data)
			methods.reset({ ...data, groupId: data.group?.id })
		}
		setLoading(false)
	}

	// Redirect if not allowed to edit
	useEffect(() => {
		if (rupData) {
			if (role === 'METHODIST' || (rupData.status !== RupModuleStatus.DRAFT && role === 'TEACHER')) {
				router.push(`/rups/${params.id}`)
			}
		}
	}, [rupData, role, params.id, router])

	// Warn user about unsaved changes before leaving the page.
	// NOTE: This works for page reloads, closing the tab, or navigating away.
	// It does not prevent client-side navigation via <Link> in Next.js App Router without more complex handling.
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (methods.formState.isDirty) {
				e.preventDefault()
				e.returnValue = '' // Required for legacy browsers, modern browsers show a generic message.
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [methods.formState.isDirty])

	const onSubmit = (data: RUPFormData) => {
		const newData = {
			...data,
			id: params.id,
			status: rupData?.status ?? RupModuleStatus.DRAFT,
			group: groupData.find((g) => g.id === data.groupId),
		}

		toast.loading('Сохранение данных...', { id: 'rup-update' })

		const result = updateRupModule(newData)

		result.then((res) => {
			if (!res) {
				toast.error('Произошла ошибка при сохранении данных', { id: 'rup-update' })

				return
			}

			toast.success('Данные успешно сохранены!', { id: 'rup-update' })
			methods.reset({ ...res, groupId: res.group?.id })
		})
	}

	const handleStatusChange = async (newStatus: RupModuleStatus) => {
		if (!rupData) return

		const toastId = `rup-status-update-${newStatus}`

		toast.loading('Изменение статуса...', { id: toastId })

		const updatedRup = { ...rupData, status: newStatus }
		const result = await updateRupModule(updatedRup)

		if (result) {
			toast.success('Статус успешно изменен!', { id: toastId })
			router.push(`/rups/${params.id}`)
		} else {
			toast.error('Произошла ошибка при изменении статуса', { id: toastId })
		}
	}

	const handleDelete = async () => {
		if (!rupData) return

		toast.loading('Удаление РУП...', { id: 'rup-delete' })

		const result = await deleteRupModuleById(rupData.id)

		if (result) {
			toast.success('РУП успешно удален!', { id: 'rup-delete' })
			router.push('/rups')
		} else {
			toast.error('Произошла ошибка при удалении', { id: 'rup-delete' })
		}

		setIsDeleteDialogOpen(false)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	if (loading) return <Spinner />
	if (!rupData) notFound()

	return (
		<>
			<RoleSwitcher />
			<FormProvider {...methods}>
				<form
					className='w-full mx-auto px-4 py-6 space-y-4'
					onKeyDown={handleKeyDown}
					onSubmit={methods.handleSubmit(onSubmit)}
				>
					<div className='flex items-center gap-4'>
						<Button asChild size='icon' type='button' variant='outline'>
							<Link href={`/rups/${params.id}`}>
								<ArrowLeft />
							</Link>
						</Button>

						<div className='w-full'>
							<Heading align='left' size='h1'>
								Редактирование: {rupData.title || 'Рабочий учебный план'}
							</Heading>
						</div>

						<div className='flex gap-4 justify-end'>
							<Button
								disabled={!methods.formState.isDirty}
								size='lg'
								type='button'
								variant='secondary'
								onClick={() => methods.reset()}
							>
								Сбросить изменения
							</Button>
							<Button size='lg' type='button' variant='outline' onClick={() => setIsDeleteDialogOpen(true)}>
								Удалить
							</Button>
							<Button disabled={!methods.formState.isDirty} size='lg' type='submit' variant='default'>
								Сохранить
							</Button>
						</div>
					</div>

					<div className='w-full space-y-5'>
						<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]'>
							<BasicDataCard />
							<GroupCard />
						</div>
						<div className='grid gap-4 md:grid-cols-2'>
							<GoalsCard />
							<ExplorationNoteCard />
						</div>
						<ContactsCard />
						<div className='grid md:grid-cols-2 gap-4'>
							<ResourceListCard
								buttonText='Добавить ресурс'
								description={
									<>
										Введите список ресурсов откуда был взят материал,{' '}
										<u>ресурс должен быть не старше 5 лет</u>
									</>
								}
								label='Учебно-методический ресурсы'
								name='internetResources'
								placeholder='Откуда был взят материал для учебного плана'
								title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
							/>
							<ResourceListCard
								buttonText='Добавить материал'
								description='Введите список технических средств которые обязательны для учебного плана'
								label='Технические средства и материалы'
								name='technicalResources'
								placeholder='Что нужно при прохождении учебного плана'
								title='Технические средства и материалы'
							/>
						</div>
						<DisciplineCard />
						<TopicsCard />
					</div>

					<div className='flex justify-end gap-4 '>
						<Button
							disabled={!methods.formState.isDirty}
							size='lg'
							type='button'
							variant='ghost'
							onClick={() => methods.reset()}
						>
							Сбросить изменения
						</Button>
						<Button
							size='lg'
							type='button'
							variant='secondary'
							onClick={() => handleStatusChange(RupModuleStatus.IN_REVIEW)}
						>
							Отправить на согласование
						</Button>
						<Button disabled={!methods.formState.isDirty} size='lg' type='submit' variant='default'>
							Сохранить изменения
						</Button>
					</div>
				</form>
				<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Вы уверены?</AlertDialogTitle>
							<AlertDialogDescription>
								Это действие невозможно отменить. Это приведет к необратимому удалению рабочего учебного плана.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Отмена</AlertDialogCancel>
							<AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={handleDelete}>
								Удалить
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</FormProvider>
		</>
	)
}

export default EditPage
