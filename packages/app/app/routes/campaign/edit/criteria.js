import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import RouteQueryManager from 'ember-apollo-client/mixins/route-query-manager';

import { get } from '@ember/object';
import { isPresent } from '@ember/utils';
import moment from 'moment';

import query from 'fortnight/gql/queries/campaign-criteria';
import mutation from 'fortnight/gql/mutations/set-campaign-criteria';

export default Route.extend(RouteQueryManager, AuthenticatedRouteMixin, {

  hasSaved: false,

  model() {
    const { id } = this.modelFor('campaign.edit');
    const resultKey = 'campaign';
    const variables = { input: { id } };
    return this.apollo.watchQuery({ query, variables }, resultKey);
  },

  afterModel(model) {
    const criteria = {
      start: moment(),
      end: null,
      placements: [],
      kvs: [],
    };
    if (!get(model, 'criteria')) model.criteria = criteria;
  },

  renderTemplate() {
    this.render();
    this.render('campaign.actions.edit.criteria', { outlet: 'actions', into: 'application' });
  },

  doUpdate() {
    const controller = this.controllerFor('campaign.edit.criteria');
    controller.set('isSaving', true);
    const model = this.modelFor('campaign.edit.criteria');
    const { id, criteria } = model;
    const { start, end, kvs, placements } = criteria;
    const keyValues = kvs.map(({ key, value }) => {
      return { key, value };
    });
    const campaignId = id;
    const placementIds = placements.map(p => p.id);
    const startDate = moment(start).format('x');
    const endDate = isPresent(end) ? moment(end).format('x') : null;
    const payload = { start: startDate, end: endDate, placementIds, kvs: keyValues };
    const variables = { input: { campaignId, payload } };
    const resultKey = 'setCampaignCriteria';
    const refetchQueries = ['campaign', 'campaignCriteria'];
    return this.apollo.mutate({ mutation, variables, refetchQueries }, resultKey)
      .then(() => controller.setProperties({ isSaving: false, hasSaved: true }))
      .catch(e => this.get('errorProcessor').show(e))
    ;
  },

  actions: {
    update() {
      return this.doUpdate();
    },
    didTransition() {
      this.set('hasSaved', false);
    },
    willTransition(transition) {
      if (this.get('hasSaved')) return true;
      transition.abort();
      this.doUpdate()
        .then(() => this.set('hasSaved', true))
        .then(() => transition.retry())
      ;
    },
  },
})
