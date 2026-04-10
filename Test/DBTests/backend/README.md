# LidercomTest0.1 - MVP Backend

Backend para recolección de datos de workshops con FastAPI + GraphQL (Strawberry).

## Estructura

```
backend/
├── app/
│   ├── api/graphql/       # Schema GraphQL
│   ├── core/              # Configuración
│   ├── db/                # Conexión a BD
│   ├── models/            # Modelos SQLAlchemy
│   ├── schemas/           # Tipos Strawberry
│   ├── services/          # Lógica de negocio
│   └── main.py            # FastAPI app
├── migrations/            # Alembic migrations
├── requirements.txt
└── init_db.py
```

## Instalación

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tu configuración de BD
```

## Base de Datos

```bash
# Crear BD en PostgreSQL
createdb LidercomTest0.1

# Ejecutar migraciones
alembic upgrade head
```

O inicializar automáticamente:

```bash
python init_db.py
```

## Ejecución

```bash
uvicorn app.main:app --reload
```

## GraphQL Endpoint

`POST http://localhost:8000/graphql`

## API GraphQL

### Queries

```graphql
initiativeTypes                    # Lista tipos de iniciativa
proposalsByTeam(workshopTeamId)    # Propuestas por equipo
proposalSelected(proposalId)        # Propuesta seleccionada
teamProposalStats(workshopTeamId)   # Estadísticas del equipo
observationSession(workshopId)     # Sesión activa
observationLogs(sessionId)          # Logs de observación
metricCatalogs                      # Catálogo de métricas
metricLogs(participantId, metricWorkshopId)  # Logs de métricas
```

### Mutations

```graphql
createProposal(input)               # Crear propuesta
selectProposal(input)               # Seleccionar propuesta
evaluateProposal(input)             # Evaluar efectividad (1-5)
startObservationSession(workshopId)  # Iniciar sesión de observación
endObservationSession(sessionId)    # Terminar sesión
createObservationLog(input)          # Registrar observación
```

## Tipos de Iniciativa

- `PROPOSE_IDEA` - Proponer Idea
- `IDENTIFY_PROBLEM` - Identificar Problema
- `PROACTIVE_WORK` - Trabajo Proactivo (sin que el líder lo pida)
- `OPERATIONAL_WORK` - Trabajo Operacional (después de que el líder lo pide)

## Métricas Automáticas

Al registrar propuestas/observaciones se registran automáticamente:
- `TOTAL_PROPOSALS` - Conteo de propuestas
- `PROPOSALS_SELECTED` - Propuestas seleccionadas
- `EFFECTIVENESS_AVG` - Promedio de efectividad
- `INITIATIVE_COUNT` - Conteo por tipo de iniciativa
