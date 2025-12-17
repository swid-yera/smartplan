'use client'

import { type FC, type KeyboardEvent, useEffect, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Heading,
	Spinner,
	buttonVariants,
} from '@ui'
import { ArrowLeft } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { statusLabels, statusVariants } from '@/helpers'
import { deleteRupModuleById, getRupModuleById, updateRupModule } from '@/services'
import { type IRupModule, RupModuleStatus } from '@/shared/types'

import {
	BasicDataCard,
	ContactsCard,
	DisciplineCard,
	ExplorationNoteCard,
	GoalsCard,
	GroupCard,
	ResourceListCard,
	TopicsCard,
} from '../components'
import { type RUPFormData, formSchema } from '../create/form-schema'
import { groupData } from '../create/mock.data'

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

const Page: FC = () => {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const [rupData, setRupData] = useState<IRupModule | null>(null)
	const [loading, setLoading] = useState(true)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const methods = useForm<RUPFormData>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		shouldUnregister: false,
		defaultValues,
	})

	// fetch rup
	useEffect(() => {
		fetchRup()
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

		// Close the dialog regardless of the outcome
		setIsDeleteDialogOpen(false)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	// render
	if (loading) {
		return <Spinner />
	}

	if (!rupData) {
		notFound()
	}

	return (
		<FormProvider {...methods}>
			<form
				className='w-full mx-auto px-4 py-6 space-y-4'
				onKeyDown={handleKeyDown}
				onSubmit={methods.handleSubmit(onSubmit)}
			>
				{/* Back button and heading */}
				<div className='flex items-center gap-4'>
					<Button asChild size='icon' type='button' variant='outline'>
						<Link href='/rups'>
							<ArrowLeft />
						</Link>
					</Button>

					<div className='w-full'>
						<Heading align='left' size='h1'>
							{rupData.title || 'Рабочий учебный план'}{' '}
							<Badge variant={statusVariants[rupData.status] ?? 'outline'}>
								{!rupData.status ? statusLabels[RupModuleStatus.DRAFT] : statusLabels[rupData.status]}
							</Badge>
						</Heading>
						<p className='text-muted-foreground'>Просмотр и редактирование рабочего учебного плана.</p>
					</div>

					<div className='flex gap-4 justify-end'>
						<Button size='lg' type='button' variant='outline' onClick={() => setIsDeleteDialogOpen(true)}>
							Удалить
						</Button>

						<Button size='lg' type='submit' variant='default'>
							Сохранить
						</Button>
					</div>
				</div>

				{/* content */}
				<div className='w-full space-y-5'>
					{/* basic data and exploration note cards */}
					<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]'>
						<BasicDataCard />

						<GroupCard />
					</div>

					{/* goals and group cards */}
					<div className='grid gap-4 md:grid-cols-2'>
						<GoalsCard />

						<ExplorationNoteCard />
					</div>

					<ContactsCard />

					{/* resource card */}
					<div className='grid md:grid-cols-2 gap-4'>
						{/* internet  */}
						<ResourceListCard
							buttonText='Добавить ресурс'
							description={
								<>
									Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
								</>
							}
							label='Учебно-методический ресурсы'
							name='internetResources'
							placeholder='Откуда был взят материал для учебного плана'
							title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
						/>

						{/* technical */}
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

				{/* submit */}
				<div className='flex justify-end gap-4 '>
					<Button size='lg' type='button' variant='outline' onClick={() => setIsDeleteDialogOpen(true)}>
						Удалить
					</Button>

					<Button size='lg' type='submit' variant='default'>
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
	)
}

export default Page
