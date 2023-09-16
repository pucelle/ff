/** Coord format. */
interface Coord {
	x: number
	y: number
}

/** Size with width and height. */
interface SizeLike {
	width: number
	height: number
}

/** Box like format. */
interface BoxLike {
	x: number
	y: number
	width: number
	height: number
}

/** Matrix abcdef. */
interface MatrixData {
	a: number
	b: number
	c: number
	d: number
	e: number
	f: number
}

/** 4 box edge distance keys. */
type BoxEdgeDistanceKey = 'top' | 'right' | 'bottom' | 'left'

/** Horizontal or vertical. */
type HVDirection = 'horizontal' | 'vertical'
