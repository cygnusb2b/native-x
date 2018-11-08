require('dotenv').config();

/* eslint-disable */
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}
/* eslint-enable */

const pkg = require('../package.json');
const { app } = require('./server');

const { PORT } = process.env;

const server = app.listen(PORT);
process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);

module.exports = server;
