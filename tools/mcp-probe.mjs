// Minimal MCP stdio client: spawn a server, initialize, then run a script of calls.
import { spawn } from 'node:child_process';

const [,, cmdSpec, ...rest] = process.argv;
const script = JSON.parse(rest.join(' ') || '[]');
const [cmd, ...args] = cmdSpec.split(' ');

const proc = spawn(cmd, args, { stdio: ['pipe','pipe','pipe'] });
let buf = '';
const pending = new Map();
let nextId = 1;

proc.stdout.on('data', d => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});
proc.stderr.on('data', d => process.stderr.write('[server] ' + d.toString()));

function send(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout: ' + method)), 120000);
    pending.set(id, m => { clearTimeout(t); resolve(m); });
    proc.stdin.write(JSON.stringify({ jsonrpc:'2.0', id, method, params }) + '\n');
  });
}
function notify(method, params) {
  proc.stdin.write(JSON.stringify({ jsonrpc:'2.0', method, params }) + '\n');
}

const out = {};
try {
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-bench', version: '1.0.0' }
  });
  out.serverInfo = init.result?.serverInfo;
  notify('notifications/initialized', {});

  const tools = await send('tools/list', {});
  out.toolCount = tools.result?.tools?.length;
  out.tools = tools.result?.tools?.map(t => t.name);

  out.calls = [];
  for (const step of script) {
    const t0 = Date.now();
    try {
      const r = await send('tools/call', { name: step.name, arguments: step.args || {} });
      out.calls.push({ tool: step.name, ms: Date.now()-t0, isError: r.result?.isError ?? !!r.error,
        text: (r.result?.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n').slice(0, step.cap ?? 1200),
        nonText: (r.result?.content||[]).filter(c=>c.type!=='text').map(c=>c.type),
        error: r.error?.message });
    } catch (e) {
      out.calls.push({ tool: step.name, ms: Date.now()-t0, error: String(e.message) });
    }
  }
} catch (e) {
  out.fatal = String(e.message);
}
console.log(JSON.stringify(out, null, 2));
proc.kill();
process.exit(0);
