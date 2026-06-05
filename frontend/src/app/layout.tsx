import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { SITE_LOCALE_COOKIE_KEY, isSiteLocale } from '@helpers'
import { ASidebar, Footer } from '@layout'
import { ASidebarProvider, AuthProvider, LocaleProvider, QueryProvider, ThemeProvider } from '@providers'
import { SidebarInset, Toaster } from '@shadcn'
import 'react-medium-image-zoom/dist/styles.css'

import './globals.css'
import { RupsLanguageGenerationNotifier } from './rups/components/language-generation-notifier'

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
			<head>
				{/* umami */}
				<script
					defer
					data-website-id='9d32889e-9600-4b30-ad06-5239117d1438'
					src='https://metrics.aspc.kz/script.js'
				/>
			</head>

			<body className='flex min-h-screen flex-col antialiased'>
				<ThemeProvider>
					<QueryProvider>
						<LocaleProvider>
							<ASidebarProvider>
								<AuthProvider hasSid={hasSid} />

								<ASidebar hasSid={hasSid} />
								<SidebarInset className='flex min-h-svh flex-1 min-w-0 flex-col'>
									<div className='flex min-h-0 flex-1 flex-col'>
										{children}

										<RupsLanguageGenerationNotifier />
										<Toaster position='top-center' />
										<Footer />
									</div>
								</SidebarInset>
							</ASidebarProvider>
						</LocaleProvider>
					</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
