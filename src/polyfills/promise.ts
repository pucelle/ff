if (!Promise.withResolvers) {
	Promise.withResolvers = function () {
		let resolve
		let reject

		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		})

		return {
			promise,
			resolve,
			reject,
		}
	} as any
}