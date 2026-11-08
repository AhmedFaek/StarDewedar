import test from 'node:test'
import assert from 'node:assert/strict'
import { getEmailSuggestion } from './emailSuggestion.js'

const typoCases = [
  ['gmai.com', 'gmail.com'],
  ['gmial.com', 'gmail.com'],
  ['gamil.com', 'gmail.com'],
  ['gmil.com', 'gmail.com'],
  ['gmail.cm', 'gmail.com'],
  ['gmail.con', 'gmail.com'],
  ['yaho.com', 'yahoo.com'],
  ['yahoo.con', 'yahoo.com'],
  ['yahooo.com', 'yahoo.com'],
  ['yhoo.com', 'yahoo.com'],
  ['hotmial.com', 'hotmail.com'],
  ['hotmai.com', 'hotmail.com'],
  ['hotmail.con', 'hotmail.com'],
  ['outlok.com', 'outlook.com'],
  ['outloo.com', 'outlook.com'],
  ['outlook.con', 'outlook.com'],
  ['iclould.com', 'icloud.com'],
  ['icloud.con', 'icloud.com'],
  ['gmail.comm', 'gmail.com'],
  ['gmaill.com', 'gmail.com'],
  ['gmal.com', 'gmail.com'],
  ['gnail.com', 'gmail.com'],
  ['hotmail.comm', 'hotmail.com'],
  ['hotmal.com', 'hotmail.com'],
  ['yahoo.comm', 'yahoo.com'],
  ['outlook.comm', 'outlook.com'],
  ['icloud.comm', 'icloud.com'],
  ['live.con', 'live.com'],
]

test('suggests corrected domains for every configured common typo', () => {
  for (const [typo, correction] of typoCases) {
    assert.equal(getEmailSuggestion(`person@${typo}`), `person@${correction}`, typo)
  }
})

test('does not suggest changes for valid and custom domains', () => {
  assert.equal(getEmailSuggestion('person@gmail.com'), null)
  assert.equal(getEmailSuggestion('person@company.example'), null)
})

test('matches domains case-insensitively and preserves plus-tagged dotted local parts', () => {
  assert.equal(getEmailSuggestion('First.Last+tag@GMAIL.COMM'), 'First.Last+tag@gmail.com')
})

test('ignores malformed addresses, empty values, and non-string values', () => {
  for (const email of ['first@last@example.com', 'person', '', '   ', null, undefined, 42]) {
    assert.equal(getEmailSuggestion(email), null)
  }
})

test('trims surrounding whitespace before suggesting', () => {
  assert.equal(getEmailSuggestion('  person+tag@example@gmai.com  '), null)
  assert.equal(getEmailSuggestion('  person+tag@gmai.com  '), 'person+tag@gmail.com')
})
