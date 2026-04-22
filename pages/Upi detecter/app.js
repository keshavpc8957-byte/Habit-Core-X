/* =============================================
   UPI SHIELD AI — FRAUD DETECTION ENGINE
   app.js
   ============================================= */

// ── EXAMPLES ──────────────────────────────────
const EXAMPLES = {
  1: `UPI ID: random123x@ybl
Phone: 9876543210`,

  2: `Company: Reliance Jlo Pvt Ltd
GST: 27ABCDE1234F1Z
Amount: ₹1,00,000
UPI: pay.reliancejlo@hdffcbank
Message: Pay immediately or your account will be blocked. Last warning!
Phone: 0123456789`,

  3: `Ek banda bol raha hai ki mujhe ₹50,000 pay karo
UPI: winner2024@paytm
Bol raha hai lucky prize milega baad mein
OTP bhi maang raha hai`,

  4: `Company: Sharma Electronics Pvt Ltd
GST: 07AAECS1234C1ZA
Amount: ₹12,500
UPI: sharma.electronics@okaxis
IFSC: UTIB0001234
Phone: 9876543210`
};

// ── INPUT HELPERS ──────────────────────────────
function loadExample(n) {
  const ta = document.getElementById('inputText');
  ta.value = EXAMPLES[n];
  onInputChange();
  ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
  ta.focus();
}

function onInputChange() {
  const val = document.getElementById('inputText').value;
  document.getElementById('charCount').textContent = val.length + ' characters';
  document.getElementById('analyzeBtn').disabled = val.trim().length < 3;
  document.getElementById('clearBtn').style.display = val.length ? 'inline-block' : 'none';
}

function clearInput() {
  document.getElementById('inputText').value = '';
  onInputChange();
  document.getElementById('resultCard').style.display = 'none';
}

function newAnalysis() {
  clearInput();
  document.getElementById('inputText').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('inputText').focus();
}

// ── COPY REPORT ────────────────────────────────
function copyReport() {
  const text = document.getElementById('reportBody').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.action-copy');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Report', 2000);
  });
}

