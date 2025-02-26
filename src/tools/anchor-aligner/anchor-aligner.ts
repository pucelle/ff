import {Direction} from '../../math'
import {untilUpdateComplete} from '../../observer'
import {ObjectUtils} from '../../utils'
import {RectWatcher, ResizeWatcher} from '../../watchers'
import {MeasuredAlignment} from './measured-alignment'
import {PositionComputer} from './position-computer'
import {AnchorGaps, AnchorPosition, getGapTranslate, parseAlignDirections, parseGaps} from './position-gap-parser'
import {PureCSSAnchorAlignment, PureCSSComputed} from './pure-css-alignment'
import {AnchorAlignmentType} from './types'


/** 
 * Options for AnchorAligner.
 */
export interface AnchorAlignerOptions {

	/** If specified, use this as css anchor name. */
	name?: string

	/** 
	 * Align where of target to where of anchor.
	 * e.g., `tl-bl` means align top-left of content, to bottom-left of anchor
	 * First part, can be omitted, will pick opposite: `t-b` equals `b`, `tl-br` equals `br`.
	 */
	position: AnchorPosition

	/** 
	  * The gaps betweens anchor and target.
	  * It nearly equals expanding anchor area with this value.
	  * Can be a number or a number array composed of 1-4 numbers, in `top right? bottom? left?` order.
	  */
	gaps: number | number[]

	/** 
	  * The gaps betweens target and viewport edges.
	  * Can be a number or a number array composed of 1-4 numbers,
	  * in `top right? bottom? left?` order.
	  * Works only when `stickToEdges` set to `true`.
	  */
	edgeGaps: number | number[]

	/** 
	 * Whether stick target to viewport edges.
	 * Such that if target partly cut by viewport,
	 * it will be adjusted to stick viewport edges and become fully visible.
	 * Default value is `false`, set it to `true` to enable.
	 * Note sets it to `true` may cause additional page re-layout.
	 */
	stickToEdges: boolean

	/** 
	 * Whether can flip target position if available spaces in targeted position is not enough.
	 * If specifies as `auto`, and has one direction edges collapse, will choose this direction.
	 * Default value is `auto`, set it to `null` to disable flipping.
	 */
	flipDirection: HVDirection | 'auto' | null

	/** 
	 * The triangle element inside target,
	 * If provided, will adjust it's left or top position, and transform property,
	 * to anchor it to be in the center of the intersect edges between anchor and target.
	 * Note provides it to `true` may cause additional page re-layout.
	 */
	triangle?: HTMLElement

	/** 
	 * Whether triangle element in a fixed position.
	 * 
	 * Default value is `false`, means triangle element will be aligned to be
	 * in the center of the intersect edges between anchor and target.
	 * 
	 * If specified as `true`, e.g., triangle always locates at top-left corner.
	 * will use the position of the triangle acute angle to do alignment,
	 * instead of the target anchor point.
	 */
	fixedTriangle: boolean
}


const DefaultAnchorAlignerOptions: AnchorAlignerOptions = {
	position: 'b',
	gaps: 0,
	edgeGaps: 0,
	stickToEdges: true,
	flipDirection: 'auto',
	triangle: undefined,
	fixedTriangle: false,
}


/** 
 * To do anchor alignment to align a target element besides to an anchor element.
 * Would suggest target element in `fixed` position.
 */
export class AnchorAligner {
	
	/** 
	 * Get the direction that anchor face to target.
	 * Always get a straight direction.
	 */
	static getAnchorFaceDirection(position: AnchorPosition): Direction {
		let [d1, d2] = parseAlignDirections(position)
		return d2.joinToStraight(d1.opposite)
	}

	static cachedCSSAnchorPositioningSupports: boolean | undefined = undefined

	/** Test whether support CSS anchor positioning. */
	static cssAnchorPositioningSupports() {
		if (this.cachedCSSAnchorPositioningSupports !== undefined) {
			return this.cachedCSSAnchorPositioningSupports
		}

		return this.cachedCSSAnchorPositioningSupports = CSS.supports('anchor-name', 'none') 
	}
	

	/** The target to align. */
	readonly target: HTMLElement

	/** Anchor to align besides. */
	anchor: Element | null = null

	/** Full options. */
	options!: AnchorAlignerOptions

	/** Target align direction. */
	anchorDirection!: Direction

	/** Target align direction. */
	targetDirection!: Direction

	/**
	 * In which direction, and also the only direction
	 * the anchor face with target.
	 * This is always a straight direction.
	 * 
	 * E.g.:
	 *  - `tl-bl` -> `Bottom`.
	 *  - `c-c` -> `Center`.
	 */
	anchorFaceDirection!: Direction

	/** Gaps betweens anchor and target. */
	gaps!: AnchorGaps

	/** Gaps betweens target and viewport edges. */
	edgeGaps!: AnchorGaps

	/** To do alignment. */
	private alignment: PureCSSAnchorAlignment | MeasuredAlignment | null = null

	constructor(target: HTMLElement, options?: Partial<AnchorAlignerOptions>) {
		this.target = target
		
		if (options) {
			this.updateOptions(options)
		}
	}

	/** Whether in aligning. */
	get aligning(): boolean {
		return !!this.alignment
	}

