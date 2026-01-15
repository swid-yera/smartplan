'use client'

import { type FC, useEffect, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'

import { getRupModuleById, updateRupModule } from '@services'
import { RoleSwitcher } from '@store'
import { type IRupModule, RupModuleStatus } from '@types'
import { Button, Spinner } from '@ui'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

import useUserRoleStore from '../../../store/user-role.store'
import { mockRupModules } from '../mock.data'
import { RupView } from './rup-view'

const Page: FC = () => {
	const params = useParams<{ id: string }>()
	const [rupData, setRupData] = useState<IRupModule | null>(mockRupModules[2])
	const [loading, setLoading] = useState(false)
	const { role } = useUserRoleStore()

	// fetch rup
	useEffect(() => {
		// fetchRup()
	}, [params.id])

	const fetchRup = async () => {
		setLoading(true)
		const data = await getRupModuleById(params.id)

		if (!data) {
			setRupData(null)
		} else {
			console.log(data)
			setRupData(data)
		}
		setLoading(false)
	}

	const handleStatusChange = async (newStatus: RupModuleStatus) => {
		if (!rupData) return

		const toastId = `rup-status-update-${newStatus}`

		toast.loading('Изменение статуса...', { id: toastId })

		// In a real app, this might be a dedicated endpoint like `updateRupStatus(id, newStatus)`
		const updatedRup = { ...rupData, status: newStatus }
		const result = await updateRupModule(updatedRup)

		if (result) {
			toast.success('Статус успешно изменен!', { id: toastId })
			// Refetch or update state to reflect the change
			setRupData(result)
		} else {
			toast.error('Произошла ошибка при изменении статуса', { id: toastId })
		}
	}

	const onDownload = () => {
		toast.promise(() => new Promise((resolve) => setTimeout(() => resolve({ name: 'Event' }), 2000)), {
			loading: 'Загрузка...',
			success: (data) => `${data} has been created`,
			error: 'Error',
		})
	}

	// render
	if (loading) {
		return <Spinner />
	}

	if (!rupData) {
		notFound()
	}

	const canEdit = role === 'TEACHER' && rupData.status === RupModuleStatus.DRAFT
	const canDownload = rupData.status === RupModuleStatus.APPROVED

	return (
		<>
			<RoleSwitcher />

			<RupView
				actions={
					<>
						{canEdit && (
							<Button asChild size='lg'>
								<Link href={`/rups/${params.id}/edit`}>Редактировать</Link>
							</Button>
						)}
						{canDownload && (
							<Button size='lg' variant='outline' onClick={onDownload}>
								<FileDown className='mr-2 h-4 w-4' />
								Скачать файл
							</Button>
						)}
					</>
				}
				data={rupData}
				role={role}
				onStatusChange={handleStatusChange}
			/>
		</>
	)
}

export default Page
