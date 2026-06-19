(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>形态学操作</b>：二值图像中包含矩形物体和内部孔洞，准备进行边界提取和孔洞填充',
    '<b>边界提取</b>：腐蚀图像，<code>β(A) = A - (A ⊖ B)</code>，用原图减去腐蚀结果',
    '<b>边界像素</b>：差值图像高亮显示边界像素，即物体的外轮廓',
    '<b>孔洞填充概念</b>：在孔洞内放置种子点，迭代膨胀并与补集取交',
    '<b>迭代填充过程</b>：<code>X_k = (X_{k-1} ⊕ B) ∩ A^c</code>，逐步扩展直到填满孔洞',
    '<b>最终结果</b>：边界提取和孔洞填充两种操作的完整结果展示'
  ];

  // 8x8 binary image: 1=object, 0=background, 2=hole (inside object)
  var img = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Eroded image (3x3 SE)
  var eroded = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Actually erode properly - the rectangle is at rows 1-5, cols 1-5
  // With 3x3 SE, erosion shrinks by 1 pixel on each side
  // Object border is 1 pixel thick, so after erosion, only interior remains
  // But the interior is a hole, so erosion removes everything...
  // Let me reconsider: the object frame is 1px thick border of a rectangle
  // After erosion with 3x3 SE, the frame disappears (too thin)
  // Better: make object a solid rectangle with a hole

  var img2 = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Eroded (3x3 SE)
  var eroded2 = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Boundary = img2 - eroded2
  var boundary = [];
  for (var r = 0; r < 8; r++) {
    boundary.push([]);
    for (var c = 0; c < 8; c++) {
      boundary[r].push(img2[r][c] - eroded2[r][c]);
    }
  }

  // Complement of img2
  var complement = [];
  for (var r = 0; r < 8; r++) {
    complement.push([]);
    for (var c = 0; c < 8; c++) {
      complement[r].push(img2[r][c] === 1 ? 0 : 1);
    }
  }

  // Hole fill iterations
  // Seed at (3,3) which is inside the hole
  var holeIters = [];
  // iter 0: just seed
  var seed = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
  holeIters.push(seed);

  // iter 1: dilate seed, intersect with complement (which includes hole area AND outside)
  // We only want to fill inside the object, so complement should be complement of the object
  // Actually, Ac = complement, and we want X_k = (X_{k-1} + B) ∩ Ac where Ac is complement of object
  // But that would fill outside too. The trick is that the seed is inside the hole,
  // and we intersect with complement of the original image (holes + outside = complement)
  // Actually standard hole filling: Xk = (Xk-1 ⊕ B) ∩ Ac where Ac is complement of A (object)
  // The constraint is that X0 = seed point inside hole, and intersection with Ac prevents
  // growth outside the hole because the boundary pixels of A are not in Ac.

  var iter1 = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0],[0,0,1,1,1,0,0,0],[0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
  // Intersect with complement of img2
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      iter1[r][c] = iter1[r][c] === 1 && complement[r][c] === 1 ? 1 : 0;
    }
  }
  holeIters.push(iter1);

  // iter 2
  var iter2 = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,1,1,1,0,0,0],[0,0,1,1,1,0,0,0],[0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      iter2[r][c] = iter2[r][c] === 1 && complement[r][c] === 1 ? 1 : 0;
    }
  }
  holeIters.push(iter2);

  // Filled result = img2 OR holeIters[last]
  var filled = [];
  for (var r = 0; r < 8; r++) {
    filled.push([]);
    for (var c = 0; c < 8; c++) {
      filled[r].push(img2[r][c] === 1 || iter2[r][c] === 1 ? 1 : 0);
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

    function drawMatrix(matrix, x, y, cellW, cellH, colors) {
      for (var r = 0; r < matrix.length; r++) {
        for (var c = 0; c < matrix[r].length; c++) {
          var val = matrix[r][c];
          var color = colors ? colors[val] : (val === 1 ? INDIGO + '40' : '#ffffff');
          ctx.fillStyle = color;
          ctx.fillRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + c * cellW, y + r * cellH, cellW, cellH);
        }
      }
    }

    function drawGrid(matrix, x, y, cellW, cellH) {
      var colors = {0: '#ffffff', 1: INDIGO + '40', 2: AMBER + '40'};
      drawMatrix(matrix, x, y, cellW, cellH, colors);
    }

    function drawStep0() {
      drawTitle('形态学操作：边界提取与孔洞填充');
      drawStepLabel(0, 6);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始二值图像（8×8）', 30, 45);

      var cw = 35, ch = 35;
      drawGrid(img2, 30, 62, cw, ch);

      // Mark hole
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('孔', 30 + 3 * cw + cw / 2, 62 + 3 * ch + ch / 2);
      ctx.fillText('孔', 30 + 3 * cw + cw / 2, 62 + 4 * ch + ch / 2);

      // Legend
      var lx = 30, ly = 355;
      ctx.fillStyle = INDIGO + '40';
      ctx.fillRect(lx, ly, 18, 18);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(lx, ly, 18, 18);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('= 物体', lx + 25, ly + 9);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx + 100, ly, 18, 18);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(lx + 100, ly, 18, 18);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('= 背景', lx + 125, ly + 9);

      ctx.fillStyle = AMBER + '40';
      ctx.fillRect(lx + 200, ly, 18, 18);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(lx + 200, ly, 18, 18);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('= 孔洞', lx + 225, ly + 9);

      // Explanation
      var bx = 350, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 320, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 320, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('两种形态学操作', bx + 15, by + 25);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('1. 边界提取', bx + 15, by + 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('β(A) = A - (A ⊖ B)', bx + 15, by + 82);
      ctx.fillText('用原图减去腐蚀结果得到边界', bx + 15, by + 105);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('2. 孔洞填充', bx + 15, by + 145);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('X_k = (X_{k-1} ⊕ B) ∩ A^c', bx + 15, by + 167);
      ctx.fillText('从种子点出发迭代膨胀填充', bx + 15, by + 190);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('结构元素 B：3×3 全1矩阵', bx + 15, by + 235);
    }

    function drawStep1() {
      drawTitle('边界提取：β(A) = A - (A ⊖ B)');
      drawStepLabel(1, 6);

      var cw = 30, ch = 30;

      // Original
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原图 A', 30 + 4 * cw, 48);
      drawGrid(img2, 30, 58, cw, ch);

      // Minus sign
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('−', 285, 180);

      // Eroded
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('腐蚀 A ⊖ B', 310 + 4 * cw, 48);
      drawMatrix(eroded2, 310, 58, cw, ch);

      // Equals sign
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('=', 560, 180);

      // Result (boundary)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('边界 β(A)', 580 + 3 * cw, 48);

      var bx = 580, by = 58;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var val = boundary[r][c];
          ctx.fillStyle = val === 1 ? RED + '50' : '#ffffff';
          ctx.fillRect(bx + c * cw, by + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(bx + c * cw, by + r * ch, cw, ch);
        }
      }

      // Explanation
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('腐蚀操作去除物体外层一个像素厚的边界', 30, 320);
      ctx.fillText('原图减去腐蚀结果 = 仅剩外层边界像素', 30, 345);
      ctx.fillStyle = RED;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('红色 = 提取出的边界像素', 30, 370);
    }

    function drawStep2() {
      drawTitle('边界像素高亮显示');
      drawStepLabel(2, 6);

      var cw = 40, ch = 40;
      var gx = 50, gy = 55;

      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          if (boundary[r][c] === 1) {
            ctx.fillStyle = RED + '60';
          } else if (img2[r][c] === 1) {
            ctx.fillStyle = INDIGO + '20';
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillRect(gx + c * cw, gy + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(gx + c * cw, gy + r * ch, cw, ch);

          if (boundary[r][c] === 1) {
            ctx.fillStyle = RED;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('B', gx + c * cw + cw / 2, gy + r * ch + ch / 2);
          }
        }
      }

      // Count boundary pixels
      var bCount = 0;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          if (boundary[r][c] === 1) bCount++;
        }
      }

      // Info panel
      var bx = 400, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 280, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 280, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('边界提取结果', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('边界像素数：' + bCount, bx + 15, by + 60);

      ctx.fillStyle = RED;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('B = 边界像素', bx + 15, by + 95);
      ctx.fillStyle = INDIGO;
      ctx.fillText('浅蓝 = 物体内部', bx + 15, by + 120);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('边界提取的应用：', bx + 15, by + 165);
      ctx.fillText('• 物体轮廓检测', bx + 15, by + 190);
      ctx.fillText('• 边缘定位', bx + 15, by + 215);
      ctx.fillText('• 形状分析预处理', bx + 15, by + 240);
      ctx.fillText('• 周长计算', bx + 15, by + 265);
    }

    function drawStep3() {
      drawTitle('孔洞填充：种子点与迭代概念');
      drawStepLabel(3, 6);

      var cw = 35, ch = 35;
      var gx = 30, gy = 55;

      // Show original with seed point
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          if (img2[r][c] === 1) {
            ctx.fillStyle = INDIGO + '40';
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillRect(gx + c * cw, gy + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(gx + c * cw, gy + r * ch, cw, ch);
        }
      }

      // Seed point
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(gx + 3 * cw + cw / 2, gy + 3 * ch + ch / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', gx + 3 * cw + cw / 2, gy + 3 * ch + ch / 2);

      // Arrow showing dilation
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(gx + 3 * cw + cw / 2 + 15, gy + 3 * ch + ch / 2);
      ctx.lineTo(gx + 3 * cw + cw / 2 + 40, gy + 3 * ch + ch / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Explanation box
      var bx = 340, by = 55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 340, 320);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 340, 320);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('孔洞填充算法', bx + 15, by + 25);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('1. 在孔洞内放置种子点 S', bx + 15, by + 60);
      ctx.fillText('2. 对种子进行膨胀操作', bx + 15, by + 85);
      ctx.fillText('3. 与物体补集 A^c 取交集', bx + 15, by + 110);
      ctx.fillText('4. 重复步骤2-3直到不再变化', bx + 15, by + 135);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('X_k = (X_{k-1} ⊕ B) ∩ A^c', bx + 15, by + 175);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('X_0 = 种子点', bx + 15, by + 205);
      ctx.fillText('B = 结构元素（3×3）', bx + 15, by + 230);
      ctx.fillText('A^c = 物体的补集', bx + 15, by + 255);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('交集约膨胀范围，防止扩展到物体外部', bx + 15, by + 295);
    }

    function drawStep4() {
      drawTitle('迭代填充过程');
      drawStepLabel(4, 6);

      var cw = 28, ch = 28;
      var titles = ['X₀: 种子点', 'X₁: 第1次膨胀∩A^c', 'X₂: 第2次膨胀∩A^c'];

      for (var k = 0; k < holeIters.length; k++) {
        var gx = 20 + k * 230;
        var gy = 65;

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(titles[k], gx + 4 * cw, 50);

        for (var r = 0; r < 8; r++) {
          for (var c = 0; c < 8; c++) {
            if (holeIters[k][r][c] === 1) {
              ctx.fillStyle = GREEN + '60';
            } else if (img2[r][c] === 1) {
              ctx.fillStyle = INDIGO + '20';
            } else {
              ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(gx + c * cw, gy + r * ch, cw, ch);
            ctx.strokeStyle = GRAY_BORDER;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(gx + c * cw, gy + r * ch, cw, ch);
          }
        }

        // Count filled pixels
        var cnt = 0;
        for (var r = 0; r < 8; r++) {
          for (var c = 0; c < 8; c++) {
            if (holeIters[k][r][c] === 1) cnt++;
          }
        }
        ctx.fillStyle = GREEN;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('填充像素：' + cnt, gx + 4 * cw, gy + 8 * ch + 15);
      }

      // Iteration formula
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('X_k = (X_{k-1} ⊕ B) ∩ A^c', 20, 330);
      ctx.font = '12px sans-serif';
      ctx.fillText('每次迭代：膨胀种子区域 → 与补集取交 → 得到新种子区域', 20, 355);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('绿色 = 已填充区域（从种子点扩展）', 20, 380);
    }

    function drawStep5() {
      drawTitle('最终结果：边界提取 + 孔洞填充');
      drawStepLabel(5, 6);

      var cw = 35, ch = 35;

      // Boundary result
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('边界提取结果 β(A)', 30, 45);

      var gx1 = 30, gy1 = 62;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = boundary[r][c] === 1 ? RED + '50' : '#ffffff';
          ctx.fillRect(gx1 + c * cw, gy1 + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(gx1 + c * cw, gy1 + r * ch, cw, ch);
        }
      }

      // Filled result
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('孔洞填充结果', 360, 45);

      var gx2 = 360, gy2 = 62;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          ctx.fillStyle = filled[r][c] === 1 ? INDIGO + '40' : '#ffffff';
          ctx.fillRect(gx2 + c * cw, gy2 + r * ch, cw, ch);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(gx2 + c * cw, gy2 + r * ch, cw, ch);
        }
      }

      // Summary
      var by = 360;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(30, by, 640, 30);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(30, by, 640, 30);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('左：边界提取 — 仅保留物体外轮廓像素    |    右：孔洞填充 — 物体内部孔洞已填满', 350, by + 18);
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

  registerAnimationBatch([77, 78], factory);
})();
