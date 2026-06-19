(function () {
  // ========== Color Palette ==========
  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981', RED = '#ef4444',
    AMBER = '#f59e0b', GRAY_BG = '#f9fafb', GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>步骤 1/6 — RGB 颜色立方体：</b>RGB 模型用三个 0–255 的分量表示颜色。立方体的 8 个顶点对应黑、红、绿、蓝、青、品红、黄、白。滑块可旋转色相角预览。',
    '<b>步骤 2/6 — RGB 通道分解：</b>任意颜色可分解为 R、G、B 三个独立通道。例如橙色 = <code>R:255 G:165 B:0</code>，每个通道贡献对应光谱分量。',
    '<b>步骤 3/6 — HSV 锥体模型：</b>HSV 将颜色描述为色相 H（角度 0°–360°）、饱和度 S（半径 0–1）、明度 V（高度 0–1），更符合人的感知方式。滑块可旋转色相环。',
    '<b>步骤 4/6 — HSI 双锥模型：</b>HSI 用色相 H、饱和度 S、亮度 I 描述颜色，双锥体上下分别对应白色和黑色，中间赤道面为纯色。',
    '<b>步骤 5/6 — YCbCr 与 Lab 颜色空间：</b>YCbCr 将亮度 Y 与色度 Cb、Cr 分离，广泛用于 JPEG 压缩。Lab 追求感知均匀性，色差等于视觉差。',
    '<b>步骤 6/6 — 颜色模型对比：</b>不同模型各有适用场景——RGB 用于显示、HSV 用于调色、YCbCr 用于压缩、Lab 用于色彩科学。'
  ];

  function factory(canvas, ctx) {
    var W = canvas.width, H = canvas.height;

    function clear() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GRAY_BG;
      ctx.fillRect(0, 0, W, H);
    }

    // Helper: draw rounded rect
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

    // Helper: draw arrow line
    function drawArrow(x1, y1, x2, y2, color, label) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Arrow head
      var angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(angle - 0.3), y2 - 10 * Math.sin(angle - 0.3));
      ctx.lineTo(x2 - 10 * Math.cos(angle + 0.3), y2 - 10 * Math.sin(angle + 0.3));
      ctx.closePath();
      ctx.fill();
      if (label) {
        ctx.fillStyle = color;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x2 + 12 * Math.cos(angle), y2 + 12 * Math.sin(angle));
      }
    }

    // HSL to RGB helper
    function hslToRgb(h, s, l) {
      h = h / 360;
      var r, g, b;
      if (s === 0) { r = g = b = l; }
      else {
        var hue2rgb = function (p, q, t) {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        var q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p2 = 2 * l - q2;
        r = hue2rgb(p2, q2, h + 1 / 3);
        g = hue2rgb(p2, q2, h);
        b = hue2rgb(p2, q2, h - 1 / 3);
      }
      return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
    }

    // ========== Step 0: RGB Cube ==========
    function drawStep0(sliderValue) {
      var hue = sliderValue !== undefined ? sliderValue : 0;

      // Title
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RGB 颜色立方体', W / 2, 28);

      // 3D cube (isometric projection)
      var cx = 240, cy = 200, size = 110;
      // Cube vertices in isometric
      var dx = size * 0.87, dy = size * 0.5;
      // Front face corners
      var f0 = { x: cx, y: cy };                         // origin (black)
      var f1 = { x: cx + dx, y: cy + dy };               // R
      var f2 = { x: cx, y: cy - size };                   // G
      var f3 = { x: cx + dx, y: cy - size + dy };        // R+G (yellow)
      // Back face corners (offset by B direction)
      var bx = -dx * 0.6, by = -dy * 0.6 - size * 0.35;
      var b0 = { x: f0.x + bx, y: f0.y + by };           // B (blue)
      var b1 = { x: f1.x + bx, y: f1.y + by };           // R+B (magenta)
      var b2 = { x: f2.x + bx, y: f2.y + by };           // G+B (cyan)
      var b3 = { x: f3.x + bx, y: f3.y + by };           // R+G+B (white)

      // Draw back faces first
      // Top face (G=top)
      ctx.fillStyle = 'rgba(76, 175, 80, 0.25)';
      ctx.beginPath();
      ctx.moveTo(f2.x, f2.y); ctx.lineTo(f3.x, f3.y);
      ctx.lineTo(b3.x, b3.y); ctx.lineTo(b2.x, b2.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.lineWidth = 1; ctx.stroke();

      // Left face (B direction)
      ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
      ctx.beginPath();
      ctx.moveTo(f0.x, f0.y); ctx.lineTo(f2.x, f2.y);
      ctx.lineTo(b2.x, b2.y); ctx.lineTo(b0.x, b0.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.stroke();

      // Right face (R direction)
      ctx.fillStyle = 'rgba(244, 67, 54, 0.2)';
      ctx.beginPath();
      ctx.moveTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y);
      ctx.lineTo(b1.x, b1.y); ctx.lineTo(b0.x, b0.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.stroke();

      // Front face: R-G
      ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
      ctx.beginPath();
      ctx.moveTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y);
      ctx.lineTo(f3.x, f3.y); ctx.lineTo(f2.x, f2.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = GRAY_BORDER; ctx.stroke();

      // Cube outline
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      // Front edges
      ctx.beginPath();
      ctx.moveTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y);
      ctx.moveTo(f0.x, f0.y); ctx.lineTo(f2.x, f2.y);
      ctx.moveTo(f1.x, f1.y); ctx.lineTo(f3.x, f3.y);
      ctx.moveTo(f2.x, f2.y); ctx.lineTo(f3.x, f3.y);
      // Back edges
      ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y);
      ctx.moveTo(b0.x, b0.y); ctx.lineTo(b2.x, b2.y);
      ctx.moveTo(b1.x, b1.y); ctx.lineTo(b3.x, b3.y);
      ctx.moveTo(b2.x, b2.y); ctx.lineTo(b3.x, b3.y);
      // Connecting edges
      ctx.moveTo(f0.x, f0.y); ctx.lineTo(b0.x, b0.y);
      ctx.moveTo(f1.x, f1.y); ctx.lineTo(b1.x, b1.y);
      ctx.moveTo(f2.x, f2.y); ctx.lineTo(b2.x, b2.y);
      ctx.moveTo(f3.x, f3.y); ctx.lineTo(b3.x, b3.y);
      ctx.stroke();

      // Axis labels
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = RED;
      ctx.fillText('R →', (f0.x + f1.x) / 2 + 15, (f0.y + f1.y) / 2 + 18);
      ctx.fillStyle = GREEN;
      ctx.fillText('G ↑', f2.x - 22, f2.y - 8);
      ctx.fillStyle = '#2196f3';
      ctx.fillText('B ↗', b0.x - 8, b0.y + 20);

      // Corner labels
      ctx.font = '12px sans-serif';
      var corners = [
        { p: f0, label: '(0,0,0)', color: '#000000', name: '黑' },
        { p: f1, label: '(255,0,0)', color: '#ff0000', name: '红' },
        { p: f2, label: '(0,255,0)', color: '#00ff00', name: '绿' },
        { p: f3, label: '(255,255,0)', color: '#ffff00', name: '黄' },
        { p: b0, label: '(0,0,255)', color: '#0000ff', name: '蓝' },
        { p: b1, label: '(255,0,255)', color: '#ff00ff', name: '品红' },
        { p: b2, label: '(0,255,255)', color: '#00ffff', name: '青' },
        { p: b3, label: '(255,255,255)', color: '#ffffff', name: '白' }
      ];
      for (var i = 0; i < corners.length; i++) {
        var c = corners[i];
        ctx.fillStyle = c.color;
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.p.x, c.p.y, 7, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(c.name, c.p.x + 20, c.p.y - 6);
        ctx.font = '10px monospace';
        ctx.fillText(c.label, c.p.x + 20, c.p.y + 8);
        ctx.font = '12px sans-serif';
      }

      // Right side: color wheel preview with slider hue
      var wheelCx = 530, wheelCy = 160, wheelR = 80;
      for (var a = 0; a < 360; a += 2) {
        ctx.fillStyle = hslToRgb(a, 1, 0.5);
        ctx.beginPath();
        ctx.moveTo(wheelCx, wheelCy);
        ctx.arc(wheelCx, wheelCy, wheelR, (a - 2) * Math.PI / 180, a * Math.PI / 180);
        ctx.closePath();
        ctx.fill();
      }
      // Hue marker
      var markerAngle = hue * Math.PI / 180;
      ctx.fillStyle = hslToRgb(hue, 1, 0.5);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wheelCx + (wheelR - 12) * Math.cos(markerAngle), wheelCy + (wheelR - 12) * Math.sin(markerAngle), 8, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('色相角: ' + Math.round(hue) + '°', wheelCx, wheelCy + wheelR + 25);
      ctx.fillText('拖动滑块旋转色相', wheelCx, wheelCy + wheelR + 42);
    }

    // ========== Step 1: RGB Channel Decomposition ==========
    function drawStep1() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RGB 通道分解', W / 2, 28);

      // Original color bar (orange)
      var barX = 50, barY = 55, barW = 600, barH = 40;
      roundRect(barX, barY, barW, barH, 6, 'rgb(255, 165, 0)', GRAY_BORDER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始颜色: 橙色  RGB(255, 165, 0)', barX, barY - 8);

      // Split arrow
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⇓  分解  ⇓', W / 2, 118);

      // R channel
      var cy = 145, ch = 45;
      roundRect(barX, cy, barW * (255 / 255), ch, 6, 'rgb(255, 0, 0)', GRAY_BORDER);
      ctx.fillStyle = '#fff';
      roundRect(barX + barW * (255 / 255) + 2, cy, barW * (1 - 255 / 255) - 2, ch, 0, '#f3f4f6', null);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('R 通道', barX, cy - 6);
      ctx.fillStyle = '#fff';
      ctx.fillText('255', barX + 15, cy + 28);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('0', barX + barW - 5, cy + 28);

      // G channel
      cy = 225;
      roundRect(barX, cy, barW * (165 / 255), ch, 6, 'rgb(0, 200, 0)', GRAY_BORDER);
      roundRect(barX + barW * (165 / 255) + 2, cy, barW * (1 - 165 / 255) - 2, ch, 0, '#f3f4f6', GRAY_BORDER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('G 通道', barX, cy - 6);
      ctx.fillStyle = '#fff';
      ctx.fillText('165', barX + 15, cy + 28);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('0', barX + barW - 5, cy + 28);

      // B channel
      cy = 305;
      roundRect(barX, cy, barW * (0 / 255 + 0.01), ch, 6, 'rgb(100, 100, 200)', GRAY_BORDER);
      roundRect(barX + barW * 0.01 + 2, cy, barW * (1 - 0.01) - 2, ch, 0, '#f3f4f6', GRAY_BORDER);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('B 通道', barX, cy - 6);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('0', barX + 15, cy + 28);

      // Explanation
      ctx.fillStyle = '#eef2ff';
      roundRect(440, 220, 210, 80, 8, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('各通道分量相加:', 450, 240);
      ctx.font = '12px monospace';
      ctx.fillText('R: 255 → 红色全亮', 450, 258);
      ctx.fillText('G: 165 → 绿色 65%', 450, 274);
      ctx.fillText('B:   0 → 蓝色关闭', 450, 290);
    }

    // ========== Step 2: HSV Cone ==========
    function drawStep2(sliderValue) {
      var hue = sliderValue !== undefined ? sliderValue : 0;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HSV 锥体模型', W / 2, 28);

      // Draw cone (side view)
      var coneCx = 230, coneTop = 60, coneBot = 310, coneBaseR = 120;
      // Cone body gradient
      var grad = ctx.createLinearGradient(coneCx, coneTop, coneCx, coneBot);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#cccccc');
      grad.addColorStop(1, '#666666');

      // Cone outline
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(coneCx, coneTop);
      ctx.lineTo(coneCx - coneBaseR, coneBot);
      ctx.moveTo(coneCx, coneTop);
      ctx.lineTo(coneCx + coneBaseR, coneBot);
      ctx.stroke();

      // Ellipse at bottom
      ctx.beginPath();
      ctx.ellipse(coneCx, coneBot, coneBaseR, 30, 0, 0, Math.PI * 2);
      ctx.strokeStyle = TEXT_COLOR;
      ctx.stroke();

      // Color wheel on top (top of cone = full brightness circle)
      var wheelY = coneTop + 30, wheelR = 75;
      for (var a = 0; a < 360; a += 2) {
        ctx.fillStyle = hslToRgb(a, 1, 0.5);
        ctx.beginPath();
        ctx.moveTo(coneCx, wheelY);
        ctx.arc(coneCx, wheelY, wheelR, (a - 2) * Math.PI / 180, a * Math.PI / 180);
        ctx.closePath();
        ctx.fill();
      }
      // White center
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(coneCx, wheelY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hue marker
      var mAngle = hue * Math.PI / 180;
      ctx.fillStyle = hslToRgb(hue, 1, 0.5);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(coneCx + (wheelR - 15) * Math.cos(mAngle), wheelY + (wheelR - 15) * Math.sin(mAngle), 9, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('H (色相): 0°–360°', coneCx - coneBaseR - 20, coneBot + 55);
      ctx.fillText('S (饱和度): 中心→边缘', coneCx - coneBaseR - 20, coneBot + 75);
      ctx.fillText('V (明度): 白→黑 (沿锥体高度)', coneCx - coneBaseR - 20, coneBot + 95);

      // Right side: HSV cylinder explanation
      var infoX = 410, infoY = 70;
      roundRect(infoX, infoY, 250, 290, 10, '#f0fdf4', GREEN);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('HSV 参数说明', infoX + 15, infoY + 28);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      var lines = [
        'H (Hue) — 色相角度:',
        '  0°=红 60°=黄 120°=绿',
        '  180°=青 240°=蓝 300°=品红',
        '',
        'S (Saturation) — 饱和度:',
        '  0=灰色  1=纯色',
        '',
        'V (Value) — 明度:',
        '  0=黑色  1=全亮',
        '',
        '当前色相: ' + Math.round(hue) + '°',
        '对应颜色: ' + (hue < 30 ? '红' : hue < 60 ? '橙/黄' : hue < 90 ? '黄绿' : hue < 150 ? '绿' : hue < 210 ? '青' : hue < 270 ? '蓝' : hue < 330 ? '紫/品红' : '红')
      ];
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], infoX + 15, infoY + 52 + i * 20);
      }
    }

    // ========== Step 3: HSI Double Cone ==========
    function drawStep3() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HSI 双锥模型', W / 2, 28);

      // Draw double cone (side view)
      var cx = 220, mid = 200, topY = 55, botY = 345, baseR = 110;

      // Upper cone
      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx - baseR, mid);
      ctx.lineTo(cx + baseR, mid);
      ctx.closePath();
      ctx.stroke();

      // Lower cone
      ctx.beginPath();
      ctx.moveTo(cx, botY);
      ctx.lineTo(cx - baseR, mid);
      ctx.lineTo(cx + baseR, mid);
      ctx.closePath();
      ctx.stroke();

      // Ellipse at middle (equator)
      ctx.beginPath();
      ctx.ellipse(cx, mid, baseR, 25, 0, 0, Math.PI * 2);
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Color wheel on equator
      var eqR = baseR - 5;
      for (var a = 0; a < 360; a += 3) {
        ctx.fillStyle = hslToRgb(a, 1, 0.5);
        ctx.beginPath();
        ctx.moveTo(cx, mid);
        ctx.arc(cx, mid, eqR, (a - 3) * Math.PI / 180, a * Math.PI / 180);
        ctx.closePath();
        ctx.fill();
      }

      // Intensity axis
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, topY - 10);
      ctx.lineTo(cx, botY + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('白 (I=1)', cx, topY - 5);
      ctx.fillStyle = '#000';
      ctx.fillText('黑 (I=0)', cx, botY + 20);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('I (亮度) 轴', cx + 50, (topY + botY) / 2);

      // Right side info
      var infoX = 400, infoY = 65;
      roundRect(infoX, infoY, 260, 290, 10, '#fef3c7', AMBER);
      ctx.fillStyle = AMBER;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('HSI 与 HSV 的区别', infoX + 15, infoY + 28);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      var hsiLines = [
        'H (Hue) — 色相:',
        '  与 HSV 相同，0°–360° 角度',
        '',
        'S (Saturation) — 饱和度:',
        '  纯色到灰色的比例',
        '  S = 1 - min(R,G,B) / I',
        '',
        'I (Intensity) — 亮度:',
        '  I = (R + G + B) / 3',
        '',
        '特点:',
        '• 亮度 I 独立于色度信息',
        '• 双锥体体现亮度在中间最饱和',
        '• 上下顶点为白/黑（S=0）'
      ];
      for (var i = 0; i < hsiLines.length; i++) {
        ctx.fillText(hsiLines[i], infoX + 15, infoY + 52 + i * 19);
      }
    }

    // ========== Step 4: YCbCr & Lab ==========
    function drawStep4() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YCbCr 与 Lab 颜色空间', W / 2, 28);

      // YCbCr section (left)
      var lx = 30, ly = 55;
      roundRect(lx, ly, 320, 300, 10, '#eff6ff', '#3b82f6');
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('YCbCr 颜色空间', lx + 15, ly + 25);

      // Y channel bar
      var barX = lx + 20, barW = 270, barH = 30;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '13px sans-serif';
      ctx.fillText('Y (亮度)', barX, ly + 60);
      var yGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      yGrad.addColorStop(0, '#000'); yGrad.addColorStop(1, '#fff');
      ctx.fillStyle = yGrad;
      ctx.fillRect(barX, ly + 65, barW, barH);
      ctx.strokeStyle = GRAY_BORDER; ctx.strokeRect(barX, ly + 65, barW, barH);

      // Cb channel
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('Cb (蓝色差)', barX, ly + 118);
      var cbGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      cbGrad.addColorStop(0, '#ffff00'); cbGrad.addColorStop(0.5, '#808080'); cbGrad.addColorStop(1, '#0000ff');
      ctx.fillStyle = cbGrad;
      ctx.fillRect(barX, ly + 123, barW, barH);
      ctx.strokeStyle = GRAY_BORDER; ctx.strokeRect(barX, ly + 123, barW, barH);

      // Cr channel
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('Cr (红色差)', barX, ly + 176);
      var crGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      crGrad.addColorStop(0, '#00ffff'); crGrad.addColorStop(0.5, '#808080'); crGrad.addColorStop(1, '#ff0000');
      ctx.fillStyle = crGrad;
      ctx.fillRect(barX, ly + 181, barW, barH);
      ctx.strokeStyle = GRAY_BORDER; ctx.strokeRect(barX, ly + 181, barW, barH);

      ctx.fillStyle = '#3b82f6';
      ctx.font = '12px sans-serif';
      ctx.fillText('JPEG 压缩: 对 Cb/Cr 下采样，人眼对亮度更敏感', barX, ly + 232);
      ctx.fillText('Y = 0.299R + 0.587G + 0.114B', barX, ly + 252);

      // Lab section (right)
      var rx = 370, ry = 55;
      roundRect(rx, ry, 300, 300, 10, '#fdf2f8', '#ec4899');
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CIE Lab 颜色空间', rx + 15, ry + 25);

      // Lab visualization: a-b plane
      var labCx = rx + 150, labCy = ry + 165, labR = 85;
      // Draw a-b chromaticity circle
      for (var a2 = 0; a2 < 360; a2 += 3) {
        var col = hslToRgb(a2, 0.8, 0.55);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(labCx, labCy);
        ctx.arc(labCx, labCy, labR, (a2 - 3) * Math.PI / 180, a2 * Math.PI / 180);
        ctx.closePath();
        ctx.fill();
      }
      // White center
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(labCx, labCy, 12, 0, Math.PI * 2);
      ctx.fill();

      // Axis labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+a*', labCx + labR + 12, labCy);
      ctx.fillText('-a*', labCx - labR - 12, labCy);
      ctx.fillText('+b*', labCx, labCy - labR - 8);
      ctx.fillText('-b*', labCx, labCy + labR + 14);

      ctx.fillStyle = '#ec4899';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('L* = 亮度 (0-100)', rx + 15, ry + 268);
      ctx.fillText('a* = 绿↔红轴', rx + 15, ry + 284);
      ctx.fillText('b* = 蓝↔黄轴', rx + 160, ry + 284);

      // Bottom explanation
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Lab 追求感知均匀性: 色彩距离 ≈ 视觉差异 (Delta E)', W / 2, 382);
    }

    // ========== Step 5: Comparison Table ==========
    function drawStep5() {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('颜色模型对比', W / 2, 28);

      // Table
      var tableX = 40, tableY = 50, colW = [100, 140, 220, 180], rowH = 48;
      var headers = ['模型', '分量', '特点', '应用场景'];
      var data = [
        ['RGB', 'R, G, B (0-255)', '加色模型，面向硬件', '显示器、摄像头、Web'],
        ['HSV/HSI', 'H(0-360°) S V/I', '极坐标，符合直觉', '调色、色彩选取'],
        ['YCbCr', 'Y, Cb, Cr', '亮度/色度分离', 'JPEG、MPEG 压缩'],
        ['Lab', 'L*, a*, b*', '感知均匀，设备无关', '色彩科学、色差计算'],
        ['CMYK', 'C, M, Y, K', '减色模型，面向印刷', '印刷、出版']
      ];

      // Header row
      var totalW = colW[0] + colW[1] + colW[2] + colW[3];
      ctx.fillStyle = INDIGO;
      ctx.fillRect(tableX, tableY, totalW, rowH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      var cx = tableX;
      for (var h = 0; h < headers.length; h++) {
        ctx.fillText(headers[h], cx + colW[h] / 2, tableY + 28);
        cx += colW[h];
      }

      // Data rows
      for (var r = 0; r < data.length; r++) {
        var ry = tableY + (r + 1) * rowH;
        var bgColor = r % 2 === 0 ? '#f9fafb' : '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(tableX, ry, totalW, rowH);
        ctx.strokeStyle = GRAY_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(tableX, ry, totalW, rowH);

        // Column separators
        cx = tableX;
        for (var c = 0; c < colW.length; c++) {
          ctx.fillStyle = c === 0 ? INDIGO : TEXT_COLOR;
          ctx.font = c === 0 ? 'bold 13px sans-serif' : '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(data[r][c], cx + colW[c] / 2, ry + 28);
          // Column lines
          if (c > 0) {
            ctx.strokeStyle = GRAY_BORDER;
            ctx.beginPath();
            ctx.moveTo(cx, ry);
            ctx.lineTo(cx, ry + rowH);
            ctx.stroke();
          }
          cx += colW[c];
        }
      }

      // Border around entire table
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(tableX, tableY, totalW, rowH * (data.length + 1));

      // Bottom summary
      ctx.fillStyle = '#eef2ff';
      roundRect(40, 340, 620, 45, 8, '#eef2ff', INDIGO);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('选择颜色模型取决于应用场景：硬件用 RGB，调色用 HSV，压缩用 YCbCr，科学用 Lab', W / 2, 366);
    }

    return {
      totalSteps: 6,
      hasSlider: true,
      sliderLabel: '色相角 H',
      sliderMin: 0,
      sliderMax: 360,
      sliderStep: 1,
      sliderDefault: 0,
      draw: function (step, sliderValue) {
        clear();
        switch (step) {
          case 0: drawStep0(sliderValue); break;
          case 1: drawStep1(); break;
          case 2: drawStep2(sliderValue); break;
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

  registerAnimationBatch([45, 46, 47], factory);
})();
