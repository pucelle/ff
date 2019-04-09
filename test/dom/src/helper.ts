/// <reference types="../node_modules/@types/chai" />


/** Works like jest.fn */
export function fn(handler: Function = function(){}) {
	let calls: any[] = []
	let returns: any[] = []

	function mockFn(this: any, ...args: any[]) {
		calls.push(args)
		let returned = handler.call(this, ...args)
		returns.push(returned)
		return returned
	}

	mockFn.mock = {
		calls,
		returns,
	}
	
	return mockFn
}
