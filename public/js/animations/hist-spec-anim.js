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

  // Source histogram: peaked at low values (dark image)
  function buildSourceHist() {
    var hist = new Array(256).fill(0);
    for (var i = 0; i < 256; i++) {
      var val = 200 * Math.exp(-0.5 * Math.pow((i - 50) / 30, 2));
      val += 40 * Math.exp(-0.5 * Math.pow((i - 120) / 25, 2));
      hist[i] = Math.round(val);
    }
    return hist;
  }

  // Target histogram: peaked at high values (bright image)
  function buildTargetHist() {
    var hist = new Array(256).fill(0);
    for (var i = 0; i < 256; i++) {
      var val = 180 * Math.exp(-0.5 * Math.pow((i - 200) / 35, 2));
      val += 60 * Math.exp(-0.5 * Math.pow((i - 130) / 30, 2));
      hist[i] = Math.round(val);
    }
    return hist;
  }

  // Compute CDF from histogram
  function computeCDF(hist) {
    var total = 0;
    for (var i = 0; i < 256; i++) total += hist[i];
    var cdf = new Array(256);
    var sum = 0;
    for (var i = 0; i < 256; i++) {
      sum += hist[i];
      cdf[i] = sum / total;
    }
    return cdf;
  }

  // Build mapping table: for each source gray level, find target gray level where CDFs match
  function buildMapping(sourceCDF, targetCDF) {
    var mapping = new Array(256);
    for (var i = 0; i < 256; i++) {
      var bestJ = 0;
      var bestDiff = Infinity;
      for (var j = 0; j < 256; j++) {
        var diff = Math.abs(sourceCDF[i] - targetCDF[j]);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestJ = j;
        }
      }
      mapping[i] = bestJ;
    }
    return mapping;
  }

  // Apply mapping to source histogram to get result histogram
  function applyMapping(sourceHist, mapping) {
    var result = new Array(256).fill(0);
    for (var i = 0; i < 256; i++) {
      result[mapping[i]] += sourceHist[i];
    }
    return result;
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

  // Draw histogram with optional CDF overlay
  function drawHistPanel(ctx, ox, oy, w, h, hist, color, showCDF, cdf, cdfColor, title) {
    // Title
    ctx.fillStyle = COLOR.textDark;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + w / 2, oy - 4);

    // Find max
    var maxVal = 0;
    for (var i = 0; i < 256; i++) {
      if (hist[i] > maxVal) maxVal = hist[i];
    }
    if (maxVal === 0) maxVal = 1;

    // Draw bars
    var barW = w / 256;
    for (var i = 0; i < 256; i++) {
      var barH = (hist[i] / maxVal) * h;
      var x = ox + i * barW;
      var y = oy + h - barH;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, y, barW + 0.5, barH);
    }
    ctx.globalAlpha = 1.0;

    // CDF overlay
    if (showCDF && cdf) {
      ctx.strokeStyle = cdfColor || COLOR.danger;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i < 256; i++) {
        var x = ox + i * barW;
        var y = oy + h - cdf[i] * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // CDF label
      ctx.fillStyle = cdfColor || COLOR.danger;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('CDF', ox + 240 * barW, oy + h * 0.15);
    }

    // Axes
    ctx.strokeStyle = COLOR.gray;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + h);
    ctx.lineTo(ox + w, oy + h);
    ctx.stroke();

    // X labels
    ctx.fillStyle = COLOR.textLight;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('0', ox, oy + h + 2);
    ctx.fillText('128', ox + 128 * barW, oy + h + 2);
    ctx.fillText('255', ox + 255 * barW, oy + h + 2);
  }

  // ========== Shared factory ==========
  function createHistSpecAnimation(sourceHist, targetHist) {
    var sourceCDF = computeCDF(sourceHist);
    var targetCDF = computeCDF(targetHist);
    var mapping = buildMapping(sourceCDF, targetCDF);
    var resultHist = applyMapping(sourceHist, mapping);

    var totalSteps = 4;
    var descriptions = [
      '源图像直方图（偏暗，峰值在低灰度区）与目标直方图（偏亮，峰值在高灰度区）',
      '计算源图像累积分布函数（CDF），红色曲线为 CDF',
      '计算目标图像累积分布函数（CDF），红色曲线为 CDF',
      '直方图规定化：通过 CDF 映射将源图像灰度分布转换为接近目标分布'
    ];

    return {
      totalSteps: totalSteps,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        if (step === 0) {
          // Show both histograms side by side
          drawTitle(ctx, '源图像与目标图像直方图', 30, 46);
          var pw = 280, ph = 220;
          drawHistPanel(ctx, 40, 90, pw, ph, sourceHist, COLOR.primaryLight, false, null, null, '源图像直方图（偏暗）');
          drawHistPanel(ctx, 380, 90, pw, ph, targetHist, COLOR.successLight, false, null, null, '目标图像直方图（偏亮）');

          // Arrow between
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('→', 350, 200);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('目标：将源图像的灰度分布变换为接近目标图像的分布', 350, 340);
        } else if (step === 1) {
          // Source histogram with CDF
          drawTitle(ctx, '计算源图像 CDF', 30, 46);
          var pw = 280, ph = 220;
          drawHistPanel(ctx, 40, 90, pw, ph, sourceHist, COLOR.primaryLight, true, sourceCDF, COLOR.danger, '源图像直方图 + CDF');

          // CDF explanation
          var ex = 370, ey = 90;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('累积分布函数 (CDF):', ex, ey);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.fillText('CDF(r) = Σ p(rᵢ),  i = 0..r', ex, ey + 24);
          ctx.fillText('', ex, ey + 48);
          ctx.fillText('CDF 表示小于等于灰度 r 的', ex, ey + 60);
          ctx.fillText('像素占总像素的比例。', ex, ey + 80);
          ctx.fillText('', ex, ey + 104);
          ctx.fillText('源图像 CDF 特点:', ex, ey + 116);
          ctx.fillStyle = COLOR.danger;
          ctx.fillText('• 上升较快（低灰度像素集中）', ex, ey + 140);
          ctx.fillText('• CDF(128) ≈ ' + sourceCDF[128].toFixed(2), ex, ey + 162);
          ctx.fillText('• 大部分像素集中在暗区', ex, ey + 184);

          // Draw CDF curve larger
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('CDF 曲线:', ex, 310);
          ctx.strokeStyle = COLOR.danger;
          ctx.lineWidth = 2;
          ctx.beginPath();
          var cdfOx = ex + 70, cdfOy = 310, cdfW = 200, cdfH = 50;
          for (var i = 0; i < 256; i++) {
            var x = cdfOx + (i / 255) * cdfW;
            var y = cdfOy + cdfH - sourceCDF[i] * cdfH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.fillStyle = COLOR.textLight;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('0', cdfOx, cdfOy + cdfH + 10);
          ctx.fillText('255', cdfOx + cdfW, cdfOy + cdfH + 10);

        } else if (step === 2) {
          // Target histogram with CDF
          drawTitle(ctx, '计算目标图像 CDF', 30, 46);
          var pw = 280, ph = 220;
          drawHistPanel(ctx, 40, 90, pw, ph, targetHist, COLOR.successLight, true, targetCDF, COLOR.danger, '目标图像直方图 + CDF');

          var ex = 370, ey = 90;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('目标 CDF 特点:', ex, ey);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.fillText('• 上升较缓（高灰度像素集中）', ex, ey + 24);
          ctx.fillText('• CDF(128) ≈ ' + targetCDF[128].toFixed(2), ex, ey + 48);
          ctx.fillText('• 大部分像素集中在亮区', ex, ey + 72);

          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('映射原理:', ex, ey + 110);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.fillText('对于源图像灰度 r，找到目标灰度 z', ex, ey + 134);
          ctx.fillText('使得 CDF_source(r) = CDF_target(z)', ex, ey + 156);
          ctx.fillText('即：在 CDF 值相同处建立对应关系', ex, ey + 180);

          // Both CDFs comparison
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('两条 CDF 曲线对比:', ex, 310);
          var cdfOx = ex + 10, cdfOy = 330, cdfW = 200, cdfH = 40;

          ctx.strokeStyle = COLOR.primaryLight;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (var i = 0; i < 256; i++) {
            var x = cdfOx + (i / 255) * cdfW;
            var y = cdfOy + cdfH - sourceCDF[i] * cdfH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          ctx.strokeStyle = COLOR.successLight;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (var i = 0; i < 256; i++) {
            var x = cdfOx + (i / 255) * cdfW;
            var y = cdfOy + cdfH - targetCDF[i] * cdfH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          ctx.fillStyle = COLOR.primaryLight;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('源', cdfOx + cdfW + 8, cdfOy + 12);
          ctx.fillStyle = COLOR.successLight;
          ctx.fillText('目标', cdfOx + cdfW + 8, cdfOy + 28);

        } else if (step === 3) {
          // Mapping and result
          drawTitle(ctx, '直方图规定化结果', 30, 46);

          // Source histogram (small)
          var pw = 190, ph = 110;
          drawHistPanel(ctx, 15, 80, pw, ph, sourceHist, COLOR.primaryLight, true, sourceCDF, COLOR.danger, '源图像');

          // Mapping arrows in the middle
          var mx = 220, my = 80, mw = 60, mh = 110;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CDF', mx + mw / 2, my + mh / 2 - 12);
          ctx.fillText('映射', mx + mw / 2, my + mh / 2 + 4);

          // Draw mapping arrows
          ctx.strokeStyle = COLOR.warning;
          ctx.lineWidth = 1.5;
          var arrowYs = [0.2, 0.4, 0.6, 0.8];
          for (var a = 0; a < arrowYs.length; a++) {
            var ay = my + mh * arrowYs[a];
            ctx.beginPath();
            ctx.moveTo(mx + 4, ay);
            ctx.lineTo(mx + mw - 4, ay);
            ctx.stroke();
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(mx + mw - 4, ay);
            ctx.lineTo(mx + mw - 10, ay - 3);
            ctx.moveTo(mx + mw - 4, ay);
            ctx.lineTo(mx + mw - 10, ay + 3);
            ctx.stroke();
          }

          // Target histogram (small)
          drawHistPanel(ctx, 295, 80, pw, ph, targetHist, COLOR.successLight, true, targetCDF, COLOR.danger, '目标图像');

          // Arrow to result
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('→', 510, 135);

          // Result histogram
          drawHistPanel(ctx, 530, 80, 150, ph, resultHist, COLOR.warning, false, null, null, '规定化结果');

          // Mapping table examples
          var tx = 30, ty = 220;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('灰度映射表（示例）:', tx, ty);

          // Table header
          ctx.fillStyle = COLOR.grayBg;
          ctx.fillRect(tx, ty + 20, 300, 22);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('源灰度', tx + 60, ty + 34);
          ctx.fillText('CDF值', tx + 140, ty + 34);
          ctx.fillText('目标灰度', tx + 230, ty + 34);

          // Table rows
          var examples = [20, 50, 80, 120, 160];
          ctx.font = '12px sans-serif';
          for (var i = 0; i < examples.length; i++) {
            var src = examples[i];
            var tgt = mapping[src];
            var ry = ty + 44 + i * 20;
            ctx.fillStyle = i % 2 === 0 ? '#fafafa' : '#fff';
            ctx.fillRect(tx, ry, 300, 20);
            ctx.fillStyle = COLOR.textDark;
            ctx.textAlign = 'center';
            ctx.fillText(String(src), tx + 60, ry + 13);
            ctx.fillText(sourceCDF[src].toFixed(3), tx + 140, ry + 13);
            ctx.fillText(String(tgt), tx + 230, ry + 13);
          }

          // Comparison: result vs target
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('结果直方图 vs 目标直方图:', 370, ty);

          var cw = 280, ch = 120;
          var cox = 370, coy = ty + 20;

          // Draw result bars
          var maxR = 0;
          for (var i = 0; i < 256; i++) { if (resultHist[i] > maxR) maxR = resultHist[i]; }
          var maxT = 0;
          for (var i = 0; i < 256; i++) { if (targetHist[i] > maxT) maxT = targetHist[i]; }
          var maxBoth = Math.max(maxR, maxT);

          var barW = cw / 256;
          for (var i = 0; i < 256; i++) {
            var x = cox + i * barW;
            // Target (faded)
            var tH = (targetHist[i] / maxBoth) * ch;
            ctx.fillStyle = COLOR.successLight;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, coy + ch - tH, barW + 0.5, tH);
            // Result
            var rH = (resultHist[i] / maxBoth) * ch;
            ctx.fillStyle = COLOR.warning;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x, coy + ch - rH, barW + 0.5, rH);
          }
          ctx.globalAlpha = 1.0;

          ctx.strokeStyle = COLOR.gray;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cox, coy);
          ctx.lineTo(cox, coy + ch);
          ctx.lineTo(cox + cw, coy + ch);
          ctx.stroke();

          // Legend
          ctx.fillStyle = COLOR.warning;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('■ 结果', cox, coy + ch + 16);
          ctx.fillStyle = COLOR.successLight;
          ctx.fillText('■ 目标', cox + 80, coy + ch + 16);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('结果直方图近似匹配目标分布', cox + cw / 2, coy + ch + 34);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  }

  // ========== Pre-compute histograms ==========
  var sourceHist = buildSourceHist();
  var targetHist = buildTargetHist();

  // Register for KP IDs: 18, 19, 20
  var histSpecFactory = function (canvas, ctx) {
    return createHistSpecAnimation(sourceHist, targetHist);
  };
  window.__histSpecFactory = histSpecFactory;
  registerAnimation(18, histSpecFactory);
  registerAnimation(19, histSpecFactory);
  registerAnimation(20, histSpecFactory);
})();
