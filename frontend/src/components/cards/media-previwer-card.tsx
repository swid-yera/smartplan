'use client'

import { useMemo, useState } from 'react'

import { Button } from '@shadcn'
import { Download, Eye, EyeOff } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'

interface IMediaPreviewerCardLabels {
	download: string
	hidePreview: string
	preview: string
}

interface IMediaPreviewerProps {
	fileUrl: string
	fileName?: string
	fileIndex?: number
	labels: IMediaPreviewerCardLabels
}

const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i
const PDF_REGEX = /\.pdf(\?.*)?$/i
const OFFICE_REGEX = /\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i

const shortenUrl = (url: string, maxLength = 68) => {
	if (url.length <= maxLength) return url

	const prefixLength = Math.max(24, Math.floor(maxLength * 0.45))
	const suffixLength = Math.max(20, Math.floor(maxLength * 0.35))
	const prefix = url.slice(0, prefixLength)
	const suffix = url.slice(-suffixLength)

	return `${prefix}...${suffix}`
}

export const MediaPreviewerCard = ({ fileUrl, fileName, fileIndex, labels }: IMediaPreviewerProps) => {
	const [isPreviewOpen, setIsPreviewOpen] = useState(false)
	const isImage = IMAGE_REGEX.test(fileUrl)
	const isPdf = PDF_REGEX.test(fileUrl)
	const isOfficeDocument = OFFICE_REGEX.test(fileUrl)
	const canPreview = isImage || isPdf || isOfficeDocument
	const shortLink = useMemo(() => shortenUrl(fileUrl), [fileUrl])

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
				{typeof fileIndex === 'number' ? (
					<span className='rounded-md bg-muted px-2 py-1 text-xs font-semibold'>{fileIndex}</span>
				) : null}

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
			<a
				className='block text-xs text-primary/90 hover:text-primary hover:underline break-all'
				href={fileUrl}
				rel='noopener noreferrer'
				target='_blank'
			>
				{shortLink}
			</a>

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
