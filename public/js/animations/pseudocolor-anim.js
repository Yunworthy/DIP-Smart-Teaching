(function () {
  // ========== Color Palette ==========
  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981', RED = '#ef4444',
    AMBER = '#f59e0b', GRAY_BG = '#f9fafb', GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>步骤 1/5 — 灰度梯度：</b>原始灰度图像从黑 (0) 到白 (255) 的连续渐变。每个灰度值对应一种亮度，但人眼难以区分细微差异。',
    '<b>步骤 2/5 — 密度切片：</b>将灰度范围 [0, 255] 分成多个区间段（密度层），每段赋予不同的颜色标签。这是伪彩色处理的基础步骤。',
    '<b>步骤 3/5 — 伪彩色映射：</b>为每个密度区间分配颜色：蓝→绿→黄→红。映射后人眼可以更直观地区分不同灰度区间。',
    '<b>步骤 4/5 — 正弦传递函数：</b>使用 R、G、B 三通道的正弦函数实现连续的彩虹色映射。公式: <code>R = sin(πg/255 + φr)</code> 等，生成平滑渐变。滑块可预览不同灰度的映射颜色。',
    '<b>步骤 5/5 — 热成像伪彩色：</b>将温度数据映射为颜色。低温→蓝色，中温→绿/黄，高温→红/白。广泛应用于红外热像仪、医学诊断。'
  ];

  // Precomputed sinusoidal colormap
  function rainbowColor(gray) {
    var t = gray / 255;
    var r = Math.round(Math.abs(Math.sin(t * Math.PI * 1.5)) * 255);
    var g = Math.round(Math.abs(Math.sin(t * Math.PI * 1.5 + 2.094)) * 255);
    var b = Math.round(Math.abs(Math.sin(t * Math.PI * 1.5 + 4.189)) * 255);
    return [r, g, b];
  }

  // Thermal colormap
  function thermalColor(val) {
    var t = val / 255;
    var r, g, b;
    if (t < 0.25) {
      r = 0; g = Math.round(t * 4 * 100); b = Math.round(100 + t * 4 * 155);
    } else if (t < 0.5) {
      var s = (t - 0.25) * 4;
      r = Math.round(s * 100); g = Math.round(100 + s * 155); b = Math.round(255 * (1 - s));
    } else if (t < 0.75) {
      var s = (t - 0.5) * 4;
      r = Math.round(100 + s * 155); g = Math.round(255 * (1 - s * 0.5)); b = 0;
    } else {
      var s = (t - 0.75) * 4;
      r = 255; g = Math.round(127 * (1 - s)); b = Math.round(s * 255);
    }
    return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
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

    // ========== Step 0: Grayscale Gradient ==========
    function drawStep0() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('灰度梯度条', W / 2, 28);

      var barX = 50, barY = 60, barW = 600, barH = 80;

      // Gradient bar
      for (var i = 0; i < barW; i++) {
        var g = Math.round((i / barW) * 255);
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
        ctx.fillRect(barX + i, barY, 1, barH);
      }
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      // Labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      var labels = [0, 32, 64, 96, 128, 160, 192, 224, 255];
      for (var i = 0; i < labels.length; i++) {
        var x = barX + (labels[i] / 255) * barW;
        ctx.fillText(labels[i].toString(), x, barY + barH + 20);
        ctx.strokeStyle = TEXT_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, barY + barH);
        ctx.lineTo(x, barY + barH + 6);
        ctx.stroke();
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← 黑 (0)', barX, barY + barH + 40);
      ctx.textAlign = 'right';
      ctx.fillText('白 (255) →', barX + barW, barY + barH + 40);
      ctx.textAlign = 'center';
      ctx.fillText('灰度值 (0–255)', barX + barW / 2, barY + barH + 40);

      // Explanation
      var ly = 200;
      roundRect(50, ly, 600, 60, 8, '#f9fafb', GRAY_BORDER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('灰度图像中，每个像素只有一个 0–255 的亮度值。', 65, ly + 22);
      ctx.fillText('人眼只能分辨约 20–30 个灰度层次，但能区分数百万种颜色。', 65, ly + 42);
      ctx.fillText('因此伪彩色处理的目的是利用色彩增强灰度图像的可辨识性。', 65, ly + 55);

      // Sample pixels
      var ly = 285;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('灰度样本像素:', W / 2, ly);
      var samples = [0, 64, 128, 192, 255];
      var sampleW = 80, sampleH = 50, gap = 20;
      var startX = (W - samples.length * sampleW - (samples.length - 1) * gap) / 2;
      for (var i = 0; i < samples.length; i++) {
        var sx = startX + i * (sampleW + gap);
        ctx.fillStyle = 'rgb(' + samples[i] + ',' + samples[i] + ',' + samples[i] + ')';
        ctx.fillRect(sx, ly + 10, sampleW, sampleH);
        ctx.strokeStyle = TEXT_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, ly + 10, sampleW, sampleH);
        ctx.fillStyle = samples[i] > 128 ? '#000' : '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(samples[i].toString(), sx + sampleW / 2, ly + 40);
      }
    }

    // ========== Step 1: Density Slicing ==========
    function drawStep1() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('密度切片 (Density Slicing)', W / 2, 28);

      // Original gradient
      var barX = 50, barY = 55, barW = 600, barH = 45;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始灰度:', barX, barY - 5);
      for (var i = 0; i < barW; i++) {
        var g = Math.round((i / barW) * 255);
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
        ctx.fillRect(barX + i, barY, 1, barH);
      }
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Cut lines
      var cuts = [64, 128, 192];
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      for (var i = 0; i < cuts.length; i++) {
        var cx = barX + (cuts[i] / 255) * barW;
        ctx.beginPath();
        ctx.moveTo(cx, barY - 5);
        ctx.lineTo(cx, barY + barH + 5);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Arrow
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⇓  切片  ⇓', W / 2, 125);

      // Sliced bands
      var bands = [
        { min: 0, max: 63, label: '区间 A: 0–63', desc: '暗部' },
        { min: 64, max: 127, label: '区间 B: 64–127', desc: '中暗' },
        { min: 128, max: 191, label: '区间 C: 128–191', desc: '中亮' },
        { min: 192, max: 255, label: '区间 D: 192–255', desc: '亮部' }
      ];
      var bandY = 145, bandH = 55, bandGap = 12;
      for (var i = 0; i < bands.length; i++) {
        var by = bandY + i * (bandH + bandGap);
        var bx1 = barX + (bands[i].min / 255) * barW;
        var bx2 = barX + (bands[i].max / 255) * barW;
        var bw = bx2 - bx1;

        // Grayscale portion
        for (var j = bands[i].min; j <= bands[i].max; j++) {
          var px = barX + (j / 255) * barW;
          ctx.fillStyle = 'rgb(' + j + ',' + j + ',' + j + ')';
          ctx.fillRect(px, by, 1, bandH);
        }
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx1, by, bw, bandH);

        // Label
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(bands[i].label, barX + barW + 10, by + 22);
        ctx.font = '11px sans-serif';
        ctx.fillText(bands[i].desc, barX + barW + 10, by + 40);
      }

      // Summary
      ctx.fillStyle = '#eef2ff';
      roundRect(50, 370, 600, 25, 6, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('将连续灰度离散化为 4 个密度区间，为下一步的颜色分配做准备', W / 2, 387);
    }

    // ========== Step 2: Assign Colors ==========
    function drawStep2() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('伪彩色映射 — 区间着色', W / 2, 28);

      var barX = 50, barW = 600;

      // Mapping table
      var bands = [
        { min: 0, max: 63, color: '#2563eb', name: '蓝色', r: 37, g: 99, b: 235 },
        { min: 64, max: 127, color: '#16a34a', name: '绿色', r: 22, g: 163, b: 74 },
        { min: 128, max: 191, color: '#eab308', name: '黄色', r: 234, g: 179, b: 8 },
        { min: 192, max: 255, color: '#dc2626', name: '红色', r: 220, g: 38, b: 38 }
      ];

      // Grayscale original
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('灰度原图:', barX, 50);
      var barY = 55, barH = 35;
      for (var i = 0; i < barW; i++) {
        var g = Math.round((i / barW) * 255);
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
        ctx.fillRect(barX + i, barY, 1, barH);
      }
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Arrows
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⇓', W / 2, 108);

      // Mapping arrows
      var arrowY = 115;
      for (var i = 0; i < bands.length; i++) {
        var bx1 = barX + (bands[i].min / 255) * barW;
        var bx2 = barX + (bands[i].max / 255) * barW;
        var bMid = (bx1 + bx2) / 2;

        ctx.fillStyle = bands[i].color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bands[i].min + '–' + bands[i].max + ' → ' + bands[i].name, bMid, arrowY + i * 18);
      }

      // Pseudocolor result bar
      var pcY = 200, pcH = 55;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('伪彩色结果:', barX, pcY - 5);
      for (var i = 0; i < bands.length; i++) {
        var bx1 = barX + (bands[i].min / 255) * barW;
        var bx2 = barX + (bands[i].max / 255) * barW;
        ctx.fillStyle = bands[i].color;
        ctx.fillRect(bx1, pcY, bx2 - bx1, pcH);
      }
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 2;
      ctx.strokeRect(barX, pcY, barW, pcH);

      // Band labels
      for (var i = 0; i < bands.length; i++) {
        var bx1 = barX + (bands[i].min / 255) * barW;
        var bx2 = barX + (bands[i].max / 255) * barW;
        var bMid = (bx1 + bx2) / 2;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bands[i].name, bMid, pcY + 35);
      }

      // Comparison: 6x6 grid
      var gridX = 50, gridY = 280, cellS = 50, gridRows = 2, gridCols = 12;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('6×12 伪彩色图像对比 (上: 灰度  下: 伪彩色):', gridX, gridY - 5);

      for (var r = 0; r < gridRows; r++) {
        for (var c = 0; c < gridCols; c++) {
          var grayVal = Math.round((c / (gridCols - 1)) * 255);
          if (r === 0) {
            ctx.fillStyle = 'rgb(' + grayVal + ',' + grayVal + ',' + grayVal + ')';
          } else {
            // Find band
            var col = '#808080';
            for (var b = 0; b < bands.length; b++) {
              if (grayVal >= bands[b].min && grayVal <= bands[b].max) {
                col = bands[b].color;
                break;
              }
            }
            ctx.fillStyle = col;
          }
          ctx.fillRect(gridX + c * cellS, gridY + r * cellS, cellS - 1, cellS - 1);
        }
      }

      // Bottom
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('伪彩色使不同灰度区间一目了然，大幅提升可视化效果', W / 2, 393);
    }

    // ========== Step 3: Sinusoidal Transfer Functions ==========
    function drawStep3(sliderValue) {
      var cursor = sliderValue !== undefined ? sliderValue : 128;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('正弦传递函数 — 彩虹色映射', W / 2, 28);

      // Transfer function curves
      var plotX = 50, plotY = 55, plotW = 400, plotH = 160;
      roundRect(plotX - 5, plotY - 5, plotW + 10, plotH + 10, 4, '#fff', GRAY_BORDER);

      // Axes
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotX, plotY + plotH);
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.moveTo(plotX, plotY);
      ctx.lineTo(plotX, plotY + plotH);
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = '#e5e7eb';
      for (var i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(plotX, plotY + (plotH / 4) * i);
        ctx.lineTo(plotX + plotW, plotY + (plotH / 4) * i);
        ctx.stroke();
      }

      // R curve
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= plotW; i++) {
        var t = i / plotW;
        var val = Math.abs(Math.sin(t * Math.PI * 1.5));
        var x = plotX + i;
        var y = plotY + plotH - val * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // G curve
      ctx.strokeStyle = GREEN;
      ctx.beginPath();
      for (var i = 0; i <= plotW; i++) {
        var t = i / plotW;
        var val = Math.abs(Math.sin(t * Math.PI * 1.5 + 2.094));
        var x = plotX + i;
        var y = plotY + plotH - val * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // B curve
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      for (var i = 0; i <= plotW; i++) {
        var t = i / plotW;
        var val = Math.abs(Math.sin(t * Math.PI * 1.5 + 4.189));
        var x = plotX + i;
        var y = plotY + plotH - val * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('灰度值 →', plotX + plotW / 2, plotY + plotH + 18);
      ctx.save();
      ctx.translate(plotX - 12, plotY + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('输出值', 0, 0);
      ctx.restore();

      // Legend
      ctx.font = 'bold 12px sans-serif';
      var lgX = 470, lgY = 60;
      ctx.fillStyle = RED; ctx.fillText('— R 通道', lgX, lgY);
      ctx.fillStyle = GREEN; ctx.fillText('— G 通道', lgX, lgY + 18);
      ctx.fillStyle = '#3b82f6'; ctx.fillText('— B 通道', lgX, lgY + 36);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      ctx.fillText('R = |sin(1.5πg/255)|', lgX, lgY + 60);
      ctx.fillText('G = |sin(1.5πg/255+2π/3)|', lgX, lgY + 78);
      ctx.fillText('B = |sin(1.5πg/255+4π/3)|', lgX, lgY + 96);

      // Rainbow gradient bar
      var rbX = 50, rbY = 240, rbW = 600, rbH = 45;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('彩虹色映射结果:', rbX, rbY - 5);
      for (var i = 0; i < rbW; i++) {
        var gray = Math.round((i / rbW) * 255);
        var c = rainbowColor(gray);
        ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        ctx.fillRect(rbX + i, rbY, 1, rbH);
      }
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(rbX, rbY, rbW, rbH);

      // Cursor
      var cursorX = rbX + (cursor / 255) * rbW;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cursorX, rbY - 5);
      ctx.lineTo(cursorX, rbY + rbH + 5);
      ctx.stroke();
      // Triangle pointer
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(cursorX - 6, rbY - 10);
      ctx.lineTo(cursorX + 6, rbY - 10);
      ctx.lineTo(cursorX, rbY - 2);
      ctx.closePath();
      ctx.fill();

      // Cursor color swatch
      var cc = rainbowColor(cursor);
      var swX = rbX + rbW + 15, swY = rbY;
      ctx.fillStyle = 'rgb(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ')';
      ctx.fillRect(swX, swY, 60, rbH);
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(swX, swY, 60, rbH);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('灰度: ' + Math.round(cursor), swX, rbY + rbH + 18);
      ctx.fillText('RGB(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ')', swX, rbY + rbH + 33);

      // Slider hint
      ctx.fillStyle = '#fef3c7';
      roundRect(50, 320, 600, 65, 8, '#fef3c7', AMBER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('拖动滑块 (0–255) 移动光标，查看不同灰度值对应的伪彩色', W / 2, 345);
      ctx.fillText('正弦函数使 R、G、B 三通道交替变化，产生连续的彩虹渐变效果', W / 2, 365);
    }

    // ========== Step 4: Thermal Imaging ==========
    function drawStep4(sliderValue) {
      var cursor = sliderValue !== undefined ? sliderValue : 128;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('热成像伪彩色应用', W / 2, 28);

      // Temperature scale
      var tsX = 50, tsY = 55, tsW = 600, tsH = 35;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('温度 → 颜色映射:', tsX, tsY - 5);

      // Thermal gradient bar
      for (var i = 0; i < tsW; i++) {
        var val = Math.round((i / tsW) * 255);
        var tc = thermalColor(val);
        ctx.fillStyle = 'rgb(' + tc[0] + ',' + tc[1] + ',' + tc[2] + ')';
        ctx.fillRect(tsX + i, tsY, 1, tsH);
      }
      ctx.strokeStyle = TEXT_COLOR; ctx.lineWidth = 1;
      ctx.strokeRect(tsX, tsY, tsW, tsH);

      // Temperature labels
      var temps = ['15°C', '20°C', '25°C', '30°C', '35°C', '37°C', '40°C', '45°C'];
      var tempVals = [0, 32, 64, 96, 128, 160, 192, 255];
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      for (var i = 0; i < temps.length; i++) {
        var x = tsX + (tempVals[i] / 255) * tsW;
        ctx.fillText(temps[i], x, tsY + tsH + 15);
      }

      // Simulated thermal image (12x8 grid)
      var imgX = 50, imgY = 115, cellS = 42, rows = 6, cols = 12;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('模拟热成像图 (温度分布):', imgX, imgY - 5);

      // Generate thermal data (simulate a warm object in center)
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var dist = Math.sqrt(Math.pow(c - 5.5, 2) + Math.pow(r - 2.5, 2));
          var temp = Math.max(0, Math.min(255, Math.round(255 - dist * 45 + ((r * 3 + c * 7) % 20) - 10)));
          var tc = thermalColor(temp);
          ctx.fillStyle = 'rgb(' + tc[0] + ',' + tc[1] + ',' + tc[2] + ')';
          ctx.fillRect(imgX + c * cellS, imgY + r * cellS, cellS - 1, cellS - 1);
        }
      }

      // Color legend on right
      var legX = imgX + cols * cellS + 20, legY = imgY, legW = 25, legH = rows * cellS;
      for (var i = 0; i < legH; i++) {
        var val = 255 - Math.round((i / legH) * 255);
        var tc = thermalColor(val);
        ctx.fillStyle = 'rgb(' + tc[0] + ',' + tc[1] + ',' + tc[2] + ')';
        ctx.fillRect(legX, legY + i, legW, 1);
      }
      ctx.strokeStyle = TEXT_COLOR;
      ctx.strokeRect(legX, legY, legW, legH);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('高温', legX + legW + 5, legY + 10);
      ctx.fillText('低温', legX + legW + 5, legY + legH);

      // Cursor on thermal bar
      var cursorX = tsX + (cursor / 255) * tsW;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cursorX, tsY - 5);
      ctx.lineTo(cursorX, tsY + tsH + 5);
      ctx.stroke();

      // Cursor info
      var cc = thermalColor(cursor);
      var tempC = Math.round(15 + (cursor / 255) * 30);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('当前温度: ' + tempC + '°C → RGB(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ')', tsX, tsY + tsH + 35);

      // Color swatch
      ctx.fillStyle = 'rgb(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ')';
      ctx.fillRect(tsX + 350, tsY + tsH + 22, 35, 20);
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(tsX + 350, tsY + tsH + 22, 35, 20);

      // Bottom explanation
      var btmY = imgY + rows * cellS + 15;
      ctx.fillStyle = '#ecfdf5';
      roundRect(50, btmY, 600, 30, 6, '#ecfdf5', GREEN);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('热成像伪彩色: 低温蓝色 → 中温绿黄 → 高温红白，拖动滑块 (0–255) 预览映射颜色', W / 2, btmY + 20);
    }

    return {
      totalSteps: 5,
      hasSlider: true,
      sliderLabel: '灰度值',
      sliderMin: 0,
      sliderMax: 255,
      sliderStep: 1,
      sliderDefault: 128,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(); break;
          case 3: drawStep3(sliderValue); break;
          case 4: drawStep4(sliderValue); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(48, factory);
  window.__pseudocolorFactory = factory;
})();
