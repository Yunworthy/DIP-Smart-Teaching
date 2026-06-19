/**
 * Degradation Model Animation
 *
 * Demonstrates image degradation model step-by-step:
 *   Step 0: Show clear 8x8 checkerboard image
 *   Step 1: Degradation model flowchart: f(x,y) -> [H] -> [+noise] -> g(x,y)
 *   Step 2: Motion blur PSF visualization with progressive blur
 *   Step 3: Add Gaussian noise on top of blurred image
 *   Step 4: Fully degraded image with PSF matrix and noise distribution
 *   Step 5: Formula panel explaining g(x,y) = h(x,y) * f(x,y) + eta(x,y)
 *
 * Slider (0-100): controls blur amount (motion blur length).
 *
 * Registered for KP IDs 37 (图像退化模型), 40 (运动模糊模型).
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

  // 8x8 checkerboard pattern
  var IMG = [];
  (function () {
    for (var r = 0; r < 8; r++) {
      IMG[r] = [];
      for (var c = 0; c < 8; c++) {
        IMG[r][c] = (r + c) % 2 === 0 ? 200 : 50;
      }
    }
  })();

  // Simple seeded pseudo-random for reproducible noise
  var seed = 42;
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // Pre-generate Gaussian noise 8x8
  var gaussNoise = [];
  (function () {
    seed = 42;
    for (var r = 0; r < 8; r++) {
      gaussNoise[r] = [];
      for (var c = 0; c < 8; c++) {
        // Box-Muller transform
        var u1 = seededRandom();
        var u2 = seededRandom();
        var z = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
        gaussNoise[r][c] = Math.round(z * 25);
      }
    }
  })();

  // Motion blur: horizontal PSF of given length applied to image
  function applyMotionBlur(img, length) {
    var out = [];
    var len = Math.max(1, Math.round(length));
    for (var r = 0; r < 8; r++) {
      out[r] = [];
      for (var c = 0; c < 8; c++) {
        var sum = 0;
        var count = 0;
        for (var k = 0; k < len; k++) {
          var cc = Math.min(7, c + k);
          sum += img[r][cc];
          count++;
        }
        out[r][c] = Math.round(sum / count);
      }
    }
    return out;
  }

  function addNoise(img, noise) {
    var out = [];
    for (var r = 0; r < 8; r++) {
      out[r] = [];
      for (var c = 0; c < 8; c++) {
        var v = img[r][c] + noise[r][c];
        out[r][c] = Math.max(0, Math.min(255, v));
      }
    }
    return out;
  }

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
        if (showVals && cellSz >= 28) {
          ctx.fillStyle = data[r][c] > 128 ? '#333' : '#eee';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(data[r][c]), ox + c * cellSz + cellSz / 2, oy + r * cellSz + cellSz / 2);
        }
      }
    }
    if (lbl) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(lbl, ox + 4 * cellSz, oy + 8 * cellSz + 18);
    }
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

  function drawBox(x, y, w, h, text, bgColor, borderColor) {
    ctx.fillStyle = bgColor || '#eef2ff';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = borderColor || INDIGO;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
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
    '<b>步骤 1/6 — 原始图像：</b>展示清晰的 8×8 棋盘格图像 <code>f(x,y)</code>，黑白交替方格形成鲜明对比，便于观察后续退化效果。',
    '<b>步骤 2/6 — 退化模型：</b>图像退化流程为 <code>f(x,y) → H(退化函数) → +η(噪声) → g(x,y)</code>。退化函数 H 通常为点扩散函数 PSF，η 为加性噪声。',
    '<b>步骤 3/6 — 运动模糊：</b>运动模糊 PSF 沿某一方向的线性平均。拖动滑块可调整运动模糊长度（1~8像素），越长模糊越强。',
    '<b>步骤 4/6 — 加性噪声：</b>在模糊图像上叠加高斯噪声（μ=0, σ=25），模拟传感器热噪声等。噪声以半透明层覆盖显示。',
    '<b>步骤 5/6 — 退化结果：</b>左侧为完全退化图像 g(x,y)，中间展示 PSF 矩阵（运动模糊核），右侧为噪声分布直方图。',
    '<b>步骤 6/6 — 退化公式：</b><code>g(x,y) = h(x,y) * f(x,y) + η(x,y)</code>，其中 * 为卷积运算，h 为退化函数（PSF），η 为加性噪声。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Show clear image
    function drawStep0(sliderValue) {
      titleBar('第1步：原始图像 f(x,y)');
      var cs = 38, ox = 180, oy = 55;
      drawPixelGrid(ox, oy, cs, IMG, true, '原始图像 f(x,y) — 8×8 棋盘格');

      // Info panel
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 340, 640, 45);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 340, 640, 45);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('棋盘格图像：像素值仅取 50（暗）和 200（亮），具有丰富的高频边缘信息。', 48, 366);
    }

    // Step 1: Degradation model flowchart
    function drawStep1(sliderValue) {
      titleBar('第2步：图像退化模型');

      // Flowchart centered
      var cy = 140;
      // f(x,y) box
      drawBox(40, cy - 25, 100, 50, 'f(x,y)', '#ecfdf5', GREEN);
      // Arrow
      drawArrow(145, cy, 195, cy, INDIGO);
      // H box
      drawBox(200, cy - 25, 120, 50, '退化函数 H', '#eef2ff', INDIGO);
      // Arrow
      drawArrow(325, cy, 375, cy, INDIGO);
      // Plus noise
      ctx.beginPath();
      ctx.arc(400, cy, 22, 0, 2 * Math.PI);
      ctx.fillStyle = '#fef3c7';
      ctx.fill();
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', 400, cy);
      // Arrow to output
      drawArrow(425, cy, 475, cy, INDIGO);
      // g(x,y) box
      drawBox(480, cy - 25, 100, 50, 'g(x,y)', '#fee2e2', RED);
      // Noise arrow from top
      drawArrow(400, cy - 70, 400, cy - 27, AMBER);
      drawBox(345, cy - 110, 110, 38, 'η(x,y) 噪声', '#fef3c7', AMBER);

      // Explanation below
      var ey = 230;
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(40, ey, 620, 130);
      ctx.strokeStyle = '#bbf7d0';
      ctx.strokeRect(40, ey, 620, 130);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '退化模型将图像退化过程分为两部分：',
        '  1. 退化函数 H（系统性退化）：如运动模糊、散焦模糊、大气湍流等',
        '  2. 加性噪声 η（随机退化）：如传感器热噪声、量化噪声等',
        '',
        '空间域表达：g(x,y) = h(x,y) * f(x,y) + η(x,y)',
        '频率域表达：G(u,v) = H(u,v) · F(u,v) + N(u,v)'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 58, ey + 22 + i * 18);
      }
    }

    // Step 2: Motion blur PSF
    function drawStep2(sliderValue) {
      titleBar('第3步：运动模糊 — PSF可视化');
      var blurLen = Math.max(1, Math.round(1 + sliderValue * 7 / 100));
      var blurred = applyMotionBlur(IMG, blurLen);

      // Original image (small)
      var cs = 30;
      drawPixelGrid(30, 60, cs, IMG, false, '原始图像');

      // Arrow
      drawArrow(280, 180, 320, 180, INDIGO);

      // Blurred image
      drawPixelGrid(330, 60, cs, blurred, false, '运动模糊 (长度=' + blurLen + ')');

      // PSF kernel visualization
      var psfSize = 8;
      var psfCs = 22;
      var px = 30, py = 310;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('运动模糊 PSF 核 (长度=' + blurLen + '):', px, py - 6);
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < psfSize; c++) {
          var val = (r === 1 && c < blurLen) ? (1.0 / blurLen) : 0;
          var intensity = val > 0 ? Math.round(255 - val * 255 * 3) : 245;
          ctx.fillStyle = val > 0 ? grayColor(intensity) : '#f3f4f6';
          ctx.fillRect(px + c * psfCs, py + 4 + r * psfCs, psfCs - 1, psfCs - 1);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + c * psfCs, py + 4 + r * psfCs, psfCs - 1, psfCs - 1);
          if (val > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val.toFixed(2), px + c * psfCs + psfCs / 2, py + 4 + r * psfCs + psfCs / 2);
          }
        }
      }

      // Slider info
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(300, 310, 370, 70);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(300, 310, 370, 70);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('拖动滑块调整运动模糊长度 (1~8)', 316, 335);
      ctx.fillText('模糊核沿水平方向对像素做均值运算', 316, 355);
      ctx.fillText('当前模糊长度: ' + blurLen + ' 像素', 316, 373);
    }

    // Step 3: Add Gaussian noise
    function drawStep3(sliderValue) {
      titleBar('第4步：叠加高斯噪声');
      var blurLen = Math.max(1, Math.round(1 + sliderValue * 7 / 100));
      var blurred = applyMotionBlur(IMG, blurLen);
      var degraded = addNoise(blurred, gaussNoise);

      var cs = 30;
      // Blurred image
      drawPixelGrid(30, 60, cs, blurred, false, '模糊图像');

      // Plus sign
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', 285, 180);

      // Noise pattern (visualize as colored overlay)
      var nx = 310, ny = 60;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('高斯噪声 η(x,y)', nx + 4 * cs, ny - 6);
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var nv = gaussNoise[r][c];
          var base = 128 + nv;
          if (nv > 0) {
            ctx.fillStyle = 'rgba(16,185,129,' + Math.min(0.8, Math.abs(nv) / 40) + ')';
          } else {
            ctx.fillStyle = 'rgba(239,68,68,' + Math.min(0.8, Math.abs(nv) / 40) + ')';
          }
          ctx.fillRect(nx + c * cs, ny + r * cs, cs, cs);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(nx + c * cs, ny + r * cs, cs, cs);
          ctx.fillStyle = '#333';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((nv > 0 ? '+' : '') + nv, nx + c * cs + cs / 2, ny + r * cs + cs / 2);
        }
      }

      // Arrow
      drawArrow(285, 320, 350, 320, INDIGO);

      // Degraded result
      drawPixelGrid(30, 300, 28, degraded, false, '退化图像 g(x,y) = 模糊 + 噪声');

      // Noise legend
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(380, 310, 290, 65);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(380, 310, 290, 65);
      ctx.fillStyle = GREEN;
      ctx.fillRect(396, 326, 14, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('正噪声 (变亮)', 416, 335);
      ctx.fillStyle = RED;
      ctx.fillRect(396, 346, 14, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('负噪声 (变暗)', 416, 355);
      ctx.fillText('高斯分布: μ=0, σ=25', 396, 370);
    }

    // Step 4: Fully degraded + PSF + noise histogram
    function drawStep4(sliderValue) {
      titleBar('第5步：退化结果分析');
      var blurLen = Math.max(1, Math.round(1 + sliderValue * 7 / 100));
      var blurred = applyMotionBlur(IMG, blurLen);
      var degraded = addNoise(blurred, gaussNoise);

      // Degraded image
      var cs = 30;
      drawPixelGrid(20, 55, cs, degraded, false, '退化图像 g(x,y)');

      // PSF matrix display
      var px = 290, py = 55;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('运动模糊 PSF (长度=' + blurLen + '):', px, py - 4);
      var psfCs = 18;
      for (var r = 0; r < blurLen; r++) {
        for (var c = 0; c < blurLen; c++) {
          var val = (r === c) ? (1.0 / blurLen) : 0;
          ctx.fillStyle = val > 0 ? INDIGO : '#e5e7eb';
          ctx.fillRect(px + c * psfCs, py + 6 + r * psfCs, psfCs - 1, psfCs - 1);
          if (val > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val.toFixed(2), px + c * psfCs + psfCs / 2, py + 6 + r * psfCs + psfCs / 2);
          }
        }
      }

      // Noise histogram
      var hx = 470, hy = 55, hw = 200, hh = 130;
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(hx, hy, hw, hh);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('噪声分布直方图', hx + hw / 2, hy - 4);

      // Build histogram of noise values
      var bins = [];
      var binCount = 20;
      var binW = 5; // range -50 to 50
      for (var b = 0; b < binCount; b++) bins[b] = 0;
      for (var r2 = 0; r2 < 8; r2++) {
        for (var c2 = 0; c2 < 8; c2++) {
          var nv = gaussNoise[r2][c2];
          var bi = Math.min(binCount - 1, Math.max(0, Math.floor((nv + 50) / binW)));
          bins[bi]++;
        }
      }
      var maxBin = 1;
      for (var b2 = 0; b2 < binCount; b2++) if (bins[b2] > maxBin) maxBin = bins[b2];
      var barW = hw / binCount;
      for (var b3 = 0; b3 < binCount; b3++) {
        var barH = (bins[b3] / maxBin) * (hh - 20);
        ctx.fillStyle = LIGHT_INDIGO;
        ctx.fillRect(hx + b3 * barW, hy + hh - barH - 2, barW - 1, barH);
      }
      // Axis labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('-50', hx, hy + hh + 12);
      ctx.textAlign = 'right';
      ctx.fillText('+50', hx + hw, hy + hh + 12);
      ctx.textAlign = 'center';
      ctx.fillText('0', hx + hw / 2, hy + hh + 12);

      // Gaussian curve overlay
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var xi = 0; xi < hw; xi++) {
        var xVal = -50 + xi * 100 / hw;
        var yVal = Math.exp(-xVal * xVal / (2 * 25 * 25));
        var yy = hy + hh - 2 - yVal * (hh - 20);
        if (xi === 0) ctx.moveTo(hx + xi, yy);
        else ctx.lineTo(hx + xi, yy);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // Info
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(20, 320, 660, 60);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(20, 320, 660, 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('退化图像 = 运动模糊（PSF卷积）+ 高斯噪声（σ=25）。PSF 对角线结构表示等权运动方向。', 36, 345);
      ctx.fillText('红色曲线为理论高斯分布 N(0, 25²)，直方图为实际采样噪声分布。', 36, 365);
    }

    // Step 5: Formula panel
    function drawStep5(sliderValue) {
      titleBar('第6步：退化公式总结');

      // Main formula box
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(80, 60, 540, 70);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 60, 540, 70);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('g(x,y) = h(x,y) * f(x,y) + \u03B7(x,y)', 350, 95);
      ctx.lineWidth = 1;

      // Term explanations
      var terms = [
        { sym: 'g(x,y)', desc: '退化图像（观测到的图像）', color: RED },
        { sym: 'f(x,y)', desc: '原始图像（理想的清晰图像）', color: GREEN },
        { sym: 'h(x,y)', desc: '退化函数/点扩散函数 PSF（系统退化）', color: INDIGO },
        { sym: '\u03B7(x,y)', desc: '加性噪声（随机扰动）', color: AMBER },
        { sym: '*', desc: '二维卷积运算', color: TEXT_COLOR }
      ];

      var ty = 160;
      ctx.fillStyle = '#fff';
      ctx.fillRect(80, ty, 540, terms.length * 32 + 16);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(80, ty, 540, terms.length * 32 + 16);

      for (var i = 0; i < terms.length; i++) {
        ctx.fillStyle = terms[i].color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(terms[i].sym, 100, ty + 26 + i * 32);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '14px "Microsoft YaHei", sans-serif';
        ctx.fillText(terms[i].desc, 220, ty + 26 + i * 32);
      }

      // Frequency domain equivalent
      var fy = ty + terms.length * 32 + 36;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(80, fy, 540, 50);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(80, fy, 540, 50);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('频率域：G(u,v) = H(u,v) \u00B7 F(u,v) + N(u,v)', 350, fy + 20);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('其中 G, H, F, N 分别为 g, h, f, \u03B7 的傅里叶变换', 350, fy + 40);

      // Key insight
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(80, fy + 70, 540, 50);
      ctx.strokeStyle = GREEN;
      ctx.strokeRect(80, fy + 70, 540, 50);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('图像复原的核心：已知 g(x,y) 和 h(x,y)，估计 f(x,y)', 350, fy + 95);
    }

    return {
      totalSteps: 6,
      hasSlider: true,
      sliderLabel: '模糊程度',
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
      sliderDefault: 50,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(sliderValue); break;
          case 1: drawStep1(sliderValue); break;
          case 2: drawStep2(sliderValue); break;
          case 3: drawStep3(sliderValue); break;
          case 4: drawStep4(sliderValue); break;
          case 5: drawStep5(sliderValue); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimationBatch([37, 40], factory);
})();
