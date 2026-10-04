/**
 * SEO Utilities for Star Dewedar
 * Centralizes all metadata management for consistency.
 *
 * Architecture note: This is a client-side SPA (Vite + React Router).
 * There is no SSR. All meta tags are set dynamically via DOM manipulation.
 * For true server-side rendering, a future migration to Next.js or a
 * pre-rendering service (e.g., Prerender.io) would be required.
 */

export const SITE = {
  name: 'Star Dewedar',
  url: import.meta.env.VITE_SITE_URL || 'https://stardewedar.com',
  defaultLocale: 'en',
  /** Default OG image — points to the logo until a dedicated social-share image is created */
  defaultOgImage: '/logo/logo.webp',
}

/**
 * Build a full canonical URL for a given path.
 * @param {string} path - e.g. '/products' or '/product-detail?id=abc'
 * @returns {string} Full HTTPS URL
 */
export function buildUrl(path = '') {
  const base = SITE.url.replace(/\/$/, '')
  return `${base}${path}`
}

/**
 * Truncate a string to a max character length, appending '…' if needed.
 * Useful for generating meta descriptions from arbitrary product/project text.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 155) {
  if (!str) return ''
  const cleaned = str.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen - 1).trimEnd() + '…'
}

/**
 * Set all document-level SEO meta tags for a given page.
 * Should be called inside a useEffect in each page component.
 *
 * @param {Object} params
 * @param {string}  params.title        - Full page title (will be set as document.title)
 * @param {string}  [params.description]- Meta description
 * @param {string}  [params.canonical]  - Canonical URL (full HTTPS URL)
 * @param {string}  [params.ogType]     - Open Graph type (default: 'website')
 * @param {string}  [params.ogImage]    - Absolute URL to OG image
 * @param {string}  [params.lang]       - Document language ('en' | 'ar')
 */
export function setPageMeta({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = SITE.defaultOgImage,
  lang = 'en',
}) {
  // ── Title ─────────────────────────────────────────────────────────────────
  if (title) {
    document.title = title
  }

  // ── Lang attribute ────────────────────────────────────────────────────────
  if (lang) {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  // ── Meta description ──────────────────────────────────────────────────────
  setMeta('name', 'description', description || '')

  // ── Canonical ─────────────────────────────────────────────────────────────
  setLink('canonical', canonical || buildUrl(window.location.pathname + window.location.search))

  // ── Open Graph ────────────────────────────────────────────────────────────
  setMeta('property', 'og:type', ogType)
  setMeta('property', 'og:site_name', SITE.name)
  setMeta('property', 'og:title', title || '')
  setMeta('property', 'og:description', description || '')
  setMeta('property', 'og:url', canonical || buildUrl(window.location.pathname + window.location.search))

  const resolvedOgImage = ogImage
    ? (ogImage.startsWith('http') ? ogImage : buildUrl(ogImage))
    : buildUrl(SITE.defaultOgImage)
  setMeta('property', 'og:image', resolvedOgImage)

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title || '')
  setMeta('name', 'twitter:description', description || '')
  setMeta('name', 'twitter:image', resolvedOgImage)
}

// ── Internal DOM helpers ───────────────────────────────────────────────────────

function setMeta(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Inject or update a JSON-LD structured data script in the document head.
 * Uses a unique `data-schema-id` attribute to avoid duplicating scripts on
 * route changes.
 *
 * @param {string} id     - Unique identifier for this schema (e.g. 'organization', 'product-abc')
 * @param {Object} schema - JSON-LD object
 */
export function setJsonLd(id, schema) {
  const attr = 'data-schema-id'
  let el = document.querySelector(`script[${attr}="${id}"]`)
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    el.setAttribute(attr, id)
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(schema)
}

/**
 * Remove a JSON-LD script by its id (call on component unmount to avoid
 * stale structured data from a previous route).
 * @param {string} id
 */
export function removeJsonLd(id) {
  const el = document.querySelector(`script[data-schema-id="${id}"]`)
  if (el) el.remove()
}
