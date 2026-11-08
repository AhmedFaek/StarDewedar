const COMMON_DOMAIN_TYPOS = Object.freeze({
  'gmai.com': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.comm': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.comm': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.comm': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclould.com': 'icloud.com',
  'icloud.comm': 'icloud.com',
  'icloud.con': 'icloud.com',
  'live.con': 'live.com',
})

export const getEmailSuggestion = (email) => {
  if (typeof email !== 'string') return null

  const trimmedEmail = email.trim()
  const separator = trimmedEmail.lastIndexOf('@')
  if (
    separator <= 0 ||
    separator === trimmedEmail.length - 1 ||
    trimmedEmail.indexOf('@') !== separator ||
    /\s/u.test(trimmedEmail)
  ) {
    return null
  }

  const localPart = trimmedEmail.slice(0, separator)
  const domain = trimmedEmail.slice(separator + 1).toLowerCase()
  const suggestedDomain = COMMON_DOMAIN_TYPOS[domain]
  if (!suggestedDomain) return null

  return `${localPart}@${suggestedDomain}`
}
