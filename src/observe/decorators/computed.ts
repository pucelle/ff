import {SetMap} from '../../structs'
import {beginTrack, compareTrackingValues, computeTrackingValues, endTrack, exportTracked, importTracked, untrack} from '../dependency-tracker'


/** 
 * Make a similar computed getter from a getter function.
 * and automatically re-computing the value after any dependency changed.
 */
export class ComputedMaker<V = any> {

	private getter: () => V
	private value: V | undefined = undefined
	private valueFresh: boolean = false
	private deps: SetMap<object, PropertyKey> | undefined = undefined
	private depValues: any[] | null = null

	constructor(getter: () => V, scope?: any) {
		this.getter = scope ? getter.bind(scope) : getter
	}

	private onDepChange() {
		if (this.valueFresh) {
			this.value = undefined
			this.valueFresh = false
		}
	}

	get(): V {
		if (this.valueFresh) {
			return this.value!
		}

		try {
			beginTrack(this.onDepChange, this)
			this.value = this.getter()
			this.valueFresh = true
		}
		catch (err) {
			console.error(err)
		}
		finally {
			endTrack()
		}

		return this.value!
	}

	connect() {
		let shouldUpdate = true

		if (this.deps) {
			shouldUpdate = !compareTrackingValues(this.deps!, this.depValues!)
		}
		
		if (shouldUpdate) {
			this.onDepChange()
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
