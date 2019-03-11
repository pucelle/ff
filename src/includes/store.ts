// 'use strict';
// (function (ff) {



// function KeyMap(key) {
// 	if (!key) {
// 		throw new Error('"key" must be provided!')
// 	}

// 	this.key = key
// 	this.map = {}
// }

// KeyMap.prototype = {

// 	has (item) {
// 		let {key, map} = this
// 		return item[key] in map
// 	},


// 	get (item) {
// 		let {key, map} = this
// 		return map[item[key]]
// 	},


// 	add (item) {
// 		let {key, map} = this
// 		map[item[key]] = item
// 		return this
// 	},


// 	delete (item) {
// 		let {key, map} = this
// 		return delete map[item[key]]
// 	},


// 	clear () {
// 		this.map = {}
// 	},
// }



// //cache object type data and support selectionm ordering and filter
// //events
// //	add(items)
// //	remove(items)
// //	clear
// //	change
// function Store(options, data) {
// 	ff.Emitter.call(this)
// 	this._initOptions(options)
// 	this._initData(data)
// }

// Store.prototype = {

// 	__proto__: ff.Emitter.prototype,

// 	//if key specified, when different but same key items added, it covers the old one
// 	//you need to know that if key is not specified, data cant been observed since it use "symbol" as key
// 	key: null,

// 	filter: null,

// 	//used to sort items, see ff.orderBy
// 	orderBy: null,

// 	_defaultOrderBy: null,

// 	//used to select range by shift key
// 	_lastTouchedItem: null,


// 	_initOptions (options) {
// 		ff.assign(this, options)

// 		this.map = new KeyMap(this.key)
// 		this.allData = []
// 		this.data = []
// 		this.selected = []
// 		this.selectedMap = new KeyMap(this.key)

// 		this._initOrderBy()
// 	},


// 	_initData (data) {
// 		if (data) {
// 			this._add(data, false, false)
// 		}
// 	},


// 	_initOrderBy () {
// 		if (this.orderBy) {
// 			this._defaultOrderBy = this.orderBy = ff._compileOrderBy(this.orderBy)
// 		}
// 	},


// 	getOrderKey () {
// 		if (this.orderBy) {
// 			return this.orderBy[0][0].orderProperty
// 		}
// 		else {
// 			return null
// 		}
// 	},


// 	getOrderDirection () {
// 		if (this.orderBy) {
// 			return this.orderBy[0][1]
// 		}
// 		else {
// 			return null
// 		}
// 	},


// 	restoreOrderBy () {
// 		this.setOrderBy(this._defaultOrderBy)
// 	},


// 	setOrderBy (orderBy) {
// 		if (orderBy !== this.orderBy) {
// 			this.orderBy = orderBy ? ff._compileOrderBy(orderBy) : null

// 			this._updateData()

// 			// this.emit('update')
// 			this.emit('change')
// 		}
// 	},


// 	setFilter (filter) {
// 		if (filter !== this.filter) {
// 			this.filter = filter

// 			this._updateData()
// 			this.deselectAll()

// 			// this.emit('update')
// 			this.emit('change')
// 		}
// 	},


// 	updateData () {
// 		this._updateData()

// 		// this.emit('update')
// 		this.emit('change')
// 	},


// 	//when filter or orderBy changed
// 	_updateData () {
// 		let {allData, filter} = this

// 		this._clearData()
// 		this._addData(filter ? allData.filter(filter) : allData)
// 	},


// 	_clearData () {
// 		this.data = []
// 	},


// 	_addData (items, isHead = false) {
// 		let {data, orderBy} = this

// 		if (orderBy) {
// 			for (let item of items) {
// 				ff.binaryInsert(data, item, orderBy)
// 			}
// 		}
// 		else {
// 			isHead ? data.unshift(...items) : data.push(...items)
// 		}
// 	},


// 	add (...items) {
// 		this._add(items, false, true)
// 		// this.emit('add', items)
// 		this.emit('change')
// 	},


// 	push (...items) {
// 		this._add(items, false, false)
// 		// this.emit('add', items)
// 		this.emit('change')
// 	},


// 	unshift (...items) {
// 		this._add(items, true, false)
// 		// this.emit('add', items)
// 		this.emit('change')
// 	},


// 	insert (index, ...items) {
// 		let {allData, filter, orderBy} = this

// 		if (items.length > 0) {
// 			allData.splice(index, 0, ...items)

// 			for (let item of items) {
// 				map.add(item)
// 			}

// 			if (orderBy) {
// 				this._addData(filter ? items.filter(filter) : items)
// 			}
// 			else {
// 				this._updateData()
// 			}
// 		}

// 		// this.emit('add', items)
// 		this.emit('change')
// 	},


// 	_add (items, isHead, removeRepeated) {
// 		let {key, map, allData, filter} = this