	/** 
	 * Update options, will re-align if options get changed.
	 * Will not re-align on event mode.
	 */
	updateOptions(options: Partial<AnchorAlignerOptions> = {}) {
		let newOptions = {...DefaultAnchorAlignerOptions, ...options}

		let changed = !ObjectUtils.deepEqual(this.options, newOptions)
		if (!changed) {
			return
		}

		this.options = newOptions

		let ds = parseAlignDirections(newOptions.position)
		this.targetDirection = ds[0]
		this.anchorDirection = ds[1]

		this.anchorFaceDirection = this.anchorDirection.joinToStraight(this.targetDirection.opposite)
		this.gaps = parseGaps(newOptions.gaps, newOptions.triangle, this.anchorFaceDirection)
		this.edgeGaps = parseGaps(newOptions.edgeGaps, newOptions.triangle, this.anchorFaceDirection)

		if (this.anchor && this.aligning) {
			this.update()
		}
	}

	/** 
	 * Align current target to beside anchor and keep sync their positions.
	 * After align, will keep syncing align position.
	 * You may still call this to force align immediately.
	 */
	alignTo(anchor: Element) {
		this.anchor = anchor

		this.update()

		// Update after target size changed.
		ResizeWatcher.watch(this.target, this.update, this)

		if (!this.useCSSAnchorPositioning()) {
			RectWatcher.watch(anchor, this.update, this)
		}
	}

	/** 
	 * Update anchor alignment if in aligning.
	 * Works only when anchor specified, not work for event mode.
	 */
	update() {
		if (!this.anchor) {
			return
		}

		let doPureCSSAlignment = this.shouldDoPureCSSAlignment()
		if (doPureCSSAlignment) {
			this.doPureCSSAnchorAlignment()
		}
		else {
			this.doAnchorMeasuredAlignment(this.anchor)
		}
	}

	/** Align target to the position of a mouse event. */
	alignToEvent(event: MouseEvent) {
		this.doEventMeasuredAlignment(event)
	}

	/** 
	 * Stop sync aligning.
	 * Note target element will not be hidden.
	 */
	stop() {
		if (this.alignment) {
			ResizeWatcher.unwatch(this.target, this.update, this)

			if (this.useCSSAnchorPositioning()) {
				RectWatcher.unwatch(this.anchor!, this.update, this)
			}

			this.alignment!.reset()
			this.alignment = null
		}
	}

	/** 
	 * Whether should do pure CSS Alignment.
	 * Means should measure to get state.
	 */
	shouldDoPureCSSAlignment(): boolean {
		return this.useCSSAnchorPositioning()
			&& !(this.needAdjustTriangle() || this.canFlip())
	}

	/** Whether can apply css anchor positioning. */
	useCSSAnchorPositioning(): boolean {
		return AnchorAligner.cssAnchorPositioningSupports()
			&& (this.anchor instanceof HTMLElement)
	}

	/** Whether need adjust triangle position. */
	private needAdjustTriangle(): boolean {
		return !!this.options.triangle && !this.options.fixedTriangle
	}

	/** Whether can flip. */
	private canFlip(): boolean {
		let cantFlip = this.options.flipDirection === null
			|| this.options.flipDirection === 'auto'
				&& this.anchorFaceDirection !== Direction.Center

		return !cantFlip
	}

	/** 
	 * Do alignment without measurement or re-syncing positions,
	 * by pure CSS anchor positioning.
	 */
	private doPureCSSAnchorAlignment() {
		let alignment = this.updateAlignment(AnchorAlignmentType.PureCSS)

		let computed: PureCSSComputed = {
			anchorDirection: this.anchorDirection,
			targetDirection: this.targetDirection,
			targetTranslate: getGapTranslate(this.anchorDirection, this.gaps),
		}

		alignment.align(computed)
	}

	/** Do alignment with measurements and re-syncing positions. */
	private async doAnchorMeasuredAlignment(anchor: Element) {
		let alignment = this.updateAlignment(AnchorAlignmentType.Measured)

		// May cause write to dom properties.
		alignment.resetBeforeAlign()

		// Wait for update complete, now can read dom properties.
		await untilUpdateComplete()

		// Alignment class changed, no need to align anymore.
		if (alignment !== this.alignment) {
			return
		}

		// Do position computation.
		let computer = new PositionComputer(this, anchor.getBoundingClientRect())
		let computed = computer.compute()

		// Do alignment by computation.
		alignment.align(computed)
	}

	/** Do alignment with events. */
	private async doEventMeasuredAlignment(event: MouseEvent) {
		let alignment = this.updateAlignment(AnchorAlignmentType.Measured)

		// May cause write to dom properties.
		alignment.resetBeforeAlign()

		// Wait for update complete, now can read dom properties.
		await untilUpdateComplete()

		// Alignment class get changed, no need to continue aligning.
		if (alignment !== this.alignment) {
			return
		}

		// Do position computation.
		let anchorRect = new DOMRect(
			event.clientX,
			event.clientY,
			0,
			0
		)

		let computer = new PositionComputer(this, anchorRect)
		let computed = computer.compute()

		// Do alignment by computation.
		alignment.align(computed)

	}

	/** Update alignment class if needed. */
	private updateAlignment<T extends AnchorAlignmentType>(alignmentType: T):
		T extends AnchorAlignmentType.PureCSS ? PureCSSAnchorAlignment : MeasuredAlignment
	{
		if (this.alignment && this.alignment.type !== alignmentType) {
			this.alignment.reset()
			this.alignment = null
		}

		if (!this.alignment) {
			if (alignmentType === AnchorAlignmentType.PureCSS) {
				this.alignment = new PureCSSAnchorAlignment(this)
			}
			else {
				this.alignment = new MeasuredAlignment(this)
			}
		}

		return this.alignment as T extends AnchorAlignmentType.PureCSS ? PureCSSAnchorAlignment : MeasuredAlignment
	}
}