import * as ff from '../..'


describe('Test date', () => {
	let d = new Date()

	test('getDateByUnit', () => {
		expect(ff.getDateByUnit(d, 'y')).toEqual(d.getFullYear())
		expect(ff.getDateByUnit(d, 'M')).toEqual(d.getMonth())
		expect(ff.getDateByUnit(d, 'd')).toEqual(d.getDate())
		expect(ff.getDateByUnit(d, 'h')).toEqual(d.getHours())
		expect(ff.getDateByUnit(d, 'm')).toEqual(d.getMinutes())
		expect(ff.getDateByUnit(d, 's')).toEqual(d.getSeconds())
		expect(() => ff.getDateByUnit(d, <any>'x')).toThrow()
	})

	test('setDateByUnit', () => {
		let n = new Date()
		expect(ff.setDateByUnit(n, 2000, 'y')).toEqual(n.setFullYear(2000))
		expect(ff.setDateByUnit(n, 0, 'M')).toEqual(n.setMonth(0))
		expect(ff.setDateByUnit(n, 1, 'd')).toEqual(n.setDate(1))
		expect(ff.setDateByUnit(n, 0, 'h')).toEqual(n.setHours(0))
		expect(ff.setDateByUnit(n, 0, 'm')).toEqual(n.setMinutes(0))
		expect(ff.setDateByUnit(n, 0, 's')).toEqual(n.setSeconds(0))
		expect(() => ff.setDateByUnit(n, 0, <any>'x')).toThrow()
	})

	test('isValidDate', () => {
		expect(ff.isValidDate(2020, 0, 1, 0, 0, 0)).toEqual(true)
		expect(ff.isValidDate(2020, 0, 1, 0, 0)).toEqual(true)
		expect(ff.isValidDate(2020, 0, 1, 0)).toEqual(true)
		expect(ff.isValidDate(2020, 0, 1)).toEqual(true)
		expect(ff.isValidDate(2020, 0)).toEqual(true)

		expect(ff.isValidDate(2020, 12, 1, 1, 1, 1)).toEqual(false)
		expect(ff.isValidDate(2020, 0, 32, 1, 1, 1)).toEqual(false)
		expect(ff.isValidDate(2020, 0, 1, 25, 1, 1)).toEqual(false)
		expect(ff.isValidDate(2020, 0, 1, 1, 61, 1)).toEqual(false)
		expect(ff.isValidDate(2020, 0, 1, 1, 1, 61)).toEqual(false)
	})

	test('isLeapYear', () => {
		expect(ff.isLeapYear(new Date(2020, 0))).toEqual(true)
		expect(ff.isLeapYear(new Date(2021, 0))).toEqual(false)
		expect(ff.isLeapYear(new Date(2100, 0))).toEqual(false)
		expect(ff.isLeapYear(new Date(2000, 0))).toEqual(true)
	})

	test('getDaysOfYear', () => {
		expect(ff.getDaysOfYear(new Date(2020, 0))).toEqual(366)
		expect(ff.getDaysOfYear(new Date(2021, 0))).toEqual(365)
		expect(ff.getDaysOfYear(new Date(2100, 0))).toEqual(365)
		expect(ff.getDaysOfYear(new Date(2000, 0))).toEqual(366)
	})

	test('getDaysOfMonth', () => {
		expect(ff.getDaysOfMonth(new Date(2020, 0))).toEqual(31)
		expect(ff.getDaysOfMonth(new Date(2020, 1))).toEqual(29)
		expect(ff.getDaysOfMonth(new Date(2021, 1))).toEqual(28)
	})

	test('cloneDate', () => {
		expect(ff.formatDate(ff.cloneDate())).toEqual(ff.formatDate(new Date()))
		expect(ff.formatDate(ff.cloneDate(d))).toEqual(ff.formatDate(d))
		expect(ff.cloneDate(d, 'yMd')).toEqual(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
		expect(ff.cloneDate(d, 'yM')).toEqual(new Date(d.getFullYear(), d.getMonth()))
	})

	test('addDurationToDate', () => {
		expect(ff.addDurationToDate(d, '1d').getTime() - d.getTime()).toEqual(24 * 60 * 60 * 1000)
		expect(ff.addDurationToDate(d, '-1d').getTime() - d.getTime()).toEqual(-24 * 60 * 60 * 1000)
		expect(ff.addDurationToDate(new Date(2020, 0, 1), '1M')).toEqual(new Date(2020, 1, 1))
		expect(ff.addDurationToDate(new Date(2020, 1, 1), '-1M')).toEqual(new Date(2020, 0, 1))
	})

	test('formatDate', () => {
		expect(ff.formatDate(new Date(2020, 0, 1))).toEqual('2020-01-01 00:00:00')
		expect(ff.formatDate(new Date(2020, 0, 1), 'yyMMddhhmmss')).toEqual('20200101000000')
	})

	test('formatToShortTime', () => {
		let n = ff.addDurationToDate(d, '1y')
		expect(ff.formatToShortDate(n)).toEqual(ff.formatDate(n, 'yyyy-MM-dd hh:mm'))

		n = ff.addDurationToDate(d, d.getMonth() > 6 ? '-1M' : '1M')
		expect(ff.formatToShortDate(n)).toEqual(ff.formatDate(n, 'MM-dd hh:mm'))

		n = ff.addDurationToDate(d, d.getDate() > 15 ? '-1d' : '1d')
		expect(ff.formatToShortDate(n)).toEqual(ff.formatDate(n, 'MM-dd hh:mm'))

		n = ff.addDurationToDate(d, d.getHours() > 12 ? '-1h' : '1h')
		expect(ff.formatToShortDate(n)).toEqual(ff.formatDate(n, 'hh:mm'))
	})
})