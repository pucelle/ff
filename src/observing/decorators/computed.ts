import {beginTrack, DependencyTracker, endTrack, untrack} from '../dependency-tracker'


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

	constructor(getter: () => V, onReset?: () => void, scope?: any) {
		this.getter = scope ? getter.bind(scope) : getter
		this.onReset = onReset && scope ? onReset.bind(scope) : onReset
	}

	private onDepChange() {
		if (this.valueState === ComputedValueState.Fresh) {
			this.valueState = ComputedValueState.Stale
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

	get(): V {
		if (this.valueState === ComputedValueState.Stale) {
			if (this.shouldUpdate()) {
				this.onReset?.()
			}
			else {
				this.valueState = ComputedValueState.Fresh
			}
		}

		if (this.valueState === ComputedValueState.Fresh) {
			return this.value!
		}

		try {
			beginTrack(this.onDepChange, this)
			this.value = this.getter()
			this.valueState = ComputedValueState.Fresh
		}
		catch (err) {
			console.error(err)
		}
		finally {
			this.tracker = endTrack()
			this.trackerSnapshot = this.tracker.makeSnapshot()
		}

		return this.value!
	}

	connect() {
		if (this.shouldUpdate()) {
			this.onDepChange()
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
