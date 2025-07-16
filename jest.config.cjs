module.exports = {
	preset: "ts-jest",
	//preset: 'ts-jest/presets/default-esm',
	testEnvironment: "jsdom",
	testMatch: [
		"**/tests/**/*.test.ts"
	],
	extensionsToTreatAsEsm: [".ts"],
	transform: {
    	'^.+\\.tsx?$': ['ts-jest', { useESM: true }]
 	},
}