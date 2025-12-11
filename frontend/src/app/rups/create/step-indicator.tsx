import type { FC } from 'react'

import { cn } from '@lib'
import { Check } from 'lucide-react'

import type { IStep } from './page'

interface IStepIndicatorProps {
	steps: IStep[]
	currentStep: number
}

export const StepIndicator: FC<IStepIndicatorProps> = ({ steps, currentStep }) => {
	return (
		<div className='mb-6 flex items-center justify-between'>
			{steps.map((step) => (
				<div key={step.id} className='relative flex flex-1 flex-col items-center'>
					<div
						className={cn(
							'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300',
							currentStep > step.id
								? 'bg-primary/70 text-primary-foreground'
								: currentStep === step.id
									? 'bg-primary text-primary-foreground'
									: 'bg-accent text-accent-foreground',
						)}
					>
						{currentStep > step.id ? <Check className='h-5 w-5' /> : step.id}
					</div>
					<div
						className={cn(
							'mt-2 text-center text-sm font-medium',
							currentStep >= step.id ? 'text-background-foreground' : 'text-muted-foreground',
						)}
					>
						{step.title}
					</div>
					{step.id < steps.length && (
						<div
							className={cn(
								'absolute top-5 left-[calc(50%+20px)] h-0.5 w-[calc(100%-40px)] -translate-y-1/2 bg-accent transition-colors duration-300',
								currentStep > step.id && 'bg-secondary',
							)}
						/>
					)}
				</div>
			))}
		</div>
	)
}
