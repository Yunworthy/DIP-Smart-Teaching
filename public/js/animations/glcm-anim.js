(function () {
  'use strict';

  var COLOR = {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    gray: '#6b7280',
    grayLight: '#e5e7eb',
    grayBg: '#f9fafb',
    textDark: '#1f2937',
    textMed: '#374151',
    textLight: '#9ca3af'
  };

  var GRID = 6;
  var LEVELS = 4; // 0,1,2,3

  // 6x6 image with 4 gray levels
  var image = [
    [0, 0, 1, 1, 2, 2],
    [0, 1, 1, 2, 2, 3],
    [1, 1, 2, 2, 3, 3],
    [1, 2, 2, 3, 3, 3],
    [2, 2, 3, 3, 3, 2],
    [2, 3, 3, 3, 2, 2]
  ];

  function grayLevelColor(val) {
    var colors = ['#e0e7ff', '#a5b4fc', '#6366f1', '#312e81'];
    return colors[val] || '#fff';
  }

  function drawStepHeader(ctx, step, total) {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 700, 36);
    ctx.fillStyle = COLOR.primary;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('步骤 ' + (step + 1) + ' / ' + total, 16, 18);
  }

  function drawGrid(ctx, ox, oy, cellSize) {
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var x = ox + c * cellSize;
        var y = oy + r * cellSize;
        ctx.fillStyle = grayLevelColor(image[r][c]);
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = COLOR.grayLight;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = image[r][c] < 2 ? COLOR.textDark : '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(image[r][c], x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // Compute GLCM for direction 0° (horizontal, distance 1)
  function computeGLCM() {
    var glcm = [];
    for (var i = 0; i < LEVELS; i++) {
      glcm.push(new Array(LEVELS).fill(0));
    }
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID - 1; c++) {
        var i = image[r][c];
        var j = image[r][c + 1];
        glcm[i][j]++;
      }
    }
    return glcm;
  }

  function factory(canvas, ctx) {
    var W = canvas.width;
    var H = canvas.height;
    var totalSteps = 6;

    var glcm = computeGLCM();
    var totalPairs = 0;
    for (var i = 0; i < LEVELS; i++)
      for (var j = 0; j < LEVELS; j++)
        totalPairs += glcm[i][j];

    var glcmNorm = [];
    for (var i = 0; i < LEVELS; i++) {
      glcmNorm.push([]);
      for (var j = 0; j < LEVELS; j++) {
        glcmNorm[i].push(glcm[i][j] / totalPairs);
      }
    }

    // Compute texture features
    var contrast = 0, energy = 0, homogeneity = 0, entropy = 0;
    for (var i = 0; i < LEVELS; i++) {
      for (var j = 0; j < LEVELS; j++) {
        var p = glcmNorm[i][j];
        contrast += (i - j) * (i - j) * p;
        energy += p * p;
        homogeneity += p / (1 + Math.abs(i - j));
        if (p > 0) entropy -= p * Math.log2(p);
      }
    }

    var stepDescriptions = [
      '原始图像：6×6 像素，4 个灰度级（0,1,2,3）',
      '定义方向和距离：0°(→), 45°(↗), 90°(↑), 135°(↖)，距离 d=1',
      '统计像素对：对于 0° 方向，统计所有水平相邻像素对 (i,j) 的出现次数',
      '构建 GLCM：4×4 共生矩阵，cell(i,j) = 像素对 (i,j) 出现的次数',
      '归一化 GLCM：将计数转换为概率 P(i,j) = count / 总像素对数',
      '纹理特征计算：对比度、能量、同质性、熵'
    ];

    var ox = 40, oy = 60, cellSize = 40;
    var mx = 380, my = 60, mcellSize = 60;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLOR.grayBg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStep0() {
      drawStepHeader(ctx, 0, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始图像（6×6，4 灰度级）', 350, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Legend
      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('灰度级:', 400, 100);
      for (var i = 0; i < LEVELS; i++) {
        ctx.fillStyle = grayLevelColor(i);
        ctx.fillRect(400, 120 + i * 35, 25, 25);
        ctx.strokeStyle = COLOR.gray;
        ctx.lineWidth = 1;
        ctx.strokeRect(400, 120 + i * 35, 25, 25);
        ctx.fillStyle = COLOR.textDark;
        ctx.font = '13px sans-serif';
        ctx.fillText('灰度 ' + i, 435, 137 + i * 35);
      }
    }

    function drawStep1() {
      drawStepHeader(ctx, 1, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('定义方向和距离', 350, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Draw direction arrows on grid
      var dirs = [
        { dr: 0, dc: 1, label: '0°', color: COLOR.danger },
        { dr: -1, dc: 1, label: '45°', color: COLOR.success },
        { dr: -1, dc: 0, label: '90°', color: COLOR.primary },
        { dr: -1, dc: -1, label: '135°', color: COLOR.warning }
      ];

      // Show arrows from center pixel (3,3)
      var cr = 3, cc = 3;
      for (var d = 0; d < dirs.length; d++) {
        var dir = dirs[d];
        var nr = cr + dir.dr, nc = cc + dir.dc;
        if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
          var x1 = ox + cc * cellSize + cellSize / 2;
          var y1 = oy + cr * cellSize + cellSize / 2;
          var x2 = ox + nc * cellSize + cellSize / 2;
          var y2 = oy + nr * cellSize + cellSize / 2;

          ctx.strokeStyle = dir.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Arrowhead
          var angle = Math.atan2(y2 - y1, x2 - x1);
          ctx.fillStyle = dir.color;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - 10 * Math.cos(angle - 0.3), y2 - 10 * Math.sin(angle - 0.3));
          ctx.lineTo(x2 - 10 * Math.cos(angle + 0.3), y2 - 10 * Math.sin(angle + 0.3));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Legend
      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('偏移向量（距离 d=1）:', 400, 100);
      for (var d = 0; d < dirs.length; d++) {
        ctx.fillStyle = dirs[d].color;
        ctx.fillText('• ' + dirs[d].label + ' 方向', 400, 125 + d * 25);
      }
      ctx.fillStyle = COLOR.textDark;
      ctx.fillText('本例使用 0° 方向', 400, 240);
    }

    function drawStep2() {
      drawStepHeader(ctx, 2, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('统计像素对（0° 方向，d=1）', 350, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Highlight a few horizontal pairs with arrows
      var pairs = [
        { r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 3 }
      ];

      for (var p = 0; p < pairs.length; p++) {
        var pr = pairs[p].r, pc = pairs[p].c;
        var x1 = ox + pc * cellSize + cellSize / 2;
        var y1 = oy + pr * cellSize + cellSize / 2;
        var x2 = ox + (pc + 1) * cellSize + cellSize / 2;
        var y2 = oy + pr * cellSize + cellSize / 2;

        ctx.strokeStyle = COLOR.danger;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = COLOR.danger;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8, y2 - 4);
        ctx.lineTo(x2 - 8, y2 + 4);
        ctx.closePath();
        ctx.fill();

        // Label
        var i = image[pr][pc], j = image[pr][pc + 1];
        ctx.fillStyle = COLOR.textDark;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('(' + i + ',' + j + ')', (x1 + x2) / 2, y1 - 10);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('统计所有水平相邻像素对', 400, 100);
      ctx.fillText('红色箭头 = 像素对 (i,j)', 400, 125);
      ctx.fillText('总像素对数 = ' + totalPairs, 400, 160);
    }

    function drawStep3() {
      drawStepHeader(ctx, 3, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('构建 GLCM（共生矩阵）', 350, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Draw GLCM matrix
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GLCM (i=行, j=列)', mx + (LEVELS * mcellSize) / 2, my - 10);

      // Column headers
      ctx.font = 'bold 12px sans-serif';
      for (var j = 0; j < LEVELS; j++) {
        ctx.fillText('j=' + j, mx + j * mcellSize + mcellSize / 2, my + 10);
      }

      // Row headers and cells
      for (var i = 0; i < LEVELS; i++) {
        ctx.fillText('i=' + i, mx - 20, my + 30 + i * mcellSize + mcellSize / 2);
        for (var j = 0; j < LEVELS; j++) {
          var x = mx + j * mcellSize;
          var y = my + 20 + i * mcellSize;
          var val = glcm[i][j];
          var intensity = val / 12; // max around 12
          ctx.fillStyle = 'rgba(99,102,241,' + Math.min(intensity, 0.8) + ')';
          ctx.fillRect(x, y, mcellSize, mcellSize);
          ctx.strokeStyle = COLOR.gray;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, mcellSize, mcellSize);

          ctx.fillStyle = intensity > 0.5 ? '#fff' : COLOR.textDark;
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val, x + mcellSize / 2, y + mcellSize / 2);
        }
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('cell(i,j) = 像素对 (i,j) 出现次数', 380, 300);
    }

    function drawStep4() {
      drawStepHeader(ctx, 4, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('归一化 GLCM（概率矩阵）', 350, 50);

      drawGrid(ctx, ox, oy, cellSize);

      // Draw normalized GLCM
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P(i,j) = GLCM / ' + totalPairs, mx + (LEVELS * mcellSize) / 2, my - 10);

      ctx.font = 'bold 12px sans-serif';
      for (var j = 0; j < LEVELS; j++) {
        ctx.fillText('j=' + j, mx + j * mcellSize + mcellSize / 2, my + 10);
      }

      for (var i = 0; i < LEVELS; i++) {
        ctx.fillText('i=' + i, mx - 20, my + 30 + i * mcellSize + mcellSize / 2);
        for (var j = 0; j < LEVELS; j++) {
          var x = mx + j * mcellSize;
          var y = my + 20 + i * mcellSize;
          var p = glcmNorm[i][j];
          var intensity = p * 4; // scale for visibility
          ctx.fillStyle = 'rgba(99,102,241,' + Math.min(intensity, 0.8) + ')';
          ctx.fillRect(x, y, mcellSize, mcellSize);
          ctx.strokeStyle = COLOR.gray;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, mcellSize, mcellSize);

          ctx.fillStyle = intensity > 0.5 ? '#fff' : COLOR.textDark;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.toFixed(2), x + mcellSize / 2, y + mcellSize / 2);
        }
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('P(i,j) = 像素对 (i,j) 出现的概率', 380, 300);
      ctx.fillText('Σ P(i,j) = 1.0', 380, 320);
    }

    function drawStep5() {
      drawStepHeader(ctx, 5, totalSteps);
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('纹理特征计算', 350, 50);

      // Draw small normalized GLCM
      var smx = 40, smy = 80, scellSize = 40;
      for (var i = 0; i < LEVELS; i++) {
        for (var j = 0; j < LEVELS; j++) {
          var x = smx + j * scellSize;
          var y = smy + i * scellSize;
          var p = glcmNorm[i][j];
          ctx.fillStyle = 'rgba(99,102,241,' + Math.min(p * 4, 0.8) + ')';
          ctx.fillRect(x, y, scellSize, scellSize);
          ctx.strokeStyle = COLOR.gray;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, scellSize, scellSize);
          ctx.fillStyle = p > 0.125 ? '#fff' : COLOR.textDark;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.toFixed(2), x + scellSize / 2, y + scellSize / 2);
        }
      }

      // Feature formulas and values
      var fx = 280, fy = 80;
      ctx.fillStyle = COLOR.textDark;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('纹理特征:', fx, fy);

      var features = [
        { name: '对比度 (Contrast)', formula: 'Σ (i-j)² P(i,j)', value: contrast.toFixed(3), color: COLOR.danger },
        { name: '能量 (ASM)', formula: 'Σ P(i,j)²', value: energy.toFixed(3), color: COLOR.success },
        { name: '同质性 (Homogeneity)', formula: 'Σ P(i,j)/(1+|i-j|)', value: homogeneity.toFixed(3), color: COLOR.primary },
        { name: '熵 (Entropy)', formula: '-Σ P(i,j) log₂ P(i,j)', value: entropy.toFixed(3), color: COLOR.warning }
      ];

      for (var f = 0; f < features.length; f++) {
        var feat = features[f];
        var y = fy + 30 + f * 55;

        ctx.fillStyle = feat.color;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(feat.name, fx, y);

        ctx.fillStyle = COLOR.textMed;
        ctx.font = '12px monospace';
        ctx.fillText('公式: ' + feat.formula, fx, y + 18);

        ctx.fillStyle = feat.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('= ' + feat.value, fx + 350, y + 8);
      }

      ctx.fillStyle = COLOR.textMed;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('对比度↑ = 纹理越粗糙', 280, 310);
      ctx.fillText('能量↑ = 纹理越均匀', 280, 328);
      ctx.fillText('同质性↑ = 局部越均匀', 280, 346);
      ctx.fillText('熵↑ = 纹理越复杂', 280, 364);
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
          case 5: drawStep5(); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(84, factory);
})();
