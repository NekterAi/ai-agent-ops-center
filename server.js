import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.stack || err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const DASHBOARD_AUTH = 'Basic ' + Buffer.from('nekter:nekter2026').toString('base64');
const DEFAULT_MESSAGE_LIMIT = 20;
const MAX_MESSAGE_LIMIT = 100;
const MAX_FEED_HISTORY = 200;
const OPENCLAW_CWD = '/home/clawdbot/clawd';
const execAsync = promisify(exec);

const pad2 = (value) => String(value).padStart(2, '0');
const formatTimestamp = (date = new Date()) => {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ${pad2(
    date.getUTCHours()
  )}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;
};

const gigs = [
  { title: 'Sleep Solutions LV', status: 'in-progress', assigned_to: 'Jarvis', beelancer_id: 'B-8892' },
  { title: 'Neon Air', status: 'in-progress', assigned_to: 'CLU', beelancer_id: 'B-8821' },
  { title: 'HydroHeat Plumbing', status: 'won', assigned_to: 'Cortana', beelancer_id: 'B-8777' }
];

const bids = [
  {
    id: randomUUID(),
    gig_title: 'Reno Roofing Refresh',
    agent: 'CLU',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    notes: 'Second follow-up needed',
    bid_amount: '$1,150'
  },
  {
    id: randomUUID(),
    gig_title: 'HVAC Ops Suite',
    agent: 'Cortana',
    status: 'won',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Client ready for deployment',
    bid_amount: '$2,400'
  },
  {
    id: randomUUID(),
    gig_title: 'Plumbing Patrol',
    agent: 'Jarvis',
    status: 'lost',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    notes: 'Contact stopped replying',
    bid_amount: '$950'
  }
];

const pipelineStages = ['Scraped', 'Email Found', 'Sent', 'Opened', 'Replied', 'Meeting Booked'];
const pipeline = [
  { company: 'Roaring HVAC', stage: 'Scraped', contact: 'N/A', notes: 'Needs email + contact' },
  { company: 'Reno Repipe', stage: 'Email Found', contact: 'ava@renorepipe.com', notes: 'Hunter verified' },
  { company: 'Las Vegas Roofs', stage: 'Sent', contact: 'lia@lvroofs.media', notes: 'First touch' },
  { company: 'HydroHeat Plumbing', stage: 'Opened', contact: 'sales@hydroheat.com', notes: 'Opened in <24h' },
  { company: 'Neon Air', stage: 'Replied', contact: 'ops@neonair.io', notes: 'Scheduling call' }
];

const bosSnapshot = {
  clientInstalls: [
    { name: 'Codex Academy', installed: '2026-01-15', setupFee: 4500, status: 'live' },
    { name: 'Sleep Solutions LV', installed: '2026-01-30', setupFee: 3200, status: 'live' },
    { name: 'Reno Roofing', installed: '2026-02-10', setupFee: 2800, status: 'onboarding' }
  ],
  mrr: 12400,
  projectedIncome: 12400 * 12,
  referrals: [
    { client: 'Horizon HVAC', referredBy: 'Noah' },
    { client: 'Summit Plumbing', referredBy: 'Spencer' }
  ]
};

const memoryFileMap = {
  'MEMORY.md': '/home/clawdbot/clawd/MEMORY.md',
  'HEARTBEAT.md': '/home/clawdbot/clawd/HEARTBEAT.md'
};

const kitchenTasks = [
  {
    id: randomUUID(),
    title: 'Match old dashboard colors',
    status: 'in-progress',
    assignee: 'CLU',
    created_at: formatTimestamp(new Date(Date.now() - 3600000)),
    notes: 'Copy CSS gradients + icons'
  },
  {
    id: randomUUID(),
    title: 'Wire token burn monitor',
    status: 'backlog',
    assignee: 'Jarvis',
    created_at: formatTimestamp(new Date(Date.now() - 7200000)),
    notes: 'Use OpenClaw stats endpoint'
  },
  {
    id: randomUUID(),
    title: 'Add agent icons',
    status: 'backlog',
    assignee: 'Cortana',
    created_at: formatTimestamp(new Date(Date.now() - 10800000)),
    notes: 'Emojis for Jarvis / CLU / Cortana'
  }
];

