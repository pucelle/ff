interface RegExpConstructor {
	/**
	 * Escape string to a RegExp source, characters like `.` will be encoded as `\.`.
	 * @param source The source string will be escaped.
	 */
	escape (source: string): string
}

// Still a proposal, but it's very useful at string parsing programs.
if (!RegExp.escape) {
	Object.defineProperty(RegExp, 'escape', {
	 	value: function (source: string): string {
			return source.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
		}
	})
}

