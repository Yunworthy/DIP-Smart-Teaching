/**
 * Geometric Correction & Image Registration Animation
 *
 * Demonstrates geometric distortion correction step-by-step:
 *   Step 0: Regular grid overlaid on image (6x6 grid)
 *   Step 1: Apply geometric distortion (barrel/pincushion), grid warps
 *   Step 2: Identify control points - corresponding point pairs
 *   Step 3: Compute affine transformation matrix (2x3)
 *   Step 4: Apply inverse mapping with bilinear interpolation
 *   Step 5: Corrected image aligned with reference, residual error
 *
 * Slider (0-100): controls distortion amount.
 *
 * Registered for KP IDs 43 (几何失真校正), 44 (图像配准).
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

  // Generate a simple test image with grid lines (6x6 blocks)
  var gridSize = 6;
  var cellPx = 8; // each grid cell is 8 pixels in our abstract image
  var imgSize = gridSize * cellPx; // 48x48 abstract image

  // Create pattern image (checkerboard with gradient)
  var patternImg = [];
  (function () {
    for (var r = 0; r < imgSize; r++) {
      patternImg[r] = [];
      for (var c = 0; c < imgSize; c++) {
        var blockR = Math.floor(r / cellPx);
        var blockC = Math.floor(c / cellPx);
        var checker = (blockR + blockC) % 2 === 0;
        var grad = Math.round(80 + (r + c) * 175 / (2 * imgSize));
        patternImg[r][c] = checker ? grad : Math.round(grad * 0.4);
      }
    }
  })();

  // Control points (in grid coordinates, 0..gridSize)
  // 4 corners + center + 4 edge midpoints = 9 points
  var controlPts = [
    [0, 0], [gridSize, 0], [0, gridSize], [gridSize, gridSize],
    [gridSize / 2, gridSize / 2],
    [gridSize / 2, 0], [gridSize / 2, gridSize],
    [0, gridSize / 2], [gridSize, gridSize / 2]
  ];

  // Barrel distortion function: r' = r * (1 + k * r^2)
  function barrelDistort(x, y, cx, cy, k) {
    var dx = x - cx;
    var dy = y - cy;
    var r2 = dx * dx + dy * dy;
    var factor = 1 + k * r2;
    return [cx + dx * factor, cy + dy * factor];
  }

  // Get distorted control points
  function getDistortedCPs(k) {
    var cx = gridSize / 2;
    var cy = gridSize / 2;
    var out = [];
    for (var i = 0; i < controlPts.length; i++) {
      var pt = barrelDistort(controlPts[i][0], controlPts[i][1], cx, cy, k);
      out.push(pt);
    }
    return out;
  }

  // Affine transformation from 3 point pairs
  // [a b tx]   [x]   [x']
  // [c d ty] * [y] = [y']
  //            [1]
  function computeAffine(src, dst) {
    // Using 3 points (first 3 non-collinear)
    var x1 = src[0][0], y1 = src[0][1], x1p = dst[0][0], y1p = dst[0][1];
    var x2 = src[1][0], y2 = src[1][1], x2p = dst[1][0], y2p = dst[1][1];
    var x3 = src[2][0], y3 = src[2][1], x3p = dst[2][0], y3p = dst[2][1];

    var det = (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
    if (Math.abs(det) < 0.0001) det = 0.0001;

    var a = ((x1p - x3p) * (y2 - y3) - (x2p - x3p) * (y1 - y3)) / det;
    var b = ((x1 - x3) * (x2p - x3p) - (x2 - x3) * (x1p - x3p)) / det;
    var tx = x1p - a * x1 - b * y1;

    var c = ((y1p - y3p) * (y2 - y3) - (y2p - y3p) * (y1 - y3)) / det;
    var d = ((x1 - x3) * (y2p - y3p) - (x2 - x3) * (y1p - y3p)) / det;
    var ty = y1p - c * x1 - d * y1;

    return [a, b, tx, c, d, ty];
  }

  function drawArrow(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color || INDIGO;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color || INDIGO;
    ctx.fill();
    ctx.lineWidth = 1;
  }

  function titleBar(txt) {
    ctx.fillStyle = INDIGO;
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 350, 18);
  }

  function drawGridOnImage(ox, oy, size, distortion, color, label) {
    var cx = gridSize / 2;
    var cy = gridSize / 2;
    var k = distortion || 0;
    var cellSz = size / gridSize;

    // Background image representation
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(ox, oy, size, size);

    // Draw grid pattern as filled cells
    for (var r = 0; r < gridSize; r++) {
      for (var c = 0; c < gridSize; c++) {
        var blockVal = patternImg[r * cellPx + 2][c * cellPx + 2];
        var g = Math.max(0, Math.min(255, blockVal));
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';

        if (Math.abs(k) > 0.001) {
          // Distorted cell corners
          var corners = [
            barrelDistort(c, r, cx, cy, k),
            barrelDistort(c + 1, r, cx, cy, k),
            barrelDistort(c + 1, r + 1, cx, cy, k),
            barrelDistort(c, r + 1, cx, cy, k)
          ];
          ctx.beginPath();
          ctx.moveTo(ox + corners[0][0] * cellSz, oy + corners[0][1] * cellSz);
          for (var ci = 1; ci < 4; ci++) {
            ctx.lineTo(ox + corners[ci][0] * cellSz, oy + corners[ci][1] * cellSz);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = color || INDIGO;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
          ctx.strokeStyle = color || INDIGO;
          ctx.lineWidth = 1;
          ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        }
      }
    }

    if (label) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, ox + size / 2, oy + size + 18);
    }
  }

  function drawControlPoints(ox, oy, size, pts, color, showLabels) {
    var cellSz = size / gridSize;
    for (var i = 0; i < pts.length; i++) {
      var px = ox + pts[i][0] * cellSz;
      var py = oy + pts[i][1] * cellSz;

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color || RED;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (showLabels) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('(' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1) + ')', px + 7, py - 2);
      }
    }
    ctx.lineWidth = 1;
  }

  var stepDescriptions = [
    '<b>步骤 1/6 — 参考网格：</b>6×6 规则网格覆盖在图像上，每个网格单元代表未失真时的坐标位置。',
    '<b>步骤 2/6 — 几何失真：</b>施加桶形/枕形畸变，网格发生弯曲变形。拖动滑块调整畸变强度。',
    '<b>步骤 3/6 — 控制点：</b>选取 9 个控制点（角点+边中点+中心），建立失真与参考之间的对应关系。',
    '<b>步骤 4/6 — 仿射变换：</b>从控制点对计算 2×3 仿射变换矩阵 <code>[a b tx; c d ty]</code>。',
    '<b>步骤 5/6 — 逆映射：</b>对每个输出像素，通过逆映射找到输入中的对应位置，双线性插值取灰度值。',
    '<b>步骤 6/6 — 校正结果：</b>校正后图像与参考对齐，显示残余误差。配准精度取决于控制点数量和分布。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Regular grid on image
    function drawStep0(sliderValue) {
      titleBar('第1步：参考网格 — 未失真坐标');

      var size = 280;
      var ox = 50, oy = 50;
      drawGridOnImage(ox, oy, size, 0, INDIGO, '参考图像（6×6 网格）');

      // Coordinate labels
      var cellSz = size / gridSize;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (var i = 0; i <= gridSize; i++) {
        ctx.fillText(i, ox + i * cellSz, oy + size + 3);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var j = 0; j <= gridSize; j++) {
        ctx.fillText(j, ox - 5, oy + j * cellSz);
      }

      // Info panel
      var ix = 380, iy = 50;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(ix, iy, 290, 280);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(ix, iy, 290, 280);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('几何失真校正流程', ix + 16, iy + 24);

      var steps = [
        '1. 建立参考网格坐标',
        '2. 施加/观测几何失真',
        '3. 选取对应控制点',
        '4. 计算变换矩阵',
        '5. 逆映射+插值校正',
        '6. 评估配准精度'
      ];
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      for (var s = 0; s < steps.length; s++) {
        ctx.fillStyle = s === 0 ? INDIGO : TEXT_COLOR;
        ctx.font = s === 0 ? 'bold 12px "Microsoft YaHei", sans-serif' : '12px "Microsoft YaHei", sans-serif';
        ctx.fillText(steps[s], ix + 20, iy + 52 + s * 24);
        if (s === 0) {
          ctx.fillStyle = INDIGO;
          ctx.fillText('\u25C0', ix + 200, iy + 52);
        }
      }

      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(ix + 10, iy + 210, 270, 55);
      ctx.strokeStyle = GREEN;
      ctx.strokeRect(ix + 10, iy + 210, 270, 55);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('应用：遥感图像校正、', ix + 24, iy + 230);
      ctx.fillText('医学图像配准、文档矫正、', ix + 24, iy + 248);
      ctx.fillText('全景拼接等。', ix + 24, iy + 262);
    }

    // Step 1: Apply distortion
    function drawStep1(sliderValue) {
      titleBar('第2步：施加几何失真');
      var k = -0.02 + sliderValue * 0.06 / 100; // -0.02 to 0.04

      var size = 240;
      var ox = 30, oy = 55;

      // Reference (undistorted)
      drawGridOnImage(ox, oy, size, 0, GREEN, '参考（未失真）');

      // Arrow
      drawArrow(ox + size + 10, oy + size / 2, ox + size + 50, oy + size / 2, AMBER);
      ctx.fillStyle = AMBER;
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('畸变', ox + size + 30, oy + size / 2 - 10);

      // Distorted
      var ox2 = ox + size + 60;
      drawGridOnImage(ox2, oy, size, k, RED, '失真图像 (k=' + k.toFixed(3) + ')');

      // Distortion type label
      var typeLabel = k < -0.005 ? '桶形畸变' : (k > 0.005 ? '枕形畸变' : '无明显畸变');
      ctx.fillStyle = RED;
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(typeLabel, ox2 + size / 2, oy + size + 36);

      // Distortion function explanation
      var ey = 330;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(30, ey, 640, 55);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(30, ey, 640, 55);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('桶形/枕形畸变模型:  x\' = x + k\u00B7(x-cx)\u00B7r\u00B2,  y\' = y + k\u00B7(y-cy)\u00B7r\u00B2', 48, ey + 20);
      ctx.fillText('其中 r\u00B2 = (x-cx)\u00B2 + (y-cy)\u00B2,  k < 0 桶形, k > 0 枕形', 48, ey + 38);
      ctx.fillText('拖动滑块调整畸变参数 k', 48, ey + 50);
    }

    // Step 2: Control points
    function drawStep2(sliderValue) {
      titleBar('第3步：选取控制点');
      var k = 0.025;

      var size = 220;
      var ox = 30, oy = 55;

      // Reference with control points
      drawGridOnImage(ox, oy, size, 0, GREEN, '参考图像控制点');
      drawControlPoints(ox, oy, size, controlPts, GREEN, true);

      // Arrow
      drawArrow(ox + size + 8, oy + size / 2, ox + size + 40, oy + size / 2, INDIGO);

      // Distorted with control points
      var ox2 = ox + size + 50;
      var distCPs = getDistortedCPs(k);
      drawGridOnImage(ox2, oy, size, k, RED, '失真图像控制点');
      drawControlPoints(ox2, oy, size, distCPs, RED, true);

      // Correspondence lines (connecting matching pairs)
      var cellSz = size / gridSize;
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (var i = 0; i < Math.min(4, controlPts.length); i++) {
        ctx.beginPath();
        ctx.moveTo(ox + controlPts[i][0] * cellSz, oy + controlPts[i][1] * cellSz);
        ctx.lineTo(ox2 + distCPs[i][0] * cellSz, oy + distCPs[i][1] * cellSz);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.lineWidth = 1;

      // Control point table
      var ty = 310;
      ctx.fillStyle = '#fff';
      ctx.fillRect(30, ty, 640, 70);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(30, ty, 640, 70);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('控制点对应表 (共 ' + controlPts.length + ' 对):', 46, ty + 16);

      ctx.font = '10px monospace';
      for (var j = 0; j < Math.min(5, controlPts.length); j++) {
        var cpx = 46 + j * 125;
        ctx.fillStyle = GREEN;
        ctx.fillText('(' + controlPts[j][0].toFixed(1) + ',' + controlPts[j][1].toFixed(1) + ')', cpx, ty + 36);
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText('\u2192', cpx + 48, ty + 36);
        ctx.fillStyle = RED;
        ctx.fillText('(' + distCPs[j][0].toFixed(2) + ',' + distCPs[j][1].toFixed(2) + ')', cpx + 62, ty + 36);
      }
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('控制点应均匀分布且覆盖整个图像区域，以提高变换估计精度。', 46, ty + 58);
    }

    // Step 3: Affine transformation matrix
    function drawStep3(sliderValue) {
      titleBar('第4步：计算仿射变换矩阵');

      var k = 0.025;
      var distCPs = getDistortedCPs(k);

      // Use first 3 non-collinear points
      var src = [distCPs[0], distCPs[1], distCPs[2]];
      var dst = [controlPts[0], controlPts[1], controlPts[2]];
      var M = computeAffine(src, dst);

      // Show matrix
      var mx = 100, my = 60;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(mx, my, 500, 140);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, 500, 140);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('仿射变换矩阵 (2×3)', 350, my + 24);
      ctx.lineWidth = 1;

      // Matrix display
      var matOx = 180, matOy = my + 40;
      var matCs = 90, matRh = 36;

      // Brackets
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(matOx - 10, matOy);
      ctx.lineTo(matOx - 16, matOy);
      ctx.lineTo(matOx - 16, matOy + 2 * matRh);
      ctx.lineTo(matOx - 10, matOy + 2 * matRh);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(matOx + 3 * matCs + 10, matOy);
      ctx.lineTo(matOx + 3 * matCs + 16, matOy);
      ctx.lineTo(matOx + 3 * matCs + 16, matOy + 2 * matRh);
      ctx.lineTo(matOx + 3 * matCs + 10, matOy + 2 * matRh);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Matrix values
      var matLabels = [
        ['a', 'b', 'tx'],
        ['c', 'd', 'ty']
      ];
      var matValues = [
        [M[0], M[1], M[2]],
        [M[3], M[4], M[5]]
      ];

      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 3; c++) {
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var label2 = matLabels[r][c];
          var val = matValues[r][c];
          ctx.fillText(val.toFixed(4), matOx + c * matCs + matCs / 2, matOy + r * matRh + matRh / 2 - 5);
          ctx.fillStyle = LIGHT_INDIGO;
          ctx.font = '10px monospace';
          ctx.fillText(label2, matOx + c * matCs + matCs / 2, matOy + r * matRh + matRh / 2 + 10);
        }
      }
      ctx.textBaseline = 'alphabetic';

      // Transformation equation
      var eqY = my + 155;
      ctx.fillStyle = '#fff';
      ctx.fillRect(100, eqY, 500, 50);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(100, eqY, 500, 50);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("x' = " + M[0].toFixed(3) + "\u00B7x + " + M[1].toFixed(3) + "\u00B7y + " + M[2].toFixed(3), 350, eqY + 20);
      ctx.fillText("y' = " + M[3].toFixed(3) + "\u00B7x + " + M[4].toFixed(3) + "\u00B7y + " + M[5].toFixed(3), 350, eqY + 40);

      // Explanation
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(100, eqY + 65, 500, 90);
      ctx.strokeStyle = GREEN;
      ctx.strokeRect(100, eqY + 65, 500, 90);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var notes = [
        '仿射变换保持平行线平行，可表示平移、旋转、缩放和错切。',
        '最少需要 3 个不共线的控制点对确定 6 个参数。',
        '多于 3 对控制点时，使用最小二乘法求解最优参数。',
        '更复杂的变形需要投影变换(4点)或多项式变换(更多点)。'
      ];
      for (var n = 0; n < notes.length; n++) {
        ctx.fillText('\u2022 ' + notes[n], 118, eqY + 85 + n * 18);
      }
    }

    // Step 4: Inverse mapping with bilinear interpolation
    function drawStep4(sliderValue) {
      titleBar('第5步：逆映射 + 双线性插值');
      var k = 0.025 * (sliderValue / 50);

      var size = 200;
      var ox = 30, oy = 55;

      // Distorted input
      drawGridOnImage(ox, oy, size, 0.025, RED, '失真输入图像');

      // Arrow
      drawArrow(ox + size + 8, oy + size / 2, ox + size + 45, oy + size / 2, INDIGO);

      // Corrected output
      var ox2 = ox + size + 55;
      drawGridOnImage(ox2, oy, size, k * 0.3, GREEN, '校正输出 (k\'=' + (k * 0.3).toFixed(3) + ')');

      // Show mapping diagram
      var my = 300;
      ctx.fillStyle = '#fff';
      ctx.fillRect(30, my, 640, 80);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(30, my, 640, 80);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('逆映射过程（对每个输出像素）:', 46, my + 18);

      // Flow: output pixel -> inverse transform -> input location -> interpolate
      var flowY = my + 40;
      var flowSteps = [
        { text: '输出像素\n(x\',y\')', color: GREEN },
        { text: '\u2192', color: TEXT_COLOR },
        { text: '逆映射\nT\u207B\u00B9(x\',y\')', color: INDIGO },
        { text: '\u2192', color: TEXT_COLOR },
        { text: '输入坐标\n(x,y) 浮点', color: AMBER },
        { text: '\u2192', color: TEXT_COLOR },
        { text: '双线性插值\n4邻域加权', color: LIGHT_INDIGO },
        { text: '\u2192', color: TEXT_COLOR },
        { text: '输出灰度值', color: GREEN }
      ];

      var fx = 46;
      for (var f = 0; f < flowSteps.length; f++) {
        ctx.fillStyle = flowSteps[f].color;
        ctx.font = flowSteps[f].text.length > 3 ? '10px "Microsoft YaHei", sans-serif' : '18px sans-serif';
        ctx.textAlign = 'left';
        var lines = flowSteps[f].text.split('\n');
        for (var li = 0; li < lines.length; li++) {
          ctx.fillText(lines[li], fx, flowY + li * 14);
        }
        fx += ctx.measureText(lines[0]).width + 12;
      }

      // Bilinear interpolation detail
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(30, my + 85, 640, 40);
      ctx.strokeStyle = AMBER;
      ctx.strokeRect(30, my + 85, 640, 40);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('双线性插值: f(x,y) = (1-a)(1-b)f00 + a(1-b)f10 + (1-a)b·f01 + ab·f11,  其中 a,b 为小数偏移量', 46, my + 104);
      ctx.fillText('相比最近邻插值，双线性插值结果更平滑，避免了块状伪影。', 46, my + 120);
    }

    // Step 5: Corrected result with residual
    function drawStep5(sliderValue) {
      titleBar('第6步：校正结果与残余误差');

      var size = 180;
      var gap = 15;

      // Original reference
      var ox = 20, oy = 55;
      drawGridOnImage(ox, oy, size, 0, GREEN, '参考图像');

      // Distorted
      var ox2 = ox + size + gap;
      drawGridOnImage(ox2, oy, size, 0.025, RED, '失真图像');

      // Corrected (nearly matches reference)
      var ox3 = ox2 + size + gap;
      drawGridOnImage(ox3, oy, size, 0.002, INDIGO, '校正结果');

      // Residual error map
      var ox4 = ox3 + size + gap;
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(ox4, oy, size, size);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(ox4, oy, size, size);

      // Show residual as color-coded error
      var cellSz = size / gridSize;
      for (var r = 0; r < gridSize; r++) {
        for (var c = 0; c < gridSize; c++) {
          // Simulated small residual
          var err = Math.abs(Math.sin(r * 1.3 + c * 0.7) * 3 + 1);
          var errColor = err < 2 ? '#d1fae5' : (err < 3 ? '#fef3c7' : '#fee2e2');
          ctx.fillStyle = errColor;
          ctx.fillRect(ox4 + c * cellSz + 1, oy + r * cellSz + 1, cellSz - 2, cellSz - 2);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(err.toFixed(1), ox4 + c * cellSz + cellSz / 2, oy + r * cellSz + cellSz / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('残余误差图', ox4 + size / 2, oy + size + 18);

      // Error color legend
      ctx.fillStyle = '#d1fae5'; ctx.fillRect(ox4, oy + size + 24, 12, 10);
      ctx.fillStyle = TEXT_COLOR; ctx.font = '9px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('<2', ox4 + 16, oy + size + 33);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(ox4 + 40, oy + size + 24, 12, 10);
      ctx.fillStyle = TEXT_COLOR; ctx.fillText('2-3', ox4 + 56, oy + size + 33);
      ctx.fillStyle = '#fee2e2'; ctx.fillRect(ox4 + 86, oy + size + 24, 12, 10);
      ctx.fillStyle = TEXT_COLOR; ctx.fillText('>3', ox4 + 102, oy + size + 33);

      // Summary
      var sy = 290;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(20, sy, 660, 95);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(20, sy, 660, 95);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('几何校正/图像配准总结', 36, sy + 20);

      ctx.font = '12px "Microsoft YaHei", sans-serif';
      var summary = [
        '\u2022 控制点数量决定可估计的变换复杂度：3点=仿射，4点=投影，更多=多项式',
        '\u2022 双线性插值在精度和计算量之间取得良好平衡',
        '\u2022 残余误差来源：控制点定位误差、模型不匹配、插值近似',
        '\u2022 图像配准 = 寻找变换使两幅图像对齐，广泛应用于多模态融合和变化检测'
      ];
      for (var si = 0; si < summary.length; si++) {
        ctx.fillText(summary[si], 36, sy + 40 + si * 16);
      }
    }

    return {
      totalSteps: 6,
      hasSlider: true,
      sliderLabel: '畸变强度',
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
      sliderDefault: 50,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(sliderValue); break;
          case 1: drawStep1(sliderValue); break;
          case 2: drawStep2(sliderValue); break;
          case 3: drawStep3(sliderValue); break;
          case 4: drawStep4(sliderValue); break;
          case 5: drawStep5(sliderValue); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimationBatch([43, 44], factory);
})();
