# spl5.test — Test Framework

Test framework for [spl5](https://github.com/splectrum/spl5). Full-chain tests — no mocking. Every test spawns the spl CLI, sends a real RPC request to a running server, and verifies the response.

Attached to spl5 as a git subtree at `_test/`.

## Running Tests

```bash
# Start the server first
spl-server &

# Run all suites
spl-test

# Run by module
spl-test lib
spl-test xpath
spl-test git

# Run a specific suite
spl-test lib/rpc-server
spl-test xpath/raw.uri
```

## Test Organization

Suites are organized by module — each directory can travel with its module on extraction.

```
suites/
  lib/
    git.js            — lib/git module tests (direct API)
    rpc-server.js     — lib/rpc-server module tests (direct API)
  xpath/
    raw.uri.js        — raw URI protocol (visibility, no schema)
    data.uri.js       — data URI protocol (hides underscore)
    metadata.uri.js   — metadata URI protocol (underscore only)
    raw.js            — schema-aware raw (type resolution, into-file nav)
  git/
    status.js         — git status + two-reality model
    subtree.js        — subtree operations via protocol
```

**lib/** suites test infrastructure modules directly via `require()`.
**xpath/** and **git/** suites test through the full spl CLI chain (protocol handlers).

## Writing Tests

Each suite exports an array of test cases. Each test returns `{ pass, message }`.

```javascript
const { spl, expect } = require('../../harness')

module.exports = [
  {
    name: 'get returns leaf for file',
    run () {
      let r = spl('spl.mycelium.xpath.raw.uri.get', '/package.json')
      return expect(r).hasValue().typeIs('leaf')
    }
  }
]
```

### Harness API

```javascript
// Execute via CLI (full chain: CLI → RPC → server → handler → response)
let response = spl(streamType, key, value)

// Execute from a specific working directory (reality testing)
let response = splFrom(cwd, streamType, key, value)

// Fluent assertions
expect(response)
  .noError()              // no error in response
  .hasValue()             // inner value exists
  .hasError('substring')  // error header present
  .typeIs('leaf')         // node type matches
  .valueContains('text')  // content contains string
  .valueTypeIs('json')    // value type matches
```

### Direct Module Tests

For lib/ infrastructure, test the module API directly:

```javascript
const git = require('git')

module.exports = [
  {
    name: 'status returns branch',
    run () {
      let result = git.status(repo)
      if (!result.branch) return { pass: false, message: 'no branch' }
      return { pass: true, message: 'ok' }
    }
  }
]
```

## Client Identity

The test framework has its own client identity at `_client/context.txt`. When attached as subtree at `_test/`, it becomes `_test/_client/context.txt` — a separate vocabulary from the default client.

## Structure

```
_client/context.txt   — test client vocabulary
harness.js            — CLI executor + fluent assertions
runner.js             — suite loader + reporter
suites/               — test suite files (by module)
resources/            — test fixtures
report/               — test output (gitignored)
package.json          — { "name": "spl5.test" }
```
