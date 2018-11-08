import Component from '@ember/component';
import { inject } from '@ember/service';

export default Component.extend({
  autocomplete: inject(),

  classNames: ['form-group'],
  value: null,

  actions: {
    /**
     * Performs the story autocomplete search.
     *
     * @param {*} phrase
     */
    search(phrase) {
      return this.get('autocomplete').query('stories', phrase);
    },
  },
});
