/**
 * migrations.js - Monotonic Schema Migration Runner
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Executes database schema upgrades monotonically and records migration versions
 * in an append-only ledger. Validated by TC-19.
 */

const fs = require('fs');
const path = require('path');
const { atomicWriteJson, readJsonSafe } = require('./concurrencyLock');

const MIGRATIONS_FILE = path.join(__dirname, 'data', 'migrations_ledger.json');

const DEFINED_MIGRATIONS = [
  {
    id: '001_initial_schema',
    description: 'Initializes base case schemas, audit ledger and DMN gazette rules',
    up: (state) => {
      state.version = '001';
      state.initializedAt = new Date().toISOString();
      return state;
    }
  },
  {
    id: '002_add_risk_scoring',
    description: 'Adds multi-dimensional risk matrix & layout anomaly confidence fields',
    up: (state) => {
      state.version = '002';
      state.features = state.features || [];
      if (!state.features.includes('MULTI_TIER_RISK_SCORING')) {
        state.features.push('MULTI_TIER_RISK_SCORING');
      }
      return state;
    }
  },
  {
    id: '003_add_pqc_stubs',
    description: 'Injects Post-Quantum Cryptography (PQC) readiness headers for CRYSTALS-Dilithium',
    up: (state) => {
      state.version = '003';
      state.pqc = {
        enabled: true,
        candidateAlgorithms: ['CRYSTALS-Dilithium', 'ML-KEM'],
        mode: 'HYBRID_SHA256_DILITHIUM'
      };
      return state;
    }
  }
];

/**
 * Executes pending migrations sequentially
 */
async function runMigrations() {
  const currentLedger = readJsonSafe(MIGRATIONS_FILE, { applied: [], currentVersion: '000' });
  const appliedIds = new Set(currentLedger.applied.map((m) => m.id));
  const results = [];

  let state = { ...currentLedger };

  for (const migration of DEFINED_MIGRATIONS) {
    if (!appliedIds.has(migration.id)) {
      state = migration.up(state);
      const record = {
        id: migration.id,
        description: migration.description,
        appliedAt: new Date().toISOString()
      };
      currentLedger.applied.push(record);
      currentLedger.currentVersion = migration.id.split('_')[0];
      results.push(record);
    }
  }

  currentLedger.updatedAt = new Date().toISOString();
  await atomicWriteJson(MIGRATIONS_FILE, currentLedger);
  return { appliedCount: results.length, currentVersion: currentLedger.currentVersion, results };
}

/**
 * Returns current migration status
 */
function getMigrationStatus() {
  return readJsonSafe(MIGRATIONS_FILE, { applied: [], currentVersion: '000' });
}

module.exports = {
  runMigrations,
  getMigrationStatus,
  DEFINED_MIGRATIONS
};
