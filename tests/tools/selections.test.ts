import {Selections} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Selections', () => {
	it('uses a falsy item as the shift-selection anchor', () => {
		let selections = new Selections<number>()
		let data = [2, 0, 1, 3]
		selections.select(0)

		selections.selectByMouseEvent(2, data, {shiftKey: true, ctrlKey: false} as MouseEvent)
		expect([...selections.getSelected()]).toEqual([0, 1])
	})
})
