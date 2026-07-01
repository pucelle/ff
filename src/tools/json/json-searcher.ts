enum JSONTokenType {
	Value,
	Word, // becomes variable or property later
	Variable,
	Key,
	Bracket,
	Colon,
	Dot,
	Others,
}

type JSONToken = {value: string, type: JSONTokenType}


/** Search json from an regexp match. */
export function searchFromRegExp(text: string, re: RegExp): any {
	let match = text.match(re)
	if (match) {
		return searchFrom(text, match.index! + match[0].length)
	}

	return null
}


/** Search json list from each regexp match. */
export function searchListFromRegExp(text: string, re: RegExp): any[] {
	let list: any[] = []

	let match: RegExpExecArray | null
	while (match = re.exec(text)) {
		list.push(searchFrom(text, match.index + match[0].length))
	}

	return list.filter(v => v)
}


/** Search json from an string match. */
export function searchFromText(text: string, from: string): any {
	let index = text.indexOf(from)
	if (index > -1) {
		return searchFrom(text, index + from.length)
	}

	return null
}


/** Search for specified variable. */
export function searchVariable(text: string, variableName: string): any {
	let re = new RegExp(`\\b${variableName}\\b\\s*=`)
	return searchFromRegExp(text, re)
}


/** Search json from an text index. */
export function searchFrom(text: string, startIndex: number): any {
	let tokens = parseToRawTokens(text, startIndex)
	let inVariableToken: JSONToken | null = null	// in a single expression like `a.b`, `a[1]`, `a()`

	for (let i = 0; i < tokens.length; i++) {
		let token = tokens[i]
		let {value, type} = token

		if (type === JSONTokenType.Word) {
			inVariableToken = null

			if (['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'].includes(value)) {
				token.type = JSONTokenType.Value
				continue
			}

			let next = tokens[i + 1]

			if (next && next.type === JSONTokenType.Colon) {
				token.type = JSONTokenType.Key
				continue
			}

			if (value === 'function' && next && next.type === JSONTokenType.Bracket && next.value === '(') {
				token.type = JSONTokenType.Variable
				token.value += popupTokensWithinBrackets(tokens, i + 1).map(t => t.value).join('')
				token.value += popupTokensWithinBrackets(tokens, i + 2).map(t => t.value).join('')
				continue
			}

			token.type = JSONTokenType.Variable
			inVariableToken = token
		}
		else if (type === JSONTokenType.Dot) {
			if (inVariableToken) {
				inVariableToken.value += tokens.splice(i--, 2).map(t => t.value).join('')
			}

			// Property.
			else {
				tokens.splice(i, 2)
				popupTokensWithinBrackets(tokens, i)
			}
		}
		else if (type === JSONTokenType.Bracket && inVariableToken) {
			if (value === '[' || value === '(') {
				inVariableToken.value += popupTokensWithinBrackets(tokens, i--).map(t => t.value).join('')
			}
		}
		else {
			inVariableToken = null
		}
	}

	return parseAsJSON(tokens.map(t => {
		if (t.type === JSONTokenType.Variable) {
			return JSON.stringify(t.value)
		}
		else {
			return t.value
		}
	}).join(''))
}


const BracketCharacters = '[{()}]'

function parseToRawTokens(text: string, startIndex: number) {
	let bracketStack: string[] = []

	let tokens: JSONToken[] = []
	let re = /("(?:\\\\|\\"|.)*?"|'(?:\\\\|\\'|.)*?'|`(?:\\\\|\\`|.)*?`|-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE]-?(?:\d+(?:\.\d+)?|\.\d+))?)|[\[\]{}()]|[\w\$]+|[:.]/gs
	let lastIndex = re.lastIndex = startIndex

	let match: RegExpExecArray | null
	while (match = re.exec(text)) {
		let m0 = match[0]
		let notMatchedText = text.slice(lastIndex, match.index)
		let type: JSONTokenType

		if (notMatchedText) {
			tokens.push({
				value: notMatchedText,
				type: JSONTokenType.Others
			})
		}

		if (match[1]) {
			type = JSONTokenType.Value
		}
		else if ('[{('.includes(m0)) {
			bracketStack.push(m0)
			type = JSONTokenType.Bracket
		}
		else if (']})'.includes(m0)) {
			let startBracket = bracketStack.pop()!
			if (BracketCharacters.indexOf(startBracket) + BracketCharacters.indexOf(m0) !== 5) {
				throw new Error(`Unexpected end bracket "${m0}"`)
			}
			type = JSONTokenType.Bracket
		}
		else if (/^[\w$]/.test(m0)) {
			type = JSONTokenType.Word
		}
		else if (m0 === ':') {
			type = JSONTokenType.Colon
		}
		else if (m0 === '.') {
			type = JSONTokenType.Dot
		}
		else {
			type = JSONTokenType.Others
		}
		
		tokens.push({value: m0, type})

		if (bracketStack.length === 0) {
			break
		}

		lastIndex = re.lastIndex
	}

	return tokens
}


function popupTokensWithinBrackets(tokens: JSONToken[], startIndex: number) {
	let startBracket = tokens[startIndex].value
	let endBracket = BracketCharacters[5 - BracketCharacters.indexOf(startBracket)]
	let count = 1
	let removed: JSONToken[] = []

	for (let i = startIndex + 1; i < tokens.length; i++) {
		let {type, value} = tokens[i]
		if (type === JSONTokenType.Bracket) {
			if (value === startBracket) {
				count++
			}
			else if (value === endBracket) {
				count--
			}
		}

		if (count === 0) {
			removed.push(...tokens.splice(startIndex, i - startIndex + 1))
			break
		}
	}

	return removed
}


/** Parse text to json. */
function parseAsJSON(jsonText: string): any {
	try {
		let fn = new Function('return ' + jsonText)
		return fn() 
	}
	catch (err) {
		console.log(err)
		console.log(jsonText)
		return null
	}
}