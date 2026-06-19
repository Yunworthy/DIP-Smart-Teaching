(function () {
  var INDIGO = '#4f46e5';
  var LIGHT_INDIGO = '#6366f1';
  var GREEN = '#10b981';
  var RED = '#ef4444';
  var AMBER = '#f59e0b';
  var GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db';
  var TEXT_COLOR = '#374151';

  function drawHeader(ctx, step, total) {
    ctx.fillStyle = GRAY_BG;
    ctx.fillRect(0, 0, 700, 34);
    ctx.fillStyle = INDIGO;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u6B65\u9AA4 ' + (step + 1) + ' / ' + total, 14, 17);
  }

  function drawTitle(ctx, text, x, y) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function drawAxes(ctx, ox, oy, w, h, xLabel, yLabel) {
    ctx.strokeStyle = TEXT_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + h);
    ctx.lineTo(ox + w, oy + h);
    ctx.stroke();
    // Arrow on Y
    ctx.beginPath();
    ctx.moveTo(ox - 4, oy + 6);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox + 4, oy + 6);
    ctx.stroke();
    // Labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, ox + w / 2, oy + h + 16);
    ctx.textAlign = 'right';
    ctx.fillText(yLabel, ox - 6, oy + h / 2);
  }

  // Draw 2D frequency plane with circle
  function drawFreqPlane(ctx, ox, oy, size, D0, title) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + size / 2, oy - 4);

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox, oy, size, size);

    // Pass region (circle)
    var cx = ox + size / 2;
    var cy = oy + size / 2;
    var radius = D0 * size / 200;
    ctx.fillStyle = INDIGO;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Circle outline
    ctx.strokeStyle = LIGHT_INDIGO;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, oy);
    ctx.lineTo(cx, oy + size);
    ctx.moveTo(ox, cy);
    ctx.lineTo(ox + size, cy);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u901A\u8FC7', cx, cy + 4);
    ctx.fillText('D\u2080=' + D0, cx, oy + size + 14);
  }

  // Draw cross-section profile curve
  function drawProfile(ctx, ox, oy, w, h, D0, filterType, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var maxD = 100;
    for (var i = 0; i <= w; i++) {
      var D = (i / w) * maxD;
      var H;
      if (filterType === 'ideal') {
        H = D <= D0 ? 1 : 0;
      } else if (filterType === 'butterworth') {
        var n = 2;
        H = 1 / (1 + Math.pow(D / D0, 2 * n));
      } else {
        H = Math.exp(-(D * D) / (2 * D0 * D0));
      }
      var px = ox + i;
      var py = oy + h - H * h;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    var labelY = oy + 14;
    if (filterType === 'butterworth') labelY = oy + 30;
    if (filterType === 'gaussian') labelY = oy + 46;
    ctx.fillText(label, ox + w + 6, labelY);
  }

  // Draw D0 marker line
  function drawD0Line(ctx, ox, oy, w, h, D0) {
    var x = ox + (D0 / 100) * w;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = AMBER;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('D\u2080=' + D0, x, oy + h + 14);
  }

  var descriptions = [
    '<b>\u7406\u60F3\u4F4E\u901A\u6EE4\u6CE2\u5668</b>\uFF1A\u622A\u6B62\u9891\u7387 D\u2080 \u5185\u5B8C\u5168\u901A\u8FC7\uFF0C\u4E4B\u5916\u5B8C\u5168\u622A\u6B62\uFF0C\u8FC7\u6E21\u7A81\u7136',
    '<b>\u5DF4\u7279\u6C83\u65AF\u6EE4\u6CE2\u5668</b>\uFF1A<code>H(u,v) = 1/(1+(D/D\u2080)^(2n))</code>\uFF0Cn=2\uFF0C\u5E73\u6ED1\u8FC7\u6E21',
    '<b>\u9AD8\u65AF\u4F4E\u901A\u6EE4\u6CE2\u5668</b>\uFF1A<code>H(u,v) = exp(-D\u00B2/(2D\u2080\u00B2))</code>\uFF0C\u949F\u5F62\u66F2\u7EBF\uFF0C\u65E0\u632F\u94C3',
    '<b>\u4E09\u79CD\u6EE4\u6CE2\u5668\u5BF9\u6BD4</b>\uFF1A\u622A\u9762\u66F2\u7EBF\u53E0\u52A0\u663E\u793A\uFF0C\u6ED1\u52A8\u6761\u63A7\u5236 D\u2080',
    '<b>\u632F\u94C3\u6548\u5E94</b>\uFF1A\u7406\u60F3\u6EE4\u6CE2\u5668\u4EA7\u751F\u632F\u94C3\uFF0C\u5DF4\u7279\u6C83\u65AF\u8F83\u5C11\uFF0C\u9AD8\u65AF\u65E0\u632F\u94C3'
  ];

  registerAnimationBatch([31, 32, 33], function (canvas, ctx) {
    return {
      totalSteps: 5,
      hasSlider: true,
      sliderLabel: '\u622A\u6B62\u9891\u7387 D\u2080',
      sliderMin: 10,
      sliderMax: 80,
      sliderStep: 1,
      sliderDefault: 40,
      draw: function (step, sliderValue) {
        ctx.clearRect(0, 0, 700, 400);
        drawHeader(ctx, step, 5);
        var D0 = sliderValue || 40;

        if (step === 0) {
          drawTitle(ctx, '\u7406\u60F3\u4F4E\u901A\u6EE4\u6CE2\u5668 (ILPF)', 20, 44);
          // 2D frequency plane
          drawFreqPlane(ctx, 30, 70, 180, D0, '2D \u9891\u7387\u5E73\u9762');

          // Cross-section
          drawTitle(ctx, '\u622A\u9762\u66F2\u7EBF H(u,v):', 260, 44);
          var gx = 280, gy = 80, gw = 360, gh = 200;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          // Y-axis labels
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawProfile(ctx, gx, gy, gw, gh, D0, 'ideal', INDIGO, '\u7406\u60F3');
          drawD0Line(ctx, gx, gy, gw, gh, D0);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u7406\u60F3\u4F4E\u901A: \u622A\u6B62\u9891\u7387\u5185 H=1\uFF0C\u4E4B\u5916 H=0', 260, 310);
          ctx.fillText('\u7A81\u7136\u7684\u622A\u6B62\u4F1A\u5BFC\u81F4\u7A7A\u57DF\u4E2D\u7684\u632F\u94C3\u6548\u5E94\u3002', 260, 332);
          ctx.fillText('\u6ED1\u52A8\u6761\u8C03\u6574 D\u2080 = ' + D0, 260, 358);
        } else if (step === 1) {
          drawTitle(ctx, '\u5DF4\u7279\u6C83\u65AF\u4F4E\u901A\u6EE4\u6CE2\u5668 (BLPF)  n=2', 20, 44);
          drawFreqPlane(ctx, 30, 70, 180, D0, '2D \u9891\u7387\u5E73\u9762');

          drawTitle(ctx, '\u622A\u9762\u66F2\u7EBF:', 260, 44);
          var gx = 280, gy = 80, gw = 360, gh = 200;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.5', gx - 6, gy + gh / 2 + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawProfile(ctx, gx, gy, gw, gh, D0, 'butterworth', GREEN, 'n=2');
          drawD0Line(ctx, gx, gy, gw, gh, D0);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('H(u,v) = 1 / (1 + (D/D\u2080)^(2n))', 260, 310);
          ctx.fillText('n=2 \u65F6\u5728 D=D\u2080 \u5904 H=0.5\uFF0C\u5E73\u6ED1\u8FC7\u6E21', 260, 332);
          ctx.fillText('\u6BD4\u7406\u60F3\u6EE4\u6CE2\u5668\u66F4\u5B9E\u7528\uFF0C\u632F\u94C3\u8F83\u5C11', 260, 358);
        } else if (step === 2) {
          drawTitle(ctx, '\u9AD8\u65AF\u4F4E\u901A\u6EE4\u6CE2\u5668 (GLPF)', 20, 44);
          drawFreqPlane(ctx, 30, 70, 180, D0, '2D \u9891\u7387\u5E73\u9762');

          drawTitle(ctx, '\u622A\u9762\u66F2\u7EBF:', 260, 44);
          var gx = 280, gy = 80, gw = 360, gh = 200;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawProfile(ctx, gx, gy, gw, gh, D0, 'gaussian', AMBER, '\u9AD8\u65AF');
          drawD0Line(ctx, gx, gy, gw, gh, D0);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('H(u,v) = exp(-D\u00B2 / (2D\u2080\u00B2))', 260, 310);
          ctx.fillText('\u949F\u5F62\u66F2\u7EBF\uFF0C\u5B8C\u5168\u5E73\u6ED1\u8FC7\u6E21', 260, 332);
          ctx.fillText('\u5085\u91CC\u53F6\u53D8\u6362\u4E5F\u662F\u9AD8\u65AF\u51FD\u6570\uFF0C\u65E0\u632F\u94C3\u6548\u5E94', 260, 358);
        } else if (step === 3) {
          drawTitle(ctx, '\u4E09\u79CD\u4F4E\u901A\u6EE4\u6CE2\u5668\u622A\u9762\u5BF9\u6BD4  (D\u2080=' + D0 + ')', 20, 44);
          var gx = 60, gy = 70, gw = 560, gh = 240;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.5', gx - 6, gy + gh / 2 + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          // Draw X-axis ticks
          for (var t = 0; t <= 100; t += 20) {
            var tx = gx + (t / 100) * gw;
            ctx.strokeStyle = GRAY_BORDER;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(tx, gy + gh);
            ctx.lineTo(tx, gy + gh + 4);
            ctx.stroke();
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String(t), tx, gy + gh + 14);
          }

          drawProfile(ctx, gx, gy, gw, gh, D0, 'ideal', INDIGO, '\u7406\u60F3');
          drawProfile(ctx, gx, gy, gw, gh, D0, 'butterworth', GREEN, '\u5DF4\u7279\u6C83\u65AF n=2');
          drawProfile(ctx, gx, gy, gw, gh, D0, 'gaussian', AMBER, '\u9AD8\u65AF');
          drawD0Line(ctx, gx, gy, gw, gh, D0);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u6ED1\u52A8\u6761\u8C03\u6574\u622A\u6B62\u9891\u7387 D\u2080\uFF0C\u89C2\u5BDF\u6EE4\u6CE2\u5668\u5F62\u72B6\u53D8\u5316', 350, 350);
          ctx.fillText('\u7406\u60F3(\u7A81\u53D8) vs \u5DF4\u7279\u6C83\u65AF(\u5E73\u6ED1) vs \u9AD8\u65AF(\u6700\u5E73\u6ED1)', 350, 372);
        } else if (step === 4) {
          drawTitle(ctx, '\u632F\u94C3\u6548\u5E94\u5BF9\u6BD4', 20, 44);
          // Show 3 boxes with ringing explanation
          var boxW = 200, boxH = 140;
          var labels = ['\u7406\u60F3\u6EE4\u6CE2\u5668', '\u5DF4\u7279\u6C83\u65AF n=2', '\u9AD8\u65AF\u6EE4\u6CE2\u5668'];
          var colors = [INDIGO, GREEN, AMBER];
          var ringing = ['\u4E25\u91CD\u632F\u94C3', '\u8F7B\u5FAE\u632F\u94C3', '\u65E0\u632F\u94C3'];
          var icons = ['\u26A0', '\u25CB', '\u2713'];

          for (var k = 0; k < 3; k++) {
            var bx = 25 + k * 225;
            var by = 70;
            ctx.fillStyle = '#fff';
            ctx.fillRect(bx, by, boxW, boxH);
            ctx.strokeStyle = colors[k];
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, boxW, boxH);

            ctx.fillStyle = colors[k];
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[k], bx + boxW / 2, by + 22);

            // Draw mini ringing waveform
            ctx.strokeStyle = colors[k];
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            var midY = by + 80;
            for (var i = 0; i < boxW - 20; i++) {
              var x = bx + 10 + i;
              var amp;
              if (k === 0) {
                amp = Math.sin(i * 0.15) * 20 * Math.exp(-i * 0.01);
              } else if (k === 1) {
                amp = Math.sin(i * 0.12) * 12 * Math.exp(-i * 0.025);
              } else {
                amp = Math.sin(i * 0.1) * 6 * Math.exp(-i * 0.05);
              }
              var y = midY - amp;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Baseline
            ctx.strokeStyle = GRAY_BORDER;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(bx + 10, midY);
            ctx.lineTo(bx + boxW - 10, midY);
            ctx.stroke();

            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(icons[k] + ' ' + ringing[k], bx + boxW / 2, by + boxH - 10);
          }

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u7406\u60F3\u6EE4\u6CE2\u5668\u7684\u7A81\u7136\u622A\u6B62\u5BFC\u81F4\u7A7A\u57DF\u4E2D\u51FA\u73B0\u660E\u663E\u7684\u632F\u94C3\u73B0\u8C61', 350, 240);
          ctx.fillText('\u5DF4\u7279\u6C83\u65AF\u968F\u9636\u6570\u589E\u52A0\u632F\u94C3\u52A0\u5267\uFF0C\u9AD8\u65AF\u59CB\u7EC8\u65E0\u632F\u94C3', 350, 262);
          ctx.fillText('\u5B9E\u9645\u5E94\u7528\u4E2D\u901A\u5E38\u9009\u62E9\u5DF4\u7279\u6C83\u65AF\u6216\u9AD8\u65AF\u6EE4\u6CE2\u5668', 350, 288);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });
})();
