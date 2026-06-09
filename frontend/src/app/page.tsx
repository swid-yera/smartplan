import type { Metadata } from 'next'

import HomePageClient from './home-page-client'

const siteTitle = 'SmartPlan'
const pageTitle = 'SmartPlan - смарт планнер для Политеха | Almaty Polytechnic College'
const pageDescription =
	'SmartPlan (смарт план, smart planner) - платформа для Almaty Polytechnic College и Политеха: РУП, KPI, поурочные планы и AI-инструменты для преподавателей.'
const pageKeywords = [
	'SmartPlan',
	'smartplan',
	'smart plan',
	'smart planner',
	'smart palnner',
	'смарт план',
	'смарт планнер',
	'смарт план политех',
	'smart plan политех',
	'Almaty Polytechnic College',
	'политех',
]

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
	title: {
		absolute: pageTitle,
	},
	description: pageDescription,
	keywords: pageKeywords,
	applicationName: siteTitle,
	creator: siteTitle,
	publisher: siteTitle,
	alternates: {
		canonical: '/',
	},
	robots: {
		index: true,
		follow: true,
	},
	openGraph: {
		type: 'website',
		url: '/',
		siteName: siteTitle,
		title: pageTitle,
		description: pageDescription,
		locale: 'ru_RU',
		images: [
			{
				url: '/eduplan.png',
				width: 1200,
				height: 630,
				alt: 'SmartPlan — смарт планнер для Политеха и Almaty Polytechnic College',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: pageTitle,
		description: pageDescription,
		images: ['/eduplan.png'],
	},
}

export default function Page() {
	return <HomePageClient />
}
