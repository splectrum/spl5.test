const { spl, expect } = require('../harness')

module.exports = [
  {
    name: 'get resolves type from extension',
    run () {
      let r = spl('spl.mycelium.xpath.raw.get', '/package.json')
      return expect(r).hasValue().typeIs('leaf').valueTypeIs('json')
    }
  },
  {
    name: 'into-file navigation returns leaf',
    run () {
      let r = spl('spl.mycelium.xpath.raw.get', '/package.json/name')
      return expect(r).hasValue().typeIs('leaf').valueContains('spl5')
    }
  },
  {
    name: 'into-file navigation into object returns branch',
    run () {
      let r = spl('spl.mycelium.xpath.raw.get', '/_test/resources/sample.json/nested')
      return expect(r).hasValue().typeIs('branch').valueContains('key')
    }
  },
  {
    name: 'into-file navigation into array',
    run () {
      let r = spl('spl.mycelium.xpath.raw.get', '/_test/resources/sample.json/nested/list/1')
      return expect(r).hasValue().typeIs('leaf').valueContains('b')
    }
  },
  {
    name: 'into-file not found returns error',
    run () {
      let r = spl('spl.mycelium.xpath.raw.get', '/package.json/nonexistent')
      return expect(r).hasError('not found')
    }
  }
]
