// ─── adminCommands.js ──────────────────────────────────────────────────────
// Comandos slash de gestión, pensados para el staff (equivalente al
// /historial, /buscar, /cancelar, /stats de tu bot Aurex, pero aplicados
// a los pedidos registrados por el panel de Industrias Rojas).
const { EmbedBuilder } = require('discord.js');
const store = require('./data/store');
const { COLOR, LEON, CATEGORIAS } = require('./ui/panels');
const { safeReply } = require('./utils/safe');

function esStaffOAdmin(interaction, data) {
    if (interaction.member.permissions.has(8n) /* Administrator */) return true; // fallback numérico por si acaso
    if (data.config.staffRoleId) return interaction.member.roles.cache.has(data.config.staffRoleId);
    return false;
}

const RANGOS_MS = { hoy: 86_400_000, semana: 604_800_000, mes: 2_592_000_000 };
function filtrarRango(lista, rango) {
    if (!rango || rango === 'todo') return lista;
    const limite = RANGOS_MS[rango];
    const ahora = Date.now();
    return lista.filter(p => ahora - p.timestamp <= limite);
}

// ─── /help ──────────────────────────────────────────────────────────────────
async function handleHelp(interaction) {
    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON}  Ayuda — Industrias Rojas`)
        .setDescription(
            `**Comandos generales**\n` +
            `╰➤ \`/ping\` — latencia del bot\n` +
            `╰➤ \`/help\` — menú de ayuda\n` +
            `╰➤ \`/dashboard\` — resumen completo\n\n` +
            `**Pedidos y ventas**\n` +
            `╰➤ \`/vender\` — registrar un pedido\n` +
            `╰➤ \`/pedidos\` — historial de pedidos\n` +
            `╰➤ \`/pedido\` — detalles por ID\n` +
            `╰➤ \`/buscarcliente\` — pedidos de un cliente\n` +
            `╰➤ \`/cancelarpedido\` — cancelar pedido\n` +
            `╰➤ \`/exportar\` — exportar registros\n` +
            `╰➤ \`/factura\` — enviar comprobante por DM\n\n` +
            `**Estadísticas y perfil**\n` +
            `╰➤ \`/stats\` — estadísticas\n` +
            `╰➤ \`/top\` — ranking\n` +
            `╰➤ \`/perfil\` — perfil de usuario\n` +
            `╰➤ \`/servidor-stats\` — stats del servidor\n\n` +
            `**Tickets y administración**\n` +
            `╰➤ \`/ticket-setup\` — configurar panel general\n` +
            `╰➤ \`/vip-setup\` — configurar VIP\n` +
            `╰➤ \`/clubvip\` — asignar VIP\n` +
            `╰➤ \`/sorteo\` — crear sorteo\n` +
            `╰➤ \`/anuncio\` — anunciar al canal\n` +
            `╰➤ \`/notificar\` — DM masivo\n` +
            `╰➤ \`/clear\` — limpiar canal`
        ).setFooter({ text: 'Industrias Rojas™ | Ticket premium' });
    return safeReply(interaction, { embeds: [embed] });
}

// ─── /pedidos ───────────────────────────────────────────────────────────────
async function handlePedidos(interaction) {
    const data = store.load(interaction.guild.id);
    if (!esStaffOAdmin(interaction, data)) return safeReply(interaction, { content: '🚫 Solo staff o administradores.' });

    const rango = interaction.options.getString('rango') ?? 'todo';
    const activos = filtrarRango(data.pedidos.filter(p => p.estado !== 'cancelado'), rango);
    if (activos.length === 0) return safeReply(interaction, { content: '📭 No hay pedidos en ese período.' });

    const ultimos = activos.slice(-10).reverse();
    const etiquetas = { hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes', todo: 'Todo' };
    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON}  Pedidos — ${etiquetas[rango] ?? rango}`)
        .setDescription(
            ultimos.map(p => `\`#${p.id}\` **${p.venta}** — ${p.precio} · <@${p.userId}>`).join('\n') +
            `\n\n**Total en el período:** \`${activos.length}\``
        ).setFooter({ text: `Mostrando ${ultimos.length} de ${activos.length}` }).setTimestamp();
    return safeReply(interaction, { embeds: [embed] });
}

