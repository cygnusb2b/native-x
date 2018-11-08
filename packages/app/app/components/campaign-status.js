import Component from '@ember/component';
import { computed } from '@ember/object';


export default Component.extend({
  tagName: 'span',
  classNameBindings: ['statusText'],

  statusText: computed('value', function() {
    switch (this.get('value')) {
      case 'Draft':
        return 'text-warning';
      case 'Paused':
        return 'text-info';
      case 'Active':
        return 'text-success';
      default:
        return 'text-muted';
    }
  }),

});