const staticKitchenCrons = [
  {
    id: randomUUID(),
    name: 'Beelancer Poll',
    agentId: 'Jarvis',
    schedule: 'every 20 minutes',
    model: 'openai-codex/gpt-5.1-codex-mini',
    enabled: true,
    lastStatus: 'ok',
    consecutiveErrors: 0,
    lastDurationMs: 1800,
    lastRunMs: Date.now() - 5 * 60 * 1000,
    nextRunMs: Date.now() + 15 * 60 * 1000
  },
  {
    id: randomUUID(),
    name: 'CLU Heartbeat',
    agentId: 'CLU',
    schedule: 'every 30 minutes',
    model: 'openai-codex/gpt-5.1-codex-mini',
    enabled: true,
    lastStatus: 'ok',
    consecutiveErrors: 0,
    lastDurationMs: 1200,
    lastRunMs: Date.now() - 3 * 60 * 1000,
    nextRunMs: Date.now() + 27 * 60 * 1000
  }
];

const kitchenFeedHistory = [];
const kitchenFeedClients = new Set();

const agentStatus = {
  Jarvis: {
    name: 'Jarvis',
    division: 'Executive',
    owner: 'Spencer',
    status: 'online',
    model: 'anthropic/claude-sonnet-4-5',
    heartbeat: true,
    notes: 'Sharp COO energy, leading coordination',
    workspace: '/home/clawdbot/clawd/',
    current_gig: 'Dashboard rebuild',
    last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isDefault: true
  },
  CLU: {
    name: 'CLU',
    division: 'Development',
    owner: 'Sam',
    status: 'online',
    model: 'openai-codex/gpt-5.3-codex',
    heartbeat: true,
    notes: 'Building the new dashboard',
    workspace: '/home/clawdbot/clawd-clu/',
    current_gig: 'Dashboard rebuild',
    last_seen: new Date(Date.now() - 90 * 1000).toISOString(),
    isDefault: false
  },
  Cortana: {
    name: 'Cortana',
    division: 'Creative',
    owner: 'Noah',
    status: 'online',
    model: 'openai-codex/gpt-5.3-codex',
    heartbeat: true,
    notes: 'Creative ops + curriculum',
    workspace: '/home/clawdbot/clawd-cortana/',
    current_gig: 'BOS curriculum',
    last_seen: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    isDefault: false
  }
};

let messages = [];

const persistMessages = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
};

try {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const raw = await fs.readFile(MESSAGES_FILE, 'utf-8');
  messages = JSON.parse(raw);
} catch (error) {
  if (error.code && error.code !== 'ENOENT') {
    console.error('Failed to load stored messages:', error);
  }
}

const sampleMessages = [
  { from_agent: 'Jarvis', to_agent: 'CLU', type: 'status', content: 'Matching the original dashboard look so Spencer can sign off.' },
  { from_agent: 'CLU', to_agent: 'Jarvis', type: 'status', content: 'Token burn monitor is wired to OpenClaw stats and rendering live data.' },
  { from_agent: 'Cortana', to_agent: 'Jarvis', type: 'status', content: 'Curriculum notes refreshed and routed into the Business tab.' }
];

if (!messages.length) {
  const base = Date.now();
  sampleMessages.forEach((entry, index) => {
    const offset = (sampleMessages.length - index) * 2 * 60 * 1000;
    const seeded = {
      ...entry,
      id: randomUUID(),
      timestamp: formatTimestamp(new Date(base - offset)),
      metadata: null
    };
    messages.push(seeded);
  });
  await persistMessages();
}

