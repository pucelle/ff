import {NumberUtils} from '../utils'


/** Message level. */
export enum LogLevel {
	None = 0,
	Error = 1,
	Warn = 2,
	Log = 3,
	Verbose = 4,
	VeryVerbose = 5,
}


/** 
 * Log different levels of message.
 * Note default log level is `Log`, verbose messages are ignored.
 */
export namespace logger {

	/** Current log level, defaults to `Log`, verbose messages are ignored. */
	export let logLevel = LogLevel.None


	// Log log level.
	if (logLevel !== LogLevel.None) {
		console.log(`Current log level is "${LogLevel[logLevel]}"`)
	}
	

	/** Log verbose message if should. */
	export function verbose(message: string) {
		if (logLevel >= LogLevel.Verbose) {
			console.log('%c' + message, 'color: #999')
		}
	}

	/** Log very verbose message if should. */
	export function veryVerbose(message: string) {
		if (logLevel >= LogLevel.VeryVerbose) {
			console.log('%c' + message, 'color: #bbb')
		}
	}

	/** Log message if should. */
	export function log(message: any) {
		if (logLevel >= LogLevel.Log) {
			console.log(message)
		}
	}

	/** Log warning message if should. */
	export function warn(message: any) {
		if (logLevel >= LogLevel.Warn) {
			console.warn(message)
		}
	}

	/** Log error message if should. */
	export function error(message: any) {
		if (logLevel >= LogLevel.Error) {
			console.error(message)
		}
	}


	/** Recording once target. */
	const OnceTargetMap: Set<string | number> = new Set()

	/** Log normal message if should, only once for specified target. */
	export function logOnce(message: string, target: string | number) {
		if (!OnceTargetMap.has(target)) {
			OnceTargetMap.add(target)
			log(message)
		}
	}

	/** Log warn message if should, only once for specified target. */
	export function warnOnce(message: string, target: string | number) {
		if (!OnceTargetMap.has(target)) {
			OnceTargetMap.add(target)
			warn(message)
		}
	}

	/** Log error message if should, only once for specified target. */
	export function errorOnce(message: string, target: string | number) {
		if (!OnceTargetMap.has(target)) {
			OnceTargetMap.add(target)
			error(message)
		}
	}

	
	/** Start a new time interval counter. */
	export function timeStart(name: string) {
		let startTime = 0

		if (logLevel >= LogLevel.Log) {
			startTime = performance.now()
		}

		return function() {
			if (logLevel >= LogLevel.Log) {
				let endTime = performance.now()
				let costTime = NumberUtils.toDecimal(endTime - startTime, 2)
				let message = `${name} cost ${costTime} ms`

				if (costTime > 10) {
					console.log('%c' + message, 'color: #c80')
				}
				else {
					log(message)
				}
			}
		}
	}
}