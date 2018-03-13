const CampaignRepo = require('./index');

const findCampaign = async (id) => {
  if (!id) throw new Error('Unable to handle creative: no campaign ID was provided.');
  const campaign = await CampaignRepo.findById(id);
  if (!campaign) throw new Error('Unable to handle creative: no campaign was found.');
  return campaign;
};

module.exports = {
  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {string} payload.title
   * @return {Promise}
   */
  async createFor(campaignId, { title, teaser, image } = {}) {
    const campaign = await findCampaign(campaignId);
    const { creatives } = campaign;
    creatives.push({ title, teaser, image });

    await campaign.save();
    return creatives[creatives.length - 1];
  },

  /**
   * @param {string} campaignId
   * @param {object} payload
   * @param {string} payload.title
   * @return {Promise}
   */
  async updateFor(campaignId, creativeId, { title, teaser, image } = {}) {
    const campaign = await findCampaign(campaignId);
    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');

    creative.title = title;
    creative.teaser = teaser;
    creative.image = image;

    await campaign.save();
    return campaign.creatives.id(creativeId);
  },

  /**
   * @param {string} campaignId
   * @param {string} creativeId
   * @return {Promise}
   */
  async removeFrom(campaignId, creativeId) {
    if (!creativeId) throw new Error('Unable to handle creative: no creative ID was provided.');
    const campaign = await findCampaign(campaignId);

    const creative = campaign.creatives.id(creativeId);
    if (!creative) throw new Error('Unable to handle creative: no creative was found for the provided ID.');
    creative.remove();
    return campaign.save();
  },
};
