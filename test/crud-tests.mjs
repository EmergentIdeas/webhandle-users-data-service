import test from "node:test"
import assert from "node:assert"
import User from "@webhandle/users-data/data/user.mjs"
import initializeWebhandleComponent from "../initialize-webhandle-component.mjs"

import authParameters from "../default-auth-service-parameters.mjs"

export default async function setup(webhandle) {
	let manager = await initializeWebhandleComponent(webhandle)
	await test('all crud tests', async (t) => {
		await t.test('crud tests', async (t) => {
			let authService = webhandle.services.authService
			let user = new User({
				name: 'one',
				email: 'one@service.com'
			})
			await manager.services.usersDataService.save(user)

			user = await authService.findUser('one')
			if (user) {
				if (user.email == 'one@service.com') {
					return
				} else {
					throw new Error("User's email did not match.")
				}
			} else {
				throw new Error('Could not find user.')
			}


		})
		await t.test('crud tests', async (t) => {
			let pr = new Promise(async (resolve, reject) => {
				let authService = webhandle.services.authService
				let user = await authService.findUser('one')
				authService.updatePass(user, 'hellothere')

				await manager.services.usersDataService.save(user)

				authService.login('one', 'hellothere', async (err, user) => {

					if (user) {
						authService.login('one', 'hellothere2', async (err, user) => {
							if (user) {
								await webhandle.shutdown()
								return reject(new Error("Login with bad password allowed."))
							}
							if (!err) {
								await webhandle.shutdown()
								return reject(new Error("No login error was created even though login failed."))
							}
							await webhandle.shutdown()
							return resolve()
						})

					} else {
						await webhandle.shutdown()
						return reject(new Error('Login failed.'))
					}

				})
			})
			return pr
		})

	})

}

function parm(parms) {
	return Object.assign({}, authParameters, parms)
}
