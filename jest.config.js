module.exports = {
	preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: {
				target: 'ES2020'
			}
		}
	},
	testEnvironment: "node",
	testMatch: [
		"**/test/base/**/*.test.ts"
	],
	moduleFileExtensions: [
		"ts",
		"tsx",
		"js",
		"jsx"
	],
}