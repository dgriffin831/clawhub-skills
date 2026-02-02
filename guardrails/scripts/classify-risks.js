#!/usr/bin/env node

/**
 * classify-risks.js - Categorize skills by risk level
 * Reads discovery JSON from stdin, outputs risk classification to stdout
 * No external dependencies - Node.js built-ins only
 */

const fs = require('fs');
const path = require('path');

// Risk categories and their keywords
const RISK_CATEGORIES = {
  destructive: {
    keywords: ['delete', 'remove', 'purge', 'destroy', 'rm ', 'unlink', 'clear', 'wipe', 'erase'],
    description: 'Can delete or destroy data/resources'
  },
  external_comms: {
    keywords: ['send', 'post', 'tweet', 'message', 'email', 'publish', 'broadcast', 'notify'],
    description: 'Can send external communications'
  },
  data_read: {
    keywords: ['read', 'search', 'download', 'fetch', 'get', 'query', 'list', 'show'],
    description: 'Can read or access data'
  },
  data_write: {
    keywords: ['write', 'upload', 'create', 'modify', 'update', 'save', 'store', 'edit'],
    description: 'Can write or modify data'
  },
  data_exfiltration: {
    keywords: ['upload', 'publish', 'share', 'export', 'sync', 'backup', 'transfer'],
    description: 'Can export or share data externally'
  },
  impersonation: {
    keywords: ['send email', 'post tweet', 'create event', 'reply', 'comment', 'as you', 'on behalf'],
    description: 'Can act on behalf of the user'
  },
  system_modification: {
    keywords: ['config', 'firewall', 'network', 'restart', 'reboot', 'install', 'uninstall', 'chmod', 'chown'],
    description: 'Can modify system configuration'
  },
  financial: {
    keywords: ['trade', 'buy', 'sell', 'payment', 'stock', 'crypto', 'wallet', 'transaction', 'purchase'],
    description: 'Can perform financial transactions'
  }
};

/**
 * Read and classify a skill's SKILL.md file
 */
function classifySkill(skillName, skillPath) {
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  
  if (!fs.existsSync(skillMdPath)) {
    return { categories: [], content: '' };
  }
  
  const content = fs.readFileSync(skillMdPath, 'utf8').toLowerCase();
  const categories = [];
  
  // Check each risk category
  for (const [category, config] of Object.entries(RISK_CATEGORIES)) {
    const hasMatch = config.keywords.some(keyword => content.includes(keyword));
    if (hasMatch) {
      categories.push(category);
    }
  }
  
  return { categories, content };
}

/**
 * Calculate overall risk level
 */
function calculateRiskLevel(risksByCategory) {
  const highRiskCategories = ['destructive', 'external_comms', 'data_exfiltration', 'impersonation', 'financial', 'system_modification'];
  const mediumRiskCategories = ['data_write'];
  const lowRiskCategories = ['data_read'];
  
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  
  for (const [category, skills] of Object.entries(risksByCategory)) {
    if (skills.length === 0) continue;
    
    if (highRiskCategories.includes(category)) {
      highRiskCount++;
    } else if (mediumRiskCategories.includes(category)) {
      mediumRiskCount++;
    }
  }
  
  if (highRiskCount >= 3) return 'HIGH';
  if (highRiskCount >= 1) return 'MEDIUM';
  if (mediumRiskCount >= 2) return 'MEDIUM';
  return 'LOW';
}

/**
 * Identify uncovered risk categories
 */
function findUncoveredCategories(risksByCategory) {
  const covered = Object.keys(risksByCategory).filter(cat => risksByCategory[cat].length > 0);
  const all = Object.keys(RISK_CATEGORIES);
  return all.filter(cat => !covered.includes(cat));
}

/**
 * Main classification logic
 */
function main() {
  // Read discovery JSON from stdin
  let inputData = '';
  
  process.stdin.on('data', chunk => {
    inputData += chunk;
  });
  
  process.stdin.on('end', () => {
    try {
      const discovery = JSON.parse(inputData);
      
      console.error('🔍 Classifying risks...\n');
      
      const risksByCategory = {};
      const risksBySkill = {};
      
      // Initialize categories
      for (const category of Object.keys(RISK_CATEGORIES)) {
        risksByCategory[category] = [];
      }
      
      // Classify each skill
      for (const skill of discovery.skills || []) {
        const { categories } = classifySkill(skill.name, skill.path);
        
        risksBySkill[skill.name] = {
          categories,
          description: skill.description
        };
        
        // Add to category lists
        for (const category of categories) {
          if (!risksByCategory[category].includes(skill.name)) {
            risksByCategory[category].push(skill.name);
          }
        }
        
        if (categories.length > 0) {
          console.error(`  📦 ${skill.name}: ${categories.join(', ')}`);
        }
      }
      
      const overallRiskLevel = calculateRiskLevel(risksByCategory);
      const uncoveredCategories = findUncoveredCategories(risksByCategory);
      
      console.error(`\n📊 Overall risk level: ${overallRiskLevel}\n`);
      
      // Output classification result
      const result = {
        timestamp: new Date().toISOString(),
        discovery,
        overallRiskLevel,
        risksByCategory,
        risksBySkill,
        uncoveredCategories,
        riskCategoryDescriptions: RISK_CATEGORIES
      };
      
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Error classifying risks:', error.message);
      process.exit(1);
    }
  });
}

main();
