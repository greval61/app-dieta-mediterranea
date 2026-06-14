# Instrucciones para Compilar APK - APP-Dieta Mediterránea

Esta guía te permitirá compilar la aplicación Android (.apk) utilizando Android Studio con la carpeta `android/` del proyecto.

## Requisitos Previos

1. **Android Studio** instalado (última versión recomendada)
2. **Java Development Kit (JDK) 21** configurado
3. **Android SDK** instalado (se gestiona desde Android Studio)
4. **Node.js** instalado (para construir el frontend)

## Pasos para Compilar el APK

### Opción A: Desde Android Studio (Recomendado)

1. **Construir el frontend web:**
   ```bash
   cd c:\ARMARIO\Trabajos\APP-Dieta
   npm run build
   ```

2. **Sincronizar Capacitor con Android:**
   ```bash
   npx cap sync android
   ```

3. **Abrir el proyecto en Android Studio:**
   ```bash
   npx cap open android
   ```
   O abre Android Studio manualmente y selecciona "Open an existing project", luego navega a:
   ```
   c:\ARMARIO\Trabajos\APP-Dieta\android
   ```

4. **Esperar a que Gradle sincronice** (puede tardar varios minutos la primera vez)

5. **Compilar el APK:**
   - Menú: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - O usa el atajo: `Ctrl + Shift + A`, escribe "Build APK" y presiona Enter

6. **Esperar a que termine la compilación** (verás una notificación cuando termine)

7. **Localizar el APK generado:**
   - Haz click en `locate` en la notificación
   - El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Opción B: Desde Línea de Comandos (Gradle)

1. **Construir el frontend y sincronizar:**
   ```bash
   cd c:\ARMARIO\Trabajos\APP-Dieta
   npm run build
   npx cap sync android
   ```

2. **Compilar APK de debug:**
   ```bash
   cd android
   gradlew assembleDebug
   ```
   El APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Compilar APK de release (para producción):**
   ```bash
   cd android
   gradlew assembleRelease
   ```
   El APK se generará en: `android/app/build/outputs/apk/release/app-release.apk`

   **Nota:** Para release, necesitas firmar el APK con una keystore.

## Script Automatizado

Puedes usar el script `compilar_apk.bat` incluido en el proyecto:

```bash
compilar_apk.bat
```

Este script:
1. Construye el frontend
2. Sincroniza con Capacitor
3. Abre Android Studio automáticamente

## Configuración de Android Studio

### Primera vez que abres el proyecto:

1. **Aceptar licencia de Android SDK:**
   - Si aparece un mensaje, acepta las licencias
   - Ve a `Tools` → `SDK Manager` para verificar que tienes instalado:
     - Android SDK Platform 36 (o la versión que indique `variables.gradle`)
     - Android SDK Build-Tools

2. **Configurar JDK:**
   - `File` → `Project Structure` → `SDK Location`
   - Asegúrate de que "JDK location" apunte a JDK 21

3. **Esperar indexación:**
   - La primera vez, Android Studio indexará todos los archivos (puede tardar varios minutos)

## Solución de Problemas Comunes

### Error: "SDK not found" o "Android SDK not configured"
- Ve a `File` → `Project Structure` → `SDK Location`
- Asegúrate de que "Android SDK location" esté configurado

### Error: "Gradle sync failed"
- Intenta: `File` → `Invalidate Caches` → `Invalidate and Restart`
- O elimina la carpeta `.gradle` en `android/` y vuelve a sincronizar

### Error: "SDK version mismatch"
- Revisa `android/variables.gradle` para ver las versiones requeridas
- Ve a `SDK Manager` y asegúrate de tener instaladas las versiones correctas

### Error: "Java version mismatch"
- El proyecto requiere JDK 21
- Ve a `File` → `Project Structure` → `SDK Location` y configura el JDK correcto

### Build lento o se cuelga
- La memoria de Gradle ya está configurada a 4GB en `android/gradle.properties`
- Si necesitas más memoria, puedes aumentarla

## Firmar APK para Producción

Para publicar en Google Play o distribuir la app, necesitas firmar el APK:

1. **Crear keystore:**
   ```bash
   keytool -genkey -v -keystore app-release.keystore -alias app-dieta -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurar en `android/app/build.gradle`:**
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file("app-release.keystore")
               storePassword "tu_password"
               keyAlias "app-dieta"
               keyPassword "tu_password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. **Compilar APK firmado:**
   ```bash
   cd android
   gradlew assembleRelease
   ```

## Instalar APK en Dispositivo

### Desde Android Studio:
1. Conecta tu dispositivo Android (con depuración USB activada)
2. Click en `Run` → `Run 'app'` o el botón verde de play
3. Selecciona tu dispositivo

### Manualmente:
1. Copia el APK a tu dispositivo
2. Abre el administrador de archivos y toca el APK
3. Permite instalación de fuentes desconocidas si es necesario

## Estructura del Proyecto Android

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/
│   │       │   └── public/          # Aquí va el frontend compilado
│   │       ├── java/                # Código Java/Kotlin
│   │       └── res/                 # Recursos (imágenes, layouts, etc.)
│   └── build.gradle                 # Configuración de la app
├── build.gradle                     # Configuración del proyecto
├── variables.gradle                 # Versiones de dependencias
└── gradle.properties                # Configuración de Gradle
```

## Actualizar la Aplicación

Cada vez que hagas cambios en el código frontend:

1. **Reconstruir frontend:**
   ```bash
   npm run build
   ```

2. **Sincronizar con Android:**
   ```bash
   npx cap sync android
   ```

3. **Recompilar en Android Studio:**
   - `Build` → `Rebuild Project`

## Notas Importantes

- **No modifiques manualmente** los archivos en `android/app/src/main/assets/public/` - se regeneran automáticamente
- **Siempre haz `npm run build`** antes de `npx cap sync android`
- **El APK de debug** no está optimizado y es más grande - úsalo solo para desarrollo
- **Para producción**, siempre usa APK firmado (release)

## Enlace a Documentación Oficial

- [Capacitor Android Deployment](https://capacitorjs.com/docs/android)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Build APK](https://developer.android.com/studio/run#building-cmdline)

## Cambios Recientes en la Configuración

### Capacitor Config (capacitor.config.json)
- Agregada configuración de servidor con esquema HTTPS
- Agregadas opciones de compilación para diferentes tipos de builds

### Gradle Properties (android/gradle.properties)
- Aumentada memoria de JVM a 4GB (-Xmx4096m)
- Agregado MaxMetaspaceSize de 1024m para mejor rendimiento

### App Build Gradle (android/app/build.gradle)
- Configurado buildType debug con debuggable true
- Configurado buildType release con minifyEnabled true y ProGuard

### ProGuard Rules (android/app/proguard-rules.pro)
- Agregadas reglas específicas para Capacitor
- Configuradas reglas para mantener clases y métodos necesarios

## Verificación de Compilación

La compilación del APK de debug ha sido verificada exitosamente:
- **Ubicación**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Tamaño**: ~4.8MB
- **Estado**: Funcional y listo para pruebas
- **Fecha**: 12/06/2026

## Comandos Rápidos

```bash
# Compilar APK de debug completo
npm run build && npx cap sync android && cd android && gradlew.bat assembleDebug

# Compilar APK de release (requiere keystore configurado)
npm run build && npx cap sync android && cd android && gradlew.bat assembleRelease
```