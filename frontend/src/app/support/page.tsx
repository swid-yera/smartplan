'use client'

import Link from 'next/link'

import { Loader } from '@components'
import { getUILocaleSection } from '@helpers'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	Heading,
	Separator,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { CircleQuestionMark, ExternalLink, MessageCircleMore } from 'lucide-react'

import localeDictionary from './locale.json'

const TELEGRAM_SUPPORT_HREF = 'https://t.me/smartplan_support'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const { isAuthenticated, authLoading } = useAuthStore()
	const t = getUILocaleSection(localeDictionary, locale)

	if (authLoading) {
		return <Loader type='data' />
	}

	return (
		<section className='w-full py-12 md:py-24 lg:py-32'>
			<div className='container mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-4 md:px-6 lg:grid-cols-2'>
				<div className='w-full'>
					<Badge variant='secondary'>
						<CircleQuestionMark className='h-4 w-4' />
						{t.badge}
					</Badge>

					<Heading align='left' className='mt-1 text-4xl leading-tight sm:text-5xl' size='h1'>
						{t.titleLine1}
						<br />
						{t.titleLine2}
					</Heading>

					<p className='mt-4 max-w-2xl text-base leading-7 text-muted-foreground'>{t.description}</p>

					<Separator className='mt-8' />

					<div className='mt-8 space-y-4'>
						<div className='space-y-3'>
							<h3 className='text-2xl font-bold'>{t.issueTitle}</h3>
							<p className='max-w-2xl text-sm leading-6 text-muted-foreground'>{t.issueDescription}</p>
						</div>

						<div className='rounded-2xl border border-border/60 bg-muted/30 p-5'>
							<p className='text-sm font-medium text-foreground'>{t.ticketTitle}</p>
							<p className='mt-2 text-sm leading-6 text-muted-foreground'>
								{t.ticketDescription}{' '}
								<Link
									className='font-medium text-primary underline underline-offset-4 hover:text-primary/90'
									href={t.ticketLink}
									rel='noreferrer'
									target='_blank'
								>
									{t.ticketLabel}
								</Link>{' '}
								{t.ticketHint}
							</p>
						</div>

						{isAuthenticated ? (
							<div className='rounded-2xl border border-primary/20 bg-primary/5 p-5'>
								<p className='text-sm font-medium text-foreground'>{t.telegramTitle}</p>
								<p className='mt-2 text-sm leading-6 text-muted-foreground'>{t.telegramDescription}</p>

								<Button asChild className='mt-4 w-full sm:w-auto'>
									<Link href={TELEGRAM_SUPPORT_HREF} rel='noreferrer' target='_blank'>
										<MessageCircleMore className='h-4 w-4' />
										{t.telegramButton}
										<ExternalLink className='h-4 w-4' />
									</Link>
								</Button>
							</div>
						) : null}
					</div>
				</div>

				<Accordion collapsible className='w-full' defaultValue='item-0' type='single'>
					{t.faqs.map((faq, index) => (
						<AccordionItem key={index} value={`item-${index}`}>
							<AccordionTrigger className='text-base'>{faq.question}</AccordionTrigger>
							<AccordionContent className='text-muted-foreground italic'>{faq.answer}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	)
}

export default Page
