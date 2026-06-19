(function () {
  'use strict';

  var INDIGO = '#4f46e5', LIGHT_INDIGO = '#6366f1', GREEN = '#10b981';
  var RED = '#ef4444', AMBER = '#f59e0b', GRAY_BG = '#f9fafb';
  var GRAY_BORDER = '#d1d5db', TEXT_COLOR = '#374151';

  var stepDescriptions = [
    '<b>JPEG压缩流程</b>：原始8x8像素块，展示RGB三通道灰度值矩阵',
    '<b>颜色空间转换</b>：RGB→YCbCr，<code>Y = 0.299R + 0.587G + 0.114B</code>，分离亮度与色度',
    '<b>离散余弦变换(DCT)</b>：空间域→频率域，<code>F(u,v) = ΣΣ f(x,y)cos(...)cos(...)</code>，得到频率系数矩阵',
    '<b>量化</b>：系数除以量化表并取整，<code>Fq(u,v) = round(F(u,v) / Q(u,v))</code>，高频系数大量归零',
    '<b>Zigzag扫描</b>：沿对角线Z字形重排64个系数为一维序列，低频在前、高频在后',
    '<b>游程+霍夫曼编码</b>：对Zigzag序列进行RLE压缩连续零，再用霍夫曼编码输出最终比特流'
  ];

  var pixelBlock = [
    [120, 122, 125, 128, 130, 132, 135, 138],
    [118, 120, 123, 126, 129, 131, 134, 137],
    [115, 118, 121, 124, 127, 130, 133, 136],
    [112, 115, 118, 122, 125, 128, 131, 134],
    [110, 113, 116, 120, 123, 126, 129, 132],
    [108, 111, 114, 118, 121, 124, 127, 130],
    [106, 109, 112, 116, 119, 122, 125, 128],
    [104, 107, 110, 114, 117, 120, 123, 126]
  ];

  var dctBlock = [
    [892, -12,  8, -3,  1,  0,  0,  0],
    [-18,   5, -2,  1,  0,  0,  0,  0],
    [  9,  -3,  1,  0,  0,  0,  0,  0],
    [ -4,   1,  0,  0,  0,  0,  0,  0],
    [  2,   0,  0,  0,  0,  0,  0,  0],
    [ -1,   0,  0,  0,  0,  0,  0,  0],
    [  0,   0,  0,  0,  0,  0,  0,  0],
    [  0,   0,  0,  0,  0,  0,  0,  0]
  ];

  var quantTable = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68,109,103, 77],
    [24, 35, 55, 64, 81,104,113, 92],
    [49, 64, 78, 87,103,121,120,101],
    [72, 92, 95, 98,112,100,103, 99]
  ];

  var quantizedBlock = [
    [56, -1,  1,  0,  0,  0,  0,  0],
    [-2,  0,  0,  0,  0,  0,  0,  0],
    [ 1,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
  ];

  var zigzagOrder = [
    [0,0],[0,1],[1,0],[2,0],[1,1],[0,2],[0,3],[1,2],
    [2,1],[3,0],[4,0],[3,1],[2,2],[1,3],[0,4],[0,5],
    [1,4],[2,3],[3,2],[4,1],[5,0],[6,0],[5,1],[4,2],
    [3,3],[2,4],[1,5],[0,6],[0,7],[1,6],[2,5],[3,4],
    [4,3],[5,2],[6,1],[7,0],[7,1],[6,2],[5,3],[4,4],
    [3,5],[2,6],[1,7],[2,7],[3,6],[4,5],[5,4],[6,3],
    [7,2],[7,3],[6,4],[5,5],[4,6],[3,7],[4,7],[5,6],
    [6,5],[7,4],[7,5],[6,6],[5,7],[6,7],[7,6],[7,7]
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

    function drawMatrix(matrix, x, y, cellW, cellH, colorFn) {
      for (var r = 0; r < matrix.length; r++) {
        for (var c = 0; c < matrix[r].length; c++) {
          var val = matrix[r][c];
          ctx.fillStyle = colorFn ? colorFn(val) : GRAY_BG;
          ctx.fillRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + c * cellW, y + r * cellH, cellW, cellH);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + val, x + c * cellW + cellW / 2, y + r * cellH + cellH / 2);
        }
      }
    }

    function drawStep0() {
      drawTitle('JPEG压缩第一步：原始8×8像素块');
      drawStepLabel(0, 6);

      var cellW = 32, cellH = 28;
      var mx = 40, my = 50;

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('原始图像 8×8 块（灰度值 0~255）', mx, my - 15);

      drawMatrix(pixelBlock, mx, my, cellW, cellH, function(v) {
        var g = Math.round(v);
        return 'rgb(' + g + ',' + g + ',' + g + ')';
      });

      // Info box
      var bx = 340, by = 50;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 330, 300);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 330, 300);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('JPEG压缩概述', bx + 15, by + 20);

      ctx.font = '12px sans-serif';
      ctx.fillText('JPEG是一种有损图像压缩标准，主要步骤：', bx + 15, by + 50);
      ctx.fillText('1. 颜色空间转换 RGB → YCbCr', bx + 25, by + 80);
      ctx.fillText('2. 8×8 块离散余弦变换 (DCT)', bx + 25, by + 105);
      ctx.fillText('3. 量化（去除人眼不敏感的高频分量）', bx + 25, by + 130);
      ctx.fillText('4. Zigzag 扫描重排', bx + 25, by + 155);
      ctx.fillText('5. 游程编码 + 霍夫曼编码', bx + 25, by + 180);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('当前展示：', bx + 15, by + 220);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('一个 8×8 像素块的灰度值矩阵', bx + 15, by + 245);
      ctx.fillText('像素值范围：104 ~ 138', bx + 15, by + 270);
    }

    function drawStep1() {
      drawTitle('颜色空间转换：RGB → YCbCr');
      drawStepLabel(1, 6);

      // Formulas
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      var fx = 30, fy = 48;
      ctx.fillText('Y  =  0.299R + 0.587G + 0.114B', fx, fy);
      ctx.fillText('Cb = -0.169R - 0.331G + 0.500B + 128', fx, fy + 22);
      ctx.fillText('Cr =  0.500R - 0.419G - 0.081B + 128', fx, fy + 44);

      // Sample conversion
      var sampleR = 120, sampleG = 122, sampleB = 125;
      var sampleY = Math.round(0.299 * sampleR + 0.587 * sampleG + 0.114 * sampleB);
      var sampleCb = Math.round(-0.169 * sampleR - 0.331 * sampleG + 0.500 * sampleB + 128);
      var sampleCr = Math.round(0.500 * sampleR - 0.419 * sampleG - 0.081 * sampleB + 128);

      var bx = 30, by = 140;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 300, 120);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 300, 120);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('示例像素 (R,G,B) = (' + sampleR + ',' + sampleG + ',' + sampleB + ')', bx + 10, by + 20);

      ctx.font = '12px monospace';
      ctx.fillStyle = INDIGO;
      ctx.fillText('Y  = ' + sampleY, bx + 20, by + 50);
      ctx.fillStyle = GREEN;
      ctx.fillText('Cb = ' + sampleCb, bx + 20, by + 72);
      ctx.fillStyle = RED;
      ctx.fillText('Cr = ' + sampleCr, bx + 20, by + 94);

      // YCbCr block
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Y通道（亮度）8×8块：', 360, 48);

      var cellW = 32, cellH = 28;
      var mx = 360, my = 68;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var rv = pixelBlock[r][c];
          var gv = Math.min(255, rv + 2);
          var bv = Math.min(255, rv + 5);
          var yv = Math.round(0.299 * rv + 0.587 * gv + 0.114 * bv);
          ctx.fillStyle = 'rgb(' + yv + ',' + yv + ',' + yv + ')';
          ctx.fillRect(mx + c * cellW, my + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(mx + c * cellW, my + r * cellH, cellW, cellH);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + yv, mx + c * cellW + cellW / 2, my + r * cellH + cellH / 2);
        }
      }

      // Explanation
      var ex = 360, ey = 310;
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('为什么转换？', ex, ey);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('人眼对亮度Y敏感，对色度Cb/Cr不敏感', ex, ey + 20);
      ctx.fillText('可对Cb/Cr进行下采样以压缩数据量', ex, ey + 40);
    }

    function drawStep2() {
      drawTitle('离散余弦变换 (DCT)：空间域 → 频率域');
      drawStepLabel(2, 6);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('F(u,v) = C(u)C(v)/4 * ΣΣ f(x,y) * cos((2x+1)uπ/16) * cos((2y+1)vπ/16)', 30, 45);

      // DCT matrix
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DCT系数矩阵：', 30, 70);

      var cellW = 36, cellH = 30;
      var mx = 30, my = 88;
      drawMatrix(dctBlock, mx, my, cellW, cellH, function(v) {
        if (v === 0) return GRAY_BG;
        var abs = Math.abs(v);
        var intensity = Math.min(255, abs * 3);
        if (v > 0) return 'rgb(200,220,' + Math.max(0, 255 - intensity) + ')';
        return 'rgb(' + Math.min(255, 200 + intensity) + ',200,200)';
      });

      // Highlight DC coefficient
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, cellW, cellH);
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← DC系数(平均值)', mx + cellW + 5, my + cellH / 2);

      // AC explanation
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(mx + 4 * cellW, my + 4 * cellH, 4 * cellW, 4 * cellH);
      ctx.setLineDash([]);
      ctx.fillStyle = RED;
      ctx.font = '10px sans-serif';
      ctx.fillText('高频区域 → 值接近0', mx + 4 * cellW + 5, my + 4 * cellH - 5);

      // Right panel
      var bx = 350, by = 88;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 320, 280);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 320, 280);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DCT变换特点', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('• 左上角(0,0)为DC系数，代表块平均值', bx + 15, by + 55);
      ctx.fillText('• 其余为AC系数，代表不同频率分量', bx + 15, by + 80);
      ctx.fillText('• 能量集中在左上角（低频区域）', bx + 15, by + 105);
      ctx.fillText('• 右下角为高频细节，人眼不敏感', bx + 15, by + 130);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('关键性质：', bx + 15, by + 170);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText('DCT将空间信息转换为频率信息，', bx + 15, by + 195);
      ctx.fillText('使得后续量化可以有针对性地丢弃', bx + 15, by + 220);
      ctx.fillText('不重要的高频分量。', bx + 15, by + 245);
    }

    function drawStep3() {
      drawTitle('量化：系数 ÷ 量化表 → 取整');
      drawStepLabel(3, 6);

      // Quantization table (small)
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('量化表 Q：', 20, 45);

      var cellW = 28, cellH = 24;
      var mx = 20, my = 62;
      drawMatrix(quantTable, mx, my, cellW, cellH, function(v) {
        var ratio = v / 121;
        return 'rgb(' + Math.round(255 - ratio * 100) + ',' + Math.round(255 - ratio * 80) + ',255)';
      });

      // Arrow
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', 260, 160);

      // Quantized result
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('量化结果 Fq = round(F/Q)：', 285, 45);

      drawMatrix(quantizedBlock, 285, 62, cellW, cellH, function(v) {
        if (v === 0) return '#f3f4f6';
        return '#dbeafe';
      });

      // Stats
      var zeroCount = 0;
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          if (quantizedBlock[r][c] === 0) zeroCount++;
        }
      }

      var bx = 540, by = 62;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 150, 200);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 150, 200);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('量化统计', bx + 10, by + 20);
      ctx.font = '11px sans-serif';
      ctx.fillText('总系数：64', bx + 10, by + 50);
      ctx.fillStyle = GREEN;
      ctx.fillText('零系数：' + zeroCount, bx + 10, by + 75);
      ctx.fillStyle = RED;
      ctx.fillText('非零系数：' + (64 - zeroCount), bx + 10, by + 100);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('压缩比：' + ((64 - zeroCount) / 64 * 100).toFixed(0) + '%', bx + 10, by + 125);

      // Explanation
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('量化是JPEG有损压缩的核心步骤', 20, 310);
      ctx.fillText('高频区域的量化步长更大，导致更多系数变为零', 20, 330);
      ctx.fillText('大量零系数便于后续的游程编码压缩', 20, 350);
    }

    function drawStep4() {
      drawTitle('Zigzag扫描：8×8矩阵 → 一维序列');
      drawStepLabel(4, 6);

      // Show zigzag path on matrix
      var cellW = 32, cellH = 28;
      var mx = 30, my = 55;

      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var val = quantizedBlock[r][c];
          ctx.fillStyle = val === 0 ? '#f3f4f6' : '#dbeafe';
          ctx.fillRect(mx + c * cellW, my + r * cellH, cellW, cellH);
          ctx.strokeStyle = GRAY_BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(mx + c * cellW, my + r * cellH, cellW, cellH);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('' + val, mx + c * cellW + cellW / 2, my + r * cellH + cellH / 2);
        }
      }

      // Draw zigzag path
      ctx.strokeStyle = INDIGO;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var i = 0; i < zigzagOrder.length; i++) {
        var pr = zigzagOrder[i][0], pc = zigzagOrder[i][1];
        var px = mx + pc * cellW + cellW / 2;
        var py = my + pr * cellH + cellH / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Zigzag sequence output
      var seq = [];
      for (var i = 0; i < zigzagOrder.length; i++) {
        var pr = zigzagOrder[i][0], pc = zigzagOrder[i][1];
        seq.push(quantizedBlock[pr][pc]);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Zigzag一维序列（前20个系数）：', 320, 55);

      ctx.font = '11px monospace';
      var line1 = seq.slice(0, 10).join(', ');
      var line2 = seq.slice(10, 20).join(', ');
      ctx.fillText(line1, 320, 80);
      ctx.fillText(line2, 320, 100);

      // Highlight non-zero vs zero
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('非零系数（低频）：', 320, 140);
      var nonZero = [];
      for (var i = 0; i < seq.length; i++) {
        if (seq[i] !== 0) nonZero.push(seq[i]);
      }
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      ctx.fillText(nonZero.join(', '), 320, 165);

      ctx.fillStyle = RED;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('连续零（高频）：', 320, 200);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('大量连续的0 → 适合游程编码(RLE)', 320, 225);

      // Explanation box
      var bx = 320, by = 260;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 360, 100);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.strokeRect(bx, by, 360, 100);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Zigzag扫描原理', bx + 10, by + 20);
      ctx.font = '11px sans-serif';
      ctx.fillText('沿对角线方向交替扫描，将二维矩阵转为一维序列', bx + 10, by + 45);
      ctx.fillText('低频系数排在前面，高频系数排在后面', bx + 10, by + 65);
      ctx.fillText('量化后的高频零系数形成连续零串', bx + 10, by + 85);
    }

    function drawStep5() {
      drawTitle('游程编码(RLE) + 霍夫曼编码');
      drawStepLabel(5, 6);

      // Zigzag sequence
      var seq = [];
      for (var i = 0; i < zigzagOrder.length; i++) {
        var pr = zigzagOrder[i][0], pc = zigzagOrder[i][1];
        seq.push(quantizedBlock[pr][pc]);
      }

      // RLE encoding
      var rle = [];
      var zeroRun = 0;
      for (var i = 0; i < seq.length; i++) {
        if (seq[i] === 0) {
          zeroRun++;
        } else {
          if (zeroRun > 0 || i === 0) rle.push({zeros: zeroRun, value: seq[i]});
          else rle.push({zeros: 0, value: seq[i]});
          zeroRun = 0;
        }
      }
      if (zeroRun > 0) rle.push({zeros: zeroRun, value: 'EOB'});

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('游程编码 (RLE) 结果：', 20, 48);

      ctx.font = '11px monospace';
      var rleY = 70;
      for (var i = 0; i < rle.length && i < 8; i++) {
        var item = rle[i];
        var text = '(' + item.zeros + ', ' + item.value + ')';
        ctx.fillStyle = i % 2 === 0 ? INDIGO : LIGHT_INDIGO;
        ctx.fillText(text, 20 + (i % 4) * 120, rleY + Math.floor(i / 4) * 25);
      }

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px sans-serif';
      ctx.fillText('格式：(前面零的个数, 非零值)   EOB = 块结束符', 20, 140);

      // Huffman encoding
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('霍夫曼编码表（部分）：', 20, 180);

      var huffTable = [
        {sym: 'DC=56', code: '00'},
        {sym: '(0,-1)', code: '100'},
        {sym: '(0,1)', code: '101'},
        {sym: '(1,-2)', code: '11010'},
        {sym: 'EOB', code: '1010'}
      ];

      var ty = 205;
      for (var i = 0; i < huffTable.length; i++) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '11px monospace';
        ctx.fillText(huffTable[i].sym + ' → ' + huffTable[i].code, 30, ty + i * 20);
      }

      // Final output
      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('最终压缩比特流：', 20, 330);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '11px monospace';
      ctx.fillText('00 101 11010 100 ... 1010', 20, 355);

      // Compression summary box
      var bx = 400, by = 180;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 280, 190);
      ctx.strokeStyle = GRAY_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 280, 190);

      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('压缩效果总结', bx + 15, by + 25);

      ctx.font = '12px sans-serif';
      ctx.fillText('原始数据：64 × 8 = 512 bits', bx + 15, by + 55);
      ctx.fillText('DCT后：  64 个系数', bx + 15, by + 80);
      ctx.fillStyle = GREEN;
      ctx.fillText('量化后：  仅 ' + (64 - 59) + ' 个非零系数', bx + 15, by + 105);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('编码后：  ~40 bits', bx + 15, by + 130);

      ctx.fillStyle = INDIGO;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('压缩比 ≈ 12:1', bx + 15, by + 165);
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

  registerAnimation(59, factory);
})();
