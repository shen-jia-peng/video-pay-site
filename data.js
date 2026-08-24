const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  videos: path.join(DATA_DIR, 'videos.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
};

function load(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function save(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ---------- users ----------
function getUsers() { return load(FILES.users); }
function saveUsers(u) { save(FILES.users, u); }
function findUserByUsername(name) { return getUsers().find(u => u.username === name); }
function findUserById(id) { return getUsers().find(u => u.id === id); }

// ---------- videos ----------
function getVideos() { return load(FILES.videos); }
function saveVideos(v) { save(FILES.videos, v); }
function findVideoById(id) { return getVideos().find(v => v.id === id); }

// ---------- orders ----------
function getOrders() { return load(FILES.orders); }
function saveOrders(o) { save(FILES.orders, o); }
function findOrderByUserVideo(userId, videoId) {
  return getOrders().find(o => o.userId === userId && o.videoId === videoId);
}

// ---------- settings ----------
function getSettings() {
  if (!fs.existsSync(FILES.settings)) {
    return { siteName: '付费视频', price: 9.9, wechatQr: '/wechat-qr.png' };
  }
  return JSON.parse(fs.readFileSync(FILES.settings, 'utf8'));
}
function saveSettings(s) { save(FILES.settings, s); }

// ---------- 初始化默认管理员 ----------
function init() {
  const users = getUsers();
  let admin = users.find(u => u.role === 'admin');
  // 若管理员不存在，或密码哈希缺失/无效，则重建（修复旧数据损坏）
  if (!admin || !admin.passwordHash || admin.passwordHash.length < 20) {
    if (admin) { admin.passwordHash = bcrypt.hashSync('admin123', 8); }
    else users.push({
      id: 'u_admin', username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 8),
      role: 'admin', createdAt: Date.now(),
    });
    saveUsers(users);
    admin = users.find(u => u.role === 'admin');
  }
  // 示例视频（仅当无视频时）
  if (getVideos().length === 0) {
    saveVideos([{
      id: 'v_demo',
      title: '示例付费视频',
      desc: '这是一条示例视频，付费后即可观看。',
      cover: '',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      price: 9.9,
      createdAt: Date.now(),
    }]);
  }
}

module.exports = {
  init,
  getUsers, saveUsers, findUserByUsername, findUserById,
  getVideos, saveVideos, findVideoById,
  getOrders, saveOrders, findOrderByUserVideo,
  getSettings, saveSettings,
};
