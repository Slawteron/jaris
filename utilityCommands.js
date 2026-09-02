// ─── utilityCommands.js ─────────────────────────────────────────────────────
// Comandos de utilidades, configuración y características especiales
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const store = require('./data/store');
const { COLOR, LEON } = require('./ui/panels');
const { safeReply, safeDefer } = require('./utils/safe');

// ─── /sorteo ────────────────────────────────────────────────────────────────
async function handleSorteo(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const premioPrincipal = interaction.options.getString('premio_principal');
    const duracion = interaction.options.getString('duracion');
    const descripcion = interaction.options.getString('descripcion') ?? 'Participa en nuestro sorteo especial';
    const maxParticipantes = interaction.options.getInteger('participantes') ?? 100;

    // Parsear duracion (1h, 30m, etc)
    const durMs = {
        '1m': 60000, '5m': 300000, '10m': 600000, '15m': 900000, '30m': 1800000,
        '1h': 3600000, '2h': 7200000, '6h': 21600000, '12h': 43200000, '24h': 86400000
    }[duracion] || 3600000;

    const data = store.load(interaction.guild.id);
    if (!data.sorteos) data.sorteos = [];

    const sorteoId = data.sorteos.length + 1;
    const sorteo = {
        id: sorteoId, premioPrincipal, descripcion, maxParticipantes,
        creador: interaction.user.id, creadorTag: interaction.user.tag,
        createdAt: Date.now(), expiresAt: Date.now() + durMs,
        participantes: [], ganador: null, estado: 'activo'
    };

    data.sorteos.push(sorteo);
    store.save(interaction.guild.id, data);

    const embed = new EmbedBuilder().setColor('#FF00FF')
        .setTitle(`${LEON}  ¡SORTEO #${sorteoId}!`)
        .setDescription(descripcion)
        .addFields(
            { name: '🎁 Premio Principal', value: `**${premioPrincipal}**`, inline: false },
            { name: '⏱️ Duración', value: `<t:${Math.floor((Date.now() + durMs) / 1000)}:R>`, inline: true },
            { name: '👥 Participantes', value: `\`0/${maxParticipantes}\``, inline: true }
        )
        .setImage('https://i.imgur.com/6FDLhpx.png')
        .setFooter({ text: `Sorteo #${sorteoId}` })
        .setTimestamp();

    const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sorteo_entrar_${sorteoId}`).setLabel('✨ Participar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sorteo_info_${sorteoId}`).setLabel('ℹ️ Info').setStyle(ButtonStyle.Secondary)
    );

    return safeReply(interaction, { embeds: [embed], components: [btn] });
}

