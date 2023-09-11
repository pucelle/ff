/** Polyfill `[].flat`. */
if (!Array.prototype.flat) {
	Object.defineProperty(Array.prototype, 'flat', {
		configurable: false,
 		enumerable: false,
	 	value: function (this: any[], depth: number = 1): any[] {
			return [...flatIterate(this, depth)]
		}
	})
}

function *flatIterate<T extends any>(arr: Iterable<T | T[]>, depth: number): Iterable<T> {
    for (let item of arr) {
        if (Array.isArray(item) && depth > 0) {
            yield *flatIterate(item, depth - 1)
        }
		else {
            yield item as T
        }
    }
}


/** Polyfill `Object.fromEntries`. */
if (!Object.fromEntries) {
	Object.defineProperty(Object, 'fromEntries', {
		configurable: false,
 		enumerable: false,
	 	value: function fromEntries<K extends string | number, V>(iterable: Iterable<[K, V]>): Record<string, V> {
			let o: Record<K, V> = {} as any
		
			for (let [key, value] of iterable) {
				o[key] = value
			}
		
			return o
		}		
	})
}


interface RegExpConstructor {

	/** Escape string to a RegExp source, characters like `.` will be encoded as `\.`. */
	escape (source: string): string
}

// Still a proposal, but it's useful when doing string parsing.
if (!RegExp.escape) {
	Object.defineProperty(RegExp, 'escape', {
	 	value: function (source: string): string {
			return source.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
		}
	})
}


/** 
 * Polyfill `Crypto.randomUUID`.
 * https://stackoverflow.com/a/2117523/2800218
 */
 if (!crypto.randomUUID) {
	Object.defineProperty(crypto, 'randomUUID', {
		configurable: false,
 		enumerable: false,
		value: function randomUUID() {
			return '10000000-1000-4000-8000-100000000000'.replace(
				/[018]/g,
				(c: string) => {
					let n = Number(c)
					return (n ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> n / 4).toString(16)
				}
			)
		}
	})
}

