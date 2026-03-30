# 投资组合风险分析系统

一个基于 React + Express 的投资组合风险分析工具，帮助投资者实时监控持仓风险、分析行业相关性、评估技术趋势。

![Portfolio Risk Dashboard](https://img.shields.io/badge/Portfolio-Risk%20Analysis-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)

## ✨ 功能特性

### 📊 持仓管理
- **卡片式展示**：按市值大小自适应布局，市值越大卡片越大
- **实时行情**：显示当前价格、涨跌幅、公司Logo
- **颜色标识**：上涨绿色、下跌红色
- **详情弹窗**：点击卡片查看详细技术指标分析

### 📈 技术分析
- **均线分析**：50日/200日均线对比
- **溢出检测**：
  - 🔴 红灯：价格超出双均线上方
  - 🟢 绿灯：价格低于双均线下方
  - 🟡 黄灯：接近上方边界（5%以内）
  - ⚪ 淡绿圆：接近下方边界（5%以内）
- **52周高低位**：显示相对52周高低位的偏离度
- **债券排除**：债券类标的不参与技术指标标识

### 🔄 智能刷新
- **Profile数据**：行业/板块/贝塔值/Logo 每3天自动刷新
- **行情数据**：实时刷新价格/涨跌幅/均线
- **批量刷新**：一键刷新所有持仓
- **单个刷新**：点击卡片刷新按钮单独更新

### 📉 风险分析
- **板块相关性**：基于市场抛售联动组的相关性矩阵
- **行业相关性**：基于细分行业的相关性分析
- **高风险配对**：显示相关系数>0.7的持仓对（支持折叠）
- **Beta分析**：持仓贝塔值分布和加权平均
- **集中度分析**：板块/行业分布饼图

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd portfolio-risk-dashboard
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env` 并配置：
```bash
# FMP API Key (免费版 250次/天)
# 获取地址：https://financialmodelingprep.com/developer/docs/
FMP_API_KEY=your_fmp_api_key_here

# 端口配置（可选）
PORT=3000
```

4. **构建项目**
```bash
npm run build
```

5. **启动服务**
```bash
npm start
```

访问 http://localhost:3000 开始使用。

### 开发模式
```bash
npm run dev
```

## 📖 使用指南

### 添加持仓
1. 在顶部输入框填写：
   - 股票代码（如：AAPL）
   - 持仓股数
   - 成本价
2. 点击「添加」按钮
3. 系统自动从 FMP 获取股票信息

### 刷新行情
- **批量刷新**：点击右上角「刷新行情」按钮
- **单个刷新**：进入编辑模式，点击卡片左上角刷新按钮

### 编辑持仓
1. 点击「编辑」按钮进入编辑模式
2. **修改**：点击卡片右下角编辑图标，修改股数/成本价
3. **删除**：点击卡片右上角删除图标，确认后删除
4. 编辑完成后点击「完成」退出编辑模式

### 查看分析
- **技术趋势**：点击持仓卡片查看详细技术指标
- **风险分析**：页面下方展示相关性矩阵、Beta分析、集中度分析

## 🏗️ 项目架构

```
portfolio-risk-dashboard/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── HoldingsInput.tsx      # 持仓管理
│   │   │   ├── TechnicalAnalysis.tsx  # 技术分析
│   │   │   ├── CorrelationMatrix.tsx  # 相关性矩阵
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── analysis.ts # 分析引擎
│   │   └── pages/
│   │       └── dashboard.tsx
├── server/                 # 后端代码
│   ├── fmpData.ts         # FMP API 集成
│   ├── storage.ts         # 数据存储（JSON）
│   ├── routes.ts          # API 路由
│   └── stockMeta.ts       # 股票元数据
├── shared/                 # 共享类型
│   └── schema.ts          # 数据模型
├── data/                   # 用户数据（Git忽略）
│   └── holdings.json      # 持仓数据
└── dist/                   # 构建输出
```

## 🔌 API 接口

### 持仓管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/holdings` | 获取所有持仓 |
| POST | `/api/holdings` | 添加新持仓 |
| PUT | `/api/holdings/:id` | 更新持仓 |
| DELETE | `/api/holdings/:id` | 删除持仓 |
| POST | `/api/holdings/:id/refresh` | 刷新单个持仓 |
| POST | `/api/refresh` | 批量刷新所有持仓 |

### 状态检查
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/status` | 检查 FMP API 状态 |

## 🔧 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**：Express + TypeScript
- **图表**：Recharts
- **数据获取**：TanStack Query
- **数据源**：Financial Modeling Prep (FMP) API

## 📝 数据说明

### 本地存储
- 持仓数据保存在 `data/holdings.json`
- 该文件已被 `.gitignore` 排除，不会提交到 Git

### FMP API 限制
- **免费版**：250 次/天
- **Profile数据**：industry/sector/beta/logo 每3天刷新一次
- **Quote数据**：价格/涨跌幅/均线实时刷新

## 🐛 常见问题

### Q: 添加股票后价格显示为0？
A: 检查 FMP_API_KEY 是否配置正确，或该股票是否在 FMP 数据库中。

### Q: 行业分布图显示 "Unknown"？
A: 点击「刷新行情」更新数据，首次添加可能尚未获取到行业信息。

### Q: 如何更新 Profile 数据？
A: Profile 数据（industry/sector/beta/logo）每3天自动更新，或删除后重新添加股票。

## 📄 许可证

MIT License

## 🙏 致谢

- [Financial Modeling Prep](https://financialmodelingprep.com/) 提供实时金融数据
- [shadcn/ui](https://ui.shadcn.com/) 提供精美的 UI 组件
