import {DurationObject} from '../../src/utils/duration'


describe('Test duration', () => {
	test('fromString', () => {
		expect(DurationObject.fromString('1y1M1d').data).toEqual({y:1, d:1, M:1, h:0, m:0, s:0})
		expect(DurationObject.fromString('1h1m1s').data).toEqual({y:0, d:0, M:0, h:1, m:1, s:1})
		expect(DurationObject.fromString('1.5h1m1s').data).toEqual({y:0, d:0, M:0, h:1.5, m:1, s:1})
		expect(DurationObject.fromString('1w').data).toEqual({y:0, d:7, M:0, h:0, m:0, s:0})
		expect(DurationObject.fromString('01:01:01').data).toEqual({y:0, d:0, M:0, h:1, m:1, s:1})
		expect(DurationObject.fromString('01:01').data).toEqual({y:0, d:0, M:0, h:0, m:1, s:1})
	})

	test('toSeconds', () => {
		expect(DurationObject.fromString('1y1M1d').toSeconds()).toEqual(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60)
		expect(DurationObject.fromString('1h1m1s').toSeconds()).toEqual(1 * 60 * 60 + 1 * 60 + 1)
		expect(DurationObject.fromString('1.5h1m1s').toSeconds()).toEqual(1.5 * 60 * 60 + 1 * 60 + 1)
		expect(DurationObject.fromString('1w').toSeconds()).toEqual(7 * 24 * 60 * 60)
		expect(DurationObject.fromString('01:01:01').toSeconds()).toEqual(1 * 60 * 60 + 1 * 60 + 1)
		expect(DurationObject.fromString('01:01').toSeconds()).toEqual(1 * 60 + 1)
	})

	test('addDuration', () => {
		expect(DurationObject.fromString('1y1M1d').addDuration('1d').toDurationString()).toEqual('1y1M2d')
	})

	test('addSeconds', () => {
		expect(DurationObject.fromString('1y1M1d').addSeconds(60).toDurationString()).toEqual('1y1M1d1m')
	})

	test('fromSeconds', () => {
		expect(DurationObject.fromSeconds(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60).data).toEqual({y:1, d:1, M:1, h:0, m:0, s:0})
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).data).toEqual({y:0, d:0, M:0, h:1, m:1, s:1})
		expect(DurationObject.fromSeconds(1 * 60 + 1).data).toEqual({y:0, d:0, M:0, h:0, m:1, s:1})
	})

	test('fromSeconds', () => {
		expect(DurationObject.fromSeconds(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60).toDurationString()).toEqual('1y1M1d')
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).toDurationString()).toEqual('1h1m1s')
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).toDurationString('ms')).toEqual('61m1s')
		expect(DurationObject.fromSeconds(1 * 365 * 24 * 60 * 60 + 30 * 24 * 60 * 60 + 1 * 24 * 60 * 60).toDurationString('Md')).toEqual('13M6d')
	})

	test('formatSecondsToTime', () => {
		expect(DurationObject.fromSeconds(1 * 24 * 60 * 60).toTimeString()).toEqual('24:00:00')
		expect(DurationObject.fromSeconds(1 * 60 * 60 + 1 * 60 + 1).toTimeString()).toEqual('01:01:01')
		expect(DurationObject.fromSeconds(1 * 60 + 1).toTimeString()).toEqual('01:01')
	})
})
