# Rivertech Comando Fluvial - Dashboard de Telemetría v2.5

Plataforma Web interactiva de comando y telemetría en tiempo real e histórico para flotas fluviales y de transporte, inspirada en la línea de diseño **DarkOne UI Kit** con paleta de color principal **Azul y Blanco (Tema Claro)** y **Tema Oscuro** intercambiable.

> [!IMPORTANT]
> **Privacidad y Datos Anonimizados para GitHub**:
> El conjunto de datos de muestra incluido en el proyecto (`public/sample-rivertech.json`) ha sido **100% anonimizado** mediante scripts automáticos. Se sustituyeron los nombres de embarcaciones por identificadores sintéticos (`Nave-Alpha-01`, `Remolcador-Magdalena`, `Embarcacion-Bolivar`, etc.), se enmascararon direcciones IP a rangos locales (`10.0.0.X`) y se protegieron credenciales para que el proyecto pueda ser publicado de forma segura en **GitHub** sin exponer datos reales o confidenciales.

---

## 🎨 Características Principales

1. **🇪🇸 Interfaz 100% en Español**: Toda la navegación, menús, etiquetas, tooltips, modales y tablas están traducidos.
2. **☀️ Paleta Principal Azul y Blanco (Tema Claro) + Tema Oscuro**:
   - Tema Claro predeterminado con tonos azul rey (`#2563eb`), azul náutico (`#0284c7`) y blanco brillante (`#ffffff`).
   - Selector en la cabecera para alternar al instante con el Tema Oscuro.
3. **🗺️ Motor de Mapas Vectoriales 2D / 3D**:
   - Integración vectorial rápida y fluida con MapLibre GL JS.
   - Selector de estilos en el mapa:
     - ☀️ **Liberty (Tema Claro)**
     - 🌙 **Fiord (Tema Oscuro)**
     - 🧊 **Vista 3D** (Perspectiva 3D con ángulo de cámara a 60° y relieve)
   - Marcadores fijos sin desplazamiento al arrastrar y persistentes al cambiar de estilo.
4. **📊 5 Módulos de Comando Interactivos**:
   - **Resumen Ejecutivo**: KPIs de la flota, gráfico circular de estado, ranking de naves más veloces y feed en tiempo real.
   - **Mapa Táctico 2D/3D**: Seguimiento de posición en vivo, vectores de rumbo (`cog`), trazado de rutas e inspector de nave.
   - **Tabla de Flota y Activos**: Registro completo con ordenamiento por columnas, paginación, filtros de estado y modal de inspección JSON.
   - **Salud del Hardware**: Diagnóstico de voltajes (`power`, `battery`), alertas de energía baja y calidad de señal de satélites GPS (`sat`, `hdop`).
   - **Combustible y Cinética**: Perfil de velocidad vs. tiempo, odometría acumulada en kilómetros y alerta de motores en ralentí.

---

## 🚀 Requisitos del Sistema

- **Node.js**: v18.0.0 o superior (Recomendado v22+)
- **npm**: v9.0.0 o superior

---

## 💻 Instalación y Ejecución

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/rivertech-tactical-command.git
   cd rivertech-tactical-command
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   Abrir en el navegador en la dirección generada (ej. `http://localhost:5173`).

---

## 📦 Compilación para Producción

```bash
npm run build
npm run preview
```

---

## 🔒 Estructura de Seguridad (`.gitignore`)

El archivo `.gitignore` está configurado para evitar la subida accidental de:
- Archivos `.env` y secretos
- Logs y datasets de telemetría real (`*realtimelog*`, `*.real.json`)
- Directorios `node_modules/` y resultados de build `dist/`
