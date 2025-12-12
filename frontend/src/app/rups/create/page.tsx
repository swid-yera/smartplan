'use client'

import { type JSX } from 'react'

import type { NextPage } from 'next'

import { Tabs, TabsContent } from '@ui'

import { Step1 } from './step1/step1'
import { Step2 } from './step2/step2'
import { Step3 } from './step3/step3'
import { Step4 } from './step4/step4'
import { TabHeader } from './tab-header'
import { TabIndicator } from './tab-indicator'

const Page: NextPage = () => {
	return (
		<Tabs className='w-full mx-auto px-4 py-6 space-y-4' defaultValue={tabs[0].id}>
			{/* step tab indicator */}
			<TabIndicator steps={tabs} />

			{tabs.map((tab) => (
				<TabsContent key={tab.id} value={tab.id}>
					<TabHeader tab={tab} />
					{tab.content}
				</TabsContent>
			))}
		</Tabs>
	)
}

// steps
export interface ITab {
	id: string
	title: string
	fullTitle: string
	description: string
	content: JSX.Element
}

const tabs: ITab[] = [
	{
		id: '1',
		title: 'Основные данные',
		fullTitle: 'Создание нового рабочего учебного плана',
		description: 'Базовые данные, пояснительная записка, цели и задачи',
		content: <Step1 />,
	},
	{
		id: '2',
		title: 'Метаданные',
		fullTitle: 'Метаданные, материалы и ресурсы',
		description: 'Метаданные, технические материалы и учебно методические ресурсы',
		content: <Step2 />,
	},
	{
		id: '3',
		title: 'Распределение часов',
		fullTitle: 'Распределение часов по семестру',
		description: 'Добавьте дисциплины и распределите кредиты по семестрам',
		content: <Step3 />,
	},
	{
		id: '4',
		title: 'Содержание',
		fullTitle: 'Содержание учебной рабочей программы',
		description: 'Добавьте темы занятий для каждой дисциплины',
		content: <Step4 />,
	},
]

export default Page
