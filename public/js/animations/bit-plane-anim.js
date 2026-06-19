(function () {
  'use strict';

  var PRIMARY = '#4f46e5', PRIMARY_LIGHT = '#6366f1';
  var SUCCESS = '#10b981', DANGER = '#ef4444', WARNING = '#f59e0b';
  var GRAY_BG = '#f9fafb', GRAY_BORDER = '#e5e7eb';
  var TEXT = '#374151', TEXT_DARK = '#1f2937';

  var stepDescriptions = [
    '\u539f\u59cb\u6570\u636e\uff1a\u5c55\u793a8\u00d78\u7070\u5ea6\u56fe\u50cf\u7684\u50cf\u7d20\u503c\u77e9\u9635 (0-255)',
    '\u4e8c\u8fdb\u5236\u8868\u793a\uff1a\u5c06\u6bcf\u4e2a\u50cf\u7d20\u503c\u8f6c\u6362\u4e3a8\u4f4d\u4e8c\u8fdb\u5236\uff0c\u7a81\u51fa\u663e\u793a\u7279\u5b9a\u4f4d',
    '\u63d0\u53d6\u7b2c7\u4f4d(MSB)\uff1a\u6700\u9ad8\u6709\u6548\u4f4d\u5e73\u9762\uff0c\u5305\u542b\u56fe\u50cf\u4e3b\u8981\u7ed3\u6784\u4fe1\u606f',
    '\u63d0\u53d6\u7b2c4\u4f4d\uff1a\u4e2d\u95f4\u4f4d\u5e73\u9762\uff0c\u5305\u542b\u7ec6\u8282\u4fe1\u606f',
    '\u63d0\u53d6\u7b2c0\u4f4d(LSB)\uff1a\u6700\u4f4e\u6709\u6548\u4f4d\u5e73\u9762\uff0c\u5bf9\u6bd4\u6240\u6709\u4f4d\u5e73\u9762'
  ];

  // 8x8 pixel values (0-255) with meaningful gradient/pattern
  var pixels = [
    [210, 200, 190, 180, 170, 160, 150, 140],
    [200, 190, 180, 170, 160, 150, 140, 130],
    [180, 170, 160, 150, 140, 130, 120, 110],
    [160, 150, 140, 130, 120, 110, 100,  90],
    [140, 130, 120, 110, 100,  90,  80,  70],
    [120, 110, 100,  90,  80,  70,  60,  50],
    [ 80,  70,  60,  50,  40,  30,  20,  10],
    [ 60,  50,  40,  30,  20,  10,   5,   0]
  ];

  function toBin(v) {
    var s = '';
    for (var i = 7; i >= 0; i--) s += ((v >> i) & 1);
    return s;
  }

  function extractBit(v, bit) { return (v >> bit) & 1; }

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

  function drawOriginalGrid(x, y, cellSize) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var v = pixels[r][c];
        var px = x + c * cellSize;
        var py = y + r * cellSize;
        var g = v;
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);
        ctx.fillStyle = v > 128 ? TEXT_DARK : '#ffffff';
        ctx.font = 'bold ' + Math.max(9, Math.round(cellSize * 0.26)) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('' + v, px + cellSize / 2, py + cellSize / 2);
      }
    }
  }

  function drawBitPlane(x, y, cellSize, bit, accentColor) {
    accentColor = accentColor || PRIMARY;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var b = extractBit(pixels[r][c], bit);
        var px = x + c * cellSize;
        var py = y + r * cellSize;
        ctx.fillStyle = b ? accentColor : '#f8fafc';
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = accentColor + '40';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);
        if (cellSize >= 24) {
          ctx.fillStyle = b ? '#ffffff' : '#cbd5e1';
          ctx.font = 'bold ' + Math.round(cellSize * 0.35) + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + b, px + cellSize / 2, py + cellSize / 2);
        }
      }
    }
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 8 * cellSize, 8 * cellSize);
  }

  function drawBinaryGrid(x, y, cellW, cellH, highlightBit, highlightColor) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var bin = toBin(pixels[r][c]);
        var py = y + r * cellH;
        for (var b = 0; b < 8; b++) {
          var px = x + c * cellW + b * (cellW / 8);
          var bitVal = bin[b];
          var bitPos = 7 - b; // bit position: b=0 is MSB (bit 7)
          var isHighlight = (bitPos === highlightBit);

          if (isHighlight) {
            ctx.fillStyle = bitVal === '1' ? highlightColor + 'cc' : highlightColor + '30';
          } else {
            ctx.fillStyle = bitVal === '1' ? '#374151' : '#e5e7eb';
          }
          ctx.fillRect(px, py, cellW / 8, cellH);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.3;
          ctx.strokeRect(px, py, cellW / 8, cellH);

          if (cellH >= 16 && cellW >= 48) {
            ctx.fillStyle = isHighlight ? '#ffffff' : (bitVal === '1' ? '#ffffff' : '#9ca3af');
            if (isHighlight) ctx.fillStyle = bitVal === '1' ? '#ffffff' : highlightColor;
            ctx.font = (isHighlight ? 'bold ' : '') + Math.max(6, Math.round(cellH * 0.5)) + 'px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bitVal, px + cellW / 16, py + cellH / 2);
          }
        }
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

    // Step 0: Original 8x8 grayscale image
    function drawStep0() {
      drawTitle('\u539f\u59cb 8\u00d78 \u7070\u5ea6\u56fe\u50cf\u50cf\u7d20\u503c');
      drawStepLabel(0, 5);

      var cellSize = 36;
      var gx = 30;
      var gy = 50;

      drawOriginalGrid(gx, gy, cellSize);
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
      var infoY = gy + 10;
      roundRect(ctx, infoX, infoY, 210, 220, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u56fe\u50cf\u4fe1\u606f', infoX + 12, infoY + 20);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      var ly = infoY + 46;
      ctx.fillText('\u5c3a\u5bf8: 8 \u00d7 8 \u50cf\u7d20', infoX + 12, ly); ly += 22;
      ctx.fillText('\u603b\u50cf\u7d20\u6570: 64', infoX + 12, ly); ly += 22;
      ctx.fillText('\u6bd4\u7279\u6df1\u5ea6: 8\u4f4d (0-255)', infoX + 12, ly); ly += 22;
      ctx.fillText('\u6bcf\u50cf\u7d20: 8\u4e2a\u4e8c\u8fdb\u5236\u4f4d', infoX + 12, ly); ly += 30;

      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u4f4d\u5e73\u9762\u5207\u7247\u539f\u7406:', infoX + 12, ly); ly += 20;
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u5c06\u6bcf\u4e2a\u50cf\u7d20\u7684\u540c\u4e00\u4f4d', infoX + 12, ly); ly += 18;
      ctx.fillText('\u7ec4\u6210\u4e00\u4e2a\u65b0\u7684\u4e8c\u503c\u56fe\u50cf\u3002', infoX + 12, ly); ly += 18;
      ctx.fillText('\u5171\u6709 8 \u4e2a\u4f4d\u5e73\u9762 (0-7)\u3002', infoX + 12, ly);
    }

    // Step 1: Binary representation
    function drawStep1() {
      drawTitle('\u4e8c\u8fdb\u5236\u8868\u793a\uff1a\u6bcf\u50cf\u7d20\u76848\u4f4d\u4e8c\u8fdb\u5236\u7f16\u7801');
      drawStepLabel(1, 5);

      var cellW = 72, cellH = 26;
      var gx = 25, gy = 48;

      // Bit position labels at top
      ctx.fillStyle = TEXT;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      for (var b = 0; b < 8; b++) {
        var bitPos = 7 - b;
        var bx = gx + b * (cellW / 8) + cellW / 16;
        ctx.fillText('b' + bitPos, bx, gy - 2);
      }

      drawBinaryGrid(gx, gy, cellW, cellH);

      // Outer border
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx, gy, 8 * cellW, 8 * cellH);

      // Row labels
      ctx.fillStyle = TEXT;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (var r = 0; r < 8; r++) {
        ctx.fillText('R' + r, gx - 6, gy + r * cellH + cellH / 2);
      }

      // Example callout for pixel (0,0)
      var callX = gx + 8 * cellW + 20;
      var callY = gy + 10;
      roundRect(ctx, callX, callY, 200, 190, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u793a\u4f8b\uff1a\u50cf\u7d20(0,0) = 210', callX + 10, callY + 18);

      ctx.fillStyle = TEXT;
      ctx.font = '12px monospace';
      ctx.fillText('210 = 11010010\u2082', callX + 10, callY + 44);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = TEXT;
      var by = callY + 68;
      for (var i = 0; i < 8; i++) {
        var bp = 7 - i;
        var bv = extractBit(210, bp);
        ctx.fillStyle = bv ? DANGER : TEXT;
        ctx.fillText('b' + bp + ' = ' + bv, callX + 10 + (i % 2) * 90, by + Math.floor(i / 2) * 20);
      }

      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('\u6bcf\u4e2a\u50cf\u7d20\u90fd\u6709 8 \u4e2a\u4f4d', callX + 10, callY + 150);
      ctx.fillText('\u540c\u4e00\u4f4d\u7ec4\u6210\u4e00\u4e2a\u4f4d\u5e73\u9762', callX + 10, callY + 170);
    }

    // Step 2: Extract bit 7 (MSB)
    function drawStep2() {
      drawTitle('\u63d0\u53d6\u7b2c7\u4f4d (MSB) \u2014 \u6700\u9ad8\u6709\u6548\u4f4d');
      drawStepLabel(2, 5);

      var cellSize1 = 30;
      var cellSize2 = 32;
      var gx1 = 25, gy1 = 50;
      var gx2 = 380, gy2 = 50;

      // Left: original grid
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539f\u59cb\u56fe\u50cf', gx1 + 4 * cellSize1, gy1 - 10);
      drawOriginalGrid(gx1, gy1, cellSize1);

      // Arrow
      ctx.fillStyle = DANGER;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2192', gx1 + 8 * cellSize1 + 20, gy1 + 4 * cellSize1);
      ctx.font = '10px sans-serif';
      ctx.fillText('\u63d0\u53d6 b7', gx1 + 8 * cellSize1 + 20, gy1 + 4 * cellSize1 - 18);

      // Right: bit 7 plane
      ctx.fillStyle = DANGER;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u7b2c7\u4f4d\u5e73\u9762 (MSB)', gx2 + 4 * cellSize2, gy2 - 10);
      drawBitPlane(gx2, gy2, cellSize2, 7, DANGER);

      // Explanation
      var expY = gy1 + 8 * cellSize1 + 18;
      roundRect(ctx, 20, expY, W - 40, 85, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MSB (\u6700\u9ad8\u6709\u6548\u4f4d) \u7279\u70b9:', 35, expY + 18);
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u2022 \u5305\u542b\u56fe\u50cf\u7684\u4e3b\u8981\u7ed3\u6784\u4fe1\u606f\uff08\u4eae\u6697\u5206\u5e03\uff09', 35, expY + 40);
      ctx.fillText('\u2022 \u5355\u72ec\u5373\u53ef\u8fd1\u4f3c\u91cd\u5efa\u539f\u56fe\u7684\u4e3b\u8981\u8f6e\u5ed3\uff0c\u662f\u6700\u91cd\u8981\u7684\u4f4d\u5e73\u9762', 35, expY + 60);
    }

    // Step 3: Extract bit 4
    function drawStep3() {
      drawTitle('\u63d0\u53d6\u7b2c4\u4f4d \u2014 \u4e2d\u95f4\u4f4d\u5e73\u9762');
      drawStepLabel(3, 5);

      var cellSize1 = 30;
      var cellSize2 = 32;
      var gx1 = 25, gy1 = 50;
      var gx2 = 380, gy2 = 50;

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539f\u59cb\u56fe\u50cf', gx1 + 4 * cellSize1, gy1 - 10);
      drawOriginalGrid(gx1, gy1, cellSize1);

      ctx.fillStyle = WARNING;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2192', gx1 + 8 * cellSize1 + 20, gy1 + 4 * cellSize1);
      ctx.font = '10px sans-serif';
      ctx.fillText('\u63d0\u53d6 b4', gx1 + 8 * cellSize1 + 20, gy1 + 4 * cellSize1 - 18);

      ctx.fillStyle = WARNING;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u7b2c4\u4f4d\u5e73\u9762', gx2 + 4 * cellSize2, gy2 - 10);
      drawBitPlane(gx2, gy2, cellSize2, 4, WARNING);

      var expY = gy1 + 8 * cellSize1 + 18;
      roundRect(ctx, 20, expY, W - 40, 85, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u4e2d\u95f4\u4f4d\u5e73\u9762\u7279\u70b9:', 35, expY + 18);
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u2022 \u5305\u542b\u56fe\u50cf\u7684\u7ec6\u8282\u4fe1\u606f\uff0c\u6a21\u5f0f\u53d8\u5f97\u66f4\u590d\u6742', 35, expY + 40);
      ctx.fillText('\u2022 \u4e2d\u95f4\u4f4d\u5bf9\u56fe\u50cf\u7684\u89c6\u89c9\u8d28\u91cf\u6709\u91cd\u8981\u8d21\u732e\uff0c\u4f46\u4e0d\u5982MSB\u663e\u8457', 35, expY + 60);
    }

    // Step 4: Extract bit 0 (LSB) + compare all planes
    function drawStep4() {
      drawTitle('\u63d0\u53d6\u7b2c0\u4f4d (LSB) \u53ca\u4f4d\u5e73\u9762\u5bf9\u6bd4');
      drawStepLabel(4, 5);

      // Left: original
      var cellSize1 = 28;
      var gx1 = 15, gy1 = 50;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539f\u59cb', gx1 + 4 * cellSize1, gy1 - 8);
      drawOriginalGrid(gx1, gy1, cellSize1);

      // Right: 3 bit planes side by side
      var bpCellSize = 24;
      var bpGap = 10;
      var bpStartX = gx1 + 8 * cellSize1 + 20;
      var bpY = gy1;

      var bitInfo = [
        { bit: 7, color: DANGER, label: 'b7(MSB)' },
        { bit: 4, color: WARNING, label: 'b4' },
        { bit: 0, color: PRIMARY, label: 'b0(LSB)' }
      ];

      for (var bi = 0; bi < 3; bi++) {
        var info = bitInfo[bi];
        var bx = bpStartX + bi * (8 * bpCellSize + bpGap);

        ctx.fillStyle = info.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(info.label, bx + 4 * bpCellSize, bpY - 8);

        drawBitPlane(bx, bpY, bpCellSize, info.bit, info.color);
      }

      // Explanation box
      var expY = bpY + 8 * bpCellSize + 18;
      roundRect(ctx, 15, expY, W - 30, 100, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u4f4d\u5e73\u9762\u5bf9\u6bd4\u5206\u6790:', 30, expY + 18);

      ctx.font = '11px sans-serif';
      var ly = expY + 38;
      ctx.fillStyle = DANGER;
      ctx.fillText('MSB (b7): \u5305\u542b\u56fe\u50cf\u4e3b\u8981\u7ed3\u6784\uff0c\u662f\u6700\u91cd\u8981\u7684\u4f4d', 30, ly);
      ly += 18;
      ctx.fillStyle = WARNING;
      ctx.fillText('\u4e2d\u95f4\u4f4d (b4): \u5305\u542b\u7ec6\u8282\u4fe1\u606f\uff0c\u6a21\u5f0f\u8f83\u590d\u6742', 30, ly);
      ly += 18;
      ctx.fillStyle = PRIMARY;
      ctx.fillText('LSB (b0): \u5305\u542b\u5fae\u5c0f\u53d8\u5316\uff0c\u770b\u8d77\u6765\u50cf\u968f\u673a\u566a\u58f0\uff0c\u5e38\u7528\u4e8e\u9690\u5199\u672f', 30, ly);
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

  registerAnimation(19, factory);
})();
