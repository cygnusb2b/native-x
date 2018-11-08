import Component from '@ember/component';
import { set, get } from '@ember/object';
import { debounce } from '@ember/runloop';

export default Component.extend({
  tagName: 'form',
  attributeBindings: ['novalidate'],
  novalidate: true,

  model: null,

  wasValidated: false,
  isValid: false,
  shouldAutosave: false,

  init() {
    this._super(...arguments);
    if (!this.get('model')) this.set('model', {});

    this.sendEvent('onInit');
  },

  sendEvent(name, ...args) {
    const fn = this.get(name);
    if (typeof fn === 'function') {
      return fn(this, ...args);
    }
  },

  /**
   * Submits the form.
   * Will fire the `preValidate` event/action and will stop validation if false.
   * The event is also asynchronous.
   * Will fire the `onSubmit` event/action when valid.
   *
   * @param {*} event
   */
  async submit(event) {
    const form = this.element;
    event.preventDefault();
    event.stopPropagation();

    const model = this.get('model');

    const preValidate = await this.sendEvent('preValidate', form, model);
    if (preValidate === false) return false;

    const isValid = form.checkValidity();
    form.classList.add('was-validated');
    this.set('wasValidated', true);
    this.set('isValid', isValid);
    if (isValid) this.get('onSubmit')(model);
  },

  triggerSubmit() {
    this.$().trigger('submit');
  },

  actions: {
    autosave(delay) {
      if (this.get('shouldAutosave')) {
        if (typeof delay === 'number') {
          debounce(this, 'triggerSubmit', delay);
        } else {
          this.triggerSubmit();
        }
      }
    },
    setAndAutosave(field, value) {
      const model = this.get('model');
      set(model, field, value);
      this.send('autosave');
    },
    pushAndAutosave(field, value) {
      const model = this.get('model');
      get(model, field).pushObject(value);
      this.send('autosave');
    },
  },

});
