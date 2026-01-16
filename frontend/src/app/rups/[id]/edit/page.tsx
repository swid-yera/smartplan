'use client'

import { type FC, type KeyboardEvent, useEffect } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Forbidden, Loader } from '@components'
import { hasRole } from '@helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateRupRequest, RupTypeEnum, StudyFormEnum, UserRoleEnum } from '@types'
import { Button, ButtonGroup, Heading } from '@ui'
import { ArrowLeft, EyeIcon, RotateCcw, SaveIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { type RUPFormData, formSchema } from '../../form-schema'

const defaultValues: RUPFormData = {
	name: '',
	code: '',

	type: RupTypeEnum.PRACTICE,
	studyForm: StudyFormEnum.FULL_TIME,
	studyYear: '2025-2026',
	groupId: '', // groupId
	course: 1,

	basis: '',
	goals: '',
	competencies: '',
	summary: '',

	prerequisites: '',
	postrequisites: '',
	internetResources: [],
	technicalResources: [],

	contacts: [], // default creator id :(
	disciplines: [],
}

const EditPage: FC = () => {
	const { replace } = useRouter()
	const { id } = useParams<{ id: string }>()
	// auth
	const { user, authLoading } = useAuthStore()
	// queries
	const { data: rupData, isLoading } = useQuery({ ...services.rup.getByIdOptions(id), enabled: !!id })
	// mutations
	const updateMutation = useMutation(services.rup.updateOptions())

	// form
	const methods = useForm<RUPFormData>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		shouldUnregister: false,
		defaultValues,
	})

	// form update default values
	useEffect(() => {
		if (!rupData) return

		methods.reset({
			...rupData,
			...rupData.explorationNote,
			disciplines: rupData?.disciplines ?? [],
			groupId: rupData.groups[0]?.keycloak_id,
			// @ts-ignore
			contacts: rupData.contacts.map((c) => c?.keycloak_id),
		})
	}, [rupData, methods.reset])

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

	const onSubmit = (newData: RUPFormData) => {
		if (!rupData) return
		console.log(newData)

		// mapped disciplines
		const mappedDisciplines = newData.disciplines.map((discipline) => ({
			...discipline,
			topics: discipline.topics.map((topic) => ({
				...topic,
				// Заменяем undefined на 0 для всех числовых полей
				individualHours: topic.individualHours ?? 0,
				srspHours: topic.srspHours ?? 0,
				srsHours: topic.srsHours ?? 0,
			})),
		}))

		// mapped data
		const mappedData: IUpdateRupRequest = {
			...newData,
			groups: [newData.groupId],
			// @ts-ignore
			teacher: rupData?.teacher.id ?? user?.keycloakID,
			explorationNote: {
				basis: newData.basis ?? '',
				goals: newData.goals ?? '',
				competencies: newData.competencies ?? '',
				summary: rupData?.explorationNote.summary ?? '',

				prerequisites: newData.prerequisites ?? '',
				postrequisites: newData.postrequisites ?? '',

				internetResources: newData.internetResources,
				technicalResources: newData.technicalResources,
			},
			disciplines: mappedDisciplines,
		}

		const toastId = `rup-${rupData.id}-update`

		toast.loading('Сохранение данных...', { id: toastId })

		updateMutation.mutate(
			{ id: rupData.id, changedRup: mappedData },
			{
				onSuccess: (updatedRup) => {
					toast.success(`${updatedRup.code} успешно обновлен`, { id: toastId })
					replace(`/rups/${updatedRup.id}`)
				},
				onError: (err) => {
					toast.error(`Произошла ошибка при обновлений ${mappedData.code}`, {
						id: toastId,
						description: err.message,
					})
				},
			},
		)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	if (isLoading || authLoading) return <Loader />
	if (!user) return notFound()
	if (!rupData) notFound()
	// Redirect if not allowed to edit
	if (hasRole(user.role, UserRoleEnum.TEACHER) && rupData?.teacher.keycloakID) return <Forbidden />

	return (
		<FormProvider {...methods}>
			<form
				className='w-full mx-auto px-4 py-6 space-y-4'
				onKeyDown={handleKeyDown}
				onSubmit={methods.handleSubmit(onSubmit)}
			>
				<div className='flex items-center gap-4'>
					<Button asChild size='icon' type='button' variant='outline'>
						<Link href={`/rups/${id}`}>
							<ArrowLeft />
						</Link>
					</Button>

					<div className='w-full'>
						<Heading align='left' size='h1'>
							Редактирование: {rupData.name || 'Рабочий учебный план'}
						</Heading>
					</div>

					<ButtonGroup>
						<Button asChild size='sm' type='button' variant='outline'>
							<Link href={`/rups/${rupData.id}`}>
								<EyeIcon />
								Просмотр
							</Link>
						</Button>
						<Button
							className='hover:text-destructive'
							disabled={!methods.formState.isDirty}
							size='sm'
							type='button'
							variant='outline'
							onClick={() => methods.reset()}
						>
							<RotateCcw className='mr-2 h-4 w-4' />
							Сбросить изменения
						</Button>
						<Button
							className='hover:text-primary'
							disabled={!methods.formState.isDirty}
							size='sm'
							type='submit'
							variant='outline'
						>
							<SaveIcon className='mr-2 h-4 w-4' />
							Сохранить
						</Button>
					</ButtonGroup>
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
									Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
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
					<Button disabled={!methods.formState.isDirty} size='lg' type='submit' variant='default'>
						Сохранить изменения
					</Button>
				</div>
			</form>
		</FormProvider>
	)
}

export default EditPage
