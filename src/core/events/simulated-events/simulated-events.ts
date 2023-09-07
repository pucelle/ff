import {DoubleTapEventProcessor, DoubleTapEvents} from './processors/double-tap'
import {EventFirer} from '../event-firer'
import {HoldEventProcessor, HoldEvents, PinchZoomerEvents, PinchZoomProcessor, TapEventProcessor, TapEvents, RigidPinchZoomerEvents, NonRorationPinchZoomProcessor, SlideEvents, SlideEventProcessor} from './processors'
import {DoubleKeysWeakMap} from 'algorithms'
import {SimulatedEventsConfiguration} from './simulated-events-configuration'


type EventProcessor = EventFirer<any> & {remove: () => void}


/** All the event processor constructors. */
const EventConstructors: Record<string, {new(el: EventTarget): EventProcessor}> = {
	'tap': TapEventProcessor,
	'double-tap': DoubleTapEventProcessor,
	'hold': HoldEventProcessor,
	'pinch-zoom': PinchZoomProcessor,
	'non-rotation-pinch-zoom': NonRorationPinchZoomProcessor,
	'slide': SlideEventProcessor,
}


/** Can help to process complex simulated events. */
export namespace SimulatedEvents {

	/** Simulated event types. */
	export type Events = HoldEvents & DoubleTapEvents & PinchZoomerEvents & RigidPinchZoomerEvents & TapEvents & SlideEvents
	type EventType = keyof Events


	/** Configations. */
	export const configuration = SimulatedEventsConfiguration

	/** Shared Processors. */
	const EventProcessorCache: DoubleKeysWeakMap<EventTarget, string, EventProcessor> = new DoubleKeysWeakMap()


	/** Whether a specified name is simulated event type. */
	export function isSimulatedEventType(name: string): boolean {
		let groupName = name.replace(/:.+/, '')
		return EventConstructors.hasOwnProperty(groupName)
	}


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
	 * If listener bound a `scope`, here must match it to remove the listener.
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
}
