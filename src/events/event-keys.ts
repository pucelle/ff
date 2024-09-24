import {StringUtils} from '../utils'


type Key =
	'Backspace' |
	'Tab' |
	'Clear' |
	'Enter' |
	'Control' |
	'Alt' |
	'CapsLock' |
	'Escape' |
	' ' |
	'PageUp' |
	'PageDown' |
	'End' |
	'Home' |
	'ArrowLeft' |
	'ArrowUp' |
	'ArrowRight' |
	'ArrowDown' |
	'Insert' |
	'Delete' |
	'0' |
	'1' |
	'2' |
	'3' |
	'4' |
	'5' |
	'6' |
	'7' |
	'8' |
	'9' |
	'A' |
	'B' |
	'C' |
	'D' |
	'E' |
	'F' |
	'G' |
	'H' |
	'I' |
	'J' |
	'K' |
	'L' |
	'M' |
	'N' |
	'O' |
	'P' |
	'Q' |
	'R' |
	'S' |
	'T' |
	'U' |
	'V' |
	'W' |
	'X' |
	'Y' |
	'Z' |
	'a' |
	'b' |
	'c' |
	'd' |
	'e' |
	'f' |
	'g' |
	'h' |
	'i' |
	'j' |
	'k' |
	'l' |
	'm' |
	'n' |
	'o' |
	'p' |
	'q' |
	'r' |
	's' |
	't' |
	'u' |
	'v' |
	'w' |
	'x' |
	'y' |
	'z' |
	'Meta' |
	'*' |
	'+' |
	'-' |
	'.' |
	'/' |
	'F1' |
	'F2' |
	'F3' |
	'F4' |
	'F5' |
	'F6' |
	'F7' |
	'F8' |
	'F9' |
	'F10' |
	'F11' |
	'F12' |
	';' |
	'=' |
	',' |
	'·' |
	'[' |
	'\\' |
	']' |
	'\'' |
	')' |
	'!' |
	'@' |
	'#' |
	'$' |
	'%' |
	'^' |
	'&' |
	'(' |
	'E' |
	'I' |
	'O' |
	'P' |
	'Q' |
	'R' |
	'T' |
	'U' |
	'W' |
	'Y' |
	':' |
	'<' |
	'_' |
	'>' |
	'?' |
	'~' |
	'{' |
	'|' |
	'}' |
	"\""

type Code = 
	'Backspace' |
	'Tab' |
	'NumLock' |
	'Enter' |
	'ControlLeft' |
	'AltLeft' |
	'CapsLock' |
	'Escape' |
	'Space' |
	'PageUp' |
	'PageDown' |
	'End' |
	'Home' |
	'ArrowLeft' |
	'ArrowUp' |
	'ArrowRight' |
	'ArrowDown' |
	'Insert' |
	'Delete' |
	'Digit0' |
	'Digit1' |
	'Digit2' |
	'Digit3' |
	'Digit4' |
	'Digit5' |
	'Digit6' |
	'Digit7' |
	'Digit8' |
	'Digit9' |
	'KeyA' |
	'KeyB' |
	'KeyC' |
	'KeyD' |
	'KeyE' |
	'KeyF' |
	'KeyG' |
	'KeyH' |
	'KeyI' |
	'KeyJ' |
	'KeyK' |
	'KeyL' |
	'KeyM' |
	'KeyN' |
	'KeyO' |
	'KeyP' |
	'KeyQ' |
	'KeyR' |
	'KeyS' |
	'KeyT' |
	'KeyU' |
	'KeyV' |
	'KeyW' |
	'KeyX' |
	'KeyY' |
	'KeyZ' |
	'MetaLeft' |
	'MetaRight' |
	'NumpadMultiply' |
	'NumpadAdd' |
	'NumpadSubtract' |
	'NumpadDecimal' |
	'NumpadDivide' |
	'F1' |
	'F2' |
	'F3' |
	'F4' |
	'F5' |
	'F6' |
	'F7' |
	'F8' |
	'F9' |
	'F10' |
	'F11' |
	'F12' |
	'Semicolon' |
	'Equal' |
	'Comma' |
	'Minus' |
	'Period' |
	'Slash' |
	'Backquote' |
	'BracketLeft' |
	'Backslash' |
	'BracketRight' |
	"Quote"

	
