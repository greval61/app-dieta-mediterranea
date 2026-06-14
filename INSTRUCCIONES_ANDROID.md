# 📱 Guía para Compilar tu App Android (.APK)

¡Listo! He configurado e inicializado **Capacitor** en tu proyecto y he sincronizado los últimos cambios (incluyendo la corrección del calendario y el sistema de copia de seguridad local).

Ahora tienes una carpeta llamada `android/` en tu directorio de trabajo que contiene el proyecto nativo para tu móvil.

---

## 🛠️ Requisitos Previos

Solo necesitas tener instalado **Android Studio** en tu ordenador. Si no lo tienes, puedes descargarlo de forma gratuita desde la web oficial:
👉 [Descargar Android Studio](https://developer.android.com/studio)

---

## 🚀 Pasos para Crear tu Archivo `.apk`

Sigue estos sencillos pasos para generar el archivo instalable para tu móvil:

### Paso 1: Abre el proyecto en Android Studio
1. Inicia **Android Studio**.
2. En la pantalla de bienvenida, haz clic en **Open** (o ve a *File -> Open*).
3. Selecciona la carpeta **`android`** que está dentro de tu proyecto:
   `c:\ARMARIO\Trabajos\APP-Dieta\android`
4. Espera un par de minutos a que Android Studio descargue las herramientas necesarias y configure el proyecto (verás una barra de progreso abajo a la derecha que dice "Gradle syncing...").

### Paso 2: Compila el archivo `.apk`
1. En el menú superior de Android Studio, ve a:
   **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**
2. Espera unos segundos a que finalice la compilación.
3. Abajo a la derecha aparecerá una pequeña ventana de notificación que dirá:
   *`APK(s) generated successfully for 1 module:`* seguido de un enlace azul que dice **Locate**.
4. Haz clic en **Locate**. Esto abrirá el explorador de archivos directamente en la carpeta donde está tu aplicación instalable.
   * El archivo se llamará **`app-debug.apk`** (lo encontrarás en `android/app/build/outputs/apk/debug/`).

### Paso 3: Instala la app en tu móvil Android
1. Envía el archivo `app-debug.apk` a tu teléfono (por WhatsApp, por correo electrónico, subiéndolo a Google Drive o conectando el móvil por cable USB).
2. Abre el archivo `.apk` desde tu teléfono.
3. El móvil te pedirá confirmación para instalar la aplicación. 
   * *Nota: Es posible que Android te pida activar el permiso de "Instalar aplicaciones desconocidas" para la aplicación con la que abres el archivo (como Chrome, WhatsApp o tu gestor de archivos). Actívalo con confianza.*
4. ¡Listo! Ya tendrás el icono de **APP-Dieta** en la pantalla de tu móvil y funcionará de manera independiente.

---

## 💾 ¿Cómo usar la Copia de Seguridad (Importar/Exportar)?

Para que cada persona sea dueña de sus datos o si deseas cambiar de móvil en el futuro:

1. Ve a la pestaña **Hoy** (o Dashboard).
2. Haz clic en el botón de **Total Diario** (el cuadro blanco donde aparecen las calorías acumuladas). Esto abrirá el modal de ajustes.
3. En la parte inferior verás la nueva sección **Copia de Seguridad**:
   * **Exportar:** Descarga un archivo `.json` a tu dispositivo con todo tu historial de comidas, peso y alimentos.
   * **Importar:** Te permite seleccionar un archivo `.json` de respaldo anterior para restaurar todo tu progreso y catálogo al instante.

---

## 🔄 ¿Cómo aplicar cambios futuros a la App Móvil?

Si en el futuro hacemos más cambios en el código de la web y quieres que se actualicen en la aplicación del móvil:

1. Realiza los cambios en el código.
2. Compila el proyecto en tu ordenador ejecutando:
   ```bash
   npm run build
   ```
3. Copia los nuevos archivos web al proyecto Android ejecutando:
   ```bash
   npx cap sync
   ```
4. Abre **Android Studio** y repite el **Paso 2** (*Build APK*) para generar una nueva versión del archivo `.apk` e instalarlo.
