module.exports = {
	"testEnvironment": "node",
	"transform": {
		"^.+\\.tsx?$": "ts-jest"
	},
	"testMatch": [
		"**/test/lib/**/*.test.ts"
	],
	"moduleFileExtensions": [
		"ts",
		"tsx",
		"js",
		"jsx"
	],
}