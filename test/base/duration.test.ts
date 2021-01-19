import * as ff from '../..'


describe('Test duration', () => {
	test('parseDurationToObject', () => {
		expect(ff.parseDurationToObject('1y1M1d')).toEqual({y: 1, d: 1, M:1, h: 0, m:0, s: 0})
		expect(ff.parseDurationToObject('1h1m1s')).toEqual({y: 0, d: 0, M:0, h: 1, m: 1, s:1})
		expect(ff.parseDurationToObject('1.5h1m1s')).toEqual({y: 0, d: 0, M:0, h: 1.5, m: 1, s:1})
		expect(ff.parseDurationToObject('01:01:01')).toEqual({y: 0, d: 0, M:0, h: 1, m: 1, s:1})
		expect(ff.parseDurationToObject('01:01')).toEqual({y: 0, d: 0, M:0, h: 0, m: 1, s:1})
	})

	test('parseDurationToSeconds', () => {
		expect(ff.parseDurationToSeconds('1y1M1d')).toEqual(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60)
		expect(ff.parseDurationToSeconds('1h1m1s')).toEqual(1 * 60 * 60 + 1 * 60 + 1)
		expect(ff.parseDurationToSeconds('1.5h1m1s')).toEqual(1.5 * 60 * 60 + 1 * 60 + 1)
		expect(ff.parseDurationToSeconds('01:01:01')).toEqual(1 * 60 * 60 + 1 * 60 + 1)
		expect(ff.parseDurationToSeconds('01:01')).toEqual(1 * 60 + 1)
	})

	test('parseSecondsToDurationObject', () => {
		expect(ff.parseSecondsToDateObject(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60)).toEqual({y: 1, d: 1, M:1, h: 0, m:0, s: 0})
		expect(ff.parseSecondsToDateObject(1 * 60 * 60 + 1 * 60 + 1)).toEqual({y: 0, d: 0, M:0, h: 1, m: 1, s:1})
		expect(ff.parseSecondsToDateObject(1 * 60 + 1)).toEqual({y: 0, d: 0, M:0, h: 0, m: 1, s:1})
	})

	test('formatSecondsToDuration', () => {
		expect(ff.formatSecondsToDuration(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60)).toEqual('1y1M1d')
		expect(ff.formatSecondsToDuration(1 * 60 * 60 + 1 * 60 + 1)).toEqual('1h1m1s')
		expect(ff.formatSecondsToDuration(1 * 60 * 60 + 1 * 60 + 1, 'ms')).toEqual('61m1s')
		expect(ff.formatSecondsToDuration(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60, 'Md')).toEqual('13M6d')
	})

	test('formatSecondsToTime', () => {
		expect(ff.formatSecondsToTime(1 * 24 * 60 * 60)).toEqual('24:00:00')
		expect(ff.formatSecondsToTime(1 * 60 * 60 + 1 * 60 + 1)).toEqual('01:01:01')
		expect(ff.formatSecondsToTime(1 * 60 + 1)).toEqual('01:01')
	})
})
