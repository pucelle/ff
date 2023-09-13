import {NumberUtils} from '../utils'


/** RGBA color object, all value between `0~1`. */
interface RGBA {
	r: number
	g: number
	b: number
	a: number
}

/** HSLA color object, h value between `0~6`, others `0~1`. */
interface HSLA {
	h: number
	s: number
	l: number
	a: number
}


/** Parse or make a color across different color formats. */
export class Color {

	/**
	 * Parse color string to a Color object.
	 * Supported formats includes:
	 * HEX: `#368`, `#123456`, '#00000000'.
	 * RGB: `RGB(200, 200, 0)`, `RGBA(200, 200, 200, 0.5)`, `RGBA(#000, 0.5)`.
	 * HSL: `HSL(100, 60%, 80%)`, `HSLA(100, 60%, 80%, 0.5)`.
	 */
	static fromString(str: string): Color | null {
		let rgba: RGBA | null = null

		// transparent.
		if (str === 'transparent' || str === 'none' || str === '') {
			rgba = {r: 0, g: 0, b: 0, a: 0}
		}

		// hex.
		if (/^#[0-9a-f]{3,8}$/i.test(str)) {
			rgba = ColorHelper.parseHEX(str)
		}

		// rgb, rgba.
		else if (/^(rgba?)/i.test(str)) {
			rgba = ColorHelper.parseRGBA(str)
		}
		
		// hsl.
		else if (/^(hsla?)/i.test(str)) {
			let hsla = ColorHelper.parseHSLA(str)
			if (hsla) {
				rgba = ColorHelper.HSLA2RGBA(hsla)
			}
		}

		if (rgba) {
			let {r, g, b, a} = rgba
			return new Color(r, g, b, a)
		}

		return null
	}

	/** 
	 * Make a color from HSL values.
	 * H betweens `0~6`, SL betweens `0~1`.
	 */
	static fromHSL(h: number, s: number, l: number): Color {
		let rgba = ColorHelper.HSLA2RGBA({h, s, l, a: 1})
		let {r, g, b, a} = rgba

		return new Color(r, g, b, a)
	}

	/** 
	 * Make a color from HSLA values.
	 * H betweens `0~6`, SLA betweens `0~1`.
	 */
	static fromHSLA(h: number, s: number, l: number, a: number): Color {
		let rgba = ColorHelper.HSLA2RGBA({h, s, l, a})
		let {r, g, b} = rgba
		
		return new Color(r, g, b, a)
	}

	/** 
	 * Improve contrast of a color string compare with another color string.
	 * `minimumLightContrast` specifies the minimum light difference.
	 * `inverseRate` specifies the minimum light difference rate when the color value exceed.
	 */
	static improveColorStringContrast(
		improveColorString: string,
		compareColorString: string,
		minimumLightContrast: number = 0.2,
		minimumLightContrastRateToInverse: number = 0.5
	): string {
		if (improveColorString === 'transparent' || improveColorString === 'none') {
			return improveColorString
		}

		let improveColor = Color.fromString(improveColorString)
		let compareColor = Color.fromString(compareColorString)

		if (!improveColor || !compareColor) {
			return improveColorString
		}

		return improveColor.improveContrast(compareColor, minimumLightContrast, minimumLightContrastRateToInverse).toString()
	}

	/** Estimate whether two color strings represent the same color. */
	static colorStringEquals(color1: string, color2: string): boolean {
		if (color1 === color2) {
			return true
		}

		let c1 = Color.fromString(color1)
		let c2 = Color.fromString(color2)

		if (!c1 || !c2) {
			return false
		}

		return c1.equals(c2)
	}


	/** Red channel, betweens `0~1`. */
	r: number

	/** Green channel, betweens `0~1`. */
	g: number

	/** Blue channel, betweens `0~1`. */
	b: number

	/** Alpha channel, betweens `0~1`. */
	a: number

	constructor(r: number, g: number, b: number, a: number = 1) {
		this.r = r
		this.g = g
		this.b = b
		this.a = a
	}

	/** Clone current color, returns a new color. */
	clone() {
		return new Color(this.r, this.g, this.b, this.a)
	}

	/** Test whether equals another color. */
	equals(c: Color): boolean {
		return this.r === c.r
			&& this.g === c.g
			&& this.b === c.b
			&& this.a === c.a
	}

	/** Convert to `rgb(...)` format. */
	toRGB(): string {
		let {r, g, b} = this

		r = NumberUtils.clamp(Math.round(r * 255), 0, 255)
		g = NumberUtils.clamp(Math.round(g * 255), 0, 255)
		b = NumberUtils.clamp(Math.round(b * 255), 0, 255)

		return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
	}

	/** Convert to `rgba(...)` format. */
	toRGBA(): string {
		let {r, g, b, a} = this

		r = NumberUtils.clamp(Math.round(r * 255), 0, 255)
		g = NumberUtils.clamp(Math.round(g * 255), 0, 255)
		b = NumberUtils.clamp(Math.round(b * 255), 0, 255)
		a = NumberUtils.clamp(NumberUtils.toDecimal(a, 3), 0, 1)

		return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
	}

