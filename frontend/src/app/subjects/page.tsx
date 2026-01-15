import type { NextPage } from 'next'

import { Card, CardContent } from '@ui'
import { BookOpenCheck, Construction } from 'lucide-react'

const Page: NextPage = () => {
	return (
		<section className='h-full flex items-center justify-center bg-background px-4'>
			<Card className='w-full max-w-lg text-center shadow-lg'>
				<CardContent className='flex flex-col items-center gap-5 py-10'>
					<div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-muted'>
						<Construction className='h-7 w-7 text-muted-foreground' />
					</div>

					<h1 className='text-2xl font-semibold tracking-tight'>Поурочный план</h1>

					<p className='text-sm text-muted-foreground'>Раздел находится в разработке</p>

					<div className='flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-left text-sm'>
						<BookOpenCheck className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' />
						<p className='text-muted-foreground'>
							<strong>Поурочный план</strong> — это инструмент, который позволит преподавателям быстро создавать
							подробные планы уроков с помощью искусственного интеллекта.
							<br />
							<br />
							Система автоматически формирует структуру урока в соответствии с{' '}
							<strong>Приказом №130 Республики Казахстан</strong>, учитывая цели, ожидаемые результаты, этапы
							урока, методы обучения и оценивание.
						</p>
					</div>

					<p className='text-xs text-muted-foreground'>
						Скоро вы сможете создавать поурочные планы за несколько минут 🚀
					</p>
				</CardContent>
			</Card>
		</section>
	)
}

export default Page
