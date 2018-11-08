const { ServiceBroker } = require('moleculer');
const { NATS_DSN, NATS_LOGLEVEL } = require('./env');
const { name, version } = require('../package.json');
const actions = require('./account');
const mongoose = require('./mongoose');

const broker = new ServiceBroker({
  namespace: 'native-x',
  transporter: NATS_DSN,
  logLevel: NATS_LOGLEVEL,
  logFormatter: 'simple',
});

broker.createService({
  name,
  version,
  actions,
});

const start = async () => {
  await mongoose;
  await broker.start();
  process.stdout.write('INFO  - Account service started.\n');
};

start().catch(e => setImmediate(() => {
  broker.logger.fatal(e);
  throw e;
}));
