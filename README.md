# Sovereign Government Document Intelligence & Verification Platform (SG-DIVP)
**Government of Maharashtra — Department of Information Technology & Revenue Administration**  
*State e-Governance Division & Sovereign Citizen Service Delivery Platform*  

---

## Overview

The **Sovereign Government Document Intelligence & Verification Platform (SG-DIVP)** is an enterprise-grade, air-gapped operational system engineered to automate high-assurance document verification across 8 essential day-to-day government documents:
1. **Non-Creamy Layer (NCL) Certificate** (`DOC-REF: REV-NCL-01`)
2. **Caste Validity Certificate (SC/ST/OBC)** (`DOC-REF: SOC-CST-02`)
3. **Tahsil Income Certificate** (`DOC-REF: REV-INC-03`)
4. **7/12 Land Title Extract & Ferfar** (`DOC-REF: LND-712-04`)
5. **Divyangjan Disability Life Certificate** (`DOC-REF: DIV-PWD-05`)
6. **Economically Weaker Section (EWS) Certificate** (`DOC-REF: GAD-EWS-06`)
7. **Age, Nationality & Domicile Certificate** (`DOC-REF: GAD-DOM-07`)
8. **Agricultural Solvency Certificate** (`DOC-REF: AGR-SOL-08`)

---

## Key Capabilities & Role Governance

- **1. Citizen Portal (`USER`)**:
  - Catalogue of 8 essential public services with live search and department filters.
  - Non-custodial file attachment intake (PDF, PNG, JPG) with instant OCR extraction preview.
  - Real-time application tracker synchronizing state across Tehsildar Scrutiny and Collectorate Sealing.
  - Discrepancy inspection modal showing statutory violation proof and remedial instructions for returned cases.
  - Dual-mode official certificate printing (in-page styled print via `@media print` + isolated popup printable window).

- **2. Approving Officer / Tehsildar Desk (`OFFICER`)**:
  - **Zero upload buttons or modals** (strict role boundary).
  - 3 dedicated desk queues: **Active Scrutiny Queue**, **Approved & Forwarded Queue**, and **Returned Archive**.
  - Zoomable document scan inspector with 100% / 150% magnification.
  - AI optical entity separation with per-field confidence scoring.
  - Official state seal authenticity & digital signature cryptographic verification.
  - Dynamic DMN gazette rules evaluation against state thresholds.
  - Direct action handlers: **"Approve & Forward to Root Admin"** and **"Return to Citizen with Reason & Proof"** (with 5 statutory discrepancy presets).

- **3. Root Administrator Chamber (`ADMIN`)**:
  - **Zero upload buttons or modals** (strict role boundary).
  - Executive review queue of Tehsildar-approved dossiers.
  - AI Summary compliance checks (`CLEAN (100% COMPLIANT)` vs `CRITERIA ERROR`).
  - Direct execution button: **"Execute Final Seal & Issue"** immediately mints a unique certificate serial number and records magistrate authorization.
  - Immutable Issued Certificates Archive with direct certificate viewing and printing.

---

## Cryptographic Security & Air-Gap Engine

- **Zero-Egress Kernel Guard (`airGapGuard.js`)**: Intercepts low-level sockets to prevent any outbound connection to non-loopback addresses.
- **NIST SP 800-57 Envelope Encryption (`envelopeEncryption.js`)**: AES-256-GCM data encryption with ephemeral DEKs wrapped by master KEKs.
- **RFC 6238 Offline Multi-Factor Auth (`totpAuth.js`)**: Base32 offline time-based one-time password verification.
- **SHA-256 Merkle-Linked WORM Ledger**: Verifiable append-only audit trail logging every document intake, verification, return, and seal event.

---

## Quick Start

### 1. Run Automated Test Suite (20/20 PASS)
```bash
npm test
# or: node test_suite.js
```

### 2. Start Intranet Server
```bash
npm start
# or: node server.js
```

### 3. Open Web Dashboard
Open your web browser to:  
👉 **http://127.0.0.1:3000** (or **http://localhost:3000**)  
*(Use `Cmd + Shift + R` on Mac or `Ctrl + F5` on Windows to hard-refresh).*

---

## Project Structure
```
Innovation_project/
├── package.json                 # npm scripts & project configuration
├── server.js                    # Core server, 3-role routing endpoints & ledger
├── airGapGuard.js               # Zero-egress network socket interceptor
├── envelopeEncryption.js        # AES-256-GCM envelope encryption (KEK/DEK)
├── totpAuth.js                  # RFC 6238 TOTP engine
├── concurrencyLock.js           # Mutex and file lock engine
├── backupDaemon.js              # Cryptographic database backup daemon
├── migrations.js                # Monotonic schema migrations (001-003)
├── test_suite.js                # 20 automated test cases
├── data/
│   ├── cases.json               # Seeded case dossiers across all 4 statuses
│   ├── gazette_rules.json       # Dynamic DMN gazette rules for 8 document types
│   ├── ledger.json              # SHA-256 cryptographic audit ledger
│   └── users.json               # 3 sovereign user personas
└── public/
    ├── index.html               # Clean HTML shell with @media print CSS
    ├── css/
    │   └── tailwind.min.css     # Clean modern SaaS styling
    └── js/
        ├── app.js               # 3-role React UI with direct button binding & dual-mode print
        └── icons.js             # Pure vector SVG icons (strictly zero emojis)
```
