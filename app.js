const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const data = require('./data');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

data.init();

const app = express();
const PORT = process.env.PORT || 3000;

// 👇 从这里开始是你即将粘贴的新代码 👇
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// 👆 新代码粘贴到这里结束 👆

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  name: 'vpsid',
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

// 当前用户信息注入模板
app.use((req, res, next) => {
  res.locals.user = null;
  if (req.session.userId) {
    const u = data.findUserById(req.session.userId);
    if (u) res.locals.user = { id: u.id, username: u.username, role: u.role };
  }
  res.locals.settings = data.getSettings();
  next();
});

app.use('/', authRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// 前台首页
app.get('/', (req, res) => {
  const videos = data.getVideos().sort((a, b) => b.createdAt - a.createdAt);
  res.render('index', { videos });
});

// 视频详情/观看页
app.get('/video/:id', (req, res) => {
  const v = data.findVideoById(req.params.id);
  if (!v) return res.status(404).render('error', { msg: '视频不存在' });
  let paid = false;
  if (res.locals.user) {
    const order = data.findOrderByUserVideo(res.locals.user.id, v.id);
    paid = order && order.status === 'paid';
  }
  res.render('video', { video: v, paid });
});

// 登录页
app.get('/login', (req, res) => {
  if (res.locals.user) return res.redirect('/');
  res.render('login', { err: null });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { msg: '服务器内部错误' });
});

app.listen(PORT, () => console.log(`视频网站已启动: http://localhost:${PORT}`));
