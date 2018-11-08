const { Schema } = require('mongoose');
const connection = require('../../connections/mongoose/instance');
const validator = require('validator');
const CreativeSchema = require('./creative');
const CriteriaSchema = require('./criteria');
const { applyElasticPlugin, setEntityFields } = require('../../elastic/mongoose');
const {
  notifyPlugin,
  paginablePlugin,
  pushIdPlugin,
  referencePlugin,
  repositoryPlugin,
  searchablePlugin,
} = require('../../plugins');

const externalLinkSchema = new Schema({
  label: {
    type: String,
    required: false,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return false;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid external link URL for {VALUE}',
    },
  },
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
    trim: false,
  },
  advertiserName: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    default: 'Draft',
    enum: [
      'Active',
      'Paused',
      'Draft',
      'Deleted',
    ],
  },
  url: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid campaign URL for {VALUE}',
    },
  },
  creatives: [CreativeSchema],
  criteria: CriteriaSchema,
  externalLinks: [externalLinkSchema],
}, { timestamps: true });

setEntityFields(schema, 'name');
setEntityFields(schema, 'advertiserName');
applyElasticPlugin(schema, 'campaigns');

schema.plugin(referencePlugin, {
  name: 'advertiserId',
  connection,
  modelName: 'advertiser',
  options: { required: true, es_indexed: true, es_type: 'keyword' },
});
schema.plugin(notifyPlugin);
schema.plugin(pushIdPlugin, { required: true });
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name', 'advertiserName'] });

schema.pre('save', async function setAdvertiserName() {
  if (this.isModified('advertiserId') || !this.advertiserName) {
    const advertiser = await connection.model('advertiser').findOne({ _id: this.advertiserId }, { name: 1 });
    this.advertiserName = advertiser.name;
  }
});

schema.index({ advertiserId: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

// Query logic for campaign retrieval.
schema.index({
  status: 1,
  'criteria.start': 1,
  'criteria.placementIds': 1,
  'criteria.end': 1,
});

module.exports = schema;
