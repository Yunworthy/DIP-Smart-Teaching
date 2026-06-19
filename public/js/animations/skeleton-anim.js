(function () {
  'use strict';

  var C = {
    primary: '#4f46e5', primaryL: '#6366f1',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
    grayBg: '#f9fafb', grayBorder: '#e5e7eb',
    text: '#374151', textDark: '#1f2937', white: '#ffffff'
  };

  // ── 10×10 thick "T" shape ──
  var ORIG = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0]
  ];

  // Precomputed thinning iterations
  function cloneGrid(g) {
    return g.map(function (row) { return row.slice(); });
  }

  // Simple thinning: remove boundary pixels that don't disconnect
  // (simplified Zhang-Suen-like approach for demonstration)
  function isBoundary(g, r, c) {
    if (g[r][c] === 0) return false;
    var dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var i = 0; i < 4; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10 || g[nr][nc] === 0) return true;
    }
    return false;
  }

  // Check if removing pixel disconnects its 8-neighbors
  function wouldDisconnect(g, r, c) {
    var neighbors = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && g[nr][nc] === 1) {
          neighbors.push({ r: nr, c: nc });
        }
      }
    }
    if (neighbors.length <= 1) return false;
    // BFS connectivity among neighbors (treating center as removed)
    var visited = {};
    var queue = [neighbors[0]];
    visited[neighbors[0].r + ',' + neighbors[0].c] = true;
    while (queue.length > 0) {
      var cur = queue.shift();
      for (var i = 1; i < neighbors.length; i++) {
        var key = neighbors[i].r + ',' + neighbors[i].c;
        if (visited[key]) continue;
        var dr = Math.abs(cur.r - neighbors[i].r);
        var dc = Math.abs(cur.c - neighbors[i].c);
        if (dr <= 1 && dc <= 1) {
          // Check the connecting cell is not the center
          if (neighbors[i].r === r && neighbors[i].c === c) continue;
          visited[key] = true;
          queue.push(neighbors[i]);
        }
      }
    }
    return Object.keys(visited).length < neighbors.length;
  }

  function thinOnce(g) {
    var removed = [];
    var ng = cloneGrid(g);
    for (var r = 1; r < 9; r++) {
      for (var c = 1; c < 9; c++) {
        if (!isBoundary(g, r, c)) continue;
        if (wouldDisconnect(g, r, c)) continue;
        // Count foreground 8-neighbors
        var count = 0;
        for (var dr = -1; dr <= 1; dr++)
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && g[nr][nc] === 1) count++;
          }
        // Only remove if it has 2-6 neighbors (not endpoint, not isolated)
        if (count >= 2 && count <= 6) {
          ng[r][c] = 0;
          removed.push({ r: r, c: c });
        }
      }
    }
    return { grid: ng, removed: removed };
  }

  var iterations = [];
  var current = cloneGrid(ORIG);
  for (var iter = 0; iter < 3; iter++) {
    var result = thinOnce(current);
    iterations.push({ before: cloneGrid(current), after: cloneGrid(result.grid), removed: result.removed });
    current = result.grid;
  }
  var skeleton = cloneGrid(current);

  function titleBar(txt) {
    ctx.fillStyle = C.primary;
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 350, 18);
  }

  function label(x, y, txt, color, sz, align) {
    ctx.fillStyle = color || C.textDark;
    ctx.font = (sz || 13) + 'px "Microsoft YaHei", sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
  }

  function drawBinaryGrid(ox, oy, cs, grid, removedCells, skeletonOverlay) {
    var removedSet = {};
    if (removedCells) {
      for (var i = 0; i < removedCells.length; i++)
        removedSet[removedCells[i].r + ',' + removedCells[i].c] = true;
    }
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 10; c++) {
        var key = r + ',' + c;
        if (removedSet[key]) {
          ctx.fillStyle = 'rgba(239,68,68,0.25)';
        } else if (grid[r][c] === 1) {
          ctx.fillStyle = C.primary;
        } else {
          ctx.fillStyle = '#f3f4f6';
        }
        ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
        ctx.strokeStyle = C.grayBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        // Skeleton overlay
        if (skeletonOverlay && skeleton[r][c] === 1 && grid[r][c] === 0) {
          ctx.fillStyle = C.success;
          ctx.fillRect(ox + c * cs + 2, oy + r * cs + 2, cs - 4, cs - 4);
        }
      }
    }
    if (removedSet && Object.keys(removedSet).length > 0) {
      // Mark removed cells with X
      for (var j = 0; j < removedCells.length; j++) {
        var rr = removedCells[j].r, cc = removedCells[j].c;
        ctx.strokeStyle = C.danger;
        ctx.lineWidth = 1.5;
        var cx = ox + cc * cs + cs / 2, cy = oy + rr * cs + cs / 2;
        ctx.beginPath();
        ctx.moveTo(cx - cs / 4, cy - cs / 4); ctx.lineTo(cx + cs / 4, cy + cs / 4);
        ctx.moveTo(cx + cs / 4, cy - cs / 4); ctx.lineTo(cx - cs / 4, cy + cs / 4);
        ctx.stroke();
      }
    }
  }

  function countPixels(g) {
    var n = 0;
    for (var r = 0; r < 10; r++)
      for (var c = 0; c < 10; c++)
        if (g[r][c]) n++;
    return n;
  }

  var stepDescriptions = [
    '原始二值形状：10×10网格上的粗"T"字形，蓝色为前景像素',
    '第1次迭代腐蚀：移除不破坏连通性的边界像素，红色标记被移除的像素',
    '第2次迭代腐蚀：继续细化，更多边界像素被移除',
    '第3次迭代腐蚀：形状进一步变细，接近单像素宽度',
    '最终骨架：单像素宽度的骨架线，保持原始形状的连通性和拓扑结构'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.grayBg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStep0() {
      titleBar('第1步：原始二值形状');
      var cs = 32, ox = 80, oy = 50;
      drawBinaryGrid(ox, oy, cs, ORIG);
      label(ox + cs * 5, oy - 12, '粗体"T"字形 (10×10)', C.textDark, 12);

      var total = countPixels(ORIG);
      label(ox + cs * 5, oy + cs * 10 + 18, '前景像素数：' + total, C.primary, 12);

      // Info
      var ix = 430, iy = 65;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(ix, iy, 240, 250);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, 240, 250);
      label(ix + 120, iy + 18, '骨架化原理', C.primary, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '骨架化(细化)目标：',
        '  将二值形状缩减为单像素宽的',
        '  骨架线，同时保持：',
        '',
        '  1. 连通性不变',
        '  2. 拓扑结构不变',
        '  3. 形状特征保留',
        '',
        '方法：迭代移除边界像素',
        '  - 只移除边界像素',
        '  - 不破坏连通性',
        '  - 不移除端点',
        '  - 直到无法继续移除'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], ix + 10, iy + 40 + i * 15);
      }
    }

    function drawIterStep(stepNum, iterIdx) {
      titleBar('第' + (stepNum + 1) + '步：迭代腐蚀(第' + (iterIdx + 1) + '次)');
      var cs = 30, ox = 40, oy = 48;
      var iter = iterations[iterIdx];

      // Before grid (small)
      label(ox + cs * 5, oy - 10, '腐蚀前', C.textDark, 11);
      drawBinaryGrid(ox, oy, cs, iter.before);

      // Arrow
      ctx.fillStyle = C.primary;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 365, oy + cs * 5);

      // After grid
      var ox2 = 390;
      label(ox2 + cs * 5, oy - 10, '腐蚀后 (移除' + iter.removed.length + '个像素)', C.danger, 11);
      drawBinaryGrid(ox2, oy, cs, iter.after, iter.removed);

      // Stats
      var beforeCount = countPixels(iter.before);
      var afterCount = countPixels(iter.after);
      var sy = oy + cs * 10 + 16;
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('像素变化：' + beforeCount + ' → ' + afterCount + ' (减少' + (beforeCount - afterCount) + '个)', 40, sy);
      ctx.fillText('迭代次数：' + (iterIdx + 1) + ' / 3', 40, sy + 18);

      // Legend
      ctx.fillStyle = C.primary;
      ctx.fillRect(350, sy, 14, 14);
      ctx.fillStyle = C.text;
      ctx.fillText('保留像素', 368, sy + 10);
      ctx.fillStyle = 'rgba(239,68,68,0.25)';
      ctx.fillRect(440, sy, 14, 14);
      ctx.fillStyle = C.text;
      ctx.fillText('本次移除像素', 458, sy + 10);
    }

    function drawStep4() {
      titleBar('第5步：最终骨架');
      var cs = 30, oy = 48;

      // Original (faded) with skeleton overlay
      var ox1 = 40;
      label(ox1 + cs * 5, oy - 10, '骨架叠加在原始形状上', C.textDark, 11);
      // Draw faded original
      for (var r = 0; r < 10; r++) {
        for (var c = 0; c < 10; c++) {
          if (ORIG[r][c] === 1) {
            ctx.fillStyle = 'rgba(79,70,229,0.15)';
          } else {
            ctx.fillStyle = '#f3f4f6';
          }
          ctx.fillRect(ox1 + c * cs, oy + r * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.3;
          ctx.strokeRect(ox1 + c * cs, oy + r * cs, cs, cs);
        }
      }
      // Draw skeleton on top
      for (var r2 = 0; r2 < 10; r2++) {
        for (var c2 = 0; c2 < 10; c2++) {
          if (skeleton[r2][c2] === 1) {
            ctx.fillStyle = C.success;
            ctx.beginPath();
            ctx.arc(ox1 + c2 * cs + cs / 2, oy + r2 * cs + cs / 2, cs / 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // Connect skeleton pixels with lines
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 2;
      for (var r3 = 0; r3 < 10; r3++) {
        for (var c3 = 0; c3 < 10; c3++) {
          if (skeleton[r3][c3] === 0) continue;
          // Right neighbor
          if (c3 + 1 < 10 && skeleton[r3][c3 + 1] === 1) {
            ctx.beginPath();
            ctx.moveTo(ox1 + c3 * cs + cs / 2, oy + r3 * cs + cs / 2);
            ctx.lineTo(ox1 + (c3 + 1) * cs + cs / 2, oy + r3 * cs + cs / 2);
            ctx.stroke();
          }
          // Bottom neighbor
          if (r3 + 1 < 10 && skeleton[r3 + 1][c3] === 1) {
            ctx.beginPath();
            ctx.moveTo(ox1 + c3 * cs + cs / 2, oy + r3 * cs + cs / 2);
            ctx.lineTo(ox1 + c3 * cs + cs / 2, oy + (r3 + 1) * cs + cs / 2);
            ctx.stroke();
          }
        }
      }

      // Standalone skeleton
      var ox2 = 390;
      label(ox2 + cs * 5, oy - 10, '最终骨架 (单像素宽)', C.textDark, 11);
      for (var r4 = 0; r4 < 10; r4++) {
        for (var c4 = 0; c4 < 10; c4++) {
          ctx.fillStyle = skeleton[r4][c4] ? C.primary : '#f3f4f6';
          ctx.fillRect(ox2 + c4 * cs, oy + r4 * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.3;
          ctx.strokeRect(ox2 + c4 * cs, oy + r4 * cs, cs, cs);
        }
      }

      // Stats
      var origCount = countPixels(ORIG);
      var skelCount = countPixels(skeleton);
      var sy = oy + cs * 10 + 16;
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(40, sy - 5, 300, 48);
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 1;
      ctx.strokeRect(40, sy - 5, 300, 48);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始像素数：' + origCount + ' → 骨架像素数：' + skelCount, 52, sy + 12);
      ctx.fillText('压缩率：' + (100 - Math.round(skelCount / origCount * 100)) + '%，连通性保持', 52, sy + 30);

      // Legend
      ctx.fillStyle = C.success;
      ctx.beginPath();
      ctx.arc(400, sy + 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('骨架像素', 410, sy + 14);

      ctx.fillStyle = 'rgba(79,70,229,0.15)';
      ctx.fillRect(500, sy + 3, 14, 14);
      ctx.fillStyle = C.text;
      ctx.fillText('原始形状轮廓', 518, sy + 14);
    }

    return {
      totalSteps: 5,
      draw: function (step) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawIterStep(1, 0); break;
          case 2: drawIterStep(2, 1); break;
          case 3: drawIterStep(3, 2); break;
          case 4: drawStep4(); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(79, factory);
})();
