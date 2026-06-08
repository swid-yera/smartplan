'use client'

import { useState } from 'react'

import { withRole } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation } from '@tanstack/react-query'
import { RoleEnum } from '@types'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [isDragging, setIsDragging] = useState(false)

	const { mutate, isPending } = useMutation({
		...services.hik.hikToReportOptions(),
	})

	const uploadFile = (file?: File) => {
		if (!file) return

		if (!file.name.endsWith('.xlsx')) {
			toast.error(t.onlyXlsx)

			return
		}

		mutate(file, {
			onError(err) {
				console.error(err)
				toast.error(t.generateError)
			},
			onSuccess() {
				toast.success(t.generateSuccess)
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
					<CardTitle>{t.cardTitle}</CardTitle>
					<CardDescription>{t.cardDescription}</CardDescription>
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
								<p className='text-sm text-muted-foreground'>{t.generating}</p>
							</>
						) : (
							<>
								<FileSpreadsheet className='mb-3 h-8 w-8 text-muted-foreground' />
								<p className='text-sm font-medium'>{isDragging ? t.dropHere : t.dragHint}</p>
								<p className='mt-1 text-xs text-muted-foreground'>{t.onlyXlsxShort}</p>
							</>
						)}
					</label>

					<Button
						className='mt-4 w-full'
						disabled={isPending}
						onClick={() => document.getElementById('hik-upload')?.click()}
					>
						{isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						{t.uploadAndDownload}
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}

export default withRole(Page, [RoleEnum.ADMIN])
