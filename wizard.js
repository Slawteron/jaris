// ─── wizard.js ─────────────────────────────────────────────────────────────
// Enruta cada paso del panel de tickets. Cada handler:
//  1) guarda en la sesión del usuario lo que acaba de responder,
//  2) decide cuál es el siguiente paso y lo muestra.
const { EmbedBuilder } = require('discord.js');
const store = require('./data/store');
const P = require('./ui/panels');
const M = require('./ui/modals');
const ticket = require('./ticket');
const utility = require('./utilityCommands');
const { safeReply, safeHandle } = require('./utils/safe');

function stepEmbed(title, description) {
    return new EmbedBuilder().setColor(P.COLOR).setTitle(`${P.LEON}  ${title}`).setDescription(description);
}

async function showStep(interaction, title, description, components, flags = 64) {
    const payload = {
        embeds: [stepEmbed(title, description)],
        components: components ?? [],
        flags,
    };

    if (interaction.deferred || interaction.replied) {
        return interaction.followUp(payload);
    }

    return interaction.reply(payload);
}

// ─── Paso: categoría del panel principal ──────────────────────────────────
async function onPanelCategoria(interaction) {
    const value = interaction.values[0];
    const userId = interaction.user.id;
    store.setSession(userId, { userId, categoria: value });

    if (value === 'compra')
        return showStep(interaction, 'Compra', '¿Qué deseas comprar?', [P.buildCompraTipoSelect()]);
    if (value === 'postulaciones')
        return showStep(interaction, 'Postulaciones', '¿Para qué te gustaría postularte?', [P.buildTrabajoSelect()]);
    if (value === 'alianzas')
        return interaction.showModal(M.modalAlianza());
    if (value === 'dudas')
        return interaction.showModal(M.modalDosPreguntas('ir_modal_dudas', 'Dudas o problemas', 'Describe tu problema o duda', 'Información adicional que debamos saber'));
    if (value === 'reportes')
        return interaction.showModal(M.modalDosPreguntas('ir_modal_reportes', 'Reportes', 'Describe tu reporte o problema', 'Usuario reportado / evidencia / info adicional'));
    if (value === 'otro')
        return interaction.showModal(M.modalDosPreguntas('ir_modal_otro', 'Otro', '¿Qué necesitas? Descríbelo', 'Información adicional que debamos saber'));
}

// ─── Compra: tipo → streaming | robux | otro ──────────────────────────────
async function onCompraTipo(interaction) {
    const value = interaction.values[0];
    store.setSession(interaction.user.id, { tipo: value });
    if (value === 'streaming')
        return showStep(interaction, 'Streaming', '¿Qué servicio o producto deseas?', [P.buildStreamingServicioSelect()]);
    if (value === 'robux')
        return showStep(interaction, 'Robux', '¿Qué cantidad deseas?', [P.buildRobuxCantidadSelect()]);
    return showStep(interaction, 'Compra — Otro', '¿De qué país eres?', [P.buildPaisSelect()]);
}

async function onStreamingServicio(interaction) {
    const value = interaction.values[0];
    store.setSession(interaction.user.id, { servicio: value });
    if (value === 'otro')
        return showStep(interaction, 'Streaming — Otro', '¿De qué país eres?', [P.buildPaisSelect()]);
    return showStep(interaction, 'Cantidad', '¿Qué cantidad deseas comprar?', [P.buildStreamingCantidadSelect()]);
}

async function onStreamingCantidad(interaction) {
    store.setSession(interaction.user.id, { cantidad: interaction.values[0] });
    return showStep(interaction, 'País', '¿De qué país eres?', [P.buildPaisSelect()]);
}

async function onRobuxCantidad(interaction) {
    const value = interaction.values[0];
    if (value === 'otro') return interaction.showModal(M.modalTextoLibre('ir_modal_robux_otro', 'Cantidad de Robux', '¿Cuántos Robux deseas?', 'Ej: 1500'));
    store.setSession(interaction.user.id, { cantidad: value, esOtroCantidad: false });
    return showStep(interaction, 'País', '¿De qué país eres?', [P.buildPaisSelect()]);
}

async function onRobuxEntrega(interaction) {
    store.setSession(interaction.user.id, { entrega: interaction.values[0] });
    const session = store.getSession(interaction.user.id);
    return interaction.update({ embeds: [ticket.buildConfirmEmbed(session)], components: [P.buildConfirmRow()] });
}

