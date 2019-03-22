import * as ff from '../../../src'
const assert = chai.assert


describe('Test storage', () => {
	it('storage', () => {
		assert.equal(ff.storage.isSupported(), true)
		assert.equal(ff.storage.set('a', 'b'), true)
		assert.equal(ff.storage.get('a'), 'b')
		assert.equal(ff.storage.has('a'), true)
		assert.equal(ff.storage.delete('a'), true)
		assert.equal(ff.storage.has('a'), false)
	})
})
