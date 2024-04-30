import {EventKeys} from '../../src'


describe('Test EventKeys', () => {
	test('EventKeys', () => {
		expect(EventKeys.pressedCharacterKey({which: 48})).toEqual(true)
		expect(EventKeys.pressedCharacterKey({which: 46})).toEqual(false)
		expect(EventKeys.pressedCharacterKey({which: 48, ctrlKey: true})).toEqual(false)

		expect(EventKeys.pressedControlKey({which: 48, ctrlKey: true})).toEqual(true)
		expect(EventKeys.pressedControlKey({which: 48, metaKey: true})).toEqual(true)
		expect(EventKeys.pressedControlKey({which: 46})).toEqual(false)

		expect(EventKeys.isCharacterKey({which: 48})).toEqual(true)
		expect(EventKeys.isCharacterKey({which: 46})).toEqual(false)

		expect(EventKeys.isControlKey({which: 17})).toEqual(true)
		expect(EventKeys.isControlKey({which: 18})).toEqual(true)

		expect(EventKeys.getShortcutKey({which: 46})).toEqual('Delete')
		expect(EventKeys.getShortcutKey({which: 48})).toEqual('0')
		expect(EventKeys.getShortcutKey({which: 46, ctrlKey: true})).toEqual('Ctrl+Delete')
		expect(EventKeys.getShortcutKey({which: 48, metaKey: true})).toEqual('Ctrl+0')
		expect(EventKeys.getShortcutKey({which: 48, altKey: true})).toEqual('Alt+0')
		expect(EventKeys.getShortcutKey({which: 65, altKey: true})).toEqual('Alt+A')

		expect(EventKeys.getShortcutCode({which: 46})).toEqual('Delete')
		expect(EventKeys.getShortcutCode({which: 48})).toEqual('Digit0')
		expect(EventKeys.getShortcutCode({which: 46, ctrlKey: true})).toEqual('Ctrl+Delete')
		expect(EventKeys.getShortcutCode({which: 48, metaKey: true})).toEqual('Ctrl+Digit0')
		expect(EventKeys.getShortcutCode({which: 65, altKey: true})).toEqual('Alt+KeyA')

		expect(EventKeys.getControlKeyCode({which: 46})).toEqual('')
		expect(EventKeys.getControlKeyCode({which: 46, ctrlKey: true})).toEqual('Ctrl+')
		expect(EventKeys.getControlKeyCode({which: 48, metaKey: true})).toEqual('Ctrl+')
		expect(EventKeys.getControlKeyCode({which: 65, altKey: true})).toEqual('Alt+')
	})
})