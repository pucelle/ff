import {beginTrack, DependencyTracker, endTrack, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'
import {getIncrementalOrder} from './order'


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

	readonly order = getIncrementalOrder()

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

	connect() {
		if (this.valueState === ComputedValueState.Initial) {
			return
		}

		this.willUpdate()
	}

	disconnect() {
		this.tracker?.remove()
	}

	private willUpdate() {
		if (this.needsUpdate) {
			return
		}

		// Here doesn't reset value immediately after dependency get changed,
		// but update them in the same order with effectors and watchers.
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
		if (this.valueState === ComputedValueState.Fresh && this.trackerSnapshot) {
			return this.tracker!.compareSnapshot(this.trackerSnapshot)
		}
		else {
			return true
		}
	}

	private doUpdate() {
		this.valueState = ComputedValueState.Stale
		this.onReset?.()
	}

	get(): V {
		if (this.valueState === ComputedValueState.Fresh) {
			return this.value!
		}

		try {
			this.tracker = beginTrack(this.willUpdate, this)
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

	clear() {
		untrack(this.willUpdate, this)
	}
}
