const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const store = require('../data/store');

const guildId = 'integration-test-guild';
const filePath = path.join(__dirname, '..', 'storage', `${guildId}.json`);
if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

const original = store.load(guildId);
original.config.panelImageUrl = 'https://cdn.example.com/panel.png';
original.config.dmEnabled = false;
original.config.staffRoleId = 'staff-role';
store.save(guildId, original);

const reloaded = store.load(guildId);
assert.strictEqual(reloaded.config.panelImageUrl, 'https://cdn.example.com/panel.png');
assert.strictEqual(reloaded.config.dmEnabled, false);
assert.strictEqual(reloaded.config.staffRoleId, 'staff-role');

store.setSession('user-123', { userId: 'user-123', categoria: 'compra', tipo: 'robux' });
const session = store.getSession('user-123');
assert.strictEqual(session.categoria, 'compra');
assert.strictEqual(session.tipo, 'robux');
store.clearSession('user-123');
assert.strictEqual(store.getSession('user-123'), null);

console.log('integration ok');
