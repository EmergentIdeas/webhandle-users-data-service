# @webhandle/users-data-service

Functionality for storing users and groups, as well as loading the user object based on 
the session stored in a cookie.


## Major Exposed Functions

```js
// the caller must wait for the callback because of the encryption that takes
// place when writing the cookie
res.createUserSession(userName, callback)


// the caller must wait for the callback because of the encryption that takes
// place when writing the cookie
res.removeUserSession(callback)

// If there is a user session, the user object will be here
req.user

```

There is a auth service which can check if a user is allowed to log in and code
to safely hash a user's password.


```js
/**
 * Attempts to log in a user with name `name` and pass `pass`. If successful, a user is returned.
 * All other conditions result in an error on callback or a rejection of the promise.
 * @param {string} name 
 * @param {string} pass 
 * @param {function} [callback] With signature (err, user)
 * @returns A promise which has the same resolve behavior as the callback.
 */
login(name, pass, callback /* (err, user) */) 


/**
 * Updates pass but does not save.
 * @param {User} user 
 * @param {string} newPassword 
 * @returns The user object
 */
updatePass(user /* User */, newPassword) 

/**
 * Finds a user
 * @param {string} name The login name of the user
 * @param {function} callback A function with signature (err, user)
 * @returns a promise which will resolve to a user object if a matching user is found.
 */
findUser(name, callback) 



/**
 * Creates a new user if one by this name does not exist
 * @param {String} name
 * @param {String} pass
 * @param {Array[string]} groups
 * @returns The user, either existing or created.
*/
async createUserIfNoneExists(name, pass, groups) {

```

The auth services is available at `webhandle.services.authService` and at

```js
import setup from '@webhandle/users-data-service/initialize-webhandle-component.mjs'
let manager = await setup(webhandle)

manager.services.authService
manager.services.usersDataService
manager.services.groupsDataService
```

`usersDataService` and `groupsDataService` are instances of `@dankolz/abstract-data-service`


## Config 

```json
{
	"@webhandle/users-data-service": {
		"usersCollectionName": "webhandleusers_users"
		, "groupsCollectionName": "webhandleusers_groups"
		, "sessionLength": 2592000000
		, "databaseName": null
		, "iterations": 156
		, "salt": "two may keep it if one is dead"
		, "algorithm": "sha256"
		, "maxFailures": 10
	}
}
```

`sessionLength` defaults to 30 days. `maxFailures` is how many time the user can attempt login
before the account is disabled. The `salt` is used to make the hashed passwords harder to 
guess.

If the `databaseName` is null, it will use `webhandle.primaryDatabase`. If it's set, it will
use `webhandle.dbs[databaseName]`.
