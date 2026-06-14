# 🔧 Solución de Problemas - API No Conecta

## 🚨 Problema: "No se pudo conectar con el servidor"

La app está funcionando, pero no puede acceder a la API PHP. Esto es normal después de subir por primera vez.

---

## ✅ Pasos para Arreglarlo

### **Paso 1: Sube el .htaccess ACTUALIZADO**

He actualizado el archivo `.htaccess` en tu PC local. **DEBE subirse PRIMERO** (incluso si ya lo subiste antes).

1. Ve a `c:\ARMARIO\Trabajos\APP-Dieta\dist\.htaccess`
2. Sube este archivo **SOBRE** el que ya está en el servidor (replace)
3. **Verificar permisos**: Click derecho → Propiedades → Permisos → **644** (or **-rw-r--r--**)

---

### **Paso 2: Verifica que la API Funciona**

1. Accede a: `https://goyito.atwebpages.com/api/test_api.php`
2. **Deberías ver una página de diagnóstico** que te dirá si la base de datos conecta y si las tablas existen.

**Si ves "¡CONECTADO!" en verde, ¡la API está funcionando!** 🎉

---

### **Paso 3: Si la conexión falla**

| Problema | Solución |
|----------|----------|
| `Access denied for user...` | Revisa el usuario y contraseña en `api/config.php`. |
| `Unknown database...` | Revisa el nombre de la base de datos en `api/config.php`. |
| `Table 'users' doesn't exist` | Ejecuta `https://goyito.atwebpages.com/api/setup_db.php` para crear las tablas. |
| `Connection timed out` | Asegúrate de que el host en `config.php` sea `localhost` o el que te dio AwardSpace. |

---

### **Paso 4: Prueba la API Directamente**

1. Accede a: `https://goyito.atwebpages.com/api/index.php?path=foods`
2. **Deberías ver un JSON** con la lista de alimentos

Si ves un JSON con alimentos, ¡todo está bien! 🎊

---

### **Paso 5: Si Aún No Funciona...**

#### **Opción A: Borra y sube de nuevo**

1. **En el File Manager**: Selecciona las carpetas `api/`, `assets/`, `db/`
2. **Click derecho → Borrar**
3. **Recarga la página** y sube de nuevo TODO desde tu PC:
   - `.htaccess`
   - `index.html`
   - Carpeta `api/`
   - Carpeta `assets/`
   - Carpeta `db/`

#### **Opción B: Verifica que mod_rewrite está habilitado**

En el panel de control de AwardSpace → Herramientas Avanzadas → Busca "mod_rewrite" o "Reescritura de URL"

---

## 📝 Checklist de Verificación

Después de subir los archivos:

```
✓ .htaccess subido (permisos 644)
✓ index.html subido (permisos 644)
✓ Carpeta api/ creada con:
  - config.php (permisos 644)
  - index.php (permisos 644)
  - test.php (permisos 644)
✓ Carpeta assets/ con todos los archivos JS/CSS
✓ Carpeta db/ con:
  - foods.json (permisos 644)
  - logs.json (permisos 644)
✓ Prueba: https://goyito.atwebpages.com/api/test.php funciona
✓ Prueba: https://goyito.atwebpages.com carga la app
✓ Prueba: Puedo ver alimentos en el catálogo
```

---

## 🆘 Si Nada Funciona

Envíame en el chat:
1. La respuesta de `https://goyito.atwebpages.com/api/test.php`
2. Un screenshot del File Manager mostrando las carpetas y permisos
3. El error en la consola del navegador (F12 → Console)

---

## ¿Necesitas Ayuda?

Dime qué ves cuando accedes a:
- `https://goyito.atwebpages.com/api/test.php`
- `https://goyito.atwebpages.com/`

Y te ayudaré a arreglarlo. 🚀
