const assert = require('node:assert/strict');
const store = require('../data/store');
const admin = require('../adminCommands');

const guildId = 'admin-test-guild';
store.save(guildId, {
  config: { staffRoleId: 'staff-role' },
  tickets: [
    { categoria: 'compra', estado: 'abierto' },
    { categoria: 'dudas', estado: 'abierto' },
    { categoria: 'compra', estado: 'cerrado' }
  ],
  pedidos: [
    { id: 1, producto: 'Robux', venta: 'Robux', cantidad: '500 RB', precio: '$16.000 COP', metodo: 'Nequi', pais: 'Colombia', userId: 'u1', channelId: 'c1', timestamp: Date.now(), estado: 'pendiente' },
    { id: 2, producto: 'Streaming', venta: 'Prime', cantidad: '2', precio: '$12.000 COP', metodo: 'Yape', pais: 'Colombia', userId: 'u2', channelId: 'c2', timestamp: Date.now(), estado: 'cancelado' },
  ]
});

const interaction = {
  guild: { id: guildId },
  member: {
    permissions: { has: () => true },
    roles: { cache: { has: () => true } },
  },
  options: {
    getString: () => 'hoy',
    getInteger: () => 1,
    getUser: () => ({ id: 'u1', username: 'alice' }),
  },
  reply: async (opts) => opts,
};

(async () => {
  const help = await admin.handleHelp(interaction);
  assert.ok(help.embeds[0].data.title.includes('Ayuda'));

  const stats = await admin.handleStats(interaction);
  assert.ok(stats.embeds[0].data.description.includes('Pedidos'));

  const pedidos = await admin.handlePedidos(interaction);
  assert.ok(pedidos.embeds[0].data.title.includes('Pedidos'));

  const cliente = await admin.handleBuscarCliente(interaction);
  assert.ok(cliente.embeds[0].data.title.includes('alice'));

  console.log('admin ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
