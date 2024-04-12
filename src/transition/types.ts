/** 
 * Data Types that can be mixed.
 * 3 levels should be enough.
 */
type TransitionableValue = CompositeOf<TransitionableValueBase>
	| CompositeOf<CompositeOf<TransitionableValueBase>>
	| CompositeOf<CompositeOf<CompositeOf<TransitionableValueBase>>>

type TransitionableValueBase = number | string | Mixable<any> | MakeMixerable<any>
type CompositeOf<T extends any> = T | T[] | Record<any, T>

/** Such as vector, point, color. */
type Mixable<T> = {mix(v: T, rate: number): T}

/** More complex classes, need intermediate mixer object to make mixed data. */
type MakeMixerable<T> = {makeMixer(to: T): Mixer<T>}

/** A mixer object to accept edge values and do mix later. */
type Mixer<T = any> = (rate: number) => T
