(function () {
  var INDIGO = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN = '#10b981';
  var RED = '#ef4444';
  var AMBER = '#f59e0b';
  var GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db';
  var TEXT_COLOR = '#374151';

  // 7x7 noisy image
  var IMG = [
    [120, 115, 130, 200, 195, 210, 205],
    [110, 250, 125, 205, 180, 195, 200],
    [125, 120, 118, 190, 200, 210, 195],
    [130, 115, 120, 200, 195, 185, 200],
    [128, 122, 115, 205, 200, 210, 195],
    [120, 118, 130, 195, 205, 200, 210],
    [115, 125, 120, 200, 195, 205, 200]
  ];

  var MEAN_K = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];

  var GAUSS_K = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];

  function applyMean(img) {
    var out = [];
    for (var r = 0; r < 7; r++) {
      out[r] = [];
      for (var c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          out[r][c] = img[r][c];
        } else {
          var sum = 0;
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              sum += img[r + dr][c + dc];
            }
          }
          out[r][c] = Math.round(sum / 9);
        }
      }
    }
    return out;
  }

  function applyMedian(img) {
    var out = [];
    for (var r = 0; r < 7; r++) {
      out[r] = [];
      for (var c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          out[r][c] = img[r][c];
        } else {
          var vals = [];
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              vals.push(img[r + dr][c + dc]);
            }
          }
          vals.sort(function (a, b) { return a - b; });
          out[r][c] = vals[4];
        }
      }
    }
    return out;
  }

  function applyGaussian(img) {
    var out = [];
    for (var r = 0; r < 7; r++) {
      out[r] = [];
      for (var c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          out[r][c] = img[r][c];
        } else {
          var sum = 0;
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              sum += img[r + dr][c + dc] * GAUSS_K[dr + 1][dc + 1];
            }
          }
          out[r][c] = Math.round(sum / 16);
        }
      }
    }
    return out;
  }

  function valToGray(v) {
    var g = Math.round(v * 255 / 255);
    var hex = g.toString(16);
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
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(text), x + w / 2, y + h / 2);
    }
  }

  function drawGrid(ctx, ox, oy, cs, rows, cols, values, highlightR, highlightC) {
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var val = values[r][c];
        var bg = valToGray(val);
        var txt = val > 128 ? '#333' : '#eee';
        if (highlightR !== undefined && r === highlightR && highlightC !== undefined && c === highlightC) {
          bg = '#fef08a';
          txt = '#333';
        }
        drawCell(ctx, ox + c * cs, oy + r * cs, cs, cs, val, bg, txt);
      }
    }
  }

  function drawKernelGrid(ctx, ox, oy, cs, kernel, title) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + 1.5 * cs, oy - 4);
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var v = kernel[r][c];
        var bg = v > 1 ? '#dbeafe' : '#f9fafb';
        drawCell(ctx, ox + c * cs, oy + r * cs, cs, cs, v, bg, TEXT_COLOR);
      }
    }
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

  var meanResult = applyMean(IMG);
  var medianResult = applyMedian(IMG);
  var gaussResult = applyGaussian(IMG);

  var descriptions = [
    '<b>\u539F\u59CB\u56FE\u50CF</b>\uFF1A7\u00D77 \u50CF\u7D20\u7F51\u683C\u542B\u6709\u566A\u58F0\uFF08\u50CF\u7D20\u503C 250\uFF09\uFF0C\u53F3\u4FA7\u663E\u793A 3\u00D73 \u5747\u503C\u6838',
    '<b>\u5747\u503C\u6EE4\u6CE2</b>\uFF1A\u5C06\u6838\u5FC3\u533A\u57DF\u76849\u4E2A\u50CF\u7D20\u6C42\u548C\u540E\u9664\u4EE59\uFF0C<code>\u7ED3\u679C = (P1+P2+...+P9)/9</code>',
    '<b>\u4E2D\u503C\u6EE4\u6CE2</b>\uFF1A\u5C06\u6838\u5FC3\u533A\u57DF\u76849\u4E2A\u50CF\u7D20\u6392\u5E8F\uFF0C\u53D6\u4E2D\u95F4\u503C\uFF0C\u6709\u6548\u53BB\u9664\u6912\u76D0\u566A\u58F0',
    '<b>\u9AD8\u65AF\u6EE4\u6CE2</b>\uFF1A\u4F7F\u7528\u52A0\u6743\u6838 <code>[1,2,1;2,4,2;1,2,1]/16</code>\uFF0C\u4E2D\u5FC3\u6743\u91CD\u6700\u5927',
    '<b>\u4E09\u79CD\u6EE4\u6CE2\u5BF9\u6BD4</b>\uFF1A\u5747\u503C\u3001\u4E2D\u503C\u3001\u9AD8\u65AF\u6EE4\u6CE2\u7ED3\u679C\u5E76\u6392\u663E\u793A',
    '<b>\u603B\u7ED3</b>\uFF1A\u5747\u503C=\u6A21\u7CCA\u8FB9\u7F18\uFF0C\u4E2D\u503C=\u4FDD\u7559\u8FB9\u7F18\uFF0C\u9AD8\u65AF=\u81EA\u7136\u5E73\u6ED1'
  ];

  registerAnimationBatch([22, 23, 24], function (canvas, ctx) {
    return {
      totalSteps: 6,
      hasSlider: true,
      sliderLabel: '\u6EE4\u6CE2\u7C7B\u578B',
      sliderMin: 0,
      sliderMax: 2,
      sliderStep: 1,
      sliderDefault: 0,
      draw: function (step, sliderValue) {
        ctx.clearRect(0, 0, 700, 400);
        drawHeader(ctx, step, 6);
        var cs = 36;

        if (step === 0) {
          drawTitle(ctx, '\u539F\u59CB\u56FE\u50CF (7\u00D77) \u542B\u566A\u58F0', 20, 44);
          drawGrid(ctx, 20, 70, cs, 7, 7, IMG, 1, 1);
          // highlight noise pixel
          ctx.strokeStyle = RED;
          ctx.lineWidth = 2;
          ctx.strokeRect(20 + 1 * cs, 70 + 1 * cs, cs, cs);
          ctx.fillStyle = RED;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u566A\u58F0\u50CF\u7D20=250', 20 + 1 * cs + cs + 4, 70 + 1 * cs + cs / 2);

          drawKernelGrid(ctx, 340, 70, 44, MEAN_K, '3\u00D73 \u5747\u503C\u6838');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u5747\u503C\u6838\u6240\u6709\u6743\u91CD\u76F8\u7B49\uFF0C\u6C42\u548C\u540E\u9664\u4EE59', 340, 220);
          ctx.fillText('\u5E73\u6ED1\u6548\u679C\u5747\u5300\uFF0C\u4F46\u4F1A\u6A21\u7CCA\u8FB9\u7F18', 340, 242);
        } else if (step === 1) {
          drawTitle(ctx, '\u5747\u503C\u6EE4\u6CE2\u8BA1\u7B97', 20, 44);
          // Show neighborhood around (1,1)
          var region = [];
          for (var dr = -1; dr <= 1; dr++) {
            region[dr + 1] = [];
            for (var dc = -1; dc <= 1; dc++) {
              region[dr + 1][dc + 1] = IMG[1 + dr][1 + dc];
            }
          }
          drawTitle(ctx, '3\u00D73 \u90BB\u57DF:', 20, 70);
          drawGrid(ctx, 20, 92, 42, 3, 3, region);
          var sum = 0;
          for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
              sum += region[i][j];
            }
          }
          var avg = Math.round(sum / 9);
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u6C42\u548C = ' + sum, 20, 230);
          ctx.fillText('\u5747\u503C = ' + sum + ' / 9 = ' + avg, 20, 252);
          ctx.fillStyle = GREEN;
          ctx.fillText('\u539F\u503C 250 \u2192 ' + avg + ' (\u566A\u58F0\u88AB\u6291\u5236)', 20, 278);

          drawTitle(ctx, '\u5747\u503C\u6EE4\u6CE2\u7ED3\u679C:', 300, 44);
          drawGrid(ctx, 300, 70, cs, 7, 7, meanResult);
        } else if (step === 2) {
          drawTitle(ctx, '\u4E2D\u503C\u6EE4\u6CE2\u8BA1\u7B97', 20, 44);
          var region = [];
          for (var dr = -1; dr <= 1; dr++) {
            region[dr + 1] = [];
            for (var dc = -1; dc <= 1; dc++) {
              region[dr + 1][dc + 1] = IMG[1 + dr][1 + dc];
            }
          }
          drawTitle(ctx, '3\u00D73 \u90BB\u57DF:', 20, 70);
          drawGrid(ctx, 20, 92, 42, 3, 3, region);

          var vals = [];
          for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
              vals.push(region[i][j]);
            }
          }
          vals.sort(function (a, b) { return a - b; });
          var med = vals[4];

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u6392\u5E8F\u540E:', 20, 230);
          ctx.fillText(vals.join(', '), 20, 250);
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('\u4E2D\u503C = ' + med, 20, 274);
          ctx.fillStyle = GREEN;
          ctx.fillText('\u539F\u503C 250 \u2192 ' + med + ' (\u566A\u58F0\u5B8C\u5168\u53BB\u9664)', 20, 298);

          drawTitle(ctx, '\u4E2D\u503C\u6EE4\u6CE2\u7ED3\u679C:', 300, 44);
          drawGrid(ctx, 300, 70, cs, 7, 7, medianResult);
        } else if (step === 3) {
          drawTitle(ctx, '\u9AD8\u65AF\u6EE4\u6CE2\u8BA1\u7B97', 20, 44);
          drawKernelGrid(ctx, 20, 70, 42, GAUSS_K, '\u9AD8\u65AF\u6838 (\u00F716)');

          var region = [];
          for (var dr = -1; dr <= 1; dr++) {
            region[dr + 1] = [];
            for (var dc = -1; dc <= 1; dc++) {
              region[dr + 1][dc + 1] = IMG[1 + dr][1 + dc];
            }
          }
          drawTitle(ctx, '\u90BB\u57DF\u50CF\u7D20:', 180, 70);
          drawGrid(ctx, 180, 92, 42, 3, 3, region);

          var wsum = 0;
          for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
              wsum += region[i][j] * GAUSS_K[i][j];
            }
          }
          var gval = Math.round(wsum / 16);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u52A0\u6743\u6C42\u548C = ' + wsum, 20, 220);
          ctx.fillText('\u7ED3\u679C = ' + wsum + ' / 16 = ' + gval, 20, 242);
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('\u4E2D\u5FC3\u6743\u91CD\u6700\u5927(4/16)\uFF0C\u4FDD\u7559\u66F4\u591A\u7EC6\u8282', 20, 270);

          drawTitle(ctx, '\u9AD8\u65AF\u6EE4\u6CE2\u7ED3\u679C:', 370, 44);
          drawGrid(ctx, 370, 70, cs, 7, 7, gaussResult);
        } else if (step === 4) {
          drawTitle(ctx, '\u4E09\u79CD\u6EE4\u6CE2\u5BF9\u6BD4', 20, 44);
          var cs2 = 30;
          var labels = ['\u5747\u503C\u6EE4\u6CE2', '\u4E2D\u503C\u6EE4\u6CE2', '\u9AD8\u65AF\u6EE4\u6CE2'];
          var results = [meanResult, medianResult, gaussResult];
          var colors = [INDIGO, GREEN, AMBER];

          var activeIdx = sliderValue || 0;
          for (var k = 0; k < 3; k++) {
            var ox = 20 + k * 230;
            ctx.fillStyle = k === activeIdx ? colors[k] : TEXT_COLOR;
            ctx.font = k === activeIdx ? 'bold 13px sans-serif' : '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[k], ox + 3.5 * cs2, 68);
            drawGrid(ctx, ox, 80, cs2, 7, 7, results[k]);
            if (k === activeIdx) {
              ctx.strokeStyle = colors[k];
              ctx.lineWidth = 2;
              ctx.strokeRect(ox - 2, 78, 7 * cs2 + 4, 7 * cs2 + 4);
            }
          }
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u6ED1\u52A8\u6761\u5207\u6362\u6EE4\u6CE2\u7C7B\u578B\uFF08\u5F53\u524D\uFF1A' + labels[activeIdx] + '\uFF09', 350, 310);
        } else if (step === 5) {
          drawTitle(ctx, '\u6EE4\u6CE2\u65B9\u6CD5\u5BF9\u6BD4\u603B\u7ED3', 20, 44);
          var cs2 = 28;
          var labels = ['\u5747\u503C', '\u4E2D\u503C', '\u9AD8\u65AF'];
          var results = [meanResult, medianResult, gaussResult];
          var pros = ['\u7B80\u5355\u5FEB\u901F', '\u4FDD\u7559\u8FB9\u7F18', '\u81EA\u7136\u5E73\u6ED1'];
          var cons = ['\u6A21\u7CCA\u8FB9\u7F18', '\u4E0D\u9002\u5408\u7EBF\u6027', '\u7A0D\u5FAE\u6A21\u7CCA'];
          var colors = [INDIGO, GREEN, AMBER];

          for (var k = 0; k < 3; k++) {
            var ox = 20 + k * 230;
            ctx.fillStyle = colors[k];
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[k] + '\u6EE4\u6CE2', ox + 3.5 * cs2, 68);
            drawGrid(ctx, ox, 80, cs2, 7, 7, results[k]);

            ctx.fillStyle = GREEN;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('\u2713 ' + pros[k], ox + 3.5 * cs2, 80 + 7 * cs2 + 18);
            ctx.fillStyle = RED;
            ctx.fillText('\u2717 ' + cons[k], ox + 3.5 * cs2, 80 + 7 * cs2 + 38);
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
