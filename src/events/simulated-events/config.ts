/** The default configuration for simulated events. */
export const SimulatedEventsConfig = {

	/** How long after pointer down to trigger hold event. */
	becomeHoldAfterDuration: 500,

	/** Will not recognize as tap event if two point event timestamp difference larger than this. */
	maximumDoubleTapDuration: 1000,

	/** If pointer moved pixels more that this, will be recognized as moving. */
	maximumMovelessDistance: 15,

	/** Must move at least this pixels to be recognized as sliding. */
	minimumSlideDistance: 40,

	/** If duration longer, will not be recognized as sliding. */
	maximumSlideDuration: 1000,

	/** The minimum angle from a direction can be recognized as sliding in this direction. */
	minimumSlideAngle: 30,
}

/** All options for simulated events. */
export interface SimulatedEventsOptions extends Partial<typeof SimulatedEventsConfig> {

	/** Whether prevent default. */
	prevent?: boolean

	/** Whether stop propagation. */
	stop?: boolean
}