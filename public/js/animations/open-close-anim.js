/**
 * Opening and Closing Animation
 *
 * Demonstrates morphological opening (erosion → dilation) and closing
 * (dilation → erosion) on a binary image:
 *   Step 0: Original binary image with protrusions and holes
 *   Step 1: Opening Step 1 — Erosion (protrusions removed)
 *   Step 2: Opening Step 2 — Dilation (restore size, protrusions gone)
 *   Step 3: Closing Step 1 — Dilation (holes filled)
 *   Step 4: Closing Step 2 — Erosion (restore size, holes still filled)
 *   Step 5: Side-by-side comparison: original vs opened vs closed
 *
 * Registered for KP IDs 72, 73 (开运算 / 闭运算).
 */
(function () {
  'use strict';

  var INDIGO       = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN        = '#10b981';
  var RED          = '#ef4444';
  var AMBER        = '#f59e0b';
  var GRAY_BG      = '#f9fafb';
  var GRAY_BORDER  = '#d1d5db';
  var TEXT_COLOR    = '#374151';

  // 8×8 binary image with a protrusion (top-right) and an interior hole
  var binaryImg = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 0],  // protrusion at (1,6)
    [0, 1, 1, 0, 1, 1, 0, 0],  // hole at (2,3)
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],  // small protrusion at (6,3)
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Structuring element: 3×3 square
  var SE = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];

  function erode(img, se) {
    var rows = img.length;
    var cols = img[0].length;
    var out  = [];
    for (var r = 0; r < rows; r++) {
      out[r] = [];
      for (var c = 0; c < cols; c++) out[r][c] = 0;
    }
    for (var r = 1; r < rows - 1; r++) {
      for (var c = 1; c < cols - 1; c++) {
        var allOne = true;
        for (var sr = 0; sr < 3; sr++)
          for (var sc = 0; sc < 3; sc++)
            if (se[sr][sc] === 1 && img[r - 1 + sr][c - 1 + sc] === 0)
              allOne = false;
        out[r][c] = allOne ? 1 : 0;
      }
    }
    return out;
  }

  function dilate(img, se) {
    var rows = img.length;
    var cols = img[0].length;
    var out  = [];
    for (var r = 0; r < rows; r++) {
      out[r] = [];
      for (var c = 0; c < cols; c++) out[r][c] = 0;
    }
    for (var r = 1; r < rows - 1; r++) {
      for (var c = 1; c < cols - 1; c++) {
        var anyOne = false;
        for (var sr = 0; sr < 3; sr++)
          for (var sc = 0; sc < 3; sc++)
            if (se[sr][sc] === 1 && img[r - 1 + sr][c - 1 + sc] === 1)
              anyOne = true;
        out[r][c] = anyOne ? 1 : 0;
      }
    }
    return out;
  }

  // Opening = erode then dilate
  var eroded      = erode(binaryImg, SE);
  var opened      = dilate(eroded, SE);

  // Closing = dilate then erode
  var dilated     = dilate(binaryImg, SE);
  var closed      = erode(dilated, SE);

  var stepDescriptions = [
    '<b>步骤 1/6 — 原始二值图像：</b>图像中有两个需要处理的特征：①右上角的突出像素 (1,6) 和底部的小突起 (6,3)；②内部的空洞 (2,3)。开运算将消除突起，闭运算将填补空洞。',
    '<b>步骤 2/6 — 开运算第 1 步：腐蚀：</b>对原图执行腐蚀操作。前景区域缩小，小于结构元素的突起被消除。红色标记为被移除的像素。',
    '<b>步骤 3/6 — 开运算第 2 步：膨胀：</b>对腐蚀结果执行膨胀。前景恢复到接近原始大小，但已被移除的小突起不会复原。开运算 = 先腐蚀后膨胀，<b>消除细小突起、断开窄连接</b>。',
    '<b>步骤 4/6 — 闭运算第 1 步：膨胀：</b>对原图执行膨胀操作。前景区域扩大，小于结构元素的空洞被填充。绿色标记为新增的前景像素。',
    '<b>步骤 5/6 — 闭运算第 2 步：腐蚀：</b>对膨胀结果执行腐蚀。前景恢复到接近原始大小，但已被填充的空洞不会重新出现。闭运算 = 先膨胀后腐蚀，<b>填补细小空洞、连接断裂</b>。',
    '<b>步骤 6/6 — 对比总结：</b>开运算消除突起、断开连接；闭运算填补空洞、弥合裂缝。两者都是<b>幂等</b>操作 — 多次执行与一次执行结果相同。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawBinaryGrid(x, y, data, cellSize, label) {
      var rows = data.length;
      var cols = data[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          ctx.fillStyle = data[r][c] ? '#e0e7ff' : '#f3f4f6';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          ctx.fillStyle = data[r][c] ? INDIGO : '#d1d5db';
          ctx.font      = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(data[r][c], x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (cols * cellSize) / 2, y + rows * cellSize + 18);
    }

    /** Draw grid with changed cells highlighted. */
    function drawDiffGrid(x, y, original, result, cellSize, label, diffColor) {
      var rows = original.length;
      var cols = original[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var changed = (original[r][c] !== result[r][c]);
          ctx.fillStyle = result[r][c] ? '#e0e7ff' : '#f3f4f6';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          if (changed) {
            ctx.strokeStyle = diffColor;
            ctx.lineWidth = 3;
          } else {
            ctx.strokeStyle = GRAY_BORDER;
            ctx.lineWidth = 1;
          }
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.lineWidth = 1;

          ctx.fillStyle = result[r][c] ? INDIGO : '#d1d5db';
          ctx.font      = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(result[r][c], x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (cols * cellSize) / 2, y + rows * cellSize + 18);
    }

    function drawArrow(x1, y1, x2, y2, color) {
      ctx.strokeStyle = color || AMBER;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      var angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = color || AMBER;
      ctx.fill();
      ctx.lineWidth = 1;
    }

    function drawSESmall(x, y) {
      var cs = 22;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          ctx.fillStyle = SE[r][c] ? '#c7d2fe' : '#fff';
          ctx.fillRect(x + c * cs, y + r * cs, cs, cs);
          ctx.strokeStyle = INDIGO;
          ctx.strokeRect(x + c * cs, y + r * cs, cs, cs);
          ctx.fillStyle = INDIGO;
          ctx.font      = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(SE[r][c], x + c * cs + cs / 2, y + r * cs + cs / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
    }

    // ---- step renderers ----

    function drawStep0() {
      var cs = 42;
      drawBinaryGrid(120, 40, binaryImg, cs, '原始二值图像 (8×8)');

      // Annotate features
      // Protrusion at (1,6)
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(120 + 6 * cs + 2, 40 + 1 * cs + 2, cs - 4, cs - 4);
      ctx.lineWidth = 1;
      ctx.fillStyle = RED;
      ctx.font      = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← 突起', 120 + 7 * cs + 4, 40 + 1 * cs + cs / 2 + 4);

      // Hole at (2,3)
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(120 + 3 * cs + 2, 40 + 2 * cs + 2, cs - 4, cs - 4);
      ctx.lineWidth = 1;
      ctx.fillStyle = AMBER;
      ctx.fillText('← 空洞', 120 + 4 * cs + 4, 40 + 2 * cs + cs / 2 + 4);

      // Small protrusion at (6,3)
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(120 + 3 * cs + 2, 40 + 6 * cs + 2, cs - 4, cs - 4);
      ctx.lineWidth = 1;
      ctx.fillStyle = RED;
      ctx.fillText('← 小突起', 120 + 4 * cs + 4, 40 + 6 * cs + cs / 2 + 4);

      // SE
      drawSESmall(540, 80);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SE (3×3)', 540 + 33, 80 + 66 + 14);

      // Info
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 340, 640, 44);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 340, 640, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('开运算（先腐蚀后膨胀）消除突起；闭运算（先膨胀后腐蚀）填补空洞。', 48, 366);
    }

    function drawStep1() {
      var cs = 38;
      drawBinaryGrid(20, 30, binaryImg, cs, '原始图像');
      drawArrow(20 + 8 * cs + 10, 30 + 4 * cs, 260, 30 + 4 * cs, AMBER);
      drawDiffGrid(270, 30, binaryImg, eroded, cs, '腐蚀结果', RED);

      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(20, 340, 660, 44);
      ctx.strokeStyle = '#fecaca';
      ctx.strokeRect(20, 340, 660, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('开运算第 1 步：腐蚀。红色边框标记被移除的像素 — 右上角突起、底部小突起被消除。', 38, 366);
    }

    function drawStep2() {
      var cs = 38;
      drawBinaryGrid(20, 30, eroded, cs, '腐蚀结果');
      drawArrow(20 + 8 * cs + 10, 30 + 4 * cs, 270, 30 + 4 * cs, GREEN);
      drawDiffGrid(280, 30, binaryImg, opened, cs, '开运算结果 (腐蚀→膨胀)', GREEN);

      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(20, 340, 660, 44);
      ctx.strokeStyle = '#a7f3d0';
      ctx.strokeRect(20, 340, 660, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('开运算第 2 步：对腐蚀结果膨胀。前景恢复大小，但突起已被永久移除。开运算完成。', 38, 366);
    }

    function drawStep3() {
      var cs = 38;
      drawBinaryGrid(20, 30, binaryImg, cs, '原始图像');
      drawArrow(20 + 8 * cs + 10, 30 + 4 * cs, 260, 30 + 4 * cs, GREEN);
      drawDiffGrid(270, 30, binaryImg, dilated, cs, '膨胀结果', GREEN);

      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(20, 340, 660, 44);
      ctx.strokeStyle = '#a7f3d0';
      ctx.strokeRect(20, 340, 660, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('闭运算第 1 步：膨胀。绿色边框标记新增前景像素 — 内部空洞被填充，外部略有扩张。', 38, 366);
    }

    function drawStep4() {
      var cs = 38;
      drawBinaryGrid(20, 30, dilated, cs, '膨胀结果');
      drawArrow(20 + 8 * cs + 10, 30 + 4 * cs, 270, 30 + 4 * cs, RED);
      drawDiffGrid(280, 30, binaryImg, closed, cs, '闭运算结果 (膨胀→腐蚀)', RED);

      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(20, 340, 660, 44);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(20, 340, 660, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('闭运算第 2 步：对膨胀结果腐蚀。前景恢复大小，但空洞已被永久填充。闭运算完成。', 38, 366);
    }

    function drawStep5() {
      var cs = 32;
      var gap = 24;

      // Original
      drawBinaryGrid(20, 30, binaryImg, cs, '原始图像');

      // Arrow
      var ax = 20 + 8 * cs + 6;
      drawArrow(ax, 30 + 4 * cs, ax + gap - 6, 30 + 4 * cs, AMBER);

      // Opened
      var ox = ax + gap;
      drawDiffGrid(ox, 30, binaryImg, opened, cs, '开运算结果', RED);

      // Arrow
      var ax2 = ox + 8 * cs + 6;
      drawArrow(ax2, 30 + 4 * cs, ax2 + gap - 6, 30 + 4 * cs, AMBER);

      // Closed
      var cx2 = ax2 + gap;
      drawDiffGrid(cx2, 30, binaryImg, closed, cs, '闭运算结果', GREEN);

      // Summary panel
      ctx.fillStyle = '#f5f3ff';
      ctx.fillRect(20, 310, 660, 76);
      ctx.strokeStyle = '#ddd6fe';
      ctx.strokeRect(20, 310, 660, 76);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('开运算 (Opening) = 腐蚀 → 膨胀', 38, 334);
      ctx.fillText('  效果：消除细小突起，断开窄连接，平滑边界。', 38, 352);
      ctx.fillText('闭运算 (Closing) = 膨胀 → 腐蚀', 38, 370);
      ctx.fillText('  效果：填补细小空洞，弥合窄断裂，连接邻近区域。', 38, 388);
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
      reset: function () { /* stateless */ },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimationBatch([72, 73], factory);
})();
