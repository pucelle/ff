import {TransitionEasingName, getEasingFunction, makeMixer} from '../../src/transition'


describe('Test transition', () => {
	
	test('getEasingFunction', () => {
		for (let name of ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'] as TransitionEasingName[]) {
			let fn = getEasingFunction(name)
			expect(fn(0)).toEqual(0)
			expect(fn(1)).toEqual(1)
		}
	})

	test('getEasingFunction of custom easings', () => {
		for (let name of ['ease-in-elastic', 'ease-out-elastic', 'ease-in-out-elastic', 'ease-in-bounce', 'ease-out-bounce', 'ease-in-out-bounce'] as TransitionEasingName[]) {
			let fn = getEasingFunction(name)
			expect(fn(0)).toEqual(0)
			expect(fn(1)).toEqual(1)
		}
	})

	test('makeMixer', () => {

		class Mixable {
			value: number
			constructor(value: number) {
				this.value = value
			}
			mix(m: Mixable, rate: number) {
				return new Mixable(this.value * (rate - 1) + m.value * rate)
			}
		}

		class MakeMixable {
			value: number
			constructor(value: number) {
				this.value = value
			}
			makeMixer(m: Mixable) {
				return (rate: number) => {
					return new MakeMixable(this.value * (rate - 1) + m.value * rate)
				}
			}
		}

		expect(makeMixer(0, 1)(0.4)).toEqual(0.4)
		expect(makeMixer(1, 0)(0.4)).toEqual(0.6)
		expect(makeMixer('#000', '#fff')(0.5)).toEqual('#808080')
		expect(makeMixer({a:0}, {a:1})(0.4)).toEqual({a:0.4})
		expect(makeMixer([0,1], [1,0])(0.4)).toEqual([0.4, 0.6])
		expect(makeMixer(new Mixable(0), new Mixable(1))(0.4)).toEqual(new Mixable(0.4))
		expect(makeMixer(new MakeMixable(0), new MakeMixable(1))(0.4)).toEqual(new MakeMixable(0.4))
	})
})