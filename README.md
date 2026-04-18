# Lidercom Backend

Backend API para el sistema de recolección de datos de workshops.

## Requisitos

- Node.js 18+
- PostgreSQL con base de datos `LidercomTest0.1`

## Configuración

1. Crear archivo `.env` con las credenciales de la base de datos:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=LidercomTest0.1
DB_USER=arelyxl
DB_PASSWORD=elmomero123
PORT=3001
```

2. Ejecutar el script de inicialización de la base de datos:

```bash
psql -U arelyxl -d LidercomTest0.1 -f init-db.sql
```

## Instalación

```bash
npm install
```

## Iniciar servidor

```bash
npm run dev
```

## API Endpoints

### Workshops
- `POST /api/workshops/start` - Iniciar un nuevo workshop
- `POST /api/workshops/end` - Finalizar workshop activo
- `GET /api/workshops/active` - Obtener workshop activo
- `GET /api/workshops/history` - Historial de workshops

### Observaciones
- `POST /api/observations` - Registrar una observación
- `GET /api/observations/session/:id` - Observaciones por sesión
- `GET /api/observations/participant/:id` - Observaciones por participante

### Métricas
- `GET /api/metrics/session/:id` - Métricas por sesión
- `GET /api/metrics/participant/:id` - Métricas por participante

### Sistema
- `GET /api/health` - Estado del servidor
- `GET /api/initiative-types` - Tipos de iniciativa (métricas)

## Tipos de Métricas

| Código | Nombre | Descripción |
|--------|--------|-------------|
| PROPOSAL | Propuesta (L) | Propuestas lanzadas por el participante |
| ACCEPTANCE | Aceptación (A) | Validaciones de propuestas |
| EYE_CONTACT | Contacto Visual | Contacto visual del participante |
| PARAPHRASING | Parafraseo | Repetición de lo dicho por otros |
| INTERRUPTION | Interrupción | Interrupciones durante el diálogo |
| CONFLICT_MEDIATION | Conflicto - Mediación | Estilo de resolución mediado |
| CONFLICT_NEGOTIATION | Conflicto - Negociación | Estilo de resolución negociado |
| CONFLICT_IMPOSITION | Conflicto - Imposición | Estilo de resolución impuesto |
