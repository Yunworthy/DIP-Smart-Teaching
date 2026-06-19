(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>连续图像</b>：高分辨率连续色调图像，模拟平滑灰度渐变（256×256）',
    '<b>空间采样</b>：降低空间分辨率（128→64→32→16像素），采样间隔越大细节丢失越多',
    '<b>灰度量化</b>：降低灰度级数（256→128→64→32→16→8级），量化级数越少出现伪轮廓',
    '<b>组合效果</b>：不同采样率×量化级数的组合效果对比矩阵',
    '<b>奈奎斯特准则</b>：采样率过低产生混叠效应（摩尔纹），需满足采样频率≥2×最高信号频率'
  ];

  // Generate smooth gradient image data (simulated as function)
  function imageFunc(x, y) {
    // x, y in [0,1]
    var v = 0;
    v += 0.4 * Math.sin(x * Math.PI * 4) * Math.sin(y * Math.PI * 3);
    v += 0.3 * Math.cos((x + y) * Math.PI * 2);
    v += 0.3 * Math.sin(x * Math.PI * 8 + 1) * 0.5;
    return (v + 1) / 2; // normalize to [0,1]
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

    function renderImage(x, y, w, h, sampleRate, quantLevels) {
      var sr = sampleRate || 1;
      var ql = quantLevels || 256;

      for (var py = 0; py < h; py += sr) {
        for (var px = 0; px < w; px += sr) {
          var nx = (x + px) / w;
          var ny = (y + py) / h;
          // Fix: use px/w not (x+px)/w
          nx = px / w;
          ny = py / h;
          var v = imageFunc(nx, ny);
          // Quantize
          if (ql < 256) {
            v = Math.round(v * (ql - 1)) / (ql - 1);
          }
          var gray = Math.round(v * 255);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(x + px, y + py, sr, sr);
        }
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }

    function drawStep0() {
      drawTitle('连续图像：高分辨率灰度图');
      drawStepLabel(0, 5);

      // Render high-res image
      var imgW = 250, imgH = 250;
      var gx = 30, gy = 45;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始图像（模拟256×256连续色调）', gx, gy - 5);

      renderImage(gx, gy, imgW, imgH, 1, 256);

      // Info panel
      var bx = 310, by = 45;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 370, 340);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 370, 340);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('图像数字化的两个步骤', bx + 15, by + 25);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('1. 采样（Sampling）', bx + 15, by + 60);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('在空间域对连续图像进行离散化', bx + 15, by + 83);
      ctx.fillText('决定图像的空间分辨率（像素数）', bx + 15, by + 106);

      ctx.fillStyle = GREEN;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('2. 量化（Quantization）', bx + 15, by + 145);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('对灰度值进行离散化', bx + 15, by + 168);
      ctx.fillText('决定图像的灰度级数（灰度分辨率）', bx + 15, by + 191);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('当前图像参数：', bx + 15, by + 235);
      ctx.font = '12px sans-serif';
      ctx.fillText('• 空间分辨率：256 × 256 像素', bx + 15, by + 260);
      ctx.fillText('• 灰度级数：256 级（8 bit）', bx + 15, by + 283);
      ctx.fillText('• 数据量：256×256×8 = 524,288 bits', bx + 15, by + 306);
    }

    function drawStep1() {
      drawTitle('空间采样：降低分辨率');
      drawStepLabel(1, 5);

      // Show 4 versions with different sampling rates
      var sizes = [
        {rate: 1, label: '256px (原始)'},
        {rate: 2, label: '128px'},
        {rate: 4, label: '64px'},
        {rate: 8, label: '32px'}
      ];

      var imgW = 140, imgH = 140;
      for (var i = 0; i < 4; i++) {
        var ix = 25 + i * 170;
        var iy = 55;

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sizes[i].label, ix + imgW / 2, iy - 5);

        renderImage(ix, iy, imgW, imgH, sizes[i].rate, 256);

        // Pixel count
        var pixCount = Math.round(256 / sizes[i].rate);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pixCount + '×' + pixCount + ' 像素', ix + imgW / 2, iy + imgH + 15);
      }

      // Explanation
      var by = 240;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, by, 650, 140);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(25, by, 650, 140);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('采样原理', 40, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('• 采样 = 在连续图像上等间隔取点', 40, by + 48);
      ctx.fillText('• 采样间隔越大（采样率越低），空间细节丢失越多', 40, by + 72);
      ctx.fillText('• 像素化效果：当采样率过低时，图像呈现明显方块', 40, by + 96);
      ctx.fillStyle = RED;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('关键：采样率必须满足奈奎斯特准则以避免混叠', 40, by + 125);
    }

    function drawStep2() {
      drawTitle('灰度量化：减少灰度级数');
      drawStepLabel(2, 5);

      var levels = [
        {ql: 256, label: '256级'},
        {ql: 64, label: '64级'},
        {ql: 16, label: '16级'},
        {ql: 4, label: '4级'}
      ];

      var imgW = 140, imgH = 140;
      for (var i = 0; i < 4; i++) {
        var ix = 25 + i * 170;
        var iy = 55;

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(levels[i].label, ix + imgW / 2, iy - 5);

        renderImage(ix, iy, imgW, imgH, 1, levels[i].ql);

        var bits = Math.round(Math.log2(levels[i].ql));
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bits + ' bit/像素', ix + imgW / 2, iy + imgH + 15);
      }

      // Explanation
      var by = 240;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, by, 650, 140);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(25, by, 650, 140);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('量化原理', 40, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('• 量化 = 将连续灰度值映射到有限个离散级别', 40, by + 48);
      ctx.fillText('• 量化级数越少，灰度层次越粗糙', 40, by + 72);
      ctx.fillText('• 伪轮廓效应：量化级数过少时出现明显的灰度台阶', 40, by + 96);
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('通常8bit(256级)足够，特殊应用需要10~16bit', 40, by + 125);
    }

    function drawStep3() {
      drawTitle('采样 × 量化组合效果');
      drawStepLabel(3, 5);

      // 4x4 grid of different combinations
      var sampleRates = [1, 2, 4, 8];
      var quantLevels = [256, 64, 16, 4];

      var cellW = 145, cellH = 80;
      var imgW = 80, imgH = 80;

      // Column headers
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      for (var j = 0; j < 4; j++) {
        ctx.fillText(quantLevels[j] + '级', 105 + j * cellW + imgW / 2, 47);
      }

      // Row headers
      ctx.textAlign = 'right';
      for (var i = 0; i < 4; i++) {
        var pixCount = Math.round(256 / sampleRates[i]);
        ctx.fillText(pixCount + 'px', 95, 65 + i * cellH + imgH / 2);
      }

      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
          var ix = 105 + j * cellW;
          var iy = 55 + i * cellH;
          renderImage(ix, iy, imgW, imgH, sampleRates[i], quantLevels[j]);
        }
      }

      // Labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← 采样率降低（空间分辨率降低）', 105, 380);
      ctx.save();
      ctx.translate(92, 55);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('量化级数减少 →', 0, 0);
      ctx.restore();
    }

    function drawStep4(sliderValue) {
      drawTitle('奈奎斯特准则与混叠效应');
      drawStepLabel(4, 5);

      var blockSize = sliderValue || 1;
      if (blockSize < 1) blockSize = 1;
      if (blockSize > 8) blockSize = 8;

      // Show original high-freq pattern
      var imgW = 180, imgH = 180;
      var gx = 25, gy = 55;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始高频图案', gx + imgW / 2, gy - 5);

      // High frequency sinusoidal pattern
      for (var py = 0; py < imgH; py++) {
        for (var px = 0; px < imgW; px++) {
          var nx = px / imgW;
          var ny = py / imgH;
          var v = (Math.sin(nx * Math.PI * 32) * Math.sin(ny * Math.PI * 24) + 1) / 2;
          var gray = Math.round(v * 255);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(gx + px, gy + py, 1, 1);
        }
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(gx, gy, imgW, imgH);

      // Sampled version
      var gx2 = 240, gy2 = 55;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('采样后（块大小=' + blockSize + '）', gx2 + imgW / 2, gy2 - 5);

      for (var py = 0; py < imgH; py += blockSize) {
        for (var px = 0; px < imgW; px += blockSize) {
          var nx = px / imgW;
          var ny = py / imgH;
          var v = (Math.sin(nx * Math.PI * 32) * Math.sin(ny * Math.PI * 24) + 1) / 2;
          var gray = Math.round(v * 255);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(gx2 + px, gy2 + py, blockSize, blockSize);
        }
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(gx2, gy2, imgW, imgH);

      // Aliased version with moire
      var gx3 = 455, gy3 = 55;
      var aliasBlock = Math.max(blockSize, 4);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('欠采样（块大小=' + aliasBlock + '）', gx3 + imgW / 2, gy3 - 5);

      for (var py = 0; py < imgH; py += aliasBlock) {
        for (var px = 0; px < imgW; px += aliasBlock) {
          var nx = px / imgW;
          var ny = py / imgH;
          var v = (Math.sin(nx * Math.PI * 32) * Math.sin(ny * Math.PI * 24) + 1) / 2;
          var gray = Math.round(v * 255);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(gx3 + px, gy3 + py, aliasBlock, aliasBlock);
        }
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(gx3, gy3, imgW, imgH);

      // Slider info
      ctx.fillStyle = INDIGO;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑块控制采样块大小：当前 = ' + blockSize + '（越大采样率越低）', W / 2, 255);

      // Explanation
      var by = 275;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, by, 650, 110);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(25, by, 650, 110);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('奈奎斯特采样定理', 40, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('采样频率 ≥ 2 × 信号最高频率 → 可无失真恢复', 40, by + 48);
      ctx.fillText('采样频率 < 2 × 信号最高频率 → 混叠（摩尔纹）', 40, by + 70);

      ctx.fillStyle = RED;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('当采样块大小增大时，高频图案产生虚假的低频摩尔纹！', 40, by + 95);
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
          case 4: drawStep4(sliderValue); break;
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return stepDescriptions[step] || '';
      }
    };
  }

  registerAnimation(2, factory);
})();
