(function () {
  // ========== Constants & Helpers ==========

  var COLOR = {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    success: '#10b981',
    successLight: '#34d399',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    gray: '#6b7280',
    grayLight: '#e5e7eb',
    grayBg: '#f3f4f6',
    textDark: '#1f2937',
    textMed: '#4b5563',
    textLight: '#9ca3af'
  };

  // Bimodal histogram: background peak ~60, foreground peak ~190
  function buildHistogram() {
    var hist = new Array(256).fill(0);
    // Background peak around 60
    for (var i = 0; i < 256; i++) {
      var bg = 180 * Math.exp(-0.5 * Math.pow((i - 60) / 18, 2));
      var fg = 120 * Math.exp(-0.5 * Math.pow((i - 190) / 22, 2));
      hist[i] = Math.round(bg + fg + Math.random() * 3);
    }
    return hist;
  }

  // Simple Otsu computation
  function otsuThreshold(hist) {
    var total = 0;
    for (var i = 0; i < 256; i++) total += hist[i];

    var sumB = 0, wB = 0;
    var sumTotal = 0;
    for (var i = 0; i < 256; i++) sumTotal += i * hist[i];

    var maxVariance = 0;
    var bestT = 0;

    for (var t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      var wF = total - wB;
      if (wF === 0) break;

      sumB += t * hist[t];
      var mB = sumB / wB;
      var mF = (sumTotal - sumB) / wF;
      var variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        bestT = t;
      }
    }
    return bestT;
  }

  function drawTitle(ctx, text, x, y) {
    ctx.fillStyle = COLOR.textDark;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function drawStepHeader(ctx, step, totalSteps) {
    ctx.fillStyle = COLOR.grayBg;
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = COLOR.primary;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('步骤 ' + (step + 1) + ' / ' + totalSteps, 16, 18);
  }

  // Draw histogram
  function drawHistogram(ctx, ox, oy, w, h, hist, threshold, showColors) {
    var maxVal = 0;
    for (var i = 0; i < 256; i++) {
      if (hist[i] > maxVal) maxVal = hist[i];
    }

    // Draw bars
    var barW = w / 256;
    for (var i = 0; i < 256; i++) {
      var barH = (hist[i] / maxVal) * h;
      var x = ox + i * barW;
      var y = oy + h - barH;

      if (showColors && threshold !== undefined) {
        ctx.fillStyle = i < threshold ? '#93c5fd' : '#fca5a5';
      } else {
        ctx.fillStyle = COLOR.primaryLight;
      }
      ctx.fillRect(x, y, barW + 0.5, barH);
    }

    // Axes
    ctx.strokeStyle = COLOR.gray;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + h);
    ctx.lineTo(ox + w, oy + h);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = COLOR.textLight;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('0', ox, oy + h + 4);
    ctx.fillText('64', ox + 64 * barW, oy + h + 4);
    ctx.fillText('128', ox + 128 * barW, oy + h + 4);
    ctx.fillText('192', ox + 192 * barW, oy + h + 4);
    ctx.fillText('255', ox + 255 * barW, oy + h + 4);

    // Y-axis label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('像素数', ox - 4, oy + 10);

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('灰度值', ox + w / 2, oy + h + 18);

    // Threshold line
    if (threshold !== undefined && threshold >= 0) {
      var tx = ox + threshold * barW;
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tx, oy - 5);
      ctx.lineTo(tx, oy + h + 5);
      ctx.stroke();

      ctx.fillStyle = COLOR.danger;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('T=' + threshold, tx, oy - 8);
    }
  }

  // Draw a simulated binary result: white circle on black background
  function drawBinaryResult(ctx, ox, oy, w, h) {
    // Black background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(ox, oy, w, h);

    // White circle (foreground object)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox + w / 2, oy + h / 2, Math.min(w, h) / 3, 0, 2 * Math.PI);
    ctx.fill();

    // Border
    ctx.strokeStyle = COLOR.grayLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, w, h);
  }

  // ========== Shared factory ==========
  function createThresholdAnimation(hist) {
    var otsuT = otsuThreshold(hist);
    var totalSteps = 4;
    var descriptions = [
      '灰度直方图：双峰分布，左侧为背景（均值~60），右侧为前景（均值~190）',
      '设定阈值 T：将像素分为背景（蓝色，<T）和前景（红色，≥T）',
      'Otsu 方法：自动寻找使类间方差最大的阈值 T=' + otsuT,
      '分割结果：二值化图像，前景物体（白色）与背景（黑色）分离'
    ];

    return {
      totalSteps: totalSteps,
      hasSlider: true,
      sliderMin: 0,
      sliderMax: 255,
      sliderDefault: 128,
      sliderStep: 1,
      sliderLabel: '阈值 T',
      draw: function (step, sliderValue) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        var T = sliderValue !== undefined ? sliderValue : 128;

        if (step === 0) {
          // Raw histogram
          drawTitle(ctx, '图像灰度直方图（双峰分布）', 30, 46);
          var ox = 70, oy = 85, w = 560, h = 240;
          drawHistogram(ctx, ox, oy, w, h, hist, undefined, false);

          // Annotate peaks
          var barW = w / 256;
          ctx.fillStyle = COLOR.primary;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('背景峰值 ~60', ox + 60 * barW, oy + 2);
          ctx.fillText('前景峰值 ~190', ox + 190 * barW, oy + 2);

          // Draw arrows
          ctx.strokeStyle = COLOR.primary;
          ctx.lineWidth = 1;
          // Arrow to bg peak
          ctx.beginPath();
          ctx.moveTo(ox + 60 * barW, oy + 5);
          ctx.lineTo(ox + 60 * barW, oy + 20);
          ctx.stroke();
          // Arrow to fg peak
          ctx.beginPath();
          ctx.moveTo(ox + 190 * barW, oy + 5);
          ctx.lineTo(ox + 190 * barW, oy + 20);
          ctx.stroke();

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('双峰直方图适合使用阈值分割法', 350, 360);
        } else if (step === 1) {
          // Histogram with threshold line
          drawTitle(ctx, '固定阈值分割 T=' + T, 30, 46);
          var ox = 70, oy = 85, w = 560, h = 240;
          drawHistogram(ctx, ox, oy, w, h, hist, T, true);

          // Legend
          ctx.fillStyle = '#93c5fd';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('■ 背景像素 (< T)', ox, oy + h + 38);
          ctx.fillStyle = '#fca5a5';
          ctx.fillText('■ 前景像素 (≥ T)', ox + 200, oy + h + 38);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('拖动滑块调整阈值 T，观察分割效果变化', 350, 375);
        } else if (step === 2) {
          // Otsu method - animate threshold moving
          drawTitle(ctx, 'Otsu 自动阈值选择', 30, 46);
          var ox = 70, oy = 85, w = 560, h = 240;

          // Show histogram with Otsu threshold
          drawHistogram(ctx, ox, oy, w, h, hist, otsuT, true);

          // Otsu explanation panel
          var ex = 40, ey = oy + h + 36;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Otsu 方法原理：', ex, ey);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.fillText('• 遍历所有可能的阈值 T（0~255）', ex, ey + 22);
          ctx.fillText('• 计算每个 T 对应的类间方差 σ²_B = w₁·w₂·(μ₁-μ₂)²', ex, ey + 42);
          ctx.fillText('• 选择使类间方差最大的 T 作为最优阈值', ex + 8, ey + 62);
          ctx.fillStyle = COLOR.success;
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('最优阈值 T* = ' + otsuT, ex + 400, ey + 10);
        } else if (step === 3) {
          // Binary result
          drawTitle(ctx, '二值化分割结果 (T=' + T + ')', 30, 46);

          // Left: small histogram with threshold
          var ox = 30, oy = 85, w = 280, h = 140;
          drawHistogram(ctx, ox, oy, w, h, hist, T, true);

          // Arrow
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('→', 340, oy + h / 2);

          // Right: binary result
          var rx = 370, ry = 75, rw = 280, rh = 200;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('二值化图像', rx + rw / 2, ry - 14);
          drawBinaryResult(ctx, rx, ry, rw, rh);

          // Description
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('阈值分割将灰度图像转换为二值图像（前景/背景分离）', 350, 310);
          ctx.fillText('白色 = 前景物体    黑色 = 背景', 350, 332);
          ctx.fillText('拖动滑块查看不同阈值下的分割效果', 350, 354);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  }

  // ========== Create instances with shared histogram ==========
  var hist = buildHistogram();

  // KP62: 阈值分割概述
  registerAnimation(62, function (canvas, ctx) {
    return createThresholdAnimation(hist);
  });

  // KP63: Otsu 方法
  registerAnimation(63, function (canvas, ctx) {
    return createThresholdAnimation(hist);
  });

  // KP64: 二值化分割
  registerAnimation(64, function (canvas, ctx) {
    return createThresholdAnimation(hist);
  });
})();
