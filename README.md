# The NativeX Project

This project Monorepo contains all the services in use in the NativeX project.

## Intro

The shared core services, such as databases, search, and message queuing can be booted by executing `yarn start` in the root of this project. This will boot up a docker-compose environment and virtual network for other project services to join. Please note -- you **must** have the shared services started before running any other services.

### Testing

All services within this project **MUST** be tested in isolation. Each project has a separate docker-compose testing environment, and the following commands are available in all services:
- `yarn start` - Brings the service online and links into the shared core services network.
- `yarn stop` - Brings the service offline
- `yarn test` - Runs the tests associated with each service in an *isolated* environment

### Versioning, Continuous Integration & Deployment

???

## Services

### Shared Services

The shared services for this project can be started by executing `yarn start` from the project root. The following environment variables can be overridden by adding them to `/.env`:
```
NATS_CLIENT_PORT
NATS_MONITOR_PORT
MONGO_PORT
ES_NODE_PORT
ES_TRANSPORT_PORT
ES_KIBANA_PORT
```
The services currently included are
- `nats` - A high performance message queue utilized by `moleculer` microservice clients
- `redis` - A key-value store
- `mongo` - A BSON document store
- `elasticsearch` - A Lucene-based search service

### graph
An Apollo/GraphQL/Express server providing CRUD for NX data.

[View service documentation](./graph#readme)

### app
An ember application for managing NX data

[View service documentation](./app#readme)

### web
A NextJS web frontend for displaying NX data

[View service documentation](./web#readme)

### accounts
A moleculer-based microservice for managing NX accounts

[View service documentation](./accounts#readme)

### onboarding
An Apollo/GraphQL/Express server for creating accounts and managing infrastructure

[View service documentation](./onboarding#readme)
