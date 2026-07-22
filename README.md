# 课程报名系统 - Cloudflare Pages 部署指南

> KV namespace 已绑定，触发重部署以激活。

## 方案说明

之前使用 JSONBlob 免费存储时，浏览器 POST/PUT 请求会触发 CORS 预检（OPTIONS），但 JSONBlob 对该请求返回 404，导致「保存失败: Failed to fetch」。

本方案改用 **Cloudflare Pages + Functions + KV**，完全免费、国内访问快、支持真正的跨设备实时同步。

| 项目 | 内容 |
|---|---|
| 前端报名页 | `https://<你的项目>.pages.dev/` |
| 管理后台 | `https://<你的项目>.pages.dev/admin` |
| 数据 API | `https://<你的项目>.pages.dev/api/data` |
| 数据存储 | Cloudflare KV（免费 1GB） |
| 管理密码 | 默认 `admin`，可在 `functions/api/data.js` 中修改 |

---

## 部署步骤（约 5 分钟）

### 1. 注册/登录 Cloudflare

打开 https://dash.cloudflare.com/sign-up
使用邮箱注册并登录（支持国内邮箱）。

### 2. 创建 Pages 项目

1. 在左侧菜单点击 **Pages**
2. 点击 **Create a project**
3. 选择 **Upload assets**（直接上传静态文件）
4. 项目名可填 `course-selector`（会生成 `course-selector.pages.dev`）

### 3. 上传文件

把 `cf-pages` 文件夹里的所有文件拖到上传区域：

```
cf-pages/
├── index.html          ← 前端报名页
├── admin.html          ← 管理后台
└── functions/
    └── api/
        └── data.js     ← 数据 API
```

上传后点击 **Deploy site**。

### 4. 绑定 KV 存储（关键步骤）

第一次部署后，API 还无法写入数据，需要绑定 KV：

1. 进入 Pages 项目的 **Settings** → **Functions** → **KV namespace bindings**
2. 点击 **Add binding**
3. 填写：
   - **Variable name**: `COURSE_DATA`（必须完全一致）
   - **KV namespace**: 选择已有的或点击 **Create a namespace** 新建一个（例如 `course-selector-data`）
4. 点击 **Save**
5. 回到 **Deployments**，点击 **Create deployment**，重新上传一次文件（或点击 **Retry deployment**）

### 5. 访问系统

部署完成后，Pages 会给一个域名，例如：

- 报名页：`https://course-selector.pages.dev/`
- 管理后台：`https://course-selector.pages.dev/admin`

管理后台默认密码：`admin`

---

## 修改管理密码

打开 `functions/api/data.js`，找到：

```js
const ADMIN_PW = '你的密码';
```

把 `'admin'` 改成你要的密码，保存后重新上传文件并重新部署。

---

## 常见问题

### Q: 管理后台保存后提示 KV write failed？
A: 说明 KV binding 没有绑定成功。请检查 Variable name 必须是 `COURSE_DATA`，且已重新部署。

### Q: 如何清空所有数据？
A: 进入管理后台 → 配置 → 点击「恢复默认」。所有课程、名称、容量、报名记录将重置为初始状态。

### Q: 如何导出报名数据？
A: 管理后台 → 导出 → 复制数据 或 导出 CSV。

---

## 本地预览（可选）

如果你想在本地测试 Pages Functions，需要安装 Wrangler CLI：

```bash
npm install -g wrangler
wrangler login
wrangler pages dev cf-pages
```

然后访问 http://localhost:8788/
