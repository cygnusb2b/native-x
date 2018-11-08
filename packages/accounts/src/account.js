const Account = require('./model');

module.exports = {
  list({ params = {} }) {
    return Account.find(params);
  },
  async retrieve({ params = {} }) {
    return Account.findOne(params);
  },
  create({ params = {} }) {
    return Account.create(params);
  },
  async update({ params = {} }) {
    const { id, payload } = params;
    const account = await Account.findOne({ _id: id });
    if (!account) throw new Error('Account not found!');
    const { name, settings } = payload;
    account.name = name;
    account.set('settings.reservePct', settings.reservePct);
    account.set('settings.requiredCreatives', settings.requiredCreatives);
    return account.save();
  },
};
