import type { Metadata } from 'next'

import { ASidebar, Footer } from '@layout'
import { QueryProvider, ThemeProvider } from '@providers'
import { AuthInitializer } from '@store'
import { SidebarInset, SidebarProvider, Toaster } from '@ui'

import './globals.css'

// metadata
export const metadata: Metadata = {
	title: 'Testing?',
	description: 'testing',
}

// layout
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html suppressHydrationWarning lang='ru'>
			<head />

			<body className='min-h-screen antialiased flex flex-col'>
				<ThemeProvider>
					<QueryProvider>
						<SidebarProvider defaultOpen suppressHydrationWarning>
							<AuthInitializer />
							<ASidebar />
							<SidebarInset className='flex flex-col justify-between'>
								{children}

								<Toaster position='top-right' />
								<Footer />
							</SidebarInset>
						</SidebarProvider>
					</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
