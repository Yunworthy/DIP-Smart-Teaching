/**
 * Image Quality Evaluation Animation (PSNR / SSIM)
 *
 * Step 0: Original reference image (8x8 gradient grid)
 * Step 1: Light noise (sigma=10), MSE calculation
 * Step 2: PSNR formula + result, moderate noise (sigma=25)
 * Step 3: Heavy noise (sigma=50), quality degradation
 * Step 4: SSIM concept — luminance, contrast, structure
 * Step 5: Comparison table — noise level vs MSE, PSNR, SSIM
 *
 * Slider (0-100): controls noise level for real-time update
 *
 * Registered for KP ID 5.
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

  // 8x8 reference image: gradient from 30 to 225
  var refImage = [];
  (function () {
    for (var r = 0; r < 8; r++) {
      var row = [];
      for (var c = 0; c < 8; c++) {
        row.push(Math.round(30 + (r * 8 + c) * (195 / 63)));
      }
      refImage.push(row);
    }
  })();

  // Seeded pseudo-random for reproducible noise
  var seed = 42;
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function gaussRandom() {
    var u1 = seededRandom();
    var u2 = seededRandom();
    return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  }

  function addNoise(sigma) {
    seed = 42;
    var noisy = [];
    for (var r = 0; r < 8; r++) {
      var row = [];
      for (var c = 0; c < 8; c++) {
        var v = refImage[r][c] + sigma * gaussRandom();
        row.push(Math.max(0, Math.min(255, Math.round(v))));
      }
      noisy.push(row);
    }
    return noisy;
  }

  function computeMSE(img1, img2) {
    var sum = 0;
    var n = img1.length * img1[0].length;
    for (var r = 0; r < img1.length; r++) {
      for (var c = 0; c < img1[0].length; c++) {
        var d = img1[r][c] - img2[r][c];
        sum += d * d;
      }
    }
    return sum / n;
  }

  function computePSNR(mse) {
    if (mse === 0) return Infinity;
    return 10 * Math.log(255 * 255 / mse) / Math.LN10;
  }

  function computeMean(img) {
    var sum = 0;
    var n = img.length * img[0].length;
    for (var r = 0; r < img.length; r++) {
      for (var c = 0; c < img[0].length; c++) {
        sum += img[r][c];
      }
    }
    return sum / n;
  }

  function computeVariance(img, mean) {
    var sum = 0;
    var n = img.length * img[0].length;
    for (var r = 0; r < img.length; r++) {
      for (var c = 0; c < img[0].length; c++) {
        var d = img[r][c] - mean;
        sum += d * d;
      }
    }
    return sum / n;
  }

  function computeCovariance(img1, img2, m1, m2) {
    var sum = 0;
    var n = img1.length * img1[0].length;
    for (var r = 0; r < img1.length; r++) {
      for (var c = 0; c < img1[0].length; c++) {
        sum += (img1[r][c] - m1) * (img2[r][c] - m2);
      }
    }
    return sum / n;
  }

  function computeSSIM(img1, img2) {
    var C1 = (0.01 * 255) * (0.01 * 255);
    var C2 = (0.03 * 255) * (0.03 * 255);
    var m1 = computeMean(img1);
    var m2 = computeMean(img2);
    var v1 = computeVariance(img1, m1);
    var v2 = computeVariance(img2, m2);
    var s1 = Math.sqrt(v1);
    var s2 = Math.sqrt(v2);
    var cov = computeCovariance(img1, img2, m1, m2);
    var luminance   = (2 * m1 * m2 + C1) / (m1 * m1 + m2 * m2 + C1);
    var contrast    = (2 * s1 * s2 + C2) / (s1 * s1 + s2 * s2 + C2);
    var structure   = (cov + C2 / 2) / (s1 * s2 + C2 / 2);
    var ssim = (2 * m1 * m2 + C1) * (2 * cov + C2) /
               ((m1 * m1 + m2 * m2 + C1) * (v1 + v2 + C2));
    return {
      luminance: luminance,
      contrast: contrast,
      structure: structure,
      ssim: ssim
    };
  }

  // Pre-compute noisy images and metrics for each noise level
  var noiseLevels = [10, 25, 50];
  var noisyImages = {};
  var metrics = {};
  (function () {
    for (var i = 0; i < noiseLevels.length; i++) {
      var sigma = noiseLevels[i];
      var noisy = addNoise(sigma);
      noisyImages[sigma] = noisy;
      var mse = computeMSE(refImage, noisy);
      var psnr = computePSNR(mse);
      var ssimData = computeSSIM(refImage, noisy);
      metrics[sigma] = { mse: mse, psnr: psnr, ssim: ssimData };
    }
  })();

  var stepDescriptions = [
    '<b>步骤 1/6 — 原始参考图像：</b>展示 8x8 灰度渐变图像作为参考。像素值从 30 渐变到 225，用于后续质量评价对比。',
    '<b>步骤 2/6 — 添加轻度噪声与 MSE：</b>对图像添加高斯噪声 (sigma=10)，计算均方误差 <code>MSE = Sigma(ref - pixel)^2 / N</code>，MSE 越小图像越接近原图。',
    '<b>步骤 3/6 — PSNR 计算：</b>峰值信噪比 <code>PSNR = 10 * log10(255^2 / MSE)</code>，单位为 dB。PSNR 越大表示质量越好。一般 PSNR > 30dB 认为质量良好。',
    '<b>步骤 4/6 — 重度噪声与质量退化：</b>sigma=50 的重度噪声导致 PSNR 显著下降，图像质量严重退化，细节模糊不可辨认。',
    '<b>步骤 5/6 — SSIM 结构相似性：</b>SSIM 从亮度、对比度、结构三方面评价图像相似性，公式 <code>SSIM = l(x,y) * c(x,y) * s(x,y)</code>，取值 [0,1]，越接近 1 越好。',
    '<b>步骤 6/6 — 综合评价对比表：</b>对比不同噪声水平下的 MSE、PSNR、SSIM 值。噪声越大 MSE 越高，PSNR 和 SSIM 越低，图像质量越差。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawGrid(img, ox, oy, cellSize, label) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var v = img[r][c];
          ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
          ctx.fillRect(ox + c * cellSize, oy + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cellSize, oy + r * cellSize, cellSize, cellSize);
          if (cellSize >= 28) {
            ctx.fillStyle = v > 128 ? '#1f2937' : '#ffffff';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(v, ox + c * cellSize + cellSize / 2, oy + r * cellSize + cellSize / 2);
          }
        }
      }
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, 8 * cellSize, 8 * cellSize);
      if (label) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, ox + 4 * cellSize, oy + 8 * cellSize + 6);
      }
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

    function drawMetricBox(x, y, w, h, title, lines, color) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = color || GRAY_BORDER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = color || INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(title, x + 8, y + 6);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + 8, y + 24 + i * 16);
      }
    }

    // ---------- Step drawing functions ----------

    function drawStep0() {
      drawStepHeader(0, 6);
      var cellSize = 32;
      var ox = 40;
      var oy = 48;
      drawGrid(refImage, ox, oy, cellSize, '原始参考图像 (8x8)');

      // Info panel
      var px = ox + 8 * cellSize + 30;
      var py = oy;
      drawMetricBox(px, py, 300, 200, '图像信息', [
        '尺寸: 8 x 8 = 64 像素',
        '灰度范围: 30 ~ 225',
        '类型: 灰度渐变图像',
        '',
        '该图像作为参考标准,',
        '用于评价含噪图像的质量。',
        '',
        '评价指标: MSE, PSNR, SSIM'
      ], INDIGO);

      // Bottom description
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(20, 340, W - 40, 48);
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 340, W - 40, 48);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('图像质量评价通过比较失真图像与参考图像的差异来量化质量。常用指标: MSE (均方误差)、PSNR (峰值信噪比)、SSIM (结构相似性)。', 34, 358);
    }

    function drawStep1(sliderVal) {
      drawStepHeader(1, 6);
      var cellSize = 28;
      var sigma = 10;
      if (sliderVal !== undefined) {
        sigma = Math.round(sliderVal * 0.5);
      }
      var noisy = addNoise(sigma);
      var mse = computeMSE(refImage, noisy);

      drawGrid(refImage, 20, 44, cellSize, '参考图像');
      drawGrid(noisy, 280, 44, cellSize, '噪声图像 (sigma=' + sigma + ')');

      // MSE computation panel
      var py = 300;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, py, W - 40, 88);
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, py, W - 40, 88);

      ctx.fillStyle = AMBER;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MSE 计算', 34, py + 16);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px monospace';
      ctx.fillText('MSE = (1/N) * SUM[ (ref(i,j) - noisy(i,j))^2 ]', 34, py + 38);
      ctx.fillText('N = 64 (总像素数)', 34, py + 56);

      ctx.fillStyle = RED;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('MSE = ' + mse.toFixed(2), 34, py + 76);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('MSE 越小,图像越接近原图; MSE = 0 表示完全相同。', 360, py + 76);
    }

    function drawStep2(sliderVal) {
      drawStepHeader(2, 6);
      var cellSize = 28;
      var sigma = 25;
      if (sliderVal !== undefined) {
        sigma = Math.max(5, Math.round(sliderVal * 0.5));
      }
      var noisy = addNoise(sigma);
      var mse = computeMSE(refImage, noisy);
      var psnr = computePSNR(mse);

      drawGrid(refImage, 20, 44, cellSize, '参考图像');
      drawGrid(noisy, 280, 44, cellSize, '噪声图像 (sigma=' + sigma + ')');

      // PSNR panel
      var py = 300;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, py, W - 40, 88);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, py, W - 40, 88);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PSNR 计算', 34, py + 16);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px monospace';
      ctx.fillText('PSNR = 10 * log10( 255^2 / MSE )', 34, py + 38);
      ctx.fillText('MSE = ' + mse.toFixed(2), 34, py + 56);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('PSNR = ' + (isFinite(psnr) ? psnr.toFixed(2) + ' dB' : 'Inf'), 34, py + 76);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      var quality = psnr > 40 ? '优秀' : psnr > 30 ? '良好' : psnr > 20 ? '可接受' : '差';
      ctx.fillText('质量评级: ' + quality + '  (>40dB优秀, >30dB良好, >20dB可接受)', 360, py + 76);
    }

    function drawStep3(sliderVal) {
      drawStepHeader(3, 6);
      var cellSize = 24;
      var sigma = 50;
      if (sliderVal !== undefined) {
        sigma = Math.max(5, Math.round(sliderVal * 0.5));
      }
      var noisy = addNoise(sigma);
      var mse = computeMSE(refImage, noisy);
      var psnr = computePSNR(mse);

      // Show three noise levels side by side
      var levels = [10, 25, 50];
      var labels = ['sigma=10', 'sigma=25', 'sigma=50'];
      for (var i = 0; i < 3; i++) {
        var img = noisyImages[levels[i]];
        var ox = 16 + i * 230;
        drawGrid(img, ox, 44, cellSize, labels[i]);
      }

      // Metrics for each
      var py = 296;
      ctx.fillStyle = '#fff7ed';
      ctx.fillRect(16, py, W - 32, 92);
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(16, py, W - 32, 92);

      ctx.fillStyle = AMBER;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('噪声强度对比', 30, py + 16);

      ctx.font = '11px monospace';
      for (var j = 0; j < 3; j++) {
        var m = metrics[levels[j]];
        var bx = 30 + j * 220;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(labels[j] + ':', bx, py + 36);
        ctx.fillText('MSE=' + m.mse.toFixed(1), bx, py + 52);
        ctx.fillStyle = RED;
        ctx.fillText('PSNR=' + m.psnr.toFixed(1) + 'dB', bx, py + 68);

        // Quality bar
        var barW = Math.min(m.psnr / 50 * 100, 100);
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(bx, py + 76, 100, 8);
        ctx.fillStyle = m.psnr > 30 ? GREEN : m.psnr > 20 ? AMBER : RED;
        ctx.fillRect(bx, py + 76, barW, 8);
      }
    }

    function drawStep4(sliderVal) {
      drawStepHeader(4, 6);
      var cellSize = 28;
      var sigma = 25;
      if (sliderVal !== undefined) {
        sigma = Math.max(5, Math.round(sliderVal * 0.5));
      }
      var noisy = addNoise(sigma);
      var ssimData = computeSSIM(refImage, noisy);

      drawGrid(refImage, 20, 44, cellSize, '参考图像');
      drawGrid(noisy, 280, 44, cellSize, '噪声图像');

      // SSIM components
      var py = 298;
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(20, py, W - 40, 90);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, py, W - 40, 90);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SSIM 结构相似性指数', 34, py + 16);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      ctx.fillText('SSIM(x,y) = l(x,y) * c(x,y) * s(x,y)', 34, py + 36);

      // Three components
      var components = [
        { label: '亮度 l', val: ssimData.luminance, color: INDIGO },
        { label: '对比度 c', val: ssimData.contrast, color: AMBER },
        { label: '结构 s', val: ssimData.structure, color: GREEN }
      ];
      for (var i = 0; i < 3; i++) {
        var cx = 34 + i * 180;
        ctx.fillStyle = components[i].color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(components[i].label + ' = ' + components[i].val.toFixed(4), cx, py + 56);
        // Bar
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(cx, py + 64, 140, 10);
        ctx.fillStyle = components[i].color;
        ctx.fillRect(cx, py + 64, 140 * components[i].val, 10);
      }

      ctx.fillStyle = RED;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('SSIM = ' + ssimData.ssim.toFixed(4), 550, py + 56);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.fillText('[0,1] 越接近1越好', 550, py + 74);
    }

    function drawStep5(sliderVal) {
      drawStepHeader(5, 6);

      // Title
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('图像质量评价指标综合对比', W / 2, 40);

      // Table
      var tableX = 50;
      var tableY = 70;
      var colW = [120, 120, 120, 120, 120];
      var rowH = 36;
      var headers = ['噪声水平', 'MSE', 'PSNR (dB)', 'SSIM', '质量评级'];
      var levels = [0, 10, 25, 50];
      var levelLabels = ['无噪声', 'sigma=10', 'sigma=25', 'sigma=50'];

      // Draw header row
      ctx.fillStyle = INDIGO;
      ctx.fillRect(tableX, tableY, 600, rowH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var cx = tableX;
      for (var h = 0; h < headers.length; h++) {
        ctx.fillText(headers[h], cx + colW[h] / 2, tableY + rowH / 2);
        cx += colW[h];
      }

      // Draw data rows
      for (var r = 0; r < levels.length; r++) {
        var ry = tableY + (r + 1) * rowH;
        ctx.fillStyle = r % 2 === 0 ? '#ffffff' : '#f3f4f6';
        ctx.fillRect(tableX, ry, 600, rowH);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tableX, ry, 600, rowH);

        var mseVal, psnrVal, ssimVal, rating, ratingColor;
        if (levels[r] === 0) {
          mseVal = '0.00';
          psnrVal = 'Inf';
          ssimVal = '1.0000';
          rating = '完美';
          ratingColor = GREEN;
        } else {
          var m = metrics[levels[r]];
          mseVal = m.mse.toFixed(2);
          psnrVal = m.psnr.toFixed(2);
          ssimVal = m.ssim.ssim.toFixed(4);
          if (m.psnr > 40) { rating = '优秀'; ratingColor = GREEN; }
          else if (m.psnr > 30) { rating = '良好'; ratingColor = LIGHT_INDIGO; }
          else if (m.psnr > 20) { rating = '可接受'; ratingColor = AMBER; }
          else { rating = '差'; ratingColor = RED; }
        }

        var vals = [levelLabels[r], mseVal, psnrVal, ssimVal, rating];
        cx = tableX;
        ctx.font = '12px monospace';
        ctx.textBaseline = 'middle';
        for (var ci = 0; ci < vals.length; ci++) {
          ctx.textAlign = 'center';
          if (ci === 4) {
            ctx.fillStyle = ratingColor;
            ctx.font = 'bold 12px sans-serif';
          } else {
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '12px monospace';
          }
          ctx.fillText(vals[ci], cx + colW[ci] / 2, ry + rowH / 2);
          cx += colW[ci];
        }
      }

      // Slider-controlled live row
      var liveSigma = sliderVal !== undefined ? Math.max(1, Math.round(sliderVal * 0.5)) : 35;
      var liveNoisy = addNoise(liveSigma);
      var liveMSE = computeMSE(refImage, liveNoisy);
      var livePSNR = computePSNR(liveMSE);
      var liveSSIM = computeSSIM(refImage, liveNoisy);
      var liveRating, liveColor;
      if (livePSNR > 40) { liveRating = '优秀'; liveColor = GREEN; }
      else if (livePSNR > 30) { liveRating = '良好'; liveColor = LIGHT_INDIGO; }
      else if (livePSNR > 20) { liveRating = '可接受'; liveColor = AMBER; }
      else { liveRating = '差'; liveColor = RED; }

      var liveY = tableY + 5 * rowH + 8;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(tableX, liveY, 600, rowH);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tableX, liveY, 600, rowH);

      var liveVals = [
        'sigma=' + liveSigma + ' (滑块)',
        liveMSE.toFixed(2),
        livePSNR.toFixed(2),
        liveSSIM.ssim.toFixed(4),
        liveRating
      ];
      cx = tableX;
      for (var li = 0; li < liveVals.length; li++) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (li === 4) {
          ctx.fillStyle = liveColor;
          ctx.font = 'bold 12px sans-serif';
        } else {
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 12px monospace';
        }
        ctx.fillText(liveVals[li], cx + colW[li] / 2, liveY + rowH / 2);
        cx += colW[li];
      }

      // Bottom note
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('拖动滑块调节噪声强度 (0-100), 实时查看 MSE / PSNR / SSIM 变化', W / 2, liveY + rowH + 22);
    }

    // ---------- Public API ----------

    return {
      totalSteps: 6,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawStep1(sliderValue); break;
          case 2: drawStep2(sliderValue); break;
          case 3: drawStep3(sliderValue); break;
          case 4: drawStep4(sliderValue); break;
          case 5: drawStep5(sliderValue); break;
        }
      },
      reset: function () { /* stateless */ },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(5, factory);
})();
