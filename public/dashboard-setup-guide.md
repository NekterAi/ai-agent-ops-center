# OpenClaw Command Dashboard
## Complete Setup & Configuration Guide

**Turn your Mac Mini into a visual AI operations center**

---

## What Is This?

The OpenClaw Command Dashboard gives you a **live, visual interface** for managing your AI agents - no more CLI commands to check status or dig through logs.

**What you get:**
- 🟢 **Live agent status** - See what each agent is doing in real-time
- 💰 **Cost tracking** - Monitor token usage and monthly spend
- 📊 **Session management** - View active conversations, pause/resume sessions
- ⏰ **Cron job manager** - Schedule tasks, see next run times
- 💬 **Agent coordination** - Send tasks between agents (Executive → Dev → Creative)
- 📁 **Memory browser** - Read/edit MEMORY.md and daily logs from the web
- 🔔 **Live activity feed** - Real-time stream of what your agents are working on

**Perfect for:**
- Running multiple agents (Executive, Dev, Creative)
- Monitoring costs without SSH'ing into your Mac Mini
- Coordinating tasks across agents
- Demoing your AI setup to clients or friends

---

## Prerequisites

Before starting:
- ✅ OpenClaw already installed and running (see Premium Setup Package)
- ✅ At least one agent configured
- ✅ Node.js 20+ installed
- ✅ Basic Terminal familiarity

**Time to complete:** 30-45 minutes

---

# Part 1: Installation

## Step 1: Download the Dashboard

```bash
# Go to your home directory
cd ~

# Clone the dashboard repo
git clone https://github.com/NekterAi/nekter-dashboard.git

# Enter the directory
cd nekter-dashboard

# Install dependencies (takes 1-2 minutes)
npm install
```

Wait for installation to complete. You'll see:
```
added 150 packages in 45s
```

---

## Step 2: Configure Environment

Create a `.env` file with your settings:

```bash
# Create the file
nano .env
```

**Paste this:**
```bash
PORT=3001
OPENCLAW_HOME=/Users/yourusername/.openclaw
NODE_ENV=production
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password-here
```

**Important changes:**
- Replace `/Users/yourusername` with your actual username
- Change `your-secure-password-here` to a strong password

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 3: Test the Dashboard

```bash
# Start the server
npm start
```

You should see:
```
🚀 Nekter Dashboard running on http://localhost:3001
✅ OpenClaw gateway connected
✅ 1 agent(s) detected
```

**Open your browser:**
- Go to: `http://localhost:3001`
- Username: `admin` (or whatever you set in .env)
- Password: (what you set in .env)

**You should see:**
- Your agent(s) listed
- Current cost display
- Live activity feed

**If it works, press `Ctrl+C` to stop it.** We'll set up auto-start next.

---

# Part 2: Auto-Start Configuration

## Step 4: Make It Run 24/7

Create a LaunchAgent so the dashboard starts automatically when your Mac Mini boots:

```bash
# Create the plist file
cat > ~/Library/LaunchAgents/ai.nekter.dashboard.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.nekter.dashboard</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOURUSERNAME/nekter-dashboard/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOURUSERNAME/nekter-dashboard</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/nekter-dashboard.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/nekter-dashboard-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF
```

**IMPORTANT:** Replace `YOURUSERNAME` with your actual Mac username:

```bash
# Find your username
whoami

# Edit the plist file
nano ~/Library/LaunchAgents/ai.nekter.dashboard.plist
```

Replace both instances of `YOURUSERNAME` with the output from `whoami`.

**Save:** `Ctrl+X`, `Y`, `Enter`

---

## Step 5: Load and Verify

```bash
# Load the launch agent
launchctl load ~/Library/LaunchAgents/ai.nekter.dashboard.plist

# Check if it's running
launchctl list | grep nekter
```

Should show:
```
-	0	ai.nekter.dashboard
```

**Test it:**
- Open browser: `http://localhost:3001`
- Should load without running `npm start`

**Now the dashboard starts automatically when your Mac Mini boots.** ✅

---

# Part 3: Features Walkthrough

## The Kitchen Tab (Main View)

**What you see:**
- **Agent Status** - Green dot = active, gray = idle
- **Token Rate Monitor** - Real-time token usage
- **Cost Display** - Monthly subscription cost (not fake API pricing)
- **Session Cards** - Active conversations each agent is having
- **Cron Jobs** - Scheduled tasks with next run time
- **Memory Files** - Quick access to MEMORY.md, daily logs

**Pro tip:** Leave this tab open on a second monitor for live monitoring.

---

## Live Agent Feed

**What it shows:**
- Every message your agents send/receive
- Tool calls (web searches, file edits, etc.)
- Sub-agent spawns
- Cron job runs

**Use cases:**
- Debug why an agent isn't responding
- See what tasks are running in the background
- Monitor for runaway token usage
- Demo your setup to clients

---

## Session Management

**View all active sessions:**
- Main conversations
- Sub-agents (spawned for background work)
- Isolated sessions (cron jobs, scheduled tasks)

