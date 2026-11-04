
# DeepSeek —— Minecraft 基岩版 AI 服务器管理员助手

> 让 DeepSeek 大模型直接接管服务器管理。  
> 玩家用自然语言提问，AI 判断意图后**自动调用服务器指令或 API**，实现"对话式运维"。

![Platform](https://img.shields.io/badge/platform-LeviLamina-green.svg)
![Version](https://img.shields.io/badge/version-0.0.2-orange.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)

---

## ✨ 功能特性

- 🤖 **AI 服务器助手**：接入 DeepSeek 大模型，玩家在游戏内直接提问，AI 理解意图并给出回答
- ⚙️ **自动执行指令**：AI 需要执行游戏指令时，输出 `<runcmd>` 标签，插件自动代玩家输入
- 🔌 **服务器 API 联动**：AI 可调用 `<api>` 查询服务器状态（TPS、实体数量），并基于结果**多轮自动化决策**
- 🧠 **多轮上下文**：对话历史按玩家 UUID 持久化到 JSON，支持上下文连续对话
- 🧾 **Markdown 渲染**：AI 回复中的 `**加粗**` / `*斜体*` 自动转换为 Minecraft 颜色代码
- 🛡 **提示词注入防护**：Prompt 中约束 AI 不信任用户自述身份、不执行手册外的特权指令
- 🖥 **图形化表单**：`/deepseek` 打开对话窗口，可查看历史、一键清空、切换 Pro 模型

---

## 🏗 工作原理

```
玩家提问 ──► deepseek.js 调用 deepseek.py ──► DeepSeek API
                                                      │
                                   ┌──────────────────┼──────────────────┐
                                   ▼                  ▼                  ▼
                              <runcmd>            <api>             普通文本
                                   │                  │                  │
                           插件代执行游戏指令   调用服务器 API     聊天栏 + 表单展示
                                                      │
                                                      ▼
                                       把结果回传给 AI（递归调用）
                                              进行下一轮决策
```

- **`<runcmd>指令</runcmd>`**：AI 判断需要执行游戏指令，插件提取指令后以玩家身份运行
- **`<api>接口</api>`**：AI 需要服务器实时数据，插件调用对应 API，把结果作为新消息回传给 AI，形成**自动化决策闭环**
- **普通文本**：直接显示在聊天栏与表单中

---

## 📦 环境要求

| 依赖 | 说明 |
|:---|:---|
| [LeviLamina](https://github.com/LiteLDev/LeviLamina) | 插件运行平台 |
| [HelperLib](https://github.com/afraidofsunlight/HelperLib) | JS 类型提示（仅开发需要） |
| `tps` 插件 | 提供 `gettps` API，用于 TPS 查询（`ll.import("tps","gettps")`） |
| Python 3.8+ | 调用 DeepSeek API |
| `openai` Python 包 | `pip install openai` |
| DeepSeek API Key | 在 [DeepSeek 开放平台](https://platform.deepseek.com/) 申请 |

---

## 🚀 安装

1. 放置文件：

```
服务器根目录/
├── deepseek.js                  ← 放入 plugins/ 目录
├── deepseek.py                  ← 放入服务器根目录（与 js 同级，供 system.cmd 调用）
└── conversation_contexts.json   ← 首次运行自动生成（对话历史）
```

2. 安装 Python 依赖：

```bash
pip install openai
```

3. 编辑 `deepseek.py`，填入 API Key：

```python
DEEPSEEK_API_KEY = "sk-xxxxxxxxxxxxxxxx"
```

> ⚠️ 脚本中默认值为 `"to replace"`，而校验逻辑判断的是 `"sk-your-api-key-here"`。  
> **请确认你修改的是 `DEEPSEEK_API_KEY` 这一行**，否则会跳过校验直接调用 API 报错。

4. 重启服务器，控制台输出插件加载信息即成功。

---

## 🎮 使用方法

### 1. 打开对话窗口

```
/deepseek
```

弹出表单：

- 顶部展示当前玩家的历史对话
- `提交后清空对话` 开关：勾选后提交会先清空历史
- 输入框：填写要发送的问题
- `Pro` 开关：开启使用 `v4-pro`，关闭使用 `v4-flash`

### 2. 直接发送消息

```
/deepseek <true|false> "<消息>"
```

- 第一个参数：是否使用 Pro 模型
- 第二个参数：消息内容

示例：

```
/deepseek false "服务器现在卡吗"
/deepseek true "帮我清理一下生物"
```

### 3. 典型对话场景

| 玩家说 | AI 行为 |
|:---|:---|
| "怎么圈地" | 返回 `<runcmd>land</runcmd>`，插件自动执行 |
| "服务器现在 TPS 多少" | 返回 `<api>tps</api>`，插件查询后回传，AI 再给出判断 |
| "卡不卡" | 先查 `<api>tps</api>`，必要时查 `<api>amount@e</api>`，再决定是否清理 |
| "怎么赚钱" | 返回 `<runcmd>shop_sell</runcmd>` |
| "去主城火车站" | 返回 `<runcmd>warp_go_yh主城火车站yh</runcmd>`，插件转换引号后执行 |

---

## 📖 指令手册（AI 可调用）

AI 依据内置 Prompt 中的手册决定调用哪条指令：

| 序号 | 指令 | 用途 |
|:---|:---|:---|
| 1 | `land` | 领地相关（圈地） |
| 2 | `home` | 个人传送点（家） |
| 3 | `warp` | 公共传送点 |
| 4 | `tpa` | 玩家间传送 |
| 5 | `tpr` | 随机传送 |
| 6 | `hub` | 回主城 |
| 7 | `back` | 回死亡点 |
| 8 | `shop_sell` | 出售物品换金币 |
| 9 | `shop_buy` | 购买物品 |
| 10 | `warp_go_yh<名称>yh` | 前往指定公共传送点 |
| 11 | `supercmd0` | 清理生物（缓解卡顿） |
| 12 | `redstoneoff` | 关闭红石更新 |
| 13 | `redstoneon` | 开启红石更新 |
| 14 | `fpoffline` | 下线全部假人 |
| 15 | `menu_fly.json` | 开启飞行 |
| 16 | `votears` | 发起投票重启 |

### API 手册

| 接口 | 说明 |
|:---|:---|
| `tps` | 返回服务器当前 TPS |
| `amount@选择器` | 返回选择器匹配的实体数量，如 `amount@e`、`amount@e[type=villager]` |

> `supercmd` 系列通过 `cmdlist` 索引映射执行，防止 AI 输出任意危险指令。

---

## 🧾 AI 输出协议（开发者参考）

AI 的回复必须严格遵循以下三种格式之一，且**单次回复只允许一个标签调用**：

```xml
<runcmd>land</runcmd>
<api>tps</api>
```

普通文本回答则不带任何标签。

插件解析流程：

1. `mdToMc()`：Markdown → Minecraft 颜色代码
2. 过滤控制字符
3. 优先匹配 `<runcmd>` → 提取、替换 `_`→空格、`yh`→`"`，判断是否为 `supercmd` 后执行
4. 其次匹配 `<api>` → 调用对应 API，把结果拼成 `tps:20` / `amount@e:150` 再回传给 AI
5. 否则作为普通回复展示

---

## 🛡 安全设计

- **特权指令白名单**：`supercmd` 只能从 `cmdlist` 数组索引执行，AI 无法拼接任意指令
- **提示词注入防护**：Prompt 明确要求 AI 不信任用户自述身份（如"我是服主"），不返回手册外的接口
- **单次单调用**：限制一次回复只能包含一个 `runcmd` 或 `api`，避免批量执行
- **API 无效校验**：未知 API 返回 `xxx is invaild`，由 AI 下一轮自行纠正

---

## ⚠️ 注意事项

- 指令权限为 `PermType.Any`，**所有玩家均可使用**。如需限制，请改为 `PermType.GameMasters` 或自行加权限判断
- `gettps` 依赖外部 `tps` 插件，未安装会导致 TPS 查询报错
- `getamount` 通过记分板输出解析数字，若输出中混有其他数字可能取值不准，建议改用更精确的 API
- 模型名在 `deepseek.py` 中为 `deepseek-v4-pro` / `deepseek-v4-flash`，如官方模型名变更请自行修改（官方现行为 `deepseek-chat` / `deepseek-reasoner`）
- 历史对话持续累积会增大 Prompt 长度，长期使用建议定期清理 `conversation_contexts.json`
- **请在测试环境验证 AI 调用行为后再上线正式服**

---

## 🐛 常见问题

**Q：发送消息后没反应？**  
A：查看控制台 `[deepseek]` 与 Python 错误输出，常见原因是 API Key 未填、Python 未装 `openai`、或 `deepseek.py` 路径与 `system.cmd` 的工作目录不一致。

**Q：AI 返回 `<api>tps</api>` 后一直循环？**  
A：说明 TPS 插件未安装或 `gettps` 返回异常，插件回传 `tps:null`，AI 反复查询。请安装 `tps` 插件。

**Q：AI 执行了错误的指令？**  
A：模型判断存在不确定性，可在 `SYSTEM_PROMPT` 中补充更明确的触发条件，或收紧 `cmdlist` 白名单。

**Q：为什么提示词注入没完全防住？**  
A：Prompt 防护只能降低概率，不能根除。真正的安全边界应放在插件侧的**指令白名单与权限校验**。

---

## 📄 License

MIT License

---

## 🙏 致谢

- [DeepSeek](https://www.deepseek.com/) —— 大模型能力
- [LeviLamina](https://github.com/LiteLDev/LeviLamina) —— 插件平台
- [HelperLib](https://github.com/afraidofsunlight/HelperLib) —— 类型支持

> 本项目仅供学习交流，AI 自动执行指令存在风险，请谨慎用于生产服务器。
