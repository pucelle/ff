import {DurationObject} from '../../src/utils/duration'


describe('Test duration', () => {
	test('fromString', () => {
		expect(DurationObject.fromString('1y1M1d')).toEqual({y: 1, d: 1, M:1, h: 0, m:0, s: 0})
		expect(DurationObject.fromString('1h1m1s')).toEqual({y: 0, d: 0, M:0, h: 1, m: 1, s:1})
		expect(DurationObject.fromString('1.5h1m1s')).toEqual({y: 0, d: 0, M:0, h: 1.5, m: 1, s:1})
		expect(DurationObject.fromString('01:01:01')).toEqual({y: 0, d: 0, M:0, h: 1, m: 1, s:1})
		expect(DurationObject.fromString('01:01')).toEqual({y: 0, d: 0, M:0, h: 0, m: 1, s:1})
	})

	test('parseDurationToSeconds', () => {
		expect(DurationObject.fromString('1y1M1d').toSeconds()).toEqual(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60)
		expect(DurationObject.fromString('1h1m1s').toSeconds()).toEqual(1 * 60 * 60 + 1 * 60 + 1)
		expect(DurationObject.fromString('1.5h1m1s').toSeconds()).toEqual(1.5 * 60 * 60 + 1 * 60 + 1)
		expect(DurationObject.fromString('01:01:01').toSeconds()).toEqual(1 * 60 * 60 + 1 * 60 + 1)
		expect(DurationObject.fromString('01:01').toSeconds()).toEqual(1 * 60 + 1)
	})

	test('parseSecondsToDurationObject', () => {
		expect(DurationObject.fromSeconds(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60).data).toEqual({y: 1, d: 1, M:1, h: 0, m:0, s: 0})
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).data).toEqual({y: 0, d: 0, M:0, h: 1, m: 1, s:1})
		expect(DurationObject.fromSeconds(1 * 60 + 1).data).toEqual({y: 0, d: 0, M:0, h: 0, m: 1, s:1})
	})

	test('formatSecondsToDuration', () => {
		expect(DurationObject.fromSeconds(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60).toDurationString()).toEqual('1y1M1d')
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).toDurationString()).toEqual('1h1m1s')
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1, 'ms').toDurationString()).toEqual('61m1s')
		expect(DurationObject.fromSeconds(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60, 'Md').toDurationString()).toEqual('13M6d')
	})

	test('formatSecondsToTime', () => {
		expect(DurationObject.fromSeconds(1 * 24 * 60 * 60).toTimeString()).toEqual('24:00:00')
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).toTimeString()).toEqual('01:01:01')
		expect(DurationObject.fromSeconds(1 * 60 + 1).toTimeString()).toEqual('01:01')
	})
})
