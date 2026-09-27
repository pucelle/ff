import {Direction, HVDirection} from '../../math'
import {DOMUtils, ObjectUtils} from '../../utils'
import {RectWatcher, ResizeWatcher} from '../../watchers'
import {MeasuredAlignment} from './alignment'
import {PositionComputer} from './helpers/position-computer'
import {AnchorGaps, AnchorPosition, parseAlignDirections, parseGaps} from './helpers/position-gap-parser'
import {barrierDOMReading, barrierDOMWriting} from 'lupos'
import {deleteTargetAlignerMap, setTargetAlignerMap} from './helpers/target-aligner'
import {Freezer} from './helpers/freezer'


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
	  * Can be a number or a number array composed of 1-4 numbers,
	  * in `top right? bottom? left?` order.
	  * If has only one number, will only work between anchor and target.
	  * Default value is `0`.
	  */
	gaps: number | number[]

	/** 
	  * The minimum gaps betweens target and viewport edges.
	  * Can be a number or a number array composed of 1-4 numbers,
	  * in `top right? bottom? left?` order.
	  * Works only when `stickToEdges` set to `true`.
	  * Default value is `0`.
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
	flipDirection: HVDirection | 'auto' | 'none'

	/** 
	 * The triangle element inside target,
	 * If provided, will adjust it's left or top position, and transform property,
	 * to anchor it to be in the center of the intersect edges between anchor and target.
	 * Note provides it to `true` may cause additional page re-layout.
	 */
	triangle?: HTMLElement

	/** 
	 * Whether triangle element in a fixed position.
	 * If specified as `true`, will not move triangle element.
	 * Default value is `false`, means triangle element will be aligned to be
	 * in the center of the intersect edges between anchor and target.
	 */
	fixedTriangle: boolean

	/** 
	 * Defines which descendant element of anchor,
	 * should be used to align with target element.
	 * If selector is a list, will try each selector until found one.
	 * If `expanded`, which is `true` by default,
	 * should expand re-anchored rect to original anchor rect.
	 */
	reAnchor?: ReAnchorTarget

	/** 
	 * Defines which descendant element of target,
	 * should be used to align with anchor element.
	 * If selector is a list, will try each selector until found one.
	 * If `expanded`, which is `true` by default,
	 * should expand re-targeted rect to original target rect.
	 */
	reTarget?: ReAnchorTarget

	/** 
	 * On alignment aborted.
	 * Note this is only to be called after the anchor becomes
	 * hidden, and not to be called from manually calling `stop`.
	 */
	onAbort?: () => void
}

