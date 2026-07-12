# AI 配置平台

基于 LangGraph 的低代码 AI 助手，支持自然语言生成和修改 JSON Schema。

## 项目结构

```
low-code-ai/
├── packages/
│   ├── server/          # Agent 后端服务
│   ├── sdk-core/        # 核心 SDK（无 UI）
│   ├── sdk-react/       # React 组件 SDK
│   └── app-demo/        # 演示应用
├── docs/                # 技术方案文档
└── 配置文件
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动服务

```bash
# 启动所有服务
pnpm dev

# 或者单独启动后端
cd packages/server && pnpm dev

# 或者单独启动 demo
cd packages/app-demo && pnpm dev
```

## 功能特性

- 🤖 **AI 驱动配置** - 自然语言生成和修改 JSON Schema
- 🔧 **智能工具** - 支持 read_schema、locate_node、query_component_meta 等工具
- 🛡️ **Guardrail 防护** - 四层校验体系（语法/结构/业务/自修复）
- 🔄 **增量修改** - 优先使用 JSON Patch 而非全量重写
- 📦 **模块化设计** - 支持多平台通过适配器接入

## 使用示例

### 后端 API

```bash
# 创建会话
POST /v1/sessions
{ "schema": {...} }

# 发送消息（SSE 流式返回）
POST /v1/sessions/{id}/messages
{ "message": "添加一个手机号字段，必填" }

# 应用修改
POST /v1/sessions/{id}/apply
{ "patches": [...] }
```

### 前端 SDK

```tsx
import { AIConfigPanel } from '@ai-config/sdk-react';

function App() {
  const [schema, setSchema] = useState(initialSchema);
  
  return (
    <AIConfigPanel
      platformId="demo"
      getCurrentSchema={() => schema}
      onPatchApplied={(newSchema) => setSchema(newSchema)}
    />
  );
}
```

## 技术栈

- **后端**: Hono + LangGraph + DeepSeek
- **前端**: React + Vite
- **Schema 处理**: AJV + JSON Patch
- **Monorepo**: Turborepo + pnpm workspaces

## License

MIT
