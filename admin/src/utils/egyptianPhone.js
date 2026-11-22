export const EGYPTIAN_PHONE_REGEX = /^(?:01\d{9}|\+20\d{10})$/

export const isValidEgyptianPhoneNumber = (value) =>
  typeof value === 'string' && EGYPTIAN_PHONE_REGEX.test(value)

export const isAllowedEgyptianPhoneInput = (value) => {
  if (typeof value !== 'string' || !/^\+?\d*$/.test(value)) return false
  return value.startsWith('+') ? value.length <= 13 : value.length <= 11
}

export const getAllowedEgyptianPhoneInput = (event) => {
  const value = event.currentTarget.value
  return isAllowedEgyptianPhoneInput(value) ? value : null
}