	/** Convert to `#XXXXXX` format. */
	toHEX(): string {
		let {r, g, b, a} = this

		r = NumberUtils.clamp(Math.round(r * 255), 0, 255)
		g = NumberUtils.clamp(Math.round(g * 255), 0, 255)
		b = NumberUtils.clamp(Math.round(b * 255), 0, 255)
		a = NumberUtils.clamp(NumberUtils.toDecimal(a, 3), 0, 1)

		if (this.a < 1) {
			return '#' + [r, g, b, a].map(v => v.toString(16).padStart(2, '0')).join('')
		}
		else {
			return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
		}
	}

	/** Convert to `HSL(...)` format. */
	toHSL() {
		let hsla = ColorHelper.RGBA2HSLA(this)
		let {h, s, l} = hsla

		h = NumberUtils.clamp(Math.round(h * 60), 0, 360)
		s = NumberUtils.clamp(Math.round(s * 100), 0, 100)
		l = NumberUtils.clamp(Math.round(l * 100), 0, 100)

		return `hsl(${h}, ${s}%, ${l}%)`
	}

	/** Convert to `HSLA(...)` format. */
	toHSLA() {
		let hsla = ColorHelper.RGBA2HSLA(this)
		let {h, s, l, a} = hsla

		h = NumberUtils.clamp(Math.round(h * 60), 0, 360)
		s = NumberUtils.clamp(Math.round(s * 100), 0, 100)
		l = NumberUtils.clamp(Math.round(l * 100), 0, 100)
		a = NumberUtils.clamp(NumberUtils.toDecimal(a, 3), 0, 1)

		return `hsla(${h}, ${s}%, ${l}%, ${a})`
	}

	/** Get average of RGB, `0~1`. */
	getAverageGray() {
		return (this.r + this.g + this.b) / 3
	}

	/** Darken color. */
	darken(rate: number): Color {
		return this.lighten(-rate)
	}

	/** Lighten color. */
	lighten(rate: number): Color {
		let {r, g, b, a} = this

		r += rate
		g += rate
		b += rate

		return new Color(r, g, b, a)
	}

	/** Mix with another color, by `rate`. */
	mix(c: Color, rate: number): Color {
		return new Color(
			this.r * (1 - rate) + c.r * rate,
			this.g * (1 - rate) + c.g * rate,
			this.b * (1 - rate) + c.b * rate,
			this.a * (1 - rate) + c.a * rate,
		)
	}

	/** Convert to RGB or RGBA format. */
	toString() {
		if (this.a === 1) {
			return this.toHEX()
		}

		return this.toRGBA()
	}

	/** 
	 * Improve contrast compare with another color.
	 * `minimumLightContrast` specifies the minimum light difference.
	 * `inverseRate` specifies the minimum light difference rate when the color value exceed.
	 */
	improveContrast(compareColor: Color, minimumLightContrast: number = 0.2, minimumLightContrastRateToInverse: number = 0.5) {
		let hsl = ColorHelper.RGBA2HSLA(this)
		let compareHSL = ColorHelper.RGBA2HSLA(compareColor)

		// Cacl the light diff in HSL color space.
		let hslDiff = Math.abs(hsl.l - compareHSL.l)
		let hslToFix = minimumLightContrast - hslDiff
		
		// Difference enough. 
		if (hslToFix <= 0) {
			return this
		}

		// Current color lighter.
		if (hsl.l > compareHSL.l) {
			hsl.l += hslToFix

			if (hsl.l > 100) {

				// If set current color much darker directly, it may change much,
				// So here shrink it with a inverseRate, which < 1.
				if (hslToFix > minimumLightContrast * minimumLightContrastRateToInverse) {
					hsl.l = compareHSL.l - minimumLightContrast
				}
				else {
					hsl.l = 100
				}
			}
		}

		// Current color darker.
		else {
			hsl.l -= hslToFix
			
			if (hsl.l < 0) {
				if (hslToFix > minimumLightContrast * minimumLightContrastRateToInverse) {
					hsl.l = compareHSL.l + minimumLightContrast
				}
				else {
					hsl.l = 0
				}
			}
		}
	
		return Color.fromHSLA(hsl.h, hsl.s, hsl.l, this.a).toString()
	}
}


/** Color utility functions. */
namespace ColorHelper {

