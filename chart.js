/* ==========================================================
   纯 Canvas 四维雷达图（后宫属性图谱）
   不依赖任何第三方库，适配高分屏。
   ========================================================== */
(function () {
  'use strict';

  var INK = '#2b2f33';
  var MUTED = '#8b8780';
  var LINE = '#d5cec0';

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function setup(canvas) {
    var cssW = canvas.clientWidth || parseInt(canvas.getAttribute('width'), 10) || 400;
    var cssH = canvas.clientHeight || cssW;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    return { ctx: ctx, w: cssW, h: cssH };
  }

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function animate(duration, step) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { step(1); return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      step(easeOut(t));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Array} dims [{name, color, pct, base}] 顺序：上/右/下/左
   */
  function drawRadar(canvas, dims) {
    var s = setup(canvas), ctx = s.ctx;
    var cx = s.w / 2, cy = s.h / 2;
    var pad = Math.min(s.w, s.h) * 0.24;
    var R = Math.min(s.w, s.h) / 2 - pad;
    var angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    var levels = [0.25, 0.5, 0.75, 1];

    function pt(i, ratio) {
      return [cx + Math.cos(angles[i]) * R * ratio, cy + Math.sin(angles[i]) * R * ratio];
    }
    function polygon(ratios) {
      ctx.beginPath();
      for (var i = 0; i < 4; i++) {
        var p = pt(i, ratios[i]);
        if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
    }

    function drawBase() {
      levels.forEach(function (lv, li) {
        polygon([lv, lv, lv, lv]);
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeStyle = li === levels.length - 1 ? 'rgba(43,47,51,.24)' : LINE;
        ctx.stroke();
      });
      /* 基准线（均匀分布 25%） */
      polygon([0.25, 0.25, 0.25, 0.25]);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(143,79,67,.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      for (var i = 0; i < 4; i++) {
        var p = pt(i, 1);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var j = 0; j < 4; j++) {
        var lp = pt(j, 1);
        var ox = Math.cos(angles[j]) * 30, oy = Math.sin(angles[j]) * 24;
        ctx.font = '500 15px "Songti SC","STSong",serif';
        ctx.fillStyle = dims[j].color;
        ctx.fillText(dims[j].name, lp[0] + ox, lp[1] + oy);
        ctx.font = '11.5px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillStyle = MUTED;
        ctx.fillText(dims[j].pct + '%', lp[0] + ox, lp[1] + oy + 19);
      }
    }

    animate(1000, function (t) {
      ctx.clearRect(0, 0, s.w, s.h);
      drawBase();

      var vals = dims.map(function (d) { return Math.max(0.01, (d.pct / 100)) * t; });
      polygon(vals);
      var grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      grad.addColorStop(0, rgba(dims[0].color, 0.26));
      grad.addColorStop(1, rgba(dims[2].color, 0.18));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(143,79,67,.85)';
      ctx.stroke();

      for (var k = 0; k < 4; k++) {
        var q = pt(k, vals[k]);
        ctx.beginPath(); ctx.arc(q[0], q[1], 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#f4f0e7'; ctx.fill();
        ctx.lineWidth = 1.8; ctx.strokeStyle = dims[k].color; ctx.stroke();
      }
    });
  }

  window.HougongChart = { drawRadar: drawRadar };
})();
