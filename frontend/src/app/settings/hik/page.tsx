'use client'

import { useState } from 'react'

import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const Page = () => {
	const [isDragging, setIsDragging] = useState(false)

	const { mutate, isPending } = useMutation({
		...services.hik.hikToReportOptions(),
	})

	const uploadFile = (file?: File) => {
		if (!file) return

		if (!file.name.endsWith('.xlsx')) {
			toast.error('Поддерживаются только файлы .xlsx')

			return
		}

		mutate(file, {
			onError(err) {
				console.error(err)
				toast.error('Произошла ошибка при генерации отчёта')
			},
			onSuccess() {
				toast.success('Отчёт успешно сгенерирован')
			},
		})
	}

	const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault()
		e.stopPropagation()

		setIsDragging(false)

		const file = e.dataTransfer.files?.[0]

		uploadFile(file)
	}

	const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}

	const handleDragLeave = () => {
		setIsDragging(false)
	}

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		uploadFile(event.target.files?.[0])
	}

	return (
		<div className='flex min-h-[60vh] items-center justify-center px-6'>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle>Генерация отчёта</CardTitle>
					<CardDescription>
						Загрузите <span className='font-medium'>.xlsx</span> файл с payload, чтобы автоматически получить
						отчёт
					</CardDescription>
				</CardHeader>

				<CardContent>
					<input
						accept='.xlsx'
						className='hidden'
						disabled={isPending}
						id='hik-upload'
						type='file'
						onChange={handleFileChange}
					/>

					<label
						className={`
							flex cursor-pointer flex-col items-center justify-center
							rounded-xl border-2 border-dashed p-6 text-center
							transition-all
							${isPending && 'cursor-not-allowed opacity-50'}
							${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'hover:border-primary hover:bg-primary/5'}
						`}
						htmlFor='hik-upload'
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
					>
						{isPending ? (
							<>
								<Loader2 className='mb-3 h-8 w-8 animate-spin text-muted-foreground' />
								<p className='text-sm text-muted-foreground'>Генерация отчёта…</p>
							</>
						) : (
							<>
								<FileSpreadsheet className='mb-3 h-8 w-8 text-muted-foreground' />
								<p className='text-sm font-medium'>
									{isDragging ? 'Отпустите файл для загрузки' : 'Перетащите файл сюда или нажмите'}
								</p>
								<p className='mt-1 text-xs text-muted-foreground'>Только .xlsx</p>
							</>
						)}
					</label>

					<Button
						className='mt-4 w-full'
						disabled={isPending}
						onClick={() => document.getElementById('hik-upload')?.click()}
					>
						{isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Загрузить и скачать отчёт
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}

export default Page
