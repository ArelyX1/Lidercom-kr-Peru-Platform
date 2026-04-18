-- Script para inicializar la base de datos LidercomTest0.1
-- Ejecutar en PostgreSQL

-- Crear base de datos si no existe
-- CREATE DATABASE "LidercomTest0.1";

-- Tabla de Sesiones de Observación
CREATE TABLE IF NOT EXISTS S03WORKSHOP_OBSERVATION_SESSION (
    nIdSession SERIAL PRIMARY KEY,
    nIdWorkshop INTEGER DEFAULT 1,
    cSessionName VARCHAR(200) NULL,
    bIsActive BOOLEAN DEFAULT FALSE,
    tStartedAt TIMESTAMP NULL,
    tEndedAt TIMESTAMP NULL,
    nElapsedSeconds INTEGER DEFAULT 0,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- Tabla de Log de Observaciones
CREATE TABLE IF NOT EXISTS S03OBSERVATION_LOG (
    nIdObservationLog SERIAL PRIMARY KEY,
    nIdSession INTEGER REFERENCES S03WORKSHOP_OBSERVATION_SESSION(nIdSession),
    nIdParticipant INTEGER DEFAULT 1,
    nIdWorkshopTeam INTEGER DEFAULT 1,
    nIdInitiativeType INTEGER DEFAULT 1,
    cObservationNote TEXT NULL,
    fValue DOUBLE PRECISION NULL,
    tObservedAt TIMESTAMP DEFAULT NOW()
);

-- Tipos de Iniciativa (métricas)
CREATE TABLE IF NOT EXISTS S03INITIATIVE_TYPE (
    nIdInitiativeType SERIAL PRIMARY KEY,
    cCode VARCHAR(50) NOT NULL UNIQUE,
    cName VARCHAR(100) NOT NULL,
    cDescription TEXT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    tCreatedAt TIMESTAMP DEFAULT NOW()
);

-- Insertar tipos de iniciativa base (métricas de observación)
INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES
    ('PROPOSAL', 'Propuesta (L)', 'Propuestas lanzadas por el participante'),
    ('ACCEPTANCE', 'Aceptación (A)', 'Validaciones de propuestas'),
    ('EYE_CONTACT', 'Contacto Visual', 'Contacto visual del participante'),
    ('PARAPHRASING', 'Parafraseo', 'Repetición de lo dicho por otros'),
    ('INTERRUPTION', 'Interrupción', 'Interrupciones durante el diálogo'),
    ('CONFLICT_MEDIATION', 'Conflicto - Mediación', 'Estilo de resolución mediado'),
    ('CONFLICT_NEGOTIATION', 'Conflicto - Negociación', 'Estilo de resolución negociado'),
    ('CONFLICT_IMPOSITION', 'Conflicto - Imposición', 'Estilo de resolución impuesto')
ON CONFLICT (cCode) DO NOTHING;

-- Verificar datos
SELECT * FROM S03INITIATIVE_TYPE;
