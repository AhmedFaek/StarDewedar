import { validateCustomerEmail } from './emailValidation.service.js'

export const validateAndNormalizeRequestEmail = async (data) => {
    const result = await validateCustomerEmail(data.email)
    if (!result.isValid) {
        const error = new Error(result.error)
        error.code = result.code
        throw error
    }

    return {
        ...data,
        email: result.normalizedEmail,
    }
}
