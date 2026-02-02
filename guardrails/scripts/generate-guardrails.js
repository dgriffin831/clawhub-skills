#!/usr/bin/env node

/**
 * generate-guardrails.js - Generate GUARDRAILS.md from interview answers
 * Reads answers JSON from stdin, outputs GUARDRAILS.md to stdout
 * Writes guardrails-config.json to path from first CLI arg
 * No external dependencies - Node.js built-ins only
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../templates/guardrails-template.md');

/**
 * Generate external comms policy text
 */
function generateExternalCommsPolicy(answers) {
  const policy = answers.externalCommsPolicy || 'drafts-only';
  const userName = answers.identity?.name || 'the user';
  
  const policies = {
    'never': `- **Never send emails** on ${userName}'s behalf. This includes any email-sending mechanism.
- **Never post public content** on ${userName}'s behalf. This includes tweets, replies, and any social media posting.
- **Never create calendar events** that would send invitations to other people on ${userName}'s behalf.
- **Drafts are acceptable** — creating drafts for ${userName} to review and send is allowed.
- **The agent is invisible.** No external party should ever receive a communication that appears to come from ${userName} unless ${userName} explicitly dictates the exact content and instructs you to send it in that moment.
- **In group chats**, never speak as if you are ${userName}. You are a separate entity.`,
    'drafts-only': `- **Drafts only** — Agent prepares emails, tweets, and messages for ${userName} to review and send.
- **Never send** any external communication directly. ${userName} handles all sending.
- **In group chats**, never speak as if you are ${userName}. You are a separate entity.`,
    'ask-each-time': `- Agent **must ask before every** email, tweet, or message. Provide full preview and wait for explicit confirmation.
- **In group chats**, never speak as if you are ${userName}. You are a separate entity.`,
    'trusted-channels': `- Agent may send to trusted channels (${(answers.trustedChannels || []).join(', ') || 'none configured'}) without asking.
- All other channels require explicit confirmation before sending.
- **In group chats**, never speak as if you are ${userName}. You are a separate entity.`
  };
  
  return policies[policy] || policies['drafts-only'];
}

/**
 * Generate deletion policy text
 */
function generateDeletionPolicy(answers) {
  const policy = answers.deletionPolicy || 'always-ask';
  const userName = answers.identity?.name || 'the user';
  
  const policies = {
    'always-ask': `- **Never delete files** — locally, on Google Drive, or anywhere else — without ${userName} explicitly saying to delete that specific item.
- **Never delete emails** or move them to trash. Labeling and archiving are fine; deletion is not.
- **Never delete calendar events.** Modifying reminders/notifications on existing events is fine; deleting events is not.
- **Never delete VMs, containers, snapshots, or backups** without explicit instruction.
- **Never delete memory files** (\`memory/*.md\`, \`MEMORY.md\`) — only append or edit content within them.
- **"Clean up" or "organize" is NOT permission to delete.** If something needs deleting during cleanup, list what you'd remove and ask first.`,
    'ask-unless-temp': `- Ask before deletion, **except for temporary files** in \`/tmp\` or files explicitly marked as disposable.
- **Never delete emails, calendar events, or cloud resources** without asking.
- **"Clean up" is NOT permission to delete** — list what you'd remove and ask first.`,
    'allowed-with-confirmation': `- Deletion allowed with **confirmation** — agent describes exactly what will be deleted and waits for approval.
- For bulk deletions, provide a summary count and sample items before proceeding.`,
    'prefer-archive': `- **Use trash/archive instead of delete** — prefer reversible operations at all times.
- \`trash\` > \`rm\` (recoverable beats gone forever).
- Permanent deletion requires explicit permission from ${userName}.`
  };
  
  return policies[policy] || policies['always-ask'];
}

/**
 * Generate sub-agent inheritance policy text
 */
function generateSubagentPolicy(answers) {
  const policy = answers.subagentInheritance || 'full';
  
  const policies = {
    'full': 'Full inheritance — all guardrails apply equally to sub-agents',
    'partial': 'Partial — core rules (deletion, exfiltration, impersonation) apply; data access rules relaxed for task scope',
    'minimal': 'Minimal — sub-agents are sandboxed with only basic safety rules',
    'custom': 'Custom per sub-agent — guardrails specified in spawn task description'
  };
  
  return policies[policy] || policies['full'];
}

/**
 * Generate restricted directories text
 */
