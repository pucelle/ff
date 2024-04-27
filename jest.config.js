module.exports = {
	preset: "ts-jest",
	transform: {
		"^.+\\.tsx?$": ["ts-jest", {}],
	},
	testEnvironment: "jsdom",
	testMatch: [
		"**/test/**/*.test.ts"
	],
	moduleFileExtensions: [
		"ts",
		"tsx",
		"js",
		"jsx"
	],
}