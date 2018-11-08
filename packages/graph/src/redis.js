const Promise = require('bluebird');
const redis = require('redis');
const output = require('./output');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const options = { url: process.env.REDIS_DSN };
const client = redis.createClient(options);
client.on('connect', () => {
  output.write(`💨 💨 💨 Successful Redis connection with options '${JSON.stringify(options)}'`);
});

module.exports = client;
