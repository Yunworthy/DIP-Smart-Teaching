(function () {
  var INDIGO = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN = '#10b981';
  var RED = '#ef4444';
  var AMBER = '#f59e0b';
  var GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db';
  var TEXT_COLOR = '#374151';

  // 5x5 input image with edge pattern
  var INPUT = [
    [100, 100, 100, 180, 180],
    [100, 120, 100, 180, 180],
    [100, 100, 100, 180, 180],
    [100, 100, 120, 180, 160],
    [100, 100, 100, 180, 180]
  ];

  var KERNELS = [
    { name: '\u5355\u4F4D\u6838 (Identity)', matrix: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], desc: '\u8F93\u51FA\u4E0E\u8F93\u5165\u5B8C\u5168\u76F8\u540C' },
    { name: '\u8FB9\u7F18\u68C0\u6D4B\u6838', matrix: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], desc: '\u68C0\u6D4B\u6240\u6709\u65B9\u5411\u7684\u8FB9\u7F18' },
    { name: '\u9510\u5316\u6838 (Sharpen)', matrix: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], desc: '\u589E\u5F3A\u4E2D\u5FC3\u50CF\u7D20\uFF0C\u9510\u5316\u56FE\u50CF' },
    { name: '\u6D6E\u96D5\u6838 (Emboss)', matrix: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], desc: '\u4EA7\u751F\u6D6E\u96D5/\u7ACB\u4F53\u6548\u679C' }
  ];

  function convolve(input, kernel) {
    var out = [];
    for (var r = 0; r < 5; r++) {
      out[r] = [];
      for (var c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4) {
          out[r][c] = input[r][c];
        } else {
          var sum = 0;
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              sum += input[r + dr][c + dc] * kernel[dr + 1][dc + 1];
            }
          }
          out[r][c] = sum;
        }
      }
    }
    return out;
  }

  function valToGray(v) {
    v = Math.max(0, Math.min(255, Math.round(v)));
    var hex = v.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    return '#' + hex + hex + hex;
  }

  function drawCell(ctx, x, y, w, h, text, bgColor, textColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = GRAY_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    if (text !== undefined && text !== null) {
      ctx.fillStyle = textColor || TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(text), x + w / 2, y + h / 2);
    }
  }

  function drawGrid(ctx, ox, oy, cs, rows, cols, values, colorFn) {
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var val = values[r][c];
        var bg = valToGray(val);
        var txt = val > 128 ? '#333' : '#eee';
        if (colorFn) {
          var info = colorFn(val, r, c);
          bg = info.bg;
          txt = info.text;
        }
        drawCell(ctx, ox + c * cs, oy + r * cs, cs, cs, val, bg, txt);
      }
    }
  }

  function drawKernelMatrix(ctx, ox, oy, cs, kernel, title) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + 1.5 * cs, oy - 6);

    var kSum = 0;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var v = kernel[r][c];
        kSum += v;
        var bg;
        if (v > 0) bg = '#dbeafe';
        else if (v < 0) bg = '#fee2e2';
        else bg = '#f9fafb';
        drawCell(ctx, ox + c * cs, oy + r * cs, cs, cs, v, bg, TEXT_COLOR);
      }
    }
    // Sum label
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u6838\u548C = ' + kSum, ox + 1.5 * cs, oy + 3 * cs + 14);
  }

  function drawHeader(ctx, step, total) {
    ctx.fillStyle = GRAY_BG;
    ctx.fillRect(0, 0, 700, 34);
    ctx.fillStyle = INDIGO;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u6B65\u9AA4 ' + (step + 1) + ' / ' + total, 14, 17);
  }

  function drawTitle(ctx, text, x, y) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  // Pre-compute all outputs
  var outputs = [];
  for (var k = 0; k < KERNELS.length; k++) {
    outputs[k] = convolve(INPUT, KERNELS[k].matrix);
  }

  var descriptions = [
    '<b>\u5355\u4F4D\u6838</b>\uFF1A<code>[0,0,0;0,1,0;0,0,0]</code>\uFF0C\u8F93\u51FA\u7B49\u4E8E\u8F93\u5165\uFF0C\u4E0D\u6539\u53D8\u56FE\u50CF',
    '<b>\u8FB9\u7F18\u68C0\u6D4B\u6838</b>\uFF1A<code>[-1,-1,-1;-1,8,-1;-1,-1,-1]</code>\uFF0C\u6838\u548C=0\uFF0C\u68C0\u6D4B\u6240\u6709\u65B9\u5411\u8FB9\u7F18',
    '<b>\u9510\u5316\u6838</b>\uFF1A<code>[0,-1,0;-1,5,-1;0,-1,0]</code>\uFF0C\u6838\u548C=1\uFF0C\u589E\u5F3A\u4E2D\u5FC3\u50CF\u7D20',
    '<b>\u6D6E\u96D5\u6838</b>\uFF1A<code>[-2,-1,0;-1,1,1;0,1,2]</code>\uFF0C\u4EA7\u751F\u65B9\u5411\u6027\u6D6E\u96D5\u6548\u679C',
    '<b>\u6EE4\u6CE2\u6838\u8BBE\u8BA1\u539F\u5219</b>\uFF1A\u6838\u548C\u89C4\u5219\u3001\u5BF9\u79F0\u6027\u3001\u65B9\u5411\u654F\u611F\u5EA6'
  ];

  registerAnimation(28, function (canvas, ctx) {
    return {
      totalSteps: 5,
      hasSlider: true,
      sliderLabel: '\u6838\u7C7B\u578B',
      sliderMin: 0,
      sliderMax: 4,
      sliderStep: 1,
      sliderDefault: 0,
      draw: function (step, sliderValue) {
        ctx.clearRect(0, 0, 700, 400);
        drawHeader(ctx, step, 5);

        if (step <= 3) {
          var kIdx = step;
          var kernel = KERNELS[kIdx];
          var output = outputs[kIdx];
          var cs = 44;
          var kcs = 48;

          drawTitle(ctx, kernel.name, 20, 44);

          // Kernel on the left
          drawKernelMatrix(ctx, 20, 74, kcs, kernel.matrix, '3\u00D73 \u6838');

          // Description
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(kernel.desc, 20, 240);

          // Show convolution at center (2,2)
          var centerSum = 0;
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              centerSum += INPUT[2 + dr][2 + dc] * kernel.matrix[dr + 1][dc + 1];
            }
          }
          ctx.fillText('\u4E2D\u5FC3 (2,2) \u8BA1\u7B97:', 20, 268);
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('\u7ED3\u679C = ' + centerSum, 20, 290);

          // Input grid
          drawTitle(ctx, '\u8F93\u5165 (5\u00D75):', 220, 44);
          drawGrid(ctx, 220, 70, cs, 5, 5, INPUT);

          // Arrow
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u2192', 450, 70 + 2.5 * cs);

          // Output grid
          drawTitle(ctx, '\u8F93\u51FA:', 475, 44);
          drawGrid(ctx, 475, 70, cs, 5, 5, output, function (v) {
            if (v > 200) return { bg: '#dcfce7', text: '#166534' };
            if (v < -50) return { bg: '#fee2e2', text: '#7f1d1d' };
            if (v < 0) return { bg: '#fef2f2', text: '#991b1b' };
            var bg = valToGray(v);
            return { bg: bg, text: v > 128 ? '#333' : '#eee' };
          });

          // Properties
          var kSum = 0;
          for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
              kSum += kernel.matrix[r][c];
            }
          }
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u6838\u548C: ' + kSum + (kSum === 1 ? ' (\u4FDD\u6301\u4EAE\u5EA6)' : kSum === 0 ? ' (\u68C0\u6D4B\u53D8\u5316)' : ''), 220, 70 + 5 * cs + 18);
        } else if (step === 4) {
          drawTitle(ctx, '\u6EE4\u6CE2\u6838\u8BBE\u8BA1\u539F\u5219', 20, 44);

          // Four mini kernels for comparison
          var kcs = 36;
          for (var k = 0; k < 4; k++) {
            var ox = 20 + k * 170;
            drawKernelMatrix(ctx, ox, 72, kcs, KERNELS[k].matrix, KERNELS[k].name.split('(')[0].trim());
          }

          // Principles
          var principles = [
            { title: '1. \u6838\u548C\u89C4\u5219', text: '\u6838\u548C=1 \u2192 \u4FDD\u6301\u4EAE\u5EA6\uFF08\u5E73\u6ED1/\u9510\u5316\uFF09' },
            { title: '', text: '\u6838\u548C=0 \u2192 \u68C0\u6D4B\u53D8\u5316\uFF08\u8FB9\u7F18\u68C0\u6D4B\uFF09' },
            { title: '2. \u5BF9\u79F0\u6027', text: '\u65CB\u8F6C\u5BF9\u79F0\u6838\u5BF9\u6240\u6709\u65B9\u5411\u54CD\u5E94\u76F8\u540C' },
            { title: '', text: '\u975E\u5BF9\u79F0\u6838\u5177\u6709\u65B9\u5411\u654F\u611F\u6027' },
            { title: '3. \u65B9\u5411\u654F\u611F\u5EA6', text: '\u6B63\u8D1F\u6743\u91CD\u5206\u5E03\u51B3\u5B9A\u68C0\u6D4B\u65B9\u5411' },
            { title: '', text: 'Sobel-X: \u68C0\u6D4B\u5782\u76F4\u8FB9\u7F18\uFF0CSobel-Y: \u6C34\u5E73\u8FB9\u7F18' },
            { title: '4. \u6838\u5927\u5C0F', text: '\u66F4\u5927\u7684\u6838\u6355\u6349\u66F4\u5927\u90BB\u57DF\uFF0C\u4F46\u8BA1\u7B97\u91CF\u589E\u52A0' }
          ];

          var py = 220;
          for (var i = 0; i < principles.length; i++) {
            var p = principles[i];
            if (p.title) {
              ctx.fillStyle = INDIGO;
              ctx.font = 'bold 13px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(p.title, 30, py);
              py += 18;
            }
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '13px sans-serif';
            ctx.fillText(p.text, 50, py);
            py += 20;
          }
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });
})();
