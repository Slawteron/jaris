// ─── index.js ──────────────────────────────────────────────────────────────
// Bot de Industrias Rojas™ PREMIUM — Sistema completo de tickets, pedidos,
// analytics, VIP, sorteos, notificaciones, y más (parity con Aurex).
const fs = require('fs');
const path = require('path');
const {
    Client, GatewayIntentBits, PermissionFlagsBits, ChannelType
} = require('discord.js');
require('dotenv').config();

const LOCK_PATH = path.join(__dirname, '.bot.lock');

function acquireSingleInstanceLock() {
    try {
        if (fs.existsSync(LOCK_PATH)) {
            const raw = fs.readFileSync(LOCK_PATH, 'utf8').trim();
            if (raw) {
                try {
                    process.kill(Number(raw), 0);
                    console.error(`❌ Ya existe otra instancia del bot en ejecución (PID ${raw}).`);
                    process.exit(1);
                } catch {
                    fs.unlinkSync(LOCK_PATH);
                }
            }
        }
        fs.writeFileSync(LOCK_PATH, String(process.pid), 'utf8');
        process.on('exit', () => {
            try { fs.unlinkSync(LOCK_PATH); } catch {}
        });
    } catch (err) {
        console.error('❌ No se pudo crear el lock del bot:', err.message);
        process.exit(1);
    }
}

acquireSingleInstanceLock();

const store = require('./data/store');
const P = require('./ui/panels');
const wizard = require('./wizard');
const { handlePrefixCommand } = require('./prefixCommands');
const admin = require('./adminCommands');
const premium = require('./premiumCommands');
const utility = require('./utilityCommands');
const { isIgnorableError, safeReply, safeDefer, safeHandle } = require('./utils/safe');
const afkModule = require('./afk');

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ FATAL: falta la variable de entorno DISCORD_TOKEN (revisa tu .env).');
    process.exit(1);
}

const PREFIX = '?';
const ALLOWED_GUILDS = (process.env.ALLOWED_GUILDS ?? '').split(',').map(s => s.trim()).filter(Boolean);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.on('error', (err) => { if (!isIgnorableError(err)) console.error('❌ [Client]', err?.message); });
client.on('warn', (msg) => console.warn('⚠️ [Client warn]', msg));

client.once('ready', () => {
    console.log(`✅ Bot listo como ${client.user.tag}`);
    client.user.setActivity('Industrias Rojas 🦁 | Premium Bot', { type: 3 });
});

// ─── /ticket-setup (PREMIUM VERSION) ────────────────────────────────────────
async function handleTicketSetup(interaction) {
    const esAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const esMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
    if (!esAdmin && !esMod)
        return safeReply(interaction, { content: '🚫 Solo administradores y moderadores pueden usar este comando.' });

    const ok = await safeDefer(interaction, true);
    if (!ok) return;

    const data = store.load(interaction.guild.id);
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;
    let categoria = interaction.options.getChannel('categoria');
    let logs = interaction.options.getChannel('logs');
    let pedidos = interaction.options.getChannel('pedidos');
    const rolStaff = interaction.options.getRole('rol_staff');
    const rolVendedor = interaction.options.getRole('rol_vendedor');
    const imagen = interaction.options.getString('imagen');

    if (!categoria) {
        categoria = interaction.guild.channels.cache.find(ch => ch.type === ChannelType.GuildCategory && /ticket|tickets/i.test(ch.name))
            ?? await interaction.guild.channels.create({
                name: '🎫 Tickets',
                type: ChannelType.GuildCategory,
            }).catch(() => null);
    }

    if (!logs) {
        logs = interaction.guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && /log|logs|ticket-log/i.test(ch.name))
            ?? await interaction.guild.channels.create({
                name: '📝 ticket-logs',
                type: ChannelType.GuildText,
                parent: categoria?.id ?? null,
            }).catch(() => null);
    }

    if (!pedidos) {
        pedidos = interaction.guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && /pedido|pedidos|ventas/i.test(ch.name))
            ?? await interaction.guild.channels.create({
                name: '🧾 pedidos',
                type: ChannelType.GuildText,
                parent: categoria?.id ?? null,
            }).catch(() => null);
    }

    if (categoria) data.config.categoryId = categoria.id;
    if (logs) data.config.logChannelId = logs.id;
    if (pedidos) data.config.pedidosChannelId = pedidos.id;
    if (rolStaff) data.config.staffRoleId = rolStaff.id;
    if (rolVendedor) data.config.vendedorRoleId = rolVendedor.id;
    if (imagen) data.config.panelImageUrl = imagen;

    const embedPanel = P.buildPanelEmbed(interaction.guild.name, data.config.panelImageUrl);
    const rowPanel = P.buildPanelRow();

    let actualizado = false;
    if (data.config.panelMessageId && data.config.panelChannelId) {
        try {
            const canalAnterior = await interaction.guild.channels.fetch(data.config.panelChannelId).catch(() => null);
            const msgAnterior = canalAnterior ? await canalAnterior.messages.fetch(data.config.panelMessageId).catch(() => null) : null;
            if (msgAnterior && canalAnterior.id === canal.id) {
                await msgAnterior.edit({ embeds: [embedPanel], components: [rowPanel] });
                actualizado = true;
            } else if (msgAnterior) {
                await msgAnterior.delete().catch(() => {});
            }
        } catch { /* reenvía abajo */ }
    }

    if (!actualizado) {
        const msg = await canal.send({ embeds: [embedPanel], components: [rowPanel] }).catch(() => null);
        if (msg) {
            data.config.panelChannelId = canal.id;
            data.config.panelMessageId = msg.id;
        }
    }
    store.save(interaction.guild.id, data);

    const resumen = [
        `✅ Panel ${actualizado ? 'actualizado' : `enviado a <#${canal.id}>`}`,
        `🏷️ Categoría general: ${categoria ? `**${categoria.name}**` : 'sin categoría'}`,
        logs ? `📜 Logs: <#${logs.id}>` : null,
        pedidos ? `🧾 Pedidos: <#${pedidos.id}>` : null,
        rolStaff ? `🛡️ Staff: **${rolStaff.name}**` : null,
        rolVendedor ? `🤝 Vendedor: **${rolVendedor.name}**` : null,
        `🎫 Cada usuario podrá abrir su propio ticket desde el panel, sin crear canales manuales.`,
        imagen ? `🖼️ Imagen ✓` : null,
    ].filter(Boolean).join('\n');

    return interaction.editReply({ content: resumen });
}

