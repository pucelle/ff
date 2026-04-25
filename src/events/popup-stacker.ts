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
 * 	- `trigger1` cause `content1` popped-up, `group1` becomes `MouseOn`.
 *  - Mouse leave `trigger1`, `group1` becomes `0`.
 * 
 *  - `trigger2` at `content1` cause `content2` popped-up, `group2` becomes `MouseOn`.
 *  - Mouse enter `content2`, `group1` becomes `Locked`.
 *  - Mouse leave `content2`, release locks in chain, `group1` becomes `Locked`.
 */
enum PopupStateMask {

	/** No lock and mouse off, need to release immediately. */
	None = 0,

	/** 
	 * Mouse leaves both trigger and content of popup group,
	 * but mouse on any descendant stacked popup group.
	 */
	Locked = 1,

	/** 
	 * Mouse already on either trigger or content of popup group.
	 * Note there may 2 active popup groups.
	 */
	MouseOn = 2,
}

interface PopupGroup {
	state: number
	trigger: Element
	content: Element

	/** To call after popup group released. */
	callbacks: (() => void)[]
}


/** Set of all existing popup groups. */
const PopupGroups: Set<PopupGroup> = /*#__PURE__*/new Set()

/** The lock of from the child popup group to parental. */
const PopupLocksMap: Map<PopupGroup, PopupGroup> = /*#__PURE__*/new Map()


/** Get group by trigger element. */
function getPopupGroupByTrigger(trigger: Element): PopupGroup | null {
	for (let existing of PopupGroups) {
		if (existing.trigger === trigger) {
			return existing
		}
	}

	return null
}


/** Add an popup group after mouse enter. */
export function onEnter(trigger: Element, content: Element) {
	let group = getPopupGroupByTrigger(trigger)
	if (group) {
		group.state |= PopupStateMask.MouseOn
	}
	else {
		group = {
			state: PopupStateMask.MouseOn,
			trigger,
			content,
			callbacks: [],
		}

		PopupGroups.add(group)
	}

	let parent: PopupGroup | null = null

	for (let g of PopupGroups) {
		if (g.content.contains(trigger)) {
			parent = g
			break
		}
	}

	if (parent) {
		PopupLocksMap.set(group, parent)

		// No need to handle older ancestors,
		// Mouse already on parent popup group,
		// so older ancestors muse have been locked.
		parent.state |= PopupStateMask.Locked
	}
}


/** 
 * After mouse leave a popup group which can be identified by it's trigger element.
 * Then will check locks to ensure parent release locks, but it will not release
 * current group immediately, but to wait a timeout.
 */
export function onLeave(trigger: Element) {
	let group = getPopupGroupByTrigger(trigger)
	if (!group) {
		return
	}

	group.state &= ~PopupStateMask.MouseOn

	if (group.state === PopupStateMask.None) {
		unlockAncestors(group)
	}
}


function unlockAncestors(group: PopupGroup) {
	for (let g of walkLockedChain(group)) {
		g.state &= ~PopupStateMask.Locked

		// If parent is still mouse on, skip.
		if (g.state !== PopupStateMask.None) {
			break
		}
	}
}


/** 
 * Walk chained parental popup groups from one to it's ancestor.
 * Not include self.
 * If a parent have another child locked it, skip walking it.
 */
function* walkLockedChain(child: PopupGroup): Iterable<PopupGroup> {
	// May be here we need to validate circular reference.
	// Will fix it when we indeed meet.
	// 1 -> 2; 2 -> 3; 3 -> 1 

	let parent = PopupLocksMap.get(child)
	if (parent) {

		// Whether have no other siblings to lock same parent.
		let haveNoOtherSiblingLocks = true

		for (let [from, to] of PopupLocksMap) {
			if (from === child) {
				continue
			}

			if (to === parent) {
				haveNoOtherSiblingLocks = false
				break
			}
		}

		if (haveNoOtherSiblingLocks) {
			yield parent
			yield* walkLockedChain(parent)
		}
	}
}


/** Popup elements will be removed, so here must destroy the related popup group. */
export function destroy(trigger: Element) {
	let group = getPopupGroupByTrigger(trigger)
	if (!group) {
		return
	}

	// Force unlocking.
	if (group.state !== PopupStateMask.None) {
		group.state = PopupStateMask.None
		unlockAncestors(group)
	}

	// Will modify the chain, so must clone it.
	for (let g of [group, ...walkLockedChain(group)]) {
		if (g.state !== PopupStateMask.None) {
			break
		}

		PopupGroups.delete(group)
		PopupLocksMap.delete(group)

		for (let callback of group.callbacks) {
			callback()
		}
	}
}


/** 
 * If mouse out but locked, we should listen for it's destroy time.
 * Listen for the destroy of a popup group by it's trigger element.
 */
export function listenDestroy(trigger: Element, callback: () => void) {
	let group = getPopupGroupByTrigger(trigger)
	if (group) {
		group.callbacks.push(callback)
	}
}


/** Test whether mouse on trigger or popup of a popup group. */
export function isMouseOn(trigger: Element): boolean {
	let existing = getPopupGroupByTrigger(trigger)
	if (existing) {
		return existing.state === PopupStateMask.MouseOn
	}
	else {
		return false
	}
}


/** 
 * Test whether container element contains any content
 * which's popup group has been locked or mouse on.
 * Normally if is `true`, means container should not be hidden.
 */
export function hasLocked(triggerContainer: Element): boolean {
	for (let group of PopupGroups.keys()) {
		if (triggerContainer.contains(group.trigger)
			&& group.state !== PopupStateMask.None
		) {
			return true
		}
	}

	return false
}


/** 
 * Test whether container contains content, or contains an trigger element,
 * which's popup group, or an ancestral popup group contains content.
 */
export function hasContainedOrPopped(triggerContainer: Element, content: Element): boolean {
	if (triggerContainer.contains(content)) {
		return true
	}

	let group: PopupGroup | null = null

	for (let g of PopupGroups) {
		if (g.content.contains(content)) {
			group = g
			break
		}
	}

	if (group) {
		for (let g of walkLockedChain(group)) {
			if (triggerContainer.contains(g.trigger)) {
				return true
			}
		}
	}

	return false
}

