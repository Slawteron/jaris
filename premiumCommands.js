// ─── premiumCommands.js ─────────────────────────────────────────────────────
// Comandos premium: vender, analytics, VIP, sorteos, notificaciones, etc.
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const store = require('./data/store');
const { COLOR, LEON } = require('./ui/panels');
const { safeReply } = require('./utils/safe');

const RANGOS_MS = { hoy: 86_400_000, semana: 604_800_000, mes: 2_592_000_000 };

// ─── Utilidades ─────────────────────────────────────────────────────────────
function parseDuracion(str) {
    const match = String(str).trim().toLowerCase().match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;
    const mul = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(match[1]) * mul[match[2]];
}

function formatDuracion(ms) {
    const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60); const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

function estrellas(n) { return '⭐'.repeat(Math.min(Math.max(n, 0), 5)); }

// ─── /vender ────────────────────────────────────────────────────────────────
async function handleVender(interaction) {
    if (!interaction.member.permissions.has(8n) && !interaction.member.permissions.has(4n)) // Admin o Manage Messages
        return safeReply(interaction, { content: '🚫 Necesitas permisos de **Administrador** o **Gestionar mensajes**.' });

    const data = store.load(interaction.guild.id);
    const producto = interaction.options.getString('producto');
    const cliente = interaction.options.getUser('cliente');
    const vendedor = interaction.options.getUser('vendedor');
    const monto = interaction.options.getString('monto') ?? 'No especificado';
    const precio = interaction.options.getString('precio') ?? 'No especificado';
    const metodo = interaction.options.getString('metodo') ?? 'No especificado';
    const notas = interaction.options.getString('notas') ?? null;

    const id = (data.pedidos?.length ?? 0) + 1;
    const venta = {
        id, producto, clienteId: cliente.id, clienteTag: cliente.tag,
        vendedorId: vendedor.id, vendedorTag: vendedor.tag,
        monto, precio, metodo, notas, timestamp: Date.now(), estado: 'completada'
    };

    if (!data.pedidos) data.pedidos = [];
    data.pedidos.push(venta);
    store.save(interaction.guild.id, data);

    const embed = new EmbedBuilder().setColor('#57F287')
        .setTitle(`${LEON}  ✅ Nueva venta registrada`)
        .setDescription(
            `**#${id}** — ${producto}\n` +
            `💰 **Monto:** ${monto}\n` +
            `💵 **Precio:** ${precio}\n` +
            `💳 **Método:** ${metodo}\n` +
            `👤 **Cliente:** <@${cliente.id}>\n` +
            `👨‍💼 **Vendedor:** <@${vendedor.id}>\n` +
            (notas ? `📝 **Notas:** ${notas}\n` : '') +
            `📅 <t:${Math.floor(Date.now() / 1000)}:F>`
        ).setTimestamp();

    if (data.config.dmEnabled !== false) {
        const clienteUser = await interaction.client.users.fetch(cliente.id).catch(() => null);
        if (clienteUser) {
            await clienteUser.send({ embeds: [embed] }).catch(() => {});
        }
    }

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /dashboard ─────────────────────────────────────────────────────────────
async function handleDashboard(interaction) {
    const data = store.load(interaction.guild.id);
    const pedidos = data.pedidos ?? [];
    const activos = pedidos.filter(p => p.estado !== 'cancelado');
    const hoy = activos.filter(p => Date.now() - p.timestamp < 86400000);
    const semana = activos.filter(p => Date.now() - p.timestamp < 604800000);
    const mes = activos.filter(p => Date.now() - p.timestamp < 2592000000);
    const topV = [...activos].sort((a, b) => (b.vendedorId === a.vendedorId ? 0 : -1)).reduce((top, p) => {
        if (!top[p.vendedorId]) top[p.vendedorId] = 0; top[p.vendedorId]++; return top;
    }, {});
    const topC = [...activos].reduce((top, p) => {
        if (!top[p.clienteId]) top[p.clienteId] = 0; top[p.clienteId]++; return top;
    }, {});
    const topVendedor = Object.entries(topV).sort((a, b) => b[1] - a[1])[0];
    const topCliente = Object.entries(topC).sort((a, b) => b[1] - a[1])[0];

    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON}  Dashboard — ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setDescription(
            `**📊 Período actual**\n` +
            `🌅 Hoy: \`${hoy.length}\` · 📅 Semana: \`${semana.length}\` · 🗓️ Mes: \`${mes.length}\`\n\n` +
            `**👥 Comunidad**\n` +
            `🧑‍💼 Clientes únicos: \`${new Set(activos.map(p => p.clienteId)).size}\`\n` +
            `👨‍💼 Operadores activos: \`${new Set(activos.map(p => p.vendedorId)).size}\`\n` +
            `📦 Histórico: \`${activos.length}\` pedidos\n\n` +
            `**🏆 Top Rankings**\n` +
            `👑 Top vendedor: ${topVendedor ? `<@${topVendedor[0]}> (\`${topVendedor[1]}\` ventas)` : '`Sin datos`'}\n` +
            `🛒 Top cliente: ${topCliente ? `<@${topCliente[0]}> (\`${topCliente[1]}\` compras)` : '`Sin datos`'}`
        ).setImage('https://i.imgur.com/6FDLhpx.png').setFooter({ text: 'Bot' }).setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /exportar ──────────────────────────────────────────────────────────────
async function handleExportar(interaction) {
    if (!interaction.member.permissions.has(4n)) // Manage Messages
        return safeReply(interaction, { content: '🚫 Necesitas **Gestionar mensajes**.' });

    const data = store.load(interaction.guild.id);
    const rango = interaction.options.getString('rango') ?? 'mes';
    const rangosMs = { hoy: 86400000, semana: 604800000, mes: 2592000000 };
    const limite = rangosMs[rango];
    const ahora = Date.now();
    const filtrados = (data.pedidos ?? []).filter(p => p.estado !== 'cancelado' && (ahora - p.timestamp) <= limite);

    if (filtrados.length === 0) return safeReply(interaction, { content: '📭 Sin pedidos en ese período.' });

    const lineas = [`EXPORT — Pedidos ${rango}`, `Servidor: ${interaction.guild.name}`, `Generado: ${new Date().toLocaleString('es-MX')}`, '─'.repeat(70), ''];
    filtrados.forEach(p => {
        lineas.push(`#${p.id} | ${p.producto} | ${p.monto} | ${p.precio} | ${p.metodo} | ${p.clienteTag} | ${p.vendedorTag} | <t:${Math.floor(p.timestamp / 1000)}:d>`);
    });
    lineas.push('', '─'.repeat(70), `TOTAL: ${filtrados.length} pedidos`);

    return interaction.reply({
        content: `✅ **${filtrados.length}** pedidos exportados`,
        files: [{ attachment: Buffer.from(lineas.join('\n'), 'utf8'), name: `pedidos-${rango}.txt` }],
        flags: 64
    });
}

