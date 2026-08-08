import {toDashCase} from './string-utils'


/** Get dash-cased identifier by enum value. */
export function getIdentifier<V extends string | number>(enumData: {[key: string]: V | string}, value: V): string {
	let key = getValueKeyMap(enumData)[value]
	return toDashCase(key)
}

/** Get enum value from dash-cased identifier. */
export function fromIdentifier<V extends string | number>(enumData: {[key: string]: V | string}, identifier: string): V | undefined {
	return getIdentifierValueMap(enumData)[identifier] as V | undefined
}


/** Get enum key by enum value. */
export function getKey<V extends string | number>(enumData: {[key: string]: V | string}, value: V): string {
	let key = getValueKeyMap(enumData)[value]
	return key
}

/** Get enum value from enum key. */
export function fromKey<V extends string | number>(enumData: {[key: string]: V | string}, key: string): V | undefined {
	return enumData[key] as V | undefined
}


/** Check whether in enum value from an enum. */
export function hasValue<E extends Record<string, string | number>>(enumData: E, value: string | number): value is E[keyof E] {
	return getKey(enumData, value) !== undefined
}

/** Check whether dash-cased identifier existing. */
export function hasIdentifier<V extends string | number>(enumData: {[key: string]: V | string}, identifier: string): boolean {
	return fromIdentifier(enumData, identifier) !== undefined
}

/** Check whether key existing. */
export function hasKey<V extends string | number>(enumData: {[key: string]: V | string}, key: string): boolean {
	return enumData[key] !== undefined
}


const IdentifierValueMap: Map<any, Record<string, string | number>> = /*#__PURE__*/new Map()
const ValueKeyMap: Map<any, Record<string | number, string>> = /*#__PURE__*/new Map()

function getIdentifierValueMap<V extends string | number>(enumData: {[key: string]: V | string}): Record<string, V> {
	let map = IdentifierValueMap.get(enumData) as Record<string, V>
	if (map) {
		return map
	}
	
	map = Object.fromEntries(Object.entries(enumData).map(([key, value]) => [toDashCase(key), value])) as Record<string, V>
	IdentifierValueMap.set(enumData, map)

	return map
}


function getValueKeyMap<V extends string | number>(enumData: {[key: string]: V | string}): Record<V, string> {
	let map = ValueKeyMap.get(enumData) as Record<V, string>
	if (map) {
		return map
	}
	
	map = Object.fromEntries(Object.entries(enumData).map(([key, value]) => [value, key])) as Record<V, string>
	ValueKeyMap.set(enumData, map)

	return map
}