**Actions you can take:**
- Pause a session (stop token burn)
- View session history
- See total tokens used

**Emergency stop:**
If an agent is burning tokens too fast, click "Pause" to immediately stop it.

---

## Cron Job Manager

**See all scheduled tasks:**
- Morning briefings
- Heartbeat checks
- Twitter auto-posts
- Custom reminders

**For each job:**
- Next run time
- Last run time
- Enabled/disabled status

**Create new cron jobs:**
(Requires CLI for now - web UI coming soon)

```bash
openclaw cron add \
  --name "Daily standup" \
  --schedule "0 9 * * *" \
  --task "Read HEARTBEAT.md and give me a morning briefing"
```

---

## Memory File Browser

**Read/edit from the web:**
- MEMORY.md
- Daily logs (memory/2026-02-25.md)
- AGENTS.md, USER.md, SOUL.md

**Why this is useful:**
- Update agent instructions from your phone
- Review what happened while you were away
- Edit memory files without SSH

---

## Cost Tracking

**Displays:**
- Monthly subscription cost ($40-160/mo depending on your setup)
- Token usage per agent
- Theoretical API cost (to show your savings)

**Note:** If you're using setup tokens (Claude Pro, ChatGPT Plus), your actual cost is the flat subscription, NOT the displayed API cost. The API number just shows what you WOULD be paying.

---

# Part 4: Multi-Agent Setup

## Running Multiple Agents

If you want Executive, Dev, and Creative agents all on one dashboard:

### 1. Create separate agent configs

```bash
# Executive agent
openclaw agents create executive --workspace ~/openclaw-workspace

# Dev agent
openclaw agents create dev --workspace ~/openclaw-workspace-dev

# Creative agent
openclaw agents create creative --workspace ~/openclaw-workspace-creative
```

### 2. Configure each workspace

Each agent needs its own:
- AGENTS.md (role definition)
- SOUL.md (personality)
- USER.md (same for all - your info)
- MEMORY.md (shared or separate - your choice)

### 3. Start all agents

```bash
openclaw agents start executive
openclaw agents start dev
openclaw agents start creative
```

### 4. Dashboard auto-detects them

Refresh the dashboard - all 3 agents now show up with separate status cards.

---

## Agent Coordination

**Use the dashboard to send tasks between agents:**

```bash
# From the CLI or via dashboard API
curl -X POST "http://localhost:3001/api/messages" \
  -u "admin:your-password" \
  -H "Content-Type: application/json" \
  -d '{
    "from_agent": "Executive",
    "to_agent": "Dev",
    "type": "task",
    "content": "Deploy the latest changes to production"
  }'
```

**The message shows up:**
- In the Live Feed
- In Dev agent's message queue
- Logged in the coordination history

---

# Part 5: Troubleshooting

## Issue 1: Dashboard Won't Start

**Symptoms:** `npm start` fails or exits immediately

**Check:**
```bash
# Is OpenClaw running?
openclaw status

# Is port 3001 already in use?
lsof -i:3001
```

**Fix:**
```bash
# If port is in use, kill the process
kill -9 <pid>

# Restart dashboard
npm start
```

---

## Issue 2: Can't Log In (401 Unauthorized)

**Symptoms:** Browser shows "Unauthorized" even with correct password

**Check:**
```bash
# Verify .env file exists
cat ~/nekter-dashboard/.env
```

**Fix:**
```bash
# Re-create .env with correct password
cd ~/nekter-dashboard
nano .env

# Update AUTH_PASSWORD
# Save and restart dashboard
```

---

## Issue 3: Agents Not Showing Up

**Symptoms:** Dashboard shows 0 agents

**Check:**
```bash
# Are agents actually running?
openclaw agents list

# Is OPENCLAW_HOME correct in .env?
echo $OPENCLAW_HOME
```

**Fix:**
```bash
# Update .env with correct path
cd ~/nekter-dashboard
nano .env

# Set OPENCLAW_HOME to match: openclaw config show | grep home
# Restart dashboard
```

---

## Issue 4: Live Feed Shows Nothing

**Symptoms:** Feed stays empty even when agents are active

**Check:**
```bash
# Is the SSE endpoint working?
curl -N http://localhost:3001/api/kitchen/feed
```

**Fix:**
```bash
# Restart the dashboard
launchctl unload ~/Library/LaunchAgents/ai.nekter.dashboard.plist
launchctl load ~/Library/LaunchAgents/ai.nekter.dashboard.plist
```

---

## Issue 5: Cost Shows $0 or Wrong Amount

**Symptoms:** Token rate monitor reads zero

**Check:**
```bash
# Do you have active sessions?
openclaw sessions list
```

**Fix:**
```bash
# Restart an agent to create a session
openclaw agents restart main

# Or start a new chat
openclaw chat
```

---

## Issue 6: Launch Agent Not Starting on Boot

**Symptoms:** Dashboard not running after Mac Mini restart

