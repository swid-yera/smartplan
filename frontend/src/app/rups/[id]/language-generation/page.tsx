'use client'

import { useEffect } from 'react'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { Loader, withPermission } from '@components'
import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PermissionCodeEnum } from '@types'

import { trackLanguageGeneration, untrackLanguageGeneration } from '../../language-generation-tracker'
import localeDictionary from './locale.json'

const inProgressStatuses = new Set(['queued', 'running'])

const getDisplayError = (error: string | undefined, modelNotReadyMessage: string) => {
	const trimmedError = error?.trim()
	if (!trimmedError) return ''

	if (
		trimmedError.includes('model_not_ready') ||
		trimmedError.includes('model directory does not exist') ||
		trimmedError.includes('missing model.bin')
	) {
		return modelNotReadyMessage
	}

	return trimmedError
}

const LanguageGenerationPage = () => {
	const { replace } = useRouter()
	const params = useParams<{ id: string }>()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const queryClient = useQueryClient()

	const { data: rupData } = useQuery({
		...services.rup.getByIdOptions(params.id),
		enabled: Boolean(params.id),
	})

	const { data: generationStatus, isLoading } = useQuery({
		...services.rup.getLanguageGenerationStatusOptions(params.id),
		enabled: Boolean(params.id),
		refetchInterval: (query) => {
			const status = query.state.data?.status

			if (!status) return 2000

			return inProgressStatuses.has(status) ? 2000 : false
		},
	})

	useEffect(() => {
		if (!params.id) return
		trackLanguageGeneration(params.id)
	}, [params.id])

	useEffect(() => {
		if (!generationStatus || generationStatus.status !== 'completed') return
		untrackLanguageGeneration(params.id)
		queryClient.invalidateQueries({ queryKey: ['rup', params.id] })
		replace(`/rups/${params.id}`)
	}, [generationStatus, params.id, queryClient, replace])

	useEffect(() => {
		if (!generationStatus || generationStatus.status !== 'failed') return
		untrackLanguageGeneration(params.id)
		queryClient.invalidateQueries({ queryKey: ['rup', params.id] })
	}, [generationStatus, params.id, queryClient])

	if (isLoading || !generationStatus) {
		return <Loader type='data' />
	}

	const currentStage = generationStatus.currentStage || 'queued'
	const stageLabel =
		t.stages[currentStage as keyof typeof t.stages] || t.stages.completed || t.unknownStage || currentStage
	const statusLabel = t.statuses[generationStatus.status as keyof typeof t.statuses] || generationStatus.status
	const progress = Math.min(100, Math.max(0, Number(generationStatus.progressPercent) || 0))
	const stageIndex = Math.max(0, generationStatus.stageIndex || 0)
	const totalStages = Math.max(1, generationStatus.totalStages || 1)
	const rupName = getLocaleText(rupData?.name, locale)
	const isFailed = generationStatus.status === 'failed'
	const displayError = getDisplayError(generationStatus.error, t.modelNotReadyError)

	return (
		<div className='mx-auto max-w-3xl w-full px-4 py-8'>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle>{t.title}</CardTitle>
					<CardDescription>{rupName ? `${rupName}. ${t.description}` : t.description}</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='flex items-center justify-between gap-4'>
						<div className='space-y-1'>
							<p className='text-sm text-muted-foreground'>{t.statusLabel}</p>
							<Badge variant={isFailed ? 'destructive' : 'secondary'}>{statusLabel}</Badge>
						</div>
						<div className='text-right'>
							<p className='text-sm text-muted-foreground'>{t.stageLabel}</p>
							<p className='text-sm font-medium'>{stageLabel || t.unknownStage}</p>
						</div>
					</div>

					<div className='space-y-2'>
						<div className='flex items-center justify-between text-sm'>
							<span>{t.progressLabel}</span>
							<span>
								{interpolateUILocaleText(t.stageCounter, {
									current: stageIndex,
									total: totalStages,
								})}
							</span>
						</div>
						<Progress value={progress} />
					</div>

					{isFailed && displayError && (
						<div className='rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
							<p className='font-medium'>{t.errorTitle}</p>
							<p className='mt-1 whitespace-pre-wrap'>{displayError}</p>
						</div>
					)}

					<div className='flex flex-wrap items-center gap-2'>
						<Button asChild variant='outline'>
							<Link href={`/rups/${params.id}`}>{t.openRup}</Link>
						</Button>
						<Button asChild variant='ghost'>
							<Link href='/rups'>{t.backToRups}</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default withPermission(LanguageGenerationPage, [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.RUP_VIEW])
