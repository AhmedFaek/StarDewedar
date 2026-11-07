/**
 * Escape HTML special characters to prevent HTML injection / XSS in emails or rendered output.
 * @param {string} str
 * @returns {string}
 */
export const escapeHtml = (str) => {
    if (str === null || str === undefined) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

export const sanitizeEmailText = (value, maxLength, { ellipsis = false } = {}) => {
    const normalized = String(value ?? '')
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
        .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gi, '')
        .replace(/\s+/g, ' ')
        .trim()

    if (normalized.length <= maxLength) return normalized
    if (!ellipsis || maxLength === 0) return normalized.slice(0, maxLength).trim()
    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}
