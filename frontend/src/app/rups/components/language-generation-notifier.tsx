'use client'

import { useEffect, useRef } from 'react'

import { usePathname } from 'next/navigation'

import { getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useQueryClient } from '@tanstack/react-query'
import type { IRupLanguageGenerationStatus } from '@types'
import { toast } from 'sonner'

import { listTrackedLanguageGenerations, untrackLanguageGeneration } from '../language-generation-tracker'
import localeDictionary from './language-generation-notifier.locale.json'

const POLL_INTERVAL_MS = 2500

const isInProgressStatus = (status: string) => status === 'queued' || status === 'running'

const getStatusLabel = (t: typeof localeDictionary.ru, status: IRupLanguageGenerationStatus['status']): string => {
	if (status === 'queued') return t.statuses.queued
	if (status === 'running') return t.statuses.running
	return status
}

export const RupsLanguageGenerationNotifier = () => {
	const pathname = usePathname()
	const locale = useLocaleStore((state) => state.locale)
	const queryClient = useQueryClient()
	const t = getUILocaleSection(localeDictionary, locale)
	const lastSignatureRef = useRef<Record<string, string>>({})

	useEffect(() => {
		let disposed = false

		const pollGenerationStatuses = async () => {
			const trackedRupIds = listTrackedLanguageGenerations()
			if (!trackedRupIds.length) return

			await Promise.all(
				trackedRupIds.map(async (rupId) => {
					if (disposed) return

					const toastId = `rup-language-generation-${rupId}`
					const isWaitingPage = pathname === `/rups/${rupId}/language-generation`

					let generationStatus: IRupLanguageGenerationStatus
					try {
						generationStatus = await queryClient.fetchQuery({
							...services.rup.getLanguageGenerationStatusOptions(rupId),
							staleTime: 0,
						})
					} catch {
						return
					}

					const signature = `${generationStatus.status}:${generationStatus.stageIndex}:${generationStatus.progressPercent}:${generationStatus.currentStage}`

					if (isInProgressStatus(generationStatus.status)) {
						if (isWaitingPage) {
							toast.dismiss(toastId)
							return
						}

						if (lastSignatureRef.current[rupId] === signature) return
						lastSignatureRef.current[rupId] = signature

						toast.loading(t.loadingTitle, {
							id: toastId,
							description: interpolateUILocaleText(t.loadingDescription, {
								status: getStatusLabel(t, generationStatus.status),
								progress: generationStatus.progressPercent,
							}),
						})
						return
					}

					delete lastSignatureRef.current[rupId]
					untrackLanguageGeneration(rupId)

					if (isWaitingPage) {
						toast.dismiss(toastId)
						return
					}

					if (generationStatus.status === 'completed') {
						toast.success(t.completedTitle, {
							id: toastId,
							description: t.completedDescription,
						})
						return
					}

					if (generationStatus.status === 'failed') {
						toast.error(t.failedTitle, {
							id: toastId,
							description: generationStatus.error?.trim() || t.unknownError,
						})
					}
				}),
			)
		}

		void pollGenerationStatuses()
		const intervalId = window.setInterval(() => {
			void pollGenerationStatuses()
		}, POLL_INTERVAL_MS)

		return () => {
			disposed = true
			window.clearInterval(intervalId)
		}
	}, [pathname, queryClient, t])

	return null
}
