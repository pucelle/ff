/** Context is a component instance or null, used to bind scope for event handler. */
type Context = any | null


/** Any updatable classes. */
interface Updatable {

	/** 
	 * Whether needs update.
	 * Only when true current object needs to be updated.
	 * Will be reset to false when handing queue update.
	 * Note it should be initialized as `false`.
	 */
	needsUpdate: boolean

	/** 
	 * Enqueue a update request if not yet.
	 * It should set `needsUpdate` to `true` inside.
	 */
	willUpdate(): void

	/** 
	 * Update immediately.
	 * Should not set `needsUpdate` to `false` inside,
	 * the place where it calls `update` should set this.
	 * For paint element we strongly suggest you should not call `update` manually,
	 * or depedency capturing steps will be lost.
	 */
	update(): void
}

/** Events of Updatable. */
interface UpdatableEvents {

	/** Will update, and should enqueue a update request. */
	'will-update': () => void
}
