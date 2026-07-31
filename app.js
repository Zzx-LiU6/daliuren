import { getLiuRenByDate } from 'https://esm.sh/liuren-ts-lib@3.0.0';

const loadingStatus = document.getElementById('loadingStatus');
loadingStatus.textContent = '✅ 排盘库加载成功';
loadingStatus.style.color = '#3fb950';
console.log('✅ 大六壬库加载成功');

// ================================================================
// ===== DOM 引用 =====
// ================================================================

const $ = id => document.getElementById(id);
const datetimeInput = $('datetimeInput');
const resultArea = $('resultArea');
const platformInline = $('platformInline');
const copyBtn = $('copyBtn');

function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function formatLocalDatetime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setNow() {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    datetimeInput.value = formatLocalDatetime(now);
    showToast('📌 已恢复当前时间');
}
setNow();

let currentResult = null;

function doPaiPan() {
    const val = datetimeInput.value;
    if (!val) {
        showToast('⚠️ 请选择日期时间');
        return;
    }
    const date = new Date(val);
    if (isNaN(date.getTime())) {
        showToast('⚠️ 日期格式无效');
        return;
    }

    try {
        const result = getLiuRenByDate(date);
        currentResult = result;
        renderResult(result);
        resultArea.classList.remove('hidden');
        generateOutput();
        // 隐藏AI平台选项（排盘后自动收起）
        platformInline.classList.remove('open');
        // 恢复复制按钮文字
        copyBtn.textContent = '📋 复制';
        showToast('✅ 排盘完成');
    } catch (e) {
        showToast('⚠️ 排盘出错: ' + e.message);
        console.error(e);
    }
}

function renderResult(r) {
    const d = r.dateInfo;
    $('displayDate').textContent = d.date || '—';
    $('displayBazi').textContent = d.bazi || '—';
    $('displayYueJiang').textContent = d.yuejiang || '—';
    $('displayKong').textContent = d.kong ? d.kong.join('、') : '—';
    $('displayKeTi').textContent = r.sanChuan?.keTi || '—';

    const diPan = r.tianDiPan?.diPan || {};
    const tianPan = r.tianDiPan?.tianPan || {};
    const tianJiang = r.tianDiPan?.tianJiang || {};
    $('displayDiPan').textContent = Object.values(diPan).join(' ') || '—';
    $('displayTianPan').textContent = Object.values(tianPan).join(' ') || '—';
    $('displayTianJiang').textContent = Object.values(tianJiang).join(' ') || '—';

    const ke = r.siKe || {};
    $('ke1').textContent = ke.ke1 ? ke.ke1.join(' ') : '—';
    $('ke2').textContent = ke.ke2 ? ke.ke2.join(' ') : '—';
    $('ke3').textContent = ke.ke3 ? ke.ke3.join(' ') : '—';
    $('ke4').textContent = ke.ke4 ? ke.ke4.join(' ') : '—';

    const sc = r.sanChuan || {};
    const fmt = (arr) => arr ? arr.join(' ') : '—';
    $('chuChuan').textContent = fmt(sc.chuChuan);
    $('zhongChuan').textContent = fmt(sc.zhongChuan);
    $('moChuan').textContent = fmt(sc.moChuan);

    const shenSha = r.shenSha || [];
    const top = shenSha.slice(0, 12);
    if (top.length > 0) {
        $('displayShenSha').innerHTML = top.map(s =>
            `<span class="shensha-item"><span class="shensha-name">${s.name}</span>：${s.value}</span>`
        ).join('');
    } else {
        $('displayShenSha').innerHTML = '<span class="text-muted" style="font-size:13px;">无</span>';
    }
    // 同时生成推导教程
    renderStepGuide(r);
}

// ================================================================
// ===== 推导教程生成 =====
// ================================================================

