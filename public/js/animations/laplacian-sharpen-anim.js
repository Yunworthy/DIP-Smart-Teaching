(function () {
  var INDIGO = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN = '#10b981';
  var RED = '#ef4444';
  var AMBER = '#f59e0b';
  var GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db';
  var TEXT_COLOR = '#374151';

  // 5x5 image with vertical edge pattern
  var IMG = [
    [180, 180, 60, 60, 60],
    [180, 180, 60, 60, 60],
    [180, 180, 60, 60, 60],
    [180, 180, 60, 60, 60],
    [180, 180, 60, 60, 60]
  ];

  var LAP_K = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
  ];

  function convolve3x3(img, kernel, r, c) {
    var sum = 0;
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var ir = r + dr;
        var ic = c + dc;
        if (ir >= 0 && ir < 5 && ic >= 0 && ic < 5) {
          sum += img[ir][ic] * kernel[dr + 1][dc + 1];
        }
      }
    }
    return sum;
  }

  function applyLaplacian(img) {
    var out = [];
    for (var r = 0; r < 5; r++) {
      out[r] = [];
      for (var c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4) {
          out[r][c] = 0;
        } else {
          out[r][c] = convolve3x3(img, LAP_K, r, c);
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

  function drawKernelDisplay(ctx, ox, oy, cs, kernel, title) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + 1.5 * cs, oy - 6);
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var v = kernel[r][c];
        var bg = v > 0 ? '#dbeafe' : v < 0 ? '#fee2e2' : '#f9fafb';
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

  var lapResult = applyLaplacian(IMG);

  // Negate laplacian
  var negLap = [];
  for (var r = 0; r < 5; r++) {
    negLap[r] = [];
    for (var c = 0; c < 5; c++) {
      negLap[r][c] = -lapResult[r][c];
    }
  }

  // Sharpened = original - laplacian = original + (-laplacian)
  var sharpened = [];
  for (var r = 0; r < 5; r++) {
    sharpened[r] = [];
    for (var c = 0; c < 5; c++) {
      sharpened[r][c] = Math.max(0, Math.min(255, IMG[r][c] + negLap[r][c]));
    }
  }

  var descriptions = [
    '<b>\u539F\u59CB\u56FE\u50CF</b>\uFF1A5\u00D75 \u7F51\u683C\u542B\u6709\u5782\u76F4\u8FB9\u7F18\uFF0C\u53F3\u4FA7\u663E\u793A\u62C9\u666E\u62C9\u65AF\u6838 <code>[0,1,0;1,-4,1;0,1,0]</code>',
    '<b>\u62C9\u666E\u62C9\u65AF\u5377\u79EF</b>\uFF1A\u5E94\u7528\u6838\u5FC3\u68C0\u6D4B\u4E8C\u9636\u5BFC\u6570\uFF0C\u8FB9\u7F18\u5904\u54CD\u5E94\u5F3A\u70C8',
    '<b>\u53D6\u53CD</b>\uFF1A\u5C06\u62C9\u666E\u62C9\u65AF\u7ED3\u679C\u53D6\u53CD\uFF0C\u5F97\u5230\u9510\u5316\u5206\u91CF',
    '<b>\u53E0\u52A0</b>\uFF1A\u539F\u59CB\u56FE\u50CF + (-\u62C9\u666E\u62C9\u65AF) = \u9510\u5316\u7ED3\u679C\uFF0C\u8FB9\u7F18\u5F97\u5230\u589E\u5F3A',
    '<b>\u5BF9\u6BD4</b>\uFF1A\u539F\u59CB\u56FE\u50CF vs \u9510\u5316\u56FE\u50CF\uFF0C\u8FB9\u7F18\u5904\u5BF9\u6BD4\u5EA6\u660E\u663E\u589E\u5F3A'
  ];

  registerAnimation(25, function (canvas, ctx) {
    return {
      totalSteps: 5,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawHeader(ctx, step, 5);
        var cs = 48;

        if (step === 0) {
          drawTitle(ctx, '\u539F\u59CB\u56FE\u50CF (5\u00D75)', 20, 44);
          drawGrid(ctx, 20, 70, cs, 5, 5, IMG);
          // Edge indicator
          ctx.strokeStyle = RED;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(20 + 2 * cs, 70);
          ctx.lineTo(20 + 2 * cs, 70 + 5 * cs);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = RED;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u8FB9\u7F18', 20 + 2 * cs, 70 + 5 * cs + 16);

          drawKernelDisplay(ctx, 360, 70, 50, LAP_K, '\u62C9\u666E\u62C9\u65AF\u6838');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u62C9\u666E\u62C9\u65AF\u7B97\u5B50\u68C0\u6D4B\u56FE\u50CF\u4E2D\u7684', 360, 240);
          ctx.fillText('\u4E8C\u9636\u5BFC\u6570\uFF08\u66F2\u7387\uFF09\uFF0C\u5728\u8FB9\u7F18', 360, 260);
          ctx.fillText('\u5904\u4EA7\u751F\u5F3A\u54CD\u5E94\u3002', 360, 280);
          ctx.fillText('\u4E2D\u5FC3\u7CFB\u6570 -4 \u4F53\u73B0\u4E86\u4E8C\u9636', 360, 310);
          ctx.fillText('\u5DEE\u5206\u7684\u7279\u6027\u3002', 360, 330);
        } else if (step === 1) {
          drawTitle(ctx, '\u62C9\u666E\u62C9\u65AF\u5377\u79EF\u7ED3\u679C', 20, 44);
          // Show computation at (2,2) - center of edge
          drawTitle(ctx, '\u4F4D\u7F6E (2,2) \u8BA1\u7B97:', 20, 70);
          var region = [];
          for (var dr = -1; dr <= 1; dr++) {
            region[dr + 1] = [];
            for (var dc = -1; dc <= 1; dc++) {
              region[dr + 1][dc + 1] = IMG[2 + dr][2 + dc];
            }
          }
          drawGrid(ctx, 20, 92, 42, 3, 3, region);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u00D7', 160, 92 + 63);

          drawKernelDisplay(ctx, 180, 92, 42, LAP_K, '');

          var val = convolve3x3(IMG, LAP_K, 2, 2);
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u7ED3\u679C = 0\u00D760 + 1\u00D760 + 0\u00D760', 20, 232);
          ctx.fillText('     + 1\u00D7180 + (-4)\u00D760 + 1\u00D760', 20, 252);
          ctx.fillText('     + 0\u00D760 + 1\u00D760 + 0\u00D760 = ' + val, 20, 272);

          drawTitle(ctx, '\u5B8C\u6574\u62C9\u666E\u62C9\u65AF\u7ED3\u679C:', 380, 44);
          drawGrid(ctx, 380, 70, cs, 5, 5, lapResult, function (v) {
            if (v > 0) return { bg: '#fee2e2', text: '#7f1d1d' };
            if (v < 0) return { bg: '#dbeafe', text: '#1e3a5f' };
            return { bg: '#f9fafb', text: TEXT_COLOR };
          });
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u7EA2=\u6B63 (\u8FB9\u7F18\u5DE6\u4FA7)  \u84DD=\u8D1F (\u8FB9\u7F18\u53F3\u4FA7)', 380, 70 + 5 * cs + 14);
        } else if (step === 2) {
          drawTitle(ctx, '\u53D6\u53CD\u62C9\u666E\u62C9\u65AF: -\u2207\u00B2f', 20, 44);
          drawGrid(ctx, 20, 70, cs, 5, 5, lapResult, function (v) {
            if (v > 0) return { bg: '#fee2e2', text: '#7f1d1d' };
            if (v < 0) return { bg: '#dbeafe', text: '#1e3a5f' };
            return { bg: '#f9fafb', text: TEXT_COLOR };
          });
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u2192  \u53D6\u53CD  \u2192', 280, 70 + 2.5 * cs);

          drawTitle(ctx, '-\u62C9\u666E\u62C9\u65AF:', 340, 44);
          drawGrid(ctx, 340, 70, cs, 5, 5, negLap, function (v) {
            if (v > 0) return { bg: '#dcfce7', text: '#166534' };
            if (v < 0) return { bg: '#fee2e2', text: '#7f1d1d' };
            return { bg: '#f9fafb', text: TEXT_COLOR };
          });
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u53D6\u53CD\u540E\u7B26\u53F7\u98A0\u5012\uFF0C\u6B63\u503C\u53D8\u8D1F\u3001\u8D1F\u503C\u53D8\u6B63\u3002', 20, 330);
          ctx.fillText('\u8FD9\u4E2A\u53D6\u53CD\u7ED3\u679C\u5C06\u7528\u4E8E\u4E0E\u539F\u56FE\u53E0\u52A0\u5B9E\u73B0\u9510\u5316\u3002', 20, 352);
        } else if (step === 3) {
          drawTitle(ctx, '\u53E0\u52A0: \u539F\u59CB + (-\u62C9\u666E\u62C9\u65AF) = \u9510\u5316', 20, 44);
          var cs2 = 40;
          drawTitle(ctx, '\u539F\u59CB:', 20, 70);
          drawGrid(ctx, 20, 90, cs2, 5, 5, IMG);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('+', 230, 90 + 2.5 * cs2);

          drawTitle(ctx, '-\u2207\u00B2f:', 250, 70);
          drawGrid(ctx, 250, 90, cs2, 5, 5, negLap, function (v) {
            if (v > 0) return { bg: '#dcfce7', text: '#166534' };
            if (v < 0) return { bg: '#fee2e2', text: '#7f1d1d' };
            return { bg: '#f9fafb', text: TEXT_COLOR };
          });

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('=', 465, 90 + 2.5 * cs2);

          drawTitle(ctx, '\u9510\u5316\u7ED3\u679C:', 485, 70);
          drawGrid(ctx, 485, 90, cs2, 5, 5, sharpened);

          // Show one calculation
          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u793A\u4F8B (2,2): 60 + 0 = 60', 20, 310);
          ctx.fillText('\u793A\u4F8B (2,1): 180 + 240 = ' + sharpened[2][1], 20, 332);
          ctx.fillStyle = GREEN;
          ctx.fillText('\u8FB9\u7F18\u5904\u5BF9\u6BD4\u5EA6\u663E\u8457\u589E\u5F3A!', 20, 358);
        } else if (step === 4) {
          drawTitle(ctx, '\u5BF9\u6BD4: \u539F\u59CB vs \u9510\u5316', 20, 44);
          var cs2 = 52;
          drawTitle(ctx, '\u539F\u59CB\u56FE\u50CF:', 40, 70);
          drawGrid(ctx, 40, 92, cs2, 5, 5, IMG);
          // Edge contrast indicator
          var origDiff = Math.abs(IMG[2][1] - IMG[2][2]);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u8FB9\u7F18\u5BF9\u6BD4\u5EA6: |180-60| = ' + origDiff, 40 + 2.5 * cs2, 92 + 5 * cs2 + 20);

          drawTitle(ctx, '\u9510\u5316\u56FE\u50CF:', 400, 70);
          drawGrid(ctx, 400, 92, cs2, 5, 5, sharpened);
          var sharpDiff = Math.abs(sharpened[2][1] - sharpened[2][2]);
          ctx.fillStyle = GREEN;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u8FB9\u7F18\u5BF9\u6BD4\u5EA6: |' + sharpened[2][1] + '-' + sharpened[2][2] + '| = ' + sharpDiff, 400 + 2.5 * cs2, 92 + 5 * cs2 + 20);

          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u9510\u5316\u540E\u8FB9\u7F18\u5BF9\u6BD4\u5EA6\u589E\u52A0\u4E86 ' + (sharpDiff - origDiff), 350, 380);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });
})();
