(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>连通分量标记</b>：二值图像中包含3个分离物体，需要为每个物体分配唯一标签',
    '<b>第一遍扫描</b>：从上到下、从左到右扫描，为前景像素分配临时标签，遇到冲突记录等价对',
    '<b>等价对记录</b>：当两个不同标签的相邻像素属于同一连通区域时，记录等价关系（如标签2==标签4）',
    '<b>第二遍扫描</b>：根据等价关系合并标签，为每个连通分量分配最终标签，用不同颜色标记',
    '<b>标记结果</b>：3个连通分量已标记为不同颜色，统计各分量的像素数和属性'
  ];

  // 8x8 binary image with 3 separate objects
  var img = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // First pass labels (provisional)
  var firstPass = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 2, 0],
    [0, 1, 1, 0, 0, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 2, 0],
    [0, 0, 0, 3, 3, 0, 0, 0],
    [0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Final labels
  var finalLabels = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 2, 0],
    [0, 1, 1, 0, 0, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 2, 0],
    [0, 0, 0, 3, 3, 0, 0, 0],
    [0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  var componentColors = {
    0: '#ffffff',
    1: INDIGO + '50',
    2: GREEN + '50',
    3: AMBER + '50'
  };

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

    function drawBinaryGrid(x, y, cellW, cellH) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = img[r][c] === 1 ? INDIGO + '30' : '#ffffff';
          ctx.fillRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + c * cellW, y + r * cellH, cellW, cellH);
        }
      }
    }

    function drawLabeledGrid(x, y, cellW, cellH, labels, showLabels) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var lbl = labels[r][c];
          ctx.fillStyle = componentColors[lbl] || '#ffffff';
          ctx.fillRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + c * cellW, y + r * cellH, cellW, cellH);
          if (showLabels && lbl > 0) {
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('' + lbl, x + c * cellW + cellW / 2, y + r * cellH + cellH / 2);
          }
        }
      }
    }

    function drawStep0() {
      drawTitle('连通分量标记：识别分离物体');
      drawStepLabel(0, 5);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('二值图像（8×8），包含3个分离物体', 30, 45);

      drawBinaryGrid(30, 62, 38, 38);

      // Mark the 3 objects with circles
      var objects = [
        {r: 1.5, c: 1.5, label: '物体1'},
        {r: 2, c: 6, label: '物体2'},
        {r: 5, c: 2.5, label: '物体3'}
      ];

      // Explanation
      var bx = 370, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 310, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 310, 320);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('连通分量标记算法', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('目标：为图像中每个独立物体', bx + 15, by + 55);
      ctx.fillText('分配唯一的整数标签', bx + 15, by + 78);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('两遍扫描算法：', bx + 15, by + 115);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('第1遍：分配临时标签', bx + 15, by + 145);
      ctx.fillText('       记录标签等价关系', bx + 15, by + 168);
      ctx.fillText('第2遍：合并等价标签', bx + 15, by + 195);
      ctx.fillText('       分配最终标签', bx + 15, by + 218);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('当前图像中有3个4-连通分量', bx + 15, by + 265);
    }

    function drawStep1() {
      drawTitle('第一遍扫描：分配临时标签');
      drawStepLabel(1, 5);

      var cw = 38, ch = 38;
      var gx = 30, gy = 55;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('扫描方向：从上到下，从左到右 →', gx, gy - 8);

      // Draw grid with provisional labels
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var lbl = firstPass[r][c];
          if (lbl > 0) {
            ctx.fillStyle = INDIGO + '20';
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillRect(gx + c * cw, gy + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(gx + c * cw, gy + r * ch, cw, ch);

          if (lbl > 0) {
            ctx.fillStyle = INDIGO;
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('' + lbl, gx + c * cw + cw / 2, gy + r * ch + ch / 2);
          }
        }
      }

      // Scan arrow
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      for (var r = 0; r < 8; r++) {
        var startX = gx;
        var endX = gx + 8 * cw;
        var arrowY = gy + r * ch + ch / 2;
        ctx.beginPath();
        ctx.moveTo(startX - 5, arrowY);
        ctx.lineTo(endX + 5, arrowY);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Labeling rules
      var bx = 370, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 310, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 310, 320);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('标记规则（4-连通）', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('对于每个前景像素 P：', bx + 15, by + 55);
      ctx.fillText('1. 检查上方和左方邻居', bx + 15, by + 80);
      ctx.fillText('2. 若邻居都是背景 → 新标签', bx + 15, by + 105);
      ctx.fillText('3. 若只有一个标签 → 继承该标签', bx + 15, by + 130);
      ctx.fillText('4. 若有多个不同标签 →', bx + 15, by + 155);
      ctx.fillText('   取最小标签，记录等价对', bx + 15, by + 178);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('当前扫描无标签冲突', bx + 15, by + 220);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('3个物体各自获得了独立标签', bx + 15, by + 245);
    }

    function drawStep2() {
      drawTitle('等价对记录');
      drawStepLabel(2, 5);

      // Show a scenario with equivalence
      var cw = 35, ch = 35;
      var gx = 30, gy = 70;

      // Create a U-shape image for demonstration
      var uImg = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ];

      var uLabels = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 2, 0, 0],
        [0, 1, 0, 0, 0, 2, 0, 0],
        [0, 1, 0, 0, 0, 2, 0, 0],
        [0, 1, 1, 1, 1, 2, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ];

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('示例：U形物体（标签冲突场景）', gx, 52);

      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var lbl = uLabels[r][c];
          if (uImg[r][c] === 1) {
            ctx.fillStyle = lbl === 1 ? INDIGO + '40' : GREEN + '40';
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillRect(gx + c * cw, gy + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(gx + c * cw, gy + r * ch, cw, ch);
          if (lbl > 0) {
            ctx.fillStyle = lbl === 1 ? INDIGO : GREEN;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('' + lbl, gx + c * cw + cw / 2, gy + r * ch + ch / 2);
          }
        }
      }

      // Highlight conflict pixel
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx + 4 * cw, gy + 4 * ch, cw, ch);

      // Conflict explanation
      var bx = 340, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 340, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 340, 320);

      ctx.fillStyle = RED;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('标签冲突！', bx + 15, by + 25);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('扫描到第4行第5列像素时：', bx + 15, by + 55);
      ctx.fillText('• 左方邻居标签 = 1', bx + 15, by + 80);
      ctx.fillText('• 上方邻居标签 = 2', bx + 15, by + 105);
      ctx.fillText('两个不同标签相遇！', bx + 15, by + 135);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('等价对记录：{1, 2}', bx + 15, by + 175);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('含义：标签1和标签2实际上', bx + 15, by + 210);
      ctx.fillText('属于同一个连通分量', bx + 15, by + 235);

      ctx.fillStyle = AMBER;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('等价对使用并查集(Union-Find)', bx + 15, by + 275);
      ctx.fillText('数据结构高效管理', bx + 15, by + 295);
    }

    function drawStep3() {
      drawTitle('第二遍扫描：合并等价标签');
      drawStepLabel(3, 5);

      var cw = 38, ch = 38;
      var gx = 30, gy = 55;

      // Draw final labeled grid
      drawLabeledGrid(gx, gy, cw, ch, finalLabels, true);

      // Merge explanation
      var bx = 370, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 310, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 310, 320);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('第二遍扫描过程', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('1. 解析等价关系，找到等价类', bx + 15, by + 55);
      ctx.fillText('2. 每个等价类分配一个最终标签', bx + 15, by + 80);
      ctx.fillText('3. 再次扫描图像，替换标签', bx + 15, by + 105);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('最终标签分配：', bx + 15, by + 145);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('标签 1 → 物体1（蓝色）', bx + 15, by + 180);
      ctx.fillStyle = GREEN;
      ctx.fillText('标签 2 → 物体2（绿色）', bx + 15, by + 210);
      ctx.fillStyle = AMBER;
      ctx.fillText('标签 3 → 物体3（橙色）', bx + 15, by + 240);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('本例中无等价对冲突，', bx + 15, by + 280);
      ctx.fillText('临时标签即为最终标签', bx + 15, by + 300);
    }

    function drawStep4() {
      drawTitle('最终标记结果与统计');
      drawStepLabel(4, 5);

      var cw = 38, ch = 38;
      var gx = 30, gy = 55;

      // Draw colored components
      drawLabeledGrid(gx, gy, cw, ch, finalLabels, true);

      // Component stats
      var bx = 370, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 310, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 310, 320);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('连通分量统计', bx + 15, by + 25);

      // Count pixels per component
      var counts = {1: 0, 2: 0, 3: 0};
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var lbl = finalLabels[r][c];
          if (lbl > 0) counts[lbl]++;
        }
      }

      var compInfo = [
        {id: 1, color: INDIGO, name: '物体1（蓝色）'},
        {id: 2, color: GREEN, name: '物体2（绿色）'},
        {id: 3, color: AMBER, name: '物体3（橙色）'}
      ];

      var sy = by + 55;
      for (var i = 0; i < compInfo.length; i++) {
        var ci = compInfo[i];
        ctx.fillStyle = ci.color + '50';
        ctx.fillRect(bx + 15, sy + i * 65, 280, 55);
        ctx.strokeStyle = ci.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + 15, sy + i * 65, 280, 55);

        ctx.fillStyle = ci.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(ci.name, bx + 25, sy + i * 65 + 20);

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '12px sans-serif';
        ctx.fillText('像素数：' + counts[ci.id], bx + 25, sy + i * 65 + 42);
      }

      // Total
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('总连通分量数：3', bx + 15, sy + 215);
      ctx.font = '12px sans-serif';
      ctx.fillText('总前景像素：' + (counts[1] + counts[2] + counts[3]), bx + 15, sy + 240);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('应用：物体计数、面积测量、形状分析', bx + 15, sy + 275);
    }

    return {
      totalSteps: 5,
      draw: function (step, sliderValue) {
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

  registerAnimation(80, factory);
})();
