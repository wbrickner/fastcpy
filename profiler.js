const { exec } = require("child_process")
const util = require("util")
const writeFile = util.promisify(require("fs").writeFile)
const path = require("path")

const source_buffer_elements_minimum = 0
const source_buffer_elements_maximum = 8096
const source_buffer_elements_delta   = 1
const destination_buffer_elements    = 64_000_000

function make_csv(results) {
	let csv = "Source Buffer Elements,Time\n"

	for (var j = 0; j < results.length; j++) {
		csv += `${results[j].source_buffer_elements},${results[j].time}\n`
	}

	return csv
}

async function init() {
	const memcpy_benchmark_results = []
	await run_benchmarks(memcpy_benchmark_results, true)

	const fastcpy_benchmark_results = []
	await run_benchmarks(fastcpy_benchmark_results, false)

	await Promise.all([
		writeFile("./memcpy-results.csv", make_csv(memcpy_benchmark_results), "utf8"),
		writeFile("./fastcpy-results.csv", make_csv(fastcpy_benchmark_results), "utf8")
	])
}

async function run_benchmarks(benchmark_results, use_memcpy) {
	let source_buffer_elements = source_buffer_elements_minimum

	while (source_buffer_elements <= source_buffer_elements_maximum) {
		benchmark_results.push(
			await run_benchmark(source_buffer_elements, use_memcpy)
		)

		source_buffer_elements += source_buffer_elements_delta

		console.log(`${100 * source_buffer_elements / source_buffer_elements_maximum}% complete.`)
	}
}

const user_time_regex = new RegExp(/[0-9]+\.[0-9]+\s+user/i)

function async_exec(cmd) {
	// console.info("\tRunning:", cmd)
	
	return new Promise((resolve, reject) => {
		exec(cmd, (err, stdout, stderr) => {
			if (err) { return reject(err) }
			resolve(stdout || stderr)
		})
	})
}

async function run_benchmark(source_buffer_elements, use_memcpy) {
	let config_source = (
		`#define TRIALS 1E6 \n` +
		`#define SOURCE_BUFFER_SIZE ${source_buffer_elements} \n` + 
		`#define DESTINATION_BUFFER_SIZE ${destination_buffer_elements} \n` +
		(use_memcpy ? `#define USE_MEMCPY\n` : `\n`)
	)

	// write out config header
	try {
		await writeFile(path.join(__dirname, "./config.h"), config_source, "utf8")
	} catch (e) {
		console.error("Error writing config.h:", e)
		return
	}

	// rebuild executable
	try {
		await async_exec("make driver")
	} catch (e) {
		console.error("Error rebuilding executable:", e)
		return
	}

	// profile executable
	const output_string = await async_exec("./copy_bench")

	// parse time in seconds
	output_string.replace(/[^0-9\.]+/g, "")
	const time = parseFloat(output_string)

	// console.log("Time:", time)

	return {
		source_buffer_elements,
		time
	}
}

// finally, run benchmarks
init()