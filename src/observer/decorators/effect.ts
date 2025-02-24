import {beginTrack, DependencyTracker, endTrack, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'
import {getIncrementalOrder} from './order'


/** 
 * Execute `fn` immediately, and if any dependency it used get changed, re-execute `fn`.
 * Note `fn` can only be called once in a event loop.
 * 
 * If a method decorated with `@effect`, both get and set type tracking can exist.
 * But if you instantiate `EffectMaker` by yourself, you should separate get and set
 * type of parts separately by move get or set part to a new method.
 */
export class EffectMaker {

	readonly order = getIncrementalOrder()

	private fn: () => void
	private tracker: DependencyTracker | null = null
	private trackerSnapshot: any[] | null = null
	private needsUpdate: boolean = false

	constructor(fn: () => void, scope?: any) {
		this.fn = scope ? fn.bind(scope) : fn
	}

	connect() {
		this.willUpdate()
	}

	disconnect() {
		this.tracker?.remove()
	}

	private willUpdate() {
		if (this.needsUpdate) {
			return
		}

		enqueueUpdate(this.update, this, this.order)
		this.needsUpdate = true
	}

	update() {
		if (this.shouldUpdate()) {
			this.doUpdate()
		}
		else if (!this.tracker!.tracking) {
			this.tracker!.apply()
		}

		this.needsUpdate = false
	}

	/** Returns whether have changed and need to update. */
	private shouldUpdate(): boolean {
		if (this.trackerSnapshot) {
			return this.tracker!.compareSnapshot(this.trackerSnapshot)
		}
		else {
			return true
		}
	}

	private doUpdate() {
		try {
			this.tracker = beginTrack(this.willUpdate, this)
			this.fn()
		}
		catch (err) {
			console.error(err)
		}
		finally {
			endTrack()
		}

		if (this.tracker) {
			this.trackerSnapshot = this.tracker.makeSnapshot()
		}
	}

	clear() {
		untrack(this.willUpdate, this)
	}
}
