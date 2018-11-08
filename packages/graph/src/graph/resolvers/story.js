const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Advertiser = require('../../models/advertiser');
const StoryRepo = require('../../repositories/story');

module.exports = {
  Story: {
    advertiser: story => Advertiser.findById(story.advertiserId),
  },

  /**
   *
   */
  StoryConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    story: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await StoryRepo.findById(id);
      if (!record) throw new Error(`No story record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return StoryRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    searchStories: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return StoryRepo.search(phrase, { pagination });
    },

    /**
     *
     */
    autocompleteStories: async (root, { pagination, phrase }, { auth }) => {
      auth.check();
      return StoryRepo.autocomplete(phrase, { pagination });
    },
  },
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createStory: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return StoryRepo.create(payload);
    },
    /**
     *
     */
    updateStory: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return StoryRepo.update(id, payload);
    },
  },
};
