import {causeUpdate} from '../../src/observable/will-updatable'


describe('Test WillUpdatable', () => {

	it('Test causeUpdate', () => {
		class A {
			key!: number
			willUpdate = jest.fn()
		}
	
		causeUpdate(A.prototype, 'key')

		
		let a = new A()

		a.key = 1
		expect(a.willUpdate).toBeCalledTimes(1)

		a.key = 1
		expect(a.willUpdate).toBeCalledTimes(1)
	})
})