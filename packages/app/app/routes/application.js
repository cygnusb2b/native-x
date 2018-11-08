import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import UpdateAdvertiser from 'fortnight/gql/mutations/update-advertiser';

export default Route.extend(ApplicationRouteMixin, {
  loading: inject(),
  session: inject('session'),
  apollo: inject(),
  errorProcessor: inject(),

  navItems: null,

  beforeModel() {
    return this._loadCurrentUser();
  },

  sessionAuthenticated() {
    this._super(...arguments);
    this._loadCurrentUser().catch((e) => {
      this.get('errorProcessor').show(e);
      this.get('session').invalidate();
    });
  },

  setupController(controller, model) {
    controller.set('session', this.get('session'));
    this._super(controller, model);
  },

  _loadCurrentUser() {
    return this.user.load();
  },

  getGraphQuery(type) {
    switch (type) {
      case 'advertiser':
        return { mutation: UpdateAdvertiser, resultKey: 'updateAdvertiser' };
    }
    throw new Error(`No GraphQL query defined for "${type}"!`);
  },

  actions: {
    linkTo(name) {
      this.transitionTo(name);
    },
    save(record, type) {
      const loading = this.get('loading');
      loading.show();

      const { name } = record;
      const { mutation, resultKey } = this.getGraphQuery(type);
      const variables = { input: { name } };
      // console.warn({ mutation, variables }, resultKey);
      return this.get('apollo').mutate({ mutation, variables }, resultKey)
        .catch(e => this.get('errorProcessor').show(e))
        .finally(() => loading.hide())
      ;
    },
    scrollToTop() {
      // console.info('scrollToTop');
      window.scrollTo(0, 0);
    },
    hardDelete(model, routeName) {
      const loading = this.get('loading');

      // @todo Should use a more elegant confirmation.
      if (window.confirm('Are you sure you want to delete this item? It will be permanently removed.')) {
        loading.show();
        model.destroyRecord()
          .then(() => this.transitionTo(routeName))
          // .catch(adapterError => this.get('errorProcessor').notify(adapterError.errors))
          .finally(() => loading.hide())
        ;
      }
    },
    softDelete(model, routeName) {
      const loading = this.get('loading');

      // @todo Should use a more elegant confirmation.
      if (window.confirm('Are you sure you want to delete this item?')) {
        loading.show();
        model.set('deleted', true);
        model.save()
          .then(() => this.transitionTo(routeName))
          // .catch(adapterError => this.get('errorProcessor').notify(adapterError.errors))
          .finally(() => loading.hide())
        ;
      }
    },
  }
});