const requireAuth = (req, res, next) => {
  if (req.headers.authorization !== DASHBOARD_AUTH) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Nekter dashboard"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(requireAuth);
app.use(express.static(path.join(__dirname, 'public')));

const addFeedHistoryEvent = (event) => {
  kitchenFeedHistory.push(event);
  if (kitchenFeedHistory.length > MAX_FEED_HISTORY) {
    kitchenFeedHistory.shift();
  }
};

const broadcastFeedEvent = (event) => {
  kitchenFeedClients.forEach((client) => {
    if (client.writableEnded) {
      kitchenFeedClients.delete(client);
      return;
    }
    try {
      client.write(`event: message\n`);
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (error) {
      kitchenFeedClients.delete(client);
    }
  });
};

const queueFeedEvent = (message) => {
  const payload = {
    agent: message.from_agent,
    snippet: (message.content || '').slice(0, 150),
    timestamp: message.timestamp,
    ts: Date.now()
  };
  addFeedHistoryEvent(payload);
  broadcastFeedEvent(payload);
};

const hydrateFeedFromExisting = () => {
  messages.forEach((msg) => {
    const ts = new Date(msg.timestamp).getTime() || Date.now();
    addFeedHistoryEvent({
      agent: msg.from_agent,
      snippet: (msg.content || '').slice(0, 150),
      timestamp: msg.timestamp,
      ts
    });
  });
};

hydrateFeedFromExisting();
[
  { agent: 'Jarvis', snippet: 'Morning briefing ready for review.', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), ts: Date.now() - 45 * 60000 },
  { agent: 'CLU', snippet: 'Dashboard assets synced to /public.', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), ts: Date.now() - 30 * 60000 },
  { agent: 'Cortana', snippet: 'Curriculum notes updated.', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), ts: Date.now() - 18 * 60000 }
].forEach(addFeedHistoryEvent);


const computeBidStats = () => {
  const stats = { pending: 0, won: 0, lost: 0 };
  bids.forEach((bid) => {
    if (stats[bid.status] !== undefined) stats[bid.status] += 1;
  });
  return stats;
};

const getAgentList = () =>
  Object.entries(agentStatus).map(([id, agent]) => ({
    id,
    name: agent.name,
    division: agent.division,
    owner: agent.owner,
    status: agent.status,
    model: agent.model,
    notes: agent.notes
  }));

const AGENT_SESSION_MAP = {
  Jarvis: '/home/clawdbot/.openclaw/agents/main/sessions/sessions.json',
  CLU: '/home/clawdbot/.openclaw/agents/clu/sessions/sessions.json',
  Cortana: '/home/clawdbot/.openclaw/agents/cortana/sessions/sessions.json'
};

const AGENT_CRON_MAP = {
  Jarvis: null,
  CLU: 'clu-heartbeat',
  Cortana: 'cortana-heartbeat'
};