function generateRestrictedDirectories(answers) {
  const paths = answers.sensitiveDataPolicy?.restrictedPaths || [];
  
  if (paths.length === 0) {
    return '**No restricted directories configured** - agent has full filesystem access (not recommended).';
  }
  
  return `**NEVER access** (read, list, search, or download) these directories:\n${paths.map(p => `- \`${p}\``).join('\n')}\n\nOr any of their subdirectories.`;
}

/**
 * Generate sensitive data policy text
 */
function generateSensitiveDataPolicy(answers) {
  return 'Never read, store, log, or transmit sensitive data in plain text.';
}

/**
 * Generate sensitive data types list
 */
function generateSensitiveDataTypes(answers) {
  const types = answers.sensitiveDataPolicy?.sensitiveTypes || ['ssn', 'password', 'api_key', 'credit_card'];
  
  const labels = {
    'ssn': 'Social Security Numbers',
    'password': 'Passwords',
    'api_key': 'API Keys',
    'credit_card': 'Credit Card Numbers',
    'bank_account': 'Bank Account Numbers',
    'private_key': 'Private Keys / Certificates',
    'health_record': 'Health Records',
    'tax_id': 'Tax IDs'
  };
  
  return types.map(t => `- ${labels[t] || t}`).join('\n');
}

/**
 * Generate data exfiltration policy text
 */
function generateDataExfiltrationPolicy(answers) {
  const policy = answers.dataExfiltrationPolicy || 'trusted-endpoints';
  const userName = answers.identity?.name || 'the user';
  
  const policies = {
    'private-only': `- **Never post, upload, or transmit private data to any external service.**
- All data stays in the private workspace. No exceptions.`,
    'trusted-endpoints': `- **Never post, upload, or transmit private data to public locations.** This includes public repos, paste services, public APIs, social media, or any endpoint not within ${userName}'s private infrastructure.
- Uploads allowed **only to trusted endpoints**: ${(answers.trustedUploadEndpoints || ['drive.google.com']).join(', ')}. All other uploads blocked.
- **Never include private data in search queries** (web search, SerpAPI, or any search tool).
- **Never include private data in prompts to external APIs** beyond what's required for the current task.
- **Private data includes:** personal information, financial data, authentication credentials, family details, work information, and anything from restricted directories.`,
    'ask-each-time': `- **Ask before every upload** or external data transmission.
- Provide details about destination, data content, and purpose before proceeding.`,
    'allowed-with-logging': `- External uploads allowed with **full logging** of destination, data size, and timestamp.
- **Never include private data in search queries** regardless of upload policy.`
  };
  
  return policies[policy] || policies['trusted-endpoints'];
}

/**
 * Generate need-to-know policy text
 */
function generateNeedToKnowPolicy(answers) {
  return `- API keys stay in \`openclaw.json\` only
- Strip sensitive details from summaries and reports
- Sub-agents get **minimum necessary context**
- **No personal data in group chats** (policy: ${answers.groupChatPolicy || 'minimal'})`;
}

/**
 * Generate write containment policy text
 */
function generateWriteContainmentPolicy(answers) {
  const policy = answers.writeContainmentPolicy || {restricted: true, allowedPaths: ['/home/ubuntu/.openclaw/workspace']};
  
  if (!policy.restricted) {
    return '**No write restrictions** - agent can write files anywhere (not recommended).';
  }
  
  const paths = policy.allowedPaths || [];
  return `ALL file writes restricted to:\n${paths.map(p => `- \`${p}\``).join('\n')}\n\nWrites outside these paths require explicit permission.`;
}

/**
 * Generate skill-specific policies — grouped by skill (not by risk category)
 */
function generateSkillPolicies(answers, classification) {
  const skillPolicies = answers.skillPolicies || {};
  const risksBySkill = classification.risksBySkill || {};
  const categoryDescs = classification.riskCategoryDescriptions || {};
  let output = '';

  // Collect all unique skills that have either a policy or risk flags
  const allSkills = new Set([
    ...Object.keys(skillPolicies),
    ...Object.keys(risksBySkill)
  ]);

  // Sort: skills with explicit policies first, then alphabetical
  const sorted = [...allSkills].sort((a, b) => {
    const aHasPolicy = !!skillPolicies[a];
    const bHasPolicy = !!skillPolicies[b];
    if (aHasPolicy && !bHasPolicy) return -1;
    if (!aHasPolicy && bHasPolicy) return 1;
    return a.localeCompare(b);
  });

  for (const skillName of sorted) {
    const policy = skillPolicies[skillName] || {};
    const skillRisks = risksBySkill[skillName]?.categories || [];
    const allowed = policy.allowed || [];
    const blocked = policy.blocked || [];
    const notes = policy.notes || '';

    // Skip skills with no policy and only low-risk categories
    const highRiskCats = ['destructive', 'external_comms', 'data_exfiltration', 'impersonation', 'system_modification', 'financial'];
    const hasHighRisk = skillRisks.some(c => highRiskCats.includes(c));
    if (allowed.length === 0 && blocked.length === 0 && !notes && !hasHighRisk) continue;

    // Format risk tags
    const riskTags = skillRisks.length > 0
      ? ` *(${skillRisks.map(c => c.replace(/_/g, ' ')).join(', ')})*`
      : '';

    output += `### ${skillName}${riskTags}\n\n`;

    if (allowed.length > 0) {
      for (const action of allowed) {
        output += `- ✅ ${action}\n`;
      }
    }
    if (blocked.length > 0) {
      for (const action of blocked) {
        output += `- ❌ **NEVER** ${action}\n`;
      }
    }
    if (notes) {
      output += `- ${notes}\n`;
    }
    if (allowed.length === 0 && blocked.length === 0 && !notes) {
      output += `- *No specific policy — use default guardrails*\n`;
    }
    output += '\n';
  }

  if (output === '') {
    output = '*No high-risk skills detected.*\n';
  }

  return output;
}

