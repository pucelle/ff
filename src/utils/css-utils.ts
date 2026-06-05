import {sum} from './value-list-utils'


type CSSValue = {
	value: number
	unit: string
}


/** Parse a css value to numeric value and unit. */
export function parse(input: string | number): CSSValue | null {
	if (typeof input === 'number') {
		return {
			value: input,
			unit: 'px',
		}
	}

	let match = input.trim().match(
		/^(-?\d*\.?\d+)([a-zA-Z%]*)$/
	)

	if (!match) {
		return null
	}

	return {
		value: Number(match[1]),
		unit: match[2] || '',
	}
}

/** 
 * Add two css values.
 * May either output numeric values adding result like `1em + 2em = 3em`,
 * or output calc result like `1em + 10px = calc(1em + 10px)`.
 */
export function add(...values: (string | number)[]): string {
	let parsed = values.map(v => parse(v))
		.filter(v => v && v.value !== 0) as CSSValue[]

	if (parsed.length === 0) {
		return '0'
	}

	let grouped: CSSValue[] = [...Map.groupBy(parsed, v => v.unit).values()]
		.map(g => {
			return {
				value: sum(g.map(g => g.value)),
				unit: g[0].unit,
			}
		})

	if (grouped.length === 1) {
		return `${grouped[0].value}${grouped[0].unit}`
	}
	else {
		return `calc(${grouped.map(g => `${g.value}${g.unit}`).join(' + ')})`
	}
}


/** Multiply a css values. */
export function multiply(v: string | number, factor: number): string | null {
	let vv = parse(v)
	if (!vv) {
		return null
	}

	return `${vv.value * factor}${vv.unit}`
}