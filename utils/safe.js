// ─── utils/safe.js ─────────────────────────────────────────────────────────
function isIgnorableError(err) {
    if (!err) return true;
    const code = err.code ?? err.status;
    if ([10062, 40060, 10008, 10003, 50013, 50035, 40001, 40002].includes(code)) return true;
    const msg = (err.message ?? '').toLowerCase();
    return ['unknown interaction', 'unknown message', 'cannot send messages', 'missing access',
        'already been acknowledged', 'aborted a request', 'econnreset', 'econnrefused', 'etimedout']
        .some(s => msg.includes(s));
}

async function safeReply(interaction, opts) {
    const o = { ...opts, flags: opts.flags ?? 64 };
    delete o.ephemeral;
    try {
        if (interaction.replied) return await interaction.followUp(o);
        if (interaction.deferred) return await interaction.editReply(o);
        return await interaction.reply(o);
    } catch (e) { if (!isIgnorableError(e)) console.warn('⚠️ [safeReply]', e?.message); }
}

async function safeUpdate(interaction, opts) {
    try {
        if (interaction.replied || interaction.deferred) return await interaction.editReply(opts);
        return await interaction.update(opts);
    } catch (e) { if (!isIgnorableError(e)) console.warn('⚠️ [safeUpdate]', e?.message); }
}

async function safeDefer(interaction, ephemeral = true) {
    if (interaction.deferred || interaction.replied) return true;
    try { await interaction.deferReply(ephemeral ? { flags: 64 } : {}); return true; }
    catch (e) { if (!isIgnorableError(e)) console.warn('⚠️ [safeDefer]', e?.message); return false; }
}

async function safeHandle(interaction, fn) {
    try { await fn(); }
    catch (err) {
        if (isIgnorableError(err)) return;
        console.error(`❌ [safeHandle] ${interaction.customId ?? interaction.commandName ?? '?'}:`, err.message ?? err);
        try {
            if (!interaction.replied && !interaction.deferred)
                await interaction.reply({ content: '⚠️ Ocurrió un error inesperado. Intenta de nuevo.', flags: 64 });
        } catch { /* silencioso */ }
    }
}

module.exports = { isIgnorableError, safeReply, safeUpdate, safeDefer, safeHandle };
