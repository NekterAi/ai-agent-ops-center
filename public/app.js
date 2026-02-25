const API = '';
    let allMessages = [];

    // ── Toast ──────────────────────────────────────────────────────
    function toast(msg, type = 'info') {
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = msg;
      document.getElementById('toast-container').appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }

    // ── Helpers ────────────────────────────────────────────────────
    function fmtNum(n) {
      if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
      if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
      if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
      return n.toString();
    }

    function timeAgo(iso) {
      if (!iso) return '—';
      const diff = Date.now() - new Date(iso).getTime();
      const s = Math.floor(diff / 1000);
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.floor(h/24)}d ago`;
    }

    function timeUntil(iso) {
      if (!iso) return '—';
      const diff = new Date(iso).getTime() - Date.now();
      if (diff < 0) return 'overdue';
      const s = Math.floor(diff / 1000);
      if (s < 60) return `in ${s}s`;
      const m = Math.floor(s / 60);
      if (m < 60) return `in ${m}m`;
      const h = Math.floor(m / 60);
      if (h < 24) return `in ${h}h`;
      return `in ${Math.floor(h/24)}d`;
    }

    function escHtml(str) {
      return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function formatTime(ts) {
      return new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    }

    function formatDate(ts) {
      const d = new Date(ts), t = new Date(), y = new Date(t);
      y.setDate(y.getDate()-1);
      if (d.toDateString()===t.toDateString()) return 'Today';
      if (d.toDateString()===y.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    }

    function getAgentClass(name) { return (name||'').toLowerCase().replace(/[^a-z]/g,''); }

    function getAgentEmoji(id) {
      const m = {jarvis:'🎯',clu:'💻',cortana:'🎨',sp3cter:'⚡'};
      return m[(id||'').toLowerCase()] || '🤖';
    }

    function formatCurrency(value) {
      if (value === undefined || value === null) return '$0';
      return `$${Number(value).toLocaleString('en-US')}`;
    }

    function sanitizeId(input) {
      return (input||'').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    }

                function escapeForSingleQuotes(value) {
      return (value||'').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    // ── Ops Tab ────────────────────────────────────────────────────
    // ── Ops Tab ────────────────────────────────────────────────────
// ── Ops Tab ────────────────────────────────────────────────────
    async function loadStats() {
      try {
        const res = await fetch(`${API}/api/stats`);
        const data = await res.json();
        document.getElementById('online-count').textContent = data.onlineAgents;
        document.getElementById('gig-count').textContent = data.activeGigs;
        document.getElementById('message-count').textContent = data.totalMessages;
        const today = new Date().toDateString();
        const todayCount = data.recentActivity?.filter(m => new Date(m.timestamp).toDateString()===today).length || 0;
        document.getElementById('today-count').textContent = todayCount;
      } catch(e) { console.error('stats',e); }
    }

    async function loadAgents() {
      try {
        const agents = await (await fetch(`${API}/api/agents`)).json();
        const container = document.getElementById('agent-list');
        if (!agents.length) { container.innerHTML = '<div class="empty-state"><p>No agents registered</p></div>'; return; }
        container.innerHTML = agents.map(a => `
          <div class="agent-card">
            <div class="agent-avatar ${getAgentClass(a.id)}">${getAgentEmoji(a.id)}</div>
            <div class="agent-info">
              <h4>${a.name}</h4>
              <div class="role">${a.division}</div>
              <div class="owner">Owner: ${a.owner}</div>
            </div>
            <span class="status-badge status-${a.status}">${a.status}</span>
          </div>`).join('');
      } catch(e) { console.error('agents',e); }
    }

    async function loadMessages() {
      try {
        allMessages = await (await fetch(`${API}/api/messages?limit=100`)).json();
        renderMessages();
      } catch(e) { console.error('messages',e); }
    }

    function renderMessages() {
      const container = document.getElementById('message-list');
      const agentF = document.getElementById('filter-agent').value;
      const dateF = document.getElementById('filter-date').value;
      const searchF = document.getElementById('filter-search').value.toLowerCase();
      let filtered = allMessages;
      if (agentF) filtered = filtered.filter(m => m.from_agent===agentF||m.to_agent===agentF);
      if (dateF) { const fd = new Date(dateF).toDateString(); filtered = filtered.filter(m => new Date(m.timestamp).toDateString()===fd); }
      if (searchF) filtered = filtered.filter(m => m.content?.toLowerCase().includes(searchF)||m.from_agent?.toLowerCase().includes(searchF));
      if (!filtered.length) {
        container.innerHTML = `<div class="empty-state"><div class="icon">💬</div><p>${allMessages.length===0?'No agent communications yet':'No messages match your filters'}</p></div>`;
        return;
      }
      let currentDate='', html='';
      filtered.forEach(msg => {
        const msgDate = formatDate(msg.timestamp);
        if (msgDate !== currentDate) { currentDate = msgDate; html += `<div class="message-date-separator">${msgDate}</div>`; }
        const agentClass = getAgentClass(msg.from_agent);
        html += `<div class="message-item from-${agentClass}">
          <div class="message-header">
            <div>
              <div class="message-from ${agentClass}">${msg.from_agent}</div>
              ${msg.to_agent?`<div class="message-to">→ ${msg.to_agent}</div>`:''}
            </div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
          </div>
          <div class="message-content">${escHtml(msg.content)}</div>
        </div>`;
      });
      container.innerHTML = html;
    }

    async function loadGigs() {
      try {
        const gigs = await (await fetch(`${API}/api/gigs`)).json();
        const container = document.getElementById('gig-list');
        if (!gigs.length) { container.innerHTML = '<div class="empty-state"><div class="icon">🐝</div><p>No active gigs — time to hunt!</p></div>'; return; }
        container.innerHTML = gigs.map(g => `
          <div class="gig-item">
            <div class="gig-header"><div class="gig-title">${escHtml(g.title)}</div><span class="status-badge status-${g.status}">${g.status}</span></div>
            <div class="gig-meta"><span>👤 ${g.assigned_to||'Unassigned'}</span><span>🔗 ${g.beelancer_id||'N/A'}</span></div>
          </div>`).join('');
      } catch(e) { console.error('gigs',e); }
    }

    async function loadBids() {
      try {
        const stats = await (await fetch(`${API}/api/bids/stats`)).json();
        document.getElementById('bid-stats').innerHTML = `
          <span class="bid-stat pending">⏳ ${stats.pending} pending</span>
          <span class="bid-stat won">✅ ${stats.won} won</span>
          <span class="bid-stat lost">❌ ${stats.lost} lost</span>`;
        const bids = await (await fetch(`${API}/api/bids`)).json();
        const container = document.getElementById('bid-list');
        if (!bids.length) { container.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>No bids yet — agents are hunting!</p></div>'; return; }
        container.innerHTML = bids.map(bid => `
          <div class="bid-item ${bid.status}">
            <div class="bid-header"><div class="bid-title">${escHtml(bid.gig_title)}</div>
              <span class="status-badge status-${bid.status==='won'?'online':bid.status==='lost'?'offline':'pending'}">${bid.status}</span>
            </div>
            <div class="bid-meta">
              <span class="bid-agent">🤖 ${bid.agent}</span>
              ${bid.bid_amount?`<span>💰 ${bid.bid_amount}</span>`:''}
              <span>📅 ${new Date(bid.created_at).toLocaleDateString()}</span>
            </div>
            ${bid.notes?`<div style="color:var(--text-secondary);font-size:0.83rem;margin-top:6px">${escHtml(bid.notes)}</div>`:''}
          </div>`).join('');
      } catch(e) { console.error('bids',e); }
    }

    function loadAll() { loadStats(); loadAgents(); loadMessages(); loadGigs(); loadBids(); }
    document.getElementById('filter-agent').addEventListener('change', renderMessages);
    document.getElementById('filter-date').addEventListener('change', renderMessages);
    document.getElementById('filter-search').addEventListener('input', renderMessages);
    loadAll();
    setInterval(loadAll, 10000);

    // ═══════════════════════════════════════════════════════════════
    // KITCHEN TAB
    // ═══════════════════════════════════════════════════════════════

    let kitchenInited = false;
    let feedEventSource = null;
    let feedMessages = [];

    function initKitchen() {
      loadRateLimit();
      loadKitchenAgents();
      loadKitchenCrons();
      loadKitchenTasks();
      initFeed();
      kitchenInited = true;
    }

    async function refreshKitchen() {
      await Promise.all([loadKitchenAgents(), loadKitchenCrons(), loadKitchenTasks()]);
      toast('Kitchen refreshed ↻', 'info');
    }

    // ── Rate Limit Monitor ─────────────────────────────────────────
    async function loadRateLimit() {
      const syncEl = document.getElementById('rl-sync');
      try {
        syncEl.textContent = 'Loading...';
        syncEl.className = 'sync-indicator';
        const data = await (await fetch(`${API}/api/kitchen/rate-limit`)).json();

        if (data.error) {
          document.getElementById('rl-content').innerHTML = `<div class="rl-error">⚠️ ${data.error} — sessions directory not mounted?</div>`;
          syncEl.textContent = '⚠ Error';
          return;
        }

        // Progress bar color
        const pct = data.usagePercent || 0;
        const colorClass = pct < 50 ? 'green' : pct < 80 ? 'yellow' : 'red';

        document.getElementById('rl-token-count').className = `rl-token-count ${colorClass}`;
        document.getElementById('rl-token-count').textContent = fmtNum(data.totalTokens);
        document.getElementById('rl-limit-label').textContent = `/ ${fmtNum(data.estimatedLimit)} estimated limit`;
        document.getElementById('rl-bar').style.width = Math.min(pct, 100) + '%';
        document.getElementById('rl-bar').className = `rl-progress-bar ${colorClass}`;
        document.getElementById('rl-pct').textContent = `${pct.toFixed(1)}% used`;
        document.getElementById('rl-burn').textContent = fmtNum(data.burnRatePerMinute);
        document.getElementById('rl-reset').textContent = data.windowResetMin || '—';
        document.getElementById('rl-input').textContent = fmtNum(data.breakdown?.input || 0);
        document.getElementById('rl-output').textContent = fmtNum(data.breakdown?.output || 0);
        document.getElementById('rl-cost').textContent = `$${data.totalCost.toFixed(2)}`;
        document.getElementById('rl-calls').textContent = `${data.entryCount} API calls`;

        syncEl.textContent = '✓ Live';
        syncEl.className = 'sync-indicator ok';
      } catch(e) {
        syncEl.textContent = '⚠ Error';
        console.error('rate limit', e);
      }
    }

    // Auto-refresh rate limit every 60s
    setInterval(() => { if (kitchenInited) loadRateLimit(); }, 60000);

    // ── Agent Status ───────────────────────────────────────────────
    const AGENT_EMOJIS = { jarvis:'🎯', clu:'💻', cortana:'🎨', sp3cter:'⚡' };
    const STATUS_PILL = { online:'pill-green', offline:'pill-red', pending:'pill-orange', working:'pill-blue', unknown:'pill-muted' };

    async function loadKitchenAgents() {
      try {
        const { agents } = await (await fetch(`${API}/api/kitchen/agents`)).json();
        const el = document.getElementById('k-agent-list');
        const sync = document.getElementById('k-agent-sync');
        if (!agents?.length) { el.innerHTML = '<p style="color:var(--text-muted)">No agents found</p>'; return; }

        el.innerHTML = agents.map(a => {
          const id = (a.id||'').toLowerCase();
          const emoji = AGENT_EMOJIS[id] || '🤖';
          const statusClass = STATUS_PILL[a.status] || 'pill-muted';
          return `
            <div class="k-agent-card agent-${id}">
              <div class="k-agent-top">
                <div class="k-agent-name">
                  <div class="avatar ${id}">${emoji}</div>
                  ${a.name}${a.isDefault?'<span style="font-size:0.68rem;color:var(--accent-cyan);font-weight:400"> (default)</span>':''}
                </div>
                <span class="pill ${statusClass}">${a.status||'unknown'}</span>
              </div>
              <div class="k-agent-model">🧠 ${a.model||'unknown'}</div>
              <div class="k-agent-meta">
                ${a.workspace?`<span>📁 ${escHtml(a.workspace)}</span>`:''}
                <span>🕐 ${timeAgo(a.last_seen)}</span>
              </div>
              ${a.current_gig?`<div class="k-agent-gig">🔨 ${escHtml(a.current_gig)}</div>`:''}
            </div>`;
        }).join('');

        sync.textContent = '✓ Live';
        sync.className = 'sync-indicator ok';
      } catch(e) {
        document.getElementById('k-agent-sync').textContent = '⚠ Error';
        console.error('kitchen agents', e);
      }
    }

    // ── Cron Manager ───────────────────────────────────────────────
    async function loadKitchenCrons() {
      try {
        const { jobs } = await (await fetch(`${API}/api/kitchen/crons`)).json();
        const container = document.getElementById('k-cron-cards');
        const sync = document.getElementById('k-cron-sync');
        if (!jobs?.length) {
          container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No cron jobs found</p>';
          return;
        }

        container.innerHTML = jobs.map(job => {
          const statusTag = job.lastStatus === 'ok'
            ? `<span class="cron-tag ok">✅ ok</span>`
            : job.lastStatus === 'error'
              ? `<span class="cron-tag error">❌ ${job.consecutiveErrors||1} errors</span>`
              : `<span class="cron-tag">—</span>`;
          const durTag = job.lastDurationMs
            ? `<span class="cron-tag">${(job.lastDurationMs/1000).toFixed(1)}s</span>`
            : '';
          const enableBtn = job.enabled
            ? `<button class="btn btn-orange btn-sm" onclick="cronAction('disable','${job.id}','${escHtml(job.name)}')">⏸ Disable</button>`
            : `<button class="btn btn-green btn-sm" onclick="cronAction('enable','${job.id}','${escHtml(job.name)}')">▶ Enable</button>`;

          return `
            <div class="cron-card ${job.enabled?'enabled':'disabled'}">
              <div class="cron-card-top">
                <div>
                  <div class="cron-card-name">${escHtml(job.name)}</div>
                  <div class="cron-card-agent">${escHtml(job.agentId||'')}</div>
                </div>
                ${statusTag}
              </div>
              <div class="cron-card-mid">
                <span class="cron-tag schedule">${escHtml(job.schedule)}</span>
                ${job.model?`<span class="cron-tag model">${escHtml(job.model.split('/').pop())}</span>`:''}
                ${durTag}
              </div>
              <div class="cron-card-times">
                <span><span class="t-label">Last run</span><span class="t-val">${job.lastRunMs?timeAgo(new Date(job.lastRunMs).toISOString()):'—'}</span></span>
                <span><span class="t-label">Next run</span><span class="t-val">${job.nextRunMs?timeUntil(new Date(job.nextRunMs).toISOString()):'—'}</span></span>
              </div>
              <div class="cron-card-actions">
                ${enableBtn}
                <button class="btn btn-blue btn-sm" onclick="cronAction('run','${job.id}','${escHtml(job.name)}')">▶▶ Run Now</button>
                <button class="btn btn-red btn-sm" onclick="cronAction('delete','${job.id}','${escHtml(job.name)}')">🗑</button>
              </div>
            </div>`;
        }).join('');

        sync.textContent = `✓ ${jobs.length} jobs`;
        sync.className = 'sync-indicator ok';
      } catch(e) {
        document.getElementById('k-cron-sync').textContent = '⚠ Error';
        console.error('kitchen crons', e);
      }
    }

    async function cronAction(action, id, name) {
      if (action==='delete' && !confirm(`Delete cron "${name}"? This cannot be undone.`)) return;
      const labels = {enable:'Enabling',disable:'Disabling',delete:'Deleting',run:'Triggering'};
      toast(`${labels[action]||action} "${name}"...`);
      try {
        let res;
        if (action==='delete') res = await fetch(`${API}/api/kitchen/crons/${id}`,{method:'DELETE'});
        else res = await fetch(`${API}/api/kitchen/crons/${id}/${action}`,{method:'POST'});
        const data = await res.json();
        if (data.success||res.ok) { toast(`✅ "${name}" ${action}d`,'success'); await loadKitchenCrons(); }
        else toast(`❌ Failed: ${data.error||'unknown error'}`,'error');
      } catch(e) { toast(`❌ ${e.message}`,'error'); }
    }

    // ── Task Board ─────────────────────────────────────────────────
    async function loadKitchenTasks() {
      try {
        const { tasks } = await (await fetch(`${API}/api/kitchen/tasks`)).json();
        renderTasks(tasks||[]);
      } catch(e) { console.error('tasks',e); }
    }

    function renderTasks(tasks) {
      const cols = {backlog:[],  'in-progress':[], done:[]};
      tasks.forEach(t => { (cols[t.status]||cols.backlog).push(t); });
      for (const [status, items] of Object.entries(cols)) {
        const col = document.getElementById(`k-col-${status}`);
        const counter = document.getElementById(`k-count-${status}`);
        if (counter) counter.textContent = items.length;
        if (!col) continue;
        if (!items.length) { col.innerHTML = '<div style="color:var(--text-muted);font-size:0.78rem;padding:6px 0;text-align:center">Empty</div>'; continue; }
        col.innerHTML = items.map(t => `
          <div class="task-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div class="task-card-title">${escHtml(t.title)}</div>
              <div class="btn-row" style="flex-shrink:0">
                ${status!=='in-progress'?`<button class="btn btn-blue btn-sm" onclick="moveTask('${t.id}','in-progress')">→</button>`:''}
                ${status!=='done'?`<button class="btn btn-green btn-sm" onclick="moveTask('${t.id}','done')">✓</button>`:''}
                <button class="btn btn-red btn-sm" onclick="deleteTask('${t.id}')">✕</button>
              </div>
            </div>
            <div class="task-card-meta">
              ${t.assignee?`<span>👤 ${escHtml(t.assignee)}</span>`:''}
              <span>📅 ${new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            ${t.notes?`<div style="font-size:0.76rem;color:var(--text-secondary);margin-top:4px">${escHtml(t.notes)}</div>`:''}
          </div>`).join('');
      }
    }

    function showAddTask() {
      const form = document.getElementById('k-add-task-form');
      form.style.display = form.style.display==='none'?'block':'none';
      if (form.style.display==='block') document.getElementById('k-task-title').focus();
    }

    async function addTask() {
      const title = document.getElementById('k-task-title').value.trim();
      if (!title) { toast('Please enter a task title','error'); return; }
      const status = document.getElementById('k-task-status').value;
      const assignee = document.getElementById('k-task-assignee').value;
      try {
        const res = await fetch(`${API}/api/kitchen/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,status,assignee})});
        const data = await res.json();
        if (data.success) { toast(`✅ Task added`,'success'); document.getElementById('k-task-title').value=''; document.getElementById('k-add-task-form').style.display='none'; await loadKitchenTasks(); }
        else toast(`❌ ${data.error}`,'error');
      } catch(e) { toast(`❌ ${e.message}`,'error'); }
    }

    async function moveTask(id, newStatus) {
      try {
        await fetch(`${API}/api/kitchen/tasks/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});
        await loadKitchenTasks();
      } catch(e) { toast(`❌ ${e.message}`,'error'); }
    }

    async function deleteTask(id) {
      try {
        await fetch(`${API}/api/kitchen/tasks/${id}`,{method:'DELETE'});
        await loadKitchenTasks();
        toast('Task deleted','info');
      } catch(e) { toast(`❌ ${e.message}`,'error'); }
    }

    // ── Live Feed ──────────────────────────────────────────────────
    const FEED_AGENT_COLOR = { jarvis:'jarvis', clu:'clu', cortana:'cortana', sp3cter:'sp3cter', main:'main' };
    const MAX_FEED_VISIBLE = 50;

    function getFeedAgentKey(name) {
      return (name||'').toLowerCase().replace(/[^a-z]/g,'') || 'main';
    }

    function renderFeedItem(msg) {
      const agentKey = getFeedAgentKey(msg.agent);
      const colorClass = FEED_AGENT_COLOR[agentKey] || 'main';
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const snippet = (msg.snippet||'').slice(0, 150);
      return `<div class="feed-item agent-${agentKey}">
        <span class="feed-agent ${colorClass}">${escHtml(msg.agent||'Main')}</span>
        <span class="feed-text">${escHtml(snippet)}</span>
        <span class="feed-time">${time}</span>
      </div>`;
    }

    function addFeedMessages(msgs) {
      if (!msgs || !msgs.length) return;
      const list = document.getElementById('feed-list');
      const emptyEl = list.querySelector('.feed-empty');
      if (emptyEl) emptyEl.remove();

      const wasAtBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
      msgs.forEach(msg => {
        const div = document.createElement('div');
        div.innerHTML = renderFeedItem(msg);
        list.appendChild(div.firstElementChild);
      });

      // Trim to MAX_FEED_VISIBLE
      while (list.children.length > MAX_FEED_VISIBLE) {
        list.removeChild(list.firstChild);
      }

      // Auto-scroll to bottom if we were near bottom
      if (wasAtBottom) list.scrollTop = list.scrollHeight;
    }

    function initFeed() {
      if (feedEventSource) { feedEventSource.close(); feedEventSource = null; }
      const statusEl = document.getElementById('feed-status');
      statusEl.textContent = 'Connecting...';
      statusEl.className = 'feed-connection disconnected';

      try {
        feedEventSource = new EventSource(`${API}/api/kitchen/feed`);

        feedEventSource.addEventListener('init', (e) => {
          const msgs = JSON.parse(e.data || '[]');
          feedMessages = msgs;
          const list = document.getElementById('feed-list');
          list.innerHTML = '';
          if (msgs.length) addFeedMessages(msgs.slice(-MAX_FEED_VISIBLE));
          else list.innerHTML = '<div class="feed-empty">⏳ No recent agent activity...</div>';
          statusEl.textContent = '● Live';
          statusEl.className = 'feed-connection connected';
        });

        feedEventSource.addEventListener('message', (e) => {
          try {
            const msg = JSON.parse(e.data);
            feedMessages.push(msg);
            addFeedMessages([msg]);
          } catch {}
        });

        feedEventSource.onerror = () => {
          statusEl.textContent = '⚠ Reconnecting...';
          statusEl.className = 'feed-connection disconnected';
          // Fallback to polling
          setTimeout(() => pollFeedFallback(), 5000);
        };
      } catch(e) {
        console.error('SSE error', e);
        pollFeedFallback();
      }
    }

    // Fallback: poll /api/kitchen/feed/recent every 5s
    let feedPollTimer = null;
    let feedLastTs = 0;

    async function pollFeedFallback() {
      if (feedEventSource?.readyState === EventSource.OPEN) return; // SSE working
      try {
        const msgs = await (await fetch(`${API}/api/kitchen/feed/recent?limit=50`)).json();
        const newMsgs = msgs.filter(m => m.ts > feedLastTs);
        if (newMsgs.length) {
          addFeedMessages(newMsgs);
          feedLastTs = Math.max(...newMsgs.map(m => m.ts));
          document.getElementById('feed-status').textContent = '● Poll';
          document.getElementById('feed-status').className = 'feed-connection connected';
        }
      } catch(e) { console.error('feed poll', e); }
      feedPollTimer = setTimeout(pollFeedFallback, 5000);
    }

    async function loadAgentControl() {
      const list = document.getElementById('agent-control-list');
      const sync = document.getElementById('agent-control-sync');
      const onlineEl = document.getElementById('agent-control-online');
      const modelsEl = document.getElementById('agent-control-models');
      const lastEl = document.getElementById('agent-control-last');
      sync.textContent = 'Loading...';
      sync.className = 'sync-indicator';
      try {
        const [agents, kitchen] = await Promise.all([
          (await fetch(`${API}/api/agents`)).json(),
          (await fetch(`${API}/api/kitchen/agents`)).json().catch(() => ({ agents: [] }))
        ]);
        const kitchenAgents = kitchen?.agents || [];
        const kitchenMap = new Map(kitchenAgents.map(a => [a.id, a]));
        const merged = kitchenAgents.map(agent => ({ ...agents.find(a => a.id === agent.id), ...agent }));
        agents.forEach(agent => {
          if (!kitchenMap.has(agent.id)) {
            merged.push(agent);
          }
        });
        const onlineCount = merged.filter(a => a.status === 'online').length;
        const uniqueModels = new Set(merged.map(a => a.model || 'unknown')).size;
        const lastSeenTs = Math.max(0, ...merged.map(a => a.last_seen ? new Date(a.last_seen).getTime() : 0));
        onlineEl.textContent = onlineCount;
        modelsEl.textContent = uniqueModels;
        lastEl.textContent = lastSeenTs ? timeAgo(new Date(lastSeenTs).toISOString()) : '—';
        if (!merged.length) {
          list.innerHTML = '<div class="empty-state"><div class="icon">🧭</div><p>No agents available</p></div>';
        } else {
          list.innerHTML = merged.map(agent => renderAgentControlCard(agent)).join('');
        }
        sync.textContent = `✓ ${merged.length} agents`;
        sync.className = 'sync-indicator ok';
      } catch (error) {
        sync.textContent = '⚠ Error';
        console.error('agent control', error);
      }
    }

    function renderAgentControlCard(agent) {
      const meta = agent || {};
      const notes = meta.notes ? `<div style="color:var(--text-secondary);font-size:0.8rem">${escHtml(meta.notes)}</div>` : '';
      return `<div class="agent-control-card">
        <div class="agent-card">
          <div class="agent-avatar ${getAgentClass(meta.id)}">${getAgentEmoji(meta.id)}</div>
          <div class="agent-info">
            <h4>${escHtml(meta.name || meta.id)}</h4>
            <div class="role">${escHtml(meta.division || meta.model || 'Operator')}</div>
            <div class="owner">Owner: ${escHtml(meta.owner || 'Unknown')}</div>
          </div>
          <span class="status-badge status-${meta.status || 'offline'}">${escHtml(meta.status || 'offline')}</span>
        </div>
        <div class="agent-control-meta">
          <span>Model: ${escHtml(meta.model || 'Unknown')}</span>
          ${meta.workspace?`<span>Workspace: ${escHtml(meta.workspace)}</span>`:''}
          ${meta.current_gig?`<span>Gig: ${escHtml(meta.current_gig)}</span>`:''}
          <span>Last seen: ${timeAgo(meta.last_seen)}</span>
        </div>
        <div class="agent-control-actions">
          <button class="btn btn-blue btn-sm" onclick="toggleAgentHeartbeat('${meta.id}')">Toggle heartbeat</button>
        </div>
        ${notes}
      </div>`;
    }

    async function toggleAgentHeartbeat(agentId) {
      try {
        const res = await fetch(`${API}/api/agents/${agentId}/toggle`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Toggle failed');
        toast(`${agentId} heartbeat ${data.heartbeat? 'enabled' : 'disabled'}`, 'success');
        loadAgentControl();
      } catch (error) {
        toast(error.message || 'Unable to toggle heartbeat', 'error');
        console.error('toggle heartbeat', error);
      }
    }

    async function loadPipelineData() {
      const sync = document.getElementById('pipeline-sync');
      sync.textContent = 'Loading...';
      sync.className = 'sync-indicator';
      try {
        const data = await (await fetch(`${API}/api/pipeline`)).json();
        const stages = data.stages ? [...data.stages] : [];
        const leads = data.leads || [];
        const stageCounts = {};
        stages.forEach(stage => { stageCounts[stage] = 0; });
        leads.forEach(lead => {
          const stage = lead.stage || 'Uncategorized';
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
          if (!stages.includes(stage)) stages.push(stage);
        });
        const stageEl = document.getElementById('pipeline-stage-grid');
        stageEl.innerHTML = stages.length
          ? stages.map(stage => `<div class="mini-pill"><strong>${escHtml(stage)}</strong><span>${stageCounts[stage] || 0} leads</span></div>`).join('')
          : '<div class="mini-pill">No stages yet</div>';
        const tbody = document.getElementById('pipeline-leads');
        if (!leads.length) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No leads yet</td></tr>`;
        } else {
          tbody.innerHTML = leads.map(lead => `<tr><td>${escHtml(lead.company)}</td><td>${escHtml(lead.stage)}</td><td>${escHtml(lead.contact || 'TBD')}</td><td>${escHtml(lead.notes || '—')}</td></tr>`).join('');
        }
        document.getElementById('pipeline-count').textContent = `${leads.length} leads`;
        sync.textContent = `✓ ${leads.length} leads`;
        sync.className = 'sync-indicator ok';
      } catch (error) {
        sync.textContent = '⚠ Error';
        console.error('pipeline', error);
      }
    }

    async function handleLaunchForm(event) {
      event.preventDefault();
      const vertical = document.getElementById('launch-vertical').value.trim();
      const city = document.getElementById('launch-city').value.trim();
      const notes = document.getElementById('launch-notes').value.trim();
      const statusEl = document.getElementById('launch-status');
      const responseEl = document.getElementById('launch-response');
      if (!vertical || !city) {
        toast('Vertical and city are required', 'error');
        return;
      }
      statusEl.textContent = 'Queuing...';
      responseEl.textContent = 'Sending launch request...';
      try {
        const res = await fetch(`${API}/api/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vertical, city, notes })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Launch failed');
        responseEl.textContent = data.message || 'Launch queued';
        statusEl.textContent = 'Queued';
        toast('Campaign queued', 'success');
      } catch (error) {
        responseEl.textContent = error.message;
        statusEl.textContent = 'Error';
        toast(error.message, 'error');
        console.error('launch', error);
      }
    }

    function prepareLaunchTab() {
      const statusEl = document.getElementById('launch-status');
      const responseEl = document.getElementById('launch-response');
      if (statusEl) statusEl.textContent = 'Ready';
      if (responseEl) responseEl.textContent = 'Awaiting input';
    }

    async function loadBusinessSnapshot() {
      const sync = document.getElementById('business-sync');
      sync.textContent = 'Loading...';
      sync.className = 'sync-indicator';
      try {
        const data = await (await fetch(`${API}/api/bos`)).json();
        document.getElementById('bos-mrr').textContent = formatCurrency(data.mrr);
        document.getElementById('bos-projected').textContent = formatCurrency(data.projectedIncome);
        const referrals = data.referrals || [];
        document.getElementById('bos-ref-count').textContent = referrals.length;
        const clientsEl = document.getElementById('bos-clients');
        const clients = (data.clientInstalls || []).map(client => `
          <div style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div style="display:flex;align-items:center;gap:10px;">
              <strong>${escHtml(client.name)}</strong>
              <span class="pill ${client.status==='live'?'pill-green':'pill-muted'}">${escHtml(client.status)}</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">Installed: ${escHtml(client.installed)} • ${formatCurrency(client.setupFee)} setup</div>
          </div>`).join('');
        clientsEl.innerHTML = clients.length ? clients : '<p style="color:var(--text-muted);font-size:0.85rem">No installs yet</p>';
        const referralsEl = document.getElementById('bos-referrals');
        referralsEl.innerHTML = referrals.length
          ? referrals.map(ref => `<li style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)"><strong>${escHtml(ref.client)}</strong> → ${escHtml(ref.referredBy)}</li>`).join('')
          : '<li style="color:var(--text-muted);font-size:0.85rem">No referrals logged</li>';
        sync.textContent = '✓ Live';
        sync.className = 'sync-indicator ok';
      } catch (error) {
        sync.textContent = '⚠ Error';
        console.error('business', error);
      }
    }

    async function loadMemoryFiles() {
      const container = document.getElementById('memory-files');
      const sync = document.getElementById('memory-sync');
      sync.textContent = 'Loading...';
      sync.className = 'sync-indicator';
      try {
        const entries = await (await fetch(`${API}/api/memory-files`)).json();
        const html = Object.entries(entries).map(([name, content]) => {
          const safeId = sanitizeId(name);
          const safeName = escapeForSingleQuotes(name);
          return `<div class="memory-card">
            <div class="memory-card-header">
              <strong>${escHtml(name)}</strong>
              <div class="memory-actions">
                <span class="sync-indicator" id="memory-status-${safeId}">Ready</span>
                <button class="btn btn-blue btn-sm" type="button" onclick="saveMemoryFile('${safeName}')">Save</button>
              </div>
            </div>
            <textarea spellcheck="false" id="memory-text-${safeId}" data-file="${escHtml(name)}">${escHtml(content)}</textarea>
          </div>`;
        }).join('');
        container.innerHTML = html || '<div class="empty-state"><div class="icon">🧠</div><p>No memory files available</p></div>';
        sync.textContent = '✓ Live';
        sync.className = 'sync-indicator ok';
      } catch (error) {
        container.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>Unable to load memory files</p></div>';
        sync.textContent = '⚠ Error';
        console.error('memory files', error);
      }
    }

    async function saveMemoryFile(file) {
      const safeId = sanitizeId(file);
      const textarea = document.getElementById(`memory-text-${safeId}`);
      const status = document.getElementById(`memory-status-${safeId}`);
      if (!textarea) return;
      if (status) status.textContent = 'Saving...';
      try {
        const res = await fetch(`${API}/api/memory-files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file, content: textarea.value })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to save');
        if (status) status.textContent = 'Saved';
        toast(`${file} saved`, 'success');
      } catch (error) {
        if (status) status.textContent = 'Failed';
        toast(error.message, 'error');
        console.error('save memory', error);
      }
    }

    async function loadJarvisWidget() {
      const sync = document.getElementById('jarvis-sync');
      const info = document.getElementById('jarvis-widget-info');
      const label = document.getElementById('jarvis-link-label');
      const openBtn = document.getElementById('jarvis-open');
      sync.textContent = 'Loading...';
      sync.className = 'sync-indicator';
      try {
        const data = await (await fetch(`${API}/api/jarvis-widget`)).json();
        if (data.url) {
          if (openBtn) openBtn.onclick = () => window.open(data.url, '_blank');
          label.textContent = 'Widget ready';
          info.innerHTML = `<div class="mini-pill"><strong>URL</strong><span>${escHtml(data.url)}</span></div>`;
        } else {
          label.textContent = 'No widget configured';
          info.innerHTML = '<div class="mini-pill" style="color:var(--text-muted)">Link missing</div>';
        }
        sync.textContent = '✓ Live';
        sync.className = 'sync-indicator ok';
      } catch (error) {
        sync.textContent = '⚠ Error';
        label.textContent = 'Failed to load widget';
        if (info) info.innerHTML = '<div class="mini-pill" style="color:var(--text-muted)">Failed to load</div>';
        console.error('jarvis widget', error);
      }
    }

    const TAB_LOADERS = {
      overview: loadAll,
      'agent-control': loadAgentControl,
      pipeline: loadPipelineData,
      launch: prepareLaunchTab,
      business: loadBusinessSnapshot,
      memory: loadMemoryFiles,
      jarvis: loadJarvisWidget
    };

    function switchTab(name, btn) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      const target = document.getElementById('tab-' + name);
      if (!target) return;
      target.classList.add('active');
      const button = btn || document.querySelector(`.tab-btn[data-tab="${name}"]`);
      if (button) button.classList.add('active');
      if (name === 'kitchen') {
        initKitchen();
      } else if (typeof TAB_LOADERS !== 'undefined' && TAB_LOADERS[name]) {
        TAB_LOADERS[name]();
      }
    }

    document.getElementById('launch-form')?.addEventListener('submit', handleLaunchForm);

// Note: loadAll() and setInterval(loadAll, 10000) already called above