// ─── /factura ───────────────────────────────────────────────────────────────
async function handleFactura(interaction) {
    const data = store.load(interaction.guild.id);
    const id = interaction.options.getInteger('id');
    const venta = (data.pedidos ?? []).find(p => p.id === id);

    if (!venta) return safeReply(interaction, { content: `⚠️ No existe la orden \`#${id}\`.` });
    if (interaction.user.id !== venta.clienteId && !interaction.member.permissions.has(8n))
        return safeReply(interaction, { content: '🚫 Solo el cliente o un administrador puede ver esta factura.' });

    const embed = new EmbedBuilder().setColor('#57F287')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTitle(`${LEON}  Factura — Orden #${id}`)
        .setDescription(
            `**Detalles**\n` +
            `Producto: \`${venta.producto}\`\n` +
            `Monto: \`${venta.monto}\`\n` +
            `Precio: \`${venta.precio}\`\n` +
            `Método: \`${venta.metodo}\`\n` +
            `Fecha: <t:${Math.floor(venta.timestamp / 1000)}:F>\n\n` +
            `**Partes**\n` +
            `Cliente: <@${venta.clienteId}>\n` +
            `Vendedor: <@${venta.vendedorId}>\n\n` +
            `${venta.notas ? `**Notas:** ${venta.notas}` : ''}`
        ).setFooter({ text: `${interaction.guild.name} · Bot` }).setTimestamp(venta.timestamp);

    const user = await interaction.client.users.fetch(venta.clienteId).catch(() => null);
    if (user && venta.clienteId !== interaction.user.id) {
        await user.send({ embeds: [embed] }).catch(() => {});
    }

    return safeReply(interaction, { embeds: [embed], content: '✅ Factura enviada al cliente por DM.' });
}
// ─── /top ───────────────────────────────────────────────────────────────────
async function handleTop(interaction) {
    const data = store.load(interaction.guild.id);
    const tipo = interaction.options.getString('tipo') ?? 'vendedores';
    const activos = (data.pedidos ?? []).filter(p => p.estado !== 'cancelado');

    if (tipo === 'compradores') {
        const conteo = {};
        activos.forEach(p => { conteo[p.clienteId] = (conteo[p.clienteId] ?? 0) + 1; });
        const lista = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (lista.length === 0) return safeReply(interaction, { content: '📭 Sin datos.' });
        const embed = new EmbedBuilder().setColor(COLOR)
            .setTitle(`${LEON}  Top Compradores`)
            .setDescription(lista.map((e, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`} <@${e[0]}> — \`${e[1]}\` compra(s)`).join('\n'))
            .setTimestamp();
        return safeReply(interaction, { embeds: [embed] });
    } else {
        const conteo = {};
        activos.forEach(p => { conteo[p.vendedorId] = (conteo[p.vendedorId] ?? 0) + 1; });
        const lista = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (lista.length === 0) return safeReply(interaction, { content: '📭 Sin datos.' });
        const embed = new EmbedBuilder().setColor('#57F287')
            .setTitle(`${LEON}  Top Vendedores`)
            .setDescription(lista.map((e, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`} <@${e[0]}> — \`${e[1]}\` venta(s)`).join('\n'))
            .setTimestamp();
        return safeReply(interaction, { embeds: [embed] });
    }
}

// ─── /perfil ────────────────────────────────────────────────────────────────
async function handlePerfil(interaction) {
    const data = store.load(interaction.guild.id);
    const usuario = interaction.options.getUser('usuario');
    const comoVendedor = (data.pedidos ?? []).filter(p => p.vendedorId === usuario.id && p.estado !== 'cancelado');
    const comoCliente = (data.pedidos ?? []).filter(p => p.clienteId === usuario.id && p.estado !== 'cancelado');

    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON}  ${usuario.username}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .setDescription(
            `**Como vendedor**\n` +
            `🧾 Ventas: \`${comoVendedor.length}\`\n\n` +
            `**Como cliente**\n` +
            `🛒 Compras: \`${comoCliente.length}\``
        ).setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /servidor-stats ────────────────────────────────────────────────────────
async function handleServidorStats(interaction) {
    const data = store.load(interaction.guild.id);
    const tdata = require('./data/store').load(interaction.guild.id);
    const activos = (data.pedidos ?? []).filter(p => p.estado !== 'cancelado');
    const clientesUnicos = new Set(activos.map(p => p.clienteId)).size;
    const vendedoresUnicos = new Set(activos.map(p => p.vendedorId)).size;
    const ticketsCerrados = (tdata.tickets ?? []).filter(t => t.estado === 'cerrado').length;

    const embed = new EmbedBuilder().setColor(COLOR)
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTitle(`${LEON}  Estadísticas del Servidor`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setDescription(
            `**📦 Pedidos**\n` +
            `Total: \`${activos.length}\`\n\n` +
            `**👥 Usuarios**\n` +
            `🧑‍💼 Clientes únicos: \`${clientesUnicos}\`\n` +
            `👨‍💼 Vendedores: \`${vendedoresUnicos}\`\n\n` +
            `**🎫 Tickets**\n` +
            `Cerrados: \`${ticketsCerrados}\`\n` +
            `Abiertos: \`${(tdata.tickets ?? []).filter(t => t.estado === 'abierto').length}\``
        ).setImage('https://i.imgur.com/6FDLhpx.png').setFooter({ text: 'Bot' }).setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /reseña ────────────────────────────────────────────────────────────────
async function handleResena(interaction) {
    const data = store.load(interaction.guild.id);
    const id = interaction.options.getInteger('id');
    const venta = (data.pedidos ?? []).find(p => p.id === id);

    if (!venta) return safeReply(interaction, { content: `⚠️ Orden \`#${id}\` no existe.` });
    if (interaction.user.id !== venta.clienteId) return safeReply(interaction, { content: '🚫 Solo el cliente puede dejar reseña.' });
    if ((data.resenas ?? []).find(r => r.ordenId === id)) return safeReply(interaction, { content: '⚠️ Ya dejaste reseña en esta orden.' });

    // Modal (si implementar: aquí irá el handler de modal de reseña)
    return safeReply(interaction, { content: '📝 Modal de reseña (a implementar).' });
}

// ─── /resenas ───────────────────────────────────────────────────────────────
async function handleResenas(interaction) {
    const data = store.load(interaction.guild.id);
    const vendedor = interaction.options.getUser('vendedor');
    const resenas = (data.resenas ?? []).filter(r => r.vendedorId === vendedor.id);

    if (resenas.length === 0) return safeReply(interaction, { content: `📭 **${vendedor.username}** no tiene reseñas.` });

    const promedio = (resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length).toFixed(1);
    const embed = new EmbedBuilder().setColor('#FEE75C')
        .setTitle(`${LEON}  Reseñas de ${vendedor.username}`)
        .setThumbnail(vendedor.displayAvatarURL({ dynamic: true }))
        .setDescription(
            `⭐ **Promedio:** \`${promedio}/5\` *(${resenas.length} reseña${resenas.length !== 1 ? 's' : ''})*\n\n` +
            resenas.slice(-5).reverse().map(r => `${estrellas(r.estrellas)} <@${r.clienteId}> — ${r.comentario ?? '*Sin comentario*'}`).join('\n')
        ).setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /clear ─────────────────────────────────────────────────────────────────
async function handleClear(interaction) {
    if (!interaction.member.permissions.has(4n)) // Manage Messages
        return safeReply(interaction, { content: '🚫 Necesitas **Gestionar mensajes**.' });

    const cantidad = interaction.options.getInteger('cantidad');
    if (cantidad < 1 || cantidad > 100) return safeReply(interaction, { content: '⚠️ Entre 1 y 100 mensajes.' });

    const await_defer = await require('./utils/safe').safeDefer(interaction, true);
    if (!await_defer) return;

    const borrados = await interaction.channel.bulkDelete(cantidad, true).catch(() => null);
    if (!borrados) return interaction.editReply({ content: '⚠️ No se pudieron borrar mensajes (>14 días).' });

    return interaction.editReply({ content: `🗑️ **${borrados.size}** mensaje(s) eliminado(s).` });
}

module.exports = {
    handleVender, handleDashboard, handleExportar, handleFactura, handleTop,
    handlePerfil, handleServidorStats, handleResena, handleResenas, handleClear
};
