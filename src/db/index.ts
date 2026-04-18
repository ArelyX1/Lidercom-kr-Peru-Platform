import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'LidercomTest0.1',
  user: process.env.DB_USER || 'arelyxl',
  password: process.env.DB_PASSWORD || 'elmomero123',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS S01VENUE (
        nIdVenue SERIAL PRIMARY KEY,
        cName VARCHAR(200) NOT NULL,
        cDescription TEXT NULL,
        cAddress VARCHAR(500) NULL,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S01PROGRAM (
        nIdProgram SERIAL PRIMARY KEY,
        nIdVenue INTEGER REFERENCES S01VENUE(nIdVenue),
        cName VARCHAR(200) NOT NULL,
        cDescription TEXT NULL,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S01WORKSHOP (
        nIdWorkshop SERIAL PRIMARY KEY,
        nIdProgram INTEGER REFERENCES S01PROGRAM(nIdProgram),
        cName VARCHAR(200) NOT NULL,
        dDate DATE NULL,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S02PERSON (
        nIdPerson SERIAL PRIMARY KEY,
        cIdentificationNumber VARCHAR(50) NULL,
        cFirstName VARCHAR(100) NOT NULL,
        cLastName VARCHAR(100) NULL,
        cEmail VARCHAR(150) NULL,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S02PARTICIPANT (
        nIdParticipant SERIAL PRIMARY KEY,
        nIdPerson INTEGER REFERENCES S02PERSON(nIdPerson),
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S02WORKSHOP_TEAM (
        nIdWorkshopTeam SERIAL PRIMARY KEY,
        nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
        cTeamName VARCHAR(100) NOT NULL,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S02WORKSHOP_TEAM_MEMBER (
        nIdWorkshopTeamMember SERIAL PRIMARY KEY,
        nIdWorkshopTeam INTEGER REFERENCES S02WORKSHOP_TEAM(nIdWorkshopTeam),
        nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
        tCreatedAt TIMESTAMP DEFAULT NOW(),
        UNIQUE(nIdWorkshopTeam, nIdParticipant)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S03WORKSHOP_OBSERVATION_SESSION (
        nIdSession SERIAL PRIMARY KEY,
        nIdWorkshop INTEGER REFERENCES S01WORKSHOP(nIdWorkshop),
        bIsActive BOOLEAN DEFAULT FALSE,
        tStartedAt TIMESTAMP NULL,
        tEndedAt TIMESTAMP NULL,
        nElapsedSeconds INTEGER DEFAULT 0,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S03INITIATIVE_TYPE (
        nIdInitiativeType SERIAL PRIMARY KEY,
        cCode VARCHAR(50) NOT NULL UNIQUE,
        cName VARCHAR(100) NOT NULL,
        cDescription TEXT NULL,
        isActive BOOLEAN DEFAULT TRUE,
        tCreatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS S03OBSERVATION_LOG (
        nIdObservationLog SERIAL PRIMARY KEY,
        nIdSession INTEGER REFERENCES S03WORKSHOP_OBSERVATION_SESSION(nIdSession),
        nIdParticipant INTEGER REFERENCES S02PARTICIPANT(nIdParticipant),
        nIdWorkshopTeam INTEGER REFERENCES S02WORKSHOP_TEAM(nIdWorkshopTeam),
        nIdInitiativeType INTEGER REFERENCES S03INITIATIVE_TYPE(nIdInitiativeType),
        fValue DOUBLE PRECISION NULL,
        nElapsedSeconds INTEGER DEFAULT 0,
        tObservedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    const initiativeCheck = await client.query(`SELECT COUNT(*) FROM S03INITIATIVE_TYPE`);
    if (parseInt(initiativeCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES
        ('PROPOSAL', 'Propuesta (L)', 'Propuestas lanzadas por el participante'),
        ('ACCEPTANCE', 'Aceptación (A)', 'Validaciones de propuestas'),
        ('EYE_CONTACT', 'Contacto Visual', 'Contacto visual del participante'),
        ('PARAPHRASING', 'Parafraseo', 'Repetición de lo dicho por otros'),
        ('INTERRUPTION', 'Interrupción', 'Interrupciones durante el diálogo'),
        ('CONFLICT_MEDIATION', 'Conflicto - Mediación', 'Estilo de resolución mediado'),
        ('CONFLICT_NEGOTIATION', 'Conflicto - Negociación', 'Estilo de resolución negociado'),
        ('CONFLICT_IMPOSITION', 'Conflicto - Imposición', 'Estilo de resolución impuesto')
      `);
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}
