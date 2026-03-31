# 花粉雷达 / Pollen Forecast

一个面向中国主要城市的花粉浓度可视化应用。项目会抓取第三方花粉指数数据，缓存到 PostgreSQL，再通过 React 地图和趋势图展示当日风险与近期变化，帮助过敏人群更早做好出行防护。

## 项目亮点

- 覆盖 42 个重点城市的花粉风险展示
- 地图分布、城市排行、详情弹窗三种视图联动
- 展示城市近期花粉等级趋势和防护建议
- 后端自带 15 分钟抓取节流，避免频繁请求上游数据接口
- 提供 Dockerfile 与 Fly.io 配置，便于直接部署上线

## 技术栈

- 前端：React 19、TypeScript、Vite、Leaflet、ECharts
- 后端：Bun、Elysia
- 数据库：PostgreSQL
- 部署：Docker、Fly.io

## 项目结构

```text
.
├── backend/
│   └── src/
│       ├── db.ts              # PostgreSQL 连接与表初始化
│       ├── index.ts           # API 与静态资源服务入口
│       └── scraper.ts         # 花粉数据抓取、城市列表、抓取状态
├── frontend/
│   ├── public/                # 图标与静态资源
│   └── src/
│       ├── components/
│       │   ├── CityDetailModal.tsx
│       │   └── Map.tsx
│       ├── App.tsx            # 页面主布局
│       ├── App.css
│       ├── index.css
│       └── main.tsx
├── Dockerfile
├── fly.toml
└── README.md
```

## 工作流程

1. 服务启动后先初始化 PostgreSQL 表结构。
2. 后端触发抓取任务，按城市顺序请求第三方花粉接口。
3. 数据写入 `pollen_data`，并用 `scrape_log` 记录最近一次抓取时间。
4. 前端启动时请求 `/api/cities` 和 `/api/pollen`，渲染地图和城市排行。
5. 页面轮询 `/api/scrape-status`，抓取结束后刷新最新结果。
6. 用户点击城市后，再请求 `/api/pollen/:city` 查看历史趋势。

## 本地开发

### 1. 环境准备

- Bun 1.2+
- PostgreSQL 14+

### 2. 安装依赖

```bash
bun install
bun --cwd frontend install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

然后在 `.env` 中填写数据库连接串：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pollen_forecast
```

### 4. 启动开发环境

后端：

```bash
bun run dev:backend
```

前端：

```bash
bun run dev:frontend
```

默认情况下：

- 前端开发服务器运行在 Vite 默认端口
- 后端 API 运行在 `http://localhost:8080`

## 常用命令

```bash
# 启动后端
bun run dev:backend

# 启动前端
bun run dev:frontend

# 构建前端产物
bun run build

# 启动生产服务
bun run start

# 前端 lint
bun run lint:frontend
```

## 环境变量

| 变量名 | 是否必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接地址，供后端读写抓取数据 |
| `PORT` | 否 | 服务监听端口，默认 `8080` |

## API 概览

- `GET /api/cities`：返回城市基础信息与经纬度
- `GET /api/scrape-status`：返回当前抓取状态和正在抓取的城市列表
- `GET /api/pollen`：返回当天所有已抓取城市的花粉数据
- `GET /api/pollen/:city`：返回指定城市的历史花粉趋势

## 部署说明

### Docker

```bash
docker build -t pollen-forecast .
docker run --env-file .env -p 8080:8080 pollen-forecast
```

镜像会先构建前端，再用 Bun 在容器中启动后端服务。

### Fly.io

仓库已包含 [`fly.toml`](/Users/peterchen/code_hub/pollen-forecast/fly.toml) 和 GitHub Actions 部署工作流，推送到 `main` 后可自动部署到 Fly.io。发布前请先配置：

- `FLY_API_TOKEN`
- Fly 应用中的 `DATABASE_URL`

## 数据来源与免责声明

- 花粉数据当前来自第三方花粉接口 `graph.weatherdt.com`
- 地图底图来源于 [OpenStreetMap](https://www.openstreetmap.org/copyright) 与 [CARTO](https://carto.com/attributions)
- 本项目只对上游数据做抓取、缓存与可视化，不拥有原始气象数据版权
- 页面内容仅供健康防护参考，不构成医疗建议、诊断依据或官方预报
- 如果你准备公开部署，请自行确认上游数据接口的使用条款、抓取频率和再分发权限

## 开源发布前建议

- 补充一个明确的 `LICENSE` 文件。这个仓库目前还没有开源协议，公开前建议尽快补上。
- 根据你的实际身份，把页面底部的版权归属从“项目作者与贡献者”改成你的个人名或组织名。
- 如果要长期运营，建议再补一份截图、更新日志和故障反馈方式，便于别人理解和参与贡献。
