'use client'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { RefreshCcw, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function GroupsPage() {
	// queries
	const {
		data: groups,
		isLoading,
		refetch,
	} = useQuery({
		...services.group.getAllOptions(),
	})
	// mutations
	const { mutate: syncGroups, isPending } = useMutation({
		...services.group.syncOptions(),

		onSuccess: () => {
			toast.success('Группы успешно синхронизированы')
			refetch()
		},
		onError: () => {
			toast.error('Ошибка синхронизации групп')
		},
	})

	if (isLoading) return <Loader type='data' />

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description='Синхронизация учебных групп'>Группы</PageTitle>

			{/* sync card */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between'>
					<div>
						<CardTitle>Синхронизация</CardTitle>
						<CardDescription>Получить актуальный список групп из внешней системы</CardDescription>
					</div>

					<Button className='gap-2' disabled={isPending} onClick={() => syncGroups()}>
						<RefreshCcw className='h-4 w-4' />
						Синхронизировать
					</Button>
				</CardHeader>
			</Card>

			{/* groups list */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5 text-primary' />
						Список групп
					</CardTitle>
				</CardHeader>

				<CardContent className='space-y-3'>
					{groups?.length ? (
						groups.map((group) => (
							<div
								key={group.keycloakId}
								className='flex items-center justify-between rounded-lg border p-4 hover:bg-muted/40 transition'
							>
								<div>
									<p className='font-medium'>{group.name}</p>
									<p className='text-sm text-muted-foreground'>Специальность: {group.specialty ?? '—'}</p>
									<p className='text-sm text-muted-foreground'>Квалификация: {group.qualification ?? '—'}</p>
								</div>
							</div>
						))
					) : (
						<p className='text-center text-muted-foreground py-8'>Группы не найдены</p>
					)}
				</CardContent>
			</Card>
		</section>
	)
}
