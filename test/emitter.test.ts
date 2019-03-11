import * as ff from '../src'


test('Test Emitter', () => {
	let e = new ff.Emitter()
	let fn = jest.fn()
	let scope = {}

	e.on('name', fn, scope)
	expect(e.hasListener('name')).toBeTruthy()
	expect(e.hasListener('name', fn)).toBeTruthy()
	expect(e.hasListener('name', fn, scope)).toBeTruthy()

	expect(e.hasListener('other_name')).toBeFalsy()
	expect(e.hasListener('name', function(){})).toBeFalsy()
	expect(e.hasListener('name', fn, {})).toBeFalsy()

	e.emit('name')
	expect(fn).toBeCalledTimes(1)
	e.off('name', fn)

	expect(e.hasListener('name')).toBeFalsy()
	expect(e.hasListener('name', fn)).toBeFalsy()
	expect(e.hasListener('name', fn, scope)).toBeFalsy()

	e.on('name', fn, scope)
	e.off('name', fn, scope)

	expect(e.hasListener('name')).toBeFalsy()
	expect(e.hasListener('name', fn)).toBeFalsy()
	expect(e.hasListener('name', fn, scope)).toBeFalsy()

	e.once('name_2', fn, scope)
	e.emit('name_2')
	expect(fn).toBeCalledTimes(2)

	expect(e.hasListener('name_2')).toBeFalsy()
	expect(e.hasListener('name_2', fn)).toBeFalsy()
	expect(e.hasListener('name_2', fn, scope)).toBeFalsy()

	e.once('name_2', fn, scope)
	e.removeAllListeners()
	expect(e.hasListener('name_2')).toBeFalsy()
})