const { Schema } = require('mongoose');
const slug = require('slug');
const uuid = require('uuid/v4');
const pushId = require('unique-push-id');
const { isProduction } = require('./env');

const sessionSchema = new Schema({
  globalSecret: {
    type: String,
    default() {
      return `${pushId()}.${uuid()}`;
    },
  },
  namespace: {
    type: String,
    default() {
      return uuid();
    },
  },
  expiration: {
    type: Number,
    default: 86400,
    min: 10,
    max: 31536000,
  },
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    maxlength: 54,
    lowercase: true,
    unique: true,
    set(v) {
      return slug(v);
    },
  },
  settings: {
    reservePct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    cname: {
      type: String,
      default() {
        return `${this.key}.stories.native-x.io`;
      },
    },
    bcc: String,
    session: {
      type: sessionSchema,
      default() {
        return {};
      },
    },
  },
}, { timestamps: true });

schema.virtual('uri').get(function getUri() {
  if (!isProduction) {
    return `https://${this.key}.native-x.io`;
  }
  return 'http://localhost:8100';
});

schema.virtual('storyUri').get(function getStoryUri() {
  if (!isProduction) {
    return `https://${this.settings.cname}`;
  }
  return 'http://localhost:3105';
});

schema.set('toJSON', { virtuals: true });

module.exports = schema;
