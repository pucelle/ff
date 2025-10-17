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

interface TriggerContentGroup {
	trigger: Element
	content: Element
	callbacks: (() => void)[]
}


/** Set of all existing TriggerContentGroup. */
const DeliveryMap: Set<TriggerContentGroup> = /*#__PURE__*/new Set()

/** Map of `a TriggerContentGroup -> delivering to TriggerContentGroup`. */
const DeliverToMap: Map<TriggerContentGroup, TriggerContentGroup> = /*#__PURE__*/new Map()


/** Get group by trigger element. */
function getGroupByTrigger(trigger: Element): TriggerContentGroup | null {
	for (let existing of DeliveryMap) {
		if (existing.trigger === trigger) {
			return existing
		}
	}

	return null
}


/** Add an event delivery. */
export function add(trigger: Element, content: Element) {

	// Avoid adding for twice.
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		return
	}
	
	let group: TriggerContentGroup = {
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

/** Delete an event delivery. */
export function remove(trigger: Element) {
	let existing = getGroupByTrigger(trigger)
	if (existing) {
		release(existing)
	}
}

/** Release a group. */
function release(group: TriggerContentGroup) {
	DeliveryMap.delete(group)

	for (let callback of group.callbacks) {
		callback()
	}

	let deliveringTo = DeliverToMap.get(group)
	if (deliveringTo) {
		DeliverToMap.delete(group)
		let hasNoOthersDeliveringTo = true

		for (let value of DeliverToMap.values()) {
			if (value === deliveringTo) {
				hasNoOthersDeliveringTo = false
				break
			}
		}

		if (hasNoOthersDeliveringTo) {
			release(deliveringTo)
		}
	}
}


/** Test whether container contains any content which has been delivered to. */
export function containsAnyDelivered(container: Element): boolean {
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
 */
export function containsDelivered(container: Element, content: Element): boolean {
	if (container.contains(content)) {
		return true
	}

	let group: TriggerContentGroup | null = null

	for (let g of DeliveryMap) {
		if (g.content.contains(content)) {
			group = g
			break
		}
	}

	while (group) {
		if (container.contains(group.trigger)) {
			return true
		}

		group = DeliverToMap.get(group) ?? null
	}

	return false
}


/** Listen for if all event deliveries released which attaching on container. */
export function listenReleasing(trigger: Element, callback: () => void) {
	for (let existing of DeliveryMap) {
		if (existing.trigger === trigger) {
			existing.callbacks.push(callback)
			break
		}
	}
}