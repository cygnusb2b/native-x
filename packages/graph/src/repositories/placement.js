const Promise = require('bluebird');
const Placement = require('../models/placement');
const PublisherRepo = require('./publisher');
const fixtures = require('../fixtures');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const placement = new Placement(payload);
    return placement.save();
  },

  /**
   * Find a Placement record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find placement: no ID was provided.'));
    return Placement.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Placement.find(criteria);
  },

  /**
   * @todo Should this do a cascade removal?
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove placement: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Placement.remove(criteria);
  },

  /**
   *
   * @param {number} [count=1]
   * @param {?object} params
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Placement, count, params);
  },

  async seed({ count = 1, publisherCount = 1 } = {}) {
    const publishers = await PublisherRepo.seed({ count: publisherCount });
    const results = this.generate(count, {
      publisherId: () => publishers.random().id,
    });
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },
};
