const fs = require('bare-fs')
const path = require('bare-path')
const os = require('bare-os')
const { repoRoot } = require('spl/mycelium/resolve')
const rpcServer = require('rpc-server')

const repo = repoRoot(os.cwd())
const serverDir = path.join(repo, '_server')

// Use a temp directory for isolated tests
const tmpBase = path.join(os.tmpdir(), 'spl-test-rpc-' + Date.now())

function tmpDir (name) {
  let dir = path.join(tmpBase, name)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function cleanup () {
  try { fs.rmSync(tmpBase, { recursive: true }) } catch (e) {}
}

module.exports = [
  // --- pid tests ---
  {
    name: 'pid.write creates pid file with current pid',
    run () {
      let dir = tmpDir('pid-write')
      let pid = rpcServer.pid.write(dir)
      let content = fs.readFileSync(path.join(dir, 'pid'), 'utf-8')
      if (parseInt(content) !== pid) {
        return { pass: false, message: 'expected pid ' + pid + ', got ' + content }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'pid.read returns pid from file',
    run () {
      let dir = tmpDir('pid-read')
      fs.writeFileSync(path.join(dir, 'pid'), '12345')
      let pid = rpcServer.pid.read(dir)
      if (pid !== 12345) {
        return { pass: false, message: 'expected 12345, got ' + pid }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'pid.read returns null for missing file',
    run () {
      let dir = tmpDir('pid-read-missing')
      let pid = rpcServer.pid.read(dir)
      if (pid !== null) {
        return { pass: false, message: 'expected null, got ' + pid }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'pid.clean removes pid file',
    run () {
      let dir = tmpDir('pid-clean')
      fs.writeFileSync(path.join(dir, 'pid'), '99999')
      rpcServer.pid.clean(dir)
      let exists = fs.existsSync(path.join(dir, 'pid'))
      if (exists) {
        return { pass: false, message: 'pid file still exists after clean' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'pid.clean silent on missing file',
    run () {
      let dir = tmpDir('pid-clean-missing')
      try {
        rpcServer.pid.clean(dir)
        return { pass: true, message: 'ok' }
      } catch (e) {
        return { pass: false, message: 'threw on missing: ' + e.message }
      }
    }
  },
  {
    name: 'pid.alive returns true for current process',
    run () {
      let dir = tmpDir('pid-alive')
      rpcServer.pid.write(dir)
      let status = rpcServer.pid.alive(dir)
      if (!status.alive) {
        return { pass: false, message: 'expected alive=true for own pid' }
      }
      if (status.pid !== Bare.pid) {
        return { pass: false, message: 'expected pid ' + Bare.pid + ', got ' + status.pid }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'pid.alive returns false for dead pid',
    run () {
      let dir = tmpDir('pid-dead')
      fs.writeFileSync(path.join(dir, 'pid'), '999999')
      let status = rpcServer.pid.alive(dir)
      if (status.alive) {
        return { pass: false, message: 'expected alive=false for pid 999999' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'pid.alive returns false for no pid file',
    run () {
      let dir = tmpDir('pid-no-file')
      let status = rpcServer.pid.alive(dir)
      if (status.alive || status.pid !== null) {
        return { pass: false, message: 'expected { pid: null, alive: false }' }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- log tests ---
  {
    name: 'log.logMessage creates timestamped file',
    run () {
      let dir = tmpDir('log-basic')
      let msg = { timestamp: 1000, key: '/test', value: null, headers: [] }
      let file = rpcServer.log.logMessage(dir, msg)
      if (!fs.existsSync(file)) {
        return { pass: false, message: 'log file not created: ' + file }
      }
      let content = JSON.parse(fs.readFileSync(file, 'utf-8'))
      if (content.key !== '/test') {
        return { pass: false, message: 'key mismatch in log' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'log.logMessage uses render function',
    run () {
      let dir = tmpDir('log-render')
      let msg = { timestamp: 2000, key: '/raw', value: null, headers: [] }
      let rendered = false
      let file = rpcServer.log.logMessage(dir, msg, function (m) {
        rendered = true
        return { transformed: true, key: m.key }
      })
      if (!rendered) {
        return { pass: false, message: 'render function not called' }
      }
      let content = JSON.parse(fs.readFileSync(file, 'utf-8'))
      if (!content.transformed) {
        return { pass: false, message: 'render output not used' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'log.logMessage avoids filename collision',
    run () {
      let dir = tmpDir('log-collision')
      let msg = { timestamp: 3000, key: '/a', value: null, headers: [] }
      let f1 = rpcServer.log.logMessage(dir, msg)
      let f2 = rpcServer.log.logMessage(dir, msg)
      if (f1 === f2) {
        return { pass: false, message: 'files should have different names' }
      }
      if (!f1.includes('3000-0') || !f2.includes('3000-1')) {
        return { pass: false, message: 'expected seq increment: ' + f1 + ', ' + f2 }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- cmd tests ---
  {
    name: 'cmd.sendCommand creates command file',
    run () {
      let dir = tmpDir('cmd-send')
      rpcServer.cmd.sendCommand(dir, 'shutdown')
      let file = path.join(dir, 'cmd', 'shutdown')
      if (!fs.existsSync(file)) {
        return { pass: false, message: 'command file not created' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'cmd.sendCommand creates cmd directory',
    run () {
      let dir = tmpDir('cmd-mkdir')
      rpcServer.cmd.sendCommand(dir, 'restart')
      let cmdDir = path.join(dir, 'cmd')
      if (!fs.existsSync(cmdDir)) {
        return { pass: false, message: 'cmd directory not created' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'cmd.startWatcher processes existing files',
    run () {
      let dir = tmpDir('cmd-existing')
      let cmdDir = path.join(dir, 'cmd')
      fs.mkdirSync(cmdDir, { recursive: true })
      fs.writeFileSync(path.join(cmdDir, 'shutdown'), '')
      let called = false
      let watcher = rpcServer.cmd.startWatcher(dir, {
        shutdown () { called = true },
        restart () {}
      })
      rpcServer.cmd.stopWatcher(watcher)
      if (!called) {
        return { pass: false, message: 'existing shutdown file not processed' }
      }
      if (fs.existsSync(path.join(cmdDir, 'shutdown'))) {
        return { pass: false, message: 'command file not consumed' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'cmd.stopWatcher is null-safe',
    run () {
      try {
        rpcServer.cmd.stopWatcher(null)
        return { pass: true, message: 'ok' }
      } catch (e) {
        return { pass: false, message: 'threw on null: ' + e.message }
      }
    }
  },

  // --- lifecycle integration (running server) ---
  {
    name: 'running server has valid pid file',
    run () {
      let status = rpcServer.pid.alive(serverDir)
      if (!status.alive) {
        return { pass: false, message: 'server pid not alive' }
      }
      if (typeof status.pid !== 'number') {
        return { pass: false, message: 'pid is not a number: ' + status.pid }
      }
      return { pass: true, message: 'pid ' + status.pid }
    }
  },
  {
    name: 'server is reported as running',
    run () {
      let pid = rpcServer.pid.read(serverDir)
      if (!pid) {
        return { pass: false, message: 'no pid file' }
      }
      let status = rpcServer.pid.alive(serverDir)
      if (!status.alive) {
        return { pass: false, message: 'pid ' + pid + ' not alive' }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- cleanup ---
  {
    name: '[cleanup] remove temp files',
    run () {
      cleanup()
      return { pass: true, message: 'ok' }
    }
  }
]
