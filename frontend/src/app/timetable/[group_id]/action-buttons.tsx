import { Button } from '@ui'

interface ActionButtonsProps {
	onSave: () => void
	onAutoOptimize: () => void
	onExport: (format: 'pdf' | 'excel') => void
}

export const ActionButtons = ({ onSave, onAutoOptimize, onExport }: ActionButtonsProps) => {
	return (
		<div className='flex justify-end space-x-4 mt-6'>
			<Button variant='outline' onClick={onSave}>
				Сохранить
			</Button>
			<Button variant='outline' onClick={onAutoOptimize}>
				Автооптимизация
			</Button>
			<Button variant='outline' onClick={() => onExport('pdf')}>
				Экспорт PDF
			</Button>
			<Button variant='outline' onClick={() => onExport('excel')}>
				Экспорт Excel
			</Button>
		</div>
	)
}
