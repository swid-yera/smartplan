'use client'

import type { DetailedHTMLProps, FC, HTMLAttributes } from 'react'

import { getLocaleText, normalizeUserRole, normalizeUserType } from '@helpers'
import { services } from '@services'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IUser, UserTypeEnum } from '@types'
import { ChevronsUpDown, GroupIcon, LogOut, Mail, Phone, ShieldUser, User, UserCheck } from 'lucide-react'

import { UserTypeBadge } from '../../badges/user-type-badge'
import sidebarLocale from './locale.json'

interface INavUserProps extends DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement> {
	user: IUser
}

export const NavUser: FC<INavUserProps> = ({ user, className, ...props }) => {
	const { isMobile } = useSidebar()
	const locale = useLocaleStore((state) => state.locale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru
	const logoutLabel = t.logout
	const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username
	const department = user.departments?.[0]
	const departmentName = department ? getLocaleText(department.name, locale) : ''
	const userTypeLabel = user.userType !== UserTypeEnum.NULL ? normalizeUserType(user.userType, locale) : ''
	const userTypeOrRoleLabel = userTypeLabel || normalizeUserRole(user.role, locale)

	return (
		<SidebarMenu className={className} {...props}>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className='w-full justify-between gap-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0'
							size='lg'
							tooltip={fullName}
						>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<User className='h-5 w-5' />
							</div>

							<div className='grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
								<span className='truncate font-medium'>{fullName}</span>
								<div className='flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
									{user.userType !== UserTypeEnum.NULL ? (
										<UserTypeBadge className='h-5 px-1.5' userType={user.userType} />
									) : (
										<span className='truncate'>{userTypeOrRoleLabel}</span>
									)}
								</div>
							</div>
							<ChevronsUpDown className='ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden' />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
						side={isMobile ? 'bottom' : 'right'}
						sideOffset={4}
					>
						<DropdownMenuLabel className='p-0 font-normal'>
							<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
								<div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<User className='h-5 w-5' />
								</div>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-medium'>{fullName}</span>
									<span className='truncate text-xs text-muted-foreground'>
										{[userTypeLabel].filter(Boolean).join(' · ')}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<User />
								{user.username}
							</DropdownMenuItem>
							<DropdownMenuItem>
								<ShieldUser />
								{normalizeUserRole(user.role, locale)}
							</DropdownMenuItem>
							{departmentName ? (
								<DropdownMenuItem>
									<GroupIcon />
									<span className='text-xs'>{departmentName}</span>
								</DropdownMenuItem>
							) : null}
							{userTypeLabel && (
								<DropdownMenuItem>
									<UserCheck />
									<span className='text-xs'>{userTypeLabel}</span>
								</DropdownMenuItem>
							)}
							{user.email && (
								<DropdownMenuItem>
									<Mail />
									{user.email}
								</DropdownMenuItem>
							)}
							{user.phone && (
								<DropdownMenuItem>
									<Phone />
									{user.phone}
								</DropdownMenuItem>
							)}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem className='cursor-pointer' onClick={() => services.auth.redirectToLogout()}>
							<LogOut />
							{logoutLabel}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
