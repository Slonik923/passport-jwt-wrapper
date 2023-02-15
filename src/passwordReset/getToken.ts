import config from 'config'

import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { createJwt } from '../utils/jwt'

/**
 * return 10 "random" characters
 */
function getRandomChars(): string {
	return Math.random().toString(36).substring(2, 10) // just 10 chars
}

function getRandomString(length: number): string {
	let result = getRandomChars()
	while (result.length < length) {
		result = `${result}${getRandomChars()}`
	}

	if (result.length > length) {
		result = result.substring(0, length)
	}

	return result
}

/**
 * Password reset getToken method. This method should take approximately same time to execute regardless of input, to prevent timing attacks.
 * If `passwordResetTokeRepository` is provided token is saved it this repository by calling `passwordResetTokeRepository.savePasswordResetToken`.
 * This method should be used in the endpoint requesting password change. Token generated by this method should not be returned directly to user,
 * but some other communication channel should be used (e.g. email)
 * Returns reset password token encrypted with concatenation of server jwt secret and user password, which makes this token usable just once.
 * @param email
 */
export default async function getToken(email: string): Promise<string | undefined> {
	const state = State.getInstance()
	let user = await state.userRepository.getUserByEmail(email)

	const passportConfig: IPassportConfig = config.get('passportJwtWrapper.passport')

	let passportSecret = passportConfig.jwt.secretOrKey

	const randomString = getRandomString(60 + passportSecret.length)

	let mock = false
	if (!user) {
		mock = true
		user = {
			id: randomString.substring(0, 36),
			hash: randomString.substring(0, 60)
		}

		passportSecret = randomString
	}

	const tokenPayload = {
		uid: user.id
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.PASSWORD_RESET,
		expiresIn: passportConfig.jwt.passwordReset.exp
	}

	const tokenSecret = `${passportSecret}${user.hash}`
	const resetPasswordToken = await createJwt(tokenPayload, tokenOptions, tokenSecret)

	if (mock) {
		return undefined
	}

	// save token when savePasswordResetToken repository is provided
	if (state.passwordResetTokenRepository) {
		await state.passwordResetTokenRepository.savePasswordResetToken(user.id, resetPasswordToken)
	}

	return resetPasswordToken
}

/*
// just for reference
export async function getTokenOld(email: string): Promise<undefined | string> {
	const state = State.getInstance()
	const user = await state.userRepository.getUserByEmail(email)

	if (!user) {
		return undefined
	}

	const tokenPayload = {
		uid: user.id
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.PASSWORD_RESET,
		expiresIn: passportConfig.jwt.passwordReset.exp
	}

	const tokenSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
	const resetPasswordToken = await createJwt(tokenPayload, tokenOptions, tokenSecret)

	// save token when savePasswordResetToken repository is provided
	if (state.passwordResetTokenRepository) {
		await state.passwordResetTokenRepository.savePasswordResetToken(user.id, resetPasswordToken)
	}

	return resetPasswordToken
}
 */