// ── LOADER ANIMATION ──────────────────────────
async function runLoader() {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  for (const id of steps) {
    await delay(380);
    document.getElementById(id).classList.add('active');
  }
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════
//  MAIN ANALYSIS ENGINE
// ═══════════════════════════════════════════════

async function analyzeInput() {
  const raw = document.getElementById('inputText').value.trim();
  if (!raw) return;

  // Show loader
  document.getElementById('analyzeBtn').style.display = 'none';
  document.getElementById('loaderSection').style.display = 'flex';
  // Reset loader steps
  ['step1','step2','step3','step4'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById('resultCard').style.display = 'none';

  runLoader();
  await delay(1800); // Simulate processing time

  const result = performAnalysis(raw);
  renderResult(result);

  document.getElementById('loaderSection').style.display = 'none';
  document.getElementById('analyzeBtn').style.display = 'flex';
  document.getElementById('resultCard').style.display = 'block';
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════
//  ANALYSIS LOGIC
// ═══════════════════════════════════════════════

function performAnalysis(text) {
  const t = text.toLowerCase();
  let score = 0;
  const safePoints   = [];
  const redFlags     = [];
  const breakdown    = [];
  let actionItems    = [];

  // ─────────────────────────────────────
  // 1. UPI ID ANALYSIS
  // ─────────────────────────────────────
  const upiMatch = text.match(/[a-zA-Z0-9._\-+]+@[a-zA-Z0-9]+/g);
  let upiStatus = 'na', upiPts = 0;

  if (upiMatch && upiMatch.length > 0) {
    const upiResults = upiMatch.map(analyzeUpiId);
    const worst = upiResults.reduce((a, b) => a.pts > b.pts ? a : b);
    upiPts = worst.pts;
    score += upiPts;
    upiStatus = worst.status;

    if (worst.flags.length === 0) {
      safePoints.push(`UPI ID "${upiMatch[0]}" ka format valid hai ✓`);
    } else {
      worst.flags.forEach(f => redFlags.push(f));
    }
    if (upiResults.length > 1) {
      safePoints.push(`${upiResults.length} UPI IDs found — sab check kiye`);
    }
  } else {
    upiStatus = 'na';
  }
  breakdown.push({ check: 'UPI ID Format', status: upiStatus, pts: upiPts });

  // ─────────────────────────────────────
  // 2. GST NUMBER CHECK
  // ─────────────────────────────────────
  const gstMatch = text.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}\b/gi);
  const gstRawMatch = text.match(/GST[:\s#]*([A-Z0-9]{10,20})/gi);
  let gstStatus = 'na', gstPts = 0;

  if (gstRawMatch) {
    if (gstMatch && gstMatch.length > 0) {
      const gstNum = gstMatch[0].toUpperCase();
      const stateCode = parseInt(gstNum.substring(0, 2));
      if (stateCode >= 1 && stateCode <= 38) {
        safePoints.push(`GST number "${gstNum}" format valid lagta hai ✓`);
        gstStatus = 'ok';
        gstPts = 0;
      } else {
        redFlags.push(`GST state code "${stateCode}" invalid hai — 01-38 hona chahiye`);
        gstStatus = 'warn'; gstPts = 12;
      }
    } else {
      redFlags.push('GST number invalid format mein hai — sahi format: 2 digits + 5 letters + 4 digits + 1Z + 1 letter');
      gstStatus = 'bad'; gstPts = 18;
      score += gstPts;
    }
  }
  if (gstPts > 0) score += gstPts;
  breakdown.push({ check: 'GST Number', status: gstStatus, pts: gstPts });

  // ─────────────────────────────────────
  // 3. PHONE NUMBER CHECK
  // ─────────────────────────────────────
  const phoneMatch = text.match(/\b[0-9]{10}\b/g);
  let phoneStatus = 'na', phonePts = 0;

  if (phoneMatch) {
    phoneMatch.forEach(ph => {
      const first = parseInt(ph[0]);
      if ([6,7,8,9].includes(first) && ph.length === 10) {
        safePoints.push(`Phone number "${ph}" valid Indian number hai ✓`);
        phoneStatus = phoneStatus === 'bad' ? 'bad' : 'ok';
      } else {
        redFlags.push(`Phone number "${ph}" suspicious — valid Indian numbers start with 6/7/8/9`);
        phoneStatus = 'bad'; phonePts += 10;
      }
    });
    // Check for short/long numbers
    const badLen = text.match(/\b[0-9]{1,9}\b|\b[0-9]{11,15}\b/g);
    if (badLen) {
      const filteredBad = badLen.filter(n => n.length < 10 && n.length > 5);
      if (filteredBad.length > 0) {
        redFlags.push(`Irregular phone number detected: "${filteredBad[0]}" — 10 digits nahi hai`);
        phoneStatus = 'warn'; phonePts += 8;
      }
    }
  }
  score += phonePts;
  breakdown.push({ check: 'Phone Number', status: phoneStatus, pts: phonePts });

  // ─────────────────────────────────────
  // 4. IFSC CODE CHECK
  // ─────────────────────────────────────
  const ifscMatch = text.match(/[A-Z]{4}0[A-Z0-9]{6}/gi);
  const ifscRaw = text.match(/IFSC[:\s]*([A-Z0-9]{11})/gi);
  let ifscStatus = 'na', ifscPts = 0;

  if (ifscRaw) {
    if (ifscMatch) {
      safePoints.push(`IFSC code "${ifscMatch[0].toUpperCase()}" format sahi lag raha hai ✓`);
      ifscStatus = 'ok';
    } else {
      redFlags.push('IFSC code format galat hai — sahi format: 4 letters + 0 + 6 characters');
      ifscStatus = 'bad'; ifscPts = 14;
      score += ifscPts;
    }
  }
  breakdown.push({ check: 'IFSC Code', status: ifscStatus, pts: ifscPts });

  // ─────────────────────────────────────
  // 5. COMPANY NAME CHECK (typosquatting)
  // ─────────────────────────────────────
  const bigBrands = [
    { real: 'reliance', fakes: ['reliancee','relianc','reliance jlo','relianc jio','relaince'] },
    { real: 'amazon',   fakes: ['amazone','amazn','amazon indai','amzon','amazoon'] },
    { real: 'flipkart', fakes: ['flipkart','flikart','flipkart','fliipkart'] },
    { real: 'hdfc',     fakes: ['hdfcbank','hdfcc','hddfc','hdffcbank','hdfc baank'] },
    { real: 'sbi',      fakes: ['sbii','sbi1','s-bi','sbi bank ltd'] },
    { real: 'icici',    fakes: ['icicii','icic1','icicii bank','okicic'] },
    { real: 'paytm',    fakes: ['payytm','paatm','paaytm','paytm1'] },
    { real: 'tata',     fakes: ['taata','ttata','tata1'] },
    { real: 'infosys',  fakes: ['infossys','infosyss'] },
    { real: 'bajaj',    fakes: ['baajaj','bajjaj','bajaj1'] },
  ];
  let companyStatus = 'na', companyPts = 0;
  let companyFound = false;

  for (const brand of bigBrands) {
    for (const fake of brand.fakes) {
      if (t.includes(fake)) {
        redFlags.push(`Company naam "${fake}" suspicious — "${brand.real}" ka fake version lagta hai`);
        companyStatus = 'bad'; companyPts = 20;
        companyFound = true;
        break;
      }
    }
    if (companyFound) break;
  }
  // Legitimate company mention
  if (!companyFound && t.match(/company|pvt ltd|private limited|ltd\.|enterprises|traders|store/)) {
    safePoints.push('Company name mein koi obvious typosquatting nahi mila ✓');
    companyStatus = 'ok';
  }
  score += companyPts;
  breakdown.push({ check: 'Company Name', status: companyStatus, pts: companyPts });

  // ─────────────────────────────────────
  // 6. LANGUAGE PATTERN CHECK (pressure, scam)
  // ─────────────────────────────────────
  const pressureWords = [
    { words: ['immediately','turant','abhi','right now','instant'], label: 'Urgency language', pts: 8 },
    { words: ['last warning','final warning','last chance'], label: '"Last warning" language — pressure tactic', pts: 15 },
    { words: ['account will be blocked','account block','account suspend'], label: '"Account block" threat — classic fraud tactic', pts: 18 },
    { words: ['pay first','pehle pay','money first'], label: '"Pay first, invoice later" request', pts: 20 },
    { words: ['lucky winner','prize winner','you have won','aapne jeeta','selected winner'], label: '"Lucky winner/prize" language — definite scam pattern', pts: 25 },
    { words: ['otp','one time password'], label: 'OTP ka mention — kabhi bhi OTP share mat karo', pts: 22 },
    { words: ['ignore official','bypass','personal account','personal upi'], label: 'Official channels ignore karne ko bol raha hai', pts: 20 },
    { words: ['within 2 hours','2 ghante mein','24 hours mein','limited time'], label: 'Artificial time pressure create ho raha hai', pts: 12 },
    { words: ['cash back','cashback reward','refund trick'], label: 'Fake cashback/refund offer', pts: 18 },
    { words: ['screen share','remote access','anydesk','teamviewer'], label: 'Screen sharing maang raha hai — FRAUD', pts: 30 },
  ];

  let langPts = 0;
  let langFlags = [];
  let langSafe = true;

  for (const pattern of pressureWords) {
    for (const w of pattern.words) {
      if (t.includes(w)) {
        langFlags.push(pattern.label);
        langPts += pattern.pts;
        langSafe = false;
        break;
      }
    }
  }
  langPts = Math.min(langPts, 40); // cap
  score += langPts;

  if (langSafe) {
    safePoints.push('Koi pressure language ya scam pattern nahi mila ✓');
  } else {
    [...new Set(langFlags)].forEach(f => redFlags.push(f));
  }
  breakdown.push({ check: 'Language Pattern', status: langSafe ? 'ok' : (langPts >= 20 ? 'bad' : 'warn'), pts: langPts });

  // ─────────────────────────────────────
  // 7. AMOUNT PATTERN CHECK
  // ─────────────────────────────────────
  const amtMatches = text.match(/₹?\s*([0-9,]+(?:\.[0-9]+)?)/g);
  let amtPts = 0, amtStatus = 'na';

  const suspiciousAmounts = [50000, 100000, 200000, 500000, 10000, 25000];
  if (amtMatches) {
    for (const amtStr of amtMatches) {
      const clean = amtStr.replace(/[₹,\s]/g, '');
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        if (suspiciousAmounts.includes(num)) {
          redFlags.push(`Amount ₹${num.toLocaleString('en-IN')} — round suspicious amount hai, verify karo`);
          amtPts += 8;
          amtStatus = 'warn';
        } else if (num > 0) {
          safePoints.push(`Amount ₹${num.toLocaleString('en-IN')} — koi obvious round-number fraud nahi ✓`);
          amtStatus = amtStatus === 'warn' ? 'warn' : 'ok';
        }
      }
    }
  }
  score += amtPts;
  breakdown.push({ check: 'Amount Pattern', status: amtStatus, pts: amtPts });

  // ─────────────────────────────────────
  // 8. COMBINATION CHECK (urgency + large amount)
  // ─────────────────────────────────────
  const hasUrgency = pressureWords.slice(0,3).some(p => p.words.some(w => t.includes(w)));
  const hasLargeAmt = amtMatches && amtMatches.some(a => {
    const n = parseFloat(a.replace(/[₹,\s]/g, ''));
    return n >= 10000;
  });
  if (hasUrgency && hasLargeAmt) {
    score += 15;
    redFlags.push('Urgency + large amount combination — classic fraud tactic! ⚠️');
    breakdown.push({ check: 'Urgency+Amount Combo', status: 'bad', pts: 15 });
  }

  // ─────────────────────────────────────
  // FINAL SCORE CAPPING & DETERMINATION
  // ─────────────────────────────────────
  score = Math.min(score, 100);
  let level, levelClass, levelIcon, levelSub;

  if (score <= 30) {
    level = '🟢 SAFE';
    levelClass = 'safe';
    levelIcon = '✅';
    levelSub = 'Yeh payment request safe lagti hai. Fir bhi ek baar verify zaroor karo.';
  } else if (score <= 65) {
    level = '🟡 SUSPICIOUS';
    levelClass = 'warn';
    levelIcon = '⚠️';
    levelSub = 'Kuch cheezein doubt mein hain. Pay karne se pehle verify karo.';
  } else {
    level = '🔴 HIGH RISK — FRAUD';
    levelClass = 'danger';
    levelIcon = '🚨';
    levelSub = 'Multiple red flags mili hain. MAT DENA PAYMENT! Cyber Crime 1930 pe call karo.';
  }

  // ─────────────────────────────────────
  // DETAILED ANALYSIS TEXT
  // ─────────────────────────────────────
  let detailedAnalysis = '';
  if (score <= 30) {
    detailedAnalysis = `Is request mein koi bada red flag nahi mila. UPI ID format aur details sahi lagte hain. Phir bhi, payment karne se pehle ek baar vendor ko personally ya official channel se verify karo — especially agar amount zyada hai.`;
  } else if (score <= 65) {
    detailedAnalysis = `Kuch suspicious elements mili hain jo concern karne layak hain. Ho sakta hai yeh genuine ho, par kuch details missing ya doubtful hain. Pehle vendor ko verify karo — directly phone karo ya physically milke confirm karo. Bina verification ke payment mat karo.`;
  } else {
    detailedAnalysis = `Is request mein multiple strong red flags hain jo clearly fraud pattern show karte hain. ${redFlags.length > 3 ? 'Pressure tactics, suspicious UPI details aur ' : ''}Ye combination of signals typical Indian payment scam ka pattern hai. Immediately payment rokh do aur cybercrime.gov.in ya 1930 pe report karo.`;
  }

  // ─────────────────────────────────────
  // ACTION ITEMS
  // ─────────────────────────────────────
  if (score <= 30) {
    actionItems = [
      { icon: '✅', text: 'Payment se pehle vendor ka naam Google pe verify karo' },
      { icon: '📞', text: 'Agar pehli baar deal ho to officially unhe call karke confirm karo' },
      { icon: '💾', text: 'Transaction ka screenshot zaroor lo' },
      { icon: '📋', text: 'GST invoice ki copy apne paas rakho' },
    ];
  } else if (score <= 65) {
    actionItems = [
      { icon: '🔍', text: 'Koi bhi payment mat karo abhi — pehle verify karo' },
      { icon: '📞', text: 'Company ko OFFICIAL number pe call karo (website se dhundo, message ke number pe nahi)' },
      { icon: '🏛️', text: 'Agar government-related hai to official portal check karo' },
      { icon: '👥', text: 'Kisi trusted person ko dikhao before payment' },
      { icon: '🚫', text: '\"Just pay, we\'ll sort it later\" type requests se door raho' },
    ];
  } else {
    actionItems = [
      { icon: '🚫', text: 'ABHI PAYMENT MAT KARO — Ye fraud hai' },
      { icon: '📱', text: 'Cyber Crime Helpline 1930 pe call karo — turant' },
      { icon: '🌐', text: 'cybercrime.gov.in pe complaint darj karo' },
      { icon: '🏦', text: 'Apna bank contact karo: RBI Helpline 14440' },
      { icon: '📸', text: 'Is message/invoice ka screenshot lo — evidence ke liye' },
      { icon: '🔒', text: 'Apna UPI PIN change karo agar share kiya ho' },
      { icon: '👮', text: 'Local police station pe FIR file kar sakte ho' },
    ];
  }

  return {
    score, level, levelClass, levelIcon, levelSub,
    safePoints: [...new Set(safePoints)],
    redFlags: [...new Set(redFlags)],
    detailedAnalysis, actionItems, breakdown,
    showHelpline: score > 65
  };
}

// ─────────────────────────────────────
// UPI ID ANALYSIS HELPER
// ─────────────────────────────────────
function analyzeUpiId(upiId) {
  const flags = [];
  let pts = 0;
  const [local, bank] = upiId.split('@');
  const bankLower = (bank || '').toLowerCase();
  const localLower = (local || '').toLowerCase();

  // Valid bank handles
  const validBanks = [
    'okaxis', 'okhdfcbank', 'okicici', 'oksbi', 'ybl', 'ibl',
    'paytm', 'upi', 'apl', 'okbizaxis', 'oksbibank', 'axl',
    'rajgovhdfcbank', 'waaxis', 'wahdfcbank', 'waicici', 'wasbi',
    'timecosmos', 'jupiteraxis', 'icici', 'hdfcbank', 'sbi',
    'allbank', 'pnb', 'kotak', 'indus', 'aubank', 'barodampay',
    'centralbank', 'dbs', 'equitas', 'fbl', 'federal', 'idbi',
    'idfcfirst', 'indusind', 'kbl', 'kvb', 'lvb', 'mahb',
    'rbl', 'scb', 'sib', 'tjsb', 'ucbi', 'united', 'vijaya'
  ];

  // Misspelled bank check
  const misspelledBanks = {
    'hdffcbank': 'hdfcbank',
    'sbi1': 'sbi',
    'okicic': 'okicici',
    'okhdfcc': 'okhdfcbank',
    'payytm': 'paytm',
    'paatm': 'paytm',
    'yb1': 'ybl',
    'ibi': 'ibl',
    'oksbb': 'oksbi',
  };

  if (misspelledBanks[bankLower]) {
    flags.push(`UPI bank handle "@${bank}" galat spell hua hai — "@${misspelledBanks[bankLower]}" hona chahiye tha`);
    pts += 25;
  } else if (!validBanks.includes(bankLower)) {
    flags.push(`UPI bank handle "@${bank}" unknown/unregistered lag raha hai`);
    pts += 15;
  }

  // Random characters check
  const randomPattern = /[a-z]{1,2}\d[a-z]{1,2}\d[a-z]{1,2}/.test(localLower);
  if (randomPattern && localLower.length < 12) {
    flags.push(`UPI local part "${local}" random characters jaisa lagta hai (e.g., x7k9p2)`);
    pts += 20;
  }

  // Too many numbers
  const numCount = (localLower.match(/\d/g) || []).length;
  if (numCount >= 10 && localLower.length >= 10) {
    flags.push(`UPI ID "${upiId}" mein bahut zyada numbers hain — suspicious`);
    pts += 12;
  }

  // Suspicious keywords
  const suspiciousWords = ['winner', 'prize', 'lucky', 'reward', 'free', 'offer', 'cash', 'jackpot'];
  for (const w of suspiciousWords) {
    if (localLower.includes(w)) {
      flags.push(`UPI ID mein "${w}" word hai — clear scam signal`);
      pts += 18;
      break;
    }
  }

  // All numbers, no name
  if (/^\d+$/.test(local) && local.length >= 10) {
    flags.push(`UPI ID "${upiId}" sirf numbers hai, koi naam nahi — medium risk`);
    pts += 8;
  }

  // Unusual chars
  if (/[^a-zA-Z0-9._\-+]/.test(local)) {
    flags.push(`UPI ID mein unusual special characters hain`);
    pts += 15;
  }

  let status = pts === 0 ? 'ok' : pts < 15 ? 'warn' : 'bad';
  return { flags, pts, status };
}

// ═══════════════════════════════════════════════
//  RENDER RESULT
// ═══════════════════════════════════════════════

function renderResult(r) {
  // Banner
  const banner = document.getElementById('riskBanner');
  banner.className = 'risk-banner ' + r.levelClass;
  document.getElementById('riskIcon').textContent = r.levelIcon;
  document.getElementById('riskLabel').textContent = r.level;
  document.getElementById('riskSublabel').textContent = r.levelSub;
  document.getElementById('scoreNum').textContent = r.score + '/100';

  // Animate score ring
  const ring = document.getElementById('scoreRing');
  const circumference = 201;
  const offset = circumference - (r.score / 100) * circumference;
  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
  }, 100);

  // Build report
  let html = '';

  // Safe Points
  if (r.safePoints.length > 0) {
    html += `<div class="report-section">
      <div class="report-section-title"><span>✅</span> Safe Points:</div>
      <div class="points-list">`;
    r.safePoints.forEach(p => {
      html += `<div class="point-item safe-point"><span class="point-dot">✔</span><span>${escHtml(p)}</span></div>`;
    });
    html += `</div></div>`;
  }

  // Red Flags
  if (r.redFlags.length > 0) {
    html += `<div class="report-section">
      <div class="report-section-title" style="color:#f87171"><span>⚠️</span> Red Flags Found (${r.redFlags.length}):</div>
      <div class="points-list">`;
    r.redFlags.forEach(f => {
      html += `<div class="point-item flag-point"><span class="point-dot">🚩</span><span>${escHtml(f)}</span></div>`;
    });
    html += `</div></div>`;
  }

  if (r.safePoints.length === 0 && r.redFlags.length === 0) {
    html += `<div class="point-item" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08)">
      <span class="point-dot">ℹ️</span><span>Details limited hain — UPI ID ya invoice number provide karo for full analysis.</span>
    </div>`;
  }

  // Detailed Analysis
  html += `<div class="report-section">
    <div class="report-section-title"><span>🔎</span> Detailed Analysis:</div>
    <div class="analysis-box">${escHtml(r.detailedAnalysis)}</div>
  </div>`;

  // Recommended Action
  html += `<div class="report-section">
    <div class="report-section-title"><span>💡</span> Recommended Action:</div>
    <div class="action-box">
      <div class="action-list">`;
  r.actionItems.forEach(a => {
    html += `<div class="action-item"><span>${a.icon}</span><span>${escHtml(a.text)}</span></div>`;
  });
  html += `</div></div></div>`;

  // Breakdown Table
  html += `<div class="report-section">
    <div class="report-section-title"><span>📊</span> Breakdown:</div>
    <table class="breakdown-table">
      <thead><tr><th>Check</th><th>Status</th><th>Risk Points</th></tr></thead>
      <tbody>`;
  r.breakdown.forEach(row => {
    const statusHtml = row.status === 'ok'  ? '<span class="status-ok">✅ OK</span>' :
                       row.status === 'warn' ? '<span class="status-warn">⚠️ Suspicious</span>' :
                       row.status === 'bad'  ? '<span class="status-bad">🚫 Red Flag</span>' :
                                              '<span class="status-na">— N/A</span>';
    const ptsClass = row.pts === 0 ? 'pts-green' : row.pts < 15 ? 'pts-yellow' : 'pts-red';
    const ptsLabel = row.pts > 0 ? `+${row.pts}` : '0';
    html += `<tr>
      <td>${escHtml(row.check)}</td>
      <td>${statusHtml}</td>
      <td><span class="risk-pts ${ptsClass}">${ptsLabel}</span></td>
    </tr>`;
  });
  // Total row
  html += `<tr style="background:rgba(255,255,255,0.04)">
    <td><strong>Total Risk Score</strong></td>
    <td><strong>${r.level}</strong></td>
    <td><strong class="risk-pts ${r.score <= 30 ? 'pts-green' : r.score <= 65 ? 'pts-yellow' : 'pts-red'}">${r.score}/100</strong></td>
  </tr>`;
  html += `</tbody></table></div>`;

  // Helpline alert for HIGH RISK
  if (r.showHelpline) {
    html += `<div class="helpline-alert">
      <div class="helpline-alert-icon">🆘</div>
      <div>
        <div style="font-weight:700;color:#fca5a5;margin-bottom:6px">Turant Helplines Pe Call Karo:</div>
        <div class="helpline-nums">
          <span class="helpline-chip">📞 1930 — Cyber Crime</span>
          <span class="helpline-chip">📞 14440 — RBI</span>
          <span class="helpline-chip">🌐 cybercrime.gov.in</span>
          <span class="helpline-chip">📞 1800-111-109 — NPCI</span>
        </div>
      </div>
    </div>`;
  }

  // Footer
  html += `<div style="text-align:center;padding:12px 0 4px;color:var(--text3);font-size:12px;">
    ⚡ Powered by <strong style="color:var(--text2)">UPI Shield AI</strong> — Protecting Indian Businesses
  </div>`;

  document.getElementById('reportBody').innerHTML = html;
}

// ── ESCAPE HTML ────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── KEYBOARD SHORTCUT ──────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const btn = document.getElementById('analyzeBtn');
    if (!btn.disabled) analyzeInput();
  }
});
