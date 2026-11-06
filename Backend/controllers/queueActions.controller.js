import pool from "../db/db.js";
import { getOwnedQueue } from "../utils/ownerShip.util.js";
import { toId } from "../utils/id.util.js";
import { HttpError } from "../utils/httpsError.util.js";
import { refreshQueue } from '../jobs/notifier.js';
import { notifyYourTurn } from '../services/notification.services.js';
import { updateAvgServiceTime } from '../utils/eta.utils.js';  


// GET /queues/:queueId/entries  -> the live list for the dashboard
export const listEntries=async(req,res,next)=>{
  try {
      const queueId=toId(req.params.queueId);
      
      if(!queueId) throw new HttpError(400,'Invalid Queue Id');

      const queue=await getOwnedQueue(pool,queueId,req.merchantId);

      const [entries]=await pool.query(
        `SELECT e.id, e.token_no AS token, e.status, e.joined_at AS joinedAt,
                e.called_at AS calledAt, e.notified_at AS notifiedAt,
                c.name, c.phone
        from queue_entries e
        JOIN customers c ON c.id=e.customer_id
        where e.queue_id=? AND e.status IN('waiting','notified','serving')
        order by e.token_no
        `,
        [queueId]
      );

      res.json({
        queue:{id:queueId,name:queue.name,status:queue.status},
        entries
      });

  } catch (error) {
     next(error);   
  }
}


// POST /queues/:queueId/next  -> call the next customer

// next cust ko call krne ke liye to pahele queue chahiye jo params se queueId milegi 
// jab queue mil jayegi to queue ko lock kr denge taki ek baar me ek hi row update ho
// then queue id se queue_entries table me query marenge customer having waiting or notified status
// un sab me se jiska token no min hoga usko hi lenge then uska status waiting se serving me updated karenge with time
export const callNext=async(req,res,next)=>{
  const queueId=toId(req.params.queueId);
  if(!queueId) throw new HttpError(400,'Invalid queue Id');

  const conn=await pool.getConnection();// again yaha par bhi queue ko lock karenge taki just ek baar me ek hi entries ho
  
  try {
     await conn.beginTransaction();
     
      // locking the queue row makes two "Call next" clicks run one after the other
     const queue=await getOwnedQueue(conn,queueId,req.merchantId,{forUpdate:true});

     if(queue.status==='paused') throw new HttpError(409,"Queue is paused.Resume it to call next customer");

     const [serving]=await conn.query(`
      select id from queue_entries  where queue_id=? and status='serving' limit 1
      `,
    [queueId]);

    if(serving[0]) throw new HttpError(409,"Complete or skip the current customer first");

    const [nextRow]=await conn.query(
      `
      select e.id, e.token_no as token, c.name, c.phone
      from queue_entries e
      JOIN customers c on c.id=e.customer_id
      where e.queue_id=? and e.status IN ('waiting','notified')
      order by e.token_no
      LIMIT 1
      `,
      [queueId]
    );

    const nextEntry=nextRow[0];
    if (!nextEntry) throw new HttpError(404, 'No one is waiting');
     
    await conn.query(
      `update queue_entries SET status='serving',called_at =NOW() where id=?`,
      [nextEntry.id]
    );
    

    await conn.commit();
    notifyYourTurn(nextEntry.id).catch(console.error);
    refreshQueue(queueId).catch(console.error);

    res.json({message:`Now serving token ${nextEntry.token}`,entry:nextEntry});

  } catch (error) {
    await conn.rollback();
    next(error);
  }
  finally{
    conn.release();
  }
}

// builds a handler that moves one entry to a final status
const closeEntry = (newStatus, allowedFrom, successMessage, onDone) => async (req, res, next) => {
  try {
    const queueId = toId(req.params.queueId);
    const entryId = toId(req.params.entryId);
    if (!queueId || !entryId) throw new HttpError(400, 'Invalid id');

    await getOwnedQueue(pool, queueId, req.merchantId);

    const [result] = await pool.query(
      `UPDATE queue_entries
       SET status = ?, completed_at = NOW()
       WHERE id = ? AND queue_id = ? AND status IN (?)`,
      [newStatus, entryId, queueId, allowedFrom]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(409, 'Entry not found or already finished');
    }

    // background work: refresh the average first, then check who to notify
        (async () => {
      try {
        if (onDone) await onDone(queueId);
        await refreshQueue(queueId);
      } catch (e) {
        console.error(e);
      }
    })();

    res.json({ message: successMessage });
  } catch (err) {
    next(err);
  }
};


// POST /queues/:queueId/entries/:entryId/complete
export const completeEntry = closeEntry('served', ['serving'], 'Marked as served', updateAvgServiceTime);
//Skipped and no-show entries are not counted in the average, because the average only uses served entries.

// POST /queues/:queueId/entries/:entryId/skip
export const skipEntry = closeEntry('skipped', ['waiting', 'notified', 'serving'], 'Customer skipped');

export const markNoShow = closeEntry('no_show', ['serving'], 'Marked as no-show');

// PATCH /queues/:queueId/status  -> open, paused or closed
export const setQueueStatus = async (req, res, next) => {
  try {
    const queueId = toId(req.params.queueId);
    if (!queueId) throw new HttpError(400, 'Invalid queue id');

    await getOwnedQueue(pool, queueId, req.merchantId);

    await pool.query('UPDATE queues SET status = ? WHERE id = ?', [req.body.status, queueId]);
    refreshQueue(queueId);
    res.json({ id: queueId, status: req.body.status });
  } catch (err) {
    next(err);
  }
};