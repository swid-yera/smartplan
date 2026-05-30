import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { SITE_LOCALE_COOKIE_KEY, isSiteLocale } from '@helpers'
import { ASidebar, Footer } from '@layout'
import { ASidebarProvider, AuthProvider, LocaleProvider, QueryProvider, ThemeProvider } from '@providers'
import { SidebarInset, Toaster } from '@shadcn'
import 'react-medium-image-zoom/dist/styles.css'

import { RupsLanguageGenerationNotifier } from './rups/components/language-generation-notifier'

import './globals.css'

// metadata
export const metadata: Metadata = {
	title: {
		default: 'SmartPlan',
		template: '%s | SmartPlan',
	},
	description: 'Система управления учебными планами для колледжей',

	// TODO: edit
	applicationName: 'SmartPlan',
	creator: 'SmartPlan',
	publisher: 'SmartPlan',

	icons: {
		icon: [
			{
				url: '/favicon.ico',
				sizes: 'any',
			},
			{
				url: '/eduplan.png',
				type: 'image/png',
			},
			{
				url: '/eduplan-icon-16x16.png',
				sizes: '16x16',
				type: 'image/png',
			},
			{
				url: '/eduplan-icon-32x32.png',
				sizes: '32x32',
				type: 'image/png',
			},
		],
		apple: [
			{
				url: '/eduplan-icon-180x180.png',
				sizes: '180x180',
				type: 'image/png',
			},
		],
		shortcut: ['/favicon.ico'],
	},

	openGraph: {
		type: 'website',
		locale: 'ru_RU',
		siteName: 'SmartPlan',
		title: 'SmartPlan',
		description: 'Система управления учебными планами для колледжей',
		images: [
			{
				url: '/eduplan.png',
				width: 1200,
				height: 630,
				alt: 'SmartPlan — система управления учебными планами для колледжей',
			},
		],
	},

	twitter: {
		card: 'summary_large_image',
		title: 'SmartPlan',
		description: 'Система управления учебными планами для колледжей',
		images: ['/eduplan.png'],
	},

	manifest: '/site.webmanifest',
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
	const hasSid = cookieStore.has('sid')

	return (
		<html suppressHydrationWarning lang={locale}>
			<head />

			<body className='min-h-screen antialiased flex flex-col'>
				<ThemeProvider>
					<QueryProvider>
						<LocaleProvider>
							<ASidebarProvider>
								<AuthProvider hasSid={hasSid} />

								<ASidebar hasSid={hasSid} />
								<SidebarInset className='flex-1 min-w-0 justify-between items-stretch'>
									{children}

									<RupsLanguageGenerationNotifier />
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
