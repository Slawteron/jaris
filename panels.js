// ─── ui/panels.js ──────────────────────────────────────────────────────────
const {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require('discord.js');
const { STREAMING_NORMAL } = require('./data/pricing');

const LEON = '🦁';
const COLOR = '#C0392B'; // rojo Industrias Rojas
const BANNER_URL = null; // pon aquí la URL del banner/logo si tienes una

// ─── Categorías del panel principal (según spec del cliente) ─────────────
const CATEGORIAS = {
    compra:        { emoji: '🛒', label: 'Compra',           desc: 'Selecciona esta opción si deseas comprar algún producto o servicio de nuestra tienda.' },
    dudas:         { emoji: '❓', label: 'Dudas o problemas', desc: 'Preguntas sobre productos, servicios, empresa o algún problema que tengas.' },
    inversiones:   { emoji: '💹', label: 'Inversiones',       desc: 'Selecciona esta opción si deseas comprar acciones de nuestra empresa e invertir en ella.' },
    reportes:      { emoji: '⚠️', label: 'Reportes',          desc: 'Reporta un error, un problema, o a un usuario/staff.' },
    postulaciones: { emoji: '📋', label: 'Postulaciones',     desc: '¿Te gustaría conseguir un trabajo con nosotros y ganar Robux o dinero?' },
    otro:          { emoji: '🔔', label: 'Otro',              desc: 'Si no encuentras tu situación en las opciones anteriores.' },
};

function buildPanelEmbed(guildName) {
    const e = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`${LEON}  BIENVENIDO A INDUSTRIAS ROJAS`)
        .setDescription(
            `¿En qué podemos ayudarte?\n${'─'.repeat(28)}\n` +
            Object.values(CATEGORIAS).map(c => `${c.emoji}  **${c.label}**\n╰➤ ${c.desc}`).join('\n\n')
        )
        .setFooter({ text: `${guildName} · Industrias Rojas ${LEON}` })
        .setTimestamp();
    if (BANNER_URL) e.setImage(BANNER_URL);
    return e;
}

