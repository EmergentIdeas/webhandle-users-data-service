import createInitializeWebhandleComponent from "@webhandle/initialize-webhandle-component/create-initialize-webhandle-component.mjs"
import ComponentManager from "@webhandle/initialize-webhandle-component/component-manager.mjs"
import filog from 'filter-log'
import setupReqResObjects from "./setup-req-res-objects.mjs"
import setupDataServices from "./setup-data-services.mjs"
import AuthService from "./auth-service.mjs"
import authParameters from "./default-auth-service-parameters.mjs"

let initializeWebhandleComponent = createInitializeWebhandleComponent()

initializeWebhandleComponent.componentName = '@webhandle/users-data-service'
initializeWebhandleComponent.componentDir = import.meta.dirname
initializeWebhandleComponent.defaultConfig = Object.assign({
	usersCollectionName: 'webhandleusers_users'
	, groupsCollectionName: 'webhandleusers_groups'
	, sessionLength: 30 * 24 * 60 * 60 * 1000
	, databaseName: undefined
}, authParameters)

let log = initializeWebhandleComponent.log = filog('webhandle', { component: 'users-data-service' })


initializeWebhandleComponent.setup = async function (webhandle, config) {
	let manager = new ComponentManager()
	manager.sessionFinder = function(req, res) {
		return req.tracker || {}
	}
	manager.sessionSaver = function(req, res, session, callback) {
		res.track(session, callback)
	}
	manager.log = log
	manager.config = config

	let databaseConfig
	if(config.databaseName) {
		databaseConfig = webhandle.dbs[config.databaseName]
	}
	if(!databaseConfig) {
		databaseConfig = webhandle.primaryDatabase
	}
	let database = databaseConfig.db
	

	setupReqResObjects(webhandle, manager)
	setupDataServices(webhandle, manager, database)
	
	let authServiceOptions = {
		iterations: config.iterations
		, salt: config.salt 
		, algorithm: config.algorithm 
		, usersDataService: manager.services.usersDataService
		, groupsDataService: manager.services.groupsDataService
		, maxFailures: config.maxFailures
	}
	let authService = new AuthService(authServiceOptions)
	manager.services.authService = webhandle.services.authService = authService


	return manager
}

export default initializeWebhandleComponent
