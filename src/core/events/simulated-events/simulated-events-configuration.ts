export const SimulatedEventsConfiguration = {

	/** How long after pointer down to trigger hold event. */
	becomeHoldAfterDuration: 500,

	/** Will not recognize as tap event if two point event timestamp difference larger than this. */
	maximumDoubleTapDuration: 1000,

	/** If pointer moved pixels more that this, will be recognized as moving. */
	maximumMovelessDistance: 20,

	/** Must move at least this pixels to be recognized as sliding. */
	minimumSlideDistance: 100,

	/** If duration longer, will not be recognized as sliding. */
	maximumSlideDuration: 1000,

	/** The minimum angle from a direction to be recognized as sliding in this direction. */
	minimumSlideAngle: 30,
}