const assert = require('node:assert/strict');
const pricing = require('../data/pricing');
const { buildPanelEmbed, buildConfirmRow } = require('../ui/panels');
const { modalInversion } = require('../ui/modals');
const { isIgnorableError } = require('../utils/safe');

assert.strictEqual(typeof pricing.precioRobux, 'function');
assert.strictEqual(typeof buildPanelEmbed, 'function');
assert.strictEqual(typeof buildConfirmRow, 'function');
assert.strictEqual(typeof modalInversion, 'function');
assert.strictEqual(isIgnorableError({ code: 10062 }), true);
assert.strictEqual(isIgnorableError(new Error('boom')), false);

const panel = buildPanelEmbed('Test Guild');
assert.ok(panel.data.title.includes('INDUSTRIAS ROJAS'));
assert.ok(String(panel.data.description).includes('¿En qué podemos ayudarte?'));

console.log('smoke ok');
