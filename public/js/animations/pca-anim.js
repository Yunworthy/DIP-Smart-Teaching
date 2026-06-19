(function () {
  'use strict';

  var PRIMARY = '#4f46e5', PRIMARY_LIGHT = '#6366f1';
  var SUCCESS = '#10b981', DANGER = '#ef4444', WARNING = '#f59e0b';
  var GRAY_BG = '#f9fafb', GRAY_BORDER = '#e5e7eb';
  var TEXT = '#374151', TEXT_DARK = '#1f2937';

  var stepDescriptions = [
    '\u539f\u59cb\u6570\u636e\u70b9\uff1a\u5c55\u793a\u4e8c\u7ef4\u6563\u70b9\u56fe\uff0c\u89c2\u5bdf\u6570\u636e\u7684\u5206\u5e03\u548c\u76f8\u5173\u6027',
    '\u8ba1\u7b97\u5747\u503c\u548c\u534f\u65b9\u5dee\uff1a\u6c42\u6570\u636e\u5747\u503c\u70b9\u548c\u534f\u65b9\u5dee\u77e9\u9635',
    '\u7279\u5f81\u503c\u548c\u7279\u5f81\u5411\u91cf\uff1a\u8ba1\u7b97\u534f\u65b9\u5dee\u77e9\u9635\u7684\u7279\u5f81\u503c\u548c\u7279\u5f81\u5411\u91cf',
    '\u9009\u62e9\u4e3b\u6210\u5206\uff1a\u9009\u53d6\u6700\u5927\u7279\u5f81\u503c\u5bf9\u5e94\u7684\u7279\u5f81\u5411\u91cf\u4f5c\u4e3a\u7b2c\u4e00\u4e3b\u6210\u5206',
    '\u964d\u7ef4\u6295\u5f71\uff1a\u5c06\u6240\u6709\u6570\u636e\u70b9\u6295\u5f71\u5230\u7b2c\u4e00\u4e3b\u6210\u5206\u4e0a\uff0c\u5b9e\u73b0\u4ece2D\u52301D\u7684\u964d\u7ef4'
  ];

  // Correlated 2D data points (20 points along a tilted axis)
  var points = [
    [-2.8, -1.1], [-2.4, -1.5], [-2.1, -0.7], [-1.7, -1.0], [-1.4, -0.3],
    [-1.0, -0.8], [-0.7, -0.1], [-0.3, -0.5], [ 0.0,  0.2], [ 0.3, -0.2],
    [ 0.6,  0.5], [ 0.9,  0.1], [ 1.2,  0.8], [ 1.5,  0.4], [ 1.8,  1.1],
    [ 2.1,  0.7], [ 2.4,  1.3], [ 2.7,  1.0], [ 3.0,  1.6], [ 3.3,  1.2]
  ];

  var N = points.length;
  var meanX = 0, meanY = 0;
  var i;
  for (i = 0; i < N; i++) { meanX += points[i][0]; meanY += points[i][1]; }
  meanX /= N; meanY /= N;

  // Covariance matrix
  var covXX = 0, covXY = 0, covYY = 0;
  for (i = 0; i < N; i++) {
    var dx = points[i][0] - meanX;
    var dy = points[i][1] - meanY;
    covXX += dx * dx; covXY += dx * dy; covYY += dy * dy;
  }
  covXX /= (N - 1); covXY /= (N - 1); covYY /= (N - 1);

  // Eigenvalues
  var trace = covXX + covYY;
  var det = covXX * covYY - covXY * covXY;
  var disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  var lambda1 = trace / 2 + disc;
  var lambda2 = trace / 2 - disc;

  // Eigenvectors
  var ev1, ev2;
  if (Math.abs(covXY) > 1e-10) {
    var v1x = lambda1 - covYY, v1y = covXY;
    var len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    ev1 = [v1x / len1, v1y / len1];
    var v2x = lambda2 - covYY, v2y = covXY;
    var len2 = Math.sqrt(v2x * v2x + v2y * v2y);
    ev2 = [v2x / len2, v2y / len2];
  } else {
    ev1 = [1, 0]; ev2 = [0, 1];
  }

  var varExplained1 = (lambda1 / (lambda1 + lambda2) * 100).toFixed(1);

  // Project points onto PC1
  var projections = [];
  for (i = 0; i < N; i++) {
    var dxp = points[i][0] - meanX;
    var dyp = points[i][1] - meanY;
    projections.push(dxp * ev1[0] + dyp * ev1[1]);
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

  function drawTitle(text) {
    ctx.fillStyle = TEXT_DARK;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, 20, 10);
    ctx.strokeStyle = GRAY_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 34); ctx.lineTo(680, 34); ctx.stroke();
  }

  function drawStepLabel(step, total) {
    ctx.fillStyle = PRIMARY;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('\u6b65\u9aa4 ' + (step + 1) + ' / ' + total, 685, 10);
  }

  // Plot area configuration
  var plotLeft = 70, plotTop = 50, plotRight = 490, plotBottom = 360;
  var plotW = plotRight - plotLeft, plotH = plotBottom - plotTop;
  var dataMinX = -4, dataMaxX = 4.5, dataMinY = -2.5, dataMaxY = 2.5;
  var scaleX = plotW / (dataMaxX - dataMinX);
  var scaleY = plotH / (dataMaxY - dataMinY);

  function toCX(dx) { return plotLeft + (dx - dataMinX) * scaleX; }
  function toCY(dy) { return plotBottom - (dy - dataMinY) * scaleY; }

  function drawAxes() {
    ctx.strokeStyle = GRAY_BORDER;
    ctx.lineWidth = 0.5;
    var x, y;
    for (x = Math.ceil(dataMinX); x <= Math.floor(dataMaxX); x++) {
      ctx.beginPath(); ctx.moveTo(toCX(x), plotTop); ctx.lineTo(toCX(x), plotBottom); ctx.stroke();
    }
    for (y = Math.ceil(dataMinY); y <= Math.floor(dataMaxY); y++) {
      ctx.beginPath(); ctx.moveTo(plotLeft, toCY(y)); ctx.lineTo(plotRight, toCY(y)); ctx.stroke();
    }
    ctx.strokeStyle = TEXT;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(plotLeft, toCY(0)); ctx.lineTo(plotRight, toCY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toCX(0), plotTop); ctx.lineTo(toCX(0), plotBottom); ctx.stroke();

    ctx.fillStyle = TEXT;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (x = Math.ceil(dataMinX); x <= Math.floor(dataMaxX); x++) {
      if (x === 0) continue;
      ctx.fillText('' + x, toCX(x), plotBottom + 4);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (y = Math.ceil(dataMinY); y <= Math.floor(dataMaxY); y++) {
      if (y === 0) continue;
      ctx.fillText('' + y, plotLeft - 6, toCY(y));
    }
    ctx.fillStyle = TEXT_DARK;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X\u2081', (plotLeft + plotRight) / 2, plotBottom + 20);
    ctx.save();
    ctx.translate(plotLeft - 40, (plotTop + plotBottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('X\u2082', 0, 0);
    ctx.restore();
  }

  function drawPoints(color, radius, alpha) {
    ctx.globalAlpha = alpha || 1;
    for (var i = 0; i < N; i++) {
      ctx.beginPath();
      ctx.arc(toCX(points[i][0]), toCY(points[i][1]), radius || 5, 0, Math.PI * 2);
      ctx.fillStyle = color || PRIMARY;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawStar(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
      var ox = x + r * Math.cos(angle);
      var oy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
      var ia = angle + Math.PI / 5;
      ctx.lineTo(x + r * 0.4 * Math.cos(ia), y + r * 0.4 * Math.sin(ia));
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawArrow(x1, y1, x2, y2, color, width) {
    var hl = 10;
    var angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - 0.35), y2 - hl * Math.sin(angle - 0.35));
    ctx.lineTo(x2 - hl * Math.cos(angle + 0.35), y2 - hl * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fill();
  }

  function drawInfoBox(x, y, w, h, lines) {
    roundRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    for (var i = 0; i < lines.length; i++) {
      ctx.fillStyle = lines[i].color || TEXT;
      ctx.font = (lines[i].bold ? 'bold ' : '') + (lines[i].size || 11) + 'px sans-serif';
      ctx.fillText(lines[i].text, x + 10, y + 10 + i * 20);
    }
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Raw scatter plot
    function drawStep0() {
      drawTitle('\u539f\u59cb\u6570\u636e\u70b9\uff08\u4e8c\u7ef4\u6563\u70b9\u56fe\uff09');
      drawStepLabel(0, 5);
      drawAxes();
      drawPoints(PRIMARY, 5);

      var infoX = plotRight + 20, infoY = plotTop + 10;
      drawInfoBox(infoX, infoY, 180, 180, [
        { text: '\u6570\u636e\u6982\u51b5', bold: true, color: TEXT_DARK, size: 13 },
        { text: '' },
        { text: '\u6570\u636e\u70b9\u6570: ' + N },
        { text: '\u7ef4\u5ea6: 2D' },
        { text: '\u7279\u5f81: X\u2081, X\u2082' },
        { text: '' },
        { text: '\u89c2\u5bdf:', bold: true, color: PRIMARY },
        { text: '\u6570\u636e\u70b9\u6cbf\u67d0\u4e2a' },
        { text: '\u65b9\u5411\u5448\u7ebf\u6027\u5206\u5e03\uff0c' },
        { text: 'X\u2081\u548cX\u2082\u5b58\u5728' },
        { text: '\u6b63\u76f8\u5173\u6027\u3002' }
      ]);
    }

    // Step 1: Mean + covariance
    function drawStep1() {
      drawTitle('\u8ba1\u7b97\u5747\u503c\u548c\u534f\u65b9\u5dee\u77e9\u9635');
      drawStepLabel(1, 5);
      drawAxes();
      drawPoints(PRIMARY_LIGHT + '80', 5);

      var mx = toCX(meanX), my = toCY(meanY);
      drawStar(mx, my, 10, DANGER);

      ctx.strokeStyle = DANGER + '60';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(mx, plotBottom); ctx.lineTo(mx, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(plotLeft, my); ctx.lineTo(mx, my); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = DANGER;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u5747\u503c (' + meanX.toFixed(2) + ', ' + meanY.toFixed(2) + ')', mx + 14, my - 10);

      var infoX = plotRight + 20, infoY = plotTop + 10;
      drawInfoBox(infoX, infoY, 185, 260, [
        { text: '\u534f\u65b9\u5dee\u77e9\u9635 \u03a3', bold: true, color: TEXT_DARK, size: 13 },
        { text: '' },
        { text: '\u250c                     \u2510' },
        { text: '\u2502 ' + covXX.toFixed(3) + '   ' + covXY.toFixed(3) + ' \u2502', color: TEXT_DARK },
        { text: '\u2502 ' + covXY.toFixed(3) + '   ' + covYY.toFixed(3) + ' \u2502', color: TEXT_DARK },
        { text: '\u2518                     \u2518' },
        { text: '' },
        { text: 'Var(X\u2081) = ' + covXX.toFixed(3) },
        { text: 'Var(X\u2082) = ' + covYY.toFixed(3) },
        { text: 'Cov = ' + covXY.toFixed(3), color: PRIMARY },
        { text: '' },
        { text: '\u534f\u65b9\u5dee > 0 \u8868\u793a', color: TEXT },
        { text: 'X\u2081\u548cX\u2082\u6b63\u76f8\u5173', bold: true, color: SUCCESS }
      ]);
    }

    // Step 2: Eigenvectors
    function drawStep2() {
      drawTitle('\u7279\u5f81\u503c\u548c\u7279\u5f81\u5411\u91cf');
      drawStepLabel(2, 5);
      drawAxes();
      drawPoints(PRIMARY_LIGHT + '80', 5);

      var mx = toCX(meanX), my = toCY(meanY);
      drawStar(mx, my, 8, '#6b7280');

      var as = 35;
      var s1 = Math.sqrt(lambda1) * as;
      var s2 = Math.sqrt(lambda2) * as;

      var pc1ex = mx + ev1[0] * s1, pc1ey = my - ev1[1] * s1;
      drawArrow(mx, my, pc1ex, pc1ey, DANGER, 3);

      var pc2ex = mx + ev2[0] * s2, pc2ey = my - ev2[1] * s2;
      drawArrow(mx, my, pc2ex, pc2ey, PRIMARY, 2.5);

      ctx.fillStyle = DANGER;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PC1 (\u03bb\u2081=' + lambda1.toFixed(2) + ')', pc1ex + 8, pc1ey - 8);
      ctx.fillStyle = PRIMARY;
      ctx.fillText('PC2 (\u03bb\u2082=' + lambda2.toFixed(2) + ')', pc2ex + 8, pc2ey - 8);

      var infoX = plotRight + 20, infoY = plotTop + 10;
      drawInfoBox(infoX, infoY, 185, 230, [
        { text: '\u7279\u5f81\u5206\u89e3\u7ed3\u679c', bold: true, color: TEXT_DARK, size: 13 },
        { text: '' },
        { text: '\u7b2c\u4e00\u4e3b\u6210\u5206 (PC1):', bold: true, color: DANGER },
        { text: '\u03bb\u2081 = ' + lambda1.toFixed(3) },
        { text: '\u65b9\u5411 (' + ev1[0].toFixed(3) + ', ' + ev1[1].toFixed(3) + ')' },
        { text: '' },
        { text: '\u7b2c\u4e8c\u4e3b\u6210\u5206 (PC2):', bold: true, color: PRIMARY },
        { text: '\u03bb\u2082 = ' + lambda2.toFixed(3) },
        { text: '\u65b9\u5411 (' + ev2[0].toFixed(3) + ', ' + ev2[1].toFixed(3) + ')' },
        { text: '' },
        { text: '\u03bb\u2081 \u226b \u03bb\u2082 \u8868\u793a', bold: true, color: SUCCESS },
        { text: '\u6570\u636e\u4e3b\u8981\u53d8\u5316' },
        { text: '\u6cbf PC1 \u65b9\u5411' }
      ]);
    }

    // Step 3: Select PC1
    function drawStep3() {
      drawTitle('\u9009\u62e9\u4e3b\u6210\u5206\uff1a\u4fdd\u7559 PC1\uff0c\u5ffd\u7565 PC2');
      drawStepLabel(3, 5);
      drawAxes();
      drawPoints(PRIMARY_LIGHT + '80', 5);

      var mx = toCX(meanX), my = toCY(meanY);
      drawStar(mx, my, 8, '#6b7280');

      var as = 35;
      var s1 = Math.sqrt(lambda1) * as;
      var s2 = Math.sqrt(lambda2) * as;

      var pc1ex = mx + ev1[0] * s1, pc1ey = my - ev1[1] * s1;
      drawArrow(mx, my, pc1ex, pc1ey, DANGER, 3.5);

      ctx.globalAlpha = 0.2;
      var pc2ex = mx + ev2[0] * s2, pc2ey = my - ev2[1] * s2;
      drawArrow(mx, my, pc2ex, pc2ey, '#9ca3af', 2);
      ctx.globalAlpha = 1;

      ctx.fillStyle = DANGER;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PC1 \u2713 \u4fdd\u7559', pc1ex + 8, pc1ey - 8);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.fillText('PC2 \u2717 \u5ffd\u7565', pc2ex + 8, pc2ey - 8);

      var barX = plotRight + 20, barY = plotTop + 20;
      roundRect(ctx, barX, barY, 185, 260, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u65b9\u5dee\u89e3\u91ca\u7387', barX + 10, barY + 20);

      // Stacked bar
      var sbX = barX + 15, sbY = barY + 45, sbW = 155, sbH = 24;
      var pc1W = Math.round(sbW * lambda1 / (lambda1 + lambda2));
      roundRect(ctx, sbX, sbY, pc1W, sbH, 4);
      ctx.fillStyle = DANGER; ctx.fill();
      ctx.fillStyle = PRIMARY_LIGHT + '50';
      ctx.fillRect(sbX + pc1W, sbY, sbW - pc1W, sbH);
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 0.5;
      ctx.strokeRect(sbX, sbY, sbW, sbH);

      ctx.fillStyle = TEXT; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('PC1: ' + varExplained1 + '%', barX + 15, barY + 82);
      ctx.fillText('PC2: ' + (100 - parseFloat(varExplained1)).toFixed(1) + '%', barX + 15, barY + 100);

      ctx.fillStyle = TEXT_DARK; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u9009\u62e9\u7b56\u7565:', barX + 10, barY + 132);
      ctx.fillStyle = TEXT; ctx.font = '11px sans-serif';
      ctx.fillText('\u4fdd\u7559\u6700\u5927\u7279\u5f81\u503c\u5bf9\u5e94', barX + 10, barY + 154);
      ctx.fillText('\u7684\u7279\u5f81\u5411\u91cf\uff0c\u5373\u4e3b\u6210\u5206\u3002', barX + 10, barY + 172);
      ctx.fillText('\u8be5\u65b9\u5411\u6355\u6349\u4e86\u6570\u636e', barX + 10, barY + 194);
      ctx.fillText('\u7684\u4e3b\u8981\u53d8\u5316\u3002', barX + 10, barY + 212);

      ctx.fillStyle = SUCCESS; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u4fdd\u7559 ' + varExplained1 + '%', barX + 10, barY + 240);
    }

    // Step 4: Project onto PC1
    function drawStep4() {
      drawTitle('\u964d\u7ef4\u6295\u5f71\uff1a2D \u2192 1D');
      drawStepLabel(4, 5);
      drawAxes();

      var mx = toCX(meanX), my = toCY(meanY);
      var as = 35;
      var s1 = Math.sqrt(lambda1) * as;

      // PC1 axis line (extended)
      var axLen = 5;
      var ax1x = toCX(meanX - ev1[0] * axLen);
      var ax1y = toCY(meanY - ev1[1] * axLen);
      var ax2x = toCX(meanX + ev1[0] * axLen);
      var ax2y = toCY(meanY + ev1[1] * axLen);
      ctx.strokeStyle = DANGER + '40';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax1x, ax1y); ctx.lineTo(ax2x, ax2y); ctx.stroke();

      // Original points (dimmed)
      drawPoints(PRIMARY_LIGHT + '50', 4, 0.4);

      // Projection lines and projected points
      for (var i = 0; i < N; i++) {
        var px = toCX(points[i][0]);
        var py = toCY(points[i][1]);
        var t = projections[i];
        var projDataX = meanX + t * ev1[0];
        var projDataY = meanY + t * ev1[1];
        var ppx = toCX(projDataX);
        var ppy = toCY(projDataY);

        // Dashed line from point to projection
        ctx.strokeStyle = WARNING + '80';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ppx, ppy); ctx.stroke();
        ctx.setLineDash([]);

        // Projected point (larger, red)
        ctx.beginPath();
        ctx.arc(ppx, ppy, 4, 0, Math.PI * 2);
        ctx.fillStyle = DANGER;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // PC1 arrow
      drawArrow(mx, my, mx + ev1[0] * s1, my - ev1[1] * s1, DANGER, 3);
      drawStar(mx, my, 7, '#6b7280');

      // 1D representation at the bottom
      var oneDY = plotBottom + 38;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('1D \u8868\u793a\uff08\u6295\u5f71\u5750\u6807\uff09:', plotLeft, oneDY - 6);

      // 1D axis
      var axisStartX = plotLeft;
      var axisEndX = plotRight;
      var axisMidX = (axisStartX + axisEndX) / 2;
      ctx.strokeStyle = DANGER;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(axisStartX, oneDY + 10); ctx.lineTo(axisEndX, oneDY + 10); ctx.stroke();

      // Projected points on 1D axis
      var minProj = Math.min.apply(null, projections);
      var maxProj = Math.max.apply(null, projections);
      var projRange = maxProj - minProj || 1;
      for (var i = 0; i < N; i++) {
        var px1d = axisStartX + ((projections[i] - minProj) / projRange) * (axisEndX - axisStartX);
        ctx.beginPath();
        ctx.arc(px1d, oneDY + 10, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = DANGER;
        ctx.fill();
      }

      // Info box
      var infoX = plotRight + 20, infoY = plotTop + 10;
      drawInfoBox(infoX, infoY, 185, 240, [
        { text: '\u964d\u7ef4\u7ed3\u679c', bold: true, color: TEXT_DARK, size: 13 },
        { text: '' },
        { text: '\u539f\u59cb\u7ef4\u5ea6: 2D', bold: true },
        { text: '\u964d\u7ef4\u540e: 1D' },
        { text: '' },
        { text: '\u4fdd\u7559\u65b9\u5dee: ' + varExplained1 + '%', bold: true, color: SUCCESS },
        { text: '\u4e22\u5931\u65b9\u5dee: ' + (100 - parseFloat(varExplained1)).toFixed(1) + '%', color: WARNING },
        { text: '' },
        { text: '\u6bcf\u4e2a\u6570\u636e\u70b9\u73b0\u5728', color: TEXT },
        { text: '\u53ea\u9700\u4e00\u4e2a\u6570\u503c', color: TEXT },
        { text: '(\u5728PC1\u4e0a\u7684\u6295\u5f71)', color: TEXT },
        { text: '\u6765\u8868\u793a\u3002', color: TEXT }
      ]);
    }

    return {
      totalSteps: 5,
      draw: function (step) {
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

  registerAnimation(96, factory);
})();
