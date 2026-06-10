'use client'

import { LocaleToggleButton, PageTitle } from '@components'
import type { ICreateTypesRequest, ITypeResponse, Locale } from '@types'

import { EditCard } from './edit-card'

interface ITypeEditorLayoutProps {
	activeLocale: Locale
	backHref: string
	description: string
	langKkLabel: string
	langRuLabel: string
	title: string
	type?: ITypeResponse
	onLocaleChange: (locale: Locale) => void
	onSubmit: (data: ICreateTypesRequest) => void
}

export const TypeEditorLayout = ({
	activeLocale,
	backHref,
	description,
	langKkLabel,
	langRuLabel,
	title,
	type,
	onLocaleChange,
	onSubmit,
}: ITypeEditorLayoutProps) => {
	return (
		<section className='mx-auto w-full p-6'>
			<PageTitle
				sticky
				actions={
					<LocaleToggleButton
						activeLocale={activeLocale}
						labels={{ kk: langKkLabel, ru: langRuLabel }}
						onChangeLocale={onLocaleChange}
					/>
				}
				backHref={backHref}
				description={description}
			>
				{title}
			</PageTitle>

			<EditCard activeLocale={activeLocale} type={type} onSubmit={onSubmit} />
		</section>
	)
}
