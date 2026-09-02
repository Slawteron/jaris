// ─── ui/modals.js ──────────────────────────────────────────────────────────
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

function modalDosPreguntas(customId, titulo, label1, label2) {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(titulo);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('p1').setLabel(label1).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(600)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('p2').setLabel(label2).setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(600)
        )
    );
    return modal;
}

// ─── Alianzas ───────────────────────────────────────────────────────────────
// Reemplaza al viejo modal de "Inversiones". La categoría del panel se
// renombró a "Alianzas" (colaboraciones/partnerships), así que este modal
// pide una propuesta de colaboración en vez de un monto a invertir.
function modalAlianza() {
    const modal = new ModalBuilder().setCustomId('ir_modal_alianza').setTitle('Alianzas — Industrias Rojas');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('propuesta').setLabel('¿Qué tipo de alianza propones?')
                .setPlaceholder('Ej: colaboración de contenido, promoción cruzada, etc.')
                .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(600)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('contacto').setLabel('¿Cómo te contactamos? (opcional)')
                .setPlaceholder('Servidor, redes sociales, correo, etc.')
                .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(150)
        )
    );
    return modal;
}

// ─── LEGACY: ya no está conectado a ningún flujo del panel. Se deja aquí
// por si el cliente todavía lo necesita para otra cosa, pero NO se vuelve a
// enlazar automáticamente: prometía "8% de ganancia mensual garantizada",
// lenguaje típico de esquemas de inversión fraudulentos (tipo Ponzi).
// Revisa con el cliente antes de reactivarlo.
function modalInversion() {
    const modal = new ModalBuilder().setCustomId('ir_modal_inversion').setTitle('Inversiones — Industrias Rojas');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('monto').setLabel('¿Cuánto deseas invertir? (mínimo 17 USD)')
                .setPlaceholder('Ej: 20 USD, 80.000 COP').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(60)
        )
    );
    return modal;
}

function modalTextoLibre(customId, titulo, label, placeholder = '') {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(titulo);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('valor').setLabel(label).setPlaceholder(placeholder)
                .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
        )
    );
    return modal;
}

module.exports = { modalDosPreguntas, modalAlianza, modalInversion, modalTextoLibre };