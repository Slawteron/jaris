# Jaris

Bot de Discord para tickets, precios y tienda.

## Configuracion

1. Completa `.env` con el token del bot, el ID de la aplicacion y el ID del servidor:

```env
DISCORD_TOKEN=TU_TOKEN_AQUI
CLIENT_ID=TU_CLIENT_ID_AQUI
GUILD_ID=TU_ID_DE_SERVIDOR_AQUI
```

2. Invita el bot con los scopes `bot` y `applications.commands`. Necesita permisos para ver canales, enviar mensajes, gestionar canales y usar comandos slash.
3. Ejecuta `npm start`.

El comando `/ticket` publica el panel de soporte. La tienda y los precios se gestionan con `/store` y `/pricing`; sus datos se mantienen en memoria mientras el proceso esta activo.
