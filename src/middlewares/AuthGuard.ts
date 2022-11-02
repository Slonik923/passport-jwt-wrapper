import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

export function AuthGuard() {
	return State.passport.authenticate(PASSPORT_NAME.JWT_API)
}
