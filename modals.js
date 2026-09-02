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

module.exports = { modalDosPreguntas, modalInversion, modalTextoLibre };