const getAgentLastSeen = async (agentKey) => {
  // First check cron state for agents that run as heartbeat crons
  const cronName = AGENT_CRON_MAP[agentKey];
  if (cronName) {
    try {
      const raw = await fs.readFile(CRON_JOBS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const job = (parsed.jobs || []).find(j => j.name === cronName);
      if (job?.state?.lastRunAtMs) {
        return job.state.lastRunAtMs + (job.state.lastDurationMs || 0);
      }
    } catch {}
  }

  // Fall back to session file mtime
  const filePath = AGENT_SESSION_MAP[agentKey];
  if (!filePath) return null;
  try {
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
};

const createKitchenAgents = async () => {
  const results = [];
  for (const [id, agent] of Object.entries(agentStatus)) {
    const lastSeenMs = await getAgentLastSeen(id);
    const lastSeen = lastSeenMs ? new Date(lastSeenMs).toISOString() : agent.last_seen;
    const isOnline = lastSeenMs ? (Date.now() - lastSeenMs < 60 * 60 * 1000) : agent.status === 'online';
    results.push({
      id,
      name: agent.name,
      status: isOnline ? 'online' : 'offline',
      model: agent.model,
      workspace: agent.workspace,
      last_seen: lastSeen,
      current_gig: agent.current_gig,
      isDefault: agent.isDefault
    });
  }
  return results;
};

const createFallbackRateLimitData = () => {
  const totalTokens = Math.max(50000, messages.length * 1500 + 1200);
  const estimatedLimit = 200000;
  const usagePercent = Math.min(95, (totalTokens / estimatedLimit) * 100);
  return {
    usagePercent,
    totalTokens,
    estimatedLimit,
    burnRatePerMinute: Math.max(120, Math.round(messages.length / 2) + 60),
    windowResetMin: 60,
    breakdown: {
      input: Math.round(totalTokens * 0.55),
      output: Math.round(totalTokens * 0.45)
    },
    totalCost: 0, // Subscription-based (no marginal cost)
    monthlyCost: 160, // $100 Claude Max + $60 ChatGPT Business
    entryCount: Math.max(1, messages.length)
  };
};

const getOpenClawSessions = async () => {
  try {
    const { stdout } = await execAsync('openclaw sessions list --json', {
      cwd: OPENCLAW_CWD,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 15000
    });
    const parsed = JSON.parse(stdout || '{}');
    return Array.isArray(parsed.sessions) ? parsed.sessions : [];
  } catch (error) {
    console.error('openclaw sessions failure', error.message || error);
    return [];
  }
};

const buildLiveRateLimitData = (sessions) => {
  const safeNum = (value) => Number(value) || 0;
  const inputTokens = sessions.reduce((sum, session) => sum + safeNum(session.inputTokens), 0);
  const outputTokens = sessions.reduce((sum, session) => sum + safeNum(session.outputTokens), 0);
  const totalTokensFromSessions = sessions.reduce((sum, session) => sum + safeNum(session.totalTokens), 0);
  const totalTokens = Math.max(totalTokensFromSessions, inputTokens + outputTokens);
  const contextMax = sessions.reduce((max, session) => Math.max(max, safeNum(session.contextTokens)), 0);
  const estimatedLimit = contextMax || 200000;
  const usagePercent = estimatedLimit ? Math.min(100, (totalTokens / estimatedLimit) * 100) : 0;
  const timestamps = sessions.map((session) => Number(session.updatedAt)).filter(Boolean);
  const latest = timestamps.length ? Math.max(...timestamps) : Date.now();
  const earliest = timestamps.length ? Math.min(...timestamps) : latest;
  const spanMinutes = Math.max(1, (latest - earliest) / 60000);
  const burnRatePerMinute = totalTokens ? totalTokens / spanMinutes : 0;
  return {
    usagePercent,
    totalTokens,
    estimatedLimit,
    burnRatePerMinute: Number(burnRatePerMinute.toFixed(1)),
    windowResetMin: 60,
    breakdown: {
      input: inputTokens,
      output: outputTokens
    },
    totalCost: 0, // Subscription-based (no marginal cost)
    monthlyCost: 160, // $100 Claude Max + $60 ChatGPT Business
    entryCount: sessions.length
  };
};


const msToHumanDuration = (ms) => {
  if (!ms || typeof ms !== 'number' || ms <= 0) return '0s';
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const seconds = Math.max(1, Math.floor(ms / 1000));
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
};

const describeCronSchedule = (schedule) => {
  if (!schedule) return 'custom schedule';
  if (schedule.kind === 'every') {
    const freq = msToHumanDuration(schedule.everyMs);
    return freq ? `every ${freq}` : 'every interval';
  }
  if (schedule.kind === 'cron') {
    const tz = schedule.tz ? ` (${schedule.tz})` : '';
    return `cron ${schedule.expr}${tz}`;
  }
  return schedule.kind || 'schedule';
};

const CRON_AGENT_LABELS = {
  'clu-heartbeat': 'CLU',
  'cortana-heartbeat': 'Cortana',
  'morning-briefing': 'Jarvis',
  'beelancer-gig-scan': 'Jarvis'
};

const mapCronJob = (job) => {
  const state = job.state || {};
  const lastRunMs = state.lastRunAtMs ?? job.lastRunAtMs ?? null;
  const nextRunMs = state.nextRunAtMs ?? job.nextRunAtMs ?? null;
  const lastDurationMs = state.lastDurationMs ?? job.lastDurationMs ?? 0;
  const consecutiveErrors = state.consecutiveErrors ?? 0;
  const lastStatus = (state.lastStatus || 'unknown').toLowerCase();
  return {
    id: job.id,
    name: job.name,
    agentId: CRON_AGENT_LABELS[job.name] || job.agentId || 'System',
    schedule: describeCronSchedule(job.schedule),
    model: job.payload?.model || 'unknown',
    enabled: Boolean(job.enabled),
    lastStatus,
    consecutiveErrors,
    lastDurationMs,
    lastRunMs,
    nextRunMs
  };
};

const CRON_JOBS_FILE = '/home/clawdbot/.openclaw/cron/jobs.json';

const getOpenClawCrons = async () => {
  try {
    const { stdout } = await execAsync('openclaw cron list --json', {
      cwd: OPENCLAW_CWD,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 15000
    });
    if (stdout) {
      const parsed = JSON.parse(stdout);
      const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
      if (jobs.length) {
        return jobs.map(mapCronJob);
      }
    }
  } catch (error) {
    console.error('openclaw cron list failed', error?.message || error);
  }

  try {
    const raw = await fs.readFile(CRON_JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    return jobs.map(mapCronJob);
  } catch (error) {
    console.error('cron jobs.json read failure', error);
  }

  return null;
};


const indexPath = path.join(__dirname, 'public', 'index.html');
const sendIndex = (req, res) => res.sendFile(indexPath);

app.get('/api/stats', (req, res) => {
  const onlineAgents = Object.values(agentStatus).filter((agent) => agent.status === 'online').length;
  const activeGigs = gigs.filter((gig) => gig.status === 'in-progress').length;
  const recentActivity = messages.slice(-20).map((msg) => ({
    ...msg
  }));
  res.json({ onlineAgents, activeGigs, totalMessages: messages.length, recentActivity });
});

app.get('/api/agents', (req, res) => {
  return res.json(getAgentList());
});

app.post('/api/agents/:agent/toggle', (req, res) => {
  const { agent } = req.params;
  const target = agentStatus[agent];
  if (!target) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  target.heartbeat = !target.heartbeat;
  return res.json({ agent, heartbeat: target.heartbeat });
});

app.get('/api/gigs', (req, res) => {
  return res.json(gigs);
});

app.get('/api/bids', (req, res) => {
  return res.json(bids);
});

app.get('/api/bids/stats', (req, res) => {
  return res.json(computeBidStats());
});

app.get('/api/pipeline', (req, res) => {
  return res.json({ stages: pipelineStages, leads: pipeline });
});

app.post('/api/launch', (req, res) => {
  const { vertical, city } = req.body || {};
  if (!vertical || !city) {
    return res.status(400).json({ error: 'Vertical and city required' });
  }
  console.info(`Requesting campaign launch for ${vertical} in ${city}`);
  return res.json({ status: 'queued', message: `Campaign for ${vertical} (${city}) queued and will fire via workflow 7EW1IIIYoP4vdN4N.` });
});

app.get('/api/bos', (req, res) => {
  return res.json(bosSnapshot);
});

app.get('/api/messages', (req, res) => {
  const requested = parseInt(req.query.limit, 10);
  const limit = Number.isNaN(requested)
    ? DEFAULT_MESSAGE_LIMIT
    : Math.min(MAX_MESSAGE_LIMIT, Math.max(1, requested));
  const recent = messages.slice(-limit);
  return res.json([...recent].reverse());
});

app.post('/api/messages', requireAuth, async (req, res) => {
  const { from_agent, to_agent, type, content, metadata } = req.body || {};
  if (!from_agent || !to_agent || !type || !content) {
    return res.status(400).json({ error: 'from_agent, to_agent, type, and content are required' });
  }
  const newMessage = {
    id: randomUUID(),
    timestamp: formatTimestamp(),
    from_agent,
    to_agent,
    type,
    content,
    metadata: metadata ?? null
  };
  messages.push(newMessage);
  try {
    await persistMessages();
  } catch (error) {
    console.error('Unable to persist message', error);
    return res.status(500).json({ error: 'Failed to persist message' });
  }
  queueFeedEvent(newMessage);
  return res.status(201).json(newMessage);
});

app.get('/api/kitchen/rate-limit', async (req, res) => {
  try {
    const sessions = await getOpenClawSessions();
    if (!sessions.length) {
      return res.json(createFallbackRateLimitData());
    }
    return res.json(buildLiveRateLimitData(sessions));
  } catch (error) {
    console.error('live rate limit fetch failed', error);
    return res.json(createFallbackRateLimitData());
  }
});

app.get('/api/kitchen/agents', async (req, res) => {
  return res.json({ agents: await createKitchenAgents() });
});

app.get('/api/kitchen/crons', async (req, res) => {
  const jobs = await getOpenClawCrons();
  if (!jobs || !jobs.length) {
    return res.json({ jobs: staticKitchenCrons });
  }
  return res.json({ jobs });
});

app.post('/api/kitchen/crons/:id/:action', (req, res) => {
  const { id, action } = req.params;
  const job = staticKitchenCrons.find((item) => item.id === id);
  if (!job) return res.status(404).json({ error: 'Cron not found' });
  if (action === 'enable') {
    job.enabled = true;
  } else if (action === 'disable') {
    job.enabled = false;
  } else if (action === 'run') {
    job.lastRunMs = Date.now();
    job.lastStatus = 'ok';
    job.consecutiveErrors = 0;
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }
  job.nextRunMs = Date.now() + 30 * 60 * 1000;
  return res.json({ success: true, job });
});

app.delete('/api/kitchen/crons/:id', (req, res) => {
  const { id } = req.params;
  const index = staticKitchenCrons.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ error: 'Cron not found' });
  staticKitchenCrons.splice(index, 1);
  return res.json({ success: true });
});

app.get('/api/kitchen/tasks', (req, res) => {
  return res.json({ tasks: kitchenTasks });
});

app.post('/api/kitchen/tasks', (req, res) => {
  const { title, status = 'backlog', assignee = '' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title required' });
  const task = {
    id: randomUUID(),
    title,
    status,
    assignee,
    created_at: formatTimestamp(),
    notes: ''
  };
  kitchenTasks.push(task);
  return res.json({ success: true, task });
});

app.patch('/api/kitchen/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const task = kitchenTasks.find((item) => item.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (status) task.status = status;
  return res.json({ success: true, task });
});

app.delete('/api/kitchen/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = kitchenTasks.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  kitchenTasks.splice(index, 1);
  return res.json({ success: true });
});

