import { Spinner } from '@ui'

export const Loader = () => {
	return (
		<div className='flex h-full w-full min-h-[200px] items-center justify-center'>
			<Spinner className='size-8' />
		</div>
	)
}
