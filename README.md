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

## Datos estáticos

En GitHub Pages los datos se generan en build time y se sirven desde `/data/mobiles.json`. El workflow actualiza el Sheet **cada hora** y en cada push a `main`.

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

## GitHub Pages

El sitio se publica automáticamente con GitHub Actions en cada push a `main` (y cada hora para refrescar datos del Sheet).

**URL:** https://lucasfarrobo.github.io/display-moviles/

### Activar Pages (solo la primera vez)

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions

El workflow `.github/workflows/deploy-pages.yml` hace el resto.

### Build local (preview estático)

```bash
npm install
npm run fetch-data
$env:GITHUB_PAGES="true"
$env:NEXT_PUBLIC_BASE_PATH="/display-moviles"
npm run build
# Servir carpeta out/ con cualquier server estático
```

## Estructura

```
app/
  components/                # Dashboard, tarjetas, historial
lib/
  parseMobile.ts             # Parsea columna 6
  processRows.ts             # Agrupa + historial + última novedad
  sheets.ts                  # Lectura Google Sheets / CSV público
  status.ts                  # Mapeo verde/amarillo/rojo
scripts/
  fetch-data.ts              # Genera public/data/mobiles.json
.github/workflows/
  deploy-pages.yml           # Deploy automático a GitHub Pages
```
