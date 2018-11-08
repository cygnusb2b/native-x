const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const Campaign = require('../../models/campaign');
const Contact = require('../../models/contact');
const Image = require('../../models/image');
const Story = require('../../models/story');
const User = require('../../models/user');

module.exports = {
  /**
   *
   */
  Advertiser: {
    campaigns: (advertiser, { pagination, sort }) => {
      const criteria = { advertiserId: advertiser.id, deleted: false };
      return Campaign.paginate({ pagination, criteria, sort });
    },
    stories: (advertiser, { pagination, sort }) => {
      const criteria = { advertiserId: advertiser.id, deleted: false };
      return Story.paginate({ pagination, criteria, sort });
    },
    notify: async (advertiser) => {
      const internal = await Contact.find({
        _id: { $in: advertiser.notify.internal },
        deleted: false,
      });
      const external = await Contact.find({
        _id: { $in: advertiser.notify.external },
        deleted: false,
      });
      return { internal, external };
    },
    logo: advertiser => Image.findById(advertiser.logoImageId),
    hash: advertiser => advertiser.pushId,
    createdBy: advertiser => User.findById(advertiser.createdById),
    updatedBy: advertiser => User.findById(advertiser.updatedById),
  },

  /**
   *
   */
  AdvertiserConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    advertiser: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Advertiser.strictFindActiveById(id);
    },

    /**
     *
     */
    advertiserHash: (root, { input }) => {
      const { hash } = input;
      return Advertiser.strictFindActiveOne({ pushId: hash });
    },

    /**
     *
     */
    allAdvertisers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Advertiser.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    autocompleteAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Advertiser.autocomplete(phrase, { pagination, filter });
    },

    /**
     *
     */
    searchAdvertisers: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Advertiser.search(phrase, { pagination, filter });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createAdvertiser: (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { payload } = input;

      return Advertiser.create({
        ...payload,
        createdById: user.id,
        updatedById: user.id,
      });
    },

    /**
     *
     */
    updateAdvertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { id, payload } = input;

      const advertiser = await Advertiser.strictFindActiveById(id);
      advertiser.set({
        ...payload,
        updatedById: user.id,
      });
      return advertiser.save();
    },

    deleteAdvertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const advertiser = await Advertiser.strictFindActiveById(id);
      return advertiser.softDelete();
    },

    /**
     *
     */
    undeleteAdvertiser: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const advertiser = await Advertiser.strictFindById(id);
      return advertiser.undelete();
    },

    /**
     *
     */
    advertiserLogo: async (root, { input }, { auth }) => {
      auth.check();
      const { id, imageId } = input;
      const advertiser = await Advertiser.strictFindActiveById(id);
      advertiser.logoImageId = imageId;
      return advertiser.save();
    },

    /**
     *
     */
    setAdvertiserContacts: async (root, { input }, { auth }) => {
      auth.check();
      const { id, type, contactIds } = input;
      const advertiser = await Advertiser.strictFindActiveById(id);
      advertiser.set(`notify.${type}`, contactIds);
      return advertiser.save();
    },
  },
};
