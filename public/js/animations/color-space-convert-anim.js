(function () {
  // ========== Color Palette ==========
  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981', RED = '#ef4444',
    AMBER = '#f59e0b', GRAY_BG = '#f9fafb', GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>步骤 1/6 — 原始颜色样本：</b>显示一个橙色像素 <code>RGB(255, 165, 0)</code>，作为颜色空间转换的输入。',
    '<b>步骤 2/6 — RGB → HSV 转换：</b>逐步计算色相 H、饱和度 S、明度 V。公式: <code>V = max(R,G,B)/255</code>, <code>S = (max-min)/max</code>, <code>H</code> 由主分量决定。',
    '<b>步骤 3/6 — RGB → YCbCr 转换：</b>应用公式 <code>Y = 0.299R + 0.587G + 0.114B</code>、<code>Cb = 0.564(B-Y) + 128</code>、<code>Cr = 0.713(R-Y) + 128</code>。',
    '<b>步骤 4/6 — HSV → RGB 回转换：</b>从 HSV 值反算回 RGB，验证往返转换的一致性。',
    '<b>步骤 5/6 — 多空间渐变对比：</b>同一段渐变在 RGB、HSV、YCbCr 空间中的可视化对比。',
    '<b>步骤 6/6 — 实际应用：</b>HSV 用于肤色检测（色相范围筛选），YCbCr 用于 JPEG 压缩（亮度/色度分离）。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width, H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function roundRect(x, y, w, h, r, fill, stroke) {
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
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }

    // HSL to RGB helper
    function hslToRgb(h, s, l) {
      h = h / 360;
      var r, g, b;
      if (s === 0) { r = g = b = l; }
      else {
        var hue2rgb = function (p, q, t) {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        var q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p2 = 2 * l - q2;
        r = hue2rgb(p2, q2, h + 1 / 3);
        g = hue2rgb(p2, q2, h);
        b = hue2rgb(p2, q2, h - 1 / 3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    // ========== Step 0: Color Sample ==========
    function drawStep0() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始颜色样本', W / 2, 28);

      // Large color swatch
      var swX = 200, swY = 60, swW = 300, swH = 180;
      ctx.fillStyle = 'rgb(255, 165, 0)';
      ctx.fillRect(swX, swY, swW, swH);
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(swX, swY, swW, swH);

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('橙色', swX + swW / 2, swY + swH / 2 - 10);
      ctx.font = '18px monospace';
      ctx.fillText('RGB(255, 165, 0)', swX + swW / 2, swY + swH / 2 + 20);

      // RGB component boxes
      var boxY = 280, boxH = 55, boxW = 150, gap = 30;
      var startX = 85;
      var comps = [
        { label: 'R', val: 255, color: 'rgb(255, 0, 0)', bg: '#fef2f2' },
        { label: 'G', val: 165, color: 'rgb(0, 180, 0)', bg: '#f0fdf4' },
        { label: 'B', val: 0, color: 'rgb(0, 0, 255)', bg: '#eff6ff' }
      ];
      for (var i = 0; i < 3; i++) {
        var bx = startX + i * (boxW + gap);
        roundRect(bx, boxY, boxW, boxH, 8, comps[i].bg, comps[i].color);
        ctx.fillStyle = comps[i].color;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(comps[i].label, bx + 30, boxY + 35);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 22px monospace';
        ctx.fillText(comps[i].val.toString(), bx + 100, boxY + 36);
      }

      // Bottom info
      ctx.fillStyle = '#eef2ff';
      roundRect(50, 355, 600, 35, 8, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('该像素颜色将作为后续颜色空间转换的输入样本', W / 2, 377);
    }

    // ========== Step 1: RGB → HSV ==========
    function drawStep1() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RGB → HSV 转换过程', W / 2, 28);

      var R = 255, G = 165, B = 0;
      var rN = R / 255, gN = G / 255, bN = B / 255;
      var maxC = Math.max(rN, gN, bN);
      var minC = Math.min(rN, gN, bN);
      var delta = maxC - minC;
      var hVal, sVal, vVal;

      vVal = maxC;
      sVal = maxC === 0 ? 0 : delta / maxC;
      if (delta === 0) { hVal = 0; }
      else if (maxC === rN) { hVal = 60 * (((gN - bN) / delta) % 6); }
      else if (maxC === gN) { hVal = 60 * (((bN - rN) / delta) + 2); }
      else { hVal = 60 * (((rN - gN) / delta) + 4); }
      if (hVal < 0) hVal += 360;

      // Step-by-step formulas
      var lx = 40, ly = 50;

      // Input
      roundRect(lx, ly, 620, 40, 6, '#fff', GRAY_BORDER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('输入: RGB(' + R + ', ' + G + ', ' + B + ')  →  归一化: (' + rN.toFixed(2) + ', ' + gN.toFixed(2) + ', ' + bN.toFixed(2) + ')', lx + 15, ly + 25);

      // Step A: Find max and min
      ly = 105;
      roundRect(lx, ly, 620, 38, 6, '#fef2f2', RED);
      ctx.fillStyle = RED;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('① 求最大值与最小值:', lx + 10, ly + 15);
      ctx.font = '13px monospace';
      ctx.fillText('max = ' + maxC.toFixed(3) + '  (R 通道),  min = ' + minC.toFixed(3) + '  (B 通道),  Δ = max - min = ' + delta.toFixed(3), lx + 10, ly + 32);

      // Step B: Compute V
      ly = 155;
      roundRect(lx, ly, 620, 38, 6, '#f0fdf4', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('② 计算 V (明度):', lx + 10, ly + 15);
      ctx.font = '13px monospace';
      ctx.fillText('V = max = ' + maxC.toFixed(3) + ' = ' + (vVal * 100).toFixed(1) + '%', lx + 10, ly + 32);

      // Step C: Compute S
      ly = 205;
      roundRect(lx, ly, 620, 38, 6, '#fef3c7', AMBER);
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('③ 计算 S (饱和度):', lx + 10, ly + 15);
      ctx.font = '13px monospace';
      ctx.fillText('S = Δ / max = ' + delta.toFixed(3) + ' / ' + maxC.toFixed(3) + ' = ' + sVal.toFixed(3) + ' = ' + (sVal * 100).toFixed(1) + '%', lx + 10, ly + 32);

      // Step D: Compute H
      ly = 255;
      roundRect(lx, ly, 620, 50, 6, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('④ 计算 H (色相):', lx + 10, ly + 15);
      ctx.font = '13px monospace';
      ctx.fillText('max 是 R, 所以 H = 60° × ((G - B) / Δ) mod 6', lx + 10, ly + 32);
      ctx.fillText('= 60° × ((' + gN.toFixed(3) + ' - ' + bN.toFixed(3) + ') / ' + delta.toFixed(3) + ') = 60° × ' + ((gN - bN) / delta).toFixed(3) + ' = ' + hVal.toFixed(1) + '°', lx + 10, ly + 47);

      // Result
      ly = 320;
      roundRect(lx, ly, 620, 60, 8, '#ecfdf5', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('结果: HSV(' + hVal.toFixed(1) + '°, ' + (sVal * 100).toFixed(1) + '%, ' + (vVal * 100).toFixed(1) + '%)', lx + 15, ly + 25);

      // Visual result swatch
      ctx.fillStyle = 'rgb(255, 165, 0)';
      ctx.fillRect(lx + 500, ly + 8, 40, 40);
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(lx + 500, ly + 8, 40, 40);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('验证一致', lx + 548, ly + 35);
    }

    // ========== Step 2: RGB → YCbCr ==========
    function drawStep2() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RGB → YCbCr 转换', W / 2, 28);

      var R = 255, G = 165, B = 0;
      var Y = 0.299 * R + 0.587 * G + 0.114 * B;
      var Cb = 0.564 * (B - Y) + 128;
      var Cr = 0.713 * (R - Y) + 128;

      var lx = 40, ly = 55;

      // Formulas
      roundRect(lx, ly, 620, 110, 8, '#fff', GRAY_BORDER);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('YCbCr 转换公式:', lx + 15, ly + 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '14px monospace';
      ctx.fillText('Y  =  0.299 × R  + 0.587 × G  + 0.114 × B', lx + 15, ly + 48);
      ctx.fillText('Cb =  0.564 × (B - Y) + 128', lx + 15, ly + 70);
      ctx.fillText('Cr =  0.713 × (R - Y) + 128', lx + 15, ly + 92);

      // Computation
      ly = 180;
      roundRect(lx, ly, 620, 90, 8, '#f0fdf4', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('代入计算:', lx + 15, ly + 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '14px monospace';
      ctx.fillText('Y  = 0.299 × 255 + 0.587 × 165 + 0.114 × 0 = ' + (0.299 * 255).toFixed(1) + ' + ' + (0.587 * 165).toFixed(1) + ' + 0 = ' + Y.toFixed(1), lx + 15, ly + 45);
      ctx.fillText('Cb = 0.564 × (0 - ' + Y.toFixed(1) + ') + 128 = ' + Cb.toFixed(1), lx + 15, ly + 67);
      ctx.fillText('Cr = 0.713 × (255 - ' + Y.toFixed(1) + ') + 128 = ' + Cr.toFixed(1), lx + 15, ly + 89);

      // Result visualization
      ly = 290;
      var boxW = 180, boxH = 80, gap = 20, startX = 50;
      var ycbcr = [
        { label: 'Y (亮度)', val: Y.toFixed(1), bg: 'rgb(' + Math.round(Y) + ',' + Math.round(Y) + ',' + Math.round(Y) + ')' },
        { label: 'Cb (蓝色差)', val: Cb.toFixed(1), bg: 'rgb(' + Math.round(Math.max(0, Math.min(255, 128 + Cb - 128))) + ',' + Math.round(Math.max(0, Math.min(255, 128))) + ',' + Math.round(Math.max(0, Math.min(255, 255))) + ')' },
        { label: 'Cr (红色差)', val: Cr.toFixed(1), bg: 'rgb(255,' + Math.round(Math.max(0, Math.min(255, 128))) + ',' + Math.round(Math.max(0, Math.min(255, 128 + Cr - 128))) + ')' }
      ];
      for (var i = 0; i < 3; i++) {
        var bx = startX + i * (boxW + gap);
        roundRect(bx, ly, boxW, boxH, 8, ycbcr[i].bg, GRAY_BORDER);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ycbcr[i].label, bx + boxW / 2, ly + 25);
        ctx.font = 'bold 22px monospace';
        ctx.fillText(ycbcr[i].val, bx + boxW / 2, ly + 58);
      }

      // Note
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YCbCr 将亮度与色度分离，便于对 Cb/Cr 进行压缩编码', W / 2, 393);
    }

    // ========== Step 3: HSV → RGB Roundtrip ==========
    function drawStep3() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HSV → RGB 回转换验证', W / 2, 28);

      var hHSV = 38.8, sHSV = 1.0, vHSV = 1.0;

      // HSV input
      var lx = 40, ly = 55;
      roundRect(lx, ly, 620, 40, 6, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('输入: HSV(' + hHSV.toFixed(1) + '°, ' + (sHSV * 100).toFixed(0) + '%, ' + (vHSV * 100).toFixed(0) + '%)', lx + 15, ly + 25);

      // Conversion steps
      ly = 110;
      var C = vHSV * sHSV;
      var X = C * (1 - Math.abs((hHSV / 60) % 2 - 1));
      var m = vHSV - C;
      var r1, g1, b1;
      if (hHSV < 60) { r1 = C; g1 = X; b1 = 0; }
      else if (hHSV < 120) { r1 = X; g1 = C; b1 = 0; }
      else if (hHSV < 180) { r1 = 0; g1 = C; b1 = X; }
      else if (hHSV < 240) { r1 = 0; g1 = X; b1 = C; }
      else if (hHSV < 300) { r1 = X; g1 = 0; b1 = C; }
      else { r1 = C; g1 = 0; b1 = X; }

      var rOut = Math.round((r1 + m) * 255);
      var gOut = Math.round((g1 + m) * 255);
      var bOut = Math.round((b1 + m) * 255);

      roundRect(lx, ly, 620, 120, 8, '#fff', GRAY_BORDER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('回转换步骤:', lx + 15, ly + 22);
      ctx.font = '13px monospace';
      ctx.fillText('① C = V × S = ' + vHSV.toFixed(2) + ' × ' + sHSV.toFixed(2) + ' = ' + C.toFixed(3), lx + 15, ly + 45);
      ctx.fillText('② X = C × (1 - |H/60 mod 2 - 1|) = ' + C.toFixed(3) + ' × (1 - |' + ((hHSV / 60) % 2).toFixed(3) + ' - 1|) = ' + X.toFixed(3), lx + 15, ly + 65);
      ctx.fillText('③ m = V - C = ' + m.toFixed(3), lx + 15, ly + 85);
      ctx.fillText('④ H 在 [0°,60°) 区间 → (R\',G\',B\') = (C, X, 0) = (' + r1.toFixed(3) + ', ' + g1.toFixed(3) + ', ' + b1.toFixed(3) + ')', lx + 15, ly + 105);

      // Final result
      ly = 245;
      roundRect(lx, ly, 620, 55, 8, '#ecfdf5', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('R = (R\' + m) × 255 = (' + r1.toFixed(3) + ' + ' + m.toFixed(3) + ') × 255 = ' + rOut, lx + 15, ly + 22);
      ctx.fillText('G = (G\' + m) × 255 = ' + gOut + '    B = (B\' + m) × 255 = ' + bOut, lx + 15, ly + 42);

      // Verification
      ly = 315;
      roundRect(lx, ly, 620, 65, 8, '#fef3c7', AMBER);
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('往返验证:', lx + 15, ly + 22);

      // Original swatch
      ctx.fillStyle = 'rgb(255, 165, 0)';
      ctx.fillRect(lx + 180, ly + 10, 50, 40);
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1; ctx.strokeRect(lx + 180, ly + 10, 50, 40);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('原始', lx + 195, ly + 62);

      // Arrow
      ctx.font = '24px sans-serif';
      ctx.fillText('→', lx + 245, ly + 38);

      // Converted swatch
      ctx.fillStyle = 'rgb(' + rOut + ',' + gOut + ',' + bOut + ')';
      ctx.fillRect(lx + 280, ly + 10, 50, 40);
      ctx.strokeStyle = TEXT_COLOR; ctx.strokeRect(lx + 280, ly + 10, 50, 40);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('回转换', lx + 295, ly + 62);

      // Result text
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('RGB(' + rOut + ',' + gOut + ',' + bOut + ')', lx + 350, ly + 30);
      ctx.fillText(rOut === 255 && gOut === 165 && bOut === 0 ? '✓ 完全一致!' : '≈ 近似一致 (浮点精度)', lx + 350, ly + 50);
    }

    // ========== Step 4: Gradient Strip Comparison ==========
    function drawStep4() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('多颜色空间渐变对比', W / 2, 28);

      var stripX = 60, stripW = 580, stripH = 30;
      var steps = 58;
      var cellW = stripW / steps;

      // RGB gradient: hue sweep
      var ly = 65;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RGB 空间 — 色相渐变:', stripX, ly);
      for (var i = 0; i < steps; i++) {
        var hue = (i / steps) * 360;
        var rgb = hslToRgb(hue, 1, 0.5);
        ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
        ctx.fillRect(stripX + i * cellW, ly + 8, cellW + 1, stripH);
      }
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1;
      ctx.strokeRect(stripX, ly + 8, stripW, stripH);

      // HSV representation
      ly = 130;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('HSV 分解 — H 通道:', stripX, ly);
      // H channel bar
      for (var i = 0; i < steps; i++) {
        var hue = (i / steps) * 360;
        ctx.fillStyle = 'rgb(' + Math.round(hue / 360 * 255) + ',' + Math.round(hue / 360 * 255) + ',' + Math.round(hue / 360 * 255) + ')';
        ctx.fillRect(stripX + i * cellW, ly + 8, cellW + 1, stripH / 3);
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(stripX, ly + 8, stripW, stripH / 3);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('H: 0°→360°', stripX + stripW + 5, ly + 18);

      // S channel (constant = 255)
      ctx.fillStyle = '#fff';
      ctx.fillRect(stripX, ly + 8 + stripH / 3, stripW, stripH / 3);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(stripX, ly + 8 + stripH / 3, stripW, stripH / 3);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('S: 恒定 100%', stripX + stripW + 5, ly + 8 + stripH / 3 + 10);

      // V channel (constant = ~128)
      ctx.fillStyle = '#ccc';
      ctx.fillRect(stripX, ly + 8 + 2 * stripH / 3, stripW, stripH / 3);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(stripX, ly + 8 + 2 * stripH / 3, stripW, stripH / 3);
      ctx.fillText('V: 恒定 100%', stripX + stripW + 5, ly + 8 + 2 * stripH / 3 + 10);

      // YCbCr decomposition
      ly = 215;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('YCbCr 分解:', stripX, ly);

      // Y channel
      ctx.fillText('Y (亮度):', stripX, ly + 28);
      for (var i = 0; i < steps; i++) {
        var hue = (i / steps) * 360;
        var rgb = hslToRgb(hue, 1, 0.5);
        var yVal = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        ctx.fillStyle = 'rgb(' + Math.round(yVal) + ',' + Math.round(yVal) + ',' + Math.round(yVal) + ')';
        ctx.fillRect(stripX + i * cellW, ly + 33, cellW + 1, 14);
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(stripX, ly + 33, stripW, 14);

      // Cb channel
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('Cb (蓝色差):', stripX, ly + 65);
      for (var i = 0; i < steps; i++) {
        var hue = (i / steps) * 360;
        var rgb = hslToRgb(hue, 1, 0.5);
        var yVal = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        var cb = 0.564 * (rgb[2] - yVal) + 128;
        cb = Math.max(0, Math.min(255, cb));
        ctx.fillStyle = 'rgb(0, 0, ' + Math.round(cb) + ')';
        ctx.fillRect(stripX + i * cellW, ly + 70, cellW + 1, 14);
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(stripX, ly + 70, stripW, 14);

      // Cr channel
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('Cr (红色差):', stripX, ly + 102);
      for (var i = 0; i < steps; i++) {
        var hue = (i / steps) * 360;
        var rgb = hslToRgb(hue, 1, 0.5);
        var yVal = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        var cr = 0.713 * (rgb[0] - yVal) + 128;
        cr = Math.max(0, Math.min(255, cr));
        ctx.fillStyle = 'rgb(' + Math.round(cr) + ', 0, 0)';
        ctx.fillRect(stripX + i * cellW, ly + 107, cellW + 1, 14);
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(stripX, ly + 107, stripW, 14);

      // Summary
      ctx.fillStyle = '#eef2ff';
      roundRect(50, 358, 600, 35, 8, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('同一渐变在不同空间中展现的信息维度不同，YCbCr 分离亮度和色度有利于压缩', W / 2, 380);
    }

    // ========== Step 5: Applications ==========
    function drawStep5() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('颜色空间转换的实际应用', W / 2, 28);

      // Application 1: Skin detection with HSV
      var lx = 30, ly = 55;
      roundRect(lx, ly, 310, 160, 10, '#f0fdf4', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('应用一: HSV 肤色检测', lx + 15, ly + 22);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('肤色在 HSV 空间有明确的范围:', lx + 15, ly + 45);
      ctx.font = 'bold 13px monospace';
      ctx.fillText('H: 0°–50° (红到黄)', lx + 15, ly + 68);
      ctx.fillText('S: 20%–80% (适度饱和)', lx + 15, ly + 88);
      ctx.fillText('V: 40%–100% (足够亮度)', lx + 15, ly + 108);

      // Mini demo: show a face-like region
      ctx.fillStyle = '#f5d0a9';
      ctx.beginPath();
      ctx.arc(lx + 260, ly + 100, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.font = '10px sans-serif';
      ctx.fillText('检测区', lx + 244, ly + 145);

      // Application 2: JPEG with YCbCr
      ly = 230;
      roundRect(lx, ly, 310, 155, 10, '#eff6ff', '#3b82f6');
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('应用二: JPEG 压缩 (YCbCr)', lx + 15, ly + 22);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('RGB → YCbCr 后对色度下采样:', lx + 15, ly + 45);
      ctx.fillText('• Y 通道: 保持全分辨率', lx + 15, ly + 65);
      ctx.fillText('• Cb/Cr: 4:2:0 采样 (分辨率减半)', lx + 15, ly + 85);
      ctx.fillText('• 人眼对亮度变化更敏感', lx + 15, ly + 105);
      ctx.fillText('• 压缩比提升 ~50%, 视觉几乎无差别', lx + 15, ly + 125);

      // Application 3: Color grading
      var rx = 360, ry = 55;
      roundRect(rx, ry, 310, 160, 10, '#fef3c7', AMBER);
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('应用三: 影视调色 (HSV/HSI)', rx + 15, ry + 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('• 色轮调色: 直接修改 H 分量', rx + 15, ry + 45);
      ctx.fillText('• 选择性调色: 限定 H 范围修改', rx + 15, ry + 65);
      ctx.fillText('• 亮度不变: 独立调整 S 和 V', rx + 15, ry + 85);
      ctx.fillText('• 比 RGB 曲线更直观易用', rx + 15, ry + 105);

      // Application 4: Medical imaging
      ry = 230;
      roundRect(rx, ry, 310, 155, 10, '#fdf2f8', '#ec4899');
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('应用四: 医学影像 (Lab)', rx + 15, ry + 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('• Delta E 色差评估: 感知均匀', rx + 15, ry + 45);
      ctx.fillText('• 色彩一致性: 设备无关空间', rx + 15, ry + 65);
      ctx.fillText('• ICC 色彩管理: Lab 作为中间空间', rx + 15, ry + 85);
      ctx.fillText('• 病理组织染色分析', rx + 15, ry + 105);
    }

    return {
      totalSteps: 6,
      draw: function (step, sliderValue) {
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

  registerAnimationBatch([48, 50], factory);
})();
