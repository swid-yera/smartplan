import type { FC } from 'react'

import Link from 'next/link'

import { formatAsDash, getLocaleText, getUILocaleSection } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IRup, Locale } from '@types'
import { ExternalLink } from 'lucide-react'
import localeDictionary from './locale.json'

interface IProps {
	data: IRup
	activeLocale: Locale
}

export const ExplorationView: FC<IProps> = ({ data, activeLocale }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-xl'>{t.explorationTitle}</CardTitle>
			</CardHeader>

			<CardContent>
				<p className='leading-relaxed indent-4'>{formatAsDash(getLocaleText(data.explorationNote.basis, activeLocale))}</p>
				<p className='leading-relaxed indent-4'>{formatAsDash(getLocaleText(data.explorationNote.goals, activeLocale))}</p>
				<p className='leading-relaxed indent-4'>
					<span className='font-bold'>{t.exploration.competencies}: </span>
					{formatAsDash(getLocaleText(data.explorationNote.competencies, activeLocale))}
				</p>

				<Separator className='my-2' />

				<p className='leading-relaxed indent-4'>
					<span className='font-bold'>{t.exploration.prerequisites}: </span>
					{formatAsDash(getLocaleText(data.explorationNote.prerequisites, activeLocale))}
				</p>
				<p className='leading-relaxed indent-4'>
					<span className='font-bold'>{t.exploration.postrequisites}: </span>
					{formatAsDash(getLocaleText(data.explorationNote.postrequisites, activeLocale))}
				</p>

				<Separator className='my-2' />

				<p className='font-bold indent-4'>{t.exploration.requiredEquipment}:</p>
				<p className='font-bold indent-4'>{t.exploration.internetResources}:</p>
				<ol className='list-decimal space-y-2 pl-5'>
					{data.explorationNote.internetResources.map((res, i) => (
						<li key={i} className='group ml-2'>
							<div className='flex items-center gap-2'>
								<span>{getLocaleText(res.name, activeLocale)}</span>

								{res.link && (
									<Link
										className='inline-flex items-center text-primary hover:underline underline-offset-4'
										href={res.link}
										rel='noopener noreferrer'
										target='_blank'
									>
										<ExternalLink className='h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity' />
									</Link>
								)}
							</div>
						</li>
					))}
				</ol>

				<p className='font-bold indent-4 mt-4'>{t.exploration.technicalResources}:</p>
				<ol className='list-decimal space-y-2 pl-5'>
					{data.explorationNote.technicalResources.map((res, i) => (
						<li key={i} className='group ml-2'>
							<div className='flex items-center gap-2'>
								<span>{getLocaleText(res.name, activeLocale)}</span>

								{res.link && (
									<Link
										className='inline-flex items-center text-primary hover:underline underline-offset-4'
										href={res.link}
										rel='noopener noreferrer'
										target='_blank'
									>
										<ExternalLink className='h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity' />
									</Link>
								)}
							</div>
						</li>
					))}
				</ol>
			</CardContent>
		</Card>
	)
}