// ─── interactionCreate (ROUTER CENTRAL) ─────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.guild) return;
        if (ALLOWED_GUILDS.length > 0 && !ALLOWED_GUILDS.includes(interaction.guild.id)) return;

        if (interaction.isChatInputCommand()) {
            const cmd = interaction.commandName;

            // ─── Comandos generales ─────────────────────────────────────────
            if (cmd === 'ping') return safeReply(interaction, { content: `🏓 Pong! \`${Math.round(client.ws.ping)}ms\`` });
            if (cmd === 'ticket-setup') return handleTicketSetup(interaction);
            if (cmd === 'help') return safeHandle(interaction, () => admin.handleHelp(interaction));

            // ─── Tier 1: Gestión de pedidos ──────────────────────────────────
            if (cmd === 'pedidos') return safeHandle(interaction, () => admin.handlePedidos(interaction));
            if (cmd === 'pedido') return safeHandle(interaction, () => admin.handlePedido(interaction));
            if (cmd === 'buscarcliente') return safeHandle(interaction, () => admin.handleBuscarCliente(interaction));
            if (cmd === 'cancelarpedido') return safeHandle(interaction, () => admin.handleCancelarPedido(interaction));

            // ─── Tier 1: Vender & Exportar ──────────────────────────────────
            if (cmd === 'vender') return safeHandle(interaction, () => premium.handleVender(interaction));
            if (cmd === 'exportar') return safeHandle(interaction, () => premium.handleExportar(interaction));
            if (cmd === 'factura') return safeHandle(interaction, () => premium.handleFactura(interaction));

            // ─── Tier 2: Analytics ──────────────────────────────────────────
            if (cmd === 'stats') return safeHandle(interaction, () => admin.handleStats(interaction));
            if (cmd === 'dashboard') return safeHandle(interaction, () => premium.handleDashboard(interaction));
            if (cmd === 'top') return safeHandle(interaction, () => premium.handleTop(interaction));
            if (cmd === 'perfil') return safeHandle(interaction, () => premium.handlePerfil(interaction));
            if (cmd === 'servidor-stats') return safeHandle(interaction, () => premium.handleServidorStats(interaction));

            // ─── Tier 3: Reputación ─────────────────────────────────────────
            if (cmd === 'reseña') return safeHandle(interaction, () => premium.handleResena(interaction));
            if (cmd === 'resenas') return safeHandle(interaction, () => premium.handleResenas(interaction));

            // ─── Tier 3: VIP & Sorteos ──────────────────────────────────────
            if (cmd === 'clubvip') return safeHandle(interaction, () => utility.handleClubVip(interaction));
            if (cmd === 'vip-setup') return safeHandle(interaction, () => utility.handleVipSetup(interaction));
            if (cmd === 'sorteo') return safeHandle(interaction, () => utility.handleSorteo(interaction));

            // ─── Tier 4: Utilidades ─────────────────────────────────────────
            if (cmd === 'anuncio') return safeHandle(interaction, () => utility.handleAnuncio(interaction));
            if (cmd === 'notificar') return safeHandle(interaction, () => utility.handleNotificar(interaction));
            if (cmd === 'clear') return safeHandle(interaction, () => premium.handleClear(interaction));
            if (cmd === 'afk') return safeHandle(interaction, () => utility.handleAfk(interaction));

            // ─── Configuración ──────────────────────────────────────────────
            if (cmd === 'configdm') return safeReply(interaction, { content: `⚙️ DM config: use \`/setdm\` instead.` });
            if (cmd === 'setdm') return safeHandle(interaction, () => utility.handleSetDm(interaction));
            if (cmd === 'settiers') return safeHandle(interaction, () => utility.handleSetTiers(interaction));
            if (cmd === 'setvip') return safeHandle(interaction, () => utility.handleSetVip(interaction));

            console.warn(`⚠️ Comando sin handler: ${cmd}`);
            return;
        }

        // Todo lo demás (selects, botones, modales del panel/tickets) lo maneja wizard.js
        if (interaction.isStringSelectMenu() || interaction.isButton() || interaction.isModalSubmit())
            return wizard.handleInteraction(interaction);

    } catch (e) { if (!isIgnorableError(e)) console.error('❌ interactionCreate:', e?.message); }
});

// ─── messageCreate (comandos de prefijo "?") ────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    
    // Check AFK status
    const respuestaAFK = afkModule.handleMessageForAFK(message);
    if (respuestaAFK) await message.reply(respuestaAFK).catch(() => {});
    if (ALLOWED_GUILDS.length > 0 && !ALLOWED_GUILDS.includes(message.guild.id)) return;
    if (!message.content.startsWith(PREFIX)) return;

    const comando = message.content.slice(PREFIX.length).trim().split(/\s+/)[0];
    if (!comando) return;
    try { await handlePrefixCommand(message, comando); }
    catch (e) { if (!isIgnorableError(e)) console.warn('⚠️ [prefixCommand]', e?.message); }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ FATAL: no se pudo conectar:', err.message);
    process.exit(1);
});

