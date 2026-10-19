import {afterEach, describe, expect, it, vi} from 'vitest'
import * as DocumentWatcher from '../../src/watchers/document-watcher'
import * as RectWatcher from '../../src/watchers/rect-watcher'
import * as ResizeWatcher from '../../src/watchers/resize-watcher'


vi.mock('../../src/watchers/document-watcher', () => ({
	bind: vi.fn(),
	unbind: vi.fn(),
}))

vi.mock('../../src/watchers/resize-watcher', () => ({
	watch: vi.fn(),
	unwatch: vi.fn(),
}))


describe('RectWatcher', () => {
	let watched: Element[] = []

	afterEach(() => {
		for (let el of watched) {
			RectWatcher.unwatch(el)
		}

		watched = []
		vi.clearAllMocks()
		vi.restoreAllMocks()
	})

	it('reports anchor size changes without a document mutation', () => {
		let el = document.createElement('div')
		let rect = new DOMRect(10, 20, 30, 40)
		let callback = vi.fn()
		vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => rect)
		watched.push(el)

		RectWatcher.watch(el, callback)
		let onResize = vi.mocked(ResizeWatcher.watch).mock.calls[0][1]

		rect = new DOMRect(10, 20, 50, 40)
		onResize({target: el} as ResizeObserverEntry)
		expect(callback).toHaveBeenCalledOnce()
		expect(callback).toHaveBeenCalledWith(rect)

		let onDocument = vi.mocked(DocumentWatcher.bind).mock.calls[0][0] as () => void
		onDocument()
		expect(callback).toHaveBeenCalledOnce()
	})

	it('keeps tracking position changes and unregisters synchronously', () => {
		let el = document.createElement('div')
		let rect = new DOMRect(10, 20, 30, 40)
		let callback = vi.fn()
		vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => rect)
		watched.push(el)

		RectWatcher.watch(el, callback)
		let onResize = vi.mocked(ResizeWatcher.watch).mock.calls[0][1]
		let onDocument = vi.mocked(DocumentWatcher.bind).mock.calls[0][0] as () => void

		rect = new DOMRect(15, 20, 30, 40)
		onDocument()
		expect(callback).toHaveBeenCalledWith(rect)

		RectWatcher.unwatch(el, callback)
		rect = new DOMRect(15, 20, 50, 40)
		onResize({target: el} as ResizeObserverEntry)
		expect(callback).toHaveBeenCalledOnce()
		expect(ResizeWatcher.unwatch).toHaveBeenCalledWith(el, onResize)
	})
})