// ─── /clubvip ───────────────────────────────────────────────────────────────
async function handleClubVip(interaction) {
    const data = store.load(interaction.guild.id);
    if (!data.config.vipRoleId) return safeReply(interaction, { content: '⚠️ No hay rol VIP configurado.' });

    const vips = interaction.guild.members.cache.filter(m => m.roles.cache.has(data.config.vipRoleId));
    if (vips.size === 0) return safeReply(interaction, { content: '📭 Sin miembros VIP en el servidor.' });

    const lista = Array.from(vips.values())
        .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
        .slice(0, 20)
        .map((m, i) => `**${i + 1}.** <@${m.user.id}> — <t:${Math.floor(m.joinedTimestamp / 1000)}:d>`)
        .join('\n');

    const embed = new EmbedBuilder().setColor('#FFD700')
        .setTitle(`${LEON}  Club VIP`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setDescription(`**Miembros VIP:** \`${vips.size}\`\n\n${lista}`)
        .setFooter({ text: `VIP Club • ${interaction.guild.name}` })
        .setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /vip-setup ─────────────────────────────────────────────────────────────
async function handleVipSetup(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const rol = interaction.options.getRole('rol');
    const data = store.load(interaction.guild.id);
    data.config.vipRoleId = rol.id;
    store.save(interaction.guild.id, data);

    const embed = new EmbedBuilder().setColor('#FFD700')
        .setTitle(`${LEON}  ✅ Sistema VIP Configurado`)
        .setDescription(`Rol VIP: **${rol.name}**\n\nAhora los miembros con este rol accederán a beneficios especiales.`)
        .setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

// ─── /anuncio ───────────────────────────────────────────────────────────────
async function handleAnuncio(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const titulo = interaction.options.getString('titulo');
    const mensaje = interaction.options.getString('mensaje');
    const canalDestino = interaction.options.getChannel('canal') ?? interaction.channel;
    const incluirMenciones = interaction.options.getBoolean('mencionar_todos') ?? false;

    const embed = new EmbedBuilder().setColor('#FF6B6B')
        .setTitle(titulo)
        .setDescription(mensaje)
        .setTimestamp()
        .setFooter({ text: `Anunciado por ${interaction.user.username}` });

    const contenido = incluirMenciones ? '@everyone ' : '';
    const msg = await canalDestino.send({
        content: contenido.trim(),
        embeds: [embed]
    }).catch(e => null);

    if (msg) return safeReply(interaction, { content: `✅ Anuncio enviado a <#${canalDestino.id}> [Link](${msg.url})` });
    else return safeReply(interaction, { content: '⚠️ Error enviando anuncio.' });
}

// ─── /notificar ─────────────────────────────────────────────────────────────
async function handleNotificar(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const rol = interaction.options.getRole('rol_destino');
    const titulo = interaction.options.getString('titulo');
    const mensaje = interaction.options.getString('mensaje');

    const integrantes = interaction.guild.members.cache.filter(m => m.roles.cache.has(rol.id));
    if (integrantes.size === 0) return safeReply(interaction, { content: '⚠️ El rol no tiene miembros.' });

    const embed = new EmbedBuilder().setColor('#00BFFF')
        .setTitle(`🔔 ${titulo}`)
        .setDescription(mensaje)
        .setTimestamp();

    let exitosos = 0;
    for (const member of integrantes.values()) {
        await member.user.send({ embeds: [embed] }).then(() => exitosos++).catch(() => {});
    }

    return safeReply(interaction, { content: `✅ **${exitosos}/${integrantes.size}** notificaciones enviadas.` });
}

// ─── /afk ───────────────────────────────────────────────────────────────────
async function handleAfk(interaction) {
    const data = store.load(interaction.guild.id);
    if (!data.afkUsers) data.afkUsers = {};

    const razon = interaction.options.getString('razon') ?? 'No disponible';
    const userId = interaction.user.id;

    data.afkUsers[userId] = { razon, timestamp: Date.now(), tag: interaction.user.tag };
    store.save(interaction.guild.id, data);

    return safeReply(interaction, { content: `⏸️ Ahora estás AFK. Razón: **${razon}**\n\nTe notificaremos cuando alguien te mencione.` });
}

// ─── /settiers ──────────────────────────────────────────────────────────────
async function handleSetTiers(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const tier = interaction.options.getInteger('nivel');
    const rol = interaction.options.getRole('rol');
    const data = store.load(interaction.guild.id);

    if (!data.config.tierRoles) data.config.tierRoles = {};
    data.config.tierRoles[tier] = rol.id;
    store.save(interaction.guild.id, data);

    return safeReply(interaction, { content: `✅ **Tier ${tier}** → **${rol.name}** configurado.` });
}

// ─── /setvip ────────────────────────────────────────────────────────────────
async function handleSetVip(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const usuario = interaction.options.getUser('usuario');
    const duracion = interaction.options.getString('duracion');
    const data = store.load(interaction.guild.id);

    if (!data.config.vipRoleId) return safeReply(interaction, { content: '⚠️ Configura primero el rol VIP con `/vip-setup`.' });

    const durMs = { '1d': 86400000, '7d': 604800000, '30d': 2592000000, '90d': 7776000000, 'vitalicio': Infinity }[duracion] || 2592000000;
    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!member) return safeReply(interaction, { content: '⚠️ Usuario no encontrado en el servidor.' });

    await member.roles.add(data.config.vipRoleId).catch(() => {});
    if (!data.vipMembers) data.vipMembers = {};
    data.vipMembers[usuario.id] = { duracionMs: durMs, addedAt: Date.now(), addedBy: interaction.user.tag };
    store.save(interaction.guild.id, data);

    return safeReply(interaction, { content: `✅ **${usuario.username}** es ahora **VIP** por ${duracion}.` });
}

// ─── /setdm ─────────────────────────────────────────────────────────────────
async function handleSetDm(interaction) {
    if (!interaction.member.permissions.has(8n)) // Administrator
        return safeReply(interaction, { content: '🚫 Solo administradores.' });

    const estado = interaction.options.getBoolean('estado');
    const data = store.load(interaction.guild.id);
    data.config.dmEnabled = estado;
    store.save(interaction.guild.id, data);

    const embed = new EmbedBuilder().setColor(estado ? '#57F287' : '#FFA500')
        .setTitle(`${LEON}  Configuración DM`)
        .setDescription(`🔔 Notificaciones por DM están ahora **${estado ? '✅ ACTIVADAS' : '❌ DESACTIVADAS'}**`)
        .setTimestamp();

    return safeReply(interaction, { embeds: [embed] });
}

module.exports = {
    handleSorteo, handleClubVip, handleVipSetup, handleAnuncio, handleNotificar,
    handleAfk, handleSetTiers, handleSetVip, handleSetDm
};
