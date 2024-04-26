import * as DateUtils from '../../src/utils/date-utils'


describe('Test date', () => {
	let d = new Date()

	test('getValue', () => {
		expect(DateUtils.getValue(d, 'y')).toEqual(d.getFullYear())
		expect(DateUtils.getValue(d, 'M')).toEqual(d.getMonth())
		expect(DateUtils.getValue(d, 'd')).toEqual(d.getDate())
		expect(DateUtils.getValue(d, 'h')).toEqual(d.getHours())
		expect(DateUtils.getValue(d, 'm')).toEqual(d.getMinutes())
		expect(DateUtils.getValue(d, 's')).toEqual(d.getSeconds())
		expect(() => DateUtils.getValue(d, <any>'x')).toThrow()
	})

	test('setValue', () => {
		let n = new Date()
		expect(DateUtils.setValue(n, 2000, 'y')).toEqual(n.setFullYear(2000))
		expect(DateUtils.setValue(n, 0, 'M')).toEqual(n.setMonth(0))
		expect(DateUtils.setValue(n, 1, 'd')).toEqual(n.setDate(1))
		expect(DateUtils.setValue(n, 0, 'h')).toEqual(n.setHours(0))
		expect(DateUtils.setValue(n, 0, 'm')).toEqual(n.setMinutes(0))
		expect(DateUtils.setValue(n, 0, 's')).toEqual(n.setSeconds(0))
		expect(() => DateUtils.setValue(n, 0, <any>'x')).toThrow()
	})

	test('isValid', () => {
		expect(DateUtils.isValid(2020, 0, 1, 0, 0, 0)).toEqual(true)
		expect(DateUtils.isValid(2020, 0, 1, 0, 0)).toEqual(true)
		expect(DateUtils.isValid(2020, 0, 1, 0)).toEqual(true)
		expect(DateUtils.isValid(2020, 0, 1)).toEqual(true)
		expect(DateUtils.isValid(2020, 0)).toEqual(true)

		expect(DateUtils.isValid(2020, 12, 1, 1, 1, 1)).toEqual(false)
		expect(DateUtils.isValid(2020, 0, 32, 1, 1, 1)).toEqual(false)
		expect(DateUtils.isValid(2020, 0, 1, 25, 1, 1)).toEqual(false)
		expect(DateUtils.isValid(2020, 0, 1, 1, 61, 1)).toEqual(false)
		expect(DateUtils.isValid(2020, 0, 1, 1, 1, 61)).toEqual(false)
	})

	test('isLeapYear', () => {
		expect(DateUtils.isLeapYear(new Date(2020, 0))).toEqual(true)
		expect(DateUtils.isLeapYear(new Date(2021, 0))).toEqual(false)
		expect(DateUtils.isLeapYear(new Date(2100, 0))).toEqual(false)
		expect(DateUtils.isLeapYear(new Date(2000, 0))).toEqual(true)
	})

	test('getDaysOfYear', () => {
		expect(DateUtils.getDaysOfYear(new Date(2020, 0))).toEqual(366)
		expect(DateUtils.getDaysOfYear(new Date(2021, 0))).toEqual(365)
		expect(DateUtils.getDaysOfYear(new Date(2100, 0))).toEqual(365)
		expect(DateUtils.getDaysOfYear(new Date(2000, 0))).toEqual(366)
	})

	test('getDaysOfMonth', () => {
		expect(DateUtils.getDaysOfMonth(new Date(2020, 0))).toEqual(31)
		expect(DateUtils.getDaysOfMonth(new Date(2020, 1))).toEqual(29)
		expect(DateUtils.getDaysOfMonth(new Date(2021, 1))).toEqual(28)
	})

	test('clone', () => {
		expect(DateUtils.format(DateUtils.clone())).toEqual(DateUtils.format(new Date()))
		expect(DateUtils.format(DateUtils.clone(d))).toEqual(DateUtils.format(d))
		expect(DateUtils.clone(d, 'yMd')).toEqual(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
		expect(DateUtils.clone(d, 'yM')).toEqual(new Date(d.getFullYear(), d.getMonth()))
	})

	test('addDuration', () => {
		expect(DateUtils.addDuration(d, '1d').getTime() - d.getTime()).toEqual(24 * 60 * 60 * 1000)
		expect(DateUtils.addDuration(d, '-1d').getTime() - d.getTime()).toEqual(-24 * 60 * 60 * 1000)
		expect(DateUtils.addDuration(new Date(2020, 0, 1), '1M')).toEqual(new Date(2020, 1, 1))
		expect(DateUtils.addDuration(new Date(2020, 1, 1), '-1M')).toEqual(new Date(2020, 0, 1))
	})

	test('addSeconds', () => {
		expect(DateUtils.addSeconds(d, 24 * 60 * 60).getTime() - d.getTime()).toEqual(24 * 60 * 60 * 1000)
	})

	test('format', () => {
		expect(DateUtils.format(new Date(2020, 0, 1))).toEqual('2020-01-01 00:00:00')
		expect(DateUtils.format(new Date(2020, 0, 1), 'yyMMddhhmmss')).toEqual('20200101000000')
	})

	test('formatToShort', () => {
		let n = DateUtils.addDuration(d, '1y')
		expect(DateUtils.formatToShort(n)).toEqual(DateUtils.format(n, 'yyyy-MM-dd'))

		n = DateUtils.addDuration(d, d.getMonth() > 6 ? '-1M' : '1M')
		expect(DateUtils.formatToShort(n)).toEqual(DateUtils.format(n, 'MM-dd'))

		n = DateUtils.addDuration(d, d.getDate() > 15 ? '-1d' : '1d')
		expect(DateUtils.formatToShort(n)).toEqual(DateUtils.format(n, 'MM-dd'))

		n = DateUtils.addDuration(d, d.getHours() > 12 ? '-1h' : '1h')
		expect(DateUtils.formatToShort(n)).toEqual(DateUtils.format(n, 'hh:mm'))
	})
})