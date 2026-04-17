const { spl, expect } = require('../harness')

module.exports = [
  {
    name: 'get shows only underscore entries at root',
    run () {
      let r = spl('spl.mycelium.xpath.metadata.uri.get', '/')
      let e = expect(r).hasValue().typeIs('branch')
      if (!e.pass) return e
      let val = r.value.value
      let contents = typeof val.value.contents === 'string'
        ? val.value.contents : JSON.stringify(val.value.contents)
      if (contents.includes('spl\n') || contents.includes('\nspl')) {
        return { pass: false, message: 'metadata lens shows data node "spl"' }
      }
      if (!contents.includes('_schema')) {
        return { pass: false, message: 'metadata lens missing _schema' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'get full visibility inside metadata subtree',
    run () {
      let r = spl('spl.mycelium.xpath.metadata.uri.get', '/_schema')
      return expect(r).hasValue().typeIs('branch').valueContains('spl')
    }
  },
  {
    name: 'get blocks data file outside metadata path',
    run () {
      let r = spl('spl.mycelium.xpath.metadata.uri.get', '/package.json')
      return expect(r).hasError('not found')
    }
  },
  {
    name: 'get data file inside metadata path',
    run () {
      let r = spl('spl.mycelium.xpath.metadata.uri.get', '/_schema/alias-mapping.txt')
      return expect(r).hasValue().typeIs('leaf')
    }
  }
]
