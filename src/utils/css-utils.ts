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
export function add(a: string | number, b: string | number): string {
	let av = parse(a)
	let bv = parse(b)

	if (!av || !bv) {
		return `calc(${a} + ${b})`
	}

	if (av.value === 0) {
		return `${bv.value}${bv.unit}`
	}

	if (bv.value === 0) {
		return `${av.value}${av.unit}`
	}

	if (av.unit === bv.unit) {
		return `${av.value + bv.value}${av.unit}`
	}

	return `calc(${av.value}${av.unit} + ${bv.value}${bv.unit})`
}


/** Multiply a css values. */
export function multiply(v: string | number, factor: number): string | null {
	let vv = parse(v)
	if (!vv) {
		return null
	}

	return `${vv.value * factor}${vv.unit}`
}