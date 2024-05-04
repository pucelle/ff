import {ListBundler, SetBundler, EmptyBundler} from '../../src'


describe('Test Bundler', () => {
	test('ListBundler', async () => {
		let f = jest.fn()
		let b = new ListBundler(f)
		b.add(1)
		b.add(2)
		await Promise.resolve()
		expect(f).toHaveBeenCalledTimes(1)
		expect(f).toHaveBeenCalledWith([1, 2])
	})


	test('SetBundler', async () => {
		let f = (arg: any) => {
			expect(arg instanceof Set)
			expect([...arg]).toEqual([1, 2])
		}

		let b = new SetBundler(f)
		b.add(1)
		b.add(2)
		await Promise.resolve()
	})


	test('EmptyBundler', async () => {
		let f = jest.fn()
		let b = new EmptyBundler(f)
		b.call()
		await Promise.resolve()
	})
})