// 		if (items.length > 0) {
// 			if (removeRepeated) {
// 				this.remove(...items)
// 			}

// 			for (let item of items) {
// 				map.add(item)
// 			}

// 			isHead ? allData.unshift(...items) : allData.push(...items)
// 			this._addData(filter ? items.filter(filter) : items, isHead)
// 		}
// 	},


// 	has (item) {
// 		let {map} = this
// 		return map.has(item)
// 	},


// 	get (item) {
// 		let {map} = this
// 		return map.get(item)
// 	},


// 	remove (...items) {
// 		let {map, allData} = this
// 		let removed = []

// 		if (items.length) {
// 			for (let item of items) {
// 				if (map.has(item)) {
// 					removed.push(map.get(item))
// 					map.delete(item)
// 				}
// 			}

// 			if (removed.length > 0) {
// 				this._removeItemsFromArray(allData, removed)
// 				this._removeData(removed)
// 				this.deselect(...removed)

// 				// this.emit('remove', items)
// 				this.emit('change')
// 			}
// 		}

// 		return removed
// 	},


// 	_removeItemsFromArray (data, items) {
// 		let {key} = this
// 		let map = ff.index(items.map(item => item[key]))
// 		let removed = ff.removeWhere(data, item => map[item[key]])

// 		return removed
// 	},


// 	_removeData (items) {
// 		this._removeItemsFromArray(this.data, items)
// 	},


// 	isSelected (item) {
// 		let {selectedMap} = this
// 		return selectedMap.has(item)
// 	},


// 	isPartlySelected () {
// 		let selectedCount = this.selected.length
// 		return selectedCount > 0 && selectedCount < this.data.length
// 	},


// 	isSelectedAll () {
// 		let selectedCount = this.selected.length
// 		return selectedCount > 0 && selectedCount === this.data.length
// 	},


// 	getSelectedCount () {
// 		return this.selected.length
// 	},


// 	select (...items) {
// 		let {selected, selectedMap} = this

// 		for (let item of items) {
// 			if (!selectedMap.has(item)) {
// 				selected.push(item)
// 				selectedMap.add(item)
// 			}
// 		}

// 		this._lastTouchedItem = items[0]
// 	},


// 	deselect (...items) {
// 		let {selected, selectedMap} = this

// 		if (items === selected) {
// 			this.deselectAll()
// 		}
// 		else {
// 			let removed = []

// 			for (let item of items) {
// 				if (selectedMap.has(item)) {
// 					removed.push(selectedMap.get(item))
// 					selectedMap.delete(item)
// 				}
// 			}

// 			this._removeItemsFromArray(selected, removed)
// 		}

// 		this._lastTouchedItem = items[0]
// 	},


// 	toggleSelect (item) {
// 		if (this.isSelected(item)) {
// 			this.deselect(item)
// 		}
// 		else {
// 			this.select(item)
// 		}

// 		this._lastTouchedItem = item
// 	},


// 	selectByEvent (item, event) {
// 		if (event.shiftKey) {
// 			this.shiftSelect(item)
// 		}
// 		else {
// 			this.toggleSelect(item)
// 		}
// 	},


// 	shiftSelect (item) {
// 		let startIndex = Math.max(this._lastTouchedItem ? this.getIndex(this._lastTouchedItem) : 0, 0)
// 		let endIndex = this.getIndex(item)

// 		if (endIndex >= 0) {
// 			if (startIndex > endIndex) {
// 				[startIndex, endIndex] = [endIndex, startIndex]
// 			}

// 			endIndex += 1

// 			if (this.isSelected(item)) {
// 				this.deselect(...this.data.slice(startIndex, endIndex))
// 			}
// 			else {
// 				this.select(...this.data.slice(startIndex, endIndex))
// 			}
// 		}
// 	},


// 	getIndex (item) {
// 		let {key, map, data} = this
// 		if (!map.has(item)) {
// 			return -1
// 		}

// 		return data.findIndex(itemOfData => itemOfData[key] == item[key])
// 	},


// 	selectAll () {
// 		this.select(...this.data)
// 	},


// 	deselectAll () {
// 		this.selected = []
// 		this.selectedMap.clear()
// 	},


// 	toggleSelectAll () {
// 		if (this.isSelectedAll()) {
// 			this.deselectAll()
// 		}
// 		else {
// 			this.selectAll()
// 		}
// 	},


// 	clear () {
// 		this.allData = []
// 		this.map.clear()
// 		this._clearData()
// 		this.deselectAll()

// 		// this.emit('clear')
// 		this.emit('change')
// 	},
// }



