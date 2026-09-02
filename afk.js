// ─── afk.js ────────────────────────────────────────────────────────────────
// Sistema AFK (Away From Keyboard) tipo Apollo Bot
// Almacena status AFK de usuarios con razón y tiempo
const store = require('./data/store');

const afkUsers = new Map(); // { userId: { reason, timestamp, active } }

function setAFK(userId, razon = 'AFK') {
    afkUsers.set(userId, {
        reason: razon,
        timestamp: Date.now(),
        active: true,
    });
    console.log(`🔴 ${userId} está en AFK: ${razon}`);
}

function removeAFK(userId) {
    if (afkUsers.has(userId)) {
        afkUsers.delete(userId);
        console.log(`🟢 ${userId} ya no está en AFK`);
        return true;
    }
    return false;
}

function getAFK(userId) {
    return afkUsers.get(userId);
}

function isAFK(userId) {
    return afkUsers.has(userId);
}

function checkMentionAFK(message) {
    // Si mencionan a alguien que está AFK, notificar
    if (!message.mentions.has(message.guild?.members.me)) return;
    
    const afkMentions = message.mentions.filter(u => isAFK(u.id));
    if (afkMentions.size === 0) return;
    
    const lines = afkMentions.map(u => {
        const afk = getAFK(u.id);
        const tiempoTranscurrido = Math.floor((Date.now() - afk.timestamp) / 1000 / 60);
        return `▸ **${u.username}** está en AFK desde hace **${tiempoTranscurrido} min**\n  └─ 💭 *${afk.reason}*`;
    });
    
    return `**━━━━━━━━━━━━━━━━━━**\n🔴 **USUARIO(S) EN AFK:**\n**━━━━━━━━━━━━━━━━━━**\n${lines.join('\n')}\n**━━━━━━━━━━━━━━━━━━**`;
}

// Hook para mensaje: si user entra en AFK, quitarle
function handleMessageForAFK(message) {
    if (message.author.bot) return;
    
    const esComandoAFK = message.content.toLowerCase().startsWith('?afk');
    if (esComandoAFK) return; // No procesar comandos AFK
    
    if (isAFK(message.author.id)) {
        removeAFK(message.author.id);
        return `**━━━━━━━━━━━━━━━━━━**\n✅ **${message.author.username} ya no está en AFK**\n▸ ¡Bienvenido de vuelta!\n**━━━━━━━━━━━━━━━━━━**`;
    }
    
    const respuesta = checkMentionAFK(message);
    return respuesta;
}

module.exports = {
    setAFK, removeAFK, getAFK, isAFK, 
    handleMessageForAFK, checkMentionAFK,
};