function renderStepGuide(r) {
    const container = document.getElementById('stepGuideContainer');
    if (!r) {
        container.innerHTML = '<p class="text-muted" style="padding:16px 0;">请先排盘生成推导教程。</p>';
        return;
    }

    const d = r.dateInfo;
    const diPan = r.tianDiPan?.diPan || {};
    const tianPan = r.tianDiPan?.tianPan || {};
    const tianJiang = r.tianDiPan?.tianJiang || {};
    const ke = r.siKe || {};
    const sc = r.sanChuan || {};

    // 获取日干日支（从八字中取）
    const bazi = d.bazi || '';
    const parts = bazi.split(' ');
    const riGan = parts.length >= 3 ? parts[2].charAt(0) : '?';
    const riZhi = parts.length >= 3 ? parts[2].charAt(1) : '?';
    const zhanShi = parts.length >= 4 ? parts[3].charAt(1) : '?';

    // 构造推导教程 HTML
    let html = '<div class="step-guide">';

    // ---- 步骤1：定月将 ----
    html += `
        <div class="step-block">
            <div class="step-title">第一步：定月将</div>
            <div class="step-desc">
                当前时间 <span class="value">${d.date || '—'}</span>，节气已过，月将为 <span class="highlight">${d.yuejiang || '—'}</span>。
            </div>
            <div class="step-result">
                <span class="label">→ 月将 = </span>${d.yuejiang || '—'}
            </div>
        </div>
    `;

    // ---- 步骤2：排天地盘 ----
    const diPanStr = Object.values(diPan).join('、');
    const tianPanStr = Object.values(tianPan).join('、');
    const tianJiangStr = Object.values(tianJiang).join('、');
    html += `
        <div class="step-block">
            <div class="step-title">第二步：排天地盘</div>
            <div class="step-desc">
                地盘固定：<span class="value">${diPanStr || '—'}</span><br />
                月将 <span class="highlight">${d.yuejiang || '—'}</span> 加临占时 <span class="highlight">${zhanShi || '—'}</span>，天盘顺布。
            </div>
            <div class="step-result">
                <span class="label">→ 天盘：</span>${tianPanStr || '—'}<br />
                <span class="label">→ 天将：</span>${tianJiangStr || '—'}
            </div>
        </div>
    `;

    // ---- 步骤3：起四课 ----
    const ke1 = ke.ke1 ? ke.ke1.join(' ') : '—';
    const ke2 = ke.ke2 ? ke.ke2.join(' ') : '—';
    const ke3 = ke.ke3 ? ke.ke3.join(' ') : '—';
    const ke4 = ke.ke4 ? ke.ke4.join(' ') : '—';
    html += `
        <div class="step-block">
            <div class="step-title">第三步：起四课</div>
            <div class="step-desc">
                日干 <span class="highlight">${riGan}</span> 寄宫，逐课取天盘、天将。
            </div>
            <div class="step-result">
                <span class="label">第一课：</span>${ke1}<br />
                <span class="label">第二课：</span>${ke2}<br />
                <span class="label">第三课：</span>${ke3}<br />
                <span class="label">第四课：</span>${ke4}
            </div>
        </div>
    `;

    // ---- 步骤4：定三传 ----
    const fmt = (arr) => arr ? arr.join(' ') : '—';
    const chu = fmt(sc.chuChuan);
    const zhong = fmt(sc.zhongChuan);
    const mo = fmt(sc.moChuan);
    const keTi = sc.keTi || '—';
    html += `
        <div class="step-block">
            <div class="step-title">第四步：定三传</div>
            <div class="step-desc">
                根据四课生克关系，定三传与课体。
            </div>
            <div class="step-result">
                <span class="label">初传：</span>${chu}<br />
                <span class="label">中传：</span>${zhong}<br />
                <span class="label">末传：</span>${mo}<br />
                <span class="label">课体：</span>${keTi}
            </div>
        </div>
    `;

    // ---- 步骤5：课式总览 ----
    html += `
        <div class="step-block" style="border-left-color:#f0883e;">
            <div class="step-title" style="color:#f0883e;">📋 课式总览</div>
            <div class="step-result" style="background:#161b22;border-color:#30363d;">
                <span class="label">四课：</span><br />
                &nbsp;&nbsp;${ke1}<br />
                &nbsp;&nbsp;${ke2}<br />
                &nbsp;&nbsp;${ke3}<br />
                &nbsp;&nbsp;${ke4}<br />
                <span class="label">三传：</span>${chu} → ${zhong} → ${mo}<br />
                <span class="label">课体：</span>${keTi}
            </div>
        </div>
    `;

    html += '</div>';
    container.innerHTML = html;
}

function generateOutput() {
    if (!currentResult) {
        $('outputText').value = '请先排盘。';
        return;
    }
    $('outputText').value = formatAIOutput(currentResult);
}

