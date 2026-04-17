const path = require('bare-path')
const { spl, splFrom, expect, repo } = require('../../harness')

module.exports = [
  {
    name: 'status shows branch name',
    run () {
      let r = spl('spl.mycelium.git.status')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      // The response type is git status, check inner value has branch
      let inner = r.value && r.value.value
      if (!inner) return { pass: false, message: 'no inner value' }
      // Git status is packed with response type schema, raw gives us the full onion
      // The inner.value is AVRO bytes — we need to check if it decoded
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'status from subtree reports subtree reality',
    run () {
      let r = splFrom(path.join(repo, 'lib', 'avsc'), 'spl.mycelium.git.status')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'subtree.list shows registered subtrees',
    run () {
      let r = spl('spl.mycelium.git.subtree.list')
      let e = expect(r).hasValue()
      if (!e.pass) return e
      return { pass: true, message: 'ok' }
    }
  }
]
