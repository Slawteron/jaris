const { EmbedBuilder } = require('discord.js');
const { STREAMING_NORMAL, STREAMING_REVENDEDOR, ROBUX_CANTIDADES, precioRobux, formatPrecio } = require('./data/pricing');
const { COLOR, LEON } = require('./ui/panels');
const afk = require('./afk');

const MONEDAS = ['COP', 'MXN', 'ARS', 'USD', 'PEN'];
const MONEDA_FLAG = { COP: 'CO', MXN: 'MX', ARS: 'AR', USD: 'US', PEN: 'PE' };

function lineaPrecios(precios) {
    return MONEDAS.map((moneda) => `${MONEDA_FLAG[moneda]} ${formatPrecio(precios[moneda], moneda)}`).join(' | ');
}

function embedListaStreaming(tabla, titulo) {
    const desc = Object.values(tabla).map((servicio) => `${servicio.emoji} **${servicio.label}**\n${lineaPrecios(servicio.precios)}`).join('\n\n');
    return new EmbedBuilder().setColor(COLOR).setTitle(`${LEON}  ${titulo}`).setDescription(desc).setTimestamp();
}

function embedRobux() {
    const filas = ROBUX_CANTIDADES.map((cantidad) => {
        const precios = MONEDAS.map((moneda) => formatPrecio(precioRobux(cantidad, moneda), moneda)).join(' | ');
        return `🎮 **${cantidad} RBX** - ${precios}`;
    }).join('\n');
    return new EmbedBuilder().setColor(COLOR).setTitle(`${LEON}  Precios de Robux`).setDescription(filas).setTimestamp();
}

function embedStaff() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} POSTULACIONES PARA STAFF`)
        .setDescription('**Buscamos personas maduras, responsables, profesionales y comprometidas con la comunidad.**\n\nUsa el panel de tickets y selecciona **Postulaciones** para aplicar al equipo.')
        .addFields(
            { name: '📋 Requisitos', value: 'Madurez • Responsabilidad • Profesionalismo • Compromiso', inline: false },
            { name: '💰 Sueldo', value: 'Base de 80 Robux semanales + bonificaciones según rendimiento', inline: false },
            { name: '🎯 Grupos disponibles', value: '• Grupo de Invitaciones\n• Grupo de Tickets y Supervisión\n• Grupo de Actividades', inline: false }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Compromiso • Organización • Crecimiento' })
        .setTimestamp();
}

function embedReglas() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} REGLAS DE INDUSTRIAS ROJAS`)
        .setDescription('**Lee atentamente las reglas del servidor para una mejor experiencia.**')
        .addFields(
            { name: '1️⃣ Respeto', value: 'Se respetuoso con todos los miembros y staff', inline: false },
            { name: '2️⃣ Sin spam', value: 'No hagas spam en canales ni mensajes privados', inline: false },
            { name: '3️⃣ Sin contenido inapropiado', value: 'No compartas contenido violento, sexual o ilegal', inline: false },
            { name: '4️⃣ Cumple con transacciones', value: 'Sé responsable con tus compras e inversiones', inline: false },
            { name: '5️⃣ Sin publicidad no autorizada', value: 'No promociones otros servidores o negocios', inline: false }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Sé parte de nuestra comunidad responsable' })
        .setTimestamp();
}

function embedSoporte() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} SOPORTE TÉCNICO`)
        .setDescription('**¿Necesitas ayuda? Estamos aquí para ti 24/7**\n\nUsa el panel de tickets para:**\n• Reportar problemas técnicos\n• Preguntas sobre productos\n• Consultas generales\n• Y mucho más')
        .addFields(
            { name: '📞 Contacto directo', value: 'Abre un ticket usando `/ticket-setup`', inline: false },
            { name: '⏱️ Tiempo de respuesta', value: 'Respondemos en menos de 1 hora en horario de atención', inline: false },
            { name: '💬 Preferencias', value: 'Sé específico en tu consulta para una mejor atención', inline: false }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Soporte Premium Garantizado' })
        .setTimestamp();
}

function embedInfo() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} COMANDOS DE INFORMACIÓN`)
        .setDescription('**Usa estos comandos para obtener información de nuestros servicios:**')
        .addFields(
            { name: '?PrecioStreaming', value: 'Precios de servicios de streaming', inline: true },
            { name: '?PrecioRevendedores', value: 'Precios especiales para revendedores', inline: true },
            { name: '?PrecioRobux', value: 'Precios de Robux internacionales', inline: true },
            { name: '?Staff', value: 'Información sobre postulaciones a staff', inline: true },
            { name: '?Reglas', value: 'Reglas del servidor', inline: true },
            { name: '?Soporte', value: 'Centro de soporte técnico', inline: true },
            { name: '?Info', value: 'Este mensaje', inline: true },
            { name: '?Reputacion', value: 'Cómo ganar reputación', inline: true },
            { name: '?Garantia', value: 'Información sobre garantías', inline: true }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Domina el futuro • Crea tu legado' })
        .setTimestamp();
}

