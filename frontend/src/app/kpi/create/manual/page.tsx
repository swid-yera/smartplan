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
	Checkbox,
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from '@ui'

const Page: NextPage = () => {
	const [files, setFiles] = useState<File[] | undefined>()
	const [filePreview, setFilePreview] = useState<string | undefined>()
	const [contentType, setContentType] = useState('photo')

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

	return (
		<div className='p-4 sm:p-6 lg:p-8 space-y-6'>
			<div className='space-y-1'>
				<h1 className='text-2xl font-bold tracking-tight'>Отправьте свои достижения для рейтинга преподавателей</h1>
				<p className='text-muted-foreground'>Добавление достижения</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Добавление сертификата</CardTitle>
				</CardHeader>

				<CardContent className='space-y-6'>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Название награды</Label>
							<Input id='name' placeholder='Введите название' />
						</div>
						<div className='space-y-2'>
							<Label htmlFor='type'>Тип / Вариант</Label>
							<Select>
								<SelectTrigger id='type'>
									<SelectValue placeholder='Выберите тип' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='type1'>Тип 1</SelectItem>
									<SelectItem value='type2'>Тип 2</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='reason'>Причина</Label>
						<Textarea id='reason' placeholder='Укажите причину' />
					</div>

					<div className='space-y-2'>
						<Label>Тип контента</Label>
						<Tabs className='w-full' defaultValue='photo' onValueChange={setContentType}>
							<TabsList className='grid w-full grid-cols-4'>
								<TabsTrigger value='photo'>Фото</TabsTrigger>
								<TabsTrigger value='video'>Видео</TabsTrigger>
								<TabsTrigger value='text'>Текст</TabsTrigger>
								<TabsTrigger value='link'>Ссылка</TabsTrigger>
							</TabsList>
							<div className='mt-4 rounded-md border p-4'>
								<TabsContent className='mt-0' value='photo'>
									<Dropzone
										accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
										src={files}
										onDrop={handleDrop}
										onError={console.error}
									>
										<DropzoneEmptyState />
										<DropzoneContent>
											{filePreview && (
												<div className='h-[102px] w-full'>
													<img
														alt='Preview'
														className='absolute top-0 left-0 h-full w-full object-cover'
														src={filePreview}
													/>
												</div>
											)}
										</DropzoneContent>
									</Dropzone>
								</TabsContent>
								<TabsContent className='mt-0' value='video'>
									<Dropzone
										accept={{ 'video/*': ['.mp4', '.mov', '.avi'] }}
										src={files}
										onDrop={handleDrop}
										onError={console.error}
									>
										<DropzoneEmptyState />
										<DropzoneContent>
											<div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
												Видео файл загружен
											</div>
										</DropzoneContent>
									</Dropzone>
								</TabsContent>
								<TabsContent className='mt-0' value='text'>
									<Textarea className='min-h-[150px]' placeholder='Введите текст...' />
								</TabsContent>
								<TabsContent className='mt-0' value='link'>
									<Input placeholder='https://example.com' />
								</TabsContent>
							</div>
						</Tabs>
					</div>

					<div className='space-y-4'>
						<Label>Критерии</Label>
						<div className='grid gap-2'>
							<div className='flex items-center space-x-2'>
								<Checkbox id='c1' />
								<Label className='font-normal' htmlFor='c1'>
									Критерий 1
								</Label>
							</div>
							<div className='flex items-center space-x-2'>
								<Checkbox id='c2' />
								<Label className='font-normal' htmlFor='c2'>
									Критерий 2
								</Label>
							</div>
							<div className='flex items-center space-x-2'>
								<Checkbox id='c3' />
								<Label className='font-normal' htmlFor='c3'>
									Bonus критерий
								</Label>
							</div>
						</div>
					</div>
				</CardContent>

				<CardFooter className='flex flex-col items-start justify-between space-y-4 border-t pt-6 sm:flex-row sm:items-center sm:space-y-0'>
					<div className='flex flex-col space-y-1'>
						<span className='text-sm text-muted-foreground'>
							Статус: <span className='font-medium text-foreground'>Черновик</span>
						</span>
						<span className='text-sm text-muted-foreground'>
							Итого баллов: <span className='font-medium text-foreground'>0</span>
						</span>
					</div>
					<div className='flex w-full space-x-2 sm:w-auto'>
						<Button className='w-full sm:w-auto' variant='outline'>
							Сохранить
						</Button>
						<Button className='w-full sm:w-auto'>Отправить</Button>
					</div>
				</CardFooter>
			</Card>
		</div>
	)
}

export default Page
