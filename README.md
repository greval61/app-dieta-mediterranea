# App Dieta Mediterránea

Aplicación web y móvil para seguimiento nutricional con enfoque en la dieta mediterránea.

## 🌟 Características

- **Dashboard interactivo** con seguimiento de calorías y macronutrientes
- **Calendario de comidas** con planificación semanal
- **Registro de peso** con gráficos de evolución
- **Catálogo de alimentos** con gestión CRUD
- **Exportación a PDF** de reportes diarios y semanales
- **Soporte offline** con LocalStorage
- **API backend** para sincronización de datos
- **Aplicación Android** generada con Capacitor

## 🛠️ Tecnologías

- **Frontend**: React, Vite, TailwindCSS
- **Mobile**: Capacitor, Android
- **Backend**: Node.js, Express
- **Database**: SQLite, JSON storage
- **PDF Generation**: jsPDF, jspdf-autotable
- **Charts**: Recharts

## 📋 Requisitos

- Node.js (v18 o superior)
- npm o yarn
- Android Studio (para compilar APK)

## 🚀 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/greval61/app-dieta-mediterranea.git
   cd app-dieta-mediterranea
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## 📱 Compilar APK Android

Para generar el APK de Android:

```bash
compilar_apk.bat
```

Este script:
1. Construye el frontend web
2. Sincroniza con Capacitor Android
3. Compila el APK automáticamente
4. El APK se generará en `android/app/build/outputs/apk/debug/`

## 📖 Documentación

- [Instrucciones Android APK](./INSTRUCCIONES_ANDROID_APK.md)
- [Instrucciones Android](./INSTRUCCIONES_ANDROID.md)
- [Instrucciones Awardspace](./INSTRUCCIONES_AWARDSPACE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## 🎯 Funcionalidades

### Dashboard
- Cálculo automático de TMB usando Mifflin-St Jeor
- Ajuste de objetivos (perder peso, mantener, ganar músculo)
- Seguimiento de calorías, proteínas, carbohidratos y grasas
- Visualización de objetivos vs consumo real

### Calendario
- Vista mensual con registro de comidas diarias
- Exportación a PDF de reportes diarios
- Exportación a PDF de resúmenes semanales
- Copia de comidas entre días
- Gráficos de tendencias nutricionales

### Seguimiento de Peso
- Registro diario de peso
- Gráficos de evolución
- Comparativa con objetivos

### Planificador Semanal
- Planificación de comidas para la semana
- Estadísticas semanales de consumo
- Recomendaciones basadas en objetivos

## 🔧 Configuración

El archivo `capacitor.config.json` contiene la configuración de Capacitor.

Los ajustes nutricionales se configuran en el perfil de usuario en la aplicación.

## 📊 Algoritmos

### Cálculo de TMB (Mifflin-St Jeor 1990)

- **Hombres**: 10 × peso(kg) + 6.25 × altura(cm) - 5 × edad + 5
- **Mujeres**: 10 × peso(kg) + 6.25 × altura(cm) - 5 × edad - 161

### Ajuste de Objetivos

- **Perder peso**: -400 calorías
- **Mantener peso**: 0 calorías
- **Ganar músculo**: +250 calorías

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto.

## 👤 Autor

Desarrollado para seguimiento nutricional con enfoque en la dieta mediterránea.

---

**Nota**: Esta aplicación está diseñada como herramienta de seguimiento y no sustituye el consejo de profesionales de la nutrición.