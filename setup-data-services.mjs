import MongoDataService from "@dankolz/mongodb-data-service";
import EventEmitter from "node:events";

export default function setupDataServices(webhandle, manager, mongoDb) {

	let mongoUsersCollection = mongoDb.collection(manager.config.usersCollectionName)
	let mongoGroupsCollection = mongoDb.collection(manager.config.groupsCollectionName)

	let usersEvents = new EventEmitter()

	let usersDataService = new MongoDataService({
		collections: {
			default: mongoUsersCollection
		}
		, notification: usersEvents
	})
	
	manager.services.usersDataService = usersDataService
	
	
	
	let groupsEvents = new EventEmitter()

	let groupsDataService = new MongoDataService({
		collections: {
			default: mongoGroupsCollection
		}
		, notification: groupsEvents
	})
	
	manager.services.groupsDataService = groupsDataService
	
}