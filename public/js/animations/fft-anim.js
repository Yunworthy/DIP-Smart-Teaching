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

  // Generate a composite signal: sum of sines
  function compositeSignal(t) {
    return Math.sin(2 * Math.PI * 2 * t) * 1.0 +
           Math.sin(2 * Math.PI * 5 * t) * 0.6 +
           Math.sin(2 * Math.PI * 8 * t) * 0.3;
  }

  // Component signals
  function comp1(t) { return Math.sin(2 * Math.PI * 2 * t) * 1.0; }
  function comp2(t) { return Math.sin(2 * Math.PI * 5 * t) * 0.6; }
  function comp3(t) { return Math.sin(2 * Math.PI * 8 * t) * 0.3; }

  // Simple lowpass: zero out frequencies above cutoff
  function filteredSignal(t, cutoff) {
    var sig = 0;
    if (cutoff >= 2) sig += comp1(t);
    if (cutoff >= 5) sig += comp2(t);
    if (cutoff >= 8) sig += comp3(t);
    return sig;
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

  // Draw a sine wave using path
  function drawWave(ctx, ox, oy, w, h, amplitude, signalFn, color, lineWidth) {
    var steps = 200;
    var maxAmp = amplitude || 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var val = signalFn(t);
      var px = ox + t * w;
      var py = oy + h / 2 - (val / maxAmp) * (h / 2 - 4);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Draw axes for a waveform plot
  function drawAxes(ctx, ox, oy, w, h, xLabel, yLabel) {
    ctx.strokeStyle = COLOR.grayLight;
    ctx.lineWidth = 1;
    // x-axis (center)
    ctx.beginPath();
    ctx.moveTo(ox, oy + h / 2);
    ctx.lineTo(ox + w, oy + h / 2);
    ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + h);
    ctx.stroke();
    // Labels
    ctx.fillStyle = COLOR.textLight;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (xLabel) ctx.fillText(xLabel, ox + w / 2, oy + h + 4);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (yLabel) ctx.fillText(yLabel, ox - 6, oy + h / 2);
  }

  // Draw frequency spectrum bar chart
  function drawSpectrum(ctx, ox, oy, w, h, cutoff, grayOut) {
    var frequencies = [2, 5, 8];
    var amplitudes = [1.0, 0.6, 0.3];
    var labels = ['2 Hz', '5 Hz', '8 Hz'];
    var barW = 60;
    var gap = (w - frequencies.length * barW) / (frequencies.length + 1);
    var maxAmp = 1.2;

    for (var i = 0; i < frequencies.length; i++) {
      var x = ox + gap * (i + 1) + barW * i;
      var barH = (amplitudes[i] / maxAmp) * (h - 30);
      var y = oy + h - 30 - barH;

      var isFiltered = grayOut && cutoff < frequencies[i];
      var color = isFiltered ? COLOR.grayLight : (i === 0 ? COLOR.primary : i === 1 ? COLOR.success : COLOR.danger);

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW, barH);
      ctx.strokeStyle = isFiltered ? '#d1d5db' : color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barW, barH);

      // Label
      ctx.fillStyle = isFiltered ? COLOR.textLight : COLOR.textDark;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], x + barW / 2, oy + h - 26);
      // Amplitude value
      ctx.fillText(amplitudes[i].toFixed(1), x + barW / 2, y - 16);

      if (isFiltered) {
        // Draw X mark
        ctx.strokeStyle = COLOR.danger;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 8);
        ctx.lineTo(x + barW - 8, y + barH - 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + barW - 8, y + 8);
        ctx.lineTo(x + 8, y + barH - 8);
        ctx.stroke();
      }
    }

    // Y-axis
    ctx.strokeStyle = COLOR.grayLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + h - 30);
    ctx.stroke();

    ctx.fillStyle = COLOR.textLight;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('幅度', ox - 6, oy + 10);
  }

  // ========== Shared factory for KP41-45 ==========
  function createFFTAnimation(canvas, ctx) {
    var totalSteps = 5;
    var descriptions = [
      '时域信号：原始复合信号由多个不同频率的正弦波叠加而成',
      '频率分解：将复合信号分解为 2Hz、5Hz、8Hz 三个正弦分量',
      'FFT 频谱分析：通过快速傅里叶变换得到各频率分量的幅度',
      '低通滤波：使用截止频率滤除高频分量（灰色标记为被滤除的频率）',
      '逆傅里叶变换：对滤波后的频谱做逆变换，得到平滑后的信号'
    ];

    return {
      totalSteps: totalSteps,
      hasSlider: true,
      sliderMin: 1,
      sliderMax: 10,
      sliderDefault: 5,
      sliderStep: 1,
      sliderLabel: '截止频率',
      draw: function (step, sliderValue) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        var cutoff = sliderValue !== undefined ? sliderValue : 5;

        if (step === 0) {
          // Original composite signal
          drawTitle(ctx, '时域信号（复合波形）', 30, 46);
          var ox = 60, oy = 80, w = 580, h = 260;
          drawAxes(ctx, ox, oy, w, h, '时间 t', '幅度');
          drawWave(ctx, ox, oy, w, h, 2.2, compositeSignal, COLOR.primary, 2.5);

          // Legend
          ctx.fillStyle = COLOR.primary;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('● 复合信号 f(t) = sin(2π·2t) + 0.6·sin(2π·5t) + 0.3·sin(2π·8t)', ox, oy + h + 24);
        } else if (step === 1) {
          // Decomposed components
          drawTitle(ctx, '频率分解：三个正弦分量', 30, 46);
          var ox = 60, w = 580;

          // Component 1
          var oy1 = 72, h1 = 70;
          drawAxes(ctx, ox, oy1, w, h1, '', '');
          drawWave(ctx, ox, oy1, w, h1, 1.2, comp1, COLOR.primary, 2);
          ctx.fillStyle = COLOR.primary;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('f₁ = 2 Hz, A = 1.0', ox - 6, oy1 + h1 / 2);

          // Component 2
          var oy2 = 162, h2 = 70;
          drawAxes(ctx, ox, oy2, w, h2, '', '');
          drawWave(ctx, ox, oy2, w, h2, 1.2, comp2, COLOR.success, 2);
          ctx.fillStyle = COLOR.success;
          ctx.textAlign = 'right';
          ctx.fillText('f₂ = 5 Hz, A = 0.6', ox - 6, oy2 + h2 / 2);

          // Component 3
          var oy3 = 252, h3 = 70;
          drawAxes(ctx, ox, oy3, w, h3, '时间 t', '');
          drawWave(ctx, ox, oy3, w, h3, 1.2, comp3, COLOR.danger, 2);
          ctx.fillStyle = COLOR.danger;
          ctx.textAlign = 'right';
          ctx.fillText('f₃ = 8 Hz, A = 0.3', ox - 6, oy3 + h3 / 2);

          // Plus signs
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('+', 30, 140);
          ctx.fillText('+', 30, 230);
          ctx.fillText('=', 30, 320);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('傅里叶变换将时域信号分解为不同频率的正弦分量之和', 60, 355);
        } else if (step === 2) {
          // FFT spectrum
          drawTitle(ctx, 'FFT 频谱（频率域）', 30, 46);
          var ox = 80, oy = 80, w = 540, h = 280;
          drawSpectrum(ctx, ox, oy, w, h, 10, false);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('快速傅里叶变换 (FFT) 将时域信号转换到频率域', 350, 370);
        } else if (step === 3) {
          // Lowpass filter
          drawTitle(ctx, '低通滤波（截止频率 = ' + cutoff + ' Hz）', 30, 46);
          var ox = 80, oy = 80, w = 540, h = 280;
          drawSpectrum(ctx, ox, oy, w, h, cutoff, true);

          // Cutoff line
          var frequencies = [2, 5, 8];
          var barW = 60;
          var gap = (w - frequencies.length * barW) / (frequencies.length + 1);
          // Map cutoff freq to x position
          var cutoffX = ox + (cutoff / 10) * w;
          ctx.strokeStyle = COLOR.warning;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(cutoffX, oy);
          ctx.lineTo(cutoffX, oy + h - 30);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = COLOR.warning;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('截止 ' + cutoff + 'Hz', cutoffX, oy - 6);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('灰色/叉号 = 被滤除的高频分量    拖动滑块调整截止频率', 350, 370);
        } else if (step === 4) {
          // Inverse FFT: filtered signal
          drawTitle(ctx, '逆变换：滤波后的信号（截止 = ' + cutoff + ' Hz）', 30, 46);
          var ox = 60, oy = 80, w = 580, h = 260;
          drawAxes(ctx, ox, oy, w, h, '时间 t', '幅度');

          // Original signal (faded)
          drawWave(ctx, ox, oy, w, h, 2.2, compositeSignal, '#d1d5db', 1.5);
          // Filtered signal
          drawWave(ctx, ox, oy, w, h, 2.2, function (t) { return filteredSignal(t, cutoff); }, COLOR.warning, 2.5);

          // Legend
          ctx.fillStyle = '#d1d5db';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('── 原始信号', ox, oy + h + 24);
          ctx.fillStyle = COLOR.warning;
          ctx.fillText('── 滤波后信号', ox + 150, oy + h + 24);

          // Description based on cutoff
          var desc;
          if (cutoff < 2) {
            desc = '所有频率被滤除，信号为零';
          } else if (cutoff < 5) {
            desc = '仅保留 2Hz 低频分量，信号变得平滑';
          } else if (cutoff < 8) {
            desc = '保留 2Hz 和 5Hz 分量，滤除 8Hz 高频噪声';
          } else {
            desc = '所有频率均保留，信号与原始一致';
          }
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.fillText(desc, ox + 300, oy + h + 24);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  }

  // Expose factory for remap (later modules overwrite KP41-45)
  window.__fftFactory = createFFTAnimation;

  // Register for KP IDs: 41, 42, 43, 44, 45
  registerAnimation(41, function (canvas, ctx) { return createFFTAnimation(canvas, ctx); });
  registerAnimation(42, function (canvas, ctx) { return createFFTAnimation(canvas, ctx); });
  registerAnimation(43, function (canvas, ctx) { return createFFTAnimation(canvas, ctx); });
  registerAnimation(44, function (canvas, ctx) { return createFFTAnimation(canvas, ctx); });
  registerAnimation(45, function (canvas, ctx) { return createFFTAnimation(canvas, ctx); });
})();
