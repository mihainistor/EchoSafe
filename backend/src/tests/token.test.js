import { test } from 'node:test'
import assert from 'node:assert/strict'
import { issueToken, verifyToken } from '../utils/token.js'

test('issue and verify token with payload', () => {
  const t = issueToken({ sub: 'user-123', role: 'admin' })
  const p = verifyToken(t)
  assert.equal(p.sub, 'user-123')
  assert.equal(p.role, 'admin')
  assert.ok(p.iat > 0)
  assert.ok(p.exp > p.iat)
})
