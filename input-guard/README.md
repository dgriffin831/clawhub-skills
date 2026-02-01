# Input Guard

A defensive security skill that scans untrusted external text for embedded prompt injection attacks targeting AI agents. Pure Python with zero external dependencies.

## Features

- **16 detection categories** covering instruction override, role manipulation, system mimicry, jailbreak attempts, data exfiltration, dangerous commands, token smuggling, emotional manipulation, and more
- **Multi-language support** for English, Korean, Japanese, and Chinese patterns
- **4 sensitivity levels**: `low`, `medium` (default), `high`, `paranoid`
- **Multiple output formats**: human-readable, JSON, quiet mode
- **No external dependencies** — runs anywhere Python 3 is available
- **Optional MoltThreats integration** for community threat reporting

## Quick Start

```bash
# Inline text
bash scripts/scan.sh "text to check"

# From file
bash scripts/scan.sh --file /tmp/content.txt

# From pipe
echo "content" | bash scripts/scan.sh --stdin

# JSON output
bash scripts/scan.sh --json "text to check"

# High sensitivity
python3 scripts/scan.py --sensitivity high "text to check"
```

## Severity Levels

| Level | Score | Exit Code | Action |
|-------|-------|-----------|--------|
| SAFE | 0 | 0 | Process normally |
| LOW | 1-25 | 0 | Log for awareness |
| MEDIUM | 26-50 | 1 | Stop, alert human |
| HIGH | 51-80 | 1 | Stop, alert human |
| CRITICAL | 81-100 | 1 | Stop, urgent alert |

## When to Use

Run Input Guard **before** processing text from:

- Web pages (fetched content, browser snapshots)
- Social media posts and search results
- Web search results
- Third-party API responses
- Any externally-sourced text

## Workflow

```
Fetch external content → Scan with Input Guard → Check severity
  ├─ SAFE/LOW    → Proceed normally
  └─ MEDIUM+     → Block content, alert human, optionally report
```

## Detection Categories

1. Instruction Override
2. Role Manipulation
3. System Mimicry
4. Jailbreak Attempts
5. Guardrail Bypass
6. Data Exfiltration
7. Dangerous Commands
8. Authority Impersonation
9. Context Hijacking
10. Token Smuggling
11. Safety Bypass
12. Agent Sovereignty Manipulation
13. Call to Action
14. Emotional Manipulation
15. JSON Injection
16. Prompt Extraction

## Project Structure

```
input-guard/
├── SKILL.md                    # Skill documentation
├── INTEGRATION.md              # Integration guide
├── README.md                   # This file
├── CHANGELOG.md                # Version history
└── scripts/
    ├── scan.py                 # Core scanner (Python 3)
    ├── scan.sh                 # Shell wrapper
    └── report-to-molthreats.sh # Community threat reporting
```

## Documentation

- **[SKILL.md](SKILL.md)** — Full skill specification, configuration, and agent integration patterns
- **[INTEGRATION.md](INTEGRATION.md)** — Detailed integration guide with workflow examples

## Credits

Inspired by [prompt-guard](https://github.com/seojoonkim) by seojoonkim.

## License

See repository root for license information.
