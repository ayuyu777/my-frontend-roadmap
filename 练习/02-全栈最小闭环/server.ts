/**
 * 练习 02 · 后端骨架
 *
 * 跑起来：node server.ts      （Node 24 原生支持 .ts，类型在运行前被擦掉）
 * 契约：  ./API.md
 *
 * 现状：
 *   GET /api/ping      ✅ 已经写好，当范例看
 *   OPTIONS 预检       ✅ 已经写好（CORS 的预检请求，别删）
 *   GET /api/devices   ⬜ 你来写
 *   GET /api/devices/:id  ⬜ 你来写
 *   POST /api/devices  ⬜ 你来写
 *
 * 写之前先做一件事：把 /api/ping 用浏览器打开跑通。
 * 那是你的"基准线"——它通了，说明服务器、端口、CORS 都没问题。
 */

import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const PORT = Number(process.env.PORT ?? 3000);

// ---------------------------------------------------------------------------
// 数据层：先放内存里，不接数据库。
// 进程一重启数据就没了 —— 这是故意的，逼你在阶段 D 去学"数据为什么要持久化"。
// ---------------------------------------------------------------------------

type DeviceStatus = 'running' | 'idle' | 'fault';

interface Device {
  id: number;
  name: string;
  status: DeviceStatus;
  temp: number;
  updatedAt: string;
}

const devices: Device[] = [
  { id: 1, name: '1号注塑机', status: 'running', temp: 62.4, updatedAt: new Date().toISOString() },
  { id: 2, name: '2号数控机床', status: 'idle', temp: 31.8, updatedAt: new Date().toISOString() },
  { id: 3, name: '3号空压机', status: 'fault', temp: 88.1, updatedAt: new Date().toISOString() },
];

let nextId = 4;

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // 练习用；生产环境应该限定具体域名
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * 统一响应函数。
 * 注意这里包含了 CORS 头 —— 这就是为什么 /api/ping 在 file:// 打开的页面里能通，
 * 而你没有加头的接口会报 "blocked by CORS policy"。
 */
function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/** 把请求体读完，拼成字符串 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// 路由
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // 让日志先跑起来：出问题时你会庆幸有这一行
  console.log(`${method} ${pathname}`);

  // ---- CORS 预检请求：浏览器在发"非简单请求"（比如 JSON POST）之前会先问一句 ----
  // 别删这段，删了前端就会报跨域错误。
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ---- 范例接口：已经实现，照它的样子写后面三个 ----
  if (method === 'GET' && pathname === '/api/ping') {
    sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    return;
  }

  // -------------------------------------------------------------------------
  // TODO 1: GET /api/devices
  // -------------------------------------------------------------------------
  if (method === 'GET' && pathname === '/api/devices') {
    // 步骤：
    //   1. 读查询参数：const status = url.searchParams.get('status')
    //   2. 如果 status 有值且不是三个合法值之一 → sendJson(res, 400, { error: 'invalid status' })
    //   3. 按 status 过滤（没传就返回全部）
    //   4. sendJson(res, 200, { total: list.length, items: list })
    //
    // 想清楚：过滤之后要不要改动原来的 devices 数组？
    //        （提示：不要。用 filter 返回新数组，别用 splice 把原数据搞坏）

    sendJson(res, 501, { error: 'not implemented: GET /api/devices' });
    return;
  }

  // -------------------------------------------------------------------------
  // TODO 2: GET /api/devices/:id
  // -------------------------------------------------------------------------
  if (method === 'GET' && pathname.startsWith('/api/devices/')) {
    // 步骤：
    //   1. const raw = pathname.slice('/api/devices/'.length)
    //   2. const id = Number(raw)
    //      → 校验：必须是正整数。注意 Number('abc') 是 NaN，而 NaN 的比较永远是 false
    //      → 不合法：sendJson(res, 400, { error: 'invalid id' })
    //   3. 查找设备，找不到 → 404 { error: 'device not found' }
    //   4. 找到了 → 200 + 设备对象
    //
    // 坑：'12abc' 用 Number() 是 NaN（好），但 '12.5' 是 12.5（不是正整数，要拦）
    //     试试 parseInt('12abc') 会得到什么？这就是为什么用 Number 更安全。

    sendJson(res, 501, { error: 'not implemented: GET /api/devices/:id' });
    return;
  }

  // -------------------------------------------------------------------------
  // TODO 3: POST /api/devices
  // -------------------------------------------------------------------------
  if (method === 'POST' && pathname === '/api/devices') {
    // 步骤：
    //   1. const raw = await readBody(req)
    //   2. 解析 JSON —— 必须用 try/catch！客户端可能发一段烂字符串过来
    //      解析失败 → 400 { error: 'invalid json' }
    //   3. 校验 name：是字符串、trim 后非空、长度 <= 50
    //      校验 temp：如果传了，必须是数字（typeof 检查，注意 '12' 是字符串）
    //      校验 status：如果传了，必须是三个枚举值之一
    //   4. 组装新设备：id = nextId++，status 默认 'idle'，temp 默认 0，updatedAt = 现在
    //   5. devices.push(新设备)
    //   6. sendJson(res, 201, 新设备)
    //
    // 验收：用 curl 发一段 "不是json" 的请求体，服务器不能崩。

    sendJson(res, 501, { error: 'not implemented: POST /api/devices' });
    return;
  }

  // ---- 兜底 ----
  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
  console.log(`先试试:     http://localhost:${PORT}/api/ping`);
});
