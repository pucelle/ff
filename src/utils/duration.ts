/** Duration data object. */
type DurationData = Record<DurationUnit, number>


/** All data units from year to seconds. */
export const DurationUnits = 'yMdhms'


export class DurationObject {

	/** Date units and their mapped seconds. */
	static DateUnitSeconds: DurationData & {w: number} = {
		y: 365 * 24 * 60 * 60,
		M: 30 * 24 * 60 * 60,
		w: 7 * 24 * 60 * 60,
		d: 24 * 60 * 60,
		h: 60 * 60,
		m: 60,
		s: 1,
	}

	/** Parse `duration` string like `1h1m` or `01:01:00` to duration object. */
	static fromString(duration: string) {
		let o: DurationData = {
			y: 0,
			M: 0,
			d: 0,
			h: 0,
			m: 0,
			s: 0,
		}
	
		if (duration.includes(':')) {
			let [h, m, s] = duration.match(/(?:(\d\d):)?(\d\d):(\d\d(?:\.\d+)?)/)?.slice(1).map(v => Number(v) || 0)
				|| [0, 0, 0]
	
			o.h = h
			o.m = m
			o.s = s
		}
		else {
			let re = /(-?\d+(?:\.\d+)?) ?([yMwdhms])/g
			let match: RegExpExecArray | null
	
			while (match = re.exec(duration)) {
				let [, value, unit] = match

				if (unit === 'w') {
					o['d'] += Number(value) * 7
				}
				else {
					o[unit as DurationUnit] += Number(value)
				}
			}
		}
	
		return new DurationObject(o)
	}

	/** Parse second count to duration object. */
	static fromSeconds(seconds: number, units = DurationUnits): DurationObject {
		let o = {
			y: 0,
			M: 0,
			d: 0,
			h: 0,
			m: 0,
			s: 0,
		}

		for (let unit of units) {
			let unitValue = DurationObject.DateUnitSeconds[unit as DurationUnit]
			let count = Math.floor(seconds / unitValue)

			if (count > 0) {
				o[unit as DurationUnit] = count
				seconds = seconds % unitValue
			}
		}

		return new DurationObject(o)
	}


	/** Duration data object. */
	readonly data: Readonly<DurationData>

	constructor(data: Readonly<DurationData>) {
		this.data = data
	}

	/** Add a duration object with current, returns a new duration object. */
	addDuration(duration: DurationObject | string): DurationObject {
		if (typeof duration === 'string') {
			duration = DurationObject.fromString(duration)
		}
		
		let seconds = this.toSeconds() + duration.toSeconds()
		return DurationObject.fromSeconds(seconds)
	}

	/** Add second count with current, returns a new duration object. */
	addSeconds(seconds: number): DurationObject {
		seconds += this.toSeconds()
		return DurationObject.fromSeconds(seconds)
	}

	/** Convert current duration to second count. */
	toSeconds(): number {
		let data = this.data
		let seconds = 0

		for (let unit of Object.keys(data)) {
			let count = data[unit as DurationUnit]
			seconds += count * DurationObject.DateUnitSeconds[unit as DurationUnit]
		}

		return seconds
	}

	/** 
	 * Format to duration string like `1h1m`.
	 * `units` can specify only output with these units.
	 */
	toDurationString(units: string = DurationUnits): string {
		let seconds = this.toSeconds()
		let duration = ''

		for (let unit of units as Iterable<keyof DurationData>) {
			let secondsInUnit = DurationObject.DateUnitSeconds[unit]
			let count = Math.floor(seconds /secondsInUnit)
			seconds -= count * secondsInUnit

			if (count > 0) {
				duration += count + unit
			}
		}

		return duration
	}

	/** Format to time string like `01:01:01`. */
	toTimeString(): string {
		let seconds = this.toSeconds()
		let h = Math.floor(seconds / 3600)
		let m = Math.floor(seconds % 3600 / 60) || 0
		let s = Math.floor(seconds % 60) || 0

		return (h ? String(h).padStart(2, '0') + ':' : '')
			+ String(m).padStart(2, '0') + ':'
			+ String(s).padStart(2, '0')
	}
}
