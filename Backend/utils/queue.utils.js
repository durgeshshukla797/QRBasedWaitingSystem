export const ACTIVE_STATUSES=['waiting','notified','serving'];

// how mnay active people have a smaller token than this one

export const countAhead=async (db,queueId,tokenNo)=>{
  const [rows]=await db.query(
    `select count(*) as ahead from queue_entries 
       where queue_id=? 
       AND status IN ('waiting', 'notified', 'serving') 
       AND token_no < ?`,
    [queueId,tokenNo]
  );
  return rows[0].ahead;
}
 