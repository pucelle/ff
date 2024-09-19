import {createComputed, trackGet, trackSet} from '../../src'


describe('Test createComputed', () => {

	it('Test createComputed', () => {
		class A {
			v!: number
			get v1() {
				return this.v
			}
			get v2() {
				return this.v1 + 1
			}
		}

		let a = new A()
		let v1 = createComputed(() => {trackGet(a, 'v'); return a.v})
		let v2 = createComputed(() => {trackGet(a, 'v'); return a.v + 1})

		a.v = 1
		trackSet(a, 'v')
		expect(v1()).toEqual(1)
		expect(v2()).toEqual(2)

		a.v = 2
		trackSet(a, 'v')
		expect(v1()).toEqual(2)
		expect(v2()).toEqual(3)
	})
})