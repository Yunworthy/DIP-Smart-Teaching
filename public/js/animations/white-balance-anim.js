(function () {
  // ========== Color Palette ==========
  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981', RED = '#ef4444',
    AMBER = '#f59e0b', GRAY_BG = '#f9fafb', GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>步骤 1/5 — 白平衡偏差：</b>模拟错误的白平衡效果。蓝色偏移（低色温光源）或黄色偏移（高色温光源）导致白色物体偏色。滑块可调节色温。',
    '<b>步骤 2/5 — 灰世界算法：</b>假设图像的平均颜色应为灰色。计算 R、G、B 平均值，按比例缩放使三者相等。公式: <code>R\' = R × (avg / avgR)</code>。',
    '<b>步骤 3/5 — 完美反射体算法 (Max RGB)：</b>假设图像中最亮的点应该是白色。找到各通道最大值，以此为基准缩放。公式: <code>R\' = R × 255 / maxR</code>。',
    '<b>步骤 4/5 — 色温概念：</b>色温用开尔文 (K) 度量光源颜色。低色温 (2000K) 偏红黄，高色温 (10000K) 偏蓝。滑块可调节色温观察颜色变化。',
    '<b>步骤 5/5 — 校正方法对比：</b>对比原始偏色图、灰世界校正、完美反射体校正和手动校正的效果差异。'
  ];

  // Simulated "image" as 10x8 grid of RGB pixels (scene with neutral and colored objects)
  var SCENE = [
    [[200,180,160],[180,170,150],[210,195,175],[190,180,160],[220,200,180],[200,185,165],[180,170,150],[210,195,175],[195,180,160],[205,190,170]],
    [[160,150,140],[240,220,200],[170,160,145],[230,210,190],[180,170,155],[250,230,210],[165,155,140],[235,215,195],[175,165,150],[245,225,205]],
    [[150,140,130],[200,120,80],[160,150,140],[80,160,80],[170,160,150],[80,80,200],[155,145,135],[200,120,80],[165,155,140],[80,160,80]],
    [[145,135,125],[195,115,75],[155,145,135],[75,155,75],[165,155,145],[75,75,195],[150,140,130],[195,115,75],[160,150,140],[75,155,75]],
    [[140,130,120],[250,250,250],[150,140,130],[250,250,250],[160,150,140],[250,250,250],[145,135,125],[250,250,250],[155,145,135],[250,250,250]],
    [[135,125,115],[245,245,245],[145,135,125],[245,245,245],[155,145,135],[245,245,245],[140,130,120],[245,245,245],[150,140,130],[245,245,245]],
    [[130,120,110],[180,160,140],[140,130,120],[160,180,140],[150,140,130],[140,160,180],[135,125,115],[180,160,140],[145,135,125],[160,180,140]],
    [[125,115,105],[175,155,135],[135,125,115],[155,175,135],[145,135,125],[135,155,175],[130,120,110],[175,155,135],[140,130,120],[155,175,135]]
  ];

  // Apply blue color cast (simulating tungsten indoor light without WB)
  function applyBlueCast(r, g, b) {
    return [
      Math.min(255, Math.round(r * 0.8)),
      Math.min(255, Math.round(g * 0.9)),
      Math.min(255, Math.round(b * 1.25))
    ];
  }

  // Apply yellow/warm cast
  function applyWarmCast(r, g, b) {
    return [
      Math.min(255, Math.round(r * 1.2)),
      Math.min(255, Math.round(g * 1.05)),
      Math.min(255, Math.round(b * 0.75))
    ];
  }

  // Color temperature to RGB approximation
  function tempToRgb(kelvin) {
    var t = kelvin / 100;
    var r, g, b;
    if (t <= 66) {
      r = 255;
      g = Math.round(99.4708025861 * Math.log(t) - 161.1195681661);
      if (t <= 19) { b = 0; }
      else { b = Math.round(138.5177312231 * Math.log(t - 10) - 305.0447927307); }
    } else {
      r = Math.round(329.698727446 * Math.pow(t - 60, -0.1332047592));
      g = Math.round(288.1221695283 * Math.pow(t - 60, -0.0755148492));
      b = 255;
    }
    return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
  }

  function factory(canvas, ctx) {
    var W = canvas.width, H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    function roundRect(x, y, w, h, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }

    function drawImageGrid(x, y, data, cellS, label, borderColor) {
      var rows = data.length, cols = data[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var px = data[r][c];
          ctx.fillStyle = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
          ctx.fillRect(x + c * cellS, y + r * cellS, cellS - 1, cellS - 1);
        }
      }
      ctx.strokeStyle = borderColor || TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cols * cellS, rows * cellS);
      if (label) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + (cols * cellS) / 2, y + rows * cellS + 16);
      }
    }

    function computeAvgRGB() {
      var sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (var r = 0; r < SCENE.length; r++) {
        for (var c = 0; c < SCENE[0].length; c++) {
          var px = SCENE[r][c];
          sumR += px[0]; sumG += px[1]; sumB += px[2];
          count++;
        }
      }
      return [sumR / count, sumG / count, sumB / count];
    }

    // ========== Step 0: Wrong White Balance ==========
    function drawStep0(sliderValue) {
      var kelvin = sliderValue !== undefined ? sliderValue : 3000;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('白平衡偏差演示', W / 2, 28);

      var cellS = 32, imgX = 30, imgY = 50;

      // Original (correct)
      drawImageGrid(imgX, imgY, SCENE, cellS, '原始 (正确白平衡)', GREEN);

      // Blue cast
      var blueScene = [];
      for (var r = 0; r < SCENE.length; r++) {
        blueScene[r] = [];
        for (var c = 0; c < SCENE[0].length; c++) {
          blueScene[r][c] = applyBlueCast(SCENE[r][c][0], SCENE[r][c][1], SCENE[r][c][2]);
        }
      }
      drawImageGrid(imgX + 340, imgY, blueScene, cellS, '蓝色偏移 (室内钨丝灯)', '#3b82f6');

      // Warm cast
      var warmScene = [];
      for (var r = 0; r < SCENE.length; r++) {
        warmScene[r] = [];
        for (var c = 0; c < SCENE[0].length; c++) {
          warmScene[r][c] = applyWarmCast(SCENE[r][c][0], SCENE[r][c][1], SCENE[r][c][2]);
        }
      }
      drawImageGrid(imgX, imgY + 300, warmScene, cellS, '黄色偏移 (白炽灯)', AMBER);

      // Color temperature preview with slider
      var tempRgb = tempToRgb(kelvin);
      var tcX = 380, tcY = 320;
      roundRect(tcX, tcY, 280, 70, 8, '#fff', GRAY_BORDER);
      ctx.fillStyle = 'rgb(' + tempRgb[0] + ',' + tempRgb[1] + ',' + tempRgb[2] + ')';
      ctx.fillRect(tcX + 10, tcY + 10, 50, 50);
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(tcX + 10, tcY + 10, 50, 50);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('当前色温: ' + kelvin + 'K', tcX + 70, tcY + 28);
      ctx.font = '12px sans-serif';
      ctx.fillText('RGB(' + tempRgb[0] + ',' + tempRgb[1] + ',' + tempRgb[2] + ')', tcX + 70, tcY + 48);
      ctx.fillText('拖动滑块 (2000–10000K) 改变光源色温', tcX + 70, tcY + 63);
    }

    // ========== Step 1: Gray World ==========
    function drawStep1() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('灰世界算法 (Gray World)', W / 2, 28);

      // Blue-cast scene
      var castScene = [];
      for (var r = 0; r < SCENE.length; r++) {
        castScene[r] = [];
        for (var c = 0; c < SCENE[0].length; c++) {
          castScene[r][c] = applyBlueCast(SCENE[r][c][0], SCENE[r][c][1], SCENE[r][c][2]);
        }
      }

      var avg = computeAvgRGB();
      var castAvg = [0, 0, 0];
      var count = 0;
      for (var r = 0; r < castScene.length; r++) {
        for (var c = 0; c < castScene[0].length; c++) {
          castAvg[0] += castScene[r][c][0];
          castAvg[1] += castScene[r][c][1];
          castAvg[2] += castScene[r][c][2];
          count++;
        }
      }
      castAvg[0] /= count; castAvg[1] /= count; castAvg[2] /= count;
      var grayAvg = (castAvg[0] + castAvg[1] + castAvg[2]) / 3;

      // Algorithm explanation
      var ly = 50;
      roundRect(30, ly, 640, 80, 8, '#f0fdf4', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('灰世界假设: 图像的平均颜色应该是灰色', 45, ly + 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px monospace';
      ctx.fillText('avgR = ' + castAvg[0].toFixed(1) + ', avgG = ' + castAvg[1].toFixed(1) + ', avgB = ' + castAvg[2].toFixed(1), 45, ly + 45);
      ctx.fillText('gray = (avgR + avgG + avgB) / 3 = ' + grayAvg.toFixed(1), 45, ly + 63);

      // Scale factors
      var scaleR = grayAvg / castAvg[0];
      var scaleG = grayAvg / castAvg[1];
      var scaleB = grayAvg / castAvg[2];

      ly = 140;
      roundRect(30, ly, 640, 35, 6, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('缩放因子: scaleR = ' + scaleR.toFixed(3) + ', scaleG = ' + scaleG.toFixed(3) + ', scaleB = ' + scaleB.toFixed(3), 45, ly + 22);

      // Apply correction
      var correctedScene = [];
      for (var r = 0; r < castScene.length; r++) {
        correctedScene[r] = [];
        for (var c = 0; c < castScene[0].length; c++) {
          correctedScene[r][c] = [
            Math.min(255, Math.round(castScene[r][c][0] * scaleR)),
            Math.min(255, Math.round(castScene[r][c][1] * scaleG)),
            Math.min(255, Math.round(castScene[r][c][2] * scaleB))
          ];
        }
      }

      // Draw before and after
      var cellS = 30;
      drawImageGrid(30, 195, castScene, cellS, '偏色原图', RED);
      drawImageGrid(360, 195, correctedScene, cellS, '灰世界校正后', GREEN);

      // Bottom
      ly = 460;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('优点: 简单快速  |  缺点: 假设不一定成立（如纯色场景）', W / 2, 393);
    }

    // ========== Step 2: Perfect Reflector (Max RGB) ==========
    function drawStep2() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('完美反射体算法 (Max RGB / White Patch)', W / 2, 28);

      var castScene = [];
      for (var r = 0; r < SCENE.length; r++) {
        castScene[r] = [];
        for (var c = 0; c < SCENE[0].length; c++) {
          castScene[r][c] = applyBlueCast(SCENE[r][c][0], SCENE[r][c][1], SCENE[r][c][2]);
        }
      }

      // Find max values
      var maxR = 0, maxG = 0, maxB = 0;
      for (var r = 0; r < castScene.length; r++) {
        for (var c = 0; c < castScene[0].length; c++) {
          if (castScene[r][c][0] > maxR) maxR = castScene[r][c][0];
          if (castScene[r][c][1] > maxG) maxG = castScene[r][c][1];
          if (castScene[r][c][2] > maxB) maxB = castScene[r][c][2];
        }
      }

      var scaleR2 = 255 / maxR;
      var scaleG2 = 255 / maxG;
      var scaleB2 = 255 / maxB;

      var ly = 50;
      roundRect(30, ly, 640, 80, 8, '#eff6ff', '#3b82f6');
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('假设: 图像中最亮的点应该是白色 (255, 255, 255)', 45, ly + 22);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px monospace';
      ctx.fillText('maxR = ' + maxR + ', maxG = ' + maxG + ', maxB = ' + maxB, 45, ly + 45);
      ctx.fillText('scaleR = 255/maxR = ' + scaleR2.toFixed(3) + ', scaleG = ' + scaleG2.toFixed(3) + ', scaleB = ' + scaleB2.toFixed(3), 45, ly + 63);

      // Apply correction
      var correctedScene = [];
      for (var r = 0; r < castScene.length; r++) {
        correctedScene[r] = [];
        for (var c = 0; c < castScene[0].length; c++) {
          correctedScene[r][c] = [
            Math.min(255, Math.round(castScene[r][c][0] * scaleR2)),
            Math.min(255, Math.round(castScene[r][c][1] * scaleG2)),
            Math.min(255, Math.round(castScene[r][c][2] * scaleB2))
          ];
        }
      }

      // Draw
      var cellS = 30;
      drawImageGrid(30, 150, castScene, cellS, '偏色原图', RED);
      drawImageGrid(360, 150, correctedScene, cellS, 'Max RGB 校正后', '#3b82f6');

      // Comparison of white pixels
      ly = 405;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('白色区域对比:', W / 2, ly);

      // Original white pixel (cast)
      var owPx = castScene[4][1];
      ctx.fillStyle = 'rgb(' + owPx[0] + ',' + owPx[1] + ',' + owPx[2] + ')';
      ctx.fillRect(200, ly + 5, 45, 35);
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1; ctx.strokeRect(200, ly + 5, 45, 35);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.fillText('偏色白', 222, ly + 52);

      // Corrected white pixel
      var cwPx = correctedScene[4][1];
      ctx.fillStyle = 'rgb(' + cwPx[0] + ',' + cwPx[1] + ',' + cwPx[2] + ')';
      ctx.fillRect(330, ly + 5, 45, 35);
      ctx.strokeStyle = TEXT_COLOR; ctx.strokeRect(330, ly + 5, 45, 35);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('校正白', 352, ly + 52);

      // True white
      ctx.fillStyle = '#fff';
      ctx.fillRect(460, ly + 5, 45, 35);
      ctx.strokeStyle = TEXT_COLOR; ctx.strokeRect(460, ly + 5, 45, 35);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('真白', 482, ly + 52);

      // Note
      ctx.font = '12px sans-serif';
      ctx.fillText('优点: 利用高光信息  |  缺点: 对噪声敏感，若无真正白色则失效', W / 2, 393);
    }

    // ========== Step 3: Color Temperature ==========
    function drawStep3(sliderValue) {
      var kelvin = sliderValue !== undefined ? sliderValue : 5500;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('色温概念 (Color Temperature)', W / 2, 28);

      // Kelvin scale bar
      var barX = 50, barY = 60, barW = 600, barH = 50;
      for (var i = 0; i < barW; i++) {
        var k = 2000 + (i / barW) * 8000;
        var rgb = tempToRgb(k);
        ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
        ctx.fillRect(barX + i, barY, 1, barH);
      }
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      // Temperature labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      var tMarks = [2000, 3000, 4000, 5000, 5500, 6500, 7500, 10000];
      for (var i = 0; i < tMarks.length; i++) {
        var x = barX + ((tMarks[i] - 2000) / 8000) * barW;
        ctx.fillText(tMarks[i] + 'K', x, barY + barH + 15);
        ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, barY + barH);
        ctx.lineTo(x, barY + barH + 5);
        ctx.stroke();
      }

      // Current temperature marker
      var markerX = barX + ((kelvin - 2000) / 8000) * barW;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(markerX, barY - 8);
      ctx.lineTo(markerX, barY + barH + 8);
      ctx.stroke();
      // Triangle
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(markerX - 7, barY - 12);
      ctx.lineTo(markerX + 7, barY - 12);
      ctx.lineTo(markerX, barY - 3);
      ctx.closePath();
      ctx.fill();

      // Current color swatch
      var curRgb = tempToRgb(kelvin);
      var swX = barX + barW + 15, swY = barY + 5;
      ctx.fillStyle = 'rgb(' + curRgb[0] + ',' + curRgb[1] + ',' + curRgb[2] + ')';
      ctx.fillRect(swX, swY, 50, 40);
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(swX, swY, 50, 40);

      // Temperature zones
      var zones = [
        { min: 2000, max: 3500, label: '暖光 (蜡烛/白炽灯)', color: '#f59e0b' },
        { min: 3500, max: 5500, label: '中性 (荧光灯/日出)', color: '#e5e7eb' },
        { min: 5500, max: 7500, label: '日光 (正午阳光)', color: '#bfdbfe' },
        { min: 7500, max: 10000, label: '冷光 (阴天/阴影)', color: '#93c5fd' }
      ];
      var zy = 140;
      for (var i = 0; i < zones.length; i++) {
        var zx1 = barX + ((zones[i].min - 2000) / 8000) * barW;
        var zx2 = barX + ((zones[i].max - 2000) / 8000) * barW;
        ctx.fillStyle = zones[i].color;
        ctx.fillRect(zx1, zy, zx2 - zx1, 25);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.strokeRect(zx1, zy, zx2 - zx1, 25);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zones[i].label, (zx1 + zx2) / 2, zy + 16);
      }

      // Scene under different color temperatures
      var sceneY = 190;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('场景在不同色温下的表现:', barX, sceneY - 5);

      var cellS = 20;
      var temps = [2500, 4000, 6500, 9000];
      var tempLabels = ['2500K 钨丝灯', '4000K 荧光灯', '6500K 日光', '9000K 阴天'];
      for (var t = 0; t < temps.length; t++) {
        var sx = 50 + t * 165;
        var tRgb = tempToRgb(temps[t]);
        // Apply this temperature cast to scene
        var tScene = [];
        var tr = tRgb[0] / 255, tg = tRgb[1] / 255, tb = tRgb[2] / 255;
        for (var r = 0; r < SCENE.length; r++) {
          tScene[r] = [];
          for (var c = 0; c < SCENE[0].length; c++) {
            tScene[r][c] = [
              Math.min(255, Math.round(SCENE[r][c][0] * tr)),
              Math.min(255, Math.round(SCENE[r][c][1] * tg)),
              Math.min(255, Math.round(SCENE[r][c][2] * tb))
            ];
          }
        }
        drawImageGrid(sx, sceneY, tScene, cellS, tempLabels[t], GRAY_BORDER);
      }

      // Bottom info
      ctx.fillStyle = '#eef2ff';
      roundRect(50, 368, 600, 25, 6, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('白平衡 = 告诉相机"什么是白色"，从而校正整体色调。拖动滑块 (2000–10000K) 预览色温效果', W / 2, 385);
    }

    // ========== Step 4: Comparison ==========
    function drawStep4() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('白平衡校正方法对比', W / 2, 28);

      // Build cast scene (blue cast)
      var castScene = [];
      for (var r = 0; r < SCENE.length; r++) {
        castScene[r] = [];
        for (var c = 0; c < SCENE[0].length; c++) {
          castScene[r][c] = applyBlueCast(SCENE[r][c][0], SCENE[r][c][1], SCENE[r][c][2]);
        }
      }

      // Gray World correction
      var castAvg = [0, 0, 0];
      var count = 0;
      for (var r = 0; r < castScene.length; r++) {
        for (var c = 0; c < castScene[0].length; c++) {
          castAvg[0] += castScene[r][c][0];
          castAvg[1] += castScene[r][c][1];
          castAvg[2] += castScene[r][c][2];
          count++;
        }
      }
      castAvg[0] /= count; castAvg[1] /= count; castAvg[2] /= count;
      var grayAvg = (castAvg[0] + castAvg[1] + castAvg[2]) / 3;

      var gwScene = [];
      for (var r = 0; r < castScene.length; r++) {
        gwScene[r] = [];
        for (var c = 0; c < castScene[0].length; c++) {
          gwScene[r][c] = [
            Math.min(255, Math.round(castScene[r][c][0] * grayAvg / castAvg[0])),
            Math.min(255, Math.round(castScene[r][c][1] * grayAvg / castAvg[1])),
            Math.min(255, Math.round(castScene[r][c][2] * grayAvg / castAvg[2]))
          ];
        }
      }

      // Max RGB correction
      var maxR = 0, maxG = 0, maxB = 0;
      for (var r = 0; r < castScene.length; r++) {
        for (var c = 0; c < castScene[0].length; c++) {
          if (castScene[r][c][0] > maxR) maxR = castScene[r][c][0];
          if (castScene[r][c][1] > maxG) maxG = castScene[r][c][1];
          if (castScene[r][c][2] > maxB) maxB = castScene[r][c][2];
        }
      }

      var mrScene = [];
      for (var r = 0; r < castScene.length; r++) {
        mrScene[r] = [];
        for (var c = 0; c < castScene[0].length; c++) {
          mrScene[r][c] = [
            Math.min(255, Math.round(castScene[r][c][0] * 255 / maxR)),
            Math.min(255, Math.round(castScene[r][c][1] * 255 / maxG)),
            Math.min(255, Math.round(castScene[r][c][2] * 255 / maxB))
          ];
        }
      }

      // Manual correction (known white point: the 250,250,250 pixel should be white)
      var manScene = [];
      for (var r = 0; r < castScene.length; r++) {
        manScene[r] = [];
        for (var c = 0; c < castScene[0].length; c++) {
          manScene[r][c] = [
            Math.min(255, Math.round(castScene[r][c][0] * 255 / 200)),
            Math.min(255, Math.round(castScene[r][c][1] * 255 / 225)),
            Math.min(255, Math.round(castScene[r][c][2] * 255 / 250))
          ];
        }
      }

      var cellS = 18;
      // Top row: 4 images
      drawImageGrid(25, 55, castScene, cellS, '偏色原图', RED);
      drawImageGrid(200, 55, gwScene, cellS, '灰世界校正', GREEN);
      drawImageGrid(375, 55, mrScene, cellS, 'Max RGB 校正', '#3b82f6');
      drawImageGrid(550, 55, manScene, cellS, '手动校正 (已知白点)', AMBER);

      // Pros/Cons comparison
      var tableY = 240;
      roundRect(25, tableY, 650, 148, 8, '#fff', GRAY_BORDER);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('方法对比总结', W / 2, tableY + 20);

      var methods = [
        { name: '灰世界', pro: '简单快速，无需先验知识', con: '假设不一定成立' },
        { name: 'Max RGB', pro: '利用高光信息', con: '对噪声和过曝敏感' },
        { name: '手动校正', pro: '最准确（需已知白点）', con: '需要人工干预或灰卡' }
      ];

      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('方法', 45, tableY + 42);
      ctx.fillText('优点', 200, tableY + 42);
      ctx.fillText('缺点', 460, tableY + 42);

      for (var i = 0; i < methods.length; i++) {
        var my = tableY + 58 + i * 28;
        ctx.fillStyle = i % 2 === 0 ? '#f9fafb' : '#fff';
        ctx.fillRect(30, my - 10, 640, 26);

        ctx.fillStyle = INDIGO;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(methods[i].name, 45, my + 5);
        ctx.fillStyle = GREEN;
        ctx.font = '12px sans-serif';
        ctx.fillText('✓ ' + methods[i].pro, 200, my + 5);
        ctx.fillStyle = RED;
        ctx.fillText('✗ ' + methods[i].con, 460, my + 5);
      }

      // Bottom
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('实际应用中常结合多种方法，或使用机器学习自动估计白平衡', W / 2, 395);
    }

    return {
      totalSteps: 5,
      hasSlider: true,
      sliderLabel: '色温 (K)',
      sliderMin: 2000,
      sliderMax: 10000,
      sliderStep: 100,
      sliderDefault: 5500,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(sliderValue); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(); break;
          case 3: drawStep3(sliderValue); break;
          case 4: drawStep4(); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(52, factory);
})();