// //used to group items by one or more group by function or property
// /*
// [
// 	2017-08-27
// 	2017-08-28
// ] ->
// {
// 	keys: [2017]
// 	hash: {
// 		2017: {
// 			keys: [08]
// 			hash: {
// 				08: {
// 					keys: [27, 28]
// 					hash: {
// 						27: [2017-08-27]
// 						28: [2017-08-28]
// 					}
// 				}
// 			}
// 		}
// 	}
// }
// */
// function GroupStore(options, data) {
// 	ff.Emitter.call(this)
// 	this._initOptions(options)
// 	this._initData(data)
// }

// GroupStore.prototype = {

// 	__proto__: Store.prototype,

// 	groupBy: null,

// 	//if specified, use it to sort keys, not orderBy
// 	keyOrderBy: null,

// 	insert: null,


// 	_initOptions (options) {
// 		Store.prototype._initOptions.call(this, options)

// 		this.keys = []
// 		this.hash = {}

// 		this._initKeyOrderBy()
// 		this._initGroupBy()
// 	},


// 	_initData (data) {
// 		if (data) {
// 			this._add(data, false, false)
// 		}
// 	},


// 	_initKeyOrderBy () {
// 		if (this.keyOrderBy) {
// 			this.keyOrderBy = this.keyOrderBy ? ff._compileOrderBy(this.keyOrderBy) : null
// 		}
// 	},


// 	_initGroupBy () {
// 		if (!this.groupBy) {
// 			throw new Error('The "groupBy" option must exist')
// 		}

// 		if (!Array.isArray(this.groupBy)) {
// 			this.groupBy = [this.groupBy]
// 		}

// 		this.groupBy = this.groupBy.map(prop => ff._getPropertyFn(prop))
// 	},


// 	setKeyOrderBy (keyOrderBy) {
// 		if (keyOrderBy !== this.keyOrderBy) {
// 			this.keyOrderBy = keyOrderBy ? ff._compileOrderBy(keyOrderBy) : null

// 			this._updateData()

// 			this.emit('update')
// 			this.emit('change')
// 		}
// 	},


// 	setGroupBy (groupBy) {
// 		if (groupBy !== this.groupBy) {
// 			this.groupBy = groupBy
// 			this._initGroupBy()

// 			this._updateData()
// 			this.deselectAll()

// 			this.emit('update')
// 			this.emit('change')
// 		}
// 	},


// 	_clearData () {
// 		Store.prototype._clearData.call(this)

// 		this.keys = []
// 		this.hash = {}
// 	},


// 	_addData (items, isHead) {
// 		Store.prototype._addData.call(this, items, isHead)

// 		let {filter, orderBy, keyOrderBy, groupBy} = this

// 		for (let item of items) {
// 			let groupKeys = this.groupBy.map(fn => fn(item))
// 			let {keys, hash} = this

// 			for (let i = 0, len = groupKeys.length; i < len; i++) {
// 				let key = groupKeys[i]
// 				let isLast = i === len - 1
// 				let nextGroup = hash[key]

// 				if (!nextGroup) {
// 					if (keyOrderBy && keyOrderBy[i]) {
// 						ff.binaryInsert(keys, key, [keyOrderBy[i]])
// 					}
// 					else {
// 						isHead ? keys.unshift(key) : keys.push(key)
// 					}

// 					if (isLast) {
// 						nextGroup = hash[key] = []
// 					}
// 					else {
// 						nextGroup = hash[key] = {
// 							keys: [],
// 							hash: {},
// 						}
// 					}
// 				}

// 				if (isLast) {
// 					if (orderBy) {
// 						ff.binaryInsert(nextGroup, item, orderBy)
// 					}
// 					else {
// 						isHead ? nextGroup.unshift(item) : nextGroup.push(item)
// 					}
// 				}
// 				else {
// 					({keys, hash} = nextGroup)
// 				}
// 			}
// 		}
// 	},


// 	_removeData (items) {
// 		Store.prototype._removeData.call(this, items)

// 		let thisKey = this.key

// 		let map = {}
// 		for (let item of items) {
// 			map[item[thisKey]] = true
// 		}

// 		//groups: []
// 		this.walk((item, groupsAndKeys) => {
// 			if (map[item[thisKey]]) {
// 				let [group, key] = groupsAndKeys.pop()
// 				let data = group.hash[key]

// 				ff.remove(data, item)

// 				if (data.length === 0) {
// 					ff.remove(group.keys, key)
// 					delete group.hash[key]

// 					while (group.keys.length === 0 && groupsAndKeys.length > 0) {
// 						[group, key] = groupsAndKeys.pop()
// 						ff.remove(group.keys, key)
// 						delete group.hash[key]
// 					}
// 				}
// 			}
// 		})
// 	},


// 	walk (fn) {
// 		//may remove item when walking
// 		for (let key of [...this.keys]) {
// 			this._walk([[this, key]], fn)
// 		}
// 	},


