(function () {
  'use strict';

  var PRIMARY = '#4f46e5', PRIMARY_LIGHT = '#6366f1';
  var SUCCESS = '#10b981', DANGER = '#ef4444', WARNING = '#f59e0b';
  var GRAY_BG = '#f9fafb', GRAY_BORDER = '#e5e7eb';
  var TEXT = '#374151', TEXT_DARK = '#1f2937';

  var stepDescriptions = [
    '\u539f\u59cb\u6570\u636e\uff1a\u5c55\u793a\u56fe\u50cf\u7684\u7070\u5ea6\u7ea7\u53ca\u5176\u51fa\u73b0\u9891\u7387',
    '\u6392\u5e8f\uff1a\u5c06\u7b26\u53f7\u6309\u9891\u7387\u4ece\u5c0f\u5230\u5927\u6392\u5217',
    '\u6784\u5efa\u970d\u592b\u66fc\u6811\uff08\u7b2c\u4e00\u6b65\uff09\uff1a\u5408\u5e76\u9891\u7387\u6700\u5c0f\u7684\u4e24\u4e2a\u8282\u70b9',
    '\u6784\u5efa\u970d\u592b\u66fc\u6811\uff08\u5b8c\u6210\uff09\uff1a\u5b8c\u6574\u7684\u4e8c\u53c9\u6811\u7ed3\u6784',
    '\u5206\u914d\u7f16\u7801\uff1a\u904d\u5386\u6811\uff0c\u5de6\u5206\u652f\u8d4b0\uff0c\u53f3\u5206\u652f\u8d4b1',
    '\u7f16\u7801\u7ed3\u679c\uff1a\u5c55\u793a\u7f16\u7801\u8868\u548c\u538b\u7f29\u7387\u8ba1\u7b97'
  ];

  // Symbol data: a=40, b=20, c=15, d=10, e=7, f=4, g=3, h=1
  var symbols = [
    { name: 'a', freq: 40 },
    { name: 'b', freq: 20 },
    { name: 'c', freq: 15 },
    { name: 'd', freq: 10 },
    { name: 'e', freq: 7 },
    { name: 'f', freq: 4 },
    { name: 'g', freq: 3 },
    { name: 'h', freq: 1 }
  ];

  var sortedAsc = symbols.slice().sort(function (a, b) { return a.freq - b.freq; });

  // Pre-computed Huffman codes
  var codes = {
    a: '0', b: '10', c: '110', d: '1110',
    e: '11110', f: '111110', g: '1111110', h: '1111111'
  };

  // Tree structure (pre-computed)
  // Merge order: (g,h)->n1(4), (f,n1)->n2(7), (e,n2)->n3(14), (d,n3)->n4(24),
  //              (c,n4)->n5(39), (b,n5)->n6(59), (a,n6)->root(100)
  var tree = {
    name: 'root', freq: 100,
    left: { name: 'a', freq: 40, left: null, right: null },
    right: {
      name: 'n6', freq: 60,
      left: { name: 'b', freq: 20, left: null, right: null },
      right: {
        name: 'n5', freq: 40,
        left: { name: 'c', freq: 15, left: null, right: null },
        right: {
          name: 'n4', freq: 25,
          left: { name: 'd', freq: 10, left: null, right: null },
          right: {
            name: 'n3', freq: 15,
            left: { name: 'e', freq: 7, left: null, right: null },
            right: {
              name: 'n2', freq: 8,
              left: { name: 'f', freq: 4, left: null, right: null },
              right: {
                name: 'n1', freq: 4,
                left: { name: 'g', freq: 3, left: null, right: null },
                right: { name: 'h', freq: 1, left: null, right: null }
              }
            }
          }
        }
      }
    }
  };

  // Assign logical x positions (leaf index for leaves, average for internal)
  var leafIdx = 0;
  function assignX(node) {
    if (!node.left && !node.right) { node.lx = leafIdx++; return; }
    assignX(node.left);
    assignX(node.right);
    node.lx = (node.left.lx + node.right.lx) / 2;
  }
  assignX(tree);

  // Node depth
  function setDepth(node, d) {
    node.depth = d;
    if (node.left) setDepth(node.left, d + 1);
    if (node.right) setDepth(node.right, d + 1);
  }
  setDepth(tree, 0);

  // Pixel positions
  var SCALE_X = 75, OFF_X = 45, SCALE_Y = 55, OFF_Y = 55;
  function setPixelPos(node) {
    node.px = Math.round(node.lx * SCALE_X + OFF_X);
    node.py = Math.round(node.depth * SCALE_Y + OFF_Y);
    if (node.left) setPixelPos(node.left);
    if (node.right) setPixelPos(node.right);
  }
  setPixelPos(tree);

  // Average bits per symbol
  var avgBits = 0;
  for (var i = 0; i < symbols.length; i++) {
    avgBits += symbols[i].freq * codes[symbols[i].name].length;
  }
  avgBits /= 100;
  var fixedBits = 3; // ceil(log2(8))
  var savings = ((fixedBits - avgBits) / fixedBits * 100).toFixed(1);

  var symColors = {
    a: '#4f46e5', b: '#6366f1', c: '#8b5cf6', d: '#a855f7',
    e: '#10b981', f: '#14b8a6', g: '#f59e0b', h: '#ef4444'
  };

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

  function drawNodeCircle(x, y, r, fillColor, label, subLabel) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = TEXT_DARK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + (r > 14 ? '11' : '9') + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y - (subLabel ? 4 : 0));
    }
    if (subLabel) {
      ctx.fillStyle = '#ffffffcc';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(subLabel, x, y + 7);
    }
  }

  function drawEdge(parent, child, label) {
    ctx.strokeStyle = TEXT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(parent.px, parent.py);
    ctx.lineTo(child.px, child.py);
    ctx.stroke();
    if (label) {
      var mx = (parent.px + child.px) / 2;
      var my = (parent.py + child.py) / 2;
      var ox = child.px < parent.px ? -10 : 10;
      ctx.fillStyle = label === '0' ? PRIMARY : DANGER;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx + ox, my);
    }
  }

  function drawFullTree(showEdgeLabels) {
    function traverse(node) {
      if (node.left) {
        drawEdge(node, node.left, showEdgeLabels ? '0' : null);
        traverse(node.left);
      }
      if (node.right) {
        drawEdge(node, node.right, showEdgeLabels ? '1' : null);
        traverse(node.right);
      }
    }
    traverse(tree);

    function drawNodes(node) {
      var isLeaf = !node.left && !node.right;
      var r = isLeaf ? 16 : 14;
      var color = isLeaf ? (symColors[node.name] || PRIMARY) : '#9ca3af';
      drawNodeCircle(node.px, node.py, r, color,
        isLeaf ? node.name : '',
        '' + node.freq);

      if (isLeaf) {
        // Symbol name above
        ctx.fillStyle = TEXT_DARK;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(node.name + '(' + node.freq + ')', node.px, node.py - r - 3);
      }
      if (node.left) drawNodes(node.left);
      if (node.right) drawNodes(node.right);
    }
    drawNodes(tree);
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Original data with frequencies
    function drawStep0() {
      drawTitle('\u539f\u59cb\u6570\u636e\uff1a\u7b26\u53f7\u53ca\u5176\u51fa\u73b0\u9891\u7387');
      drawStepLabel(0, 6);

      // Frequency bars
      var barAreaX = 60, barAreaY = 55, barAreaW = 380, barAreaH = 260;
      var maxFreq = 40;
      var barH = 26;
      var barGap = 6;

      for (var i = 0; i < symbols.length; i++) {
        var sym = symbols[i];
        var by = barAreaY + i * (barH + barGap);
        var bw = (sym.freq / maxFreq) * (barAreaW - 80);

        // Symbol label
        ctx.fillStyle = TEXT_DARK;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(sym.name, barAreaX - 10, by + barH / 2);

        // Bar
        roundRect(ctx, barAreaX, by, bw, barH, 4);
        ctx.fillStyle = symColors[sym.name] || PRIMARY;
        ctx.fill();

        // Frequency value
        ctx.fillStyle = TEXT_DARK;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('' + sym.freq, barAreaX + bw + 8, by + barH / 2);
      }

      // Legend
      var legendX = 500, legendY = 65;
      roundRect(ctx, legendX - 10, legendY - 10, 190, 220, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u6570\u636e\u6458\u8981', legendX, legendY);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = TEXT;
      var total = 0;
      for (var i = 0; i < symbols.length; i++) total += symbols[i].freq;
      ctx.fillText('\u7b26\u53f7\u6570\u91cf: ' + symbols.length, legendX, legendY + 30);
      ctx.fillText('\u603b\u9891\u7387: ' + total, legendX, legendY + 52);
      ctx.fillText('\u6700\u5927\u9891\u7387: a = ' + 40, legendX, legendY + 74);
      ctx.fillText('\u6700\u5c0f\u9891\u7387: h = ' + 1, legendX, legendY + 96);

      ctx.fillStyle = PRIMARY;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u970d\u592b\u66fc\u7f16\u7801\u539f\u7406\uff1a', legendX, legendY + 128);
      ctx.fillStyle = TEXT;
      ctx.fillText('\u9891\u7387\u9ad8\u7684\u7b26\u53f7\u2192\u77ed\u7f16\u7801', legendX, legendY + 148);
      ctx.fillText('\u9891\u7387\u4f4e\u7684\u7b26\u53f7\u2192\u957f\u7f16\u7801', legendX, legendY + 168);
    }

    // Step 1: Sort by frequency ascending
    function drawStep1() {
      drawTitle('\u6309\u9891\u7387\u6392\u5e8f\uff08\u4ece\u5c0f\u5230\u5927\uff09');
      drawStepLabel(1, 6);

      var barAreaX = 60, barAreaY = 55;
      var maxFreq = 40;
      var barH = 26;
      var barGap = 6;
      var barAreaW = 380;

      for (var i = 0; i < sortedAsc.length; i++) {
        var sym = sortedAsc[i];
        var by = barAreaY + i * (barH + barGap);
        var bw = (sym.freq / maxFreq) * (barAreaW - 80);

        // Rank number
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('#' + (i + 1), barAreaX - 36, by + barH / 2);

        // Symbol label
        ctx.fillStyle = TEXT_DARK;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(sym.name, barAreaX - 10, by + barH / 2);

        // Bar with gradient
        roundRect(ctx, barAreaX, by, bw, barH, 4);
        ctx.fillStyle = symColors[sym.name] || PRIMARY;
        ctx.fill();

        // Frequency
        ctx.fillStyle = TEXT_DARK;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('' + sym.freq, barAreaX + bw + 8, by + barH / 2);
      }

      // Arrow indicating order
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u2191 \u9891\u7387\u6700\u5c0f\uff08\u4f18\u5148\u5408\u5e76\uff09', barAreaX, barAreaY + 8 * (barH + barGap) + 10);
      ctx.fillText('\u2193 \u9891\u7387\u6700\u5927', barAreaX, barAreaY + 8 * (barH + barGap) + 28);

      // Explanation box
      var legendX = 500, legendY = 65;
      roundRect(ctx, legendX - 10, legendY - 10, 190, 180, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u6392\u5e8f\u8bf4\u660e', legendX, legendY);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u6784\u5efa\u970d\u592b\u66fc\u6811\u7684\u7b2c\u4e00\u6b65\uff1a', legendX, legendY + 28);
      ctx.fillText('\u5c06\u6240\u6709\u7b26\u53f7\u6309\u9891\u7387', legendX, legendY + 50);
      ctx.fillText('\u4ece\u5c0f\u5230\u5927\u6392\u5217\u3002', legendX, legendY + 68);
      ctx.fillStyle = DANGER;
      ctx.fillText('h(1) \u548c g(3) \u9891\u7387\u6700\u5c0f', legendX, legendY + 98);
      ctx.fillText('\u5c06\u9996\u5148\u88ab\u5408\u5e76\u3002', legendX, legendY + 116);
    }

    // Step 2: First merge
    function drawStep2() {
      drawTitle('\u6784\u5efa\u970d\u592b\u66fc\u6811\uff08\u7b2c\u4e00\u6b65\uff09\uff1a\u5408\u5e76 h \u548c g');
      drawStepLabel(2, 6);

      // Show sorted nodes
      var nodeR = 18;
      var startX = 50;
      var nodeY = 100;
      var spacing = 78;

      // Draw all nodes
      for (var i = 0; i < sortedAsc.length; i++) {
        var nx = startX + i * spacing;
        var sym = sortedAsc[i];
        var dimmed = (sym.name === 'h' || sym.name === 'g');
        drawNodeCircle(nx, nodeY, nodeR,
          dimmed ? '#d1d5db' : (symColors[sym.name] || PRIMARY),
          sym.name, '' + sym.freq);
      }

      // Show merge of h and g
      var hIdx = 0, gIdx = 1; // h is first (freq=1), g is second (freq=3)
      var hx = startX + hIdx * spacing;
      var gx = startX + gIdx * spacing;

      // Curved arrows to new node
      var newNodeX = (hx + gx) / 2;
      var newNodeY = 190;

      ctx.strokeStyle = SUCCESS;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      // Arrow from h
      ctx.beginPath();
      ctx.moveTo(hx, nodeY + nodeR);
      ctx.quadraticCurveTo(hx, newNodeY - 20, newNodeX - 5, newNodeY - nodeR);
      ctx.stroke();
      // Arrow from g
      ctx.beginPath();
      ctx.moveTo(gx, nodeY + nodeR);
      ctx.quadraticCurveTo(gx, newNodeY - 20, newNodeX + 5, newNodeY - nodeR);
      ctx.stroke();
      ctx.setLineDash([]);

      // New merged node
      drawNodeCircle(newNodeX, newNodeY, nodeR + 2, SUCCESS, 'n1', '' + 4);

      // Labels on arrows
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0', hx + 12, (nodeY + newNodeY) / 2);
      ctx.fillStyle = DANGER;
      ctx.fillText('1', gx - 12, (nodeY + newNodeY) / 2);

      // Result explanation
      var expY = 260;
      roundRect(ctx, 40, expY - 10, 620, 110, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u5408\u5e76\u7ed3\u679c', 55, expY + 5);

      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u2022 h(\u9891\u7387=1) + g(\u9891\u7387=3) \u2192 \u65b0\u8282\u70b9 n1(\u9891\u7387=4)', 55, expY + 30);
      ctx.fillText('\u2022 \u65b0\u8282\u70b9 n1 \u63d2\u5165\u5269\u4f59\u961f\u5217\uff0c\u91cd\u65b0\u6392\u5e8f\u540e\u7ee7\u7eed\u5408\u5e76', 55, expY + 52);
      ctx.fillText('\u2022 \u4e0b\u4e00\u6b65\uff1a\u5408\u5e76 f(4) \u548c n1(4) \u2192 n2(8)', 55, expY + 74);
    }

    // Step 3: Complete Huffman tree
    function drawStep3() {
      drawTitle('\u6784\u5efa\u970d\u592b\u66fc\u6811\uff08\u5b8c\u6210\uff09');
      drawStepLabel(3, 6);
      drawFullTree(false);

      // Legend
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u5706\u5708\u5185\u6570\u5b57\u4e3a\u9891\u7387\uff0c\u53f6\u5b50\u8282\u70b9\u4e3a\u539f\u59cb\u7b26\u53f7', W / 2, H - 18);
    }

    // Step 4: Assign codes (tree + edge labels + codes at leaves)
    function drawStep4() {
      drawTitle('\u5206\u914d\u7f16\u7801\uff1a\u5de6\u5206\u652f = 0\uff0c\u53f3\u5206\u652f = 1');
      drawStepLabel(4, 6);
      drawFullTree(true);

      // Show codes at leaves
      function showCodes(node) {
        if (!node.left && !node.right) {
          var code = codes[node.name];
          ctx.fillStyle = DANGER;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(code, node.px, node.py + 20);
        }
        if (node.left) showCodes(node.left);
        if (node.right) showCodes(node.right);
      }
      showCodes(tree);
    }

    // Step 5: Results table + compression ratio
    function drawStep5() {
      drawTitle('\u7f16\u7801\u7ed3\u679c\u4e0e\u538b\u7f29\u7387');
      drawStepLabel(5, 6);

      // Table
      var tableX = 30, tableY = 52;
      var colW = [50, 60, 160, 70];
      var rowH = 28;
      var headers = ['\u7b26\u53f7', '\u9891\u7387', '\u970d\u592b\u66fc\u7f16\u7801', '\u7801\u957f'];

      // Header row
      var cx = tableX;
      ctx.fillStyle = PRIMARY;
      roundRect(ctx, tableX, tableY, colW[0] + colW[1] + colW[2] + colW[3], rowH, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textBaseline = 'middle';
      cx = tableX;
      for (var ci = 0; ci < 4; ci++) {
        ctx.textAlign = 'center';
        ctx.fillText(headers[ci], cx + colW[ci] / 2, tableY + rowH / 2);
        cx += colW[ci];
      }

      // Data rows
      for (var i = 0; i < symbols.length; i++) {
        var sym = symbols[i];
        var code = codes[sym.name];
        var ry = tableY + (i + 1) * rowH;
        ctx.fillStyle = i % 2 === 0 ? '#f3f4f6' : '#ffffff';
        ctx.fillRect(tableX, ry, colW[0] + colW[1] + colW[2] + colW[3], rowH);

        cx = tableX;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = symColors[sym.name] || PRIMARY;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(sym.name, cx + colW[0] / 2, ry + rowH / 2);
        cx += colW[0];

        ctx.fillStyle = TEXT;
        ctx.font = '12px sans-serif';
        ctx.fillText('' + sym.freq, cx + colW[1] / 2, ry + rowH / 2);
        cx += colW[1];

        ctx.fillStyle = TEXT_DARK;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(code, cx + colW[2] / 2, ry + rowH / 2);
        cx += colW[2];

        ctx.fillStyle = TEXT;
        ctx.font = '12px sans-serif';
        ctx.fillText('' + code.length, cx + colW[3] / 2, ry + rowH / 2);
      }

      // Table border
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, tableY, colW[0] + colW[1] + colW[2] + colW[3], (symbols.length + 1) * rowH);

      // Compression analysis on the right
      var boxX = 395, boxY = 52;
      roundRect(ctx, boxX, boxY, 285, 310, 8);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u538b\u7f29\u5206\u6790', boxX + 15, boxY + 22);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = TEXT;
      var y = boxY + 50;
      var lineH = 22;
      ctx.fillText('\u56fa\u5b9a\u957f\u5ea6\u7f16\u7801:', boxX + 15, y);
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(fixedBits + ' \u6bd4\u7279/\u7b26\u53f7', boxX + 140, y);

      y += lineH + 4;
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u970d\u592b\u66fc\u5e73\u5747\u7801\u957f:', boxX + 15, y);
      ctx.fillStyle = SUCCESS;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(avgBits.toFixed(2) + ' \u6bd4\u7279/\u7b26\u53f7', boxX + 140, y);

      y += lineH + 10;
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u603b\u6570\u636e\u91cf (100\u7b26\u53f7):', boxX + 15, y);
      y += lineH;
      ctx.fillText('\u56fa\u5b9a\u7f16\u7801: ' + (fixedBits * 100) + ' \u6bd4\u7279', boxX + 25, y);
      y += lineH;
      ctx.fillStyle = SUCCESS;
      ctx.fillText('\u970d\u592b\u66fc: ' + Math.round(avgBits * 100) + ' \u6bd4\u7279', boxX + 25, y);

      y += lineH + 12;
      ctx.fillStyle = PRIMARY;
      roundRect(ctx, boxX + 10, y - 8, 260, 36, 6);
      ctx.fillStyle = PRIMARY + '15';
      ctx.fill();
      ctx.strokeStyle = PRIMARY;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u538b\u7f29\u7387: ' + savings + '%', boxX + 140, y + 10);

      y += 48;
      ctx.fillStyle = TEXT;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u2713 \u970d\u592b\u66fc\u7f16\u7801\u662f\u65e0\u635f\u538b\u7f29\u7b97\u6cd5', boxX + 15, y);
      ctx.fillText('\u2713 \u7f16\u7801\u5177\u6709\u524d\u7f00\u6028\u8d28\uff08\u65e0\u6b67\u4e49\u89e3\u7801\uff09', boxX + 15, y + 18);
    }

    return {
      totalSteps: 6,
      draw: function (step) {
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

  registerAnimation(54, factory);
})();
