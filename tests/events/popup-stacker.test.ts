// @vitest-environment happy-dom

import * as PopupStacker from '../../src/events/popup-stacker'
import {afterEach, describe, expect, it} from 'vitest'


describe('PopupStacker', () => {
	let triggers: Element[] = []

	afterEach(() => {
		for (let trigger of triggers.toReversed()) {
			PopupStacker.destroy(trigger)
		}

		triggers = []
	})

	it.each([3, 5])('restores all ancestor locks when entering level %i after leaving its parent', depth => {
		let contents: Element[] = []

		for (let i = 0; i < depth; i++) {
			let trigger = document.createElement('div')
			let content = document.createElement('div')
			triggers.push(trigger)
			contents.push(content)

			if (i > 0) {
				contents[i - 1].append(trigger)
				PopupStacker.onLeave(triggers[i - 1])
			}

			PopupStacker.onEnter(trigger, content)

			for (let ancestor of triggers) {
				expect(PopupStacker.hasLocked(ancestor)).toBe(true)
			}
		}

		PopupStacker.onLeave(triggers[depth - 1])

		for (let trigger of triggers) {
			expect(PopupStacker.hasLocked(trigger)).toBe(false)
		}
	})

	it('restores ancestor locks when reentering an existing deep popup', () => {
		let contents: Element[] = []

		for (let i = 0; i < 3; i++) {
			let trigger = document.createElement('div')
			let content = document.createElement('div')
			triggers.push(trigger)
			contents.push(content)

			if (i > 0) {
				contents[i - 1].append(trigger)
			}

			PopupStacker.onEnter(trigger, content)
		}

		for (let trigger of triggers) {
			PopupStacker.onLeave(trigger)
		}

		expect(PopupStacker.hasLocked(triggers[0])).toBe(false)
		PopupStacker.onEnter(triggers[2], contents[2])

		for (let trigger of triggers) {
			expect(PopupStacker.hasLocked(trigger)).toBe(true)
		}
	})
})