// ─── /pedido [id] ───────────────────────────────────────────────────────────
async function handlePedido(interaction) {
    const data = store.load(interaction.guild.id);
    if (!esStaffOAdmin(interaction, data)) return safeReply(interaction, { content: '🚫 Solo staff o administradores.' });

    const id = interaction.options.getInteger('id');
    const p = data.pedidos.find(x => x.id === id);
    if (!p) return safeReply(interaction, { content: `⚠️ No existe el pedido \`#${id}\`.` });

    const embed = new EmbedBuilder().setColor(p.estado === 'cancelado' ? '#95A5A6' : COLOR)
        .setTitle(`${LEON}  Pedido #${p.id}${p.estado === 'cancelado' ? ' (cancelado)' : ''}`)
        .setDescription(
            `**Producto:** ${p.producto}\n**Venta:** ${p.venta}\n**Cantidad:** ${p.cantidad}\n**Precio:** ${p.precio}\n` +
            `**Método:** ${p.metodo}\n**País:** ${p.pais}\n**Cliente:** <@${p.userId}>\n**Ticket:** <#${p.channelId}>\n` +
            `**Fecha:** <t:${Math.floor(p.timestamp / 1000)}:f>`
        );
    return safeReply(interaction, { embeds: [embed] });
}

// ─── /buscarcliente [usuario] ────────────────────────────────────────────────
async function handleBuscarCliente(interaction) {
    const data = store.load(interaction.guild.id);
    if (!esStaffOAdmin(interaction, data)) return safeReply(interaction, { content: '🚫 Solo staff o administradores.' });

    const cliente = interaction.options.getUser('cliente');
    const propios = data.pedidos.filter(p => p.userId === cliente.id);
    if (propios.length === 0) return safeReply(interaction, { content: `📭 **${cliente.username}** no tiene pedidos registrados.` });

    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON}  Pedidos de ${cliente.username}`)
        .setDescription(propios.slice(-10).reverse().map(p =>
            `\`#${p.id}\` **${p.venta}** — ${p.precio}${p.estado === 'cancelado' ? ' *(cancelado)*' : ''}`
        ).join('\n'))
        .setFooter({ text: `Total: ${propios.length} pedido(s)` });
    return safeReply(interaction, { embeds: [embed] });
}

// ─── /cancelarpedido [id] ────────────────────────────────────────────────────
async function handleCancelarPedido(interaction) {
    const data = store.load(interaction.guild.id);
    if (!esStaffOAdmin(interaction, data)) return safeReply(interaction, { content: '🚫 Solo staff o administradores.' });

    const id = interaction.options.getInteger('id');
    const p = data.pedidos.find(x => x.id === id);
    if (!p) return safeReply(interaction, { content: `⚠️ No existe el pedido \`#${id}\`.` });
    if (p.estado === 'cancelado') return safeReply(interaction, { content: `⚠️ El pedido \`#${id}\` ya estaba cancelado.` });

    p.estado = 'cancelado';
    p.canceladoPor = interaction.user.tag;
    p.canceladoAt = Date.now();
    store.save(interaction.guild.id, data);

    return safeReply(interaction, { content: `✅ Pedido \`#${id}\` cancelado por <@${interaction.user.id}>.` });
}

// ─── /stats ─────────────────────────────────────────────────────────────────
async function handleStats(interaction) {
    const data = store.load(interaction.guild.id);
    if (!esStaffOAdmin(interaction, data)) return safeReply(interaction, { content: '🚫 Solo staff o administradores.' });

    const rango = interaction.options.getString('rango') ?? 'hoy';
    const activos = filtrarRango(data.pedidos.filter(p => p.estado !== 'cancelado'), rango);
    const clientesUnicos = new Set(activos.map(p => p.userId)).size;
    const ticketsAbiertos = data.tickets.filter(t => t.estado === 'abierto').length;
    const porCategoria = Object.keys(CATEGORIAS).map(k =>
        `${CATEGORIAS[k].emoji} **${CATEGORIAS[k].label}:** \`${data.tickets.filter(t => t.categoria === k).length}\``
    ).join(' · ');

    const etiquetas = { hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes' };
    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON}  Estadísticas — ${etiquetas[rango] ?? rango}`)
        .setDescription(
            `**Pedidos:** \`${activos.length}\`\n**Clientes únicos:** \`${clientesUnicos}\`\n**Tickets abiertos ahora:** \`${ticketsAbiertos}\`\n\n` +
            `**Tickets totales por categoría**\n${porCategoria}`
        ).setTimestamp();
    return safeReply(interaction, { embeds: [embed] });
}

module.exports = { handleHelp, handlePedidos, handlePedido, handleBuscarCliente, handleCancelarPedido, handleStats };

