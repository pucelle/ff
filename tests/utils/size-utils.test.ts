import {SizeUtils} from '../../src'


describe('Test SizeUtils', () => {
	test('SizeUtils', () => {
		expect(SizeUtils.formatSize(999)).toEqual('999 B')
		expect(SizeUtils.formatSize(1024)).toEqual('1 KB')
		expect(SizeUtils.formatSize(1024 * 1024)).toEqual('1 MB')
		expect(SizeUtils.formatSize(1024 * 1024 * 1024)).toEqual('1 GB')
		expect(SizeUtils.formatSize(1024 * 1024 * 1024 * 1024)).toEqual('1 TB')
	})
})