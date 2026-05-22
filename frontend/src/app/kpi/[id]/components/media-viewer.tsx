'use client'

import { useMemo, useState } from 'react'

import { Button } from '@shadcn'
import { Download, Eye } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'

interface IMediaViewerProps {
	fileUrl: string
	type: string
}

export const MediaViewer = ({ fileUrl, type }: IMediaViewerProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(fileUrl)
	const isPdf = /\.pdf(\?.*)?$/i.test(fileUrl)
	const isSupported = isImage || isPdf

	const pdfViewerUrl = useMemo(
		() => `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`,
		[fileUrl],
	)

	if (!isSupported) return null

	return (
		<div className='space-y-3'>
			<div className='flex items-center gap-2'>
				<Button size='sm' type='button' variant='secondary' onClick={() => setIsOpen((prev) => !prev)}>
					<Eye className='mr-2 h-4 w-4' />
					{isOpen ? 'Скрыть просмотр' : 'Просмотр'}
				</Button>

				<Button asChild size='sm' variant='outline'>
					<a download href={fileUrl} rel='noopener noreferrer' target='_blank'>
						<Download className='mr-2 h-4 w-4' />
						Скачать
					</a>
				</Button>
			</div>

			{isOpen && isImage && (
				<div className='space-y-2 max-w-md'>
					<Zoom>
						<img alt={type} className='cursor-zoom-in rounded-lg' height={300} src={fileUrl} width={400} />
					</Zoom>
				</div>
			)}

			{isOpen && isPdf && (
				<div className='overflow-hidden rounded-lg border bg-background'>
					<iframe className='h-[560px] w-full' src={pdfViewerUrl} title={`${type}-pdf-viewer`} />
				</div>
			)}
		</div>
	)
}
