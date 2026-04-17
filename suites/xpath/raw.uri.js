const { spl, expect } = require('../../harness')

module.exports = [
  {
    name: 'get returns leaf for file',
    run () {
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/package.json')
      return expect(r).hasValue().typeIs('leaf')
    }
  },
  {
    name: 'get returns branch for directory',
    run () {
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/')
      return expect(r).hasValue().typeIs('branch')
    }
  },
  {
    name: 'get branch contains _schema (raw sees all)',
    run () {
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/')
      return expect(r).hasValue().valueContains('_schema')
    }
  },
  {
    name: 'get not found returns error',
    run () {
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/nonexistent')
      return expect(r).hasError('not found')
    }
  },
  {
    name: 'put writes and get reads back',
    run () {
      spl('spl.mycelium.xpath.raw.uri.put', '/_test_tmp.txt', 'test-content')
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/_test_tmp.txt')
      spl('spl.mycelium.xpath.raw.uri.remove', '/_test_tmp.txt')
      return expect(r).hasValue().typeIs('leaf').valueContains('test-content')
    }
  },
  {
    name: 'remove deletes file',
    run () {
      spl('spl.mycelium.xpath.raw.uri.put', '/_test_rm.txt', 'delete-me')
      spl('spl.mycelium.xpath.raw.uri.remove', '/_test_rm.txt')
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/_test_rm.txt')
      return expect(r).hasError('not found')
    }
  }
]