function buildPanelRow() {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('ir_panel_categoria')
        .setPlaceholder('Selecciona la opción que más se acople a tu necesidad...')
        .addOptions(Object.entries(CATEGORIAS).map(([value, c]) =>
            new StringSelectMenuOptionBuilder().setLabel(c.label).setDescription(c.desc.slice(0, 95)).setEmoji(c.emoji).setValue(value)
        ));
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: país ──────────────────────────────────────────────────────────
function buildPaisSelect(customId = 'ir_pais') {
    const menu = new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder('¿De qué país eres?')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Colombia').setEmoji('🇨🇴').setValue('colombia'),
            new StringSelectMenuOptionBuilder().setLabel('Argentina').setEmoji('🇦🇷').setValue('argentina'),
            new StringSelectMenuOptionBuilder().setLabel('México').setEmoji('🇲🇽').setValue('mexico'),
            new StringSelectMenuOptionBuilder().setLabel('Perú').setEmoji('🇵🇪').setValue('peru'),
            new StringSelectMenuOptionBuilder().setLabel('Otro').setEmoji('🌎').setValue('otro'),
        );
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: método de pago (filtra Mercado Pago si el país no es Argentina) ─
function buildMetodoSelect(customId = 'ir_metodo', pais = null) {
    const opciones = [
        { label: 'Yape', value: 'yape', emoji: '📱' },
        { label: 'Mercado Pago', value: 'mercadopago', emoji: '💳', soloArgentina: true },
        { label: 'Nequi', value: 'nequi', emoji: '📲' },
        { label: 'Binance', value: 'binance', emoji: '🟡' },
        { label: 'Airtm', value: 'airtm', emoji: '💠' },
        { label: 'Otro', value: 'otro', emoji: '➕' },
    ].filter(o => !o.soloArgentina || pais === 'argentina');
    const menu = new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder('¿Qué método de pago deseas?')
        .addOptions(opciones.map(o => new StringSelectMenuOptionBuilder().setLabel(o.label).setEmoji(o.emoji).setValue(o.value)));
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: servicios de streaming ───────────────────────────────────────
function buildStreamingServicioSelect() {
    const menu = new StringSelectMenuBuilder().setCustomId('ir_streaming_servicio').setPlaceholder('¿Qué servicio o producto deseas?')
        .addOptions([
            ...Object.entries(STREAMING_NORMAL).map(([value, s]) =>
                new StringSelectMenuOptionBuilder().setLabel(s.label).setEmoji(s.emoji).setValue(value)),
            new StringSelectMenuOptionBuilder().setLabel('Otro').setEmoji('➕').setValue('otro'),
        ]);
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: tipo de compra ────────────────────────────────────────────────
function buildCompraTipoSelect() {
    const menu = new StringSelectMenuBuilder().setCustomId('ir_compra_tipo').setPlaceholder('¿Qué deseas comprar?')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Servicios o productos streaming').setEmoji('📺').setValue('streaming'),
            new StringSelectMenuOptionBuilder().setLabel('Robux').setEmoji('🎮').setValue('robux'),
            new StringSelectMenuOptionBuilder().setLabel('Otro').setEmoji('➕').setValue('otro'),
        );
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: cantidad streaming (1-9 + más) ───────────────────────────────
function buildStreamingCantidadSelect() {
    const menu = new StringSelectMenuBuilder().setCustomId('ir_streaming_cantidad').setPlaceholder('¿Qué cantidad deseas comprar?')
        .addOptions([
            ...[1,2,3,4,5,6,7,8,9].map(n => new StringSelectMenuOptionBuilder().setLabel(String(n)).setValue(String(n))),
            new StringSelectMenuOptionBuilder().setLabel('Más de 9').setEmoji('➕').setValue('mas'),
        ]);
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: cantidad robux ────────────────────────────────────────────────
function buildRobuxCantidadSelect() {
    const { ROBUX_CANTIDADES } = require('../data/pricing');
    const menu = new StringSelectMenuBuilder().setCustomId('ir_robux_cantidad').setPlaceholder('¿Qué cantidad deseas?')
        .addOptions([
            ...ROBUX_CANTIDADES.map(n => new StringSelectMenuOptionBuilder().setLabel(`${n} RB`).setValue(String(n))),
            new StringSelectMenuOptionBuilder().setLabel('Más de 1000').setEmoji('➕').setValue('mas'),
            new StringSelectMenuOptionBuilder().setLabel('Otra cantidad').setEmoji('✏️').setValue('otro'),
        ]);
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: entrega de robux ──────────────────────────────────────────────
function buildRobuxEntregaSelect() {
    const menu = new StringSelectMenuBuilder().setCustomId('ir_robux_entrega').setPlaceholder('¿Qué método de entrega de Robux quieres?')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Grupo').setDescription('Debes estar unido a todos los grupos, mín. 15 días en la mayoría').setEmoji('👥').setValue('grupo'),
            new StringSelectMenuOptionBuilder().setLabel('Game-Pass').setEmoji('🎮').setValue('gamepass'),
            new StringSelectMenuOptionBuilder().setLabel('Roblox Plus').setDescription('Poco stock').setEmoji('💎').setValue('robloxplus'),
            new StringSelectMenuOptionBuilder().setLabel('Regalo de algún juego').setEmoji('🎁').setValue('regalo'),
        );
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Select: trabajo (postulaciones) ──────────────────────────────────────
function buildTrabajoSelect() {
    const menu = new StringSelectMenuBuilder().setCustomId('ir_trabajo').setPlaceholder('¿Para qué te gustaría postularte?')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Revendedor').setEmoji('🛍️').setValue('revendedor'),
            new StringSelectMenuOptionBuilder().setLabel('Staff').setEmoji('🛡️').setValue('staff'),
            new StringSelectMenuOptionBuilder().setLabel('Publicidad').setEmoji('📢').setValue('publicidad'),
            new StringSelectMenuOptionBuilder().setLabel('Otro').setEmoji('➕').setValue('otro'),
        );
    return new ActionRowBuilder().addComponents(menu);
}

// ─── Botones: confirmar / volver / cancelar ───────────────────────────────
function buildConfirmRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ir_confirm').setLabel('Continuar').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId('ir_back').setLabel('Retroceder y cambiar').setStyle(ButtonStyle.Secondary).setEmoji('↩️'),
        new ButtonBuilder().setCustomId('ir_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji('✖️'),
    );
}

module.exports = {
    LEON, COLOR, CATEGORIAS,
    buildPanelEmbed, buildPanelRow, buildPaisSelect, buildMetodoSelect,
    buildStreamingServicioSelect, buildCompraTipoSelect, buildStreamingCantidadSelect,
    buildRobuxCantidadSelect, buildRobuxEntregaSelect, buildTrabajoSelect, buildConfirmRow,
};