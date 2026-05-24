import { cookies } from 'next/headers'

import { PageTitle } from '@components'
import { readSiteLocaleFromCookieValue, SITE_LOCALE_COOKIE_KEY } from '@helpers'

import { GuidesList } from './guides-list'
import locale from './locale.json'

export default async function GuidesPage() {
	const cookieStore = await cookies()
	const currentLocale = readSiteLocaleFromCookieValue(cookieStore.get(SITE_LOCALE_COOKIE_KEY)?.value)
	const t = locale[currentLocale] ?? locale.ru

	return (
		<section className='mx-auto w-full max-w-6xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<GuidesList />
		</section>
	)
}
