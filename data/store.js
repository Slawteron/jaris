// ─── data/store.js ─────────────────────────────────────────────────────────
// Persistencia en disco (JSON por servidor) con escritura atómica, igual
// patrón que ya usas: evita corromper el archivo si el proceso se cae
// a mitad de un guardado.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'storage');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function saveAtomic(filePath, data) {
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    try { fs.renameSync(tmp, filePath); }
    catch { fs.copyFileSync(tmp, filePath); try { fs.unlinkSync(tmp); } catch {} }
}

function defaultData() {
    return {
        config: {
            panelChannelId: null, panelMessageId: null, categoryId: null,
            logChannelId: null,       // canal de logs generales de tickets
            pedidosChannelId: null,   // canal "pedidos" (solo registros de Compra)
            staffRoleId: null, vendedorRoleId: null,
            panelImageUrl: null,      // banner opcional del panel (URL)
            dmEnabled: true,          // DM automático de confirmación de pedido y de transcript al cerrar
        },
        tickets: [],       // { id, categoria, userId, channelId, estado, ... }
        pedidos: [],       // registros de compra (canal "pedidos")
        cooldowns: {},      // userId -> timestamp del último ticket abierto
    };
}

function load(guildId) {
    const file = path.join(DATA_DIR, `${guildId}.json`);
    if (!fs.existsSync(file)) return defaultData();
    try {
        const raw = fs.readFileSync(file, 'utf8');
        if (!raw.trim()) return defaultData();
        const data = JSON.parse(raw);
        const def = defaultData();
        data.config   = { ...def.config, ...(data.config ?? {}) };
        data.tickets  = data.tickets  ?? [];
        data.pedidos  = data.pedidos  ?? [];
        data.cooldowns = data.cooldowns ?? {};
        return data;
    } catch (e) {
        console.error(`❌ store.load [${guildId}]:`, e.message);
        return defaultData();
    }
}

function save(guildId, data) {
    try { saveAtomic(path.join(DATA_DIR, `${guildId}.json`), data); }
    catch (e) { console.error('❌ store.save:', e.message); }
}

function nextId(list) {
    return list.length ? list.reduce((max, x) => (x.id > max ? x.id : max), 0) + 1 : 1;
}

// ─── Sesiones de asistente (wizard) en memoria ───────────────────────────
// Guardan el progreso de un usuario mientras responde el panel de tickets,
// ANTES de que se cree el canal de ticket. Se limpian solas tras inactividad.
const sessions = new Map(); // userId -> { ...datosDelFlujo, updatedAt }
const SESSION_TTL_MS = 15 * 60 * 1000;

function getSession(userId) {
    const s = sessions.get(userId);
    if (s && Date.now() - s.updatedAt > SESSION_TTL_MS) { sessions.delete(userId); return null; }
    return s ?? null;
}
function setSession(userId, data) {
    sessions.set(userId, { ...(sessions.get(userId) ?? {}), ...data, updatedAt: Date.now() });
    return sessions.get(userId);
}
function resetSession(userId, data) {
    sessions.set(userId, { ...data, updatedAt: Date.now() });
    return sessions.get(userId);
}
function clearSession(userId) { sessions.delete(userId); }

const shouldStartSessionCleaner = () => {
    const script = process.argv[1] || '';
    return !!process.env.DISCORD_TOKEN || /(?:^|\/)(?:index|main)\.js$/.test(script);
};

if (shouldStartSessionCleaner()) {
    setInterval(() => {
        const ahora = Date.now();
        for (const [uid, s] of sessions) if (ahora - s.updatedAt > SESSION_TTL_MS) sessions.delete(uid);
    }, 5 * 60 * 1000);
}

module.exports = { load, save, nextId, getSession, setSession, resetSession, clearSession };
