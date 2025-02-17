import {beginTrack, DependencyTracker, endTrack, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'


enum ComputedValueState {
	Initial,
	Stale,
	Fresh,
}


/** 
 * Make a similar computed getter from a getter function.
 * and automatically re-computing the value after any dependency changed.
 */
export class ComputedMaker<V = any> {

	private getter: () => V
	private onReset: (() => void) | undefined
	private value: V | undefined = undefined
	private valueState: ComputedValueState = ComputedValueState.Initial
	private tracker: DependencyTracker | null = null
	private trackerSnapshot: any[] | null = null
	private needsUpdate: boolean = false

	constructor(getter: () => V, onReset?: () => void, scope?: any) {
		this.getter = scope ? getter.bind(scope) : getter
		this.onReset = onReset && scope ? onReset.bind(scope) : onReset
	}

	private onDepChange() {
		if (this.needsUpdate) {
			return
		}

		// Here doesn't reset value immediately after dependency get changed,
		// but update them in the same order with effectors and watchers.
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

	private doUpdate() {
		this.valueState = ComputedValueState.Stale
		this.onReset?.()
		this.needsUpdate = false
	}

	/** Returns whether have changed and need to update. */
	private shouldUpdate(): boolean {
		if (this.valueState === ComputedValueState.Fresh && this.trackerSnapshot) {
			return this.tracker!.compareSnapshot(this.trackerSnapshot)
		}
		else {
			return true
		}
	}

	get(): V {
		if (this.valueState === ComputedValueState.Fresh) {
			return this.value!
		}

		try {
			this.tracker = beginTrack(this.onDepChange, this)
			this.value = this.getter()
			this.valueState = ComputedValueState.Fresh
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

		return this.value!
	}

	connect() {
		if (this.valueState === ComputedValueState.Initial) {
			return
		}

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
