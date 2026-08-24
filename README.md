# 付费视频网站

观众前台 + 管理员后台一体的付费观看视频站点。观众点击视频 → 弹出**微信个人收款码** → 扫码支付 → 管理员后台核实收款并标记"已支付" → 观众解锁观看。

## 默认账号
- 管理员：`admin` / `admin123`（首次登录后请到"站点设置"修改密码）
- 观众：在 `/login` 页面注册任意账号

## 本地运行
```
npm install
node app.js
# 访问 http://localhost:3000   后台 http://localhost:3000/admin
```

## 目录结构
- `app.js` 主应用入口
- `data.js` JSON 文件存储（users/videos/orders/settings）
- `routes/` auth(登录注册) / api(订单/视频流鉴权) / admin(后台)
- `views/` EJS 模板（前台 + admin/ 后台）
- `public/` 静态资源（默认微信收款码 wechat-qr.png、上传目录 uploads/）

## 公网部署（推荐 Railway，免信用卡可试用）
1. 注册 https://railway.app （可用 GitHub 账号授权登录，无需信用卡，新用户有免费额度）。
2. 在 GitHub 新建仓库，将本项目文件推送上去（需含 `package.json`/`Procfile`）。
3. Railway 控制台 → New Project → Deploy from GitHub repo → 选该仓库。
4. Railway 自动识别 Node.js，安装依赖并以 `node app.js` 启动；它会注入 `PORT` 环境变量。
5. 部署完成后 Railway 分配一个 `xxx.up.railway.app` 域名，点击即可访问前台；`/admin` 进入后台。
6. 首次登录 admin/admin123，到"站点设置"确认/重新上传微信收款码、修改默认密码。

### 备选：Render（免费层）
- 注册 https://render.com → New Web Service → 关联 GitHub 仓库。
- Build Command: `npm install` / Start Command: `node app.js` / 环境变量 `PORT` 由平台注入。
- 分配 `xxx.onrender.com` 域名。

### 自有云服务器（腾讯云/阿里云轻量）
- 购买轻量应用服务器（约 50 元/月起，选 Ubuntu 22.04）。
- 登录服务器：`curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs`。
- 上传项目：`scp -r ./* root@你的服务器IP:/root/video-pay-site/`，或 `git clone` 后 `npm install`。
- 安装 pm2：`sudo npm i -g pm2` → `pm2 start app.js --name video` → `pm2 save && pm2 startup`。
- 放行防火墙 3000 端口（轻量控制台"防火墙"添加 TCP 3000 规则）。
- 此时可通过 `http://服务器IP:3000` 访问。
- （推荐）绑定域名 + HTTPS：在域名服务商将域名 A 记录指向服务器 IP；安装 Nginx 反代 3000 端口并配置 Let's Encrypt 证书（Certbot），即可 `https://你的域名` 访问。

## 说明
- 当前使用**个人微信收款码 + 人工核实**：观众扫码转账后，管理员在"订单管理"核实并将订单标为"已支付"。适合个人/小流量场景。
- 如需自动化（无需人工确认），须接入**微信支付/支付宝官方支付**（需企业/个体工商户资质 + 商户号），以官方异步回调（webhook）验签为准，替换 `routes/api.js` 中的订单确认逻辑。
- 生产建议：将 JSON 存储迁移到 SQLite/MySQL；视频改临时签名 URL + 防盗链；补充 HTTPS、CSRF 防护与请求限流。
