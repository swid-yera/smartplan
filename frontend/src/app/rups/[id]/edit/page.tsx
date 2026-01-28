'use client'

import { type FC, type KeyboardEvent, useEffect } from 'react'

import { notFound, useParams, useRouter } from 'next/navigation'

import { Forbidden, Loader, PageTitle } from '@components'
import { isAuthor } from '@helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateRupRequest, RupTypeEnum, StudyFormEnum } from '@types'
import { Button, ButtonGroup } from '@ui'
import { RotateCcw, SaveIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Step1 } from '../../create/step1'
import { Step2 } from '../../create/step2'
import { Step3 } from '../../create/step3'
import { Step4 } from '../../create/step4'
import { type RUPFormData, rupFormSchema } from '../../rup-schema'

const defaultValues: RUPFormData = {
	name: '',

	type: RupTypeEnum.PRACTICE,
	studyForm: StudyFormEnum.FULL_TIME,
	studyYear: '2025-2026',
	groupId: '',
	course: 1,

	basis: '',
	goals: '',
	competencies: '',

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
		resolver: zodResolver(rupFormSchema),
		mode: 'onChange',
		shouldUnregister: false,
		values: rupData
			? {
					...rupData,
					...rupData.explorationNote,
					internetResources:
						rupData.explorationNote?.internetResources?.map((r) => ({
							name: r.name ?? '',
							link: r.link ?? '', // Превращаем undefined в ""
						})) ?? [],
					technicalResources:
						rupData.explorationNote?.technicalResources?.map((r) => ({
							name: r.name ?? '',
							link: r.link ?? '',
						})) ?? [],
					disciplines: rupData.disciplines ?? [],
					groupId: rupData.groups[0]?.keycloakId,
					contacts: rupData.contacts.map((c) => c.keycloakId),
				}
			: defaultValues,
	})

	// form update default values
	useEffect(() => {
		if (!rupData) return

		const mappedValues: RUPFormData = {
			...rupData,
			...rupData.explorationNote,
			internetResources:
				rupData.explorationNote?.internetResources?.map((r) => ({
					name: r.name ?? '',
					link: r.link ?? '',
				})) ?? [],
			technicalResources:
				rupData.explorationNote?.technicalResources?.map((r) => ({
					name: r.name ?? '',
					link: r.link ?? '',
				})) ?? [],
			disciplines: rupData?.disciplines ?? [],
			groupId: rupData.groups[0]?.keycloakId,
			contacts: rupData.contacts.map((c) => c?.keycloakId),
		}

		methods.reset(mappedValues, { keepDirty: false, keepTouched: false })
	}, [rupData, methods])

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
				summary: '',

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
					toast.success(`${updatedRup.name} успешно обновлен`, { id: toastId })
					replace(`/rups/${updatedRup.id}`)
				},
				onError: (err) => {
					toast.error(`Произошла ошибка при обновлений ${mappedData.name}`, {
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
	if (!isAuthor(user, rupData.teacher.keycloakId)) return <Forbidden />

	return (
		<FormProvider {...methods}>
			<form
				className='w-full mx-auto px-4 py-6 space-y-4'
				onKeyDown={handleKeyDown}
				onSubmit={methods.handleSubmit(onSubmit)}
			>
				<PageTitle
					sticky
					actions={
						<ButtonGroup>
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
					}
					backHref={`/rups/${rupData.id}`}
					description='Редактирование рабочей учебной программы'
				>
					Редактирование: {rupData.name || 'Рабочая учебная программа'}
				</PageTitle>

				<Step1 />
				<Step2 />
				<Step3 />
				<Step4 />
			</form>
		</FormProvider>
	)
}

export default EditPage
