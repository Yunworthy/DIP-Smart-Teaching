(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>线性灰度变换</b>：<code>s = a·r + b</code>，直线映射，调节对比度和亮度',
    '<b>对数变换</b>：<code>s = c·log(1+r)</code>，压缩高灰度值，扩展低灰度值（如傅里叶频谱显示）',
    '<b>幂律(伽马)变换</b>：<code>s = c·r^γ</code>，γ<1 增亮暗区，γ>1 压暗亮区',
    '<b>分段线性变换</b>：对比度拉伸，S形映射曲线，在不同区间使用不同斜率',
    '<b>变换对比</b>：四种变换的映射曲线与效果并排比较，拖动滑块调节γ值'
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

    function drawCurve(x, y, w, h, fn, color, label) {
      // Axes
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('r (输入)', x + w / 2, y + h + 16);
      ctx.save();
      ctx.translate(x - 14, y + h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('s (输出)', 0, 0);
      ctx.restore();

      // 0 and 1 labels
      ctx.textAlign = 'center';
      ctx.fillText('0', x, y + h + 12);
      ctx.fillText('1', x + w, y + h + 12);
      ctx.textAlign = 'right';
      ctx.fillText('0', x - 4, y + h + 4);
      ctx.fillText('1', x - 4, y + 4);

      // Identity line (dashed)
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Curve
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= w; i++) {
        var r = i / w;
        var s = fn(r);
        s = Math.max(0, Math.min(1, s));
        var px = x + i;
        var py = y + h - s * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      if (label) {
        ctx.fillStyle = color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 5, y + 15);
      }
    }

    function drawGradient(x, y, w, h, fn) {
      for (var i = 0; i < w; i++) {
        var r = i / w;
        var s = fn(r);
        s = Math.max(0, Math.min(1, s));
        var gray = Math.round(s * 255);
        ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
        ctx.fillRect(x + i, y, 1, h);
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }

    function drawStep0() {
      drawTitle('线性灰度变换：s = a·r + b');
      drawStepLabel(0, 5);

      // Curve
      drawCurve(30, 50, 200, 200, function(r) { return 1.5 * r - 0.1; }, INDIGO, 'a=1.5, b=-0.1');

      // Original gradient
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始灰度渐变', 280, 50);
      drawGradient(280, 68, 200, 30, function(r) { return r; });

      // Transformed gradient
      ctx.fillText('线性变换后', 280, 120);
      drawGradient(280, 138, 200, 30, function(r) { return Math.max(0, Math.min(1, 1.5 * r - 0.1)); });

      // Explanation
      var bx = 280, by = 195;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 400, 180);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 400, 180);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('线性变换特点', bx + 15, by + 22);

      ctx.font = '12px sans-serif';
      ctx.fillText('• a > 1：增大对比度（拉伸）', bx + 15, by + 50);
      ctx.fillText('• a < 1：减小对比度（压缩）', bx + 15, by + 73);
      ctx.fillText('• b > 0：整体增亮', bx + 15, by + 96);
      ctx.fillText('• b < 0：整体变暗', bx + 15, by + 119);
      ctx.fillText('• 映射关系为直线，所有灰度等比例变化', bx + 15, by + 142);
    }

    function drawStep1() {
      drawTitle('对数变换：s = c·log(1+r)');
      drawStepLabel(1, 5);

      // Curve
      var c = 1 / Math.log(2);
      drawCurve(30, 50, 200, 200, function(r) { return c * Math.log(1 + r); }, GREEN, 'c=1/log(2)');

      // Original gradient
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始灰度渐变', 280, 50);
      drawGradient(280, 68, 200, 30, function(r) { return r; });

      // Log transformed
      ctx.fillText('对数变换后（暗区被拉伸）', 280, 120);
      drawGradient(280, 138, 200, 30, function(r) { return c * Math.log(1 + r); });

      // Fourier spectrum example
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('傅里叶频谱示例', 280, 190);

      // Simulate spectrum
      var specX = 280, specY = 210, specW = 100, specH = 100;
      for (var i = 0; i < specW; i++) {
        for (var j = 0; j < specH; j++) {
          var dx = i - specW / 2, dy = j - specH / 2;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var val = Math.exp(-dist / 15) * 1000;
          var logVal = c * Math.log(1 + val / 1000);
          var gray = Math.round(logVal * 255);
          ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
          ctx.fillRect(specX + i, specY + j, 1, 1);
        }
      }
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(specX, specY, specW, specH);

      // Log spectrum
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始频谱', specX + specW / 2, specY + specH + 12);

      // Explanation
      var bx = 420, by = 190;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 260, 190);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 260, 190);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('对数变换特点', bx + 15, by + 22);

      ctx.font = '12px sans-serif';
      ctx.fillText('• 压缩高灰度值（动态范围压缩）', bx + 15, by + 50);
      ctx.fillText('• 扩展低灰度值（暗部细节增强）', bx + 15, by + 75);
      ctx.fillText('• 典型应用：傅里叶频谱显示', bx + 15, by + 100);
      ctx.fillText('• 频谱值范围10^6→压缩到0~1', bx + 15, by + 125);
      ctx.fillText('• 曲线在低输入处陡峭', bx + 15, by + 150);
    }

    function drawStep2() {
      drawTitle('幂律(伽马)变换：s = c·r^γ');
      drawStepLabel(2, 5);

      // Two curves
      var curveX = 30, curveY = 50, curveW = 200, curveH = 200;

      // Axes
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(curveX, curveY);
      ctx.lineTo(curveX, curveY + curveH);
      ctx.lineTo(curveX + curveW, curveY + curveH);
      ctx.stroke();

      // Identity
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curveX, curveY + curveH);
      ctx.lineTo(curveX + curveW, curveY);
      ctx.stroke();
      ctx.setLineDash([]);

      // gamma < 1 (brighten)
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= curveW; i++) {
        var r = i / curveW;
        var s = Math.pow(r, 0.4);
        var px = curveX + i;
        var py = curveY + curveH - s * curveH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // gamma > 1 (darken)
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= curveW; i++) {
        var r = i / curveW;
        var s = Math.pow(r, 2.5);
        var px = curveX + i;
        var py = curveY + curveH - s * curveH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // gamma = 1
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curveX, curveY + curveH);
      ctx.lineTo(curveX + curveW, curveY);
      ctx.stroke();

      // Legend
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('γ = 0.4（增亮）', curveX + curveW + 10, curveY + 30);
      ctx.fillStyle = INDIGO;
      ctx.fillText('γ = 1.0（不变）', curveX + curveW + 10, curveY + 55);
      ctx.fillStyle = RED;
      ctx.fillText('γ = 2.5（变暗）', curveX + curveW + 10, curveY + 80);

      // Gradients
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('γ=0.4 增亮效果', 300, 50);
      drawGradient(300, 68, 180, 25, function(r) { return Math.pow(r, 0.4); });

      ctx.fillText('原始', 300, 115);
      drawGradient(300, 133, 180, 25, function(r) { return r; });

      ctx.fillText('γ=2.5 变暗效果', 300, 180);
      drawGradient(300, 198, 180, 25, function(r) { return Math.pow(r, 2.5); });

      // Explanation
      var bx = 300, by = 250;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 380, 130);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 380, 130);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('伽马校正应用', bx + 15, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('• 显示器伽马校正（标准γ≈2.2）', bx + 15, by + 48);
      ctx.fillText('• 图像增强：γ<1提升暗部细节', bx + 15, by + 72);
      ctx.fillText('• 图像增强：γ>1增强亮部对比度', bx + 15, by + 96);
    }

    function drawStep3() {
      drawTitle('分段线性变换：对比度拉伸');
      drawStepLabel(3, 5);

      // Piecewise linear curve
      var curveX = 30, curveY = 50, curveW = 250, curveH = 220;

      // Axes
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(curveX, curveY);
      ctx.lineTo(curveX, curveY + curveH);
      ctx.lineTo(curveX + curveW, curveY + curveH);
      ctx.stroke();

      // Labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('r', curveX + curveW / 2, curveY + curveH + 16);

      // Breakpoints: (0.25, 0.1) and (0.75, 0.9)
      var r1 = 0.25, s1 = 0.1, r2 = 0.75, s2 = 0.9;

      function piecewise(r) {
        if (r < r1) return (s1 / r1) * r;
        if (r < r2) return s1 + ((s2 - s1) / (r2 - r1)) * (r - r1);
        return s2 + ((1 - s2) / (1 - r2)) * (r - r2);
      }

      // Draw curve
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= curveW; i++) {
        var r = i / curveW;
        var s = piecewise(r);
        var px = curveX + i;
        var py = curveY + curveH - s * curveH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Breakpoints
      var bp1x = curveX + r1 * curveW;
      var bp1y = curveY + curveH - s1 * curveH;
      var bp2x = curveX + r2 * curveW;
      var bp2y = curveY + curveH - s2 * curveH;

      ctx.fillStyle = RED;
      ctx.beginPath(); ctx.arc(bp1x, bp1y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bp2x, bp2y, 5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = RED;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('(r₁,s₁)', bp1x + 8, bp1y - 5);
      ctx.fillText('(r₂,s₂)', bp2x + 8, bp2y - 5);

      // Identity line
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curveX, curveY + curveH);
      ctx.lineTo(curveX + curveW, curveY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gradients
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始', 320, 50);
      drawGradient(320, 68, 200, 25, function(r) { return r * 0.3 + 0.2; });

      ctx.fillText('对比度拉伸后', 320, 120);
      drawGradient(320, 138, 200, 25, function(r) {
        var v = r * 0.3 + 0.2;
        return piecewise(v);
      });

      // Explanation
      var bx = 320, by = 190;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 360, 180);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 360, 180);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('分段线性变换', bx + 15, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('• 将输入范围分为多个区间', bx + 15, by + 50);
      ctx.fillText('• 每个区间使用不同的线性映射', bx + 15, by + 74);
      ctx.fillText('• 中间区间斜率大 → 对比度拉伸', bx + 15, by + 98);
      ctx.fillText('• 两端区间斜率小 → 压缩极端值', bx + 15, by + 122);
      ctx.fillText('• 断点位置可灵活调节', bx + 15, by + 146);
    }

    function drawStep4(sliderValue) {
      drawTitle('变换对比与伽马调节');
      drawStepLabel(4, 5);

      var gamma = (sliderValue || 15) / 10;
      if (gamma < 0.1) gamma = 0.1;
      if (gamma > 3.0) gamma = 3.0;

      // Four small curves side by side
      var cw = 145, ch = 120;
      var curves = [
        {fn: function(r) { return 1.5 * r - 0.1; }, label: '线性', color: INDIGO},
        {fn: function(r) { return (1 / Math.log(2)) * Math.log(1 + r); }, label: '对数', color: GREEN},
        {fn: function(r) { return Math.pow(r, gamma); }, label: '伽马(γ=' + gamma.toFixed(1) + ')', color: AMBER},
        {fn: function(r) {
          if (r < 0.25) return 0.4 * r;
          if (r < 0.75) return 0.1 + 1.6 * (r - 0.25);
          return 0.9 + 0.4 * (r - 0.75);
        }, label: '分段线性', color: RED}
      ];

      for (var i = 0; i < 4; i++) {
        var cx = 20 + i * 170;
        var cy = 45;

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(curves[i].label, cx + cw / 2, cy);

        // Mini curve
        var mcx = cx + 5, mcy = cy + 10, mcw = cw - 10, mch = ch;
        ctx.strokeStyle = TEXT_COLOR;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(mcx, mcy);
        ctx.lineTo(mcx, mcy + mch);
        ctx.lineTo(mcx + mcw, mcy + mch);
        ctx.stroke();

        ctx.strokeStyle = curves[i].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var j = 0; j <= mcw; j++) {
          var r = j / mcw;
          var s = Math.max(0, Math.min(1, curves[i].fn(r)));
          if (j === 0) ctx.moveTo(mcx + j, mcy + mch - s * mch);
          else ctx.lineTo(mcx + j, mcy + mch - s * mch);
        }
        ctx.stroke();

        // Gradient below
        drawGradient(cx, cy + ch + 20, cw, 20, curves[i].fn);
      }

      // Slider indicator
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('伽马值(滑块)：γ = ' + gamma.toFixed(2), W / 2, 230);

      // Summary
      var by = 260;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, by, 660, 120);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(20, by, 660, 120);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('四种变换比较', 35, by + 22);
      ctx.font = '12px sans-serif';
      ctx.fillText('线性：简单等比调节，无法局部增强', 35, by + 48);
      ctx.fillText('对数：压缩动态范围，适合显示频谱', 35, by + 70);
      ctx.fillText('伽马：灵活的亮度调节，显示器校正标准', 35, by + 92);

      ctx.fillStyle = AMBER;
      ctx.fillText('分段：局部对比度拉伸，断点可调', 380, by + 48);
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

  registerAnimationBatch([16, 17, 18], factory);
})();
