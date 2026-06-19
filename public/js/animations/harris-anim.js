(function () {
  'use strict';

  var C = {
    primary: '#4f46e5', primaryL: '#6366f1',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
    grayBg: '#f9fafb', grayBorder: '#e5e7eb',
    text: '#374151', textDark: '#1f2937', white: '#ffffff'
  };

  // ── 8×8 image: L-shaped corner (bright corner on dark background) ──
  var IMG = [
    [20,20,20,20,20,180,180,180],
    [20,20,20,20,20,180,180,180],
    [20,20,20,20,20,180,180,180],
    [20,20,20,20,20,20,20,20],
    [20,20,20,20,20,20,20,20],
    [180,180,180,20,20,20,20,20],
    [180,180,180,20,20,20,20,20],
    [180,180,180,20,20,20,20,20]
  ];

  // Compute gradients (Sobel)
  var sobelX = [[-1,0,1],[-2,0,2],[-1,0,1]];
  var sobelY = [[-1,-2,-1],[0,0,0],[1,2,1]];

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

  var Ix = convolve(IMG, sobelX);
  var Iy = convolve(IMG, sobelY);

  // Structure tensor and Harris response
  var k = 0.04;
  var Rmap = [], Ix2map = [], Iy2map = [], IxyMap = [];
  var maxR = -Infinity, minR = Infinity;
  for (var r = 0; r < 8; r++) {
    Rmap[r] = []; Ix2map[r] = []; Iy2map[r] = []; IxyMap[r] = [];
    for (var c = 0; c < 8; c++) {
      // Sum in 3x3 window
      var sxx = 0, syy = 0, sxy = 0;
      for (var wr = -1; wr <= 1; wr++) {
        for (var wc = -1; wc <= 1; wc++) {
          var nr = Math.min(7, Math.max(0, r + wr));
          var nc = Math.min(7, Math.max(0, c + wc));
          sxx += Ix[nr][nc] * Ix[nr][nc];
          syy += Iy[nr][nc] * Iy[nr][nc];
          sxy += Ix[nr][nc] * Iy[nr][nc];
        }
      }
      Ix2map[r][c] = sxx;
      Iy2map[r][c] = syy;
      IxyMap[r][c] = sxy;
      var det = sxx * syy - sxy * sxy;
      var trace = sxx + syy;
      var R = det - k * trace * trace;
      Rmap[r][c] = R;
      if (R > maxR) maxR = R;
      if (R < minR) minR = R;
    }
  }

  // Corner threshold
  var cornerThreshold = maxR * 0.1;
  var corners = [];
  for (var r2 = 0; r2 < 8; r2++)
    for (var c2 = 0; c2 < 8; c2++)
      if (Rmap[r2][c2] > cornerThreshold) corners.push({ r: r2, c: c2 });

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

  function grayColor(v) {
    var g = Math.round(Math.max(0, Math.min(255, v)));
    return 'rgb(' + g + ',' + g + ',' + g + ')';
  }

  function drawGrid(ox, oy, cs, data, colorFn, showVal) {
    for (var r = 0; r < data.length; r++) {
      for (var c = 0; c < data[r].length; c++) {
        ctx.fillStyle = colorFn(data[r][c]);
        ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
        ctx.strokeStyle = C.grayBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        if (showVal && cs >= 28) {
          var val = data[r][c];
          ctx.fillStyle = Math.abs(val) > 100 ? '#fff' : C.textDark;
          ctx.font = (cs > 35 ? '10' : '8') + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var txt = Math.abs(val) > 9999 ? (val / 1000).toFixed(0) + 'k' : Math.round(val);
          ctx.fillText(txt, ox + c * cs + cs / 2, oy + r * cs + cs / 2);
        }
      }
    }
  }

  function heatColor(v, minV, maxV) {
    var range = maxV - minV || 1;
    var t = (v - minV) / range; // 0..1
    if (t < 0.2) return '#312e81';
    if (t < 0.4) return '#4f46e5';
    if (t < 0.6) return '#f59e0b';
    if (t < 0.8) return '#f97316';
    return '#ef4444';
  }

  var stepDescriptions = [
    '原始图像：8×8灰度图像，L形亮角在暗背景上，角点位于(5,3)附近',
    '梯度计算：使用Sobel算子计算水平梯度Ix和垂直梯度Iy',
    '结构张量M：在每个像素的邻域内计算2×2结构张量矩阵',
    'Harris响应函数：R = det(M) - k·trace(M)²，高R值表示角点',
    '角点标记：对R值设阈值，超过阈值的像素标记为角点'
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
      titleBar('第1步：原始图像 — L形角点模式');
      var cs = 38, ox = 100, oy = 55;
      drawGrid(ox, oy, cs, IMG, function (v) { return grayColor(v); }, true);
      label(ox + cs * 4, oy - 12, '8×8 灰度图像', C.textDark, 12);

      // Mark corner region
      ctx.strokeStyle = C.danger;
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(ox + 2.5 * cs, oy + 4.5 * cs, 2 * cs, 2 * cs);
      ctx.setLineDash([]);
      label(ox + 3.5 * cs, oy + 7 * cs, '角点区域', C.danger, 11);

      // Info
      var ix = 430, iy = 70;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(ix, iy, 230, 200);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, 230, 200);
      label(ix + 115, iy + 18, 'Harris角点检测', C.primary, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '角点的特征：',
        '  在任意方向上移动窗口',
        '  都会引起大的灰度变化',
        '',
        '平坦区域：各方向变化都小',
        '边缘：仅一个方向变化大',
        '角点：两个方向变化都大',
        '',
        'Harris方法通过分析结构',
        '张量的特征值来区分这三类'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], ix + 10, iy + 40 + i * 16);
      }
    }

    function drawStep1() {
      titleBar('第2步：梯度计算 — Ix 和 Iy');
      var cs = 30, oy = 52;
      var ox1 = 40;
      var maxIx = 0, maxIy = 0;
      for (var r = 0; r < 8; r++)
        for (var c = 0; c < 8; c++) {
          if (Math.abs(Ix[r][c]) > maxIx) maxIx = Math.abs(Ix[r][c]);
          if (Math.abs(Iy[r][c]) > maxIy) maxIy = Math.abs(Iy[r][c]);
        }

      drawGrid(ox1, oy, cs, Ix, function (v) {
        var t = Math.abs(v) / (maxIx || 1);
        if (v > 0) return 'rgba(59,130,246,' + t + ')';
        if (v < 0) return 'rgba(239,68,68,' + t + ')';
        return '#f3f4f6';
      }, true);
      label(ox1 + cs * 4, oy - 12, '水平梯度 Ix', C.blue, 12);

      var ox2 = 320;
      drawGrid(ox2, oy, cs, Iy, function (v) {
        var t = Math.abs(v) / (maxIy || 1);
        if (v > 0) return 'rgba(59,130,246,' + t + ')';
        if (v < 0) return 'rgba(239,68,68,' + t + ')';
        return '#f3f4f6';
      }, true);
      label(ox2 + cs * 4, oy - 12, '垂直梯度 Iy', C.blue, 12);

      // Gradient arrows on original grid
      var ox3 = 560;
      for (var r2 = 0; r2 < 8; r2++) {
        for (var c2 = 0; c2 < 8; c2++) {
          ctx.fillStyle = grayColor(IMG[r2][c2]);
          ctx.fillRect(ox3 + c2 * 14, oy + r2 * 14, 14, 14);
          var mag = Math.sqrt(Ix[r2][c2] * Ix[r2][c2] + Iy[r2][c2] * Iy[r2][c2]);
          if (mag > 50) {
            var angle = Math.atan2(Iy[r2][c2], Ix[r2][c2]);
            var len = Math.min(6, mag / 80);
            var cx = ox3 + c2 * 14 + 7, cy = oy + r2 * 14 + 7;
            ctx.strokeStyle = C.success;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + len * Math.cos(angle), cy + len * Math.sin(angle));
            ctx.stroke();
          }
        }
      }
      label(ox3 + 56, oy - 12, '梯度方向', C.success, 11);

      // Legend
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(50, oy + cs * 8 + 18, 12, 12);
      ctx.fillStyle = C.text;
      ctx.fillText('正值(增大方向)', 66, oy + cs * 8 + 26);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(180, oy + cs * 8 + 18, 12, 12);
      ctx.fillStyle = C.text;
      ctx.fillText('负值(减小方向)', 196, oy + cs * 8 + 26);
    }

    function drawStep2() {
      titleBar('第3步：结构张量 M');
      var cs = 28, oy = 48;

      // Show Ix² and Iy² grids
      var ox1 = 20;
      drawGrid(ox1, oy, cs, Ix2map, function (v) {
        var maxV = 0;
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (Ix2map[r][c] > maxV) maxV = Ix2map[r][c];
        var t = v / (maxV || 1);
        return 'rgba(79,70,229,' + (0.1 + 0.9 * t) + ')';
      }, true);
      label(ox1 + cs * 4, oy - 10, 'ΣIx²', C.primary, 11);

      var ox2 = 260;
      drawGrid(ox2, oy, cs, IxyMap, function (v) {
        var maxV = 0;
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (Math.abs(IxyMap[r][c]) > maxV) maxV = Math.abs(IxyMap[r][c]);
        var t = Math.abs(v) / (maxV || 1);
        if (v >= 0) return 'rgba(16,185,129,' + (0.1 + 0.9 * t) + ')';
        return 'rgba(239,68,68,' + (0.1 + 0.9 * t) + ')';
      }, true);
      label(ox2 + cs * 4, oy - 10, 'ΣIx·Iy', C.success, 11);

      // Matrix display
      var mx = 500, my = 70;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(mx, my, 170, 130);
      ctx.strokeStyle = C.primary;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx, my, 170, 130);
      label(mx + 85, my + 18, '结构张量 M', C.primary, 12);
      ctx.fillStyle = C.text;
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('┌ ΣIx²   ΣIxIy ┐', mx + 85, my + 48);
      ctx.fillText('│                │', mx + 85, my + 66);
      ctx.fillText('└ ΣIxIy  ΣIy²  ┘', mx + 85, my + 84);
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('在3×3窗口内求和', mx + 85, my + 110);

      // Example matrix at corner
      var ex = 500, ey = 220;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(ex, ey, 170, 100);
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ex, ey, 170, 100);
      label(ex + 85, ey + 16, '角点处矩阵示例', C.warning, 11);
      var cr = 5, cc = 3; // corner pixel
      ctx.fillStyle = C.textDark;
      ctx.font = '11px monospace';
      ctx.fillText(Math.round(Ix2map[cr][cc]), ex + 50, ey + 44);
      ctx.fillText(Math.round(IxyMap[cr][cc]), ex + 120, ey + 44);
      ctx.fillText(Math.round(IxyMap[cr][cc]), ex + 50, ey + 62);
      ctx.fillText(Math.round(Iy2map[cr][cc]), ex + 120, ey + 62);
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('像素(' + cr + ',' + cc + ')', ex + 85, ey + 86);

      // Bottom info
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('M的特征值λ1,λ2决定区域类型：都大→角点，一个大→边缘，都小→平坦', 20, oy + cs * 8 + 30);
    }

    function drawStep3() {
      titleBar('第4步：Harris响应函数 R = det(M) - k·trace(M)²');
      var cs = 34, ox = 50, oy = 52;
      drawGrid(ox, oy, cs, Rmap, function (v) {
        return heatColor(v, minR, maxR);
      }, true);
      label(ox + cs * 4, oy - 12, 'Harris响应R值热力图', C.textDark, 12);

      // Color legend
      var lx = 360, ly = 70;
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('R值色阶：', lx, ly);
      var cols = ['#312e81', '#4f46e5', '#f59e0b', '#f97316', '#ef4444'];
      var lbls = ['很低', '低', '中', '高', '很高'];
      for (var i = 0; i < 5; i++) {
        ctx.fillStyle = cols[i];
        ctx.fillRect(lx + i * 40, ly + 10, 36, 14);
        ctx.fillStyle = C.text;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbls[i], lx + i * 40 + 18, ly + 38);
      }

      // Formula box
      var fx = 350, fy = 130;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(fx, fy, 310, 100);
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(fx, fy, 310, 100);
      ctx.fillStyle = C.textDark;
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Harris响应函数:', fx + 12, fy + 22);
      ctx.font = '13px monospace';
      ctx.fillText('R = det(M) - k · trace(M)²', fx + 12, fy + 46);
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.text;
      ctx.fillText('det(M) = λ1·λ2 = ΣIx²·ΣIy² - (ΣIxIy)²', fx + 12, fy + 66);
      ctx.fillText('trace(M) = λ1+λ2 = ΣIx² + ΣIy²', fx + 12, fy + 82);
      ctx.fillText('k = 0.04 ~ 0.06 (经验常数)', fx + 12, fy + 98);

      // Classification rules
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(fx, fy + 115, 310, 80);
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 1;
      ctx.strokeRect(fx, fy + 115, 310, 80);
      ctx.fillStyle = C.textDark;
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('响应值含义：', fx + 12, fy + 134);
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.danger;
      ctx.fillText('● R > 阈值 → 角点 (λ1,λ2都大)', fx + 12, fy + 154);
      ctx.fillStyle = C.warning;
      ctx.fillText('● R ≈ 0 → 边缘 (仅一个λ大)', fx + 12, fy + 170);
      ctx.fillStyle = '#6b7280';
      ctx.fillText('● R < 0 → 平坦区域 (λ1,λ2都小)', fx + 12, fy + 186);
    }

    function drawStep4() {
      titleBar('第5步：角点标记与分类');
      var cs = 38, ox = 60, oy = 55;

      // Draw original image
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = grayColor(IMG[r][c]);
          ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          ctx.strokeStyle = C.grayBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
        }
      }

      // Mark corners with red circles
      for (var i = 0; i < corners.length; i++) {
        var cr = corners[i];
        ctx.strokeStyle = C.danger;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ox + cr.c * cs + cs / 2, oy + cr.r * cs + cs / 2, cs / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
        // Filled dot in center
        ctx.fillStyle = C.danger;
        ctx.beginPath();
        ctx.arc(ox + cr.c * cs + cs / 2, oy + cr.r * cs + cs / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      label(ox + cs * 4, oy + cs * 8 + 18, '红色圆圈 = 检测到的角点 (共' + corners.length + '个)', C.danger, 12);

      // Classification table
      var tx = 400, ty = 60;
      ctx.fillStyle = C.textDark;
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('区域分类（基于特征值）', tx, ty);

      var types = [
        { name: '平坦区域', color: '#6b7280', icon: '□', desc: 'λ1小, λ2小', bg: '#f3f4f6' },
        { name: '边缘', color: C.warning, icon: '━', desc: 'λ1大, λ2小', bg: '#fef3c7' },
        { name: '角点', color: C.danger, icon: '✦', desc: 'λ1大, λ2大', bg: '#fee2e2' }
      ];

      for (var t = 0; t < types.length; t++) {
        var bx = tx, by = ty + 14 + t * 52;
        ctx.fillStyle = types[t].bg;
        ctx.fillRect(bx, by, 260, 44);
        ctx.strokeStyle = types[t].color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, 260, 44);
        ctx.fillStyle = types[t].color;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(types[t].icon, bx + 22, by + 24);
        ctx.fillStyle = C.textDark;
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(types[t].name, bx + 42, by + 18);
        ctx.fillStyle = C.text;
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillText(types[t].desc, bx + 42, by + 36);
      }

      // Threshold info
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(tx, ty + 180, 260, 50);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty + 180, 260, 50);
      ctx.fillStyle = C.text;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('阈值 = ' + Math.round(cornerThreshold), tx + 12, ty + 200);
      ctx.fillText('最大R值 = ' + Math.round(maxR), tx + 12, ty + 218);
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

  registerAnimation(81, factory);
})();
