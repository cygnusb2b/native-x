import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import ActionMixin from 'fortnight/mixins/action-mixin';

import mutation from 'fortnight/gql/mutations/story/create';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  actions: {
    /**
     *
     * @param {object} fields
     */
    async create() {
      this.startAction();
      const {
        title,
        advertiser,
        publisher,
      } = this.get('model');

      const payload = {
        title,
        advertiserId: get(advertiser || {}, 'id'),
        publisherId: get(publisher || {}, 'id'),
      };
      const variables = { input: { payload } };
      try {
        const response = await this.get('apollo').mutate({ mutation, variables }, 'createStory');
        return this.transitionToRoute('manage.story.edit', response.id);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
