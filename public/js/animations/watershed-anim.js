(function () {
  'use strict';

  var COLOR = {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    gray: '#6b7280',
    grayLight: '#e5e7eb',
    grayBg: '#f9fafb',
    textDark: '#1f2937',
    textMed: '#374151',
    textLight: '#9ca3af'
  };

  var GRID = 8;

  // 8x8 gradient landscape with two basins separated by ridge
  var landscape = [
    [8, 7, 6, 9, 10, 7, 6, 8],
    [7, 4, 3, 7, 8, 4, 3, 7],
    [6, 3, 2, 6, 7, 2, 2, 6],
    [8, 6, 5, 8, 9, 5, 4, 7],
    [10, 8, 7, 10, 11, 7, 6, 9],
    [7, 5, 4, 8, 9, 4, 3, 7],
    [6, 3, 2, 7, 8, 3, 2, 6],
    [8, 7, 5, 9, 10, 6, 5, 8]
  ];

  // Local minima (seed markers)
  var minima = [
    { r: 2, c: 2, val: 2, label: 'M1' },
    { r: 6, c: 2, val: 2, label: 'M2' },
    { r: 2, c: 6, val: 2, label: 'M3' },
    { r: 6, c: 6, val: 2, label: 'M4' }
  ];

  function elevationColor(val) {
    var t = (val - 2) / 9; // normalize 2-11 to 0-1
    if (t < 0.3) return 'rgb(' + Math.round(80 + t * 200) + ',' + Math.round(160 + t * 80) + ',80)';
    if (t < 0.6) return 'rgb(' + Math.round(180 + (t - 0.3) * 200) + ',' + Math.round(180 - (t - 0.3) * 100) + ',60)';
    return 'rgb(' + Math.round(200 + (t - 0.6) * 100) + ',' + Math.round(140 - (t - 0.6) * 200) + ',' + Math.round(60 + (t - 0.6) * 100) + ')';
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

  function drawGrid(ctx, ox, oy, cellSize, overlayFn) {
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var x = ox + c * cellSize;
        var y = oy + r * cellSize;
        ctx.fillStyle = elevationColor(landscape[r][c]);
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = landscape[r][c] > 6 ? '#fff' : COLOR.textDark;
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(landscape[r][c], x + cellSize / 2, y + cellSize / 2);

        if (overlayFn) overlayFn(r, c, x, y, cellSize);
      }
    }
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    var totalSteps = 5;

    var stepDescriptions = [
      '梯度图像：8×8 像素网格，数值表示梯度幅值，低值（绿色）为盆地，高值（棕色）为山脊',
      '标记最小值：识别局部极小值点（M1~M4）作为浸水起点，标记为彩色圆点',
      '浸水过程（低水位）：水从各最小值点开始上涨，填充低梯度盆地（蓝色水域）',
      '浸水过程（高水位）：不同盆地的水域即将汇合，在汇合处构建分水岭坝（红色线）',
      '分水岭线：最终分水岭（红色粗线）将图像分割为独立区域，完成分割'
    ];

    var ox = 240, oy = 55, cellSize = 38;

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
      ctx.fillText('梯度图像（地形隐喻）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Legend
      ctx.fillStyle = COLOR.textMed;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('低梯度（盆地）', 30, 100);
      ctx.fillStyle = elevationColor(2);
      ctx.fillRect(30, 110, 20, 20);
      ctx.fillStyle = COLOR.textMed;
      ctx.fillText('高梯度（山脊）', 30, 160);
      ctx.fillStyle = elevationColor(10);
      ctx.fillRect(30, 170, 20, 20);

      ctx.fillText('四个低洼盆地', 30, 220);
      ctx.fillText('被中央山脊分隔', 30, 240);
    }

    function drawStep1() {
      drawStepHeader(ctx, 1, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('标记局部最小值', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      var colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
      for (var i = 0; i < minima.length; i++) {
        var m = minima[i];
        var cx = ox + m.c * cellSize + cellSize / 2;
        var cy = oy + m.r * cellSize + cellSize / 2;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize * 0.35, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.label, cx, cy);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('检测到 4 个局部极小值', 30, 100);
      ctx.fillText('作为浸水起点（种子）', 30, 120);
    }

    function drawStep2() {
      drawStepHeader(ctx, 2, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('浸水过程（低水位）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize, function (r, c, x, y, cs) {
        // Flood cells with value <= 4
        if (landscape[r][c] <= 4) {
          ctx.fillStyle = 'rgba(59,130,246,0.45)';
          ctx.fillRect(x, y, cs, cs);
        }
      });

      var colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
      for (var i = 0; i < minima.length; i++) {
        var m = minima[i];
        var cx = ox + m.c * cellSize + cellSize / 2;
        var cy = oy + m.r * cellSize + cellSize / 2;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize * 0.25, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(30, 100, 20, 20);
      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('水位 = 4', 60, 115);
      ctx.fillText('蓝色区域 = 已淹没盆地', 30, 150);
    }

    function drawStep3() {
      drawStepHeader(ctx, 3, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('浸水过程（高水位）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize, function (r, c, x, y, cs) {
        // Flood cells with value <= 7
        if (landscape[r][c] <= 7) {
          ctx.fillStyle = 'rgba(59,130,246,0.55)';
          ctx.fillRect(x, y, cs, cs);
        }
      });

      // Draw dams where waters would merge (ridge cells)
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 4;
      // Vertical dam at column 3-4
      for (var r = 0; r < GRID; r++) {
        if (landscape[r][3] >= 7 || landscape[r][4] >= 7) {
          var x = ox + 4 * cellSize;
          var y = oy + r * cellSize;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
      }

      ctx.fillStyle = COLOR.danger;
      ctx.fillRect(30, 100, 20, 20);
      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('水位 = 7', 60, 115);
      ctx.fillText('红色线 = 分水岭坝', 30, 150);
      ctx.fillText('阻止不同盆地水域汇合', 30, 170);
    }

    function drawStep4() {
      drawStepHeader(ctx, 4, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('分水岭线（最终分割）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize, function (r, c, x, y, cs) {
        // Color regions by basin
        var basin = -1;
        if (c < 4 && r < 4) basin = 0;
        else if (c < 4 && r >= 4) basin = 1;
        else if (c >= 4 && r < 4) basin = 2;
        else basin = 3;

        var regionColors = ['rgba(239,68,68,0.25)', 'rgba(59,130,246,0.25)', 'rgba(16,185,129,0.25)', 'rgba(245,158,11,0.25)'];
        ctx.fillStyle = regionColors[basin];
        ctx.fillRect(x, y, cs, cs);
      });

      // Watershed lines (thick red)
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 5;
      // Vertical line
      var vx = ox + 4 * cellSize;
      ctx.beginPath();
      ctx.moveTo(vx, oy);
      ctx.lineTo(vx, oy + GRID * cellSize);
      ctx.stroke();
      // Horizontal line
      var hy = oy + 4 * cellSize;
      ctx.beginPath();
      ctx.moveTo(ox, hy);
      ctx.lineTo(ox + GRID * cellSize, hy);
      ctx.stroke();

      var labels = ['区域 1', '区域 2', '区域 3', '区域 4'];
      var regionColors = [COLOR.danger, '#3b82f6', COLOR.success, COLOR.warning];
      for (var i = 0; i < 4; i++) {
        var rr = Math.floor(i / 2);
        var cc = i % 2;
        var lx = ox + cc * 4 * cellSize + 2 * cellSize;
        var ly = oy + rr * 4 * cellSize + 2 * cellSize;
        ctx.fillStyle = regionColors[i];
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], lx, ly);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('分水岭将图像分为 4 个独立区域', 30, 100);
      ctx.fillText('红色粗线 = 分水岭边界', 30, 130);
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

  registerAnimation(69, factory);
})();
