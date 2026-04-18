import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';

const router = Router();

interface ObservationBody {
  sessionId: number;
  participantId: number;
  teamId: number;
  type: string;
  value: number | string;
  elapsedSeconds?: number;
}

router.post('/', async (req: Request, res: Response) => {
  const { sessionId, participantId, teamId, type, value, elapsedSeconds } = req.body as ObservationBody;
  
  try {
    let initiativeTypeId = 1;
    
    switch (type) {
      case 'proposal':
        initiativeTypeId = 1;
        break;
      case 'acceptance':
        initiativeTypeId = 2;
        break;
      case 'eye-contact':
        initiativeTypeId = 3;
        break;
      case 'paraphrasing':
        initiativeTypeId = 4;
        break;
      case 'interruption':
        initiativeTypeId = 5;
        break;
      case 'conflict':
        if (value === 'mediation') initiativeTypeId = 6;
        else if (value === 'negotiation') initiativeTypeId = 7;
        else initiativeTypeId = 8;
        break;
    }

    const numericValue = typeof value === 'number' ? value : 1;

    const result = await pool.query(
      `INSERT INTO S03OBSERVATION_LOG 
       (nIdSession, nIdParticipant, nIdWorkshopTeam, nIdInitiativeType, fValue, tObservedAt) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [sessionId || 1, participantId || 1, teamId || 1, initiativeTypeId, numericValue]
    );

    res.json({ success: true, observation: result.rows[0] });
  } catch (err) {
    console.error('Error logging observation:', err);
    res.status(500).json({ success: false, error: 'Error logging observation' });
  }
});

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT ol.*, it.cCode, it.cName 
       FROM S03OBSERVATION_LOG ol
       LEFT JOIN S03INITIATIVE_TYPE it ON ol.nIdInitiativeType = it.nIdInitiativeType
       WHERE ol.nIdSession = $1 
       ORDER BY ol.tObservedAt DESC`,
      [sessionId]
    );
    
    res.json({ observations: result.rows });
  } catch (err) {
    console.error('Error getting observations:', err);
    res.status(500).json({ error: 'Error getting observations' });
  }
});

router.get('/participant/:participantId', async (req: Request, res: Response) => {
  const { participantId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT ol.*, it.cCode, it.cName, ws.cSessionName
       FROM S03OBSERVATION_LOG ol
       LEFT JOIN S03INITIATIVE_TYPE it ON ol.nIdInitiativeType = it.nIdInitiativeType
       LEFT JOIN S03WORKSHOP_OBSERVATION_SESSION ws ON ol.nIdSession = ws.nIdSession
       WHERE ol.nIdParticipant = $1 
       ORDER BY ol.tObservedAt DESC
       LIMIT 100`,
      [participantId]
    );
    
    const summary: Record<string, number> = {};
    result.rows.forEach(row => {
      const code = row.ccode || 'UNKNOWN';
      summary[code] = (summary[code] || 0) + (row.fvalue || 1);
    });
    
    res.json({ observations: result.rows, summary });
  } catch (err) {
    console.error('Error getting participant observations:', err);
    res.status(500).json({ error: 'Error getting observations' });
  }
});

router.get('/initiative-types', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM S03INITIATIVE_TYPE WHERE isActive = TRUE ORDER BY nIdInitiativeType`
    );
    res.json({ types: result.rows });
  } catch (err) {
    console.error('Error getting initiative types:', err);
    res.status(500).json({ error: 'Error getting initiative types' });
  }
});

export default router;
