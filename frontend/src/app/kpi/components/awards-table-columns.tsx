import { formatAsDash } from '@helpers'
import { ColumnDef } from '@tanstack/react-table'
import type { AwardStatusEnum, IAward } from '@types'
import { Badge } from '@ui'

const statusMap: Record<AwardStatusEnum, string> = {
	IN_REVIEW: 'На проверке',
	APPROVED: 'Подтверждено',
	REJECTED: 'Отклонено',
	DRAFT: 'Черновик',
}

export const awardColumns: ColumnDef<IAward>[] = [
	{
		accessorKey: 'status',
		header: 'Статус',
		cell: ({ row }) => (
			<Badge
				variant={
					row.original.status === 'approved'
						? 'default'
						: row.original.status === 'rejected'
							? 'destructive'
							: 'secondary'
				}
			>
				{statusMap[row.original.status]}
			</Badge>
		),
	},
	{
		accessorKey: 'title',
		header: 'Название',
	},
	{
		accessorKey: 'filesCount',
		header: 'Файлы',
		cell: ({ row }) => `${row.original.filesCount} файл(а)`,
	},
	{
		accessorKey: 'methodist',
		header: 'Методист',
		cell: ({ row }) => formatAsDash(row.original.methodist),
	},
	{
		accessorKey: 'teacher',
		header: 'Преподаватель',
	},
	{
		accessorKey: 'createdAt',
		header: 'Дата',
	},
]
