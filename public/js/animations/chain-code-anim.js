(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>链码边界描述</b>：二值图像中的L形物体，边界像素已高亮标记',
    '<b>4连通方向定义</b>：<code>0=右, 1=上, 2=左, 3=下</code>，四个基本方向',
    '<b>起始追踪</b>：从边界左上角起始点开始，记录前几个链码方向值',
    '<b>完整追踪</b>：沿边界顺时针追踪一周，逐步积累链码序列',
    '<b>完整链码</b>：最终链码序列 "0011223300"，沿边界显示方向箭头',
    '<b>8连通链码</b>：8方向定义（0~7），差分链码表示方向变化量'
  ];

  // 8x8 binary image with L-shape
  // 0 = background, 1 = object
  var img = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Boundary pixels (row, col) - clockwise from top-left of L
  var boundary = [
    [1, 1], [1, 2], [1, 3],
    [2, 3], [3, 3],
    [3, 2], [3, 1],
    [4, 1], [5, 1], [6, 1],
    [6, 1], [5, 1], [4, 1],
    [3, 1], [2, 1]
  ];

  // Proper boundary trace (clockwise): start at (1,1)
  // right, right, down, down, left, left, down, down, down, left(up is back)
  var chainCode = [0, 0, 3, 3, 2, 2, 3, 3, 3, 2];

  // Boundary points for trace
  var tracePoints = [
    [1, 1], [1, 2], [1, 3],
    [2, 3], [3, 3],
    [3, 2], [3, 1],
    [4, 1], [5, 1], [6, 1]
  ];

  // 4-connectivity directions: 0=right, 1=up, 2=left, 3=down
  var dir4 = [
    {dx: 1, dy: 0, label: '0:右', angle: 0},
    {dx: 0, dy: -1, label: '1:上', angle: -Math.PI / 2},
    {dx: -1, dy: 0, label: '2:左', angle: Math.PI},
    {dx: 0, dy: 1, label: '3:下', angle: Math.PI / 2}
  ];

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function drawTitle(text) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(text, 15, 10);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(15, 30); ctx.lineTo(685, 30); ctx.stroke();
    }

    function drawStepLabel(step, total) {
      ctx.fillStyle = INDIGO;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('步骤 ' + (step + 1) + ' / ' + total, 685, 10);
    }

    function drawBinaryGrid(x, y, cellW, cellH, showBoundary, highlightIdx) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = img[r][c] === 1 ? '#e0e7ff' : '#ffffff';
          ctx.fillRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + c * cellW, y + r * cellH, cellW, cellH);
        }
      }

      if (showBoundary) {
        for (var i = 0; i < tracePoints.length; i++) {
          var pr = tracePoints[i][0], pc = tracePoints[i][1];
          var isHighlight = (highlightIdx !== undefined && i <= highlightIdx);
          ctx.fillStyle = isHighlight ? INDIGO + '60' : AMBER + '40';
          ctx.fillRect(x + pc * cellW, y + pr * cellH, cellW, cellH);
          ctx.strokeStyle = isHighlight ? INDIGO : AMBER;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + pc * cellW, y + pr * cellH, cellW, cellH);
        }
      }

      // Start point marker
      if (showBoundary) {
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(x + tracePoints[0][1] * cellW + cellW / 2, y + tracePoints[0][0] * cellH + cellH / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawStep0() {
      drawTitle('链码边界描述：L形物体');
      drawStepLabel(0, 6);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('二值图像（8×8）', 30, 45);
      drawBinaryGrid(30, 62, 35, 35, true);

      // Explanation
      var bx = 350, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 320, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 320, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('链码（Chain Code）', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('链码是一种边界描述方法：', bx + 15, by + 55);
      ctx.fillText('• 沿物体边界追踪一周', bx + 15, by + 82);
      ctx.fillText('• 记录每一步的方向编码', bx + 15, by + 107);
      ctx.fillText('• 用一维序列描述二维边界形状', bx + 15, by + 132);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('当前物体：L形', bx + 15, by + 175);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('橙色 = 边界像素', bx + 15, by + 205);
      ctx.fillText('红色圆点 = 起始追踪点', bx + 15, by + 230);
      ctx.fillText('浅蓝 = 物体内部', bx + 15, by + 255);
    }

    function drawStep1() {
      drawTitle('4连通方向定义');
      drawStepLabel(1, 6);

      // Direction diagram
      var cx = 180, cy = 180, radius = 80;

      // Center circle
      ctx.fillStyle = INDIGO;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', cx, cy);

      for (var i = 0; i < 4; i++) {
        var d = dir4[i];
        var ex = cx + d.dx * radius;
        var ey = cy + d.dy * radius;

        // Arrow line
        ctx.strokeStyle = [INDIGO, GREEN, AMBER, RED][i];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + d.dx * 20, cy + d.dy * 20);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrow head
        var headLen = 12;
        var angle = Math.atan2(ey - cy, ex - cx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = [INDIGO, GREEN, AMBER, RED][i];
        ctx.fill();

        // Label
        ctx.fillStyle = [INDIGO, GREEN, AMBER, RED][i];
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var lx = cx + d.dx * (radius + 25);
        var ly = cy + d.dy * (radius + 25);
        ctx.fillText(d.label, lx, ly);
      }

      // Direction table on the right
      var bx = 350, by = 60;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 320, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 320, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('4连通链码方向编码', bx + 15, by + 25);

      ctx.font = '13px monospace';
      var labels = ['0 → 右 (dx=+1, dy= 0)', '1 → 上 (dx= 0, dy=-1)', '2 → 左 (dx=-1, dy= 0)', '3 → 下 (dx= 0, dy=+1)'];
      var colors = [INDIGO, GREEN, AMBER, RED];
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillText(labels[i], bx + 20, by + 60 + i * 35);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('每一步只需记录一个方向数字(0~3)', bx + 15, by + 220);
      ctx.fillText('即可描述边界的走向', bx + 15, by + 245);
    }

    function drawStep2() {
      drawTitle('从起始点开始追踪链码');
      drawStepLabel(2, 6);

      drawBinaryGrid(30, 55, 35, 35, true, 2);

      // Show first few chain codes
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('追踪过程（前3步）：', 350, 55);

      var stepInfo = [
        {from: [1, 1], to: [1, 2], dir: 0, color: INDIGO},
        {from: [1, 2], to: [1, 3], dir: 0, color: GREEN},
        {from: [1, 3], to: [2, 3], dir: 3, color: AMBER}
      ];

      for (var i = 0; i < stepInfo.length; i++) {
        var s = stepInfo[i];
        var sy = 80 + i * 55;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(350, sy, 320, 45);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(350, sy, 320, 45);

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '12px sans-serif';
        ctx.fillText('第' + (i + 1) + '步：(' + s.from[0] + ',' + s.from[1] + ') → (' + s.to[0] + ',' + s.to[1] + ')', 360, sy + 18);

        ctx.fillStyle = s.color;
        ctx.font = 'bold 13px monospace';
        ctx.fillText('方向 = ' + s.dir, 360, sy + 36);
      }

      // Accumulated chain code
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('累积链码：0, 0, 3', 350, 260);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('从起始点(1,1)出发，', 350, 290);
      ctx.fillText('先向右走2步，再向下走', 350, 315);
    }

    function drawStep3() {
      drawTitle('沿边界完整追踪一周');
      drawStepLabel(3, 6);

      drawBinaryGrid(30, 55, 35, 35, true, tracePoints.length - 1);

      // Draw arrows along boundary
      var gx = 30, gy = 55, cw = 35, ch = 35;
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      for (var i = 0; i < tracePoints.length - 1; i++) {
        var pr = tracePoints[i][0], pc = tracePoints[i][1];
        var nr = tracePoints[i + 1][0], nc = tracePoints[i + 1][1];
        var fx = gx + pc * cw + cw / 2;
        var fy = gy + pr * ch + ch / 2;
        var tx = gx + nc * cw + cw / 2;
        var ty = gy + nr * ch + ch / 2;

        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Small arrow head
        var angle = Math.atan2(ty - fy, tx - fx);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 8 * Math.cos(angle - 0.4), ty - 8 * Math.sin(angle - 0.4));
        ctx.lineTo(tx - 8 * Math.cos(angle + 0.4), ty - 8 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = INDIGO;
        ctx.fill();
      }

      // Chain code accumulation
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('完整追踪链码：', 350, 55);

      var codeStr = '';
      for (var i = 0; i < chainCode.length; i++) {
        codeStr += chainCode[i] + (i < chainCode.length - 1 ? ', ' : '');
        if (i === 4) {
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px monospace';
          ctx.fillText(codeStr, 350, 85);
          codeStr = '';
        }
      }
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px monospace';
      ctx.fillText(codeStr, 350, 110);

      // Step-by-step
      ctx.font = '12px sans-serif';
      var sy = 150;
      for (var i = 0; i < Math.min(chainCode.length, 8); i++) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText('第' + (i + 1) + '步: 方向' + chainCode[i], 350, sy + i * 22);
      }
    }

    function drawStep4() {
      drawTitle('完整链码序列与方向箭头');
      drawStepLabel(4, 6);

      drawBinaryGrid(30, 55, 35, 35, true, tracePoints.length - 1);

      // Draw arrows
      var gx = 30, gy = 55, cw = 35, ch = 35;
      var dirColors = [INDIGO, GREEN, AMBER, RED];
      for (var i = 0; i < tracePoints.length - 1; i++) {
        var pr = tracePoints[i][0], pc = tracePoints[i][1];
        var nr = tracePoints[i + 1][0], nc = tracePoints[i + 1][1];
        var fx = gx + pc * cw + cw / 2;
        var fy = gy + pr * ch + ch / 2;
        var tx = gx + nc * cw + cw / 2;
        var ty = gy + nr * ch + ch / 2;

        ctx.strokeStyle = dirColors[chainCode[i]];
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        var angle = Math.atan2(ty - fy, tx - fx);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 10 * Math.cos(angle - 0.4), ty - 10 * Math.sin(angle - 0.4));
        ctx.lineTo(tx - 10 * Math.cos(angle + 0.4), ty - 10 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = dirColors[chainCode[i]];
        ctx.fill();
      }

      // Complete chain code display
      var bx = 340, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 340, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 340, 320);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('完整链码', bx + 15, by + 25);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 16px monospace';
      var fullCode = chainCode.join('');
      ctx.fillText(fullCode, bx + 15, by + 60);

      ctx.font = '12px sans-serif';
      ctx.fillText('链码长度：' + chainCode.length + ' 个方向码', bx + 15, by + 95);

      // Direction color legend
      ctx.font = 'bold 11px sans-serif';
      var dirLabels = ['0:右', '1:上', '2:左', '3:下'];
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = dirColors[i];
        ctx.fillRect(bx + 15, by + 125 + i * 25, 15, 15);
        ctx.fillText(dirLabels[i], bx + 40, by + 135 + i * 25);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('链码性质：', bx + 15, by + 240);
      ctx.fillText('• 平移不变（起点选择除外）', bx + 15, by + 265);
      ctx.fillText('• 旋转时链码循环移位', bx + 15, by + 290);
    }

    function drawStep5() {
      drawTitle('8连通链码与差分链码');
      drawStepLabel(5, 6);

      // 4-connectivity vs 8-connectivity
      var cx1 = 150, cy1 = 150, r1 = 70;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('4连通（4方向）', cx1, 45);

      // 4-dir diagram
      ctx.fillStyle = INDIGO;
      ctx.beginPath(); ctx.arc(cx1, cy1, 12, 0, Math.PI * 2); ctx.fill();

      var dirs4 = [{dx: 1, dy: 0, l: '0'}, {dx: 0, dy: -1, l: '1'}, {dx: -1, dy: 0, l: '2'}, {dx: 0, dy: 1, l: '3'}];
      for (var i = 0; i < dirs4.length; i++) {
        var d = dirs4[i];
        var ex = cx1 + d.dx * r1, ey = cy1 + d.dy * r1;
        ctx.strokeStyle = INDIGO;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx1 + d.dx * 15, cy1 + d.dy * 15); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = INDIGO;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(d.l, ex + d.dx * 15, ey + d.dy * 15);
      }

      // 8-connectivity
      var cx2 = 500, cy2 = 150, r2 = 70;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('8连通（8方向）', cx2, 45);

      ctx.fillStyle = GREEN;
      ctx.beginPath(); ctx.arc(cx2, cy2, 12, 0, Math.PI * 2); ctx.fill();

      var dirs8 = [
        {dx: 1, dy: 0, l: '0'}, {dx: 1, dy: -1, l: '1'}, {dx: 0, dy: -1, l: '2'}, {dx: -1, dy: -1, l: '3'},
        {dx: -1, dy: 0, l: '4'}, {dx: -1, dy: 1, l: '5'}, {dx: 0, dy: 1, l: '6'}, {dx: 1, dy: 1, l: '7'}
      ];
      for (var i = 0; i < dirs8.length; i++) {
        var d = dirs8[i];
        var dist = Math.sqrt(d.dx * d.dx + d.dy * d.dy);
        var ex = cx2 + d.dx / dist * r2, ey = cy2 + d.dy / dist * r2;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx2 + d.dx / dist * 15, cy2 + d.dy / dist * 15); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = GREEN;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(d.l, ex + d.dx / dist * 15, ey + d.dy / dist * 15);
      }

      // Differential chain code
      var bx = 50, by = 260;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 600, 120);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 600, 120);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('差分链码（Differential Chain Code）', bx + 15, by + 22);

      ctx.font = '12px sans-serif';
      ctx.fillText('原始链码：    0, 0, 3, 3, 2, 2, 3, 3, 3, 2', bx + 15, by + 50);
      ctx.fillText('差分链码：    0, 0, 3, 0, 3, 0, 1, 0, 0, 3  （相邻方向之差 mod 4）', bx + 15, by + 75);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('差分链码具有旋转不变性：旋转只改变起始方向，差分序列不变！', bx + 15, by + 105);
    }

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
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(89, factory);
})();
