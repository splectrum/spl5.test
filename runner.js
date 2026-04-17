const fs = require('bare-fs')
const path = require('bare-path')
const net = require('bare-net')
const { process } = require('spl/mycelium/runtime')

const testDir = path.dirname(typeof Bare !== 'undefined'
  ? Bare.argv[1] : __filename)

// Check server is running
function checkServer (cb) {
  let con = net.connect(24950)
  con.on('connect', () => { con.end(); cb(true) })
  con.on('error', () => { cb(false) })
}

// Load suites from suites/ directory
function loadSuites (filter) {
  let dir = path.join(testDir, 'suites')
  let files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
  if (filter) {
    files = files.filter(f => f.replace('.js', '') === filter || f === filter)
  }
  let suites = []
  for (let file of files) {
    let name = file.replace('.js', '')
    let tests = require(path.join(dir, file))
    suites.push({ name, tests })
  }
  return suites
}

// Run all suites
function run (suites) {
  let total = 0
  let passed = 0
  let failed = 0
  let results = []

  for (let suite of suites) {
    let suiteResult = { name: suite.name, tests: [] }
    console.log('\n' + suite.name + ' (' + suite.tests.length + ' tests)')

    for (let test of suite.tests) {
      total++
      let result
      try {
        result = test.run()
      } catch (e) {
        result = { pass: false, message: e.message || String(e) }
      }

      if (result.pass) {
        passed++
        console.log('  + ' + test.name)
      } else {
        failed++
        console.log('  - ' + test.name)
        console.log('    ' + result.message)
      }
      suiteResult.tests.push({
        name: test.name,
        pass: result.pass,
        message: result.message
      })
    }
    results.push(suiteResult)
  }

  console.log('\n' + total + ' tests, ' + passed + ' passed, ' + failed + ' failed')
  return { total, passed, failed, results }
}

// Main
let filter = typeof Bare !== 'undefined' ? Bare.argv[2] : null

checkServer(function (running) {
  if (!running) {
    console.error('spl-test: server not running on port 24950')
    console.error('  start with: spl-server')
    process.exit(1)
  }

  let suites = loadSuites(filter)
  if (suites.length === 0) {
    console.error('spl-test: no suites found' + (filter ? ' matching "' + filter + '"' : ''))
    process.exit(1)
  }

  let report = run(suites)
  process.exit(report.failed > 0 ? 1 : 0)
})
