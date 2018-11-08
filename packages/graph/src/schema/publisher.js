const { Schema } = require('mongoose');
const { isFQDN } = require('validator');
const env = require('../env');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  imagePlugin,
  paginablePlugin,
  repositoryPlugin,
  searchablePlugin,
  userAttributionPlugin,
} = require('../plugins');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  domainName: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return isFQDN(String(v));
      },
      message: 'Invalid domain name: {VALUE}',
    },
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'publishers');

schema.virtual('customUri').get(function getCustomUri() {
  const { domainName } = this;
  if (!domainName) return null;
  const { NODE_ENV } = env;
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${domainName}`;
});

schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(userAttributionPlugin);
schema.plugin(imagePlugin, { fieldName: 'logoImageId' });
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name'] });

schema.pre('save', async function checkDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;

  const placements = await connection.model('placement').countActive({ publisherId: this.id });
  if (placements) throw new Error('You cannot delete a publisher that has related placements.');
  const topics = await connection.model('topic').countActive({ publisherId: this.id });
  if (topics) throw new Error('You cannot delete a publisher that has related topics.');
});

schema.pre('save', async function updatePlacements() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const Placement = connection.model('placement');
    const docs = await Placement.find({ publisherId: this.id });
    docs.forEach((doc) => {
      doc.set('publisherName', this.name);
      doc.save();
    });
  }
});

schema.pre('save', async function updateTopics() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const Topic = connection.model('topic');
    const docs = await Topic.find({ publisherId: this.id });
    docs.forEach((doc) => {
      doc.set('publisherName', this.name);
      doc.save();
    });
  }
});

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
