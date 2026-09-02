// ─── data/pricing.js ───────────────────────────────────────────────────────
// Precios extraídos de las imágenes "?PrecioStreaming" y "?PrecioRevendedores"
// que compartió el cliente. Los que llevan el comentario "// VERIFICAR" no
// aparecían completos en el documento original y quedaron estimados a partir
// de los pocos ejemplos que sí dio el cliente. Ajusta esos valores con él
// antes de producción.
//
// NOTA: este archivo unifica las versiones duplicadas que había — borra
// cualquier otra copia de data/pricing.js que tengas para no mezclarlas.

const STREAMING_NORMAL = {
    prime: { label: 'Prime Video', emoji: '🎬',
        precios: { COP: 6000, MXN: 33, ARS: 2950, USD: 1.97, PEN: 6.60 } },
    paramount: { label: 'Paramount+ Premium', emoji: '⭐',
        precios: { COP: 6500, MXN: 36, ARS: 3200, USD: 2.13, PEN: 7.20 } },
    crunchyroll: { label: 'Crunchyroll Premium', emoji: '📺',
        precios: { COP: 4000, MXN: 22, ARS: 1970, USD: 1.31, PEN: 4.40 } },
    youtube: { label: 'YouTube Premium', emoji: '▶️',
        precios: { COP: 5500, MXN: 31, ARS: 2710, USD: 1.80, PEN: 6.10 } },
    netflix: { label: 'Netflix Premium', emoji: '🎬',
        precios: { COP: 12000, MXN: 67, ARS: 5900, USD: 3.93, PEN: 13.20 } },
    max: { label: 'Max (HBO)', emoji: '🎥',
        precios: { COP: 5500, MXN: 31, ARS: 2710, USD: 1.80, PEN: 6.10 } },
    canva: { label: 'Canva Pro Edu', emoji: '🎨',
        precios: { COP: 5000, MXN: 28, ARS: 2460, USD: 1.64, PEN: 5.50 } },
    vix: { label: 'VIX Premium', emoji: '📡',
        precios: { COP: 4000, MXN: 22, ARS: 1970, USD: 1.31, PEN: 4.40 } },
    disney: { label: 'Disney+ Premium', emoji: '🏰',
        precios: { COP: 11000, MXN: 61, ARS: 5420, USD: 3.61, PEN: 12.10 } },
};

const STREAMING_REVENDEDOR = {
    prime: { label: 'Prime Video', emoji: '🎬',
        precios: { COP: 2991, MXN: 16.63, ARS: 1472, USD: 0.98, PEN: 3.30 } },
    paramount: { label: 'Paramount+ Premium', emoji: '⭐',
        precios: { COP: 3266, MXN: 18.16, ARS: 1607, USD: 1.07, PEN: 3.60 } },
    crunchyroll: { label: 'Crunchyroll Premium', emoji: '📺',
        precios: { COP: 2014, MXN: 11.20, ARS: 991, USD: 0.66, PEN: 2.22 } },
    youtube: { label: 'YouTube Premium', emoji: '▶️',
        precios: { COP: 2777, MXN: 15.44, ARS: 1366, USD: 0.91, PEN: 3.06 } },
    netflix: { label: 'Netflix Premium', emoji: '🎬',
        precios: { COP: 7630, MXN: 42.42, ARS: 3755, USD: 2.50, PEN: 8.42 } },
    max: { label: 'Max (HBO)', emoji: '🎥',
        precios: { COP: 2747, MXN: 15.27, ARS: 1351, USD: 0.90, PEN: 3.03 } },
    canva: { label: 'Canva Pro Edu', emoji: '🎨',
        precios: { COP: 3357, MXN: 18.66, ARS: 1652, USD: 1.10, PEN: 3.70 } },
    vix: { label: 'VIX Premium', emoji: '📡',
        precios: { COP: 2014, MXN: 11.20, ARS: 991, USD: 0.66, PEN: 2.22 } },
    disney: { label: 'Disney+ Premium', emoji: '🏰',
        precios: { COP: 5524, MXN: 30.72, ARS: 2718, USD: 1.81, PEN: 6.09 } },
};

// El documento del cliente solo dio 2-3 ejemplos de Robux. Se completó la
// tabla con una tarifa proporcional a esos ejemplos. // VERIFICAR con el
// cliente antes de usar en producción.
const ROBUX_CANTIDADES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const ROBUX_TASA_POR_100 = { // VERIFICAR — derivado de 500RB=16.000 COP / 500RB=7.800 ARS
    COP: 2800, MXN: 15.60, ARS: 1560, USD: 1.04, PEN: 3.50
};
function precioRobux(cantidad, moneda) {
    const tasa = ROBUX_TASA_POR_100[moneda] ?? 0;
    return Math.round((cantidad / 100) * tasa * 100) / 100;
}

const MONEDA_POR_PAIS = { colombia: 'COP', mexico: 'MXN', argentina: 'ARS', peru: 'PEN' };
const SIMBOLO_MONEDA  = { COP: '$', MXN: '$', ARS: '$', USD: '$', PEN: 'S/' };
const PAIS_EMOJI = { colombia: '🇨🇴', argentina: '🇦🇷', mexico: '🇲🇽', peru: '🇵🇪', otro: '🌍' };

function formatPrecio(valor, moneda) {
    const simbolo = SIMBOLO_MONEDA[moneda] ?? '';
    const val = moneda === 'USD' || moneda === 'PEN' ? valor.toFixed(2) : Math.round(valor).toLocaleString('es-CO');
    return `${simbolo}${val} ${moneda}`;
}

module.exports = {
    STREAMING_NORMAL, STREAMING_REVENDEDOR,
    ROBUX_CANTIDADES, ROBUX_TASA_POR_100, precioRobux,
    MONEDA_POR_PAIS, PAIS_EMOJI, SIMBOLO_MONEDA, formatPrecio
};