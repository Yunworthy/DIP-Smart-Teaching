(function () {
  'use strict';

  var COLOR = {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    success: '#10b981',
    successLight: '#6ee7b7',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    gray: '#6b7280',
    grayLight: '#e5e7eb',
    grayBg: '#f9fafb',
    textDark: '#1f2937',
    textMed: '#374151',
    textLight: '#9ca3af'
  };

  var GRID = 6;

  // 6x6 grayscale image
  var image = [
    [80, 85, 90, 120, 125, 130],
    [82, 88, 95, 122, 128, 135],
    [78, 92, 100, 118, 132, 140],
    [110, 115, 120, 150, 155, 160],
    [112, 118, 125, 152, 158, 165],
    [108, 122, 130, 148, 162, 170]
  ];

  function grayToColor(val) {
    var g = Math.round(val);
    return 'rgb(' + g + ',' + g + ',' + g + ')';
  }

  function drawStepHeader(ctx, step, total) {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = COLOR.primary;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('步骤 ' + (step + 1) + ' / ' + total, 16, 18);
  }

  function drawGrid(ctx, ox, oy, cellSize, highlightFn) {
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var x = ox + c * cellSize;
        var y = oy + r * cellSize;
        ctx.fillStyle = grayToColor(image[r][c]);
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = COLOR.grayLight;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = image[r][c] > 128 ? COLOR.textDark : '#e5e7eb';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(image[r][c], x + cellSize / 2, y + cellSize / 2);

        if (highlightFn) highlightFn(r, c, x, y, cellSize);
      }
    }
  }

  // Compute LBP for all pixels
  function computeLBP() {
    var lbp = [];
    for (var r = 0; r < GRID; r++) {
      lbp.push([]);
      for (var c = 0; c < GRID; c++) {
        if (r === 0 || r === GRID - 1 || c === 0 || c === GRID - 1) {
          lbp[r].push(0); // boundary pixels
        } else {
          var center = image[r][c];
          var bits = [];
          var neighbors = [
            [r - 1, c], [r - 1, c + 1], [r, c + 1], [r + 1, c + 1],
            [r + 1, c], [r + 1, c - 1], [r, c - 1], [r - 1, c - 1]
          ];
          var code = 0;
          for (var i = 0; i < 8; i++) {
            var nr = neighbors[i][0], nc = neighbors[i][1];
            var bit = image[nr][nc] >= center ? 1 : 0;
            bits.push(bit);
            code += bit * Math.pow(2, i);
          }
          lbp[r].push({ code: code, bits: bits });
        }
      }
    }
    return lbp;
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    var totalSteps = 5;

    var lbpMap = computeLBP();
    var centerR = 2, centerC = 2; // Example center pixel
    var centerVal = image[centerR][centerC];
    var exampleLBP = lbpMap[centerR][centerC];

    var stepDescriptions = [
      '原始图像：6×6 灰度图像，每个像素有灰度值',
      '选择中心像素：以 (2,2) 为例，中心值=' + centerVal + '，检查 8 邻域',
      '二值化比较：将每个邻域像素与中心比较，>= 中心 → 1（绿），< 中心 → 0（红）',
      '生成 LBP 编码：按顺时针排列 8 位二进制码，转换为十进制 LBP 值',
      'LBP 特征图：对所有内部像素计算 LBP 值，形成纹理特征图'
    ];

    var ox = 240, oy = 55, cellSize = 40;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLOR.grayBg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStep0() {
      drawStepHeader(ctx, 0, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始灰度图像（6×6）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LBP: 局部二值模式', 30, 100);
      ctx.fillText('描述局部纹理特征', 30, 120);
      ctx.fillText('每个像素与 8 邻域比较', 30, 150);
    }

    function drawStep1() {
      drawStepHeader(ctx, 1, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('选择中心像素及 8 邻域', 400, 50);

      drawGrid(ctx, ox, oy, cellSize, function (r, c, x, y, cs) {
        // Highlight 3x3 window around center
        if (r >= centerR - 1 && r <= centerR + 1 && c >= centerC - 1 && c <= centerC + 1) {
          if (r === centerR && c === centerC) {
            ctx.strokeStyle = COLOR.danger;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
          } else {
            ctx.strokeStyle = COLOR.primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
          }
        }
      });

      // Info panel
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 2;
      ctx.fillRect(20, 80, 200, 80);
      ctx.strokeRect(20, 80, 200, 80);

      ctx.fillStyle = COLOR.danger;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('中心像素', 30, 100);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = '12px sans-serif';
      ctx.fillText('位置: (' + centerR + ',' + centerC + ')', 30, 120);
      ctx.fillText('灰度值: ' + centerVal, 30, 140);

      ctx.fillStyle = '#eff6ff';
      ctx.strokeStyle = COLOR.primary;
      ctx.fillRect(20, 180, 200, 60);
      ctx.strokeRect(20, 180, 200, 60);

      ctx.fillStyle = COLOR.primary;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('8 邻域像素', 30, 200);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = '12px sans-serif';
      ctx.fillText('与中心值比较', 30, 220);
    }

    function drawStep2() {
      drawStepHeader(ctx, 2, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('二值化比较', 400, 50);

      drawGrid(ctx, ox, oy, cellSize, function (r, c, x, y, cs) {
        if (r >= centerR - 1 && r <= centerR + 1 && c >= centerC - 1 && c <= centerC + 1) {
          if (r === centerR && c === centerC) {
            ctx.strokeStyle = COLOR.danger;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
          } else {
            var bit = image[r][c] >= centerVal ? 1 : 0;
            ctx.fillStyle = bit ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)';
            ctx.fillRect(x, y, cs, cs);

            ctx.fillStyle = bit ? COLOR.success : COLOR.danger;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bit, x + cs / 2, y + cs / 2 - 12);
          }
        }
      });

      // Comparison panel
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = COLOR.success;
      ctx.lineWidth = 2;
      ctx.fillRect(20, 80, 200, 180);
      ctx.strokeRect(20, 80, 200, 180);

      ctx.fillStyle = COLOR.success;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('比较规则', 30, 100);

      ctx.fillStyle = COLOR.textDark;
      ctx.font = '12px sans-serif';
      ctx.fillText('中心值 = ' + centerVal, 30, 125);
      ctx.fillText('', 30, 145);

      var neighbors = [
        { r: centerR - 1, c: centerC, label: '上' },
        { r: centerR - 1, c: centerC + 1, label: '右上' },
        { r: centerR, c: centerC + 1, label: '右' },
        { r: centerR + 1, c: centerC + 1, label: '右下' }
      ];

      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        var val = image[n.r][n.c];
        var bit = val >= centerVal ? 1 : 0;
        ctx.fillStyle = bit ? COLOR.success : COLOR.danger;
        ctx.fillText(n.label + ': ' + val + ' → ' + bit, 30, 165 + i * 22);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '11px sans-serif';
      ctx.fillText('>= 中心 → 1 (绿)', 30, 250);
      ctx.fillText('< 中心 → 0 (红)', 130, 250);
    }

    function drawStep3() {
      drawStepHeader(ctx, 3, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('生成 LBP 编码', 400, 50);

      drawGrid(ctx, ox, oy, cellSize, function (r, c, x, y, cs) {
        if (r >= centerR - 1 && r <= centerR + 1 && c >= centerC - 1 && c <= centerC + 1) {
          if (r === centerR && c === centerC) {
            ctx.strokeStyle = COLOR.danger;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
          } else {
            var bit = image[r][c] >= centerVal ? 1 : 0;
            ctx.fillStyle = bit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
            ctx.fillRect(x, y, cs, cs);
          }
        }
      });

      // Draw clockwise bit arrangement
      var cx = 120, cy = 150, radius = 60;
      var bits = exampleLBP.bits;
      var angles = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4];

      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('顺时针排列 (8位)', cx, 80);

      // Draw circle
      ctx.strokeStyle = COLOR.grayLight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Center
      ctx.fillStyle = COLOR.danger;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(centerVal, cx, cy);

      // Bits around circle
      for (var i = 0; i < 8; i++) {
        var bx = cx + radius * Math.cos(angles[i]);
        var by = cy + radius * Math.sin(angles[i]);
        ctx.fillStyle = bits[i] ? COLOR.success : COLOR.danger;
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(bits[i], bx, by);

        // Position label
        ctx.fillStyle = COLOR.textLight;
        ctx.font = '9px sans-serif';
        ctx.fillText('P' + i, bx, by + 20);
      }

      // Binary code and decimal
      var binaryStr = bits.join('');
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('二进制码: ', 30, 250);
      ctx.fillStyle = COLOR.primary;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(binaryStr + '₂', 120, 250);

      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('十进制 LBP = ', 30, 280);
      ctx.fillStyle = COLOR.warning;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(exampleLBP.code, 150, 280);

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LBP = Σ bit[i] × 2^i', 30, 310);
    }

    function drawStep4() {
      drawStepHeader(ctx, 4, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LBP 特征图', 400, 50);

      // Draw original image (small)
      var ox1 = 40, oy1 = 80, cs1 = 30;
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始图像', ox1 + (GRID * cs1) / 2, oy1 - 10);

      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var x = ox1 + c * cs1;
          var y = oy1 + r * cs1;
          ctx.fillStyle = grayToColor(image[r][c]);
          ctx.fillRect(x, y, cs1, cs1);
          ctx.strokeStyle = COLOR.grayLight;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cs1, cs1);
        }
      }

      // Arrow
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 250, oy1 + (GRID * cs1) / 2);

      // Draw LBP feature map
      var ox2 = 290, oy2 = 80, cs2 = 40;
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LBP 特征图', ox2 + (GRID * cs2) / 2, oy2 - 10);

      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var x = ox2 + c * cs2;
          var y = oy2 + r * cs2;

          if (r === 0 || r === GRID - 1 || c === 0 || c === GRID - 1) {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(x, y, cs2, cs2);
            ctx.fillStyle = COLOR.textLight;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('-', x + cs2 / 2, y + cs2 / 2);
          } else {
            var lbpVal = lbpMap[r][c].code;
            var intensity = lbpVal / 255;
            ctx.fillStyle = 'rgb(' + Math.round(100 + intensity * 100) + ',' +
              Math.round(50 + (1 - intensity) * 150) + ',' +
              Math.round(200 - intensity * 100) + ')';
            ctx.fillRect(x, y, cs2, cs2);

            ctx.fillStyle = lbpVal > 128 ? '#fff' : COLOR.textDark;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(lbpVal, x + cs2 / 2, y + cs2 / 2);
          }
          ctx.strokeStyle = COLOR.grayLight;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cs2, cs2);
        }
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LBP 值反映局部纹理模式', 40, 330);
      ctx.fillText('边界像素无法计算（标记为 -）', 40, 350);
      ctx.fillText('不同颜色 = 不同纹理区域', 40, 370);
    }

    return {
      totalSteps: totalSteps,
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

  registerAnimation(85, factory);
})();
