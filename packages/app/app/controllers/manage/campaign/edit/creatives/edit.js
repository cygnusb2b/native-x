import Controller from '@ember/controller';
import { inject } from '@ember/service';
import ActionMixin from 'fortnight/mixins/action-mixin';

import campaignCreativeDetails from 'fortnight/gql/mutations/campaign/creative-details';
import campaignCreativeImage from 'fortnight/gql/mutations/campaign/creative-image';

export default Controller.extend(ActionMixin, {
  apollo: inject(),
  imageLoader: inject(),

  actions: {
    /**
     * Handles the image once uploaded.
     * In this case, relates the newly uploaded image to the creative.
     *
     * @param {object} image
     * @param {string} image.id
     */
    async handleCreativeImage({ id }) {
      const creativeId = this.get('model.id');
      const campaignId = this.get('campaignId');

      const mutation = campaignCreativeImage;
      const input = { campaignId, creativeId, imageId: id };
      const variables = { input };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'campaignCreativeImage');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     * Sets the image's focal point.
     *
     * @param {string} imageId
     * @param {object} focalPoint
     * @param {number} focalPoint.x
     * @param {number} focalPoint.y
     */
    async setImageFocalPoint(imageId, { x, y }) {
      this.startAction();
      try {
        await this.get('imageLoader').setImageFocalPoint(imageId, { x, y });
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     * @param {object} fields
     */
    async updateDetails({ title, teaser, active }) {
      this.startAction();

      const creativeId = this.get('model.id');
      const campaignId = this.get('campaignId');
      const payload = { title, teaser, active };

      const mutation = campaignCreativeDetails;
      const input = { creativeId, campaignId, payload }
      const variables = { input };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'campaignCreativeDetails');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
