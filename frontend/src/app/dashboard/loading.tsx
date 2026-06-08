import { Loader } from '@components'

export default function Loading() {
	return (
		<div className='flex min-h-[50vh] items-center justify-center p-6'>
			<Loader type='data' />
		</div>
	)
}
