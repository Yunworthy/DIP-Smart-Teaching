/**
 * Noise Types Animation
 *
 * Demonstrates different noise types step-by-step:
 *   Step 0: Original clean 8x8 image (gradient from 50 to 200)
 *   Step 1: Gaussian noise - normal distribution, noisy result + histogram
 *   Step 2: Salt & pepper noise - binary impulse, spikes at 0 and 255
 *   Step 3: Poisson (shot) noise - variance depends on signal intensity
 *   Step 4: Side-by-side comparison of all 3 noise types
 *
 * Registered for KP ID 38 (噪声类型).
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

  // 8x8 gradient image: values from 50 to 200
  var IMG = [];
  (function () {
    for (var r = 0; r < 8; r++) {
      IMG[r] = [];
      for (var c = 0; c < 8; c++) {
        IMG[r][c] = Math.round(50 + (r * 8 + c) * 150 / 63);
      }
    }
  })();

  // Seeded pseudo-random
  var seed = 123;
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function boxMuller() {
    var u1 = seededRandom();
    var u2 = seededRandom();
    return Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  }

  // Pre-generate Gaussian noise
  var gaussNoise = [];
  (function () {
    seed = 123;
    for (var r = 0; r < 8; r++) {
      gaussNoise[r] = [];
      for (var c = 0; c < 8; c++) {
        gaussNoise[r][c] = Math.round(boxMuller() * 25);
      }
    }
  })();

  // Pre-generate salt & pepper mask
  var spNoise = [];
  (function () {
    seed = 456;
    for (var r = 0; r < 8; r++) {
      spNoise[r] = [];
      for (var c = 0; c < 8; c++) {
        var v = seededRandom();
        if (v < 0.08) spNoise[r][c] = 0;       // salt (black)
        else if (v < 0.16) spNoise[r][c] = 255;  // pepper (white)
        else spNoise[r][c] = -1;                   // unchanged
      }
    }
  })();

  // Pre-generate Poisson noise (variance proportional to signal)
  var poissonNoise = [];
  (function () {
    seed = 789;
    for (var r = 0; r < 8; r++) {
      poissonNoise[r] = [];
      for (var c = 0; c < 8; c++) {
        var lam = IMG[r][c] / 10;
        // Approximate Poisson: N(lam, sqrt(lam))
        var z = boxMuller() * Math.sqrt(lam);
        var noisy = Math.round((lam + z) * 10);
        poissonNoise[r][c] = Math.max(0, Math.min(255, noisy));
      }
    }
  })();

  function applyGaussian(img) {
    var out = [];
    for (var r = 0; r < 8; r++) {
      out[r] = [];
      for (var c = 0; c < 8; c++) {
        out[r][c] = Math.max(0, Math.min(255, img[r][c] + gaussNoise[r][c]));
      }
    }
    return out;
  }

  function applySaltPepper(img) {
    var out = [];
    for (var r = 0; r < 8; r++) {
      out[r] = [];
      for (var c = 0; c < 8; c++) {
        out[r][c] = spNoise[r][c] === -1 ? img[r][c] : spNoise[r][c];
      }
    }
    return out;
  }

  var gaussImg = applyGaussian(IMG);
  var spImg = applySaltPepper(IMG);
  var poissonImg = poissonNoise;

  function grayColor(v) {
    var g = Math.max(0, Math.min(255, Math.round(v)));
    return 'rgb(' + g + ',' + g + ',' + g + ')';
  }

  function drawPixelGrid(ox, oy, cellSz, data, showVals, lbl) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        ctx.fillStyle = grayColor(data[r][c]);
        ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        if (showVals && cellSz >= 26) {
          ctx.fillStyle = data[r][c] > 128 ? '#333' : '#eee';
          ctx.font = (cellSz > 30 ? '10' : '8') + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(data[r][c]), ox + c * cellSz + cellSz / 2, oy + r * cellSz + cellSz / 2);
        }
      }
    }
    if (lbl) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(lbl, ox + 4 * cellSz, oy + 8 * cellSz + 16);
    }
  }

  function drawHistogram(ox, oy, w, h, data, color, title) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(ox, oy, w, h);
    ctx.strokeStyle = GRAY_BORDER;
    ctx.strokeRect(ox, oy, w, h);

    if (title) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(title, ox + w / 2, oy - 3);
    }

    // Build histogram from 8x8 data
    var bins = [];
    var binCount = 16;
    var binSize = 256 / binCount;
    for (var b = 0; b < binCount; b++) bins[b] = 0;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var bi = Math.min(binCount - 1, Math.floor(data[r][c] / binSize));
        bins[bi]++;
      }
    }
    var maxBin = 1;
    for (var b2 = 0; b2 < binCount; b2++) if (bins[b2] > maxBin) maxBin = bins[b2];

    var barW = w / binCount;
    for (var b3 = 0; b3 < binCount; b3++) {
      var barH = (bins[b3] / maxBin) * (h - 14);
      ctx.fillStyle = color || LIGHT_INDIGO;
      ctx.fillRect(ox + b3 * barW, oy + h - barH - 2, barW - 1, barH);
    }

    // Axis labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('0', ox, oy + h + 10);
    ctx.textAlign = 'right';
    ctx.fillText('255', ox + w, oy + h + 10);
  }

  function drawNormalCurve(ox, oy, w, h, mu, sigma, color, title) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(ox, oy, w, h);
    ctx.strokeStyle = GRAY_BORDER;
    ctx.strokeRect(ox, oy, w, h);

    if (title) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(title, ox + w / 2, oy - 3);
    }

    // Draw normal distribution curve
    ctx.strokeStyle = color || INDIGO;
    ctx.lineWidth = 2;
    ctx.beginPath();
    var xRange = 4 * sigma;
    for (var px = 0; px < w; px++) {
      var xVal = -xRange + (2 * xRange * px / w) + mu;
      var yVal = Math.exp(-Math.pow(xVal - mu, 2) / (2 * sigma * sigma));
      var yy = oy + h - 4 - yVal * (h - 10);
      if (px === 0) ctx.moveTo(ox + px, yy);
      else ctx.lineTo(ox + px, yy);
    }
    ctx.stroke();
    ctx.lineWidth = 1;

    // Fill under curve
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color || INDIGO;
    ctx.lineTo(ox + w, oy + h - 4);
    ctx.lineTo(ox, oy + h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Axis labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(Math.round(-xRange + mu), ox, oy + h + 10);
    ctx.textAlign = 'center';
    ctx.fillText('\u03BC=' + mu, ox + w / 2, oy + h + 10);
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(xRange + mu), ox + w, oy + h + 10);
  }

  function titleBar(txt) {
    ctx.fillStyle = INDIGO;
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 350, 18);
  }

  var stepDescriptions = [
    '<b>步骤 1/5 — 原始图像：</b>8×8 灰度渐变图像，像素值从 50（暗）平滑过渡到 200（亮），作为噪声对比的基准。',
    '<b>步骤 2/5 — 高斯噪声：</b>噪声服从正态分布 <code>N(μ=0, σ=25)</code>，每个像素独立叠加随机偏移，是最常见的加性噪声模型。',
    '<b>步骤 3/5 — 椒盐噪声：</b>随机像素变为纯黑(0)或纯白(255)，呈脉冲分布。直方图在两端出现明显尖峰。',
    '<b>步骤 4/5 — 泊松噪声：</b>又称散粒噪声，方差与信号强度成正比。亮区域波动更大，暗区域相对平稳。',
    '<b>步骤 5/5 — 综合对比：</b>三种噪声并列展示，对比各自的概率密度函数、视觉效果和直方图特征。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Original clean image
    function drawStep0() {
      titleBar('第1步：原始清洁图像');
      var cs = 36, ox = 190, oy = 55;
      drawPixelGrid(ox, oy, cs, IMG, true, '原始渐变图像 (50→200)');

      // Gradient legend
      var lx = 510, ly = 80;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('像素值渐变：', lx, ly);
      for (var i = 0; i < 120; i++) {
        ctx.fillStyle = grayColor(50 + 150 * i / 120);
        ctx.fillRect(lx + i, ly + 8, 1, 16);
      }
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('50', lx, ly + 38);
      ctx.textAlign = 'right';
      ctx.fillText('200', lx + 120, ly + 38);

      // Histogram of original
      drawHistogram(lx, ly + 60, 140, 80, IMG, GREEN, '原始直方图');

      // Info
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 350, 640, 35);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 350, 640, 35);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('渐变图像涵盖从暗到亮的完整灰度范围，便于观察不同噪声对各亮度区域的影响。', 48, 372);
    }

    // Step 1: Gaussian noise
    function drawStep1() {
      titleBar('第2步：高斯噪声');

      var cs = 28;
      // Original
      drawPixelGrid(20, 55, cs, IMG, false, '原始');
      // Arrow
      ctx.fillStyle = INDIGO;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2192', 268, 175);
      // Noisy
      drawPixelGrid(280, 55, cs, gaussImg, false, '高斯噪声图像');

      // Normal distribution curve
      drawNormalCurve(520, 50, 160, 100, 0, 25, INDIGO, 'PDF: N(0, 25\u00B2)');

      // Noise difference display
      var dy = 200;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('噪声值矩阵 (g - f):', 20, dy);
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var nv = gaussNoise[r][c];
          if (nv > 0) {
            ctx.fillStyle = 'rgba(16,185,129,' + Math.min(0.9, Math.abs(nv) / 30) + ')';
          } else {
            ctx.fillStyle = 'rgba(239,68,68,' + Math.min(0.9, Math.abs(nv) / 30) + ')';
          }
          ctx.fillRect(20 + c * 28, dy + 8 + r * 20, 27, 19);
          ctx.fillStyle = '#333';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((nv > 0 ? '+' : '') + nv, 20 + c * 28 + 14, dy + 8 + r * 20 + 10);
        }
      }
      ctx.textBaseline = 'alphabetic';

      // Histogram of noisy
      drawHistogram(340, 210, 150, 90, gaussImg, LIGHT_INDIGO, '噪声图像直方图');

      // Formula
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(510, 210, 175, 80);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(510, 210, 175, 80);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('高斯噪声 PDF:', 597, 232);
      ctx.font = 'bold 11px monospace';
      ctx.fillText('p(z) = (1/\u221A(2\u03C0\u03C3\u00B2))', 597, 252);
      ctx.fillText('  \u00B7 exp(-(z-\u03BC)\u00B2/2\u03C3\u00B2)', 597, 268);
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('\u03BC=0, \u03C3=25', 597, 285);

      // Info
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(20, 355, 660, 32);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(20, 355, 660, 32);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('高斯噪声：每个像素独立叠加正态分布随机值，直方图展宽但保持钟形分布。', 36, 376);
    }

    // Step 2: Salt & pepper noise
    function drawStep2() {
      titleBar('第3步：椒盐噪声（脉冲噪声）');

      var cs = 28;
      // Original
      drawPixelGrid(20, 55, cs, IMG, false, '原始');
      // Arrow
      ctx.fillStyle = INDIGO;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2192', 268, 175);
      // Noisy
      drawPixelGrid(280, 55, cs, spImg, false, '椒盐噪声图像');

      // Impulse PDF visualization
      var px = 520, py = 50, pw = 160, ph = 100;
      ctx.fillStyle = '#fff';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('脉冲噪声 PDF', px + pw / 2, py - 3);

      // Draw impulse spikes
      var spikePositions = [
        { x: 0.15, label: '0', h: 0.7, color: RED },
        { x: 0.5, label: '未变', h: 0.3, color: GREEN },
        { x: 0.85, label: '255', h: 0.7, color: RED }
      ];
      for (var s = 0; s < spikePositions.length; s++) {
        var sx = px + spikePositions[s].x * pw;
        var sh = spikePositions[s].h * (ph - 20);
        ctx.strokeStyle = spikePositions[s].color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, py + ph - 10);
        ctx.lineTo(sx, py + ph - 10 - sh);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(sx, py + ph - 10 - sh);
        ctx.lineTo(sx - 4, py + ph - 10 - sh + 8);
        ctx.lineTo(sx + 4, py + ph - 10 - sh + 8);
        ctx.closePath();
        ctx.fillStyle = spikePositions[s].color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(spikePositions[s].label, sx, py + ph + 2);
      }

      // Noise mask display
      var dy = 210;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('噪声位置标记：', 20, dy);
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var sv = spNoise[r][c];
          if (sv === 0) {
            ctx.fillStyle = RED;
            ctx.fillRect(20 + c * 28, dy + 6 + r * 20, 27, 19);
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', 20 + c * 28 + 14, dy + 6 + r * 20 + 10);
          } else if (sv === 255) {
            ctx.fillStyle = AMBER;
            ctx.fillRect(20 + c * 28, dy + 6 + r * 20, 27, 19);
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P', 20 + c * 28 + 14, dy + 6 + r * 20 + 10);
          } else {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(20 + c * 28, dy + 6 + r * 20, 27, 19);
          }
        }
      }
      ctx.textBaseline = 'alphabetic';

      // Histogram showing spikes
      drawHistogram(340, 215, 150, 90, spImg, RED, '椒盐噪声直方图');

      // Legend
      ctx.fillStyle = RED;
      ctx.fillRect(520, 230, 12, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('S = 盐(黑,0)', 536, 240);
      ctx.fillStyle = AMBER;
      ctx.fillRect(520, 248, 12, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('P = 椒(白,255)', 536, 258);

      // Info
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(20, 355, 660, 32);
      ctx.strokeStyle = '#fecaca';
      ctx.strokeRect(20, 355, 660, 32);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('椒盐噪声：随机像素变为极值(0或255)，直方图在两端出现尖峰，中值滤波可有效去除。', 36, 376);
    }

    // Step 3: Poisson noise
    function drawStep3() {
      titleBar('第4步：泊松噪声（散粒噪声）');

      var cs = 28;
      // Original
      drawPixelGrid(20, 55, cs, IMG, false, '原始');
      // Arrow
      ctx.fillStyle = INDIGO;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2192', 268, 175);
      // Poisson noisy
      drawPixelGrid(280, 55, cs, poissonImg, false, '泊松噪声图像');

      // Variance vs intensity graph
      var gx = 510, gy = 50, gw = 170, gh = 110;
      ctx.fillStyle = '#fff';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('方差 vs 信号强度', gx + gw / 2, gy - 3);

      // Draw linear relationship: variance = signal
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx + 10, gy + gh - 10);
      ctx.lineTo(gx + gw - 10, gy + 10);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Scatter points showing noise magnitude
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var sig = IMG[r][c];
          var diff = Math.abs(poissonImg[r][c] - sig);
          var px2 = gx + 10 + (sig - 50) / 150 * (gw - 20);
          var py2 = gy + gh - 10 - diff / 80 * (gh - 20);
          ctx.beginPath();
          ctx.arc(px2, py2, 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(79,70,229,0.5)';
          ctx.fill();
        }
      }
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('暗', gx + 4, gy + gh + 10);
      ctx.textAlign = 'right';
      ctx.fillText('亮', gx + gw - 4, gy + gh + 10);

      // Difference matrix
      var dy = 210;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('偏差值 (泊松 - 原始):', 20, dy);
      for (var r2 = 0; r2 < 8; r2++) {
        for (var c2 = 0; c2 < 8; c2++) {
          var dv = poissonImg[r2][c2] - IMG[r2][c2];
          var intensity = Math.min(0.9, Math.abs(dv) / 40);
          if (dv > 0) {
            ctx.fillStyle = 'rgba(16,185,129,' + intensity + ')';
          } else if (dv < 0) {
            ctx.fillStyle = 'rgba(239,68,68,' + intensity + ')';
          } else {
            ctx.fillStyle = '#f3f4f6';
          }
          ctx.fillRect(20 + c2 * 28, dy + 6 + r2 * 20, 27, 19);
          ctx.fillStyle = '#333';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((dv > 0 ? '+' : '') + dv, 20 + c2 * 28 + 14, dy + 6 + r2 * 20 + 10);
        }
      }
      ctx.textBaseline = 'alphabetic';

      // Histogram
      drawHistogram(340, 215, 150, 90, poissonImg, AMBER, '泊松噪声直方图');

      // Formula
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(510, 215, 175, 70);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(510, 215, 175, 70);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('泊松噪声特性:', 597, 235);
      ctx.font = 'bold 11px monospace';
      ctx.fillText('Var = \u03BB = E[X]', 597, 255);
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('方差与信号强度成正比', 597, 275);

      // Info
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(20, 355, 660, 32);
      ctx.strokeStyle = '#fde68a';
      ctx.strokeRect(20, 355, 660, 32);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('泊松噪声：由光子计数统计特性引起，亮区域噪声更大。常见于低光照和医学成像。', 36, 376);
    }

    // Step 4: Side-by-side comparison
    function drawStep4() {
      titleBar('第5步：三种噪声综合对比');

      var cs = 18;
      var gap = 12;
      var startX = 16;
      var oy = 50;

      var panels = [
        { name: '高斯噪声', data: gaussImg, color: INDIGO },
        { name: '椒盐噪声', data: spImg, color: RED },
        { name: '泊松噪声', data: poissonImg, color: AMBER }
      ];

      for (var p = 0; p < 3; p++) {
        var px2 = startX + p * (cs * 8 + gap);
        // Label
        ctx.fillStyle = panels[p].color;
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(panels[p].name, px2 + cs * 4, oy - 4);
        // Image
        drawPixelGrid(px2, oy, cs, panels[p].data, false, '');
      }

      // Original for reference
      var origX = startX + 3 * (cs * 8 + gap);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始图像', origX + cs * 4, oy - 4);
      drawPixelGrid(origX, oy, cs, IMG, false, '');

      // PDF formulas row
      var fy = oy + cs * 8 + 26;
      var pdfPanels = [
        { title: '高斯 PDF', formula: 'p(z)=(1/\u221A2\u03C0\u03C3)exp(-z\u00B2/2\u03C3\u00B2)', color: INDIGO },
        { title: '椒盐 PDF', formula: 'p(z)=Pa\u00B7\u03B4(z)+Pb\u00B7\u03B4(z-255)', color: RED },
        { title: '泊松 PDF', formula: 'P(k)=\u03BB\u1D4F\u00B7e^(-\u03BB)/k!', color: AMBER }
      ];

      for (var q = 0; q < 3; q++) {
        var qx = startX + q * (cs * 8 + gap);
        var qw = cs * 8;
        ctx.fillStyle = '#fff';
        ctx.fillRect(qx, fy, qw, 44);
        ctx.strokeStyle = pdfPanels[q].color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(qx, fy, qw, 44);
        ctx.fillStyle = pdfPanels[q].color;
        ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pdfPanels[q].title, qx + qw / 2, fy + 14);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '9px monospace';
        ctx.fillText(pdfPanels[q].formula, qx + qw / 2, fy + 32);
        ctx.lineWidth = 1;
      }

      // Histograms row
      var hy = fy + 60;
      for (var h2 = 0; h2 < 3; h2++) {
        var hx = startX + h2 * (cs * 8 + gap);
        drawHistogram(hx, hy, cs * 8, 70, panels[h2].data, panels[h2].color, panels[h2].name + ' 直方图');
      }
      // Original histogram
      drawHistogram(origX, hy, cs * 8, 70, IMG, GREEN, '原始直方图');

      // Comparison table
      var ty = hy + 90;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(startX, ty, 668, 62);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(startX, ty, 668, 62);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var rows = [
        '高斯噪声: 均匀影响所有像素，直方图展宽   |  椒盐噪声: 只影响少数像素为极值   |  泊松噪声: 方差随亮度变化',
        '去噪方法: 均值/高斯滤波                    |  去噪方法: 中值滤波               |  去噪方法: 方差稳定变换(VST)'
      ];
      for (var ri = 0; ri < rows.length; ri++) {
        ctx.fillText(rows[ri], startX + 12, ty + 18 + ri * 18);
      }
    }

    return {
      totalSteps: 5,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(); break;
          case 3: drawStep3(); break;
          case 4: drawStep4(); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(38, factory);
})();
