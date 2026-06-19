(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>模板匹配</b>：展示搜索图像（8×8）和模板（3×3），准备进行滑动窗口匹配',
    '<b>位置(0,0)</b>：模板放在搜索图像左上角，计算SSD <code>SSD = Σ(I-T)²</code>',
    '<b>滑动到(0,1)</b>：模板右移一格，重新计算SSD值，比较匹配程度',
    '<b>遍历所有位置</b>：模板滑过整个搜索图像，生成SSD匹配热力图',
    '<b>最佳匹配</b>：找到SSD最小值位置 = 最佳匹配点，在图像上高亮标记',
    '<b>NCC方法</b>：归一化互相关 <code>NCC = Σ(I·T)/(‖I‖·‖T‖)</code>，对亮度变化更鲁棒'
  ];

  // 8x8 search image
  var searchImg = [
    [10, 15, 20, 25, 30, 35, 40, 45],
    [12, 18, 22, 28, 32, 38, 42, 48],
    [14, 20, 80, 85, 90, 40, 44, 50],
    [16, 22, 82, 88, 92, 42, 46, 52],
    [18, 24, 84, 90, 95, 44, 48, 54],
    [20, 26, 30, 35, 40, 46, 50, 56],
    [22, 28, 32, 37, 42, 48, 52, 58],
    [24, 30, 34, 39, 44, 50, 54, 60]
  ];

  // 3x3 template (matches region at row2-4, col2-4)
  var template = [
    [80, 85, 90],
    [82, 88, 92],
    [84, 90, 95]
  ];

  function computeSSD(img, tmpl, row, col) {
    var sum = 0;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var diff = img[row + r][col + c] - tmpl[r][c];
        sum += diff * diff;
      }
    }
    return sum;
  }

  // Pre-compute SSD map (6x6)
  var ssdMap = [];
  for (var r = 0; r < 6; r++) {
    ssdMap.push([]);
    for (var c = 0; c < 6; c++) {
      ssdMap[r].push(computeSSD(searchImg, template, r, c));
    }
  }

  // Find min SSD
  var minSSD = Infinity, minRow = 0, minCol = 0;
  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 6; c++) {
      if (ssdMap[r][c] < minSSD) {
        minSSD = ssdMap[r][c];
        minRow = r;
        minCol = c;
      }
    }
  }

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

    function drawGrid(matrix, x, y, cellW, cellH, highlightRow, highlightCol, highlightSize, hlColor) {
      for (var r = 0; r < matrix.length; r++) {
        for (var c = 0; c < matrix[r].length; c++) {
          var val = matrix[r][c];
          var gray = Math.round(val / 100 * 220 + 35);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.fillStyle = gray < 128 ? '#ffffff' : TEXT_COLOR;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + val, x + c * cellW + cellW / 2, y + r * cellH + cellH / 2);
        }
      }
      if (highlightRow !== undefined && highlightCol !== undefined) {
        ctx.strokeStyle = hlColor || RED;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(
          x + highlightCol * cellW,
          y + highlightRow * cellH,
          (highlightSize || 3) * cellW,
          (highlightSize || 3) * cellH
        );
      }
    }

    function drawStep0() {
      drawTitle('模板匹配：搜索图像与模板');
      drawStepLabel(0, 6);

      // Search image
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('搜索图像（8×8）', 30, 45);
      drawGrid(searchImg, 30, 62, 35, 35);

      // Template
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('模板（3×3）', 380, 45);
      drawGrid(template, 380, 62, 50, 50);

      // Explanation
      var bx = 380, by = 240;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 300, 140);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 300, 140);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('模板匹配原理', bx + 15, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('1. 将模板在搜索图像上滑动', bx + 15, by + 50);
      ctx.fillText('2. 每个位置计算相似度度量', bx + 15, by + 72);
      ctx.fillText('3. 找到最匹配的位置', bx + 15, by + 94);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('常用度量：SSD, SAD, NCC', bx + 15, by + 122);
    }

    function drawStep1() {
      drawTitle('模板位于 (0,0)，计算SSD');
      drawStepLabel(1, 6);

      // Search image with template at (0,0)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('搜索图像（模板在行0,列0）', 30, 45);
      drawGrid(searchImg, 30, 62, 35, 35, 0, 0, 3, RED);

      // SSD computation
      var ssd = ssdMap[0][0];
      var bx = 340, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 340, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(bx, by, 340, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SSD计算过程', bx + 15, by + 22);
      ctx.font = '11px monospace';

      var lineY = by + 50;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          var iv = searchImg[r][c];
          var tv = template[r][c];
          var diff = iv - tv;
          var sq = diff * diff;
          ctx.fillStyle = TEXT_COLOR;
          ctx.fillText('(' + iv + '-' + tv + ')²=' + sq, bx + 20 + c * 110, lineY);
        }
        lineY += 22;
      }

      lineY += 10;
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('SSD(0,0) = ' + ssd, bx + 15, lineY);

      lineY += 30;
      ctx.fillStyle = RED;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SSD值较大 → 匹配度低', bx + 15, lineY);
    }

    function drawStep2() {
      drawTitle('模板滑动到 (0,1)，重新计算SSD');
      drawStepLabel(2, 6);

      // Search image with template at (0,1)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('搜索图像（模板在行0,列1）', 30, 45);
      drawGrid(searchImg, 30, 62, 35, 35, 0, 1, 3, AMBER);

      // SSD values comparison
      var bx = 340, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 340, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(bx, by, 340, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SSD值比较', bx + 15, by + 22);

      var ssd00 = ssdMap[0][0];
      var ssd01 = ssdMap[0][1];

      ctx.font = '13px monospace';
      ctx.fillStyle = RED;
      ctx.fillText('SSD(0,0) = ' + ssd00, bx + 20, by + 60);
      ctx.fillStyle = AMBER;
      ctx.fillText('SSD(0,1) = ' + ssd01, bx + 20, by + 90);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('模板向右滑动一格后：', bx + 15, by + 130);
      ctx.fillText('像素值差异有所变化', bx + 15, by + 155);

      if (ssd01 < ssd00) {
        ctx.fillStyle = GREEN;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('SSD减小 → 匹配度提高', bx + 15, by + 190);
      } else {
        ctx.fillStyle = RED;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('SSD增大 → 匹配度降低', bx + 15, by + 190);
      }

      // Show template overlay values
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('模板覆盖区域：', bx + 15, by + 230);
      ctx.font = '11px monospace';
      for (var r = 0; r < 3; r++) {
        var line = '';
        for (var c = 0; c < 3; c++) {
          line += searchImg[r][c + 1] + ' ';
        }
        ctx.fillText(line, bx + 25, by + 255 + r * 18);
      }
    }

    function drawStep3() {
      drawTitle('遍历所有位置，生成SSD热力图');
      drawStepLabel(3, 6);

      // Search image
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('搜索图像', 30, 45);
      drawGrid(searchImg, 30, 62, 30, 30);

      // SSD heatmap
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('SSD匹配热力图（6×6）', 320, 45);

      var hmX = 320, hmY = 62, hmCellW = 50, hmCellH = 40;
      var maxSSD = 0;
      for (var r = 0; r < 6; r++) {
        for (var c = 0; c < 6; c++) {
          if (ssdMap[r][c] > maxSSD) maxSSD = ssdMap[r][c];
        }
      }

      for (var r = 0; r < 6; r++) {
        for (var c = 0; c < 6; c++) {
          var ratio = ssdMap[r][c] / maxSSD;
          var red = Math.round(255 * ratio);
          var green = Math.round(255 * (1 - ratio));
          ctx.fillStyle = 'rgb(' + red + ',' + green + ',50)';
          ctx.fillRect(hmX + c * hmCellW, hmY + r * hmCellH, hmCellW, hmCellH);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(hmX + c * hmCellW, hmY + r * hmCellH, hmCellW, hmCellH);
          ctx.fillStyle = ratio > 0.5 ? '#ffffff' : TEXT_COLOR;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + ssdMap[r][c], hmX + c * hmCellW + hmCellW / 2, hmY + r * hmCellH + hmCellH / 2);
        }
      }

      // Legend
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('红色 = SSD大（不匹配）  绿色 = SSD小（匹配好）', 320, 315);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('最小SSD位置：(' + minRow + ',' + minCol + ')，SSD = ' + minSSD, 320, 340);
    }

    function drawStep4() {
      drawTitle('找到最佳匹配位置');
      drawStepLabel(4, 6);

      // Search image with best match highlighted
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('搜索图像（最佳匹配高亮）', 30, 45);
      drawGrid(searchImg, 30, 62, 35, 35, minRow, minCol, 3, GREEN);

      // Match result box
      var bx = 340, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 340, 300);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 340, 300);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('匹配结果', bx + 15, by + 25);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.fillText('最佳匹配位置：行 ' + minRow + ', 列 ' + minCol, bx + 15, by + 60);
      ctx.fillText('最小SSD值：' + minSSD, bx + 15, by + 85);

      ctx.font = '12px sans-serif';
      ctx.fillText('匹配区域像素值：', bx + 15, by + 125);
      ctx.font = '11px monospace';
      for (var r = 0; r < 3; r++) {
        var line = '';
        for (var c = 0; c < 3; c++) {
          line += searchImg[minRow + r][minCol + c] + ' ';
        }
        ctx.fillText(line, bx + 25, by + 150 + r * 20);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('模板像素值：', bx + 15, by + 220);
      ctx.font = '11px monospace';
      for (var r = 0; r < 3; r++) {
        var line = '';
        for (var c = 0; c < 3; c++) {
          line += template[r][c] + ' ';
        }
        ctx.fillText(line, bx + 25, by + 245 + r * 20);
      }

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('SSD = 0 → 完全匹配！', bx + 15, by + 285);
    }

    function drawStep5() {
      drawTitle('NCC（归一化互相关）替代方法');
      drawStepLabel(5, 6);

      // SSD heatmap
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SSD热力图', 30, 45);

      var hmX = 30, hmY = 62, hmCellW = 42, hmCellH = 35;
      var maxSSD = 0;
      for (var r = 0; r < 6; r++) {
        for (var c = 0; c < 6; c++) {
          if (ssdMap[r][c] > maxSSD) maxSSD = ssdMap[r][c];
        }
      }

      for (var r = 0; r < 6; r++) {
        for (var c = 0; c < 6; c++) {
          var ratio = ssdMap[r][c] / maxSSD;
          var red = Math.round(255 * ratio);
          var green = Math.round(255 * (1 - ratio));
          ctx.fillStyle = 'rgb(' + red + ',' + green + ',50)';
          ctx.fillRect(hmX + c * hmCellW, hmY + r * hmCellH, hmCellW, hmCellH);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(hmX + c * hmCellW, hmY + r * hmCellH, hmCellW, hmCellH);
        }
      }

      // NCC explanation
      var bx = 300, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 380, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 380, 320);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('NCC 归一化互相关', bx + 15, by + 25);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px monospace';
      ctx.fillText('NCC = Σ(I·T) / (‖I‖ × ‖T‖)', bx + 15, by + 55);

      ctx.font = '12px sans-serif';
      ctx.fillText('特点：', bx + 15, by + 90);
      ctx.fillText('• NCC ∈ [-1, 1]，值越大越匹配', bx + 15, by + 115);
      ctx.fillText('• 对整体亮度变化具有鲁棒性', bx + 15, by + 140);
      ctx.fillText('• 不受光照均匀变化影响', bx + 15, by + 165);

      // Comparison table
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SSD vs NCC 对比：', bx + 15, by + 205);

      ctx.font = '12px sans-serif';
      ctx.fillText('度量    最佳值   亮度鲁棒   计算量', bx + 15, by + 235);
      ctx.fillStyle = RED;
      ctx.fillText('SSD     最小=0   差         低', bx + 15, by + 258);
      ctx.fillStyle = GREEN;
      ctx.fillText('NCC     最大=1   好         中', bx + 15, by + 281);
      ctx.fillStyle = AMBER;
      ctx.fillText('SAD     最小=0   差         最低', bx + 15, by + 304);
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

  registerAnimation(93, factory);
})();
