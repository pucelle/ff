/** Identify browser and platform or device info. */
export const BrowserInfo = {
	
	/** Get Platform info. */
	get platform(): 'win' | 'mac' | 'linux' | 'others'  {
		return /Windows/i.test(navigator.userAgent) ? 'win'
			: /Mac OS/i.test(navigator.userAgent) ? 'mac'
			: /Linux/i.test(navigator.userAgent) ? 'linux'
			: 'others'
	},

	/** Whether be Windows platform. */
	get windows(): boolean {
		return this.platform === 'win'
	},

	/** Whether be Mac OS platform. */
	get mac(): boolean {
		return this.platform === 'win'
	},

	/** Whether be Linux platform. */
	get linux(): boolean {
		return this.platform === 'win'
	},

	/** Whether be Mobile device. */
	get mobile() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || this.tablet
	},

	/** Whether be Tablet device. */
	get tablet() {
		return /iPad|PlayBook/i.test(navigator.userAgent)
			|| (/Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent))
			|| (/Firefox/i.test(navigator.userAgent) && /Tablet/i.test(navigator.userAgent))
			|| /iPad/i.test(navigator.userAgent)
	},

	/** Whether be iPad. */
	get ipad(): boolean {
		return /iPad/i.test(navigator.userAgent)
	},

	/** Whether be iOS System. */
	get ios(): boolean {
		return  /iPhone|iPad|iPod/i.test(navigator.userAgent)
	},

	/** Whether Android System. */
	get android(): boolean {
		return /Android/i.test(navigator.userAgent)
	},

	/** Whether IE. */
	get ie(): boolean {
		return /MSIE|Trident/i.test(navigator.userAgent)
	},

	/** Whether Firefox. */
	get firefox(): boolean {
		return /Firefox/i.test(navigator.userAgent)
	},

	/** Whether Edge. */
	get edge(): boolean {
		return /Edge/i.test(navigator.userAgent)
	},

	/** Whether Chrome. */
	get chrome(): boolean {
		return /Chrome/i.test(navigator.userAgent)
	},

	/** Whether Safari. */
	get safari(): boolean {
		return /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
	},

	/** Whether having pointable input device, like mouse or pencil. */
	get pointable(): boolean {
		return matchMedia('(pointer:fine)').matches
	},

	/** Whether in Electron Environment. */
	get electron(): boolean {
		return /Electron/i.test(navigator.userAgent)
	},
}
