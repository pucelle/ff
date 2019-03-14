import {parseDurationToObject} from './duration'


export type DateUnit = 'y' | 'M' | 'd' | 'h' | 'm' | 's'
export const dateUnits = 'yMdhms'


/**
 * Get one of the date value by the unit type.
 * @param date The date object to get value from.
 * @param unit The unit type, must be one of `'y', 'M', 'd', 'h', 'm', 's'`.
 */
export function getDateByUnit(date: Date, unit: DateUnit): number {
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
			throw `"${unit}" is not a valid date unit`
	}
}


/**
 * Set one of the date value by the unit type.
 * @param date The date object to set value.
 * @param value The date value to set.
 * @param unit The unit type, must be one of `'y', 'M', 'd', 'h', 'm', 's'`.
 */
export function setDateByUnit(date: Date, value: number, unit: DateUnit): number {
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
			throw `"${unit}" is not a valid date unit`
	}
}


/**
 * Returns if date values from year to seconds are associated with a real existed date.
 * @param y Year count.
 * @param M Month count.
 * @param d Date count.
 * @param h Hour count.
 * @param m Minute count.
 * @param s Second count.
 */
export function isValidDate(y: number, M: number, d: number = 1, h: number = 0, m: number = 0, s: number = 0): boolean {
	let date = new Date(y, M, d, h, m, s)

	return y === date.getFullYear() &&
		M === date.getMonth() &&
		d === date.getDate() &&
		h === date.getHours() &&
		m === date.getMinutes() &&
		s === date.getSeconds()
}


/**
 * Returns if the year of date is a leap year, which contains 366 days.
 * @param date The date to test.
 */
export function isLeapYear(date: Date): boolean {
	let year = date.getFullYear()
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}


/**
 * Returns the days in the year from a date, which is 366 for leap year, 355 otherwise.
 * @param date The date to get days from.
 */
export function getDaysOfYear(date: Date): number {
	return isLeapYear(date) ? 366 : 365
}


/**
 * Returns the days in the month from a date, which betweens 28-31.
 * @param date The date to get days from.
 */
export function getDaysOfMonth(date: Date): number {
	let d = new Date(date.getTime())
	d.setDate(32)
	return 32 - d.getDate()
}


/**
 * Clone a date. Can specified `units` to partly clone.
 * @param date The date to clone, default value is current date.
 * @param units The units to partly clone.
 */
export function cloneDate(date: Date = new Date(), units: string = dateUnits): Date {
	let dateValues = [...dateUnits].map(unit => {
		if (units.includes(unit)) {
			return getDateByUnit(date, unit as DateUnit)
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


/**
 * Add duration string to a date and returns a new date.
 * @param date The date to add duration.
 * @param duration The duration string to add to date.
 */
export function addDurationToDate(date: Date, duration: string): Date {
	let isMinus = duration[0] === '-'
	if (isMinus) {
		duration = duration.slice(1)
	}
	let flag = isMinus ? -1 : 1

	let o = parseDurationToObject(duration)
	let newDate = new Date(date)

	for (let unit of Object.keys(o)) {
		let value = getDateByUnit(newDate, unit as DateUnit) + o[unit as DateUnit] * flag
		setDateByUnit(newDate, value, unit as DateUnit)
	}

	return newDate
}


/**
 * Returns a formatted date string.
 * @param date The date to format.
 * @param format The date format, default value is `'yyyy/MM/dd hh:mm:ss'`.
 */
export function formatDate(date: Date, format = 'yyyy/MM/dd hh:mm:ss'): string {
	return format.replace(/y+|M+|d+|h+|m+|s+/g, m0 => {
		let unit = m0[0]
		let value = getDateByUnit(date, unit[0] as DateUnit)
		
		if (unit === 'M') {
			value += 1
		}

		return String(value).padStart(m0.length, '0')
	})
}


/**
 * Returns a short type formatted date string.
 * @param date The date to format.
 * @param format The format object to use, default value is `{y: 'yyyy/MM/dd hh:mm', M: 'MM/dd hh:mm', h: 'hh:mm'}`.
 */
export function formatToShort (date: Date, format: {[key in DateUnit]?: string} = {y: 'yyyy/MM/dd hh:mm', M: 'MM/dd hh:mm', h: 'hh:mm'}) {
	let now = new Date()
	let hasDifferentUnit = false
	let matchFormat: string = Object.values(format)[0]!

	for (let unit of dateUnits) {
		hasDifferentUnit = hasDifferentUnit || getDateByUnit(date, unit as DateUnit) !== getDateByUnit(now, unit as DateUnit)
		matchFormat = format[unit as DateUnit] || matchFormat

		if (hasDifferentUnit) {
			break
		}
	}

	return formatDate(date, matchFormat)
}