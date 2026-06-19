/**
 * Pixel Neighborhood Animation (4/8-Neighborhood)
 *
 * Step 0: 9x9 pixel grid with center pixel highlighted
 * Step 1: 4-neighborhood N4(p) — up, down, left, right
 * Step 2: Diagonal neighborhood ND(p) — four corners
 * Step 3: 8-neighborhood N8(p) = N4(p) union ND(p)
 * Step 4: Connectivity — path of connected pixels
 * Step 5: Distance metrics — D4 (city-block) and D8 (chessboard)
 *
 * Registered for KP ID 12.
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

  var GRID = 9;
  var CENTER = 4; // center index (row=4, col=4)

  // Pre-compute pixel values for the grid (light gradient)
  var gridValues = [];
  (function () {
    for (var r = 0; r < GRID; r++) {
      var row = [];
      for (var c = 0; c < GRID; c++) {
        row.push(Math.round(160 + (r + c) * 5));
      }
      gridValues.push(row);
    }
  })();

  // 4-neighbor offsets
  var N4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  // Diagonal neighbor offsets
  var ND = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  // A connected path for step 4
  var path = [
    [4, 4], [4, 5], [3, 5], [3, 6], [2, 6],
    [2, 7], [3, 7], [4, 7], [5, 7], [5, 6],
    [6, 6], [6, 5], [6, 4], [5, 4], [5, 3],
    [4, 3]
  ];

  var stepDescriptions = [
    '<b>步骤 1/6 — 像素网格与中心像素：</b>展示 9x9 像素网格，红色高亮标记中心像素 p(4,4)。像素的邻域定义基于其与中心像素的空间关系。',
    '<b>步骤 2/6 — 4-邻域 N4(p)：</b>绿色标记中心像素的 4 个直接相邻像素（上、下、左、右）。<code>N4(p) = {(x+1,y), (x-1,y), (x,y+1), (x,y-1)}</code>。',
    '<b>步骤 3/6 — 对角邻域 ND(p)：</b>蓝色标记 4 个对角方向的相邻像素。<code>ND(p) = {(x+1,y+1), (x+1,y-1), (x-1,y+1), (x-1,y-1)}</code>。',
    '<b>步骤 4/6 — 8-邻域 N8(p)：</b>8-邻域是 4-邻域与对角邻域的并集: <code>N8(p) = N4(p) UNION ND(p)</code>，共 8 个相邻像素。',
    '<b>步骤 5/6 — 连通性概念：</b>像素链中相邻像素属于同一集合 V 时构成连通路径。连通性是区域分割和边缘跟踪的基础。',
    '<b>步骤 6/6 — 距离度量：</b>D4 距离（城市街区距离）= |x1-x2| + |y1-y2|，D8 距离（棋盘距离）= max(|x1-x2|, |y1-y2|)。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    var cellSize = 36;
    var gridW = GRID * cellSize;
    var gridOx = 30;
    var gridOy = 44;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStepHeader(step, total) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, W, 32);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('步骤 ' + (step + 1) + ' / ' + total, 12, 16);
    }

    /** Draw the base grid, optionally coloring specific cells.
     *  highlights: array of { r, c, color, label }
     */
    function drawBaseGrid(highlights, centerColor, centerLabel) {
      centerColor = centerColor || RED;
      centerLabel = centerLabel || 'p';

      // Draw cells
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var x = gridOx + c * cellSize;
          var y = gridOy + r * cellSize;
          var v = gridValues[r][c];

          // Default fill: light gray based on value
          ctx.fillStyle = 'rgb(' + Math.min(v, 230) + ',' + Math.min(v, 230) + ',' + Math.min(v, 230) + ')';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellSize, cellSize);

          // Coordinate label
          ctx.fillStyle = '#9ca3af';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(r + ',' + c, x + cellSize / 2, y + 2);
        }
      }

      // Apply highlights
      if (highlights) {
        for (var i = 0; i < highlights.length; i++) {
          var hl = highlights[i];
          var hx = gridOx + hl.c * cellSize;
          var hy = gridOy + hl.r * cellSize;
          ctx.fillStyle = hl.color;
          ctx.globalAlpha = 0.45;
          ctx.fillRect(hx, hy, cellSize, cellSize);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = hl.color;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
          if (hl.label) {
            ctx.fillStyle = hl.color;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hl.label, hx + cellSize / 2, hy + cellSize / 2 + 4);
          }
        }
      }

      // Center pixel always highlighted
      var cx = gridOx + CENTER * cellSize;
      var cy = gridOy + CENTER * cellSize;
      ctx.fillStyle = centerColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(cx, cy, cellSize, cellSize);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = centerColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerLabel, cx + cellSize / 2, cy + cellSize / 2 + 2);

      // Outer border
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(gridOx, gridOy, gridW, gridW);
    }

    // ---------- Step 0: Basic grid ----------
    function drawStep0() {
      drawStepHeader(0, 6);
      drawBaseGrid(null, RED, 'p');

      // Info panel on the right
      var px = gridOx + gridW + 24;
      var py = gridOy + 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, 280, 220);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, 280, 220);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('像素邻域概念', px + 12, py + 12);

      ctx.font = '12px sans-serif';
      var lines = [
        '每个像素都有邻域像素集合,',
        '定义基于空间距离关系。',
        '',
        '中心像素 p 位于 (4, 4)',
        '网格大小: 9 x 9',
        '',
        '邻域类型:',
        '  - 4-邻域 N4(p): 上下左右',
        '  - 对角邻域 ND(p): 四个对角',
        '  - 8-邻域 N8(p): 全部8个邻像素'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], px + 12, py + 36 + i * 18);
      }

      // Bottom note
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(20, gridOy + gridW + 12, W - 40, 30);
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, gridOy + gridW + 12, W - 40, 30);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('红色像素 p(4,4) 是我们关注的中心像素，下一步将展示其不同类型的邻域。', 34, gridOy + gridW + 22);
    }

    // ---------- Step 1: 4-neighborhood ----------
    function drawStep1() {
      drawStepHeader(1, 6);

      var highlights = [];
      for (var i = 0; i < N4.length; i++) {
        highlights.push({
          r: CENTER + N4[i][0],
          c: CENTER + N4[i][1],
          color: GREEN,
          label: 'N4'
        });
      }
      drawBaseGrid(highlights, RED, 'p');

      // Info panel
      var px = gridOx + gridW + 24;
      var py = gridOy + 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, 280, 200);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, 280, 200);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('4-邻域 N4(p)', px + 12, py + 12);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      var lines = [
        'N4(p) 包含4个直接相邻像素:',
        '',
        '  上方: (3, 4)',
        '  下方: (5, 4)',
        '  左方: (4, 3)',
        '  右方: (4, 5)',
        '',
        'N4(p) = {(x+dx, y+dy) :',
        '  (dx,dy) in {+/-1,0},{0,+/-1}}',
        '',
        '也称 "十字邻域" 或 "4-连通"。'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.font = i === 0 ? 'bold 12px sans-serif' : '11px monospace';
        ctx.fillStyle = i === 0 ? GREEN : TEXT_COLOR;
        ctx.fillText(lines[i], px + 12, py + 34 + i * 15);
      }

      // Visual diagram: small cross
      var dx = px + 100;
      var dy = py + 195;
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(px + 10, py + 185, 260, 8);
    }

    // ---------- Step 2: Diagonal neighborhood ----------
    function drawStep2() {
      drawStepHeader(2, 6);

      var highlights = [];
      for (var i = 0; i < ND.length; i++) {
        highlights.push({
          r: CENTER + ND[i][0],
          c: CENTER + ND[i][1],
          color: LIGHT_INDIGO,
          label: 'ND'
        });
      }
      drawBaseGrid(highlights, RED, 'p');

      // Info panel
      var px = gridOx + gridW + 24;
      var py = gridOy + 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, 280, 200);
      ctx.strokeStyle = LIGHT_INDIGO;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, 280, 200);

      ctx.fillStyle = LIGHT_INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('对角邻域 ND(p)', px + 12, py + 12);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      var lines = [
        'ND(p) 包含4个对角方向像素:',
        '',
        '  左上: (3, 3)',
        '  右上: (3, 5)',
        '  左下: (5, 3)',
        '  右下: (5, 5)',
        '',
        'ND(p) = {(x+dx, y+dy) :',
        '  (dx,dy) in {+/-1, +/-1}}',
        '',
        '对角邻域在8-连通中使用。'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.font = i === 0 ? 'bold 12px sans-serif' : '11px monospace';
        ctx.fillStyle = i === 0 ? LIGHT_INDIGO : TEXT_COLOR;
        ctx.fillText(lines[i], px + 12, py + 34 + i * 15);
      }
    }

    // ---------- Step 3: 8-neighborhood ----------
    function drawStep3() {
      drawStepHeader(3, 6);

      var highlights = [];
      // N4 in green
      for (var i = 0; i < N4.length; i++) {
        highlights.push({
          r: CENTER + N4[i][0],
          c: CENTER + N4[i][1],
          color: GREEN,
          label: 'N4'
        });
      }
      // ND in blue
      for (var j = 0; j < ND.length; j++) {
        highlights.push({
          r: CENTER + ND[j][0],
          c: CENTER + ND[j][1],
          color: LIGHT_INDIGO,
          label: 'ND'
        });
      }
      drawBaseGrid(highlights, RED, 'p');

      // Info panel
      var px = gridOx + gridW + 24;
      var py = gridOy + 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, 280, 240);
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, 280, 240);

      ctx.fillStyle = AMBER;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('8-邻域 N8(p) = N4(p) U ND(p)', px + 12, py + 12);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      var lines = [
        '8-邻域 = 4-邻域 + 对角邻域',
        '',
        '共8个相邻像素:',
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], px + 12, py + 34 + i * 16);
      }

      // Draw mini 3x3 diagram
      var miniOx = px + 50;
      var miniOy = py + 90;
      var miniCell = 36;
      var allNeighbors = N4.concat(ND);
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var mx = miniOx + (dc + 1) * miniCell;
          var my = miniOy + (dr + 1) * miniCell;
          if (dr === 0 && dc === 0) {
            ctx.fillStyle = RED;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(mx, my, miniCell, miniCell);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('p', mx + miniCell / 2, my + miniCell / 2);
          } else {
            var isN4 = (Math.abs(dr) + Math.abs(dc) === 1);
            ctx.fillStyle = isN4 ? GREEN : LIGHT_INDIGO;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(mx, my, miniCell, miniCell);
            ctx.globalAlpha = 1;
            ctx.fillStyle = isN4 ? GREEN : LIGHT_INDIGO;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isN4 ? 'N4' : 'ND', mx + miniCell / 2, my + miniCell / 2);
          }
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 1;
          ctx.strokeRect(mx, my, miniCell, miniCell);
        }
      }

      // Legend
      ctx.fillStyle = GREEN;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('■ N4 (4-邻域)', px + 12, py + 210);
      ctx.fillStyle = LIGHT_INDIGO;
      ctx.fillText('■ ND (对角邻域)', px + 130, py + 210);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('N8(p) = N4(p) U ND(p)', px + 12, py + 228);
    }

    // ---------- Step 4: Connectivity / path ----------
    function drawStep4() {
      drawStepHeader(4, 6);

      // Draw base grid first
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var x = gridOx + c * cellSize;
          var y = gridOy + r * cellSize;
          var v = gridValues[r][c];
          ctx.fillStyle = 'rgb(' + Math.min(v, 230) + ',' + Math.min(v, 230) + ',' + Math.min(v, 230) + ')';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      // Highlight path pixels
      for (var i = 0; i < path.length; i++) {
        var pr = path[i][0];
        var pc = path[i][1];
        var px = gridOx + pc * cellSize;
        var py = gridOy + pr * cellSize;
        ctx.fillStyle = INDIGO;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = INDIGO;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

        // Path index
        ctx.fillStyle = INDIGO;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, px + cellSize / 2, py + cellSize / 2);
      }

      // Draw connecting lines between path pixels
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (var j = 0; j < path.length; j++) {
        var lx = gridOx + path[j][1] * cellSize + cellSize / 2;
        var ly = gridOy + path[j][0] * cellSize + cellSize / 2;
        if (j === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Start and end markers
      var sx = gridOx + path[0][1] * cellSize + cellSize / 2;
      var sy = gridOy + path[0][0] * cellSize + cellSize / 2;
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', sx, sy);

      var ex = gridOx + path[path.length - 1][1] * cellSize + cellSize / 2;
      var ey = gridOy + path[path.length - 1][0] * cellSize + cellSize / 2;
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('E', ex, ey);

      // Outer border
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(gridOx, gridOy, gridW, gridW);

      // Info panel
      var ipx = gridOx + gridW + 24;
      var ipy = gridOy + 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ipx, ipy, 280, 260);
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ipx, ipy, 280, 260);

      ctx.fillStyle = AMBER;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('像素连通性', ipx + 12, ipy + 12);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      var lines = [
        '连通路径: S(4,4) -> E(4,3)',
        '路径长度: ' + path.length + ' 个像素',
        '',
        '连通性定义:',
        '若像素 p 和 q 属于集合 V,',
        '且 q 在 p 的邻域中,则 p,q 连通。',
        '',
        '4-连通: 仅使用 N4 邻域',
        '8-连通: 使用 N8 邻域',
        '',
        '应用:',
        '  - 区域分割',
        '  - 边缘跟踪',
        '  - 连通分量标记'
      ];
      for (var k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], ipx + 12, ipy + 34 + k * 16);
      }

      // Legend at bottom
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(gridOx + 20, gridOy + gridW + 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('起点 S', gridOx + 30, gridOy + gridW + 24);

      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(gridOx + 100, gridOy + gridW + 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('终点 E', gridOx + 110, gridOy + gridW + 24);

      ctx.fillStyle = AMBER;
      ctx.font = '11px sans-serif';
      ctx.fillText('--- 连通路径', gridOx + 180, gridOy + gridW + 24);
    }

    // ---------- Step 5: Distance metrics ----------
    function drawStep5() {
      drawStepHeader(5, 6);

      // Draw grid with distance values
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var x = gridOx + c * cellSize;
          var y = gridOy + r * cellSize;

          // Color intensity by distance from center
          var d4 = Math.abs(r - CENTER) + Math.abs(c - CENTER);
          var d8 = Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER));

          // Background color based on D4 distance
          var intensity = Math.max(0, 255 - d4 * 30);
          ctx.fillStyle = 'rgb(' + intensity + ',' + intensity + ',' + Math.min(255, intensity + 40) + ')';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellSize, cellSize);

          // Center pixel
          if (r === CENTER && c === CENTER) {
            ctx.fillStyle = RED;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('p', x + cellSize / 2, y + cellSize / 2);
          } else {
            // Show D4 / D8 values
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('D4=' + d4, x + cellSize / 2, y + 4);
            ctx.fillStyle = LIGHT_INDIGO;
            ctx.fillText('D8=' + d8, x + cellSize / 2, y + 17);
          }
        }
      }

      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(gridOx, gridOy, gridW, gridW);

      // Info panel
      var px = gridOx + gridW + 24;
      var py = gridOy + 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, 280, 280);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, 280, 280);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('距离度量', px + 12, py + 12);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      var lines = [
        'D4 距离 (城市街区 / 曼哈顿):',
        '  D4(p,q) = |x1-x2| + |y1-y2|',
        '  沿水平和垂直方向移动',
        '',
        'D8 距离 (棋盘 / 切比雪夫):',
        '  D8(p,q) = max(|x1-x2|, |y1-y2|)',
        '  允许对角移动',
        '',
        '示例: p(4,4) -> q(1,6)',
        '  D4 = |4-1| + |4-6| = 3+2 = 5',
        '  D8 = max(|4-1|, |4-6|) = 3',
        '',
        '颜色越深 = 距中心越远'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.font = i === 0 || i === 4 ? 'bold 11px sans-serif' : '11px monospace';
        if (i === 0) ctx.fillStyle = TEXT_COLOR;
        else if (i === 4) ctx.fillStyle = LIGHT_INDIGO;
        else ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(lines[i], px + 12, py + 34 + i * 17);
      }

      // Highlight example q pixel
      var qr = 1, qc = 6;
      var qx = gridOx + qc * cellSize;
      var qy = gridOy + qr * cellSize;
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 3;
      ctx.strokeRect(qx + 1, qy + 1, cellSize - 2, cellSize - 2);
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('q', qx + cellSize + 2, qy + cellSize / 2);
    }

    // ---------- Public API ----------

    return {
      totalSteps: 6,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(); break;
          case 3: drawStep3(); break;
          case 4: drawStep4(); break;
          case 5: drawStep5(); break;
        }
      },
      reset: function () { /* stateless */ },
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(12, factory);
})();
