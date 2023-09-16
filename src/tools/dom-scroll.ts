import {PerFrameEasingName, Transition} from './transition'


export namespace DOMScroll {

	/** Cached scroll bar width. */
	let scrollBarWidth: number | null = null

	/**
	 * Get scroll bar width.
	 * After first time running, the returned value will keep constant.
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
	 * Find the closest scroll wrapper, which is the closest ancestor element,
	 * and has `overflow: auto / scroll` set.
	 * Note that this method may cause reflow.
	 */
	export function getClosestScrollWrapper(el: HTMLElement): HTMLElement | null {
		while (el && el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) {
			el = el.parentElement!
		}

		return el
	}


	/** 
	 * Get the scroll direction of scroll wrapper, may return `horizontal | horizontal | null`.
	 * Note that this method may cause reflow.
	 */
	export function getScrollDirection(wrapper: HTMLElement): HVDirection | null {
		let direction: HVDirection | null = null

		if (wrapper.scrollHeight > wrapper.clientHeight) {
			direction = 'horizontal'
		}
		else if (wrapper.scrollWidth > wrapper.clientWidth) {
			direction = 'vertical'
		}

		return direction
	}


	/**
	 * Get element's offset position relative to wrapper element.
	 * This value equals to their document position difference without any scrolling,
	 * So it's not affected by scroll positions.
	 */
	export function getNonScrollOffset(el: HTMLElement, wrapper: HTMLElement, direction: HVDirection): number {
		let property: 'offsetLeft' | 'offsetTop' = direction === 'horizontal' ? 'offsetLeft' : 'offsetTop'
		let parent = el
		let offset = 0

		// Accumulate offset values, until wrapper.
		while (parent) {
			offset += parent[property]
			parent = parent.offsetParent as HTMLElement

			// Outof range of wrapper.
			if (parent.contains(wrapper)) {
				if (parent === wrapper.offsetParent) {
					offset -= wrapper[property]
				}
				break
			}
		}

		return offset
	}

	
	/**
	 * Scroll scrollbar in specified direction of closest scroll wrapper,
	 * for minimal distance to make element to become fully visible.
	 * `gap`: Reserve a little distance from the element's edge away from view area edge.
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

		if (direction === 'vertical') {
			let oldScrollY = wrapper.scrollTop
			let newScrollY: number | null = null
			let offsetY = getNonScrollOffset(el, wrapper, direction)

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
					Transition.playBetween(
						oldScrollY,
						newScrollY,
						(value: number) => {
							wrapper!.scrollTop = value
						},
						duration,
						easing,
					)
				}
				else {
					wrapper.scrollTop = newScrollY
				}

				return true
			}

			return false
		}

		if (direction === 'horizontal') {
			let oldScrollX = wrapper.scrollLeft
			let newScrollX: number | null = null
			let offsetX = getNonScrollOffset(el, wrapper, direction)
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
					Transition.playBetween(
						oldScrollX,
						newScrollX,
						(value: number) => {
							wrapper!.scrollLeft = value
						},
						duration,
						easing,
					)
				}
				else {
					wrapper.scrollLeft = newScrollX
				}

				return true
			}
		}

		return false
	}



	/**
	 * Scroll closest scrollbar to make element in the topest of the view area.
	 * `gap`: Reserve a little distance from the element's edge away from view area edge.
	 * Returns `true` if scrolled.
	 */
	export function scrollToTop(el: HTMLElement, gap: number = 0, duration: number = 0, easing: PerFrameEasingName = 'ease-out'): boolean {
		return scrollToStartPosition('vertical', el, gap, duration, easing)
	}


	/**
	 * Scroll closest scrollbar to make element in the left most of the view area.
	 * `gap`: Reserve a little distance from the element's edge away from view area edge.
	 * Returns `true` if scrolled.
	 */
	export function scrollToLeft(el: HTMLElement, gap: number = 0, duration: number = 0, easing: PerFrameEasingName = 'ease-out'): boolean {
		return scrollToStartPosition('vertical', el, gap, duration, easing)
	}


	function scrollToStartPosition(direction: HVDirection, el: HTMLElement, gap: number = 0, duration: number = 0, easing: PerFrameEasingName = 'ease-out'): boolean {
		let wrapper = getClosestScrollWrapper(el)
		if (!wrapper) {
			return false
		}
		
		let offset = getNonScrollOffset(el, wrapper, direction)
		let property: 'scrollLeft' | 'scrollTop' = direction === 'horizontal' ? 'scrollLeft' : 'scrollTop'
		let oldScroll = wrapper[property]
		let newScroll = Math.max(0, offset - gap)

		if (newScroll !== oldScroll) {
			if (duration) {
				Transition.playBetween(
					oldScroll,
					newScroll,
					(value: number) => {
						wrapper![property] = value
					},
					duration,
					easing,
				)
			}
			else {
				wrapper[property] = newScroll
			}

			return true
		}

		return false
	}
}