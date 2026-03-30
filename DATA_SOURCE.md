# 数据源说明

## 关于 FMP 403 错误

**Financial Modeling Prep (FMP)** API 在某些地区（如中国大陆）可能会返回 **HTTP 403** 错误，这是因为：

1. **地理限制**：FMP 可能限制某些国家/地区的访问
2. **API Key 无效**：免费版 API Key 可能有使用限制
3. **网络限制**：某些网络环境可能无法访问 FMP 服务器

## 自动回退机制

当 FMP 返回 403 或任何错误时，系统会自动回退到备选数据源：

### 数据优先级
1. **FMP** (首选)
   - 提供 PE、EPS、市值、均线等完整数据
   - 需要有效的 API Key
   - 免费版限制：250 次/天

2. **Yahoo Finance** (备选)
   - 提供基础价格、名称数据
   - 大部分地区可访问
   - 不提供 PE、均线等高级数据

3. **内置元数据** (最终回退)
   - 提供板块、贝塔值等静态数据
   - 价格显示为 0，需要手动刷新

## 如何配置 FMP API Key

1. 访问 https://financialmodelingprep.com/developer/docs
2. 注册免费账户
3. 获取 API Key
4. 在 `.env` 文件中设置：
   ```
   FMP_API_KEY=your_actual_api_key_here
   ```

## 检查数据源状态

访问 `/api/status` 可以检查 FMP API 的可用性：

```json
{
  "fmp": {
    "available": false,
    "reason": "Region blocked (403)"
  },
  "timestamp": "2026-03-29T..."
}
```

## UI 指示器

持仓列表标题会显示当前数据源：

- 🟢 **FMP** - 使用 Financial Modeling Prep 完整数据
- 🟡 **备选数据** - 使用 Yahoo Finance 或内置数据（不含 PE、均线）

## 技术影响

当使用备选数据源时：

| 功能 | FMP 数据源 | 备选数据源 |
|------|-----------|-----------|
| 实时价格 | ✅ | ✅ |
| PE 市盈率 | ✅ | ❌ (显示为 --) |
| 50/200日均线 | ✅ | ❌ (显示为 --) |
| 市值 | ✅ | ❌ (显示为 --) |
| 52周高低点 | ✅ | ❌ (显示为 0) |
| 技术分析 | ✅ | ⚠️ 部分可用 |

## 推荐方案

对于中国大陆用户：

1. **使用 VPN/代理**：配置后可以正常访问 FMP
2. **升级到付费 API**：部分付费 API 对地区限制较少
3. **接受备选数据**：Yahoo Finance 提供的价格数据通常足够日常使用
4. **手动输入 PE**：对于价值投资分析，可以手动输入 PE 数据

## 相关链接

- FMP 官网：https://financialmodelingprep.com
- FMP API 文档：https://site.financialmodelingprep.com/developer/docs
- 免费版限制：https://site.financialmodelingprep.com/pricing-plans
