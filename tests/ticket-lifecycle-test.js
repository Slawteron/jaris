const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');
const ticket = require('../ticket');
const store = require('../data/store');

const guildId = 'ticket-lifecycle-guild';
store.save(guildId, {
  config: { categoryId: 'cat-1', staffRoleId: 'staff-role', vendedorRoleId: 'vendedor-role', logChannelId: null, pedidosChannelId: null },
  tickets: [],
  pedidos: []
});

const guild = {
  id: guildId,
  name: 'Test Guild',
  members: { me: { id: 'bot-id', permissions: { has: (perm) => perm === PermissionFlagsBits.ManageChannels } } },
  channels: {
    cache: { get: () => null },
    fetch: async () => null,
    create: async (opts) => ({
      id: 'ticket-chan-1',
      send: async () => ({})
    })
  }
};

const interaction = {
  guild,
  user: { id: 'user-123', username: 'alice', tag: 'alice#0001' },
  member: { permissions: { has: () => false }, roles: { cache: { has: () => false } } },
  update: async (opts) => opts,
  reply: async (opts) => opts,
  channel: { delete: async () => {} },
  message: { edit: async () => {} },
};

(async () => {
  const confirm = ticket.buildConfirmEmbed({
    categoria: 'compra',
    tipo: 'streaming',
    servicio: 'prime',
    cantidad: '2',
    pais: 'colombia',
    metodo: 'yape',
    userId: 'user-123'
  });
  assert.ok(confirm.data.title.includes('Te confirmo'));

  const created = await ticket.createTicketFromSession(interaction, {
    userId: 'user-123',
    categoria: 'compra',
    tipo: 'streaming',
    servicio: 'prime',
    cantidad: '2',
    pais: 'colombia',
    metodo: 'yape',
    userTag: 'alice#0001'
  });

  assert.ok(created.content.includes('Tu ticket fue creado'));
  const data = store.load(guildId);
  assert.strictEqual(data.tickets.length, 1);
  assert.strictEqual(data.tickets[0].estado, 'abierto');

  console.log('ticket lifecycle ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