function formatAIOutput(r) {
    const d = r.dateInfo;
    const lines = [];
    lines.push('【大六壬课式记录】');
    lines.push('');
    lines.push(`时间：${d.date || '—'}`);
    lines.push(`八字：${d.bazi || '—'}`);
    lines.push(`月将：${d.yuejiang || '—'}`);
    lines.push(`空亡：${d.kong ? d.kong.join('、') : '—'}`);
    lines.push(`课体：${r.sanChuan?.keTi || '—'}`);
    lines.push('');

    const diPan = Object.values(r.tianDiPan?.diPan || {}).join(' ');
    const tianPan = Object.values(r.tianDiPan?.tianPan || {}).join(' ');
    const tianJiang = Object.values(r.tianDiPan?.tianJiang || {}).join(' ');
    lines.push('【天地盘】');
    lines.push(`地盘：${diPan || '—'}`);
    lines.push(`天盘：${tianPan || '—'}`);
    lines.push(`天将：${tianJiang || '—'}`);
    lines.push('');

    const ke = r.siKe || {};
    lines.push('【四课】');
    lines.push(`第一课：${ke.ke1 ? ke.ke1.join(' ') : '—'}`);
    lines.push(`第二课：${ke.ke2 ? ke.ke2.join(' ') : '—'}`);
    lines.push(`第三课：${ke.ke3 ? ke.ke3.join(' ') : '—'}`);
    lines.push(`第四课：${ke.ke4 ? ke.ke4.join(' ') : '—'}`);
    lines.push('');

    const sc = r.sanChuan || {};
    const fmt = (arr) => arr ? arr.join(' ') : '—';
    lines.push('【三传】');
    lines.push(`初传：${fmt(sc.chuChuan)}`);
    lines.push(`中传：${fmt(sc.zhongChuan)}`);
    lines.push(`末传：${fmt(sc.moChuan)}`);
    lines.push(`课体：${sc.keTi || '—'}`);
    lines.push('');

    const shenSha = r.shenSha || [];
    if (shenSha.length > 0) {
        lines.push('【神煞（主要）】');
        shenSha.slice(0, 15).forEach(s => {
            lines.push(`  ${s.name}：${s.value}${s.description ? `（${s.description}）` : ''}`);
        });
        if (shenSha.length > 15) lines.push(`  ... 共 ${shenSha.length} 项`);
        lines.push('');
    }

    lines.push('【请解读】请根据以上大六壬课式，针对我的问题进行详细解读。');
    return lines.join('\n');
}

// ================================================================
// ===== 复制 + AI 平台展开（核心改动） =====
// ================================================================

function copyAndShowPlatforms() {
    const text = $('outputText').value;
    if (!text || text === '请先排盘。' || text === '请先排盘生成…') {
        showToast('⚠️ 请先排盘生成内容');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        // 复制成功后，改变按钮状态，展开AI平台
        copyBtn.textContent = '✅ 已复制！';
        copyBtn.className = 'btn btn-success';
        platformInline.classList.add('open');
        showToast('📋 已复制！选择下方 AI 平台');
    }).catch(() => {
        // 降级方案
        const ta = $('outputText');
        ta.select();
        document.execCommand('copy');
        copyBtn.textContent = '✅ 已复制！';
        copyBtn.className = 'btn btn-success';
        platformInline.classList.add('open');
        showToast('📋 已复制！选择下方 AI 平台');
    });
}

function openAI(platform) {
    const urls = {
        chatgpt: 'https://chat.openai.com/',
        deepseek: 'https://chat.deepseek.com/',
        gemini: 'https://gemini.google.com/',
        claude: 'https://claude.ai/'
    };
    if (urls[platform]) {
        window.open(urls[platform], '_blank');
        showToast('🔗 已打开 ' + platform.charAt(0).toUpperCase() + platform.slice(1));
    }
}

function resetAll() {
    currentResult = null;
    resultArea.classList.add('hidden');
    $('outputText').value = '';
    platformInline.classList.remove('open');
    copyBtn.textContent = '📋 复制';
    copyBtn.className = 'btn btn-primary';
    setNow();
    showToast('↺ 已重置');
}

// ================================================================
// ===== 事件绑定 =====
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    $('paiPanBtn').addEventListener('click', doPaiPan);
    $('nowBtn').addEventListener('click', setNow);
    $('resetBtn').addEventListener('click', resetAll);

    // 复制按钮：复制 + 展开AI平台
    copyBtn.addEventListener('click', copyAndShowPlatforms);

    // AI平台按钮（内联）
    document.querySelectorAll('#platformInline .btn[data-platform]').forEach(btn => {
        btn.addEventListener('click', function() {
            openAI(this.dataset.platform);
        });
    });

    datetimeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            doPaiPan();
        }
    });
    // ===== 视图切换（课式结果 / 推导教程） =====
    const viewResultBtn = document.getElementById('viewResultBtn');
    const viewGuideBtn = document.getElementById('viewGuideBtn');
    const viewResultContent = document.getElementById('viewResultContent');
    const viewGuideContent = document.getElementById('viewGuideContent');

    function switchView(view) {
        if (view === 'result') {
            viewResultContent.classList.remove('hidden');
            viewGuideContent.classList.add('hidden');
            viewResultBtn.classList.add('active');
            viewGuideBtn.classList.remove('active');
        } else {
            viewResultContent.classList.add('hidden');
            viewGuideContent.classList.remove('hidden');
            viewGuideBtn.classList.add('active');
            viewResultBtn.classList.remove('active');
        }
    }

    viewResultBtn.addEventListener('click', () => switchView('result'));
    viewGuideBtn.addEventListener('click', () => switchView('guide'));
});
