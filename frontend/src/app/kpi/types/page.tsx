'use client'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@ui'
import { Plus } from 'lucide-react'

import { TypesCard } from './types-card'

const Page = () => {
	const { data, isLoading } = useQuery({ ...services.award.getAllTypesOptions(), enabled: true })

	if (isLoading) return <Loader />

	return (
		<section className='p-4 w-full space-y-6'>
			<PageTitle
				sticky
				actions={
					<Button asChild>
						<Link href='/kpi/types/create'>
							<Plus className='mr-2 h-4 w-4' />
							Создать
						</Link>
					</Button>
				}
				description='Критерий оценивание'
			>
				Критерий оценивание
			</PageTitle>

			{/* content */}
			<Card>
				<CardHeader>
					<CardTitle>Критерии оценивания</CardTitle>
					<CardDescription>Роль критериев в системе KPI преподавателей и подразделений</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p>
						Критерии оценивания – это ключевые параметры, по которым оценивается деятельность сотрудника. Они
						позволяют объективно определить качество работы преподавателей и подразделений.
					</p>

					<p>
						Каждый критерий имеет строго однозначную интерпретацию, раскрываемую в пояснениях и примерах. Критерии
						разрабатываются KPI-комиссией, утверждаются приказом директора и доводятся до сведения коллектива.
					</p>

					<Separator />

					<p className='font-semibold'>Основные свойства критериев:</p>
					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>Объективность и измеримость;</li>
						<li>Понятность и достижимость для преподавателей и руководителей;</li>
						<li>Возможность для морального и материального поощрения;</li>
						<li>Поддержка анализа эффективности работы и выявления областей для улучшения.</li>
					</ul>
				</CardContent>
			</Card>

			{/* Карточка 2: Варианты и баллы */}
			<Card>
				<CardHeader>
					<CardTitle>Структура критериев</CardTitle>
					<CardDescription>Варианты критериев и способы начисления баллов</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p>
						Каждый критерий может иметь несколько вариантов (Variants), которые отражают различные аспекты
						деятельности преподавателя или подразделения.
					</p>

					<p>Варианты состоят из набора критериев, для которых устанавливаются баллы:</p>

					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>
							<strong>Римская нумерация</strong> используется для удобного отображения подсписков критериев.
						</li>
						<li>
							<em>Points</em> могут быть двух типов:
							<ul className='list-inside list-decimal space-y-1 text-muted-foreground ml-4'>
								<li>
									<strong>NORMAL</strong>: фиксированное количество баллов [x]
								</li>
								<li>
									<strong>MEASURING</strong>: диапазон баллов [min, max]
								</li>
							</ul>
						</li>
						<li>Описание и пояснения к каждому варианту помогают понять, что именно оценивается.</li>
					</ul>

					<p>
						Такая структура позволяет KPI-системе быть гибкой, объективной и прозрачной, обеспечивая точную оценку
						результатов работы преподавателей и подразделений.
					</p>
				</CardContent>
			</Card>

			<TypesCard types={data || []} />
		</section>
	)
}

export default Page
