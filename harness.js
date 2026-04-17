const { spawnSync } = require('bare-subprocess')
const path = require('bare-path')
const { repoRoot } = require('spl/mycelium/resolve')

const repo = repoRoot(typeof Bare !== 'undefined'
  ? require('bare-os').cwd()
  : process.cwd())

const splBin = path.join(repo, 'bin', 'spl')

// Execute a spl command via CLI. Uses raw modifier for
// full JSON response. Returns parsed response or error.
function spl (streamType, key, value) {
  let args = ['raw', streamType]
  if (key) args.push(key)
  if (value) args.push(value)

  let result = spawnSync(splBin, args, {
    cwd: repo,
    encoding: 'utf-8'
  })

  if (result.status !== 0) {
    let stderr = result.stderr ? result.stderr.toString().trim() : ''
    return { _error: stderr || 'spl exited with code ' + result.status }
  }

  let stdout = result.stdout ? result.stdout.toString().trim() : ''
  if (!stdout) return { _error: 'empty response' }

  try { return JSON.parse(stdout) }
  catch (e) { return { _error: 'invalid JSON: ' + stdout.slice(0, 100) } }
}

// Execute from a specific working directory (for reality testing)
function splFrom (cwd, streamType, key, value) {
  let args = ['raw', streamType]
  if (key) args.push(key)
  if (value) args.push(value)

  let result = spawnSync(splBin, args, {
    cwd: cwd,
    encoding: 'utf-8'
  })

  if (result.status !== 0) {
    let stderr = result.stderr ? result.stderr.toString().trim() : ''
    return { _error: stderr || 'spl exited with code ' + result.status }
  }

  let stdout = result.stdout ? result.stdout.toString().trim() : ''
  if (!stdout) return { _error: 'empty response' }

  try { return JSON.parse(stdout) }
  catch (e) { return { _error: 'invalid JSON: ' + stdout.slice(0, 100) } }
}

// Fluent assertion builder
function expect (response) {
  let ctx = { response, pass: true, message: 'ok' }

  function fail (msg) {
    ctx.pass = false
    ctx.message = msg
    return chain
  }

  let chain = {
    get pass () { return ctx.pass },
    get message () { return ctx.message },

    noError () {
      if (response._error) return fail('unexpected error: ' + response._error)
      return chain
    },

    hasValue () {
      if (response._error) return fail('error: ' + response._error)
      if (!response.value) return fail('no value in response')
      if (!response.value.value) return fail('no inner value')
      return chain
    },

    hasError (substring) {
      if (response._error) {
        if (substring && !response._error.includes(substring)) {
          return fail('error does not contain "' + substring + '": ' + response._error)
        }
        return chain
      }
      // Check inner headers for spl.error
      let inner = response.value
      if (!inner || !inner.headers) return fail('no inner record to check for error')
      let err = inner.headers.find(h => h.key === 'spl.error')
      if (!err) return fail('expected error, got success')
      let msg = typeof err.value === 'string' ? err.value : JSON.stringify(err.value)
      if (substring && !msg.includes(substring)) {
        return fail('error does not contain "' + substring + '": ' + msg)
      }
      return chain
    },

    typeIs (t) {
      if (!ctx.pass) return chain
      let val = response.value && response.value.value
      if (!val) return fail('no value to check type')
      if (val.type !== t) return fail('expected type "' + t + '", got "' + val.type + '"')
      return chain
    },

    valueContains (s) {
      if (!ctx.pass) return chain
      let val = response.value && response.value.value
      if (!val || !val.value) return fail('no value content')
      let contents = val.value.contents
      let text = typeof contents === 'string' ? contents : JSON.stringify(contents)
      if (!text.includes(s)) return fail('value does not contain "' + s + '"')
      return chain
    },

    valueTypeIs (t) {
      if (!ctx.pass) return chain
      let val = response.value && response.value.value
      if (!val || !val.value) return fail('no value content')
      if (val.value.type !== t) return fail('expected value type "' + t + '", got "' + val.value.type + '"')
      return chain
    }
  }

  return chain
}

module.exports = { spl, splFrom, expect, repo }
