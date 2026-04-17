const fs = require('bare-fs')
const path = require('bare-path')
const net = require('bare-net')
const { process } = require('spl/mycelium/runtime')
const rpcServer = require('rpc-server')

const testDir = path.dirname(typeof Bare !== 'undefined'
  ? Bare.argv[1] : __filename)

const repoDir = path.resolve(testDir, '..')
const serverDir = path.join(repoDir, '_server')

// Check server is running (pid first, TCP fallback)
function checkServer (cb) {
  let status = rpcServer.pid.alive(serverDir)
  if (status.alive) return cb(true)
  // fallback to TCP in case pid file missing
  let con = net.connect(24950)
  con.on('connect', () => { con.end(); cb(true) })
  con.on('error', () => { cb(false) })
}

// Walk suites/ recursively, return { name, file } entries
function walkSuites (dir, prefix) {
  let entries = []
  let items = fs.readdirSync(dir)
  for (let item of items) {
    let full = path.join(dir, item)
    let stat = fs.statSync(full)
    if (stat.isDirectory()) {
      let sub = prefix ? prefix + '/' + item : item
      entries = entries.concat(walkSuites(full, sub))
    } else if (item.endsWith('.js')) {
      let name = prefix
        ? prefix + '/' + item.replace('.js', '')
        : item.replace('.js', '')
      entries.push({ name, file: full })
    }
  }
  return entries
}

// Load suites from suites/ directory tree
function loadSuites (filter) {
  let dir = path.join(testDir, 'suites')
  let entries = walkSuites(dir, '')
  if (filter) {
    entries = entries.filter(function (e) {
      return e.name === filter || e.name.startsWith(filter + '/')
    })
  }
  let suites = []
  for (let entry of entries) {
    let tests = require(entry.file)
    suites.push({ name: entry.name, tests })
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
