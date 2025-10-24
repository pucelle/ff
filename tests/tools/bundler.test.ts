import {ListBundler, SetBundler, EmptyBundler, sleep} from '../../src'
import {describe, expect, vi, it} from 'vitest'


describe('Test Bundler', () => {
	it('ListBundler', async () => {
		let f = vi.fn() as any
		let b = new ListBundler(f)
		b.add(1)
		b.add(2)
		await sleep(10)
		expect(f).toHaveBeenCalledTimes(1)
		expect(f).toHaveBeenCalledWith([1, 2])
	})


	it('SetBundler', async () => {
		let f = (arg: any) => {
			expect(arg instanceof Set)
			expect([...arg]).toEqual([1, 2])
		}

		let b = new SetBundler(f)
		b.add(1)
		b.add(2)
		await sleep(10)
	})


	it('EmptyBundler', async () => {
		let f = vi.fn() as any
		let b = new EmptyBundler(f)
		b.call()
		await sleep(10)
	})
})