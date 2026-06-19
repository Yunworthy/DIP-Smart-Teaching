(function () {
  // ========== Helpers ==========

  var COLOR = {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    success: '#10b981',
    successLight: '#34d399',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    gray: '#6b7280',
    grayLight: '#e5e7eb',
    grayBg: '#f3f4f6',
    textDark: '#1f2937',
    textMed: '#4b5563',
    textLight: '#9ca3af',
    bright: '#facc15',
    dark: '#1e3a5f'
  };

  // 6x6 grayscale image: left half bright (~200), right half dark (~50)
  var IMG = [
    [200, 200, 195, 55, 50, 50],
    [205, 200, 190, 50, 45, 50],
    [200, 195, 185, 60, 50, 55],
    [195, 200, 190, 55, 50, 50],
    [200, 205, 200, 50, 55, 50],
    [198, 200, 195, 55, 50, 55]
  ];

  var SOBEL_X = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  var SOBEL_Y = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  // Convolve a 3x3 kernel at position (r, c) in the image
  function convolve(kernel, r, c) {
    var sum = 0;
    for (var kr = 0; kr < 3; kr++) {
      for (var kc = 0; kc < 3; kc++) {
        var ir = r + kr;
        var ic = c + kc;
        sum += IMG[ir][ic] * kernel[kr][kc];
      }
    }
    return sum;
  }

  // Build full gradient magnitude map for a 4x4 result (positions 0..3, 0..3)
  function buildGradientMap() {
    var map = [];
    for (var r = 0; r < 4; r++) {
      map[r] = [];
      for (var c = 0; c < 4; c++) {
        var gx = convolve(SOBEL_X, r, c);
        var gy = convolve(SOBEL_Y, r, c);
        map[r][c] = Math.round(Math.sqrt(gx * gx + gy * gy));
      }
    }
    return map;
  }

  function drawCell(ctx, x, y, w, h, text, bgColor, textColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    if (text !== undefined && text !== null) {
      ctx.fillStyle = textColor || '#1f2937';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(text), x + w / 2, y + h / 2);
    }
  }

  function drawGrid(ctx, ox, oy, cellSize, rows, cols, values, highlights, colorFn) {
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var val = values[r][c];
        var bg = '#fff';
        var txt = '#1f2937';
        if (colorFn) {
          var info = colorFn(val, r, c);
          bg = info.bg;
          txt = info.text;
        }
        var isHighlighted = highlights && highlights.some(function (h) { return h[0] === r && h[1] === c; });
        if (isHighlighted) {
          bg = '#fef08a'; // yellow highlight
          txt = '#1f2937';
        }
        drawCell(ctx, ox + c * cellSize, oy + r * cellSize, cellSize, cellSize, val, bg, txt);
      }
    }
  }

  function drawKernel(ctx, ox, oy, cellSize, kernel, title) {
    ctx.fillStyle = COLOR.textDark;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + 1.5 * cellSize, oy - 6);

    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var v = kernel[r][c];
        var bg = v > 0 ? '#dbeafe' : v < 0 ? '#fee2e2' : '#f9fafb';
        var txt = '#1f2937';
        drawCell(ctx, ox + c * cellSize, oy + r * cellSize, cellSize, cellSize, v, bg, txt);
      }
    }
  }

  function drawTitle(ctx, text, x, y) {
    ctx.fillStyle = COLOR.textDark;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function drawStepHeader(ctx, step, totalSteps) {
    ctx.fillStyle = COLOR.grayBg;
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = COLOR.primary;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('步骤 ' + (step + 1) + ' / ' + totalSteps, 16, 18);
  }

  // Color function for original image: bright = yellow-white, dark = dark blue-gray
  function imgColorFn(val) {
    if (val >= 150) {
      return { bg: '#fef9c3', text: '#78350f' };
    } else {
      return { bg: '#1e3a5f', text: '#e5e7eb' };
    }
  }

  // Color function for gradient map: high gradient = red
  function gradColorFn(val) {
    if (val >= 300) {
      return { bg: '#ef4444', text: '#fff' };
    } else if (val >= 150) {
      return { bg: '#fca5a5', text: '#7f1d1d' };
    } else {
      return { bg: '#fee2e2', text: '#7f1d1d' };
    }
  }

  // ========== KP60: Overview of edge detection ==========
  registerAnimation(60, function (canvas, ctx) {
    var totalSteps = 5;
    var descriptions = [
      '原始灰度图像（6×6）：左侧为亮区（~200），右侧为暗区（~50），中间存在明显边缘',
      'Sobel 算子：两个 3×3 卷积核，分别检测水平和垂直方向的边缘',
      '水平方向卷积 Gx：在中心位置应用 Sobel-X 核，计算元素乘积之和',
      '垂直方向卷积 Gy：在相同位置应用 Sobel-Y 核，计算元素乘积之和',
      '梯度幅值 |G| = √(Gx² + Gy²)：边缘处梯度值大，清晰显示边缘位置'
    ];

    return {
      totalSteps: totalSteps,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        if (step === 0) {
          // Show original image grid
          drawTitle(ctx, '原始灰度图像 (6×6)', 30, 50);
          var cs = 56;
          var ox = 80, oy = 80;
          drawGrid(ctx, ox, oy, cs, 6, 6, IMG, null, imgColorFn);
          // Labels
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('亮区（背景）', ox + 1.5 * cs, oy + 6 * cs + 20);
          ctx.fillText('暗区（前景）', ox + 4.5 * cs, oy + 6 * cs + 20);
          // Arrow at edge
          ctx.strokeStyle = COLOR.danger;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + 3 * cs, oy);
          ctx.lineTo(ox + 3 * cs, oy + 6 * cs);
          ctx.stroke();
          ctx.fillStyle = COLOR.danger;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('← 边缘 →', ox + 3 * cs + 4, oy + 6 * cs + 38);
        } else if (step === 1) {
          // Show Sobel kernels
          drawTitle(ctx, 'Sobel 边缘检测算子', 30, 50);
          var cs = 60;
          drawKernel(ctx, 80, 110, cs, SOBEL_X, 'Sobel-X（水平方向 Gx）');
          drawKernel(ctx, 420, 110, cs, SOBEL_Y, 'Sobel-Y（垂直方向 Gy）');
          // Explanation
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          var explanations = [
            'Sobel 算子通过两个 3×3 卷积核分别检测水平和垂直方向的亮度变化。',
            '• Gx 核（左）：对垂直边缘敏感，检测左右亮度差',
            '• Gy 核（右）：对水平边缘敏感，检测上下亮度差',
            '• 蓝色 = 正值，红色 = 负值，白色 = 零'
          ];
          for (var i = 0; i < explanations.length; i++) {
            ctx.fillText(explanations[i], 80, 310 + i * 22);
          }
        } else if (step === 2) {
          // Apply Gx at position (1,1)
          drawTitle(ctx, '水平卷积 Gx：逐元素相乘求和', 30, 50);
          var cs = 52;
          var ox = 30, oy = 85;
          // Show image region (rows 1-3, cols 1-3)
          var region = [[IMG[1][1], IMG[1][2], IMG[1][3]], [IMG[2][1], IMG[2][2], IMG[2][3]], [IMG[3][1], IMG[3][2], IMG[3][3]]];
          drawTitle(ctx, '图像区域:', ox, oy - 18);
          drawGrid(ctx, ox, oy, cs, 3, 3, region, null, imgColorFn);

          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('×', ox + 3 * cs + 20, oy + 1.5 * cs);

          var kx = ox + 3 * cs + 50;
          drawTitle(ctx, 'Sobel-X:', kx, oy - 18);
          drawGrid(ctx, kx, oy, cs, 3, 3, SOBEL_X);

          // Show multiplication results
          var mx = 30, my = oy + 3 * cs + 40;
          drawTitle(ctx, '逐元素乘积:', mx, my);
          my += 22;
          var products = [];
          var total = 0;
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * SOBEL_X[r][c];
              total += products[r][c];
            }
          }
          drawGrid(ctx, mx, my, cs, 3, 3, products);
          // Sum
          ctx.fillStyle = COLOR.primary;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Gx = 各项之和 = ' + total, mx, my + 3 * cs + 12);
        } else if (step === 3) {
          // Apply Gy at position (1,1)
          drawTitle(ctx, '垂直卷积 Gy：逐元素相乘求和', 30, 50);
          var cs = 52;
          var ox = 30, oy = 85;
          var region = [[IMG[1][1], IMG[1][2], IMG[1][3]], [IMG[2][1], IMG[2][2], IMG[2][3]], [IMG[3][1], IMG[3][2], IMG[3][3]]];
          drawTitle(ctx, '图像区域:', ox, oy - 18);
          drawGrid(ctx, ox, oy, cs, 3, 3, region, null, imgColorFn);

          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('×', ox + 3 * cs + 20, oy + 1.5 * cs);

          var kx = ox + 3 * cs + 50;
          drawTitle(ctx, 'Sobel-Y:', kx, oy - 18);
          drawGrid(ctx, kx, oy, cs, 3, 3, SOBEL_Y);

          var mx = 30, my = oy + 3 * cs + 40;
          drawTitle(ctx, '逐元素乘积:', mx, my);
          my += 22;
          var products = [];
          var total = 0;
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * SOBEL_Y[r][c];
              total += products[r][c];
            }
          }
          drawGrid(ctx, mx, my, cs, 3, 3, products);
          ctx.fillStyle = COLOR.success;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Gy = 各项之和 = ' + total, mx, my + 3 * cs + 12);
        } else if (step === 4) {
          // Gradient magnitude map
          drawTitle(ctx, '梯度幅值图 |G| = √(Gx² + Gy²)', 30, 50);
          var gmap = buildGradientMap();
          var cs = 60;
          var ox = 40, oy = 90;
          drawGrid(ctx, ox, oy, cs, 4, 4, gmap, null, gradColorFn);

          // Show one example calculation
          var gx = convolve(SOBEL_X, 1, 1);
          var gy = convolve(SOBEL_Y, 1, 1);
          var mag = Math.round(Math.sqrt(gx * gx + gy * gy));
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          var ex = ox + 4 * cs + 40;
          ctx.fillText('示例（位置 1,1）：', ex, oy + 10);
          ctx.fillText('Gx = ' + gx, ex, oy + 36);
          ctx.fillText('Gy = ' + gy, ex, oy + 60);
          ctx.fillText('|G| = √(' + gx + '²+' + gy + '²)', ex, oy + 88);
          ctx.fillStyle = COLOR.danger;
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('= ' + mag, ex, oy + 114);

          // Explanation
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.fillText('红色区域 = 高梯度值', ex, oy + 160);
          ctx.fillText('→ 此处存在明显的', ex, oy + 182);
          ctx.fillText('   亮度突变（边缘）', ex, oy + 204);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });

  // ========== KP61: Sobel edge detection ==========
  registerAnimation(61, function (canvas, ctx) {
    var totalSteps = 5;
    var descriptions = [
      '原始灰度图像（6×6），模拟含有垂直边缘的图像区域',
      'Sobel 算子定义：Gx 检测垂直边缘，Gy 检测水平边缘',
      '水平方向梯度 Gx 的计算过程',
      '垂直方向梯度 Gy 的计算过程',
      '完整梯度幅值图，红色高亮区域即为检测到的边缘'
    ];

    return {
      totalSteps: totalSteps,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        if (step === 0) {
          drawTitle(ctx, '原始灰度图像 (6×6)', 30, 50);
          var cs = 56;
          var ox = 80, oy = 80;
          drawGrid(ctx, ox, oy, cs, 6, 6, IMG, null, imgColorFn);
          // Annotate brightness
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('黄色 = 亮度 ~200（背景）', ox, oy + 6 * cs + 25);
          ctx.fillText('深蓝 = 亮度 ~50（前景）', ox, oy + 6 * cs + 48);
          // Edge line
          ctx.strokeStyle = COLOR.danger;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(ox + 3 * cs, oy - 5);
          ctx.lineTo(ox + 3 * cs, oy + 6 * cs + 5);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = COLOR.danger;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('垂直边缘', ox + 3 * cs, oy - 14);
        } else if (step === 1) {
          drawTitle(ctx, 'Sobel 卷积核', 30, 50);
          var cs = 64;
          drawKernel(ctx, 60, 100, cs, SOBEL_X, 'Gx（检测垂直边缘）');
          drawKernel(ctx, 400, 100, cs, SOBEL_Y, 'Gy（检测水平边缘）');
          // Formula
          ctx.fillStyle = COLOR.textDark;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('梯度幅值: |G| = √(Gx² + Gy²)', 350, 310);
          ctx.fillText('梯度方向: θ = arctan(Gy / Gx)', 350, 336);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.fillText('Sobel 算子对图像中的水平和垂直亮度变化非常敏感', 350, 370);
        } else if (step === 2) {
          drawTitle(ctx, 'Gx 计算（位置 r=1, c=2）', 30, 50);
          var cs = 54;
          var region = [[IMG[1][2], IMG[1][3], IMG[1][4]], [IMG[2][2], IMG[2][3], IMG[2][4]], [IMG[3][2], IMG[3][3], IMG[3][4]]];
          drawTitle(ctx, '图像窗口:', 30, 82);
          drawGrid(ctx, 30, 95, cs, 3, 3, region, null, imgColorFn);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('*', 30 + 3 * cs + 18, 95 + 1.5 * cs);
          var kx = 30 + 3 * cs + 40;
          drawKernel(ctx, kx, 95, cs, SOBEL_X, 'Gx 核');
          // Products
          var total = 0;
          var products = [];
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * SOBEL_X[r][c];
              total += products[r][c];
            }
          }
          drawTitle(ctx, '乘积结果:', 30, 285);
          drawGrid(ctx, 30, 300, cs, 3, 3, products);
          ctx.fillStyle = COLOR.primary;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Gx = ' + total, 30 + 3 * cs + 30, 340);
        } else if (step === 3) {
          drawTitle(ctx, 'Gy 计算（位置 r=1, c=2）', 30, 50);
          var cs = 54;
          var region = [[IMG[1][2], IMG[1][3], IMG[1][4]], [IMG[2][2], IMG[2][3], IMG[2][4]], [IMG[3][2], IMG[3][3], IMG[3][4]]];
          drawTitle(ctx, '图像窗口:', 30, 82);
          drawGrid(ctx, 30, 95, cs, 3, 3, region, null, imgColorFn);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('*', 30 + 3 * cs + 18, 95 + 1.5 * cs);
          var kx = 30 + 3 * cs + 40;
          drawKernel(ctx, kx, 95, cs, SOBEL_Y, 'Gy 核');
          var total = 0;
          var products = [];
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * SOBEL_Y[r][c];
              total += products[r][c];
            }
          }
          drawTitle(ctx, '乘积结果:', 30, 285);
          drawGrid(ctx, 30, 300, cs, 3, 3, products);
          ctx.fillStyle = COLOR.success;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Gy = ' + total, 30 + 3 * cs + 30, 340);
        } else if (step === 4) {
          drawTitle(ctx, 'Sobel 边缘检测结果', 30, 50);
          var gmap = buildGradientMap();
          var cs = 64;
          var ox = 30, oy = 85;
          drawGrid(ctx, ox, oy, cs, 4, 4, gmap, null, gradColorFn);
          // Highlight edge column
          ctx.strokeStyle = COLOR.danger;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.strokeRect(ox + 1 * cs, oy, cs, 4 * cs);
          ctx.setLineDash([]);

          var ex = ox + 4 * cs + 30;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('检测结果:', ex, oy + 10);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.fillText('• 第2列梯度值最大', ex, oy + 38);
          ctx.fillText('  → 检测到垂直边缘', ex, oy + 60);
          ctx.fillText('• 红色方框 = 边缘位置', ex, oy + 90);
          // Show max value
          var maxVal = 0;
          for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
              if (gmap[r][c] > maxVal) maxVal = gmap[r][c];
            }
          }
          ctx.fillStyle = COLOR.danger;
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText('最大梯度值: ' + maxVal, ex, oy + 130);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '13px sans-serif';
          ctx.fillText('梯度越大，边缘越明显', ex, oy + 158);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });

  // ========== KP62: Prewitt edge detection ==========
  registerAnimation(62, function (canvas, ctx) {
    var totalSteps = 5;
    var descriptions = [
      '原始灰度图像（6×6），用于演示 Prewitt 边缘检测',
      'Prewitt 算子与 Sobel 类似，但权重均匀分布',
      'Prewitt Gx 卷积过程',
      'Prewitt Gy 卷积过程',
      'Prewitt 梯度幅值图，边缘位置被标记'
    ];

    var PREWITT_X = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1]
    ];

    var PREWITT_Y = [
      [-1, -1, -1],
      [0, 0, 0],
      [1, 1, 1]
    ];

    function convolvePrewitt(kernel, r, c) {
      var sum = 0;
      for (var kr = 0; kr < 3; kr++) {
        for (var kc = 0; kc < 3; kc++) {
          sum += IMG[r + kr][c + kc] * kernel[kr][kc];
        }
      }
      return sum;
    }

    function buildPrewittGradMap() {
      var map = [];
      for (var r = 0; r < 4; r++) {
        map[r] = [];
        for (var c = 0; c < 4; c++) {
          var gx = convolvePrewitt(PREWITT_X, r, c);
          var gy = convolvePrewitt(PREWITT_Y, r, c);
          map[r][c] = Math.round(Math.sqrt(gx * gx + gy * gy));
        }
      }
      return map;
    }

    return {
      totalSteps: totalSteps,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        if (step === 0) {
          drawTitle(ctx, '原始灰度图像 (6×6)', 30, 50);
          var cs = 56;
          var ox = 80, oy = 80;
          drawGrid(ctx, ox, oy, cs, 6, 6, IMG, null, imgColorFn);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Prewitt 算子与 Sobel 类似，用于边缘检测。', 80, oy + 6 * cs + 25);
          ctx.fillText('区别在于卷积核权重为均匀分布（无中心加权）。', 80, oy + 6 * cs + 48);
        } else if (step === 1) {
          drawTitle(ctx, 'Prewitt 卷积核', 30, 50);
          var cs = 64;
          drawKernel(ctx, 60, 100, cs, PREWITT_X, 'Prewitt-X（水平方向）');
          drawKernel(ctx, 400, 100, cs, PREWITT_Y, 'Prewitt-Y（垂直方向）');
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Prewitt 核的每行/列权重相同，不区分远近像素', 350, 310);
          ctx.fillText('对比 Sobel：Sobel 核中心行/列权重为 2，Prewitt 均为 1', 350, 336);
          ctx.fillText('因此 Sobel 对噪声更鲁棒', 350, 362);
        } else if (step === 2) {
          drawTitle(ctx, 'Prewitt Gx 计算（位置 r=1, c=2）', 30, 50);
          var cs = 54;
          var region = [[IMG[1][2], IMG[1][3], IMG[1][4]], [IMG[2][2], IMG[2][3], IMG[2][4]], [IMG[3][2], IMG[3][3], IMG[3][4]]];
          drawTitle(ctx, '图像窗口:', 30, 82);
          drawGrid(ctx, 30, 95, cs, 3, 3, region, null, imgColorFn);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('*', 30 + 3 * cs + 18, 95 + 1.5 * cs);
          var kx = 30 + 3 * cs + 40;
          drawKernel(ctx, kx, 95, cs, PREWITT_X, 'Prewitt-X');
          var total = 0;
          var products = [];
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * PREWITT_X[r][c];
              total += products[r][c];
            }
          }
          drawTitle(ctx, '乘积结果:', 30, 285);
          drawGrid(ctx, 30, 300, cs, 3, 3, products);
          ctx.fillStyle = COLOR.primary;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Prewitt Gx = ' + total, 30 + 3 * cs + 30, 340);
        } else if (step === 3) {
          drawTitle(ctx, 'Prewitt Gy 计算（位置 r=1, c=2）', 30, 50);
          var cs = 54;
          var region = [[IMG[1][2], IMG[1][3], IMG[1][4]], [IMG[2][2], IMG[2][3], IMG[2][4]], [IMG[3][2], IMG[3][3], IMG[3][4]]];
          drawTitle(ctx, '图像窗口:', 30, 82);
          drawGrid(ctx, 30, 95, cs, 3, 3, region, null, imgColorFn);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('*', 30 + 3 * cs + 18, 95 + 1.5 * cs);
          var kx = 30 + 3 * cs + 40;
          drawKernel(ctx, kx, 95, cs, PREWITT_Y, 'Prewitt-Y');
          var total = 0;
          var products = [];
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * PREWITT_Y[r][c];
              total += products[r][c];
            }
          }
          drawTitle(ctx, '乘积结果:', 30, 285);
          drawGrid(ctx, 30, 300, cs, 3, 3, products);
          ctx.fillStyle = COLOR.success;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Prewitt Gy = ' + total, 30 + 3 * cs + 30, 340);
        } else if (step === 4) {
          drawTitle(ctx, 'Prewitt 边缘检测结果', 30, 50);
          var gmap = buildPrewittGradMap();
          var cs = 64;
          var ox = 30, oy = 85;
          drawGrid(ctx, ox, oy, cs, 4, 4, gmap, null, gradColorFn);
          ctx.strokeStyle = COLOR.danger;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.strokeRect(ox + 1 * cs, oy, cs, 4 * cs);
          ctx.setLineDash([]);
          var ex = ox + 4 * cs + 30;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Prewitt 检测结果:', ex, oy + 10);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.fillText('• 边缘位置清晰可辨', ex, oy + 38);
          ctx.fillText('• 梯度值略低于 Sobel', ex, oy + 60);
          ctx.fillText('  （无中心加权效应）', ex, oy + 82);
          ctx.fillText('• 红色方框 = 边缘列', ex, oy + 110);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });

  // ========== KP63: Laplacian edge detection ==========
  registerAnimation(63, function (canvas, ctx) {
    var totalSteps = 5;
    var descriptions = [
      '原始灰度图像（6×6），用于演示 Laplacian 边缘检测',
      'Laplacian 算子：二阶微分算子，检测所有方向的边缘',
      'Laplacian 卷积计算过程',
      'Laplacian 响应图：正值和负值表示边缘方向',
      '结合 Sobel 和 Laplacian 的综合边缘检测结果'
    ];

    var LAPLACIAN = [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0]
    ];

    var LAPLACIAN_DIAG = [
      [1, 1, 1],
      [1, -8, 1],
      [1, 1, 1]
    ];

    function convolveLap(kernel, r, c) {
      var sum = 0;
      for (var kr = 0; kr < 3; kr++) {
        for (var kc = 0; kc < 3; kc++) {
          sum += IMG[r + kr][c + kc] * kernel[kr][kc];
        }
      }
      return sum;
    }

    function buildLaplacianMap(kernel) {
      var map = [];
      for (var r = 0; r < 4; r++) {
        map[r] = [];
        for (var c = 0; c < 4; c++) {
          map[r][c] = convolveLap(kernel, r, c);
        }
      }
      return map;
    }

    function lapColorFn(val) {
      var abs = Math.abs(val);
      if (abs >= 400) {
        return { bg: val > 0 ? '#ef4444' : '#3b82f6', text: '#fff' };
      } else if (abs >= 200) {
        return { bg: val > 0 ? '#fca5a5' : '#93c5fd', text: '#1f2937' };
      } else {
        return { bg: '#f3f4f6', text: '#6b7280' };
      }
    }

    return {
      totalSteps: totalSteps,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawStepHeader(ctx, step, totalSteps);

        if (step === 0) {
          drawTitle(ctx, '原始灰度图像 (6×6)', 30, 50);
          var cs = 56;
          var ox = 80, oy = 80;
          drawGrid(ctx, ox, oy, cs, 6, 6, IMG, null, imgColorFn);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Laplacian 是二阶微分算子，对边缘的"突变点"更敏感。', 80, oy + 6 * cs + 25);
          ctx.fillText('它检测的是亮度变化的"拐点"而非"斜率"。', 80, oy + 6 * cs + 48);
        } else if (step === 1) {
          drawTitle(ctx, 'Laplacian 算子', 30, 50);
          var cs = 64;
          drawKernel(ctx, 80, 100, cs, LAPLACIAN, '4-邻域 Laplacian');
          drawKernel(ctx, 400, 100, cs, LAPLACIAN_DIAG, '8-邻域 Laplacian');
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Laplacian 是各向同性算子，对所有方向边缘响应相同', 350, 310);
          ctx.fillText('中心系数为负，表示与周围像素的差异', 350, 336);
          ctx.fillText('在均匀区域响应接近零，在边缘处产生过零点', 350, 362);
        } else if (step === 2) {
          drawTitle(ctx, 'Laplacian 卷积计算（位置 r=1, c=2）', 30, 50);
          var cs = 54;
          var region = [[IMG[1][2], IMG[1][3], IMG[1][4]], [IMG[2][2], IMG[2][3], IMG[2][4]], [IMG[3][2], IMG[3][3], IMG[3][4]]];
          drawTitle(ctx, '图像窗口:', 30, 82);
          drawGrid(ctx, 30, 95, cs, 3, 3, region, null, imgColorFn);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('*', 30 + 3 * cs + 18, 95 + 1.5 * cs);
          var kx = 30 + 3 * cs + 40;
          drawKernel(ctx, kx, 95, cs, LAPLACIAN, 'Laplacian');
          var total = 0;
          var products = [];
          for (var r = 0; r < 3; r++) {
            products[r] = [];
            for (var c = 0; c < 3; c++) {
              products[r][c] = region[r][c] * LAPLACIAN[r][c];
              total += products[r][c];
            }
          }
          drawTitle(ctx, '乘积结果:', 30, 285);
          drawGrid(ctx, 30, 300, cs, 3, 3, products);
          ctx.fillStyle = COLOR.primary;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Laplacian = ' + total, 30 + 3 * cs + 30, 340);
        } else if (step === 3) {
          drawTitle(ctx, 'Laplacian 响应图', 30, 50);
          var lmap = buildLaplacianMap(LAPLACIAN);
          var cs = 64;
          var ox = 30, oy = 85;
          drawGrid(ctx, ox, oy, cs, 4, 4, lmap, null, lapColorFn);
          var ex = ox + 4 * cs + 30;
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Laplacian 响应:', ex, oy + 10);
          ctx.fillStyle = '#ef4444';
          ctx.fillText('红色 = 正值（亮→暗）', ex, oy + 38);
          ctx.fillStyle = '#3b82f6';
          ctx.fillText('蓝色 = 负值（暗→亮）', ex, oy + 62);
          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.fillText('灰色 = 接近零（均匀区）', ex, oy + 88);
          ctx.fillText('边缘处出现"过零点"', ex, oy + 118);
          ctx.fillText('（正负值之间）', ex, oy + 140);
        } else if (step === 4) {
          drawTitle(ctx, '综合边缘检测对比', 30, 50);
          var sobelMap = buildGradientMap();
          var lapMap = buildLaplacianMap(LAPLACIAN_DIAG);

          var cs = 48;
          var ox1 = 30, oy1 = 90;
          var ox2 = 360, oy2 = 90;

          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Sobel 梯度幅值', ox1 + 2 * cs, oy1 - 10);
          drawGrid(ctx, ox1, oy1, cs, 4, 4, sobelMap, null, gradColorFn);

          ctx.fillText('|Laplacian| 绝对值', ox2 + 2 * cs, oy2 - 10);
          var lapAbs = lapMap.map(function (row) { return row.map(Math.abs); });
          drawGrid(ctx, ox2, oy2, cs, 4, 4, lapAbs, null, gradColorFn);

          ctx.fillStyle = COLOR.textMed;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Sobel: 一阶导数，响应边缘的"坡度"', 180, 310);
          ctx.fillText('Laplacian: 二阶导数，响应边缘的"拐点"', 500, 310);
          ctx.fillStyle = COLOR.textDark;
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('两者结合可获得更精确的边缘检测结果', 350, 360);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });
})();
