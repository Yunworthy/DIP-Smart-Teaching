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

  // 8x8 image with 4 distinct regions (different gray levels)
  var image = [
    [40, 42, 38, 41, 180, 182, 178, 181],
    [41, 39, 43, 40, 181, 179, 183, 180],
    [38, 41, 40, 42, 179, 181, 180, 182],
    [42, 40, 39, 41, 182, 180, 179, 181],
    [120, 122, 118, 121, 90, 92, 88, 91],
    [121, 119, 123, 120, 91, 89, 93, 90],
    [118, 121, 120, 122, 89, 91, 90, 92],
    [122, 120, 119, 121, 92, 90, 89, 91]
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

  function drawGrid(ctx, ox, oy, cellSize) {
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
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(image[r][c], x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    var totalSteps = 5;

    var stepDescriptions = [
      '原始图像：8×8 像素网格，包含 4 个不同灰度区域（40, 90, 120, 180）',
      '四叉树分裂（第一层）：将图像均分为 4 个 4×4 象限',
      '继续分裂：递归分裂非均匀区域，直到每个区域灰度一致',
      '合并相邻相似区域：将均值相近的相邻区域合并',
      '最终分割结果：显示最终区域边界和标签'
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
      ctx.fillText('原始图像（8×8）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('4 个均匀区域:', 30, 100);
      ctx.fillText('• 左上: ~40', 30, 125);
      ctx.fillText('• 右上: ~180', 30, 145);
      ctx.fillText('• 左下: ~120', 30, 165);
      ctx.fillText('• 右下: ~90', 30, 185);
    }

    function drawStep1() {
      drawStepHeader(ctx, 1, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('四叉树分裂（第一层）', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Draw 4x4 quadrant boundaries (thick)
      ctx.strokeStyle = COLOR.primary;
      ctx.lineWidth = 3;
      var mid = ox + 4 * cellSize;
      var midy = oy + 4 * cellSize;
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mid, oy);
      ctx.lineTo(mid, oy + GRID * cellSize);
      ctx.stroke();
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(ox, midy);
      ctx.lineTo(ox + GRID * cellSize, midy);
      ctx.stroke();

      // Labels
      ctx.fillStyle = COLOR.primary;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Q1', ox + 2 * cellSize, oy + 2 * cellSize);
      ctx.fillText('Q2', ox + 6 * cellSize, oy + 2 * cellSize);
      ctx.fillText('Q3', ox + 2 * cellSize, oy + 6 * cellSize);
      ctx.fillText('Q4', ox + 6 * cellSize, oy + 6 * cellSize);

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('图像分为 4 个 4×4 象限', 30, 100);
      ctx.fillText('检查每个象限的均匀性', 30, 120);
    }

    function drawStep2() {
      drawStepHeader(ctx, 2, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('递归分裂非均匀区域', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // All regions are uniform, so no further splitting needed
      // Show that each quadrant is uniform
      ctx.strokeStyle = COLOR.primary;
      ctx.lineWidth = 3;
      var mid = ox + 4 * cellSize;
      var midy = oy + 4 * cellSize;
      ctx.beginPath();
      ctx.moveTo(mid, oy);
      ctx.lineTo(mid, oy + GRID * cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, midy);
      ctx.lineTo(ox + GRID * cellSize, midy);
      ctx.stroke();

      // Check marks for uniform regions
      ctx.fillStyle = COLOR.success;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', ox + 2 * cellSize, oy + 2 * cellSize);
      ctx.fillText('✓', ox + 6 * cellSize, oy + 2 * cellSize);
      ctx.fillText('✓', ox + 2 * cellSize, oy + 6 * cellSize);
      ctx.fillText('✓', ox + 6 * cellSize, oy + 6 * cellSize);

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('所有 4×4 象限都是均匀的', 30, 100);
      ctx.fillText('无需进一步分裂', 30, 120);
      ctx.fillText('✓ = 均匀区域', 30, 150);
    }

    function drawStep3() {
      drawStepHeader(ctx, 3, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('合并相邻相似区域', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Color regions
      var regions = [
        { r1: 0, r2: 4, c1: 0, c2: 4, color: 'rgba(79,70,229,0.3)', label: 'R1' },
        { r1: 0, r2: 4, c1: 4, c2: 8, color: 'rgba(239,68,68,0.3)', label: 'R2' },
        { r1: 4, r2: 8, c1: 0, c2: 4, color: 'rgba(16,185,129,0.3)', label: 'R3' },
        { r1: 4, r2: 8, c1: 4, c2: 8, color: 'rgba(245,158,11,0.3)', label: 'R4' }
      ];

      for (var i = 0; i < regions.length; i++) {
        var reg = regions[i];
        var x = ox + reg.c1 * cellSize;
        var y = oy + reg.r1 * cellSize;
        var w = (reg.c2 - reg.c1) * cellSize;
        var h = (reg.r2 - reg.r1) * cellSize;
        ctx.fillStyle = reg.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLOR.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = COLOR.textDark;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(reg.label, x + w / 2, y + h / 2);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('检查相邻区域的相似度', 30, 100);
      ctx.fillText('均值差异 > 阈值 → 不合并', 30, 120);
      ctx.fillText('4 个区域保持独立', 30, 150);
    }

    function drawStep4() {
      drawStepHeader(ctx, 4, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('最终分割结果', 400, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Draw final boundaries
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 4;
      var mid = ox + 4 * cellSize;
      var midy = oy + 4 * cellSize;
      ctx.beginPath();
      ctx.moveTo(mid, oy);
      ctx.lineTo(mid, oy + GRID * cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, midy);
      ctx.lineTo(ox + GRID * cellSize, midy);
      ctx.stroke();

      // Region labels with backgrounds
      var labels = [
        { x: ox + 2 * cellSize, y: oy + 2 * cellSize, text: '区域 1\n均值≈40', color: COLOR.primary },
        { x: ox + 6 * cellSize, y: oy + 2 * cellSize, text: '区域 2\n均值≈180', color: COLOR.danger },
        { x: ox + 2 * cellSize, y: oy + 6 * cellSize, text: '区域 3\n均值≈120', color: COLOR.success },
        { x: ox + 6 * cellSize, y: oy + 6 * cellSize, text: '区域 4\n均值≈90', color: COLOR.warning }
      ];

      for (var i = 0; i < labels.length; i++) {
        var lb = labels[i];
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(lb.x - 40, lb.y - 20, 80, 40);
        ctx.fillStyle = lb.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        var lines = lb.text.split('\n');
        ctx.fillText(lines[0], lb.x, lb.y - 6);
        ctx.fillText(lines[1], lb.x, lb.y + 10);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('最终分割为 4 个独立区域', 30, 100);
      ctx.fillText('红色粗线 = 区域边界', 30, 130);
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

  registerAnimationBatch([68, 105], factory);
})();
