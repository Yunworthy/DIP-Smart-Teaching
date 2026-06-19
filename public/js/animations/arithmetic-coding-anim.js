(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>算术编码初始化</b>：符号概率 A=0.5, B=0.25, C=0.125, D=0.125，初始区间 [0,1)',
    '<b>编码第1个符号 A</b>：区间缩窄为 <code>[0, 0.5)</code>，按A的概率范围取子区间',
    '<b>编码第2个符号 B</b>：在当前区间内按B的概率缩窄为 <code>[0.25, 0.375)</code>',
    '<b>编码第3个符号 A</b>：进一步缩窄为 <code>[0.25, 0.3125)</code>',
    '<b>最终编码区间</b>：在 <code>[0.25, 0.3125)</code> 中任选一个数作为编码值，如 0.28',
    '<b>解码过程</b>：逆向判断编码值落入哪个符号区间，逐个恢复原始符号序列'
  ];

  var symbols = [
    {name: 'A', prob: 0.5, lo: 0, hi: 0.5, color: INDIGO},
    {name: 'B', prob: 0.25, lo: 0.5, hi: 0.75, color: GREEN},
    {name: 'C', prob: 0.125, lo: 0.75, hi: 0.875, color: AMBER},
    {name: 'D', prob: 0.125, lo: 0.875, hi: 1.0, color: RED}
  ];

  var message = ['A', 'B', 'A'];

  var intervals = [
    {lo: 0, hi: 1, label: '初始区间'},
    {lo: 0, hi: 0.5, label: '编码A后'},
    {lo: 0.25, hi: 0.375, label: '编码B后'},
    {lo: 0.25, hi: 0.3125, label: '编码A后'}
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawTitle(text) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(text, 15, 10);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(15, 30); ctx.lineTo(685, 30); ctx.stroke();
    }

    function drawStepLabel(step, total) {
      ctx.fillStyle = INDIGO;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('步骤 ' + (step + 1) + ' / ' + total, 685, 10);
    }

    function drawIntervalBar(x, y, w, h, lo, hi, highlightLo, highlightHi, highlightColor, label) {
      // Background bar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      // Draw symbol subdivisions
      for (var i = 0; i < symbols.length; i++) {
        var s = symbols[i];
        var sx = x + s.lo * w;
        var sw = s.prob * w;
        ctx.fillStyle = s.color + '20';
        ctx.fillRect(sx, y, sw, h);
      }

      // Highlight current interval
      if (highlightLo !== undefined && highlightHi !== undefined) {
        var hx = x + highlightLo * w;
        var hw = (highlightHi - highlightLo) * w;
        ctx.fillStyle = (highlightColor || INDIGO) + '40';
        ctx.fillRect(hx, y, hw, h);
        ctx.strokeStyle = highlightColor || INDIGO;
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, y, hw, h);
      }

      // Labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('0', x, y + h + 4);
      ctx.fillText('1', x + w, y + h + 4);

      // Symbol labels on bar
      for (var i = 0; i < symbols.length; i++) {
        var s = symbols[i];
        var cx = x + (s.lo + s.hi) / 2 * w;
        ctx.fillStyle = s.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.name, cx, y + h / 2);
      }

      if (label) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y - 18);
      }
    }

    function drawStep0() {
      drawTitle('算术编码：初始化概率区间');
      drawStepLabel(0, 6);

      // Probability table
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('符号概率分布', 30, 48);

      var ty = 72;
      for (var i = 0; i < symbols.length; i++) {
        var s = symbols[i];
        ctx.fillStyle = s.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(s.name, 40, ty + i * 30);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '12px sans-serif';
        ctx.fillText('P = ' + s.prob, 80, ty + i * 30);

        // Probability bar
        ctx.fillStyle = s.color + '30';
        ctx.fillRect(150, ty + i * 30 - 8, s.prob * 200, 18);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(150, ty + i * 30 - 8, s.prob * 200, 18);
      }

      // Initial interval bar
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('初始编码区间 [0, 1)', 30, 210);

      drawIntervalBar(30, 240, 640, 50, 0, 1);

      // Message info
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('待编码消息：A B A', 30, 320);
      ctx.font = '12px sans-serif';
      ctx.fillText('共 ' + message.length + ' 个符号', 30, 345);

      // Explanation
      ctx.fillStyle = INDIGO;
      ctx.font = '11px sans-serif';
      ctx.fillText('算术编码将整个消息映射到 [0,1) 区间内的一个实数', 30, 375);
    }

    function drawStep1() {
      drawTitle('编码第1个符号 A → 区间 [0, 0.5)');
      drawStepLabel(1, 6);

      // Original bar
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('编码前 [0, 1)：', 30, 48);
      drawIntervalBar(30, 70, 640, 40, 0, 1, 0, 0.5, INDIGO);

      // Zoomed bar
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('编码A后 [0, 0.5)（放大视图）：', 30, 140);
      drawIntervalBar(30, 165, 640, 50, 0, 0.5);

      // Show subdivision within [0, 0.5)
      var subX = 30, subW = 640, subLo = 0, subHi = 0.5;
      for (var i = 0; i < symbols.length; i++) {
        var s = symbols[i];
        var slo = subLo + s.lo * (subHi - subLo);
        var shi = subLo + s.hi * (subHi - subLo);
        var sx = subX + (slo - 0) / 0.5 * subW;
        var sw = (shi - slo) / 0.5 * subW;
        ctx.fillStyle = s.color + '15';
        ctx.fillRect(sx, 230, sw, 35);
        ctx.strokeStyle = s.color + '60';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, 230, sw, 35);
        ctx.fillStyle = s.color;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.name, sx + sw / 2, 247);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '9px monospace';
        ctx.fillText(slo.toFixed(3), sx, 270);
      }

      // Explanation
      var bx = 30, by = 295;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 640, 80);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(bx, by, 640, 80);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('A 的概率范围为 [0, 0.5)，占初始区间的左半部分', bx + 15, by + 22);
      ctx.fillText('新区间：[0, 0.5)，宽度 = 0.5', bx + 15, by + 45);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('区间宽度 = 已编码符号概率之积 = 0.5', bx + 15, by + 68);
    }

    function drawStep2() {
      drawTitle('编码第2个符号 B → 区间 [0.25, 0.375)');
      drawStepLabel(2, 6);

      // Current interval [0, 0.5)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('当前区间 [0, 0.5)：', 30, 48);
      drawIntervalBar(30, 70, 640, 40, 0, 0.5, 0.25, 0.375, GREEN);

      // Zoomed into [0.25, 0.375)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('编码B后 [0.25, 0.375)（放大视图）：', 30, 140);
      drawIntervalBar(30, 165, 640, 50, 0.25, 0.375);

      // Show computation
      var bx = 30, by = 240;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 640, 140);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(bx, by, 640, 140);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('区间计算过程：', bx + 15, by + 22);

      ctx.font = '12px monospace';
      ctx.fillText('当前区间宽度 = 0.5 - 0 = 0.5', bx + 25, by + 50);
      ctx.fillText('B 的概率范围：[0.5, 0.75)', bx + 25, by + 72);
      ctx.fillText('新区间下界 = 0 + 0.5 × 0.5 = 0.25', bx + 25, by + 94);
      ctx.fillText('新区间上界 = 0 + 0.5 × 0.75 = 0.375', bx + 25, by + 116);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('新宽度 = 0.5 × 0.25 = 0.125', 450, by + 70);
    }

    function drawStep3() {
      drawTitle('编码第3个符号 A → 区间 [0.25, 0.3125)');
      drawStepLabel(3, 6);

      // Current interval [0.25, 0.375)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('当前区间 [0.25, 0.375)：', 30, 48);
      drawIntervalBar(30, 70, 640, 40, 0.25, 0.375, 0.25, 0.3125, INDIGO);

      // Zoomed
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('编码A后 [0.25, 0.3125)（放大视图）：', 30, 140);
      drawIntervalBar(30, 165, 640, 50, 0.25, 0.3125);

      // Computation
      var bx = 30, by = 240;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 640, 140);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(bx, by, 640, 140);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('区间计算过程：', bx + 15, by + 22);

      ctx.font = '12px monospace';
      ctx.fillText('当前区间宽度 = 0.375 - 0.25 = 0.125', bx + 25, by + 50);
      ctx.fillText('A 的概率范围：[0, 0.5)', bx + 25, by + 72);
      ctx.fillText('新区间下界 = 0.25 + 0.125 × 0   = 0.25', bx + 25, by + 94);
      ctx.fillText('新区间上界 = 0.25 + 0.125 × 0.5 = 0.3125', bx + 25, by + 116);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('新宽度 = 0.125 × 0.5 = 0.0625', 450, by + 70);
    }

    function drawStep4() {
      drawTitle('最终编码区间：选取编码值');
      drawStepLabel(4, 6);

      // Show all intervals shrinking
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('编码过程中区间变化：', 30, 48);

      var barY = 75;
      for (var i = 0; i < intervals.length; i++) {
        var iv = intervals[i];
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '11px sans-serif';
        ctx.fillText(iv.label, 30, barY + i * 50 - 2);

        // Scale: show [0, 0.5] range for visibility
        var scaleMax = 0.5;
        var barX = 180, barW = 480, barH = 30;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX, barY + i * 50, barW, barH);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY + i * 50, barW, barH);

        // Highlight interval
        var hx = barX + (iv.lo / scaleMax) * barW;
        var hw = Math.max(2, ((iv.hi - iv.lo) / scaleMax) * barW);
        ctx.fillStyle = INDIGO + '50';
        ctx.fillRect(hx, barY + i * 50, hw, barH);
        ctx.strokeStyle = INDIGO;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hx, barY + i * 50, hw, barH);

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[' + iv.lo.toFixed(4) + ', ' + iv.hi.toFixed(4) + ')', hx + hw / 2, barY + i * 50 + barH + 12);
      }

      // Final value
      var by = 290;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(30, by, 640, 90);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(30, by, 640, 90);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('最终编码区间：[0.25, 0.3125)', 350, by + 25);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('编码值 = 0.28（区间内任意一个数）', 350, by + 55);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('只需传输这一个实数即可代表整个消息 "ABA"', 350, by + 78);
    }

    function drawStep5() {
      drawTitle('解码过程：逆向恢复符号序列');
      drawStepLabel(5, 6);

      // Decoding steps
      var decodeSteps = [
        {value: 0.28, symbol: 'A', range: '[0, 0.5)', reason: '0.28 ∈ [0, 0.5) → 符号A'},
        {value: 0.28, symbol: 'B', range: '[0.5, 0.75)→映射', reason: '(0.28-0)/(0.5-0) = 0.56 ∈ [0.5,0.75) → 符号B'},
        {value: 0.28, symbol: 'A', range: '→映射', reason: '映射后值 ∈ [0, 0.5) → 符号A'}
      ];

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('解码步骤（编码值 = 0.28）：', 30, 48);

      for (var i = 0; i < decodeSteps.length; i++) {
        var ds = decodeSteps[i];
        var sy = 80 + i * 80;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(30, sy, 640, 65);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(30, sy, 640, 65);

        ctx.fillStyle = symbols.filter(function(s){return s.name===ds.symbol;})[0].color;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('第' + (i + 1) + '步 → ' + ds.symbol, 45, sy + 20);

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '12px monospace';
        ctx.fillText(ds.reason, 45, sy + 45);
      }

      // Result
      var by = 330;
      ctx.fillStyle = INDIGO;
      roundRect(ctx, 30, by, 640, 50, 8);
      ctx.fillStyle = INDIGO + '15';
      ctx.fill();
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('解码结果：A B A  ✓  成功恢复原始消息！', 350, by + 30);
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    return {
      totalSteps: 6,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(); break;
          case 3: drawStep3(); break;
          case 4: drawStep4(); break;
          case 5: drawStep5(); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(56, factory);
})();
