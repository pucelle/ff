/** Coord format. */
export interface Coord {
	x: number
	y: number
}

/** Size with width and height. */
export interface SizeLike {
	width: number
	height: number
}

/** Box like format. */
export interface BoxLike {
	x: number
	y: number
	width: number
	height: number
}

/** Matrix abcdef. */
export interface MatrixLike {
	a: number
	b: number
	c: number
	d: number
	e: number
	f: number
}

/** 4 box edge distance keys. */
export type InsetKey = 'top' | 'right' | 'bottom' | 'left'

/** Horizontal or vertical. */
export type HVDirection = 'horizontal' | 'vertical'
