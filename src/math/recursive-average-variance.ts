// Reference to https://math.stackexchange.com/questions/374881/recursive-formula-for-variance

/** Do statistic for average and variance, every time update a value, output new average value and variance. */
export class RecursiveVariance {

	n = 0
	average: number = 0
	variance = 0

	update(x: number) {
		let n = this.n
		let prevAvg = this.average
		let currAvg = prevAvg + (x - prevAvg) / (n + 1)
		let prevVar = this.variance

		this.average = currAvg
		this.variance = prevVar + prevAvg ** 2 - currAvg ** 2 + (x ** 2 - prevVar - prevAvg ** 2) / (n + 1)
		this.n = n + 1
	}
}


/** Do statistic for average value, every time update a value, output new average value. */
export class RecursiveAverage {

	n = 0
	average: number = 0

	update(x: number) {
		let n = this.n
		let prevAvg = this.average
		let currAvg = prevAvg + (x - prevAvg) / (n + 1)
	
		this.average = currAvg
		this.n = n + 1
	}
}