import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as backend from '../backend/src/utils/egyptianPhone.js'
import * as frontend from '../frontend/src/utils/egyptianPhone.js'
import * as admin from '../admin/src/utils/egyptianPhone.js'

const implementations = [backend, frontend, admin]
const expectedExports = [
  'EGYPTIAN_PHONE_REGEX',
  'getAllowedEgyptianPhoneInput',
  'isAllowedEgyptianPhoneInput',
  'isValidEgyptianPhoneNumber',
]

test('all app-local copies expose the same four named exports', () => {
  for (const implementation of implementations) {
    assert.deepEqual(Object.keys(implementation).sort(), expectedExports)
  }
})

test('all app-local copies have identical Egyptian phone regex behavior', () => {
  const values = [
    '01287879794',
    '+201287879794',
    '0128787979',
    '+20128787979',
    '02287879794',
    '01287abc794',
    '',
    null,
  ]

  const results = implementations.map(({ EGYPTIAN_PHONE_REGEX }) =>
    values.map((value) =>
      typeof value === 'string' && EGYPTIAN_PHONE_REGEX.test(value)
    )
  )

  assert.deepEqual(results[1], results[0])
  assert.deepEqual(results[2], results[0])
  assert.deepEqual(implementations[1].EGYPTIAN_PHONE_REGEX.source, implementations[0].EGYPTIAN_PHONE_REGEX.source)
  assert.deepEqual(implementations[2].EGYPTIAN_PHONE_REGEX.source, implementations[0].EGYPTIAN_PHONE_REGEX.source)
})

test('all app-local copies validate valid and invalid Egyptian phone numbers identically', () => {
  const values = [
    '01287879794',
    '+201287879794',
    '0128787979',
    '012878797941',
    '02287879794',
    '+20128787979',
    '+2012878797941',
    '01287abc794',
    null,
  ]
  const results = implementations.map(({ isValidEgyptianPhoneNumber }) =>
    values.map(isValidEgyptianPhoneNumber)
  )

  assert.deepEqual(results[1], results[0])
  assert.deepEqual(results[2], results[0])
})

test('all app-local copies filter partial phone input identically', () => {
  const values = [
    '',
    '0',
    '012',
    '+',
    '+20',
    '01287879794',
    '+201287879794',
    '012878797941',
    '+2012878797941',
    '01287abc794',
    '+20 1287879794',
    null,
  ]
  const results = implementations.map(({ isAllowedEgyptianPhoneInput }) =>
    values.map(isAllowedEgyptianPhoneInput)
  )

  assert.deepEqual(results[1], results[0])
  assert.deepEqual(results[2], results[0])
})

test('all app-local copies handle valid, invalid, and missing event values identically', () => {
  const events = [
    { currentTarget: { value: '01287879794' } },
    { currentTarget: { value: '+201287879794' } },
    { currentTarget: { value: '01287abc794' } },
    { currentTarget: { value: '012878797941' } },
    { currentTarget: {} },
  ]
  const results = implementations.map(({ getAllowedEgyptianPhoneInput }) =>
    events.map(getAllowedEgyptianPhoneInput)
  )

  assert.deepEqual(results[1], results[0])
  assert.deepEqual(results[2], results[0])
  assert.deepEqual(results[0], [
    '01287879794',
    '+201287879794',
    null,
    null,
    null,
  ])
})
