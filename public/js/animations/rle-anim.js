(function () {
  'use strict';

  var PRIMARY = '#4f46e5', PRIMARY_LIGHT = '#6366f1';
  var SUCCESS = '#10b981', DANGER = '#ef4444', WARNING = '#f59e0b';
  var GRAY_BG = '#f9fafb', GRAY_BORDER = '#e5e7eb';
  var TEXT = '#374151', TEXT_DARK = '#1f2937';

  var stepDescriptions = [
    '\u539f\u59cb\u4e8c\u503c\u56fe\u50cf\uff1a\u5c55\u793a8\u00d78\u50cf\u7d20\u7684\u4e8c\u503c\u56fe\u50cf\uff08\u9ed1=\u0030\uff0c\u767d=\u0031\uff09',
    '\u9010\u884c\u626b\u63cf\uff1a\u4ece\u4e0a\u5230\u4e0b\u3001\u4ece\u5de6\u5230\u53f3\u4f9d\u6b21\u626b\u63cf\u6bcf\u4e00\u884c',
    '\u7f16\u7801\u7b2c\u4e00\u884c\uff1a\u5c06\u8fde\u7eed\u76f8\u540c\u50cf\u7d20\u7f16\u7801\u4e3a (\u884c\u7a0b\u957f\u5ea6, \u503c) \u5bf9',
    '\u7f16\u7801\u5168\u90e8\u884c\uff1a\u5bf9\u6240\u6709\u884c\u8fdb\u884c\u884c\u7a0b\u7f16\u7801',
    '\u538b\u7f29\u5bf9\u6bd4\uff1a\u6bd4\u8f83\u539f\u59cb\u6570\u636e\u4e0eRLE\u7f16\u7801\u540e\u7684\u6570\u636e\u91cf'
  ];

  // 8x8 binary image with clear run patterns
  var image = [
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 1, 1]
  ];

  // Compute RLE for each row
  function computeRLE(row) {
    var runs = [];
    var cur = row[0], count = 1;
    for (var i = 1; i < row.length; i++) {
      if (row[i] === cur) { count++; }
      else { runs.push({ count: count, value: cur }); cur = row[i]; count = 1; }
    }
    runs.push({ count: count, value: cur });
    return runs;
  }

  var allRuns = [];
  var totalPairs = 0;
  for (var r = 0; r < 8; r++) {
    var runs = computeRLE(image[r]);
    allRuns.push(runs);
    totalPairs += runs.length;
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

  function drawBinaryGrid(x, y, cellSize, highlightRow, highlightCols) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var px = x + c * cellSize;
        var py = y + r * cellSize;
        var val = image[r][c];
        var isHighlighted = highlightRow === r &&
          (!highlightCols || highlightCols.indexOf(c) >= 0);

        if (isHighlighted) {
          ctx.fillStyle = val ? SUCCESS + '40' : DANGER + '40';
        } else {
          ctx.fillStyle = val ? '#e0e7ff' : TEXT_DARK;
        }
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = highlightRow === r ? PRIMARY : GRAY_BORDER;
        ctx.lineWidth = highlightRow === r ? 1.5 : 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);

        if (cellSize >= 24) {
          ctx.fillStyle = val ? PRIMARY : '#ffffff';
          ctx.font = 'bold ' + Math.round(cellSize * 0.35) + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + val, px + cellSize / 2, py + cellSize / 2);
        }
      }
    }
  }

  function drawRunBrackets(x, y, cellSize, rowIdx, runs, color) {
    var bracketY = y + rowIdx * cellSize + cellSize + 4;
    var cx = x;
    for (var i = 0; i < runs.length; i++) {
      var run = runs[i];
      var bw = run.count * cellSize;
      ctx.strokeStyle = color || (run.value ? SUCCESS : DANGER);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, bracketY);
      ctx.lineTo(cx, bracketY + 8);
      ctx.lineTo(cx + bw, bracketY + 8);
      ctx.lineTo(cx + bw, bracketY);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(run.count + (run.value ? 'W' : 'B'), cx + bw / 2, bracketY + 10);
      cx += bw;
    }
  }

  function drawRLEPairsList(x, y, rowIdx) {
    var runs = allRuns[rowIdx];
    ctx.fillStyle = TEXT_DARK;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\u7b2c' + rowIdx + '\u884c RLE:', x, y);

    var px = x;
    var py = y + 20;
    for (var i = 0; i < runs.length; i++) {
      var run = runs[i];
      var pairText = '(' + run.count + ',' + (run.value ? '\u767d' : '\u9ed1') + ')';
      var color = run.value ? SUCCESS : DANGER;

      roundRect(ctx, px, py, 52, 22, 4);
      ctx.fillStyle = color + '20';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pairText, px + 26, py + 11);
      px += 58;
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

    // Step 0: Original binary image
    function drawStep0() {
      drawTitle('\u539f\u59cb\u4e8c\u503c\u56fe\u50cf\uff088\u00d78\uff09');
      drawStepLabel(0, 5);

      var cellSize = 38;
      var gx = Math.round((W - 8 * cellSize) / 2) - 60;
      var gy = 52;

      drawBinaryGrid(gx, gy, cellSize);
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, 8 * cellSize, 8 * cellSize);

      // Row / col labels
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      for (var r = 0; r < 8; r++) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('' + r, gx - 8, gy + r * cellSize + cellSize / 2);
      }
      for (var c = 0; c < 8; c++) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('' + c, gx + c * cellSize + cellSize / 2, gy + 8 * cellSize + 6);
      }

      // Legend
      var lx = gx + 8 * cellSize + 40;
      var ly = gy + 20;
      roundRect(ctx, lx, ly, 180, 120, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u56fe\u4f8b', lx + 12, ly + 18);

      // White pixel legend
      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(lx + 12, ly + 38, 20, 20);
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 0.5;
      ctx.strokeRect(lx + 12, ly + 38, 20, 20);
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u767d\u8272\u50cf\u7d20 (1)', lx + 40, ly + 52);

      // Black pixel legend
      ctx.fillStyle = TEXT_DARK;
      ctx.fillRect(lx + 12, ly + 68, 20, 20);
      ctx.fillStyle = TEXT;
      ctx.fillText('\u9ed1\u8272\u50cf\u7d20 (0)', lx + 40, ly + 82);

      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u603b\u50cf\u7d20\u6570: 64', lx + 12, ly + 104);
    }

    // Step 1: Row-by-row scan
    function drawStep1() {
      drawTitle('\u9010\u884c\u626b\u63cf\u987a\u5e8f');
      drawStepLabel(1, 5);

      var cellSize = 36;
      var gx = 40;
      var gy = 52;

      drawBinaryGrid(gx, gy, cellSize);
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, 8 * cellSize, 8 * cellSize);

      // Scan arrows: horizontal arrows on each row
      ctx.strokeStyle = PRIMARY_LIGHT;
      ctx.lineWidth = 1.5;
      for (var r = 0; r < 8; r++) {
        var ay = gy + r * cellSize + cellSize / 2;
        // Horizontal arrow across the row
        ctx.beginPath();
        ctx.moveTo(gx + 2, ay + cellSize / 2 + 4);
        ctx.lineTo(gx + 8 * cellSize - 2, ay + cellSize / 2 + 4);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(gx + 8 * cellSize - 2, ay + cellSize / 2 + 4);
        ctx.lineTo(gx + 8 * cellSize - 8, ay + cellSize / 2);
        ctx.lineTo(gx + 8 * cellSize - 8, ay + cellSize / 2 + 8);
        ctx.closePath();
        ctx.fillStyle = PRIMARY_LIGHT;
        ctx.fill();
      }

      // Vertical connector arrows between rows (on the right side)
      for (var r = 0; r < 7; r++) {
        var x1 = gx + 8 * cellSize + 12;
        var y1 = gy + r * cellSize + cellSize / 2;
        var y2 = gy + (r + 1) * cellSize + cellSize / 2;
        ctx.strokeStyle = WARNING;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx + 8 * cellSize - 2, y1 + cellSize / 2 + 4);
        ctx.quadraticCurveTo(x1 + 10, (y1 + y2) / 2 + cellSize / 2 + 4, gx + 2, y2 + cellSize / 2 + 4);
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u626b\u63cf\u65b9\u5411: \u2192', gx + 8 * cellSize + 20, gy + 20);
      ctx.fillStyle = WARNING;
      ctx.fillText('\u6362\u884c: \u2193', gx + 8 * cellSize + 20, gy + 42);

      // Explanation
      var expX = gx + 8 * cellSize + 20;
      var expY = gy + 80;
      roundRect(ctx, expX - 5, expY - 5, 200, 170, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u626b\u63cf\u89c4\u5219', expX + 5, expY + 10);
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u2460 \u4ece\u7b2c0\u884c\u5f00\u59cb', expX + 5, expY + 32);
      ctx.fillText('\u2461 \u6bcf\u884c\u4ece\u5de6\u5230\u53f3\u626b\u63cf', expX + 5, expY + 52);
      ctx.fillText('\u2462 \u8bb0\u5f55\u8fde\u7eed\u76f8\u540c\u503c\u7684\u8dd1', expX + 5, expY + 72);
      ctx.fillText('\u2463 \u884c\u672b\u6362\u884c\u7ee7\u7eed', expX + 5, expY + 92);
      ctx.fillText('\u2464 \u76f4\u5230\u6240\u6709\u884c\u5b8c\u6210', expX + 5, expY + 112);

      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('\u201c\u8dd1\u201d = \u8fde\u7eed\u76f8\u540c\u503c\u7684\u5e8f\u5217', expX + 5, expY + 140);
    }

    // Step 2: Encode first row
    function drawStep2() {
      drawTitle('\u7f16\u7801\u7b2c\u4e00\u884c');
      drawStepLabel(2, 5);

      var cellSize = 42;
      var gx = 40;
      var gy = 55;

      // Draw grid with first row highlighted
      drawBinaryGrid(gx, gy, cellSize, 0);
      ctx.strokeStyle = PRIMARY;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx, gy, 8 * cellSize, cellSize);

      // Run brackets under first row
      drawRunBrackets(gx, gy, cellSize, 0, allRuns[0]);

      // RLE result for row 0
      var rleY = gy + cellSize + 50;
      drawRLEPairsList(gx, rleY, 0);

      // Explanation
      var expY = rleY + 60;
      roundRect(ctx, gx, expY, 600, 120, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u884c\u7a0b\u7f16\u7801\u539f\u7406', gx + 12, expY + 18);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      var row0str = image[0].join(' ');
      ctx.fillText('\u539f\u59cb\u884c: ' + row0str, gx + 12, expY + 42);

      var runs = allRuns[0];
      var desc = '\u8fde\u7eed\u8dd1: ';
      for (var i = 0; i < runs.length; i++) {
        desc += runs[i].count + '\u4e2a' + (runs[i].value ? '\u767d' : '\u9ed1');
        if (i < runs.length - 1) desc += ' + ';
      }
      ctx.fillText(desc, gx + 12, expY + 64);

      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u7ed3\u679c: ' + runs.length + ' \u4e2a RLE \u5bf9\u4ee3\u66ff\u539f\u59cb 8 \u4e2a\u50cf\u7d20', gx + 12, expY + 90);
    }

    // Step 3: Encode all rows
    function drawStep3() {
      drawTitle('\u7f16\u7801\u5168\u90e8\u884c');
      drawStepLabel(3, 5);

      var cellSize = 28;
      var gx = 20;
      var gy = 48;

      // Small grid
      drawBinaryGrid(gx, gy, cellSize);
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx, gy, 8 * cellSize, 8 * cellSize);

      // RLE for all rows on the right
      var rleX = gx + 8 * cellSize + 20;
      var rleY = gy;

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RLE \u7f16\u7801\u7ed3\u679c', rleX, rleY);
      rleY += 18;

      for (var r = 0; r < 8; r++) {
        var runs = allRuns[r];
        // Row label
        ctx.fillStyle = TEXT;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('\u884c' + r + ':', rleX, rleY + 4);

        // Pairs
        var px = rleX + 35;
        for (var i = 0; i < runs.length; i++) {
          var run = runs[i];
          var pairText = '(' + run.count + ',' + (run.value ? 'W' : 'B') + ')';
          var color = run.value ? SUCCESS : DANGER;

          roundRect(ctx, px, rleY - 6, 44, 20, 3);
          ctx.fillStyle = color + '18';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pairText, px + 22, rleY + 4);
          px += 48;
        }

        // Pair count
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('[' + runs.length + '\u5bf9]', px + 4, rleY + 4);

        rleY += 30;
      }

      // Summary
      rleY += 10;
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u603b\u8ba1: ' + totalPairs + ' \u4e2a RLE \u5bf9', rleX, rleY);
    }

    // Step 4: Compression comparison
    function drawStep4() {
      drawTitle('\u538b\u7f29\u5bf9\u6bd4\u5206\u6790');
      drawStepLabel(4, 5);

      var boxW = 280, boxH = 160;
      var boxY = 60;

      // Original data box (left)
      var box1X = 30;
      roundRect(ctx, box1X, boxY, boxW, boxH, 10);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = DANGER; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = DANGER;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539f\u59cb\u6570\u636e', box1X + boxW / 2, boxY + 24);

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('64', box1X + boxW / 2, boxY + 72);
      ctx.font = '14px sans-serif';
      ctx.fillText('\u6bd4\u7279', box1X + boxW / 2, boxY + 95);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('8\u00d78 = 64\u50cf\u7d20 \u00d7 1\u6bd4\u7279/\u50cf\u7d20', box1X + boxW / 2, boxY + 125);
      ctx.fillText('\uff08\u6bcf\u50cf\u7d20\u5b58\u50a8\u5b8c\u6574\u503c\uff09', box1X + boxW / 2, boxY + 143);

      // RLE data box (right)
      var box2X = W - boxW - 30;
      roundRect(ctx, box2X, boxY, boxW, boxH, 10);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = SUCCESS; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RLE \u7f16\u7801', box2X + boxW / 2, boxY + 24);

      // Encoded size: totalPairs pairs * (3 bits count + 1 bit value) = totalPairs * 4
      var rleBits = totalPairs * 4;
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('' + rleBits, box2X + boxW / 2, boxY + 72);
      ctx.font = '14px sans-serif';
      ctx.fillText('\u6bd4\u7279', box2X + boxW / 2, boxY + 95);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText(totalPairs + '\u5bf9 \u00d7 4\u6bd4\u7279/\u5bf9 (3\u4f4d\u8ba1\u6570+1\u4f4d\u503c)', box2X + boxW / 2, boxY + 125);
      ctx.fillText('\uff08\u5b58\u50a8\u8fd0\u884c\u957f\u5ea6\u548c\u503c\uff09', box2X + boxW / 2, boxY + 143);

      // VS in the middle
      ctx.fillStyle = WARNING;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VS', W / 2, boxY + boxH / 2);

      // Ratio bar
      var barY = boxY + boxH + 30;
      var barW = 500;
      var barH = 30;
      var barX = (W - barW) / 2;

      // Original bar
      ctx.fillStyle = DANGER + '30';
      roundRect(ctx, barX, barY, barW, barH, 5);
      ctx.fill();
      ctx.strokeStyle = DANGER; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = DANGER;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539f\u59cb: 64\u6bd4\u7279', barX + barW / 2, barY + barH / 2);

      // RLE bar (proportional)
      var rleBarW = Math.round(barW * rleBits / 64);
      if (rleBarW > barW) rleBarW = barW;
      var rleBarY = barY + barH + 10;
      ctx.fillStyle = rleBits <= 64 ? SUCCESS + '30' : WARNING + '30';
      roundRect(ctx, barX, rleBarY, rleBarW, barH, 5);
      ctx.fill();
      ctx.strokeStyle = rleBits <= 64 ? SUCCESS : WARNING;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = rleBits <= 64 ? SUCCESS : WARNING;
      ctx.fillText('RLE: ' + rleBits + '\u6bd4\u7279', barX + rleBarW / 2, rleBarY + barH / 2);

      // Analysis
      var analysisY = rleBarY + barH + 25;
      roundRect(ctx, 40, analysisY, W - 80, 90, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('\u5206\u6790\u7ed3\u8bba', 55, analysisY + 18);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      if (rleBits > 64) {
        ctx.fillText('\u5bf9\u4e8e\u8fd9\u4e2a\u5c0f\u56fe\u50cf\uff0cRLE\u7f16\u7801\u540e\u6570\u636e\u91cf\u589e\u52a0\u4e86\uff08' + rleBits + ' > 64\uff09\u3002', 55, analysisY + 40);
        ctx.fillText('\u539f\u56e0\uff1a\u56fe\u50cf\u592a\u5c0f\u4e14\u8fd0\u884c\u8f83\u77ed\uff0c\u7f16\u7801\u5f00\u9500\u8d85\u8fc7\u4e86\u538b\u7f29\u6536\u76ca\u3002', 55, analysisY + 58);
        ctx.fillStyle = PRIMARY;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('\u2192 \u5bf9\u4e8e\u5927\u56fe\u50cf\u4e14\u6709\u957f\u8fde\u7eed\u533a\u57df\u65f6\uff0cRLE\u53ef\u5b9e\u73b0\u663e\u8457\u538b\u7f29\uff01', 55, analysisY + 78);
      } else {
        var ratio = (64 / rleBits).toFixed(2);
        ctx.fillText('RLE\u7f16\u7801\u5b9e\u73b0\u4e86 ' + ratio + ':1 \u7684\u538b\u7f29\u6bd4\uff01', 55, analysisY + 40);
        ctx.fillText('\u8fd0\u884c\u8d8a\u957f\u3001\u56fe\u50cf\u8d8a\u5927\uff0c\u538b\u7f29\u6548\u679c\u8d8a\u597d\u3002', 55, analysisY + 60);
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

  registerAnimation(55, factory);
})();
