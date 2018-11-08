import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import ActionMixin from 'fortnight/mixins/action-mixin';

import mutation from 'fortnight/gql/mutations/topic/update';
import deleteTopic from 'fortnight/gql/mutations/topic/delete';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  actions: {
    /**
     *
     * @param {object} fields
     */
    async update({ id, name, publisher, externalId }) {
      this.startAction();
      const payload = { name, publisherId: get(publisher || {}, 'id'), externalId };
      const variables = { input: { id, payload } };
      try {
        if (!payload.publisherId) throw new Error('You must select a publisher to continue.');
        await this.get('apollo').mutate({ mutation, variables }, 'updateTopic');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     * Deletes the topic
     *
     */
    async delete() {
      this.startAction();
      const id = this.get('model.id');
      const variables = { input: { id } };
      const mutation = deleteTopic;
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'deleteTopic');
        await this.transitionToRoute('manage.topic.index');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
