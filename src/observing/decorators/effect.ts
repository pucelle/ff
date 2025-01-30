import {beginTrack, DependencyTracker, endTrack, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'


/** 
 * Execute `fn` immediately, and if any dependency it used get changed, re-execute `fn`.
 * Note `fn` can only be called once in a event loop.
 */
export class EffectMaker {

	private fn: () => void
	private tracker: DependencyTracker | null = null
	private trackerSnapshot: any[] | null = null
	private needsUpdate: boolean = false

	constructor(fn: () => void, scope?: any) {
		this.fn = scope ? fn.bind(scope) : fn
	}

	private onDepChange() {
		if (this.needsUpdate) {
			return
		}

		enqueueUpdate(this.update, this)
		this.needsUpdate = true
	}

	update() {
		if (this.shouldUpdate()) {
			this.doUpdate()
		}
		else {
			this.needsUpdate = false
		}
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
			this.tracker = beginTrack(this.onDepChange, this)
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

		this.needsUpdate = false
	}

	connect() {
		if (this.shouldUpdate()) {
			this.doUpdate()
		}
		else {
			this.tracker!.apply()
		}
	}

	disconnect() {
		this.tracker?.remove()
	}

	clear() {
		untrack(this.onDepChange, this)
	}
}
