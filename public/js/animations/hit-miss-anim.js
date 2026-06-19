(function () {
  'use strict';

  var C = {
    primary: '#4f46e5', primaryL: '#6366f1',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
    grayBg: '#f9fafb', grayBorder: '#e5e7eb',
    text: '#374151', textDark: '#1f2937', white: '#ffffff'
  };

  // ── 8×8 binary image ──
  var IMG = [
    [0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0],
    [0,1,1,1,0,0,0,0],
    [0,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0,0],
    [0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0]
  ];

  // ── Structuring elements (3×3) ──
  // B1 (foreground / hit): detect upper-left corner pattern
  // 0 = don't care, 1 = must be foreground
  var B1 = [
    [0, 1, 1],
    [1, 1, 0],
    [1, 0, 0]
  ];

  // B2 (background / miss): complement - where B1 is 0 (don't care) we check for 0 in image
  // For hit-or-miss: B2 defines where background (0) must be
  // B2[i][j] = 1 means image pixel must be 0 at that position
  var B2 = [
    [1, 0, 0],
    [0, 0, 1],
    [0, 1, 1]
  ];

  // Perform hit-or-miss
  function hitOrMiss(img, b1, b2) {
    var result = [];
    for (var r = 0; r < 8; r++) {
      result[r] = [];
      for (var c = 0; c < 8; c++) result[r][c] = 0;
    }
    for (var r2 = 1; r2 < 7; r2++) {
      for (var c2 = 1; c2 < 7; c2++) {
        var match = true;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            var pixel = img[r2 + dr][c2 + dc];
            // Check B1: where B1=1, pixel must be 1
            if (b1[dr + 1][dc + 1] === 1 && pixel !== 1) { match = false; break; }
            // Check B2: where B2=1, pixel must be 0
            if (b2[dr + 1][dc + 1] === 1 && pixel !== 0) { match = false; break; }
          }
          if (!match) break;
        }
        if (match) result[r2][c2] = 1;
      }
    }
    return result;
  }

  var detectResult = hitOrMiss(IMG, B1, B2);
  var matchPositions = [];
  for (var mr = 0; mr < 8; mr++)
    for (var mc = 0; mc < 8; mc++)
      if (detectResult[mr][mc]) matchPositions.push({ r: mr, c: mc });

  // Sliding window positions for animation
  var slidePositions = [];
  for (var sr = 1; sr < 7; sr++)
    for (var sc = 1; sc < 7; sc++)
      slidePositions.push({ r: sr, c: sc });

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

  function drawBinaryGrid(ox, oy, cs, grid, highlights, highlightColor) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        ctx.fillStyle = grid[r][c] ? '#312e81' : '#f3f4f6';
        ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
        ctx.strokeStyle = C.grayBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        // Text
        if (cs >= 28) {
          ctx.fillStyle = grid[r][c] ? '#fff' : '#aaa';
          ctx.font = (cs > 35 ? '14' : '11') + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(grid[r][c], ox + c * cs + cs / 2, oy + r * cs + cs / 2);
        }
      }
    }
    // Highlights
    if (highlights) {
      for (var i = 0; i < highlights.length; i++) {
        var h = highlights[i];
        ctx.strokeStyle = highlightColor || C.danger;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ox + h.c * cs + cs / 2, oy + h.r * cs + cs / 2, cs / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawSE(ox, oy, cs, se, bgColor, fgColor, title, titleColor) {
    label(ox + cs * 1.5, oy - 12, title, titleColor || C.textDark, 12);
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        if (se[r][c] === 1) {
          ctx.fillStyle = fgColor;
        } else {
          ctx.fillStyle = bgColor;
        }
        ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
        ctx.strokeStyle = C.grayBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        // Symbol
        ctx.fillStyle = se[r][c] === 1 ? '#fff' : C.text;
        ctx.font = (cs > 40 ? '16' : '13') + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(se[r][c] === 1 ? '1' : '0', ox + c * cs + cs / 2, oy + r * cs + cs / 2);
      }
    }
  }

  function drawStar(cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
      var px = cx + r * Math.cos(angle);
      var py = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      angle += Math.PI / 5;
      px = cx + (r * 0.4) * Math.cos(angle);
      py = cy + (r * 0.4) * Math.sin(angle);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  var stepDescriptions = [
    '原始二值图像：8×8网格上的前景(1)和背景(0)像素分布',
    '前景结构元素B1：定义必须为前景(1)的位置模式，1=必须匹配, 0=不关心',
    '背景结构元素B2：定义必须为背景(0)的位置模式，1=必须为0, 0=不关心',
    '匹配过程：滑动窗口同时检查B1(前景)和B2(背景)条件，两者都满足才算匹配',
    '检测结果：标记所有满足击中击不中条件的位置，用于角点/端点等特征检测'
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
      titleBar('第1步：原始二值图像');
      var cs = 38, ox = 100, oy = 55;
      drawBinaryGrid(ox, oy, cs, IMG);
      label(ox + cs * 4, oy - 12, '8×8 二值图像', C.textDark, 12);

      // Count
      var fgCount = 0;
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (IMG[r][c]) fgCount++;
      label(ox + cs * 4, oy + cs * 8 + 18, '前景像素：' + fgCount + '，背景像素：' + (64 - fgCount), C.text, 12);

      // Info
      var ix = 430, iy = 65;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(ix, iy, 240, 260);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, 240, 260);
      label(ix + 120, iy + 18, '击中击不中变换', C.primary, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        'Hit-or-Miss Transform',
        '',
        '同时检测前景和背景的',
        '特定模式匹配。',
        '',
        '需要两个结构元素：',
        '  B1: 前景(击中)模板',
        '  B2: 背景(击不中)模板',
        '',
        '结果 = (A⊖B1) ∩ (A^c⊖B2)',
        '',
        '应用：角点检测、端点',
        '检测、连通性分析等'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], ix + 10, iy + 40 + i * 16);
      }
    }

    function drawStep1() {
      titleBar('第2步：前景结构元素 B1 (击中条件)');
      var cs = 38, ox = 50, oy = 55;
      drawBinaryGrid(ox, oy, cs, IMG);
      label(ox + cs * 4, oy - 12, '原始图像', C.textDark, 11);

      // B1 large display
      var seSz = 50;
      var seX = 430, seY = 70;
      drawSE(seX, seY, seSz, B1, '#ecfdf5', C.success, 'B1: 前景模板', C.success);

      // Explanation
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('B1 定义前景(1)匹配条件：', seX, seY + seSz * 3 + 22);
      ctx.fillStyle = C.success;
      ctx.fillText('● 1 = 该位置必须是前景像素(1)', seX, seY + seSz * 3 + 44);
      ctx.fillStyle = '#6b7280';
      ctx.fillText('● 0 = 该位置不关心(任意值)', seX, seY + seSz * 3 + 64);
      ctx.fillStyle = C.text;
      ctx.fillText('此模式检测"左上角"形状', seX, seY + seSz * 3 + 90);

      // Visual: show the pattern B1 expects
      var px = seX, py = seY + seSz * 3 + 110;
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(px, py, 200, 60);
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, 200, 60);
      ctx.fillStyle = C.textDark;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('B1期望的前景模式：', px + 10, py + 16);
      ctx.font = '10px monospace';
      ctx.fillText('  . ■ ■', px + 10, py + 34);
      ctx.fillText('  ■ ■ .', px + 10, py + 48);
      ctx.fillText('  ■ . .', px + 10, py + 62);
    }

    function drawStep2() {
      titleBar('第3步：背景结构元素 B2 (击不中条件)');
      var cs = 38, ox = 50, oy = 55;
      drawBinaryGrid(ox, oy, cs, IMG);
      label(ox + cs * 4, oy - 12, '原始图像', C.textDark, 11);

      // B2 large display
      var seSz = 50;
      var seX = 430, seY = 70;
      drawSE(seX, seY, seSz, B2, '#fef2f2', C.danger, 'B2: 背景模板', C.danger);

      // Explanation
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('B2 定义背景(0)匹配条件：', seX, seY + seSz * 3 + 22);
      ctx.fillStyle = C.danger;
      ctx.fillText('● 1 = 该位置必须是背景像素(0)', seX, seY + seSz * 3 + 44);
      ctx.fillStyle = '#6b7280';
      ctx.fillText('● 0 = 该位置不关心(任意值)', seX, seY + seSz * 3 + 64);
      ctx.fillStyle = C.text;
      ctx.fillText('确保模式周围有足够的背景', seX, seY + seSz * 3 + 90);

      // Show both side by side small
      var bx = seX, by = seY + seSz * 3 + 110;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(bx, by, 200, 50);
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 200, 50);
      ctx.fillStyle = C.textDark;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('B1 ∩ B2 = ∅ (互不相交)', bx + 10, by + 18);
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('前景和背景模板不能冲突', bx + 10, by + 38);
    }

    function drawStep3() {
      titleBar('第4步：匹配过程 — 滑动窗口检测');
      var cs = 36, ox = 30, oy = 48;
      drawBinaryGrid(ox, oy, cs, IMG);

      // Show sliding window at a matching position
      var winR = matchPositions.length > 0 ? matchPositions[0].r : 2;
      var winC = matchPositions.length > 0 ? matchPositions[0].c : 2;

      // Window outline
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 3;
      ctx.strokeRect(ox + (winC - 1) * cs - 2, oy + (winR - 1) * cs - 2, cs * 3 + 4, cs * 3 + 4);

      // Check marks and X marks within window
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var pr = winR + dr, pc = winC + dc;
          var pixel = IMG[pr][pc];
          var b1Val = B1[dr + 1][dc + 1];
          var b2Val = B2[dr + 1][dc + 1];
          var px = ox + pc * cs + cs / 2;
          var py = oy + pr * cs + cs / 2;

          if (b1Val === 1) {
            // Should be foreground
            if (pixel === 1) {
              ctx.fillStyle = C.success;
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✓', px, py - cs / 4);
            } else {
              ctx.fillStyle = C.danger;
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✗', px, py - cs / 4);
            }
          }
          if (b2Val === 1) {
            // Should be background
            if (pixel === 0) {
              ctx.fillStyle = C.success;
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✓', px, py + cs / 4);
            } else {
              ctx.fillStyle = C.danger;
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✗', px, py + cs / 4);
            }
          }
        }
      }

      label(ox + cs * 4, oy + cs * 8 + 14, '窗口中心(' + winR + ',' + winC + '): B1和B2条件检查', C.warning, 11);

      // Right side: show all tested positions
      var rx = 360, ry = 48, rcs = 30;
      label(rx + rcs * 4, ry - 12, '所有检测位置 (6×6)', C.textDark, 11);
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          if (r >= 1 && r <= 6 && c >= 1 && c <= 6) {
            ctx.fillStyle = '#eef2ff';
          } else {
            ctx.fillStyle = '#f3f4f6';
          }
          ctx.fillRect(rx + c * rcs, ry + r * rcs, rcs, rcs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(rx + c * rcs, ry + r * rcs, rcs, rcs);
        }
      }
      // Mark matching positions
      for (var m = 0; m < matchPositions.length; m++) {
        var mp = matchPositions[m];
        ctx.fillStyle = C.success;
        ctx.fillRect(rx + mp.c * rcs + 2, ry + mp.r * rcs + 2, rcs - 4, rcs - 4);
      }
      // Mark current window position
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + winC * rcs, ry + winR * rcs, rcs, rcs);

      label(rx + rcs * 4, ry + 8 * rcs + 14, '绿色=匹配位置，黄色框=当前窗口', C.text, 10);

      // Formula
      var fy = 320;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(rx, fy, 300, 55);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, fy, 300, 55);
      ctx.fillStyle = C.textDark;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('结果 = (A ⊖ B1) ∩ (Ac ⊖ B2)', rx + 150, fy + 20);
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('前景腐蚀 ∩ 背景腐蚀', rx + 150, fy + 40);
    }

    function drawStep4() {
      titleBar('第5步：检测结果');
      var cs = 38, ox = 50, oy = 55;

      // Draw original with detections
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = IMG[r][c] ? '#312e81' : '#f3f4f6';
          ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        }
      }

      // Mark detections with stars
      for (var m = 0; m < matchPositions.length; m++) {
        var mp = matchPositions[m];
        drawStar(ox + mp.c * cs + cs / 2, oy + mp.r * cs + cs / 2, cs / 3, C.warning);
        // Circle
        ctx.strokeStyle = C.warning;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ox + mp.c * cs + cs / 2, oy + mp.r * cs + cs / 2, cs / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      label(ox + cs * 4, oy + cs * 8 + 18, '星号 = 检测到的特征点 (共' + matchPositions.length + '个)', C.warning, 12);

      // Result grid
      var rx = 400, ry = 55, rcs = 38;
      label(rx + rcs * 4, ry - 12, '检测结果矩阵', C.textDark, 12);
      for (var r2 = 0; r2 < 8; r2++) {
        for (var c2 = 0; c2 < 8; c2++) {
          ctx.fillStyle = detectResult[r2][c2] ? C.warning : '#f3f4f6';
          ctx.fillRect(rx + c2 * rcs, ry + r2 * rcs, rcs, rcs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(rx + c2 * rcs, ry + r2 * rcs, rcs, rcs);
          if (detectResult[r2][c2]) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', rx + c2 * rcs + rcs / 2, ry + r2 * rcs + rcs / 2);
          } else {
            ctx.fillStyle = '#ccc';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('0', rx + c2 * rcs + rcs / 2, ry + r2 * rcs + rcs / 2);
          }
        }
      }

      // Application note
      var ny = ry + rcs * 8 + 16;
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(rx, ny, 300, 40);
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ny, 300, 40);
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('应用：通过设计不同的B1/B2模板，可检测', rx + 8, ny + 14);
      ctx.fillText('角点、端点、T形交叉等拓扑特征', rx + 8, ny + 30);
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

  registerAnimationBatch([76, 106], factory);
})();
