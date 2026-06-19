(function () {
  'use strict';

  // ── Color palette ──
  var C = {
    primary: '#4f46e5', primaryL: '#6366f1',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
    grayBg: '#f9fafb', grayBorder: '#e5e7eb',
    text: '#374151', textDark: '#1f2937',
    white: '#ffffff', blue: '#3b82f6'
  };

  // ── 8×8 binary edge image: diagonal line ──
  var EDGE = [
    [0,0,0,0,0,0,1,0],
    [0,0,0,0,0,1,0,0],
    [0,0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,1,0,0,0,0,0],
    [0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
  ];

  // Edge points (row, col) in image coordinates
  var edgePoints = [];
  for (var r = 0; r < 8; r++)
    for (var c = 0; c < 8; c++)
      if (EDGE[r][c]) edgePoints.push({ r: r, c: c });

  // Hough space: theta 0..179 (degrees), rho -8..+11 => 20 bins
  var THETA_BINS = 180;
  var RHO_MIN = -10, RHO_MAX = 12, RHO_BINS = RHO_MAX - RHO_MIN;

  function houghAccumulator(points) {
    var acc = [];
    for (var t = 0; t < THETA_BINS; t++) {
      acc[t] = [];
      for (var ri = 0; ri < RHO_BINS; ri++) acc[t][ri] = 0;
    }
    for (var p = 0; p < points.length; p++) {
      for (var t2 = 0; t2 < THETA_BINS; t2++) {
        var theta = t2 * Math.PI / 180;
        var rho = points[p].c * Math.cos(theta) + points[p].r * Math.sin(theta);
        var ri2 = Math.round(rho - RHO_MIN);
        if (ri2 >= 0 && ri2 < RHO_BINS) acc[t2][ri2]++;
      }
    }
    return acc;
  }

  function singlePointAccumulator(pt) {
    var acc = [];
    for (var t = 0; t < THETA_BINS; t++) {
      acc[t] = [];
      for (var ri = 0; ri < RHO_BINS; ri++) acc[t][ri] = 0;
    }
    for (var t2 = 0; t2 < THETA_BINS; t2++) {
      var theta = t2 * Math.PI / 180;
      var rho = pt.c * Math.cos(theta) + pt.r * Math.sin(theta);
      var ri2 = Math.round(rho - RHO_MIN);
      if (ri2 >= 0 && ri2 < RHO_BINS) acc[t2][ri2] = 1;
    }
    return acc;
  }

  // Find peak in accumulator
  var fullAcc = houghAccumulator(edgePoints);
  var peakTheta = 0, peakRho = 0, peakVal = 0;
  for (var t = 0; t < THETA_BINS; t++) {
    for (var ri = 0; ri < RHO_BINS; ri++) {
      if (fullAcc[t][ri] > peakVal) {
        peakVal = fullAcc[t][ri];
        peakTheta = t;
        peakRho = ri + RHO_MIN;
      }
    }
  }

  // ── Helpers ──
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

  function drawEdgeGrid(ox, oy, cs, highlight) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (EDGE[r][c]) {
          ctx.fillStyle = C.danger;
        } else {
          ctx.fillStyle = '#f3f4f6';
        }
        if (highlight && highlight.r === r && highlight.c === c) {
          ctx.fillStyle = C.warning;
        }
        ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
        ctx.strokeStyle = C.grayBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cs, oy + r * cs, cs, cs);
      }
    }
    // Coordinate labels
    ctx.fillStyle = C.text;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (var i = 0; i < 8; i++) {
      ctx.fillText(i, ox + i * cs + cs / 2, oy - 6);
      ctx.fillText(i, ox - 8, oy + i * cs + cs / 2);
    }
  }

  function drawHoughSpace(ox, oy, w, h, acc, maxV, showPeak, curveColor) {
    // Background
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(ox, oy, w, h);

    // Draw accumulator
    if (acc) {
      var tB = THETA_BINS, rB = RHO_BINS;
      var cellW = w / tB, cellH = h / rB;
      var mv = maxV || peakVal;
      for (var ti = 0; ti < tB; ti++) {
        for (var ri = 0; ri < rB; ri++) {
          if (acc[ti][ri] > 0) {
            var intensity = acc[ti][ri] / mv;
            if (curveColor) {
              ctx.fillStyle = curveColor;
              ctx.globalAlpha = Math.min(1, intensity);
            } else {
              var rb = Math.round(99 + 156 * intensity);
              var gb = Math.round(102 + 153 * intensity);
              var bb = Math.round(241);
              ctx.fillStyle = 'rgb(' + rb + ',' + gb + ',' + bb + ')';
            }
            ctx.fillRect(ox + ti * cellW, oy + ri * cellH, Math.ceil(cellW), Math.ceil(cellH));
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Axes
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy + h); ctx.lineTo(ox + w, oy + h);
    ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + h);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#c7d2fe';
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('θ (0°~180°)', ox + w / 2, oy + h + 14);
    ctx.fillText('0°', ox, oy + h + 14);
    ctx.fillText('180°', ox + w, oy + h + 14);

    ctx.save();
    ctx.translate(ox - 12, oy + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ρ', 0, 0);
    ctx.restore();

    // Peak marker
    if (showPeak && peakVal > 0) {
      var px = ox + (peakTheta / THETA_BINS) * w;
      var py = oy + ((peakRho - RHO_MIN) / RHO_BINS) * h;
      ctx.fillStyle = C.warning;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      label(px + 10, py - 12, '峰值(' + peakTheta + '°,ρ=' + peakRho + ')', C.warning, 10, 'left');
    }
  }

  // ── Step descriptions ──
  var stepDescriptions = [
    '边缘图像：8×8二值图像中，红色像素标记出边缘点，形成对角线',
    '参数空间(ρ,θ)：霍夫变换将直线表示为参数空间中的正弦曲线',
    '单点投票：一个边缘点对应参数空间中一条正弦曲线，表示所有经过该点的可能直线',
    '多点累积：所有边缘点的正弦曲线交汇处的累积值最大，即为检测到的直线参数',
    '检测到的直线：将参数空间的峰值(ρ,θ)映射回图像空间，绘制检测到的直线'
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

    // Step 0: Edge image
    function drawStep0() {
      titleBar('第1步：边缘图像');
      var cs = 36, ox = 60, oy = 55;
      drawEdgeGrid(ox, oy, cs);

      label(ox + cs * 4, oy + cs * 8 + 20, '红色像素 = 边缘点 (共' + edgePoints.length + '个)', C.danger, 12);

      // Info panel
      var ix = 400, iy = 70;
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(ix, iy, 250, 220);
      ctx.strokeStyle = C.primaryL;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, 250, 220);

      label(ix + 125, iy + 18, '霍夫变换原理', C.primary, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      var lines = [
        '图像空间中的直线可以用参数方程表示：',
        '  ρ = x·cos(θ) + y·sin(θ)',
        '',
        '其中：',
        '  ρ = 原点到直线的距离',
        '  θ = 直线法线与x轴的夹角',
        '',
        '图像空间中的每个边缘点',
        '对应参数空间中的一条正弦曲线',
        '',
        '多条曲线交点 → 检测到的直线'
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], ix + 12, iy + 40 + i * 16);
      }
    }

    // Step 1: Parameter space axes
    function drawStep1() {
      titleBar('第2步：参数空间 (ρ, θ)');
      var cs = 36, ox = 40, oy = 55;
      drawEdgeGrid(ox, oy, cs);
      label(ox + cs * 4, oy - 14, '边缘图像', C.textDark, 12);

      // Arrow
      ctx.fillStyle = C.primary;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 350, oy + cs * 4);

      // Hough space (empty with axes)
      var hx = 390, hy = 55, hw = 260, hh = 240;
      drawHoughSpace(hx, hy, hw, hh, null, 1, false);
      label(hx + hw / 2, hy - 14, 'Hough参数空间', C.textDark, 12);

      // Grid lines in hough space
      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 0.3;
      for (var i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + i * hw / 6, hy);
        ctx.lineTo(hx + i * hw / 6, hy + hh);
        ctx.stroke();
      }
      for (var j = 1; j < 6; j++) {
        ctx.beginPath();
        ctx.moveTo(hx, hy + j * hh / 6);
        ctx.lineTo(hx + hw, hy + j * hh / 6);
        ctx.stroke();
      }

      // Explain axes
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('横轴：θ (0°~180°)', hx + 10, hy + hh + 30);
      ctx.fillText('纵轴：ρ (直线到原点的距离)', hx + 10, hy + hh + 48);
      ctx.fillText('每个点(θ,ρ)代表图像空间中的一条直线', hx + 10, hy + hh + 66);
    }

    // Step 2: Single point voting
    function drawStep2() {
      titleBar('第3步：单点投票 — 一个边缘点的正弦曲线');
      var cs = 36, ox = 40, oy = 55;
      var pt = edgePoints[2]; // pick a middle point
      drawEdgeGrid(ox, oy, cs, pt);
      label(ox + cs * 4, oy - 14, '高亮 = 当前投票点', C.textDark, 11);

      // Highlight selected point with circle
      ctx.strokeStyle = C.warning;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ox + pt.c * cs + cs / 2, oy + pt.r * cs + cs / 2, cs / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Point info
      label(ox + cs * 4, oy + cs * 8 + 16, '点坐标: (x=' + pt.c + ', y=' + pt.r + ')', C.warning, 12);

      // Draw curve for this point
      var hx = 390, hy = 55, hw = 260, hh = 240;
      var singleAcc = singlePointAccumulator(pt);
      drawHoughSpace(hx, hy, hw, hh, singleAcc, 1, false, '#60a5fa');
      label(hx + hw / 2, hy - 14, '参数空间中的正弦曲线', C.blue, 12);

      // Draw smooth sinusoidal curve overlay
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var deg = 0; deg < 180; deg++) {
        var theta = deg * Math.PI / 180;
        var rho = pt.c * Math.cos(theta) + pt.r * Math.sin(theta);
        var px = hx + (deg / 180) * hw;
        var py = hy + ((rho - RHO_MIN) / RHO_BINS) * hh;
        if (deg === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Formula
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ρ(θ) = ' + pt.c + '·cos(θ) + ' + pt.r + '·sin(θ)', hx + 10, hy + hh + 30);
      ctx.fillText('该曲线上的每个点代表一条经过该边缘点的直线', hx + 10, hy + hh + 48);
    }

    // Step 3: Multi-point accumulation
    function drawStep3() {
      titleBar('第4步：多点累积 — 曲线交汇处即检测到的直线');
      var cs = 36, ox = 40, oy = 55;
      drawEdgeGrid(ox, oy, cs);
      label(ox + cs * 4, oy - 14, '所有边缘点参与投票', C.textDark, 11);

      // Full accumulator
      var hx = 390, hy = 55, hw = 260, hh = 240;
      drawHoughSpace(hx, hy, hw, hh, fullAcc, peakVal, true);
      label(hx + hw / 2, hy - 14, '累积投票结果', C.textDark, 12);

      // Draw curves for each point faintly
      ctx.lineWidth = 0.8;
      for (var p = 0; p < edgePoints.length; p++) {
        ctx.strokeStyle = 'rgba(251,191,36,0.3)';
        ctx.beginPath();
        for (var deg = 0; deg < 180; deg++) {
          var theta = deg * Math.PI / 180;
          var rho = edgePoints[p].c * Math.cos(theta) + edgePoints[p].r * Math.sin(theta);
          var px = hx + (deg / 180) * hw;
          var py = hy + ((rho - RHO_MIN) / RHO_BINS) * hh;
          if (deg === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Info
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('共' + edgePoints.length + '条曲线交汇，峰值处投票数 = ' + peakVal, hx + 10, hy + hh + 30);
      ctx.fillText('峰值坐标：θ = ' + peakTheta + '°，ρ = ' + peakRho, hx + 10, hy + hh + 48);
      ctx.fillStyle = C.success;
      ctx.fillText('交汇处 = 图像中最显著的直线参数', hx + 10, hy + hh + 66);
    }

    // Step 4: Detected line
    function drawStep4() {
      titleBar('第5步：检测到的直线');
      var cs = 36, ox = 60, oy = 55;
      drawEdgeGrid(ox, oy, cs);

      // Draw detected line on image
      var thetaRad = peakTheta * Math.PI / 180;
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      // Line: x*cos(θ) + y*sin(θ) = ρ
      // Parametrize: if sin(θ) != 0, y = (ρ - x*cos(θ))/sin(θ)
      var x1 = 0, y1 = (peakRho - 0 * Math.cos(thetaRad)) / Math.sin(thetaRad);
      var x2 = 7, y2 = (peakRho - 7 * Math.cos(thetaRad)) / Math.sin(thetaRad);
      // Clamp
      function clampLine(xa, ya, xb, yb) {
        var pts = [];
        if (ya >= 0 && ya <= 7) pts.push({ x: xa, y: ya });
        if (yb >= 0 && yb <= 7) pts.push({ x: xb, y: yb });
        if (ya < 0) { var xx = (peakRho - 0 * Math.sin(thetaRad)) / Math.cos(thetaRad); pts.push({ x: xx, y: 0 }); }
        if (yb > 7) { var xx2 = (peakRho - 7 * Math.sin(thetaRad)) / Math.cos(thetaRad); pts.push({ x: xx2, y: 7 }); }
        return pts;
      }
      var pts = clampLine(x1, y1, x2, y2);
      if (pts.length >= 2) {
        ctx.moveTo(ox + pts[0].x * cs + cs / 2, oy + pts[0].y * cs + cs / 2);
        ctx.lineTo(ox + pts[1].x * cs + cs / 2, oy + pts[1].y * cs + cs / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      label(ox + cs * 4, oy + cs * 8 + 16, '绿色虚线 = 霍夫变换检测到的直线', C.success, 12);

      // Small Hough space with peak
      var hx = 420, hy = 55, hw = 230, hh = 200;
      drawHoughSpace(hx, hy, hw, hh, fullAcc, peakVal, true);
      label(hx + hw / 2, hy - 14, 'Hough空间峰值', C.textDark, 11);

      // Result info box
      var bx = 400, by = 280;
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(bx, by, 260, 90);
      ctx.strokeStyle = C.success;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, 260, 90);
      label(bx + 130, by + 16, '检测结果', C.success, 13);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('θ = ' + peakTheta + '°   ρ = ' + peakRho, bx + 15, by + 40);
      ctx.fillText('投票数 = ' + peakVal + ' / ' + edgePoints.length + ' 个边缘点', bx + 15, by + 58);
      ctx.fillText('直线方程: x·cos(' + peakTheta + '°) + y·sin(' + peakTheta + '°) = ' + peakRho, bx + 15, by + 76);
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

  registerAnimation(66, factory);
})();
