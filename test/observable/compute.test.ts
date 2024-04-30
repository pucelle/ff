import {DependencyTracker, compute} from '../../src'


describe('Test compute', () => {

	it('Test compute', () => {
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
		let v1 = compute(() => {DependencyTracker.onGet(a, 'v'); return a.v})
		let v2 = compute(() => {DependencyTracker.onGet(a, 'v'); return a.v + 1})

		a.v = 1
		DependencyTracker.onSet(a, 'v')
		expect(v1()).toEqual(1)
		expect(v2()).toEqual(2)

		a.v = 2
		DependencyTracker.onSet(a, 'v')
		expect(v1()).toEqual(2)
		expect(v2()).toEqual(3)
	})
})