/**
 * backupDaemon.js - Point-in-Time Cryptographic Database Snapshot Daemon
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Automates point-in-time cryptographic database snapshots with SHA-256 checksums
 * and integrity verification. Satisfies NFR-04 and validated by TC-15.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { withFileLock } = require('./concurrencyLock');

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const DEFAULT_SNAPSHOT_DIR = path.join(__dirname, 'data', 'snapshots');

/**
 * Computes SHA-256 hash of a file or string
 */
function computeChecksum(content) {
  const hash = crypto.createHash('sha256');
  if (Buffer.isBuffer(content) || typeof content === 'string') {
    hash.update(content);
  }
  return hash.digest('hex');
}

/**
 * Creates a point-in-time snapshot with cryptographic checksums
 */
async function createSnapshot(dataDir = DEFAULT_DATA_DIR, snapshotDir = DEFAULT_SNAPSHOT_DIR) {
  return withFileLock('backup_daemon_lock', async () => {
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotId = `snapshot_${timestamp}`;
    const targetFolder = path.join(snapshotDir, snapshotId);
    fs.mkdirSync(targetFolder, { recursive: true });

    const manifest = {
      snapshotId,
      createdAt: new Date().toISOString(),
      files: {}
    };

    const targetFiles = ['audit_ledger.json', 'cases.json', 'gazette_rules.json'];

    for (const fileName of targetFiles) {
      const srcPath = path.join(dataDir, fileName);
      if (fs.existsSync(srcPath)) {
        const fileContent = fs.readFileSync(srcPath);
        const checksum = computeChecksum(fileContent);
        const destPath = path.join(targetFolder, fileName);
        fs.writeFileSync(destPath, fileContent);

        manifest.files[fileName] = {
          bytes: fileContent.length,
          sha256: checksum
        };
      }
    }

    const manifestContent = JSON.stringify(manifest, null, 2);
    manifest.manifestSha256 = computeChecksum(manifestContent);
    fs.writeFileSync(
      path.join(targetFolder, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    return manifest;
  });
}

/**
 * Verifies the integrity of a snapshot against its manifest
 */
function verifySnapshot(snapshotFolder) {
  const manifestPath = path.join(snapshotFolder, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { valid: false, error: 'Manifest missing' };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const [fileName, meta] of Object.entries(manifest.files)) {
    const filePath = path.join(snapshotFolder, fileName);
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: `File ${fileName} missing in snapshot` };
    }
    const currentHash = computeChecksum(fs.readFileSync(filePath));
    if (currentHash !== meta.sha256) {
      return {
        valid: false,
        error: `Checksum mismatch for ${fileName}: expected ${meta.sha256}, got ${currentHash}`
      };
    }
  }

  return { valid: true, snapshotId: manifest.snapshotId };
}

/**
 * Restores database from a verified snapshot
 */
async function restoreSnapshot(snapshotFolder, dataDir = DEFAULT_DATA_DIR) {
  return withFileLock('backup_daemon_lock', async () => {
    const verification = verifySnapshot(snapshotFolder);
    if (!verification.valid) {
      throw new Error(`Cannot restore corrupted snapshot: ${verification.error}`);
    }

    const manifest = JSON.parse(fs.readFileSync(path.join(snapshotFolder, 'manifest.json'), 'utf8'));

    for (const fileName of Object.keys(manifest.files)) {
      const srcPath = path.join(snapshotFolder, fileName);
      const destPath = path.join(dataDir, fileName);
      fs.copyFileSync(srcPath, destPath);
    }

    return { restored: true, snapshotId: manifest.snapshotId };
  });
}

module.exports = {
  createSnapshot,
  verifySnapshot,
  restoreSnapshot,
  computeChecksum
};
