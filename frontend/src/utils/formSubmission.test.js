import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  NetworkRequestError,
  runFormSubmission,
} from './formSubmission.js'

const createSpies = () => ({
  success: [],
  errors: [],
  unknown: [],
  logs: [],
  showSuccess(message) {
    this.success.push(message)
  },
  showError(message) {
    this.errors.push(message)
  },
  onUnknownOutcome(error) {
    this.unknown.push(error)
    return true
  },
  logger: null,
})

test('throwing success callback does not change a successful outcome or suppress success notification', async () => {
  const spies = createSpies()
  spies.logger = { error: (...args) => spies.logs.push(args) }
  let callbackCalled = false

  await runFormSubmission({
    onSubmit: async () => ({ id: 'created' }),
    successMessage: 'Success',
    showSuccess: spies.showSuccess.bind(spies),
    showError: spies.showError.bind(spies),
    onUnknownOutcome: spies.onUnknownOutcome.bind(spies),
    onSuccess: () => {
      callbackCalled = true
      throw new Error('cleanup failed')
    },
    logger: spies.logger,
  })

  assert.deepEqual(spies.success, ['Success'])
  assert.equal(callbackCalled, true)
  assert.equal(spies.unknown.length, 0)
  assert.equal(spies.errors.length, 0)
  assert.equal(spies.logs.length, 1)
  assert.equal(spies.logs[0][0], 'Form submission success callback failed')
  assert.deepEqual(spies.logs[0][1], { errorName: 'Error' })
})

test('throwing success notification is logged and success callback still runs', async () => {
  const spies = createSpies()
  spies.logger = { error: (...args) => spies.logs.push(args) }
  let callbackCalled = false

  await runFormSubmission({
    onSubmit: async () => ({ id: 'created' }),
    successMessage: 'Success',
    showSuccess: () => {
      throw new Error('toast failed')
    },
    showError: spies.showError.bind(spies),
    onUnknownOutcome: spies.onUnknownOutcome.bind(spies),
    onSuccess: () => {
      callbackCalled = true
    },
    logger: spies.logger,
  })

  assert.equal(callbackCalled, true)
  assert.equal(spies.unknown.length, 0)
  assert.equal(spies.errors.length, 0)
  assert.equal(spies.logs.length, 1)
  assert.equal(spies.logs[0][0], 'Form submission success notification failed')
})

test('network fetch rejection is the unknown-outcome case', async () => {
  const spies = createSpies()
  const networkError = new NetworkRequestError(new TypeError('Failed to fetch'))

  await runFormSubmission({
    onSubmit: async () => {
      throw networkError
    },
    ambiguousNetworkError: true,
    showSuccess: spies.showSuccess.bind(spies),
    showError: spies.showError.bind(spies),
    onUnknownOutcome: spies.onUnknownOutcome.bind(spies),
  })

  assert.deepEqual(spies.unknown, [networkError])
  assert.equal(spies.errors.length, 0)
})

test('unmarked TypeError from response parsing is known, not unknown', async () => {
  const spies = createSpies()
  const parseError = new TypeError('response.text is not a function')
  let errorHandlerCalled = false

  await runFormSubmission({
    onSubmit: async () => {
      throw parseError
    },
    ambiguousNetworkError: true,
    onError: (error) => {
      errorHandlerCalled = error === parseError
      return false
    },
    showSuccess: spies.showSuccess.bind(spies),
    showError: spies.showError.bind(spies),
    onUnknownOutcome: spies.onUnknownOutcome.bind(spies),
  })

  assert.equal(errorHandlerCalled, true)
  assert.equal(spies.unknown.length, 0)
  assert.equal(spies.errors.length, 1)
})