function embedReputacion() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} SISTEMA DE REPUTACIÓN`)
        .setDescription('**Gana reputación siendo responsable y profesional**')
        .addFields(
            { name: '⭐ Cómo ganar reputación', value: '✅ Completa transacciones exitosas\n✅ Sé respetuoso en el servidor\n✅ Ayuda a otros miembros\n✅ Participa en actividades', inline: false },
            { name: '🎁 Beneficios de reputación', value: '• Mejor posición en la comunidad\n• Acceso a ofertas exclusivas\n• Confianza de otros usuarios\n• Posibles bonificaciones', inline: false },
            { name: '⚠️ Perder reputación', value: 'Incumplimientos, falta de respeto o fraude reducen tu reputación', inline: false }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Tu reputación es tu credibilidad' })
        .setTimestamp();
}

function embedGarantia() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} GARANTÍA DE PRODUCTOS`)
        .setDescription('**En Industrias Rojas™ garantizamos la calidad de todos nuestros servicios**')
        .addFields(
            { name: '✅ Garantía completa', value: 'Todos los productos incluyen garantía de funcionamiento', inline: false },
            { name: '🔄 Reemplazo', value: 'Si hay un problema, reemplazamos sin costo adicional', inline: false },
            { name: '📞 Soporte post-venta', value: 'Soporte técnico gratuito después de la compra', inline: false },
            { name: '💰 Reembolso', value: 'En casos excepcionales, procesamos reembolsos', inline: false },
            { name: '📋 Proceso', value: 'Abre un ticket en la categoría **Dudas o Problemas** para reclamar', inline: false }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Calidad • Confianza • El mejor precio' })
        .setTimestamp();
}

// ─── FUNCIONES BONUS ──────────────────────────────────────────────────────
function embedConvertidor(args) {
    if (args.length < 2) {
        return new EmbedBuilder().setColor(COLOR)
            .setTitle(`${LEON} Convertidor de Monedas`)
            .setDescription('**Uso:** `?Convertir <cantidad> <monedaOrigen> <monedaDestino>`\n\nEj: `?Convertir 100 COP ARS`')
            .setTimestamp();
    }
    
    const cantidad = parseFloat(args[0]);
    const origen = args[1]?.toUpperCase();
    const destino = args[2]?.toUpperCase();
    
    const tasas = { COP: 1, ARS: 0.008, MXN: 0.0015, USD: 0.00024, PEN: 0.0009 };
    
    if (!tasas[origen] || !tasas[destino] || isNaN(cantidad)) {
        return new EmbedBuilder().setColor('#ED4245')
            .setTitle('❌ Error en la conversión')
            .setDescription(`Monedas válidas: COP, ARS, MXN, USD, PEN`)
            .setTimestamp();
    }
    
    const resultado = (cantidad * tasas[origen]) / tasas[destino];
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} Conversión de Monedas`)
        .addFields(
            { name: `💰 ${cantidad} ${origen}`, value: `→ ${resultado.toFixed(2)} ${destino}`, inline: false }
        )
        .setFooter({ text: 'Tasas aproximadas • Actualizar con banco real' })
        .setTimestamp();
}

function embedCalcularPrecio(args) {
    if (args.length < 3) {
        return new EmbedBuilder().setColor(COLOR)
            .setTitle(`${LEON} Calculador de Precios`)
            .setDescription('**Uso:** `?CalcularPrecio <cantidad> <pais> <servicio?>`\n\nEj: `?CalcularPrecio 5 colombia netflix`')
            .setTimestamp();
    }
    
    const cantidad = parseInt(args[0]);
    const pais = args[1]?.toLowerCase();
    const { MONEDA_POR_PAIS } = require('./data/pricing');
    
    if (!MONEDA_POR_PAIS[pais] || isNaN(cantidad) || cantidad <= 0) {
        return new EmbedBuilder().setColor('#ED4245')
            .setTitle('❌ Parámetros inválidos')
            .setDescription(`Países válidos: colombia, argentina, mexico, peru`)
            .setTimestamp();
    }
    
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} Cálculo de Precio`)
        .addFields(
            { name: '📊 Resultado', value: `${cantidad} unidades en ${pais.toUpperCase()} → Contacta al staff para el precio exacto`, inline: false }
        )
        .setFooter({ text: 'Usa ?PrecioStreaming o ?PrecioRobux para ver catálogos' })
        .setTimestamp();
}

