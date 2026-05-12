import { useState } from 'react'

import { type IGenerateRupMeta, generateRupMeta } from '@actions'
import { services } from '@services'
import { Checkbox, Label, Textarea } from '@shadcn'
import { useQuery } from '@tanstack/react-query'
import { RupTypeEnum, StudyFormEnum } from '@types'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { BasicEdit, GenerateCard, GroupEdit, NoteEdit } from '../components'

type IProps = FieldValues & {
	name: string
	type: RupTypeEnum
	studyForm: StudyFormEnum
	prerequisites: string
	postrequisites: string
	studyYear: string
	course: number
	groupId: string

	basis: string
	goals: string
	competencies: string
}

export function Step1<T extends IProps>() {
	const { getValues, setValue } = useFormContext<T>()
	// states
	const [isLoading, setIsLoading] = useState(false)
	const [additionalMessage, setAdditionalMessage] = useState('')
	const [includeCurrentContent, setIncludeCurrentContent] = useState(true)
	// query
	const { data: groupsData = [], isLoading: groupLoading } = useQuery({
		...services.group.getAllOptions(),
		enabled: true,
	})

	const handleGenerate = async () => {
		if (isLoading || groupLoading) return

		try {
			setIsLoading(true)
			toast.loading('Генерируется метаданные', { id: 'rup-meta-generate' })

			const values = getValues()
			const group = groupsData.find((g) => g.keycloakId === values.groupId)

			if (!group) throw new Error('Group not found')

			const mappedData: IGenerateRupMeta = {
				name: values.name,
				course: values.course,
				group: group,
				prerequisites: values.prerequisites,
				postrequisites: values.postrequisites,
				type: values.type,
				studyForm: values.studyForm,
				studyYear: values.studyYear,
				message: additionalMessage.trim() || undefined,
				includeCurrentContent,
				currentValues: includeCurrentContent
					? {
							description: values.basis,
							goals: values.goals,
							competence: values.competencies,
							basis: values.basis,
							competencies: values.competencies,
						}
					: undefined,
			}

			const meta = await generateRupMeta(mappedData)

			// write
			setValue('basis' as Path<T>, meta.basis, { shouldDirty: true })
			setValue('goals' as Path<T>, meta.goals, { shouldDirty: true })
			setValue('competencies' as Path<T>, meta.competencies, { shouldDirty: true })

			toast.success('Успешно сгенерировано метаданные', { id: 'rup-meta-generate' })
		} catch (err) {
			toast.error(`Ошибка при генерации метаданных ${err}`, { id: 'rup-meta-generate' })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='w-full space-y-5'>
			<div className='grid gap-4 xl:grid-cols-2'>
				<BasicEdit />
				<GroupEdit />
			</div>

			<GenerateCard
				buttonText={isLoading ? 'Генерация…' : 'Сгенерировать'}
				confirmContent={
					<div className='grid gap-4'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='rup-meta-additional-message'>Дополнительное сообщение</Label>
							<Textarea
								id='rup-meta-additional-message'
								placeholder='Уточните, что нужно учесть при генерации'
								rows={4}
								value={additionalMessage}
								onChange={(event) => setAdditionalMessage(event.target.value)}
							/>
						</div>

						<div className='flex items-center gap-2'>
							<Checkbox
								checked={includeCurrentContent}
								id='rup-meta-include-current-content'
								onCheckedChange={(checked) => setIncludeCurrentContent(checked === true)}
							/>
							<Label htmlFor='rup-meta-include-current-content'>Включить текущий написанный контент</Label>
						</div>
					</div>
				}
				description='Тексты будут сформированы на основе данных модуля и учебной группы. После генерации вы сможете отредактировать их вручную.'
				disabled={isLoading || groupLoading}
				disabledReason='Заполните данные модуля и учебной группы'
				title='Автоматическая генерация описаний'
				onClick={() => handleGenerate()}
			/>

			<NoteEdit
				description='Нормативно-правовая и профессиональная база разработки рабочей учебной программы.'
				label='Описание'
				name='basis'
				placeholder='Рабочая учебная программа по профессиональному модулю «ПМ6 Обеспечение информационной безопасности локальных вычислительных сетей и Internet» разработана в соответствии с Приказом Министра просвещения Республики Казахстан от 3 августа 2022 года №348 с учетом изменений, внесенных 15.04.2025 года. Программа основана на профессиональном стандарте «Сетевые, системные администраторы и администраторы серверов» (дополнение №5 к приказу заместителя председателя правления Национальной палаты предпринимателей Республики Казахстан «Атамекен» №222 от 05.12.2022), а также на стандартах WorldSkills по направлению «Сетевое и системное администрирование». Рабочая учебная программа предназначена для реализации в рамках специальности 06120100 «Вычислительная техника и информационные сети» (по видам) и квалификации 4S06120102 «Техник сетевого и системного администрирования».'
				rows={8}
				title='Основание разработки рабочей учебной программы'
			/>

			<div className='grid gap-4 xl:grid-cols-2'>
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
		</div>
	)
}
