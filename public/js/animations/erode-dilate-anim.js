/**
 * Erosion and Dilation Animation
 *
 * Demonstrates basic morphological operations on a binary image:
 *   Step 0: Show binary image (8×8 grid) + structuring element (3×3 cross)
 *   Step 1: Erosion — SE at a position, show decision logic
 *   Step 2: Erosion result
 *   Step 3: Dilation — SE at a position, show decision logic
 *   Step 4: Dilation result
 *
 * Registered for KP IDs 70, 71 (腐蚀 / 膨胀).
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
  var HIGHLIGHT    = '#fef3c7';

  // 8×8 binary image — a rough rectangle with some protrusions
  var binaryImg = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Structuring element: 3×3 cross (origin at center)
  var SE = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ];

  // Compute erosion: pixel = 1 only if ALL SE hits are 1
  function erode(img, se) {
    var rows = img.length;
    var cols = img[0].length;
    var out  = [];
    for (var r = 0; r < rows; r++) {
      out[r] = [];
      for (var c = 0; c < cols; c++) {
        out[r][c] = 0; // default
      }
    }
    for (var r = 1; r < rows - 1; r++) {
      for (var c = 1; c < cols - 1; c++) {
        var allOne = true;
        for (var sr = 0; sr < 3; sr++) {
          for (var sc = 0; sc < 3; sc++) {
            if (se[sr][sc] === 1 && img[r - 1 + sr][c - 1 + sc] === 0) {
              allOne = false;
            }
          }
        }
        out[r][c] = allOne ? 1 : 0;
      }
    }
    return out;
  }

  // Compute dilation: pixel = 1 if ANY SE hit is 1
  function dilate(img, se) {
    var rows = img.length;
    var cols = img[0].length;
    var out  = [];
    for (var r = 0; r < rows; r++) {
      out[r] = [];
      for (var c = 0; c < cols; c++) {
        out[r][c] = 0;
      }
    }
    for (var r = 1; r < rows - 1; r++) {
      for (var c = 1; c < cols - 1; c++) {
        var anyOne = false;
        for (var sr = 0; sr < 3; sr++) {
          for (var sc = 0; sc < 3; sc++) {
            if (se[sr][sc] === 1 && img[r - 1 + sr][c - 1 + sc] === 1) {
              anyOne = true;
            }
          }
        }
        out[r][c] = anyOne ? 1 : 0;
      }
    }
    return out;
  }

  var eroded   = erode(binaryImg, SE);
  var dilated  = dilate(binaryImg, SE);

  var stepDescriptions = [
    '<b>步骤 1/5 — 原始二值图像与结构元素：</b>左侧为 8×8 二值图像（1=白色前景，0=黑色背景）。右侧为十字形结构元素（SE），原点位于中心。形态学运算以 SE 为"探针"检测图像形状。',
    '<b>步骤 2/5 — 腐蚀操作：</b>将 SE 中心对准每个像素，检查 SE 中所有 1 位置下的像素是否全为 1。若全部为 1（绿色），输出 1；否则输出 0（红色）。腐蚀使前景区域缩小，消除细小突起。',
    '<b>步骤 3/5 — 腐蚀结果：</b>前景区域整体缩小了一圈，原本的单像素突起被移除。腐蚀程度取决于结构元素的大小和形状。',
    '<b>步骤 4/5 — 膨胀操作：</b>将 SE 中心对准每个像素，检查 SE 中任一 1 位置下的像素是否为 1。若存在 1（绿色），输出 1；否则输出 0。膨胀使前景区域扩大，填补细小空洞。',
    '<b>步骤 5/5 — 膨胀结果：</b>前景区域向外扩展了一圈，内部小空洞被填充。膨胀程度同样取决于结构元素。腐蚀与膨胀互为对偶运算。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    // Demo position for SE overlay (pick a boundary pixel)
    var demoR = 3, demoC = 4;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawBinaryGrid(x, y, data, cellSize, label, highlightR, highlightC, seOverlay, seMatchColor) {
      var rows = data.length;
      var cols = data[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          ctx.fillStyle = data[r][c] ? '#e0e7ff' : '#f3f4f6';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          ctx.fillStyle = data[r][c] ? INDIGO : '#d1d5db';
          ctx.font      = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(data[r][c], x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
        }
      }

      // SE overlay
      if (seOverlay && highlightR !== undefined) {
        for (var sr = 0; sr < 3; sr++) {
          for (var sc = 0; sc < 3; sc++) {
            if (seOverlay[sr][sc] === 1) {
              var gr = highlightR - 1 + sr;
              var gc = highlightC - 1 + sc;
              if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
                var color = seMatchColor || HIGHLIGHT;
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x + gc * cellSize, y + gr * cellSize, cellSize, cellSize);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = AMBER;
                ctx.lineWidth   = 2.5;
                ctx.strokeRect(x + gc * cellSize + 1, y + gr * cellSize + 1, cellSize - 2, cellSize - 2);
                ctx.lineWidth   = 1;
              }
            }
          }
        }
        // Draw center marker
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + highlightC * cellSize + 2, y + highlightR * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.lineWidth = 1;
      }

      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (cols * cellSize) / 2, y + rows * cellSize + 20);
    }

    function drawSE(x, y, cellSize, label) {
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          ctx.fillStyle = SE[r][c] ? '#c7d2fe' : '#fff';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = INDIGO;
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          ctx.fillStyle = SE[r][c] ? INDIGO : '#e5e7eb';
          ctx.font      = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(SE[r][c], x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
        }
      }
      // Origin marker
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 1.5 * cellSize, y + 1.5 * cellSize, cellSize / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + 1.5 * cellSize, y + 3 * cellSize + 20);
    }

    function drawResultGrid(x, y, original, result, cellSize, label, resultColor) {
      var rows = original.length;
      var cols = original[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var changed = (original[r][c] !== result[r][c]);
          ctx.fillStyle = result[r][c] ? '#e0e7ff' : '#f3f4f6';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          if (changed) {
            ctx.strokeStyle = resultColor;
            ctx.lineWidth = 2.5;
          } else {
            ctx.strokeStyle = GRAY_BORDER;
            ctx.lineWidth = 1;
          }
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.lineWidth = 1;

          ctx.fillStyle = result[r][c] ? INDIGO : '#d1d5db';
          ctx.font      = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(result[r][c], x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (cols * cellSize) / 2, y + rows * cellSize + 20);
    }

    // ---- step renderers ----

    function drawStep0() {
      drawBinaryGrid(30, 40, binaryImg, 42, '原始二值图像 (8×8)', undefined, undefined, null);
      drawSE(430, 60, 50, '结构元素 (十字形 3×3)');

      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 340, 640, 44);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 340, 640, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('红色圆圈标记结构元素的原点（中心）。形态学运算将 SE 滑过图像每个像素位置。', 48, 366);
    }

    function drawStep1() {
      // Check erosion condition at demo position
      var allOne = true;
      for (var sr = 0; sr < 3; sr++) {
        for (var sc = 0; sc < 3; sc++) {
          if (SE[sr][sc] === 1 && binaryImg[demoR - 1 + sr][demoC - 1 + sc] === 0) {
            allOne = false;
          }
        }
      }
      var matchColor = allOne ? '#d1fae5' : '#fee2e2';

      drawBinaryGrid(30, 40, binaryImg, 42, '腐蚀：SE 位于 (' + demoR + ',' + demoC + ')', demoR, demoC, SE, matchColor);
      drawSE(430, 60, 50, '结构元素');

      // Decision box
      ctx.fillStyle = allOne ? '#ecfdf5' : '#fef2f2';
      ctx.fillRect(430, 240, 230, 80);
      ctx.strokeStyle = allOne ? GREEN : RED;
      ctx.strokeRect(430, 240, 230, 80);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('腐蚀判定：', 445, 264);
      ctx.fillText('SE下所有1位置', 445, 284);
      ctx.fillText('是否全为1？', 445, 304);
      ctx.fillStyle = allOne ? GREEN : RED;
      ctx.font      = 'bold 16px sans-serif';
      ctx.fillText(allOne ? '→ 是, 输出 1' : '→ 否, 输出 0', 445, 324);
      ctx.font = '13px sans-serif';
    }

    function drawStep2() {
      drawResultGrid(30, 40, binaryImg, eroded, 42, '腐蚀结果 — 前景缩小', RED);

      // Show original for comparison (small)
      drawBinaryGrid(430, 40, binaryImg, 28, '原始图像（对比）', undefined, undefined, null);

      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(30, 340, 640, 44);
      ctx.strokeStyle = '#fecaca';
      ctx.strokeRect(30, 340, 640, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('红色边框标记被腐蚀掉的像素（从 1 变为 0）。前景区域整体缩小，细小突起被消除。', 48, 366);
    }

    function drawStep3() {
      // Check dilation condition at demo position
      var anyOne = false;
      for (var sr = 0; sr < 3; sr++) {
        for (var sc = 0; sc < 3; sc++) {
          if (SE[sr][sc] === 1 && binaryImg[demoR - 1 + sr][demoC - 1 + sc] === 1) {
            anyOne = true;
          }
        }
      }
      var matchColor = anyOne ? '#d1fae5' : '#fee2e2';

      drawBinaryGrid(30, 40, binaryImg, 42, '膨胀：SE 位于 (' + demoR + ',' + demoC + ')', demoR, demoC, SE, matchColor);
      drawSE(430, 60, 50, '结构元素');

      // Decision box
      ctx.fillStyle = anyOne ? '#ecfdf5' : '#fef2f2';
      ctx.fillRect(430, 240, 230, 80);
      ctx.strokeStyle = anyOne ? GREEN : RED;
      ctx.strokeRect(430, 240, 230, 80);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('膨胀判定：', 445, 264);
      ctx.fillText('SE下任一1位置', 445, 284);
      ctx.fillText('是否存在1？', 445, 304);
      ctx.fillStyle = anyOne ? GREEN : RED;
      ctx.font      = 'bold 16px sans-serif';
      ctx.fillText(anyOne ? '→ 是, 输出 1' : '→ 否, 输出 0', 445, 324);
      ctx.font = '13px sans-serif';
    }

    function drawStep4() {
      drawResultGrid(30, 40, binaryImg, dilated, 42, '膨胀结果 — 前景扩大', GREEN);
      drawBinaryGrid(430, 40, binaryImg, 28, '原始图像（对比）', undefined, undefined, null);

      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(30, 340, 640, 44);
      ctx.strokeStyle = '#a7f3d0';
      ctx.strokeRect(30, 340, 640, 44);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('绿色边框标记新增的前景像素（从 0 变为 1）。前景区域向外扩展，内部小空洞被填充。', 48, 366);
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
      reset: function () { /* stateless */ },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimationBatch([70, 71], factory);
})();
