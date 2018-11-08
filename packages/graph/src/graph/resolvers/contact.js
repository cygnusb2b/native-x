const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const userAttributionFields = require('./user-attribution');
const Contact = require('../../models/contact');

module.exports = {
  /**
   *
   */
  Contact: {
    ...userAttributionFields,
  },

  /**
   *
   */
  ContactConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    contact: (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return Contact.strictFindActiveById(id);
    },

    /**
     *
     */
    allContacts: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return Contact.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    searchContacts: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Contact.search(phrase, { pagination, filter });
    },

    /**
     *
     */
    autocompleteContacts: (root, { pagination, phrase }, { auth }) => {
      auth.check();
      const filter = { term: { deleted: false } };
      return Contact.autocomplete(phrase, { pagination, filter });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createContact: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      const contact = new Contact(payload);
      contact.setUserContext(auth.user);
      return contact.save();
    },

    /**
     *
     */
    updateContact: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const contact = await Contact.strictFindActiveById(id);
      contact.setUserContext(auth.user);
      contact.set(payload);
      return contact.save();
    },

    /**
     *
     */
    deleteContact: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const contact = await Contact.strictFindActiveById(id);
      contact.setUserContext(auth.user);
      await contact.softDelete();
      return 'ok';
    },
  },
};
