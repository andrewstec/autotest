# AutoTest
CPSC 310 submission service.

Requirements
-------------

- MongoDB db version v3.4.7 (any close version)
- Node JS v6.11.0 LTS (higher will likely work)
- Yarn 0.24.6 (any close version)
- Docker version 17.03.1-ce, build c6d412e (any close version)
- 'autotest.env' file in `./autotest/` directory: 

```
	GITHUB_API_KEY=LONGSTRING
	REDIS_ADDRESS=http://localhost
	SSL_CERT=/path/to/crt.crt
	SSL_KEY=/path/to/key.key
	SSL_INT_CERT=/path/to/-cacerts.pem
	COURSES=210 310 etc.
	DEV_MONGO_DB_INSTANCE=mongodb://username:password@localhost:27017/development
	PROD_MONGO_DB_INSTANCE=mongodb://username:password@localhost:27017/production
	TEST_MONGO_DB_INSTANCE=mongodb://username:password@localhost:27017/testing
	MENTIONED_TAG=@autobot
	
```

- `yarn run install` with original lockfile and then `yarn run build`
- GITHUB_API_KEY may be created on Github under 'Settings' with permissions to manage orgs, repos, repo_hooks, and users.

Start Instructions
----------------------

- `./deploy.sh` Install required Docker instances (must be run after COURSES env set)
- `./autotest/docker/tester/docker-up.sh` Build required per-course Docker containers.
- `yarn run start` Start AutoTest service.

Extra Info
--------------
- Based on the courses in the `autotest.env` file, an instance of the application will start on a corresponding port that begins in the 1000s to get around `sudo` security requirements under port 1000.
