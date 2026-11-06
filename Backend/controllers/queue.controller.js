import QRcode from 'qrcode';
import pool from "../db/db.js";
import { makeSlug } from "../utils/slug.util.js";
import { toId } from '../utils/id.util.js';
import { getOwnedQueue } from '../utils/ownerShip.util.js';
import { HttpError } from '../utils/httpsError.util.js';
import { refreshQueue } from '../jobs/notifier.js';


export const createQueue=async(req,res,next)=>{
  try {
    const shopId=toId(req.params.shopId);
    if(!shopId) return res.status(400).json({message:'Invalid shop id'});

    //owenership check:does this shop belong to the logged-in merchant
    const [shops]=await pool.query(
      'select id from shops where id=? and merchant_id=?',
      [shopId,req.merchantId]
    );

    //if query does not return any row that means the shop is not owned by the merchant
    if(!shops[0]){
      return res.status(404).json({message:'Shop not found'});
    }
    
    const {name,avgServiceMin}=req.body;

    // retry a few times in the rare case the random slug already exists
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = makeSlug(name);
      try {
        const [result] = await pool.query(
          'INSERT INTO queues (shop_id, name, slug, avg_service_min) VALUES (?, ?, ?, ?)',
          [shopId, name, slug, avgServiceMin]
        );
        return res.status(201).json({
          id: result.insertId,
          shopId,
          name,
          slug,
          status: 'open',
          avgServiceMin,
        });
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
      }
    }
    return res.status(500).json({ message: 'Could not generate a unique queue link, try again' });
    
  } catch (error) {
    next(error);
  }
}

export const getShopQueues=async(req,res,next)=>{
   try {  
    const shopId=toId(req.params.shopId);
    if(!shopId) return res.status(400).json({message:'Invalid shop id'});

    const [rows]=await pool.query(
      'select q.id,q.name,q.slug,q.status,q.avg_service_min AS avgServiceMin from queues q JOIN shops s ON s.id=q.shop_id where q.shop_id=? AND s.merchant_id=?',
      [shopId,req.merchantId]
    );
    return res.json(rows);
   } catch (error) {
    next(error);
   }
}


export const getQueueQr=async(req, res,next)=>{
  try {
    const queueId=toId(req.params.queueId);
    if(!queueId) return res.status(400).json({message:'Invalid queue id'});
    
    const [rows]=await pool.query(
      'select q.slug, q.name from queues q JOIN shops s ON q.shop_id=s.id where q.id=? AND s.merchant_id=?',
      [queueId,req.merchantId]
    );

    const queue=rows[0];
    if(!queue) return res.status(404).json({message:'Queue not found'});

    const url=`${process.env.APP_URL}/q/${queue.slug}`;
    const png=await QRcode.toBuffer(url,{width:600,margin:2});

    res.type('png');
    if(req.query.download==='1'){
      res.setHeader('Content-Disposition', `attachment; filename="${queue.slug}.png"`);
    }

    res.send(png);

  } catch (error) {
    next(error);
  }
}

export const deleteQueue = async (req, res, next) => {
  try {
    const queueId = toId(req.params.queueId);
    if (!queueId) return res.status(400).json({ message: 'Invalid queue id' });

    // ownership check: the queue must belong to one of this merchant's shops
    const [rows] = await pool.query(
      `SELECT q.id
       FROM queues q
       JOIN shops s ON s.id = q.shop_id
       WHERE q.id = ? AND s.merchant_id = ?`,
      [queueId, req.merchantId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Queue not found' });

    // are customers still in line?
    const [active] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM queue_entries
       WHERE queue_id = ? AND status IN ('waiting', 'notified', 'serving')`,
      [queueId]
    );

    if (active[0].count > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        message: `${active[0].count} customer(s) are still in this queue. Serve or clear them first, or confirm deletion with ?force=true`,
      });
    }

    await pool.query('DELETE FROM queues WHERE id = ?', [queueId]);

    res.json({ message: 'Queue deleted' });
  } catch (err) {
    next(err);
  }
};

//Renaming a queue never changes its slug, so printed QR codes keep working.
//SET ? expands to name = '...', address = '...' and only receives keys from the whitelist above, never raw request input.
export const updateQueue = async (req, res, next) => {
  try {
    const queueId = toId(req.params.queueId);
    if (!queueId) throw new HttpError(400, 'Invalid queue id');

    await getOwnedQueue(pool, queueId, req.merchantId);

    const fields = {};
    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.avgServiceMin !== undefined) fields.avg_service_min = req.body.avgServiceMin;

    await pool.query('UPDATE queues SET ? WHERE id = ?', [fields, queueId]);
    refreshQueue(queueId);

    const [rows] = await pool.query(
      'SELECT id, name, slug, status, avg_service_min AS avgServiceMin FROM queues WHERE id = ?',
      [queueId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};