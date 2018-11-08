import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('advertiser', function() {
    this.route('create', { path: 'new' });
    this.route('edit', { path: ':id' });
  })

  this.route('campaign', function() {
    this.route('create');
    this.route('edit', { path: '/:id' }, function() {
      this.route('criteria');
      this.route('creatives');
    });
  })

  this.route('placement', function() {
    this.route('create', { path: 'new' });
    this.route('edit', { path: ':id' });
  })

  this.route('publisher', function() {
    this.route('create', { path: 'new' });
    this.route('edit', { path: ':id' });
  })

  this.route('template', function() {
    this.route('create', { path: 'new' });
    this.route('edit', { path: ':id' });
  })

  this.route('login');
  this.route('logout');
  this.route('user-settings');
  this.route('reports');
  this.route('about');
});

export default Router;
