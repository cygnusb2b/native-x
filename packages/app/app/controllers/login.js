import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  username: null,
  password: null,
  errorMessage: null,
  session: inject('session'),
  loading: inject('loading'),

  actions: {
    authenticate() {
      let loading = this.get('loading');

      loading.show();
      this.set('errorMessage', null);
      let { username, password } = this.getProperties('username', 'password');
      this.get('session')
        .authenticate('authenticator:application', username, password)
        .catch((error) => this.set('errorMessage', error.errors.length ? error.errors[0].message : 'An unknown error has occurred.'))
        .finally(() => loading.hide())
      ;
    }
  }
});
