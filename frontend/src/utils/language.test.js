import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveUiLanguage } from './language.js'

test('resolves supported languages and regional variants to the UI language', () => {
  const cases = [
    ['ar', 'ar'],
    ['ar-EG', 'ar'],
    ['ar-SA', 'ar'],
    ['en', 'en'],
    ['en-US', 'en'],
  ]

  for (const [input, expected] of cases) {
    assert.equal(resolveUiLanguage(input), expected, input)
  }
})

test('uses English for unsupported or missing language codes', () => {
  assert.equal(resolveUiLanguage('fr-FR'), 'en')
  assert.equal(resolveUiLanguage(undefined), 'en')
})
