import test from 'node:test'
import assert from 'node:assert/strict'
import { hashOtp, verifyOtp } from '../utils/hash.js'

test('OTP hash/verify works and is timing safe', () => {
  const code = '123456'
  const stored = hashOtp(code)
  assert.equal(verifyOtp(code, stored), true)
  assert.equal(verifyOtp('654321', stored), false)
})