export type ControlKeyCode = 'Ctrl+' | 'Alt+' | 'Shift+' | 'Ctrl+Alt+' | 'Ctrl+Shift+' | 'Alt+Shift+' | 'Ctrl+Alt+Shift+'

export type ShortcutKey = `${ControlKeyCode}${Key}` | Key
export type ShortcutCode = `${ControlKeyCode}${Code}` | Code

interface KeyEventLike {
	which: number
	ctrlKey?: boolean
	shiftKey?: boolean
	metaKey?: boolean
	altKey?: boolean
}


/*
Execute following codes in browser dev tools and copy console message:

let keyMap = {}
let keyMapShifted = {}

document.onkeydown = (e) => {
	let key = e.key
	let code = e.code
	let num = e.keyCode

	let o = {
		key,
		code,
	}

	if (e.shiftKey) {
		if (keyMap[num] && keyMap[num].key !== key) {
			keyMapShifted[num] = o
		}
	}
	else {
		keyMap[num] = o
	}

	console.log(num, key, code)

	e.preventDefault()
}

Make page get focus, press every key, then keep pressing shift key, press every other key again.
Finally run `copy(JSON.stringify([keyMap, keyMapShifted]))` get an object.
Run the codes in both Mac and Windows, join them together.
*/


const NumToKeyCodeMap: Record<number, {key: Key, code: Code}> = {
	8: {
		"key": "Backspace",
		"code": "Backspace",
	},
	9: {
		"key": "Tab",
		"code": "Tab",
	},
	12: {
		"key": "Clear",
		"code": "NumLock",
	},
	13: {
		"key": "Enter",
		"code": "Enter",
	},
	17: {
		"key": "Control",
		"code": "ControlLeft",
	},
	18: {
		"key": "Alt",
		"code": "AltLeft",
	},
	20: {
		"key": "CapsLock",
		"code": "CapsLock",
	},
	27: {
		"key": "Escape",
		"code": "Escape",
	},
	32: {
		"key": " ",
		"code": "Space",
	},
	33: {
		"key": "PageUp",
		"code": "PageUp",
	},
	34: {
		"key": "PageDown",
		"code": "PageDown",
	},
	35: {
		"key": "End",
		"code": "End",
	},
	36: {
		"key": "Home",
		"code": "Home",
	},
	37: {
		"key": "ArrowLeft",
		"code": "ArrowLeft",
	},
	38: {
		"key": "ArrowUp",
		"code": "ArrowUp",
	},
	39: {
		"key": "ArrowRight",
		"code": "ArrowRight",
	},
	40: {
		"key": "ArrowDown",
		"code": "ArrowDown",
	},
	45: {
		"key": "Insert",	// on Mac, is `Help`.
		"code": "Insert",
	},
	46: {
		"key": "Delete",
		"code": "Delete",
	},
	48: {
		"key": "0",
		"code": "Digit0",
	},
	49: {
		"key": "1",
		"code": "Digit1",
	},
	50: {
		"key": "2",
		"code": "Digit2",
	},
	51: {
		"key": "3",
		"code": "Digit3",
	},
	52: {
		"key": "4",
		"code": "Digit4",
	},
	53: {
		"key": "5",
		"code": "Digit5",
	},
	54: {
		"key": "6",
		"code": "Digit6",
	},
	55: {
		"key": "7",
		"code": "Digit7",
	},
	56: {
		"key": "8",
		"code": "Digit8",
	},
	57: {
		"key": "9",
		"code": "Digit9",
	},
	65: {
		"key": "a",
		"code": "KeyA",
	},
	66: {
		"key": "b",
		"code": "KeyB",
	},
	67: {
		"key": "c",
		"code": "KeyC",
	},
	68: {
		"key": "d",
		"code": "KeyD",
	},
	69: {
		"key": "e",
		"code": "KeyE",
	},
	70: {
		"key": "f",
		"code": "KeyF",
	},
	71: {
		"key": "g",
		"code": "KeyG",
	},
	72: {
		"key": "h",
		"code": "KeyH",
	},
	73: {
		"key": "i",
		"code": "KeyI",
	},
	74: {
		"key": "j",
		"code": "KeyJ",
	},
	75: {
		"key": "k",
		"code": "KeyK",
	},
	76: {
		"key": "l",
		"code": "KeyL",
	},
	77: {
		"key": "m",
		"code": "KeyM",
	},
	78: {
		"key": "n",
		"code": "KeyN",
	},
	79: {
		"key": "o",
		"code": "KeyO",
	},
	80: {
		"key": "p",
		"code": "KeyP",
	},
	81: {
		"key": "q",
		"code": "KeyQ",
	},
	82: {
		"key": "r",
		"code": "KeyR",
	},
	83: {
		"key": "s",
		"code": "KeyS",
	},
	84: {
		"key": "t",
		"code": "KeyT",
	},
	85: {
		"key": "u",
		"code": "KeyU",
	},
	86: {
		"key": "v",
		"code": "KeyV",
	},
	87: {
		"key": "w",
		"code": "KeyW",
	},
	88: {
		"key": "x",
		"code": "KeyX",
	},
	89: {
		"key": "y",
		"code": "KeyY",
	},
	90: {
		"key": "z",
		"code": "KeyZ",
	},
	91: {
		"key": "Meta",
		"code": "MetaLeft",
	},
	93: {
		"key": "Meta",
		"code": "MetaRight",
	},
	106: {
		"key": "*",
		"code": "NumpadMultiply",
	},
	107: {
		"key": "+",
		"code": "NumpadAdd",
	},
	109: {
		"key": "-",
		"code": "NumpadSubtract",
	},
	110: {
		"key": ".",
		"code": "NumpadDecimal",
	},
	111: {
		"key": "/",
		"code": "NumpadDivide",
	},
	112: {
		"key": "F1",
		"code": "F1",
	},
	113: {
		"key": "F2",
		"code": "F2",
	},
	114: {
		"key": "F3",
		"code": "F3",
	},
	115: {
		"key": "F4",
		"code": "F4",
	},
	116: {
		"key": "F5",
		"code": "F5",
	},
	117: {
		"key": "F6",
		"code": "F6",
	},
	118: {
		"key": "F7",
		"code": "F7",
	},
	119: {
		"key": "F8",
		"code": "F8",
	},
	120: {
		"key": "F9",
		"code": "F9",
	},
	121: {
		"key": "F10",
		"code": "F10",
	},
	122: {
		"key": "F11",
		"code": "F11",
	},
	123: {
		"key": "F12",
		"code": "F12",
	},
	186: {
		"key": ";",
		"code": "Semicolon",
	},
	187: {
		"key": "=",
		"code": "Equal",
	},
	188: {
		"key": ",",
		"code": "Comma",
	},
	189: {
		"key": "-",
		"code": "Minus",
	},
	190: {
		"key": ".",
		"code": "Period",
	},
	191: {
		"key": "/",
		"code": "Slash",
	},
	192: {
		"key": "·",
		"code": "Backquote",
	},
	219: {
		"key": "[",
		"code": "BracketLeft",
	},
	220: {
		"key": "\\",
		"code": "Backslash",
	},
	221: {
		"key": "]",
		"code": "BracketRight",
	},
	222: {
		"key": "'",
		"code": "Quote",
	},
	229: {
		"key": "q",
		"code": "KeyQ",
	}
}

