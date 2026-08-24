const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const data = require('../data');

const upload = multer({ dest: path.join(__dirname, '..', 'public', 'uploads') });

function requireAdmin(req, res, next) {
  if (res.locals.user && res.locals.user.role === 'admin') return next();
  res.redirect('/admin/login');
}

// 仪表盘
router.get('/', requireAdmin, (req, res) => {
  const videos = data.getVideos();
  const allOrders = data.getOrders();
  const paid = allOrders.filter(o => o.status === 'paid');
  const income = paid.reduce((s, o) => s + (o.amount || 0), 0);
  const usersMap = {}; data.getUsers().forEach(u => { usersMap[u.id] = u.username; });
  const orders = allOrders.map(o => ({ ...o, userName: usersMap[o.userId] || o.userId }));
  res.render('admin/index', { videos, orders, paidCount: paid.length, income });
});

// 视频管理
router.get('/videos', requireAdmin, (req, res) => {
  res.render('admin/videos', { videos: data.getVideos() });
});

router.post('/videos', requireAdmin, upload.single('coverFile'), (req, res) => {
  const { title, desc, videoUrl, price } = req.body;
  const cover = req.file ? '/uploads/' + req.file.filename : '';
  const videos = data.getVideos();
  videos.push({
    id: 'v_' + Date.now(), title, desc, cover,
    videoUrl: videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
    price: parseFloat(price) || data.getSettings().price, createdAt: Date.now(),
  });
  data.saveVideos(videos);
  res.redirect('/admin/videos');
});

router.post('/videos/:id/delete', requireAdmin, (req, res) => {
  data.saveVideos(data.getVideos().filter(v => v.id !== req.params.id));
  res.redirect('/admin/videos');
});

// 订单管理
router.get('/orders', requireAdmin, (req, res) => {
  const orders = data.getOrders().sort((a, b) => b.createdAt - a.createdAt);
  const users = data.getUsers(); const videos = data.getVideos();
  const enriched = orders.map(o => ({
    ...o,
    user: users.find(u => u.id === o.userId),
    video: videos.find(v => v.id === o.videoId),
  }));
  res.render('admin/orders', { orders: enriched });
});

// 后台手动将订单标记为已支付（收到转账后操作）
router.post('/orders/:id/mark-paid', requireAdmin, (req, res) => {
  const orders = data.getOrders();
  const o = orders.find(x => x.id === req.params.id);
  if (o) { o.status = 'paid'; o.paidAt = Date.now(); data.saveOrders(orders); }
  res.redirect('/admin/orders');
});

// 设置
router.get('/settings', requireAdmin, (req, res) => {
  res.render('admin/settings', { settings: data.getSettings(), err: null });
});

router.post('/settings', requireAdmin, upload.single('qrFile'), (req, res) => {
  const settings = data.getSettings();
  if (req.body.siteName) settings.siteName = req.body.siteName;
  if (req.body.price) settings.price = parseFloat(req.body.price);
  if (req.file) settings.wechatQr = '/uploads/' + req.file.filename;
  data.saveSettings(settings);
  res.redirect('/admin/settings');
});

// 修改密码
router.post('/change-password', requireAdmin, (req, res) => {
  const { oldPwd, newPwd } = req.body;
  const bcrypt = require('bcryptjs');
  const users = data.getUsers();
  const u = users.find(x => x.id === res.locals.user.id);
  if (!u || !bcrypt.compareSync(oldPwd, u.passwordHash)) {
    return res.render('admin/index', { err: '原密码错误', videos: data.getVideos(), orders: data.getOrders(), paidCount: 0, income: 0 });
  }
  u.passwordHash = bcrypt.hashSync(newPwd, 8); data.saveUsers(users);
  res.redirect('/admin?pwd=1');
});

module.exports = router;
