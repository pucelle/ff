import {MouseLeaveControl} from '../../src/events'
import {sleep} from '../../src/utils'


describe('Test MouseLeaveControl', () => {

	function enter(el: Element) {
		let e = new Event('mouseenter')
		el.dispatchEvent(e)
	}

	function leave(el: Element) {
		let e = new Event('mouseleave')
		el.dispatchEvent(e)
	}


	test('Test callback', async () => {
		let t1 = document.createElement('div')
		let p1 = document.createElement('div')
		let f1 = jest.fn()
	
		MouseLeaveControl.on(t1, p1, f1, {delay: 100})
		leave(t1)
		expect(f1).toHaveBeenCalledTimes(0)

		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(1)
	})


	test('Test cancel', async () => {
		let t1 = document.createElement('div')
		let p1 = document.createElement('div')
		let f1 = jest.fn()
	
		let cancel = MouseLeaveControl.on(t1, p1, f1, {delay: 100})

		leave(t1)
		cancel()

		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(0)
	})


	test('Test leave and soon enter', async () => {
		let t1 = document.createElement('div')
		let p1 = document.createElement('div')
		let f1 = jest.fn()
	
		MouseLeaveControl.on(t1, p1, f1, {delay: 100})

		leave(t1)
		await sleep(50)

		enter(t1)
		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(0)

		leave(p1)
		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(1)
	})


	test('Test leave locks', async () => {
		let t1 = document.createElement('div')
		let p1 = document.createElement('div')
		let f1 = jest.fn()

		let t2 = document.createElement('div')
		let p2 = document.createElement('div')
		let f2 = jest.fn()

		let t3 = document.createElement('div')
		let p3 = document.createElement('div')
		let f3 = jest.fn()

		p1.append(t2)
		p2.append(t3)
	
		MouseLeaveControl.on(t1, p1, f1, {delay: 100})
		MouseLeaveControl.on(t2, p2, f2, {delay: 100})
		MouseLeaveControl.on(t3, p3, f3, {delay: 100})

		enter(p1)
		enter(t2)
		leave(t2)
		leave(p1)
		enter(p2)
		enter(t3)
		leave(t3)
		leave(p2)
		enter(p3)

		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(0)
		expect(f2).toHaveBeenCalledTimes(0)
		expect(f3).toHaveBeenCalledTimes(0)

		leave(p3)
		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(1)
		expect(f2).toHaveBeenCalledTimes(1)
		expect(f3).toHaveBeenCalledTimes(1)
	})


	test('Test several leave locks', async () => {
		let t1 = document.createElement('div')
		let p1 = document.createElement('div')
		let f1 = jest.fn()

		let t2 = document.createElement('div')
		let p2 = document.createElement('div')
		let f2 = jest.fn()

		let t3 = document.createElement('div')
		let p3 = document.createElement('div')
		let f3 = jest.fn()

		p1.append(t2)
		p1.append(t3)
	
		MouseLeaveControl.on(t1, p1, f1, {delay: 100})
		MouseLeaveControl.on(t2, p2, f2, {delay: 100})
		MouseLeaveControl.on(t3, p3, f3, {delay: 100})

		enter(p1)
		enter(t2)
		leave(t2)
		leave(p1)
		enter(p2)
		enter(t3)
		leave(t3)
		leave(p2)
		enter(p3)

		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(0)
		expect(f2).toHaveBeenCalledTimes(1)
		expect(f3).toHaveBeenCalledTimes(0)

		leave(p3)
		await sleep(110)
		expect(f1).toHaveBeenCalledTimes(1)
		expect(f2).toHaveBeenCalledTimes(1)
		expect(f3).toHaveBeenCalledTimes(1)
	})
})