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


/** Log different levels of message. */
export class Logger {

	/** Current log level, defaults to `Log`, verbose messages are ignored. */
	logLevel = LogLevel.None
	
	/** Recording once target. */
	private onceTargetMap: Set<string | number> = new Set()

	/** Default log level is `Log`, verbose messages are ignored. */
	constructor(logLevel: LogLevel = LogLevel.Log) {
		this.logLevel = logLevel
	}
	
	/** Log verbose message if should. */
	verbose(message: string) {
		if (this.logLevel >= LogLevel.Verbose) {
			console.log('%c' + message, 'color: #999')
		}
	}

	/** Log very verbose message if should. */
	veryVerbose(message: string) {
		if (this.logLevel >= LogLevel.VeryVerbose) {
			console.log('%c' + message, 'color: #bbb')
		}
	}

	/** Log message if should. */
	log(message: any) {
		if (this.logLevel >= LogLevel.Log) {
			console.log(message)
		}
	}

	/** Log warning message if should. */
	warn(message: any) {
		if (this.logLevel >= LogLevel.Warn) {
			console.warn(message)
		}
	}

	/** Log error message if should. */
	error(message: any) {
		if (this.logLevel >= LogLevel.Error) {
			console.error(message)
		}
	}


	/** Log normal message if should, only once for specified target. */
	logOnce(message: string, target: string | number) {
		if (!this.onceTargetMap.has(target)) {
			this.onceTargetMap.add(target)
			this.log(message)
		}
	}

	/** Log warn message if should, only once for specified target. */
	warnOnce(message: string, target: string | number) {
		if (!this.onceTargetMap.has(target)) {
			this.onceTargetMap.add(target)
			this.warn(message)
		}
	}

	/** Log error message if should, only once for specified target. */
	errorOnce(message: string, target: string | number) {
		if (!this.onceTargetMap.has(target)) {
			this.onceTargetMap.add(target)
			this.error(message)
		}
	}

	/** Start a new time interval counter. */
	timeStart(name: string) {
		let startTime = 0

		if (this.logLevel >= LogLevel.Log) {
			startTime = performance.now()
		}

		return () => {
			if (this.logLevel >= LogLevel.Log) {
				let endTime = performance.now()
				let costTime = NumberUtils.toDecimal(endTime - startTime, 2)
				let message = `${name} cost ${costTime} ms`

				if (costTime > 300) {
					console.log('%c' + message, 'color: #c00')
				}
				else if (costTime > 15) {
					console.log('%c' + message, 'color: #c80')
				}
				else {
					this.log(message)
				}
			}
		}
	}
}

/** Default log level logger. */
export const logger = new Logger()