	/** 
	 * Parse HEX color format like:
	 * `#368`, `#123456`, '#00000000'
	 */
	export function parseHEX(hex: string): RGBA | null {
		if (!/^#([0-9a-f]{3}|[0-9a-f]{6}||[0-9a-f]{8})$/i.test(hex)) {
			return null
		}

		// `#368`
		if (hex.length === 4) {
			return {
				r: parseInt(hex[1], 16) * 17 / 255,
				g: parseInt(hex[2], 16) * 17 / 255,
				b: parseInt(hex[3], 16) * 17 / 255,
				a: 1,
			}
		}

		// `#123456`
		else if (hex.length === 7) {
			return {
				r: parseInt(hex.slice(1, 3), 16) / 255,
				g: parseInt(hex.slice(3, 5), 16) / 255,
				b: parseInt(hex.slice(5, 7), 16) / 255,
				a: 1,
			}
		}

		// `#00000000`
		else if (hex.length === 9) {
			let a = parseInt(hex.slice(7, 9), 16)

			// 0 -> 0
			// 128 -> 0.5
			// 255 -> 1
			if (a <= 128) {
				a /= 256
			}
			else {
				a = (a - 1) / 254
			}

			return {
				r: parseInt(hex.slice(1, 3), 16) / 255,
				g: parseInt(hex.slice(3, 5), 16) / 255,
				b: parseInt(hex.slice(5, 7), 16) / 255,
				a,
			}
		}

		else {
			return null
		}
	}


	/** 
	 * Parse RGBA? color format like:
	 * `RGB(200, 200, 0)`, `RGBA(200, 200, 200, 0.5)`, `RGBA(#000, 0.5)`
	 */
	export function parseRGBA(str: string): RGBA | null {

		// `RGB(200, 200, 0)`
		let match = str.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
		if (match) {
			return {
				r: Number(match[1]) / 255,
				g: Number(match[2]) / 255,
				b: Number(match[3]) / 255,
				a: 1,
			}
		}

		// `RGBA(200, 200, 200, 0.5)`
		match = str.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i)
		if (match) {
			return {
				r: Number(match[1]) / 255,
				g: Number(match[2]) / 255,
				b: Number(match[3]) / 255,
				a: Number(match[4]),
			}
		}

		// `RGBA(#000, 0.5)`
		match = str.match(/^rgba\(\s*(#[0-9a-fA-F]{3,6})\s*,\s*([\d.]+)\s*\)$/i)
		if (match) {
			return {...ColorHelper.parseHEX(match[1])!, a: Number(match[2])}
		}

		return null
	}


	/** 
	 * Parse HSLA? color format like:
	 * `HSL(100, 60%, 80%)`, `HSLA(100, 60%, 80%, 0.5)`
	 */
	export function parseHSLA(str: string): HSLA | null {

		// `HSL(100, 60%, 80%)`
		let match = str.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i)
		if (match) {
			return {
				h: Number(match[1]) / 60,
				s: Number(match[2]) / 100,
				l: Number(match[3]) / 100,
				a: 1,
			}
		}

		// `HSLA(100, 60%, 80%, 0.5)`
		match = str.match(/^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d.]+)\s*\)$/i)
		if (match) {
			return {
				h: Number(match[1]) / 60,
				s: Number(match[2]) / 100,
				l: Number(match[3]) / 100,
				a: Number(match[4]),
			}
		}

		return null

	}

	/** Convert HSLA to RGBA. */
	export function HSLA2RGBA(hsla: HSLA): RGBA {
		let {h, s, l, a} = hsla
		let maxOfRGB = l <= 0.5 ? l * (s + 1) : l + s - (l * s)
		let minOfRGB = l * 2 - maxOfRGB
		
		return {
			r: hue2RGB(minOfRGB, maxOfRGB, (h + 2) % 6),
			g: hue2RGB(minOfRGB, maxOfRGB, h),
			b: hue2RGB(minOfRGB, maxOfRGB, (h - 2 + 6) % 6),
			a,
		}
	}

	/** Convert Hue and RGB range to one RGB value. */
	function hue2RGB(minOfRGB: number, maxOfRGB: number, hueDiff: number): number {
		if (hueDiff < 1) {
			return (maxOfRGB - minOfRGB) * hueDiff + minOfRGB
		}
		else if (hueDiff < 3) {
			return maxOfRGB
		}
		else if (hueDiff < 4) {
			return (maxOfRGB - minOfRGB) * (4 - hueDiff) + minOfRGB
		}
		else {
			return minOfRGB
		}
	}

	/** Convert RGBA to HSLA. */
	export function RGBA2HSLA(rgba: RGBA): HSLA {
		let {r, g, b, a} = rgba
		let minOfRGB = Math.min(Math.min(r, g), b)
		let maxOfRGB = Math.max(Math.max(r, g), b)
		let l = (minOfRGB + maxOfRGB) / 2
	
		let s = minOfRGB == maxOfRGB
			? 0
			: (maxOfRGB - minOfRGB) / (l <= 0.5 ? minOfRGB + maxOfRGB : 2 - minOfRGB - maxOfRGB)
	
		let h = 0
	
		if (s == 0) {}
		else if (r == maxOfRGB) {
			h = ((g - b) / (maxOfRGB - minOfRGB) + 6) % 6
		}
		else if (g == maxOfRGB) {
			h = (b - r) / (maxOfRGB - minOfRGB) + 2
		}
		else if (b == maxOfRGB) {
			h = (r - g) / (maxOfRGB - minOfRGB) + 4
		}
	
		return {
			h,
			s,
			l,
			a,
		}
	}
}