// ─── Compartidos: país → método → (entrega si robux) → confirmar ─────────
async function onPais(interaction) {
    const value = interaction.values[0];
    if (value === 'otro') return interaction.showModal(M.modalTextoLibre('ir_modal_pais_otro', 'País', 'Escribe tu país', 'Ej: Chile'));
    store.setSession(interaction.user.id, { pais: value, paisTexto: null });
    return showStep(interaction, 'Método de pago', '¿Qué método de pago deseas?', [P.buildMetodoSelect('ir_metodo', value)]);
}

async function afterMetodo(interaction, isModal) {
    const session = store.getSession(interaction.user.id);
    if (!session || !session.categoria) {
        const msg = { content: '⚠️ Tu sesión expiró. Abre el panel de nuevo.', embeds: [], components: [] };
        return isModal ? interaction.reply({ ...msg, flags: 64 }) : interaction.update(msg);
    }
    const opts = (session.categoria === 'compra' && session.tipo === 'robux')
        ? { embeds: [stepEmbed('Entrega de Robux', '¿Qué método de entrega de Robux quieres?')], components: [P.buildRobuxEntregaSelect()] }
        : { embeds: [ticket.buildConfirmEmbed(session)], components: [P.buildConfirmRow()] };
    return isModal ? interaction.reply({ ...opts, flags: 64 }) : interaction.update(opts);
}

async function onMetodo(interaction) {
    const value = interaction.values[0];
    if (value === 'otro') return interaction.showModal(M.modalTextoLibre('ir_modal_metodo_otro', 'Método de pago', 'Escribe tu método de pago', 'Ej: PayPal'));
    store.setSession(interaction.user.id, { metodo: value, metodoTexto: null });
    return afterMetodo(interaction, false);
}

async function onTrabajo(interaction) {
    const value = interaction.values[0];
    if (value === 'otro') return interaction.showModal(M.modalTextoLibre('ir_modal_trabajo_otro', 'Postulación', '¿Para qué puesto?', 'Escribe el puesto'));
    store.setSession(interaction.user.id, { trabajo: value, trabajoTexto: null });
    return interaction.update({ embeds: [stepEmbed('País', '¿De qué país eres?')], components: [P.buildPaisSelect()] });
}

// ─── Confirmar / retroceder / cancelar ────────────────────────────────────
async function onConfirmar(interaction) {
    const session = store.getSession(interaction.user.id);
    if (!session) return safeReply(interaction, { content: '⚠️ Tu sesión expiró (15 min de inactividad). Abre el panel de nuevo.' });
    console.log(`✔️ [wizard.onConfirmar] Usuario ${interaction.user.id} confirma creación de ticket (categoría: ${session.categoria})`);
    return ticket.createTicketFromSession(interaction, session);
}

async function onBack(interaction) {
    const session = store.getSession(interaction.user.id);
    if (!session) return safeReply(interaction, { content: '⚠️ Tu sesión expiró. Abre el panel de nuevo.' });
    // Simplificación: reinicia el flujo de la categoría actual desde su primer paso
    store.resetSession(interaction.user.id, { userId: session.userId, categoria: session.categoria });
    if (session.categoria === 'compra')
        return interaction.update({ embeds: [stepEmbed('Compra', '¿Qué deseas comprar?')], components: [P.buildCompraTipoSelect()] });
    if (session.categoria === 'postulaciones')
        return interaction.update({ embeds: [stepEmbed('Postulaciones', '¿Para qué te gustaría postularte?')], components: [P.buildTrabajoSelect()] });
    if (session.categoria === 'alianzas')
        return interaction.showModal(M.modalAlianza());
    return interaction.update({ embeds: [stepEmbed('Panel', 'Vuelve a seleccionar una opción desde el panel principal, por favor.')], components: [] });
}

async function onCancel(interaction) {
    store.clearSession(interaction.user.id);
    return interaction.update({ content: '✖️ Solicitud cancelada.', embeds: [], components: [] });
}

// ─── Modales ────────────────────────────────────────────────────────────────
async function onModalDosPreguntas(interaction, categoria) {
    const p1 = interaction.fields.getTextInputValue('p1');
    const p2 = interaction.fields.getTextInputValue('p2') || null;
    store.setSession(interaction.user.id, { userId: interaction.user.id, categoria, p1, p2 });
    const session = store.getSession(interaction.user.id);
    return interaction.reply({ embeds: [ticket.buildConfirmEmbed(session)], components: [P.buildConfirmRow()], flags: 64 });
}

async function onModalAlianza(interaction) {
    const propuesta = interaction.fields.getTextInputValue('propuesta');
    const contacto = interaction.fields.getTextInputValue('contacto') || null;
    store.setSession(interaction.user.id, { userId: interaction.user.id, categoria: 'alianzas', propuesta, contacto });
    const session = store.getSession(interaction.user.id);
    return interaction.reply({ embeds: [ticket.buildConfirmEmbed(session)], components: [P.buildConfirmRow()], flags: 64 });
}

