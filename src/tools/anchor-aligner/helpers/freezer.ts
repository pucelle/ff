import {PositionComputed} from './position-computer'


export class Freezer {

	private target: HTMLElement
	
	/** Whether holding the last position during a leave transition. */
	frozen: boolean = false

	/** Last layout offsets, unaffected by transition transforms. */
	private lastPlacement: {left: number, top: number, width: string, height: string} | null = null

	/** Inline properties temporarily replaced while frozen. */
	private frozenStyles: Map<string, string> | null = null

	constructor(target: HTMLElement) {
		this.target = target
	}

	/** Cache placement directly from measured geometry, without reading element styles. */
	capturePlacement(computed: PositionComputed) {
		let {position, rect, absolutePositionOffset} = computed.target

		this.lastPlacement = {
			left: position.x + (absolutePositionOffset?.x ?? 0),
			top: position.y + (absolutePositionOffset?.y ?? 0),
			width: rect.width + 'px',
			height: rect.height + 'px',
		}
	}

	/** Hold the current position independently of the anchor until stopped or realigned. */
	freeze(): boolean {
		if (this.frozen
			|| !this.lastPlacement
		) {
			return false
		}

		this.frozen = true

		let placement = this.lastPlacement

		let properties = {
			left: placement.left + 'px',
			top: placement.top + 'px',
			right: 'auto',
			bottom: 'auto',
			width: placement.width,
			height: placement.height,
		}

		this.frozenStyles = new Map()

		for (let [key, value] of Object.entries(properties)) {
			this.frozenStyles.set(key, this.target.style.getPropertyValue(key))
			this.target.style.setProperty(key, value)
		}

		return true
	}

	/** Unfreeze if frozen yet. */
	unfreeze() {
		if (!this.frozen) {
			return
		}

		this.restoreFrozenStyles()
		this.lastPlacement = null
		this.frozen = false
	}

	/** Restore properties before resuming alignment or disposing. */
	private restoreFrozenStyles() {
		if (this.frozenStyles) {
			for (let [key, value] of this.frozenStyles) {
				this.target.style.setProperty(key, value)
			}

			this.frozenStyles = null
		}
	}
}