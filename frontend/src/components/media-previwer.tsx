'use client'

import { useMemo, useState } from 'react'

import { Button } from '@shadcn'
import { Download, Eye, EyeOff } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'

interface IMediaPreviwerLabels {
	download: string
	hidePreview: string
	preview: string
}

interface IMediaPreviwerProps {
	fileUrl: string
	fileName?: string
	labels: IMediaPreviwerLabels
}

const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i
const PDF_REGEX = /\.pdf(\?.*)?$/i
const OFFICE_REGEX = /\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i

export const MediaPreviwer = ({ fileUrl, fileName, labels }: IMediaPreviwerProps) => {
	const [isPreviewOpen, setIsPreviewOpen] = useState(false)
	const isImage = IMAGE_REGEX.test(fileUrl)
	const isPdf = PDF_REGEX.test(fileUrl)
	const isOfficeDocument = OFFICE_REGEX.test(fileUrl)
	const canPreview = isImage || isPdf || isOfficeDocument

	const previewUrl = useMemo(() => {
		if (isPdf) {
			return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`
		}

		if (isOfficeDocument) {
			return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
		}

		return fileUrl
	}, [fileUrl, isOfficeDocument, isPdf])

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap items-center gap-2'>
				{canPreview ? (
					<Button size='sm' type='button' variant='secondary' onClick={() => setIsPreviewOpen((prev) => !prev)}>
						{isPreviewOpen ? <EyeOff className='mr-2 h-4 w-4' /> : <Eye className='mr-2 h-4 w-4' />}
						{isPreviewOpen ? labels.hidePreview : labels.preview}
					</Button>
				) : null}

				<Button asChild size='sm' variant='outline'>
					<a download href={fileUrl} rel='noopener noreferrer' target='_blank'>
						<Download className='mr-2 h-4 w-4' />
						{labels.download}
					</a>
				</Button>
			</div>

			{isPreviewOpen && isImage ? (
				<div className='space-y-2 max-w-md'>
					<Zoom>
						<img
							alt={fileName || 'preview'}
							className='cursor-zoom-in rounded-lg'
							height={320}
							src={fileUrl}
							width={420}
						/>
					</Zoom>
				</div>
			) : null}

			{isPreviewOpen && !isImage ? (
				<div className='overflow-hidden rounded-lg border bg-background'>
					<iframe className='h-[560px] w-full' src={previewUrl} title={fileName || 'document-preview'} />
				</div>
			) : null}
		</div>
	)
}
