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
