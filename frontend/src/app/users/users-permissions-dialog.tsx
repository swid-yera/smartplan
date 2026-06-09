'use client'

import { type FC, useEffect, useMemo, useState } from 'react'

import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import {
	Badge,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Separator,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum } from '@types'
import { LockKeyhole, RefreshCcw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

interface IProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const permissionOrder: PermissionCodeEnum[] = [
	PermissionCodeEnum.RUP_VIEW,
	PermissionCodeEnum.RUP_MANAGE,
	PermissionCodeEnum.RUP_FULL,
	PermissionCodeEnum.KPI_VIEW,
	PermissionCodeEnum.KPI_MANAGE,
	PermissionCodeEnum.KPI_FULL,
]

const permissionLabels = {
	ru: {
		[PermissionCodeEnum.RUP_VIEW]: 'РУП: просмотр',
		[PermissionCodeEnum.RUP_MANAGE]: 'РУП: управление',
		[PermissionCodeEnum.RUP_FULL]: 'РУП: полный доступ',
		[PermissionCodeEnum.KPI_VIEW]: 'KPI: просмотр',
		[PermissionCodeEnum.KPI_MANAGE]: 'KPI: управление',
		[PermissionCodeEnum.KPI_FULL]: 'KPI: полный доступ',
	},
	kk: {
		[PermissionCodeEnum.RUP_VIEW]: 'РУП: қарау',
		[PermissionCodeEnum.RUP_MANAGE]: 'РУП: басқару',
		[PermissionCodeEnum.RUP_FULL]: 'РУП: толық қолжетімділік',
		[PermissionCodeEnum.KPI_VIEW]: 'KPI: қарау',
		[PermissionCodeEnum.KPI_MANAGE]: 'KPI: басқару',
		[PermissionCodeEnum.KPI_FULL]: 'KPI: толық қолжетімділік',
	},
} as const

export const UsersPermissionsDialog: FC<IProps> = ({ open, onOpenChange }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [selectedUserId, setSelectedUserId] = useState('')
	const [selectedPermissions, setSelectedPermissions] = useState<PermissionCodeEnum[]>([])
	const labels = permissionLabels[locale] ?? permissionLabels.ru

	const { data: specialUsers = [], isLoading: isSpecialUsersLoading } = useQuery({
		...services.permission.getSpecialUsersOptions(),
		enabled: open,
	})

	const selectedUser = useMemo(
		() => specialUsers.find((user) => user.keycloakId === selectedUserId) ?? null,
		[specialUsers, selectedUserId],
	)

	const { data: currentPermissionsData, isFetching: isCurrentPermissionsLoading } = useQuery({
		...services.permission.getPermissionsOptions(selectedUserId),
		enabled: open && !!selectedUserId,
	})

	const savePermissionsMutation = useMutation(services.permission.setPermissionsOptions(selectedUserId))
	const revokePermissionsMutation = useMutation(services.permission.revokePermissionsOptions(selectedUserId))

	useEffect(() => {
		if (!open) return

		if (!selectedUserId && specialUsers.length > 0) {
			setSelectedUserId(specialUsers[0].keycloakId)
		}
	}, [open, selectedUserId, specialUsers])

	useEffect(() => {
		if (!open || !selectedUserId) return

		const current = currentPermissionsData?.permissions ?? selectedUser?.permissions ?? []

		setSelectedPermissions(current)
	}, [currentPermissionsData?.permissions, open, selectedUser?.permissions, selectedUserId])

	const togglePermission = (permission: PermissionCodeEnum) => {
		setSelectedPermissions((prev) =>
			prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission],
		)
	}

	const handleSave = () => {
		if (!selectedUserId) return

		savePermissionsMutation.mutate(
			{ permissions: selectedPermissions },
			{
				onSuccess: () => {
					toast.success(t.permissionsModal.saved)
				},
				onError: (error) => {
					toast.error(error.message)
				},
			},
		)
	}

	const handleRevoke = () => {
		if (!selectedUserId) return

		revokePermissionsMutation.mutate(undefined, {
			onSuccess: () => {
				setSelectedPermissions([])
				toast.success(t.permissionsModal.revoked)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='h-[94vh] w-full max-w-[94vw]! overflow-hidden p-0'>
				<div className='flex min-h-0 h-full flex-col'>
					<DialogHeader className='border-b px-6 pb-4 pt-6'>
						<DialogTitle className='flex items-center gap-2'>
							<ShieldCheck className='h-5 w-5' />
							{t.permissionsModal.title}
						</DialogTitle>
						<DialogDescription>{t.permissionsModal.description}</DialogDescription>
					</DialogHeader>

					<ScrollArea className='min-h-0 flex-1'>
						<div className='grid min-h-0 gap-4 px-6 py-5 lg:grid-cols-[380px_minmax(0,1fr)]'>
							<div className='rounded-lg border bg-muted/20'>
								<div className='flex items-center gap-2 border-b px-3 py-2 text-sm font-medium'>
									<LockKeyhole className='h-4 w-4' />
									{t.permissionsModal.specialUsers}
								</div>
								<ScrollArea className='h-[calc(94vh-230px)] min-h-115'>
									<div className='space-y-1 p-2'>
										{isSpecialUsersLoading ? (
											<p className='px-2 py-6 text-sm text-muted-foreground'>{t.permissionsModal.loading}</p>
										) : specialUsers.length === 0 ? (
											<p className='px-2 py-6 text-sm text-muted-foreground'>{t.permissionsModal.empty}</p>
										) : (
											specialUsers.map((user) => {
												const isActive = user.keycloakId === selectedUserId

												return (
													<button
														key={user.keycloakId}
														className={[
															'flex w-full flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition-colors',
															isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
														].join(' ')}
														type='button'
														onClick={() => setSelectedUserId(user.keycloakId)}
													>
														<span className='font-medium'>
															{`${user.firstName} ${user.lastName}`.trim() || user.username}
														</span>
														<span className='text-xs text-muted-foreground'>{user.email}</span>
														<div className='flex flex-wrap gap-1 pt-1'>
															{(user.permissions || []).length > 0 ? (
																user.permissions.map((permission) => (
																	<Badge key={permission} variant='secondary'>
																		{permission}
																	</Badge>
																))
															) : (
																<Badge variant='outline'>{t.permissionsModal.noPermissions}</Badge>
															)}
														</div>
													</button>
												)
											})
										)}
									</div>
								</ScrollArea>
							</div>

							<div className='space-y-4'>
								<div className='rounded-lg border p-4'>
									<div className='flex items-start justify-between gap-4'>
										<div>
											<p className='text-sm font-medium'>{t.permissionsModal.selectedUser}</p>
											<p className='text-lg font-semibold'>
												{selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim() : '—'}
											</p>
											<p className='text-sm text-muted-foreground'>{selectedUser?.email ?? ''}</p>
										</div>

										<div className='text-right text-xs text-muted-foreground'>
											<p>{t.permissionsModal.currentPermissions}</p>
											<p>
												{isCurrentPermissionsLoading
													? t.permissionsModal.loading
													: selectedPermissions.length}
											</p>
										</div>
									</div>
								</div>

								<Separator />

								<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
									{permissionOrder.map((permission) => {
										const checked = selectedPermissions.includes(permission)

										return (
											<label
												key={permission}
												className={[
													'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors',
													checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
												].join(' ')}
											>
												<Checkbox checked={checked} onCheckedChange={() => togglePermission(permission)} />
												<div className='min-w-0'>
													<p className='font-medium'>{labels[permission]}</p>
													<p className='text-xs text-muted-foreground'>{permission}</p>
												</div>
											</label>
										)
									})}
								</div>
							</div>
						</div>
					</ScrollArea>

					<DialogFooter className='border-t px-6 py-4'>
						<div className='flex items-center gap-2'>
							<Button
								disabled={!selectedUserId || revokePermissionsMutation.isPending}
								type='button'
								variant='outline'
								onClick={handleRevoke}
							>
								<RefreshCcw className='mr-2 h-4 w-4' />
								{t.permissionsModal.revoke}
							</Button>
						</div>

						<div className='flex items-center gap-2'>
							<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
								{t.permissionsModal.close}
							</Button>
							<Button
								disabled={!selectedUserId || savePermissionsMutation.isPending}
								type='button'
								onClick={handleSave}
							>
								{t.permissionsModal.save}
							</Button>
						</div>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	)
}