/**
 * Generate risk categories summary
 */
function generateRiskCategories(classification) {
  let output = '';
  
  for (const [category, skills] of Object.entries(classification.risksByCategory || {})) {
    if (skills.length === 0) continue;
    
    const description = classification.riskCategoryDescriptions?.[category]?.description || category;
    output += `- **${category.replace(/_/g, ' ')}** (${skills.length}): ${description}\n`;
  }
  
  return output || '*No risk categories identified.*';
}

/**
 * Generate monitoring policy text
 */
function generateMonitoringPolicy(answers) {
  const frequency = answers.monitoringFrequency || 'weekly';
  
  return `Guardrails are monitored **${frequency}** for changes (new skills, modified configuration). Run \`guardrails monitor\` to check manually.`;
}

/**
 * Generate violation policy text
 */
function generateViolationPolicy(answers) {
  const policy = answers.violationNotification || 'block-notify';
  
  const policies = {
    'block-notify': 'Block action and notify user immediately',
    'block-log': 'Block action and log silently',
    'warn-ask': 'Warn user and ask for permission',
    'log-only': 'Log violation but allow action'
  };
  
  return policies[policy] || policies['block-notify'];
}

/**
 * Generate incident logging text
 */
function generateIncidentLogging(answers) {
  const policy = answers.incidentReporting || 'full';
  
  const policies = {
    'full': 'All guardrail violations and blocked actions logged to memory',
    'critical-only': 'Only critical security incidents logged',
    'summary': 'Summary statistics only, no detailed logs',
    'none': 'No incident logging'
  };
  
  return policies[policy] || policies['full'];
}

/**
 * Main generation logic
 */
function main() {
  const configPath = process.argv[2];
  
  if (!configPath) {
    console.error('❌ Error: config output path required');
    console.error('Usage: node generate-guardrails.js <config-output-path>');
    process.exit(1);
  }
  
  // Read answers JSON from stdin
  let inputData = '';
  
  process.stdin.on('data', chunk => {
    inputData += chunk;
  });
  
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(inputData);
      const { discovery, classification, answers } = data;
      
      console.error('📝 Generating GUARDRAILS.md...\n');
      
      // Load template
      const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
      
      // Build replacements
      const riskCategoryCount = Object.entries(classification.risksByCategory || {})
        .filter(([_, skills]) => skills.length > 0).length;

      const replacements = {
        '{{TIMESTAMP}}': new Date().toISOString(),
        '{{OVERALL_RISK_LEVEL}}': classification.overallRiskLevel || 'UNKNOWN',
        '{{EXTERNAL_COMMS_POLICY}}': generateExternalCommsPolicy(answers),
        '{{DELETION_POLICY}}': generateDeletionPolicy(answers),
        '{{RESTRICTED_DIRECTORIES}}': generateRestrictedDirectories(answers),
        '{{SENSITIVE_DATA_POLICY}}': generateSensitiveDataPolicy(answers),
        '{{SENSITIVE_DATA_TYPES}}': generateSensitiveDataTypes(answers),
        '{{DATA_EXFILTRATION_POLICY}}': generateDataExfiltrationPolicy(answers),
        '{{NEED_TO_KNOW_POLICY}}': generateNeedToKnowPolicy(answers),
        '{{WRITE_CONTAINMENT_POLICY}}': generateWriteContainmentPolicy(answers),
        '{{SKILL_POLICIES}}': generateSkillPolicies(answers, classification),
        '{{SKILL_COUNT}}': (discovery.skills || []).length.toString(),
        '{{RISK_CATEGORY_COUNT}}': riskCategoryCount.toString(),
        '{{RISK_CATEGORIES}}': generateRiskCategories(classification),
        '{{MONITORING_POLICY}}': generateMonitoringPolicy(answers),
        '{{VIOLATION_POLICY}}': generateViolationPolicy(answers),
        '{{INCIDENT_LOGGING}}': generateIncidentLogging(answers),
        '{{SUBAGENT_POLICY}}': generateSubagentPolicy(answers),
        '{{USER_NAME}}': answers.identity?.name || 'User',
        '{{TIMEZONE}}': answers.identity?.timezone || 'UTC',
        '{{USER_PREFERENCES}}': answers.identity?.preferences || 'Not specified'
      };
      
      // Apply replacements
      let output = template;
      for (const [placeholder, value] of Object.entries(replacements)) {
        output = output.replace(new RegExp(placeholder, 'g'), value);
      }
      
      // Write GUARDRAILS.md to stdout
      console.log(output);
      
      // Write config JSON to file
      const config = {
        version: '1.0',
        generated: new Date().toISOString(),
        discovery,
        classification,
        answers
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.error(`\n✅ Config saved to: ${configPath}\n`);
      
    } catch (error) {
      console.error('❌ Error generating guardrails:', error.message);
      process.exit(1);
    }
  });
}

main();
