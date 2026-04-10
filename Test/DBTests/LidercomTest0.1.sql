-- Base de datos: LidercomTest0.1
-- MVP para recolección de datos de workshops

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- S02IDENTIFICATION_TYPE: Tipos de identificación
CREATE TABLE S02IDENTIFICATION_TYPE (
    nIdIdentificationType SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S01VENUE_TYPE: Tipos de lugares
CREATE TABLE S01VENUE_TYPE (
    nIdVenueType SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S01VENUE: Sedes
CREATE TABLE S01VENUE (
    nIdVenue SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    cDescription TEXT NULL,
    cLogoUrl VARCHAR(500) NULL,
    cEmail VARCHAR(100) NULL,
    nLatitude DECIMAL(10, 8) NULL,
    nLongitude DECIMAL(10, 8) NULL,
    cIdBoundarie VARCHAR(50) NULL,
    nIdVenueType INTEGER REFERENCES S01VENUE_TYPE(nIdVenueType),
    bIsActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW(),
    tModifiedAt TIMESTAMP
);

-- S01PROGRAM: Programas
CREATE TABLE S01PROGRAM (
    nIdProgram SERIAL PRIMARY KEY,
    nIdVenue INTEGER REFERENCES S01VENUE(nIdVenue),
    cName VARCHAR(200) NULL,
    cDescription TEXT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S01WORKSHOP: Talleres
CREATE TABLE S01WORKSHOP (
    nIdWorkshop SERIAL PRIMARY KEY,
    nIdProgram INTEGER REFERENCES S01PROGRAM(nIdProgram),
    cName VARCHAR(200) NULL,
    dDate DATE NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S02PERSON: Personas
CREATE TABLE S02PERSON (
    nIdPerson SERIAL PRIMARY KEY,
    nIdIdentificationType INTEGER REFERENCES S02IDENTIFICATION_TYPE(nIdIdentificationType),
    cIdentificationNumber VARCHAR(50) NULL,
    cFirstName VARCHAR(100) NULL,
    cLastName VARCHAR(100) NULL,
    cEmail VARCHAR(150) NULL,
    cPhone VARCHAR(20) NULL,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S02PARTICIPANT: Participantes
CREATE TABLE S02PARTICIPANT (
    nIdParticipant SERIAL PRIMARY KEY,
    nIdPerson INTEGER REFERENCES S02PERSON(nIdPerson),
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S02PARTICIPANT_PROGRAM: Relación participante-programa
CREATE TABLE S02PARTICIPANT_PROGRAM (
    nIdParticipantProgram SERIAL PRIMARY KEY,
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    nIdProgram INTEGER REFERENCES S01PROGRAM(nIdProgram),
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S02WORKSHOP_TEAM: Equipos en taller
CREATE TABLE S02WORKSHOP_TEAM (
    nIdWorkshopTeam SERIAL PRIMARY KEY,
    nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
    cTeamName VARCHAR(100) NULL,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S02WORKSHOP_TEAM_MEMBER: Miembros de equipo
CREATE TABLE S02WORKSHOP_TEAM_MEMBER (
    nIdWorkshopTeamMember SERIAL PRIMARY KEY,
    nIdWorkshopTeam INTEGER REFERENCES S02WORKSHOP_TEAM(nIdWorkshopTeam),
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S03METRIC_CATALOG: Catálogo de métricas
CREATE TABLE S03METRIC_CATALOG (
    nIdMetricCatalog SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    cDataType CHAR(1) NULL,
    cDescription TEXT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S03METRIC_WORKSHOP: Métricas habilitadas por taller
CREATE TABLE S03METRIC_WORKSHOP (
    nIdMetricWorkshop SERIAL PRIMARY KEY,
    nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
    nIdMetricCatalog INTEGER REFERENCES S03METRIC_CATALOG(nIdMetricCatalog),
    isEnabled BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(nIdWorkshop, nIdMetricCatalog)
);

-- S03METRIC_LOG: Log de métricas
CREATE TABLE S03METRIC_LOG (
    tTimestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    nIdMetricLog SERIAL,
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    nIdMetricWorkshop INTEGER REFERENCES S03METRIC_WORKSHOP(nIdMetricWorkshop),
    fValue DOUBLE PRECISION NULL,
    PRIMARY KEY (tTimestamp, nIdMetricLog)
);

-- S03INITIATIVE_TYPE: Tipos de iniciativa
CREATE TABLE S03INITIATIVE_TYPE (
    nIdInitiativeType SERIAL PRIMARY KEY,
    cCode VARCHAR(50) NOT NULL UNIQUE,
    cName VARCHAR(100) NOT NULL,
    cDescription TEXT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S03PROPOSAL: Propuestas lanzadas por participantes
CREATE TABLE S03PROPOSAL (
    nIdProposal SERIAL PRIMARY KEY,
    nIdWorkshopTeam INTEGER REFERENCES S02WORKSHOP_TEAM(nIdWorkshopTeam),
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    nIdInitiativeType INTEGER REFERENCES S03INITIATIVE_TYPE(nIdInitiativeType),
    cTitle VARCHAR(200) NOT NULL,
    cDescription TEXT NULL,
    nProposalNumber INTEGER NOT NULL,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S03PROPOSAL_SELECTED: Propuesta seleccionada y su evaluación
CREATE TABLE S03PROPOSAL_SELECTED (
    nIdProposalSelected SERIAL PRIMARY KEY,
    nIdProposal INTEGER REFERENCES S03PROPOSAL(nIdProposal),
    nIdSelectingParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    tSelectedAt TIMESTAMP DEFAULT NOW()
);

-- S03PROPOSAL_EFFECTIVENESS: Efectividad de la propuesta seleccionada
CREATE TABLE S03PROPOSAL_EFFECTIVENESS (
    nIdProposalEffectiveness SERIAL PRIMARY KEY,
    nIdProposalSelected INTEGER REFERENCES S03PROPOSAL_SELECTED(nIdProposalSelected),
    nEffectivenessScore INTEGER CHECK (nEffectivenessScore BETWEEN 1 AND 5),
    cComments TEXT NULL,
    tEvaluatedAt TIMESTAMP DEFAULT NOW()
);

-- S03WORKSHOP_OBSERVATION_SESSION: Sesión de observación activa
CREATE TABLE S03WORKSHOP_OBSERVATION_SESSION (
    nIdSession SERIAL PRIMARY KEY,
    nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
    bIsActive BOOLEAN DEFAULT FALSE,
    tStartedAt TIMESTAMP NULL,
    tEndedAt TIMESTAMP NULL,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- S03OBSERVATION_LOG: Log de observaciones del observer
CREATE TABLE S03OBSERVATION_LOG (
    nIdObservationLog SERIAL PRIMARY KEY,
    nIdSession INTEGER REFERENCES S03WORKSHOP_OBSERVATION_SESSION(nIdSession),
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    nIdWorkshopTeam INTEGER REFERENCES S02WORKSHOP_TEAM(nIdWorkshopTeam),
    nIdInitiativeType INTEGER REFERENCES S03INITIATIVE_TYPE(nIdInitiativeType),
    cObservationNote TEXT NULL,
    tObservedAt TIMESTAMP DEFAULT NOW()
);

-- Insertar tipos de iniciativa base
INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES
('PROPOSE_IDEA', 'Proponer Idea', 'El participante propone una nueva idea o solución'),
('IDENTIFY_PROBLEM', 'Identificar Problema', 'El participante identifica un problema existente'),
('PROACTIVE_WORK', 'Trabajo Proactivo', 'El participante realiza trabajo sin que el líder se lo pida'),
('OPERATIONAL_WORK', 'Trabajo Operacional', 'El participante realiza trabajo después de que el líder se lo pide');

-- Insertar métricas base
INSERT INTO S03METRIC_CATALOG (cName, cDataType, cDescription) VALUES
('TOTAL_PROPOSALS', 'I', 'Cantidad total de propuestas lanzadas'),
('PROPOSALS_SELECTED', 'I', 'Cantidad de propuestas seleccionadas'),
('EFFECTIVENESS_AVG', 'F', 'Promedio de efectividad de propuestas'),
('INITIATIVE_COUNT', 'I', 'Conteo por tipo de iniciativa');
