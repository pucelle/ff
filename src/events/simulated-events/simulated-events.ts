import {DoubleTapEventProcessor, DoubleTapEvents} from './double-tap'
import {EventFirer} from 'lupos'
import {HoldEventProcessor, HoldEvents, PinchTransformEvents, PinchTransformProcessor, TapEventProcessor, TapEvents, PinchZoomEvents, PinchZoomProcessor, SlideEvents, SlideEventProcessor} from '.'
import {WeakFirstPairKeysMap} from '../../structs'
import {SimulatedEventsConfig, SimulatedEventsOptions} from './config'


type EventProcessor = EventFirer<any> & {remove: () => void}

/** Simulated events and types. */
export type Events = HoldEvents & DoubleTapEvents & PinchTransformEvents & PinchZoomEvents & TapEvents & SlideEvents
export type EventType = keyof Events & string
export type Options = SimulatedEventsOptions


/** Default simulated event configurations. */
export const Default = SimulatedEventsConfig

/** 
 * All the event processor constructors.
 * 
 * Problems here:
 * We want to infer event processor by event name,
 * such that must import all the processors even uses only one.
 * 
 * Or we may pass another processor parameter... this is not good.
 */
const EventConstructors: Record<string, {new(el: EventTarget, options?: SimulatedEventsOptions): EventProcessor}> = {
	'tap': TapEventProcessor,
	'double-tap': DoubleTapEventProcessor,
	'hold': HoldEventProcessor,
	'pinch-transform': PinchTransformProcessor,
	'pinch-zoom': PinchZoomProcessor,
	'slide': SlideEventProcessor,
}

/** Shared Processors. */
const EventProcessorCache: WeakFirstPairKeysMap<EventTarget, string, EventProcessor> = /*#__PURE__*/new WeakFirstPairKeysMap()


/** 
 * Bind a simulated event listener on an event target.
 * Can specify `scope` to identify listener, and will pass it to listener handler.
 */
export function on<T extends EventType>(el: EventTarget, type: T, handler: Events[T], scope: any = null, options?: SimulatedEventsOptions) {
	let processor = getProcessor(type, el, options)
	processor.on(type, handler, scope)
}


/** 
 * Bind a event listener on event target, triggers for only once.
 * Can specify `scope` to identify listener, and will pass it to listener handler.
 */
export function once<T extends EventType>(el: EventTarget, type: T, handler: Events[T], scope: any = null, options?: SimulatedEventsOptions) {
	let processor = getProcessor(type, el, options)
	processor.once(type, handler, scope)
}


/** 
 * Unbind simulated event listeners.
 * If listener binds a `scope`, here must match it to remove the listener.
 */
export function off<T extends EventType>(el: EventTarget, type: T, handler: Events[T], scope: any = null) {
	let processor = getProcessor(type, el)
	processor.off(type, handler, scope)

	if (!processor.hasListeners()) {
		processor.remove()
		deleteProcessor(type, el)
	}
}


/** Test whether has specified simulated event type. */
export function hasType(type: string): type is EventType {
	let groupName = type.replace(/:.+/, '')
	return EventConstructors.hasOwnProperty(groupName)
}


function getProcessor(type: EventType, el: EventTarget, options?: SimulatedEventsOptions): EventProcessor {
	let groupName = type.replace(/:.+/, '')
	let processor = EventProcessorCache.get(el, groupName)

	if (!processor) {
		let Processor = EventConstructors[groupName]
		processor = new Processor(el, options)
		EventProcessorCache.set(el, groupName, processor)
	}

	return processor
}


function deleteProcessor(type: EventType, el: EventTarget) {
	let groupName = type.replace(/:.+/, '')
	EventProcessorCache.delete(el, groupName)
}