app.get('/api/kitchen/feed', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`event: init\n`);
  res.write(`data: ${JSON.stringify(kitchenFeedHistory.slice(-50))}\n\n`);
  kitchenFeedClients.add(res);
  req.on('close', () => kitchenFeedClients.delete(res));
});

app.get('/api/kitchen/feed/recent', (req, res) => {
  const requested = parseInt(req.query.limit, 10) || 50;
  const limit = Math.min(100, Math.max(1, requested));
  const recent = kitchenFeedHistory.slice(-limit);
  return res.json(recent);
});

app.get('/api/memory-files', async (req, res) => {
  const entries = {};
  for (const [name, filePath] of Object.entries(memoryFileMap)) {
    try {
      entries[name] = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      entries[name] = `Unable to read: ${error.message}`;
    }
  }
  return res.json(entries);
});

app.post('/api/memory-files', async (req, res) => {
  const { file, content } = req.body || {};
  if (!file || typeof content !== 'string') {
    return res.status(400).json({ error: 'File and content required' });
  }
  if (!memoryFileMap[file]) {
    return res.status(400).json({ error: 'File not allowed' });
  }
  try {
    await fs.writeFile(memoryFileMap[file], content, 'utf-8');
    return res.json({ status: 'saved', file });
  } catch (error) {
    console.error('Unable to save memory file', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/jarvis-widget', (req, res) => {
  return res.json({ url: 'https://mark.elevenlabs.io/?voice=Jarvis' });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  return sendIndex(req, res);
});

app.listen(PORT, () => {
  console.log(`Nekter dashboard listening on http://localhost:${PORT}`);
});
