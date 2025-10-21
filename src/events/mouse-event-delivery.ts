/*
 * Assume you are programming a menu and submenu component,
 * When mouse over a menu and open a submenu, previous menu should be kept visible,
 * And after mouse leaves submenu, should hide both menu and submenu.
 * 
 * Example:
 * 	- `trigger1` cause `content1` get popped-up, creates `controller1`.
 * 	- `trigger2` is contained by `content1`, and cause `content2` get popped-up, creates `controller2`.
 *  - `trigger3` is contained by `content2`, and cause `content3` get popped-up, creates `controller3`.
 *
 * So:
 * 	- `trigger1` cause `content1` popped-up, `add event delivery content1 -> trigger1`.
 *  - Mouse leave `trigger1`, nothing happens.
 * 
 *  - `trigger2` cause `content2` popped-up, `add event delivery content2 -> trigger2`.
 *  - Mouse enter `content2`, deliver event to `content1`, to prevent `content1` from hiding.
 *  - Mouse leave `content2`, deliver event to `content1`, cause `content1` also hide.
 */

enum DeliveryActiveState{

	/** 
	 * Means will be released soon, so can be reused.
	 * Normally also means mouse leaves trigger and content.
	 */
	Half,

	/** Means fully activated. */
	Full,
}

interface DeliveryGroup {
	state: DeliveryActiveState
	trigger: Element
	content: Element
	callbacks: (() => void)[]
}


/** Set of all existing DeliveryGroup. */
const DeliveryMap: Set<DeliveryGroup> = /*#__PURE__*/new Set()

/** Map of `a DeliveryGroup -> delivering to DeliveryGroup`. */
const DeliverToMap: Map<DeliveryGroup, DeliveryGroup> = /*#__PURE__*/new Map()


/** Get group by trigger element. */
function getGroupByTrigger(trigger: Element): DeliveryGroup | null {
	for (let existing of DeliveryMap) {
		if (existing.trigger === trigger) {
			return existing
		}
	}

	return null
}


/** 
 * Add an delivery group.
 * Will also clear half releasing.
 */
export function attach(trigger: Element, content: Element) {

	// Avoid adding for twice.
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		cancelHalfRelease(trigger)
		return
	}
	
	let group: DeliveryGroup = {
		state: DeliveryActiveState.Full,
		trigger,
		content,
		callbacks: [],
	}

	for (let existing of DeliveryMap) {
		if (existing.content.contains(trigger)) {
			DeliverToMap.set(group, existing)
			break
		}
	}

	// May be here we need to validate circular reference.
	// Fix it when indeed meet.
	// 1 -> 2; 2 -> 3; 3 -> 1 

	DeliveryMap.add(group)
}


/** Walk delivery from source to target in chain to get groups. */
function* walkInChain(group: DeliveryGroup): Iterable<DeliveryGroup> {
	yield group

	let deliveringTo = DeliverToMap.get(group)
	if (deliveringTo) {
		let hasNoOthersDeliveringTo = true

		for (let [from, to] of DeliverToMap) {
			if (from === group) {
				continue
			}

			if (to === deliveringTo) {
				hasNoOthersDeliveringTo = false
				break
			}
		}

		if (hasNoOthersDeliveringTo) {
			yield* walkInChain(deliveringTo)
		}
	}
}


/** 
 * Will soon release a delivery source by it's trigger, and also all the targets in chain.
 * But right now they enters to a half activated state, means mouse leaves, and can be reused.
 */
export function halfRelease(trigger: Element) {
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		for (let group of walkInChain(existing)) {
			group.state = DeliveryActiveState.Half
		}
	}
}


/** Cancel half release set by `halfRelease`. */
function cancelHalfRelease(trigger: Element) {
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		for (let group of walkInChain(existing)) {
			group.state = DeliveryActiveState.Full
		}
	}
}


/** 
 * Release a delivery source by it's trigger, and also walk for
 * it's delivery targets in chain, and release them.
 */
export function release(trigger: Element) {
	let existing = getGroupByTrigger(trigger)
	if (existing) {

		// Will modify the chain, so must clone it.
		for (let group of [...walkInChain(existing)]) {
			DeliveryMap.delete(group)
			DeliverToMap.delete(group)

			for (let callback of group.callbacks) {
				callback()
			}
		}
	}
}


/** Listen for a delivery source by it's trigger to get callback after it get released. */
export function listenReleasing(trigger: Element, callback: () => void) {
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		existing.callbacks.push(callback)
	}
}


/** 
 * Test whether a group is fully activated.
 * Normally if is `true`, means mouse still in trigger or content of this group.
 */
export function isFullyActivated(trigger: Element): boolean {
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		return existing.state === DeliveryActiveState.Full
	}
	else {
		return false
	}
}


/** 
 * Test whether container contains any content which has been delivered to.
 * Normally if is `true`, means container should not be hidden until sources released.
 */
export function hasAnyDeliveredTo(container: Element): boolean {
	for (let group of DeliveryMap.keys()) {
		if (container.contains(group.trigger)) {
			return true
		}
	}

	return false
}


/** 
 * Test whether container contains content, or contains an element,
 * which's itself or ancestor get delivered to any child or ancestor of container.
 * Means whether event will broadcast from content to container.
 */
export function hasDeliveredFrom(container: Element, content: Element): boolean {
	if (container.contains(content)) {
		return true
	}

	let group: DeliveryGroup | null = null

	for (let g of DeliveryMap) {
		if (g.content.contains(content)) {
			group = g
			break
		}
	}

	if (group) {
		for (let g of walkInChain(group)) {
			if (container.contains(g.trigger)) {
				return true
			}
		}
	}

	return false
}

