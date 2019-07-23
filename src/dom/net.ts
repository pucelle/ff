import {subMatchAt} from "../base/string"

type Resources = string[] | NormalizedResources

interface NormalizedResources {
	css: string[]
	js: string[]
	others: string[]
}


/**
 * Load css, js and other resources from uris.
 * @param resources Array of uris, or {css: [], js: [], others: []}.
 */
export async function loadResources(rawResources: Resources): Promise<void> {
	let resources = normalizeResources(rawResources)
	let promises: Promise<any>[] = []

	for (let uri of resources.css) {
		promises.push(loadStyle(uri))
	}

	for (let uri of resources.js) {
		promises.push(loadScript(uri))
	}

	for (let uri of resources.others) {
		promises.push(fetch(uri))
	}

	await Promise.all(promises)
}

function normalizeResources(resources: Resources): NormalizedResources {
	let css: string[] = []
	let js: string[] = []
	let others: string[] = []

	if (resources) {
		if (Array.isArray(resources)) {
			for (let resource of resources) {
				let ext = subMatchAt(resource.replace(/\?.*/, ''), /\.(\w+)$/, 1).toLowerCase()
				if (ext === 'css') {
					css.push(resource)
				}
				else if (ext === 'js') {
					js.push(resource)
				}
				else {
					others.push(resource)
				}
			}
		}
		else {
			css = resources.css || css
			js = resources.js || js
			others = resources.others || others
		}
	}
	
	return {
		css,
		js,
		others
	}
}


function loadStyle(uri: string): Promise<void> {
	return new Promise((resolve, reject) => {
		let link = document.createElement('link')
		link.rel = 'stylesheet'
		link.href = uri
		document.head.append(link)

		link.addEventListener('load', () => resolve())
		link.addEventListener('error', () => reject())
	})
}

function loadScript(uri: string): Promise<void> {
	return new Promise((resolve, reject) => {
		let script = document.createElement('script')
		script.async = false
		script.src = uri
		document.head.append(script)
		
		script.addEventListener('load', () => resolve())
		script.addEventListener('error', () => reject())
	})
}