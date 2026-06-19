/**
 * Convolution Operation Animation
 *
 * Demonstrates 2-D convolution (spatial filtering) step-by-step:
 *   Step 0: Show pixel grid (5×5) and kernel (3×3) side by side
 *   Step 1: Kernel positioned at top-left, highlight overlapping 3×3 region
 *   Step 2: Element-wise multiplication (9 products shown)
 *   Step 3: Sum products → write result into output grid
 *   Step 4: Kernel slides to next position, repeat
 *   Step 5: Completed output grid
 *
 * Slider: 0 = 3×3 kernel, 1 = 5×5 kernel (snaps to two positions).
 *
 * Registered for KP IDs 31, 32, 33, 34 (卷积运算 / 空间滤波).
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
  var HIGHLIGHT    = '#fef3c7'; // amber-100

  // 5×5 source image pixel values
  var imgData = [
    [10, 20, 30, 40, 50],
    [15, 25, 35, 45, 55],
    [20, 30, 40, 50, 60],
    [25, 35, 45, 55, 65],
    [30, 40, 50, 60, 70]
  ];

  // 3×3 kernel (box filter / averaging)
  var kernel3 = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];

  // 5×5 kernel (Gaussian-ish, simplified)
  var kernel5 = [
    [1,  2,  3,  2, 1],
    [2,  4,  6,  4, 2],
    [3,  6,  9,  6, 3],
    [2,  4,  6,  4, 2],
    [1,  2,  3,  2, 1]
  ];

  // Slide positions for a 3×3 kernel over a 5×5 grid → 3×3 output
  var positions3 = [
    [0,0],[0,1],[0,2],
    [1,0],[1,1],[1,2],
    [2,0],[2,1],[2,2]
  ];

  // Pre-compute outputs for 3×3 kernel
  function computeOutput(kernel, kSize) {
    var outSize = 5 - kSize + 1;
    var out = [];
    var kSum = 0;
    for (var a = 0; a < kSize; a++)
      for (var b = 0; b < kSize; b++)
        kSum += kernel[a][b];

    for (var r = 0; r < outSize; r++) {
      out[r] = [];
      for (var c = 0; c < outSize; c++) {
        var sum = 0;
        for (var kr = 0; kr < kSize; kr++)
          for (var kc = 0; kc < kSize; kc++)
            sum += imgData[r + kr][c + kc] * kernel[kr][kc];
        out[r][c] = Math.round(sum / kSum);
      }
    }
    return out;
  }

  var output3 = computeOutput(kernel3, 3);
  var output5 = computeOutput(kernel5, 5);

  var stepDescriptions = [
    '<b>步骤 1/6 — 原始数据：</b>左侧为 5×5 输入图像像素值矩阵，右侧为卷积核（滤波器）。卷积核权重之和已标注在下方，最终结果需除以该值以实现归一化。',
    '<b>步骤 2/6 — 定位卷积核：</b>将卷积核放置在输入图像的左上角，黄色高亮区域为当前覆盖的像素。卷积核将从左到右、从上到下依次滑过每个有效位置。',
    '<b>步骤 3/6 — 逐元素相乘：</b>每个覆盖像素与卷积核对应权重相乘，得到 9 个乘积（3×3 核）或 25 个乘积（5×5 核）。',
    '<b>步骤 4/6 — 求和并写入输出：</b>将所有乘积求和并除以核权重之和（归一化），结果写入输出图像对应位置。输出尺寸 = 输入尺寸 − 核尺寸 + 1。',
    '<b>步骤 5/6 — 滑动到下一个位置：</b>卷积核向右滑动一格（到达边界后换行），重复相乘-求和过程，直到覆盖所有有效位置。',
    '<b>步骤 6/6 — 卷积完成：</b>输出图像每个像素都是其邻域加权平均的结果。较大的核会产生更强的平滑效果，但输出尺寸也更小。可拖动滑块切换 3×3 与 5×5 核。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    // Track which position we are showing for step 4
    var slideIndex = 0;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // ---- drawing helpers ----

    function drawGrid(x, y, data, cellSize, label, highlightR, highlightC, hSize) {
      var rows = data.length;
      var cols = data[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var isHighlight = (highlightR !== undefined &&
                             r >= highlightR && r < highlightR + hSize &&
                             c >= highlightC && c < highlightC + hSize);
          ctx.fillStyle = isHighlight ? HIGHLIGHT : '#fff';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          ctx.fillStyle = TEXT_COLOR;
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
      ctx.fillText(label, x + (cols * cellSize) / 2, y + rows * cellSize + 20);
    }

    function drawKernel(x, y, kernel, cellSize, label) {
      var size = kernel.length;
      var kSum = 0;
      for (var r = 0; r < size; r++)
        for (var c = 0; c < size; c++) {
          ctx.fillStyle = '#eef2ff';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = INDIGO;
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          ctx.fillStyle = INDIGO;
          ctx.font      = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(kernel[r][c], x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
          kSum += kernel[r][c];
        }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label + '  (权重和=' + kSum + ')', x + (size * cellSize) / 2, y + size * cellSize + 20);
    }

    function drawProducts(x, y, img, kernel, hr, hc, cellSize) {
      var kSize = kernel.length;
      for (var r = 0; r < kSize; r++) {
        for (var c = 0; c < kSize; c++) {
          var product = img[hr + r][hc + c] * kernel[r][c];
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
          ctx.strokeStyle = AMBER;
          ctx.strokeRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font      = '11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var text = img[hr + r][hc + c] + '×' + kernel[r][c] + '=' + product;
          ctx.fillText(text, x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('逐元素相乘结果', x + (kSize * cellSize) / 2, y + kSize * cellSize + 20);
    }

    function drawSumAndOutput(x, y, img, kernel, hr, hc, outputData, cellSize) {
      var kSize = kernel.length;
      var kSum  = 0;
      var pSum  = 0;
      for (var a = 0; a < kSize; a++)
        for (var b = 0; b < kSize; b++) {
          kSum += kernel[a][b];
          pSum += img[hr + a][hc + b] * kernel[a][b];
        }
      var result = Math.round(pSum / kSum);

      // Show computation
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(x, y, 340, 50);
      ctx.strokeStyle = '#bbf7d0';
      ctx.strokeRect(x, y, 340, 50);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Σ乘积 = ' + pSum + '  ÷  权重和 ' + kSum + '  =  ' + result, x + 12, y + 30);

      // Small output grid
      var outSize = outputData.length;
      var outCellSize = 44;
      var ox = x + 370;
      var oy = y - 10;
      for (var r = 0; r < outSize; r++) {
        for (var c = 0; c < outSize; c++) {
          var filled = (r < hr + 1 && c < hc + 1) || (r === hr && c === hc);
          ctx.fillStyle = (r === hr && c === hc) ? '#d1fae5' : (filled ? '#ecfdf5' : '#fff');
          ctx.fillRect(ox + c * outCellSize, oy + r * outCellSize, outCellSize, outCellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.strokeRect(ox + c * outCellSize, oy + r * outCellSize, outCellSize, outCellSize);
          if (filled) {
            ctx.fillStyle = GREEN;
            ctx.font      = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(outputData[r][c], ox + c * outCellSize + outCellSize / 2, oy + r * outCellSize + outCellSize / 2);
          }
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('输出图像 (' + outSize + '×' + outSize + ')', ox + (outSize * outCellSize) / 2, oy + outSize * outCellSize + 20);
    }

    // ---- step renderers ----

    function drawStep0(is5) {
      var kernel = is5 ? kernel5 : kernel3;
      var kSize  = kernel.length;
      var cs     = is5 ? 40 : 48;

      drawGrid(30, 50, imgData, cs, '输入图像 (5×5)', undefined, undefined, 0);
      drawKernel(330, 50, kernel, is5 ? 40 : 52, '卷积核 (' + kSize + '×' + kSize + ')');

      // Info panel
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(30, 320, 640, 60);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(30, 320, 640, 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('卷积 = 将核在图像上滑动，对每个位置做加权求和。输出尺寸 = N − K + 1 = ' + (5 - kSize + 1), 48, 345);
      ctx.fillText('拖动下方滑块可切换 3×3 核（均值滤波）与 5×5 核（高斯近似）。', 48, 365);
    }

    function drawStep1(is5) {
      var kernel = is5 ? kernel5 : kernel3;
      var kSize  = kernel.length;
      var cs     = is5 ? 40 : 48;

      drawGrid(30, 50, imgData, cs, '输入图像 — 核定位在 (0,0)', 0, 0, kSize);
      drawKernel(380, 50, kernel, is5 ? 40 : 52, '卷积核');

      // Arrow
      ctx.strokeStyle = AMBER;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(340, 120);
      ctx.lineTo(375, 120);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(375, 120);
      ctx.lineTo(367, 114);
      ctx.lineTo(367, 126);
      ctx.closePath();
      ctx.fillStyle = AMBER;
      ctx.fill();
      ctx.lineWidth = 1;

      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(30, 320, 640, 60);
      ctx.strokeStyle = '#fecaca';
      ctx.strokeRect(30, 320, 640, 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('黄色区域 = 核当前覆盖的 ' + kSize + '×' + kSize + ' 像素块，即将进行逐元素相乘。', 48, 345);
    }

    function drawStep2(is5) {
      var kernel = is5 ? kernel5 : kernel3;
      var cs = is5 ? 50 : 62;
      drawProducts(80, 60, imgData, kernel, 0, 0, cs);
    }

    function drawStep3(is5) {
      var kernel  = is5 ? kernel5 : kernel3;
      var kSize   = kernel.length;
      var output  = is5 ? output5 : output3;
      drawSumAndOutput(30, 280, imgData, kernel, 0, 0, output, 48);

      // Also show input for context
      var cs = is5 ? 36 : 44;
      drawGrid(30, 40, imgData, cs, '输入图像', 0, 0, kSize);
      drawKernel(310, 40, kernel, is5 ? 36 : 44, '卷积核');
    }

    function drawStep4(is5) {
      var kernel  = is5 ? kernel5 : kernel3;
      var kSize   = kernel.length;
      var outSize = 5 - kSize + 1;
      var totalPos = outSize * outSize;
      slideIndex = (slideIndex + 1) % totalPos;
      var pos = positions3[slideIndex] || [0, 0];
      // For 5×5 kernel there is only 1 position
      if (is5) pos = [0, 0];

      var cs = is5 ? 40 : 48;
      drawGrid(30, 50, imgData, cs, '输入图像 — 核滑动到 (' + pos[0] + ',' + pos[1] + ')', pos[0], pos[1], kSize);
      drawKernel(380, 50, kernel, is5 ? 40 : 52, '卷积核');

      // Show progress
      var output = is5 ? output5 : output3;
      var outCellSize = 44;
      var ox = 380;
      var oy = 240;
      for (var r = 0; r < outSize; r++) {
        for (var c = 0; c < outSize; c++) {
          var idx = r * outSize + c;
          var done = idx <= slideIndex;
          ctx.fillStyle = done ? '#d1fae5' : '#fff';
          ctx.fillRect(ox + c * outCellSize, oy + r * outCellSize, outCellSize, outCellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.strokeRect(ox + c * outCellSize, oy + r * outCellSize, outCellSize, outCellSize);
          if (done) {
            ctx.fillStyle = GREEN;
            ctx.font      = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(output[r][c], ox + c * outCellSize + outCellSize / 2, oy + r * outCellSize + outCellSize / 2);
          }
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('输出图像（填充进度 ' + (slideIndex + 1) + '/' + totalPos + '）', ox + (outSize * outCellSize) / 2, oy + outSize * outCellSize + 20);
    }

    function drawStep5(is5) {
      var kernel  = is5 ? kernel5 : kernel3;
      var kSize   = kernel.length;
      var output  = is5 ? output5 : output3;
      var outSize = output.length;
      var cs      = 48;

      // Input
      drawGrid(30, 40, imgData, 44, '输入图像 (5×5)', undefined, undefined, 0);

      // Output
      var ox = 380;
      var oy = 40;
      for (var r = 0; r < outSize; r++) {
        for (var c = 0; c < outSize; c++) {
          ctx.fillStyle = '#d1fae5';
          ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          ctx.strokeStyle = GREEN;
          ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);

          ctx.fillStyle = '#065f46';
          ctx.font      = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(output[r][c], ox + c * cs + cs / 2, oy + r * cs + cs / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('输出图像 (' + outSize + '×' + outSize + ')', ox + (outSize * cs) / 2, oy + outSize * cs + 20);

      // Info
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(30, 320, 640, 60);
      ctx.strokeStyle = '#a7f3d0';
      ctx.strokeRect(30, 320, 640, 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font      = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('卷积完成。' + kSize + '×' + kSize + ' 核将每个像素替换为其邻域的加权平均，实现了空间域滤波。', 48, 345);
      ctx.fillText('输出尺寸 ' + outSize + '×' + outSize + '（比输入小 ' + (kSize - 1) + ' 像素），可通过 padding 保持尺寸不变。', 48, 365);
    }

    return {
      totalSteps: 6,
      hasSlider: true,
      sliderLabel: '核大小',
      sliderMin: 0,
      sliderMax: 1,
      sliderStep: 1,
      sliderDefault: 0,
      draw: function (step, sliderValue) {
        clear();
        var is5 = (sliderValue >= 1);
        slideIndex = 0;
        switch (step) {
          case 0: drawStep0(is5); break;
          case 1: drawStep1(is5); break;
          case 2: drawStep2(is5); break;
          case 3: drawStep3(is5); break;
          case 4: drawStep4(is5); break;
          case 5: drawStep5(is5); break;
        }
      },
      reset: function () { slideIndex = 0; },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimationBatch([31, 32, 33, 34], factory);
  window.__convFactory = factory;
})();
