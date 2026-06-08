import { Forbidden } from '@components'
import { getServerAuthUser, serverFetchJson } from '@lib/server'
import type { ITypeResponse } from '@types'
import { RoleEnum } from '@types'

import { TypeView } from './type-view'

interface IPageProps {
	params: Promise<{ id: string }>
}

export default async function Page({ params }: IPageProps) {
	const user = await getServerAuthUser()
	const { id } = await params

	if (!user || user.role !== RoleEnum.ADMIN) {
		return <Forbidden />
	}

	let data: ITypeResponse | null = null

	try {
		data = await serverFetchJson<ITypeResponse>(`/awards/types/${id}`, {
			includeSid: true,
			revalidate: 300,
		})
	} catch {
		data = null
	}

	if (!data) {
		return <p className='p-6 text-center text-muted-foreground'>Критерии оценивания не найден</p>
	}

	return <TypeView type={data} />
}
