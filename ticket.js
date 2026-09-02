// ─── ticket.js ─────────────────────────────────────────────────────────────
const {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ChannelType, PermissionFlagsBits
} = require('discord.js');
const store = require('./data/store');
const { CATEGORIAS, COLOR, LEON } = require('./ui/panels');
const { precioRobux, formatPrecio, MONEDA_POR_PAIS, STREAMING_NORMAL } = require('./data/pricing');
const { safeReply } = require('./utils/safe');

function fechaColombia() {
    return new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }) + ' (hora Colombia)';
}

const ROBUX_ENTREGA_LABEL = { grupo: 'Grupo', gamepass: 'Game-Pass', robloxplus: 'Roblox Plus', regalo: 'Regalo de algún juego' };
const METODO_LABEL = { yape: 'Yape', mercadopago: 'Mercado Pago', nequi: 'Nequi', binance: 'Binance', airtm: 'Airtm' };
const PAIS_LABEL = { colombia: 'Colombia', argentina: 'Argentina', mexico: 'México', peru: 'Perú' };

function labelMetodo(s) { return s.metodo === 'otro' ? (s.metodoTexto ?? 'Otro') : (METODO_LABEL[s.metodo] ?? s.metodo); }
function labelPais(s)   { return s.pais === 'otro' ? (s.paisTexto ?? 'Otro') : (PAIS_LABEL[s.pais] ?? s.pais); }

// ─── Calcula el precio (solo si hay cantidad numérica y país con moneda) ──
function calcularPrecio(session) {
    const moneda = MONEDA_POR_PAIS[session.pais];
    if (!moneda) return null; // país "otro" -> sin catálogo de precio automático
    if (session.tipo === 'streaming' && session.servicio !== 'otro' && /^\d+$/.test(session.cantidad ?? '')) {
        const base = STREAMING_NORMAL[session.servicio]?.precios?.[moneda];
        if (base == null) return null;
        return formatPrecio(base * parseInt(session.cantidad, 10), moneda);
    }
    if (session.tipo === 'robux' && /^\d+$/.test(session.cantidad ?? '') && !session.esOtroCantidad) {
        return formatPrecio(precioRobux(parseInt(session.cantidad, 10), moneda), moneda);
    }
    return null;
}

// ─── Texto de resumen mostrado en el paso de confirmación ─────────────────
function resumenConfirmacion(session) {
    const lineas = [];
    if (session.categoria === 'compra') {
        if (session.tipo === 'streaming') {
            lineas.push(`**Producto:** ${session.servicio === 'otro' ? 'Otro (a especificar)' : STREAMING_NORMAL[session.servicio].label}`);
            if (session.servicio !== 'otro') lineas.push(`**Cantidad:** ${session.cantidad === 'mas' ? 'Más de 9 (a especificar)' : session.cantidad}`);
        } else if (session.tipo === 'robux') {
            lineas.push(`**Producto:** Robux`);
            lineas.push(`**Cantidad:** ${session.cantidad === 'mas' ? 'Más de 1000 (a especificar)' : `${session.cantidad} RBX`}`);
            if (session.entrega) lineas.push(`**Entrega:** ${ROBUX_ENTREGA_LABEL[session.entrega]}`);
        } else {
            lineas.push(`**Producto:** Otro (a especificar en el ticket)`);
        }
        lineas.push(`**País:** ${labelPais(session)}`);
        lineas.push(`**Método de pago:** ${labelMetodo(session)}`);
        const precio = calcularPrecio(session);
        if (precio) lineas.push(`**Precio a pagar:** ${precio}`);
    } else if (session.categoria === 'inversiones') {
        lineas.push(`**Monto a invertir:** ${session.monto}`);
        lineas.push(`**País:** ${labelPais(session)}`);
        lineas.push(`**Método de pago:** ${labelMetodo(session)}`);
        lineas.push(`\n⚠️ *La empresa ofrece 8% de ganancia mensual. Una vez realizada la inversión, el dinero no podrá retirarse hasta cumplir el plazo pactado.*`);
    } else if (session.categoria === 'postulaciones') {
        lineas.push(`**Puesto:** ${session.trabajo === 'otro' ? session.trabajoTexto : session.trabajo}`);
        lineas.push(`**País:** ${labelPais(session)}`);
        lineas.push(`**Método de pago:** ${labelMetodo(session)}`);
    } else if (['dudas', 'reportes', 'otro'].includes(session.categoria)) {
        lineas.push(`**${session.categoria === 'reportes' ? 'Reporte/problema' : session.categoria === 'dudas' ? 'Duda/problema' : 'Necesidad'}:** ${session.p1}`);
        if (session.p2) lineas.push(`**Información adicional:** ${session.p2}`);
    }
    return lineas.join('\n');
}

