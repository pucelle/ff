module.exports = {
	preset: "ts-jest",
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	testEnvironment: "node",
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