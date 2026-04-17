const { spl, expect } = require('../../harness')

module.exports = [
  {
    name: 'get hides underscore-prefixed entries',
    run () {
      let r = spl('spl.mycelium.xpath.data.uri.get', '/')
      let e = expect(r).hasValue().typeIs('branch')
      if (!e.pass) return e
      // Should NOT contain _schema, _server, _client, _test
      let val = r.value.value
      let contents = typeof val.value.contents === 'string'
        ? val.value.contents : JSON.stringify(val.value.contents)
      if (contents.includes('_schema')) return { pass: false, message: 'data lens shows _schema' }
      if (contents.includes('_test')) return { pass: false, message: 'data lens shows _test' }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'get blocks underscore path',
    run () {
      let r = spl('spl.mycelium.xpath.data.uri.get', '/_schema')
      return expect(r).hasError('not found')
    }
  },
  {
    name: 'get returns leaf for data file',
    run () {
      let r = spl('spl.mycelium.xpath.data.uri.get', '/package.json')
      return expect(r).hasValue().typeIs('leaf')
    }
  }
]
