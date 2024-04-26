type AnimationFrameCallback = (timestamp: number) => void


let idSeed = 1
let currentCallbackMap: Map<number, AnimationFrameCallback> = new Map()
let nextCallbackMap: Map<number, AnimationFrameCallback> = new Map()
let nextFrameId: number | null = null
let inCurrentFrame: boolean = false
let currentTimestamp: number = 0


/** 
 * Request for current animation frame.
 * If current animation frame is started, calls callback soon.
 */
export function requestCurrent(callback: AnimationFrameCallback): number {
	if (inCurrentFrame) {
		let id = idSeed++
		let emptyBefore = currentCallbackMap.size === 0

		currentCallbackMap.set(id, callback)

		if (emptyBefore) {
			processCallbacks()
		}

		return id
	}
	else {
		return requestNext(callback)
	}
}


/** 
 * Request for next animation frame.
 * Equals to `requestAnimationFrame`.
 */
export function requestNext(callback: AnimationFrameCallback): number {
	let id = idSeed++
	nextCallbackMap.set(id, callback)

	if (nextFrameId === null) {
		nextFrameId = requestAnimationFrame(onNextFrame)
	}

	return id
}


/** Cancel animation frame. */
export function cancel(id: number) {
	currentCallbackMap.delete(id)
	nextCallbackMap.delete(id)
}


async function processCallbacks() {
	while (currentCallbackMap.size > 0) {

		// Cant call immediately, id is not returned yet.
		await Promise.resolve()

		for (let id of currentCallbackMap.keys()) {
			currentCallbackMap.get(id)!(currentTimestamp)
			currentCallbackMap.delete(id)
			break
		}
	}
}


function onNextFrame(timestamp: number) {
	nextFrameId = null
	inCurrentFrame = true
	currentTimestamp = timestamp
	currentCallbackMap = nextCallbackMap
	nextCallbackMap = new Map()
	processCallbacks()

	// Current frame is sent after timeout.
	setTimeout(function() {
		inCurrentFrame = false
	}, 0)
}

