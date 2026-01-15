'use client'

import { useState } from 'react'

import type { NextPage } from 'next'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
	Input,
	Label,
} from '@ui'

const Page: NextPage = () => {
	const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload')
	const [files, setFiles] = useState<File[] | undefined>()
	const [filePreview, setFilePreview] = useState<string | undefined>()
	const [link, setLink] = useState('')
	const [progress, setProgress] = useState(0)
	const [logs, setLogs] = useState<string[]>([])

	const handleDrop = (files: File[]) => {
		console.log(files)
		setFiles(files)

		if (files.length > 0) {
			const reader = new FileReader()

			reader.onload = (e) => {
				if (typeof e.target?.result === 'string') {
					setFilePreview(e.target?.result)
				}
			}
			reader.readAsDataURL(files[0])
		}
	}

	const handleAnalyze = () => {
		setStep('analyzing')
		setLogs(['Загрузка файла...'])
		setProgress(10)

		setTimeout(() => {
			setLogs((prev) => [...prev, 'Анализ содержимого...'])
			setProgress(40)
		}, 1000)

		setTimeout(() => {
			setLogs((prev) => [...prev, 'Извлечение критериев...'])
			setProgress(70)
		}, 2000)

		setTimeout(() => {
			setLogs((prev) => [...prev, 'Формирование результата...'])
			setProgress(100)
		}, 3000)

		setTimeout(() => {
			setStep('result')
		}, 3500)
	}

	return (
		<div className='p-4 sm:p-6 lg:p-8 space-y-6'>
			<div className='space-y-1'>
				<h1 className='text-2xl font-bold tracking-tight'>Создание награды с помощью ИИ</h1>
				<p className='text-muted-foreground'>Автоматическое распознавание и заполнение данных</p>
			</div>

			{step === 'upload' && (
				<Card>
					<CardHeader>
						<CardTitle>Загрузка данных</CardTitle>
					</CardHeader>

					<CardContent className='space-y-6'>
						<Dropzone
							accept={{
								'image/*': ['.png', '.jpg', '.jpeg'],
								'video/*': ['.mp4', '.mov', '.avi'],
							}}
							src={files}
							onDrop={handleDrop}
							onError={console.error}
						>
							<DropzoneEmptyState />
							<DropzoneContent>
								{filePreview && (
									<div className='h-[200px] w-full'>
										<img
											alt='Preview'
											className='absolute top-0 left-0 h-full w-full object-contain'
											src={filePreview}
										/>
									</div>
								)}
							</DropzoneContent>
						</Dropzone>

						<div className='space-y-2'>
							<Label htmlFor='link'>Или укажите ссылку на ресурс</Label>
							<Input
								id='link'
								placeholder='https://example.com/certificate'
								value={link}
								onChange={(e) => setLink(e.target.value)}
							/>
						</div>
					</CardContent>

					<CardFooter>
						<Button className='w-full' disabled={!files?.length && !link} onClick={handleAnalyze}>
							Начать анализ
						</Button>
					</CardFooter>
				</Card>
			)}

			{step === 'analyzing' && (
				<Card>
					<CardHeader>
						<CardTitle>Процесс анализа</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='h-4 w-full overflow-hidden rounded-full bg-secondary'>
							<div
								className='h-full bg-primary transition-all duration-500 ease-in-out'
								style={{ width: `${progress}%` }}
							/>
						</div>
						<div className='space-y-2'>
							{logs.map((log, i) => (
								<div key={i} className='flex items-center text-sm text-muted-foreground'>
									<span className='mr-2 text-green-500'>✓</span> {log}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{step === 'result' && (
				<Card>
					<CardHeader>
						<CardTitle>Результат</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='grid gap-4 md:grid-cols-2'>
							<div>
								<Label className='text-muted-foreground'>Тип награды</Label>
								<p className='text-lg font-medium'>Сертификат о повышении квалификации</p>
							</div>
							<div>
								<Label className='text-muted-foreground'>Общие баллы</Label>
								<p className='text-lg font-medium text-green-600'>85 баллов</p>
							</div>
						</div>

						<div>
							<Label className='mb-2 block text-muted-foreground'>Критерии</Label>
							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-lg border p-3'>
									<span>Прохождение курса (72ч)</span>
									<span className='font-medium'>50</span>
								</div>
								<div className='flex items-center justify-between rounded-lg border p-3'>
									<span>Итоговая аттестация: Отлично</span>
									<span className='font-medium'>35</span>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter className='flex gap-4'>
						<Button className='w-full' variant='outline'>
							Редактировать
						</Button>
						<Button className='w-full'>Отправить</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	)
}

export default Page