function embedComandosBono() {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} COMANDOS BONUS`)
        .setDescription('**Comandos adicionales útiles:**')
        .addFields(
            { name: '?Convertir <qty> <origen> <destino>', value: 'Convierte entre monedas (COP, ARS, MXN, USD, PEN)', inline: false },
            { name: '?CalcularPrecio <qty> <pais> <producto?>', value: 'Calcula el precio de un producto en tu país', inline: false },
            { name: '?Hora', value: 'Muestra la hora actual de Colombia', inline: false },
            { name: '?Avatar @usuario', value: 'Ver avatar de un usuario', inline: false },
            { name: '?ID', value: 'Ver tu ID de usuario', inline: false },
            { name: '?Uptime', value: 'Tiempo que el bot lleva en línea', inline: false }
        )
        .setFooter({ text: '💎 Industrias Rojas™ • Más funciones viniendo pronto' })
        .setTimestamp();
}

function embedHora() {
    const ahora = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} Hora de Colombia`)
        .setDescription(`🕐 **${ahora}**\n_Zona horaria: America/Bogota_`)
        .setTimestamp();
}

function embedID(userID) {
    return new EmbedBuilder().setColor(COLOR)
        .setTitle(`${LEON} Tu ID de Usuario`)
        .addFields(
            { name: 'ID', value: `\`${userID}\``, inline: false }
        )
        .setFooter({ text: 'Úsalo para tareas administrativas' })
        .setTimestamp();
}

async function handlePrefixCommand(message, comando) {
    const cmd = comando.toLowerCase();
    const args = message.content.split(' ').slice(2); // Obtener argumentos después del prefijo y comando
    
    if (cmd === 'ping') return message.reply(`Pong! ${Math.round(message.client.ws.ping)}ms`).catch(() => {});
    if (cmd === 'preciostreaming') return message.reply({ embeds: [embedListaStreaming(STREAMING_NORMAL, 'Precios de Streaming')] }).catch(() => {});
    if (cmd === 'preciorevendedores') return message.reply({ embeds: [embedListaStreaming(STREAMING_REVENDEDOR, 'Precios para Revendedores')] }).catch(() => {});
    if (cmd === 'preciorobux') return message.reply({ embeds: [embedRobux()] }).catch(() => {});
    if (cmd === 'staff') return message.reply({ embeds: [embedStaff()] }).catch(() => {});
    if (cmd === 'reglas') return message.reply({ embeds: [embedReglas()] }).catch(() => {});
    if (cmd === 'soporte') return message.reply({ embeds: [embedSoporte()] }).catch(() => {});
    if (cmd === 'info') return message.reply({ embeds: [embedInfo()] }).catch(() => {});
    if (cmd === 'reputacion') return message.reply({ embeds: [embedReputacion()] }).catch(() => {});
    if (cmd === 'garantia') return message.reply({ embeds: [embedGarantia()] }).catch(() => {});
    
    // COMANDOS BONUS
    if (cmd === 'convertir') return message.reply({ embeds: [embedConvertidor(args)] }).catch(() => {});
    if (cmd === 'calcularprecio') return message.reply({ embeds: [embedCalcularPrecio(args)] }).catch(() => {});
    if (cmd === 'bonus') return message.reply({ embeds: [embedComandosBono()] }).catch(() => {});
    if (cmd === 'hora') return message.reply({ embeds: [embedHora()] }).catch(() => {});
    if (cmd === 'id') return message.reply({ embeds: [embedID(message.author.id)] }).catch(() => {});
    if (cmd === 'uptime') return message.reply(`⏱️ **Bot uptime:** ${Math.floor(message.client.uptime / 1000)} segundos`).catch(() => {});
    
    // COMANDO AFK
    if (cmd === 'afk') {
        const razon = args.length > 0 ? args.join(' ') : 'AFK sin razón especificada';
        afk.setAFK(message.author.id, razon);
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle(`🔴 ${message.author.username} está en AFK`)
            .setDescription(`▸ **Razón:** ${razon}\n▸ **Notificaré a quien te mencione**`)
            .setFooter({ text: 'Usa cualquier comando para salir de AFK' })
            .setTimestamp();
        return message.reply({ embeds: [embed] }).catch(() => {});
    }
    
    return false;
}

module.exports = { handlePrefixCommand };