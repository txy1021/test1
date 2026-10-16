/* ==========================================================
   水墨风格人物肖像生成器（SVG）
   用于「后宫群像」与结果页人物对标。
   若在 assets/img/ 下放入同名 jpg/png 剧照，则优先使用剧照。
   ========================================================== */
(function () {
  'use strict';

  var DEF = { robe: '#8b8fa0', trim: '#cdc7b9', orn: '#b58b76', wash: '#6f7787', seal: '#8f4f43' };

  var PAL = {
    zhenhuan:   { robe: '#8d93a8', trim: '#d5cfc1', orn: '#b98d78', wash: '#6f7a8c' },
    huafei:     { robe: '#a1736b', trim: '#e0d3c4', orn: '#c9a06b', wash: '#8a6a63' },
    meizhuang:  { robe: '#7f8f86', trim: '#d8d2c4', orn: '#b9a48d', wash: '#6f7f75' },
    anlingrong: { robe: '#9a8d99', trim: '#d9d1c6', orn: '#b58b76', wash: '#7a6f79' },
    huanghou:   { robe: '#8a7f93', trim: '#d7cfc6', orn: '#c0a173', wash: '#716878' },
    jingfei:    { robe: '#7e8a94', trim: '#d6d0c2', orn: '#b9a48d', wash: '#6d7781' },
    duanfei:    { robe: '#77838f', trim: '#d3cdbf', orn: '#ada0b0', wash: '#68717c' },
    caoxinmo:   { robe: '#94807a', trim: '#dbd2c5', orn: '#c2a074', wash: '#7a6a66' },
    huanbi:     { robe: '#a08a7c', trim: '#e2d8c9', orn: '#c9a06b', wash: '#8a7468' },
    yelanyi:    { robe: '#6f8089', trim: '#d2ccc0', orn: '#9fae9f', wash: '#65747c' },
    qipin:      { robe: '#a1796f', trim: '#e3d7c8', orn: '#c9a06b', wash: '#8d6d64' },
    chuner:     { robe: '#8b9a92', trim: '#e0dac9', orn: '#c0a8a0', wash: '#728078' }
  };

  function hair(variant) {
    var base = '<path d="M-52,-54 C-58,-110 -18,-120 0,-120 C18,-120 58,-110 52,-54 C34,-76 -34,-76 -52,-54 Z" fill="#33383f"/>';
    if (variant === 'qitou') {
      return base +
        '<path d="M-86,-104 C-58,-150 58,-150 86,-104 C62,-124 -62,-124 -86,-104 Z" fill="#2f333a"/>' +
        '<path d="M-64,-116 L64,-116" stroke="#5b5f66" stroke-width="1" opacity=".7"/>';
    }
    if (variant === 'dianzi') {
      return base +
        '<path d="M-60,-92 C-32,-132 32,-132 60,-92 Z" fill="#2f333a"/>' +
        '<path d="M-46,-100 C-24,-126 24,-126 46,-100" stroke="#6d6a70" stroke-width="1.2" fill="none"/>';
    }
    if (variant === 'gaoji') {
      return base + '<ellipse cx="0" cy="-126" rx="28" ry="21" fill="#2f333a"/>' +
        '<path d="M-28,-128 C-14,-140 14,-140 28,-128" stroke="#7a7770" stroke-width="1.2" fill="none"/>';
    }
    return base +
      '<ellipse cx="-49" cy="-72" rx="22" ry="26" fill="#2f333a"/>' +
      '<ellipse cx="49" cy="-72" rx="22" ry="26" fill="#2f333a"/>';
  }

  function ornament(variant, color) {
    if (variant === 'feng') {
      return '<g stroke="' + color + '" stroke-width="1.6" fill="none">' +
        '<path d="M0,-140 C10,-152 22,-150 28,-140"/>' +
        '<path d="M0,-140 C-10,-152 -22,-150 -28,-140"/>' +
        '<path d="M0,-142 L0,-158"/></g>' +
        '<circle cx="0" cy="-160" r="3" fill="' + color + '"/>';
    }
    if (variant === 'hua') {
      return '<g fill="' + color + '">' +
        '<circle cx="-26" cy="-124" r="4"/>' +
        '<circle cx="0" cy="-132" r="4.6"/>' +
        '<circle cx="26" cy="-124" r="4"/></g>';
    }
    if (variant === 'buyao') {
      return '<g stroke="' + color + '" stroke-width="1.5" fill="none">' +
        '<path d="M40,-112 C52,-100 54,-86 48,-74"/></g>' +
        '<circle cx="47" cy="-70" r="3.4" fill="' + color + '"/>';
    }
    return '<g fill="' + color + '">' +
      '<circle cx="34" cy="-116" r="5"/>' +
      '<circle cx="46" cy="-108" r="3.4"/></g>';
  }

  window.Portrait = {
    /**
     * 生成人物肖像 SVG 字符串
     * @param {string} key  角色 key
     * @param {string} name 角色名（取首字入印）
     */
    render: function (key, name) {
      var p = PAL[key] || DEF;
      var sealChar = (name || '宫').replace(/[（(].*$/, '').charAt(0);
      return [
        '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="', name, '">',
        '<defs>',
        '<radialGradient id="pq-', key, '" cx="50%" cy="42%" r="62%">',
        '<stop offset="0%" stop-color="', p.wash, '" stop-opacity=".22"/>',
        '<stop offset="70%" stop-color="', p.wash, '" stop-opacity=".05"/>',
        '<stop offset="100%" stop-color="', p.wash, '" stop-opacity="0"/>',
        '</radialGradient>',
        '<linearGradient id="pr-', key, '" x1="0" y1="0" x2="0" y2="1">',
        '<stop offset="0%" stop-color="', p.robe, '" stop-opacity=".95"/>',
        '<stop offset="100%" stop-color="', p.robe, '" stop-opacity=".6"/>',
        '</linearGradient>',
        '</defs>',
        '<rect width="300" height="400" fill="#efeade"/>',
        '<circle cx="150" cy="160" r="132" fill="url(#pq-', key, ')"/>',
        '<path d="M0 332 C60 302 104 324 152 308 C202 291 252 320 300 302 L300 400 L0 400 Z" fill="rgba(43,47,51,.05)"/>',
        '<path d="M0 356 C70 336 120 354 176 342 C232 330 268 348 300 338 L300 400 L0 400 Z" fill="rgba(43,47,51,.06)"/>',
        '<g opacity=".07" fill="#2b2f33">',
        '<circle cx="42" cy="70" r="3"/><circle cx="258" cy="96" r="4"/><circle cx="66" cy="300" r="2.4"/>',
        '<circle cx="240" cy="286" r="2"/><circle cx="30" cy="180" r="2"/>',
        '</g>',
        '<g transform="translate(150,252)">',
        '<path d="M-122,148 C-112,50 -64,16 0,16 C64,16 112,50 122,148 Z" fill="url(#pr-', key, ')"/>',
        '<path d="M-74,44 C-42,76 42,76 74,44 C50,68 -50,68 -74,44 Z" fill="', p.trim, '" opacity=".85"/>',
        '<path d="M-36,60 C-22,84 22,84 36,60 C24,76 -24,76 -36,60 Z" fill="#f7f3ea"/>',
        '<path d="M-15,28 L15,28 L13,64 L-13,64 Z" fill="#e6d9c6"/>',
        '<ellipse cx="0" cy="-16" rx="45" ry="53" fill="#f2e8d9"/>',
        hair(hairOf(key)),
        ornament(ornOf(key), p.orn),
        '<g stroke="#3a3f45" stroke-width="2" fill="none" stroke-linecap="round">',
        '<path d="M-30,-28 C-22,-33 -12,-33 -6,-29"/>',
        '<path d="M30,-28 C22,-33 12,-33 6,-29"/>',
        '</g>',
        '<g stroke="#3a3f45" stroke-width="2.2" fill="none" stroke-linecap="round">',
        '<path d="M-27,-16 C-20,-21 -12,-20 -9,-16"/>',
        '<path d="M27,-16 C20,-21 12,-20 9,-16"/>',
        '</g>',
        '<path d="M-8,14 C-4,19 4,19 8,14" stroke="#a2736a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
        '</g>',
        '<g transform="translate(248,350) rotate(-3)">',
        '<rect width="34" height="34" rx="2" fill="', p.seal || DEF.seal, '" opacity=".85"/>',
        '<text x="17" y="24" text-anchor="middle" font-size="19" fill="#f4f0e7" font-family="Songti SC,STSong,serif">', sealChar, '</text>',
        '</g>'
      ].join('');
    },

    /**
     * 把肖像渲染进容器；依次尝试若干候选路径加载剧照，全部失败则回退水墨肖像
     */
    mount: function (container, char) {
      container.innerHTML = this.render(char.key, char.name);
      if (!char.photo) return;
      var list = photoCandidates(char.photo);
      var i = 0;
      (function tryNext() {
        if (i >= list.length) return;             /* 全部失败，保留水墨肖像 */
        var img = new Image();
        img.onload = function () {
          container.innerHTML = '';
          img.className = 'portrait-img';
          img.alt = char.name;
          container.appendChild(img);
        };
        img.onerror = tryNext;
        img.src = list[i++];
      })();
    }
  };

  /**
   * 剧照路径候选：兼容「未写后缀」「多写了一层后缀」「后缀与实际不符」等情况
   * 例如 zhenhuan.jpg → zhenhuan.jpg / zhenhuan.jpg.jpg / zhenhuan.jpg.png / zhenhuan.png ...
   */
  function photoCandidates(photo) {
    var EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
    var out = [];
    function add(u) { if (u && out.indexOf(u) < 0) out.push(u); }
    add(photo);
    EXTS.forEach(function (e) { add(photo + e); });
    var m = photo.match(/^(.*)\.(jpg|jpeg|png|webp)$/i);
    if (m) { EXTS.forEach(function (e) { add(m[1] + e); }); }
    return out;
  }

  var HAIR_MAP = {
    zhenhuan: 'qitou', duanfei: 'qitou',
    huafei: 'dianzi', huanghou: 'dianzi', qipin: 'dianzi',
    meizhuang: 'chui', caoxinmo: 'chui', huanbi: 'chui', chuner: 'chui',
    anlingrong: 'gaoji', jingfei: 'gaoji', yelanyi: 'gaoji'
  };
  var ORN_MAP = {
    zhenhuan: 'feng', huafei: 'feng', huanghou: 'feng',
    meizhuang: 'hua', jingfei: 'hua', qipin: 'hua',
    anlingrong: 'ronghua', duanfei: 'ronghua', chuner: 'ronghua',
    caoxinmo: 'buyao', yelanyi: 'buyao', huanbi: 'ronghua'
  };

  function hairOf(key) { return HAIR_MAP[key] || 'gaoji'; }
  function ornOf(key) { return ORN_MAP[key] || 'hua'; }
})();
