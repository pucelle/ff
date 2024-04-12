import {MathUtils} from '../math'
import {Color} from '../tools'


/** 
 * Make a mixer to mix two values and make a getter,
 * which can get a mixed value at any rate later.
 */
export function makeMixer<T extends TransitionableValue>(fromValue: T, toValue: T): Mixer<T> {
	let fromType = typeof fromValue

	// Mix arrays.
	if (Array.isArray(fromValue)) {
		return makeArrayMixer(fromValue, toValue as any[]) as Mixer<T>
	}

	// Mix numbers.
	else if (fromType === 'number') {
		return makeNumericMixer(fromValue as number, toValue as number) as Mixer<T>
	}

	// Mix color string.
	else if (fromType === 'string') {
		return makeColorMixer(fromValue as string, toValue as string) as Mixer<T>
	}

	// Mix plain object.
	else if (fromType === 'object') {
		
		// Mix mixable object like Vector or Point.
		if ('makeMixer' in (fromValue as object) && typeof (fromValue as MakeMixerable<any>).makeMixer === 'function') {
			return (fromValue as MakeMixerable<any>).makeMixer(toValue)
		}

		// Mix mixable object like Vector or Point.
		else if ('mix' in (fromValue as object) && typeof (fromValue as Mixable<any>).mix === 'function') {
			return makeMixableMixer(fromValue as Mixable<any>, toValue as Mixable<any>) as Mixer<T>
		}

		else {
			return makeObjectMixer(fromValue as object, toValue as object) as Mixer<T>
		}
	}

	// Not mixable.
	else {
		throw new Error(`"${fromValue}" and "${toValue}" are not mixable!`)
	}
}


function makeArrayMixer<T extends any[]>(fromValue: T, toValue: T): Mixer<T> {
	let mixers = fromValue.map(function(f, index) {
		let mixer = makeMixer(f, (toValue as any[])[index])
		return mixer
	})

	return function(rate: number) {
		return mixers.map(mixer => mixer(rate)) as T
	}
}


function makeNumericMixer<T extends number>(fromValue: T, toValue: T): Mixer<T> {
	return function(rate: number) {
		return MathUtils.mix(fromValue as number, toValue as number, rate) as T
	}
}


function makeColorMixer<T extends string>(fromValue: T, toValue: T): Mixer<T> {
	let fromColor = Color.fromString(fromValue)
	let toColor = Color.fromString(toValue)

	if (!fromColor) {
		throw new Error(`"${fromValue}" is not a valid color string!`)
	}

	if (!toColor) {
		throw new Error(`"${toValue}" is not a valid color string!`)
	}

	return function(rate: number) {
		return fromColor!.mix(toColor!, rate).toString() as T
	}
}


function makeMixableMixer<T extends Mixable<any>>(fromValue: T, toValue: T): Mixer<T> {
	return function(rate: number) {
		return (fromValue as Mixable<any>).mix(toValue as Mixable<any>, rate) as T
	}
}


function makeObjectMixer<T extends Record<string, any>>(fromValue: T, toValue: T): Mixer<T> {
	let keys = Object.keys(fromValue)
	let mixers = {} as any

	for (let key of keys) {
		let v1 = (fromValue as any)[key] as any
		let v2 = (toValue as any)[key] as any

		mixers[key] = makeMixer(v1 as T, v2 as T)
	}

	return function(rate: number) {
		let o = {} as any

		for (let key of keys) {
			o[key] = mixers[key](rate)
		}

		return o
	}
}