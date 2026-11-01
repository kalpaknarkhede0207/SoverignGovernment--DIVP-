/**
 * app.js - MahaGov SG-DIVP Sovereign Citizen Service Delivery Platform
 * Government of Maharashtra - Department of Information Technology & Revenue Administration
 * 
 * Implements 3 strictly isolated roles:
 * 1. Citizen Portal: Catalogue of 8 everyday government documents, real file attachments,
 *    instant post-upload confirmation, application tracking, return proof inspection, and certificate printing.
 * 2. Approving Officer (Tehsildar): Scrutiny of incoming uploaded dossiers, OCR entity separation,
 *    dynamic DMN gazette rules, seal & signature verification, approve & forward, or return with proof.
 * 3. Root Administrator: Executive review of officer-approved cases, AI summary checks (CLEAN vs ERROR),
 *    and final government seal authorization.
 */

(function () {
  const { useState, useEffect, createElement: h } = window.React;
  const Icons = window.Icons;

  function SvgIcon({ name, className = 'w-5 h-5' }) {
    if (!name || typeof name !== 'string' || !Icons || !Icons[name]) {
      const fallbackFn = Icons && Icons.FileText;
      return h('span', {
        className: 'inline-flex items-center justify-center',
        dangerouslySetInnerHTML: { __html: fallbackFn ? fallbackFn({ className }) : '' }
      });
    }
    const iconFn = Icons[name];
    return h('span', {
      className: 'inline-flex items-center justify-center',
      dangerouslySetInnerHTML: { __html: iconFn({ className }) }
    });
  }

  // Preset Statutory Return Discrepancies with Gazette Citations for Tehsildar
  const STATUTORY_RETURN_PRESETS = [
    {
      label: 'Income Exceeds Rs. 8 Lakh Ceiling (Gazette 2026/FST-12)',
      reason: 'Declared family gross annual income exceeds statutory Rs. 8,00,000/- ceiling.',
      proof: 'Assessed gross family income exceeds statutory Rs. 8,00,000/- ceiling under Government of Maharashtra Gazette 2026/FST-12 Clause 4.3.',
      instructions: 'Applicant must submit updated Form 16 / ITR assessment or apply under non-subsidized category.'
    },
    {
      label: 'Ancestral Residence Pre-1950/1967 Proof Missing (Caste Act XXIII)',
      reason: 'Missing primary documentary evidence pre-dating statutory cutoff year (1950/1967).',
      proof: 'Applicant has not produced ancestral school leaving, land purchase, or revenue record pre-dating 1950 (SC) or 1967 (OBC) as mandated by Maharashtra Act XXIII of 2001.',
      instructions: 'Applicant must attach grandfather / great-grandfather historical birth, school, or land registry record.'
    },
    {
      label: 'Agricultural Land Holding Exceeds 5 Acres (EWS Ceiling)',
      reason: 'Family agricultural land holding exceeds statutory ceiling of 5.0 acres.',
      proof: 'Combined 7/12 land extract shows family ownership of over 5.0 acres of agricultural land, violating 103rd Constitutional Amendment EWS ownership criteria.',
      instructions: 'Applicant is ineligible under Economically Weaker Section (EWS) property ceilings.'
    },
    {
      label: 'Potkharaba Land Deduction Calculation Mismatch (7/12 Land Code)',
      reason: 'Discrepancy detected between cultivable land area and potkharaba (uncultivable) entries.',
      proof: 'Total survey area calculation does not reconcile with potkharaba deductions under Maharashtra Land Revenue Code 1966 Section 148.',
      instructions: 'Applicant must obtain a rectified land measurement sheet from the Taluka Inspector of Land Records (TILR).'
    },
    {
      label: 'Disability Evaluated Below 40% Threshold (Divyangjan Norms)',
      reason: 'Medical Board evaluation indicates disability is below statutory 40% threshold.',
      proof: 'Certified disability assessed is below 40% minimum benchmark mandated under Divyangjan Welfare Department Gazette 2025/DIV-09.',
      instructions: 'Applicant may appear before District Medical Appellate Board for re-evaluation.'
    }
  ];

  // Context-Aware HTML Sanitizer to prevent DOM XSS (SEC-HIGH-01)
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Dedicated Standalone Printable Window Generator
  function openPrintableWindow(certCase) {
    if (!certCase) return;
    const cert = certCase.certificate || {
      certificateNumber: `MH-${(certCase.documentType || 'REV').slice(0, 3)}-2026-${certCase.id.split('-').pop() || '101'}-PUN`,
      issueDate: certCase.finalApprovedTimestamp ? certCase.finalApprovedTimestamp.split('T')[0] : new Date().toISOString().split('T')[0],
      validUntil: '2027-03-31',
      statutoryClause: 'Issued under the authority of Maharashtra Government Gazette regulations and Section 65B Indian Evidence Act.',
      qrSeal: `SG-DIVP://VERIFY/${certCase.id}/AUTH-SEAL`,
      issuingOfficer: 'Dr. Anand K. Kulkarni, Tehsildar & Executive Magistrate',
      sanctioningAuthority: 'District Magistrate & Collector, Pune'
    };

    const printWin = window.open('', '_blank', 'width=880,height=960');
    if (!printWin) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Official Certificate - ${escapeHtml(cert.certificateNumber)}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }
          .action-bar {
            margin-bottom: 24px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }
          .btn-print {
            background-color: #4338ca;
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(67, 56, 202, 0.2);
          }
          .btn-print:hover { background-color: #3730a3; }
          .cert-container {
            border: 4px double #312e81;
            padding: 36px 40px;
            border-radius: 12px;
            background: #fafafa;
            position: relative;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 68px;
            font-weight: 900;
            color: rgba(67, 56, 202, 0.04);
            pointer-events: none;
            white-space: nowrap;
            letter-spacing: 4px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .emblem-title {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #1e293b;
          }
          .emblem-dept {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
            font-weight: 600;
          }
          .cert-title {
            font-size: 22px;
            font-weight: 800;
            color: #1e1b4b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 14px 0 6px 0;
          }
          .cert-serial {
            font-family: monospace;
            font-size: 13px;
            font-weight: 700;
            color: #4338ca;
            background: #e0e7ff;
            display: inline-block;
            padding: 3px 12px;
            border-radius: 6px;
          }
          .cert-body {
            font-size: 14px;
            line-height: 1.8;
            color: #1e293b;
            margin: 24px 0;
            text-align: justify;
          }
          .applicant-highlight {
            font-weight: 800;
            color: #0f172a;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 13px;
          }
          .data-table th, .data-table td {
            border: 1px solid #cbd5e1;
            padding: 9px 14px;
            text-align: left;
          }
          .data-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
            width: 32%;
            text-transform: uppercase;
            font-size: 11px;
          }
          .data-table td {
            background-color: #ffffff;
            font-weight: 600;
            color: #0f172a;
          }
          .statutory-note {
            font-size: 11px;
            color: #64748b;
            font-style: italic;
            margin-top: 18px;
            line-height: 1.5;
            border-left: 3px solid #6366f1;
            padding-left: 10px;
          }
          .footer-section {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .seal-col {
            font-family: monospace;
            font-size: 11px;
            color: #334155;
          }
          .seal-badge {
            font-weight: 800;
            color: #1e1b4b;
            font-size: 12px;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .seal-verified {
            color: #16a34a;
            font-weight: 700;
            margin-top: 4px;
            font-size: 11px;
          }
          .signature-col {
            text-align: right;
            font-size: 13px;
          }
          .sign-officer {
            font-weight: 800;
            color: #0f172a;
            font-size: 14px;
            margin-top: 2px;
          }
          .sign-auth {
            font-size: 12px;
            color: #475569;
            margin-top: 1px;
          }
          .sign-date {
            font-family: monospace;
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          @media print {
            .action-bar { display: none !important; }
            body { padding: 0 !important; }
            .cert-container { border: 3px double #000000 !important; background: #ffffff !important; }
            .watermark { opacity: 0.05 !important; }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="cert-container">
          <div class="watermark">GOVERNMENT OF MAHARASHTRA</div>
          <div class="header">
            <div class="emblem-title">महाराष्ट्र शासन / GOVERNMENT OF MAHARASHTRA</div>
            <div class="emblem-dept">महसूल व वन विभाग &bull; Department of Revenue & Forest &bull; जिल्हा पुणे / District Pune</div>
            <div class="cert-title">${escapeHtml(certCase.scheme)}</div>
            <div class="cert-serial">प्रमाणपत्र अनुक्रमांक / Certificate Serial No: ${escapeHtml(cert.certificateNumber)}</div>
          </div>

          <div class="cert-body">
            प्रमाणित करण्यात येते की <span class="applicant-highlight">${escapeHtml(certCase.applicantName)}</span>,
            रा. <span class="applicant-highlight">${escapeHtml(certCase.subDivision)}</span>,
            आधार / UID <span class="applicant-highlight" style="font-family: monospace;">${escapeHtml(certCase.applicantId)}</span>,
            यांनी विहित शासन निर्णय व राजपत्र नियमांनुसार सर्व आवश्यक पुरावे सादर केले असून छाननीअंती हे प्रमाणपत्र जारी करण्यात येत आहे.<br><br>
            This is to officially certify that <span class="applicant-highlight">${escapeHtml(certCase.applicantName)}</span>,
            resident of <span class="applicant-highlight">${escapeHtml(certCase.subDivision)}</span>,
            bearing Aadhaar / UID <span class="applicant-highlight" style="font-family: monospace;">${escapeHtml(certCase.applicantId)}</span>,
            has formally submitted all documentary evidence and satisfied the statutory requirements prescribed under
            the respective Maharashtra Government Gazette norms and State e-Governance Acts.
          </div>

          <table class="data-table">
            <tr>
              <th>अर्जदाराचे नाव / Applicant Full Name</th>
              <td>${escapeHtml(certCase.applicantName)}</td>
            </tr>
            <tr>
              <th>प्रकरण संदर्भ / Application Case Reference</th>
              <td style="font-family: monospace;">${escapeHtml(certCase.caseNumber)}</td>
            </tr>
            <tr>
              <th>उपविभाग / Administrative Sub-Division</th>
              <td>${escapeHtml(certCase.subDivision)}</td>
            </tr>
            <tr>
              <th>जारी दिनांक / Date of Digital Issue</th>
              <td style="font-family: monospace;">${escapeHtml(cert.issueDate)}</td>
            </tr>
            <tr>
              <th>वैधता / Statutory Validity</th>
              <td>${escapeHtml(cert.validUntil)}</td>
            </tr>
          </table>

          <div class="statutory-note">
            ${escapeHtml(cert.statutoryClause || 'सदर प्रमाणपत्र माहिती तंत्रज्ञान कायदा २००० आणि महाराष्ट्र लोकसेवा हक्क अधिनियम २०१५ अन्वये अधिकृत डिजिटल मुद्रेने जारी करण्यात आले आहे. This certificate is issued under the authority of Maharashtra Government Gazette regulations and Section 65B of the Indian Evidence Act.')}
          </div>

          <div class="footer-section">
            <div class="seal-col">
              <div class="seal-badge">सार्वभौम डिजिटल राजपत्र मुद्रा / DIGITAL GAZETTE SEAL</div>
              <div>HASH: ${escapeHtml(cert.qrSeal)}</div>
              <div class="seal-verified">&check; Section 65B Indian Evidence Act Validated</div>
            </div>
            <div class="signature-col">
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">स्वाक्षरी व पदनाम / Digitally Signed & Sealed by:</div>
              <div class="sign-officer">${escapeHtml(cert.issuingOfficer)}</div>
              <div class="sign-auth">${escapeHtml(cert.sanctioningAuthority)}</div>
              <div class="sign-date">Authenticated on ${escapeHtml(cert.issueDate)}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  }

  function App() {
    // Multi-Lingual Regional Support ('en', 'mr', 'hi')
    const [currentLang, setCurrentLang] = useState(() => {
      try {
        return localStorage.getItem('sg_divp_lang') || 'en';
      } catch (e) {
        return 'en';
      }
    });

    const changeLanguage = (lang) => {
      setCurrentLang(lang);
      try {
        localStorage.setItem('sg_divp_lang', lang);
      } catch (e) {}
    };

    const t = (key) => (window.t ? window.t(key, currentLang) : key);
    const getDocMeta = (doc) => {
      if (!doc) return {};
      const typeKey = doc.documentType || doc.id || doc.scheme || '';
      const tr = window.translateDoc ? window.translateDoc(typeKey, currentLang) : null;
      if (tr) {
        return tr;
      }
      let safeCriteria = '';
      if (typeof doc.criteria === 'string' && doc.criteria.trim()) {
        safeCriteria = doc.criteria;
      } else if (Array.isArray(doc.criteria?.mandatoryNorms) && doc.criteria.mandatoryNorms.length > 0) {
        safeCriteria = doc.criteria.mandatoryNorms[0];
      } else {
        safeCriteria = currentLang === 'mr'
          ? 'महाराष्ट्र शासन राजपत्रानुसार वैधानिक निकष पडताळणी अनिवार्य आहे.'
          : currentLang === 'hi'
          ? 'महाराष्ट्र शासन राजपत्र अनुसार वैधानिक पात्रता मानकों का सत्यापन अनिवार्य है।'
          : 'Mandatory statutory gazette eligibility norm verified upon submission.';
      }
      return {
        name: doc.documentTitle || doc.scheme || typeKey,
        dept: doc.department || (currentLang === 'mr' ? 'महाराष्ट्र शासन' : currentLang === 'hi' ? 'महाराष्ट्र शासन' : 'Government of Maharashtra'),
        desc: doc.gazetteNotification || '',
        criteria: safeCriteria
      };
    };

    // 3 Dedicated Roles: 'USER' (Citizen), 'OFFICER' (Tehsildar), 'ADMIN' (Root Admin)
    const [currentRole, setCurrentRole] = useState('USER');
    const [cases, setCases] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);

    // Recent Upload Confirmation State (shows prominently in Citizen Portal)
    const [justUploadedCase, setJustUploadedCase] = useState(null);

    // Filter & Search States
    const [docSearchQuery, setDocSearchQuery] = useState('');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
    const [appSearchQuery, setAppSearchQuery] = useState('');
    const [appStatusFilter, setAppStatusFilter] = useState('ALL');

    // Sovereign Identity & RBAC Token State (SEC-CRIT-03 & AUD-CRIT-04)
    const [authTokens, setAuthTokens] = useState({});
    const [authStatus, setAuthStatus] = useState('AUTHENTICATING');
    const [deskAuthModal, setDeskAuthModal] = useState(null);

    // Resilient Token Fetcher with LocalStorage, Statutory PIN Auth & Real-Time Sync
    const getRoleToken = async (role) => {
      if (authTokens && authTokens[role]) return authTokens[role];
      try {
        const cached = localStorage.getItem(`sg_divp_token_${role}`);
        if (cached) {
          setAuthTokens((prev) => ({ ...prev, [role]: cached }));
          return cached;
        }
      } catch (e) {}

      if (role === 'citizen') {
        try {
          const res = await fetch('/api/auth/tokens').then((r) => r.json());
          if (res && res.tokens && res.tokens.citizen) {
            setAuthTokens((prev) => ({ ...prev, citizen: res.tokens.citizen }));
            try { localStorage.setItem('sg_divp_token_citizen', res.tokens.citizen || ''); } catch (e) {}
            return res.tokens.citizen;
          }
        } catch (err) {}
      } else if (role === 'tehsildar' || role === 'admin') {
        // If no token in memory or cache, attempt statutory login with official demo PIN
        try {
          const defaultPin = role === 'tehsildar' ? '7788' : '9900';
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, pin: defaultPin })
          });
          const data = await res.json();
          if (res.ok && data.token) {
            setAuthTokens((prev) => ({ ...prev, [role]: data.token }));
            try { localStorage.setItem(`sg_divp_token_${role}`, data.token); } catch (e) {}
            return data.token;
          }
        } catch (err) {}
      }
      return '';
    };

    const loadTokens = async () => {
      try {
        const res = await fetch('/api/auth/tokens').then((r) => r.json());
        if (res && res.tokens) {
          const initial = { citizen: res.tokens.citizen };
          try {
            const cachedTeh = localStorage.getItem('sg_divp_token_tehsildar');
            if (cachedTeh) initial.tehsildar = cachedTeh;
            const cachedAdm = localStorage.getItem('sg_divp_token_admin');
            if (cachedAdm) initial.admin = cachedAdm;
            if (res.tokens.citizen) localStorage.setItem('sg_divp_token_citizen', res.tokens.citizen);
          } catch (e) {}

          setAuthTokens(initial);
          setAuthStatus('VERIFIED');
        }
      } catch (err) {
        console.error('Failed to load sovereign tokens:', err);
        setAuthStatus('OFFLINE');
      }
    };

    // Tehsildar Desk Queue Tab: 'ACTIVE', 'APPROVED', 'RETURNED'
    const [officerQueueTab, setOfficerQueueTab] = useState('ACTIVE');

    // Zoom State for Scanned Document Artifact
    const [isDocumentZoomed, setIsDocumentZoomed] = useState(false);

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocForUpload, setSelectedDocForUpload] = useState(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnModalTarget, setReturnModalTarget] = useState(null);
    const [showReturnReasonModal, setShowReturnReasonModal] = useState(null);
    const [showCertificateModal, setShowCertificateModal] = useState(null);

    // Real File Attachment & Upload State
    const [uploadForm, setUploadForm] = useState({
      applicantName: 'Kalpak Kishor Narkhede',
      applicantUID: 'UIDAI-XXXX-XXXX-9281',
      fatherName: 'Kishor Narkhede',
      subDivision: 'Haveli Sub-Division, Pune',
      criteriaValue: '620000',
      uploadedFileName: 'narkhede_revenue_affidavit.pdf',
      uploadedFileSize: '1.42 MB'
    });

    // Tehsildar Return Form State
    const [returnForm, setReturnForm] = useState({
      returnReason: STATUTORY_RETURN_PRESETS[0].reason,
      returnProof: STATUTORY_RETURN_PRESETS[0].proof,
      remedialInstructions: STATUTORY_RETURN_PRESETS[0].instructions
    });

    const showToast = (message, type = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    };

    // Role Switching with Strict Modal Reset, Smart Case Selection & Desk Authentication (AUD-CRIT-04)
    const handleRoleSwitch = (newRole) => {
      if (newRole === 'OFFICER') {
        const tehToken = authTokens.tehsildar || localStorage.getItem('sg_divp_token_tehsildar');
        if (!tehToken) {
          setDeskAuthModal({
            role: 'tehsildar',
            targetDesk: 'OFFICER',
            title: currentLang === 'mr' ? 'तहसीलदार पटल प्रमाणीकरण' : currentLang === 'hi' ? 'तहसीलदार पटल प्रमाणीकरण' : 'Tehsildar Desk Statutory Authentication',
            roleLabel: currentLang === 'mr' ? 'कार्यकारी दंडाधिकारी व तहसीलदार' : currentLang === 'hi' ? 'कार्यकारी मजिस्ट्रेट व तहसीलदार' : 'Executive Magistrate & Tehsildar',
            department: currentLang === 'mr' ? 'महसूल व वन विभाग, हवेली उपविभाग' : 'Revenue & Forest Department, Haveli',
            pin: '7788',
            error: '',
            loading: false
          });
          return;
        }
      } else if (newRole === 'ADMIN') {
        const admToken = authTokens.admin || localStorage.getItem('sg_divp_token_admin');
        if (!admToken) {
          setDeskAuthModal({
            role: 'admin',
            targetDesk: 'ADMIN',
            title: currentLang === 'mr' ? 'जिल्हाधिकारी पटल प्रमाणीकरण' : currentLang === 'hi' ? 'जिला मजिस्ट्रेट पटल प्रमाणीकरण' : 'District Collectorate Root Authentication',
            roleLabel: currentLang === 'mr' ? 'मुख्य जिल्हा प्रशासक' : currentLang === 'hi' ? 'मुख्य जिला प्रशासक' : 'Chief District Administrator',
            department: currentLang === 'mr' ? 'जिल्हाधिकारी कार्यालय व राष्ट्रीय माहिती विज्ञान केंद्र' : 'District Collectorate & NIC Governance',
            pin: '9900',
            error: '',
            loading: false
          });
          return;
        }
      }

      setCurrentRole(newRole);
      setShowUploadModal(false);
      setShowReturnModal(false);
      setReturnModalTarget(null);
      setShowReturnReasonModal(null);
      setShowCertificateModal(null);
      setSelectedDocForUpload(null);

      // When switching to Tehsildar, ensure we point to the newest active case
      if (newRole === 'OFFICER') {
        setOfficerQueueTab('ACTIVE');
        const activeItem = (justUploadedCase && justUploadedCase.status === 'UNDER_SCRUTINY')
          ? justUploadedCase
          : cases.find((c) => c.status === 'UNDER_SCRUTINY');
        if (activeItem) {
          setSelectedCaseId(activeItem.id);
        }
      }
    };

    const handleDeskLogin = async (e) => {
      if (e) e.preventDefault();
      if (!deskAuthModal) return;
      setDeskAuthModal((prev) => ({ ...prev, loading: true, error: '' }));

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: deskAuthModal.role, pin: deskAuthModal.pin })
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          setDeskAuthModal((prev) => ({
            ...prev,
            loading: false,
            error: data.error || 'Authentication failed. Please verify statutory PIN.'
          }));
          return;
        }

        const roleKey = deskAuthModal.role;
        setAuthTokens((prev) => ({ ...prev, [roleKey]: data.token }));
        try {
          localStorage.setItem(`sg_divp_token_${roleKey}`, data.token);
        } catch (e) {}

        const target = deskAuthModal.targetDesk;
        setDeskAuthModal(null);
        setCurrentRole(target);
        showToast(
          currentLang === 'mr'
            ? `${data.user ? data.user.name : 'अधिकारी'} पटल यशस्वीरीत्या उघडले.`
            : `Authenticated as ${data.user ? data.user.name : 'Officer'} with sovereign token.`,
          'success'
        );

        if (target === 'OFFICER') {
          setOfficerQueueTab('ACTIVE');
          const activeItem = (justUploadedCase && justUploadedCase.status === 'UNDER_SCRUTINY')
            ? justUploadedCase
            : cases.find((c) => c.status === 'UNDER_SCRUTINY');
          if (activeItem) setSelectedCaseId(activeItem.id);
        }
      } catch (err) {
        setDeskAuthModal((prev) => ({
          ...prev,
          loading: false,
          error: 'Connection error during authentication challenge.'
        }));
      }
    };

    const loadData = async () => {
      try {
        const [casesRes, docsRes] = await Promise.all([
          fetch('/api/cases').then((r) => r.json()),
          fetch('/api/document-types').then((r) => r.json())
        ]);
        if (casesRes.cases) {
          setCases(casesRes.cases);
          if (!selectedCaseId && casesRes.cases.length > 0) {
            setSelectedCaseId(casesRes.cases[0].id);
          }
        }
        if (docsRes.documents) {
          setDocumentTypes(docsRes.documents);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    useEffect(() => {
      loadData();
      loadTokens();
    }, []);

    const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

    // Open Certificate Modal with Fallback Verification
    const handleOpenCertificate = (c) => {
      if (!c) return;
      if (!c.certificate) {
        c.certificate = {
          certificateNumber: `MH-${(c.documentType || 'REV').slice(0, 3)}-2026-${c.id.split('-').pop() || '101'}-PUN`,
          issueDate: c.finalApprovedTimestamp ? c.finalApprovedTimestamp.split('T')[0] : new Date().toISOString().split('T')[0],
          validUntil: '2027-03-31',
          statutoryClause: 'Issued under the authority of Maharashtra Government Gazette regulations and Section 65B Indian Evidence Act.',
          qrSeal: `SG-DIVP://VERIFY/${c.id}/AUTH-SEAL`,
          issuingOfficer: 'Dr. Anand K. Kulkarni, Tehsildar & Executive Magistrate',
          sanctioningAuthority: 'District Magistrate & Collector, Pune'
        };
      }
      setShowCertificateModal(c);
    };

    // Auto-Fill Sample Data for Citizen Upload
    const handlePreFill = (docType) => {
      if (docType === 'NON_CREAMY_LAYER_CERTIFICATE') {
        setUploadForm({
          applicantName: 'Kalpak Kishor Narkhede',
          applicantUID: 'UIDAI-XXXX-XXXX-9281',
          fatherName: 'Kishor Narkhede',
          subDivision: 'Haveli Sub-Division, Pune',
          criteriaValue: '620000',
          uploadedFileName: 'narkhede_income_affidavit_2026.pdf',
          uploadedFileSize: '1.84 MB'
        });
      } else if (docType === 'CASTE_VALIDITY_CERTIFICATE') {
        setUploadForm({
          applicantName: 'Kalpak Kishor Narkhede',
          applicantUID: 'UIDAI-XXXX-XXXX-9281',
          fatherName: 'Kishor Narkhede',
          subDivision: 'Haveli Sub-Division, Pune',
          criteriaValue: '1948',
          uploadedFileName: 'narkhede_ancestral_school_record.pdf',
          uploadedFileSize: '2.15 MB'
        });
      } else if (docType === 'EWS_CERTIFICATE') {
        setUploadForm({
          applicantName: 'Kalpak Kishor Narkhede',
          applicantUID: 'UIDAI-XXXX-XXXX-9281',
          fatherName: 'Kishor Narkhede',
          subDivision: 'Haveli Sub-Division, Pune',
          criteriaValue: '720000',
          uploadedFileName: 'narkhede_ews_assets_declaration.pdf',
          uploadedFileSize: '1.65 MB'
        });
      } else if (docType === 'DIVYANGJAN_DISABILITY_CERTIFICATE') {
        setUploadForm({
          applicantName: 'Kalpak Kishor Narkhede',
          applicantUID: 'UIDAI-XXXX-XXXX-9281',
          fatherName: 'Kishor Narkhede',
          subDivision: 'Haveli Sub-Division, Pune',
          criteriaValue: '65',
          uploadedFileName: 'narkhede_civil_hospital_udid.pdf',
          uploadedFileSize: '2.40 MB'
        });
      } else {
        setUploadForm({
          applicantName: 'Kalpak Kishor Narkhede',
          applicantUID: 'UIDAI-XXXX-XXXX-9281',
          fatherName: 'Kishor Narkhede',
          subDivision: 'Haveli Sub-Division, Pune',
          criteriaValue: '1.42',
          uploadedFileName: 'narkhede_statutory_application_scan.pdf',
          uploadedFileSize: '1.20 MB'
        });
      }
    };

    // Real File Selection Handler
    const handleFileChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setUploadForm({
          ...uploadForm,
          uploadedFileName: file.name,
          uploadedFileSize: `${sizeMb} MB`
        });
        showToast(`Attached local document: ${file.name} (${sizeMb} MB)`, 'info');
      }
    };

    // Citizen Upload Submission
    const handleCitizenSubmit = async (e) => {
      e.preventDefault();
      if (!uploadForm.applicantName.trim()) {
        showToast('Applicant Name is required', 'error');
        return;
      }
      setLoading(true);
      try {
        const token = await getRoleToken('citizen');
        const res = await fetch('/api/cases/citizen-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            documentType: selectedDocForUpload.documentType,
            ...uploadForm
          })
        });
        const data = await res.json();
        if (res.ok && data.case) {
          showToast(`Application #${data.case.caseNumber} uploaded and routed to Tehsildar!`, 'success');
          setShowUploadModal(false);
          setSelectedDocForUpload(null);
          setJustUploadedCase(data.case);
          setSelectedCaseId(data.case.id);
          // Prepend optimistically to local cases list
          setCases((prev) => [data.case, ...prev.filter((c) => c.id !== data.case.id)]);
          await loadData();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          showToast(data.error || 'Upload failed', 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    // Officer Actions with Direct Case ID Binding, Serverless Recovery & Optimistic State
    const handleOfficerAction = async (action, targetCaseId) => {
      const caseId = targetCaseId || returnModalTarget?.id || selectedCase?.id;
      if (!caseId) {
        showToast('No target dossier selected for Officer action', 'error');
        return;
      }
      setLoading(true);
      try {
        const token = await getRoleToken('tehsildar');
        const targetCase = cases.find((c) => c.id === caseId) || justUploadedCase || selectedCase;
        const payload =
          action === 'APPROVE'
            ? {
                action: 'APPROVE',
                officerRemarks: 'Verified all OCR entities, seals, and DMN statutory gazette norms.',
                caseData: targetCase
              }
            : {
                action: 'RETURN',
                ...returnForm,
                caseData: targetCase
              };

        const res = await fetch(`/api/cases/${caseId}/officer-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          const updatedCase = data.case || { ...targetCase, status: action === 'APPROVE' ? 'FORWARDED_TO_ADMIN' : 'RETURNED' };
          const caseNum = updatedCase.caseNumber || caseId;
          if (action === 'APPROVE') {
            showToast(`Case #${caseNum} approved and forwarded to Root Administrator!`, 'success');
          } else {
            showToast(`Case #${caseNum} returned to citizen with statutory violation record.`, 'error');
            setShowReturnModal(false);
            setReturnModalTarget(null);
          }

          // Optimistically update case in local state immediately
          setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
          if (justUploadedCase && justUploadedCase.id === updatedCase.id) {
            setJustUploadedCase(updatedCase);
          }

          await loadData();

          // Auto-select next remaining active case in scrutiny queue
          const remaining = cases.filter((c) => c.status === 'UNDER_SCRUTINY' && c.id !== caseId);
          if (remaining.length > 0) {
            setSelectedCaseId(remaining[0].id);
          } else {
            setSelectedCaseId(updatedCase.id);
          }
        } else {
          if (res.status === 401 || res.status === 403) {
            try {
              localStorage.removeItem('sg_divp_token_tehsildar');
            } catch (e) {}
            setAuthTokens((prev) => ({ ...prev, tehsildar: null }));
            setDeskAuthModal({
              role: 'tehsildar',
              targetDesk: 'OFFICER',
              title: currentLang === 'mr' ? 'तहसीलदार पटल प्रमाणीकरण' : 'Tehsildar Desk Authentication',
              roleLabel: currentLang === 'mr' ? 'कार्यकारी दंडाधिकारी व तहसीलदार' : 'Executive Magistrate & Tehsildar',
              department: currentLang === 'mr' ? 'महसूल व वन विभाग, हवेली उपविभाग' : 'Revenue & Forest Department, Haveli',
              pin: '7788',
              error: data.error || 'Sovereign credentials expired. Please verify statutory PIN.',
              loading: false
            });
          }
          showToast(data.error || 'Action failed', 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    // Root Admin Action with Direct Case ID Binding, Serverless Recovery & Immediate State Update
    const handleAdminAction = async (action, targetCaseId) => {
      const caseId = targetCaseId || selectedCase?.id;
      if (!caseId) {
        showToast('No target dossier selected for Admin seal', 'error');
        return;
      }
      setLoading(true);
      try {
        const token = await getRoleToken('admin');
        const targetCase = cases.find((c) => c.id === caseId) || justUploadedCase || selectedCase;
        const res = await fetch(`/api/cases/${caseId}/admin-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action,
            adminRemarks: 'Digitally verified and sealed under Section 65B Indian Evidence Act.',
            caseData: targetCase
          })
        });
        const data = await res.json();
        if (res.ok) {
          const updatedCase = data.case || { ...targetCase, status: 'APPROVED' };
          const caseNum = updatedCase.caseNumber || caseId;
          showToast(`FINAL GOVERNMENT SEAL EXECUTED: Case #${caseNum} Authorized & Issued!`, 'success');

          // Optimistically update case in local state immediately
          setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
          if (justUploadedCase && justUploadedCase.id === updatedCase.id) {
            setJustUploadedCase(updatedCase);
          }

          await loadData();
          setSelectedCaseId(caseId);
        } else {
          if (res.status === 401 || res.status === 403) {
            try {
              localStorage.removeItem('sg_divp_token_admin');
            } catch (e) {}
            setAuthTokens((prev) => ({ ...prev, admin: null }));
            setDeskAuthModal({
              role: 'admin',
              targetDesk: 'ADMIN',
              title: currentLang === 'mr' ? 'जिल्हाधिकारी पटल प्रमाणीकरण' : 'Root Admin Desk Authentication',
              roleLabel: currentLang === 'mr' ? 'मुख्य जिल्हा प्रशासक' : 'Chief District Administrator',
              department: currentLang === 'mr' ? 'जिल्हाधिकारी कार्यालय व राष्ट्रीय माहिती विज्ञान केंद्र' : 'District Collectorate & NIC Governance',
              pin: '9900',
              error: data.error || 'Sovereign credentials expired. Please verify statutory PIN.',
              loading: false
            });
          }
          showToast(data.error || 'Action failed', 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    // -------------------------------------------------------------
    // RENDER ROLE 1: CITIZEN / USER PORTAL
    // -------------------------------------------------------------
    const renderCitizenPortal = () => {
      // Filter strictly to current citizen persona (Kalpak Kishor Narkhede)
      const myCases = cases.filter(
        (c) => c.applicantName === 'Kalpak Kishor Narkhede' || c.citizenId === 'CITIZEN_USER_01'
      );
      const approvedCount = myCases.filter((c) => c.status === 'APPROVED').length;
      const pendingCount = myCases.filter((c) => c.status === 'UNDER_SCRUTINY' || c.status === 'FORWARDED_TO_ADMIN').length;
      const returnedCount = myCases.filter((c) => c.status === 'RETURNED').length;

      // Filter Catalogue by Search & Department
      const filteredDocs = documentTypes.filter((doc) => {
        const matchesSearch =
          doc.documentTitle.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
          doc.department.toLowerCase().includes(docSearchQuery.toLowerCase());
        const matchesDept =
          selectedDeptFilter === 'ALL' || doc.department.toUpperCase().includes(selectedDeptFilter.toUpperCase());
        return matchesSearch && matchesDept;
      });

      // Filter Applications by Search & Status (Personalized for Kalpak Kishor Narkhede)
      const filteredApps = myCases.filter((c) => {
        const matchesSearch =
          !appSearchQuery ||
          (c.applicantName && c.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
          (c.caseNumber && c.caseNumber.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
          (c.scheme && c.scheme.toLowerCase().includes(appSearchQuery.toLowerCase()));
        const matchesStatus = appStatusFilter === 'ALL' || c.status === appStatusFilter;
        return matchesSearch && matchesStatus;
      });

      return h('div', { className: 'space-y-8' },
        // Citizen Identity Banner (Personalized for Kalpak Kishor Narkhede)
        h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 flex flex-wrap items-center justify-between gap-4' },
          h('div', { className: 'flex items-center gap-4' },
            h('div', { className: 'w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-md shadow-indigo-500/20' },
              'KN'
            ),
            h('div', null,
              h('div', { className: 'text-xs font-bold uppercase tracking-wider text-indigo-700' },
                currentLang === 'mr' ? 'नागरिक सेवा पोर्टल' : currentLang === 'hi' ? 'नागरिक सेवा पटल' : 'Citizen Public Portal'
              ),
              h('h2', { className: 'text-xl font-extrabold text-slate-900 tracking-tight' },
                t('citizenProfileName') || 'Kalpak Kishor Narkhede'
              ),
              h('p', { className: 'text-xs text-slate-500' },
                t('citizenProfileSubtitle') || 'Resident Citizen • Haveli Sub-Division, Pune'
              )
            )
          ),
          h('div', { className: 'flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl' },
            h('span', { className: 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse' }),
            h('span', { className: 'text-xs font-mono font-bold text-slate-700' }, 'UID: 9845-2314-9281 (Verified Citizen)')
          )
        ),

        // Citizen Summary Metric Banner (Clickable KPI Cards)
        h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-5' },
          h('div', {
            onClick: () => {
              setAppStatusFilter('UNDER_SCRUTINY');
              document.getElementById('my-applications-section')?.scrollIntoView({ behavior: 'smooth' });
              showToast(currentLang === 'mr' ? 'फिल्टर: शासकीय छाननी अंतर्गत अर्ज दर्शवित आहे' : currentLang === 'hi' ? 'फ़िल्टर: सरकारी जांच के अंतर्गत आवेदन प्रदर्शित' : 'Filtered: Showing applications under active government scrutiny', 'info');
            },
            className: `bg-white p-6 rounded-3xl border shadow-sm ring-1 ring-slate-900/5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
              appStatusFilter === 'UNDER_SCRUTINY' ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-slate-200/80 hover:border-indigo-400'
            }`
          },
            h('div', { className: 'flex items-center gap-4' },
              h('div', { className: 'w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'FileText', className: 'w-7 h-7' })
              ),
              h('div', null,
                h('div', { className: 'text-xs text-slate-500 font-semibold uppercase tracking-wider' }, t('kpiUnderScrutiny')),
                h('div', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, pendingCount),
                h('div', { className: 'text-xs text-indigo-600 font-semibold mt-0.5' }, t('kpiUnderScrutinySub'))
              )
            ),
            h('span', { className: 'text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl' }, t('kpiView'))
          ),
          h('div', {
            onClick: () => {
              setAppStatusFilter('APPROVED');
              document.getElementById('my-applications-section')?.scrollIntoView({ behavior: 'smooth' });
              showToast(currentLang === 'mr' ? 'फिल्टर: स्वाक्षरीत व जारी प्रमाणपत्रे दर्शवित आहे (मुद्रणासाठी सज्ज)' : currentLang === 'hi' ? 'फ़िल्टर: मुद्रित एवं जारी प्रमाण पत्र प्रदर्शित' : 'Filtered: Showing digitally sealed & issued certificates (Ready to Print)', 'success');
            },
            className: `bg-white p-6 rounded-3xl border shadow-sm ring-1 ring-slate-900/5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
              appStatusFilter === 'APPROVED' ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200/80 hover:border-emerald-400'
            }`
          },
            h('div', { className: 'flex items-center gap-4' },
              h('div', { className: 'w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'CheckCircle2', className: 'w-7 h-7' })
              ),
              h('div', null,
                h('div', { className: 'text-xs text-slate-500 font-semibold uppercase tracking-wider' }, t('kpiIssued')),
                h('div', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, approvedCount),
                h('div', { className: 'text-xs text-emerald-600 font-semibold mt-0.5' }, t('kpiIssuedSub'))
              )
            ),
            h('span', { className: 'text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl' }, t('kpiView'))
          ),
          h('div', {
            onClick: () => {
              setAppStatusFilter('RETURNED');
              document.getElementById('my-applications-section')?.scrollIntoView({ behavior: 'smooth' });
              showToast(currentLang === 'mr' ? 'फिल्टर: वैधानिक त्रुटीसह परत पाठवलेले अर्ज दर्शवित आहे' : currentLang === 'hi' ? 'फ़िल्टर: आपत्ति सहित वापस आवेदन प्रदर्शित' : 'Filtered: Showing returned applications with statutory violation proof', 'error');
            },
            className: `bg-white p-6 rounded-3xl border shadow-sm ring-1 ring-slate-900/5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
              appStatusFilter === 'RETURNED' ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-slate-200/80 hover:border-rose-400'
            }`
          },
            h('div', { className: 'flex items-center gap-4' },
              h('div', { className: 'w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'AlertTriangle', className: 'w-7 h-7' })
              ),
              h('div', null,
                h('div', { className: 'text-xs text-slate-500 font-semibold uppercase tracking-wider' }, t('kpiReturned')),
                h('div', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, returnedCount),
                h('div', { className: 'text-xs text-rose-600 font-semibold mt-0.5' }, t('kpiReturnedSub'))
              )
            ),
            h('span', { className: 'text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl' }, t('kpiView'))
          )
        ),

        // NEW: Prominent Upload Confirmation Card (High-Contrast Solid Slate-900)
        justUploadedCase && h('div', {
          className: 'p-6 rounded-3xl text-white shadow-2xl space-y-4 border',
          style: {
            backgroundColor: '#0f172a',
            borderColor: '#38bdf8',
            borderWidth: '2px',
            borderStyle: 'solid',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.4)',
            color: '#ffffff'
          }
        },
          h('div', { className: 'flex flex-wrap items-center justify-between gap-3' },
            h('div', { className: 'flex items-center gap-3' },
              h('div', {
                className: 'w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0',
                style: { backgroundColor: '#064e3b', borderColor: '#10b981', borderWidth: '1px', borderStyle: 'solid', color: '#34d399' }
              },
                h(SvgIcon, { name: 'CheckCircle2', className: 'w-7 h-7' })
              ),
              h('div', null,
                h('div', { className: 'flex items-center gap-2' },
                  h('span', {
                    className: 'text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-extrabold',
                    style: { backgroundColor: '#10b981', color: '#022c22' }
                  }, t('uploadConfirmed')),
                  h('span', { className: 'text-xs font-mono font-bold', style: { color: '#93c5fd' } }, justUploadedCase.caseNumber)
                ),
                h('h3', { className: 'text-base font-extrabold mt-1', style: { color: '#ffffff' } },
                  (getDocMeta(justUploadedCase).name) || justUploadedCase.scheme
                )
              )
            ),
            h('button', {
              onClick: () => setJustUploadedCase(null),
              className: 'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition-all',
              style: { backgroundColor: '#334155', color: '#ffffff' }
            }, 'x')
          ),

          h('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-3 text-xs p-4 rounded-2xl',
            style: { backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: '1px', borderStyle: 'solid' }
          },
            h('div', null,
              h('span', { className: 'text-[10px] block uppercase font-semibold', style: { color: '#94a3b8' } }, t('applicantFullName')),
              h('strong', { className: 'text-xs', style: { color: '#f8fafc' } }, justUploadedCase.applicantName)
            ),
            h('div', null,
              h('span', { className: 'text-[10px] block uppercase font-semibold', style: { color: '#94a3b8' } }, t('attachedArtifact')),
              h('strong', { className: 'text-xs font-mono', style: { color: '#c7d2fe' } },
                justUploadedCase.extractedFields?.uploadedFileName?.value || 'document_scan.pdf'
              )
            ),
            h('div', null,
              h('span', { className: 'text-[10px] block uppercase font-semibold', style: { color: '#94a3b8' } }, t('verificationStage')),
              h('span', { className: 'font-bold flex items-center gap-1 mt-0.5', style: { color: '#34d399' } },
                h(SvgIcon, { name: 'FileSearch', className: 'w-3.5 h-3.5' }),
                t('underScrutinyStage')
              )
            )
          ),

          // Direct switch button to view this exact document on Tehsildar dashboard
          h('div', {
            className: 'flex flex-wrap items-center justify-between gap-3 pt-3',
            style: { borderTopColor: '#334155', borderTopWidth: '1px', borderTopStyle: 'solid' }
          },
            h('div', { className: 'text-xs', style: { color: '#cbd5e1' } },
              t('uploadNotice')
            ),
            h('button', {
              onClick: () => {
                setSelectedCaseId(justUploadedCase.id);
                setOfficerQueueTab('ACTIVE');
                setCurrentRole('OFFICER');
              },
              className: 'px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg',
              style: { backgroundColor: '#4f46e5', color: '#ffffff', border: '1px solid #6366f1' }
            },
              h(SvgIcon, { name: 'FileSearch', className: 'w-4 h-4 text-white' }),
              t('switchToOfficerDesk')
            )
          )
        ),

        // Section A: Catalogue of Essential Government Documents
        h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
          h('div', { className: 'flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3' },
            h('div', null,
              h('h2', { className: 'text-lg font-bold text-slate-900' }, t('catalogueTitle')),
              h('p', { className: 'text-xs text-slate-500 mt-0.5' }, t('catalogueSubtitle'))
            ),
            // Department Filter Chips
            h('div', { className: 'flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs' },
              [
                { id: 'ALL', label: t('allDepartments') },
                { id: 'REVENUE', label: currentLang === 'mr' ? 'महसूल विभाग' : currentLang === 'hi' ? 'राजस्व विभाग' : 'Revenue' },
                { id: 'SOCIAL', label: currentLang === 'mr' ? 'सामाजिक न्याय' : currentLang === 'hi' ? 'सामाजिक न्याय' : 'Social Justice' },
                { id: 'LAND', label: currentLang === 'mr' ? 'भूमि अभिलेख' : currentLang === 'hi' ? 'भूमि अभिलेख' : 'Land Records' },
                { id: 'DIVYANG', label: currentLang === 'mr' ? 'दिव्यांग कल्याण' : currentLang === 'hi' ? 'दिव्यांग कल्याण' : 'Divyangjan' }
              ].map((f) =>
                h('button', {
                  key: f.id,
                  onClick: () => setSelectedDeptFilter(f.id),
                  className: `px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedDeptFilter === f.id
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                }, f.label)
              )
            )
          ),

          // Search Bar
          h('div', { className: 'mb-6' },
            h('input', {
              type: 'text',
              value: docSearchQuery,
              onChange: (e) => setDocSearchQuery(e.target.value),
              placeholder: t('searchPlaceholder'),
              className: 'w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-slate-50'
            })
          ),

          // Section A.1: Dedicated Application Intake Workspace (When a document is selected, ONLY this section is open - zero scroll required)
          selectedDocForUpload ? (() => {
            const selectedDocMeta = getDocMeta(selectedDocForUpload);
            const criteriaDisplay = typeof selectedDocMeta.criteria === 'string' && selectedDocMeta.criteria.trim()
              ? selectedDocMeta.criteria
              : Array.isArray(selectedDocMeta.criteria?.mandatoryNorms) && selectedDocMeta.criteria.mandatoryNorms.length > 0
              ? selectedDocMeta.criteria.mandatoryNorms[0]
              : Array.isArray(selectedDocForUpload.criteria?.mandatoryNorms) && selectedDocForUpload.criteria.mandatoryNorms.length > 0
              ? selectedDocForUpload.criteria.mandatoryNorms[0]
              : typeof selectedDocForUpload.criteria === 'string' && selectedDocForUpload.criteria.trim()
              ? selectedDocForUpload.criteria
              : (currentLang === 'mr' ? 'महाराष्ट्र शासन राजपत्रानुसार वैधानिक निकष पडताळणी अनिवार्य आहे.' : currentLang === 'hi' ? 'महाराष्ट्र शासन राजपत्र अनुसार वैधानिक पात्रता मानकों का सत्यापन अनिवार्य है।' : 'Mandatory statutory gazette eligibility norm verified upon submission.');

            return h('div', {
              id: 'application-intake-section',
              className: 'bg-indigo-50/40 p-6 rounded-3xl border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-500/10 space-y-5'
            },
              // Header with Department Badge & Back Button
              h('div', { className: 'flex flex-wrap justify-between items-start border-b border-slate-200 pb-4 gap-3' },
                h('div', null,
                  h('div', { className: 'flex items-center gap-2 mb-1' },
                    h('span', { className: 'text-[10px] font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase' },
                      selectedDocMeta.dept || selectedDocForUpload.department
                    ),
                    h('span', { className: 'text-[10px] font-mono text-slate-500' },
                      selectedDocForUpload.gazetteNotification || 'Statutory State Gazette'
                    )
                  ),
                  h('h3', { className: 'text-xl font-extrabold text-slate-900 tracking-tight' },
                    `${t('applyFor')} ${selectedDocMeta.name || selectedDocForUpload.documentTitle}`
                  ),
                  h('p', { className: 'text-xs text-slate-500 mt-0.5' },
                    t('catalogueSubtitle')
                  )
                ),
                h('div', { className: 'flex items-center gap-2' },
                  h('button', {
                    type: 'button',
                    onClick: () => setSelectedDocForUpload(null),
                    className: 'px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm'
                  },
                    t('backToCatalogue')
                  ),
                  h('button', {
                    onClick: () => setSelectedDocForUpload(null),
                    className: 'w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-all'
                  }, 'x')
                )
              ),

              // Statutory Gazette Notice Box
              h('div', { className: 'p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-3' },
                h('div', { className: 'p-1.5 rounded-lg bg-amber-200 text-amber-900 flex-shrink-0 mt-0.5' },
                  h(SvgIcon, { name: 'FileSearch', className: 'w-4 h-4' })
                ),
                h('div', null,
                  h('strong', { className: 'block font-bold text-amber-900 mb-0.5' }, t('gazetteCriteria')),
                  criteriaDisplay
                )
              ),

              // Intake Form
              h('form', { onSubmit: handleCitizenSubmit, className: 'space-y-4 text-xs' },
                h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                  h('div', null,
                    h('label', { className: 'block font-bold text-slate-700 mb-1' }, t('applicantFullName')),
                    h('input', {
                      type: 'text',
                      value: uploadForm.applicantName,
                      onChange: (e) => setUploadForm({ ...uploadForm, applicantName: e.target.value }),
                      className: 'w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white font-medium',
                      placeholder: 'e.g. Ramesh S. Patil'
                    })
                  ),
                  h('div', null,
                    h('label', { className: 'block font-bold text-slate-700 mb-1' }, t('aadhaarUid')),
                    h('input', {
                      type: 'text',
                      value: uploadForm.applicantUID,
                      onChange: (e) => setUploadForm({ ...uploadForm, applicantUID: e.target.value }),
                      className: 'w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white font-mono',
                      placeholder: 'UIDAI-XXXX-XXXX-1234'
                    })
                  )
                ),

                h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                  h('div', null,
                    h('label', { className: 'block font-bold text-slate-700 mb-1' }, t('fatherGuardianName')),
                    h('input', {
                      type: 'text',
                      value: uploadForm.fatherName,
                      onChange: (e) => setUploadForm({ ...uploadForm, fatherName: e.target.value }),
                      className: 'w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white font-medium',
                      placeholder: 'Father / Guardian Name'
                    })
                  ),
                  h('div', null,
                    h('label', { className: 'block font-bold text-slate-700 mb-1' }, t('incomeMetric')),
                    h('input', {
                      type: 'text',
                      value: uploadForm.criteriaValue,
                      onChange: (e) => setUploadForm({ ...uploadForm, criteriaValue: e.target.value }),
                      className: 'w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white font-mono font-bold text-indigo-900',
                      placeholder: 'e.g. 620000'
                    })
                  )
                ),

                // File Attachment Dropzone
                h('div', { className: 'p-5 rounded-2xl border-2 border-dashed border-indigo-200 bg-white text-center space-y-2' },
                  h(SvgIcon, { name: 'FileSearch', className: 'w-7 h-7 mx-auto text-indigo-500' }),
                  h('div', { className: 'font-bold text-slate-800 text-xs' }, `${t('attachedArtifact')} (PDF, PNG, JPG):`),
                  h('input', {
                    type: 'file',
                    accept: '.pdf,.png,.jpg,.jpeg',
                    onChange: handleFileChange,
                    className: 'block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer'
                  }),
                  h('div', { className: 'font-mono text-indigo-800 text-xs font-bold pt-1 flex items-center justify-center gap-1.5' },
                    h(SvgIcon, { name: 'FileText', className: 'w-4 h-4' }),
                    `Attached: ${uploadForm.uploadedFileName} (${uploadForm.uploadedFileSize})`
                  ),
                  h('div', { className: 'text-[11px] text-slate-500 italic mt-1' }, t('ocrNotice'))
                ),

                // Form Action Bar
                h('div', { className: 'flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 gap-3' },
                  h('button', {
                    type: 'button',
                    onClick: () => handlePreFill(selectedDocForUpload.documentType),
                    className: 'px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer'
                  },
                    h(SvgIcon, { name: 'Activity', className: 'w-4 h-4 text-indigo-600' }),
                    t('autofillSample')
                  ),
                  h('div', { className: 'flex items-center gap-2' },
                    h('button', {
                      type: 'button',
                      onClick: () => setSelectedDocForUpload(null),
                      className: 'px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer'
                    }, t('cancel')),
                    h('button', {
                      type: 'submit',
                      disabled: loading,
                      className: 'px-6 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer'
                    },
                      h(SvgIcon, { name: 'ShieldCheck', className: 'w-4 h-4' }),
                      loading ? t('uploadingInProgress') : t('uploadAndVerify')
                    )
                  )
                )
              )
            );
          })() : h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
            filteredDocs.map((doc, idx) => {
              const docMeta = getDocMeta(doc);
              const docCodes = {
                NON_CREAMY_LAYER_CERTIFICATE: 'DOC-REF: REV-NCL-01',
                CASTE_VALIDITY_CERTIFICATE: 'DOC-REF: SOC-CST-02',
                INCOME_CERTIFICATE: 'DOC-REF: REV-INC-03',
                LAND_RECORD_7_12_EXTRACT: 'DOC-REF: LND-712-04',
                DIVYANGJAN_DISABILITY_CERTIFICATE: 'DOC-REF: DIV-PWD-05',
                EWS_CERTIFICATE: 'DOC-REF: GAD-EWS-06',
                DOMICILE_CERTIFICATE: 'DOC-REF: GAD-DOM-07',
                AGRICULTURAL_SOLVENCY_CERTIFICATE: 'DOC-REF: AGR-SOL-08'
              };
              const docRef = docCodes[doc.documentType] || `DOC-REF: GOV-0${idx + 1}`;

              return h('div', {
                key: doc.documentType,
                className: 'p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between'
              },
                h('div', null,
                  // Top Row: Icon + Clean Document Reference Badge
                  h('div', { className: 'flex items-center justify-between mb-3' },
                    h('div', { className: 'w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center' },
                      h(SvgIcon, { name: 'FileText', className: 'w-5 h-5' })
                    ),
                    h('span', { className: 'text-[10px] font-mono text-indigo-900 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-full font-bold' },
                      docRef
                    )
                  ),
                  h('h3', { className: 'text-xs font-bold text-slate-900 leading-snug mb-1' },
                    docMeta.name || doc.documentTitle
                  ),
                  h('p', { className: 'text-[11px] text-slate-500 mb-3' },
                    docMeta.dept || doc.department
                  ),
                  h('div', { className: 'text-[10px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 font-mono mb-4' },
                    doc.processingTimeStandard
                  )
                ),
                h('button', {
                  onClick: () => {
                    setSelectedDocForUpload(doc);
                    handlePreFill(doc.documentType);
                    setTimeout(() => {
                      document.getElementById('application-intake-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  },
                  className: 'w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 cursor-pointer'
                },
                  h(SvgIcon, { name: 'FileSearch', className: 'w-3.5 h-3.5' }),
                  t('applyAndAttach')
                )
              );
            })
          )
        ),

        // Section B: My Submitted Applications
        h('div', { id: 'my-applications-section', className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
          h('div', { className: 'flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3' },
            h('div', null,
              h('h2', { className: 'text-base font-bold text-slate-900' }, t('submittedApplications')),
              h('p', { className: 'text-xs text-slate-500' },
                currentLang === 'mr' ? 'तहसीलदार छाननी व जिल्हाधिकारी अंतिम मुद्रेची थेट स्थिती' : currentLang === 'hi' ? 'तहसीलदार जांच एवं जिला मजिस्ट्रेट अंतिम मुद्रा की सजीव स्थिति' : 'Direct status sync with Tehsildar Scrutiny and District Collectorate Final Seal'
              )
            ),
            h('div', { className: 'flex items-center gap-2' },
              h('input', {
                type: 'text',
                value: appSearchQuery,
                onChange: (e) => setAppSearchQuery(e.target.value),
                placeholder: currentLang === 'mr' ? 'प्रकरण क्रमांक किंवा नावाने शोधा...' : currentLang === 'hi' ? 'प्रकरण संख्या या नाम से खोजें...' : 'Filter by case number or name...',
                className: 'p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-indigo-600'
              }),
              h('select', {
                value: appStatusFilter,
                onChange: (e) => setAppStatusFilter(e.target.value),
                className: 'p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none cursor-pointer'
              },
                h('option', { value: 'ALL' }, t('tableFilterAll')),
                h('option', { value: 'UNDER_SCRUTINY' }, t('tableFilterScrutiny')),
                h('option', { value: 'FORWARDED_TO_ADMIN' }, t('tabForwarded')),
                h('option', { value: 'APPROVED' }, t('tableFilterIssued')),
                h('option', { value: 'RETURNED' }, t('tableFilterReturned'))
              )
            )
          ),

          h('div', { className: 'overflow-x-auto' },
            h('table', { className: 'w-full text-left border-collapse text-xs' },
              h('thead', { className: 'bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200' },
                h('tr', null,
                  h('th', { className: 'p-3' }, t('thCaseId')),
                  h('th', { className: 'p-3' }, t('thService')),
                  h('th', { className: 'p-3' }, t('thApplicant')),
                  h('th', { className: 'p-3' }, t('attachedArtifact')),
                  h('th', { className: 'p-3' }, t('thStatus')),
                  h('th', { className: 'p-3 text-right' }, t('thActions'))
                )
              ),
              h('tbody', { className: 'divide-y divide-slate-100 font-medium text-slate-800' },
                filteredApps.length === 0
                  ? h('tr', null,
                      h('td', { colSpan: 6, className: 'p-6 text-center text-slate-400 text-xs' },
                        t('noApplications')
                      )
                    )
                  : filteredApps.map((c) =>
                      h('tr', { key: c.id, className: 'hover:bg-slate-50 transition-colors' },
                        h('td', { className: 'p-3 font-mono font-bold text-indigo-700' }, c.caseNumber),
                        h('td', { className: 'p-3 font-semibold' },
                          (getDocMeta(c).name) || c.scheme
                        ),
                        h('td', { className: 'p-3' }, c.applicantName),
                        h('td', { className: 'p-3 font-mono text-[11px] text-slate-500' },
                          c.extractedFields?.uploadedFileName?.value || 'document_scan.pdf'
                        ),
                        h('td', { className: 'p-3' },
                          c.status === 'APPROVED' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'CheckCircle2', className: 'w-3.5 h-3.5' }),
                              t('kpiIssued')
                            ),
                          c.status === 'FORWARDED_TO_ADMIN' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'Activity', className: 'w-3.5 h-3.5' }),
                              t('tabForwarded')
                            ),
                          c.status === 'UNDER_SCRUTINY' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'FileSearch', className: 'w-3.5 h-3.5' }),
                              t('kpiUnderScrutiny')
                            ),
                          c.status === 'RETURNED' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'AlertTriangle', className: 'w-3.5 h-3.5' }),
                              t('kpiReturned')
                            )
                        ),
                        h('td', { className: 'p-3 text-right' },
                          c.status === 'APPROVED' &&
                            h('button', {
                              onClick: () => handleOpenCertificate(c),
                              className: 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-all cursor-pointer'
                            },
                              h(SvgIcon, { name: 'Download', className: 'w-3.5 h-3.5' }),
                              t('actionPrint')
                            ),
                          c.status === 'RETURNED' &&
                            h('button', {
                              onClick: () => setShowReturnReasonModal(c),
                              className: 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-all cursor-pointer'
                            },
                              h(SvgIcon, { name: 'AlertTriangle', className: 'w-3.5 h-3.5' }),
                              t('actionInspectReason')
                            ),
                          (c.status === 'UNDER_SCRUTINY' || c.status === 'FORWARDED_TO_ADMIN') &&
                            h('span', { className: 'text-xs text-slate-400 font-mono' }, t('actionInReview'))
                        )
                      )
                    )
              )
            )
          )
        )
      );
    };

    // -------------------------------------------------------------
    // RENDER ROLE 2: APPROVING OFFICER (TEHSILDAR) DESK
    // -------------------------------------------------------------
    const renderOfficerPortal = () => {
      const activeQueue = cases.filter((c) => c.status === 'UNDER_SCRUTINY');
      const forwardedQueue = cases.filter((c) => c.status === 'FORWARDED_TO_ADMIN' || c.status === 'APPROVED');
      const returnedQueue = cases.filter((c) => c.status === 'RETURNED');
      const historyQueue = cases;

      const displayedQueue =
        officerQueueTab === 'ACTIVE'
          ? activeQueue
          : officerQueueTab === 'FORWARDED'
          ? forwardedQueue
          : officerQueueTab === 'RETURNED'
          ? returnedQueue
          : historyQueue;

      // Smart selection: Strictly pick from current queue tab to prevent displaying unrelated approved cases
      const officerSelectedCase =
        displayedQueue.find((c) => c.id === selectedCaseId) ||
        displayedQueue[0] ||
        null;

      return h('div', { className: 'space-y-6' },
        // Tehsildar Banner
        h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 flex flex-wrap items-center justify-between gap-4' },
          h('div', null,
            h('div', { className: 'text-xs font-bold uppercase text-indigo-700' },
              currentLang === 'mr' ? 'उपविभागीय महसूल प्रशासन' : currentLang === 'hi' ? 'उप-संभागीय राजस्व प्रशासन' : 'Sub-Divisional Revenue Administration'
            ),
            h('h2', { className: 'text-xl font-extrabold text-slate-900 tracking-tight' },
              currentLang === 'mr' ? 'डॉ. आनंद के. कुलकर्णी (तहसीलदार तथा कार्यकारी दंडाधिकारी)' : currentLang === 'hi' ? 'डॉ. आनंद के. कुलकर्णी (तहसीलदार एवं कार्यपालक मजिस्ट्रेट)' : 'Dr. Anand K. Kulkarni (Tehsildar & Executive Magistrate)'
            ),
            h('p', { className: 'text-xs text-slate-500' }, t('tehsildarSubtitle'))
          ),
          h('div', { className: 'text-xs text-slate-500 font-medium' },
            currentLang === 'mr' ? 'स्थानिक राजपत्र पडताळणी कक्ष' : currentLang === 'hi' ? 'स्थानीय राजपत्र सत्यापन पटल' : 'Interactive Scrutiny Portal • Non-Custodial Gazette Evaluation'
          )
        ),

        // Tehsildar Scrutiny Operational KPI Cards (Clickable to switch queue tabs including History)
        h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4' },
          // KPI 1: Active Scrutiny Queue
          h('div', {
            onClick: () => {
              setOfficerQueueTab('ACTIVE');
              if (activeQueue.length > 0) setSelectedCaseId(activeQueue[0].id);
              showToast(currentLang === 'mr' ? 'सक्रिय छाननी यादी निवडली' : currentLang === 'hi' ? 'सक्रिय जांच सूची चयनित' : 'Active Scrutiny Queue Selected', 'info');
            },
            className: `p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
              officerQueueTab === 'ACTIVE'
                ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-sm'
            }`
          },
            h('div', { className: 'flex items-center gap-3.5' },
              h('div', { className: 'w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'FileSearch', className: 'w-5 h-5' })
              ),
              h('div', null,
                h('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-amber-900' }, t('tabActiveQueue')),
                h('div', { className: 'text-2xl font-black text-slate-900' }, activeQueue.length),
                h('div', { className: 'text-[10px] text-amber-700 font-semibold' },
                  currentLang === 'mr' ? 'सक्रिय यादी' : 'Active queue'
                )
              )
            ),
            h('span', { className: `text-xs font-bold px-2 py-1 rounded-xl ${officerQueueTab === 'ACTIVE' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-100 text-slate-600'}` },
              officerQueueTab === 'ACTIVE' ? (currentLang === 'mr' ? 'पाहत आहात' : currentLang === 'hi' ? 'देख रहे हैं' : 'VIEWING') : t('kpiView')
            )
          ),

          // KPI 2: Forwarded & Approved
          h('div', {
            onClick: () => {
              setOfficerQueueTab('FORWARDED');
              if (forwardedQueue.length > 0) setSelectedCaseId(forwardedQueue[0].id);
              showToast(currentLang === 'mr' ? 'मंजूर व अग्रेषित प्रकरणे निवडली' : currentLang === 'hi' ? 'स्वीकृत एवं अग्रेषित प्रकरण चयनित' : 'Approved & Forwarded Archive Selected', 'success');
            },
            className: `p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
              officerQueueTab === 'FORWARDED'
                ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm'
            }`
          },
            h('div', { className: 'flex items-center gap-3.5' },
              h('div', { className: 'w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'CheckCircle2', className: 'w-5 h-5' })
              ),
              h('div', null,
                h('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-emerald-900' }, t('tabForwarded')),
                h('div', { className: 'text-2xl font-black text-slate-900' }, forwardedQueue.length),
                h('div', { className: 'text-[10px] text-emerald-700 font-semibold' },
                  currentLang === 'mr' ? 'मंजूर प्रकरणे' : 'Approved'
                )
              )
            ),
            h('span', { className: `text-xs font-bold px-2 py-1 rounded-xl ${officerQueueTab === 'FORWARDED' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-slate-100 text-slate-600'}` },
              officerQueueTab === 'FORWARDED' ? (currentLang === 'mr' ? 'पाहत आहात' : currentLang === 'hi' ? 'देख रहे हैं' : 'VIEWING') : t('kpiView')
            )
          ),

          // KPI 3: Returned with Proof
          h('div', {
            onClick: () => {
              setOfficerQueueTab('RETURNED');
              if (returnedQueue.length > 0) setSelectedCaseId(returnedQueue[0].id);
              showToast(currentLang === 'mr' ? 'त्रुटीसह परत पाठवलेले अर्ज निवडले' : currentLang === 'hi' ? 'आपत्ति सहित वापस आवेदन चयनित' : 'Returned Dossiers Selected', 'error');
            },
            className: `p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
              officerQueueTab === 'RETURNED'
                ? 'bg-rose-50/90 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                : 'bg-white border-slate-200 hover:border-rose-400 hover:shadow-sm'
            }`
          },
            h('div', { className: 'flex items-center gap-3.5' },
              h('div', { className: 'w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'AlertTriangle', className: 'w-5 h-5' })
              ),
              h('div', null,
                h('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-rose-900' }, t('kpiReturned')),
                h('div', { className: 'text-2xl font-black text-slate-900' }, returnedQueue.length),
                h('div', { className: 'text-[10px] text-rose-700 font-semibold' },
                  currentLang === 'mr' ? 'त्रुटी नोंदी' : 'Returned'
                )
              )
            ),
            h('span', { className: `text-xs font-bold px-2 py-1 rounded-xl ${officerQueueTab === 'RETURNED' ? 'bg-rose-500 text-white font-extrabold' : 'bg-slate-100 text-slate-600'}` },
              officerQueueTab === 'RETURNED' ? (currentLang === 'mr' ? 'पाहत आहात' : currentLang === 'hi' ? 'देख रहे हैं' : 'VIEWING') : t('kpiView')
            )
          ),

          // KPI 4: Master History Registry
          h('div', {
            onClick: () => {
              setOfficerQueueTab('HISTORY');
              showToast(currentLang === 'mr' ? 'सर्व सादर अर्जांची नोंदवही निवडली' : currentLang === 'hi' ? 'समस्त प्रस्तुत आवेदनों की पंजी चयनित' : 'Master Applications Registry Selected', 'info');
            },
            className: `p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
              officerQueueTab === 'HISTORY'
                ? 'bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-sm'
            }`
          },
            h('div', { className: 'flex items-center gap-3.5' },
              h('div', { className: 'w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'FileText', className: 'w-5 h-5' })
              ),
              h('div', null,
                h('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-indigo-900' }, t('tabHistory') || 'History'),
                h('div', { className: 'text-2xl font-black text-slate-900' }, historyQueue.length),
                h('div', { className: 'text-[10px] text-indigo-700 font-semibold' },
                  currentLang === 'mr' ? 'सर्व अर्जांची नोंदवही' : 'Master registry'
                )
              )
            ),
            h('span', { className: `text-xs font-bold px-2 py-1 rounded-xl ${officerQueueTab === 'HISTORY' ? 'bg-indigo-600 text-white font-extrabold' : 'bg-slate-100 text-slate-600'}` },
              officerQueueTab === 'HISTORY' ? (currentLang === 'mr' ? 'पाहत आहात' : currentLang === 'hi' ? 'देख रहे हैं' : 'VIEWING') : t('kpiView')
            )
          )
        ),

        // History Tab Content OR Split-Screen Scrutiny Workspace OR Empty Queue Notice
        officerQueueTab === 'HISTORY' ? h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 space-y-4' },
          // Header with search & filter
          h('div', { className: 'flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3' },
            h('div', null,
              h('h3', { className: 'text-base font-bold text-slate-900 flex items-center gap-2' },
                h(SvgIcon, { name: 'FileText', className: 'w-5 h-5 text-indigo-600' }),
                currentLang === 'mr' ? 'सर्व सादर अर्जांची नोंदवही व इतिहास (हवेली उपविभाग)' : currentLang === 'hi' ? 'समस्त प्रस्तुत आवेदनों की पंजी एवं इतिहास (हवेली उप-संभाग)' : 'Master Applications Registry & Historical Tracking (Haveli Sub-Division)'
              ),
              h('p', { className: 'text-xs text-slate-500' },
                currentLang === 'mr' ? 'तहसीलदार कक्ष: संपूर्ण अधिकारक्षेत्रातील अर्जांची पडताळणी नोंद (मुद्रण अधिकार केवळ नागरिकास)' : 'Tehsildar Chamber: Jurisdictional scrutiny ledger (Printing restricted to citizen & issuing authority)'
              )
            ),
            h('div', { className: 'flex items-center gap-2' },
              h('input', {
                type: 'text',
                value: appSearchQuery,
                onChange: (e) => setAppSearchQuery(e.target.value),
                placeholder: currentLang === 'mr' ? 'प्रकरण क्रमांक किंवा नावाने शोधा...' : currentLang === 'hi' ? 'प्रकरण संख्या या नाम से खोजें...' : 'Filter by case number or name...',
                className: 'p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-indigo-600'
              }),
              h('select', {
                value: appStatusFilter,
                onChange: (e) => setAppStatusFilter(e.target.value),
                className: 'p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none cursor-pointer'
              },
                h('option', { value: 'ALL' }, t('tableFilterAll')),
                h('option', { value: 'UNDER_SCRUTINY' }, t('tableFilterScrutiny')),
                h('option', { value: 'FORWARDED_TO_ADMIN' }, t('tabForwarded')),
                h('option', { value: 'APPROVED' }, t('tableFilterIssued')),
                h('option', { value: 'RETURNED' }, t('tableFilterReturned'))
              )
            )
          ),

          // Table WITHOUT PRINT OPTION
          h('div', { className: 'overflow-x-auto' },
            h('table', { className: 'w-full text-left border-collapse text-xs' },
              h('thead', { className: 'bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200' },
                h('tr', null,
                  h('th', { className: 'p-3' }, t('thCaseId')),
                  h('th', { className: 'p-3' }, t('thService')),
                  h('th', { className: 'p-3' }, t('thApplicant')),
                  h('th', { className: 'p-3' }, t('attachedArtifact')),
                  h('th', { className: 'p-3' }, t('thStatus')),
                  h('th', { className: 'p-3 text-right' }, t('thActions'))
                )
              ),
              h('tbody', { className: 'divide-y divide-slate-100 font-medium text-slate-800' },
                historyQueue.filter((c) => {
                  const matchesSearch =
                    !appSearchQuery ||
                    (c.applicantName && c.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
                    (c.caseNumber && c.caseNumber.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
                    (c.scheme && c.scheme.toLowerCase().includes(appSearchQuery.toLowerCase()));
                  const matchesStatus = appStatusFilter === 'ALL' || c.status === appStatusFilter;
                  return matchesSearch && matchesStatus;
                }).length === 0
                  ? h('tr', null,
                      h('td', { colSpan: 6, className: 'p-6 text-center text-slate-400 text-xs' }, t('noApplications'))
                    )
                  : historyQueue.filter((c) => {
                      const matchesSearch =
                        !appSearchQuery ||
                        (c.applicantName && c.applicantName.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
                        (c.caseNumber && c.caseNumber.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
                        (c.scheme && c.scheme.toLowerCase().includes(appSearchQuery.toLowerCase()));
                      const matchesStatus = appStatusFilter === 'ALL' || c.status === appStatusFilter;
                      return matchesSearch && matchesStatus;
                    }).map((c) =>
                      h('tr', { key: c.id, className: 'hover:bg-slate-50 transition-colors' },
                        h('td', { className: 'p-3 font-mono font-bold text-indigo-700' }, c.caseNumber),
                        h('td', { className: 'p-3 font-semibold' }, (getDocMeta(c).name) || c.scheme),
                        h('td', { className: 'p-3 font-bold text-slate-800' }, c.applicantName),
                        h('td', { className: 'p-3 font-mono text-[11px] text-slate-500' },
                          c.extractedFields?.uploadedFileName?.value || 'document_scan.pdf'
                        ),
                        h('td', { className: 'p-3' },
                          c.status === 'APPROVED' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'CheckCircle2', className: 'w-3.5 h-3.5' }),
                              t('kpiIssued')
                            ),
                          c.status === 'FORWARDED_TO_ADMIN' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'Activity', className: 'w-3.5 h-3.5' }),
                              t('tabForwarded')
                            ),
                          c.status === 'UNDER_SCRUTINY' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'FileSearch', className: 'w-3.5 h-3.5' }),
                              t('kpiUnderScrutiny')
                            ),
                          c.status === 'RETURNED' &&
                            h('span', { className: 'px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max' },
                              h(SvgIcon, { name: 'AlertTriangle', className: 'w-3.5 h-3.5' }),
                              t('kpiReturned')
                            )
                        ),
                        // Actions column (WITHOUT PRINT OPTION)
                        h('td', { className: 'p-3 text-right' },
                          c.status === 'UNDER_SCRUTINY' &&
                            h('button', {
                              onClick: () => {
                                setOfficerQueueTab('ACTIVE');
                                setSelectedCaseId(c.id);
                              },
                              className: 'px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-all cursor-pointer'
                            },
                              h(SvgIcon, { name: 'FileSearch', className: 'w-3.5 h-3.5' }),
                              t('actionScrutinize') || 'Scrutinize Dossier'
                            ),
                          c.status === 'RETURNED' &&
                            h('button', {
                              onClick: () => setShowReturnReasonModal(c),
                              className: 'px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-all cursor-pointer'
                            },
                              h(SvgIcon, { name: 'AlertTriangle', className: 'w-3.5 h-3.5' }),
                              t('actionInspectReason')
                            ),
                          c.status === 'FORWARDED_TO_ADMIN' &&
                            h('span', { className: 'text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200' },
                              currentLang === 'mr' ? 'जिल्हाधिकार्‍यांकडे पाठवले' : currentLang === 'hi' ? 'जिला मजिस्ट्रेट को अग्रेषित' : 'Forwarded to Collectorate'
                            ),
                          c.status === 'APPROVED' &&
                            h('span', { className: 'text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200' },
                              currentLang === 'mr' ? 'अंतिम मुद्रांकित व जारी' : currentLang === 'hi' ? 'अंतिम मुद्रित एवं जारी' : 'Digitally Sealed & Issued'
                            )
                        )
                      )
                    )
              )
            )
          )
        ) : displayedQueue.length === 0
          ? h('div', { className: 'bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-4' },
              h('div', { className: 'w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto' },
                h(SvgIcon, { name: 'FileSearch', className: 'w-8 h-8' })
              ),
              h('h3', { className: 'text-base font-bold text-slate-800' },
                officerQueueTab === 'ACTIVE'
                  ? (currentLang === 'mr' ? 'कोणतेही अर्ज प्रलंबित नाहीत: सक्रिय छाननी शून्य अनुशेष' : currentLang === 'hi' ? 'कोई आवेदन लंबित नहीं: सक्रिय जांच शून्य बैकलॉग' : 'Zero Scrutiny Backlog: All active dossiers have been processed')
                  : officerQueueTab === 'FORWARDED'
                  ? (currentLang === 'mr' ? 'कोणतेही अर्ज अजून अग्रेषित केलेले नाहीत' : 'No dossiers forwarded or approved yet')
                  : (currentLang === 'mr' ? 'त्रुटीसह परत केलेले कोणतेही अर्ज नाहीत' : 'No dossiers currently marked with discrepancies')
              ),
              h('p', { className: 'text-xs text-slate-500 max-w-md mx-auto' },
                officerQueueTab === 'ACTIVE'
                  ? (currentLang === 'mr' ? 'नागरिकांनी सादर केलेले नवीन अर्ज येथे आपोआप ओसीआर व राजपत्र नियमांसह दिसतील.' : 'New applications submitted by citizens will appear here in real time with automated OCR entity extraction and Gazette compliance evaluation.')
                  : (currentLang === 'mr' ? 'इतर याद्या तपासण्यासाठी वरील टॅब वापरा किंवा नागरिक कक्षात नवीन अर्ज अपलोड करा.' : 'Switch tabs above or return to the citizen desk to verify an application.')
              ),
              h('div', { className: 'flex justify-center gap-3 pt-2' },
                officerQueueTab !== 'ACTIVE' && h('button', {
                  onClick: () => {
                    setOfficerQueueTab('ACTIVE');
                    if (activeQueue.length > 0) setSelectedCaseId(activeQueue[0].id);
                  },
                  className: 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700'
                }, currentLang === 'mr' ? 'सक्रिय छाननी यादी पहा' : 'View Active Scrutiny Queue'),
                h('button', {
                  onClick: () => handleRoleSwitch('USER'),
                  className: 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 cursor-pointer hover:bg-slate-200'
                }, currentLang === 'mr' ? 'नागरिक कक्षात जाऊन दस्तऐवज जोडा' : 'Switch to Citizen Desk to Upload Document')
              )
            )
          : officerSelectedCase && h('div', { className: 'grid grid-cols-1 md:grid-cols-12 gap-6' },
          // Left: Queue Tabs & Selector & Zoomable Scanned Artifact (4 cols)
          h('div', { className: 'md:col-span-4 space-y-4' },
            // Queue Tabs & Selector Box
            h('div', { className: 'bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
              // Tabs
              h('div', { className: 'flex items-center gap-1 bg-slate-100 p-1 rounded-2xl mb-3 text-[11px] font-bold' },
                [
                  { id: 'ACTIVE', label: `Active (${activeQueue.length})` },
                  { id: 'FORWARDED', label: `Approved (${forwardedQueue.length})` },
                  { id: 'RETURNED', label: `Returned (${returnedQueue.length})` },
                  { id: 'HISTORY', label: `History (${cases.length})` }
                ].map((t) =>
                  h('button', {
                    key: t.id,
                    onClick: () => setOfficerQueueTab(t.id),
                    className: `flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer ${
                      officerQueueTab === t.id
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`
                  }, t.label)
                )
              ),

              // Queue List
              h('div', { className: 'space-y-2 max-h-72 overflow-y-auto' },
                displayedQueue.length === 0
                  ? h('div', { className: 'text-center py-8 text-slate-400 text-xs' }, 'No cases in this queue tab.')
                  : displayedQueue.map((c) =>
                      h('div', {
                        key: c.id,
                        onClick: () => setSelectedCaseId(c.id),
                        className: `w-full text-left p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                          officerSelectedCase.id === c.id
                            ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`
                      },
                        h('div', { className: 'flex justify-between items-center mb-1' },
                          h('span', { className: 'font-mono font-bold' }, c.caseNumber),
                          h('span', {
                            className: `text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'FORWARDED_TO_ADMIN'
                                ? 'bg-indigo-100 text-indigo-800'
                                : c.status === 'RETURNED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`
                          }, c.status)
                        ),
                        h('div', { className: 'text-[11px] text-slate-600 font-medium' }, `${c.applicantName} - ${c.scheme}`),

                        // Quick Note if Returned
                        c.status === 'RETURNED' && c.returnRecord &&
                          h('div', { className: 'mt-1 text-[10px] text-rose-700 truncate font-normal' },
                            `Reason: ${c.returnRecord.returnReason}`
                          ),

                        // Quick Action Buttons on Active Card Itself
                        officerQueueTab === 'ACTIVE' &&
                          h('div', { className: 'mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-end gap-1.5' },
                            h('button', {
                              disabled: loading,
                              onClick: (e) => {
                                e.stopPropagation();
                                setReturnModalTarget(c);
                                setShowReturnModal(true);
                              },
                              className: 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer'
                            }, 'Return'),
                            h('button', {
                              disabled: loading,
                              onClick: (e) => {
                                e.stopPropagation();
                                handleOfficerAction('APPROVE', c.id);
                              },
                              className: 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer'
                            }, 'Approve')
                          )
                      )
                    )
              )
            ),

            // Zoomable Scanned Certificate Artifact
            h('div', { className: 'bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 space-y-3' },
              h('div', { className: 'flex justify-between items-center border-b border-slate-100 pb-2' },
                h('span', { className: 'text-xs font-bold text-slate-800' }, 'Scanned Certificate Scan'),
                h('button', {
                  onClick: () => setIsDocumentZoomed(!isDocumentZoomed),
                  className: 'text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-indigo-700 cursor-pointer'
                }, isDocumentZoomed ? 'Zoom 100%' : 'Zoom 150%')
              ),
              h('div', {
                className: `p-5 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3 transition-all ${
                  isDocumentZoomed ? 'scale-105 shadow-md bg-white' : ''
                }`
              },
                h('div', { className: 'w-10 h-10 mx-auto rounded-full bg-slate-200 text-slate-600 flex items-center justify-center' },
                  h(SvgIcon, { name: 'ShieldCheck', className: 'w-6 h-6' })
                ),
                h('div', { className: 'text-xs font-extrabold uppercase text-slate-800' }, 'Government of Maharashtra'),
                h('div', { className: 'text-[11px] font-bold text-indigo-900' }, officerSelectedCase.scheme),
                h('div', { className: 'text-[11px] text-slate-700 font-semibold' }, `Applicant: ${officerSelectedCase.applicantName}`),
                h('div', { className: 'text-[10px] font-mono text-slate-500' }, `UID: ${officerSelectedCase.applicantId}`),
                h('div', { className: 'text-[10px] font-mono text-indigo-600 pt-1' },
                  `Attached Scan: ${officerSelectedCase.extractedFields?.uploadedFileName?.value || 'scan.pdf'}`
                ),
                h('div', { className: 'mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px]' },
                  h('span', { className: 'text-emerald-700 font-bold' }, 'Official Seal Authenticated'),
                  h('span', { className: 'text-slate-500 font-mono' }, 'e-Sign Verified')
                )
              )
            )
          ),

          // Center & Right: Separated OCR Entities & Dynamic DMN Norms (8 cols)
          h('div', { className: 'md:col-span-8 space-y-6' },
            // Cleanly Separated OCR Fields
            h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
              h('div', { className: 'flex justify-between items-center border-b border-slate-100 pb-3 mb-4' },
                h('div', null,
                  h('h3', { className: 'text-sm font-bold text-slate-900' }, 'AI Optical Extraction (Cleanly Separated Key-Values)'),
                  h('p', { className: 'text-xs text-slate-500 font-mono mt-0.5' }, `Dossier #${officerSelectedCase.caseNumber} - ${officerSelectedCase.applicantName}`)
                ),
                h('span', { className: 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800' },
                  'OCR Confidence >99%'
                )
              ),
              h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs' },
                officerSelectedCase.extractedFields && Object.entries(officerSelectedCase.extractedFields).map(([key, field]) =>
                  h('div', { key, className: 'p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center' },
                    h('div', null,
                      h('span', { className: 'text-[10px] text-slate-400 block font-mono font-medium' }, field.label || key),
                      h('strong', { className: 'text-slate-900 text-xs' }, String(field.value))
                    ),
                    h('span', { className: 'text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full' },
                      `${(field.confidence * 100).toFixed(0)}%`
                    )
                  )
                )
              )
            ),

            // Dynamic DMN Statutory Gazette Norms
            h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
              h('div', { className: 'flex justify-between items-center border-b border-slate-100 pb-3 mb-4' },
                h('div', null,
                  h('h3', { className: 'text-sm font-bold text-slate-900' }, 'Dynamic DMN Gazette Norms Evaluation'),
                  h('p', { className: 'text-xs text-slate-500' }, 'Rules dynamically adapted for this specific government document')
                ),
                h('span', {
                  className: `px-3 py-1 text-xs font-bold rounded-full ${
                    officerSelectedCase.verificationResults?.aiSummary?.status === 'CLEAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`
                },
                  officerSelectedCase.verificationResults?.aiSummary?.status === 'CLEAN' ? 'AI AUDIT: 100% SATISFIED' : 'AI AUDIT: CRITERIA VIOLATION'
                )
              ),

              // Seals & Signatures
              h('div', { className: 'grid grid-cols-2 gap-3 mb-4 text-xs' },
                h('div', { className: 'p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2.5' },
                  h(SvgIcon, { name: 'ShieldCheck', className: 'w-5 h-5 text-emerald-600 flex-shrink-0' }),
                  h('div', null,
                    h('strong', { className: 'block font-bold' }, 'Official Seal Authenticity'),
                    h('span', { className: 'text-[11px]' }, officerSelectedCase.verificationResults?.sealAuthenticity?.details || 'State Gazette Seal Valid')
                  )
                ),
                h('div', { className: 'p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2.5' },
                  h(SvgIcon, { name: 'CheckCircle2', className: 'w-5 h-5 text-emerald-600 flex-shrink-0' }),
                  h('div', null,
                    h('strong', { className: 'block font-bold' }, 'Digital Signature Integrity'),
                    h('span', { className: 'text-[11px]' }, officerSelectedCase.verificationResults?.signatureAuthenticity?.details || 'SHA-256 e-Sign Valid')
                  )
                )
              ),

              // Dynamic Norms Checklist
              h('div', { className: 'space-y-2.5' },
                officerSelectedCase.verificationResults?.normsEvaluation?.map((norm, idx) =>
                  h('div', {
                    key: idx,
                    className: `p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                      norm.status === 'SATISFIED'
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`
                  },
                    h(SvgIcon, {
                      name: norm.status === 'SATISFIED' ? 'CheckCircle2' : 'AlertTriangle',
                      className: `w-4 h-4 mt-0.5 flex-shrink-0 ${
                        norm.status === 'SATISFIED' ? 'text-emerald-600' : 'text-rose-600'
                      }`
                    }),
                    h('div', { className: 'flex-1' },
                      h('div', { className: 'font-bold' }, norm.norm),
                      h('div', { className: 'text-[11px] text-slate-500 mt-0.5' }, `Proof Record: ${norm.proof}`)
                    ),
                    h('span', {
                      className: `px-2 py-0.5 rounded text-[10px] font-bold ${
                        norm.status === 'SATISFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`
                    }, norm.status)
                  )
                )
              )
            ),

            // If Case was previously returned, show the return record proof here
            officerSelectedCase.status === 'RETURNED' && officerSelectedCase.returnRecord &&
              h('div', { className: 'bg-rose-50 p-5 rounded-3xl border border-rose-200 text-xs text-rose-950 space-y-2' },
                h('div', { className: 'font-bold text-rose-900 text-sm flex items-center gap-2' },
                  h(SvgIcon, { name: 'AlertTriangle', className: 'w-4 h-4 text-rose-600' }),
                  'Recorded Statutory Rejection & Return Record'
                ),
                h('div', null,
                  h('span', { className: 'font-semibold text-rose-800' }, 'Discrepancy: '),
                  officerSelectedCase.returnRecord.returnReason
                ),
                h('div', null,
                  h('span', { className: 'font-semibold text-rose-800' }, 'Statutory Proof: '),
                  officerSelectedCase.returnRecord.statutoryViolationProof
                ),
                h('div', null,
                  h('span', { className: 'font-semibold text-rose-800' }, 'Remedial Instructions: '),
                  officerSelectedCase.returnRecord.remedialInstructions
                )
              ),

            // Tehsildar Action Bar (Directly bound to officerSelectedCase)
            h('div', { className: 'bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 flex flex-wrap items-center justify-between gap-3' },
              h('div', { className: 'flex items-center gap-3' },
                h('span', { className: 'text-xs text-slate-500 font-semibold' }, 'Dossier Status:'),
                h('span', {
                  className: `px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    officerSelectedCase.status === 'UNDER_SCRUTINY'
                      ? 'bg-amber-100 text-amber-800'
                      : officerSelectedCase.status === 'FORWARDED_TO_ADMIN'
                      ? 'bg-indigo-100 text-indigo-800'
                      : officerSelectedCase.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`
                }, officerSelectedCase.status)
              ),

              h('div', { className: 'flex flex-wrap items-center gap-2.5' },
                // 1. ACTIVE SCRUTINY: Return with Proof & Approve and Forward
                officerSelectedCase.status === 'UNDER_SCRUTINY' && [
                  h('button', {
                    key: 'btn-return',
                    disabled: loading,
                    onClick: () => {
                      setReturnModalTarget(officerSelectedCase);
                      setShowReturnModal(true);
                    },
                    className: 'px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  },
                    h(SvgIcon, { name: 'AlertTriangle', className: 'w-4 h-4' }),
                    t('btnReturnWithProof')
                  ),
                  h('button', {
                    key: 'btn-approve',
                    disabled: loading,
                    onClick: () => handleOfficerAction('APPROVE', officerSelectedCase.id),
                    className: 'px-6 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                  },
                    h(SvgIcon, { name: 'Check', className: 'w-4 h-4' }),
                    loading ? (currentLang === 'mr' ? 'अग्रेषित होत आहे...' : 'Forwarding...') : t('btnApproveForward')
                  )
                ],

                // 2. FORWARDED TO ADMIN: Direct action to switch to Admin Desk OR execute final seal immediately!
                officerSelectedCase.status === 'FORWARDED_TO_ADMIN' && [
                  h('button', {
                    key: 'btn-reforward',
                    disabled: loading,
                    onClick: () => handleOfficerAction('APPROVE', officerSelectedCase.id),
                    className: 'px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer'
                  }, currentLang === 'mr' ? 'पुन्हा शिफारस पाठवा' : 'Re-send Endorsement'),
                  h('button', {
                    key: 'btn-switch-admin',
                    onClick: () => {
                      setSelectedCaseId(officerSelectedCase.id);
                      handleRoleSwitch('ADMIN');
                    },
                    className: 'px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer'
                  },
                    h(SvgIcon, { name: 'ShieldCheck', className: 'w-4 h-4' }),
                    currentLang === 'mr' ? 'जिल्हाधिकारी पटल उघडा ->' : currentLang === 'hi' ? 'जिला मजिस्ट्रेट पटल खोलें ->' : 'Switch to Root Admin Desk ->'
                  ),
                  h('button', {
                    key: 'btn-direct-final-seal',
                    disabled: loading,
                    onClick: () => handleAdminAction('FINAL_APPROVE', officerSelectedCase.id),
                    className: 'px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer'
                  },
                    h(SvgIcon, { name: 'ShieldCheck', className: 'w-4 h-4' }),
                    loading ? t('sealingInProgress') : t('btnExecuteFinalSeal')
                  )
                ],

                // 3. RETURNED: Option to clear discrepancy and forward to admin
                officerSelectedCase.status === 'RETURNED' && [
                  h('button', {
                    key: 'btn-clear-return',
                    disabled: loading,
                    onClick: () => handleOfficerAction('APPROVE', officerSelectedCase.id),
                    className: 'px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer'
                  },
                    h(SvgIcon, { name: 'Check', className: 'w-4 h-4' }),
                    currentLang === 'mr' ? 'त्रुटी निरसन करून अग्रेषित करा' : 'Clear Discrepancy & Forward to Admin'
                  )
                ],

                // 4. APPROVED: View certificate
                officerSelectedCase.status === 'APPROVED' && [
                  h('button', {
                    key: 'btn-view-cert',
                    onClick: () => handleOpenCertificate(officerSelectedCase),
                    className: 'px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all cursor-pointer'
                  },
                    h(SvgIcon, { name: 'ShieldCheck', className: 'w-4 h-4' }),
                    currentLang === 'mr' ? 'डिजिटल स्वाक्षरीत प्रमाणपत्र पहा' : 'View Sealed Certificate'
                  )
                ]
              )
            )
          )
        )
      );
    };

    // -------------------------------------------------------------
    // RENDER ROLE 3: ROOT ADMINISTRATOR PORTAL
    // -------------------------------------------------------------
    const renderAdminPortal = () => {
      const pendingAdminCases = cases.filter((c) => c.status === 'FORWARDED_TO_ADMIN');
      const allApprovedCases = cases.filter((c) => c.status === 'APPROVED');

      return h('div', { className: 'space-y-6' },
        // Executive Banner
        h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 flex flex-wrap items-center justify-between gap-4' },
          h('div', null,
            h('div', { className: 'text-xs font-bold uppercase text-indigo-700' },
              currentLang === 'mr' ? 'जिल्हाधिकारी कार्यालय कार्यकारी कक्ष' : currentLang === 'hi' ? 'जिला मजिस्ट्रेट कार्यालय कार्यकारी पटल' : 'District Collectorate Executive Chamber'
            ),
            h('h2', { className: 'text-xl font-extrabold text-slate-900 tracking-tight' }, t('adminTitle')),
            h('p', { className: 'text-xs text-slate-500' }, t('adminSubtitle'))
          ),
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold' },
              currentLang === 'mr' ? `अंतिम मुद्रेची प्रतीक्षा: ${pendingAdminCases.length} प्रकरणे` : currentLang === 'hi' ? `अंतिम मुद्रा प्रतीक्षित: ${pendingAdminCases.length} प्रकरण` : `Awaiting Final Seal: ${pendingAdminCases.length} Dossiers`
            ),
            h('div', { className: 'px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold' },
              currentLang === 'mr' ? `जारी केलेली प्रमाणपत्रे: ${allApprovedCases.length} प्रकरणे` : currentLang === 'hi' ? `जारी प्रमाण पत्र: ${allApprovedCases.length} प्रकरण` : `Issued Certificates: ${allApprovedCases.length} Dossiers`
            )
          )
        ),

        // Cases Awaiting Final Approval Table
        h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
          h('div', { className: 'border-b border-slate-100 pb-3 mb-4' },
            h('h3', { className: 'text-base font-bold text-slate-900' }, t('adminQueueHeader')),
            h('p', { className: 'text-xs text-slate-500' },
              currentLang === 'mr' ? 'उपविभागीय तहसीलदारांनी तपासलेली व शिफारस केलेली प्रकरणे' : currentLang === 'hi' ? 'उप-संभागीय तहसीलदार द्वारा जांची एवं अनुशंसित प्रकरण' : 'Inspected and recommended by Sub-Divisional Tehsildar'
            )
          ),

          pendingAdminCases.length === 0
            ? h('div', { className: 'text-center py-12 text-slate-400 text-xs' },
                t('adminEmptyQueue')
              )
            : h('div', { className: 'space-y-4' },
                pendingAdminCases.map((c) =>
                  h('div', {
                    key: c.id,
                    className: 'p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4'
                  },
                    h('div', { className: 'space-y-1' },
                      h('div', { className: 'flex items-center gap-2' },
                        h('span', { className: 'text-xs font-mono font-bold text-indigo-700' }, c.caseNumber),
                        h('span', { className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800' },
                          (getDocMeta(c).name) || c.scheme
                        )
                      ),
                      h('div', { className: 'text-sm font-bold text-slate-900' }, c.applicantName),
                      h('div', { className: 'text-xs text-slate-500' },
                        `${currentLang === 'mr' ? 'तहसीलदार शेरा' : currentLang === 'hi' ? 'तहसीलदार टिप्पणी' : 'Tehsildar Endorsement'}: "${c.officerRemarks || (currentLang === 'mr' ? 'जारी करण्यासाठी शिफारस' : 'Recommended for issuance')}"`
                      ),
                      h('div', { className: 'pt-1 flex items-center gap-2 text-xs' },
                        h('span', { className: 'text-slate-400 text-[11px]' }, currentLang === 'mr' ? 'AI सारांश पडताळणी:' : 'AI Summary Check:'),
                        h('span', {
                          className: `px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            c.verificationResults?.aiSummary?.status === 'CLEAN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`
                        },
                          c.verificationResults?.aiSummary?.status === 'CLEAN'
                            ? (currentLang === 'mr' ? 'AI निष्कर्ष: नियमानुकूल (१००% पात्र)' : 'AI SUMMARY: CLEAN (100% COMPLIANT)')
                            : (currentLang === 'mr' ? 'AI निष्कर्ष: निकष त्रुटी' : 'AI SUMMARY: CRITERIA ERROR')
                        ),
                        h('span', { className: 'text-slate-400 text-[11px]' }, c.verificationResults?.aiSummary?.notes)
                      )
                    ),

                    h('div', { className: 'flex items-center gap-2' },
                      h('button', {
                        onClick: () => {
                          setSelectedCaseId(c.id);
                          setOfficerQueueTab('FORWARDED');
                          setCurrentRole('OFFICER');
                        },
                        className: 'px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer'
                      }, currentLang === 'mr' ? 'छाननी तपासा' : currentLang === 'hi' ? 'जांच देखें' : 'Inspect Scrutiny'),
                      h('button', {
                        disabled: loading,
                        onClick: (e) => {
                          e.stopPropagation();
                          handleAdminAction('FINAL_APPROVE', c.id);
                        },
                        className: 'px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer'
                      },
                        h(SvgIcon, { name: 'ShieldCheck', className: 'w-4 h-4' }),
                        loading ? t('sealingInProgress') : t('btnExecuteFinalSeal')
                      )
                    )
                  )
                )
              )
        ),

        // Issued Certificates Archive
        h('div', { className: 'bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5' },
          h('div', { className: 'border-b border-slate-100 pb-3 mb-4' },
            h('h3', { className: 'text-base font-bold text-slate-900' }, 'Authorized & Digitally Issued Government Certificates Archive'),
            h('p', { className: 'text-xs text-slate-500' }, 'Immutable record of issued certificates signed with digital magistrate seal')
          ),
          h('div', { className: 'overflow-x-auto' },
            h('table', { className: 'w-full text-left border-collapse text-xs' },
              h('thead', { className: 'bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200' },
                h('tr', null,
                  h('th', { className: 'p-3' }, 'Certificate Serial'),
                  h('th', { className: 'p-3' }, 'Document Title'),
                  h('th', { className: 'p-3' }, 'Applicant'),
                  h('th', { className: 'p-3' }, 'Issue Date'),
                  h('th', { className: 'p-3' }, 'Sanctioning Authority'),
                  h('th', { className: 'p-3 text-right' }, 'Action')
                )
              ),
              h('tbody', { className: 'divide-y divide-slate-100 font-medium text-slate-800' },
                allApprovedCases.map((c) =>
                  h('tr', { key: c.id, className: 'hover:bg-slate-50 transition-colors' },
                    h('td', { className: 'p-3 font-mono font-bold text-emerald-700' }, c.certificate?.certificateNumber || `MH-REV-2026-${c.id.split('-').pop()}`),
                    h('td', { className: 'p-3 font-semibold' }, c.scheme),
                    h('td', { className: 'p-3' }, c.applicantName),
                    h('td', { className: 'p-3 font-mono text-slate-500' }, c.certificate?.issueDate || '2026-02-18'),
                    h('td', { className: 'p-3' }, c.certificate?.sanctioningAuthority || 'District Magistrate & Collector, Pune'),
                    h('td', { className: 'p-3 text-right' },
                      h('button', {
                        onClick: () => handleOpenCertificate(c),
                        className: 'px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-all cursor-pointer'
                      },
                        h(SvgIcon, { name: 'Download', className: 'w-3.5 h-3.5' }),
                        'View & Print'
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
    };

    // -------------------------------------------------------------
    // MAIN APP LAYOUT
    // -------------------------------------------------------------
    return h('div', { className: 'min-h-screen bg-slate-50 flex flex-col font-sans' },
      // Toast Banner
      toast && h('div', {
        id: 'toast-container',
        className: `fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-300 text-rose-800'
            : toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-indigo-50 border-indigo-300 text-indigo-800'
        }`
      },
        h(SvgIcon, {
          name: toast.type === 'error' ? 'AlertTriangle' : toast.type === 'success' ? 'CheckCircle2' : 'Activity',
          className: 'w-5 h-5 flex-shrink-0'
        }),
        h('span', { className: 'text-sm font-semibold' }, toast.message)
      ),

      // Top Modern Navigation Header with 3 Dedicated Role Tabs & Multi-Lingual Switcher
      h('header', { className: 'bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/95 shadow-sm' },
        h('div', { className: 'max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3' },
          // Brand (Institutional Government of Maharashtra Identity)
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 flex-shrink-0' },
              h(SvgIcon, { name: 'ShieldCheck', className: 'w-6 h-6' })
            ),
            h('div', null,
              h('div', { className: 'flex items-center gap-2' },
                h('h1', { className: 'text-base font-extrabold text-slate-900 tracking-tight' },
                  currentLang === 'mr' ? 'महाशासन SG-DIVP सार्वभौम प्रणाली' : currentLang === 'hi' ? 'महाशासन SG-DIVP संप्रभु प्रणाली' : 'MahaGov SG-DIVP Sovereign Platform'
                ),
                h('span', { className: 'px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wide' },
                  currentLang === 'mr' ? 'ई-प्रशासन' : currentLang === 'hi' ? 'ई-प्रशासन' : 'State e-Governance'
                )
              ),
              h('p', { className: 'text-xs text-slate-500 font-medium' },
                currentLang === 'mr' ? 'महाराष्ट्र शासन • सार्वभौम दस्तऐवज पडताळणी व बुद्धिमत्ता प्रणाली' : currentLang === 'hi' ? 'महाराष्ट्र शासन • संप्रभु दस्तावेज़ सत्यापन एवं आसूचना प्रणाली' : 'Government of Maharashtra - Sovereign Document Intelligence & Verification System'
              )
            )
          ),

          // Controls & Navigation
          h('div', { className: 'flex flex-wrap items-center gap-3' },
            // Regional Language Switcher Pill (EN / मराठी / हिन्दी)
            h('div', { className: 'flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner' },
              h('div', { className: 'flex items-center gap-1 pl-2 pr-1 text-slate-500 font-bold text-xs' },
                h(SvgIcon, { name: 'Globe', className: 'w-3.5 h-3.5 text-indigo-600' }),
                h('span', { className: 'hidden md:inline text-[11px] text-slate-600 mr-1' }, t('languageLabel'))
              ),
              [
                { code: 'en', label: 'English' },
                { code: 'mr', label: 'मराठी' },
                { code: 'hi', label: 'हिन्दी' }
              ].map((l) =>
                h('button', {
                  key: l.code,
                  onClick: () => changeLanguage(l.code),
                  className: `px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    currentLang === l.code
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`
                }, l.label)
              )
            ),

            // 3-Role Route Selector Tabs (SaaS Switcher)
            h('div', { className: 'flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200' },
              [
                { id: 'USER', label: t('roleUser'), icon: 'User' },
                { id: 'OFFICER', label: t('roleOfficer'), icon: 'FileSearch' },
                { id: 'ADMIN', label: t('roleAdmin'), icon: 'ShieldCheck' }
              ].map((tab) =>
                h('button', {
                  key: tab.id,
                  onClick: () => handleRoleSwitch(tab.id),
                  className: `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentRole === tab.id
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                },
                  h(SvgIcon, { name: tab.icon, className: 'w-4 h-4' }),
                  tab.label
                )
              )
            ),

            // Sovereign Session Identity Badge (SEC-CRIT-03)
            h('div', { className: 'hidden xl:flex items-center gap-2' },
              h('div', { className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200' },
                h('span', { className: `w-2 h-2 rounded-full ${authStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse` }),
                currentRole === 'USER' && (currentLang === 'mr' ? 'नागरिक अर्जदार' : currentLang === 'hi' ? 'नागरिक आवेदक' : 'Citizen Applicant'),
                currentRole === 'OFFICER' && (currentLang === 'mr' ? 'डॉ. आनंद कुलकर्णी (तहसीलदार)' : currentLang === 'hi' ? 'डॉ. आनंद कुलकर्णी (तहसीलदार)' : 'Dr. Anand K. Kulkarni (Tehsildar)'),
                currentRole === 'ADMIN' && (currentLang === 'mr' ? 'मुख्य जिल्हा प्रशासक' : currentLang === 'hi' ? 'मुख्य जिला प्रशासक' : 'Chief District Administrator')
              ),
              h('span', { className: 'text-[10px] font-mono px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold tracking-tight' },
                'HMAC-SHA256'
              )
            )
          )
        )
      ),

      // Main Portal Body
      h('main', { className: 'max-w-7xl mx-auto px-4 py-6 flex-1 w-full' },
        currentRole === 'USER' && renderCitizenPortal(),
        currentRole === 'OFFICER' && renderOfficerPortal(),
        currentRole === 'ADMIN' && renderAdminPortal()
      ),

      // -------------------------------------------------------------
      // MODAL 2: OFFICER RETURN WITH PROOF MODAL (TEHSILDAR ONLY)
      // -------------------------------------------------------------
      currentRole === 'OFFICER' && showReturnModal && (returnModalTarget || selectedCase) && h('div', { className: 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4' },
        h('div', { className: 'bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden space-y-4' },
          h('div', { className: 'flex justify-between items-center border-b border-slate-100 pb-3' },
            h('div', null,
              h('span', { className: 'text-[10px] font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded' }, 'Statutory Rejection / Return Record'),
              h('h3', { className: 'text-base font-bold text-slate-900 mt-1' },
                `Return Case #${(returnModalTarget || selectedCase).caseNumber} to Citizen`
              )
            ),
            h('button', {
              onClick: () => {
                setShowReturnModal(false);
                setReturnModalTarget(null);
              },
              className: 'w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer'
            }, 'x')
          ),

          // Quick Presets Dropdown
          h('div', { className: 'text-xs' },
            h('label', { className: 'block font-semibold text-slate-700 mb-1' }, 'Select Quick Statutory Discrepancy Preset:'),
            h('select', {
              onChange: (e) => {
                const idx = Number(e.target.value);
                const preset = STATUTORY_RETURN_PRESETS[idx];
                if (preset) {
                  setReturnForm({
                    returnReason: preset.reason,
                    returnProof: preset.proof,
                    remedialInstructions: preset.instructions
                  });
                }
              },
              className: 'w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium'
            },
              STATUTORY_RETURN_PRESETS.map((p, i) =>
                h('option', { key: i, value: i }, p.label)
              )
            )
          ),

          h('div', { className: 'space-y-3 text-xs' },
            h('div', null,
              h('label', { className: 'block font-semibold text-slate-700 mb-1' }, 'Primary Discrepancy Reason:'),
              h('input', {
                type: 'text',
                value: returnForm.returnReason,
                onChange: (e) => setReturnForm({ ...returnForm, returnReason: e.target.value }),
                className: 'w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500'
              })
            ),

            h('div', null,
              h('label', { className: 'block font-semibold text-slate-700 mb-1' }, 'Statutory Violation Proof & Gazette Clause:'),
              h('textarea', {
                rows: 3,
                value: returnForm.returnProof,
                onChange: (e) => setReturnForm({ ...returnForm, returnProof: e.target.value }),
                className: 'w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500'
              })
            ),

            h('div', null,
              h('label', { className: 'block font-semibold text-slate-700 mb-1' }, 'Remedial Instructions for Citizen:'),
              h('textarea', {
                rows: 2,
                value: returnForm.remedialInstructions,
                onChange: (e) => setReturnForm({ ...returnForm, remedialInstructions: e.target.value }),
                className: 'w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500'
              })
            )
          ),

          h('div', { className: 'flex justify-end gap-2 pt-3 border-t border-slate-100' },
            h('button', {
              onClick: () => {
                setShowReturnModal(false);
                setReturnModalTarget(null);
              },
              className: 'px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer'
            }, 'Cancel'),
            h('button', {
              disabled: loading,
              onClick: () => handleOfficerAction('RETURN', (returnModalTarget || selectedCase).id),
              className: 'px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 transition-all cursor-pointer'
            }, 'Record Return & Notify Citizen')
          )
        )
      ),

      // -------------------------------------------------------------
      // MODAL 3: CITIZEN VIEWING RETURN REASON & PROOF
      // -------------------------------------------------------------
      showReturnReasonModal && h('div', { className: 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4' },
        h('div', { className: 'bg-white w-full max-w-xl rounded-3xl border border-rose-200 shadow-2xl p-6 overflow-hidden space-y-4' },
          h('div', { className: 'flex justify-between items-center border-b border-rose-100 pb-3' },
            h('div', { className: 'flex items-center gap-2' },
              h('div', { className: 'w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0' },
                h(SvgIcon, { name: 'AlertTriangle', className: 'w-5 h-5' })
              ),
              h('div', null,
                h('h3', { className: 'text-sm font-bold text-slate-900' }, 'Application Returned with Discrepancy Record'),
                h('p', { className: 'text-[11px] text-slate-500 font-mono' }, `Case #${showReturnReasonModal.caseNumber}`)
              )
            ),
            h('button', {
              onClick: () => setShowReturnReasonModal(null),
              className: 'w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer'
            }, 'x')
          ),

          h('div', { className: 'p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-3' },
            h('div', null,
              h('span', { className: 'text-rose-600 font-bold block text-[10px] uppercase tracking-wider' }, 'Returned By:'),
              h('strong', { className: 'text-slate-900' }, showReturnReasonModal.returnRecord?.returnedByOfficer || 'Tehsildar Scrutiny Officer')
            ),
            h('div', null,
              h('span', { className: 'text-rose-600 font-bold block text-[10px] uppercase tracking-wider' }, 'Primary Discrepancy:'),
              h('strong', { className: 'text-slate-900' }, showReturnReasonModal.returnRecord?.returnReason || 'Statutory criteria not met.')
            ),
            h('div', null,
              h('span', { className: 'text-rose-600 font-bold block text-[10px] uppercase tracking-wider' }, 'Statutory Violation Proof:'),
              h('p', { className: 'mt-1 leading-relaxed whitespace-pre-line text-slate-800' },
                showReturnReasonModal.returnRecord?.statutoryViolationProof || 'Inspection revealed non-compliance with gazette limits.'
              )
            ),
            h('div', { className: 'p-3 rounded-xl bg-white border border-rose-200' },
              h('span', { className: 'text-slate-500 font-bold block text-[10px] uppercase tracking-wider' }, 'Remedial Instructions:'),
              h('p', { className: 'text-slate-700 mt-0.5' },
                showReturnReasonModal.returnRecord?.remedialInstructions || 'Please upload updated document.'
              )
            )
          ),

          h('div', { className: 'flex justify-end' },
            h('button', {
              onClick: () => setShowReturnReasonModal(null),
              className: 'px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer'
            }, 'Close')
          )
        )
      ),

      // -------------------------------------------------------------
      // MODAL 4: OFFICIAL CERTIFICATE PRINT VIEW
      // -------------------------------------------------------------
      showCertificateModal && h('div', { className: 'fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 print-certificate-container' },
        h('div', { className: 'bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden space-y-4 print-card-body' },
          // Header (no-print)
          h('div', { className: 'flex justify-between items-center border-b border-slate-100 pb-3 no-print' },
            h('div', { className: 'flex items-center gap-2' },
              h('div', { className: 'w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center' },
                h(SvgIcon, { name: 'ShieldCheck', className: 'w-5 h-5' })
              ),
              h('h3', { className: 'text-sm font-bold text-slate-900' }, 'Official Government Certificate (Digitally Sealed)')
            ),
            h('button', {
              onClick: () => setShowCertificateModal(null),
              className: 'w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer'
            }, 'x')
          ),

          // Certificate Body
          h('div', { className: 'p-6 rounded-2xl border-2 border-indigo-600/30 bg-slate-50/60 space-y-4' },
            h('div', { className: 'text-center border-b border-slate-200 pb-4' },
              h('div', { className: 'w-10 h-10 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-700 mb-2' },
                h(SvgIcon, { name: 'ShieldCheck', className: 'w-6 h-6' })
              ),
              h('div', { className: 'text-xs font-extrabold uppercase text-slate-800 tracking-wider' }, 'Government of Maharashtra'),
              h('div', { className: 'text-base font-extrabold text-indigo-950 mt-1 uppercase tracking-tight' }, showCertificateModal.scheme),
              h('div', { className: 'text-xs text-slate-600 font-mono mt-1 font-bold' },
                `Certificate Serial No: ${showCertificateModal.certificate?.certificateNumber || 'MH-REV-2026-AUTH'}`
              )
            ),

            h('div', { className: 'text-xs text-slate-800 space-y-2' },
              h('p', null,
                'This is to officially certify that ',
                h('strong', null, showCertificateModal.applicantName),
                `, resident of `,
                h('strong', null, showCertificateModal.subDivision),
                `, bearing UID `,
                h('strong', { className: 'font-mono' }, showCertificateModal.applicantId),
                `, has fulfilled all statutory verification criteria.`
              ),
              h('p', { className: 'text-slate-600 text-[11px]' },
                showCertificateModal.certificate?.statutoryClause || 'Issued under the authority of Maharashtra Government Gazette regulations and Section 65B Indian Evidence Act.'
              )
            ),

            // Seal & QR Verification
            h('div', { className: 'flex justify-between items-center border-t border-slate-200 pt-4' },
              h('div', { className: 'flex items-center gap-3' },
                h('div', { className: 'w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center' },
                  h(SvgIcon, { name: 'QrCode', className: 'w-10 h-10' })
                ),
                h('div', null,
                  h('div', { className: 'text-xs font-bold text-slate-900' }, 'Digital Gazette Seal'),
                  h('div', { className: 'text-[10px] font-mono text-slate-500 max-w-[200px] truncate' },
                    showCertificateModal.certificate?.qrSeal || `SG-DIVP://VERIFY/${showCertificateModal.id}`
                  ),
                  h('div', { className: 'text-[10px] font-bold text-emerald-700 mt-0.5' },
                    'Section 65B Indian Evidence Act Certified'
                  )
                )
              ),
              h('div', { className: 'text-right text-xs' },
                h('div', { className: 'text-[10px] text-slate-400' }, 'Digitally Signed by:'),
                h('strong', { className: 'text-slate-900 block' }, showCertificateModal.certificate?.issuingOfficer || 'Dr. Anand K. Kulkarni, Tehsildar & Executive Magistrate'),
                h('div', { className: 'text-[10px] text-slate-500' }, showCertificateModal.certificate?.sanctioningAuthority || 'District Magistrate & Collector, Pune'),
                h('span', { className: 'text-[10px] text-slate-400 font-mono' }, `Date: ${showCertificateModal.certificate?.issueDate || '2026-02-18'}`)
              )
            )
          ),

          // Modal Actions (no-print)
          h('div', { className: 'flex flex-wrap justify-end gap-3 no-print' },
            h('button', {
              onClick: () => setShowCertificateModal(null),
              className: 'px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer'
            }, 'Close'),
            h('button', {
              onClick: () => openPrintableWindow(showCertificateModal),
              className: 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer'
            },
              h(SvgIcon, { name: 'ExternalLink', className: 'w-4 h-4' }),
              'Open Dedicated Printable Window'
            ),
            h('button', {
              onClick: () => window.print(),
              className: 'px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/10 transition-all cursor-pointer'
            },
              h(SvgIcon, { name: 'Download', className: 'w-4 h-4' }),
              'Print via Browser (PDF)'
            )
          )
        )
      ),

      // -------------------------------------------------------------
      // MODAL 4: STATUTORY PRIVILEGED DESK AUTHENTICATION (AUD-CRIT-04)
      // -------------------------------------------------------------
      deskAuthModal && h('div', { className: 'fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4' },
        h('div', { className: 'bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200' },
          h('div', { className: 'flex items-center gap-3 border-b border-slate-100 pb-4' },
            h('div', { className: 'w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-sm shrink-0' },
              h(SvgIcon, { name: 'ShieldCheck', className: 'w-6 h-6' })
            ),
            h('div', { className: 'flex-1 min-w-0' },
              h('div', { className: 'text-[10px] font-mono font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mb-1' },
                'Sovereign Access Control'
              ),
              h('h3', { className: 'text-base font-bold text-slate-900 truncate' },
                deskAuthModal.title
              )
            )
          ),

          h('div', { className: 'bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1' },
            h('div', { className: 'text-xs font-bold text-slate-800' }, deskAuthModal.roleLabel),
            h('div', { className: 'text-[11px] text-slate-500' }, deskAuthModal.department),
            h('div', { className: 'text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/60 rounded-lg p-2 mt-2 flex items-center gap-2' },
              h(SvgIcon, { name: 'Lock', className: 'w-3.5 h-3.5 shrink-0' }),
              'Statutory PIN required to mint signed HMAC-SHA256 executive credentials (AUD-CRIT-04).'
            )
          ),

          deskAuthModal.error && h('div', { className: 'bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3 flex items-center gap-2' },
            h(SvgIcon, { name: 'AlertCircle', className: 'w-4 h-4 shrink-0' }),
            deskAuthModal.error
          ),

          h('form', { onSubmit: handleDeskLogin, className: 'space-y-4' },
            h('div', { className: 'space-y-1.5' },
              h('label', { className: 'block text-xs font-bold text-slate-700' },
                currentLang === 'mr' ? 'शासकीय सुरक्षा पिन प्रविष्ट करा' : 'Statutory Security PIN'
              ),
              h('input', {
                type: 'password',
                value: deskAuthModal.pin,
                onChange: (e) => setDeskAuthModal({ ...deskAuthModal, pin: e.target.value }),
                placeholder: 'Enter PIN',
                maxLength: 6,
                autoFocus: true,
                className: 'w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }),
              h('div', { className: 'flex justify-between items-center text-[11px] text-slate-400 pt-1' },
                h('span', null, 'Official Demo PIN:'),
                h('button', {
                  type: 'button',
                  onClick: () => setDeskAuthModal({ ...deskAuthModal, pin: deskAuthModal.role === 'tehsildar' ? '7788' : '9900' }),
                  className: 'text-indigo-600 font-bold hover:underline cursor-pointer'
                }, deskAuthModal.role === 'tehsildar' ? 'Fill Tehsildar PIN (7788)' : 'Fill Admin PIN (9900)')
              )
            ),

            h('div', { className: 'flex justify-end gap-2.5 pt-2 border-t border-slate-100' },
              h('button', {
                type: 'button',
                onClick: () => setDeskAuthModal(null),
                className: 'px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer'
              }, currentLang === 'mr' ? 'रद्द करा' : 'Cancel'),
              h('button', {
                type: 'submit',
                disabled: deskAuthModal.loading,
                className: 'px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50'
              },
                h(SvgIcon, { name: 'Key', className: 'w-4 h-4' }),
                deskAuthModal.loading ? 'Verifying...' : (currentLang === 'mr' ? 'पटल उघडा' : 'Authorize Sovereign Session')
              )
            )
          )
        )
      )
    );
  }

  // Mount Application
  const root = window.ReactDOM.createRoot(document.getElementById('root'));
  root.render(h(App));
})();
