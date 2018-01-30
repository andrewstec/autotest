# AutoTest
CPSC AutoTest submission service.

## Information Flow

AutoTest maintains a Mongo Database that tracks the results of all student submissions. AutoTest acts as a service that coordinates student submissions and updates the database accordingly. AutoTest acts as a central service for coordinating marking activities; course-specific marking activities are delegated to the course-specific marking containers. AutoTest validates the output from the course-specific containers: these outputs should be validated to ensure AutoTest is recording them appropriately. 

The steps undertaken by AutoTest are as follows:

1. The AutoTest service is notified via a GitHub webook that a commit or push event has been received. The timestamp is the timestamp associated with the web hook (it is important this be maintained and not get overwritten during subsequent steps as it captures the time of the student submission, rather than the time AutoTest took to process the commit); AutoTest inserts a record in the database:
```
{ 	key: GITHUB_SHA,                                        // NEW
	state: 'RECEIVED',                                      // NEW
	timestamp: <new Date(webook.pushed_at).getTime()>,      // NEW
	message: 'The commit has been received by AutoTest.'    // NEW
}
```

1b. The commit is placed on the standard test processing queue for its associated course. Before it can be processed, the `deliverableId` and `dockerId` to be used must be determined. `deliverableId` can be specified in the commit message (e.g., `#d1`), or can otherwise be retrieved from the database (only one deliverable can be open per course at a time). The `dockerId` to be used will also be retrieved frm the database, corresponding to the deliverable. Once this is done, the record above is updated:
```
{ 
	key: GITHUB_SHA,              // from prior record
	state: 'QUEUED',              // UPDATED
	timestamp: long,              // from prior record	
	message: 'The commit has been queued by AutoTest for processing.',  // UPDATED
	deliverableId: deliverableId, // NEW 
	dockerId: dockerId@sha        // NEW
}
```

1c. If a test request is received for the commit while it has `state: 'QUEUED'` (e.g., by the student explicitly requesting it), the record is updated (retaining the fields from the 1b step). The `message` is also posted back to the commit. If any other `state` is set, the `message` is returned (unless the state is `COMPLETED` and student is over-quota). If the student is over-quota, a message reporting the amount of time until they can request results should be returned; the results should _NOT_ be automatically returned because they may choose to request the results on a different commit by the time their quota is free again.

```
{ 
	key: GITHUB_SHA,              // from prior record
	state: 'REQUESTED',           // UPDATED
	timestamp: long,              // from prior record
	message: 'The commit has been queued by AutoTest for processing. The results will be posted back automatically when the test run is complete.', // updated
	deliverableId: deliverableId, // from prior record
	dockerId: dockerId@sha,       // from prior record
	requestor: <GITHUB_USERNAME>  // NEW
}
```


2. When the docker image has completed the record is again updated as below. If the state is `BUILDFAILED`, the `message` is immedeately posted back to the originating commit in GitHub. If the state for this `GITHUB_SHA` was `REQUESTED`, and the statate is `COMPLETED` the results of the `message` field are posted back to the container and the request counts against the student test quota. The format of the `details` field is extremely important and will be validated by AutoTest (more details below).

```
{ 
	key: GITHUB_SHA,                        // from prior record 
	state: 'COMPLETED | BUILDFAILED ',      // UPDATED
	timestamp: long,	                // from prior record
	message: '<SET BY THE DOCKER IMAGE>',   // UPDATED
	deliverableId: deliverableId,           // from prior record
	dockerId: dockerId@sha,                 // from prior record
	details: <set by the docker container>  // NEW
}
```

2b. If the container takes too long, or writes too much output, one of the following records will be saved to the database. The `message` field will be written back to the commit to provide feedback to the student.

```
{ 
	key: GITHUB_SHA,                         // from prior record 
	state: 'TIMELIMIT',                      // UPDATED  
	timestamp: long,                         // from prior record 	
	message: 'The commit exceeded the timeout for the container. Please improve local tests to avoid this problem (usually caused by infinite loops).', // UPDATED
	deliverableId: deliverableId,            // from prior record 
	dockerId: dockerId@sha                   // from prior record 
}
```

```
{ 
	key: GITHUB_SHA,                        // from prior record  
	state: 'OUTPUTLIMIT',                   // UPDATED
	timestamp: long,                        // from prior record 	
	message: 'The commit exceeded the timeout for the container. Please improve local tests to avoid this problem (usually caused by infinite loops).',  // UPDATED
	deliverableId: deliverableId,           // from prior record 
	dockerId: dockerId@sha                  // from prior record 
}
```

## AutoTest Results From Docker

XXX 1 MB limit, schema, response codes.

## Requirements

- Docker version 17.03.1-ce, build c6d412e (any close version will do)
- 'autotest.env' file in `./autotest/` directory: 
```
	DB_INSTANCE=http://localhost:11312 (old couchDB address)
	DB_ADMIN_USERNAME=CouchDBAdminUserName
	DB_ADMIN_PASSWORD=CouchDBAdminPassWord
	DB_APP_USERNAME=autotest
	DB_APP_PASSWORD=CouchDBRootPassword
	GITHUB_API_KEY=LONGSTRING
	REDIS_ADDRESS=http://localhost:6379
	SSL_CERT=/path/to/crt.crt
	SSL_KEY=/path/to/key.key
	SSL_INT_CERT=/path/to/-cacerts.pem
	COURSES=210 310, etc.
	DEV_MONGO_DB_INSTANCE=mongodb://localhost:27017/development
	PROD_MONGO_DB_INSTANCE=mongodb://localhost:27017/production
	TEST_MONGO_DB_INSTANCE=mongodb://localhost:27017/testing
```

- `yarn run install` with original lockfile and then `yarn run build`

Start Instructions
----------------------


* `./deploy.sh` Install Docker instances.
* `./autotest/docker/tester/docker-up.sh`


Build Docker containers.
=======
- `./deploy.sh` Install required Docker instances.
- `./autotest/docker/tester/docker-up.sh` Build required per-course Docker containers.
- `yarn run start` Start AutoTest service.

Extra Info
--------------
- Based on the courses in the `autotest.env` file, an instance of the application will start on a corresponding port that begins in the 1000s to get around `sudo` security requirements under port 1000.