function buildConfirmEmbed(session) {
    const cat = CATEGORIAS[session?.categoria] ?? { emoji: '🧩', label: 'Solicitud' };
    const label = cat.label === 'Comprar' ? 'Compra' : cat.label;
    return new EmbedBuilder().setColor('#1F2430')
        .setTitle(`${LEON}  Te confirmo tu solicitud`)
        .setDescription(
            `> ${cat.emoji} **Ticket — ${label}**\n` +
            `${'─'.repeat(18)}\n` +
            `${resumenConfirmacion(session ?? {})}\n\n` +
            `> Si algo está mal, usa **Retroceder y cambiar**. Si todo está bien, usa **Continuar**.`
        )
        .setFooter({ text: 'Industrias Rojas • Soporte premium' });
}

// ─── Mensaje de bienvenida dentro del canal de ticket ──────────────────────
function textoEsperaStaff() {
    return (
        '**¡Hola! ¿Cómo estás?**\n\n' +
        'Gracias por abrir un ticket con nosotros. Espera un momento a que un miembro del staff te atienda; no será mucho.\n\n' +
        '**Información importante:**\n' +
        '• El staff te mencionará cuando esté disponible para atenderte\n' +
        '• Respondemos en orden de llegada\n' +
        '• Si esperas más de 10 horas, contacta a un staff en el chat general\n' +
        '• Tu información se muestra abajo para agilizar la atención\n\n' +
        '**Gracias por tu paciencia. ¡Esperamos ayudarte de la mejor manera!** ' +
        '💎 _Industrias Rojas™_'
    );
}

function textoInstruccionesAdicionales(session) {
    const extra = [];
    if (session.categoria === 'compra') {
        if (session.tipo === 'streaming' && session.servicio === 'otro')
            extra.push('Por favor proporciónanos el producto o servicio que deseas y su cantidad, además del nombre del perfil y el PIN que te gustaría. Gracias.');
        else if (session.tipo === 'streaming' && session.cantidad === 'mas')
            extra.push('Por favor indícanos cuántas cuentas te gustaría comprar, así como el/los nombre(s) de usuario que quieres para tu(s) cuenta(s) y el PIN si deseas. Gracias.');
        else if (session.tipo === 'streaming')
            extra.push('Por favor proporciónanos el nombre de usuario que quieres para tu cuenta y el PIN si deseas. Gracias.');
        else if (session.tipo === 'robux') {
            extra.push('Recuerda que tal vez no podamos darte los Robux por el método de entrega que elegiste; esperamos entiendas.');
            extra.push('Por favor indícanos en el chat si estás unido a algún grupo y a cuál, además de tu nombre de usuario de Roblox.');
            if (session.cantidad === 'mas') extra.push('Como elegiste “Más de 1000”, indícanos cuántos Robux te gustaría comprar.');
            if (session.esOtroCantidad) extra.push(`Cantidad personalizada solicitada: **${session.cantidad}** — confírmala con el staff.`);
            if (session.entrega === 'regalo') extra.push('Indícanos qué game-pass o regalo quieres, su valor y el juego.');
        } else if (session.tipo === 'otro') {
            extra.push('Por favor ve indicando qué producto o servicio quieres y qué cantidad, para agilizar tu atención.');
        }
    }
    return extra.join('\n');
}

function buildTicketWelcomeEmbed(session, ticketId, numeroCategoria) {
    const cat = CATEGORIAS[session?.categoria] ?? { emoji: '🧩', label: 'Solicitud' };
    const label = cat.label === 'Comprar' ? 'Compra' : cat.label;
    const instrucciones = textoInstruccionesAdicionales(session ?? {});
    const usuario = session?.userTag ? session.userTag.split('#')[0] : 'usuario';

    const resumenLineas = resumenConfirmacion(session).split('\n')
        .map(l => `  ▸ ${l}`)
        .join('\n');

    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${LEON} Ticket #${ticketId} — ${label}`)
        .setDescription(
            `**¡Hola, ${usuario}!**\n\n` +
            `▸ Bienvenido a tu ticket de **${label.toLowerCase()}**.\n` +
            `▸ Un miembro del staff te atenderá pronto.\n\n` +
            textoEsperaStaff() + '\n\n' +
            `**━━━ INFORMACIÓN DE TU ${label.toUpperCase()} ━━━**\n` +
            resumenLineas +
            (instrucciones ? `\n\n**━━━ INSTRUCCIONES ADICIONALES ━━━**\n${instrucciones.split('\n').map(l => `  ▸ ${l}`).join('\n')}` : '')
        )
        .setFooter({ text: `${LEON} Industrias Rojas™ • Ticket #${numeroCategoria}` })
        .setTimestamp();
}

