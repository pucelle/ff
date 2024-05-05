/** 
 * Data Types that can be mixed.
 * 3 levels should be enough.
 */
type TransitionAbleValue = CompositeOf<TransitionAbleValueBase>
	| CompositeOf<CompositeOf<TransitionAbleValueBase>>
	| CompositeOf<CompositeOf<CompositeOf<TransitionAbleValueBase>>>

type TransitionAbleValueBase = number | string | Mixable<any> | MakeMixable<any>
type CompositeOf<T extends any> = T | T[] | Record<any, T>

/** Such as vector, point, color. */
type Mixable<T> = {mix(v: T, rate: number): T}

/** More complex classes, need intermediate mixer object to make mixed data. */
type MakeMixable<T> = {makeMixer(to: T): Mixer<T>}

/** A mixer object to accept edge values and do mix later. */
type Mixer<T = any> = (rate: number) => T