const ShiftedNumToKeyCodeMap: Record<string, {key: string, code: string}> = {
	48: {
		"key": ")",
		"code": "Digit0",
	},
	49: {
		"key": "!",
		"code": "Digit1",
	},
	50: {
		"key": "@",
		"code": "Digit2",
	},
	51: {
		"key": "#",
		"code": "Digit3",
	},
	52: {
		"key": "$",
		"code": "Digit4",
	},
	53: {
		"key": "%",
		"code": "Digit5",
	},
	54: {
		"key": "^",
		"code": "Digit6",
	},
	55: {
		"key": "&",
		"code": "Digit7",
	},
	56: {
		"key": "*",
		"code": "Digit8",
	},
	57: {
		"key": "(",
		"code": "Digit9",
	},
	65: {
		"key": "A",
		"code": "KeyA",
	},
	66: {
		"key": "B",
		"code": "KeyB",
	},
	67: {
		"key": "C",
		"code": "KeyC",
	},
	68: {
		"key": "D",
		"code": "KeyD",
	},
	69: {
		"key": "E",
		"code": "KeyE",
	},
	70: {
		"key": "F",
		"code": "KeyF",
	},
	71: {
		"key": "G",
		"code": "KeyG",
	},
	72: {
		"key": "H",
		"code": "KeyH",
	},
	73: {
		"key": "I",
		"code": "KeyI",
	},
	74: {
		"key": "J",
		"code": "KeyJ",
	},
	75: {
		"key": "K",
		"code": "KeyK",
	},
	76: {
		"key": "L",
		"code": "KeyL",
	},
	77: {
		"key": "M",
		"code": "KeyM",
	},
	78: {
		"key": "N",
		"code": "KeyN",
	},
	79: {
		"key": "O",
		"code": "KeyO",
	},
	80: {
		"key": "P",
		"code": "KeyP",
	},
	81: {
		"key": "Q",
		"code": "KeyQ",
	},
	82: {
		"key": "R",
		"code": "KeyR",
	},
	83: {
		"key": "S",
		"code": "KeyS",
	},
	84: {
		"key": "T",
		"code": "KeyT",
	},
	85: {
		"key": "U",
		"code": "KeyU",
	},
	86: {
		"key": "V",
		"code": "KeyV",
	},
	87: {
		"key": "W",
		"code": "KeyW",
	},
	88: {
		"key": "X",
		"code": "KeyX",
	},
	89: {
		"key": "Y",
		"code": "KeyY",
	},
	90: {
		"key": "Z",
		"code": "KeyZ",
	},
	186: {
		"key": ":",
		"code": "Semicolon",
	},
	187: {
		"key": "+",
		"code": "Equal",
	},
	188: {
		"key": "<",
		"code": "Comma",
	},
	189: {
		"key": "_",
		"code": "Minus",
	},
	190: {
		"key": ">",
		"code": "Period",
	},
	191: {
		"key": "?",
		"code": "Slash",
	},
	192: {
		"key": "~",
		"code": "Backquote",
	},
	219: {
		"key": "{",
		"code": "BracketLeft",
	},
	220: {
		"key": "|",
		"code": "Backslash",
	},
	221: {
		"key": "}",
		"code": "BracketRight",
	},
	222: {
		"key": "\"",
		"code": "Quote",
	}
}


