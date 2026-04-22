const { spawnSync } = require('node:child_process');
const http = require('node:http');

function assert(condition, message, details) {
  if (!condition) {
    const error = new Error(message);
    if (details !== undefined) error.details = details;
    throw error;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8'
  });
  assert(result.status === 0, `${command} ${args.join(' ')} basarisiz.`, {
    status: result.status,
    error: result.error ? String(result.error) : undefined,
    stdout: result.stdout,
    stderr: result.stderr
  });
  return result.stdout.trim();
}

function npxInvocation(args) {
  if (process.platform === 'win32') {
    return { command: 'cmd.exe', args: ['/c', 'npx', ...args] };
  }
  return { command: 'npx', args };
}

function probeChrome() {
  return new Promise((resolve) => {
    const request = http.get('http://127.0.0.1:9222/json/version', { timeout: 1200 }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          resolve({ ok: true, version: JSON.parse(body) });
        } catch {
          resolve({ ok: false, error: 'invalid-json' });
        }
      });
    });
    request.on('timeout', () => {
      request.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    request.on('error', (error) => resolve({ ok: false, error: error.message }));
  });
}

async function probeMcpTools() {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const invocation = npxInvocation([
    '--no-install',
    'chrome-devtools-mcp',
    '--browserUrl=http://127.0.0.1:9222',
    '--no-usage-statistics',
    '--slim'
  ]);
  const transport = new StdioClientTransport({
    command: invocation.command,
    args: invocation.args,
    env: {
      ...process.env,
      CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS: '1'
    },
    stderr: 'pipe'
  });
  const client = new Client(
    { name: 'tpys-extension-smoke', version: '1.0.0' },
    { capabilities: {} }
  );
  await client.connect(transport);
  try {
    const tools = await client.listTools();
    return tools.tools.map((tool) => tool.name).sort();
  } finally {
    await client.close();
  }
}

(async () => {
  const versionCommand = npxInvocation(['--no-install', 'chrome-devtools-mcp', '--version']);
  const helpCommand = npxInvocation(['--no-install', 'chrome-devtools-mcp', '--help']);
  const version = run(versionCommand.command, versionCommand.args);
  const help = run(helpCommand.command, helpCommand.args);
  const chrome = await probeChrome();
  const tools = await probeMcpTools();
  console.log(JSON.stringify({
    ok: true,
    chromeDevtoolsMcpVersion: version,
    repoLocalCli: /browserUrl/.test(help),
    chromeDebugEndpoint: chrome,
    serverStarted: true,
    tools
  }, null, 2));
})().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message,
    details: error.details
  }, null, 2));
  process.exit(1);
});
