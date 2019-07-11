/*Polyfill for parts of ECMAScript 2017+, which is not widely supported by modern browsers*/

if (!String.prototype.padStart) {
	Object.defineProperty(String.prototype, 'padStart', {
		value: function (length: number, fillString: string) {
			let len = this.length
			let lenPad = fillString.length

			if (length < len || !lenPad) {
				return String(this)
			}
			else {
				let repeatCount = Math.floor((length - len) / lenPad)
				let additionStr = fillString.slice(0, length - len - repeatCount * lenPad)
				return fillString.repeat(repeatCount) + additionStr + this
			}
		}
	})
}

if (!String.prototype.padEnd) {
	Object.defineProperty(String.prototype, 'padEnd', {
		value: function (length: number, fillString: string) {
			let len = this.length
			let lenPad = fillString.length

			if (length < len || !lenPad) {
				return String(this)
			}
			else {
				let repeatCount = Math.floor((length - len) / lenPad)
				let additionStr = fillString.slice(0, length - len - repeatCount * lenPad)
				return this + fillString.repeat(repeatCount) + additionStr
			}
		}
	})
}


interface RegExpConstructor {
	/**
	 * Escape string to be RegExp source.
	 * @param source The source string which will be escaped.
	 */
	escape (source: string): string
}

// Still a proposal, but I love it.
if (!RegExp.escape) {
	Object.defineProperty(RegExp, 'escape', {
	 	value: function (source: string): string {
			return source.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
		}
	})
}

