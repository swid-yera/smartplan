import type { Metadata } from 'next'

import { ASidebar, Footer } from '@layout'
import { ThemeProvider } from '@providers'
import { SidebarInset, SidebarProvider } from '@ui'

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
					<SidebarProvider defaultOpen suppressHydrationWarning>
						<ASidebar />
						<SidebarInset>
							{children}
							<Footer />
						</SidebarInset>
					</SidebarProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
