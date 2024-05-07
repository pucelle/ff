import {DurationUnits, DurationObject} from './duration-object'


/** Get one of the date values from a date object by specified `unit`. */
export function getValue(date: Date, unit: DurationUnit): number {
	switch (unit) {
		case 'y':
			return date.getFullYear()
		
		case 'M':
			return date.getMonth()

		case 'd':
			return date.getDate()

		case 'h':
			return date.getHours()

		case 'm':
			return date.getMinutes()

		case 's':
			return date.getSeconds()

		default:
			throw new Error(`"${unit}" is not a valid date unit`)
	}
}


/** 
 * Set one of date values of a date by specified `unit`.
 * Returns the time offset in milliseconds since January 1, 1970 UTC.
 */
export function setValue(date: Date, value: number, unit: DurationUnit): number {
	switch (unit) {
		case 'y':
			return date.setFullYear(value)
		
		case 'M':
			return date.setMonth(value)

		case 'd':
			return date.setDate(value)

		case 'h':
			return date.setHours(value)

		case 'm':
			return date.setMinutes(value)

		case 's':
			return date.setSeconds(value)

		default:
			throw new Error(`"${unit}" is not a valid date unit`)
	}
}


/**
 * Check whether date values from year to second are associated with a real date.
 * @param y is the Year count.
 * @param M is the Month count.
 * @param d is the Date count, note it starts from `1`, not `0`.
 * @param h is the Hour count.
 * @param m is the Minute count.
 * @param s is the Second count.
 */
export function isValid(y: number, M: number, d: number = 1, h: number = 0, m: number = 0, s: number = 0): boolean {
	let date = new Date(y, M, d, h, m, s)

	return y === date.getFullYear() &&
		M === date.getMonth() &&
		d === date.getDate() &&
		h === date.getHours() &&
		m === date.getMinutes() &&
		s === date.getSeconds()
}


/** Whether year part of `date` is a leap year, and contains 366 days. */
export function isLeapYear(date: Date): boolean {
	let year = date.getFullYear()
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}


/** Get day count in the year, which means `366` for leap year, and `365` otherwise. */
export function getDaysOfYear(date: Date): number {
	return isLeapYear(date) ? 366 : 365
}


/** Get day count in the month, returned value is betweens `28-31`. */
export function getDaysOfMonth(date: Date): number {
	let d = new Date(date.getTime())
	d.setDate(32)
	return 32 - d.getDate()
}


/**
 * Clones a date, returns a new date.
 * @param units default value is `yMdhms`, can specify partial of it to do partly clone, rest values will be set to initial.
 */
export function clone(date: Date = new Date(), units: string = DurationUnits): Date {
	let dateValues = [...DurationUnits].map(unit => {
		if (units.includes(unit)) {
			return getValue(date, unit as DurationUnit)
		}
		else {
			return unit === 'd' ? 1 : 0
		}
	})

	return new Date(
		dateValues[0],
		dateValues[1],
		dateValues[2],
		dateValues[3],
		dateValues[4],
		dateValues[5]
	)
}


/** Add a duration object or string to `date` and returns a new date. */
export function addDuration(date: Date, duration: DurationObject | string): Date {
	if (typeof duration === 'string') {
		duration = DurationObject.fromString(duration)
	}

	let newDate = new Date(date)

	for (let unit of Object.keys(duration.data)) {
		let value = getValue(newDate, unit as DurationUnit) + duration.data[unit as DurationUnit]
		setValue(newDate, value, unit as DurationUnit)
	}

	return newDate
}


/** Add second count to `date` and returns a new date. */
export function addSeconds(date: Date, seconds: number): Date {
	let time = date.getTime()
	time += seconds * 1000

	return new Date(time)
}


/**
 * Returns a formatted date string.
 * @param template date format template, default value is `yyyy-MM-dd hh:mm:ss`.
 */
export function format(date: Date, template = 'yyyy-MM-dd hh:mm:ss'): string {
	return template.replace(/y+|M+|d+|h+|m+|s+/g, m0 => {
		let unit = m0[0]
		let value = getValue(date, unit[0] as DurationUnit)
		
		if (unit === 'M') {
			value += 1
		}

		return String(value).padStart(m0.length, '0')
	})
}


/**
 * Returns a short formatted date string relative to current date.
 * @param template is an object, defines which format to choose when associated unit value is different.
 */
export function formatToShort(date: Date, template: {[key in DurationUnit]?: string} = {y: 'yyyy-MM-dd', M: 'MM-dd', h: 'hh:mm'}) {
	let now = new Date()
	let hasDifferentUnit = false
	let matchedFormat: string = Object.values(template)[0]!

	for (let unit of DurationUnits) {
		hasDifferentUnit = hasDifferentUnit || getValue(date, unit as DurationUnit) !== getValue(now, unit as DurationUnit)
		matchedFormat = template[unit as DurationUnit] || matchedFormat

		if (hasDifferentUnit) {
			break
		}
	}

	return format(date, matchedFormat)
}
