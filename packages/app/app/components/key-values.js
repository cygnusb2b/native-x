import Component from '@ember/component';
import { later } from '@ember/runloop';

export default Component.extend({
  values: null,
  onChange: null,

  key: '',
  val: '',

  init() {
    this.set('values', this.get('values') || []);
    this._super(...arguments);
  },

  actions: {
    add() {
      const { key, value } = this.getProperties(['key', 'value']);
      this.get('values').pushObject({ key, value });
      this.setProperties({ key: '', value: ''});
      later(this, () => this.$('input.key').last().focus());
      this.get('onChange')();
    },
    remove(kv) {
      this.get('values').removeObject(kv);
      this.get('onChange')();
    },
    update() {
      this.get('onChange')();
    },
  },

});
