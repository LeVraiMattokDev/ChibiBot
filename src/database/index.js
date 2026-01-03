const { init } = require('./schema');
const settings = require('./settings');
const users = require('./users');
const shop = require('./shop');
const moderation = require('./moderation');

module.exports = {
    init,
    ...settings,
    ...users,
    ...shop,
    ...moderation
};
