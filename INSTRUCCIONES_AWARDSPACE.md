# 📋 Guía de Despliegue - Vida Mediterránea en AwardSpace

## 🚀 ¡Buenas noticias! Tu App ahora es Híbrida

He modificado la aplicación para que sea **mucho más sencilla de hospedar** en AwardSpace o cualquier hosting sin Node.js:

1.  **Modo Local Automático**: Si el servidor PHP falla o no está configurado, la app guardará todo en el navegador (LocalStorage). ¡Nunca dejará de funcionar!
2.  **Sin Servidor Node.js**: No necesitas ejecutar `npm run server`. La API PHP se encarga de todo de forma automática al subir los archivos.
3.  **Rutas Relativas**: Ahora la app funciona aunque la subas a una subcarpeta.

## 📦 Qué subir (Carpeta: `dist`)

Todo lo que está en `c:\ARMARIO\Trabajos\APP-Dieta\dist` debe subir a la carpeta `/www/goyito.atwebpages.com/public_html/` (o raíz del hosting):

```
dist/
├── .htaccess                 ← URL rewriting
├── index.html                ← Página principal
├── api/
│   ├── config.php           ← Funciones compartidas
│   └── index.php            ← Router de API
├── assets/                   ← JavaScript, CSS compilados
│   ├── index-*.js
│   ├── index-*.css
│   ├── html2canvas.esm-*.js
│   └── purify.es-*.js
└── db/                       ← Datos (JSON)
    ├── foods.json           ← Lista de alimentos
    └── logs.json            ← Registro de comidas
```

## 🚀 Pasos para Desplegar

### Opción A: Usando el File Manager de AwardSpace (MÁS FÁCIL)

1. **Accede al File Manager**: https://cp1.awardspace.net/
2. **Navega a** `/www/goyito.atwebpages.com/public_html/`
3. **Sube los archivos**:
   - Carga `.htaccess` primero
   - Luego sube las carpetas: `api/`, `assets/`, `db/`
   - Finalmente sube `index.html`

### Opción B: Usando FTP

1. **Conecta con FTP**:
   - Host: `goyito.atwebpages.com` (o datos de AwardSpace)
   - Usuario: Tu usuario de AwardSpace
   - Contraseña: Tu contraseña
   - Carpeta: `/public_html/`

2. **Sube la carpeta `dist`** completa

### Opción C: Usando SSH (Si está habilitado)

```bash
# Conectar por SSH
ssh tu_usuario@goyito.atwebpages.com

# Navegar a la carpeta
cd public_html

# Subir archivos desde tu PC (desde PowerShell local)
scp -r "c:\ARMARIO\Trabajos\APP-Dieta\dist\*" tu_usuario@goyito.atwebpages.com:public_html/
```

## ⚙️ Verificación Después de Subir

1. **Accede a tu app**: https://goyito.atwebpages.com
2. **Debería cargar** la página de Vida Mediterránea
3. **Prueba funciones**:
   - Ver catálogo de alimentos
   - Agregar comidas
   - Descargar PDF
   - Ver historial en calendario

## 🛡️ Permisos Necesarios

Asegúrate de que estas carpetas tengan permisos **755** (lectura/escritura):

```
/api/        → 755
/db/         → 755  (Los archivos JSON necesitan ser editables)
```

**En el File Manager de AwardSpace**:
- Click derecho en la carpeta → Propiedades → Permisos → Marcar 755

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "No inicia el servidor" | **¡No necesitas iniciarlo!** En AwardSpace el servidor es PHP y "siempre está encendido". Solo sube los archivos. |
| "404 Not Found" | Asegúrate que `.htaccess` está subido. Verifica que mod_rewrite está habilitado. |
| "Los cambios no se guardan" | Verifica que la carpeta `/db/` tenga permisos **755** o **777**. |
| "Sigue pidiendo npm run server" | He actualizado el código para que ya no pida eso. Si lo ves, es que no has subido los últimos cambios de la carpeta `dist`. |

## 📝 Notas Importantes

- **Los datos se guardan en archivos JSON**, no en base de datos MySQL
- **Cada recarga de la app refresca los datos** desde los archivos
- **Los permisos de carpeta son críticos** para que la API pueda escribir datos
- **El archivo `.htaccess` es esencial** para el enrutamiento de URLs

## 🔄 Cómo Actualizar la App

Si haces cambios en el código futuro:

1. Compila de nuevo: `npm run build`
2. Sube solo la carpeta `dist/` nuevamente
3. Los datos (JSON) se conservarán

## ❓ Preguntas Frecuentes

**P: ¿Se perderán los datos si reinicio la app?**
R: No. Los datos están guardados en archivos JSON que persisten en el servidor.

**P: ¿Por qué no usamos MySQL?**
R: La API PHP está optimizada para JSON. Si necesitas MySQL en el futuro, podemos migrarlo.

**P: ¿Cuántos usuarios pueden usar la app?**
R: Todos los usuarios comparten los mismos alimentos y registros (es una sola base de datos compartida).

---

**¿Listo para subir?** Dime si necesitas ayuda con algún paso. 🚀
