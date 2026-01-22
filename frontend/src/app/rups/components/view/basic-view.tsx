import type { FC, ReactNode } from 'react'

interface InfoTableRow {
	label: string
	value?: ReactNode
	subLabel?: string
}

interface InfoTableProps {
	title?: string
	rows: InfoTableRow[]
}

export const BasicView: FC<InfoTableProps> = ({ title, rows }) => {
	return (
		<div className='border rounded-md overflow-hidden bg-background'>
			{title && <div className='px-4 py-2 text-center font-semibold text-sm border-b'>{title}</div>}

			<table className='w-full border-collapse text-sm'>
				<tbody>
					{rows.map((row, i) => (
						<tr key={i} className='border-b last:border-b-0'>
							<td className='w-1/3 px-4 py-3 align-top font-medium border-r bg-muted/40'>
								<div>{row.label}</div>
								{row.subLabel && <div className='text-xs text-muted-foreground'>{row.subLabel}</div>}
							</td>

							<td className='px-4 py-3 align-top'>
								<div className='flex items-start justify-between gap-4'>
									<div className='font-semibold'>{row.value || '—'}</div>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
