
export default function setupReqResObjects(webhandle, manager) {
	let log = manager.log
	webhandle.routers.requestParse.use((req, res, next) => {

		res.createUserSession = function (userName, callback) {
			let token = {
				name: userName,
				expires: new Date(new Date().getTime() + (config.sessionLength))
			}
			let session = manager.sessionFinder(req)
			session.userToken = token
			manager.sessionSaver(req, res, session, callback)
		}

		res.removeUserSession = function (callback) {
			let session = manager.sessionFinder(req)
			delete session.userToken
			manager.sessionSaver(req, res, session, callback)
		}

		try {
			let session = manager.sessionFinder(req)
			if (session.userToken) {
				if (session.userToken.expires < new Date()) {
					return res.removeUserSession(() => {
						next()
					})
				}
				else {
					manager.services.authService.findUser(session.userToken.name, (err, user) => {
						if (user && user.enabled) {
							req.user = user
							return next()
						}
						else {
							return res.removeUserSession(() => {
								next()
							})
						}
					})
				}
			}
			else {
				return next()
			}
		}
		catch (e) {
			log.error(e)
			next()
		}
	})

}