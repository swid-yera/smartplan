import Link from 'next/link'

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@shadcn'
import { RefreshCw } from 'lucide-react'

interface SyncGroupsCardProps {
	onSync: () => void
	loading?: boolean
}

export const SyncGroupsCard = ({ onSync, loading }: SyncGroupsCardProps) => {
	return (
		<Card>
			<CardHeader className='pb-3'>
				<CardTitle className='text-lg'>Синхронизация групп</CardTitle>
			</CardHeader>

			<CardContent className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<p className='text-sm text-muted-foreground max-w-md'>
					Обновляет список групп, подтягивая актуальные данные из внешней системы. Текущие группы будут обновлены
					или добавлены при необходимости.
				</p>

				<Button className='gap-2' disabled={loading} onClick={onSync}>
					<RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
					{loading ? 'Синхронизация...' : 'Синхронизировать'}
				</Button>
			</CardContent>
			<CardFooter>
				<Button variant='outline'>
					<Link href='/groups'>Просмотреть список групп</Link>
				</Button>
			</CardFooter>
		</Card>
	)
}
