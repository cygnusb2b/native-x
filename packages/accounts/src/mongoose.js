const mongoose = require('mongoose');
const { MONGO_DSN, MONGOOSE_DEBUG } = require('./env');

mongoose.set('debug', Boolean(MONGOOSE_DEBUG));

const connection = mongoose.createConnection(MONGO_DSN, {
  useNewUrlParser: true,
  ignoreUndefined: true,
});

// eslint-disable-next-line no-console
connection.on('error', () => console.error.bind(console, '\n\nconnection error:\n'));
connection.once('open', () => process.stdout.write(`INFO  - MongoDB connected to '${MONGO_DSN}'\n`));

module.exports = connection;
