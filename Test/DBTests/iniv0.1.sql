-- 0. Activar la extensión de TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1. S02IDENTIFICATION_TYPE: Tipos de identificación (DNI, Pasaporte, etc.) [cite: 167]
CREATE TABLE S02IDENTIFICATION_TYPE (
    nIdIdentificationType SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 2. S01VENUE_TYPE: Tipos de lugares (Colegio, Empresa, etc.) [cite: 161]
CREATE TABLE S01VENUE_TYPE (
    nIdVenueType SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 3. S01VENUE: Sedes donde se realizan los programas [cite: 162, 163]
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

-- 4. S01PROGRAM: Programas de liderazgo de Lidercom [cite: 165]
CREATE TABLE S01PROGRAM (
    nIdProgram SERIAL PRIMARY KEY,
    nIdVenue INTEGER REFERENCES S01VENUE(nIdVenue),
    cName VARCHAR(200) NULL,
    cDescription TEXT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 5. S01WORKSHOP: Sesiones individuales dentro de un programa [cite: 166]
CREATE TABLE S01WORKSHOP (
    nIdWorkshop SERIAL PRIMARY KEY,
    nIdProgram INTEGER REFERENCES S01PROGRAM(nIdProgram),
    cName VARCHAR(200) NULL,
    dDate DATE NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 6. S02PERSON: Información general de personas [cite: 168]
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

-- 7. S02PARTICIPANT: Estudiantes que participan en los talleres [cite: 169]
CREATE TABLE S02PARTICIPANT (
    nIdParticipant SERIAL PRIMARY KEY,
    nIdPerson INTEGER REFERENCES S02PERSON(nIdPerson),
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 8. S02PARTICIPANT_PROGRAM: Relación de participantes con programas [cite: 170]
CREATE TABLE S02PARTICIPANT_PROGRAM (
    nIdParticipantProgram SERIAL PRIMARY KEY,
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    nIdProgram INTEGER REFERENCES S01PROGRAM(nIdProgram),
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 9. S03METRIC_CATALOG: Catálogo global de métricas (HHI, Resiliencia, etc.) [cite: 153]
CREATE TABLE S03METRIC_CATALOG (
    nIdMetricCatalog SERIAL PRIMARY KEY,
    cName VARCHAR(100) NULL,
    cDataType CHAR(1) NULL, -- 'I' para Integer, 'F' para Float, etc.
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 10. S03METRIC_WORKSHOP: Métricas específicas habilitadas para un taller [cite: 153]
CREATE TABLE S03METRIC_WORKSHOP (
    nIdMetricWorkshop SERIAL PRIMARY KEY,
    nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
    nIdMetricCatalog INTEGER REFERENCES S03METRIC_CATALOG(nIdMetricCatalog),
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE S03METRIC_LOG (
    tTimestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    nIdMetricLog SERIAL,
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    nIdMetricWorkshop INTEGER REFERENCES S03METRIC_WORKSHOP(nIdMetricWorkshop),
    fValue DOUBLE PRECISION NULL,
    PRIMARY KEY (tTimestamp, nIdMetricLog)
);

-- 12. S02WORKSHOP_TEAM: Equipos formados dentro de un taller
CREATE TABLE S02WORKSHOP_TEAM (
    nIdWorkshopTeam SERIAL PRIMARY KEY,
    nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
    cTeamName VARCHAR(100) NULL,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- 13. S02WORKSHOP_TEAM_MEMBER: Integrantes de cada equipo del taller
CREATE TABLE S02WORKSHOP_TEAM_MEMBER (
    nIdWorkshopTeamMember SERIAL PRIMARY KEY,
    nIdWorkshopTeam INTEGER REFERENCES S02WORKSHOP_TEAM(nIdWorkshopTeam),
    nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
    tCreatedAt TIMESTAMP DEFAULT NOW()
);
