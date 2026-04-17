const path = require('bare-path')
const os = require('bare-os')
const { repoRoot } = require('spl/mycelium/resolve')
const git = require('git')

const repo = repoRoot(os.cwd())

module.exports = [
  // --- exec ---
  {
    name: 'exec runs git command',
    run () {
      let result = git.exec(repo, ['--version'])
      if (result.code !== 0) {
        return { pass: false, message: 'git --version failed: ' + result.stderr }
      }
      if (!result.stdout.includes('git version')) {
        return { pass: false, message: 'unexpected output: ' + result.stdout }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'exec returns error for bad command',
    run () {
      let result = git.exec(repo, ['not-a-command'])
      if (result.code === 0) {
        return { pass: false, message: 'expected non-zero exit for bad command' }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- status ---
  {
    name: 'status returns branch and files',
    run () {
      let result = git.status(repo)
      if (!result.branch) {
        return { pass: false, message: 'no branch in status' }
      }
      if (!Array.isArray(result.files)) {
        return { pass: false, message: 'files is not an array' }
      }
      return { pass: true, message: 'branch: ' + result.branch }
    }
  },
  {
    name: 'status with path filter',
    run () {
      let result = git.status(repo, { path: 'lib/avsc' })
      if (!result.branch) {
        return { pass: false, message: 'no branch in filtered status' }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- log ---
  {
    name: 'log returns commits array',
    run () {
      let result = git.log(repo)
      if (!Array.isArray(result)) {
        return { pass: false, message: 'log did not return array' }
      }
      if (result.length === 0) {
        return { pass: false, message: 'log returned empty array' }
      }
      let first = result[0]
      if (!first.hash || !first.message) {
        return { pass: false, message: 'commit missing hash or message' }
      }
      return { pass: true, message: result.length + ' commits' }
    }
  },
  {
    name: 'log with count',
    run () {
      let result = git.log(repo, { count: 3 })
      if (result.length > 3) {
        return { pass: false, message: 'expected <= 3 commits, got ' + result.length }
      }
      return { pass: true, message: result.length + ' commits' }
    }
  },
  {
    name: 'log with path scoping',
    run () {
      let result = git.log(repo, { path: 'lib/avsc' })
      if (!Array.isArray(result)) {
        return { pass: false, message: 'log did not return array' }
      }
      return { pass: true, message: result.length + ' commits for lib/avsc' }
    }
  },

  // --- diff ---
  {
    name: 'diff returns result object',
    run () {
      let result = git.diff(repo)
      if (typeof result !== 'object') {
        return { pass: false, message: 'diff did not return object' }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- subtrees ---
  {
    name: 'subtrees.load reads .gittrees',
    run () {
      let entries = git.subtrees.load(repo)
      if (!Array.isArray(entries)) {
        return { pass: false, message: 'load did not return array' }
      }
      if (entries.length < 4) {
        return { pass: false, message: 'expected >= 4 subtrees, got ' + entries.length + ' (repo: ' + repo + ')' }
      }
      let avsc = entries.find(e => e.prefix === 'lib/avsc')
      if (!avsc) {
        return { pass: false, message: 'lib/avsc not found in subtrees' }
      }
      if (!avsc.remote || !avsc.branch) {
        return { pass: false, message: 'subtree entry missing remote or branch' }
      }
      return { pass: true, message: entries.length + ' subtrees' }
    }
  },
  {
    name: 'subtrees.find returns entry for known prefix',
    run () {
      let entry = git.subtrees.find(repo, 'lib/git')
      if (!entry) {
        return { pass: false, message: 'lib/git not found' }
      }
      if (entry.remote !== 'bare-for-pear-git') {
        return { pass: false, message: 'unexpected remote: ' + entry.remote }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'subtrees.find returns null for unknown prefix',
    run () {
      let entry = git.subtrees.find(repo, 'lib/nonexistent')
      if (entry !== null && entry !== undefined) {
        return { pass: false, message: 'expected null for unknown prefix' }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- detectReality ---
  {
    name: 'detectReality from root is repo mode',
    run () {
      let reality = git.detectReality(repo, '/')
      if (reality.mode !== 'repo') {
        return { pass: false, message: 'expected repo mode, got ' + reality.mode }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'detectReality from subtree is subtree mode',
    run () {
      let reality = git.detectReality(repo, '/lib/avsc')
      if (reality.mode !== 'subtree') {
        return { pass: false, message: 'expected subtree mode, got ' + JSON.stringify(reality) }
      }
      if (reality.prefix !== 'lib/avsc') {
        return { pass: false, message: 'unexpected prefix: ' + reality.prefix }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'detectReality from non-subtree subdir is repo mode',
    run () {
      let reality = git.detectReality(repo, '/spl/mycelium')
      if (reality.mode !== 'repo') {
        return { pass: false, message: 'expected repo mode, got ' + reality.mode }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'detectReality from _test is subtree mode',
    run () {
      let reality = git.detectReality(repo, '/_test')
      if (reality.mode !== 'subtree') {
        return { pass: false, message: 'expected subtree mode, got ' + JSON.stringify(reality) }
      }
      if (reality.remote !== 'spl5-test') {
        return { pass: false, message: 'unexpected remote: ' + reality.remote }
      }
      return { pass: true, message: 'ok' }
    }
  },

  // --- remote ---
  {
    name: 'remote.list returns known remotes',
    run () {
      let remotes = git.remote.list(repo)
      if (remotes.error) {
        return { pass: false, message: remotes.error }
      }
      if (!remotes.origin) {
        return { pass: false, message: 'origin not found in remotes' }
      }
      return { pass: true, message: Object.keys(remotes).length + ' remotes' }
    }
  },
  {
    name: 'remote.list includes subtree remotes',
    run () {
      let remotes = git.remote.list(repo)
      if (!remotes['bare-for-pear-rpc-server']) {
        return { pass: false, message: 'bare-for-pear-rpc-server not in remotes' }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'remote.getPlatform defaults to github',
    run () {
      let p = git.remote.getPlatform()
      if (p !== 'github') {
        return { pass: false, message: 'expected github, got ' + p }
      }
      return { pass: true, message: 'ok' }
    }
  },
  {
    name: 'remote.repoUrl formats github url',
    run () {
      let url = git.remote.repoUrl('bare-for-pear/test')
      if (url !== 'https://github.com/bare-for-pear/test.git') {
        return { pass: false, message: 'unexpected url: ' + url }
      }
      return { pass: true, message: 'ok' }
    }
  }
]
