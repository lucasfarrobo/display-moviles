# Display de Móviles

Dashboard web del estado de unidades móviles. Lee respuestas de un **Google Form → Google Sheet**, agrupa por móvil y muestra:

- **Estado actual** (verde / amarillo / rojo) según la **última novedad por marca temporal**
- **Historial completo** de novedades de cada unidad

## Lógica de datos

Cada fila del formulario = una **novedad**.

| Regla | Comportamiento |
|-------|----------------|
| Columna 7 (`Columna 6` del form) | Vehículo: `RENAULT INT 49 -DOMINIO AH054WB` |
| Agrupación | Por **patente** (dominio) |
| Estado en tablero | Según la fila con **marca temporal más reciente** |
| Historial | Todas las inspecciones del mismo móvil, de más nueva a más antigua |
| Color | Inferido de higiene + observaciones (MALO→rojo, REGULAR→amarillo, BUENO→verde) |

## API

```
GET /api/moviles          → listado con estado actual + historial por unidad
GET /api/moviles/:id      → detalle de un móvil
```

Ejemplo de respuesta (`/api/moviles`):

```json
{
  "mobiles": [
    {
      "id": "m-003",
      "numero": "M-003",
      "nombre": "Ambulancia Norte",
      "patente": "GHI 789",
      "status": "outOfService",
      "ultimaActualizacion": "28/06/2026 17:45",
      "totalNovedades": 2,
      "ultimaNovedad": { "texto": "...", "status": "outOfService", "timestamp": "..." },
      "historial": [ /* todas las novedades */ ]
    }
  ],
  "updatedAt": "2026-06-30T...",
  "source": "sheets"
}
```

## Configuración local

```bash
npm install
cp .env.local.example .env.local
# Editá .env.local con el ID/link de tu Sheet
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Conectar tu Google Sheet

### Opción A — Sheet público (más simple)

1. En Google Sheets: **Archivo → Compartir → Publicar en la web** (o “Cualquier persona con el link”)
2. Copiá el link del sheet
3. En `.env.local`:
   ```
   GOOGLE_SHEETS_ID=https://docs.google.com/spreadsheets/d/TU_ID/edit
   GOOGLE_SHEETS_PUBLIC=true
   ```

### Opción B — Sheet privado (producción)

1. [Google Cloud Console](https://console.cloud.google.com/) → activar **Google Sheets API**
2. Crear **cuenta de servicio** → descargar JSON
3. Compartir el Sheet con el email de la cuenta de servicio (solo lectura)
4. En Vercel / `.env.local`:
   ```
   GOOGLE_SHEETS_ID=TU_ID
   GOOGLE_SHEETS_PUBLIC=false
   GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

### Columnas del formulario

Por defecto se detectan automáticamente desde los encabezados. Si hace falta, configurá:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `GOOGLE_SHEETS_ID` | (tu sheet) | ID del spreadsheet |
| `GOOGLE_SHEET_GID` | `206598462` | Pestaña del formulario |
| `SHEET_COL_TIMESTAMP` | 1 | Marca temporal |
| `SHEET_COL_MOBILE` | **7** | Columna 6 del form (vehículo) |
| `SHEET_COL_REPORTADO_POR` | 4 | CHOFER |
| `SHEET_COL_HIGIENE_INT` | 21 | Higiene interior |
| `SHEET_COL_NOVEDAD` | 22 | Observaciones generales |
| `SHEET_COL_HIGIENE_EXT` | 23 | Higiene exterior |

## Publicar en GitHub + web (Vercel)

### 1. Subir a GitHub

```bash
cd display-moviles
git init
git add .
git commit -m "Display de móviles: API + dashboard desde Google Sheets"
```

En GitHub: **New repository** → `display-moviles` → sin README.

```bash
git remote add origin https://github.com/TU_USUARIO/display-moviles.git
git branch -M main
git push -u origin main
```

### 2. Desplegar como web en Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → importar el repo de GitHub
2. Framework: **Next.js** (auto-detectado)
3. **Environment Variables**:
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SHEETS_PUBLIC=true` (o `GOOGLE_SERVICE_ACCOUNT` si es privado)
   - Ajustar columnas si hace falta
4. **Deploy**

Tu app quedará en `https://display-moviles.vercel.app` (o el dominio que elijas). La API estará en la misma URL: `/api/moviles`.

## Estructura

```
app/
  api/moviles/route.ts       # GET listado
  api/moviles/[id]/route.ts  # GET detalle
  components/                # Dashboard, tarjetas, historial
lib/
  parseMobile.ts             # Parsea columna 6
  processRows.ts             # Agrupa + historial + última novedad
  sheets.ts                  # Lectura Google Sheets / CSV público
  status.ts                  # Mapeo verde/amarillo/rojo
```
