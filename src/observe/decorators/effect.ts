import {SetMap} from '../../structs'
import {beginTrack, compareTrackingValues, computeTrackingValues, endTrack, exportTracked, importTracked, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'


/** 
 * Execute `fn` immediately, and if any dependency it used get changed, re-execute `fn`.
 * Note `fn` can only be called once in a event loop.
 */
export class EffectMaker {

	private fn: () => void
	private deps: SetMap<object, PropertyKey> | undefined = undefined
	private depValues: any[] | null = null

	constructor(fn: () => void, scope?: any) {
		this.fn = scope ? fn.bind(scope) : fn
	}

	private onDepChange() {
		enqueueUpdate(this.update, this)
	}

	update() {
		try {
			beginTrack(this.onDepChange, this)
			this.fn()
		}
		catch (err) {
			console.error(err)
		}
		finally {
			endTrack()
		}
	}

	connect() {
		let shouldUpdate = true

		if (this.deps) {
			shouldUpdate = !compareTrackingValues(this.deps!, this.depValues!)
		}
		
		if (shouldUpdate) {
			this.update()
		}
		else {
			importTracked(this.onDepChange, this, this.deps!)
		}

		if (this.deps) {
			this.deps = undefined
			this.depValues = null
		}
	}

	disconnect() {
		this.deps = exportTracked(this.onDepChange, this)
		this.depValues = this.deps ? computeTrackingValues(this.deps) : null
	}

	clear() {
		untrack(this.onDepChange, this)
	}
}