async function onModalRobuxOtro(interaction) {
    const valor = interaction.fields.getTextInputValue('valor');
    store.setSession(interaction.user.id, { cantidad: valor, esOtroCantidad: true });
    return interaction.reply({ embeds: [stepEmbed('País', '¿De qué país eres?')], components: [P.buildPaisSelect()], flags: 64 });
}

async function onModalPaisOtro(interaction) {
    const valor = interaction.fields.getTextInputValue('valor');
    store.setSession(interaction.user.id, { pais: 'otro', paisTexto: valor });
    return interaction.reply({ embeds: [stepEmbed('Método de pago', '¿Qué método de pago deseas?')], components: [P.buildMetodoSelect('ir_metodo', 'otro')], flags: 64 });
}

async function onModalMetodoOtro(interaction) {
    const valor = interaction.fields.getTextInputValue('valor');
    store.setSession(interaction.user.id, { metodo: 'otro', metodoTexto: valor });
    return afterMetodo(interaction, true);
}

async function onModalTrabajoOtro(interaction) {
    const valor = interaction.fields.getTextInputValue('valor');
    store.setSession(interaction.user.id, { trabajo: 'otro', trabajoTexto: valor });
    return interaction.reply({ embeds: [stepEmbed('País', '¿De qué país eres?')], components: [P.buildPaisSelect()], flags: 64 });
}

// ─── Router principal ───────────────────────────────────────────────────────
async function handleInteraction(interaction) {
    const id = interaction.customId;
    console.log(`🔄 [wizard.handleInteraction] Processing interaction: customId=${id}, userId=${interaction.user.id}`);

    if (interaction.isStringSelectMenu()) {
        const map = {
            ir_panel_categoria: onPanelCategoria, ir_compra_tipo: onCompraTipo,
            ir_streaming_servicio: onStreamingServicio, ir_streaming_cantidad: onStreamingCantidad,
            ir_robux_cantidad: onRobuxCantidad, ir_robux_entrega: onRobuxEntrega,
            ir_pais: onPais, ir_metodo: onMetodo, ir_trabajo: onTrabajo,
        };
        if (map[id]) return safeHandle(interaction, () => map[id](interaction));
    }

    if (interaction.isButton()) {
        if (id === 'ir_confirm') {
            console.log(`✅ [wizard.handleInteraction] User ${interaction.user.id} clicked CONFIRM button`);
            return safeHandle(interaction, () => onConfirmar(interaction));
        }
        if (id === 'ir_back')    return safeHandle(interaction, () => onBack(interaction));
        if (id === 'ir_cancel')  return safeHandle(interaction, () => onCancel(interaction));
        if (id.startsWith('ir_ticket_reclamar_'))
            return safeHandle(interaction, () => ticket.reclamarTicket(interaction, parseInt(id.split('_').pop(), 10)));
        if (id.startsWith('ir_ticket_cerrar_'))
            return safeHandle(interaction, () => ticket.cerrarTicketConfirm(interaction, parseInt(id.split('_').pop(), 10)));
        if (id.startsWith('ir_ticket_confirmcerrar_'))
            return safeHandle(interaction, () => ticket.ejecutarCierreTicket(interaction, parseInt(id.split('_').pop(), 10)));
        if (id.startsWith('ir_ticket_cancelarcierre_'))
            return safeHandle(interaction, () => interaction.update({ content: '✅ Cierre cancelado.', embeds: [], components: [] }));
        // Botones del sorteo (creados por /sorteo en utilityCommands.js)
        if (id.startsWith('sorteo_entrar_'))
            return safeHandle(interaction, () => utility.handleSorteoEntrar(interaction, parseInt(id.split('_').pop(), 10)));
        if (id.startsWith('sorteo_info_'))
            return safeHandle(interaction, () => utility.handleSorteoInfo(interaction, parseInt(id.split('_').pop(), 10)));
    }

    if (interaction.isModalSubmit()) {
        const map = {
            ir_modal_dudas: i => onModalDosPreguntas(i, 'dudas'),
            ir_modal_reportes: i => onModalDosPreguntas(i, 'reportes'),
            ir_modal_otro: i => onModalDosPreguntas(i, 'otro'),
            ir_modal_alianza: onModalAlianza,
            ir_modal_robux_otro: onModalRobuxOtro,
            ir_modal_pais_otro: onModalPaisOtro,
            ir_modal_metodo_otro: onModalMetodoOtro,
            ir_modal_trabajo_otro: onModalTrabajoOtro,
        };
        if (map[id]) return safeHandle(interaction, () => map[id](interaction));
    }
}

module.exports = { handleInteraction };