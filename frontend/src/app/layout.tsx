import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { SITE_LOCALE_COOKIE_KEY, isSiteLocale } from '@helpers'
import { ASidebar, Footer } from '@layout'
import { ASidebarProvider, AuthProvider, LocaleProvider, QueryProvider, ThemeProvider } from '@providers'
import { SidebarInset, Toaster } from '@shadcn'
import 'react-medium-image-zoom/dist/styles.css'

import './globals.css'

// metadata
export const metadata: Metadata = {
	title: 'Smartplan',
	description: 'Smartplan',
	icons: {
		icon: '/Smartplan_icon.png',
	},
}

// layout
export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const cookieStore = await cookies()
	const localeFromCookie = cookieStore.get(SITE_LOCALE_COOKIE_KEY)?.value
	const locale = isSiteLocale(localeFromCookie) ? localeFromCookie : 'ru'

	return (
		<html suppressHydrationWarning lang={locale}>
			<head />

			<body className='min-h-screen antialiased flex flex-col'>
				<ThemeProvider>
					<QueryProvider>
						<LocaleProvider>
							<ASidebarProvider>
								<AuthProvider />

								<ASidebar />
								<SidebarInset className='flex-1 min-w-0 justify-between items-stretch'>
									{children}

									<Toaster position='top-center' />
									<Footer />
								</SidebarInset>
							</ASidebarProvider>
						</LocaleProvider>
					</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
