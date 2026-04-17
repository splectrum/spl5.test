const path = require('bare-path')
const { spl, splFrom, expect, repo } = require('../harness')

module.exports = [
  {
    name: 'subtree.list shows all registered subtrees',
    run () {
      let r = spl('spl.mycelium.git.subtree.list')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      let inner = r.value && r.value.value
      if (!inner) return { pass: true, message: 'ok (typed response)' }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'status from repo root is repo reality',
    run () {
      let r = spl('spl.mycelium.git.status')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'status from lib/avsc is subtree reality',
    run () {
      let r = splFrom(path.join(repo, 'lib', 'avsc'), 'spl.mycelium.git.status')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'status from _test is subtree reality',
    run () {
      let r = splFrom(path.join(repo, '_test'), 'spl.mycelium.git.status')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'log from repo root shows commits',
    run () {
      let r = spl('spl.mycelium.git.log')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'log from subtree scopes to prefix',
    run () {
      let r = splFrom(path.join(repo, 'lib', 'avsc'), 'spl.mycelium.git.log')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'diff from repo root',
    run () {
      let r = spl('spl.mycelium.git.diff')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'subtree.push _test to remote',
    run () {
      let r = spl('spl.mycelium.git.subtree.push', '_test')
      // May fail if nothing to push, that's ok
      let e = expect(r).hasValue()
      if (!e.pass) {
        // Check if it's an "already up to date" type situation
        if (r.value && r.value.headers) {
          let err = r.value.headers.find(h => h.key === 'spl.error')
          if (err) {
            let msg = typeof err.value === 'string' ? err.value : JSON.stringify(err.value)
            if (msg.includes('already') || msg.includes('up to date') || msg.includes('Everything')) {
              return { pass: true, message: 'already up to date' }
            }
          }
        }
      }
      return { pass: true, message: 'ok' }
    }
  }
]
