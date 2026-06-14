'use client'

import { useCallback, useEffect, useRef } from 'react'

const isModifiedClick = (event: MouseEvent) =>
	event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0

export function useUnsavedChangesGuard(hasUnsavedChanges: boolean, message: string) {
	const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
	const messageRef = useRef(message)
	const historyGuardActiveRef = useRef(false)
	const bypassNextPopStateRef = useRef(false)

	useEffect(() => {
		hasUnsavedChangesRef.current = hasUnsavedChanges
		messageRef.current = message
	}, [hasUnsavedChanges, message])

	const confirmNavigation = useCallback(() => {
		if (!hasUnsavedChangesRef.current) return true

		return window.confirm(messageRef.current)
	}, [])

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!hasUnsavedChangesRef.current) return

			event.preventDefault()
			event.returnValue = ''
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [])

	useEffect(() => {
		if (!hasUnsavedChanges) {
			historyGuardActiveRef.current = false

			return
		}

		if (historyGuardActiveRef.current) return

		window.history.pushState({ __unsavedChangesGuard: true }, '', window.location.href)
		historyGuardActiveRef.current = true
	}, [hasUnsavedChanges])

	useEffect(() => {
		const handlePopState = () => {
			if (bypassNextPopStateRef.current) {
				bypassNextPopStateRef.current = false

				return
			}

			if (!hasUnsavedChangesRef.current) return

			if (window.confirm(messageRef.current)) {
				bypassNextPopStateRef.current = true
				window.history.back()

				return
			}

			window.history.pushState({ __unsavedChangesGuard: true }, '', window.location.href)
		}

		window.addEventListener('popstate', handlePopState)

		return () => window.removeEventListener('popstate', handlePopState)
	}, [])

	useEffect(() => {
		const handleDocumentClick = (event: MouseEvent) => {
			if (!hasUnsavedChangesRef.current || event.defaultPrevented || isModifiedClick(event)) return

			const target = event.target
			if (!(target instanceof Element)) return

			const anchor = target.closest('a[href]')
			if (!(anchor instanceof HTMLAnchorElement)) return
			if (anchor.target && anchor.target !== '_self') return
			if (anchor.hasAttribute('download')) return

			const nextUrl = new URL(anchor.href, window.location.href)
			if (nextUrl.origin !== window.location.origin) return
			if (nextUrl.href === window.location.href) return
			if (window.confirm(messageRef.current)) return

			event.preventDefault()
			event.stopPropagation()
		}

		document.addEventListener('click', handleDocumentClick, true)

		return () => document.removeEventListener('click', handleDocumentClick, true)
	}, [])

	return { confirmNavigation }
}
