const router = require('express').Router();
const data = require('../data');

// 创建订单（未登录不可下单）
router.post('/order/:videoId', (req, res) => {
  if (!res.locals.user) return res.status(401).json({ ok: false, msg: '请先登录' });
  const v = data.findVideoById(req.params.videoId);
  if (!v) return res.status(404).json({ ok: false, msg: '视频不存在' });
  let order = data.findOrderByUserVideo(res.locals.user.id, v.id);
  if (order && order.status === 'paid') return res.json({ ok: true, alreadyPaid: true });
  const orders = data.getOrders();
  if (!order) {
    order = {
      id: 'o_' + Date.now(),
      userId: res.locals.user.id, videoId: v.id, amount: v.price || data.getSettings().price,
      status: 'pending', createdAt: Date.now(), paidAt: null,
    };
    orders.push(order);
  } else {
    order.status = 'pending';
  }
  data.saveOrders(orders);
  res.json({ ok: true, orderId: order.id, amount: order.amount });
});

// 观众确认"我已支付" —— 真实场景应改为支付平台 webhook 自动回调
// 此处为演示：标记订单 paid（实际部署建议人工在后台审核或对接官方支付）
router.post('/order/:orderId/confirm-paid', (req, res) => {
  if (!res.locals.user) return res.status(401).json({ ok: false, msg: '请先登录' });
  const orders = data.getOrders();
  const o = orders.find(x => x.id === req.params.orderId && x.userId === res.locals.user.id);
  if (!o) return res.status(404).json({ ok: false, msg: '订单不存在' });
  o.status = 'paid'; o.paidAt = Date.now();
  data.saveOrders(orders);
  res.json({ ok: true });
});

// 查询订单状态
router.get('/order/:orderId', (req, res) => {
  if (!res.locals.user) return res.status(401).json({ ok: false });
  const o = data.getOrders().find(x => x.id === req.params.orderId);
  if (!o) return res.status(404).json({ ok: false });
  res.json({ ok: true, status: o.status });
});

// 视频流（鉴权：仅已付费或管理员可看）
router.get('/video/:id/stream', (req, res) => {
  const v = data.findVideoById(req.params.id);
  if (!v) return res.status(404).end('视频不存在');
  const user = res.locals.user;
  let allowed = false;
  if (user && user.role === 'admin') allowed = true;
  if (user) {
    const o = data.findOrderByUserVideo(user.id, v.id);
    if (o && o.status === 'paid') allowed = true;
  }
  if (!allowed) return res.status(403).send('尚未付费，无法播放');
  // 代理远程视频
  if (/^https?:\/\//.test(v.videoUrl)) {
    return res.redirect(v.videoUrl);
  }
  res.redirect(v.videoUrl); // 本地路径
});

module.exports = router;