**Check:**
```bash
launchctl list | grep nekter
```

**Fix:**
```bash
# Unload and reload
launchctl unload ~/Library/LaunchAgents/ai.nekter.dashboard.plist
launchctl load ~/Library/LaunchAgents/ai.nekter.dashboard.plist

# Check logs
tail -f /tmp/nekter-dashboard-error.log
```

Common causes:
- Wrong Node.js path in plist
- Wrong username in plist file paths
- Missing .env file

---

## Issue 7: Can't Access from Other Devices

**Symptoms:** Works on `localhost:3001` but not from phone/laptop

**This is by design** - the dashboard binds to localhost for security.

**To access from other devices:**

1. **Find your Mac Mini's local IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. **Edit server.js to bind to 0.0.0.0:**
```bash
cd ~/nekter-dashboard
nano server.js
```

Find:
```javascript
app.listen(PORT, 'localhost', () => {
```

Change to:
```javascript
app.listen(PORT, '0.0.0.0', () => {
```

**Save and restart dashboard.**

3. **Access from other devices:**
```
http://YOUR-MAC-IP:3001
```

**Security warning:** This exposes the dashboard to your local network. Make sure you have a strong AUTH_PASSWORD set.

---

# Part 6: Advanced Tips

## Monitoring from Your Phone

1. Access dashboard via local IP (see Issue 7 above)
2. Bookmark it on your phone's home screen
3. Check agent status from anywhere in your house

---

## Reduce Token Burn

**Watch the Token Rate Monitor:**
- If it spikes above 100K tokens/hour, investigate
- Check which session is burning tokens (Session Management tab)
- Pause or kill the greedy session

**Set up alerts:**
```bash
# Create a monitoring script
cat > ~/scripts/token-alert.sh << 'EOF'
#!/bin/bash
TOKENS=$(curl -s -u admin:your-password http://localhost:3001/api/kitchen/stats | jq '.totalTokens')
if (( TOKENS > 500000 )); then
  curl -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" \
    -d "chat_id=$CHAT_ID&text=⚠️ Token usage high: $TOKENS"
fi
EOF

chmod +x ~/scripts/token-alert.sh

# Run every hour
crontab -e
# Add: 0 * * * * ~/scripts/token-alert.sh
```

---

## Dashboard as a Demo Tool

**Showing off your AI setup?**

1. Open dashboard in presentation mode (full screen browser)
2. Start a conversation with your agent via Telegram
3. Watch the Live Feed light up in real-time
4. Show cost tracking (prove you're spending $40/mo, not $500)

**Looks impressive** - way better than showing Terminal logs.

---

## Custom Styling

Want to change colors or layout?

```bash
cd ~/nekter-dashboard/public
nano styles.css
```

Edit CSS to match your brand. Changes take effect after refresh (no restart needed).

---

# Part 7: What's Next

## You Now Have a Full Operations Center

Your Mac Mini dashboard gives you:
- ✅ Visual monitoring of all agents
- ✅ Cost tracking to prevent surprises
- ✅ Session management for quick intervention
- ✅ Agent coordination for multi-agent workflows
- ✅ Memory file editing from the web
- ✅ Live activity feed for transparency

## Next Steps

### 1. Set Up Agent Coordination
Create specialized agents (Executive, Dev, Creative) and use the dashboard to send tasks between them.

### 2. Automate Your Workflows
Use cron jobs to schedule:
- Morning briefings
- Twitter auto-posts
- Email checks
- Project status updates

### 3. Build Client Dashboards
Clone the repo and customize it for client deployments. White-label it as your own AI ops platform.

### 4. Scale to Multiple Mac Minis
Run the dashboard on one machine, connect agents from multiple Mac Minis for a distributed AI fleet.

---

## Need Help?

**Email Support:** spencer@nekterai.com  
**Response time:** Within 24 hours

**Want us to set this up for you?**  
Book a white-glove setup call: https://calendly.com/spencer-nekter/30min

**OpenClaw Docs:** https://docs.openclaw.ai  
**Dashboard Repo:** https://github.com/NekterAi/nekter-dashboard

---

## Quick Reference

```bash
# Start dashboard manually
cd ~/nekter-dashboard && npm start

# Check if auto-start is working
launchctl list | grep nekter

# View dashboard logs
tail -f /tmp/nekter-dashboard.log

# Restart dashboard service
launchctl unload ~/Library/LaunchAgents/ai.nekter.dashboard.plist
launchctl load ~/Library/LaunchAgents/ai.nekter.dashboard.plist

# Check OpenClaw connection
curl http://localhost:3001/api/kitchen/stats

# Post message between agents (coordination)
curl -X POST "http://localhost:3001/api/messages" \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{"from_agent":"Executive","to_agent":"Dev","type":"task","content":"Deploy latest"}'
```

---

**That's it! You now have a pro-level AI operations dashboard.**

Questions? Email spencer@nekterai.com

**© 2026 Nekter AI | Las Vegas, NV**
