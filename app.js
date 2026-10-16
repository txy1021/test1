/* ==========================================================
   甄嬛传后宫生存测试系统 · 主逻辑
   ========================================================== */
(function () {
  'use strict';

  var Q_SIZE = 25;
  var STORE_KEY = 'hougong_survival_v1';
  var TOTAL_EP = 76;

  /* 生存指数权重：隐忍 > 心机 > 共情 > 野心 */
  var W = [0.26, 0.22, 0.36, 0.16];

  var DIMS = window.DIMS;                 /* [心机, 共情, 隐忍, 野心] */
  var CHARS = window.CHARACTERS;
  var LADDER = window.RANK_LADDER;

  var state = { qs: [], answers: [], idx: 0, result: null };

  function $(id) { return document.getElementById(id); }
  var views = { home: $('view-home'), quiz: $('view-quiz'), result: $('view-result') };

  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('is-show'); }, 2200);
  }

  /* ---------------- 首页渲染 ---------------- */
  function renderDimCards() {
    $('dim-cards').innerHTML = DIMS.map(function (d, i) {
      return '<article class="dim-card" style="--c:' + d.color + '">' +
        '<div class="dim-idx">属性 ' + String(i + 1).padStart(2, '0') + '</div>' +
        '<h3 class="dim-name">' + d.name + '值</h3>' +
        '<div class="dim-en">' + d.en + '</div>' +
        '<p class="dim-desc">' + d.desc + '</p>' +
        '</article>';
    }).join('');
  }

  function renderGallery() {
    $('gallery').innerHTML = CHARS.map(function (c) {
      return '<figure class="fig-card">' +
        '<div class="portrait-frame" data-portrait="' + c.key + '"></div>' +
        '<figcaption class="fig-name">' + c.name + '</figcaption>' +
        '<div class="fig-rank">' + c.rank + ' · 约 ' + c.ep + ' 集</div>' +
        '<p class="fig-line">' + c.line + '</p>' +
        '</figure>';
    }).join('');
    CHARS.forEach(function (c) {
      var box = document.querySelector('[data-portrait="' + c.key + '"]');
      if (box) window.Portrait.mount(box, c);
    });
  }

  /* ---------------- 抽题 ---------------- */
  function pickQuestions() {
    return shuffle(window.QB).slice(0, Q_SIZE).map(function (q) {
      var order = shuffle([0, 1, 2, 3]);
      return {
        t: q.t,
        scene: q.q,
        options: order.map(function (orig) {
          return { text: q.o[orig][0], d: q.o[orig][1] };
        })
      };
    });
  }

  function startQuiz() {
    state.qs = pickQuestions();
    state.answers = new Array(Q_SIZE).fill(-1);
    state.idx = 0;
    state.result = null;
    renderDots();
    go('quiz');
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 答题页 ---------------- */
  function renderDots() {
    $('dots').innerHTML = state.qs.map(function (_, i) {
      return '<button type="button" class="dot" data-i="' + i + '">' + String(i + 1).padStart(2, '0') + '</button>';
    }).join('');
    $('dots').querySelectorAll('.dot').forEach(function (d) {
      d.addEventListener('click', function () {
        state.idx = parseInt(d.getAttribute('data-i'), 10);
        renderQuestion();
      });
    });
    updateDots();
  }

  function updateDots() {
    $('dots').querySelectorAll('.dot').forEach(function (d) {
      var i = parseInt(d.getAttribute('data-i'), 10);
      d.classList.toggle('done', state.answers[i] >= 0);
      d.classList.toggle('current', i === state.idx);
    });
  }

  function renderQuestion() {
    var q = state.qs[state.idx];
    $('q-tag').textContent = q.t;
    $('q-index').textContent = '第 ' + String(state.idx + 1).padStart(2, '0') + ' 题';
    $('q-scene').textContent = q.scene;
    $('progress-text').textContent = String(state.idx + 1).padStart(2, '0') + ' / ' + Q_SIZE;
    var done = state.answers.filter(function (a) { return a >= 0; }).length;
    $('progress-count').textContent = '已作答 ' + done + ' 题';
    $('progress-bar').style.width = ((state.idx + (state.answers[state.idx] >= 0 ? 1 : 0)) / Q_SIZE * 100) + '%';

    $('options').innerHTML = q.options.map(function (op, i) {
      var sel = state.answers[state.idx] === i ? ' is-selected' : '';
      return '<button type="button" class="option' + sel + '" data-i="' + i + '" role="radio" aria-checked="' + (sel ? 'true' : 'false') + '">' +
        '<span class="option-key">' + 'ABCD'[i] + '</span>' +
        '<span class="option-text">' + op.text + '</span></button>';
    }).join('');
    $('options').querySelectorAll('.option').forEach(function (b) {
      b.addEventListener('click', function () { choose(parseInt(b.getAttribute('data-i'), 10)); });
    });

    $('btn-prev').disabled = state.idx === 0;
    $('btn-next').textContent = state.idx === Q_SIZE - 1 ? '呈 递 答 卷' : '下一题';
    updateDots();
  }

  function choose(i) {
    var was = state.answers[state.idx] >= 0;
    state.answers[state.idx] = i;
    renderQuestion();
    if (!was) {
      setTimeout(function () {
        if (state.idx < Q_SIZE - 1) { state.idx++; renderQuestion(); }
        else if (state.answers.every(function (a) { return a >= 0; })) { finish(); }
      }, 400);
    }
  }

  function next() {
    if (state.answers[state.idx] < 0) { toast('请先择一项再往下走'); return; }
    if (state.idx < Q_SIZE - 1) { state.idx++; renderQuestion(); }
    else { finish(); }
  }

  /* ---------------- 计分 ---------------- */
  function computeResult() {
    var raw = [0, 0, 0, 0];
    state.answers.forEach(function (a, i) {
      var d = state.qs[i].options[a].d;
      for (var k = 0; k < 4; k++) raw[k] += d[k];
    });

    var total = raw.reduce(function (a, b) { return a + b; }, 0) || 1;
    var pct = raw.map(function (v) { return Math.round(v / total * 100); });
    /* 修正舍入误差 */
    var sum = pct.reduce(function (a, b) { return a + b; }, 0);
    var maxI = 0;
    for (var k = 1; k < 4; k++) if (pct[k] > pct[maxI]) maxI = k;
    pct[maxI] += 100 - sum;

    var X = pct[0], E = pct[1], P = pct[2], A = pct[3];
    var s = W[0] * X + W[1] * E + W[2] * P + W[3] * A;
    s -= 0.55 * Math.max(0, A - 34);         /* 野心过盛，必遭反噬 */
    s -= 0.30 * Math.max(0, 10 - A);          /* 毫无进心，易被边缘 */
    s -= 0.25 * Math.max(0, E - 42);           /* 心肠过软，反受其累 */
    s -= 0.25 * Math.max(0, 10 - X);           /* 过于天真，看不懂局 */
    s = clamp(s, 0, 50);

    /* 人物匹配：四维配比 + 生存指数 的加权距离 */
    var best = CHARS[0], bestD = Infinity;
    CHARS.forEach(function (c) {
      var d = 0;
      for (var k = 0; k < 4; k++) {
        var diff = pct[k] - c.v[k];
        d += diff * diff;
      }
      var sd = 1.2 * (s - c.s);
      d += sd * sd;
      if (d < bestD) { bestD = d; best = c; }
    });

    var f = 0.6 * s + 0.4 * best.s;
    var ep = clamp(Math.round((f - 8) / 24 * 74 + 2), 2, TOTAL_EP);
    var rankIdx = rankIndexOf(ep);

    var order = [0, 1, 2, 3].sort(function (a, b) { return pct[b] - pct[a]; });
    return {
      raw: raw, pct: pct, s: s, f: f, ep: ep, rank: LADDER[rankIdx], rankIdx: rankIdx,
      char: best, top: order[0], second: order[1], lowIdx: order[3]
    };
  }

  function rankIndexOf(ep) {
    if (ep <= 10) return 0;
    if (ep <= 20) return 1;
    if (ep <= 30) return 2;
    if (ep <= 42) return 3;
    if (ep <= 52) return 4;
    if (ep <= 62) return 5;
    if (ep <= 70) return 6;
    if (ep <= 74) return 7;
    if (ep <= 76) return 8;
    return 9;
  }

  function finish() {
    if (!state.answers.every(function (a) { return a >= 0; })) {
      var miss = state.answers.indexOf(-1);
      state.idx = miss;
      renderQuestion();
      toast('尚有未答之题，已移至第 ' + (miss + 1) + ' 题');
      return;
    }
    state.result = computeResult();
    saveResult();
    go('result');
    renderResult(state.result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 结果页 ---------------- */
  function renderResult(r) {
    var c = r.char, p = r.pct;
    var dim = DIMS;

    $('r-ep').textContent = r.ep;
    $('r-rank').textContent = r.rank;
    $('r-summary').innerHTML =
      '以你的四维配比推演，你大约能走到第 <strong>' + r.ep + '</strong> 集，' +
      '最终位份止于<strong>' + r.rank + '</strong>。' +
      '其中<strong>' + dim[r.top].name + '</strong>最为突出（' + p[r.top] + '%），' +
      '而<strong>' + dim[r.lowIdx].name + '</strong>最薄（' + p[r.lowIdx] + '%）——' +
      '它往往就是你在宫中真正的关隘。';

    $('r-char').textContent = c.name;
    $('r-char-rank').textContent = c.rank + ' · 约 ' + c.ep + ' 集';
    $('r-char-name').textContent = '对标人物 · ' + c.name;
    $('r-char-desc').textContent = c.desc;
    $('r-char-why').innerHTML = '<strong>为何是你：</strong>' + c.tip + ' ' + diffText(r, c);

    window.Portrait.mount($('r-photo'), c);

    /* 属性条 */
    var base = 25;
    $('bars').innerHTML = DIMS.map(function (d, i) {
      return '<div class="bar-row' + (i === r.top ? ' is-top' : '') + '" style="--c:' + d.color + '">' +
        '<div class="bar-name">' + d.name + '</div>' +
        '<div class="bar-track"><div class="bar-fill" data-w="' + p[i] + '"></div>' +
        '<div class="bar-avg" style="left:' + base + '%"></div></div>' +
        '<div class="bar-val">' + p[i] + '%</div></div>';
    }).join('');
    requestAnimationFrame(function () {
      $('bars').querySelectorAll('.bar-fill').forEach(function (el) {
        el.style.width = el.getAttribute('data-w') + '%';
      });
    });

    $('r-bias').textContent = '细线为均匀分布基准（25%）；高于基准者即为你惯用的思维方式。';

    /* 雷达图：上=心机 右=共情 下=隐忍 左=野心 */
    window.HougongChart.drawRadar($('canvas-radar'), [
      { name: dim[0].name, color: dim[0].color, pct: p[0] },
      { name: dim[1].name, color: dim[1].color, pct: p[1] },
      { name: dim[2].name, color: dim[2].color, pct: p[2] },
      { name: dim[3].name, color: dim[3].color, pct: p[3] }
    ]);

    /* 位份阶梯 */
    $('ladder').innerHTML = LADDER.map(function (name, i) {
      var cls = i < r.rankIdx ? 'passed' : (i === r.rankIdx ? 'here' : '');
      return '<div class="ladder-step ' + cls + '">' +
        '<div class="ladder-bar" style="height:' + (10 + i * 3) + 'px"></div>' +
        '<div class="ladder-name">' + name + '</div></div>';
    }).join('');
    $('r-rank-note').textContent =
      '全剧共 76 集；此阶梯依你的生存指数（' + r.f.toFixed(1) + '）推演所得，低位份者多在风波初起时便已退场。';

    /* 生存指南 */
    $('r-good').textContent = dim[r.top].high;
    $('r-bad').textContent = dim[r.lowIdx].low;
    $('r-advice').textContent = adviceText(r);
    renderReview();
  }

  function diffText(r, c) {
    var diffs = [];
    for (var k = 0; k < 4; k++) {
      var d = r.pct[k] - c.v[k];
      if (Math.abs(d) >= 6) {
        diffs.push((d > 0 ? '高出' : '低于') + '她' + Math.abs(d) + '%的' + DIMS[k].name);
      }
    }
    if (!diffs.length) return '四项配比与她几乎重合，连犹豫的地方都相似。';
    return '相较而言，你' + diffs.join('，') + '。';
  }

  function adviceText(r) {
    var p = r.pct, a = [];
    if (p[3] > 34) a.push('把野心收三分，锋芒太露的人，往往最先被盯上。');
    if (p[3] < 14) a.push('不必害人，但至少要让人知道你想要什么——后宫不会犒赏无欲无求的人。');
    if (p[2] < 16) a.push('受得住气才等得到风，先出手的人常常先出局。');
    if (p[1] > 36) a.push('心软是美德，在宫里却是破绽；替人之前先想退路。');
    if (p[0] < 14) a.push('不必害人，但要看得懂局：分辨谁在借你的手。');
    if (p[0] > 34 && p[2] > 30) a.push('你已具备走到最后的资质，唯一要防的是「太像算计」被人先下手。');
    if (!a.length) a.push('四维均衡，是后宫最稀缺的天赋：不靠极端的手段，靠的是不被拿住把柄。');
    return a.join(' ');
  }

  /* ---------------- 本地存储 ---------------- */
  function saveResult() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        qs: state.qs, answers: state.answers, time: Date.now()
      }));
    } catch (e) { /* 隐私模式忽略 */ }
    updateLastBtn();
  }

  function loadSaved() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!d || !d.qs || d.qs.length !== Q_SIZE) return null;
      return d;
    } catch (e) { return null; }
  }

  function updateLastBtn() { $('btn-last').hidden = !loadSaved(); }

  function showSaved() {
    var d = loadSaved();
    if (!d) { toast('尚无旧档'); return; }
    state.qs = d.qs; state.answers = d.answers;
    state.result = computeResult();
    go('result');
    renderResult(state.result);
  }

  /* ---------------- 视图切换 ---------------- */
  function go(name) {
    Object.keys(views).forEach(function (k) { views[k].classList.toggle('hidden', k !== name); });
    document.querySelectorAll('.nav-btn[data-goto]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-goto') === name);
    });
  }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- 结果文本 ---------------- */
  function resultText() {
    var r = state.result;
    if (!r) return '';
    var c = r.char;
    return [
      '【甄嬛传后宫生存测试 · 结局】',
      '可活至：第 ' + r.ep + ' 集（全剧 ' + TOTAL_EP + ' 集）',
      '最终位份：' + r.rank,
      '对标人物：' + c.name + '（' + c.rank + '，约 ' + c.ep + ' 集）',
      '',
      '— 四维占比 —',
      '心机 ' + r.pct[0] + '%　共情 ' + r.pct[1] + '%　隐忍 ' + r.pct[2] + '%　野心 ' + r.pct[3] + '%',
      '',
      '— 解读 —',
      c.desc,
      c.tip + ' ' + diffText(r, c).replace(/<[^>]+>/g, ''),
      '',
      '生存指南：' + adviceText(r)
    ].join('\n');
  }

  function copyResult() {
    var text = resultText();
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('结局已录于剪贴板'); },
        function () { fallbackCopy(text); }
      );
    } else { fallbackCopy(text); }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('结局已录于剪贴板'); }
    catch (e) { toast('复制未成，请手动择录'); }
    document.body.removeChild(ta);
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    $('btn-start').addEventListener('click', startQuiz);
    $('btn-last').addEventListener('click', showSaved);
    $('btn-next').addEventListener('click', next);
    $('btn-prev').addEventListener('click', function () {
      if (state.idx > 0) { state.idx--; renderQuestion(); }
    });
    $('btn-retry').addEventListener('click', startQuiz);
    $('btn-copy').addEventListener('click', copyResult);
    $('btn-home').addEventListener('click', function () {
      go('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var gid = b.getAttribute('data-goto');
        var sid = b.getAttribute('data-scroll');
        if (sid) {
          go('home');
          setTimeout(function () { scrollToId(sid); }, 60);
          return;
        }
        if (gid === 'quiz') {
          if (!state.qs.length) startQuiz(); else go('quiz');
        } else if (gid === 'result') {
          if (state.result) go('result');
          else if (loadSaved()) showSaved();
          else { toast('请先答完二十五题'); go('home'); }
        } else {
          go('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (views.quiz.classList.contains('hidden')) return;
      if (e.key >= '1' && e.key <= '4') { choose(parseInt(e.key, 10) - 1); }
      else if (e.key === 'Enter') { next(); }
      else if (e.key === 'ArrowLeft') { if (state.idx > 0) { state.idx--; renderQuestion(); } }
      else if (e.key === 'ArrowRight') { next(); }
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (state.result) renderResult(state.result); }, 220);
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    renderDimCards();
    renderGallery();
    $('footer-note').textContent = '题库 ' + window.QB.length + ' 题 · 随机抽取 ' + Q_SIZE + ' 题';
    $('bank-size').textContent = window.QB.length;
    var sum = document.querySelector('details.review summary');
    if (sum) sum.textContent = '逐 题 复 盘（' + Q_SIZE + ' 题）';
    bind();
    updateLastBtn();
    go('home');
  }

  function renderReview() {
    $('review-list').innerHTML = state.qs.map(function (q, i) {
      var op = q.options[state.answers[i]];
      var d = DIMS[dominantDim(op.d)];
      return '<div class="review-item">' +
        '<div class="review-q">' + String(i + 1).padStart(2, '0') + '　' + q.scene + '</div>' +
        '<div class="review-a"><span class="review-dim" style="color:' + d.color + '">' + d.name + '</span>' +
        '<span>' + op.text + '</span><span class="review-tag">［' + q.t + '］</span></div>' +
        '</div>';
    }).join('');
  }

  function dominantDim(d) {
    var idx = 0;
    for (var k = 1; k < 4; k++) if (d[k] > d[idx]) idx = k;
    return idx;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
