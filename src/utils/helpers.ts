import { Request } from 'express'

// eslint-disable-next-line import/prefer-default-export
export function getTFunction(req: Request) {
	if (req.t) {
		return req.t
	}

	return (key: string) => key
}