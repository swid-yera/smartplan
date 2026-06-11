'use client'

import * as React from 'react'

import { usePathname } from 'next/navigation'

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, Skeleton } from '@shadcn'
import { useSidebar } from '@shadcn'
import { useAuthStore } from '@store'

import { navFooter, navMain } from './nav-data'
import { NavFooter } from './nav-footer'
import { ASidebarHeader } from './nav-header'
import { NavMain } from './nav-main'

interface ASidebarProps extends React.ComponentProps<typeof Sidebar> {
	hasSid: boolean
}

function MobileSidebarAutoClose() {
	const pathname = usePathname()
	const { isMobile, setOpenMobile } = useSidebar()
	const previousPathname = React.useRef(pathname)

	React.useEffect(() => {
		const pathnameChanged = previousPathname.current !== pathname
		previousPathname.current = pathname

		if (!isMobile || !pathnameChanged) return

		setOpenMobile(false)
	}, [isMobile, pathname, setOpenMobile])

	return null
}

export function ASidebar({ hasSid, ...props }: ASidebarProps) {
	const { authLoading } = useAuthStore()
	const showSidebarSkeleton = authLoading && hasSid

	if (showSidebarSkeleton) {
		return (
			<Sidebar className='border-r-0' collapsible='icon' variant='floating' {...props}>
				<SidebarHeader>
					<div className='space-y-3 pb-2'>
						<Skeleton className='h-10 w-full rounded-md' />
						<Skeleton className='h-10 w-full rounded-md' />
					</div>
				</SidebarHeader>

				<SidebarContent>
					<div className='space-y-2 px-2 pt-2'>
						<Skeleton className='h-4 w-20 rounded' />
						<Skeleton className='h-8 w-full rounded-md' />
						<Skeleton className='h-8 w-full rounded-md' />
						<Skeleton className='h-8 w-full rounded-md' />
						<Skeleton className='h-8 w-full rounded-md' />
					</div>
				</SidebarContent>

				<SidebarFooter>
					<div className='space-y-2 px-2 pb-2'>
						<Skeleton className='h-8 w-full rounded-md' />
						<Skeleton className='h-8 w-full rounded-md' />
					</div>
				</SidebarFooter>
			</Sidebar>
		)
	}

	return (
		<Sidebar className='border-r-0' collapsible='icon' variant='floating' {...props}>
			<MobileSidebarAutoClose />
			<ASidebarHeader hasSid={hasSid} />

			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>

			<SidebarFooter>
				<NavFooter items={navFooter} />
			</SidebarFooter>
		</Sidebar>
	)
}
