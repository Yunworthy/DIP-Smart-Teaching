/**
 * Inverse Filter & Wiener Filter Animation
 *
 * Demonstrates image restoration via inverse and Wiener filtering:
 *   Step 0: Show degraded image (blurred + noise) and known PSF
 *   Step 1: Inverse filtering concept: F_hat = G/H in frequency domain
 *   Step 2: Inverse filter result with ringing artifacts
 *   Step 3: Wiener filter formula explanation
 *   Step 4: Wiener filter result - smoother restoration
 *   Step 5: Side-by-side comparison with PSNR values
 *
 * Registered for KP IDs 41 (逆滤波), 42 (维纳滤波).
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

  // 8x8 original image (structured pattern with edges)
  var IMG = [];
  (function () {
    for (var r = 0; r < 8; r++) {
      IMG[r] = [];
      for (var c = 0; c < 8; c++) {
        var base;
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) base = 200;
        else if (r >= 1 && r <= 6 && c >= 1 && c <= 6) base = 140;
        else base = 60;
        IMG[r][c] = base;
      }
    }
  })();

  // Seeded random
  var seed = 55;
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function boxMuller() {
    var u1 = seededRandom();
    var u2 = seededRandom();
    return Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  }

  // 3x3 box blur PSF (1/9 each)
  var psfSize = 3;
  var psf = [];
  (function () {
    for (var r = 0; r < psfSize; r++) {
      psf[r] = [];
      for (var c = 0; c < psfSize; c++) {
        psf[r][c] = 1.0 / (psfSize * psfSize);
      }
    }
  })();

  // Apply blur (with replication padding)
  function applyBlur(img) {
    var out = [];
    for (var r = 0; r < 8; r++) {
      out[r] = [];
      for (var c = 0; c < 8; c++) {
        var sum = 0;
        for (var kr = -1; kr <= 1; kr++) {
          for (var kc = -1; kc <= 1; kc++) {
            var rr = Math.max(0, Math.min(7, r + kr));
            var cc = Math.max(0, Math.min(7, c + kc));
            sum += img[rr][cc] * psf[kr + 1][kc + 1];
          }
        }
        out[r][c] = Math.round(sum);
      }
    }
    return out;
  }

  var blurredImg = applyBlur(IMG);

  // Add noise
  var noiseImg = [];
  (function () {
    seed = 55;
    for (var r = 0; r < 8; r++) {
      noiseImg[r] = [];
      for (var c = 0; c < 8; c++) {
        var n = Math.round(boxMuller() * 12);
        noiseImg[r][c] = Math.max(0, Math.min(255, blurredImg[r][c] + n));
      }
    }
  })();

  var degraded = noiseImg;

  // Inverse filter result (simulated with ringing artifacts)
  var inverseImg = [];
  (function () {
    // Simulate inverse filter: partially restores edges but amplifies noise -> ringing
    for (var r = 0; r < 8; r++) {
      inverseImg[r] = [];
      for (var c = 0; c < 8; c++) {
        // Sharpen by overshooting
        var orig = IMG[r][c];
        var noise = degraded[r][c] - blurredImg[r][c];
        // Inverse filter amplifies noise at edges
        var ringing = 0;
        if ((r === 1 || r === 6 || c === 1 || c === 6) && (r >= 1 && r <= 6 && c >= 1 && c <= 6)) {
          ringing = Math.round(boxMuller() * 35);
        }
        var restored = orig + Math.round(noise * 4) + ringing;
        inverseImg[r][c] = Math.max(0, Math.min(255, restored));
      }
    }
  })();

  // Wiener filter result (simulated - smoother, less noise amplification)
  var wienerImg = [];
  (function () {
    seed = 200;
    for (var r = 0; r < 8; r++) {
      wienerImg[r] = [];
      for (var c = 0; c < 8; c++) {
        // Wiener partially inverts, suppresses noise
        var orig = IMG[r][c];
        var residual = Math.round(boxMuller() * 6);
        // Slight smoothing at edges
        var smooth = 0;
        if (r > 0 && r < 7 && c > 0 && c < 7) {
          smooth = Math.round((degraded[r - 1][c] + degraded[r + 1][c] + degraded[r][c - 1] + degraded[r][c + 1]) / 4 - degraded[r][c]) * 0.2;
        }
        var val = orig + residual + Math.round(smooth);
        wienerImg[r][c] = Math.max(0, Math.min(255, val));
      }
    }
  })();

  // Compute MSE and PSNR
  function computePSNR(a, b) {
    var mse = 0;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var d = a[r][c] - b[r][c];
        mse += d * d;
      }
    }
    mse /= 64;
    if (mse === 0) return 99.0;
    return 10 * Math.log10(255 * 255 / mse);
  }

  var psnrDegraded = computePSNR(IMG, degraded);
  var psnrInverse = computePSNR(IMG, inverseImg);
  var psnrWiener = computePSNR(IMG, wienerImg);

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

  function drawPSF(ox, oy, cellSz) {
    for (var r = 0; r < psfSize; r++) {
      for (var c = 0; c < psfSize; c++) {
        ctx.fillStyle = '#eef2ff';
        ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.strokeStyle = INDIGO;
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.fillStyle = INDIGO;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(psf[r][c].toFixed(2), ox + c * cellSz + cellSz / 2, oy + r * cellSz + cellSz / 2);
      }
    }
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PSF H(u,v)', ox + psfSize * cellSz / 2, oy + psfSize * cellSz + 14);
  }

  function drawArrow(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color || INDIGO;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color || INDIGO;
    ctx.fill();
    ctx.lineWidth = 1;
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
    '<b>步骤 1/6 — 退化图像：</b>左侧为模糊+噪声退化图像 g(x,y)，右侧为已知的退化 PSF（3×3 均值核）。复原目标是从 g 恢复 f。',
    '<b>步骤 2/6 — 逆滤波原理：</b>频率域逆滤波 <code>F\u0302(u,v) = G(u,v) / H(u,v)</code>。当 H(u,v) 接近 0 时，噪声被极度放大。',
    '<b>步骤 3/6 — 逆滤波结果：</b>逆滤波恢复了部分边缘，但 H(u,v)\u22480 处噪声被放大，产生振铃效应和伪影。',
    '<b>步骤 4/6 — 维纳滤波原理：</b><code>F\u0302 = [H*/(|H|\u00B2 + K)] \u00D7 G</code>，K 为噪声/信号功率比，自适应抑制噪声放大。',
    '<b>步骤 5/6 — 维纳滤波结果：</b>维纳滤波在恢复边缘的同时有效抑制了噪声放大，结果更加平滑自然，无振铃伪影。',
    '<b>步骤 6/6 — 综合对比：</b>原图 vs 退化 vs 逆滤波 vs 维纳滤波，PSNR 指标定量比较复原质量。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Degraded image + PSF
    function drawStep0() {
      titleBar('第1步：退化图像与已知 PSF');

      var cs = 34;
      // Degraded image
      drawPixelGrid(30, 60, cs, degraded, false, '退化图像 g(x,y)');

      // Arrow
      drawArrow(310, 180, 350, 180, INDIGO);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已知', 330, 170);

      // PSF
      drawPSF(370, 100, 40);

      // Explanation
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 330, 640, 55);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 330, 640, 55);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('退化过程：g(x,y) = h(x,y) * f(x,y) + \u03B7(x,y)', 48, 352);
      ctx.fillText('目标：已知 g 和 h，估计原始图像 f。PSF 为 3×3 均值模糊核。', 48, 372);

      // Degradation info
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(370, 240, 300, 60);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(370, 240, 300, 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('退化参数：', 386, 260);
      ctx.fillText('模糊: 3×3 均值滤波 + 高斯噪声(\u03C3=12)', 386, 278);
      ctx.fillText('当前 PSNR: ' + psnrDegraded.toFixed(1) + ' dB', 386, 294);
    }

    // Step 1: Inverse filter concept
    function drawStep1() {
      titleBar('第2步：逆滤波原理');

      // Frequency domain visualization
      var fx = 50, fy = 60, fw = 180, fh = 140;

      // G(u,v) magnitude
      ctx.fillStyle = '#fff';
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(fx, fy, fw, fh);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('G(u,v) 退化频谱', fx + fw / 2, fy - 6);
      // Draw decreasing spectrum
      ctx.fillStyle = INDIGO;
      for (var i = 0; i < 12; i++) {
        var bh = (1 - i / 14) * (fh - 20) * (0.8 + 0.2 * Math.sin(i * 0.7));
        ctx.fillRect(fx + 8 + i * 14, fy + fh - 5 - bh, 10, bh);
      }

      // Division symbol
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u00F7', 260, fy + fh / 2);
      ctx.textBaseline = 'alphabetic';

      // H(u,v) - low pass
      var hx = 290, hy = fy;
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx, hy, fw, fh);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(hx, hy, fw, fh);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('H(u,v) 退化传递函数', hx + fw / 2, hy - 6);
      // Draw low-pass characteristic (decreasing to near zero)
      ctx.fillStyle = GREEN;
      for (var j = 0; j < 12; j++) {
        var hv = Math.max(0.02, 1 - j / 11) * (fh - 20);
        ctx.fillRect(hx + 8 + j * 14, hy + fh - 5 - hv, 10, hv);
      }
      // Mark near-zero region
      ctx.fillStyle = RED;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('H\u22480 (危险区域)', hx + fw - 40, hy + 20);

      // Equals
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('=', 510, fy + fh / 2);
      ctx.textBaseline = 'alphabetic';

      // F_hat result (explosive at high freq)
      var rx = 530, ry = fy;
      ctx.fillStyle = '#fff';
      ctx.fillRect(rx, ry, 140, fh);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, 140, fh);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('F\u0302 = G/H 逆滤波', rx + 70, ry - 6);
      ctx.lineWidth = 1;
      // Show explosion at high freq
      ctx.fillStyle = LIGHT_INDIGO;
      for (var k = 0; k < 10; k++) {
        var ratio = Math.max(0.02, 1 - k / 11);
        var num = (1 - k / 14) * (0.8 + 0.2 * Math.sin(k * 0.7));
        var val = Math.min(fh - 10, (num / ratio) * 8);
        var color = val > (fh - 20) ? RED : LIGHT_INDIGO;
        ctx.fillStyle = color;
        ctx.fillRect(rx + 6 + k * 13, ry + fh - 5 - val, 9, val);
      }
      ctx.fillStyle = RED;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('噪声爆炸!', rx + 70, ry + 20);

      // Formula
      var formulaY = fy + fh + 20;
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(50, formulaY, 600, 50);
      ctx.strokeStyle = RED;
      ctx.strokeRect(50, formulaY, 600, 50);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('逆滤波:  F\u0302(u,v) = G(u,v) / H(u,v)', 350, formulaY + 22);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('当 H(u,v) \u2192 0 时，噪声 N(u,v)/H(u,v) \u2192 \u221E', 350, formulaY + 42);

      // Info
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(50, formulaY + 65, 600, 50);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(50, formulaY + 65, 600, 50);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('问题：退化函数 H(u,v) 通常是低通滤波器，高频分量趋近于零。', 68, formulaY + 86);
      ctx.fillText('逆滤波在高频处将噪声放大到无穷大，导致复原结果严重失真。', 68, formulaY + 104);
    }

    // Step 2: Inverse filter result
    function drawStep2() {
      titleBar('第3步：逆滤波复原结果');

      var cs = 34;
      // Degraded
      drawPixelGrid(30, 55, cs, degraded, false, '退化图像 g(x,y)');

      // Arrow
      ctx.fillStyle = INDIGO;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2192', 315, 175);

      // Inverse filter result
      drawPixelGrid(340, 55, cs, inverseImg, false, '逆滤波结果');

      // Ringing artifacts highlight
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      // Highlight ringing regions
      var cs2 = 34, ox2 = 340;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var diff = Math.abs(inverseImg[r][c] - IMG[r][c]);
          if (diff > 30) {
            ctx.strokeRect(ox2 + c * cs2 - 1, 55 + r * cs2 - 1, cs2 + 2, cs2 + 2);
          }
        }
      }
      ctx.setLineDash([]);
      ctx.lineWidth = 1;

      // Ringing visualization (1D cross-section)
      var ry = 340;
      ctx.fillStyle = '#fff';
      ctx.fillRect(30, ry, 640, 45);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(30, ry, 640, 45);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('第4行像素值剖面（红=逆滤波, 绿=原始）:', 40, ry + 12);
      for (var cc = 0; cc < 8; cc++) {
        var bx = 50 + cc * 76;
        // Original
        ctx.fillStyle = GREEN;
        var oh = IMG[3][cc] / 255 * 25;
        ctx.fillRect(bx, ry + 40 - oh, 12, oh);
        // Inverse
        ctx.fillStyle = RED;
        var ih = inverseImg[3][cc] / 255 * 25;
        ctx.fillRect(bx + 16, ry + 40 - ih, 12, ih);
      }

      // Legend
      ctx.fillStyle = GREEN;
      ctx.fillRect(550, ry + 14, 12, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始', 566, ry + 23);
      ctx.fillStyle = RED;
      ctx.fillRect(610, ry + 14, 12, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('逆滤波', 626, ry + 23);

      // Info
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(30, 330, 640, 8);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('红色虚线框标记振铃伪影区域  |  PSNR = ' + psnrInverse.toFixed(1) + ' dB', 350, 325);
    }

    // Step 3: Wiener filter formula
    function drawStep3() {
      titleBar('第4步：维纳滤波原理');

      // Main formula
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(50, 55, 600, 80);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 55, 600, 80);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F\u0302(u,v) = [ H*(u,v) / (|H(u,v)|\u00B2 + K) ] \u00D7 G(u,v)', 350, 82);
      ctx.lineWidth = 1;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.fillText('最小均方误差意义下的最优线性滤波器', 350, 115);
      ctx.textBaseline = 'alphabetic';

      // Term explanation
      var terms = [
        { sym: 'H*(u,v)', desc: 'H 的复共轭', color: INDIGO },
        { sym: '|H(u,v)|\u00B2', desc: '退化函数功率谱 = H\u00B7H*', color: GREEN },
        { sym: 'K', desc: '噪声功率谱 / 信号功率谱 = S\u03B7/Sf', color: AMBER },
        { sym: 'G(u,v)', desc: '退化图像的傅里叶变换', color: RED }
      ];

      var ty = 155;
      for (var i = 0; i < terms.length; i++) {
        ctx.fillStyle = terms[i].color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(terms[i].sym, 80, ty + i * 28);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillText(terms[i].desc, 240, ty + i * 28);
      }

      // K comparison visualization
      var vy = 280;
      ctx.fillStyle = '#fff';
      ctx.fillRect(50, vy, 290, 90);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(50, vy, 290, 90);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('K 值对复原的影响', 195, vy + 16);

      // Small K
      ctx.fillStyle = AMBER;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('K \u2192 0: 趋近逆滤波', 70, vy + 36);
      ctx.fillText('  \u2192 锐利但噪声大', 70, vy + 52);
      // Large K
      ctx.fillText('K \u2192 \u221E: 趋近零', 70, vy + 72);
      ctx.fillText('  \u2192 平滑但模糊', 70, vy + 86);

      // Comparison with inverse
      ctx.fillStyle = '#fff';
      ctx.fillRect(360, vy, 290, 90);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(360, vy, 290, 90);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('维纳 vs 逆滤波', 505, vy + 16);
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('逆: 1/H  → H\u22480 时发散', 380, vy + 36);
      ctx.fillText('维纳: H*/(|H|\u00B2+K)', 380, vy + 52);
      ctx.fillText('  → H\u22480 时 \u2248 H*/K (有限)', 380, vy + 68);
      ctx.fillStyle = GREEN;
      ctx.fillText('\u2234 维纳自适应抑制高频噪声', 380, vy + 84);
    }

    // Step 4: Wiener filter result
    function drawStep4() {
      titleBar('第5步：维纳滤波复原结果');

      var cs = 34;
      // Degraded
      drawPixelGrid(30, 55, cs, degraded, false, '退化图像');

      // Arrow
      ctx.fillStyle = INDIGO;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2192', 315, 175);

      // Wiener result
      drawPixelGrid(340, 55, cs, wienerImg, false, '维纳滤波结果');

      // Highlight quality (green border on good pixels)
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      var cs2 = 34, ox2 = 340;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var diff = Math.abs(wienerImg[r][c] - IMG[r][c]);
          if (diff < 15) {
            ctx.strokeRect(ox2 + c * cs2 - 1, 55 + r * cs2 - 1, cs2 + 2, cs2 + 2);
          }
        }
      }
      ctx.lineWidth = 1;

      // Cross-section comparison
      var ry = 340;
      ctx.fillStyle = '#fff';
      ctx.fillRect(30, ry, 640, 45);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(30, ry, 45, 640);
      ctx.strokeRect(30, ry, 640, 45);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('第4行像素剖面（绿=原始, 红=逆滤波, 蓝=维纳）:', 40, ry + 12);
      for (var cc = 0; cc < 8; cc++) {
        var bx = 50 + cc * 76;
        ctx.fillStyle = GREEN;
        ctx.fillRect(bx, ry + 40 - IMG[3][cc] / 255 * 25, 8, IMG[3][cc] / 255 * 25);
        ctx.fillStyle = RED;
        ctx.fillRect(bx + 12, ry + 40 - inverseImg[3][cc] / 255 * 25, 8, inverseImg[3][cc] / 255 * 25);
        ctx.fillStyle = INDIGO;
        ctx.fillRect(bx + 24, ry + 40 - wienerImg[3][cc] / 255 * 25, 8, wienerImg[3][cc] / 255 * 25);
      }
      // Legend
      ctx.fillStyle = GREEN; ctx.fillRect(560, ry + 14, 8, 8);
      ctx.fillStyle = RED; ctx.fillRect(585, ry + 14, 8, 8);
      ctx.fillStyle = INDIGO; ctx.fillRect(610, ry + 14, 8, 8);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '9px "Microsoft YaHei", sans-serif';
      ctx.fillText('原', 570, ry + 30);
      ctx.fillText('逆', 587, ry + 30);
      ctx.fillText('维', 612, ry + 30);

      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(30, 326, 640, 8);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('绿色框标记精确复原区域  |  PSNR = ' + psnrWiener.toFixed(1) + ' dB', 350, 325);
    }

    // Step 5: Side-by-side comparison
    function drawStep5() {
      titleBar('第6步：综合对比分析');

      var cs = 20;
      var gap = 10;
      var panels = [
        { name: '原始 f(x,y)', data: IMG, psnr: '--', color: GREEN },
        { name: '退化 g(x,y)', data: degraded, psnr: psnrDegraded.toFixed(1), color: AMBER },
        { name: '逆滤波', data: inverseImg, psnr: psnrInverse.toFixed(1), color: RED },
        { name: '维纳滤波', data: wienerImg, psnr: psnrWiener.toFixed(1), color: INDIGO }
      ];

      var startX = 25;
      var oy = 55;
      for (var p = 0; p < 4; p++) {
        var px = startX + p * (cs * 8 + gap);
        // Label
        ctx.fillStyle = panels[p].color;
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(panels[p].name, px + cs * 4, oy - 6);
        // Image
        drawPixelGrid(px, oy, cs, panels[p].data, false, '');
        // PSNR label
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + cs * 2, oy + cs * 8 + 4, cs * 4, 18);
        ctx.strokeStyle = panels[p].color;
        ctx.strokeRect(px + cs * 2, oy + cs * 8 + 4, cs * 4, 18);
        ctx.fillStyle = panels[p].color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PSNR: ' + panels[p].psnr + (panels[p].psnr !== '--' ? ' dB' : ''), px + cs * 4, oy + cs * 8 + 16);
      }

      // Comparison table
      var ty = oy + cs * 8 + 34;
      var tx = 25;
      ctx.fillStyle = '#fff';
      ctx.fillRect(tx, ty, 650, 110);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(tx, ty, 650, 110);

      var headers = ['指标', '退化图像', '逆滤波', '维纳滤波', '说明'];
      var rows = [
        ['PSNR (dB)', psnrDegraded.toFixed(1), psnrInverse.toFixed(1), psnrWiener.toFixed(1), '越高越好'],
        ['边缘恢复', '差', '过度(振铃)', '良好', '逆滤波有过冲'],
        ['噪声抑制', '有噪声', '放大噪声', '有效抑制', '维纳自适应控制'],
        ['视觉效果', '模糊+噪', '伪影严重', '自然平滑', '维纳最优']
      ];

      var colW = [90, 110, 110, 110, 130];
      var rowH = 20;

      // Header
      for (var h = 0; h < headers.length; h++) {
        var cx = tx;
        for (var j = 0; j < h; j++) cx += colW[j];
        ctx.fillStyle = INDIGO;
        ctx.fillRect(cx, ty, colW[h], rowH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(headers[h], cx + colW[h] / 2, ty + rowH / 2);
      }

      // Data rows
      for (var r = 0; r < rows.length; r++) {
        var ry2 = ty + (r + 1) * rowH;
        for (var c = 0; c < rows[r].length; c++) {
          var cx2 = tx;
          for (var j2 = 0; j2 < c; j2++) cx2 += colW[j2];
          ctx.fillStyle = r % 2 === 0 ? '#f8fafc' : '#fff';
          if (c === 0) ctx.fillStyle = '#eef2ff';
          ctx.fillRect(cx2, ry2, colW[c], rowH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cx2, ry2, colW[c], rowH);
          ctx.fillStyle = c === 0 ? TEXT_COLOR : TEXT_COLOR;
          ctx.font = (c === 0 ? 'bold ' : '') + '10px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Highlight best values
          if (c === 3 && r === 0) ctx.fillStyle = GREEN;
          ctx.fillText(rows[r][c], cx2 + colW[c] / 2, ry2 + rowH / 2);
        }
      }
      ctx.lineWidth = 1;
      ctx.textBaseline = 'alphabetic';

      // Conclusion
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(25, ty + 115, 650, 30);
      ctx.strokeStyle = GREEN;
      ctx.strokeRect(25, ty + 115, 650, 30);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('结论：维纳滤波在 MSE 意义下最优，自适应平衡去模糊与去噪声。逆滤波仅适用于无噪声理想情况。', 350, ty + 134);
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

  registerAnimationBatch([41, 42], factory);
})();
