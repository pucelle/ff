import {DoubleTapEventProcessor, DoubleTapEvents} from './double-tap'
import {EventFirer} from 'lupos'
import {HoldEventProcessor, HoldEvents, PinchTransformEvents, PinchTransformProcessor, TapEventProcessor, TapEvents, PinchZoomEvents, PinchZoomProcessor, SlideEvents, SlideEventProcessor} from '.'
import {WeakPairKeysMap} from '../../structs'
import {SimulatedEventsConfiguration} from './configuration'


type EventProcessor = EventFirer<any> & {remove: () => void}

/** Simulated events and types. */
type Events = HoldEvents & DoubleTapEvents & PinchTransformEvents & PinchZoomEvents & TapEvents & SlideEvents
type EventType = keyof Events & string


/** Simulated event configurations. */
export const Configuration = SimulatedEventsConfiguration

/** 
 * All the event processor constructors.
 * 
 * Problems here:
 * We want to infer event processor by event name,
 * such that must import all the processors even uses only one.
 * 
 * Or we may pass another processor parameter... this is not good.
 */
const EventConstructors: Record<string, {new(el: EventTarget): EventProcessor}> = {
	'tap': TapEventProcessor,
	'double-tap': DoubleTapEventProcessor,
	'hold': HoldEventProcessor,
	'pinch-transform': PinchTransformProcessor,
	'pinch-zoom': PinchZoomProcessor,
	'slide': SlideEventProcessor,
}

/** Shared Processors. */
const EventProcessorCache: WeakPairKeysMap<EventTarget, string, EventProcessor> = /*#__PURE__*/new WeakPairKeysMap()


/** 
 * Bind a simulated event listener on an event target.
 * Can specify `scope` to identify listener, and will pass it to listener handler.
 */
export function on<T extends EventType>(el: EventTarget, type: T, handler: Events[T], scope: any = null) {
	let processor = getProcessor(el, type)
	processor.on(type, handler, scope)
}


/** 
 * Bind a event listener on event target, triggers for only once.
 * Can specify `scope` to identify listener, and will pass it to listener handler.
 */
export function once<T extends EventType>(el: EventTarget, type: T, handler: Events[T], scope: any = null) {
	let processor = getProcessor(el, type)
	processor.once(type, handler, scope)
}


/** 
 * Unbind simulated event listeners.
 * If listener binds a `scope`, here must match it to remove the listener.
 */
export function off<T extends EventType>(el: EventTarget, type: T, handler: Events[T], scope: any = null) {
	let processor = getProcessor(el, type)
	processor.off(type, handler, scope)

	if (!processor.hasListeners()) {
		processor.remove()
		deleteProcessor(el, type)
	}
}


function getProcessor(el: EventTarget, type: EventType): EventProcessor {
	let groupName = type.replace(/:.+/, '')
	let processor = EventProcessorCache.get(el, groupName)

	if (!processor) {
		let Processor = EventConstructors[groupName]
		processor = new Processor(el)
		EventProcessorCache.set(el, groupName, processor)
	}

	return processor
}


function deleteProcessor(el: EventTarget, type: EventType) {
	let groupName = type.replace(/:.+/, '')
	EventProcessorCache.delete(el, groupName)
}

