'use client'

import { useState } from 'react'

import type { NextPage } from 'next'

import { Card, CardContent, CardHeader, CardTitle, Dropzone, DropzoneContent, DropzoneEmptyState } from '@ui'

const Page: NextPage = () => {
	const [files, setFiles] = useState<File[] | undefined>()
	const [filePreview, setFilePreview] = useState<string | undefined>()

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

				<CardContent>
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
				</CardContent>
			</Card>
		</div>
	)
}

export default Page
