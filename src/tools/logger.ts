import {NumberUtils} from '../utils'


/** Message level. */
export const enum LogLevel {
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

	/** 
	 * Start a new time interval counter.
	 * Returns an end function, can pass it a null value to prevent printing message,
	 * or a new value to overwrite message.
	 */
	timeStart(startName?: string): LoggerTimer {
		let timer = new LoggerTimer(this)
		timer.start(startName)

		return timer
	}
}


/** Help to measure time cost. */
export class LoggerTimer {

	private logger: Logger
	private name?: string | undefined
	private running: boolean = false
	private startTime: number = 0
	private cost: number = 0

	constructor(l: Logger = logger) {
		this.logger = l
	}

	start(name?: string) {
		this.name = name
		this.startTime = performance.now()
		this.cost = 0
		this.running = true
	}

	pause() {
		if (!this.running) {
			return
		}

		this.cost += performance.now() - this.startTime
		this.running = false
	}

	resume() {
		if (this.running) {
			return
		}

		this.startTime = performance.now()
	}

	end(name: string | undefined = this.name) {
		this.pause()

		if (name === undefined) {
			return
		}

		if (this.logger.logLevel < LogLevel.Log) {
			return
		}
		
		let cost = this.cost
		let costTime: string

		if (cost > 60000) {
			costTime = NumberUtils.toPrecision(this.cost / 60000, 3) + ' mins'
		}
		else if (cost > 1000) {
			costTime = NumberUtils.toPrecision(this.cost / 1000, 3) + ' secs'
		}
		else {
			costTime = NumberUtils.toPrecision(this.cost, 3) + ' ms'
		}

		let message = `${name} cost ${costTime}`

		if (cost > 300) {
			console.log('%c' + message, 'color: #c00')
		}
		else if (cost > 16) {
			console.log('%c' + message, 'color: #c80')
		}
		else {
			this.logger.log(message)
		}
	}
}


/** 
 * Default log level logger.
 * You may reset it's log level.
 */
export const logger = /*#__PURE__*/new Logger()