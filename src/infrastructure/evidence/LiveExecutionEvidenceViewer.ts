import { createServer, type Server } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const VIEWER_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live execution evidence</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;background:#f5f5f5;color:#222}header{padding:16px 24px;background:#111;color:#fff;position:sticky;top:0}main{padding:24px;max-width:1200px;margin:auto}.turn{background:#fff;margin-bottom:20px;padding:16px;border-radius:10px;box-shadow:0 2px 8px #0001}.meta{font-size:14px;color:#555;margin-bottom:10px;white-space:pre-wrap}.turn img{display:block;max-width:100%;height:auto;border:1px solid #ddd;border-radius:6px}.status{font-weight:600}pre{white-space:pre-wrap}.empty{padding:40px;text-align:center;color:#666}
</style>
</head>
<body>
<header><div>Live execution evidence</div><div id="status" class="status">Waiting for evidence…</div></header>
<main id="evidence"><div class="empty">Waiting for the first turn…</div></main>
<script>
const executionId = new URLSearchParams(location.search).get('executionId') || '';
let rendered = new Set();
async function refresh(){
  try{
    const response = await fetch('/api/executions/' + encodeURIComponent(executionId) + '/events', {cache:'no-store'});
    if(!response.ok) throw new Error('HTTP ' + response.status);
    const events = await response.json();
    const container = document.getElementById('evidence');
    if(events.length === 0){
      document.getElementById('status').textContent = 'Waiting for evidence…';
      return;
    }
    document.getElementById('status').textContent = events.length + ' evidence item(s)';
    if(container.querySelector('.empty')) container.innerHTML = '';
    for(const event of events){
      const key = event.type + ':' + (event.turnIndex ?? event.occurredAt);
      if(rendered.has(key)) continue;
      rendered.add(key);
      const card = document.createElement('section');
      card.className = 'turn';
      if(event.type === 'OBSERVATION'){
        const title = document.createElement('h2');
        title.textContent = 'Turn ' + (event.turnIndex + 1);
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = 'Input: ' + event.input + '\nResponse: ' + event.response + '\nDuration: ' + event.durationMs + ' ms\nObserved: ' + event.observedAt;
        card.append(title, meta);
        if(event.hasScreenshot){
          const img = document.createElement('img');
          img.src = '/executions/' + encodeURIComponent(executionId) + '/turn-' + String(event.turnIndex + 1).padStart(2,'0') + '.png?ts=' + Date.now();
          img.alt = 'Screenshot for turn ' + (event.turnIndex + 1);
          card.append(img);
        }
      } else {
        const title = document.createElement('h2');
        title.textContent = 'Technical error';
        const meta = document.createElement('pre');
        meta.className = 'meta';
        meta.textContent = JSON.stringify(event, null, 2);
        card.append(title, meta);
      }
      container.append(card);
    }
  }catch(error){
    document.getElementById('status').textContent = 'Viewer error: ' + error;
  }
}
refresh();
setInterval(refresh, 500);
</script>
</body>
</html>`;

type ViewerEvent = {
  readonly type: 'OBSERVATION' | 'ERROR';
  readonly turnIndex?: number;
  readonly input?: string;
  readonly response?: string;
  readonly durationMs?: number;
  readonly observedAt?: string;
  readonly hasScreenshot?: boolean;
  readonly code?: string;
  readonly message?: string;
  readonly operation?: string;
  readonly occurredAt?: string;
};

export class LiveExecutionEvidenceViewer {
  public constructor(
    private readonly rootDirectory: string,
    private readonly host = '127.0.0.1',
    private readonly port = 0,
  ) {}

  public async start(): Promise<Server> {
    const root = resolve(this.rootDirectory);
    const server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
        const pathname = decodeURIComponent(url.pathname);

        if (pathname === '/' || /^\/execution\/[A-Za-z0-9_-]+$/.test(pathname)) {
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          response.end(VIEWER_HTML);
          return;
        }

        const eventsMatch = pathname.match(/^\/api\/executions\/([^/]+)\/events$/);
        if (eventsMatch?.[1]) {
          const executionId = this.validateSegment(eventsMatch[1]);
          const executionDirectory = join(root, executionId);
          const events = await this.readEvents(executionDirectory);
          response.writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          });
          response.end(JSON.stringify(events));
          return;
        }

        const fileMatch = pathname.match(/^\/executions\/([^/]+)\/(turn-\d{2}\.png)$/);
        if (fileMatch?.[1] && fileMatch[2]) {
          const executionId = this.validateSegment(fileMatch[1]);
          const fileName = fileMatch[2];
          const filePath = join(root, executionId, fileName);
          const fileStats = await stat(filePath);
          if (!fileStats.isFile()) throw new Error('Not found');
          response.writeHead(200, {
            'content-type': 'image/png',
            'cache-control': 'no-store',
          });
          response.end(await readFile(filePath));
          return;
        }

        response.writeHead(404);
        response.end('Not found');
      } catch {
        response.writeHead(404);
        response.end('Not found');
      }
    });

    await new Promise<void>((resolveListen, rejectListen) => {
      server.once('error', rejectListen);
      server.listen(this.port, this.host, () => resolveListen());
    });

    return server;
  }

  private validateSegment(value: string): string {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid execution id');
    return value;
  }

  private async readEvents(executionDirectory: string): Promise<readonly ViewerEvent[]> {
    const entries = await readdir(executionDirectory, { withFileTypes: true }).catch(() => []);
    const events: ViewerEvent[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const value = JSON.parse(await readFile(join(executionDirectory, entry.name), 'utf8')) as ViewerEvent;
      events.push(value);
    }

    events.sort((left, right) => {
      const leftIndex = left.type === 'OBSERVATION' ? left.turnIndex ?? 0 : Number.MAX_SAFE_INTEGER;
      const rightIndex = right.type === 'OBSERVATION' ? right.turnIndex ?? 0 : Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
    return events;
  }
}
