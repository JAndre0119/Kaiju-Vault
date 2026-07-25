const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 30
const MIN_PASSWORD_LENGTH = 8

export function getRegisterValidationError({ username, email, password }) {
  if (typeof username !== 'string' || username.trim().length < MIN_USERNAME_LENGTH || username.trim().length > MAX_USERNAME_LENGTH) {
    return `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters.`
  }

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return 'Email must be a valid email address.'
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  return null
}

export function getLoginValidationError({ email, password }) {
  if (typeof email !== 'string' || email.trim().length === 0) {
    return 'Email is required.'
  }

  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required.'
  }

  return null
}
