import {subMatches} from './string'
import {DateUnit} from './date'


/** Data object with units as key. */
export type DateObject = Record<DateUnit, number>


/** All data units from year to seconds. */
const DateUnits = 'yMdhms'

/** Date units and their mapped seconds. */
const DATE_UNIT_SECONDS: DateObject & {w: number} = {
	y: 365 * 24 * 60 * 60,
	M: 30 * 24 * 60 * 60,
	w: 7 * 24 * 60 * 60,
	d: 24 * 60 * 60,
	h: 60 * 60,
	m: 60,
	s: 1,
}


/**
 * Parse `duration` string like `1h1m` or `01:01:00` to date object `{y, M, d, h, m, s}`.
 * @param duration string like `1h1m` or `01:01:00`.
 */
export function parseDurationToObject(duration: string): DateObject {
	let o = {
		y: 0,
		M: 0,
		d: 0,
		h: 0,
		m: 0,
		s: 0,
	}

	if (duration.includes(':')) {
		let [h, m, s] = subMatches(duration, /(?:(\d\d):)?(\d\d):(\d\d(?:\.\d+)?)/)[0].map(v => Number(v) || 0)

		o.h = h
		o.m = m
		o.s = s
	}
	else {
		let matches = subMatches(duration, /(\d+(?:\.\d+)?) ?([yMwdhms])/g)

		for (let [count, unit] of matches) {
			o[unit as DateUnit] = Number(count)
		}
	}

	return o
}


/**
 * Parse duration string like `1h1m` or `01:01:00` to second count.
 * @param duration string like `1h1m` or `01:01:00`.
 */
export function parseDurationToSeconds(duration: string): number {
	let o = parseDurationToObject(duration)
	let seconds = 0

	for (let unit of Object.keys(o)) {
		let count = o[unit as DateUnit]!
		seconds += count * DATE_UNIT_SECONDS[unit as DateUnit]
	}

	return seconds
}


/**
 * Parse second count to date object `{y, M, d, h, m, s}`.
 * @param seconds The second count.
 * @param units The unit to use when parsing, default value is `yMdhms`.
 */
export function parseSecondsToDateObject (seconds: number, units = DateUnits): DateObject {
	let o = {
		y: 0,
		M: 0,
		d: 0,
		h: 0,
		m: 0,
		s: 0,
	}

	for (let unit of units) {
		let unitValue = DATE_UNIT_SECONDS[unit as DateUnit]
		let count = Math.floor(seconds / unitValue)

		if (count > 0) {
			o[unit as DateUnit] = count
			seconds = seconds % unitValue
		}
	}

	return o
}


/**
 * Format second count to duration string like `1h1m`.
 * @param units Date unit types like `yMdhms`. Can only specify partial date units like `Md`.
 * @param maxOutputUnitCount Maximun unit count of the duration string. E.g., sepcify to `2` to output like `1y1M`, `1M1d`, `1d1h`, `1s`.
 */
export function formatSecondsToDuration (seconds: number, units: string = DateUnits, maxOutputUnitCount: number = units.length): string {
	let o = parseSecondsToDateObject(seconds, units)
	let duration = ''
	let outputUnitCount = 0

	for (let unit of Object.keys(o)) {
		let count = o[unit as DateUnit]

		if (count > 0) {
			duration += count + unit
			outputUnitCount++
		}

		if (outputUnitCount >= maxOutputUnitCount) {
			break
		}
	}

	return duration
}


/**
 * Format second count to time string like `01:01:01`.
 * @param seconds The second count.
 */
export function formatSecondsToTime (seconds: number) {
	let h = Math.floor(seconds / 3600)
	let m = Math.floor(seconds % 3600 / 60) || 0
	let s = Math.floor(seconds % 60) || 0

	return (h ? String(h).padStart(2, '0') + ':' : '')
		+ String(m).padStart(2, '0') + ':'
		+ String(s).padStart(2, '0')
}