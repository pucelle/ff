import {applyMixins} from '../../src'


describe('Test MixinUtils', () => {
	test('applyMixins', () => {
		class B {
			b() {
				return 'b'
			}
		}

		class C {
			c() {
				return 'c'
			}
		}

		class A {
			a() {
				return 'a'
			}
		}

		interface A extends B, C {}

		applyMixins(A, B, C)

		let a = new A()
		expect(a.b()).toEqual('b')
		expect(a.c()).toEqual('c')
	})
})