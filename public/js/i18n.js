/**
 * i18n.js - Multi-Lingual Translation & Regional Localization Engine
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Supports:
 * - English (en) - Sovereign Administrative Standard
 * - Marathi / मराठी (mr) - Official State Language of Maharashtra (Aaple Sarkar / MahaOnline Standard)
 * - Hindi / हिन्दी (hi) - National Administrative Standard
 * 
 * Strictly zero emojis. All UI elements utilize vector SVG icons.
 */

window.I18N = {
  en: {
    // Top Bar & Branding
    stateGov: "Government of Maharashtra",
    platformTitle: "Sovereign Document Intelligence & Verification Platform",
    platformSubtitle: "Air-Gapped Sovereign Node • Cryptographic WORM Ledger • DMN Gazette Verification",
    airgapNode: "Air-Gapped Sovereign Node",
    dpdpCompliant: "DPDP 2023 Compliant",
    verifiedNode: "Intranet Port 3000 Verified",

    // Role Selectors
    roleUser: "Citizen Portal",
    roleUserDesc: "Document Filing & Real-Time Tracking",
    roleOfficer: "Tehsildar Desk",
    roleOfficerDesc: "Statutory Scrutiny & Endorsement",
    roleAdmin: "Root Administrator",
    roleAdminDesc: "Cryptographic Seal & Final Issuance",

    // Citizen KPI Cards
    kpiUnderScrutiny: "In Government Scrutiny",
    kpiUnderScrutinySub: "Under Active Verification",
    kpiIssued: "Digitally Sealed & Issued",
    kpiIssuedSub: "Ready for Instant Printing",
    kpiReturned: "Returned with Proof",
    kpiReturnedSub: "Statutory Discrepancy Recorded",
    kpiView: "View ->",

    // Document Catalogue
    catalogueTitle: "Statutory Document Filing & Verification Catalogue",
    catalogueSubtitle: "Select an essential certificate to file an application. Non-custodial OCR extraction and statutory DMN gazette rules execute instantly.",
    searchPlaceholder: "Search by document name, department, or gazette keyword...",
    allDepartments: "All Departments",
    applyAndAttach: "Apply & Attach Scan ->",
    closeSection: "Close Section [x]",

    // Application Intake Form
    intakeBadge: "General Administration Department",
    applyFor: "Apply for",
    gazetteCriteria: "Statutory Gazette Criteria:",
    applicantFullName: "Applicant Full Name:",
    aadhaarUid: "Aadhaar / UID:",
    fatherGuardianName: "Father / Guardian Name:",
    incomeMetric: "Income / Criteria Metric:",
    attachedArtifact: "Attached Document Artifact:",
    ocrNotice: "Local non-custodial OCR analysis will run immediately upon upload",
    autofillSample: "Auto-Fill Sample Data",
    cancel: "Cancel",
    uploadAndVerify: "Upload & Start Verification",
    uploadingInProgress: "Uploading & Cryptographically Ingesting...",

    // Post-Upload Confirmation Banner
    uploadConfirmed: "Document Upload Confirmed",
    verificationStage: "Verification Stage:",
    underScrutinyStage: "Under Tehsildar Scrutiny (Active Queue)",
    uploadNotice: "The document has been securely ingested into the sovereign intranet registry and is immediately available for officer inspection.",
    switchToOfficerDesk: "Switch to Tehsildar Desk to Scrutinize this Document ->",

    // Citizen Applications Table
    submittedApplications: "My Submitted Applications & Tracking",
    tableFilterAll: "All Applications",
    tableFilterScrutiny: "In Scrutiny",
    tableFilterIssued: "Digitally Issued",
    tableFilterReturned: "Returned",
    thCaseId: "Case Number",
    thService: "Service / Certificate",
    thApplicant: "Applicant",
    thDate: "Filing Date",
    thStatus: "Current Status",
    thActions: "Actions",
    actionPrint: "Print Official Certificate",
    actionInspectReason: "Inspect Statutory Objection",
    actionInReview: "Under Review",
    noApplications: "No applications found matching the selected filter criteria.",

    // Tehsildar Desk
    tehsildarTitle: "Statutory Scrutiny & Magisterial Endorsement",
    tehsildarSubtitle: "Review non-custodial OCR extractions against statutory Gazette rules before forwarding for final sovereign seal.",
    tabActiveQueue: "Active Scrutiny Queue",
    tabForwarded: "Forwarded to Root Admin",
    tehsildarSelectPrompt: "Select an application dossier from the left queue to begin statutory scrutiny.",
    applicantDetails: "Applicant Dossier & Non-Custodial OCR Findings",
    gazetteRulesAudit: "Deterministic Gazette Rules & DMN Validation",
    statutoryRemarks: "Tehsildar Statutory Remarks:",
    statutoryRemarksPlaceholder: "Enter magisterial endorsement or verification findings...",
    btnApproveForward: "Approve & Forward to Root Admin",
    btnReturnWithProof: "Return to Citizen with Proof",
    rulePassed: "PASSED GAZETTE CEILING",
    ruleViolation: "STATUTORY VIOLATION",
    ruleDiscrepancy: "DOCUMENT DISCREPANCY",

    // Return Modal
    returnModalTitle: "Return Application to Citizen",
    returnModalSubtitle: "Provide specific legal grounds and statutory gazette citations for discrepancy correction.",
    returnReasonPrompt: "Grounds for Returning Application:",
    returnReasonPlaceholder: "Specify exact gazette norms violated or missing proofs (e.g., Gross income Rs. 9,80,000 exceeds ceiling Rs. 8,00,000 as per GR-2024-EWS-09)...",
    confirmReturnBtn: "Confirm Statutory Rejection & Return",

    // Root Administrator Desk
    adminTitle: "Root Magistracy & Cryptographic Sealing Desk",
    adminSubtitle: "Execute immutable sovereign cryptographic seal on officer-approved dossiers.",
    adminQueueHeader: "Approved Dossiers Ready for Final Sovereign Seal",
    adminEmptyQueue: "No pending dossiers require final seal at this moment.",
    dossierApprovedBy: "Approved by Tehsildar Desk",
    btnExecuteFinalSeal: "Execute Final Seal & Issue Certificate",
    sealingInProgress: "Executing SHA-256 HMAC Sealing...",
    sealedAndIssuedBadge: "Digitally Sealed & Issued",
    finalHashLabel: "Cryptographic SHA-256 Ledger Hash:",

    // Certificate View & Print
    certModalTitle: "Official Gazetted Certificate",
    certPrintBtn: "Print Gazetted Certificate",
    certCloseBtn: "Close Preview",
    certGovHeader: "GOVERNMENT OF MAHARASHTRA",
    certOfficeHeader: "OFFICE OF THE EXECUTIVE MAGISTRATE & TEHSILDAR",
    certBarcodeLabel: "Sovereign SHA-256 Verification Digest",
    certValidNotice: "This is a computer generated digitally signed document as per the Information Technology Act 2000 and the Maharashtra Right to Public Services Act 2015. No physical signature is required.",

    // Language Toggle
    languageLabel: "Language / भाषा",

    // Documents Catalog Items
    docs: {
      income_certificate: {
        name: "Income Certificate",
        dept: "Revenue & Forest Department",
        desc: "Statutory proof of gross annual family income from all legal sources, required for state educational subsidies and welfare schemes.",
        criteria: "Total annual family income must be verified via Tehsil records and income tax returns."
      },
      ews_certificate: {
        name: "Economically Weaker Section (EWS) Certificate",
        dept: "General Administration Department",
        desc: "Statutory certificate granting 10% reservation in state government jobs and higher education admissions.",
        criteria: "Family gross annual income below Rs. 8,00,000/- for the fiscal year prior to application."
      },
      caste_certificate: {
        name: "Caste Certificate (SC/ST/VJNT/OBC/SBC)",
        dept: "Social Justice & Special Assistance Department",
        desc: "Constitutional affirmation of applicant caste lineage for availing statutory reservations and educational benefits.",
        criteria: "Permanent residence proof in Maharashtra prior to deemed deemed cut-off date (1950/1961/1967)."
      },
      non_creamy_layer: {
        name: "Non-Creamy Layer (OBC/VJNT) Certificate",
        dept: "Social Justice & Special Assistance Department",
        desc: "Mandatory statutory verification certifying that OBC/VJNT/SBC applicant does not belong to the elite creamy layer.",
        criteria: "Gross annual parental income under Rs. 8,00,000/- consecutively for preceding 3 financial years."
      },
      domicile_certificate: {
        name: "Domicile & Age/Nationality Certificate",
        dept: "Revenue & Forest Department",
        desc: "Authoritative proof of continuous residence in the State of Maharashtra for school/college admissions and state quota.",
        criteria: "Minimum continuous 15 years lawful residence in Maharashtra verified via electricity bills/ration cards."
      },
      ration_card: {
        name: "Ration Card (NFSA / BPL / APL Inclusion)",
        dept: "Food, Civil Supplies & Consumer Protection Department",
        desc: "Household inclusion under National Food Security Act or state targeted public distribution scheme.",
        criteria: "Urban family income under Rs. 59,000/yr (BPL) or below Rs. 1,00,000/yr (APL/NFSA yellow/saffron card)."
      },
      disability_certificate: {
        name: "Disability Identity Certificate (UDID)",
        dept: "Public Health & Family Welfare Department",
        desc: "Assessment certificate verifying permanent benchmark physical, sensory, or neurological disability.",
        criteria: "Minimum 40% benchmark permanent disability certified by a government district civil medical board."
      },
      senior_citizen_id: {
        name: "Senior Citizen Identity Certificate",
        dept: "Social Justice & Special Assistance Department",
        desc: "Statutory senior citizen concession identity providing transit discounts, healthcare priority, and institutional benefits.",
        criteria: "Applicant must be an Indian citizen domiciled in Maharashtra having attained at least 60 completed years."
      }
    }
  },

  mr: {
    // Top Bar & Branding
    stateGov: "महाराष्ट्र शासन",
    platformTitle: "सार्वभौम दस्तऐवज बुद्धिमत्ता व पडताळणी प्रणाली",
    platformSubtitle: "एअर-गॅप्ड सार्वभौम नोड • क्रिप्टोग्राफिक WORM लेजर • DMN राजपत्र पडताळणी",
    airgapNode: "एअर-गॅप्ड सार्वभौम नोड",
    dpdpCompliant: "DPDP २०२३ अनुपालन",
    verifiedNode: "इंट्रानेट पोर्ट ३००० पडताळणीकृत",

    // Role Selectors
    roleUser: "नागरिक पोर्टल",
    roleUserDesc: "दस्तऐवज अर्ज दाखल व थेट स्थिती",
    roleOfficer: "तहसीलदार कक्ष",
    roleOfficerDesc: "वैधानिक छाननी व दंडाधिकारी शेरा",
    roleAdmin: "मुख्य प्रशासक",
    roleAdminDesc: "क्रिप्टोग्राफिक मुद्रा व अंतिम जारीकरण",

    // Citizen KPI Cards
    kpiUnderScrutiny: "शासकीय छाननी अंतर्गत",
    kpiUnderScrutinySub: "सक्रिय पडताळणी प्रक्रियेत",
    kpiIssued: "डिजिटली स्वाक्षरीत व जारी",
    kpiIssuedSub: "त्वरित मुद्रणासाठी सज्ज",
    kpiReturned: "त्रुटीसह परत पाठवले",
    kpiReturnedSub: "वैधानिक त्रुटी नोंदवली गेली",
    kpiView: "पहा ->",

    // Document Catalogue
    catalogueTitle: "वैधानिक दस्तऐवज अर्ज व पडताळणी सूची",
    catalogueSubtitle: "आवश्यक प्रमाणपत्रासाठी अर्ज करा. स्थानिक नॉन-कस्टोडियल OCR आणि शासन राजपत्र नियमांनुसार पडताळणी त्वरित सुरू होईल.",
    searchPlaceholder: "दस्तऐवजाचे नाव, विभाग किंवा राजपत्रातील शब्दाने शोधा...",
    allDepartments: "सर्व शासकीय विभाग",
    applyAndAttach: "अर्ज करा व स्कॅन जोडा ->",
    closeSection: "विभाग बंद करा [x]",

    // Application Intake Form
    intakeBadge: "सामान्य प्रशासन विभाग",
    applyFor: "अर्ज:",
    gazetteCriteria: "राजपत्र वैधानिक निकष:",
    applicantFullName: "अर्जदाराचे संपूर्ण नाव:",
    aadhaarUid: "आधार क्रमांक / UID:",
    fatherGuardianName: "वडिलांचे / पालकांचे नाव:",
    incomeMetric: "वार्षिक उत्पन्न / निकष मूल्य:",
    attachedArtifact: "संलग्न दस्तऐवज फाइल:",
    ocrNotice: "अपलोड केल्यावर स्थानिक नॉन-कस्टोडियल OCR विश्लेषण त्वरित सुरू होईल",
    autofillSample: "नमुना माहिती भरा",
    cancel: "रद्द करा",
    uploadAndVerify: "अपलोड करा व पडताळणी सुरू करा",
    uploadingInProgress: "अपलोड व क्रिप्टोग्राफिक नोंदणी सुरू...",

    // Post-Upload Confirmation Banner
    uploadConfirmed: "दस्तऐवज यशस्वीरित्या अपलोड झाला",
    verificationStage: "पडताळणी टप्पा:",
    underScrutinyStage: "तहसीलदार छाननी अंतर्गत (सक्रिय यादी)",
    uploadNotice: "दस्तऐवज सुरक्षितपणे सार्वभौम इंट्रानेट नोंदणी वहीत नोंदवला गेला असून तहसीलदार छाननीसाठी तात्काळ उपलब्ध आहे.",
    switchToOfficerDesk: "हा दस्तऐवज तपासण्यासाठी तहसीलदार कक्षावर जा ->",

    // Citizen Applications Table
    submittedApplications: "माझे दाखल केलेले अर्ज व सद्यस्थिती",
    tableFilterAll: "सर्व अर्ज",
    tableFilterScrutiny: "छाननी सुरू",
    tableFilterIssued: "जारी केलेले",
    tableFilterReturned: "परत केलेले",
    thCaseId: "प्रकरण क्रमांक",
    thService: "सेवा / प्रमाणपत्र",
    thApplicant: "अर्जदार",
    thDate: "दाखल दिनांक",
    thStatus: "सद्यस्थिती",
    thActions: "कृती",
    actionPrint: "अधिकृत प्रमाणपत्र छापा",
    actionInspectReason: "नोंदवलेली त्रुटी तपासा",
    actionInReview: "पुनरावलोकन सुरू",
    noApplications: "निवडलेल्या निकषांनुसार कोणतेही अर्ज आढळले नाहीत.",

    // Tehsildar Desk
    tehsildarTitle: "तहसीलदार वैधानिक छाननी व शेरा",
    tehsildarSubtitle: "अंतिम सार्वभौम मुद्रेसाठी अग्रेषित करण्यापूर्वी शासकीय राजपत्र नियमांनुसार कागदपत्रांची छाननी करा.",
    tabActiveQueue: "सक्रिय छाननी यादी",
    tabForwarded: "मुख्य प्रशासकाकडे पाठवलेले",
    tehsildarSelectPrompt: "वैधानिक छाननी सुरू करण्यासाठी डाव्या यादीतून प्रकरण निवडा.",
    applicantDetails: "अर्जदार तपशील व OCR निष्कर्ष",
    gazetteRulesAudit: "शासन राजपत्र निकष व DMN पडताळणी",
    statutoryRemarks: "तहसीलदारांचा वैधानिक शेरा:",
    statutoryRemarksPlaceholder: "दंडाधिकारीय शेरा किंवा पडताळणी निष्कर्ष प्रविष्ट करा...",
    btnApproveForward: "मंजूर करा व मुख्य प्रशासकाकडे पाठवा",
    btnReturnWithProof: "पुराव्यासह नागरिकाकडे परत पाठवा",
    rulePassed: "राजपत्र निकष उत्तीर्ण",
    ruleViolation: "वैधानिक मर्यादा उल्लंघन",
    ruleDiscrepancy: "दस्तऐवज विसंगती आढळली",

    // Return Modal
    returnModalTitle: "अर्ज नागरिकाकडे त्रुटीसह परत पाठवा",
    returnModalSubtitle: "त्रुटी दुरुस्तीसाठी स्पष्ट कायदेशीर कारणे व राजपत्र संदर्भ नमूद करा.",
    returnReasonPrompt: "अर्ज परत पाठवण्याचे वैधानिक कारण:",
    returnReasonPlaceholder: "उल्लंघन झालेले नेमके राजपत्र निकष किंवा अपूर्ण पुरावे नमूद करा (उदा. एकूण उत्पन्न रु. ९,८०,००० हे शासन निर्णय २०२४ मधील रु. ८,००,००० मर्यादेपेक्षा जास्त आहे)...",
    confirmReturnBtn: "वैधानिक त्रुटी निश्चित करा व परत पाठवा",

    // Root Administrator Desk
    adminTitle: "मुख्य दंडाधिकारी व क्रिप्टोग्राफिक मुद्रा कक्ष",
    adminSubtitle: "तहसीलदारांनी मंजूर केलेल्या प्रकरणांवर अंतिम सार्वभौम क्रिप्टोग्राफिक मुद्रा उमटवा.",
    adminQueueHeader: "अंतिम सार्वभौम मुद्रेसाठी सज्ज मंजूर प्रकरणे",
    adminEmptyQueue: "या वेळी कोणतीही प्रकरणे अंतिम मुद्रेसाठी प्रलंबित नाहीत.",
    dossierApprovedBy: "तहसीलदार कक्षाने मंजूर केले",
    btnExecuteFinalSeal: "अंतिम डिजिटल मुद्रा उमटवा व प्रमाणपत्र जारी करा",
    sealingInProgress: "SHA-256 HMAC मुद्रा उमटवली जात आहे...",
    sealedAndIssuedBadge: "डिजिटली स्वाक्षरीत व जारी",
    finalHashLabel: "क्रिप्टोग्राफिक SHA-256 लेजर हॅश:",

    // Certificate View & Print
    certModalTitle: "अधिकृत राजपत्रित प्रमाणपत्र",
    certPrintBtn: "राजपत्रित प्रमाणपत्र छापा",
    certCloseBtn: "पूर्वावलोकन बंद करा",
    certGovHeader: "महाराष्ट्र शासन",
    certOfficeHeader: "कार्यकारी दंडाधिकारी तथा तहसीलदार यांचे कार्यालय",
    certBarcodeLabel: "सार्वभौम SHA-256 पडताळणी कोड",
    certValidNotice: "माहिती तंत्रज्ञान कायदा २००० आणि महाराष्ट्र लोकसेवा हक्क अधिनियम २०१५ अन्वये हा संगणकीकृत अधिकृत दस्तऐवज आहे. यावर कोणत्याही भौतिक स्वाक्षरीची आवश्यकता नाही.",

    // Language Toggle
    languageLabel: "भाषा / Language",

    // Documents Catalog Items
    docs: {
      income_certificate: {
        name: "उत्पन्नाचे प्रमाणपत्र",
        dept: "महसूल व वन विभाग",
        desc: "सर्व कायदेशीर स्त्रोतांकडून मिळणाऱ्या कौटुंबिक वार्षिक उत्पन्नाचा अधिकृत पुरावा; शैक्षणिक सवलती व योजनांसाठी आवश्यक.",
        criteria: "एकूण वार्षिक कौटुंबिक उत्पन्न तहसील नोंद व आयकर विवरणाद्वारे प्रमाणित असणे आवश्यक."
      },
      ews_certificate: {
        name: "आर्थिकदृष्ट्या दुर्बल घटक (EWS) प्रमाणपत्र",
        dept: "सामान्य प्रशासन विभाग",
        desc: "शासकीय नोकऱ्या आणि उच्च शिक्षणात १०% आरक्षणासाठी आवश्यक वैधानिक प्रमाणपत्र.",
        criteria: "अर्ज करण्याच्या आधीच्या आर्थिक वर्षात कुटुंबाचे वार्षिक उत्पन्न रु. ८,००,००० पेक्षा कमी असावे."
      },
      caste_certificate: {
        name: "जातीचे प्रमाणपत्र (SC/ST/VJNT/OBC/SBC)",
        dept: "सामाजिक न्याय व विशेष सहाय्य विभाग",
        desc: "वैधानिक आरक्षणे आणि शैक्षणिक सवलतींचा लाभ घेण्यासाठी अर्जदाराच्या जात वंशावळीची घटनात्मक पडताळणी.",
        criteria: "महाराष्ट्र राज्यातील विहित वर्षांपूर्वीचे (१९५०/१९६१/१९६७) कायमस्वरूपी वास्तव्याचे पुरावे."
      },
      non_creamy_layer: {
        name: "नॉन-क्रीमी लेयर (OBC/VJNT) प्रमाणपत्र",
        dept: "सामाजिक न्याय व विशेष सहाय्य विभाग",
        desc: "OBC/VJNT/SBC प्रवर्गातील उमेदवार उन्नत व प्रगत गटात (क्रीमी लेयर) मोडत नसल्याचे अनिवार्य प्रमाणपत्र.",
        criteria: "मागील सलग ३ आर्थिक वर्षांमध्ये पालकांचे एकूण वार्षिक उत्पन्न रु. ८,००,००० च्या आत असणे आवश्यक."
      },
      domicile_certificate: {
        name: "अधिवास (डोमिसाईल) व वय/राष्ट्रीयत्व प्रमाणपत्र",
        dept: "महसूल व वन विभाग",
        desc: "शाळा/महाविद्यालय प्रवेश व शासकीय कोट्यासाठी महाराष्ट्र राज्यात सलग वास्तव्याचा अधिकृत पुरावा.",
        criteria: "महाराष्ट्र राज्यात किमान सलग १५ वर्षे कायदेशीर वास्तव्य (लाईट बिल, रेशन कार्डद्वारे पडताळणी)."
      },
      ration_card: {
        name: "शिधापत्रिका (रेशन कार्ड - NFSA / BPL / APL)",
        dept: "अन्न, नागरी पुरवठा व ग्राहक संरक्षण विभाग",
        desc: "राष्ट्रीय अन्न सुरक्षा कायदा किंवा राज्य सार्वजनिक वितरण प्रणाली अंतर्गत कुटुंब नोंदणी.",
        criteria: "शहरी कुटुंबाचे उत्पन्न रु. ५९,०००/वर्ष (BPL) किंवा रु. १,००,०००/वर्ष आत (APL केशरी/पिवळे कार्ड)."
      },
      disability_certificate: {
        name: "दिव्यांगत्व ओळख प्रमाणपत्र (UDID)",
        dept: "सार्वजनिक आरोग्य व कुटुंब कल्याण विभाग",
        desc: "कायमस्वरूपी शारीरिक, संवेदी किंवा मानसिक दिव्यांगत्वाची पडताळणी करणारे वैद्यकीय प्रमाणपत्र.",
        criteria: "जिल्हा शासकीय वैद्यकीय मंडळाने प्रमाणित केलेले किमान ४०% बेंचमार्क दिव्यांगत्व."
      },
      senior_citizen_id: {
        name: "ज्येष्ठ नागरिक ओळखपत्र",
        dept: "सामाजिक न्याय व विशेष सहाय्य विभाग",
        desc: "प्रवास सवलती, आरोग्य प्राधान्य आणि संस्थात्मक लाभांसाठी अधिकृत ज्येष्ठ नागरिक ओळखपत्र.",
        criteria: "अर्जदार महाराष्ट्राचा अधिवासी असणे व अर्ज करताना वयाची ६० वर्षे पूर्ण असणे आवश्यक."
      }
    }
  },

  hi: {
    // Top Bar & Branding
    stateGov: "महाराष्ट्र शासन",
    platformTitle: "संप्रभु दस्तावेज़ आसूचना एवं सत्यापन प्रणाली",
    platformSubtitle: "एयर-गैप्ड संप्रभु नोड • क्रिप्टोग्राफिक WORM लेजर • DMN राजपत्र सत्यापन",
    airgapNode: "एयर-गैप्ड संप्रभु नोड",
    dpdpCompliant: "DPDP 2023 अनुपालन",
    verifiedNode: "इंट्रानेट पोर्ट 3000 सत्यापित",

    // Role Selectors
    roleUser: "नागरिक पोर्टल",
    roleUserDesc: "दस्तावेज़ आवेदन एवं सजीव स्थिति",
    roleOfficer: "तहसीलदार पटल",
    roleOfficerDesc: "सांविधिक जांच एवं मजिस्ट्रेटी टिप्पणी",
    roleAdmin: "मुख्य प्रशासक",
    roleAdminDesc: "क्रिप्टोग्राफिक मुद्रा एवं अंतिम निर्गमन",

    // Citizen KPI Cards
    kpiUnderScrutiny: "प्रशासकीय जांच के अंतर्गत",
    kpiUnderScrutinySub: "सक्रिय सत्यापन प्रगति पर",
    kpiIssued: "डिजिटली मुद्रित एवं जारी",
    kpiIssuedSub: "त्वरित प्रिंट हेतु तैयार",
    kpiReturned: "आपत्ति सहित वापस",
    kpiReturnedSub: "सांविधिक विसंगति दर्ज की गई",
    kpiView: "देखें ->",

    // Document Catalogue
    catalogueTitle: "सांविधिक दस्तावेज़ आवेदन एवं सत्यापन सूची",
    catalogueSubtitle: "आवश्यक प्रमाण पत्र हेतु आवेदन चुनें। स्थानीय नॉन-कस्टोडियल OCR एवं सरकारी राजपत्र नियमों द्वारा सत्यापन तुरंत प्रारंभ होगा।",
    searchPlaceholder: "दस्तावेज़ नाम, विभाग या राजपत्र कीवर्ड से खोजें...",
    allDepartments: "सभी शासकीय विभाग",
    applyAndAttach: "आवेदन करें व स्कैन जोड़ें ->",
    closeSection: "खंड बंद करें [x]",

    // Application Intake Form
    intakeBadge: "सामान्य प्रशासन विभाग",
    applyFor: "आवेदन:",
    gazetteCriteria: "राजपत्र सांविधिक मानदंड:",
    applicantFullName: "आवेदक का पूरा नाम:",
    aadhaarUid: "आधार संख्या / UID:",
    fatherGuardianName: "पिता / अभिभावक का नाम:",
    incomeMetric: "वार्षिक आय / मानदंड मीट्रिक:",
    attachedArtifact: "संलग्न दस्तावेज़ फ़ाइल:",
    ocrNotice: "अपलोड करने पर स्थानीय नॉन-कस्टोडियल OCR विश्लेषण तुरंत प्रारंभ होगा",
    autofillSample: "नमूना जानकारी भरें",
    cancel: "रद्द करें",
    uploadAndVerify: "अपलोड करें एवं सत्यापन शुरू करें",
    uploadingInProgress: "अपलोड एवं क्रिप्टोग्राफिक प्रविष्टि जारी...",

    // Post-Upload Confirmation Banner
    uploadConfirmed: "दस्तावेज़ सफलतापूर्वक अपलोड हुआ",
    verificationStage: "सत्यापन चरण:",
    underScrutinyStage: "तहसीलदार जांच के अंतर्गत (सक्रिय सूची)",
    uploadNotice: "दस्तावेज़ सुरक्षित रूप से संप्रभु इंट्रानेट रजिस्ट्री में दर्ज हो चुका है और अधिकारी निरीक्षण हेतु तुरंत उपलब्ध है।",
    switchToOfficerDesk: "इस दस्तावेज़ की जांच हेतु तहसीलदार पटल पर जाएं ->",

    // Citizen Applications Table
    submittedApplications: "मेरे जमा किए गए आवेदन एवं स्थिति",
    tableFilterAll: "सभी आवेदन",
    tableFilterScrutiny: "जांच जारी",
    tableFilterIssued: "जारी किए गए",
    tableFilterReturned: "वापस किए गए",
    thCaseId: "प्रकरण संख्या",
    thService: "सेवा / प्रमाण पत्र",
    thApplicant: "आवेदक",
    thDate: "आवेदन तिथि",
    thStatus: "वर्तमान स्थिति",
    thActions: "कार्यवाही",
    actionPrint: "आधिकारिक प्रमाण पत्र प्रिंट करें",
    actionInspectReason: "दर्ज आपत्ति देखें",
    actionInReview: "समीक्षा जारी",
    noApplications: "चयनित मानदंडों के अनुसार कोई आवेदन नहीं मिला।",

    // Tehsildar Desk
    tehsildarTitle: "तहसीलदार सांविधिक जांच एवं मजिस्ट्रेटी टिप्पणी",
    tehsildarSubtitle: "अंतिम संप्रभु मुद्रा हेतु अग्रेषित करने से पूर्व सरकारी राजपत्र नियमों के अनुसार दस्तावेज़ों की जांच करें।",
    tabActiveQueue: "सक्रिय जांच सूची",
    tabForwarded: "मुख्य प्रशासक को अग्रेषित",
    tehsildarSelectPrompt: "सांविधिक जांच शुरू करने के लिए बाईं सूची से प्रकरण चुनें।",
    applicantDetails: "आवेदक विवरण एवं OCR निष्कर्ष",
    gazetteRulesAudit: "सरकारी राजपत्र मानदंड एवं DMN सत्यापन",
    statutoryRemarks: "तहसीलदार की सांविधिक टिप्पणी:",
    statutoryRemarksPlaceholder: "मजिस्ट्रेटी टिप्पणी या सत्यापन निष्कर्ष दर्ज करें...",
    btnApproveForward: "स्वीकृत करें व मुख्य प्रशासक को भेजें",
    btnReturnWithProof: "प्रमाण सहित नागरिक को वापस भेजें",
    rulePassed: "राजपत्र मानदंड उत्तीर्ण",
    ruleViolation: "सांविधिक सीमा उल्लंघन",
    ruleDiscrepancy: "दस्तावेज़ विसंगति पाई गई",

    // Return Modal
    returnModalTitle: "आवेदन आपत्ति सहित नागरिक को वापस भेजें",
    returnModalSubtitle: "आपत्ति निवारण हेतु स्पष्ट कानूनी आधार एवं राजपत्र संदर्भ निर्दिष्ट करें।",
    returnReasonPrompt: "आवेदन वापस भेजने का सांविधिक कारण:",
    returnReasonPlaceholder: "उल्लिखित राजपत्र मानदंड उल्लंघन या अपूर्ण प्रमाण दर्ज करें (उदा. कुल वार्षिक आय रु. 9,80,000 राजपत्र सीमा रु. 8,00,000 से अधिक है)...",
    confirmReturnBtn: "सांविधिक आपत्ति की पुष्टि करें व वापस भेजें",

    // Root Administrator Desk
    adminTitle: "मुख्य मजिस्ट्रेट एवं क्रिप्टोग्राफिक मुद्रा पटल",
    adminSubtitle: "तहसीलदार द्वारा स्वीकृत प्रकरणों पर अंतिम संप्रभु क्रिप्टोग्राफिक मुद्रा अंकित करें।",
    adminQueueHeader: "अंतिम संप्रभु मुद्रा हेतु तैयार अनुमोदित प्रकरण",
    adminEmptyQueue: "इस समय कोई प्रकरण अंतिम मुद्रा हेतु लंबित नहीं है।",
    dossierApprovedBy: "तहसीलदार पटल द्वारा स्वीकृत",
    btnExecuteFinalSeal: "अंतिम डिजिटल मुद्रा अंकित करें व प्रमाण पत्र जारी करें",
    sealingInProgress: "SHA-256 HMAC मुद्रा अंकित की जा रही है...",
    sealedAndIssuedBadge: "डिजिटली मुद्रित एवं जारी",
    finalHashLabel: "क्रिप्टोग्राफिक SHA-256 लेजर हैश:",

    // Certificate View & Print
    certModalTitle: "आधिकारिक राजपत्रित प्रमाण पत्र",
    certPrintBtn: "राजपत्रित प्रमाण पत्र प्रिंट करें",
    certCloseBtn: "पूर्वावलोकन बंद करें",
    certGovHeader: "महाराष्ट्र शासन",
    certOfficeHeader: "कार्यालय कार्यपालक मजिस्ट्रेट एवं तहसीलदार",
    certBarcodeLabel: "संप्रभु SHA-256 सत्यापन कोड",
    certValidNotice: "सूचना प्रौद्योगिकी अधिनियम 2000 एवं महाराष्ट्र लोकसेवा अधिकार अधिनियम 2015 के तहत यह कंप्यूटरीकृत आधिकारिक दस्तावेज़ है। किसी भौतिक हस्ताक्षर की आवश्यकता नहीं है।",

    // Language Toggle
    languageLabel: "भाषा / Language",

    // Documents Catalog Items
    docs: {
      income_certificate: {
        name: "आय प्रमाण पत्र",
        dept: "राजस्व एवं वन विभाग",
        desc: "सभी कानूनी स्रोतों से पारिवारिक सकल वार्षिक आय का आधिकारिक प्रमाण; छात्रवृत्ति एवं कल्याणकारी योजनाओं हेतु आवश्यक।",
        criteria: "कुल वार्षिक पारिवारिक आय तहसील अभिलेखों एवं आयकर रिटर्न द्वारा सत्यापित होना अनिवार्य।"
      },
      ews_certificate: {
        name: "आर्थिक रूप से कमजोर वर्ग (EWS) प्रमाण पत्र",
        dept: "सामान्य प्रशासन विभाग",
        desc: "सरकारी नौकरियों और उच्च शिक्षा में 10% आरक्षण हेतु आवश्यक सांविधिक प्रमाण पत्र।",
        criteria: "आवेदन से पूर्व वित्तीय वर्ष में परिवार की सकल वार्षिक आय रु. 8,00,000 से कम होनी चाहिए।"
      },
      caste_certificate: {
        name: "जाति प्रमाण पत्र (SC/ST/VJNT/OBC/SBC)",
        dept: "सामाजिक न्याय एवं विशेष सहायता विभाग",
        desc: "आरक्षण एवं शैक्षणिक लाभ प्राप्त करने हेतु आवेदक की जाति वंशावली का संवैधानिक प्रमाण।",
        criteria: "महाराष्ट्र राज्य में निर्धारित कट-ऑफ तिथि (1950/1961/1967) से पूर्व स्थायी निवास के साक्ष्य।"
      },
      non_creamy_layer: {
        name: "नॉन-क्रीमी लेयर (OBC/VJNT) प्रमाण पत्र",
        dept: "सामाजिक न्याय एवं विशेष सहायता विभाग",
        desc: "OBC/VJNT/SBC वर्ग के आवेदक के संपन्न वर्ग (क्रीमी लेयर) में न होने का अनिवार्य प्रमाण पत्र।",
        criteria: "विगत लगातार 3 वित्तीय वर्षों में माता-पिता की सकल वार्षिक आय रु. 8,00,000 के भीतर होना आवश्यक।"
      },
      domicile_certificate: {
        name: "अधिवास (डोमिसाइल) एवं आयु/राष्ट्रीयता प्रमाण पत्र",
        dept: "राजस्व एवं वन विभाग",
        desc: "प्रवेश एवं राज्य कोटे हेतु महाराष्ट्र राज्य में निरंतर स्थायी निवास का प्रामाणिक दस्तावेज़।",
        criteria: "महाराष्ट्र में न्यूनतम लगातार 15 वर्षों का वैध निवास (बिजली बिल/राशन कार्ड द्वारा सत्यापित)।"
      },
      ration_card: {
        name: "राशन कार्ड (NFSA / BPL / APL समावेशन)",
        dept: "खाद्य, नागरिक आपूर्ति एवं उपभोक्ता संरक्षण विभाग",
        desc: "राष्ट्रीय खाद्य सुरक्षा अधिनियम या राज्य लक्षित सार्वजनिक वितरण प्रणाली अंतर्गत परिवार का पंजीकरण।",
        criteria: "शहरी परिवार की वार्षिक आय रु. 59,000 (BPL) अथवा रु. 1,00,000 के भीतर (APL कार्ड हेतु)।"
      },
      disability_certificate: {
        name: "दिव्यांगता पहचान प्रमाण पत्र (UDID)",
        dept: "सार्वजनिक स्वास्थ्य एवं परिवार कल्याण विभाग",
        desc: "स्थायी शारीरिक, संवेदी अथवा मानसिक दिव्यांगता का सत्यापन करने वाला मेडिकल प्रमाण पत्र।",
        criteria: "जिला सरकारी मेडिकल बोर्ड द्वारा प्रमाणित न्यूनतम 40% बेंचमार्क स्थायी दिव्यांगता।"
      },
      senior_citizen_id: {
        name: "वरिष्ठ नागरिक पहचान प्रमाण पत्र",
        dept: "सामाजिक न्याय एवं विशेष सहायता विभाग",
        desc: "यात्रा छूट, स्वास्थ्य प्राथमिकता एवं संस्थागत लाभों हेतु आधिकारिक वरिष्ठ नागरिक पहचान पत्र।",
        criteria: "आवेदक महाराष्ट्र का अधिवासी नागरिक होना चाहिए एवं आयु न्यूनतम 60 पूर्ण वर्ष होनी आवश्यक।"
      }
    }
  }
};

/**
 * Global Translation Helper function
 */
window.t = function(key, lang = 'en') {
  const currentLang = window.I18N[lang] ? lang : 'en';
  const val = window.I18N[currentLang][key] || window.I18N['en'][key] || key;
  return val;
};

/**
 * Translate Document Meta by id
 */
window.translateDoc = function(docId, lang = 'en') {
  const currentLang = window.I18N[lang] ? lang : 'en';
  const docTranslations = window.I18N[currentLang].docs || {};
  const fallbackDocs = window.I18N['en'].docs || {};
  return docTranslations[docId] || fallbackDocs[docId] || null;
};
