import {MiniHeap} from '../../src'


describe('Test MiniHeap', () => {
	
	test('MiniHeap', () => {
		let m = new MiniHeap<number>((a, b) => a - b)
		
		for (let i = 0; i < 100; i++) {
			m.add(Math.round(Math.random() * 100))
		}

		let lastValue = -1

		while (!m.isEmpty()) {
			let v = m.popHead()!
			expect(v).toBeGreaterThanOrEqual(lastValue)
			lastValue = v
		}
	})
})