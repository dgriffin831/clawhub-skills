# Guardrails Skill

Interactive security guardrails configuration for OpenClaw workspaces.

## What It Does

The guardrails skill helps you create a comprehensive `GUARDRAILS.md` file through an interactive interview process. It:

1. **Discovers** your workspace environment (skills, integrations, channels)
2. **Classifies** risk levels based on installed skills
3. **Interviews** you with contextual questions
4. **Generates** a customized GUARDRAILS.md file
5. **Monitors** your workspace for changes that need review

## Installation

This skill has no external dependencies - it uses only Node.js and Bash built-ins.

```bash
# No installation needed - ready to use
# Verify scripts are executable
chmod +x skills/guardrails/scripts/*.sh
chmod +x skills/guardrails/scripts/*.js
```

## Usage

### Setup Mode

Create your guardrails configuration for the first time:

```bash
guardrails setup
```

The agent will:
- Scan your workspace for installed skills
- Classify risk levels (destructive, external_comms, etc.)
- Ask you ~15-30 contextual questions
- Generate a GUARDRAILS.md file
- Save configuration to guardrails-config.json

### Review Mode

Check your existing guardrails against current workspace state:

```bash
guardrails review
```

The agent will:
- Re-scan your workspace
- Compare against existing config
- Ask only about gaps (new skills, removed skills)
- Update GUARDRAILS.md if needed

### Monitor Mode

Check for changes and potential violations:

```bash
guardrails monitor
```

The agent will:
- Run discovery and classification
- Compare against saved config
- Check memory logs for guardrail keywords
- Report status (ok, needs-attention, review-recommended)

## Architecture

```
skills/guardrails/
├── SKILL.md                    # Agent instructions (3 modes)
├── scripts/
│   ├── discover.sh             # Environment scanner (bash + jq)
│   ├── classify-risks.js       # Risk categorizer (Node.js)
│   ├── generate-guardrails.js  # GUARDRAILS.md generator (Node.js)
│   └── monitor.sh              # Change detector (bash + jq)
├── templates/
│   ├── guardrails-template.md  # Markdown template with placeholders
│   └── questions.json          # Question bank (30 questions)
├── schemas/
│   ├── risks.schema.json       # Risk output validation
│   └── config.schema.json      # Config output validation
└── README.md                   # This file
```

### Data Flow

**Setup Mode:**
```
discover.sh → classify-risks.js → questions.json
    ↓
agent conducts interview
    ↓
generate-guardrails.js → GUARDRAILS.md + guardrails-config.json
```

**Review Mode:**
```
discover.sh → classify-risks.js
    ↓
compare against guardrails-config.json
    ↓
ask about gaps only → update if needed
```

**Monitor Mode:**
```
discover.sh → classify-risks.js → compare → check memory
    ↓
JSON report (ok / needs-attention / review-recommended)
```

## Risk Categories

The skill classifies skills into these categories:

- **destructive** - Can delete or destroy data/resources
- **external_comms** - Can send external communications
- **data_read** - Can read or access data
- **data_write** - Can write or modify data
- **data_exfiltration** - Can export or share data externally
- **impersonation** - Can act on behalf of the user
- **system_modification** - Can modify system configuration
- **financial** - Can perform financial transactions

Classification is based on keyword matching in SKILL.md files.

## Question Categories

Questions are organized into:

1. **Identity & Context** - Who you are, timezone, preferences
2. **Data Sensitivity** - What data is sensitive
3. **External Communications** - Sending emails, tweets, messages
4. **Destructive Actions** - Deletion policies
5. **Data Exfiltration** - Upload and sharing controls
6. **Skill-Specific Policies** - Rules for individual skills
7. **Monitoring & Enforcement** - How guardrails are enforced

Questions are contextual - irrelevant questions are skipped based on your environment.

## Extending

### Adding New Questions

Edit `templates/questions.json`:

```json
{
  "id": "my_question",
  "category": "data_sensitivity",
  "question": "What is your policy on X?",
  "help": "This helps with Y.",
  "suggestions": [
    {"label": "Option 1", "value": "option1"},
    {"label": "Option 2", "value": "option2"}
  ],
  "defaultSuggestion": 0,
  "allowCustom": true,
  "dependsOn": {"integration": "some-tool"}
}
```

### Adding New Risk Categories

Edit `scripts/classify-risks.js`:

```javascript
const RISK_CATEGORIES = {
  my_category: {
    keywords: ['word1', 'word2', 'phrase'],
    description: 'What this category means'
  }
};
```

### Customizing the Template

Edit `templates/guardrails-template.md` and add placeholders like `{{MY_SECTION}}`.

Then update `scripts/generate-guardrails.js` to generate that section:

```javascript
const replacements = {
  '{{MY_SECTION}}': generateMySection(answers)
};
```

## Files Generated

### GUARDRAILS.md

The main guardrails document - markdown file with:
- Hard rules (never violate)
- Skill-specific policies
- Risk assessment
- Monitoring configuration
- User context

### guardrails-config.json

Machine-readable config for monitoring:
- Discovery snapshot
- Risk classification
- User answers
- Timestamps

## Design Principles

1. **No external dependencies** - Works anywhere Node.js runs
2. **Graceful degradation** - Missing files/skills don't break anything
3. **Stdout/stderr separation** - Data on stdout, progress on stderr
4. **Idempotent** - Safe to run multiple times
5. **Contextual** - Only asks relevant questions
6. **Transparent** - User reviews everything before writing

## Troubleshooting

### "jq: command not found"

Install jq:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### Scripts not executable

```bash
chmod +x skills/guardrails/scripts/*.sh
chmod +x skills/guardrails/scripts/*.js
```

### discover.sh fails

Check that workspace path is correct:
```bash
export WORKSPACE=/path/to/your/workspace
bash skills/guardrails/scripts/discover.sh
```

### JSON parsing errors

Ensure output is valid JSON:
```bash
bash skills/guardrails/scripts/discover.sh | jq .
```

## Contributing

This skill is designed to be extensible. Contributions welcome for:

- New risk categories
- Additional questions
- Better classification heuristics
- Integration-specific policies
- Template improvements

## License

Part of the OpenClaw project.
