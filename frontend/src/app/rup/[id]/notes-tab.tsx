import type { IRup } from '@types'
import { Label } from '@ui'

interface NotesTabProps {
	rup: IRup
	updateRup: (updates: Partial<IRup>) => void
}

export const NotesTab = ({ rup, updateRup }: NotesTabProps) => {
	return (
		<div className='space-y-4'>
			<Label htmlFor='explanatoryNote'>Пояснительная записка</Label>
			<textarea
				className='w-full h-64 p-2 border rounded-md'
				id='explanatoryNote'
				placeholder='Введите пояснительную записку...'
				value={rup.explanatoryNote}
				onChange={(e) => updateRup({ explanatoryNote: e.target.value })}
			/>
		</div>
	)
}
