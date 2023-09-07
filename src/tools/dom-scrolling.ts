import {PerFrameEasingName, Transition} from './transition'


export namespace DOMScrolling {

	/** Cached scroll bar width. */
	let scrollBarWidth: number | null = null

	/**
	 * Get scroll bar width.
	 * After first time running, the returned value will keep unchanged.
	 * Note that this method will cause reflow when call it the first time.
	 */
	export function getScrollbarWidth(): number {
		if (scrollBarWidth !== null) {
			return scrollBarWidth
		}

		let div = document.createElement('div')
		div.style.cssText = 'width:100px; height:100px; overflow:scroll; position:absolute; left:-100px; top:-100px;'
		document.body.append(div)

		scrollBarWidth = div.offsetWidth - div.clientWidth
		div.remove()

		return scrollBarWidth
	}


	/**
	 * Find the closest scroll wrapper, which has `overflow: auto / scroll` set.
	 * Note that this method may cause reflow.
	 */
	export function getClosestScrollWrapper(el: HTMLElement): HTMLElement | null {
		while (el && el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) {
			el = el.parentElement!
		}

		return el
	}


	/**
	 * Scroll scrollbars of closest scroll wrapper for minimal distance to make element be fully visible.
	 * Returns `true` if scrolled.
	 */
	export function scrollToView(el: HTMLElement, gap: number = 0, duration: number = 0, easing: PerFrameEasingName = 'ease-out'): boolean {
		let wrapper = getClosestScrollWrapper(el)
		if (!wrapper) {
			return false
		}

		let direction = getScrollDirection(wrapper)
		if (!direction) {
			return false
		}

		if (direction === 'y') {
			let oldScrollY = wrapper.scrollTop
			let newScrollY: number | null = null
			let offsetY = getScrollOffset(el, wrapper, direction)

			// Needs to scroll for pxs to top edges align.
			let startOffset = offsetY - gap - oldScrollY

			// Needs to scroll for pxs to bottom edges align.
			let endOffset = offsetY + el.offsetHeight + gap - wrapper.clientHeight - oldScrollY

			// Needs to scroll up.
			if (startOffset < 0 && endOffset < 0) {
				newScrollY = Math.max(startOffset, endOffset) + oldScrollY
			}
			// Needs to scroll down.
			else if (endOffset > 0 && startOffset > 0) {
				newScrollY = Math.min(endOffset, startOffset) + oldScrollY
			}

			if (newScrollY !== null && newScrollY !== oldScrollY) {
				if (duration) {
					let transition = new Transition({
						duration,
						easing,
					})

					transition.on('progress', (value: number) => {
						wrapper!.scrollTop = value
					})

					transition.playBetween(oldScrollY, newScrollY)
				}
				else {
					wrapper.scrollTop = newScrollY
				}

				return true
			}

			return false
		}

		if (direction === 'x') {
			let oldScrollX = wrapper.scrollLeft
			let newScrollX: number | null = null
			let offsetX = getScrollOffset(el, wrapper, direction)
			let startOffset = offsetX - gap - oldScrollX
			let endOffset = offsetX + el.offsetWidth + gap - wrapper.clientWidth - oldScrollX

			if (startOffset < 0 && endOffset < 0 || el.offsetWidth > wrapper.clientWidth) {
				newScrollX = Math.max(0, offsetX - gap)
			}
			else if (endOffset > 0 && startOffset > 0) {
				newScrollX = Math.min(wrapper.scrollWidth, offsetX + el.offsetWidth + gap) - wrapper.clientWidth
			}

			if (newScrollX !== null && newScrollX !== oldScrollX) {
				if (duration) {
					let transition = new Transition({
						duration,
						easing,
					})

					transition.on('progress', (value: number) => {
						wrapper!.scrollLeft = value
					})

					transition.playBetween(oldScrollX, newScrollX)
				}
				else {
					wrapper.scrollLeft = newScrollX
				}

				return true
			}
		}

		return false
	}


	/** Get the scroll direction of scroll wrapper, may be `x | y | ''`. */
	export function getScrollDirection(wrapper: HTMLElement): 'x' | 'y' | null {
		let direction: 'x' | 'y' | null = null

		if (wrapper.scrollHeight > wrapper.clientHeight) {
			direction = 'y'
		}
		else if (wrapper.scrollWidth > wrapper.clientWidth) {
			direction = 'x'
		}

		return direction
	}

	

	
	/**
	 * Get element's offset position relative to wrapper.
	 * This value equals to document position difference without any scrolling,
	 * So it's not affected by scroll positions.
	 */
	export function getNonScrollOffset(el: HTMLElement, wrapper: HTMLElement, direction: 'x' | 'y'): number {
		let prop: 'offsetLeft' | 'offsetTop' = direction === 'x' ? 'offsetLeft' : 'offsetTop'
		let parent = el.offsetParent as HTMLElement
		let y = el[prop]

		if (!parent || parent === wrapper) {}
		else if (parent.contains(wrapper)) {
			y -= wrapper[prop]
		}
		else {
			while (parent.offsetParent && parent.offsetParent !== wrapper) {
				parent = parent.offsetParent as HTMLElement
				y += parent[prop]
			}
		}

		return y
	}


	/**
	 * Scroll scrollbars to make element in the top of the viewport area.
	 * Returns `true` if scrolled.
	 * @param el The element you want to see.
	 * @param gap Keep a little distance from the element's edge to the viewport's edge.
	 * @param duration If specified, will run an animation when scrolling.
	 * @param easing The animation esing.
	 */
	export function scrollToTop(el: HTMLElement, gap: number = 0, duration: number = 0, easing: AnimationEasing = 'ease-out'): boolean {
		let wrapper = getClosestScrollWrapper(el)
		if (!wrapper) {
			return false
		}
		
		let offsetY = getScrollOffset(el, wrapper, 'y')
		let oldScrollY = wrapper.scrollTop
		let newScrollY = Math.max(0, offsetY - gap)

		if (newScrollY !== oldScrollY) {
			if (duration) {
				animateStyleValueTo(wrapper, 'scrollTop', newScrollY, duration, easing)
			}
			else {
				wrapper.scrollTop = newScrollY
			}

			return true
		}

		return false
	}
}