import Route from '@ember/routing/route';
import RouteQueryManager from 'ember-apollo-client/mixins/route-query-manager';
import { getObservable } from 'ember-apollo-client';

import query from 'fortnight/gql/queries/publisher/all';
import search from 'fortnight/gql/queries/publisher/search';

export default Route.extend(RouteQueryManager, {
  queryParams: {
    phrase: {
      refreshModel: true
    },
    first: {
      refreshModel: true
    },
    after: {
      refreshModel: true
    },
    sortBy: {
      refreshModel: true
    },
    ascending: {
      refreshModel: true
    },
  },

  search(phrase, pagination) {
    const controller = this.controllerFor(this.get('routeName'));
    const variables = { pagination, phrase };
    const resultKey = 'searchPublishers';
    controller.set('resultKey', resultKey);
    return this.get('apollo').watchQuery({ query: search, variables, fetchPolicy: 'network-only' }, resultKey)
      .then((result) => {
        controller.set('observable', getObservable(result));
        return result;
      }).catch(e => this.get('graphErrors').show(e))
    ;
  },

  model({ first, after, sortBy, ascending, phrase }) {
    const controller = this.controllerFor(this.get('routeName'));
    const pagination = { first, after };

    if (phrase) {
      return this.search(phrase, pagination);
    }
    const sort = { field: sortBy, order: ascending ? 1 : -1 };
    const variables = { pagination, sort };
    const resultKey = 'allPublishers';
    controller.set('resultKey', resultKey);
    if (!sortBy) delete variables.sort.field;
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, resultKey)
      .then((result) => {
        controller.set('observable', getObservable(result));
        return result;
      }).catch(e => this.get('graphErrors').show(e))
    ;
  },
});