// ─── Botones del ticket (reclamar / cerrar) ────────────────────────────────
// IMPORTANTE: el emoji va SOLO en .setEmoji(), nunca repetido dentro del
// .setLabel(), o Discord lo muestra duplicado (uno como ícono, otro como texto).
function buildTicketRow(ticketId, reclamado = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ir_ticket_reclamar_${ticketId}`)
            .setLabel(reclamado ? 'Reclamado' : 'Reclamar ticket')
            .setEmoji(reclamado ? '✅' : '✋')
            .setStyle(reclamado ? ButtonStyle.Secondary : ButtonStyle.Success)
            .setDisabled(reclamado),
        new ButtonBuilder().setCustomId(`ir_ticket_cerrar_${ticketId}`)
            .setLabel('Cerrar ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),
    );
}

// ─── Registro en el canal "pedidos" (solo para tickets de Compra) ─────────
async function registrarPedido(guild, data, session, ticketChannel, ticketId) {
    if (!data.config.pedidosChannelId) return;
    const canal = guild.channels.cache.get(data.config.pedidosChannelId) ?? await guild.channels.fetch(data.config.pedidosChannelId).catch(() => null);
    if (!canal) return;

    const n = store.nextId(data.pedidos);
    console.log(`📦 [registrarPedido] Creando pedido #${n} para ticket #${ticketId}`);
    let producto, venta, cantidad;
    if (session.tipo === 'streaming') {
        producto = 'Streaming';
        venta = session.servicio === 'otro' ? 'Desconocido (a especificar)' : STREAMING_NORMAL[session.servicio].label;
        cantidad = session.cantidad === 'mas' ? 'Desconocido (Más de 9)' : (session.cantidad ?? 'Desconocido');
    } else if (session.tipo === 'robux') {
        producto = 'Robux';
        venta = 'Robux';
        cantidad = session.cantidad === 'mas' ? 'Desconocido (Más de 1000)' : `${session.cantidad} RBX`;
    } else {
        producto = 'Otro'; venta = 'Desconocido'; cantidad = 'Desconocido';
    }
    const precio = calcularPrecio(session) ?? 'Desconocido';

    const pedido = {
        id: n, producto, venta, cantidad, precio,
        metodo: labelMetodo(session), pais: labelPais(session),
        userId: session.userId, ticketId, channelId: ticketChannel.id,
        timestamp: Date.now(),
    };
    data.pedidos.push(pedido);

    const embed = new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} Nueva orden registrada`)
        .setDescription(
            `**━━━ ORDEN #${n} ━━━**\n\n` +
            `▸ **Producto o servicio:** ${producto}\n` +
            `▸ **Venta:** ${venta}\n` +
            `▸ **Cantidad:** ${cantidad}\n` +
            `▸ **Precio:** ${precio}\n` +
            `▸ **Método:** ${pedido.metodo}\n` +
            `▸ **País:** ${pedido.pais}\n` +
            `▸ **Usuario:** <@${session.userId}>\n` +
            `▸ **Ticket:** <#${ticketChannel.id}>\n` +
            `▸ **Fecha:** ${fechaColombia()}`
        ).setTimestamp();
    console.log(`📨 [registrarPedido] Enviando embed de pedido #${n} al canal de pedidos`);
    await canal.send({ embeds: [embed] }).catch(() => {});

    if (data.config.dmEnabled !== false) {
        const cliente = await guild.client.users.fetch(session.userId).catch(() => null);
        if (cliente) {
            console.log(`📧 [registrarPedido] Enviando embed de pedido #${n} al DM del usuario`);
            await cliente.send({ embeds: [embed] }).catch(() => {});
        }
    }
}

