import AuthService from "../auth-service.mjs"
import test from "node:test"
import assert from "node:assert"

import authParameters from "../default-auth-service-parameters.mjs"

function parm(parms) {
	return Object.assign({}, authParameters, parms)
}

await test('basic tests for functionality', async (t) => {
	await t.test('hashes', async (t) => {
		let authService = new AuthService(parm({
			salt: 'mmm'
		}))
		let hash = authService.passHash('hellothere', 'dan')
		assert(authService.verify(hash, 'hellothere', 'dan'))
		assert(!authService.verify(hash, 'hellothere2', 'dan'))
		
		authService = new AuthService(parm({
			salt: 'mmm',
			iterations: 100
		}))
		
		assert(!authService.verify(hash, 'hellothere', 'dan'), 'iteration count')
		hash = authService.passHash('hellothere', 'dan')
		assert(authService.verify(hash, 'hellothere', 'dan'))
		assert(!authService.verify(hash, 'hellothere'), 'require user name salt')
		
		authService = new AuthService(parm({
			iterations: 100
		}))
		assert(!authService.verify(hash, 'hellothere', 'dan'), 'default salt')
		hash = authService.passHash('hellothere', 'dan')
		assert(authService.verify(hash, 'hellothere', 'dan'), 'verify default salt')
		authService = new AuthService(parm({
			iterations: 100,
			algorithm: 'sha512'
		}))
		assert(!authService.verify(hash, 'hellothere', 'dan'), 'algorithm change')
	})
})