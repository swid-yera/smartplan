import type { FC } from 'react'

import Link from 'next/link'

import { formatAsDash } from '@helpers'
import type { IRup } from '@types'
import { Card, CardContent, CardHeader, CardTitle, Separator } from '@ui'
import { ExternalLink } from 'lucide-react'

interface IProps {
	data: IRup
}

export const ExplorationView: FC<IProps> = ({ data }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-xl'>Пояснительная записка</CardTitle>
			</CardHeader>

			<CardContent>
				<p className='leading-relaxed indent-4'>{formatAsDash(data.explorationNote.basis)}</p>
				<p className='leading-relaxed indent-4'>{formatAsDash(data.explorationNote.goals)}</p>
				<p className='leading-relaxed indent-4'>
					<span className='font-bold'>Формируемые компетенции: </span>
					{formatAsDash(data.explorationNote.competencies)}
				</p>

				<Separator className='my-2' />

				<p className='leading-relaxed indent-4'>
					<span className='font-bold'>Пререквизиты: </span>
					{formatAsDash(data.explorationNote.prerequisites)}
				</p>
				<p className='leading-relaxed indent-4'>
					<span className='font-bold'>Постреквизиты: </span>
					{formatAsDash(data.explorationNote.postrequisites)}
				</p>

				<Separator className='my-2' />

				<p className='font-bold indent-4'>Необходимые средства обучения, оборудование:</p>
				<p className='font-bold indent-4'>Учебно-методическое оснащение, справочная литература/интернет-ресурсы:</p>
				<ol className='list-decimal space-y-2 pl-5'>
					{data.explorationNote.internetResources.map((res, i) => (
						<li key={i} className='group ml-2'>
							<div className='flex items-center gap-2'>
								<span>{res.name}</span>

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

				<p className='font-bold indent-4 mt-4'>Технические средства и материалы:</p>
				<ol className='list-decimal space-y-2 pl-5'>
					{data.explorationNote.internetResources.map((res, i) => (
						<li key={i} className='group ml-2'>
							<div className='flex items-center gap-2'>
								<span>{res.name}</span>

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
