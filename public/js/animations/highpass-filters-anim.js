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
    ctx.beginPath();
    ctx.moveTo(ox - 4, oy + 6);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox + 4, oy + 6);
    ctx.stroke();
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, ox + w / 2, oy + h + 16);
    ctx.textAlign = 'right';
    ctx.fillText(yLabel, ox - 6, oy + h / 2);
  }

  // Draw 2D frequency plane with blocked center
  function drawFreqPlaneHP(ctx, ox, oy, size, D0, title) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(title, ox + size / 2, oy - 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox, oy, size, size);

    var cx = ox + size / 2;
    var cy = oy + size / 2;
    var radius = D0 * size / 200;

    // Pass region (outside circle) - fill entire square, then subtract circle
    ctx.fillStyle = INDIGO;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(ox, oy, size, size);
    ctx.globalAlpha = 1;

    // Stop region (inside circle) - dark
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Circle outline
    ctx.strokeStyle = RED;
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

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u622A\u6B62', cx, cy + 4);
    ctx.fillText('D\u2080=' + D0, cx, oy + size + 14);
  }

  // Highpass profile: 1 - lowpass
  function drawHPProfile(ctx, ox, oy, w, h, D0, filterType, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var maxD = 100;
    for (var i = 0; i <= w; i++) {
      var D = (i / w) * maxD;
      var H;
      if (filterType === 'ideal') {
        H = D <= D0 ? 0 : 1;
      } else if (filterType === 'butterworth') {
        var n = 2;
        var lp = 1 / (1 + Math.pow(D / D0, 2 * n));
        H = 1 - lp;
      } else {
        var lp = Math.exp(-(D * D) / (2 * D0 * D0));
        H = 1 - lp;
      }
      var px = ox + i;
      var py = oy + h - H * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, ox + w + 6, oy + 14);
  }

  // Bandpass profile
  function drawBPProfile(ctx, ox, oy, w, h, D1, D2, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var maxD = 100;
    for (var i = 0; i <= w; i++) {
      var D = (i / w) * maxD;
      var H = 0;
      if (D >= D1 && D <= D2) {
        H = 1;
      } else {
        // Smooth transition
        var mid = (D1 + D2) / 2;
        var bw = (D2 - D1) / 2;
        var dist = Math.abs(D - mid);
        if (dist < bw * 1.5) {
          H = Math.exp(-((dist - bw) * (dist - bw)) / (2 * (bw * 0.3) * (bw * 0.3)));
          if (H < 0.01) H = 0;
        }
      }
      var px = ox + i;
      var py = oy + h - H * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, ox + w + 6, oy + 14);
  }

  // Bandstop profile
  function drawBSProfile(ctx, ox, oy, w, h, D1, D2, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var maxD = 100;
    for (var i = 0; i <= w; i++) {
      var D = (i / w) * maxD;
      var H = 1;
      if (D >= D1 && D <= D2) {
        H = 0;
      } else {
        var mid = (D1 + D2) / 2;
        var bw = (D2 - D1) / 2;
        var dist = Math.abs(D - mid);
        if (dist < bw * 1.5) {
          var g = Math.exp(-((dist - bw) * (dist - bw)) / (2 * (bw * 0.3) * (bw * 0.3)));
          H = 1 - g;
        }
      }
      var px = ox + i;
      var py = oy + h - H * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, ox + w + 6, oy + 14);
  }

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

  function drawDLine(ctx, ox, oy, w, h, D, label, color) {
    var x = ox + (D / 100) * w;
    ctx.strokeStyle = color || AMBER;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color || AMBER;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, oy + h + 14);
  }

  var descriptions = [
    '<b>\u9AD8\u901A\u6EE4\u6CE2</b>\uFF1A\u9AD8\u901A = 1 - \u4F4E\u901A\uFF0C\u963B\u6B62\u4F4E\u9891\uFF08\u4E2D\u5FC3\uFF09\u901A\u8FC7\u9AD8\u9891',
    '<b>\u7406\u60F3\u9AD8\u901A</b>\uFF1A\u622A\u9762\u66F2\u7EBF\u4E3A\u4F4E\u901A\u7684\u53CD\u8F6C\uFF0CD\u2080 \u5185\u5B8C\u5168\u622A\u6B62',
    '<b>\u5DF4\u7279\u6C83\u65AF/\u9AD8\u65AF\u9AD8\u901A</b>\uFF1A\u5E73\u6ED1\u8FC7\u6E21\u7684\u9AD8\u901A\u66F2\u7EBF',
    '<b>\u5E26\u901A\u6EE4\u6CE2\u5668</b>\uFF1A\u53EA\u5141\u8BB8 D\u2081 \u5230 D\u2082 \u4E4B\u95F4\u7684\u9891\u7387\u901A\u8FC7\uFF0C\u73AF\u5F62\u901A\u5E26',
    '<b>\u5E26\u963B\u6EE4\u6CE2\u5668</b>\uFF1A\u6291\u5236\u7279\u5B9A\u9891\u7387\u5E26\uFF0C\u4E0E\u5E26\u901A\u4E92\u8865',
    '<b>\u5E94\u7528\u603B\u7ED3</b>\uFF1A\u9AD8\u901A\u7528\u4E8E\u8FB9\u7F18\u68C0\u6D4B\uFF0C\u5E26\u901A\u7528\u4E8E\u7EB9\u7406\u5206\u6790'
  ];

  registerAnimationBatch([34, 35], function (canvas, ctx) {
    return {
      totalSteps: 6,
      hasSlider: false,
      draw: function (step) {
        ctx.clearRect(0, 0, 700, 400);
        drawHeader(ctx, step, 6);
        var D0 = 35;

        if (step === 0) {
          drawTitle(ctx, '\u9AD8\u901A\u6EE4\u6CE2 = 1 - \u4F4E\u901A', 20, 44);
          drawFreqPlaneHP(ctx, 40, 70, 160, D0, '\u9AD8\u901A\u9891\u7387\u5E73\u9762');

          // Concept explanation
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          var ex = 250;
          ctx.fillText('\u4F4E\u901A\u6EE4\u6CE2\u5668 (LPF):', ex, 80);
          ctx.fillText('\u2022 \u5141\u8BB8\u4F4E\u9891\u901A\u8FC7\uFF0C\u963B\u6B62\u9AD8\u9891', ex, 104);
          ctx.fillText('\u2022 \u6548\u679C\uFF1A\u5E73\u6ED1/\u6A21\u7CCA', ex, 128);

          ctx.fillText('\u9AD8\u901A\u6EE4\u6CE2\u5668 (HPF):', ex, 170);
          ctx.fillText('\u2022 \u963B\u6B62\u4F4E\u9891\uFF0C\u5141\u8BB8\u9AD8\u9891\u901A\u8FC7', ex, 194);
          ctx.fillText('\u2022 \u6548\u679C\uFF1A\u9510\u5316/\u8FB9\u7F18\u68C0\u6D4B', ex, 218);

          ctx.fillStyle = INDIGO;
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('HPF(u,v) = 1 - LPF(u,v)', ex, 268);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.fillText('\u9AD8\u901A\u6EE4\u6CE2\u5668\u4E0E\u4F4E\u901A\u6EE4\u6CE2\u5668\u4E92\u8865', ex, 310);
          ctx.fillText('\u4FDD\u7559\u56FE\u50CF\u4E2D\u7684\u8FB9\u7F18\u548C\u7EC6\u8282\u4FE1\u606F', ex, 332);
        } else if (step === 1) {
          drawTitle(ctx, '\u7406\u60F3\u9AD8\u901A\u6EE4\u6CE2\u5668 (IHPF)', 20, 44);
          var gx = 60, gy = 70, gw = 560, gh = 230;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawHPProfile(ctx, gx, gy, gw, gh, D0, 'ideal', INDIGO, '\u7406\u60F3\u9AD8\u901A');
          drawD0Line(ctx, gx, gy, gw, gh, D0);

          // Also draw lowpass for comparison (dashed)
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          for (var i = 0; i <= gw; i++) {
            var D = (i / gw) * 100;
            var H = D <= D0 ? 1 : 0;
            var px = gx + i;
            var py = gy + gh - H * gh;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = GRAY_BORDER;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u4F4E\u901A (\u53C2\u8003)', gx + gw + 6, gy + 30);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u7406\u60F3\u9AD8\u901A\u662F\u7406\u60F3\u4F4E\u901A\u7684\u53CD\u8F6C\uFF0C\u540C\u6837\u5B58\u5728\u632F\u94C3\u95EE\u9898', 60, 330);
          ctx.fillText('\u7070\u8272\u865A\u7EBF\u4E3A\u5BF9\u5E94\u7684\u4F4E\u901A\u6EE4\u6CE2\u5668\u66F2\u7EBF', 60, 352);
        } else if (step === 2) {
          drawTitle(ctx, '\u5DF4\u7279\u6C83\u65AF / \u9AD8\u65AF \u9AD8\u901A\u6EE4\u6CE2\u5668', 20, 44);
          var gx = 60, gy = 70, gw = 560, gh = 230;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.5', gx - 6, gy + gh / 2 + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawHPProfile(ctx, gx, gy, gw, gh, D0, 'butterworth', GREEN, '\u5DF4\u7279\u6C83\u65AF n=2');
          drawHPProfile(ctx, gx, gy, gw, gh, D0, 'gaussian', AMBER, '\u9AD8\u65AF\u9AD8\u901A');
          drawD0Line(ctx, gx, gy, gw, gh, D0);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u5DF4\u7279\u6C83\u65AF\u9AD8\u901A: H(u,v) = 1 - 1/(1+(D\u2080/D)^(2n))', 60, 330);
          ctx.fillText('\u9AD8\u65AF\u9AD8\u901A: H(u,v) = 1 - exp(-D\u00B2/(2D\u2080\u00B2))', 60, 352);
          ctx.fillText('\u4E24\u8005\u90FD\u63D0\u4F9B\u5E73\u6ED1\u8FC7\u6E21\uFF0C\u907F\u514D\u632F\u94C3\u6548\u5E94', 60, 374);
        } else if (step === 3) {
          drawTitle(ctx, '\u5E26\u901A\u6EE4\u6CE2\u5668 (Bandpass)', 20, 44);
          var D1 = 20, D2 = 55;

          // 2D frequency plane with ring
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('2D \u9891\u7387\u5E73\u9762', 120, 66);

          var fSize = 150;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(45, 70, fSize, fSize);
          var cx = 45 + fSize / 2;
          var cy = 70 + fSize / 2;

          // Ring (pass band)
          ctx.fillStyle = INDIGO;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(cx, cy, D2 * fSize / 200, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(cx, cy, D1 * fSize / 200, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, D1 * fSize / 200, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.strokeStyle = AMBER;
          ctx.beginPath();
          ctx.arc(cx, cy, D2 * fSize / 200, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('D\u2081', cx, cy + D1 * fSize / 200 + 12);
          ctx.fillText('D\u2082', cx, cy + D2 * fSize / 200 + 12);

          // Cross-section
          drawTitle(ctx, '\u622A\u9762\u66F2\u7EBF:', 240, 44);
          var gx = 260, gy = 70, gw = 380, gh = 200;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawBPProfile(ctx, gx, gy, gw, gh, D1, D2, INDIGO, '\u5E26\u901A');
          drawDLine(ctx, gx, gy, gw, gh, D1, 'D\u2081=' + D1, GREEN);
          drawDLine(ctx, gx, gy, gw, gh, D2, 'D\u2082=' + D2, AMBER);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u5E26\u901A\u6EE4\u6CE2\u5668\u53EA\u5141\u8BB8 D\u2081 \u5230 D\u2082 \u4E4B\u95F4\u7684\u9891\u7387\u901A\u8FC7', 240, 300);
          ctx.fillText('\u53EF\u7528\u4E8E\u63D0\u53D6\u7279\u5B9A\u5C3A\u5EA6\u7684\u7EB9\u7406\u7279\u5F81', 240, 322);
        } else if (step === 4) {
          drawTitle(ctx, '\u5E26\u963B\u6EE4\u6CE2\u5668 (Bandstop / Notch)', 20, 44);
          var D1 = 20, D2 = 55;

          // 2D frequency plane
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('2D \u9891\u7387\u5E73\u9762', 120, 66);

          var fSize = 150;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(45, 70, fSize, fSize);
          var cx = 45 + fSize / 2;
          var cy = 70 + fSize / 2;

          // All pass except ring
          ctx.fillStyle = INDIGO;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(45, 70, fSize, fSize);
          ctx.globalAlpha = 1;

          // Stop ring
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(cx, cy, D2 * fSize / 200, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = INDIGO;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(cx, cy, D1 * fSize / 200, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.strokeStyle = RED;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, D1 * fSize / 200, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, D2 * fSize / 200, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u963B\u6B62\u5E26', cx, cy + 4);

          // Cross-section
          drawTitle(ctx, '\u622A\u9762\u66F2\u7EBF:', 240, 44);
          var gx = 260, gy = 70, gw = 380, gh = 200;
          drawAxes(ctx, gx, gy, gw, gh, '\u8DDD\u79BB D', 'H');
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('1.0', gx - 6, gy + 4);
          ctx.fillText('0.0', gx - 6, gy + gh + 4);

          drawBSProfile(ctx, gx, gy, gw, gh, D1, D2, RED, '\u5E26\u963B');
          drawDLine(ctx, gx, gy, gw, gh, D1, 'D\u2081=' + D1, GREEN);
          drawDLine(ctx, gx, gy, gw, gh, D2, 'D\u2082=' + D2, AMBER);

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('\u5E26\u963B\u6EE4\u6CE2\u5668\u4E0E\u5E26\u901A\u4E92\u8865: BSF = 1 - BPF', 240, 300);
          ctx.fillText('\u7528\u4E8E\u6D88\u9664\u7279\u5B9A\u9891\u7387\u5E72\u6270\uFF08\u5982\u5468\u671F\u6027\u566A\u58F0\uFF09', 240, 322);
        } else if (step === 5) {
          drawTitle(ctx, '\u5E94\u7528\u603B\u7ED3', 20, 44);

          var items = [
            { name: '\u9AD8\u901A\u6EE4\u6CE2\u5668', color: INDIGO, uses: ['\u8FB9\u7F18\u68C0\u6D4B', '\u56FE\u50CF\u9510\u5316', '\u7EC6\u8282\u589E\u5F3A'], icon: '\u25C6' },
            { name: '\u5E26\u901A\u6EE4\u6CE2\u5668', color: GREEN, uses: ['\u7EB9\u7406\u5206\u6790', '\u7279\u5B9A\u5C3A\u5EA6\u7279\u5F81\u63D0\u53D6', '\u9891\u7387\u5206\u6BB5\u5904\u7406'], icon: '\u25CB' },
            { name: '\u5E26\u963B\u6EE4\u6CE2\u5668', color: RED, uses: ['\u6D88\u9664\u5468\u671F\u6027\u566A\u58F0', '\u6291\u5236\u7279\u5B9A\u5E72\u6270', '\u9676\u6CE2\u7EB9\u53BB\u9664'], icon: '\u25CF' }
          ];

          for (var k = 0; k < 3; k++) {
            var bx = 20 + k * 228;
            var by = 70;
            var bw = 210;
            var bh = 220;

            ctx.fillStyle = '#fff';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = items[k].color;
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);

            ctx.fillStyle = items[k].color;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(items[k].icon + ' ' + items[k].name, bx + bw / 2, by + 28);

            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('\u5E94\u7528\u573A\u666F:', bx + 14, by + 56);
            for (var u = 0; u < items[k].uses.length; u++) {
              ctx.fillText('\u2022 ' + items[k].uses[u], bx + 14, by + 82 + u * 24);
            }
          }

          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u9891\u57DF\u6EE4\u6CE2\u662F\u56FE\u50CF\u5904\u7406\u7684\u6838\u5FC3\u5DE5\u5177\uFF0C\u901A\u8FC7\u9009\u62E9\u6027\u5730\u901A\u8FC7\u6216\u963B\u6B62\u7279\u5B9A\u9891\u7387\u6210\u5206', 350, 320);
          ctx.fillText('\u6765\u5B9E\u73B0\u5E73\u6ED1\u3001\u9510\u5316\u3001\u53BB\u566A\u3001\u7279\u5F81\u63D0\u53D6\u7B49\u591A\u79CD\u76EE\u6807', 350, 342);
          ctx.fillText('\u5B9E\u9645\u8BBE\u8BA1\u65F6\u5E94\u6839\u636E\u5177\u4F53\u9700\u6C42\u9009\u62E9\u5408\u9002\u7684\u6EE4\u6CE2\u5668\u7C7B\u578B\u548C\u53C2\u6570', 350, 368);
        }
      },
      reset: function () {},
      getStepDescription: function (step) {
        return descriptions[step] || '';
      }
    };
  });
})();