// ─── Creación del ticket ────────────────────────────────────────────────────
async function createTicketFromSession(interaction, session) {
    const guild = interaction.guild;
    const data = store.load(guild.id);
    const cat = CATEGORIAS[session.categoria];

    const yaAbierto = data.tickets.find(t => t.userId === session.userId && t.estado === 'abierto');
    if (yaAbierto) {
        const existe = await guild.channels.fetch(yaAbierto.channelId).catch(() => null);
        if (existe) return safeUpdateOrReply(interaction, { content: `⚠️ Ya tienes un ticket abierto: <#${yaAbierto.channelId}>`, embeds: [], components: [] });
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels))
        return safeUpdateOrReply(interaction, { content: '⚠️ Al bot le falta el permiso **Gestionar canales**.', embeds: [], components: [] });

    const numCat = data.tickets.filter(t => t.categoria === session.categoria).length + 1;
    const slug = (interaction.user.username || 'usuario').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'usuario';
    const nombreCanal = `${cat.emoji}・${session.categoria}-${numCat}-${slug}`;

    const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] },
    ];
    if (data.config.staffRoleId) overwrites.push({ id: data.config.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    if (session.categoria === 'compra' && data.config.vendedorRoleId)
        overwrites.push({ id: data.config.vendedorRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

    const canal = await guild.channels.create({
        name: nombreCanal, type: ChannelType.GuildText,
        parent: data.config.categoryId ?? null, permissionOverwrites: overwrites,
    });

    const ticketId = store.nextId(data.tickets);
    data.tickets.push({
        id: ticketId, numero: numCat, categoria: session.categoria,
        channelId: canal.id, userId: session.userId, userTag: interaction.user.tag,
        estado: 'abierto', timestamp: Date.now(), reclamadoPor: null, reclamadoTag: null,
    });
    console.log(`🎫 [createTicketFromSession] Guardando ticket #${ticketId} (usuario: ${session.userId}, categoría: ${session.categoria})`);
    store.save(guild.id, data);

    const menciones = [`<@${session.userId}>`];
    if (session.categoria === 'compra' && data.config.vendedorRoleId) menciones.push(`<@&${data.config.vendedorRoleId}>`);
    else if (data.config.staffRoleId) menciones.push(`<@&${data.config.staffRoleId}>`);

    const welcomeMsg = await canal.send({
        content: menciones.join(' '),
        embeds: [buildTicketWelcomeEmbed(session, ticketId, numCat)],
        components: [buildTicketRow(ticketId, false)],
    }).catch(() => null);

    if (welcomeMsg && data.tickets[data.tickets.length - 1]) {
        data.tickets[data.tickets.length - 1].welcomeMsgId = welcomeMsg.id;
    }

    if (data.config.logChannelId) {
        const logCanal = guild.channels.cache.get(data.config.logChannelId);
        if (logCanal) await logCanal.send({ embeds: [new EmbedBuilder().setColor(COLOR)
            .setTitle(`${cat.emoji} Ticket #${ticketId} abierto`)
            .setDescription(`**Usuario:** <@${session.userId}>\n**Categoría:** ${cat.label} ${numCat}\n**Canal:** <#${canal.id}>`)
            .setTimestamp()] }).catch(() => {});
    }

    if (session.categoria === 'compra') await registrarPedido(guild, data, session, canal, ticketId);
    console.log(`💾 [createTicketFromSession] Guardando data final (después de registrar pedido)`);
    store.save(guild.id, data);
    store.clearSession(session.userId);

    return safeUpdateOrReply(interaction, { content: `✅ Tu ticket fue creado: <#${canal.id}>`, embeds: [], components: [] });
}

async function safeUpdateOrReply(interaction, opts) {
    try {
        if (interaction.replied || interaction.deferred) return await interaction.editReply(opts);
        return await interaction.update(opts);
    } catch { /* silencioso */ }
}

// ─── Reclamar / cerrar ──────────────────────────────────────────────────────
// Al reclamar: solo el mod que reclamó y el usuario deben poder ver el canal.
// El resto del staff (rol staff / rol vendedor) pierde la vista. El usuario
// SIEMPRE conserva su acceso — antes se le quitaba por error.
async function reclamarTicket(interaction, ticketId) {
    const data = store.load(interaction.guild.id);
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.estado === 'cerrado') return safeReply(interaction, { content: '⚠️ Este ticket ya fue cerrado.' });

    const esStaff = data.config.staffRoleId ? interaction.member.roles.cache.has(data.config.staffRoleId) : false;
    const esAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!esStaff && !esAdmin) return safeReply(interaction, { content: '🛡️ Solo el staff puede reclamar tickets.' });
    if (ticket.reclamadoPor) return safeReply(interaction, { content: `⚠️ Ya fue reclamado por <@${ticket.reclamadoPor}>.` });

    ticket.reclamadoPor = interaction.user.id; ticket.reclamadoTag = interaction.user.tag;
    store.save(interaction.guild.id, data);

    const canal = interaction.channel;
    if (canal) {
        // Quitar la vista a los roles generales de staff/vendedor
        if (data.config.staffRoleId) {
            await canal.permissionOverwrites.edit(data.config.staffRoleId, {
                [PermissionFlagsBits.ViewChannel]: false,
            }).catch(() => {});
        }
        if (data.config.vendedorRoleId) {
            await canal.permissionOverwrites.edit(data.config.vendedorRoleId, {
                [PermissionFlagsBits.ViewChannel]: false,
            }).catch(() => {});
        }
        // El usuario SIEMPRE conserva su acceso al ticket
        await canal.permissionOverwrites.edit(ticket.userId, {
            [PermissionFlagsBits.ViewChannel]: true,
            [PermissionFlagsBits.SendMessages]: true,
            [PermissionFlagsBits.ReadMessageHistory]: true,
        }).catch(() => {});
        // El mod que reclamó recibe acceso explícito (por si no lo tenía ya por su rol)
        await canal.permissionOverwrites.edit(interaction.user.id, {
            [PermissionFlagsBits.ViewChannel]: true,
            [PermissionFlagsBits.SendMessages]: true,
            [PermissionFlagsBits.ReadMessageHistory]: true,
        }).catch(() => {});
    }

    await interaction.message.edit({ components: [buildTicketRow(ticketId, true)] }).catch(() => {});

    const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${LEON} Ticket reclamado`)
        .setDescription(
            `**━━━━━━━━━━━━━━━━━━**\n` +
            `▸ **Staff:** <@${interaction.user.id}>\n` +
            `▸ **Ticket:** #${ticketId}\n` +
            `▸ **Hora:** ${fechaColombia()}\n` +
            `**━━━━━━━━━━━━━━━━━━**\n` +
            `✋ Este ticket ha sido reclamado por el staff. Comenzará la atención ahora.\n` +
            `*A partir de ahora solo tú, <@${interaction.user.id}>, pueden ver este canal — el resto del staff dejó de tener acceso.*`
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Atención Premium' })
        .setTimestamp();

    await interaction.channel.send({ embeds: [embed] }).catch(() => {});
    return safeReply(interaction, { content: '✅ Ticket reclamado. Solo tú y el usuario pueden ver este canal ahora.' });
}

async function cerrarTicketConfirm(interaction, ticketId) {
    const data = store.load(interaction.guild.id);
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.estado === 'cerrado') return safeReply(interaction, { content: '⚠️ Este ticket ya fue cerrado.' });

    const esAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const esStaff = data.config.staffRoleId ? interaction.member.roles.cache.has(data.config.staffRoleId) : false;
    if (!esAdmin && !esStaff) return safeReply(interaction, { content: '🚫 Solo el staff puede cerrar tickets.' });

    return safeReply(interaction, {
        embeds: [new EmbedBuilder().setColor('#ED4245').setTitle('🔒 ¿Cerrar este ticket?').setDescription('**━━━━━━━━━━━━━━━━━━**\nEl canal se eliminará en 5 segundos tras confirmar.\n**━━━━━━━━━━━━━━━━━━**')],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ir_ticket_confirmcerrar_${ticketId}`).setLabel('Sí, cerrar').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`ir_ticket_cancelarcierre_${ticketId}`).setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
        )],
    });
}

async function ejecutarCierreTicket(interaction, ticketId) {
    const data = store.load(interaction.guild.id);
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket) return safeReply(interaction, { content: '⚠️ Ticket no encontrado.' });

    ticket.estado = 'cerrado'; ticket.cerradoPor = interaction.user.tag; ticket.cerradoAt = Date.now();
    store.save(interaction.guild.id, data);

    await interaction.update({ content: '🔒 Ticket cerrado. El canal se eliminará en 5 segundos.', embeds: [], components: [] }).catch(() => {});
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

module.exports = {
    buildConfirmEmbed, createTicketFromSession, reclamarTicket, cerrarTicketConfirm,
    ejecutarCierreTicket, calcularPrecio, labelMetodo, labelPais,
};