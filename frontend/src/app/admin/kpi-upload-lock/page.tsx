'use client'

import { useEffect, useState } from 'react'

import { PageTitle, withNavAccess } from '@components'
import { formatDateOnly, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const { user } = useAuthStore()
	const t = getUILocaleSection(localeDictionary, locale)
	const [dateValue, setDateValue] = useState('')
	const queryClient = useQueryClient()

	const { data, isLoading } = useQuery({
		...services.kpiSettings.getUploadBlockDateOptions(),
		enabled: !!user,
	})

	const { mutate, isPending } = useMutation({
		...services.kpiSettings.setUploadBlockDateOptions(),
		onSuccess(updated) {
			setDateValue(updated.blockedAfterDate ?? '')
			queryClient.invalidateQueries({ queryKey: ['kpi-upload-block-date'] })
			toast.success(updated.blockedAfterDate ? t.saved : t.cleared)
		},
		onError() {
			toast.error(t.saveError)
		},
	})

	useEffect(() => {
		setDateValue(data?.blockedAfterDate ?? '')
	}, [data?.blockedAfterDate])

	const formattedDate = dateValue ? formatDateOnly(dateValue, locale) : ''

	const handleSave = () => {
		mutate({ blockedAfterDate: dateValue.trim() ? dateValue : null })
	}

	const handleClear = () => {
		setDateValue('')
		mutate({ blockedAfterDate: null })
	}

	return (
		<section className='mx-auto w-full max-w-4xl space-y-6 p-4'>
			<PageTitle backHref='back' description={t.description}>
				{t.title}
			</PageTitle>

			<Card className='overflow-hidden border-border/60'>
				<CardHeader className='space-y-2'>
					<CardTitle className='flex items-center gap-2 text-xl'>
						<ShieldAlert className='h-5 w-5 text-primary' />
						{t.title}
					</CardTitle>
					<CardDescription>{t.description}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='kpi-upload-block-date'>{t.dateLabel}</Label>
						<Input
							disabled={isLoading || isPending}
							id='kpi-upload-block-date'
							type='date'
							value={dateValue}
							onChange={(event) => setDateValue(event.target.value)}
						/>
						<p className='text-sm text-muted-foreground'>{t.dateHint}</p>
					</div>

					<div className='rounded-2xl border border-dashed p-4 text-sm text-muted-foreground'>
						<div className='flex items-start gap-2'>
							<ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
							<p>
								{dateValue
									? t.preview.replace('{date}', formattedDate || dateValue)
									: t.dateUnset}
							</p>
						</div>
					</div>

					<div className='flex flex-col gap-3 sm:flex-row'>
						<Button disabled={isLoading || isPending} onClick={handleSave}>
							{isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							{t.save}
						</Button>
						<Button disabled={isLoading || isPending || !dateValue} variant='outline' onClick={handleClear}>
							{t.clear}
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	)
}

export default withNavAccess(Page)
