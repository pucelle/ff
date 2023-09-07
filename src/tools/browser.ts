let agent = navigator.userAgent


/** Whether Tablet. */
let tablet = /iPad|PlayBook/i.test(agent)
	|| (/Android/i.test(agent) && !/Mobile/i.test(agent))
	|| (/Firefox/i.test(agent) && /Tablet/i.test(agent))
	|| /iPad/i.test(agent)

/** Whether Mobile. */
let mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent) || tablet

/** System Platform info. */
let platform: 'win' | 'mac' | 'linux' | 'others' = /Windows/i.test(agent) ? 'win'
	: /Mac OS/i.test(agent) ? 'mac'
	: /Linux/i.test(agent) ? 'linux'
	: 'others'


/** Identify browser and platform info. */
export const BrowserInfo = {
	
	/** System Platform info. */
	platform,

	/** Whether Windows. */
	windows: platform === 'win',

	/** Whether Mac OS. */
	mac: platform === 'mac',

	/** Whether Linux. */
	linux: platform === 'linux',


	/** Whether iPad. */
	ipad: /iPad/i.test(agent),

	/** Whether Tablet. */
	tablet,

	/** Whether Mobile device. */
	mobile,

	/** Whether iOS System. */
	ios: /iPhone|iPad|iPod/i.test(agent),

	/** Whether Android System. */
	android: /Android/i.test(agent),
	

	/** Whether IE. */
	ie: /MSIE|Trident/i.test(agent),

	/** Whether Firefox. */
	firefox: /Firefox/i.test(agent),
	
	/** Whether Edge. */
	edge: /Edge/i.test(agent),

	/** Whether Chrome. */
	chrome: /Chrome/i.test(agent),

	/** Whether Safari. */
	safari: /Safari/i.test(agent) && !/Chrome/i.test(agent),
	

	/** Whether having pointable input device, like mouse or pencil. */
	pointable: matchMedia('(pointer:fine)').matches,

	/** Whether in Electron Environment. */
	electron: /Electron/i.test(agent),
}
