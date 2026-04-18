import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.post('/start', async (req: Request, res: Response) => {
  const { sessionName, workshopId } = req.body;
  try {
    await pool.query(`UPDATE S03WORKSHOP_OBSERVATION_SESSION SET bIsActive = FALSE WHERE bIsActive = TRUE`);
    
    const result = await pool.query(
      `INSERT INTO S03WORKSHOP_OBSERVATION_SESSION 
       (nIdWorkshop, cSessionName, bIsActive, tStartedAt, nElapsedSeconds) 
       VALUES ($1, $2, TRUE, NOW(), 0) 
       RETURNING *`,
      [workshopId || 1, sessionName || `Session ${new Date().toISOString()}`]
    );
    
    res.json({ success: true, session: result.rows[0] });
  } catch (err) {
    console.error('Error starting workshop:', err);
    res.status(500).json({ success: false, error: 'Error starting workshop' });
  }
});

router.post('/end', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE S03WORKSHOP_OBSERVATION_SESSION 
       SET bIsActive = FALSE, tEndedAt = NOW() 
       WHERE bIsActive = TRUE 
       RETURNING *`
    );
    
    if (result.rows.length === 0) {
      res.json({ success: false, message: 'No active session found' });
      return;
    }
    
    res.json({ success: true, session: result.rows[0] });
  } catch (err) {
    console.error('Error ending workshop:', err);
    res.status(500).json({ success: false, error: 'Error ending workshop' });
  }
});

router.get('/active', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM S03WORKSHOP_OBSERVATION_SESSION WHERE bIsActive = TRUE ORDER BY nIdSession DESC LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      res.json({ active: false, session: null });
      return;
    }
    
    const session = result.rows[0];
    const elapsed = session.tstartedat 
      ? Math.floor((Date.now() - new Date(session.tstartedat).getTime()) / 1000) + (session.nelapseseconds || 0)
      : session.nelapseseconds || 0;
    
    res.json({ active: true, session: { ...session, elapsedSeconds: elapsed } });
  } catch (err) {
    console.error('Error getting active session:', err);
    res.status(500).json({ success: false, error: 'Error getting active session' });
  }
});

router.post('/tick', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE S03WORKSHOP_OBSERVATION_SESSION 
       SET nElapsedSeconds = nElapsedSeconds + 1 
       WHERE bIsActive = TRUE 
       RETURNING nElapsedSeconds`
    );
    
    if (result.rows.length === 0) {
      res.json({ success: false });
      return;
    }
    
    res.json({ success: true, elapsedSeconds: result.rows[0].nelapseseconds });
  } catch (err) {
    console.error('Error ticking:', err);
    res.status(500).json({ success: false });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM S03WORKSHOP_OBSERVATION_SESSION ORDER BY tCreatedAt DESC LIMIT 50`
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('Error getting history:', err);
    res.status(500).json({ error: 'Error getting history' });
  }
});

export default router;
