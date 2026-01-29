'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { services } from '@services'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@shadcn'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ICreateAwardRequest, ICriteriaResponse, ITypeResponse, IVariantResponse } from '@types'
import { toast } from 'sonner'

export default function CreateAwardPage() {
	const { push } = useRouter()

	const [selectedType, setSelectedType] = useState<ITypeResponse | null>(null)
	const [selectedVariant, setSelectedVariant] = useState<IVariantResponse | null>(null)
	const [selectedCriteria, setSelectedCriteria] = useState<ICriteriaResponse | null>(null)
	const [selectedBonusCriteria, setSelectedBonusCriteria] = useState<ICriteriaResponse | null>(null)
	const [files, setFiles] = useState<File[]>([])
	const [text, setText] = useState('')

	// Получаем все типы
	const { data: types } = useQuery({
		...services.award.getAllTypesOptions(),
	})

	const { mutate: mutateCreate, isPending } = useMutation({
		...services.award.createOptions(),
	})

	const handleSubmit = () => {
		if (!selectedType || !selectedVariant || !selectedCriteria) {
			toast.error('Выберите тип, вариант и критерий!')

			return
		}

		const newAward: ICreateAwardRequest = {
			type: selectedType.id,
			variant: selectedVariant.id,
			criteria: selectedCriteria.id,
			text,
		}

		const toastId = `award-${selectedType.name}-create`

		toast.loading(`Создание награды с типом - ${selectedType.name}`, { id: toastId })

		mutateCreate(
			{ newAward, files },
			{
				onSuccess: (createdAward) => {
					toast.success(`Награда успешно создался с типом - ${createdAward.type.name}`, { id: toastId })
					push(`/kpi/${createdAward.id}`)
				},
				onError: () => {
					toast.error(`Ошибка созданий награды - ${selectedType.name}`, { id: toastId })
				},
			},
		)
	}

	const handleDrop = (files: File[]) => {
		console.log(files)
		setFiles(files)
	}

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle backHref='/kpi' description='Выберите тип, вариант и критерий, загрузите подтверждающие файлы'>
				Создание награды
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>Создание награды</CardTitle>
					<CardDescription>Выберите тип, вариант и критерий, загрузите подтверждающие файлы</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4'>
					{/* Выбор Type */}
					<div className='space-y-2'>
						<Label htmlFor='type'>Тип награды</Label>
						<Select
							value={selectedType?.id || ''}
							onValueChange={(id: string) => {
								const t = types?.find((t: ITypeResponse) => t.id === id) || null

								setSelectedType(t)
								setSelectedVariant(null)
								setSelectedCriteria(null)
							}}
						>
							<SelectTrigger className='w-full' id='type'>
								<SelectValue placeholder='Выберите тип' />
							</SelectTrigger>
							<SelectContent>
								{types?.map((t: ITypeResponse) => (
									<SelectItem key={t.id} value={t.id}>
										{t.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Выбор Variant */}
					{selectedType && (
						<div className='space-y-2'>
							<Label htmlFor='variant'>Вариант</Label>
							<Select
								value={selectedVariant?.id || ''}
								onValueChange={(id: string) => {
									const v = selectedType.variants.find((v) => v.id === id) || null

									setSelectedVariant(v)
									setSelectedCriteria(null)
								}}
							>
								<SelectTrigger className='w-full' id='variant'>
									<SelectValue placeholder='Выберите вариант' />
								</SelectTrigger>
								<SelectContent>
									{selectedType.variants.map((v) => (
										<SelectItem key={v.id} value={v.id}>
											{v.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedVariant?.description && (
								<p className='ml-2 text-xs text-muted-foreground'>{selectedVariant?.description}</p>
							)}
						</div>
					)}

					{/* criteria */}
					{selectedVariant && (
						<div className='space-y-2'>
							<Label htmlFor='criteria'>Критерий</Label>
							<Select
								value={selectedCriteria?.id || ''}
								onValueChange={(id: string) => {
									const c = selectedVariant.criteria.find((c) => c.id === id) || null

									setSelectedCriteria(c)
								}}
							>
								<SelectTrigger className='w-full' id='criteria'>
									<SelectValue placeholder='Выберите критерий' />
								</SelectTrigger>
								<SelectContent>
									{selectedVariant.criteria.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name} ({c.points.join('-')} баллов)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* bonus criteria */}
					{selectedVariant && selectedVariant?.bonusCriteria && (
						<div className='space-y-2'>
							<Label htmlFor='criteria'>Бонусный критерий</Label>
							<Select
								value={selectedBonusCriteria?.id || ''}
								onValueChange={(id: string) => {
									if (!selectedVariant?.bonusCriteria) return

									const c = selectedVariant.bonusCriteria.find((c) => c.id === id) || null

									setSelectedBonusCriteria(c)
								}}
							>
								<SelectTrigger className='w-full' id='criteria'>
									<SelectValue placeholder='Выберите критерий' />
								</SelectTrigger>
								<SelectContent>
									{selectedVariant.criteria.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name} ({c.points.join('-')} бонусных баллов)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Текст награды */}
					<div className='space-y-2'>
						<Label htmlFor='text'>Описание награды</Label>
						<Textarea
							id='text'
							placeholder='Введите описание достижение/награды'
							value={text}
							onChange={(e) => setText(e.target.value)}
						/>
					</div>

					{/* Загрузка файлов */}
					<div className='space-y-2'>
						<Label>Загрузить файлы</Label>
						<Dropzone
							accept={{
								// Изображения
								'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'],

								// Документы
								'application/pdf': ['.pdf'],
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
								'application/vnd.ms-excel': ['.xls'],
								'application/vnd.ms-powerpoint': ['.ppt'],
								'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],

								// Текстовые файлы
								'text/plain': ['.txt'],
								'text/csv': ['.csv'],
								'text/markdown': ['.md'],

								// Архивы (если нужны — можно убрать)
								'application/zip': ['.zip'],
								'application/x-rar-compressed': ['.rar'],
								'application/x-7z-compressed': ['.7z'],
							}}
							maxFiles={4}
							src={files}
							onDrop={handleDrop}
							onError={console.error}
						>
							<DropzoneEmptyState />
							<DropzoneContent />
						</Dropzone>
					</div>
				</CardContent>

				<CardFooter className='flex justify-end'>
					<Button disabled={isPending} variant='default' onClick={handleSubmit}>
						Создать награду
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}
