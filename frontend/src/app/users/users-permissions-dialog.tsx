'use client'

import { type FC, useEffect, useState } from 'react'

import { getLocaleText, getUILocaleSection, normalizeUserRole } from '@helpers'
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
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum } from '@types'
import { RefreshCcw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { PermissionBadge } from '../../components/badges/permission-badge'
import localeDictionary from './locale.json'

interface IProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	defaultUserId?: string
}

const permissionLabelsByDomain = {
	RUP: [PermissionCodeEnum.RUP_VIEW, PermissionCodeEnum.RUP_MANAGE, PermissionCodeEnum.RUP_FULL],
	KPI: [PermissionCodeEnum.KPI_VIEW, PermissionCodeEnum.KPI_MANAGE, PermissionCodeEnum.KPI_FULL],
} as const

export const UsersPermissionsDialog: FC<IProps> = ({ open, onOpenChange, defaultUserId }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [selectedUserId, setSelectedUserId] = useState(defaultUserId ?? '')
	const [selectedPermissions, setSelectedPermissions] = useState<PermissionCodeEnum[]>([])

	const { data: selectedUserData } = useQuery({
		...services.user.getByIdOptions(selectedUserId),
		enabled: open && !!selectedUserId,
	})

	const selectedUser = selectedUserData ?? null
	const selectedDepartments = selectedUser?.departments ?? []

	const savePermissionsMutation = useMutation(services.permission.setPermissionsOptions(selectedUserId))
	const revokePermissionsMutation = useMutation(services.permission.revokePermissionsOptions(selectedUserId))

	useEffect(() => {
		if (!open) return

		setSelectedUserId(defaultUserId ?? '')
	}, [defaultUserId, open])

	useEffect(() => {
		if (!open) return

		setSelectedPermissions(selectedUser?.permissions ?? [])
	}, [open, selectedUser?.permissions])

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
				onSuccess: (data) => {
					setSelectedPermissions(data.permissions ?? [])
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
			<DialogContent className='h-[92vh] w-full max-w-150! overflow-hidden p-0'>
				<div className='flex h-full min-h-0 flex-col'>
					<DialogHeader className='border-b px-6 pb-4 pt-6'>
						<DialogTitle className='flex items-center gap-2'>
							<ShieldCheck className='h-5 w-5' />
							{t.permissionsModal.title}
						</DialogTitle>
						<DialogDescription>{t.permissionsModal.description}</DialogDescription>
					</DialogHeader>

					<ScrollArea className='min-h-0 flex-1'>
						<div className='space-y-4 px-6 py-5'>
							{selectedUser ? (
								<div className='rounded-xl border bg-muted/20 p-4'>
									<div className='flex flex-col gap-4'>
										<div className='space-y-1'>
											<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
												{t.permissionsModal.selectedUser}
											</p>
											<p className='text-xl font-semibold leading-tight'>
												{`${selectedUser.firstName} ${selectedUser.lastName}`.trim() ||
													selectedUser.username}
											</p>
											<p className='text-sm text-muted-foreground'>{selectedUser.username}</p>
										</div>

										<div className='flex flex-wrap gap-2'>
											<Badge variant='outline'>{normalizeUserRole(selectedUser.role, locale)}</Badge>
											{selectedDepartments.length > 0
												? selectedDepartments.map((department) => (
														<Badge key={department.keycloakId} variant='secondary'>
															{getLocaleText(department.name, locale)}
														</Badge>
													))
												: null}
										</div>

										{(selectedUser.permissions ?? []).length > 0 ? (
											<div className='flex flex-wrap gap-1.5'>
												{(selectedUser.permissions ?? []).map((permission) => (
													<PermissionBadge key={permission} permission={permission} />
												))}
											</div>
										) : null}
									</div>
								</div>
							) : (
								<div className='rounded-xl border border-dashed p-10 text-center text-muted-foreground'>
									{t.permissionsModal.noUserSelected}
								</div>
							)}

							<div className='rounded-xl border bg-background p-4'>
								<div className='space-y-1'>
									<p className='text-sm font-medium'>{t.permissionsModal.access}</p>
									<p className='text-sm text-muted-foreground'>{t.permissionsModal.fullExclusive}</p>
								</div>

								<div className='grid gap-4 md:grid-cols-2 mt-2'>
									{(['RUP', 'KPI'] as const).map((domain) => {
										const domainPermissions = permissionLabelsByDomain[domain]
										const title = domain === 'RUP' ? 'RUP' : 'KPI'
										const fullPermission =
											domain === 'RUP' ? PermissionCodeEnum.RUP_FULL : PermissionCodeEnum.KPI_FULL

										return (
											<div key={domain} className='rounded-lg border bg-muted/20 p-3'>
												<div className='mb-3 flex items-center justify-between gap-3'>
													<p className='text-sm font-semibold'>{title}</p>
													<PermissionBadge permission={fullPermission} />
												</div>

												<div className='space-y-2'>
													{domainPermissions.map((permission) => {
														const checked = selectedPermissions.includes(permission)

														return (
															<label
																key={permission}
																className={[
																	'flex cursor-pointer items-center gap-2 rounded-md border bg-background px-2.5 py-2 transition-colors',
																	checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
																].join(' ')}
															>
																<Checkbox
																	checked={checked}
																	onCheckedChange={() => togglePermission(permission)}
																/>
																<PermissionBadge className='max-w-full' permission={permission} />
															</label>
														)
													})}
												</div>
											</div>
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
