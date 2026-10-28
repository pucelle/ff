import {afterEach, describe, expect, it, vi} from 'vitest'
import {AnchorAligner} from '../../src/tools/anchor-aligner/anchor-aligner'
import {RectWatcher} from '../../src/watchers'
import {computeReAnchoredOrTargetedRect} from '../../src/tools/anchor-aligner/helpers/target-aligner'


vi.mock('lupos', () => ({
	barrierDOMReading: vi.fn(async () => {}),
	barrierDOMWriting: vi.fn(async () => {}),
}))

vi.mock('../../src/watchers', () => ({
	ResizeWatcher: {watch: vi.fn(), unwatch: vi.fn()},
	RectWatcher: {watch: vi.fn(), unwatch: vi.fn()},
}))


describe('parental anchor bounds', () => {
	it('extends only the alignment axis and retains descendant behavior', () => {
		let trigger = new DOMRect(120, 210, 40, 20)
		let parent = new DOMRect(100, 100, 200, 300)
		let horizontal = computeReAnchoredOrTargetedRect(trigger, parent, 'horizontal', true, true)
		let vertical = computeReAnchoredOrTargetedRect(trigger, parent, 'vertical', true, true)
		let descendant = computeReAnchoredOrTargetedRect(parent, trigger, 'horizontal', true)
		expect([horizontal.x, horizontal.y, horizontal.width, horizontal.height]).toEqual([100, 210, 200, 20])
		expect([vertical.x, vertical.y, vertical.width, vertical.height]).toEqual([120, 100, 40, 300])
		expect([descendant.x, descendant.y, descendant.width, descendant.height]).toEqual([100, 210, 200, 20])
		expect(computeReAnchoredOrTargetedRect(trigger, parent, 'horizontal', false, true)).toBe(parent)
	})
})


describe('AnchorAligner leave positioning', () => {
	let aligners: AnchorAligner[] = []

	afterEach(() => {
		for (let aligner of aligners) {
			aligner.stop()
		}

		aligners = []
		vi.restoreAllMocks()
		document.body.replaceChildren()
	})

	/** Create a popup with known layout offsets and a transform used by its transition. */
	function createPopup(css: boolean, flipDirection: 'none' | 'auto') {
		vi.spyOn(AnchorAligner, 'cssAnchorPositioningSupports').mockReturnValue(css)
		vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(1000)
		vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000)
		let anchor = document.createElement('button')
		let target = document.createElement('div')
		document.body.append(anchor, target)
		vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 40, 20))
		vi.spyOn(anchor, 'getClientRects').mockReturnValue([new DOMRect(100, 100, 40, 20)] as any)
		vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(110, 130, 80, 40))
		Object.defineProperty(target, 'offsetLeft', {configurable: true, get() {throw new Error('Unexpected layout read')}})
		Object.defineProperty(target, 'offsetTop', {configurable: true, get() {throw new Error('Unexpected layout read')}})
		target.style.cssText = 'position:fixed; width:80px; height:40px'
		let aligner = new AnchorAligner(target, {flipDirection, stickToEdges: false})
		aligners.push(aligner)
		return {anchor, target, aligner}
	}

	it.each([[true, 'none'], [true, 'auto'], [false, 'auto']] as const)(
		'holds placement when the anchor disappears (CSS %s, flip %s)', async (css, flip) => {
			let {anchor, target, aligner} = createPopup(css, flip)
			await aligner.alignTo(anchor)
			target.style.transform = 'translateY(8px) scale(.9)'
			aligner.freeze()
			anchor.remove()
			await aligner.update()

			expect(target.style.left).toBe('80px')
			expect(target.style.top).toBe('120px')
			expect(target.style.width).toBe('80px')
			expect(target.style.height).toBe('40px')
			expect(target.style.transform).toBe('translateY(8px) scale(.9)')
			aligner.stop()
			expect(target.style.left).toBe('')
			expect(target.style.width).toBe('80px')
		}
	)

	it('keeps absolute positioning consistent with distinct containing-block offsets', async () => {
		let {anchor, target, aligner} = createPopup(false, 'none')
		let container = document.createElement('div')
		document.body.append(container)
		container.append(target)
		vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 30, 500, 500))
		Object.defineProperty(target, 'offsetParent', {value: container})
		target.style.position = 'absolute'
		await aligner.alignTo(anchor)
		expect(target.style.left).toBe('70px')
		expect(target.style.top).toBe('90px')
		aligner.freeze()
		expect(target.style.left).toBe('70px')
		expect(target.style.top).toBe('90px')
	})

	it('uses the last valid placement when the anchor has already lost its layout box', async () => {
		let {anchor, target, aligner} = createPopup(true, 'none')
		await aligner.alignTo(anchor)
		vi.spyOn(anchor, 'getClientRects').mockReturnValue([] as any)
		Object.defineProperty(target, 'offsetLeft', {value: 0})
		aligner.freeze()
		expect(target.style.left).toBe('80px')
	})

	it('freezes before notifying anchor loss and ignores late hidden notifications', async () => {
		let {anchor, target, aligner} = createPopup(true, 'none')
		let abort = vi.fn(() => {
			expect(target.style.left).toBe('80px')
		})

		aligner.updateOptions({flipDirection: 'none', onAbort: abort})
		await aligner.alignTo(anchor)
		vi.spyOn(anchor, 'getClientRects').mockReturnValue([] as any)
		await aligner.update()
		await aligner.update()
		expect(abort).toHaveBeenCalledTimes(1)
		expect(aligner.aligning).toBe(true)
	})

	it('discards pending writes and resumes anchoring when reopened', async () => {
		let {anchor, target, aligner} = createPopup(true, 'none')
		await aligner.alignTo(anchor)
		let update = aligner.update()
		aligner.freeze()
		vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 200, 40, 20))
		await update
		expect(target.style.left).toBe('80px')
		await aligner.alignTo(anchor)
		expect(target.style.left).toBe('180px')
		expect(target.style.top).toBe('220px')
	})

	it('subscribes before alignment and re-aligns when the anchor size changes', async () => {
		let {anchor, target, aligner} = createPopup(false, 'none')
		let pending = aligner.alignTo(anchor)
		let watched = vi.mocked(RectWatcher.watch).mock.calls.find(call => call[0] === anchor)!
		expect(watched).toBeDefined()
		await pending

		let rect = new DOMRect(100, 100, 80, 20)
		vi.mocked(anchor.getBoundingClientRect).mockReturnValue(rect)
		watched[1].call(watched[2], rect)

		await vi.waitFor(() => expect(target.style.left).toBe('100px'))
	})

	it('re-aligns when a selected anchor descendant changes size', async () => {
		let {anchor, target, aligner} = createPopup(false, 'none')
		let child = document.createElement('span')
		child.className = 'point'
		anchor.append(child)
		let rect = new DOMRect(110, 100, 10, 20)
		vi.spyOn(child, 'getBoundingClientRect').mockImplementation(() => rect)
		aligner.updateOptions({reAnchor: '.point', flipDirection: 'none', stickToEdges: false})
		let pending = aligner.alignTo(anchor)

		let watched = vi.mocked(RectWatcher.watch).mock.calls.find(call => call[0] === child)!
		expect(watched).toBeDefined()
		await pending
		rect = new DOMRect(110, 100, 30, 20)
		watched[1].call(watched[2], rect)

		await vi.waitFor(() => expect(target.style.left).toBe('85px'))
	})
})
