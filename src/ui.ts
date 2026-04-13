export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Header Auditor — HTTP Security Scanner</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --surface-2: #1c2129;
      --border: #30363d;
      --text: #e6edf3;
      --text-secondary: #8b949e;
      --orange: #f6821f;
      --orange-dim: rgba(246, 130, 31, 0.15);
      --green: #3fb950;
      --green-dim: rgba(63, 185, 80, 0.15);
      --yellow: #d29922;
      --yellow-dim: rgba(210, 153, 34, 0.15);
      --red: #f85149;
      --red-dim: rgba(248, 81, 73, 0.15);
      --blue: #58a6ff;
      --blue-dim: rgba(88, 166, 255, 0.15);
      --radius: 10px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container { max-width: 820px; margin: 0 auto; padding: 0 20px; }

    header {
      border-bottom: 1px solid var(--border);
      padding: 20px 0;
      margin-bottom: 40px;
    }

    header .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: var(--orange);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .badge-cf {
      font-size: 12px;
      padding: 4px 10px;
      background: var(--orange-dim);
      color: var(--orange);
      border-radius: 20px;
      font-weight: 600;
    }

    .hero {
      text-align: center;
      margin-bottom: 40px;
    }

    .hero h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .hero p {
      color: var(--text-secondary);
      font-size: 16px;
      max-width: 520px;
      margin: 0 auto;
    }

    .search-box {
      display: flex;
      gap: 10px;
      max-width: 600px;
      margin: 30px auto 0;
    }

    .search-box input {
      flex: 1;
      padding: 14px 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-box input:focus {
      border-color: var(--orange);
    }

    .search-box input::placeholder {
      color: var(--text-secondary);
    }

    .btn {
      padding: 14px 28px;
      background: var(--orange);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      white-space: nowrap;
    }

    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .error-msg {
      text-align: center;
      margin-top: 16px;
      color: var(--red);
      font-size: 14px;
    }

    #results { margin-top: 40px; display: none; }

    .score-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      display: flex;
      align-items: center;
      gap: 32px;
      margin-bottom: 24px;
    }

    .score-ring {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }

    .score-ring svg {
      transform: rotate(-90deg);
      width: 120px;
      height: 120px;
    }

    .score-ring .track {
      fill: none;
      stroke: var(--border);
      stroke-width: 8;
    }

    .score-ring .progress {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease, stroke 0.5s;
    }

    .score-label {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .score-number {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .score-grade {
      font-size: 14px;
      font-weight: 600;
      margin-top: 2px;
    }

    .score-meta { flex: 1; }

    .score-meta h2 {
      font-size: 18px;
      margin-bottom: 4px;
    }

    .score-meta .url-display {
      font-size: 13px;
      color: var(--text-secondary);
      word-break: break-all;
      margin-bottom: 12px;
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 20px;
      font-weight: 600;
    }

    .tag-cf { background: var(--orange-dim); color: var(--orange); }
    .tag-cached { background: var(--blue-dim); color: var(--blue); }
    .tag-present { background: var(--green-dim); color: var(--green); }
    .tag-missing { background: var(--red-dim); color: var(--red); }
    .tag-misconfig { background: var(--yellow-dim); color: var(--yellow); }

    .section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 16px;
      overflow: hidden;
    }

    .section-header {
      padding: 16px 20px;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-body { padding: 20px; }

    .ai-summary {
      font-size: 15px;
      line-height: 1.7;
      color: var(--text);
    }

    .action-list {
      list-style: none;
      counter-reset: actions;
    }

    .action-list li {
      counter-increment: actions;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
      font-size: 14px;
      display: flex;
      gap: 12px;
      line-height: 1.5;
    }

    .action-list li:last-child { border-bottom: none; }

    .action-list li::before {
      content: counter(actions);
      min-width: 24px;
      height: 24px;
      background: var(--orange-dim);
      color: var(--orange);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .issue-card {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .issue-card:last-child { border-bottom: none; }

    .issue-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .severity {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .sev-critical { background: var(--red-dim); color: var(--red); }
    .sev-high { background: var(--red-dim); color: var(--red); }
    .sev-medium { background: var(--yellow-dim); color: var(--yellow); }
    .sev-low { background: var(--blue-dim); color: var(--blue); }
    .sev-info { background: var(--green-dim); color: var(--green); }

    .status-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-missing { background: var(--red-dim); color: var(--red); }
    .status-misconfigured { background: var(--yellow-dim); color: var(--yellow); }
    .status-present { background: var(--green-dim); color: var(--green); }

    .issue-header-name {
      font-weight: 600;
      font-size: 14px;
    }

    .issue-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      line-height: 1.5;
    }

    .issue-fix {
      font-size: 13px;
      color: var(--text);
      line-height: 1.5;
    }

    .issue-cf-fix {
      font-size: 13px;
      color: var(--orange);
      margin-top: 4px;
      line-height: 1.5;
    }

    .raw-headers-toggle {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
      padding: 16px 20px;
      width: 100%;
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .raw-headers-toggle:hover { color: var(--text); }

    .raw-headers-content {
      display: none;
      padding: 0 20px 16px;
    }

    .raw-headers-content.open { display: block; }

    .raw-headers-content pre {
      background: var(--bg);
      padding: 16px;
      border-radius: 6px;
      font-size: 12px;
      font-family: "SF Mono", "Fira Code", monospace;
      overflow-x: auto;
      line-height: 1.7;
      color: var(--text-secondary);
    }

    .spinner {
      display: none;
      text-align: center;
      padding: 60px 0;
    }

    .spinner.active { display: block; }

    .spin-ring {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border);
      border-top-color: var(--orange);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .spinner p {
      color: var(--text-secondary);
      font-size: 14px;
    }

    footer {
      text-align: center;
      padding: 40px 0;
      color: var(--text-secondary);
      font-size: 12px;
      border-top: 1px solid var(--border);
      margin-top: 40px;
    }

    @media (max-width: 640px) {
      .score-card { flex-direction: column; text-align: center; }
      .tag-row { justify-content: center; }
      .hero h1 { font-size: 24px; }
      .search-box { flex-direction: column; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo">
        <div class="logo-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2" fill="white"/></svg>
        </div>
        Header Auditor
      </div>
      <span class="badge-cf">Powered by Workers AI</span>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <h1>HTTP Security Header Audit</h1>
      <p>Scan any URL to get an instant security assessment with Cloudflare-specific remediation steps.</p>
      <div class="search-box">
        <input type="text" id="urlInput" placeholder="Enter a URL — e.g. cloudflare.com" autocomplete="off" spellcheck="false">
        <button class="btn" id="scanBtn" onclick="startScan()">Scan</button>
      </div>
      <div class="error-msg" id="errorMsg"></div>
    </div>

    <div class="spinner" id="spinner">
      <div class="spin-ring"></div>
      <p>Fetching headers &amp; running AI analysis&hellip;</p>
    </div>

    <div id="results"></div>
  </main>

  <footer>
    <div class="container">
      Built with Cloudflare Workers &middot; Workers AI &middot; KV
    </div>
  </footer>

  <script>
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('scanBtn');
    const spinner = document.getElementById('spinner');
    const errorMsg = document.getElementById('errorMsg');
    const results = document.getElementById('results');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startScan();
    });

    async function startScan() {
      const url = input.value.trim();
      if (!url) { showError('Please enter a URL.'); return; }

      showError('');
      results.style.display = 'none';
      results.innerHTML = '';
      btn.disabled = true;
      spinner.classList.add('active');

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          showError(data.error || 'Scan failed. Please try again.');
          return;
        }

        renderResults(data);
      } catch (err) {
        showError('Network error. Please check your connection and try again.');
      } finally {
        btn.disabled = false;
        spinner.classList.remove('active');
      }
    }

    function showError(msg) {
      errorMsg.textContent = msg;
    }

    function getScoreColor(score) {
      if (score >= 80) return 'var(--green)';
      if (score >= 55) return 'var(--yellow)';
      return 'var(--red)';
    }

    function renderResults(data) {
      const color = getScoreColor(data.score);
      const circumference = 2 * Math.PI * 50;
      const offset = circumference - (data.score / 100) * circumference;

      let tags = '';
      if (data.isCloudflare) tags += '<span class="tag tag-cf">Cloudflare Detected</span>';
      if (data.cached) tags += '<span class="tag tag-cached">Cached Result</span>';
      const sec = data.headers.security;
      tags += '<span class="tag tag-present">' + sec.present.length + ' Present</span>';
      if (sec.missing.length) tags += '<span class="tag tag-missing">' + sec.missing.length + ' Missing</span>';
      if (sec.misconfigured.length) tags += '<span class="tag tag-misconfig">' + sec.misconfigured.length + ' Misconfigured</span>';

      let issuesHtml = data.issues
        .filter(i => i.status !== 'present')
        .sort((a, b) => sevOrder(a.severity) - sevOrder(b.severity))
        .map(i => issueCard(i)).join('');

      const presentHtml = data.issues
        .filter(i => i.status === 'present')
        .map(i => issueCard(i)).join('');

      const actions = (data.aiAnalysis.prioritizedActions || [])
        .map(a => '<li>' + esc(a) + '</li>').join('');

      const rawHeaders = Object.entries(data.headers.raw || {})
        .map(([k, v]) => esc(k) + ': ' + esc(v)).join('\\n');

      results.innerHTML =
        '<div class="score-card">' +
          '<div class="score-ring">' +
            '<svg viewBox="0 0 120 120">' +
              '<circle class="track" cx="60" cy="60" r="50"/>' +
              '<circle class="progress" cx="60" cy="60" r="50" stroke="' + color + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>' +
            '</svg>' +
            '<div class="score-label">' +
              '<span class="score-number" style="color:' + color + '">' + data.score + '</span>' +
              '<span class="score-grade" style="color:' + color + '">' + esc(data.grade) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="score-meta">' +
            '<h2>Security Score</h2>' +
            '<div class="url-display">' + esc(data.finalUrl || data.url) + '</div>' +
            '<div class="tag-row">' + tags + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="section">' +
          '<div class="section-header">AI Analysis</div>' +
          '<div class="section-body ai-summary">' + esc(data.aiAnalysis.summary || '') + '</div>' +
        '</div>' +

        (actions ? '<div class="section">' +
          '<div class="section-header">Prioritized Actions</div>' +
          '<div class="section-body"><ol class="action-list">' + actions + '</ol></div>' +
        '</div>' : '') +

        (data.aiAnalysis.overallAssessment ? '<div class="section">' +
          '<div class="section-header">Overall Assessment</div>' +
          '<div class="section-body ai-summary">' + esc(data.aiAnalysis.overallAssessment) + '</div>' +
        '</div>' : '') +

        (issuesHtml ? '<div class="section">' +
          '<div class="section-header">Issues Found</div>' +
          issuesHtml +
        '</div>' : '') +

        (presentHtml ? '<div class="section">' +
          '<div class="section-header">Passing Headers</div>' +
          presentHtml +
        '</div>' : '') +

        '<div class="section">' +
          '<button class="raw-headers-toggle" onclick="toggleRaw()">' +
            '<span>Raw Response Headers</span>' +
            '<span id="rawArrow">&#9654;</span>' +
          '</button>' +
          '<div class="raw-headers-content" id="rawContent">' +
            '<pre>' + rawHeaders + '</pre>' +
          '</div>' +
        '</div>';

      results.style.display = 'block';
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function issueCard(i) {
      let html = '<div class="issue-card"><div class="issue-top">' +
        '<span class="severity sev-' + i.severity + '">' + esc(i.severity) + '</span>' +
        '<span class="status-badge status-' + i.status + '">' + esc(i.status) + '</span>' +
        '<span class="issue-header-name">' + esc(i.header) + '</span>' +
      '</div>';
      html += '<div class="issue-desc">' + esc(i.description) + '</div>';
      if (i.status !== 'present') {
        html += '<div class="issue-fix">' + esc(i.recommendation) + '</div>';
        if (i.cloudflareRemedy) {
          html += '<div class="issue-cf-fix">Cloudflare: ' + esc(i.cloudflareRemedy) + '</div>';
        }
      }
      html += '</div>';
      return html;
    }

    function sevOrder(s) {
      return { critical: 0, high: 1, medium: 2, low: 3, info: 4 }[s] || 5;
    }

    function toggleRaw() {
      const content = document.getElementById('rawContent');
      const arrow = document.getElementById('rawArrow');
      content.classList.toggle('open');
      arrow.innerHTML = content.classList.contains('open') ? '&#9660;' : '&#9654;';
    }

    function esc(s) {
      if (!s) return '';
      const d = document.createElement('div');
      d.textContent = String(s);
      return d.innerHTML;
    }
  </script>
</body>
</html>`;
}
