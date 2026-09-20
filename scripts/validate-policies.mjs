#!/usr/bin/env node
// ==============================================================================
// validate-policies.mjs - Automated Schema & Invariant Validator for Charity Care Policies
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const POLICIES_DIR = path.join(ROOT_DIR, 'policies', 'jurisdictions');
const SCHEMA_FILE = path.join(ROOT_DIR, 'policies', 'schemas', 'charity-care-policy.schema.json');

console.log('\n=== Validating Statutory Charity Care Policy Packs ===\n');

if (!fs.existsSync(SCHEMA_FILE)) {
  console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
  process.exit(1);
}

const files = fs.readdirSync(POLICIES_DIR).filter(f => f.endsWith('.json'));

let errors = 0;
let validated = 0;

for (const file of files) {
  const filePath = path.join(POLICIES_DIR, file);
  process.stdout.write(`  Checking ${file.padEnd(20)} ... `);
  
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const policy = JSON.parse(raw);

    if (!policy.jurisdiction || !policy.jurisdiction.code || !policy.jurisdiction.name) {
      throw new Error('Missing jurisdiction.code or jurisdiction.name');
    }
    if (!policy.metadata || !policy.metadata.statuteRef) {
      throw new Error('Missing metadata.statuteRef');
    }
    if (policy.metadata.officialSourceUrl && !policy.metadata.officialSourceUrl.startsWith('http')) {
      throw new Error('officialSourceUrl must be a valid http/https URL');
    }
    if (!policy.mandates) {
      throw new Error('Missing mandates block');
    }

    const m = policy.mandates;
    if (typeof m.fullCharityFplThresholdPercent !== 'number' || m.fullCharityFplThresholdPercent <= 0) {
      throw new Error('mandates.fullCharityFplThresholdPercent must be a positive number');
    }
    if (typeof m.partialDiscountFplThresholdPercent !== 'number' || m.partialDiscountFplThresholdPercent <= 0) {
      throw new Error('mandates.partialDiscountFplThresholdPercent must be a positive number');
    }
    if (typeof m.minimumEcaNoticeDays !== 'number' || m.minimumEcaNoticeDays <= 0) {
      throw new Error('mandates.minimumEcaNoticeDays must be a positive number');
    }
    if (!Array.isArray(m.statutoryProtections) || m.statutoryProtections.length === 0) {
      throw new Error('mandates.statutoryProtections must be a non-empty array');
    }

    console.log('\x1b[32mPASS\x1b[0m');
    validated++;
  } catch (err) {
    console.log(`\x1b[31mFAIL: ${err.message}\x1b[0m`);
    errors++;
  }
}

console.log(`\nResults: ${validated} policy packs validated, ${errors} error(s).\n`);
if (errors > 0) {
  process.exit(1);
}
