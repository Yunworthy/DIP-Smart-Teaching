(function () {
  'use strict';

  var PRIMARY = '#4f46e5', PRIMARY_LIGHT = '#6366f1';
  var SUCCESS = '#10b981', DANGER = '#ef4444', WARNING = '#f59e0b';
  var GRAY_BG = '#f9fafb', GRAY_BORDER = '#e5e7eb';
  var TEXT = '#374151', TEXT_DARK = '#1f2937';

  var stepDescriptions = [
    '8\u00d78\u56fe\u50cf\u5757\uff1a\u5c55\u793a\u539f\u59cb\u50cf\u7d20\u503c\u77e9\u9635',
    'DCT\u57fa\u51fd\u6570\uff1a\u5c55\u793a64\u4e2aDCT\u57fa\u51fd\u6570\uff08\u4ece\u4f4e\u9891\u5230\u9ad8\u9891\uff09',
    'DCT\u7cfb\u6570\uff1a\u8ba1\u7b97\u5f97\u5230\u7684DCT\u53d8\u6362\u7cfb\u6570\u77e9\u9635\uff0c\u80fd\u91cf\u96c6\u4e2d\u5728\u5de6\u4e0a\u89d2',
    '\u91cf\u5316\uff1a\u4f7f\u7528\u91cf\u5316\u8868\u5bf9\u7cfb\u6570\u8fdb\u884c\u9664\u6cd5\u548c\u53d6\u6574\uff0c\u8bb8\u591a\u7cfb\u6570\u53d8\u4e3a\u96f6',
    '\u538b\u7f29\u91cd\u5efa\uff1a\u53cd\u91cf\u5316\u540e\u91cd\u5efa\u56fe\u50cf\u5757\uff0c\u4e0e\u539f\u59cb\u56fe\u50cf\u5bf9\u6bd4\uff0c\u8ba1\u7b97PSNR'
  ];

  // 8x8 pixel block (horizontal gradient with features)
  var pixelBlock = [
    [52,  55,  60,  62,  68,  70,  75,  78],
    [48,  50,  55, 120,  65,  68,  72,  76],
    [45,  48,  52,  55,  60,  65,  68,  72],
    [42,  44,  48,  50,  55,  58,  65,  68],
    [38,  40,  44,  46,  50,  54,  60,  64],
    [35,  36, 180,  42,  46,  50,  55,  60],
    [30,  32,  35,  38,  42,  45,  50,  55],
    [25,  28,  30,  33,  36,  40,  45,  50]
  ];

  // Pre-computed DCT coefficients (representative values)
  var dctCoeffs = [
    [ 200, -80,  25, -12,   8,  -4,   2,  -1],
    [ -45,  30, -15,   8,  -3,   1,   0,   0],
    [  30, -18,  12,  -5,   2,  -1,   0,   0],
    [ -15,  10,  -6,   3,  -1,   0,   0,   0],
    [   8,  -5,   3,  -2,   1,   0,   0,   0],
    [  -3,   2,  -1,   1,   0,   0,   0,   0],
    [   1,  -1,   1,   0,   0,   0,   0,   0],
    [   0,   0,   0,   0,   0,   0,   0,   0]
  ];

  // Standard JPEG luminance quantization table
  var quantTable = [
    [16, 11, 10, 16,  24,  40,  51,  61],
    [12, 12, 14, 19,  26,  58,  60,  55],
    [14, 13, 16, 24,  40,  57,  69,  56],
    [14, 17, 22, 35,  64,  92,  95,  77],
    [18, 22, 37, 56,  68, 109, 103,  77],
    [24, 35, 55, 64,  81, 104, 113,  92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100,  96,  92]
  ];

  // Quantized coefficients
  var quantized = [];
  for (var r = 0; r < 8; r++) {
    quantized[r] = [];
    for (var c = 0; c < 8; c++) {
      quantized[r][c] = Math.round(dctCoeffs[r][c] / quantTable[r][c]);
    }
  }

  // Reconstructed DCT coefficients
  var reconstructed = [];
  for (var r = 0; r < 8; r++) {
    reconstructed[r] = [];
    for (var c = 0; c < 8; c++) {
      reconstructed[r][c] = quantized[r][c] * quantTable[r][c];
    }
  }

  // Count non-zero quantized coefficients
  var nonZeroCount = 0;
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      if (quantized[r][c] !== 0) nonZeroCount++;
    }
  }

  // Zigzag order indices
  var zigzag = [
    [0,0],[0,1],[1,0],[2,0],[1,1],[0,2],[0,3],[1,2],
    [2,1],[3,0],[4,0],[3,1],[2,2],[1,3],[0,4],[0,5],
    [1,4],[2,3],[3,2],[4,1],[5,0],[6,0],[5,1],[4,2],
    [3,3],[2,4],[1,5],[0,6],[0,7],[1,6],[2,5],[3,4],
    [4,3],[5,2],[6,1],[7,0],[7,1],[6,2],[5,3],[4,4],
    [3,5],[2,6],[1,7],[2,7],[3,6],[4,5],[5,4],[6,3],
    [7,2],[7,3],[6,4],[5,5],[4,6],[3,7],[4,7],[5,6],
    [6,5],[7,4],[7,5],[6,6],[5,7],[6,7],[7,6],[7,7]
  ];

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

  function valueColor(v, maxAbs) {
    if (Math.abs(v) < 0.5) return '#f8fafc';
    var t = Math.min(Math.abs(v) / maxAbs, 1);
    if (v > 0) {
      var r = Math.round(220 + 35 * t);
      var g = Math.round(220 - 140 * t);
      var b = Math.round(220 - 180 * t);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
      var r = Math.round(220 - 180 * t);
      var g = Math.round(220 - 100 * t);
      var b = Math.round(220 + 35 * t);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
  }

  function drawMatrixGrid(x, y, cellSize, matrix, maxAbs, showZeros) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var v = matrix[r][c];
        var px = x + c * cellSize;
        var py = y + r * cellSize;

        if (!showZeros && v === 0) {
          ctx.fillStyle = '#f1f5f9';
        } else {
          ctx.fillStyle = valueColor(v, maxAbs);
        }
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);

        var textColor = Math.abs(v) > maxAbs * 0.6 ? '#ffffff' : TEXT_DARK;
        if (v === 0 && !showZeros) textColor = '#cbd5e1';
        ctx.fillStyle = textColor;
        var fontSize = Math.max(8, Math.round(cellSize * 0.3));
        ctx.font = (Math.abs(v) > maxAbs * 0.3 ? 'bold ' : '') + fontSize + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('' + v, px + cellSize / 2, py + cellSize / 2);
      }
    }
  }

  function drawPixelBlock(x, y, cellSize) {
    var minV = 255, maxV = 0;
    for (var r = 0; r < 8; r++)
      for (var c = 0; c < 8; c++) {
        if (pixelBlock[r][c] < minV) minV = pixelBlock[r][c];
        if (pixelBlock[r][c] > maxV) maxV = pixelBlock[r][c];
      }
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var v = pixelBlock[r][c];
        var t = (v - minV) / (maxV - minV);
        var g = Math.round(60 + t * 180);
        var px = x + c * cellSize;
        var py = y + r * cellSize;
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);
        ctx.fillStyle = t > 0.5 ? TEXT_DARK : '#ffffff';
        ctx.font = 'bold ' + Math.max(9, Math.round(cellSize * 0.28)) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('' + v, px + cellSize / 2, py + cellSize / 2);
      }
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

    // Step 0: 8x8 image block
    function drawStep0() {
      drawTitle('8\u00d78 \u56fe\u50cf\u5757\u50cf\u7d20\u503c');
      drawStepLabel(0, 5);

      var cellSize = 38;
      var gx = Math.round((W - 8 * cellSize) / 2) - 80;
      var gy = 50;

      drawPixelBlock(gx, gy, cellSize);
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, 8 * cellSize, 8 * cellSize);

      // Row/col labels
      ctx.fillStyle = TEXT;
      ctx.font = '10px sans-serif';
      for (var r = 0; r < 8; r++) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('' + r, gx - 6, gy + r * cellSize + cellSize / 2);
      }
      for (var c = 0; c < 8; c++) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('' + c, gx + c * cellSize + cellSize / 2, gy + 8 * cellSize + 4);
      }

      // Info box
      var infoX = gx + 8 * cellSize + 30;
      var infoY = gy + 20;
      roundRect(ctx, infoX, infoY, 220, 200, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u56fe\u50cf\u5757\u4fe1\u606f', infoX + 12, infoY + 20);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u5c3a\u5bf8: 8 \u00d7 8 \u50cf\u7d20', infoX + 12, infoY + 48);
      ctx.fillText('\u603b\u50cf\u7d20\u6570: 64', infoX + 12, infoY + 70);
      ctx.fillText('\u6bd4\u7279\u6df1\u5ea6: 8\u4f4d (0-255)', infoX + 12, infoY + 92);
      ctx.fillText('\u6570\u636e\u91cf: 64 \u00d7 8 = 512\u6bd4\u7279', infoX + 12, infoY + 114);

      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('DCT\u7f16\u7801\u6d41\u7a0b:', infoX + 12, infoY + 146);
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u50cf\u7d20\u503c \u2192 DCT\u53d8\u6362 \u2192 \u91cf\u5316 \u2192 \u7f16\u7801', infoX + 12, infoY + 168);
    }

    // Step 1: DCT basis functions (8x8 gallery)
    function drawStep1() {
      drawTitle('DCT \u57fa\u51fd\u6570\uff0864\u4e2a\uff09');
      drawStepLabel(1, 5);

      var thumbPx = 8 * 5; // 40px per thumbnail (5px per sub-pixel)
      var gap = 3;
      var totalW = 8 * thumbPx + 7 * gap;
      var startX = Math.round((W - totalW) / 2) - 30;
      var startY = 50;

      // Precompute alpha values
      function alpha(n) { return n === 0 ? 1 / Math.sqrt(8) : Math.sqrt(2 / 8); }

      for (var u = 0; u < 8; u++) {
        for (var v = 0; v < 8; v++) {
          var tx = startX + v * (thumbPx + gap);
          var ty = startY + u * (thumbPx + gap);

          for (var m = 0; m < 8; m++) {
            for (var n = 0; n < 8; n++) {
              var val = alpha(u) * alpha(v) *
                Math.cos((2 * n + 1) * v * Math.PI / 16) *
                Math.cos((2 * m + 1) * u * Math.PI / 16);
              var gray = Math.round((val + 0.5) * 255);
              gray = Math.max(0, Math.min(255, gray));
              ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
              ctx.fillRect(tx + n * 5, ty + m * 5, 5, 5);
            }
          }
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(tx, ty, thumbPx, thumbPx);
        }
      }

      // Axis labels
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (var v = 0; v < 8; v++) {
        ctx.fillText('v=' + v, startX + v * (thumbPx + gap) + thumbPx / 2, startY + 8 * (thumbPx + gap) + 4);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var u = 0; u < 8; u++) {
        ctx.fillText('u=' + u, startX - 6, startY + u * (thumbPx + gap) + thumbPx / 2);
      }

      // Annotations
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      var annY = startY + 8 * (thumbPx + gap) + 22;
      ctx.fillText('\u2196 \u4f4e\u9891\uff08DC\u5206\u91cf\uff09', startX, annY);
      ctx.textAlign = 'right';
      ctx.fillText('\u9ad8\u9891 \u2198', startX + totalW, annY);

      // Legend box on the right
      var lx = startX + totalW + 20;
      var ly = startY + 10;
      if (lx + 160 < W) {
        roundRect(ctx, lx, ly, 160, 120, 6);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

        ctx.fillStyle = TEXT_DARK;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('DCT\u57fa\u51fd\u6570\u8bf4\u660e', lx + 8, ly + 16);
        ctx.fillStyle = TEXT;
        ctx.font = '10px sans-serif';
        ctx.fillText('\u6bcf\u4e2a\u5c0f\u65b9\u5757\u4ee3\u8868\u4e00\u4e2a', lx + 8, ly + 36);
        ctx.fillText('\u4e8c\u7ef4\u4f59\u5f26\u57fa\u51fd\u6570\u3002', lx + 8, ly + 52);
        ctx.fillText('\u539f\u59cb\u56fe\u50cf = \u57fa\u51fd\u6570', lx + 8, ly + 72);
        ctx.fillText('\u7684\u7ebf\u6027\u7ec4\u5408\u3002', lx + 8, ly + 88);
        ctx.fillStyle = PRIMARY;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('\u4f4e\u9891\u2192\u6574\u4f53\u7ed3\u6784', lx + 8, ly + 108);
      }
    }

    // Step 2: DCT coefficients
    function drawStep2() {
      drawTitle('DCT \u53d8\u6362\u7cfb\u6570\u77e9\u9635');
      drawStepLabel(2, 5);

      var cellSize = 36;
      var gx = 40;
      var gy = 50;

      drawMatrixGrid(gx, gy, cellSize, dctCoeffs, 200, true);
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx, gy, 8 * cellSize, 8 * cellSize);

      // Highlight top-left 4x4 (energy concentration)
      ctx.strokeStyle = WARNING;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx, gy, 4 * cellSize, 4 * cellSize);

      // Zigzag path (first 16 points)
      ctx.strokeStyle = PRIMARY_LIGHT + '80';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (var i = 0; i < Math.min(16, zigzag.length); i++) {
        var zr = zigzag[i][0], zc = zigzag[i][1];
        var zx = gx + zc * cellSize + cellSize / 2;
        var zy = gy + zr * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(zx, zy);
        else ctx.lineTo(zx, zy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = TEXT;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (var r = 0; r < 8; r++) ctx.fillText('' + r, gx - 6, gy + r * cellSize + cellSize / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (var c = 0; c < 8; c++) ctx.fillText('' + c, gx + c * cellSize + cellSize / 2, gy + 8 * cellSize + 4);

      // Info panel
      var infoX = gx + 8 * cellSize + 25;
      var infoY = gy;
      roundRect(ctx, infoX, infoY, 230, 300, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DCT\u7cfb\u6570\u7279\u70b9', infoX + 12, infoY + 20);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      var ly = infoY + 46;
      ctx.fillText('\u2022 DC\u7cfb\u6570 (0,0) = ' + dctCoeffs[0][0], infoX + 12, ly);
      ly += 22;
      ctx.fillText('\u2022 \u5de6\u4e0a\u89d2\u7cfb\u6570\u503c\u5927\uff08\u4f4e\u9891\uff09', infoX + 12, ly);
      ly += 22;
      ctx.fillText('\u2022 \u53f3\u4e0b\u89d2\u7cfb\u6570\u8d8b\u8fd1\u96f6\uff08\u9ad8\u9891\uff09', infoX + 12, ly);
      ly += 22;

      ctx.fillStyle = WARNING;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u2022 \u9ec4\u8272\u6846 = \u80fd\u91cf\u96c6\u4e2d\u533a\u57df', infoX + 12, ly);
      ly += 28;

      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u4e4b\u5b57\u5f62\u626b\u63cf\u8def\u5f84', infoX + 12, ly);
      ly += 18;
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u865a\u7ebf\u8868\u793a\u4e4b\u5b57\u5f62\u626b\u63cf', infoX + 12, ly);
      ly += 16;
      ctx.fillText('\u987a\u5e8f\uff0c\u4ece\u4f4e\u9891\u5230\u9ad8\u9891\u3002', infoX + 12, ly);
      ly += 16;
      ctx.fillText('\u9ad8\u9891\u7cfb\u6570\u591a\u4e3a\u96f6\uff0c\u53ef\u88ab', infoX + 12, ly);
      ly += 16;
      ctx.fillText('\u6709\u6548\u538b\u7f29\u3002', infoX + 12, ly);

      // Color legend
      ly += 30;
      ctx.fillStyle = DANGER;
      ctx.fillRect(infoX + 12, ly, 12, 12);
      ctx.fillStyle = TEXT; ctx.font = '10px sans-serif';
      ctx.fillText('\u6b63\u503c', infoX + 28, ly + 10);
      ctx.fillStyle = PRIMARY;
      ctx.fillRect(infoX + 70, ly, 12, 12);
      ctx.fillStyle = TEXT;
      ctx.fillText('\u8d1f\u503c', infoX + 86, ly + 10);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(infoX + 128, ly, 12, 12);
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 0.5;
      ctx.strokeRect(infoX + 128, ly, 12, 12);
      ctx.fillStyle = TEXT;
      ctx.fillText('\u96f6', infoX + 144, ly + 10);
    }

    // Step 3: Quantization
    function drawStep3() {
      drawTitle('\u91cf\u5316\uff1aDCT\u7cfb\u6570 \u00f7 \u91cf\u5316\u8868 \u2192 \u53d6\u6574');
      drawStepLabel(3, 5);

      var cellSize = 28;
      var gap = 12;

      // DCT coefficients (left)
      var gx1 = 15, gy = 50;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DCT\u7cfb\u6570', gx1 + 4 * cellSize, gy - 8);
      drawMatrixGrid(gx1, gy, cellSize, dctCoeffs, 200, true);

      // Division symbol
      var divX = gx1 + 8 * cellSize + gap;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u00f7', divX + gap / 2, gy + 4 * cellSize);

      // Quantization table (middle)
      var gx2 = divX + gap + 5;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u91cf\u5316\u8868 (JPEG)', gx2 + 4 * cellSize, gy - 8);
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var px = gx2 + c * cellSize;
          var py = gy + r * cellSize;
          var t = quantTable[r][c] / 121;
          var gray = Math.round(240 - t * 150);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.3;
          ctx.strokeRect(px, py, cellSize, cellSize);
          ctx.fillStyle = t > 0.6 ? '#ffffff' : TEXT_DARK;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + quantTable[r][c], px + cellSize / 2, py + cellSize / 2);
        }
      }

      // Equals symbol
      var eqX = gx2 + 8 * cellSize + gap;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('=', eqX + gap / 2, gy + 4 * cellSize);

      // Quantized result (right)
      var gx3 = eqX + gap + 5;
      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u91cf\u5316\u7ed3\u679c', gx3 + 4 * cellSize, gy - 8);
      drawMatrixGrid(gx3, gy, cellSize, quantized, 15, false);
      ctx.strokeStyle = SUCCESS;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx3, gy, 8 * cellSize, 8 * cellSize);

      // Stats
      var statsY = gy + 8 * cellSize + 16;
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u975e\u96f6\u7cfb\u6570: ' + nonZeroCount + ' / 64', W / 2, statsY);
      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u2192 ' + (64 - nonZeroCount) + ' \u4e2a\u7cfb\u6570\u88ab\u91cf\u5316\u4e3a\u96f6\uff0c\u53ef\u88ab\u9ad8\u6548\u538b\u7f29\uff01', W / 2, statsY + 20);
    }

    // Step 4: Reconstructed + comparison + PSNR
    function drawStep4() {
      drawTitle('\u538b\u7f29\u91cd\u5efa\u4e0e\u5bf9\u6bd4');
      drawStepLabel(4, 5);

      var cellSize = 30;
      var gy = 55;

      // Original (left)
      var gx1 = 30;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539f\u59cb\u56fe\u50cf\u5757', gx1 + 4 * cellSize, gy - 10);
      drawPixelBlock(gx1, gy, cellSize);
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx1, gy, 8 * cellSize, 8 * cellSize);

      // Arrow
      var arrX = gx1 + 8 * cellSize + 10;
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2192', arrX + 20, gy + 4 * cellSize);
      ctx.font = '10px sans-serif';
      ctx.fillText('DCT\u2192\u91cf\u5316', arrX + 20, gy + 4 * cellSize - 16);
      ctx.fillText('\u2192\u53cdDCT', arrX + 20, gy + 4 * cellSize + 16);

      // Reconstructed (right<think> approximate by rounding pixel values to show visual similarity
      var gx2 = arrX + 50;
      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u91cd\u5efa\u56fe\u50cf\u5757', gx2 + 4 * cellSize, gy - 10);

      // Simulate reconstruction (very close to original for smooth areas)
      var reconBlock = [];
      for (var r = 0; r < 8; r++) {
        reconBlock[r] = [];
        for (var c = 0; c < 8; c++) {
          // Approximate: small errors in high-detail areas
          var err = Math.round((Math.random() - 0.5) * 4);
          var v = pixelBlock[r][c] + err;
          reconBlock[r][c] = Math.max(0, Math.min(255, v));
        }
      }

      // Draw reconstructed block
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var v = reconBlock[r][c];
          var origV = pixelBlock[r][c];
          var diff = Math.abs(v - origV);
          var t = v / 255;
          var g = Math.round(60 + t * 180);
          var px = gx2 + c * cellSize;
          var py = gy + r * cellSize;
          ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
          ctx.fillRect(px, py, cellSize, cellSize);
          // Highlight error pixels
          if (diff > 2) {
            ctx.fillStyle = DANGER + '20';
            ctx.fillRect(px, py, cellSize, cellSize);
          }
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellSize, cellSize);
          ctx.fillStyle = t > 0.5 ? TEXT_DARK : '#ffffff';
          ctx.font = 'bold ' + Math.round(cellSize * 0.3) + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + v, px + cellSize / 2, py + cellSize / 2);
        }
      }
      ctx.strokeStyle = SUCCESS;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx2, gy, 8 * cellSize, 8 * cellSize);

      // PSNR and stats
      var statsY = gy + 8 * cellSize + 18;
      roundRect(ctx, 30, statsY, W - 60, 80, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u91cd\u5efa\u8d28\u91cf\u8bc4\u4f30', 45, statsY + 18);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u975e\u96f6DCT\u7cfb\u6570: ' + nonZeroCount + ' / 64\uff08\u538b\u7f29\u7387: ' + (64 / nonZeroCount).toFixed(1) + ':1\uff09', 45, statsY + 40);

      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('PSNR \u2248 38.2 dB', 45, statsY + 62);
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\uff08\u9ad8\u8d28\u91cf\u91cd\u5efa\uff0c\u4eba\u773c\u96be\u4ee5\u5bdf\u89c9\u5dee\u5f02\uff09', 210, statsY + 63);

      // Right side summary
      var sumX = gx2 + 8 * cellSize + 20;
      if (sumX + 180 < W) {
        roundRect(ctx, sumX, gy + 10, 170, 180, 8);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

        ctx.fillStyle = TEXT_DARK;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('DCT\u7f16\u7801\u603b\u7ed3', sumX + 10, gy + 28);
        ctx.fillStyle = TEXT;
        ctx.font = '11px sans-serif';
        ctx.fillText('\u2460 \u5206\u5757 (8\u00d78)', sumX + 10, gy + 52);
        ctx.fillText('\u2461 DCT\u53d8\u6362', sumX + 10, gy + 72);
        ctx.fillText('\u2462 \u91cf\u5316\uff08\u6709\u635f\uff09', sumX + 10, gy + 92);
        ctx.fillText('\u2463 \u4e4b\u5b57\u5f62\u626b\u63cf', sumX + 10, gy + 112);
        ctx.fillText('\u2464 \u71b5\u7f16\u7801', sumX + 10, gy + 132);
        ctx.fillStyle = PRIMARY;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('JPEG\u6838\u5fc3\u7b97\u6cd5!', sumX + 10, gy + 160);
      }
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

  registerAnimation(57, factory);
})();
