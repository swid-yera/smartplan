import { Input } from '@shadcn'

interface NumericInputProps extends Omit<
	React.ComponentProps<typeof Input>,
	'value' | 'onChange' | 'min' | 'max' | 'step'
> {
	value: number | ''
	onChange: (value: number | '') => void
	min?: number
	max?: number
	step?: number
}

export const NumericInput = ({ value, onChange, min, max, step = 1, ...props }: NumericInputProps) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value.replace(/\D/g, '')

		if (rawValue === '') {
			onChange('')

			return
		}

		let numValue = parseInt(rawValue, 10)

		if (max !== undefined && numValue > max) {
			numValue = max
		}

		onChange(numValue)
	}

	const adjustValue = (direction: 1 | -1) => {
		const currentValue = value === '' ? 0 : value
		let newValue = currentValue + step * direction

		if (max !== undefined && newValue > max) newValue = max
		if (min !== undefined && newValue < min) newValue = min

		onChange(newValue)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowUp') {
			e.preventDefault()
			adjustValue(1)
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			adjustValue(-1)
		}
	}

	const handleBlur = () => {
		if (value !== '' && min !== undefined && value < min) {
			onChange(min)
		}
	}

	return (
		<Input
			{...props}
			inputMode='numeric'
			type='text'
			value={value}
			onBlur={handleBlur}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
		/>
	)
}
