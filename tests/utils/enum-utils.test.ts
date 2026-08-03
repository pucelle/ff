import {describe, expect, it} from 'vitest'
import {
	fromIdentifier,
	fromKey,
	getIdentifier,
	getKey,
	hasIdentifier,
	hasKey,
	hasValue,
} from '../../src/utils/enum-utils'


enum Status {
	NotStarted = 'not-started-value',
	InProgress = 'in-progress-value',
	Completed = 'completed-value',
}

enum Role {
	Guest = 0,
	Member = 1,
	Administrator = 2,
}


describe('enum-utils', () => {
	describe('string enums', () => {
		it('gets an enum key from its value', () => {
			expect(getKey(Status, Status.InProgress))
				.toBe('InProgress')
		})

		it('gets a dash-cased identifier from an enum value', () => {
			expect(getIdentifier(Status, Status.NotStarted))
				.toBe('not-started')

			expect(getIdentifier(Status, Status.InProgress))
				.toBe('in-progress')
		})

		it('gets an enum value from its key', () => {
			expect(fromKey(Status, 'Completed'))
				.toBe(Status.Completed)
		})

		it('returns undefined for an unknown key', () => {
			expect(fromKey(Status, 'Unknown'))
				.toBeUndefined()
		})

		it('gets an enum value from a dash-cased identifier', () => {
			expect(fromIdentifier(Status, 'not-started'))
				.toBe(Status.NotStarted)

			expect(fromIdentifier(Status, 'in-progress'))
				.toBe(Status.InProgress)
		})

		it('returns undefined for an unknown identifier', () => {
			expect(fromIdentifier(Status, 'unknown'))
				.toBeUndefined()
		})

		it('checks whether a value exists', () => {
			expect(hasValue(Status, Status.Completed))
				.toBe(true)

			expect(hasValue(
				Status,
				'unknown-value' as Status,
			)).toBe(false)
		})

		it('checks whether an identifier exists', () => {
			expect(hasIdentifier(Status, 'in-progress'))
				.toBe(true)

			expect(hasIdentifier(Status, 'unknown'))
				.toBe(false)
		})

		it('checks whether a key exists', () => {
			expect(hasKey(Status, 'InProgress'))
				.toBe(true)

			expect(hasKey(Status, 'Unknown'))
				.toBe(false)
		})
	})


	describe('numeric enums', () => {
		it('gets a key from a numeric enum value', () => {
			expect(getKey(Role, Role.Member))
				.toBe('Member')

			expect(getKey(Role, Role.Administrator))
				.toBe('Administrator')
		})

		it('gets an identifier from a numeric enum value', () => {
			expect(getIdentifier(Role, Role.Guest))
				.toBe('guest')

			expect(getIdentifier(Role, Role.Administrator))
				.toBe('administrator')
		})

		it('gets a numeric enum value from its key', () => {
			expect(fromKey(Role, 'Member'))
				.toBe(Role.Member)
		})

		it('gets a numeric enum value from its identifier', () => {
			expect(fromIdentifier(Role, 'guest'))
				.toBe(Role.Guest)

			expect(fromIdentifier(Role, 'administrator'))
				.toBe(Role.Administrator)
		})

		it('supports zero as a valid enum value', () => {
			expect(hasValue(Role, Role.Guest))
				.toBe(true)

			expect(fromKey(Role, 'Guest'))
				.toBe(0)
		})
	})


	describe('cached maps', () => {
		it('returns consistent results across repeated calls', () => {
			expect(getKey(Status, Status.Completed))
				.toBe('Completed')

			expect(getKey(Status, Status.Completed))
				.toBe('Completed')

			expect(fromIdentifier(Status, 'completed'))
				.toBe(Status.Completed)

			expect(fromIdentifier(Status, 'completed'))
				.toBe(Status.Completed)
		})
	})
})