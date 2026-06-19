(function () {
  'use strict';

  // ── Color palette ──
  var C = {
    primary: '#4f46e5', primaryL: '#6366f1',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
    grayBg: '#f9fafb', grayBorder: '#e5e7eb',
    text: '#374151', textDark: '#1f2937',
    white: '#ffffff', blue: '#3b82f6', orange: '#f97316'
  };

  // ── 8×8 original image: diagonal edge (top-left bright, bottom-right dark) ──
  var IMG = [];
  (function () {
    for (var r = 0; r < 8; r++) {
      IMG[r] = [];
      for (var c = 0; c < 8; c++) {
        var base = 200 - (r + c) * 20;
        IMG[r][c] = Math.max(30, Math.min(220, base + ((r * 3 + c * 7) % 17) - 8));
      }
    }
  })();

  // ── Operator kernels ──
  var sobelX = [[-1,0,1],[-2,0,2],[-1,0,1]];
  var sobelY = [[-1,-2,-1],[0,0,0],[1,2,1]];
  var prewX  = [[-1,0,1],[-1,0,1],[-1,0,1]];
  var prewY  = [[-1,-1,-1],[0,0,0],[1,1,1]];
  var lapK   = [[0,1,0],[1,-4,1],[0,1,0]];

  function convolve(img, kernel) {
    var out = [], r, c, kr, kc, sum, rr, cc;
    for (r = 0; r < 8; r++) {
      out[r] = [];
      for (c = 0; c < 8; c++) {
        sum = 0;
        for (kr = -1; kr <= 1; kr++) {
          for (kc = -1; kc <= 1; kc++) {
            rr = Math.min(7, Math.max(0, r + kr));
            cc = Math.min(7, Math.max(0, c + kc));
            sum += img[rr][cc] * kernel[kr + 1][kc + 1];
          }
        }
        out[r][c] = sum;
      }
    }
    return out;
  }

  function gradMag(gx, gy) {
    var out = [], r, c;
    for (r = 0; r < 8; r++) {
      out[r] = [];
      for (c = 0; c < 8; c++) {
        out[r][c] = Math.sqrt(gx[r][c] * gx[r][c] + gy[r][c] * gy[r][c]);
      }
    }
    return out;
  }

  // Precompute results
  var sobelGx = convolve(IMG, sobelX);
  var sobelGy = convolve(IMG, sobelY);
  var sobelMag = gradMag(sobelGx, sobelGy);

  var prewGx = convolve(IMG, prewX);
  var prewGy = convolve(IMG, prewY);
  var prewMag = gradMag(prewGx, prewGy);

  var lapRes = convolve(IMG, lapK);

  // ── Helpers ──
  function valColor(v, maxV) {
    var t = Math.min(1, Math.abs(v) / (maxV || 1));
    if (v >= 0) {
      var r = Math.round(79 + (255 - 79) * (1 - t));
      var g = Math.round(70 + (255 - 70) * (1 - t));
      var b = Math.round(229);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
      var rr = Math.round(239);
      var gg = Math.round(68 + (255 - 68) * (1 - t));
      var bb = Math.round(68 + (255 - 68) * (1 - t));
      return 'rgb(' + rr + ',' + gg + ',' + bb + ')';
    }
  }

  function magColor(v, maxV) {
    var t = Math.min(1, v / (maxV || 1));
    if (t < 0.25) return '#e0e7ff';
    if (t < 0.5)  return '#a5b4fc';
    if (t < 0.75) return '#6366f1';
    return '#312e81';
  }

  function grayColor(v) {
    var g = Math.round(Math.max(0, Math.min(255, v)));
    return 'rgb(' + g + ',' + g + ',' + g + ')';
  }

  function maxOf2D(arr) {
    var m = 0, r, c;
    for (r = 0; r < arr.length; r++)
      for (c = 0; c < arr[r].length; c++)
        if (Math.abs(arr[r][c]) > m) m = Math.abs(arr[r][c]);
    return m;
  }

  function drawGrid(ox, oy, cellSz, data, colorFn, showVal) {
    var r, c, v;
    for (r = 0; r < data.length; r++) {
      for (c = 0; c < data[r].length; c++) {
        v = data[r][c];
        ctx.fillStyle = colorFn(v);
        ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.strokeStyle = C.grayBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        if (showVal && cellSz >= 28) {
          ctx.fillStyle = Math.abs(v) > 100 ? '#fff' : C.textDark;
          ctx.font = (cellSz > 35 ? '11' : '9') + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(v), ox + c * cellSz + cellSz / 2, oy + r * cellSz + cellSz / 2);
        }
      }
    }
  }

  function label(x, y, txt, color, sz) {
    ctx.fillStyle = color || C.textDark;
    ctx.font = (sz || 13) + 'px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
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

  // Canny-like edge map (simplified: thin edges from Sobel)
  function cannyLike(mag) {
    var out = [], r, c, maxV = maxOf2D(mag);
    var thresh = maxV * 0.45;
    for (r = 0; r < 8; r++) {
      out[r] = [];
      for (c = 0; c < 8; c++) {
        out[r][c] = mag[r][c] > thresh ? 1 : 0;
      }
    }
    return out;
  }
  var cannyMap = cannyLike(sobelMag);

  // ── Step descriptions ──
  var stepDescriptions = [
    '原始图像：8×8灰度图像，左上角亮、右下角暗，形成对角边缘',
    'Sobel算子：使用3×3 Sobel核分别计算水平和垂直梯度，得到梯度幅值图',
    'Prewitt算子：使用3×3 Prewitt核计算梯度，与Sobel类似但权重不同',
    'Laplacian算子：使用拉普拉斯核检测二阶导数过零点，响应有正负之分',
    '综合对比：四种算子结果并列展示，对比灵敏度、抗噪性和边缘粗细'
  ];

  // ── factory ──
  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.grayBg;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 0: Original image
    function drawStep0() {
      titleBar('第1步：原始图像 — 对角边缘模式');
      var cs = 38, ox = 180, oy = 55;
      drawGrid(ox, oy, cs, IMG, function (v) { return grayColor(v); }, true);
      // Legend
      var lx = 510, ly = 80;
      ctx.fillStyle = C.textDark;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('像素值说明：', lx, ly);
      var gradW = 140, gradH = 16;
      for (var i = 0; i < gradW; i++) {
        ctx.fillStyle = grayColor(30 + (190 * i / gradW));
        ctx.fillRect(lx + i, ly + 14, 1, gradH);
      }
      ctx.fillStyle = C.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('暗(50)', lx, ly + 46);
      ctx.textAlign = 'right';
      ctx.fillText('亮(200)', lx + gradW, ly + 46);
      // Arrow indicating edge direction
      ctx.strokeStyle = C.danger;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox + 10, oy + 10);
      ctx.lineTo(ox + cs * 7 - 10, oy + cs * 7 - 10);
      ctx.stroke();
      ctx.fillStyle = C.danger;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('边缘方向 ↘', ox + cs * 4, oy + cs * 8 + 18);
    }

    // Step 1: Sobel
    function drawStep1() {
      titleBar('第2步：Sobel算子结果');
      var cs = 34, ox = 40, oy = 55;
      drawGrid(ox, oy, cs, IMG, function (v) { return grayColor(v); }, true);
      label(ox + cs * 4, oy - 12, '原始图像', C.textDark, 12);

      // Arrow
      ctx.fillStyle = C.primary;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 340, oy + cs * 4);

      var ox2 = 370;
      var maxM = maxOf2D(sobelMag);
      drawGrid(ox2, oy, cs, sobelMag, function (v) { return magColor(v, maxM); }, true);
      label(ox2 + cs * 4, oy - 12, 'Sobel梯度幅值', C.primary, 12);

      // Kernel display
      var ky = oy + cs * 8 + 22;
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Sobel X核:                    Sobel Y核:', 50, ky);
      var kernels = [sobelX, sobelY];
      var kLabels = ['Gx', 'Gy'];
      for (var k = 0; k < 2; k++) {
        var kx0 = k === 0 ? 50 : 200;
        for (var r = 0; r < 3; r++) {
          for (var c = 0; c < 3; c++) {
            ctx.fillStyle = kernels[k][r][c] > 0 ? '#dbeafe' : (kernels[k][r][c] < 0 ? '#fee2e2' : '#f3f4f6');
            ctx.fillRect(kx0 + c * 22, ky + 8 + r * 20, 20, 18);
            ctx.strokeStyle = C.grayBorder;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(kx0 + c * 22, ky + 8 + r * 20, 20, 18);
            ctx.fillStyle = C.textDark;
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(kernels[k][r][c], kx0 + c * 22 + 10, ky + 8 + r * 20 + 9);
          }
        }
      }
      // Color legend
      var lx = 420;
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('梯度幅值色阶：', lx, ky + 10);
      var colors = ['#e0e7ff', '#a5b4fc', '#6366f1', '#312e81'];
      var lbls = ['低', '', '', '高'];
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(lx + i * 36, ky + 22, 32, 14);
        if (lbls[i]) {
          ctx.fillStyle = C.text;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(lbls[i], lx + i * 36 + 16, ky + 50);
        }
      }
    }

    // Step 2: Prewitt
    function drawStep2() {
      titleBar('第3步：Prewitt算子结果');
      var cs = 34, ox = 40, oy = 55;
      drawGrid(ox, oy, cs, IMG, function (v) { return grayColor(v); }, true);
      label(ox + cs * 4, oy - 12, '原始图像', C.textDark, 12);

      ctx.fillStyle = C.primary;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 340, oy + cs * 4);

      var ox2 = 370;
      var maxM = maxOf2D(prewMag);
      drawGrid(ox2, oy, cs, prewMag, function (v) { return magColor(v, maxM); }, true);
      label(ox2 + cs * 4, oy - 12, 'Prewitt梯度幅值', C.primary, 12);

      var ky = oy + cs * 8 + 22;
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Prewitt X核:                  Prewitt Y核:', 50, ky);
      var kernels = [prewX, prewY];
      for (var k = 0; k < 2; k++) {
        var kx0 = k === 0 ? 50 : 200;
        for (var r = 0; r < 3; r++) {
          for (var c = 0; c < 3; c++) {
            ctx.fillStyle = kernels[k][r][c] > 0 ? '#dbeafe' : (kernels[k][r][c] < 0 ? '#fee2e2' : '#f3f4f6');
            ctx.fillRect(kx0 + c * 22, ky + 8 + r * 20, 20, 18);
            ctx.strokeStyle = C.grayBorder;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(kx0 + c * 22, ky + 8 + r * 20, 20, 18);
            ctx.fillStyle = C.textDark;
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(kernels[k][r][c], kx0 + c * 22 + 10, ky + 8 + r * 20 + 9);
          }
        }
      }
      // Comparison note
      ctx.fillStyle = C.warning;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('注：Prewitt算子对所有邻域像素等权加权，Sobel对中心邻域加权更大', 40, ky + 80);
    }

    // Step 3: Laplacian
    function drawStep3() {
      titleBar('第4步：Laplacian算子结果');
      var cs = 34, ox = 40, oy = 55;
      drawGrid(ox, oy, cs, IMG, function (v) { return grayColor(v); }, true);
      label(ox + cs * 4, oy - 12, '原始图像', C.textDark, 12);

      ctx.fillStyle = C.primary;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 340, oy + cs * 4);

      var ox2 = 370;
      var maxL = maxOf2D(lapRes);
      drawGrid(ox2, oy, cs, lapRes, function (v) { return valColor(v, maxL); }, true);
      label(ox2 + cs * 4, oy - 12, 'Laplacian响应', C.primary, 12);

      var ky = oy + cs * 8 + 22;
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Laplacian核:', 50, ky);
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          ctx.fillStyle = lapK[r][c] > 0 ? '#dbeafe' : (lapK[r][c] < 0 ? '#fee2e2' : '#f3f4f6');
          ctx.fillRect(140 + c * 22, ky - 8 + r * 20, 20, 18);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(140 + c * 22, ky - 8 + r * 20, 20, 18);
          ctx.fillStyle = C.textDark;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lapK[r][c], 140 + c * 22 + 10, ky - 8 + r * 20 + 9);
        }
      }

      // Legend for positive/negative
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(320, ky - 2, 16, 12);
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('正值(凸区域)', 340, ky + 6);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(320, ky + 18, 16, 12);
      ctx.fillStyle = C.text;
      ctx.fillText('负值(凹区域)', 340, ky + 26);

      ctx.fillStyle = C.warning;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('注：Laplacian是二阶导数算子，检测过零点定位边缘', 50, ky + 55);
    }

    // Step 4: Comprehensive comparison
    function drawStep4() {
      titleBar('第5步：综合对比分析');

      var cs = 18;
      var panels = [
        { name: 'Sobel', data: sobelMag, colorFn: function (v) { return magColor(v, maxOf2D(sobelMag)); } },
        { name: 'Prewitt', data: prewMag, colorFn: function (v) { return magColor(v, maxOf2D(prewMag)); } },
        { name: 'Laplacian', data: lapRes, colorFn: function (v) { return valColor(v, maxOf2D(lapRes)); } },
        { name: 'Canny', data: cannyMap, colorFn: function (v) { return v > 0 ? C.primary : '#f0f0f0'; } }
      ];

      var startX = 30, gap = 12;
      for (var p = 0; p < 4; p++) {
        var px = startX + p * (cs * 8 + gap);
        var py = 48;
        label(px + cs * 4, py, panels[p].name, C.textDark, 12);
        drawGrid(px, py + 12, cs, panels[p].data, panels[p].colorFn, false);
      }

      // Comparison table
      var tx = 40, ty = 230;
      ctx.fillStyle = C.textDark;
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('算子性能对比表', tx, ty);

      var headers = ['特性', 'Sobel', 'Prewitt', 'Laplacian', 'Canny'];
      var rows = [
        ['检测灵敏度', '★★★', '★★☆', '★★★★', '★★★★★'],
        ['抗噪能力', '★★★', '★★★', '★☆☆', '★★★★★'],
        ['边缘粗细', '较粗', '较粗', '细', '单像素'],
        ['计算复杂度', '低', '低', '低', '高'],
        ['定位精度', '中', '中', '较高', '高']
      ];

      var colW = [100, 110, 110, 110, 110];
      var rowH = 22;
      ty += 10;

      // Header row
      for (var h = 0; h < headers.length; h++) {
        var cx = tx;
        for (var j = 0; j < h; j++) cx += colW[j];
        ctx.fillStyle = C.primary;
        ctx.fillRect(cx, ty, colW[h], rowH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(headers[h], cx + colW[h] / 2, ty + rowH / 2);
      }

      // Data rows
      for (var r = 0; r < rows.length; r++) {
        var ry = ty + (r + 1) * rowH;
        for (var c = 0; c < rows[r].length; c++) {
          var cx2 = tx;
          for (var j2 = 0; j2 < c; j2++) cx2 += colW[j2];
          ctx.fillStyle = r % 2 === 0 ? '#f8fafc' : '#fff';
          if (c === 0) ctx.fillStyle = '#eef2ff';
          ctx.fillRect(cx2, ry, colW[c], rowH);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cx2, ry, colW[c], rowH);
          ctx.fillStyle = c === 0 ? C.textDark : C.text;
          ctx.font = (c === 0 ? 'bold ' : '') + '10px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(rows[r][c], cx2 + colW[c] / 2, ry + rowH / 2);
        }
      }
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

  registerAnimation(27, factory);
})();
