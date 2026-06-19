/**
 * Gray Histogram Definition Animation
 *
 * Step 0: Show 8x8 image grid with various gray values (0-7)
 * Step 1: Count pixels at each gray level — tally marks
 * Step 2: Build histogram bar chart from counts
 * Step 3: Normalized histogram (PDF) — divide by total pixels
 * Step 4: CDF — cumulative sum of PDF
 * Step 5: Interpretation — dark / bright / low-contrast / high-contrast / bimodal
 *
 * Slider (0-5): switch between image types
 *
 * Registered for KP ID 13.
 */
(function () {
  'use strict';

  var INDIGO       = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN        = '#10b981';
  var RED          = '#ef4444';
  var AMBER        = '#f59e0b';
  var GRAY_BG      = '#f9fafb';
  var GRAY_BORDER  = '#d1d5db';
  var TEXT_COLOR    = '#374151';

  var LEVELS = 8;
  var TOTAL  = 64; // 8x8

  // Different image types
  var imageTypes = [
    { name: '默认渐变', nameEn: 'default' },
    { name: '暗图像',   nameEn: 'dark' },
    { name: '亮图像',   nameEn: 'bright' },
    { name: '低对比度', nameEn: 'low-contrast' },
    { name: '高对比度', nameEn: 'high-contrast' },
    { name: '双峰分布', nameEn: 'bimodal' }
  ];

  // 8x8 image grids for each type (values 0-7)
  var images = {};

  // Default: gradient
  images[0] = [
    [0, 0, 1, 1, 2, 2, 3, 3],
    [0, 1, 1, 2, 2, 3, 3, 4],
    [1, 1, 2, 2, 3, 3, 4, 4],
    [2, 2, 3, 3, 4, 4, 5, 5],
    [3, 3, 4, 4, 5, 5, 6, 6],
    [4, 4, 5, 5, 6, 6, 7, 7],
    [5, 5, 6, 6, 7, 7, 7, 7],
    [6, 6, 7, 7, 7, 7, 7, 7]
  ];

  // Dark: peak at low levels
  images[1] = [
    [0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 2],
    [0, 0, 0, 1, 1, 1, 2, 2],
    [0, 0, 0, 0, 1, 1, 2, 2],
    [0, 0, 0, 1, 1, 2, 2, 3],
    [0, 0, 1, 1, 1, 2, 2, 3],
    [0, 0, 0, 1, 1, 1, 2, 3],
    [0, 0, 0, 0, 1, 1, 2, 2]
  ];

  // Bright: peak at high levels
  images[2] = [
    [4, 5, 5, 5, 6, 6, 6, 7],
    [5, 5, 5, 6, 6, 6, 7, 7],
    [5, 5, 6, 6, 6, 7, 7, 7],
    [5, 6, 6, 6, 7, 7, 7, 7],
    [6, 6, 6, 7, 7, 7, 7, 7],
    [6, 6, 6, 7, 7, 7, 7, 7],
    [6, 6, 7, 7, 7, 7, 7, 7],
    [5, 6, 6, 6, 7, 7, 7, 7]
  ];

  // Low contrast: narrow peak in the middle
  images[3] = [
    [3, 3, 3, 3, 4, 4, 4, 4],
    [3, 3, 3, 4, 4, 4, 4, 4],
    [3, 3, 4, 4, 4, 4, 4, 5],
    [3, 3, 4, 4, 4, 4, 5, 5],
    [3, 4, 4, 4, 4, 4, 4, 5],
    [3, 4, 4, 4, 4, 4, 5, 5],
    [3, 3, 4, 4, 4, 4, 4, 5],
    [3, 3, 3, 4, 4, 4, 5, 5]
  ];

  // High contrast: spread across all levels
  images[4] = [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [0, 1, 2, 3, 4, 5, 6, 7],
    [7, 6, 5, 4, 3, 2, 1, 0],
    [7, 6, 5, 4, 3, 2, 1, 0],
    [0, 0, 0, 0, 7, 7, 7, 7],
    [1, 1, 1, 1, 6, 6, 6, 6],
    [2, 2, 2, 2, 5, 5, 5, 5],
    [3, 3, 3, 3, 4, 4, 4, 4]
  ];

  // Bimodal: two peaks
  images[5] = [
    [0, 0, 1, 1, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1],
    [6, 7, 6, 7, 6, 7, 6, 7],
    [7, 7, 6, 6, 7, 7, 6, 6],
    [6, 6, 7, 7, 6, 6, 7, 7],
    [7, 6, 7, 7, 6, 7, 7, 6]
  ];

  // Compute histogram (counts) for an image
  function computeHist(img) {
    var hist = [];
    for (var i = 0; i < LEVELS; i++) hist.push(0);
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        hist[img[r][c]]++;
      }
    }
    return hist;
  }

  // Compute PDF (normalized)
  function computePDF(hist) {
    var total = 0;
    for (var i = 0; i < hist.length; i++) total += hist[i];
    var pdf = [];
    for (var j = 0; j < hist.length; j++) {
      pdf.push(hist[j] / total);
    }
    return pdf;
  }

  // Compute CDF from PDF
  function computeCDF(pdf) {
    var cdf = [];
    var cum = 0;
    for (var i = 0; i < pdf.length; i++) {
      cum += pdf[i];
      cdf.push(cum);
    }
    return cdf;
  }

  var stepDescriptions = [
    '<b>步骤 1/6 — 灰度图像矩阵：</b>展示 8x8 图像中每个像素的灰度级 (0-7)。不同灰度用不同深浅表示。灰度直方图统计各灰度级出现的次数。',
    '<b>步骤 2/6 — 统计像素计数：</b>统计每个灰度级出现的像素数量。例如灰度级 3 出现了 N 次。这是直方图的基础数据。',
    '<b>步骤 3/6 — 灰度直方图：</b>以灰度级为横轴、频数为纵轴绘制柱状图。直方图反映图像中灰度的分布特征。<code>h(rk) = nk</code>，nk 是灰度级 rk 的像素数。',
    '<b>步骤 4/6 — 归一化直方图 (PDF)：</b>将频数除以总像素数得到概率。<code>p(rk) = nk / N</code>，所有 p(rk) 之和为 1。归一化直方图即灰度概率密度函数。',
    '<b>步骤 5/6 — 累积分布函数 (CDF)：</b>CDF 是 PDF 的累积和。<code>CDF(rk) = SUM[p(rj), j=0..k]</code>，CDF 单调递增，从 0 到 1。CDF 在直方图均衡化中起核心作用。',
    '<b>步骤 6/6 — 直方图解读：</b>暗图像峰值在低灰度级，亮图像峰值在高灰度级，低对比度图像峰值窄而集中，高对比度图像分布均匀，双峰图像有两个分离的峰值。拖动滑块切换图像类型。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStepHeader(step, total) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, W, 32);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('步骤 ' + (step + 1) + ' / ' + total, 12, 16);
    }

    function grayColor(level) {
      var g = Math.round((level / 7) * 255);
      return 'rgb(' + g + ',' + g + ',' + g + ')';
    }

    function drawImageGrid(img, ox, oy, cellSize) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var v = img[r][c];
          var x = ox + c * cellSize;
          var y = oy + r * cellSize;
          ctx.fillStyle = grayColor(v);
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellSize, cellSize);
          ctx.fillStyle = v < 4 ? '#ffffff' : '#1f2937';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(v, x + cellSize / 2, y + cellSize / 2);
        }
      }
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, 8 * cellSize, 8 * cellSize);
    }

    function drawHistogramBars(ox, oy, barAreaW, barAreaH, data, maxVal, color, label, showValues) {
      var barW = barAreaW / LEVELS;
      var gap = 3;

      // Axes
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy + barAreaH);
      ctx.lineTo(ox + barAreaW, oy + barAreaH);
      ctx.stroke();

      for (var i = 0; i < LEVELS; i++) {
        var barH = maxVal > 0 ? (data[i] / maxVal) * (barAreaH - 16) : 0;
        var bx = ox + i * barW + gap / 2;
        var by = oy + barAreaH - barH;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(bx, by, barW - gap, barH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW - gap, barH);

        if (showValues !== false) {
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          var valStr = typeof data[i] === 'number' && data[i] < 1 && data[i] > 0
            ? data[i].toFixed(3)
            : '' + Math.round(data[i] * 1000) / 1000;
          ctx.fillText(valStr, bx + (barW - gap) / 2, by - 2);
        }

        // Gray level label
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(i, ox + i * barW + barW / 2, oy + barAreaH + 4);
      }

      // Axis labels
      if (label) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, ox + barAreaW / 2, oy + barAreaH + 20);
      }

      // Y-axis label
      ctx.save();
      ctx.translate(ox - 14, oy + barAreaH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('频数', 0, 0);
      ctx.restore();
    }

    // ---------- Step 0: Show image grid ----------
    function drawStep0(imgType) {
      drawStepHeader(0, 6);
      var img = images[imgType];
      var cellSize = 32;
      var ox = 24;
      var oy = 44;

      drawImageGrid(img, ox, oy, cellSize);

      // Gray level legend
      var lx = ox + 8 * cellSize + 20;
      var ly = oy + 10;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('灰度级图例 (0-7):', lx, ly);

      for (var i = 0; i < LEVELS; i++) {
        var gx = lx + (i * 30);
        var gy = ly + 24;
        ctx.fillStyle = grayColor(i);
        ctx.fillRect(gx, gy, 26, 26);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(gx, gy, 26, 26);
        ctx.fillStyle = i < 4 ? '#ffffff' : '#1f2937';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, gx + 13, gy + 13);
      }

      // Info panel
      var py = ly + 60;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx, py, 340, 160);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, py, 340, 160);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '图像尺寸: 8 x 8 = 64 像素',
        '灰度级数: 8 级 (0-7)',
        '图像类型: ' + imageTypes[imgType].name,
        '',
        '灰度直方图是图像处理中最基本的',
        '统计工具之一，它描述了图像中',
        '各灰度级出现的频率分布。',
        '',
        '下一步将统计每个灰度级的像素数量。'
      ];
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], lx + 12, py + 16 + j * 16);
      }
    }

    // ---------- Step 1: Count pixels ----------
    function drawStep1(imgType) {
      drawStepHeader(1, 6);
      var img = images[imgType];
      var hist = computeHist(img);
      var cellSize = 26;
      var ox = 16;
      var oy = 40;

      drawImageGrid(img, ox, oy, cellSize);

      // Tally / count table
      var tx = ox + 8 * cellSize + 16;
      var ty = oy;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx, ty, 380, 300);
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx, ty, 380, 300);

      ctx.fillStyle = AMBER;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('像素计数统计', tx + 12, ty + 8);

      // Table header
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(tx + 8, ty + 30, 364, 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('灰度级', tx + 16, ty + 34);
      ctx.fillText('灰度色块', tx + 80, ty + 34);
      ctx.fillText('计数', tx + 170, ty + 34);
      ctx.fillText('比例', tx + 240, ty + 34);
      ctx.fillText('条形', tx + 310, ty + 34);

      var maxCount = 0;
      for (var i = 0; i < LEVELS; i++) {
        if (hist[i] > maxCount) maxCount = hist[i];
      }

      for (var k = 0; k < LEVELS; k++) {
        var ry = ty + 56 + k * 30;

        // Gray level number
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(k, tx + 24, ry + 4);

        // Color swatch
        ctx.fillStyle = grayColor(k);
        ctx.fillRect(tx + 84, ry, 20, 20);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx + 84, ry, 20, 20);

        // Count
        ctx.fillStyle = INDIGO;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(hist[k], tx + 176, ry + 4);

        // Percentage
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '11px monospace';
        ctx.fillText((hist[k] / TOTAL * 100).toFixed(1) + '%', tx + 236, ry + 4);

        // Mini bar
        var barMaxW = 60;
        var barH = 12;
        var barW = maxCount > 0 ? (hist[k] / maxCount) * barMaxW : 0;
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(tx + 310, ry + 4, barMaxW, barH);
        ctx.fillStyle = INDIGO;
        ctx.fillRect(tx + 310, ry + 4, barW, barH);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('总像素: ' + TOTAL, tx + 12, ty + 56 + LEVELS * 30 + 8);
    }

    // ---------- Step 2: Histogram bar chart ----------
    function drawStep2(imgType) {
      drawStepHeader(2, 6);
      var img = images[imgType];
      var hist = computeHist(img);

      // Small image grid on left
      var cellSize = 20;
      var ox = 16;
      var oy = 40;
      drawImageGrid(img, ox, oy, cellSize);

      // Large histogram on right
      var hx = ox + 8 * cellSize + 24;
      var hy = oy + 4;
      var hw = W - hx - 20;
      var hh = 240;

      var maxCount = 0;
      for (var i = 0; i < LEVELS; i++) {
        if (hist[i] > maxCount) maxCount = hist[i];
      }

      drawHistogramBars(hx, hy, hw, hh, hist, maxCount * 1.15, INDIGO, '灰度级 (0-7)', true);

      // Title
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('灰度直方图  h(rk) = nk', hx + hw / 2, hy - 4);

      // Formula box at bottom
      var fy = hy + hh + 40;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(16, fy, W - 32, 50);
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, fy, W - 32, 50);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('直方图定义: h(rk) = nk，其中 rk 为第 k 个灰度级，nk 为该灰度级的像素数量。', 30, fy + 18);
      ctx.fillText('图像类型: ' + imageTypes[imgType].name + '    总像素: ' + TOTAL, 30, fy + 36);
    }

    // ---------- Step 3: Normalized histogram (PDF) ----------
    function drawStep3(imgType) {
      drawStepHeader(3, 6);
      var img = images[imgType];
      var hist = computeHist(img);
      var pdf = computePDF(hist);

      // Histogram on top-left
      var hx = 30;
      var hy = 44;
      var hw = 280;
      var hh = 140;

      var maxCount = 0;
      for (var i = 0; i < LEVELS; i++) {
        if (hist[i] > maxCount) maxCount = hist[i];
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('原始直方图 (频数)', hx + hw / 2, hy - 2);
      drawHistogramBars(hx, hy, hw, hh, hist, maxCount * 1.15, INDIGO, '灰度级', true);

      // PDF on top-right
      var px = hx + hw + 30;
      var py = hy;
      var pw = 280;
      var ph = 140;

      var maxPDF = 0;
      for (var j = 0; j < LEVELS; j++) {
        if (pdf[j] > maxPDF) maxPDF = pdf[j];
      }

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('归一化直方图 PDF  p(rk) = nk/N', px + pw / 2, py - 2);
      drawHistogramBars(px, py, pw, ph, pdf, maxPDF * 1.15, GREEN, '灰度级', true);

      // Formula and values at bottom
      var fy = hy + hh + 30;
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(20, fy, W - 40, 80);
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, fy, W - 40, 80);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('归一化公式: p(rk) = nk / N', 34, fy + 8);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      var line1 = 'PDF: ';
      for (var k = 0; k < LEVELS; k++) {
        line1 += 'p(' + k + ')=' + pdf[k].toFixed(3);
        if (k < LEVELS - 1) line1 += '  ';
      }
      ctx.fillText(line1, 34, fy + 30);

      var pdfSum = 0;
      for (var s = 0; s < pdf.length; s++) pdfSum += pdf[s];
      ctx.fillText('SUM p(rk) = ' + pdfSum.toFixed(4) + '  (应等于 1.0)', 34, fy + 48);
      ctx.fillText('图像类型: ' + imageTypes[imgType].name + '    N = ' + TOTAL, 34, fy + 64);
    }

    // ---------- Step 4: CDF ----------
    function drawStep4(imgType) {
      drawStepHeader(4, 6);
      var img = images[imgType];
      var hist = computeHist(img);
      var pdf = computePDF(hist);
      var cdf = computeCDF(pdf);

      // PDF bars on left
      var hx = 30;
      var hy = 50;
      var hw = 280;
      var hh = 130;

      var maxPDF = 0;
      for (var i = 0; i < LEVELS; i++) {
        if (pdf[i] > maxPDF) maxPDF = pdf[i];
      }

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('PDF (概率密度)', hx + hw / 2, hy - 2);
      drawHistogramBars(hx, hy, hw, hh, pdf, maxPDF * 1.15, INDIGO, '灰度级', true);

      // CDF curve on right
      var cx = hx + hw + 30;
      var cy = hy;
      var cw = 280;
      var ch = 130;

      ctx.fillStyle = RED;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('CDF (累积分布函数)', cx + cw / 2, cy - 2);

      // Axes for CDF
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + ch);
      ctx.lineTo(cx + cw, cy + ch);
      ctx.stroke();

      // Y-axis labels for CDF (0 to 1)
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('1.0', cx - 4, cy + 4);
      ctx.fillText('0.5', cx - 4, cy + ch / 2);
      ctx.fillText('0.0', cx - 4, cy + ch);

      // X-axis labels
      var barW = cw / LEVELS;
      for (var j = 0; j < LEVELS; j++) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(j, cx + j * barW + barW / 2, cy + ch + 4);
      }

      // CDF curve
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var m = 0; m < LEVELS; m++) {
        var px2 = cx + m * barW + barW / 2;
        var py2 = cy + ch - cdf[m] * (ch - 8);
        if (m === 0) ctx.moveTo(px2, py2);
        else ctx.lineTo(px2, py2);
      }
      ctx.stroke();

      // CDF dots + values
      for (var n = 0; n < LEVELS; n++) {
        var dx = cx + n * barW + barW / 2;
        var dy = cy + ch - cdf[n] * (ch - 8);
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = RED;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(cdf[n].toFixed(3), dx, dy - 6);
      }

      // X-axis label
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('灰度级', cx + cw / 2, cy + ch + 20);

      // Formula box at bottom
      var fy = cy + ch + 36;
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(20, fy, W - 40, 76);
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, fy, W - 40, 76);

      ctx.fillStyle = RED;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('CDF 公式: CDF(rk) = SUM[ p(rj) ], j = 0, 1, ..., k', 34, fy + 8);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      var cdfLine = 'CDF: ';
      for (var q = 0; q < LEVELS; q++) {
        cdfLine += cdf[q].toFixed(3);
        if (q < LEVELS - 1) cdfLine += ', ';
      }
      ctx.fillText(cdfLine, 34, fy + 30);
      ctx.fillText('CDF 单调递增, CDF(r0)=p(r0), CDF(r7)=1.0', 34, fy + 48);
      ctx.fillText('CDF 在直方图均衡化中用于灰度映射: s = round(CDF(r) * (L-1))', 34, fy + 62);
    }

    // ---------- Step 5: Interpretation (slider-driven) ----------
    function drawStep5(imgType) {
      drawStepHeader(5, 6);
      var img = images[imgType];
      var hist = computeHist(img);
      var pdf = computePDF(hist);

      // Image grid on left
      var cellSize = 22;
      var ox = 16;
      var oy = 40;
      drawImageGrid(img, ox, oy, cellSize);

      // Image type label
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(imageTypes[imgType].name, ox + 4 * cellSize, oy + 8 * cellSize + 6);

      // Histogram on right
      var hx = ox + 8 * cellSize + 20;
      var hy = oy + 4;
      var hw = W - hx - 20;
      var hh = 160;

      var maxCount = 0;
      for (var i = 0; i < LEVELS; i++) {
        if (hist[i] > maxCount) maxCount = hist[i];
      }

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(imageTypes[imgType].name + ' — 直方图', hx + hw / 2, hy - 2);
      drawHistogramBars(hx, hy, hw, hh, hist, maxCount * 1.2, INDIGO, '灰度级', true);

      // Interpretation panel
      var iy = hy + hh + 28;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, iy, W - 32, 100);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(16, iy, W - 32, 100);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('直方图特征解读:', 30, iy + 8);

      ctx.font = '11px sans-serif';
      var interpLines;
      switch (imgType) {
        case 1: // dark
          interpLines = [
            '暗图像: 像素集中在低灰度级 (0-2)，直方图峰值在左侧。',
            '图像整体偏暗，亮部细节不足。需要直方图拉伸或均衡化增强。'
          ];
          break;
        case 2: // bright
          interpLines = [
            '亮图像: 像素集中在高灰度级 (5-7)，直方图峰值在右侧。',
            '图像整体偏亮，暗部细节丢失。需要压缩高灰度区间。'
          ];
          break;
        case 3: // low contrast
          interpLines = [
            '低对比度图像: 像素集中在狭窄的灰度范围 (3-5)，直方图呈窄峰。',
            '图像灰暗平淡，缺乏层次感。直方图均衡化可显著改善。'
          ];
          break;
        case 4: // high contrast
          interpLines = [
            '高对比度图像: 像素分布均匀覆盖全部灰度级 (0-7)，直方图较平坦。',
            '图像对比度高，细节清晰。直方图接近理想均匀分布。'
          ];
          break;
        case 5: // bimodal
          interpLines = [
            '双峰图像: 像素集中在两个分离的灰度区间 (0-1 和 6-7)，形成双峰。',
            '适合阈值分割，两个峰之间的谷底即为最佳分割阈值。'
          ];
          break;
        default: // 0 - default
          interpLines = [
            '默认渐变图像: 像素从低灰度到高灰度逐渐过渡，直方图较均匀。',
            '灰度覆盖范围宽，是理想的参考图像。'
          ];
          break;
      }
      for (var k = 0; k < interpLines.length; k++) {
        ctx.fillText(interpLines[k], 30, iy + 30 + k * 18);
      }

      // Slider hint
      ctx.fillStyle = AMBER;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('拖动滑块 (0-5) 切换: 默认/暗/亮/低对比度/高对比度/双峰', W / 2, iy + 86);
    }

    // ---------- Public API ----------

    return {
      totalSteps: 6,
      draw: function (step, sliderValue) {
        clear();
        var imgType = 0;
        if (sliderValue !== undefined) {
          imgType = Math.max(0, Math.min(5, Math.round(sliderValue)));
        }
        switch (step) {
          case 0: drawStep0(imgType); break;
          case 1: drawStep1(imgType); break;
          case 2: drawStep2(imgType); break;
          case 3: drawStep3(imgType); break;
          case 4: drawStep4(imgType); break;
          case 5: drawStep5(imgType); break;
        }
      },
      reset: function () { /* stateless */ },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(13, factory);
})();
