import {NumberUtils} from '../utils'


//// Reference to: http://iquilezles.org/www/articles/voronoise/voronoise.htm


/** Returns a random integer value within range `min` ~ `max`. */
export function randomInt(min: number, max: number) {
	return min + Math.floor(Math.random() * (max - min + 1))
}

/** Returns a random float value within range `min` ~ `max`. */
export function randomFloat(min: number, max: number) {
	return min + Math.floor(Math.random() * (max - min + 1))
}



/** 
 * Generate a pseudo-random float value in range `0 ~ 1`.
 * Will always return the same value for the same `seed`.
 */
export function seedRandom(seed: number) {
	return NumberUtils.fract(Math.sin(seed * 127.1) * 43758.5453123)
}

/** 
 * Generate 2 pseudo-random float values in range `0 ~ 1`.
 * Will always return the same value for the same `seed`.
 */
export function seedRandom2(v: number): [number, number]{
	return [
		NumberUtils.fract(Math.sin(v * 127.1) * 43758.5453123),
		NumberUtils.fract(Math.sin(v * 269.5) * 43758.5453123),
	]
}

/** 
 * Generate 3 pseudo-random float values in range `0 ~ 1`.
 * Will always return the same value for the same `seed`.
 */
export function seedRandom3(v: number): [number, number, number]{
	return [
		NumberUtils.fract(Math.sin(v * 127.1) * 43758.5453123),
		NumberUtils.fract(Math.sin(v * 269.5) * 43758.5453123),
		NumberUtils.fract(Math.sin(v * 419.2) * 43758.5453123),
	]
}

