import crypto from "crypto"

import filog from "filter-log"
let log = filog('webhandle', { component: 'users-data-service.auth-service' })
import User from "@webhandle/users-data/data/user.mjs"
import Group from "@webhandle/users-data/data/group.mjs"

export default class AuthService {
	constructor({
		iterations = 156,
		salt = 'two may keep it if one is dead',
		algorithm = 'sha256',
		usersDataService,
		groupsDataService,
		maxFailures = 10 } = {}) {
		Object.assign(this, arguments[0])

	}

	passHash(plainTextPass, name) {
		name ||= ''
		let hash = plainTextPass + name
		for (var i = 0; i < this.iterations; ++i) {
			hash = crypto.createHmac(this.algorithm, this.salt).update(hash).digest('hex')
		}

		return hash
	}

	verify(cypherTextPass, plainTextPass, name) {
		try {
			let calculatedPass = this.passHash(plainTextPass, name)
			return crypto.timingSafeEqual(Buffer.from(cypherTextPass, 'utf-8'), Buffer.from(calculatedPass, 'utf-8'))
		}
		catch (e) {
			log.error(e)
			return false
		}
	}
	findUser(name, callback) {
		name = name.toLowerCase().trim()
		let p = new Promise(async (resolve, reject) => {
			try {
				let user = await this.usersDataService.fetchOne({ name: name })
				if (user) {
					user = new User(user)
				}
				resolve(user)
				if (callback) {
					callback(null, user)
				}
			}
			catch (e) {
				reject(e)
				if (callback) {
					callback(e)
				}
			}
		})

		return p
	}
	async fetchGroups() {
		let groups = await this.groupsDataService.fetch({})
		return groups.map(group => new Group(group))
	}
	async createGroup(name) {
		name = name.toLowerCase().trim()
		let [result] = await this.groupsDataService.save(new Group({ name: name }))

		return result
	}

	/**
	 * Attempts to log in a user with name `name` and pass `pass`. If successful, a user is returned.
	 * All other conditions result in an error on callback or a rejection of the promise.
	 * @param {string} name 
	 * @param {string} pass 
	 * @param {function} [callback] With signature (err, user)
	 * @returns A promise which has the same resolve behavior as the callback.
	 */
	login(name, pass, callback /* (err, user) */) {
		let p = new Promise(async (resolve, reject) => {
			try {
				let user = await this.findUser(name)
				if (user) {
					if (this.isEnabled(user) && this.verify(user.hashedPass, pass, name)) {
						if (user.failedAttempts > 0) {
							user.failedAttempts = 0
							await this.usersDataService.save(user)
						}
						resolve(user)
						if (callback) {
							callback(null, user)
						}
						return
					}
					else {
						user.failedAttempts++
						if (user.failedAttempts >= this.maxFailures) {
							user.enabled = false
						}
						await this.usersDataService.save(user)
					}
				}
				let e = new Error('Login failed')
				e.user = user

				reject(e)
				if (callback) {
					callback(e)
				}
				return
			}
			catch (e) {
				reject(e)
				if (callback) {
					callback(e)
				}

				return
			}

		})
		return p

	}
	/**
	 * Updates pass but does not save.
	 * @param {User} user 
	 * @param {string} newPassword 
	 * @returns The user object
	 */
	updatePass(user /* User */, newPassword) {
		user.hashedPass = this.passHash(newPassword, user.name)
		return user
	}

	/**
	 * Returns true if the user account is enabled
	 * @param {User} user 
	 */
	isEnabled(user) {
		return user.enabled === true || user.enabled === 'true'
	}

	/**
	 * Takes the name of the user, changes the password if the old pass matches and
	 * returns the user. Bad password or inactive user results in a thrown error.
	 * @param {string} name User name
	 * @param {string} oldpass The old password
	 * @param {string} newpass The new password
	 * @returns 
	 */
	async changePassword(name, oldpass, newpass) {
		let user = await this.findUser(name)
		if (user) {
			if (this.isEnabled(user) && this.verify(user.hashedPass, oldpass, name)) {
				this.updatePass(user, newpass)
				await this.usersDataService.save(user)
				return user
			}
			else {
				throw new AuthorizationFailed()
			}
		}
		throw new AuthorizationFailed()
	}
	

	/**
	* @param {Object} authService
	* @param {String} name
	* @param {String} pass
	* @param {Array[string]} groups
	* @returns The user, either existing or created.
	*/
	async createUserIfNoneExists(name, pass, groups) {
		let user = await this.findUser(name)
		if (!user) {
			user = new User({
				name: name
			})

			if (groups && typeof groups != 'function') {
				user.groups = groups
				let dbGroups = await this.fetchGroups()
				let dbGroupNames = dbGroups.map(group => group.name)
				for (let group of groups) {
					if (!dbGroupNames.includes(group)) {
						await this.createGroup(group)
					}
				}
			}
			this.updatePass(user, pass)
			await this.usersDataService.save(user, callback)
		}
		return user
	}

}