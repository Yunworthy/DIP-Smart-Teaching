(function () {
  var INDIGO = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN = '#10b981';
  var RED = '#ef4444';
  var AMBER = '#f59e0b';
  var GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db';
  var TEXT_COLOR = '#374151';

  // 7x7 gradient pattern
  var IMG = [
    [50, 75, 100, 125, 150, 175, 200],
    [50, 75, 100, 125, 150, 175, 200],
    [50, 75, 100, 125, 150, 175, 200],
    [50, 75, 100, 125, 150, 175, 200],
    [50, 75, 100, 125, 150, 175, 200],
    [50, 75, 100, 125, 150, 175, 200],
    [50, 75, 100, 125, 150, 175, 200]
  ];

  function applyBlur(img) {
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

  function computeMask(orig, blurred) {
    var mask = [];
    for (var r = 0; r < 7; r++) {
      mask[r] = [];
      for (var c = 0; c < 7; c++) {
        mask[r][c] = orig[r][c] - blurred[r][c];
      }
    }
    return mask;
  }

  function applyEnhance(orig, mask, k) {
    var out = [];
    for (var r = 0; r < 7; r++) {
      out[r] = [];
      for (var c = 0; c < 7; c++) {
        out[r][c] = Math.max(0, Math.min(255, Math.round(orig[r][c] + k * mask[r][c])));
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
      ctx.font = '11px sans-serif';
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

  var blurred = applyBlur(IMG);
  var mask = computeMask(IMG, blurred);
  var enhanced_k1 = applyEnhance(IMG, mask, 1);
  var enhanced_k05 = applyEnhance(IMG, mask, 0.5);
  var enhanced_k2 = applyEnhance(IMG, mask, 2);

  var descriptions = [
    '<b>\u539F\u59CB\u56FE\u50CF</b>\uFF1A7\u00D77 \u6E10\u53D8\u6A21\u5F0F\uFF0C\u4ECE\u5DE6\u5230\u53F3\u4EAE\u5EA6\u9010\u6E10\u589E\u52A0',
    '<b>\u6A21\u7CCA\u56FE\u50CF</b>\uFF1A\u5BF9\u539F\u59CB\u56FE\u50CF\u5E94\u7528\u5747\u503C\u6EE4\u6CE2\uFF0C\u5F97\u5230\u5E73\u6ED1\u7248\u672C',
    '<b>\u63A9\u6A21\u8BA1\u7B97</b>\uFF1A<code>mask = original - blurred</code>\uFF0C\u63D0\u53D6\u9AD8\u9891\u7EC6\u8282',
    '<b>\u589E\u5F3A</b>\uFF1A<code>enhanced = original + k \u00D7 mask</code>\uFF0Ck=1 \u65F6\u7684\u7ED3\u679C',
    '<b>\u4E0D\u540C k \u503C\u5BF9\u6BD4</b>\uFF1Ak=0.5(\u8F7B\u5FAE\u9510\u5316)\u3001k=1(\u6807\u51C6)\u3001k=2(\u5F3A\u70C8\u9510\u5316)'
  ];

  registerAnimation(26, function (canvas, ctx) {
    return {
      totalSteps: 5,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawHeader(ctx, step, 5);
        var cs = 36;

        if (step === 0) {
          drawTitle(ctx, '\u539F\u59CB\u56FE\u50CF (7\u00D77) \u6E10\u53D8\u6A21\u5F0F', 20, 44);
          drawGrid(ctx, 20, 70, cs, 7, 7, IMG);
          // Arrow showing gradient
          ctx.strokeStyle = INDIGO;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(20, 70 + 7 * cs + 16);
          ctx.lineTo(20 + 7 * cs, 70 + 7 * cs + 16);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(20 + 7 * cs, 70 + 7 * cs + 16);
          ctx.lineTo(20 + 7 * cs - 8, 70 + 7 * cs + 10);
          ctx.moveTo(20 + 7 * cs, 70 + 7 * cs + 16);
          ctx.lineTo(20 + 7 * cs - 8, 70 + 7 * cs + 22);
          ctx.stroke();
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u4EAE\u5EA6\u6E10\u53D8: 50 \u2192 200', 20 + 3.5 * cs, 70 + 7 * cs + 38);
          ctx.fillText('\u975E\u9510\u5316\u63A9\u6A21\u901A\u8FC7\u589E\u5F3A\u9AD8\u9891\u6210\u5206\u6765\u9510\u5316\u56FE\u50CF', 350, 370);
        } else if (step === 1) {
          drawTitle(ctx, '\u6B65\u9AA41: \u6A21\u7CCA\u56FE\u50CF (\u5747\u503C\u6EE4\u6CE2)', 20, 44);
          drawTitle(ctx, '\u539F\u59CB:', 20, 70);
          drawGrid(ctx, 20, 90, cs, 7, 7, IMG);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u2192', 300, 90 + 3.5 * cs);

          drawTitle(ctx, '\u6A21\u7CCA\u540E:', 340, 70);
          drawGrid(ctx, 340, 90, cs, 7, 7, blurred);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u5E94\u7528 3\u00D73 \u5747\u503C\u6EE4\u6CE2\u5668\uFF0C\u6BCF\u4E2A\u50CF\u7D20\u53D8\u4E3A\u90BB\u57DF\u5E73\u5747\u503C\u3002', 20, 360);
          ctx.fillText('\u6A21\u7CCA\u540E\u7684\u56FE\u50CF\u4FDD\u7559\u4E86\u4F4E\u9891\u4FE1\u606F\uFF0C\u4E22\u5931\u4E86\u9AD8\u9891\u7EC6\u8282\u3002', 20, 380);
        } else if (step === 2) {
          drawTitle(ctx, '\u6B65\u9AA42: \u8BA1\u7B97\u63A9\u6A21 = \u539F\u59CB - \u6A21\u7CCA', 20, 44);
          var cs2 = 32;
          drawTitle(ctx, '\u539F\u59CB:', 20, 70);
          drawGrid(ctx, 20, 90, cs2, 7, 7, IMG);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('-', 250, 90 + 3.5 * cs2);

          drawTitle(ctx, '\u6A21\u7CCA:', 268, 70);
          drawGrid(ctx, 268, 90, cs2, 7, 7, blurred);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('=', 498, 90 + 3.5 * cs2);

          drawTitle(ctx, '\u63A9\u6A21:', 516, 70);
          drawGrid(ctx, 516, 90, cs2, 7, 7, mask, function (v) {
            if (v > 0) return { bg: '#dcfce7', text: '#166534' };
            if (v < 0) return { bg: '#fee2e2', text: '#7f1d1d' };
            return { bg: '#f9fafb', text: TEXT_COLOR };
          });

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u63A9\u6A21\u5305\u542B\u9AD8\u9891\u7EC6\u8282\u4FE1\u606F\uFF0C\u7EFF\u8272=\u6B63\u503C\uFF0C\u7EA2\u8272=\u8D1F\u503C\u3002', 20, 340);
          ctx.fillText('\u8FD9\u4E9B\u7EC6\u8282\u5C06\u88AB\u52A0\u56DE\u539F\u56FE\u4EE5\u589E\u5F3A\u9510\u5EA6\u3002', 20, 362);
        } else if (step === 3) {
          drawTitle(ctx, '\u6B65\u9AA43: \u589E\u5F3A = \u539F\u59CB + k\u00D7\u63A9\u6A21 (k=1)', 20, 44);
          var cs2 = 34;
          drawTitle(ctx, '\u539F\u59CB:', 20, 70);
          drawGrid(ctx, 20, 90, cs2, 7, 7, IMG);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('+', 268, 90 + 3.5 * cs2);

          drawTitle(ctx, '1\u00D7\u63A9\u6A21:', 286, 70);
          drawGrid(ctx, 286, 90, cs2, 7, 7, mask, function (v) {
            if (v > 0) return { bg: '#dcfce7', text: '#166534' };
            if (v < 0) return { bg: '#fee2e2', text: '#7f1d1d' };
            return { bg: '#f9fafb', text: TEXT_COLOR };
          });

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('=', 534, 90 + 3.5 * cs2);

          drawTitle(ctx, '\u589E\u5F3A\u540E:', 552, 70);
          drawGrid(ctx, 552, 90, cs2, 7, 7, enhanced_k1);

          // Show one calculation
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u793A\u4F8B (3,3): 125 + 1\u00D7' + mask[3][3] + ' = ' + enhanced_k1[3][3], 20, 350);
          ctx.fillStyle = GREEN;
          ctx.fillText('\u9510\u5316\u6548\u679C: \u6E10\u53D8\u8FC7\u6E21\u66F4\u52A0\u660E\u663E', 20, 375);
        } else if (step === 4) {
          drawTitle(ctx, '\u4E0D\u540C k \u503C\u5BF9\u6BD4', 20, 44);
          var cs2 = 28;
          var labels = ['\u539F\u59CB (k=0)', 'k = 0.5', 'k = 1', 'k = 2'];
          var results = [IMG, enhanced_k05, enhanced_k1, enhanced_k2];
          var colors = [TEXT_COLOR, AMBER, INDIGO, RED];

          for (var k = 0; k < 4; k++) {
            var ox = 15 + k * 172;
            ctx.fillStyle = colors[k];
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[k], ox + 3.5 * cs2, 66);
            drawGrid(ctx, ox, 78, cs2, 7, 7, results[k]);
          }

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('k \u8D8A\u5927\uFF0C\u9510\u5316\u6548\u679C\u8D8A\u5F3A\uFF0C\u4F46\u53EF\u80FD\u5F15\u5165\u566A\u58F0\u548C\u8FC7\u51B2', 350, 300);
          ctx.fillText('k=0.5: \u8F7B\u5FAE\u9510\u5316\uFF0C\u81EA\u7136\u6548\u679C', 350, 326);
          ctx.fillText('k=1: \u6807\u51C6\u975E\u9510\u5316\u63A9\u6A21', 350, 348);
          ctx.fillText('k=2: \u5F3A\u70C8\u9510\u5316\uFF0C\u53EF\u80FD\u8FC7\u5EA6\u589E\u5F3A', 350, 370);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });
})();
