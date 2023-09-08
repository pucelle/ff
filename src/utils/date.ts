import {DurationUnits, DurationObject} from './duration'


/** Handle and process date. */
export namespace DateUtils {

	/** Get one of the date values at specified `unit`. */
	export function getUnitValue(date: Date, unit: DurationUnit): number {
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


	/** Set one of date values at specified `unit`. */
	export function setUnitValue(date: Date, value: number, unit: DurationUnit): number {
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
	 * Whether date values from year to second are associated with a real date.
	 * `y` is the Year count.
	 * `M` is the Month count.
	 * `d` is the Date count, note it starts from `1`.
	 * `h` is the Hour count.
	 * `m` is the Minute count.
	 * `s` is the Second count.
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


	/** Whether `date` have a leap year, and contains 366 days. */
	export function isLeapYear(date: Date): boolean {
		let year = date.getFullYear()
		return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
	}


	/** Returns day count in the year, which means `366` for leap year, and `365` otherwise. */
	export function getDaysOfYear(date: Date): number {
		return isLeapYear(date) ? 366 : 365
	}


	/** Returns the day count in the month, betweens `28-31`. */
	export function getDaysOfMonth(date: Date): number {
		let d = new Date(date.getTime())
		d.setDate(32)
		return 32 - d.getDate()
	}


	/**
	 * Clones a date, returns a new date.
	 * `units`: default value is `yMdhms`, can specify partial to partly clone, rest values will be set to start value.
	 */
	export function clone(date: Date = new Date(), units: string = DurationUnits): Date {
		let dateValues = [...DurationUnits].map(unit => {
			if (units.includes(unit)) {
				return getUnitValue(date, unit as DurationUnit)
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


	/** Add second count to `date` and returns a new date. */
	export function addSeconds(date: Date, seconds: number): Date {
		let time = date.getTime()
		time += seconds * 1000

		return new Date(time)
	}


	/** Add a duration object to `date` and returns a new date. */
	export function addDuration(date: Date, duration: DurationObject): Date {
		let time = date.getTime()
		time += duration.toSeconds() * 1000

		return new Date(time)
	}


	/**
	 * Returns a formatted date string.
	 * `format` is a date format type, default value is `yyyy-MM-dd hh:mm:ss`.
	 */
	export function toString(date: Date, format = 'yyyy-MM-dd hh:mm:ss'): string {
		return format.replace(/y+|M+|d+|h+|m+|s+/g, m0 => {
			let unit = m0[0]
			let value = getUnitValue(date, unit[0] as DurationUnit)
			
			if (unit === 'M') {
				value += 1
			}

			return String(value).padStart(m0.length, '0')
		})
	}


	/**
	 * Returns a short formatted date string relative to current date.
	 * `format` is an object, defines which format to choose when relevant unit value is different.
	 */
	export function toShortString(date: Date, format: {[key in DurationUnit]?: string} = {y: 'yyyy-MM-dd', M: 'MM-dd', h: 'hh:mm'}) {
		let now = new Date()
		let hasDifferentUnit = false
		let matchedFormat: string = Object.values(format)[0]!

		for (let unit of DurationUnits) {
			hasDifferentUnit = hasDifferentUnit || getUnitValue(date, unit as DurationUnit) !== getUnitValue(now, unit as DurationUnit)
			matchedFormat = format[unit as DurationUnit] || matchedFormat

			if (hasDifferentUnit) {
				break
			}
		}

		return toString(date, matchedFormat)
	}
}