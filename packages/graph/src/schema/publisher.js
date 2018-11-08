const { Schema } = require('mongoose');
const { isFQDN } = require('validator');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const imagePlugin = require('../plugins/image');

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

imagePlugin(schema, { fieldName: 'logoImageId' });

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

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'publishers');

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
