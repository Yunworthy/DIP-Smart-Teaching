(function () {
  'use strict';

  var COLOR = {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    success: '#10b981',
    successLight: '#6ee7b7',
    successPale: '#a7f3d0',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    gray: '#6b7280',
    grayLight: '#e5e7eb',
    grayBg: '#f9fafb',
    textDark: '#1f2937',
    textMed: '#374151',
    textLight: '#9ca3af'
  };

  var GRID = 10;
  var SEED_R = 4, SEED_C = 5;
  var THRESHOLD = 30;

  // 10x10 image: bright blob in center, dark background
  var image = [];
  var blobCenter = { r: 4, c: 5 };
  var blobRadius = 2.8;

  function buildImage() {
    var img = [];
    for (var r = 0; r < GRID; r++) {
      var row = [];
      for (var c = 0; c < GRID; c++) {
        var dist = Math.sqrt(Math.pow(r - blobCenter.r, 2) + Math.pow(c - blobCenter.c, 2));
        if (dist < blobRadius) {
          row.push(Math.round(200 + 20 * Math.cos(dist * 1.2)));
        } else if (dist < blobRadius + 0.8) {
          row.push(Math.round(120 + 30 * Math.random()));
        } else {
          row.push(Math.round(40 + 15 * Math.sin(r * 0.7 + c * 0.5)));
        }
      }
      img.push(row);
    }
    // Ensure seed pixel is bright
    img[SEED_R][SEED_C] = 210;
    img[3][4] = 195; img[3][5] = 205; img[3][6] = 190;
    img[4][4] = 200; img[4][6] = 198;
    img[5][4] = 188; img[5][5] = 202; img[5][6] = 185;
    return img;
  }

  var img = buildImage();
  var seedVal = img[SEED_R][SEED_C];

  // Precompute region growing
  function growRegion() {
    var visited = [];
    var region = [];
    for (var r = 0; r < GRID; r++) {
      visited.push(new Array(GRID).fill(false));
      region.push(new Array(GRID).fill(false));
    }
    var queue = [{ r: SEED_R, c: SEED_C }];
    visited[SEED_R][SEED_C] = true;
    region[SEED_R][SEED_C] = true;
    var layers = [[{ r: SEED_R, c: SEED_C }]];

    while (queue.length > 0) {
      var next = [];
      for (var q = 0; q < queue.length; q++) {
        var cr = queue[q].r, cc = queue[q].c;
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var d = 0; d < 4; d++) {
          var nr = cr + dirs[d][0], nc = cc + dirs[d][1];
          if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID && !visited[nr][nc]) {
            visited[nr][nc] = true;
            if (Math.abs(img[nr][nc] - seedVal) < THRESHOLD) {
              region[nr][nc] = true;
              next.push({ r: nr, c: nc });
            }
          }
        }
      }
      if (next.length > 0) layers.push(next);
      queue = next;
    }
    return { region: region, layers: layers };
  }

  var grow = growRegion();

  function grayToColor(val) {
    var g = Math.round(val);
    return 'rgb(' + g + ',' + g + ',' + g + ')';
  }

  function drawGrid(ox, oy, cellSize, highlightFn) {
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var x = ox + c * cellSize;
        var y = oy + r * cellSize;
        if (highlightFn) {
          highlightFn(r, c, x, y, cellSize);
        } else {
          ctx.fillStyle = grayToColor(img[r][c]);
          ctx.fillRect(x, y, cellSize, cellSize);
        }
        ctx.strokeStyle = COLOR.grayLight;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }

  function drawStar(cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
      var ax = cx + r * Math.cos(angle);
      var ay = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(ax, ay);
      else ctx.lineTo(ax, ay);
      var innerAngle = angle + Math.PI / 5;
      var bx = cx + r * 0.4 * Math.cos(innerAngle);
      var by = cy + r * 0.4 * Math.sin(innerAngle);
      ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawStepHeader(step, totalSteps) {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = COLOR.primary;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u6B65\u9AA4 ' + (step + 1) + ' / ' + totalSteps, 16, 18);
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    var totalSteps = 5;

    var stepDescriptions = [
      '\u539F\u59CB\u7070\u5EA6\u56FE\u50CF\uFF1A10\u00D710\u50CF\u7D20\u7F51\u683C\uFF0C\u4E2D\u5FC3\u533A\u57DF\u4E3A\u4EAE\u533A\u57DF\uFF08\u7070\u5EA6\u503C180-220\uFF09\uFF0C\u5468\u56F4\u4E3A\u6697\u80CC\u666F\uFF08\u7070\u5EA6\u503C30-60\uFF09',
      '\u9009\u62E9\u79CD\u5B50\u70B9\uFF1A\u5728\u4EAE\u533A\u57DF\u4E2D\u5FC3\u9009\u53D6\u79CD\u5B50\u50CF\u7D20\uFF08\u7EA2\u8272\u661F\u6807\u8BB0\uFF09\uFF0C\u7070\u5EA6\u503C\u4E3A' + seedVal,
      '\u751F\u957F\u6761\u4EF6\uFF1A\u9608\u503C T=' + THRESHOLD + '\uFF0C\u68C0\u67E5\u79CD\u5B50\u70B9\u7684\u56DB\u90BB\u57DF\u50CF\u7D20\uFF0C\u6EE1\u8DB3 |\u50CF\u7D20\u503C - \u79CD\u5B50\u503C| < T \u7684\u50CF\u7D20\u52A0\u5165\u533A\u57DF\uFF08\u7EFF\u8272\uFF09',
      '\u8FED\u4EE3\u751F\u957F\uFF1A\u533A\u57DF\u4ECE\u79CD\u5B50\u70B9\u5411\u5916\u9010\u5C42\u6269\u5C55\uFF0C\u65B0\u52A0\u5165\u7684\u50CF\u7D20\u7528\u6D45\u7EFF\u8272\u663E\u793A',
      '\u751F\u957F\u5B8C\u6210\uFF1A\u6700\u7EC8\u533A\u57DF\u5206\u5272\u7ED3\u679C\uFF0C\u767D\u8272\u8FB9\u754C\u7EBF\u53E0\u52A0\u5728\u539F\u59CB\u56FE\u50CF\u4E0A'
    ];

    var ox = 220, oy = 50, cellSize = 34;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLOR.grayBg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawValueLabel(r, c, x, y, cs) {
      ctx.fillStyle = img[r][c] > 128 ? COLOR.textDark : '#e5e7eb';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(img[r][c], x + cs / 2, y + cs / 2);
    }

    function drawStep0() {
      drawStepHeader(0, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u539F\u59CB\u7070\u5EA6\u56FE\u50CF\uFF0810\u00D710\uFF09', 390, 50);

      drawGrid(ox, oy + 16, cellSize, function (r, c, x, y, cs) {
        ctx.fillStyle = grayToColor(img[r][c]);
        ctx.fillRect(x, y, cs, cs);
        drawValueLabel(r, c, x, y, cs);
      });

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u4EAE\u533A\u57DF: \u7070\u5EA6\u503C 180~220', ox, oy + GRID * cellSize + 34);
      ctx.fillText('\u6697\u80CC\u666F: \u7070\u5EA6\u503C 30~60', ox, oy + GRID * cellSize + 54);

      // Color scale
      var sx = 580, sy = oy + 16, sw = 24, sh = GRID * cellSize;
      for (var i = 0; i < sh; i++) {
        var v = Math.round(255 - (i / sh) * 255);
        ctx.fillStyle = grayToColor(v);
        ctx.fillRect(sx, sy + i, sw, 1);
      }
      ctx.strokeStyle = COLOR.gray;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.fillStyle = COLOR.textMed;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('255', sx + sw + 4, sy + 6);
      ctx.fillText('0', sx + sw + 4, sy + sh);
    }

    function drawStep1() {
      drawStepHeader(1, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u9009\u62E9\u79CD\u5B50\u70B9', 390, 50);

      drawGrid(ox, oy + 16, cellSize, function (r, c, x, y, cs) {
        ctx.fillStyle = grayToColor(img[r][c]);
        ctx.fillRect(x, y, cs, cs);
        drawValueLabel(r, c, x, y, cs);
      });

      // Seed point star
      var sx = ox + SEED_C * cellSize + cellSize / 2;
      var sy = oy + 16 + SEED_R * cellSize + cellSize / 2;
      drawStar(sx, sy, cellSize * 0.45, COLOR.danger);

      // Seed info panel
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 2;
      var px = 20, py = 80, pw = 180, ph = 100;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = COLOR.danger;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u79CD\u5B50\u70B9\u4FE1\u606F', px + 12, py + 22);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = '13px sans-serif';
      ctx.fillText('\u4F4D\u7F6E: (' + SEED_R + ', ' + SEED_C + ')', px + 12, py + 46);
      ctx.fillText('\u7070\u5EA6\u503C: ' + seedVal, px + 12, py + 66);
      ctx.fillText('\u533A\u57DF\u6807\u8BB0: R\u2080', px + 12, py + 86);
    }

    function drawStep2() {
      drawStepHeader(2, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u751F\u957F\u6761\u4EF6\u68C0\u67E5', 390, 50);

      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      var dirLabels = ['\u2191', '\u2193', '\u2190', '\u2192'];

      drawGrid(ox, oy + 16, cellSize, function (r, c, x, y, cs) {
        ctx.fillStyle = grayToColor(img[r][c]);
        ctx.fillRect(x, y, cs, cs);

        var isSeed = (r === SEED_R && c === SEED_C);
        var isNeighbor = false;
        for (var d = 0; d < 4; d++) {
          if (r === SEED_R + dirs[d][0] && c === SEED_C + dirs[d][1]) {
            isNeighbor = true;
            break;
          }
        }

        if (isSeed) {
          ctx.fillStyle = 'rgba(239,68,68,0.35)';
          ctx.fillRect(x, y, cs, cs);
        } else if (isNeighbor) {
          var diff = Math.abs(img[r][c] - seedVal);
          if (diff < THRESHOLD) {
            ctx.fillStyle = 'rgba(16,185,129,0.4)';
          } else {
            ctx.fillStyle = 'rgba(245,158,11,0.4)';
          }
          ctx.fillRect(x, y, cs, cs);
        }
        drawValueLabel(r, c, x, y, cs);
      });

      // Seed star
      var sx = ox + SEED_C * cellSize + cellSize / 2;
      var sy = oy + 16 + SEED_R * cellSize + cellSize / 2;
      drawStar(sx, sy, cellSize * 0.4, COLOR.danger);

      // Condition panel
      var px = 10, py = 60, pw = 195, ph = 200;
      ctx.fillStyle = '#eff6ff';
      ctx.strokeStyle = COLOR.primary;
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = COLOR.primary;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u751F\u957F\u89C4\u5219', px + 10, py + 22);

      ctx.fillStyle = COLOR.textDark;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u9608\u503C: T = ' + THRESHOLD, px + 10, py + 46);
      ctx.fillText('\u6761\u4EF6: |f(x,y) - f\u79CD\u5B50| < T', px + 10, py + 66);
      ctx.fillText('\u79CD\u5B50\u503C = ' + seedVal, px + 10, py + 86);

      // Check results for each neighbor
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('\u90BB\u57DF\u68C0\u67E5\u7ED3\u679C:', px + 10, py + 112);
      ctx.font = '11px sans-serif';
      var yy = py + 130;
      for (var d = 0; d < 4; d++) {
        var nr = SEED_R + dirs[d][0], nc = SEED_C + dirs[d][1];
        if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
          var diff = Math.abs(img[nr][nc] - seedVal);
          var pass = diff < THRESHOLD;
          ctx.fillStyle = pass ? COLOR.success : COLOR.warning;
          ctx.fillText(dirLabels[d] + ' (' + nr + ',' + nc + '): ' + img[nr][nc] +
            ' |' + img[nr][nc] + '-' + seedVal + '|=' + diff +
            (pass ? ' \u2713' : ' \u2717'), px + 10, yy);
          yy += 17;
        }
      }
    }

    function drawStep3() {
      drawStepHeader(3, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u8FED\u4EE3\u533A\u57DF\u751F\u957F', 390, 50);

      var lastLayer = grow.layers.length > 1 ? grow.layers[grow.layers.length - 1] : [];

      drawGrid(ox, oy + 16, cellSize, function (r, c, x, y, cs) {
        ctx.fillStyle = grayToColor(img[r][c]);
        ctx.fillRect(x, y, cs, cs);

        if (grow.region[r][c]) {
          var isLast = false;
          for (var i = 0; i < lastLayer.length; i++) {
            if (lastLayer[i].r === r && lastLayer[i].c === c) { isLast = true; break; }
          }
          ctx.fillStyle = isLast ? 'rgba(110,231,183,0.55)' : 'rgba(16,185,129,0.45)';
          ctx.fillRect(x, y, cs, cs);
        }
        drawValueLabel(r, c, x, y, cs);
      });

      // Seed
      var sx = ox + SEED_C * cellSize + cellSize / 2;
      var sy = oy + 16 + SEED_R * cellSize + cellSize / 2;
      drawStar(sx, sy, cellSize * 0.35, COLOR.danger);

      // Info panel
      var px = 10, py = 60, pw = 195, ph = 140;
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = COLOR.success;
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = COLOR.success;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u8FED\u4EE3\u751F\u957F\u8FC7\u7A0B', px + 10, py + 22);

      var count = 0;
      for (var r = 0; r < GRID; r++)
        for (var c = 0; c < GRID; c++)
          if (grow.region[r][c]) count++;

      ctx.fillStyle = COLOR.textDark;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u8FED\u4EE3\u5C42\u6570: ' + grow.layers.length, px + 10, py + 46);
      ctx.fillText('\u5F53\u524D\u533A\u57DF\u50CF\u7D20\u6570: ' + count, px + 10, py + 66);
      ctx.fillText('\u65B0\u589E\u50CF\u7D20: ' + lastLayer.length, px + 10, py + 86);

      // Legend
      ctx.fillStyle = 'rgba(16,185,129,0.7)';
      ctx.fillRect(px + 10, py + 104, 14, 14);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = '11px sans-serif';
      ctx.fillText('\u5DF2\u7EB3\u5165\u533A\u57DF', px + 30, py + 116);

      ctx.fillStyle = 'rgba(110,231,183,0.7)';
      ctx.fillRect(px + 10, py + 122, 14, 14);
      ctx.fillStyle = COLOR.textDark;
      ctx.fillText('\u672C\u8F6E\u65B0\u589E', px + 30, py + 134);
    }

    function drawStep4() {
      drawStepHeader(4, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u751F\u957F\u5B8C\u6210 \u2014 \u6700\u7EC8\u5206\u5272\u7ED3\u679C', 390, 50);

      // Find boundary pixels
      var boundary = [];
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          if (grow.region[r][c]) {
            var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (var d = 0; d < 4; d++) {
              var nr = r + dirs[d][0], nc = c + dirs[d][1];
              if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || !grow.region[nr][nc]) {
                boundary.push({ r: r, c: c });
                break;
              }
            }
          }
        }
      }

      drawGrid(ox, oy + 16, cellSize, function (r, c, x, y, cs) {
        ctx.fillStyle = grayToColor(img[r][c]);
        ctx.fillRect(x, y, cs, cs);
        if (grow.region[r][c]) {
          ctx.fillStyle = 'rgba(79,70,229,0.3)';
          ctx.fillRect(x, y, cs, cs);
        }
      });

      // Boundary overlay
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      for (var i = 0; i < boundary.length; i++) {
        var bx = ox + boundary[i].c * cellSize;
        var by = oy + 16 + boundary[i].r * cellSize;
        ctx.strokeRect(bx + 1, by + 1, cellSize - 2, cellSize - 2);
      }
      ctx.strokeStyle = COLOR.danger;
      ctx.lineWidth = 2;
      for (var i = 0; i < boundary.length; i++) {
        var bx = ox + boundary[i].c * cellSize;
        var by = oy + 16 + boundary[i].r * cellSize;
        ctx.strokeRect(bx + 2, by + 2, cellSize - 4, cellSize - 4);
      }

      // Seed
      var sx = ox + SEED_C * cellSize + cellSize / 2;
      var sy = oy + 16 + SEED_R * cellSize + cellSize / 2;
      drawStar(sx, sy, cellSize * 0.35, COLOR.danger);

      // Stats panel
      var count = 0;
      for (var r = 0; r < GRID; r++)
        for (var c = 0; c < GRID; c++)
          if (grow.region[r][c]) count++;

      var px = 10, py = 60, pw = 195, ph = 160;
      ctx.fillStyle = '#eef2ff';
      ctx.strokeStyle = COLOR.primary;
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = COLOR.primary;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u5206\u5272\u7ED3\u679C\u7EDF\u8BA1', px + 10, py + 22);

      ctx.fillStyle = COLOR.textDark;
      ctx.font = '12px sans-serif';
      ctx.fillText('\u533A\u57DF\u50CF\u7D20\u603B\u6570: ' + count, px + 10, py + 46);
      ctx.fillText('\u56FE\u50CF\u603B\u50CF\u7D20: ' + (GRID * GRID), px + 10, py + 66);
      ctx.fillText('\u5360\u6BD4: ' + (count / (GRID * GRID) * 100).toFixed(1) + '%', px + 10, py + 86);
      ctx.fillText('\u8FB9\u754C\u50CF\u7D20: ' + boundary.length, px + 10, py + 106);
      ctx.fillText('\u79CD\u5B50\u70B9: (' + SEED_R + ',' + SEED_C + ')', px + 10, py + 126);
      ctx.fillText('\u9608\u503C T = ' + THRESHOLD, px + 10, py + 146);
    }

    return {
      totalSteps: totalSteps,
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

  registerAnimation(67, factory);
})();
