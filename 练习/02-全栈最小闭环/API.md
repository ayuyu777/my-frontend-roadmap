# 练习 02 · 全栈最小闭环 — 接口契约

> **先读这份，再写代码。**
> 这份文档本身就是一个练习：真实工作里，前端和后端是**照着契约并行开发**的。
> 你以后做 Agent 时写的 tool schema，本质也是这个东西。

---

## 一、要做什么

一个"设备台账"的最小闭环：

```
浏览器（index.html）
    │  fetch('/api/...')   ← 你写的前端
    ▼
Node 服务器（server.ts）
    │  读写内存数组（先不接数据库）
    ▼
返回 JSON
    │
    ▼
浏览器把 JSON 渲染成列表      ← 你写的前端
```

没有框架、没有依赖、`npm install` 都不用跑。**这样你才能看清最底下发生了什么。**

---

## 二、怎么跑

```powershell
cd "C:\Users\ayu\Desktop\前端\练习\02-全栈最小闭环"
node server.ts
```

看到 `服务已启动: http://localhost:3000` 就成了。

打开 `index.html`（双击即可），它会去请求 `http://localhost:3000`。

> **为什么用 `node server.ts` 而不是 `node server.js`？**
> Node 22.18+ / 24 内置了 TypeScript 类型擦除，可以直接跑 `.ts` 文件（只支持"可擦除"的语法：
> 类型注解、`interface`、`import type` 可以；`enum`、参数属性不行）。
> 这不是魔法——类型在运行前就被删掉了，运行时还是普通 JS。**这正是"TS 编译完就是 JS"的实证。**

---

## 三、接口契约

统一约定：

| 项 | 约定 |
|---|---|
| Base URL | `http://localhost:3000` |
| 数据格式 | `application/json; charset=utf-8` |
| 成功 | 2xx + JSON |
| 失败 | 4xx/5xx + `{ "error": "错误说明" }` |
| CORS | 见第五节，**这是你必须自己解决的问题** |

### 数据模型

```ts
interface Device {
  id: number;               // 自增
  name: string;             // 设备名，1–50 字
  status: 'running' | 'idle' | 'fault';   // 运行 / 空闲 / 故障
  temp: number;             // 温度，摄氏度
  updatedAt: string;        // ISO 8601，例如 "2025-11-01T10:30:00.000Z"
}
```

初始数据（server.ts 里已经给好了）：

```json
[
  { "id": 1, "name": "1号注塑机",   "status": "running", "temp": 62.4 },
  { "id": 2, "name": "2号数控机床", "status": "idle",    "temp": 31.8 },
  { "id": 3, "name": "3号空压机",   "status": "fault",   "temp": 88.1 }
]
```

---

### 0. `GET /api/ping` ✅ 已实现（看这个学写法）

**响应 200**

```json
{ "ok": true, "time": "2025-11-01T10:30:00.000Z" }
```

> 这个接口是**已经写好的范例**。你要做的事：读懂它，然后把同样的 CORS 处理
> 复制到下面三个接口上。**先让 ping 在浏览器里跑通，再动别的。**

---

### 1. `GET /api/devices` ⬜ 待实现

**查询参数（可选）**

| 参数 | 类型 | 说明 |
|---|---|---|
| `status` | string | 按状态过滤：`running` / `idle` / `fault`；传了非法值返回 400 |

**响应 200**

```json
{
  "total": 3,
  "items": [ { "id": 1, "name": "1号注塑机", "status": "running", "temp": 62.4, "updatedAt": "..." } ]
}
```

**要处理的边界**
- 没有任何设备时返回 `{ "total": 0, "items": [] }`，**不是 404**
- `status` 非法 → `400 { "error": "invalid status" }`

---

### 2. `GET /api/devices/:id` ⬜ 待实现

**响应 200**：单个 device 对象

**响应 400**：`id` 不是正整数 → `{ "error": "invalid id" }`

**响应 404**：设备不存在 → `{ "error": "device not found" }`

> 注意：`id` 从 URL 里拿到时是**字符串**，要自己转换并校验。
> 这里最容易出的 bug：`Number("abc")` 是 `NaN`，`NaN` 参与比较永远是 false，于是变成 500。

---

### 3. `POST /api/devices` ⬜ 待实现

**请求体**

```json
{ "name": "4号冲压机", "temp": 45.0 }
```

| 字段 | 必填 | 规则 |
|---|---|---|
| `name` | ✅ | 非空字符串，长度 ≤ 50 |
| `temp` | ❌ | 数字，默认 0 |
| `status` | ❌ | 默认 `idle`，只能是三个枚举值之一 |

**响应 201**：创建成功的完整 device 对象

**响应 400**：`{ "error": "具体哪个字段不合法" }`

**要处理的边界**
- 请求体不是合法 JSON → 400，**不能让服务器崩掉**
- `name` 前后有空格 → 要 `trim`
- `name` 超长 → 400

> 判断标准很简单：**随便乱发一个请求，服务器不能挂。** 这就是"参数校验是第一道防线"。

---

## 四、验收标准

- [ ] `node server.ts` 能启动，`GET /api/ping` 用浏览器能打开看到 JSON
- [ ] 三个接口都能用浏览器 / curl / Postman 单独跑通（**接口能独立工作，才能给多个端用**）
- [ ] 用 `curl http://localhost:3000/api/devices/abc` 返回 400 而不是 500
- [ ] 用 `curl -X POST ... -d "不是json"` 服务器不崩，返回 400
- [ ] 前端页面能成功渲染设备列表（不再是 CORS 报错）
- [ ] 页面上能看到 loading / empty / error 三种状态
- [ ] 你能对着代码逐行解释：请求怎么进来的、怎么路由的、CORS 头加在哪一行

---

## 五、你会撞上的第一堵墙：CORS

如果你直接用双击打开 `index.html`（地址是 `file://...`），去请求 `http://localhost:3000`，
浏览器会拦你，Console 里出现：

```
Access to fetch at 'http://localhost:3000/api/ping' from origin 'null'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
is present on the requested resource.
```

**这不是 bug，是浏览器的安全设计。**

- **同源** = 协议 + 域名 + 端口 三者完全相同
- `file://` 的 origin 是 `null`，和 `http://localhost:3000` 不同源 → 被拦
- 后端必须在响应里明确写 `Access-Control-Allow-Origin`，浏览器才放行

`/api/ping` 已经加了这个头，所以它能通。**你写另外三个接口时，要把同样的头发回去。**
（提示：写一个 `sendJson()` 辅助函数统一加，别每个接口复制一遍。）

如果你请求的是 JSON POST，浏览器还会先发一个 `OPTIONS` 预检请求——
`server.ts` 里已经处理了，去看那段代码。

> **加分动作**：想清楚"为什么允许任意来源（`*`）在生产环境是危险的"。
> 这题答得出来，说明你真理解了 CORS，而不是背了个头名字。

---

## 六、进阶任务（做完基础再碰）

1. 加 `PUT /api/devices/:id` 修改状态，并记录 `updatedAt`
2. 加 `DELETE /api/devices/:id`
3. 加分页：`?page=1&size=10`
4. 加一个假的鉴权：登录后拿 token，后续请求要带 `Authorization: Bearer xxx`，没有就 401
5. 把内存数组换成 SQLite（`node:sqlite` 是 Node 24 内置的，不用装依赖）

> 第 4 和第 5 条，就是阶段 D 的预演。
