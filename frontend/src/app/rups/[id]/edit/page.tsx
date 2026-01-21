'use client'

import { type FC, type KeyboardEvent, useEffect } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Forbidden, Loader } from '@components'
import { isAuthor } from '@helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateRupRequest, RupTypeEnum, StudyFormEnum } from '@types'
import { Button, ButtonGroup, Heading } from '@ui'
import { ArrowLeft, EyeIcon, RotateCcw, SaveIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { DisciplineEdit, GroupEdit, NoteEdit, ResourceEdit, TopicsEdit } from '../../components'
import { type RUPFormData, formSchema } from '../../form-schema'

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
			groupId: rupData.groups[0]?.keycloakId,
			// @ts-ignore
			contacts: rupData.contacts.map((c) => c?.keycloakId),
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
						<NoteEdit
							description='Нормативно-правовая и профессиональная база разработки рабочей учебной программы.'
							label='Описание'
							name='basis'
							placeholder='Рабочая учебная программа по профессиональному модулю «ПМ6 Обеспечение информационной безопасности локальных вычислительных сетей и Internet» разработана в соответствии с Приказом Министра просвещения Республики Казахстан от 3 августа 2022 года №348 с учетом изменений, внесенных 15.04.2025 года. Программа основана на профессиональном стандарте «Сетевые, системные администраторы и администраторы серверов» (дополнение №5 к приказу заместителя председателя правления Национальной палаты предпринимателей Республики Казахстан «Атамекен» №222 от 05.12.2022), а также на стандартах WorldSkills по направлению «Сетевое и системное администрирование». Рабочая учебная программа предназначена для реализации в рамках специальности 06120100 «Вычислительная техника и информационные сети» (по видам) и квалификации 4S06120102 «Техник сетевого и системного администрирования».'
							rows={8}
							title='Основание разработки рабочей учебной программы'
						/>
						<GroupEdit />
					</div>
					<div className='grid gap-4 md:grid-cols-2'>
						<NoteEdit
							description='Цель освоения профессионального модуля.'
							label='Цели и задачи'
							name='goals'
							placeholder='Целью освоения профессионального модуля является формирование у обучающихся профессиональных знаний, умений и практических навыков в области обеспечения информационной безопасности локальных вычислительных сетей и сети Internet. В процессе освоения модуля обучающиеся изучают архитектуру и основные компоненты локальных вычислительных сетей, принципы их функционирования, методы мониторинга и анализа угроз и уязвимостей информации. Профессиональный модуль направлен на подготовку обучающихся к выполнению работ по настройке, конфигурированию и администрированию средств защиты информации, а также к обеспечению устойчивой и безопасной работы сетевых устройств и программного обеспечения.'
							title='Образовательная цель профессионального модуля.'
						/>
						<NoteEdit
							description='Формируемые профессиональные компетенции.'
							label='Компетенции'
							name='competencies'
							placeholder='В результате освоения профессионального модуля у обучающихся формируются следующие профессиональные компетенции:\n– владение методами и средствами обеспечения информационной безопасности локальных вычислительных сетей и подключенных к ним информационных ресурсов с соблюдением требований охраны труда и техники безопасности;\n– выполнение работ по установке, настройке и администрированию операционных систем и программного обеспечения;\n– управление сетевыми и программными ресурсами, обеспечение их защиты, обновления и сопровождения;\n– анализ угроз информационной безопасности, выявление уязвимостей и реализация мер по их предотвращению.'
							title='Перечень профессиональных компетенций, формируемых в результате освоения модуля.'
						/>
					</div>
					{/* <ContactsEdit creatorId={user} /> */}
					<div className='grid md:grid-cols-2 gap-4'>
						<ResourceEdit
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
						<ResourceEdit
							buttonText='Добавить материал'
							description='Введите список технических средств которые обязательны для учебного плана'
							label='Технические средства и материалы'
							name='technicalResources'
							placeholder='Что нужно при прохождении учебного плана'
							title='Технические средства и материалы'
						/>
					</div>

					<DisciplineEdit />
					<TopicsEdit />
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
