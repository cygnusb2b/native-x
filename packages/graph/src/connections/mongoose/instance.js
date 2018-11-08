const mongoose = require('mongoose');
const bluebird = require('bluebird');
const output = require('../../output');
const env = require('../../env');

const { MONGO_DSN, MONGOOSE_DEBUG, ACCOUNT_KEY } = env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

const instanceDSN = MONGO_DSN.replace('/fortnight', `/fortnight-${ACCOUNT_KEY}`);

const connection = mongoose.createConnection(instanceDSN, {
  // autoIndex: env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
});
connection.once('open', () => output.write(`🛢️ 🛢️ 🛢️ Successful INSTANCE MongoDB connection to '${instanceDSN}'`));
module.exports = connection;
