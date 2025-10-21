import {applyMixins} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test MixinUtils', () => {
	it('applyMixins', () => {
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