/** Defines how to reset anchor or target element. */
export type ReAnchorTarget = {
	selector: string | string[]
	expanded?: boolean
} | string | string[]


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

	/** Default anchor aligner options, can be overwritten. */
	static DefaultOptions: AnchorAlignerOptions = DefaultAnchorAlignerOptions
	
	/** 
	 * Get the direction that anchor face to target.
	 * Always get a straight direction.
	 */
	static getAnchorFaceDirection(position: AnchorPosition): Direction {
		let [d1, d2] = parseAlignDirections(position)
		return d2.joinToStraight(d1.opposite)
	}

	/** Test whether support CSS anchor positioning. */
	static cssAnchorPositioningSupports() {
		return CSS.supports('anchor-name', 'none')

			// For ipad or iphone, until 2016/06, if anchor ancestor
			// have transformed, target element will be aligned to the
			// position which before anchor element transformed.
			&& !matchMedia('(pointer: coarse)').matches
	}
	

	/** The target to align. */
	readonly target: HTMLElement

	/** 
	 * Anchor to align besides.
	 * Readonly outside.
	 */
	anchor: Element | null = null

	/** 
	 * Full options.
	 * Readonly outside.
	 */
	options!: AnchorAlignerOptions

	/** 
	 * Target align direction.
	 * Readonly outside.
	 */
	anchorDirection!: Direction

	/** 
	 * Target align direction.
	 * Readonly outside.
	 */
	targetDirection!: Direction

	/**
	 * In which direction, and also the only direction
	 * the anchor face with target.
	 * This is always a straight direction.
	 * Readonly outside.
	 * 
	 * E.g.:
	 *  - `tl-bl` -> `Bottom`.
	 *  - `c-c` -> `Center`.
	 */
	anchorFaceDirection!: Direction

	/** 
	 * Gaps betweens anchor and target.
	 * Readonly outside.
	 */
	gaps!: AnchorGaps

	/** 
	 * Gaps betweens target and viewport edges.
	 * Readonly outside.
	 */
	edgeGaps!: AnchorGaps

	/** 
	 * Whether ever flipped when previous aligning,
	 * in vertical and horizontal direction.
	 * Once flipped, always flip.
	 * Readonly outside.
	 */
	flipped: {x: boolean, y: boolean} = {x: false, y: false}

	/** 
	 * Whether height limited.
	 * Readonly outside.
	 */
	heightLimited: boolean = false

	/** To do alignment. */
	private alignment: MeasuredAlignment | null = null

	/** Whether holding the last position during a leave transition. */
	private freezer: Freezer

	/** Invalidates pending asynchronous alignment work. */
	private alignmentVersion: number = 0

	/** To mutation dom tree change when height limited. */
	private mutationObserver: MutationObserver | null = null

	constructor(target: HTMLElement, options?: Partial<AnchorAlignerOptions>) {
		this.target = target
		this.freezer = new Freezer(target)
		setTargetAlignerMap(target, this)
		
		if (options) {
			this.updateOptions(options)
		}
	}

	/** Whether in aligning. */
	get aligning(): boolean {
		return !!this.alignment
	}

	/** Get the target to align to, may be descendant element of `target`. */
	get reAnchored(): Element {
		if (!this.options.reAnchor) {
			return this.anchor!
		}

		if (typeof this.options.reAnchor === 'object' && !Array.isArray(this.options.reAnchor)) {
			return DOMUtils.quickSelect(this.anchor!, this.options.reAnchor.selector)
		}
		else {
			return DOMUtils.quickSelect(this.anchor!, this.options.reAnchor)
		}
	}

	/** Whether should expand re-anchored rect. */
	get reAnchorExpanded(): boolean {
		if (!this.options.reAnchor) {
			return true
		}

		if (typeof this.options.reAnchor === 'object' && !Array.isArray(this.options.reAnchor)) {
			return this.options.reAnchor?.expanded ?? true
		}
		else {
			return true
		}
	}

	/** Get the target to align to, may be descendant element of `target`. */
	get reTargeted(): Element {
		if (!this.options.reTarget) {
			return this.target
		}

		if (typeof this.options.reTarget === 'object' && !Array.isArray(this.options.reTarget)) {
			return DOMUtils.quickSelect(this.target, this.options.reTarget.selector)
		}
		else {
			return DOMUtils.quickSelect(this.target, this.options.reTarget)
		}
	}

	/** Whether should expand re-targeted rect. */
	get reTargetExpanded(): boolean {
		if (!this.options.reTarget) {
			return true
		}

		if (typeof this.options.reTarget === 'object' && !Array.isArray(this.options.reTarget)) {
			return this.options.reTarget?.expanded ?? true
		}
		else {
			return true
		}
	}

	/** 
	 * Update options, will re-align if options get changed.
	 * Will not re-align on event mode.
	 */
	updateOptions(options: Partial<AnchorAlignerOptions> = {}) {
		let oldOptionsSpecified = !!this.options
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
		this.edgeGaps = parseGaps(newOptions.edgeGaps, newOptions.triangle, Direction.Center)

		if (oldOptionsSpecified && this.anchor && this.aligning) {
			this.update()
		}
	}

	/** 
	 * Align current target to beside anchor and keep sync their positions.
	 * After align, will keep syncing align position.
	 * You may still call this to force align immediately.
	 */
	async alignTo(anchor: Element) {
		if (this.anchor && this.anchor !== anchor) {
			this.stop()
		}

		this.unwatch()
		this.freezer.unfreeze()
		this.anchor = anchor

		setTargetAlignerMap(this.target, this)

		let version = ++this.alignmentVersion
		await this.update()

		if (!this.aligning
			|| this.anchor !== anchor
			|| version + 1 !== this.alignmentVersion
		) {
			return
		}

		// Update after target size changed.
		ResizeWatcher.watch(this.target, this.update, this)

		// Update or stop after anchor rect size changed.
		RectWatcher.watch(anchor, this.onAnchorRectChange, this)
	}

	/** After target rect changed. */
	private onAnchorRectChange(rect: DOMRect) {
		if (this.freezer.frozen) {
			return
		}

		if (rect.width === 0 && rect.height === 0) {
			this.freeze()
			this.options.onAbort?.()
		}
		else {
			this.update()
		}
	}

	/** Update `mutationObserver` by `heightLimited` property. */
	private updateMutationObserver() {
		if (!this.heightLimited) {
			if (this.mutationObserver) {
				this.mutationObserver.disconnect()
				this.mutationObserver = null
			}
		}
		else {
			if (!this.mutationObserver) {
				this.mutationObserver = new MutationObserver(this.onMutationChange.bind(this))
				this.mutationObserver.observe(this.target, {subtree: true, childList: true})
			}
		}
	}

	/** After target dom tree changed. */
	private onMutationChange() {
		this.update()
	}

	/** 
	 * Update anchor alignment if in aligning.
	 * Works only when anchor specified, not work for event mode.
	 */
	async update() {
		if (!this.anchor
			|| this.freezer.frozen
		) {
			return
		}

		let version = ++this.alignmentVersion
		await this.doAnchorMeasuredAlignment(version)

		if (version === this.alignmentVersion) {
			this.updateMutationObserver()
		}
	}

	/** Align target to the position of a mouse event. */
	alignToEvent(event: MouseEvent) {
		this.unwatch()
		this.freezer.unfreeze()
		this.anchor = null
		this.doEventMeasuredAlignment(event)
	}

	/** Release subscriptions while preserving the visible placement. */
	private unwatch() {
		ResizeWatcher.unwatch(this.target, this.update, this)

		if (this.anchor) {
			RectWatcher.unwatch(this.anchor, this.onAnchorRectChange, this)
		}

		this.mutationObserver?.disconnect()
		this.mutationObserver = null
	}

	/** Hold the current position until stopped or realigned. */
	freeze() {
		let freezed = this.freezer.freeze()
		if (freezed) {
			this.alignmentVersion++
			this.unwatch()
		}
	}

	/**
	 * Stop sync aligning, and clear all alignment related properties.
	 * Also stop freezing.
	 * Call `freeze` before a leave transition, then stop after it finishes.
	 */
	stop() {
		if (!this.aligning) {
			return
		}

		this.alignmentVersion++

		this.unwatch()
		this.freezer.unfreeze()
		this.alignment!.reset()
		this.alignment = null

		deleteTargetAlignerMap(this.target, this)

		this.flipped.x = false
		this.flipped.y = false

		this.heightLimited = false
		this.updateMutationObserver()
	}

	/** Do alignment with measurements and re-syncing positions. */
	private async doAnchorMeasuredAlignment(version: number) {
		let alignment = await this.updateAlignment()

		if (version !== this.alignmentVersion) {
			return
		}

		alignment.resetBeforeAlign()

		// Barrier DOM Reading here.
		await barrierDOMReading()

		if (version !== this.alignmentVersion) {
			return
		}

		// Do position computation.
		// For `<html>`, always use viewport rect.
		let anchorRect = this.anchor === document.documentElement
			? new DOMRect(0, 0, document.documentElement.clientWidth, document.documentElement.clientHeight)
			: this.anchor!.getBoundingClientRect()

		let anchorToAlign = this.reAnchored
		let anchorRectToAlign = anchorToAlign === this.anchor ? anchorRect : anchorToAlign.getBoundingClientRect()

		let computer = new PositionComputer(this, anchorRect, anchorRectToAlign)
		let computed = await computer.compute()

		// Barrier DOM Writing here.
		await barrierDOMWriting()

		if (version !== this.alignmentVersion) {
			return
		}

		alignment.align(computed)
		this.freezer.capturePlacement(computed)
		this.flipped = computed.target.flipped
		this.heightLimited = computed.target.limitHeight !== null
	}

	/** Do alignment with events. */
	private async doEventMeasuredAlignment(event: MouseEvent) {
		let version = ++this.alignmentVersion
		let alignment = await this.updateAlignment()

		if (version !== this.alignmentVersion) {
			return
		}

		alignment.resetBeforeAlign()

		// Do position computation.
		let anchorRect = new DOMRect(
			event.clientX,
			event.clientY,
			0,
			0
		)

		// Barrier DOM Reading here.
		await barrierDOMReading()

		let computer = new PositionComputer(this, anchorRect)
		let computed = await computer.compute()

		// Do alignment by computation.
		if (version !== this.alignmentVersion) {
			return
		}

		alignment.align(computed)
		this.freezer.capturePlacement(computed)
	}

	/** Update alignment class if needed. */
	private async updateAlignment(): Promise<MeasuredAlignment>	{
		if (!this.alignment) {
			this.alignment = new MeasuredAlignment(this)
		}

		return this.alignment
	}
}
