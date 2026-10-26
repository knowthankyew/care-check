#!/usr/bin/env node
/**
 * audit-claims.mjs - Automated Claims, Architectural Parity & Privacy Invariant Linter for CareCheck.
 *
 * Enforces:
 * 1. Zero-Egress Privacy Invariant:
 *    - Verifies index.html CSP enforces connect-src 'none'.
 *    - Verifies src/ contains zero unauthorized network egress primitives (fetch, XMLHttpRequest, sendBeacon, axios, WebSocket).
 *    - Verifies default telemetry operates in memory_only mode with strict allowlist.
 * 2. Statutory Legal Reference Parity:
 *    - Validates that statutory protections cited in README.md exist in source code and dispute letter engines.
 * 3. Vocabulary Guardrails:
 *    - Prohibits unprovable marketing adjectives ('bulletproof', 'conclusive', 'definitive', 'infinitely scalable').
 * 4. Policy Pack Conformance:
 *    - Verifies that all statutory charity care policy packs in policies/jurisdictions/ validate cleanly.
 * 5. Portfolio Master Brief Parity:
 *    - Verifies that KNOWTHANKYEW_PORTFOLIO_MASTER_BRIEF.md accurately reflects current CareCheck test count.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DEV_ROOT = resolve(REPO_ROOT, '..');

const PROHIBITED_WORDS = [
  /\bbulletproof\b/i,
  /\bconclusive\b/i,
  /\bdefinitive\b/i,
  /\binfinitely scalable\b/i,
];

const REQUIRED_STATUTES = [
  '501(r)(4)',
  '501(r)(5)',
  '501(r)(6)',
  '45 CFR Part 180',
  '300gg-111',
  '1692g',
];

/**
 * Audit 1: Zero-Egress & Air-Gapped Privacy Invariants
 */
