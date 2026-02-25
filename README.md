# AI Agent Ops Center

**Visual command dashboard for OpenClaw AI agents**

Monitor and manage your AI agents in real-time with a clean web interface - no more digging through CLI commands.

![AI Agent Ops Center](https://img.shields.io/badge/OpenClaw-Dashboard-blue)

## Features

- 🟢 **Live Agent Status** - See what each agent is doing in real-time
- 💰 **Cost Tracking** - Monitor token usage and monthly spend
- 📊 **Session Management** - View active conversations, pause/resume sessions
- ⏰ **Cron Job Manager** - Schedule tasks, see next run times
- 💬 **Agent Coordination** - Send tasks between agents
- 📁 **Memory Browser** - Read/edit memory files from the web
- 🔔 **Live Activity Feed** - Real-time stream of agent activity

## Quick Start

```bash
# Clone the repo
git clone https://github.com/NekterAi/ai-agent-ops-center.git
cd ai-agent-ops-center

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
OPENCLAW_HOME=$HOME/.openclaw
NODE_ENV=production
AUTH_USERNAME=admin
AUTH_PASSWORD=change-me-please
EOF

# Start the dashboard
npm start
```

Open http://localhost:3001 in your browser.

## Documentation

For complete installation and configuration guide, see:
- [Dashboard Setup Guide](https://nekterai.gumroad.com/l/dashboard-setup) (comprehensive walkthrough)
- [OpenClaw Docs](https://docs.openclaw.ai)

## Requirements

- Node.js 20+
- OpenClaw installed and running
- macOS, Linux, or Windows (WSL)

## Multi-Agent Support

The dashboard automatically detects and displays all running OpenClaw agents. Perfect for coordinating Executive, Dev, and Creative agents in a single operations center.

## Screenshots

*Coming soon - dashboard in action with live agent monitoring*

## Security

The dashboard includes basic auth out of the box. For production use:
- Change `AUTH_PASSWORD` in `.env` to a strong password
- Consider running behind a reverse proxy (nginx) with SSL
- By default, binds to `localhost` only - edit `server.js` to expose to network

## Auto-Start on Boot

**macOS (LaunchAgent):**
```bash
cat > ~/Library/LaunchAgents/ai.agent-ops-center.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.agent-ops-center</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/PATH/TO/ai-agent-ops-center/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/PATH/TO/ai-agent-ops-center</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/ai.agent-ops-center.plist
```

**Linux (systemd):**
```bash
sudo nano /etc/systemd/system/ai-agent-ops-center.service
```

Add:
```ini
[Unit]
Description=AI Agent Ops Center
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/ai-agent-ops-center
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable ai-agent-ops-center
sudo systemctl start ai-agent-ops-center
```

## Contributing

Pull requests welcome! Please ensure:
- Code follows existing style
- No sensitive data in commits
- Test changes locally before submitting

## License

MIT

## Support

- Email: spencer@nekterai.com
- Issues: https://github.com/NekterAi/ai-agent-ops-center/issues
- Docs: https://docs.openclaw.ai

## About

Built by [Nekter AI](https://nekterai.com) - Running AI agents as a business, not a hobby.

---

**Save $400-900/month** vs traditional API costs by running agents 24/7 on a Mac Mini with this dashboard.
