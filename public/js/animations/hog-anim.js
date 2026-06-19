(function () {
  'use strict';

  var C = {
    primary: '#4f46e5', primaryL: '#6366f1',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
    grayBg: '#f9fafb', grayBorder: '#e5e7eb',
    text: '#374151', textDark: '#1f2937', white: '#ffffff',
    blue: '#3b82f6'
  };

  // ── 8×8 grayscale patch (edge pattern like part of a silhouette) ──
  var IMG = [
    [180, 175, 160, 140, 100, 70, 55, 50],
    [185, 178, 155, 130, 90, 65, 52, 48],
    [190, 182, 162, 125, 85, 60, 50, 45],
    [195, 188, 165, 120, 80, 58, 48, 42],
    [200, 192, 170, 115, 78, 55, 45, 40],
    [198, 190, 168, 118, 82, 58, 48, 42],
    [195, 185, 160, 120, 85, 60, 50, 45],
    [190, 180, 155, 125, 88, 62, 52, 48]
  ];

  // Compute gradients (simple central differences)
  var magGrid = [], dirGrid = [];
  for (var r = 0; r < 8; r++) {
    magGrid[r] = [];
    dirGrid[r] = [];
    for (var c = 0; c < 8; c++) {
      var left  = c > 0 ? IMG[r][c - 1] : IMG[r][c];
      var right = c < 7 ? IMG[r][c + 1] : IMG[r][c];
      var up    = r > 0 ? IMG[r - 1][c] : IMG[r][c];
      var down  = r < 7 ? IMG[r + 1][c] : IMG[r][c];
      var gx = right - left;
      var gy = down - up;
      var mag = Math.sqrt(gx * gx + gy * gy);
      var dir = Math.atan2(gy, gx);
      // Convert to unsigned gradient (0..180 degrees)
      if (dir < 0) dir += Math.PI;
      if (dir >= Math.PI) dir -= Math.PI;
      magGrid[r][c] = mag;
      dirGrid[r][c] = dir; // in radians, 0..PI
    }
  }

  // Compute 9-bin histogram for the 8×8 cell (unsigned gradients, 0-180°)
  var BINS = 9;
  var binWidth = Math.PI / BINS; // 20 degrees each
  var histogram = new Array(BINS);
  for (var b = 0; b < BINS; b++) histogram[b] = 0;
  for (var r2 = 0; r2 < 8; r2++) {
    for (var c2 = 0; c2 < 8; c2++) {
      var binIdx = Math.floor(dirGrid[r2][c2] / binWidth);
      if (binIdx >= BINS) binIdx = BINS - 1;
      histogram[binIdx] += magGrid[r2][c2];
    }
  }
  var maxBin = Math.max.apply(null, histogram);

  function grayColor(v) {
    var g = Math.round(Math.max(0, Math.min(255, v)));
    return 'rgb(' + g + ',' + g + ',' + g + ')';
  }

  function titleBar(txt) {
    ctx.fillStyle = C.primary;
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 350, 18);
  }

  function label(x, y, txt, color, sz, align) {
    ctx.fillStyle = color || C.textDark;
    ctx.font = (sz || 13) + 'px "Microsoft YaHei", sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
  }

  var stepDescriptions = [
    '原始图像块：8×8灰度图像，模拟行人轮廓的边缘区域',
    '梯度计算：使用中心差分计算每个像素的梯度幅值和方向',
    '方向直方图：将8×8单元的梯度方向统计到9个方向bin中(0°-180°)',
    '块归一化：将2×2个cell组成block，拼接直方图并进行L2归一化',
    'HOG特征向量：汇总所有block的归一化直方图，构成最终特征描述子'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.grayBg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStep0() {
      titleBar('第1步：原始图像块 (8×8)');
      var cs = 38, ox = 100, oy = 55;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = grayColor(IMG[r][c]);
          ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
          // Pixel value
          ctx.fillStyle = IMG[r][c] > 128 ? C.textDark : '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(IMG[r][c], ox + c * cs + cs / 2, oy + r * cs + cs / 2);
        }
      }
      label(ox + cs * 4, oy - 12, '8×8 灰度图像块', C.textDark, 12);

      // Info panel
      var ix = 430, iy = 70;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(ix, iy, 240, 240);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, 240, 240);
      label(ix + 120, iy + 18, 'HOG特征描述子', C.primary, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        'HOG (Histogram of Oriented',
        'Gradients) 特征提取步骤：',
        '',
        '1. 计算梯度幅值和方向',
        '2. 构建方向直方图(9 bins)',
        '3. 块归一化',
        '4. 拼接为特征向量',
        '',
        '应用场景：',
        '  · 行人检测',
        '  · 目标识别',
        '  · 图像分类'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], ix + 10, iy + 40 + i * 16);
      }
    }

    function drawStep1() {
      titleBar('第2步：梯度计算');
      var cs = 34, ox = 40, oy = 50;
      // Original faded
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = grayColor(IMG[r][c]);
          ctx.globalAlpha = 0.3;
          ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        }
      }
      // Gradient arrows
      var maxMag = 0;
      for (var r2 = 0; r2 < 8; r2++)
        for (var c2 = 0; c2 < 8; c2++)
          if (magGrid[r2][c2] > maxMag) maxMag = magGrid[r2][c2];

      for (var r3 = 0; r3 < 8; r3++) {
        for (var c3 = 0; c3 < 8; c3++) {
          var mag = magGrid[r3][c3];
          var dir = dirGrid[r3][c3];
          if (mag < 2) continue;
          var cx = ox + c3 * cs + cs / 2;
          var cy = oy + r3 * cs + cs / 2;
          var len = (mag / maxMag) * (cs / 2 - 3);
          var dx = len * Math.cos(dir);
          var dy = len * Math.sin(dir);
          // Arrow color by direction
          var hue = (dir / Math.PI) * 180;
          ctx.strokeStyle = 'hsl(' + hue + ',70%,50%)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - dx, cy - dy);
          ctx.lineTo(cx + dx, cy + dy);
          ctx.stroke();
          // Arrowhead
          var angle = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(cx + dx, cy + dy);
          ctx.lineTo(cx + dx - 4 * Math.cos(angle - 0.5), cy + dy - 4 * Math.sin(angle - 0.5));
          ctx.lineTo(cx + dx - 4 * Math.cos(angle + 0.5), cy + dy - 4 * Math.sin(angle + 0.5));
          ctx.closePath();
          ctx.fillStyle = 'hsl(' + hue + ',70%,50%)';
          ctx.fill();
        }
      }
      label(ox + cs * 4, oy - 12, '梯度方向 (颜色=方向, 长度=幅值)', C.textDark, 11);

      // Magnitude grid on right
      var ox2 = 370;
      label(ox2 + cs * 4, oy - 12, '梯度幅值', C.textDark, 11);
      for (var r4 = 0; r4 < 8; r4++) {
        for (var c4 = 0; c4 < 8; c4++) {
          var t = magGrid[r4][c4] / (maxMag || 1);
          ctx.fillStyle = 'hsl(240,70%,' + (90 - 60 * t) + '%)';
          ctx.fillRect(ox2 + c4 * cs, oy + r4 * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox2 + c4 * cs, oy + r4 * cs, cs, cs);
          ctx.fillStyle = t > 0.5 ? '#fff' : C.textDark;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(magGrid[r4][c4]), ox2 + c4 * cs + cs / 2, oy + r4 * cs + cs / 2);
        }
      }

      // Color legend for directions
      var ly = oy + cs * 8 + 16;
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('方向色环：', 40, ly);
      for (var i = 0; i < 9; i++) {
        var hue2 = (i * 20 / 180) * 180;
        ctx.fillStyle = 'hsl(' + hue2 + ',70%,50%)';
        ctx.fillRect(110 + i * 30, ly - 7, 26, 14);
        ctx.fillStyle = C.text;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((i * 20) + '°', 110 + i * 30 + 13, ly + 16);
      }
    }

    function drawStep2() {
      titleBar('第3步：方向直方图 (9 bins, 0°~180°)');
      var cs = 34, ox = 40, oy = 50;
      // Small grid on left
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = grayColor(IMG[r][c]);
          ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.3;
          ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        }
      }
      label(ox + cs * 4, oy - 12, '8×8 单元', C.textDark, 11);

      // Arrow
      ctx.fillStyle = C.primary;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 328, oy + cs * 4);

      // Histogram as bar chart
      var hx = 355, hy = 50, hw = 310, hh = 200;
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = C.grayBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(hx, hy, hw, hh);
      label(hx + hw / 2, hy - 12, '9-bin方向直方图', C.primary, 12);

      var barW = hw / BINS - 4;
      for (var b = 0; b < BINS; b++) {
        var barH = maxBin > 0 ? (histogram[b] / maxBin) * (hh - 40) : 0;
        var bx = hx + b * (hw / BINS) + 2;
        var by = hy + hh - 20 - barH;
        // Color by direction
        var hue = (b * 20 / 180) * 180;
        ctx.fillStyle = 'hsl(' + hue + ',65%,55%)';
        ctx.fillRect(bx, by, barW, barH);
        ctx.strokeStyle = 'hsl(' + hue + ',65%,40%)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, barH);
        // Value
        ctx.fillStyle = C.text;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(histogram[b]), bx + barW / 2, by - 6);
        // Label
        ctx.fillText((b * 20) + '°', bx + barW / 2, hy + hh - 8);
      }

      // Sector visualization
      var sx = 430, sy = 285, sr = 55;
      label(sx, sy - sr - 12, '方向扇区图', C.textDark, 11);
      ctx.strokeStyle = C.grayBorder;
      ctx.lineWidth = 0.5;
      for (var b2 = 0; b2 < BINS; b2++) {
        var startAngle = (b2 * 20 - 90) * Math.PI / 180;
        var endAngle = ((b2 + 1) * 20 - 90) * Math.PI / 180;
        var radius = maxBin > 0 ? (histogram[b2] / maxBin) * sr : 0;
        ctx.fillStyle = 'hsl(' + (b2 * 20) + ',65%,55%)';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.arc(sx, sy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Formula
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('unsigned gradient: 方向范围 0°~180° (不分正负)', 50, oy + cs * 8 + 22);
      ctx.fillText('每个像素的梯度幅值累加到对应的方向bin中', 50, oy + cs * 8 + 40);
    }

    function drawStep3() {
      titleBar('第4步：块归一化 (2×2 cell block)');

      // Show 2×2 cell block structure
      var cs = 30, ox = 30, oy = 50;
      // Draw a 16×16 area divided into 4 cells of 8×8
      var cellColors = [C.primary, C.blue, C.success, C.warning];
      var cellLabels = ['Cell(0,0)', 'Cell(0,1)', 'Cell(1,0)', 'Cell(1,1)'];
      for (var br = 0; br < 2; br++) {
        for (var bc = 0; bc < 2; bc++) {
          var bx = ox + bc * 8 * cs;
          var by = oy + br * 8 * cs;
          // Fill cells with light color
          ctx.fillStyle = cellColors[br * 2 + bc];
          ctx.globalAlpha = 0.1;
          ctx.fillRect(bx, by, 8 * cs, 8 * cs);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = cellColors[br * 2 + bc];
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, 8 * cs, 8 * cs);
          label(bx + 4 * cs, by + 4 * cs, cellLabels[br * 2 + bc], cellColors[br * 2 + bc], 11);
        }
      }
      // Grid lines within
      ctx.strokeStyle = C.grayBorder;
      ctx.lineWidth = 0.3;
      for (var i = 0; i <= 16; i++) {
        ctx.beginPath();
        ctx.moveTo(ox + i * cs, oy);
        ctx.lineTo(ox + i * cs, oy + 16 * cs);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox, oy + i * cs);
        ctx.lineTo(ox + 16 * cs, oy + i * cs);
        ctx.stroke();
      }

      label(ox + 8 * cs, oy - 12, '2×2 Cell Block (16×16像素)', C.textDark, 12);

      // Concatenated histogram illustration
      var rx = 530, ry = 55;
      ctx.fillStyle = '#fff';
      ctx.fillRect(rx, ry, 150, 200);
      ctx.strokeStyle = C.grayBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, 150, 200);
      label(rx + 75, ry - 10, '拼接直方图', C.textDark, 11);

      // 4 mini histograms stacked
      var miniH = 36, miniW = 130;
      for (var h = 0; h < 4; h++) {
        var my = ry + 10 + h * (miniH + 10);
        ctx.fillStyle = cellColors[h];
        ctx.globalAlpha = 0.15;
        ctx.fillRect(rx + 10, my, miniW, miniH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = cellColors[h];
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 10, my, miniW, miniH);
        // Mini bars (deterministic mock data)
        var bw = miniW / 9;
        for (var b = 0; b < 9; b++) {
          var bh = (0.3 + Math.abs(Math.sin(b * 1.1 + h * 2.5)) * 0.7) * (miniH - 6);
          ctx.fillStyle = cellColors[h];
          ctx.globalAlpha = 0.6;
          ctx.fillRect(rx + 10 + b * bw + 1, my + miniH - bh - 2, bw - 2, bh);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = C.text;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('9维', rx + 148, my + miniH / 2);
      }

      // Normalization formula
      var fy = 280;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(rx, fy, 150, 50);
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, fy, 150, 50);
      ctx.fillStyle = C.textDark;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('v → v / (||v||₂ + ε)', rx + 75, fy + 18);
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('L2归一化', rx + 75, fy + 36);

      // Block sliding explanation
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Block以1个cell为步长滑动', 30, oy + 16 * cs + 18);
      ctx.fillText('每个Block: 4×9 = 36维直方图', 30, oy + 16 * cs + 36);
    }

    function drawStep4() {
      titleBar('第5步：HOG特征向量');

      // Final feature vector as bar chart
      var N = 36; // 4 cells * 9 bins for demonstration
      var barW = 14, gap = 2;
      var chartX = 50, chartY = 60, chartH = 160;
      var chartW = N * (barW + gap);

      ctx.fillStyle = '#fff';
      ctx.fillRect(chartX - 10, chartY - 10, chartW + 30, chartH + 40);
      ctx.strokeStyle = C.grayBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(chartX - 10, chartY - 10, chartW + 30, chartH + 40);
      label(chartX + chartW / 2, chartY - 22, 'HOG特征向量 (36维示例)', C.primary, 12);

      // Generate mock feature vector (deterministic)
      var fVec = [];
      for (var i = 0; i < N; i++) {
        fVec.push(0.1 + Math.abs(Math.sin(i * 0.7 + 0.3)) * 0.8 + Math.abs(Math.cos(i * 1.3)) * 0.1);
      }
      var maxF = Math.max.apply(null, fVec);

      var cellColors = [C.primary, C.blue, C.success, C.warning];
      for (var i2 = 0; i2 < N; i2++) {
        var bh = (fVec[i2] / maxF) * chartH;
        var bx = chartX + i2 * (barW + gap);
        var by = chartY + chartH - bh;
        var cellIdx = Math.floor(i2 / 9);
        ctx.fillStyle = cellColors[cellIdx];
        ctx.globalAlpha = 0.7;
        ctx.fillRect(bx, by, barW, bh);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = cellColors[cellIdx];
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, barW, bh);
        // Bin label
        if (i2 % 9 === 0) {
          ctx.fillStyle = C.text;
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('C' + cellIdx, bx + barW / 2 + 4 * (barW + gap), chartY + chartH + 14);
        }
      }
      // X axis
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX - 5, chartY + chartH);
      ctx.lineTo(chartX + chartW + 5, chartY + chartH);
      ctx.stroke();

      // Legend for cells
      var ly = chartY + chartH + 26;
      for (var c = 0; c < 4; c++) {
        ctx.fillStyle = cellColors[c];
        ctx.fillRect(chartX + c * 140, ly, 12, 12);
        ctx.fillStyle = C.text;
        ctx.font = '10px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Cell ' + c + ' (9 bins)', chartX + c * 140 + 16, ly + 9);
      }

      // Dimension calculation
      var dx = 50, dy = 280;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(dx, dy, 600, 90);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(dx, dy, 600, 90);
      label(dx + 300, dy + 16, 'HOG特征维度计算 (典型行人检测)', C.primary, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('图像大小：64×128 像素', dx + 15, dy + 38);
      ctx.fillText('Cell大小：8×8 → 共 8×16 = 128 个 cells', dx + 15, dy + 54);
      ctx.fillText('Block大小：2×2 cells, 步长=1 cell → 共 7×15 = 105 个 blocks', dx + 15, dy + 70);
      ctx.fillText('每个Block: 4×9 = 36维  →  总特征维度 = 105 × 36 = 3,780 维', dx + 15, dy + 86);
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

  registerAnimation(82, factory);
})();