/** Whether pressed character key. */
export function pressedCharacterKey(event: KeyEventLike): boolean {
	let key = NumToKeyCodeMap[event.which]?.key
	return key && key.length === 1 && !pressedControlKey(event)
}


/** Whether pressed control key. */
export function pressedControlKey(event: KeyEventLike): boolean {
	return !!(event.ctrlKey || event.metaKey)
}


/** When event key is character key, like `A`, `1`. */
export function isCharacterKey(event: KeyEventLike): boolean {
	return getShortcutKey(event).length === 1
}


/** When event key is only control key, like `Control` or `Alt`. */
export function isControlKey(event: KeyEventLike): boolean {
	return [17, 18].includes(event.which)
}


/** 
 * Get key string like `Ctrl+A`, `Ctrl+1`.
 * @param shiftDistinguish determines whether consider pressing Shift key,
 * e.g., when `shiftDistinguish=true` will get `Shift+?` but not `Shift+/`.
 */
export function getShortcutKey(event: KeyEventLike, shiftDistinguish: boolean = false): ShortcutKey {
	let useShift = event.shiftKey && shiftDistinguish
	let key = useShift ? ShiftedNumToKeyCodeMap[event.which]?.key : NumToKeyCodeMap[event.which]?.key

	if (isControlKey(event)) {
		key = ''
	}
	
	return getControlKeyCode(event) + StringUtils.toCapitalize(key || '') as ShortcutKey
}


/** 
 * Get key string like `Ctrl+KeyA`, `Ctrl+Digit1`.
 * Compare with `getShortcutKey`, this one can get more details about keys,
 * e.g., `CtrlLeft` is different from `CtrlRight`.
 * Doesn't distinguish whether shift key is pressed.
 */
export function getShortcutCode(event: KeyEventLike): ShortcutCode {
	let code = NumToKeyCodeMap[event.which]?.code as string

	if (isControlKey(event)) {
		code = ''
	}

	return getControlKeyCode(event) + StringUtils.toCapitalize(code || '') as ShortcutCode
}


/** 
 * Get control key code string like `Ctrl+`, `Alt+`, `Shift+`.
 * Returns an empty string while no control key get pressed.
 */
export function getControlKeyCode(event: KeyEventLike): ControlKeyCode {
	let codes = ''
	
	if (event.ctrlKey || event.metaKey) {
		codes += 'Ctrl+'
	}

	if (event.altKey) {
		codes += 'Alt+'
	}

	if (event.shiftKey) {
		codes += 'Shift+'
	}
	
	return codes as ControlKeyCode
}
