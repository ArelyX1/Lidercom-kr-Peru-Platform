import { pool } from '../db/index.js';

function mapInitiativeCode(code: string): number {
  const map: Record<string, number> = {
    'PROPOSAL': 1,
    'ACCEPTANCE': 2,
    'EYE_CONTACT': 3,
    'PARAPHRASING': 4,
    'INTERRUPTION': 5,
    'CONFLICT_MEDIATION': 6,
    'CONFLICT_NEGOTIATION': 7,
    'CONFLICT_IMPOSITION': 8,
  };
  return map[code] || 1;
}

export const resolvers = {
  Query: {
    venues: async () => {
      const result = await pool.query('SELECT * FROM s01venue ORDER BY tCreatedAt DESC');
      return result.rows.map(row => ({
        id: row.nidvenue,
        name: row.cname,
        description: row.cdescription,
        address: row.caddress,
        createdAt: row.tcreatedat,
      }));
    },

    venue: async (_: any, { id }: { id: string }) => {
      const result = await pool.query('SELECT * FROM s01venue WHERE nIdVenue = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidvenue,
        name: row.cname,
        description: row.cdescription,
        address: row.caddress,
        createdAt: row.tcreatedat,
      };
    },

    programs: async (_: any, { venueId }: { venueId?: string }) => {
      let query = 'SELECT * FROM s01program';
      const params: any[] = [];
      if (venueId) {
        query += ' WHERE nIdVenue = $1';
        params.push(venueId);
      }
      query += ' ORDER BY tCreatedAt DESC';
      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        id: row.nidprogram,
        name: row.cname,
        description: row.cdescription,
        venueId: row.nidvenue,
        createdAt: row.tcreatedat,
      }));
    },

    program: async (_: any, { id }: { id: string }) => {
      const result = await pool.query('SELECT * FROM s01program WHERE nIdProgram = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidprogram,
        name: row.cname,
        description: row.cdescription,
        venueId: row.nidvenue,
        createdAt: row.tcreatedat,
      };
    },

    workshops: async (_: any, { programId }: { programId?: string }) => {
      let query = `
        SELECT w.*, 
          (SELECT COUNT(*) FROM s03workshop_observation_session s WHERE s.nIdWorkshop = w.nIdWorkshop AND s.bIsActive = TRUE) > 0 as has_active
        FROM s01workshop w
      `;
      const params: any[] = [];
      if (programId) {
        query += ' WHERE w.nIdProgram = $1';
        params.push(programId);
      }
      query += ' ORDER BY w.tCreatedAt DESC';
      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        id: row.nidworkshop,
        name: row.cname,
        date: row.ddate,
        programId: row.nidprogram,
        isActive: row.has_active,
        createdAt: row.tcreatedat,
      }));
    },

    workshop: async (_: any, { id }: { id: string }) => {
      console.log('DEBUG: workshop called with id:', id);
      const result = await pool.query(`
        SELECT w.*, 
          (SELECT COUNT(*) FROM s03workshop_observation_session s WHERE s.nIdWorkshop = w.nIdWorkshop AND s.bIsActive = TRUE) > 0 as has_active
        FROM s01workshop w WHERE w.nIdWorkshop = $1
      `, [id]);
      console.log('DEBUG: workshop result rows:', result.rows.length);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidworkshop,
        name: row.cname,
        date: row.ddate,
        programId: row.nidprogram,
        isActive: row.has_active,
        createdAt: row.tcreatedat,
      };
    },

    activeWorkshop: async () => {
      const result = await pool.query(`
        SELECT w.* FROM s01workshop w
        JOIN s03workshop_observation_session s ON s.nIdWorkshop = w.nIdWorkshop
        WHERE s.bIsActive = TRUE
        LIMIT 1
      `);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidworkshop,
        name: row.cname,
        date: row.ddate,
        programId: row.nidprogram,
        isActive: true,
        createdAt: row.tcreatedat,
      };
    },

    participants: async (_: any, { workshopId }: { workshopId?: string }) => {
      let query = `
        SELECT p.*, per.nIdPerson, per.cFirstName, per.cLastName, per.cEmail, per.cIdentificationNumber
        FROM s02PARTICIPANT p
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
      `;
      const params: any[] = [];
      if (workshopId) {
        query += `
          JOIN s02WORKSHOP_TEAM_MEMBER wtm ON wtm.nIdParticipant = p.nIdParticipant
          JOIN s02WORKSHOP_TEAM wt ON wt.nIdWorkshopTeam = wtm.nIdWorkshopTeam
          WHERE wt.nIdWorkshop = $1
        `;
        params.push(workshopId);
      }
      query += ' GROUP BY p.nIdParticipant, per.nIdPerson, per.cFirstName, per.cLastName, per.cEmail, per.cIdentificationNumber ORDER BY p.tCreatedAt DESC';
      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        id: row.nidparticipant,
        name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
        email: row.cemail,
        identificationNumber: row.cidentificationnumber,
        createdAt: row.tcreatedat,
      }));
    },

    participant: async (_: any, { id }: { id: string }) => {
      const result = await pool.query(`
        SELECT p.*, per.cFirstName, per.cLastName, per.cEmail, per.cIdentificationNumber
        FROM s02PARTICIPANT p
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        WHERE p.nIdParticipant = $1
      `, [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidparticipant,
        name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
        email: row.cemail,
        identificationNumber: row.cidentificationnumber,
        createdAt: row.tcreatedat,
      };
    },

    teams: async (_: any, { workshopId }: { workshopId: string }) => {
      const result = await pool.query(
        'SELECT * FROM s02WORKSHOP_TEAM WHERE nIdWorkshop = $1 ORDER BY tCreatedAt',
        [workshopId]
      );
      return result.rows.map(row => ({
        id: row.nidworkshopteam,
        name: row.cteamname,
        workshopId: row.nidworkshop,
        createdAt: row.tcreatedat,
      }));
    },

    team: async (_: any, { id }: { id: string }) => {
      const result = await pool.query('SELECT * FROM s02WORKSHOP_TEAM WHERE nIdWorkshopTeam = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidworkshopteam,
        name: row.cteamname,
        workshopId: row.nidworkshop,
        createdAt: row.tcreatedat,
      };
    },

    sessions: async (_: any, { workshopId }: { workshopId: string }) => {
      const result = await pool.query(
        'SELECT * FROM s03workshop_observation_session WHERE nIdWorkshop = $1 ORDER BY tCreatedAt DESC',
        [workshopId]
      );
      return result.rows.map(row => ({
        id: row.nidsession,
        workshopId: row.nidworkshop,
        isActive: row.bisactive,
        startedAt: row.tstartedat,
        endedAt: row.tendedat,
        elapsedSeconds: row.nelapseseconds ?? 0,
        createdAt: row.tcreatedat,
      }));
    },

    activeSession: async () => {
      try {
        console.log('activeSession: Starting query...');
        const result = await pool.query(
          'SELECT * FROM s03workshop_observation_session WHERE bIsActive = TRUE ORDER BY tCreatedAt DESC LIMIT 1'
        );
        console.log('activeSession: Query result rows:', result.rows.length);
        if (result.rows.length === 0) {
          console.log('activeSession: No rows found');
          return null;
        }
        const row = result.rows[0];
        console.log('activeSession: row:', row);
        const elapsed = row.tstartedat 
          ? Math.floor((Date.now() - new Date(row.tstartedat).getTime()) / 1000) + (row.nelapseseconds || 0)
          : row.nelapseseconds || 0;
        console.log('activeSession: elapsed:', elapsed);
        
        const workshopResult = await pool.query('SELECT * FROM s01workshop WHERE nIdWorkshop = $1', [row.nidworkshop]);
        console.log('activeSession: workshopResult:', workshopResult.rows[0]);
        const workshop = workshopResult.rows[0];
        
        if (!workshop) {
          console.log('activeSession: No workshop found');
          return null;
        }
        
        const response = {
          id: String(row.nidsession),
          workshopId: String(row.nidworkshop),  // Add for field resolver
          workshop: {
            id: String(workshop.nidworkshop),
            name: workshop.cname,
            date: workshop.ddate,
            programId: String(workshop.nidprogram),
            isActive: true,
            createdAt: workshop.tcreatedat,
          },
          isActive: row.bisactive,
          startedAt: row.tstartedat,
          endedAt: row.tendedat,
          elapsedSeconds: elapsed,
          createdAt: row.tcreatedat,
        };
        console.log('activeSession: response:', response);
        return response;
      } catch (err) {
        console.error('Error in activeSession:', err);
        return null;
      }
    },

    initiativeTypes: async () => {
      const result = await pool.query('SELECT * FROM s03initiative_type WHERE isActive = TRUE ORDER BY nIdInitiativeType');
      return result.rows.map(row => ({
        id: row.nidinitiativetype,
        code: row.ccode,
        name: row.cname,
        description: row.cdescription,
        isActive: row.isactive,
      }));
    },

    observations: async (_: any, { sessionId }: { sessionId: string }) => {
      const result = await pool.query(`
        SELECT o.*, it.cCode, it.cName, it.cDescription,
          p.nIdPerson, per.cFirstName, per.cLastName,
          wt.cTeamName
        FROM s03observation_log o
        JOIN s03initiative_type it ON o.nIdInitiativeType = it.nIdInitiativeType
        JOIN s02PARTICIPANT p ON o.nIdParticipant = p.nIdParticipant
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        LEFT JOIN s02WORKSHOP_TEAM wt ON o.nIdWorkshopTeam = wt.nIdWorkshopTeam
        WHERE o.nIdSession = $1
        ORDER BY o.tObservedAt DESC
      `, [sessionId]);
      return result.rows.map(row => ({
        id: row.nidobservationlog,
        sessionId: row.nidsession,
        participantId: row.nidparticipant,
        participant: {
          id: row.nidparticipant,
          name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
        },
        teamId: row.nidworkshopteam,
        team: row.cteamname ? { id: row.nidworkshopteam, name: row.cteamname } : null,
        initiativeType: {
          id: row.nidinitiativetype,
          code: row.ccode,
          name: row.cname,
          description: row.cdescription,
        },
        value: row.fvalue,
        elapsedSeconds: row.nelapseseconds,
        observedAt: row.tobservedat,
      }));
    },

    sessionMetrics: async (_: any, { sessionId }: { sessionId: string }) => {
      const sessionResult = await pool.query(
        'SELECT * FROM s03workshop_observation_session WHERE nIdSession = $1',
        [sessionId]
      );
      if (sessionResult.rows.length === 0) return null;
      const session = sessionResult.rows[0];

      const metricsResult = await pool.query(`
        SELECT it.cCode, COUNT(*) as count, SUM(o.fValue) as total
        FROM s03observation_log o
        JOIN s03initiative_type it ON o.nIdInitiativeType = it.nIdInitiativeType
        WHERE o.nIdSession = $1
        GROUP BY it.nIdInitiativeType, it.cCode
      `, [sessionId]);

      const totalMetrics: Record<string, number> = {
        proposals: 0,
        acceptances: 0,
        eyeContact: 0,
        paraphrasing: 0,
        interruptions: 0,
        conflictsMediation: 0,
        conflictsNegotiation: 0,
        conflictsImposition: 0,
        totalObservations: 0,
      };

      metricsResult.rows.forEach(row => {
        const count = parseInt(row.count) || 0;
        totalMetrics.totalObservations += count;
        switch (row.ccode) {
          case 'PROPOSAL': totalMetrics.proposals = count; break;
          case 'ACCEPTANCE': totalMetrics.acceptances = count; break;
          case 'EYE_CONTACT': totalMetrics.eyeContact = count; break;
          case 'PARAPHRASING': totalMetrics.paraphrasing = count; break;
          case 'INTERRUPTION': totalMetrics.interruptions = count; break;
          case 'CONFLICT_MEDIATION': totalMetrics.conflictsMediation = count; break;
          case 'CONFLICT_NEGOTIATION': totalMetrics.conflictsNegotiation = count; break;
          case 'CONFLICT_IMPOSITION': totalMetrics.conflictsImposition = count; break;
        }
      });

      const participantMetricsResult = await pool.query(`
        SELECT o.nIdParticipant, per.cFirstName, per.cLastName, it.cCode, COUNT(*) as count
        FROM s03observation_log o
        JOIN s03initiative_type it ON o.nIdInitiativeType = it.nIdInitiativeType
        JOIN s02PARTICIPANT p ON o.nIdParticipant = p.nIdParticipant
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        WHERE o.nIdSession = $1
        GROUP BY o.nIdParticipant, per.cFirstName, per.cLastName, it.cCode
      `, [sessionId]);

      const participantMap: Record<number, any> = {};
      participantMetricsResult.rows.forEach(row => {
        if (!participantMap[row.nidparticipant]) {
          participantMap[row.nidparticipant] = {
            participant: {
              id: row.nidparticipant,
              name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
            },
            metrics: {
              proposals: 0,
              acceptances: 0,
              eyeContact: 0,
              paraphrasing: 0,
              interruptions: 0,
              conflictsMediation: 0,
              conflictsNegotiation: 0,
              conflictsImposition: 0,
              totalObservations: 0,
            },
          };
        }
        const count = parseInt(row.count) || 0;
        participantMap[row.nidparticipant].metrics.totalObservations += count;
        switch (row.ccode) {
          case 'PROPOSAL': participantMap[row.nidparticipant].metrics.proposals = count; break;
          case 'ACCEPTANCE': participantMap[row.nidparticipant].metrics.acceptances = count; break;
          case 'EYE_CONTACT': participantMap[row.nidparticipant].metrics.eyeContact = count; break;
          case 'PARAPHRASING': participantMap[row.nidparticipant].metrics.paraphrasing = count; break;
          case 'INTERRUPTION': participantMap[row.nidparticipant].metrics.interruptions = count; break;
          case 'CONFLICT_MEDIATION': participantMap[row.nidparticipant].metrics.conflictsMediation = count; break;
          case 'CONFLICT_NEGOTIATION': participantMap[row.nidparticipant].metrics.conflictsNegotiation = count; break;
          case 'CONFLICT_IMPOSITION': participantMap[row.nidparticipant].metrics.conflictsImposition = count; break;
        }
      });

      return {
        session: {
          id: session.nidsession,
          workshopId: session.nidworkshop,
          isActive: session.bisactive,
          startedAt: session.tstartedat,
          endedAt: session.tendedat,
          elapsedSeconds: session.nelapseseconds,
          createdAt: session.tcreatedat,
        },
        totalMetrics,
        participantMetrics: Object.values(participantMap),
      };
    },
  },

  Mutation: {
    createVenue: async (_: any, { input }: { input: { name: string; description?: string; address?: string } }) => {
      const result = await pool.query(
        'INSERT INTO s01VENUE (cName, cDescription, cAddress) VALUES ($1, $2, $3) RETURNING *',
        [input.name, input.description || null, input.address || null]
      );
      const row = result.rows[0];
      return {
        id: row.nidvenue,
        name: row.cname,
        description: row.cdescription,
        address: row.caddress,
        createdAt: row.tcreatedat,
      };
    },

    updateVenue: async (_: any, args: { id: string; name?: string; description?: string; address?: string }) => {
      const { id, ...updates } = args;
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        fields.push(`cName = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`cDescription = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.address !== undefined) {
        fields.push(`cAddress = $${paramIndex++}`);
        values.push(updates.address);
      }

      if (fields.length === 0) {
        const result = await pool.query('SELECT * FROM s01VENUE WHERE nIdVenue = $1', [id]);
        const row = result.rows[0];
        return { id: row.nidvenue, name: row.cname, description: row.cdescription, address: row.caddress, createdAt: row.tcreatedat };
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE s01VENUE SET ${fields.join(', ')} WHERE nIdVenue = $${paramIndex} RETURNING *`,
        values
      );
      const row = result.rows[0];
      return { id: row.nidvenue, name: row.cname, description: row.cdescription, address: row.caddress, createdAt: row.tcreatedat };
    },

    deleteVenue: async (_: any, { id }: { id: string }) => {
      await pool.query('DELETE FROM s01VENUE WHERE nIdVenue = $1', [id]);
      return true;
    },

    createProgram: async (_: any, { input }: { input: { name: string; description?: string; venueId: string } }) => {
      const result = await pool.query(
        'INSERT INTO s01PROGRAM (nIdVenue, cName, cDescription) VALUES ($1, $2, $3) RETURNING *',
        [input.venueId, input.name, input.description || null]
      );
      const row = result.rows[0];
      return {
        id: row.nidprogram,
        name: row.cname,
        description: row.cdescription,
        venueId: row.nidvenue,
        createdAt: row.tcreatedat,
      };
    },

    updateProgram: async (_: any, args: { id: string; name?: string; description?: string }) => {
      const { id, ...updates } = args;
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        fields.push(`cName = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`cDescription = $${paramIndex++}`);
        values.push(updates.description);
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE s01PROGRAM SET ${fields.join(', ')} WHERE nIdProgram = $${paramIndex} RETURNING *`,
        values
      );
      const row = result.rows[0];
      return { id: row.nidprogram, name: row.cname, description: row.cdescription, venueId: row.nidvenue, createdAt: row.tcreatedat };
    },

    deleteProgram: async (_: any, { id }: { id: string }) => {
      await pool.query('DELETE FROM s01PROGRAM WHERE nIdProgram = $1', [id]);
      return true;
    },

    createWorkshop: async (_: any, { input }: { input: { name: string; date?: string; programId: string } }) => {
      const result = await pool.query(
        'INSERT INTO s01workshop (nIdProgram, cName, dDate) VALUES ($1, $2, $3) RETURNING *',
        [input.programId, input.name, input.date || null]
      );
      const row = result.rows[0];
      return {
        id: row.nidworkshop,
        name: row.cname,
        date: row.ddate,
        programId: row.nidprogram,
        isActive: false,
        createdAt: row.tcreatedat,
      };
    },

    updateWorkshop: async (_: any, args: { id: string; name?: string; date?: string }) => {
      const { id, ...updates } = args;
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        fields.push(`cName = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.date !== undefined) {
        fields.push(`dDate = $${paramIndex++}`);
        values.push(updates.date);
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE s01workshop SET ${fields.join(', ')} WHERE nIdWorkshop = $${paramIndex} RETURNING *`,
        values
      );
      const row = result.rows[0];
      return { id: row.nidworkshop, name: row.cname, date: row.ddate, programId: row.nidprogram, isActive: false, createdAt: row.tcreatedat };
    },

    deleteWorkshop: async (_: any, { id }: { id: string }) => {
      await pool.query('DELETE FROM s01workshop WHERE nIdWorkshop = $1', [id]);
      return true;
    },

    createParticipant: async (_: any, { input }: { input: { name: string; email?: string; identificationNumber?: string } }) => {
      const nameParts = input.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || null;

      const personResult = await pool.query(
        'INSERT INTO s02PERSON (cFirstName, cLastName, cEmail, cIdentificationNumber) VALUES ($1, $2, $3, $4) RETURNING *',
        [firstName, lastName, input.email || null, input.identificationNumber || null]
      );
      const person = personResult.rows[0];

      const participantResult = await pool.query(
        'INSERT INTO s02PARTICIPANT (nIdPerson) VALUES ($1) RETURNING *',
        [person.nidperson]
      );
      const participant = participantResult.rows[0];

      return {
        id: participant.nidparticipant,
        name: input.name,
        email: input.email,
        identificationNumber: input.identificationNumber,
        createdAt: participant.tcreatedat,
      };
    },

    updateParticipant: async (_: any, args: { id: string; name?: string; email?: string; identificationNumber?: string }) => {
      const { id, ...updates } = args;
      const personResult = await pool.query(
        'SELECT nIdPerson FROM s02PARTICIPANT WHERE nIdParticipant = $1',
        [id]
      );
      if (personResult.rows.length === 0) throw new Error('Participant not found');
      const personId = personResult.rows[0].nidperson;

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        const nameParts = updates.name.trim().split(' ');
        fields.push(`cFirstName = $${paramIndex++}`);
        values.push(nameParts[0]);
        fields.push(`cLastName = $${paramIndex++}`);
        values.push(nameParts.slice(1).join(' ') || null);
      }
      if (updates.email !== undefined) {
        fields.push(`cEmail = $${paramIndex++}`);
        values.push(updates.email);
      }
      if (updates.identificationNumber !== undefined) {
        fields.push(`cIdentificationNumber = $${paramIndex++}`);
        values.push(updates.identificationNumber);
      }

      values.push(personId);
      if (fields.length > 0) {
        await pool.query(`UPDATE s02PERSON SET ${fields.join(', ')} WHERE nIdPerson = $${paramIndex}`, values);
      }

      const participantResult = await pool.query(
        'SELECT * FROM s02PARTICIPANT WHERE nIdParticipant = $1',
        [id]
      );
      const participant = participantResult.rows[0];

      return {
        id: participant.nidparticipant,
        name: updates.name || 'Unknown',
        email: updates.email,
        identificationNumber: updates.identificationNumber,
        createdAt: participant.tcreatedat,
      };
    },

    deleteParticipant: async (_: any, { id }: { id: string }) => {
      const participantResult = await pool.query(
        'SELECT nIdPerson FROM s02PARTICIPANT WHERE nIdParticipant = $1',
        [id]
      );
      if (participantResult.rows.length > 0) {
        await pool.query('DELETE FROM s02PARTICIPANT WHERE nIdParticipant = $1', [id]);
        await pool.query('DELETE FROM s02PERSON WHERE nIdPerson = $1', [participantResult.rows[0].nidperson]);
      }
      return true;
    },

    createTeam: async (_: any, { input }: { input: { name: string; workshopId: string } }) => {
      const result = await pool.query(
        'INSERT INTO s02WORKSHOP_TEAM (nIdWorkshop, cTeamName) VALUES ($1, $2) RETURNING *',
        [input.workshopId, input.name]
      );
      const row = result.rows[0];
      return {
        id: row.nidworkshopteam,
        name: row.cteamname,
        workshopId: row.nidworkshop,
        createdAt: row.tcreatedat,
      };
    },

    addParticipantToTeam: async (_: any, { input }: { input: { participantId: string; teamId: string } }) => {
      await pool.query(
        'INSERT INTO s02WORKSHOP_TEAM_MEMBER (nIdWorkshopTeam, nIdParticipant) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [input.teamId, input.participantId]
      );
      const result = await pool.query('SELECT * FROM s02WORKSHOP_TEAM WHERE nIdWorkshopTeam = $1', [input.teamId]);
      const row = result.rows[0];
      return {
        id: row.nidworkshopteam,
        name: row.cteamname,
        workshopId: row.nidworkshop,
        createdAt: row.tcreatedat,
      };
    },

    removeParticipantFromTeam: async (_: any, { participantId, teamId }: { participantId: string; teamId: string }) => {
      await pool.query(
        'DELETE FROM s02WORKSHOP_TEAM_MEMBER WHERE nIdWorkshopTeam = $1 AND nIdParticipant = $2',
        [teamId, participantId]
      );
      return true;
    },

    startSession: async (_: any, { workshopId }: { workshopId: string }) => {
      await pool.query('UPDATE s03workshop_observation_session SET bIsActive = FALSE WHERE bIsActive = TRUE');

      const result = await pool.query(
        'INSERT INTO s03workshop_observation_session (nIdWorkshop, bIsActive, tStartedAt, nElapsedSeconds) VALUES ($1, TRUE, NOW(), 0) RETURNING *',
        [workshopId]
      );
      const row = result.rows[0];
      const workshopResult = await pool.query('SELECT * FROM s01workshop WHERE nIdWorkshop = $1', [row.nidworkshop]);
      const workshop = workshopResult.rows[0];
      return {
        id: row.nidsession,
        workshop: {
          id: workshop.nidworkshop,
          name: workshop.cname,
          date: workshop.ddate,
          programId: workshop.nidprogram,
          isActive: true,
          createdAt: workshop.tcreatedat,
        },
        isActive: row.bisactive,
        startedAt: row.tstartedat,
        endedAt: row.tendedat,
        elapsedSeconds: 0,
        createdAt: row.tcreatedat,
      };
    },

    endSession: async (_: any, { sessionId }: { sessionId: string }) => {
      const result = await pool.query(
        'UPDATE s03workshop_observation_session SET bIsActive = FALSE, tEndedAt = NOW() WHERE nIdSession = $1 RETURNING *',
        [sessionId]
      );
      if (result.rows.length === 0) throw new Error('Session not found');
      const row = result.rows[0];
      const workshopResult = await pool.query('SELECT * FROM s01workshop WHERE nIdWorkshop = $1', [row.nidworkshop]);
      const workshop = workshopResult.rows[0];
      return {
        id: row.nidsession,
        workshop: {
          id: workshop.nidworkshop,
          name: workshop.cname,
          date: workshop.ddate,
          programId: workshop.nidprogram,
          isActive: false,
          createdAt: workshop.tcreatedat,
        },
        isActive: row.bisactive,
        startedAt: row.tstartedat,
        endedAt: row.tendedat,
        elapsedSeconds: row.nelapseseconds ?? 0,
        createdAt: row.tcreatedat,
      };
    },

    logObservation: async (_: any, args: { sessionId: string; participantId: string; teamId?: string; initiativeTypeCode: string; value?: number; elapsedSeconds: number }) => {
      const initiativeTypeId = mapInitiativeCode(args.initiativeTypeCode);

      const result = await pool.query(
        `INSERT INTO s03observation_log (nIdSession, nIdParticipant, nIdWorkshopTeam, nIdInitiativeType, fValue, nElapsedSeconds, tObservedAt)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [args.sessionId, args.participantId, args.teamId || null, initiativeTypeId, args.value || 1, args.elapsedSeconds]
      );
      const row = result.rows[0];

      const typeResult = await pool.query('SELECT * FROM s03initiative_type WHERE nIdInitiativeType = $1', [initiativeTypeId]);
      const type = typeResult.rows[0];

      const participantResult = await pool.query(`
        SELECT p.*, per.cFirstName, per.cLastName FROM s02PARTICIPANT p
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        WHERE p.nIdParticipant = $1
      `, [args.participantId]);
      const participant = participantResult.rows[0];

      return {
        id: row.nidobservationlog,
        sessionId: row.nidsession,
        participantId: row.nidparticipant,
        participant: {
          id: participant.nidparticipant,
          name: `${participant.cfirstname}${participant.clastname ? ' ' + participant.clastname : ''}`,
        },
        teamId: row.nidworkshopteam,
        initiativeType: {
          id: type.nidinitiativetype,
          code: type.ccode,
          name: type.cname,
          description: type.cdescription,
        },
        value: row.fvalue,
        elapsedSeconds: row.nelapseseconds,
        observedAt: row.tobservedat,
      };
    },
  },

  Workshop: {
    participants: async (workshop: { id: string }) => {
      const result = await pool.query(`
        SELECT DISTINCT p.nIdParticipant, per.cFirstName, per.cLastName, per.cEmail, per.cIdentificationNumber
        FROM s02PARTICIPANT p
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        JOIN s02WORKSHOP_TEAM_MEMBER wtm ON wtm.nIdParticipant = p.nIdParticipant
        JOIN s02WORKSHOP_TEAM wt ON wt.nIdWorkshopTeam = wtm.nIdWorkshopTeam
        WHERE wt.nIdWorkshop = $1
      `, [workshop.id]);
      return result.rows.map(row => ({
        id: row.nidparticipant,
        name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
        email: row.cemail,
        identificationNumber: row.cidentificationnumber,
      }));
    },

    teams: async (workshop: { id: string }) => {
      const result = await pool.query(
        'SELECT * FROM s02WORKSHOP_TEAM WHERE nIdWorkshop = $1 ORDER BY tCreatedAt',
        [workshop.id]
      );
      return result.rows.map(row => ({
        id: row.nidworkshopteam,
        name: row.cteamname,
        workshopId: row.nidworkshop,
        createdAt: row.tcreatedat,
      }));
    },

    sessions: async (workshop: { id: string }) => {
      const result = await pool.query(
        'SELECT * FROM s03workshop_observation_session WHERE nIdWorkshop = $1 ORDER BY tCreatedAt DESC',
        [workshop.id]
      );
      return result.rows.map(row => ({
        id: row.nidsession,
        workshopId: row.nidworkshop,
        isActive: row.bisactive,
        startedAt: row.tstartedat,
        endedAt: row.tendedat,
        elapsedSeconds: row.nelapseseconds,
        createdAt: row.tcreatedat,
      }));
    },

    activeSession: async (workshop: { id: string }) => {
      const result = await pool.query(
        'SELECT * FROM s03workshop_observation_session WHERE nIdWorkshop = $1 AND bIsActive = TRUE LIMIT 1',
        [workshop.id]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      const elapsed = row.tstartedat
        ? Math.floor((Date.now() - new Date(row.tstartedat).getTime()) / 1000) + (row.nelapseseconds || 0)
        : row.nelapseseconds || 0;
      const workshopResult = await pool.query('SELECT * FROM s01workshop WHERE nIdWorkshop = $1', [row.nidworkshop]);
      const workshopData = workshopResult.rows[0];
      return {
        id: row.nidsession,
        workshop: {
          id: workshopData.nidworkshop,
          name: workshopData.cname,
          date: workshopData.ddate,
          programId: workshopData.nidprogram,
          isActive: true,
          createdAt: workshopData.tcreatedat,
        },
        isActive: row.bisactive,
        startedAt: row.tstartedat,
        endedAt: row.tendedat,
        elapsedSeconds: elapsed,
        createdAt: row.tcreatedat,
      };
    },
  },

  Program: {
    venue: async (program: { venueId: string }) => {
      const result = await pool.query('SELECT * FROM s01VENUE WHERE nIdVenue = $1', [program.venueId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidvenue,
        name: row.cname,
        description: row.cdescription,
        address: row.caddress,
        createdAt: row.tcreatedat,
      };
    },

    workshops: async (program: { id: string }) => {
      const result = await pool.query(`
        SELECT w.*, 
          (SELECT COUNT(*) FROM s03workshop_observation_session s WHERE s.nIdWorkshop = w.nIdWorkshop AND s.bIsActive = TRUE) > 0 as has_active
        FROM s01workshop w WHERE w.nIdProgram = $1 ORDER BY w.tCreatedAt DESC
      `, [program.id]);
      return result.rows.map(row => ({
        id: row.nidworkshop,
        name: row.cname,
        date: row.ddate,
        programId: row.nidprogram,
        isActive: row.has_active,
        createdAt: row.tcreatedat,
      }));
    },
  },

  WorkshopSession: {
    workshop: async (session: { workshopId: string }) => {
      console.log('WorkshopSession.workshop called with workshopId:', session.workshopId);
      const result = await pool.query('SELECT * FROM s01workshop WHERE nIdWorkshop = $1', [session.workshopId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: String(row.nidworkshop),
        name: row.cname,
        date: row.ddate,
        program: row.nidprogram ? { id: String(row.nidprogram), name: '', createdAt: null } : null,
        programId: String(row.nidprogram),
        isActive: row.isactive,
        createdAt: row.tcreatedat,
        participants: [],
        teams: [],
        sessions: [],
        activeSession: null,
      };
    },

    observations: async (session: { id: string }) => {
      const result = await pool.query(`
        SELECT o.*, it.cCode, it.cName, it.cDescription,
          p.nIdPerson, per.cFirstName, per.cLastName
        FROM s03observation_log o
        JOIN s03initiative_type it ON o.nIdInitiativeType = it.nIdInitiativeType
        JOIN s02PARTICIPANT p ON o.nIdParticipant = p.nIdParticipant
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        WHERE o.nIdSession = $1
        ORDER BY o.tObservedAt DESC
      `, [session.id]);
      return result.rows.map(row => ({
        id: row.nidobservationlog,
        sessionId: row.nidsession,
        participantId: row.nidparticipant,
        participant: {
          id: row.nidparticipant,
          name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
        },
        initiativeType: {
          id: row.nidinitiativetype,
          code: row.ccode,
          name: row.cname,
          description: row.cdescription,
        },
        value: row.fvalue,
        elapsedSeconds: row.nelapseseconds,
        observedAt: row.tobservedat,
      }));
    },
  },

  WorkshopTeam: {
    workshop: async (team: { workshopId: string }) => {
      const result = await pool.query('SELECT * FROM s01workshop WHERE nIdWorkshop = $1', [team.workshopId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.nidworkshop,
        name: row.cname,
        date: row.ddate,
        programId: row.nidprogram,
        isActive: false,
        createdAt: row.tcreatedat,
      };
    },

    members: async (team: { id: string }) => {
      const result = await pool.query(`
        SELECT p.nIdParticipant, per.cFirstName, per.cLastName, per.cEmail, per.cIdentificationNumber
        FROM s02WORKSHOP_TEAM_MEMBER wtm
        JOIN s02PARTICIPANT p ON wtm.nIdParticipant = p.nIdParticipant
        JOIN s02PERSON per ON p.nIdPerson = per.nIdPerson
        WHERE wtm.nIdWorkshopTeam = $1
      `, [team.id]);
      return result.rows.map(row => ({
        id: row.nidparticipant,
        name: `${row.cfirstname}${row.clastname ? ' ' + row.clastname : ''}`,
        email: row.cemail,
        identificationNumber: row.cidentificationnumber,
      }));
    },
  },

  Participant: {
    workshopTeams: async (participant: { id: string }) => {
      const result = await pool.query(`
        SELECT wt.* FROM s02WORKSHOP_TEAM wt
        JOIN s02WORKSHOP_TEAM_MEMBER wtm ON wt.nIdWorkshopTeam = wtm.nIdWorkshopTeam
        WHERE wtm.nIdParticipant = $1
      `, [participant.id]);
      return result.rows.map(row => ({
        id: row.nidworkshopteam,
        name: row.cteamname,
        workshopId: row.nidworkshop,
        createdAt: row.tcreatedat,
      }));
    },
  },
};
