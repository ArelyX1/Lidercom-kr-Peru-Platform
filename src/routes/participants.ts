import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { participantId, sessionId, teamId, name, avatar } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO S02WORKSHOP_TEAM_MEMBER (nIdWorkshopTeam, nIdParticipant, tCreatedAt)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [teamId || 1, participantId || 1]
    );
    
    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    console.error('Error registering participant:', err);
    res.status(500).json({ success: false, error: 'Error registering participant' });
  }
});

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT wtm.*, p.cFirstName, p.cLastName, pt.nIdParticipant
       FROM S02WORKSHOP_TEAM_MEMBER wtm
       LEFT JOIN S02PARTICIPANT pt ON wtm.nIdParticipant = pt.nIdParticipant
       LEFT JOIN S02PERSON p ON pt.nIdPerson = p.nIdPerson
       WHERE wtm.nIdWorkshopTeam IN (
         SELECT nIdWorkshopTeam FROM S02WORKSHOP_TEAM WHERE nIdWorkshop = $1
       )`,
      [sessionId]
    );
    
    res.json({ participants: result.rows });
  } catch (err) {
    console.error('Error getting participants:', err);
    res.status(500).json({ error: 'Error getting participants' });
  }
});

export default router;
