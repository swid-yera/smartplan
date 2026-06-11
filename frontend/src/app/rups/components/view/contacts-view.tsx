'use client'

import { type FC } from 'react'

import { formatAsDash, getUILocaleSection } from '@helpers'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import type { IUser, Locale } from '@types'
import { Mail, Phone, User, UserPlus } from 'lucide-react'

import localeDictionary from './locale.json'

type IProps = {
	contacts: IUser[]
	creatorId: string
	activeLocale: Locale
}

export const ContactsView: FC<IProps> = ({ creatorId, contacts, activeLocale }) => {
	const t = getUILocaleSection(localeDictionary, activeLocale)

	return (
		<Card className='overflow-hidden'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0'>
				<div className='space-y-1'>
					<CardTitle className='text-xl'>{t.contactsTitle}</CardTitle>
					<CardDescription>{t.contactsDescription}</CardDescription>
				</div>
			</CardHeader>

			<CardContent className='p-0'>
				{contacts.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow className='bg-muted/50 hover:bg-muted/50'>
								<TableHead className='w-[40%] pl-6'>{t.contacts.teacherName}</TableHead>
								<TableHead>{t.contacts.contacts}</TableHead>
								<TableHead>{t.contacts.email}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contacts.map((teacher) => {
								const isCreator = teacher.keycloakId === creatorId

								return (
									<TableRow key={teacher.keycloakId} className='group'>
										<TableCell className='pl-6 font-medium'>
											<div className='flex items-center gap-3'>
												<div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
													<User className='h-4 w-4' />
												</div>
												<div className='flex flex-col'>
													<span>
														{teacher.firstName} {teacher.lastName}
													</span>
													{isCreator && (
														<span className='text-[10px] text-primary font-normal'>
															{t.contacts.creator}
														</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<Phone className='h-3 w-3' />
												{formatAsDash(teacher.phone)}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<Mail className='h-3 w-3' />
												{formatAsDash(teacher.email)}
											</div>
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				) : (
					<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
						<div className='rounded-full bg-muted p-4 mb-4'>
							<UserPlus className='h-8 w-8 text-muted-foreground' />
						</div>
						<h3 className='font-medium text-lg'>{t.contacts.emptyTitle}</h3>
						<p className='text-muted-foreground max-w-[300px]'>{t.contacts.emptyDescription}</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
