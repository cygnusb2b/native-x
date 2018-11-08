import Component from '@ember/component';
import ActionMixin from 'fortnight/mixins/action-mixin';
import { inject } from '@ember/service';

import removeCreative from 'fortnight/gql/mutations/campaign/remove-creative';
import creativeStatus from 'fortnight/gql/mutations/campaign/creative-status';

export default Component.extend(ActionMixin, {
  classNames: ['card', 'mnh-100'],

  campaignId: null,
  creativeId: null,


  canModifyStatus: false,
  canRemove: false,
  displayEditButton: false,
  editRouteName: 'manage.campaign.edit.creatives.edit',

  apollo: inject(),

  init() {
    this._super(...arguments);

    // Ensure the action has ended.
    // Fixes issue with calling set on destroyed object after status is updated or creative is removed.
    this.endAction();
  },

  actions: {
    async remove() {
      this.startAction();
      const { campaignId, creativeId } = this.getProperties('campaignId', 'creativeId');

      const mutation = removeCreative;
      const variables = { input: { campaignId, creativeId } };
      const refetchQueries = ['CampaignCreatives', 'PortalCampaignsManageMaterials'];
      try {
        await this.get('apollo').mutate({ mutation, variables, refetchQueries }, 'removeCampaignCreative');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async updateStatus(active) {
      this.startAction();
      const { campaignId, creativeId } = this.getProperties('campaignId', 'creativeId');

      const mutation = creativeStatus;
      const variables = { input: { campaignId, creativeId, active } };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'campaignCreativeStatus');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
