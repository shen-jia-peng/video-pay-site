const router = require('express').Router();
const bcrypt = require('bcryptjs');
const data = require('../data');

// 观众注册
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect('/login');
  if (data.findUserByUsername(username)) return res.render('login', { err: '用户名已存在' });
  const users = data.getUsers();
  users.push({
    id: 'u_' + Date.now(),
    username, passwordHash: bcrypt.hashSync(password, 8), role: 'user', createdAt: Date.now(),
  });
  data.saveUsers(users);
  res.redirect('/login?registered=1');
});

// 登录（观众 + 管理员共用，按 role 区分）
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const u = data.findUserByUsername(username);
  if (!u || !bcrypt.compareSync(password, u.passwordHash)) {
    return res.render('login', { err: '账号或密码错误' });
  }
  req.session.userId = u.id;
  req.session.role = u.role;
  if (u.role === 'admin') return res.redirect('/admin');
  res.redirect('/');
});

// 管理员登录页（也可复用 /login）
router.get('/admin/login', (req, res) => {
  if (res.locals.user && res.locals.user.role === 'admin') return res.redirect('/admin');
  res.render('admin/login', { err: null });
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const u = data.findUserByUsername(username);
  if (!u || u.role !== 'admin' || !bcrypt.compareSync(password, u.passwordHash)) {
    return res.render('admin/login', { err: '管理员账号或密码错误' });
  }
  req.session.userId = u.id;
  req.session.role = 'admin';
  res.redirect('/admin');
});

router.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/')); });

module.exports = router;
