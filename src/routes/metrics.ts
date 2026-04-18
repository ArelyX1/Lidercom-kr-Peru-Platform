import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT 
        it.cCode,
        it.cName,
        COUNT(ol.nIdObservationLog) as count,
        SUM(ol.fValue) as total
       FROM S03OBSERVATION_LOG ol
       JOIN S03INITIATIVE_TYPE it ON ol.nIdInitiativeType = it.nIdInitiativeType
       WHERE ol.nIdSession = $1
       GROUP BY it.nIdInitiativeType, it.cCode, it.cName
       ORDER BY it.nIdInitiativeType`,
      [sessionId]
    );
    
    const metrics = {
      proposals: 0,
      acceptances: 0,
      eyeContact: 0,
      paraphrasing: 0,
      interruptions: 0,
      conflicts: { mediation: 0, negotiation: 0, imposition: 0 }
    };
    
    result.rows.forEach(row => {
      const code = row.ccode;
      const count = parseInt(row.count) || 0;
      
      switch (code) {
        case 'PROPOSAL':
          metrics.proposals = count;
          break;
        case 'ACCEPTANCE':
          metrics.acceptances = count;
          break;
        case 'EYE_CONTACT':
          metrics.eyeContact = count;
          break;
        case 'PARAPHRASING':
          metrics.paraphrasing = count;
          break;
        case 'INTERRUPTION':
          metrics.interruptions = count;
          break;
        case 'CONFLICT_MEDIATION':
          metrics.conflicts.mediation = count;
          break;
        case 'CONFLICT_NEGOTIATION':
          metrics.conflicts.negotiation = count;
          break;
        case 'CONFLICT_IMPOSITION':
          metrics.conflicts.imposition = count;
          break;
      }
    });
    
    res.json({ metrics, raw: result.rows });
  } catch (err) {
    console.error('Error getting metrics:', err);
    res.status(500).json({ error: 'Error getting metrics' });
  }
});

router.get('/participant/:participantId', async (req: Request, res: Response) => {
  const { participantId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT 
        it.cCode,
        it.cName,
        COUNT(*) as count
       FROM S03OBSERVATION_LOG ol
       JOIN S03INITIATIVE_TYPE it ON ol.nIdInitiativeType = it.nIdInitiativeType
       WHERE ol.nIdParticipant = $1
       GROUP BY it.nIdInitiativeType, it.cCode, it.cName
       ORDER BY it.nIdInitiativeType`,
      [participantId]
    );
    
    res.json({ metrics: result.rows });
  } catch (err) {
    console.error('Error getting participant metrics:', err);
    res.status(500).json({ error: 'Error getting participant metrics' });
  }
});

export default router;
