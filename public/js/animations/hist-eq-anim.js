/**
 * Histogram Equalization Animation
 *
 * Demonstrates the histogram equalization process step-by-step:
 *   Step 0: Original image (gradient bar) + histogram
 *   Step 1: CDF calculation overlaid on histogram
 *   Step 2: CDF mapping — arrows from old gray levels to new
 *   Step 3: Equalized histogram (flat) + enhanced image
 *
 * Registered for KP IDs 19, 20 (直方图均衡化 / 自适应直方图均衡).
 */
(function () {
  'use strict';

  // Colour palette
  var INDIGO      = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN       = '#10b981';
  var RED         = '#ef4444';
  var AMBER       = '#f59e0b';
  var GRAY_BG     = '#f9fafb';
  var GRAY_BORDER = '#e5e7eb';
  var TEXT_COLOR   = '#374151';

  // Simulated original histogram (8 gray levels, peaked in the middle)
  var origHist = [5, 10, 25, 40, 35, 20, 10, 5];
  var totalPixels = origHist.reduce(function (a, b) { return a + b; }, 0);

  // CDF of original histogram (normalised 0-1)
  var cdf = [];
  (function () {
    var cum = 0;
    for (var i = 0; i < origHist.length; i++) {
      cum += origHist[i];
      cdf.push(cum / totalPixels);
    }
  })();

  // Equalized gray levels: round(cdf[i] * (L-1)) where L = 8
  var eqLevels = cdf.map(function (v) { return Math.round(v * 7); });

  // Equalized histogram (count occurrences of each mapped level)
  var eqHist = [0, 0, 0, 0, 0, 0, 0, 0];
  (function () {
    for (var i = 0; i < origHist.length; i++) {
      eqHist[eqLevels[i]] += origHist[i];
    }
  })();

  var stepDescriptions = [
    '<b>步骤 1/4 — 原始图像与直方图：</b>左侧为模拟灰度图像（8 级灰度条），右侧为对应的灰度直方图。可以看到像素集中在中间灰度级，暗区和亮区像素较少，图像对比度较低。',
    '<b>步骤 2/4 — 计算累积分布函数（CDF）：</b>红色曲线为 CDF。CDF 从 0 单调递增至 1，反映了每个灰度级以下像素的累积比例。均衡化的映射公式为 <code>s = round(CDF(r) × (L−1))</code>。',
    '<b>步骤 3/4 — CDF 映射：</b>箭头表示原始灰度级 → 新灰度级的映射关系。灰度级被"拉伸"到整个范围，原先集中的中间值被分散到更宽的区间。',
    '<b>步骤 4/4 — 均衡化结果：</b>均衡化后直方图趋于平坦（绿色），各灰度级的像素数量更加均匀。左侧图像对比度明显增强，细节更加清晰。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // ---------- drawing helpers ----------

    /** Draw an 8-level gray bar on the left side. */
    function drawGrayBar(x, y, w, h, levels, label) {
      var cellW = w / levels.length;
      for (var i = 0; i < levels.length; i++) {
        var gray = Math.round((levels[i] / 7) * 255);
        ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
        ctx.fillRect(x + i * cellW, y, cellW, h);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.strokeRect(x + i * cellW, y, cellW, h);
      }
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h + 18);
    }

    /** Draw a histogram bar chart. */
    function drawHistogram(x, y, w, h, data, maxVal, color, label) {
      var barW = w / data.length;
      var gap  = 4;

      // Axes
      ctx.strokeStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();

      for (var i = 0; i < data.length; i++) {
        var barH = (data[i] / maxVal) * (h - 10);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x + i * barW + gap / 2, y + h - barH, barW - gap, barH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.strokeRect(x + i * barW + gap / 2, y + h - barH, barW - gap, barH);

        // Value label
        ctx.fillStyle = TEXT_COLOR;
        ctx.font      = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data[i], x + i * barW + barW / 2, y + h - barH - 4);

        // Gray-level index
        ctx.fillStyle = '#6b7280';
        ctx.font      = '10px sans-serif';
        ctx.fillText(i, x + i * barW + barW / 2, y + h + 14);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h + 30);
    }

    /** Draw CDF curve on top of the histogram area. */
    function drawCDF(x, y, w, h) {
      var barW = w / cdf.length;
      ctx.strokeStyle = RED;
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      for (var i = 0; i < cdf.length; i++) {
        var px = x + i * barW + barW / 2;
        var py = y + h - cdf[i] * (h - 10);
        if (i === 0) ctx.moveTo(px, py);
        else         ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // Dots + values
      for (var j = 0; j < cdf.length; j++) {
        var dx = x + j * barW + barW / 2;
        var dy = y + h - cdf[j] * (h - 10);
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = RED;
        ctx.font      = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cdf[j].toFixed(2), dx, dy - 8);
      }

      // Legend
      ctx.fillStyle = RED;
      ctx.font      = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('● CDF', x + w + 8, y + 16);
    }

    /** Draw mapping arrows from original gray levels to equalized levels. */
    function drawMappingArrows(x, y, w, h) {
      var cellH = h / 8;
      var srcX  = x + 40;
      var dstX  = x + w - 40;

      // Headers
      ctx.fillStyle = INDIGO;
      ctx.font      = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始灰度', srcX, y - 6);
      ctx.fillStyle = GREEN;
      ctx.fillText('均衡化灰度', dstX, y - 6);

      for (var i = 0; i < 8; i++) {
        var srcY = y + i * cellH + cellH / 2;
        var dstY = y + eqLevels[i] * cellH + cellH / 2;

        // Source cell
        var graySrc = Math.round((i / 7) * 255);
        ctx.fillStyle = 'rgb(' + graySrc + ',' + graySrc + ',' + graySrc + ')';
        ctx.fillRect(srcX - 20, srcY - 10, 40, 20);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.strokeRect(srcX - 20, srcY - 10, 40, 20);
        ctx.fillStyle = i < 4 ? '#fff' : '#000';
        ctx.font      = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(i, srcX, srcY + 4);

        // Destination cell
        var grayDst = Math.round((eqLevels[i] / 7) * 255);
        ctx.fillStyle = 'rgb(' + grayDst + ',' + grayDst + ',' + grayDst + ')';
        ctx.fillRect(dstX - 20, dstY - 10, 40, 20);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.strokeRect(dstX - 20, dstY - 10, 40, 20);
        ctx.fillStyle = eqLevels[i] < 4 ? '#fff' : '#000';
        ctx.font      = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(eqLevels[i], dstX, dstY + 4);

        // Arrow
        ctx.strokeStyle = AMBER;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(srcX + 22, srcY);
        ctx.lineTo(dstX - 22, dstY);
        ctx.stroke();
        // Arrowhead
        var angle = Math.atan2(dstY - srcY, (dstX - 22) - (srcX + 22));
        ctx.beginPath();
        ctx.moveTo(dstX - 22, dstY);
        ctx.lineTo(dstX - 22 - 8 * Math.cos(angle - 0.4), dstY - 8 * Math.sin(angle - 0.4));
        ctx.lineTo(dstX - 22 - 8 * Math.cos(angle + 0.4), dstY - 8 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = AMBER;
        ctx.fill();
        ctx.lineWidth = 1;
      }

      // Formula
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('s = round( CDF(r) × 7 )', x + w / 2, y + h + 18);
    }

    // ---------- step drawing ----------

    function drawStep0() {
      // Left: gray bar (original)
      drawGrayBar(30, 40, 280, 50, [0, 1, 2, 3, 4, 5, 6, 7], '原始灰度条（8级）');

      // Right: original histogram
      drawHistogram(370, 40, 290, 180, origHist, 45, INDIGO, '原始直方图');

      // Bottom: description panel
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 270, 640, 110);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 270, 640, 110);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '灰度直方图描述了图像中各灰度级出现的频率。',
        '此图像中像素集中在灰度级 2~5，暗部(0~1)和亮部(6~7)像素很少。',
        '这导致图像对比度低，细节不明显。',
        '直方图均衡化的目标是使像素在各灰度级上均匀分布。'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 48, 296 + i * 22);
      }
    }

    function drawStep1() {
      // Left: gray bar
      drawGrayBar(30, 40, 280, 50, [0, 1, 2, 3, 4, 5, 6, 7], '原始灰度条');

      // Right: histogram + CDF
      drawHistogram(370, 40, 290, 180, origHist, 45, INDIGO, '直方图 + CDF');
      drawCDF(370, 40, 290, 180);

      // Bottom: CDF table
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(30, 270, 640, 110);
      ctx.strokeStyle = '#fecaca';
      ctx.strokeRect(30, 270, 640, 110);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CDF 值表：', 48, 294);

      ctx.font = '11px monospace';
      for (var i = 0; i < 8; i++) {
        ctx.fillStyle = INDIGO;
        ctx.fillText('r' + i + '=' + i, 48 + i * 80, 316);
        ctx.fillStyle = RED;
        ctx.fillText('CDF=' + cdf[i].toFixed(2), 48 + i * 80, 334);
        ctx.fillStyle = AMBER;
        ctx.fillText('s=' + eqLevels[i], 48 + i * 80, 352);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.fillText('映射公式: s = round( CDF(r) × (L−1) ),  L = 8', 48, 372);
    }

    function drawStep2() {
      // Mapping arrows
      drawMappingArrows(100, 50, 500, 280);
    }

    function drawStep3() {
      // Left: equalized gray bar
      drawGrayBar(30, 40, 280, 50, eqLevels, '均衡化后灰度条');

      // Right: equalized histogram
      drawHistogram(370, 40, 290, 180, eqHist, 45, GREEN, '均衡化直方图');

      // Bottom: comparison panel
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(30, 270, 640, 110);
      ctx.strokeStyle = '#a7f3d0';
      ctx.strokeRect(30, 270, 640, 110);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '均衡化后直方图趋于平坦 — 各灰度级的像素数量更加均匀。',
        '灰度映射结果: ' + eqLevels.join(', '),
        '图像对比度增强，暗部与亮部细节更加清晰可见。',
        '实际应用中，自适应直方图均衡（AHE / CLAHE）可避免过度增强噪声。'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 48, 296 + i * 22);
      }
    }

    // ---------- public API ----------

    return {
      totalSteps: 4,
      draw: function (step) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(); break;
          case 3: drawStep3(); break;
        }
      },
      reset: function () { /* stateless — nothing to reset */ },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  // Register for likely KP IDs
  registerAnimationBatch([19, 20], factory);

  // Expose factory for remap (hist-spec-anim.js overwrites KP19/20)
  window.__histEqFactory = factory;
})();