export function auditZeroEgress(errors = []) {
  // Check index.html CSP tag directly, ignoring comments
  const indexPath = resolve(REPO_ROOT, 'index.html');
  if (!existsSync(indexPath)) {
    errors.push('Missing index.html file');
  } else {
    const rawIndex = readFileSync(indexPath, 'utf-8');
    const indexContent = rawIndex.replace(/<!--[\s\S]*?-->/g, '');
    const metaCspMatch =
      indexContent.match(/<meta\s+[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*content\s*=\s*(["'])([\s\S]*?)\1[^>]*>/i) ||
      indexContent.match(/<meta\s+[^>]*content\s*=\s*(["'])([\s\S]*?)\1[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i);

    if (!metaCspMatch) {
      errors.push('index.html CSP violation: Missing active <meta http-equiv="Content-Security-Policy"> tag');
    } else {
      const cspDirectives = metaCspMatch[2].split(';').map((d) => d.trim()).filter(Boolean);
      const connectSrc = cspDirectives.find((d) => /^connect-src\b/i.test(d));
      if (!connectSrc) {
        errors.push('index.html CSP violation: Missing connect-src directive in Content-Security-Policy');
      } else if (connectSrc.replace(/\s+/g, ' ').toLowerCase() !== "connect-src 'none'") {
        errors.push(`index.html CSP violation: Expected "connect-src 'none'", but found "${connectSrc}"`);
      }
    }

    // Prohibit remote script, link stylesheet, or image tags in index.html
    const remoteTagMatch = indexContent.match(/<(?:script|link|img)\s+[^>]*(?:src|href)\s*=\s*["']https?:\/\//i);
    if (remoteTagMatch) {
      errors.push(`index.html security violation: Remote asset tag detected in index.html: ${remoteTagMatch[0]}`);
    }
  }

  // Scan src/ for unauthorized network primitives
  const srcDir = resolve(REPO_ROOT, 'src');
  function scanFiles(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        scanFiles(fullPath);
      } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, lineIdx) => {
          // Ignore comments or documentation of rules
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
            return;
          }

          // Check for forbidden network calls including computed bracket property access, dynamic imports, and image beacons
          if (
            /(?:\bfetch\s*\(|\b(?:XMLHttpRequest|axios)\b|\[\s*['"`](?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|axios)['"`]\s*\]|\bnavigator\s*(?:\.\s*sendBeacon|\[\s*['"`]sendBeacon['"`]\s*\])|\bnew\s+(?:WebSocket|EventSource|Image)\b|\bimport\s*\(\s*['"`]https?:\/\/|\b(?:window|globalThis|self)\s*(?:\.\s*fetch|\[\s*['"`]fetch['"`]\s*\]))/.test(
              line
            )
          ) {
            errors.push(`Privacy violation in ${fullPath.replace(REPO_ROOT + '/', '')}:${lineIdx + 1}: Unauthorized network primitive detected: ${trimmed}`);
          }
        });
      }
    }
  }

  if (existsSync(srcDir)) {
    scanFiles(srcDir);
  }

  // Check telemetry allowlist does not contain PHI/PII keys and verifies memory-only default
  const telemetryPath = resolve(REPO_ROOT, 'src/core/telemetry.ts');
  if (existsSync(telemetryPath)) {
    const telContent = readFileSync(telemetryPath, 'utf-8');
    const prohibitedTelemetryKeys = ['patient_name', 'ssn', 'income', 'cpt_code', 'account_number', 'diagnosis'];

    // Parse CARECHECK_ALLOWLIST_KEYS definition
    const allowlistMatch = telContent.match(/CARECHECK_ALLOWLIST_KEYS[^{]*=\s*new\s+Set\(\[\s*([\s\S]*?)\s*\]\)/);
    if (!allowlistMatch) {
      errors.push('Privacy violation in telemetry.ts: CARECHECK_ALLOWLIST_KEYS set definition not found');
    } else {
      const parsedKeys = allowlistMatch[1]
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, '').trim())
        .filter(Boolean)
        .map((item) => item.replace(/['",]/g, '').trim())
        .filter(Boolean);

      if (parsedKeys.length === 0) {
        errors.push('Privacy violation in telemetry.ts: CARECHECK_ALLOWLIST_KEYS is empty');
      }

      for (const key of prohibitedTelemetryKeys) {
        if (parsedKeys.includes(key)) {
          errors.push(`Privacy violation in telemetry.ts: Prohibited PHI/PII attribute key detected in allowlist: '${key}'`);
        }
      }
    }

    // Verify default configuration and MemoryExporter usage
    if (!/new\s+MemoryExporter\s*\(/.test(telContent)) {
      errors.push('Privacy violation in telemetry.ts: MemoryExporter must be instantiated as the default exporter');
    }
    if (!telContent.includes("mode: 'memory_only'")) {
      errors.push("Privacy violation in telemetry.ts: Default mode must be explicitly 'memory_only'");
    }
    if (!telContent.includes("serviceName: 'care-check'")) {
      errors.push("Privacy violation in telemetry.ts: Default serviceName must be 'care-check'");
    }
  }
}

/**
 * Audit 2: Statutory Reference Parity
 */
export function auditStatutoryParity(errors = []) {
  const readmePath = resolve(REPO_ROOT, 'README.md');
  const letterEnginePath = resolve(REPO_ROOT, 'src/core/letter-generator/engine.ts');

  if (!existsSync(readmePath)) {
    errors.push('Missing README.md');
    return;
  }
  if (!existsSync(letterEnginePath)) {
    errors.push('Missing src/core/letter-generator/engine.ts');
    return;
  }

  const readmeContent = readFileSync(readmePath, 'utf-8');
  const engineContent = readFileSync(letterEnginePath, 'utf-8');

  for (const statute of REQUIRED_STATUTES) {
    if (!readmeContent.includes(statute)) {
      errors.push(`README.md lacks declared statutory reference: '${statute}'`);
    }
    if (!engineContent.includes(statute)) {
      errors.push(`src/core/letter-generator/engine.ts lacks statutory implementation for: '${statute}'`);
    }
  }
}

/**
 * Audit 3: Vocabulary Guardrails
 */
export function auditVocabulary(errors = []) {
  const docsToCheck = [
    resolve(REPO_ROOT, 'README.md'),
    resolve(REPO_ROOT, 'ARCHITECTURE.md'),
    resolve(REPO_ROOT, 'docs/ARCHITECTURE.md'),
  ];

  for (const docPath of docsToCheck) {
    if (!existsSync(docPath)) continue;
    const lines = readFileSync(docPath, 'utf-8').split('\n');
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      // Skip lines discussing the rule or quotation disclaimer
      if (lower.includes('prohibits unprovable') || lower.includes('prohibited word') || lower.includes('prohibited marketing')) {
        return;
      }
      for (const pattern of PROHIBITED_WORDS) {
        if (pattern.test(line)) {
          errors.push(`Prohibited marketing word '${pattern.source}' found in ${docPath.replace(REPO_ROOT + '/', '')}:${idx + 1}: ${line.trim()}`);
        }
      }
    });
  }
}

/**
 * Audit 4: Statutory Policy Pack Conformance
 */
export function auditPolicyPacks(errors = []) {
  const jurisdictionsDir = resolve(REPO_ROOT, 'policies/jurisdictions');
  if (!existsSync(jurisdictionsDir)) {
    errors.push('Missing policies/jurisdictions directory');
    return;
  }

  const files = readdirSync(jurisdictionsDir).filter((f) => f.endsWith('.json'));
  if (files.length < 4) {
    errors.push(`Expected at least 4 statutory charity care policy packs, found ${files.length}`);
  }

  for (const file of files) {
    const fullPath = resolve(jurisdictionsDir, file);
    try {
      const parsed = JSON.parse(readFileSync(fullPath, 'utf-8'));
      if (!parsed.jurisdiction?.code || !parsed.jurisdiction?.name) {
        errors.push(`Policy pack ${file} missing jurisdiction.code or jurisdiction.name`);
      }
      if (!parsed.metadata?.statuteRef) {
        errors.push(`Policy pack ${file} missing metadata.statuteRef`);
      }
      if (!parsed.mandates || typeof parsed.mandates.fullCharityFplThresholdPercent !== 'number') {
        errors.push(`Policy pack ${file} missing valid mandates block`);
      }
    } catch (err) {
      errors.push(`Failed to parse policy pack ${file}: ${err.message}`);
    }
  }
}

/**
 * Audit 5: Portfolio Master Brief Parity
 */
export function auditPortfolioMasterBrief(
  errors = [],
  { requireBrief = false, overrideBriefPath = null } = {}
) {
  const briefCandidates = overrideBriefPath
    ? [overrideBriefPath]
    : [
        resolve(DEV_ROOT, 'KNOWTHANKYEW_PORTFOLIO_MASTER_BRIEF.md'),
        resolve(REPO_ROOT, 'KNOWTHANKYEW_PORTFOLIO_MASTER_BRIEF.md'),
      ];
  const briefPath = briefCandidates.find((p) => existsSync(p));

  if (!briefPath) {
    if (requireBrief) {
      errors.push('KNOWTHANKYEW_PORTFOLIO_MASTER_BRIEF.md not found but required via --require-brief.');
    }
    return false;
  }

  const briefContent = readFileSync(briefPath, 'utf-8');
  const match = briefContent.match(/`careCheck`.*?(\d+)\/(\d+)\s+Unit Tests/);
  if (!match) {
    errors.push('Could not find careCheck test inventory count in KNOWTHANKYEW_PORTFOLIO_MASTER_BRIEF.md');
    return false;
  }

  const documentedCount = parseInt(match[1], 10);
  const testsDir = resolve(REPO_ROOT, 'tests');
  let actualCount = 0;
  if (existsSync(testsDir)) {
    const testFiles = readdirSync(testsDir).filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.js'));
    for (const file of testFiles) {
      const code = readFileSync(resolve(testsDir, file), 'utf-8');
      const itMatches = code.match(/\bit(?:\.only|\.skip)?\s*\(/g) || [];
      actualCount += itMatches.length;
    }
  }

  if (documentedCount !== actualCount) {
    errors.push(
      `Portfolio Brief Drift: KNOWTHANKYEW_PORTFOLIO_MASTER_BRIEF.md documents ${match[1]}/${match[2]} tests, but actual test suite has ${actualCount} tests.`
    );
    return false;
  }

  return true;
}

/**
 * Main execution CLI
 */
export function runAllAudits(options = {}) {
  const errors = [];
  auditZeroEgress(errors);
  auditStatutoryParity(errors);
  auditVocabulary(errors);
  auditPolicyPacks(errors);
  const briefChecked = auditPortfolioMasterBrief(errors, options);

  return { errors, briefChecked };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('=== CareCheck Claims, Architecture & Privacy Invariant Audit ===\n');
  const requireBrief = process.argv.includes('--require-brief');
  const { errors, briefChecked } = runAllAudits({ requireBrief });

  if (errors.length > 0) {
    console.error(`[FAIL] Found ${errors.length} claims / architectural invariant violation(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('[PASS] All CareCheck architectural & claims invariants verified:');
  console.log("  ✓ Zero-egress air-gap verified (connect-src 'none', zero network primitives in src/)");
  console.log('  ✓ Statutory citations verified across README and Dispute Letter Engine');
  console.log('  ✓ Zero prohibited marketing adjectives detected');
  console.log('  ✓ Declarative charity care policy packs validated');
  if (briefChecked) {
    console.log('  ✓ Portfolio Master Brief parity verified');
  } else {
    console.log('  - Portfolio Master Brief check skipped (isolated CI)');
  }
  process.exit(0);
}