// 	_walk (groupsAndKeys, fn) {
// 		let lastGroupsAndKeys = groupsAndKeys[groupsAndKeys.length - 1]
// 		let [group, key] = lastGroupsAndKeys
// 		let isLastGroup = groupsAndKeys.length === this.groupBy.length

// 		if (isLastGroup) {
// 			for (let item of [...group.hash[key]]) {
// 				fn(item, [...groupsAndKeys])
// 			}
// 		}
// 		else {
// 			let nextGroup = group.hash[key]
// 			for (let key of [...nextGroup.keys]) {
// 				this._walk([...groupsAndKeys, [nextGroup, key]], fn)
// 			}
// 		}
// 	},


// 	hasKeys (...keys) {
// 		if (keys.length > this.groupBy.length) {
// 			throw new Error(`Key count must be less or equal than "${this.groupBy.length}"`)
// 		}

// 		let group = this._getGroupByKeys(keys)

// 		if (group) {
// 			return true
// 		}
// 		else {
// 			return false
// 		}
// 	},


// 	getKeys (...keys) {
// 		if (keys.length >= this.groupBy.length) {
// 			throw new Error(`Key count must be less than "${this.groupBy.length}"`)
// 		}

// 		let group = this._getGroupByKeys(keys)
// 		if (!group) {
// 			return
// 		}

// 		let {hash} = group
// 		let index = []

// 		return group.keys
// 	},


// 	getDataByKeys (...keys) {
// 		let group = this._getGroupByKeys(keys)

// 		if (!group) {
// 			return null
// 		}

// 		return this._getItemsInGroup(group)
// 	},


// 	_getGroupByKeys (groupKeys) {
// 		let group = this

// 		for (let key of groupKeys) {
// 			group = group.hash[key]

// 			if (!group) {
// 				return null
// 			}
// 		}

// 		return group
// 	},


// 	_getItemsInGroup (group) {
// 		let {filter} = this

// 		if (Array.isArray(group)) {
// 			return group
// 		}
// 		else {
// 			let items = []
// 			let {keys, hash} = group

// 			for (let key of keys) {
// 				items.push(...this._getItemsInGroup(hash[key]))
// 			}

// 			return items
// 		}
// 	},


// 	getFirstByKeys (...keys) {
// 		let group = this._getGroupByKeys(keys)

// 		if (!group) {
// 			return null
// 		}

// 		return this._getFirstItemInGroup(group)
// 	},


// 	_getFirstItemInGroup (group) {
// 		let {filter} = this

// 		if (Array.isArray(group)) {
// 			return group[0]
// 		}
// 		else {
// 			let items = []
// 			let {keys, hash} = group
// 			let firstKey = keys[0]
// 			let firstItem = this._getFirstItemInGroup(hash[firstKey])

// 			return firstItem
// 		}
// 	},


// 	isPartlySelectedByKeys (...keys) {
// 		let {selected, selectedMap} = this
// 		let items = this.getDataByKeys(...keys)
// 		let selectedCount = 0

// 		if (items && items.length > 0 && selected.length > 0) {
// 			for (let item of items) {
// 				if (selectedMap.has(item)) {
// 					selectedCount++
// 				}
// 			}

// 			return selectedCount > 0 && selectedCount < items.length
// 		}
// 		else {
// 			return false
// 		}
// 	},


// 	isSelectedAllByKeys (...keys) {
// 		let {selected, selectedMap} = this
// 		let items = this.getDataByKeys(...keys)

// 		if (items && items.length > 0 && selected.length >= items.length) {
// 			for (let item of items) {
// 				if (!selectedMap.has(item)) {
// 					return false
// 				}
// 			}

// 			return true
// 		}
// 		else {
// 			return false
// 		}
// 	},


// 	getSelectedCountByKeys (...keys) {
// 		let {selectedMap} = this
// 		let items = this.getDataByKeys(...keys)
// 		let selectedCount = 0

// 		if (items && items.length > 0) {
// 			for (let item of items) {
// 				if (selectedMap.has(item)) {
// 					selectedCount++
// 				}
// 			}

// 			return selectedCount
// 		}
// 		else {
// 			return 0
// 		}
// 	},


// 	selectByKeys (...keys) {
// 		let items = this.getDataByKeys(...keys)

// 		if (items && items.length > 0) {
// 			this.select(...items)
// 		}
// 	},


// 	deselectByKeys (...keys) {
// 		let items = this.getDataByKeys(...keys)

// 		if (items && items.length > 0) {
// 			this.deselect(...items)
// 		}
// 	},


// 	toggleSelectByKeys (...keys) {
// 		if (this.isSelectedAllByKeys(...keys)) {
// 			this.deselectByKeys(...keys)
// 		}
// 		else {
// 			this.selectByKeys(...keys)
// 		}
// 	},
// }



// ff.data = {
// 	Store,
// 	GroupStore,
// }



// })(ff);