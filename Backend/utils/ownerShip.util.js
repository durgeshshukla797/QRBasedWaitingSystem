import { HttpError } from "./httpsError.util.js";

// Returns the queue only if it belongs to this merchant, otherwise throws 404.
// `db` can be the pool or a transaction connection.
export const getOwnedQueue=async(db,queueId,merchantId,{forUpdate=false}={})=>{
    const [rows]=await db.query(
      `select q.id,q.name,q.status,q.avg_service_min
      from queues q
      JOIN shops s ON q.shop_id=s.id
      where q.id=? AND s.merchant_id=?
      ${forUpdate ? 'FOR UPDATE': ''}
      `,
      [queueId,merchantId]
    );

    if(!rows[0]) throw new HttpError(404,'Queue not found');
    return rows[0];
}

//Every new action calls getOwnedQueue first.
//Later, when staff accounts arrive, this is the single function you change.