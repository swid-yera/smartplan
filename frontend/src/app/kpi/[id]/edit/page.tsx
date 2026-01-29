'use client'

import { type FC, useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

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
import type { ICriteriaResponse, ITypeResponse, IUpdateAwardRequest, IVariantResponse } from '@types'
import { XIcon } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import { toast } from 'sonner'

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const { push } = useRouter()

	const [selectedType, setSelectedType] = useState<ITypeResponse | null>(null)
	const [selectedVariant, setSelectedVariant] = useState<IVariantResponse | null>(null)
	const [selectedCriteria, setSelectedCriteria] = useState<ICriteriaResponse | null>(null)
	const [selectedBonusCriteria, setSelectedBonusCriteria] = useState<ICriteriaResponse | null>(null)

	const [files, setFiles] = useState<File[]>([])
	const [existingFiles, setExistingFiles] = useState<string[]>([])
	const [text, setText] = useState('')

	// queries
	const { data: types } = useQuery({
		...services.award.getAllTypesOptions(),
	})
	const { data: award, isLoading } = useQuery({
		...services.award.getByIdOptions(id),
	})

	// init form
	useEffect(() => {
		if (!award || !types) return

		const type = types.find((t) => t.id === award.type.id) || null
		const variant = type?.variants.find((v) => v.id === award.variant.id) || null
		const criteria = variant?.criteria.find((c) => c.id === award.criteria.id) || null
		const bonusCriteria = variant?.bonusCriteria?.find((c) => c.id === award.bonusCriteria?.id) || null

		setSelectedType(type)
		setSelectedVariant(variant)
		setSelectedCriteria(criteria)
		setSelectedBonusCriteria(bonusCriteria)
		setText(award.text || '')

		if (award?.files) {
			setExistingFiles(award.files)
		}
	}, [award, types])

	/* -------------------- mutation -------------------- */

	const { mutate: mutateUpdate, isPending } = useMutation({
		...services.award.updateOptions(),
	})

	const handleSubmit = () => {
		if (!selectedType || !selectedVariant || !selectedCriteria || !award) {
			toast.error('Заполните все обязательные поля')

			return
		}

		const payload: IUpdateAwardRequest = {
			type: selectedType.id,
			variant: selectedVariant.id,
			criteria: selectedCriteria.id,
			bonusCriteria: selectedBonusCriteria?.id,
			text,
		}

		const toastId = `award-${id}-update`

		toast.loading('Сохранение изменений...', { id: toastId })

		mutateUpdate(
			{ changedAward: payload, id: award.id },
			{
				onSuccess: () => {
					toast.success('Награда успешно обновлена', { id: toastId })
					push(`/kpi/${id}`)
				},
				onError: () => {
					toast.error('Ошибка при обновлении награды', { id: toastId })
				},
			},
		)
	}

	const handleDrop = (newFiles: File[]) => {
		setFiles((prev) => [...prev, ...newFiles])
	}

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const removeExistingFile = (url: string) => {
		setExistingFiles((prev) => prev.filter((f) => f !== url))
	}

	if (isLoading || !award) return null

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle backHref={`/kpi/${id}`} description='Редактирование награды'>
				Редактирование награды
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>Редактирование награды</CardTitle>
					<CardDescription>Измените тип, вариант, критерий или описание награды</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4'>
					{/* TYPE */}
					<div className='space-y-2'>
						<Label>Тип награды</Label>
						<Select
							value={selectedType?.id || ''}
							onValueChange={(id) => {
								const t = types?.find((t) => t.id === id) || null

								setSelectedType(t)
								setSelectedVariant(null)
								setSelectedCriteria(null)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Выберите тип' />
							</SelectTrigger>
							<SelectContent>
								{types?.map((t) => (
									<SelectItem key={t.id} value={t.id}>
										{t.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* VARIANT */}
					{selectedType && (
						<div className='space-y-2'>
							<Label>Вариант</Label>
							<Select
								value={selectedVariant?.id || ''}
								onValueChange={(id) => {
									const v = selectedType.variants.find((v) => v.id === id) || null

									setSelectedVariant(v)
									setSelectedCriteria(null)
								}}
							>
								<SelectTrigger>
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
						</div>
					)}

					{/* CRITERIA */}
					{selectedVariant && (
						<div className='space-y-2'>
							<Label>Критерий</Label>
							<Select
								value={selectedCriteria?.id || ''}
								onValueChange={(id) => {
									const c = selectedVariant.criteria.find((c) => c.id === id) || null

									setSelectedCriteria(c)
								}}
							>
								<SelectTrigger>
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

					{/* TEXT */}
					<div className='space-y-2'>
						<Label>Описание награды</Label>
						<Textarea placeholder='Описание достижения' value={text} onChange={(e) => setText(e.target.value)} />
					</div>

					{/* FILES */}
					<div className='space-y-2'>
						<Label>Файлы</Label>

						{/* Dropzone для добавления новых */}
						<Dropzone
							accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
							maxFiles={10}
							src={files}
							onDrop={handleDrop}
						>
							<DropzoneEmptyState />
							<DropzoneContent />
						</Dropzone>

						{/* Предпросмотр существующих файлов */}
						{(existingFiles.length > 0 || files.length > 0) && (
							<div className='mt-2 flex flex-wrap gap-2'>
								{/* уже загруженные */}
								{existingFiles.map((fileUrl) => (
									<Image key={fileUrl} preview={fileUrl} onDelete={() => removeExistingFile(fileUrl)} />
								))}

								{/* new files */}
								{files.map((file, idx) => {
									const preview = URL.createObjectURL(file)

									return <Image key={idx} file={file} preview={preview} onDelete={() => removeFile(idx)} />
								})}
							</div>
						)}
					</div>
				</CardContent>

				<CardFooter className='justify-end'>
					<Button disabled={isPending} onClick={handleSubmit}>
						Сохранить изменения
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}

export default Page

interface IImageProps {
	file?: File
	preview: string
	onDelete: () => void
}

const Image: FC<IImageProps> = ({ file, preview, onDelete }) => {
	return (
		<div className='relative aspect-square max-w-60 w-full border rounded-md overflow-hidden flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900'>
			{file && file.type === 'application/pdf' ? (
				<p className='text-xs text-center px-1'>PDF</p>
			) : (
				<Zoom>
					<img alt='preview' className='cursor-zoom-in rounded-lg' height={300} src={preview} width={400} />
				</Zoom>
			)}
			<Button
				className='w-full rounded-none hover:bg-destructive! hover:cursor-pointer'
				size='icon-sm'
				type='button'
				variant='ghost'
				onClick={onDelete}
			>
				<XIcon />
			</Button>
		</div>
	)
}
