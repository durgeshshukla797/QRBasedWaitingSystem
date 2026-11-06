import pool from "../db/db.js";

export const createShop = async (req, res, next) => {
  try {
    const { name, address, type, isPublic = true } = req.body;
    const isPublicVal = isPublic !== false ? 1 : 0;
    
    const [result] = await pool.query(
      'INSERT INTO shops(merchant_id,name,address,type,is_public) VALUES(?,?,?,?,?)',
      [req.merchantId, name, address || null, type, isPublicVal]
    );

    return res.status(201).json({
      id: result.insertId,
      name,
      address: address || null,
      type,
      isPublic: Boolean(isPublicVal),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyShops = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, address, type, is_public AS isPublic FROM shops WHERE merchant_id=? ORDER BY id DESC',
      [req.merchantId]
    );
    const formatted = rows.map((r) => ({
      ...r,
      isPublic: Boolean(r.isPublic),
    }));
    return res.json(formatted);
  } catch (error) {
    next(error);
  }
};

//This function toId() takes a value, checks whether it is a positive integer, and returns that integer if valid. Otherwise, it returns null
const toId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const deleteShop = async (req, res, next) => {
  try {
    const shopId = toId(req.params.shopId);
    if (!shopId) return res.status(400).json({ message: 'Invalid shop id' });

    // ownership check
    const [shops] = await pool.query(
      'SELECT id FROM shops WHERE id = ? AND merchant_id = ?',
      [shopId, req.merchantId]
    );
    if (!shops[0]) return res.status(404).json({ message: 'Shop not found' });

    // are customers still in line?
    const [active] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM queue_entries e
       JOIN queues q ON q.id = e.queue_id
       WHERE q.shop_id = ? AND e.status IN ('waiting', 'notified', 'serving')`,
      [shopId]
    );

    if (active[0].count > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        message: `${active[0].count} customer(s) are still in a queue. Serve or clear them first, or confirm deletion with ?force=true`,
      });
    }

    await pool.query('DELETE FROM shops WHERE id = ? AND merchant_id = ?', [
      shopId,
      req.merchantId,
    ]);

    res.json({ message: 'Shop deleted' });
  } catch (err) {
    next(err);
  }
};

export const updateShop = async (req, res, next) => {
  try {
    const shopId = toId(req.params.shopId);
    if (!shopId) return res.status(400).json({ message: 'Invalid shop id' });

    // whitelist: only these columns can ever be changed
    const fields = {};
    for (const key of ['name', 'address', 'type']) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    if (req.body.isPublic !== undefined) {
      fields.is_public = req.body.isPublic ? 1 : 0;
    }

    const [result] = await pool.query(
      'UPDATE shops SET ? WHERE id = ? AND merchant_id = ?',
      [fields, shopId, req.merchantId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Shop not found' });

    const [rows] = await pool.query('SELECT id, name, address, type, is_public AS isPublic FROM shops WHERE id = ?', [shopId]);
    const shop = rows[0];
    if (shop) shop.isPublic = Boolean(shop.isPublic);
    res.json(shop);
  } catch (err) {
    next(err);
  }
};