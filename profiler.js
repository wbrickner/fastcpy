const { exec } = require("child_process")
const util = require("util")
const writeFile = util.promisify(require("fs").writeFile)
const path = require("path")

const source_buffer_elements_minimum = 0
const source_buffer_elements_maximum = 32_000_000
const source_buffer_elements_delta   = 1_000
const destination_buffer_elements    = 64_000_000

async function init() {
	const memcpy_benchmark_results = []
	await run_benchmarks(memcpy_benchmark_results, true)

	const fastcpy_benchmark_results = []
	await run_benchmarks(fastcpy_benchmark_results, false)

	await Promise.all([
		writeFile("./memcpy-results.json", JSON.stringify(memcpy_benchmark_results), "utf8"),
		writeFile("./fastcpy-results.json", JSON.stringify(memcpy_benchmark_results), "utf8")
	])
}

async function run_benchmarks(benchmark_results, use_memcpy) {
	let source_buffer_elements = source_buffer_elements_minimum

	while (source_buffer_elements <= source_buffer_elements_maximum) {
		benchmark_results.push(
			await run_benchmark(source_buffer_elements, use_memcpy)
		)

		source_buffer_elements += source_buffer_elements_delta

		console.log(`${Math.round(100 * source_buffer_elements / source_buffer_elements_maximum)}% complete.`)
	}
}

const user_time_regex = new RegExp(/[0-9]+\.[0-9]+\s+user/i)

function async_exec(cmd) {
	console.info("\tRunning:", cmd)
	return new Promise((reject, resolve) => {
		exec(cmd, (err, stdout, stderr) => {
			if (err || stderr) { return reject(err || stderr) }
			resolve(stdout)
		})
	})
}

async function run_benchmark(source_buffer_elements, use_memcpy) {
	let config_source = (
		`#define TRIALS 1E9 \n` +
		`#define SOURCE_BUFFER_SIZE ${source_buffer_elements} \n` + 
		`#define DESTINATION_BUFFER_SIZE ${destination_buffer_elements} \n` +
		(use_memcpy ? `#define USE_MEMCPY\n` : `\n`)
	)

	// write out config header
	await writeFile(path.join(__dirname, "./config.h"), config_source, "utf8")

	// rebuild executable
	await async_exec("make driver")

	// profile executable
	const output_string = await async_exec("/usr/bin/time -l ./copy_bench")

	// extract user time string
	let user_time_string = output_string.match(user_time_regex)[0]
	user_time_string.replace(/[^0-9\.]+/g, "")
	const time = parseFloat(user_time_string)

	return {
		source_buffer_elements,
		time
	}
}

// finally, run benchmarks
init()