'use client'

import type { FC } from 'react'

import { getUILocaleSection } from '@helpers'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@shadcn'
import type { IRupSignatureArtifact, Locale } from '@types'
import { ExternalLink, QrCode } from 'lucide-react'

import localeDictionary from './locale.json'

type IProps = {
	activeLocale: Locale
	artifact?: IRupSignatureArtifact
}

export const LessonSignatureCard: FC<IProps> = ({ activeLocale, artifact }) => {
	const t = getUILocaleSection(localeDictionary, activeLocale)

	if (!artifact) return null

	const dateLocale = activeLocale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const signedAt = new Date(artifact.createdAt).toLocaleString(dateLocale)

	return (
		<Card>
			<CardHeader className='gap-2'>
				<div className='flex flex-wrap items-start justify-between gap-3'>
					<div className='flex flex-col gap-1'>
						<CardTitle className='flex items-center gap-2 text-xl'>
							<QrCode className='h-5 w-5' />
							{t.signatureTitle}
						</CardTitle>
						<CardDescription>{t.signatureDescription}</CardDescription>
					</div>
					<Badge variant='secondary'>{t.signatureSignedBadge}</Badge>
				</div>
			</CardHeader>

			<CardContent className='grid gap-6 lg:grid-cols-[280px_1fr]'>
				{artifact.qrSvg && (
					<div className='flex justify-center lg:justify-start'>
						<div className='rounded-lg border bg-background p-3 shadow-sm'>
							<img
								alt={t.signatureTitle}
								className='h-56 w-56 object-contain'
								src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(artifact.qrSvg)}`}
							/>
						</div>
					</div>
				)}

				<div className='flex flex-col gap-4'>
					<div className='grid gap-3 md:grid-cols-2'>
						<KriptoInfoItem label={t.signatureKey} value={artifact.keyId || t.empty} />
						<KriptoInfoItem label={t.signatureIdLabel} value={artifact.signatureId || t.empty} />
						<KriptoInfoItem label={t.verificationUrlLabel} value={artifact.verificationUrl || t.empty} />
						<KriptoInfoItem label={t.signedAtLabel} value={signedAt} />
					</div>
				</div>
			</CardContent>

			<CardFooter className='justify-end'>
				<Button asChild disabled={!artifact.verificationUrl}>
					<a href={artifact.verificationUrl || undefined} rel='noreferrer' target='_blank'>
						<ExternalLink data-icon='inline-start' />
						{t.openVerification}
					</a>
				</Button>
			</CardFooter>
		</Card>
	)
}

const KriptoInfoItem = ({ label, value }: { label: string; value: string }) => (
	<div className='flex min-w-0 flex-col gap-1'>
		<div className='text-sm text-muted-foreground'>{label}</div>
		<div className='wrap-break-word text-sm font-medium'>{value}</div>
	</div>
)
