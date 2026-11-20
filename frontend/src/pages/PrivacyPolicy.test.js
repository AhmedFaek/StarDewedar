import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const readLocale = async (language) => JSON.parse(await readFile(
  new URL(`../locales/${language}.json`, import.meta.url),
  'utf8'
))

test('privacy policy locales have matching structure, required contact, and no prohibited claims', async () => {
  const [english, arabic] = await Promise.all([
    readLocale('en'),
    readLocale('ar'),
  ])
  const enPolicy = english.privacy
  const arPolicy = arabic.privacy
  const requiredKeys = [
    'title',
    'updated',
    'intro',
    'noticeBefore',
    'registrationNoticeBefore',
    'noticeAfter',
    'sections',
  ]

  for (const key of requiredKeys) {
    assert.ok(Object.hasOwn(enPolicy, key), `English privacy.${key} exists`)
    assert.ok(Object.hasOwn(arPolicy, key), `Arabic privacy.${key} exists`)
  }
  assert.ok(english.footer.privacyPolicy)
  assert.ok(arabic.footer.privacyPolicy)

  const structure = (policy) => ({
    sectionCount: policy.sections.length,
    sections: policy.sections.map(({ heading, paragraphs, items }) => ({
      heading: Boolean(heading),
      paragraphs: paragraphs.length,
      items: items.length,
    })),
  })

  assert.deepEqual(structure(enPolicy), structure(arPolicy))
  assert.match(JSON.stringify(enPolicy), /info@stardewedar\.com/i)
  assert.match(JSON.stringify(arPolicy), /info@stardewedar\.com/i)
  assert.doesNotMatch(JSON.stringify(enPolicy), /anonymous|gdpr/i)
  assert.doesNotMatch(JSON.stringify(arPolicy), /anonymous|gdpr/i)
})

test('privacy policy page uses no external HTTP links', async () => {
  const component = await readFile(new URL('./PrivacyPolicy.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(component, /https?:\/\//i)
  assert.match(component, /mailto:/i)
})
