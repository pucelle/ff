import {webStorage} from '../../src'
import {sleep} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test storage', () => {
	it('webStorage', async () => {
		expect(webStorage.isSupported()).toEqual(true)
		expect(webStorage.set('a', 'b')).toEqual(true)
		expect(webStorage.get('a')).toEqual('b')
		expect(webStorage.has('a')).toEqual(true)
		expect(webStorage.delete('a')).toEqual(true)
		expect(webStorage.has('a')).toEqual(false)
		expect(webStorage.get('a', 'c')).toEqual('c')

		expect(webStorage.set('a', 'b', 1)).toEqual(true)
		expect(webStorage.get('a')).toEqual('b')
		await sleep(1100)
		expect(webStorage.has('a')).toEqual(true)
		expect(webStorage.get('a')).toEqual(null)
	})


	// Jest environment doesn't support indexedDB.
	// it('biggerStorage', async () => {
	// 	expect(await biggerStorage.isSupported()).toEqual(true)
	// 	expect(await biggerStorage.set('a', 'b')).toEqual(true)
	// 	expect(await biggerStorage.get('a')).toEqual('b')
	// 	expect(await biggerStorage.has('a')).toEqual(true)
	// 	expect(await biggerStorage.delete('a')).toEqual(true)
	// 	expect(await biggerStorage.has('a')).toEqual(false)
	// 	expect(await biggerStorage.get('a', 'c')).toEqual('c')

	// 	expect(await biggerStorage.set('a', 'b', 1)).toEqual(true)
	// 	expect(await biggerStorage.get('a')).toEqual('b')
	// 	await sleep(1100)
	// 	expect(await biggerStorage.has('a')).toEqual(true)
	// 	expect(await biggerStorage.get('a')).toEqual(null)
	// })
})
