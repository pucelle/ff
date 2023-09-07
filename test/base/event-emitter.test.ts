import {EventEmitter} from '../src'


test('Test Event Emitter', () => {
	let e = new (EventEmitter as any)() as EventEmitter
	let fn = jest.fn()
	let scope = {}

	e.on('name', fn, scope)
	expect(e.hasListenerType('name')).toEqual(true)
	expect(e.hasListener('name', fn)).toEqual(true)
	expect(e.hasListener('name', fn, scope)).toEqual(true)

	expect(e.hasListenerType('other_name')).toEqual(false)
	expect(e.hasListener('name', function(){})).toEqual(false)
	expect(e.hasListener('name', fn, {})).toEqual(false)

	e.emit('name')
	expect(fn).toBeCalledTimes(1)
	e.off('name', fn)

	expect(e.hasListenerType('name')).toEqual(false)
	expect(e.hasListener('name', fn)).toEqual(false)
	expect(e.hasListener('name', fn, scope)).toEqual(false)

	e.on('name', fn, scope)
	e.off('name', fn, scope)

	expect(e.hasListenerType('name')).toEqual(false)
	expect(e.hasListener('name', fn)).toEqual(false)
	expect(e.hasListener('name', fn, scope)).toEqual(false)

	e.once('name_2', fn, scope)
	e.emit('name_2')
	expect(fn).toBeCalledTimes(2)

	expect(e.hasListenerType('name_2')).toEqual(false)
	expect(e.hasListener('name_2', fn)).toEqual(false)
	expect(e.hasListener('name_2', fn, scope)).toEqual(false)

	e.once('name_2', fn, scope)
	e.removeAllListeners()
	expect(e.hasListenerType('name_2')).toEqual(false)
})