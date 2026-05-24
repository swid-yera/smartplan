import Link from 'next/link'

import { getUILocaleSection } from '@helpers'
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { RefreshCw } from 'lucide-react'

import localeDictionary from './locale.json'

interface SyncGroupsCardProps {
	onSync: () => void
	loading?: boolean
}

export const SyncGroupsCard = ({ onSync, loading }: SyncGroupsCardProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<Card>
			<CardHeader className='pb-3'>
				<CardTitle className='text-lg'>{t.cardTitle}</CardTitle>
			</CardHeader>

			<CardContent className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<p className='text-sm text-muted-foreground max-w-md'>{t.cardDescription}</p>

				<Button className='gap-2' disabled={loading} onClick={onSync}>
					<RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
					{loading ? t.syncing : t.sync}
				</Button>
			</CardContent>
			<CardFooter>
				<Button variant='outline'>
					<Link href='/groups'>{t.viewGroups}</Link>
				</Button>
			</CardFooter>
		</Card>
	)
}
