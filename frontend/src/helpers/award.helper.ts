// count files from images and document fields from award
export const awardCountDocument = (images?: string[], document?: string): number => {
	const imagesCount = images?.length ?? 0
	const documentCount = document ? 1 : 0

	return imagesCount + documentCount
}
