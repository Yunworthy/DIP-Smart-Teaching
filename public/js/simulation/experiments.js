/**
 * experiments.js - 图像处理实验配置
 * 共65个实验，分12章，涵盖数字图像处理完整知识体系
 * 导出: window.ExperimentConfig
 */

/* ========== 频域辅助函数 ========== */
function _fft1d(re, im, inverse) {
  const n = re.length;
  if (n <= 1) return;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = 2 * Math.PI / len * (inverse ? -1 : 1);
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const tRe = curRe * re[i + j + len / 2] - curIm * im[i + j + len / 2];
        const tIm = curRe * im[i + j + len / 2] + curIm * re[i + j + len / 2];
        re[i + j + len / 2] = re[i + j] - tRe;
        im[i + j + len / 2] = im[i + j] - tIm;
        re[i + j] += tRe;
        im[i + j] += tIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
}

function _fft2d(imageData) {
  const w = imageData.width, h = imageData.height;
  const pw = Math.pow(2, Math.ceil(Math.log2(w)));
  const ph = Math.pow(2, Math.ceil(Math.log2(h)));
  const canvas = document.createElement('canvas');
  canvas.width = pw; canvas.height = ph;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  const padded = ctx.getImageData(0, 0, pw, ph);
  const gray = ImageEngine.grayscale(padded);
  const d = gray.data;
  const N = pw * ph;
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) { re[i] = d[i * 4]; im[i] = 0; }
  const rowRe = new Float64Array(pw), rowIm = new Float64Array(pw);
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) { rowRe[x] = re[y * pw + x]; rowIm[x] = im[y * pw + x]; }
    _fft1d(rowRe, rowIm, false);
    for (let x = 0; x < pw; x++) { re[y * pw + x] = rowRe[x]; im[y * pw + x] = rowIm[x]; }
  }
  const colRe = new Float64Array(ph), colIm = new Float64Array(ph);
  for (let x = 0; x < pw; x++) {
    for (let y = 0; y < ph; y++) { colRe[y] = re[y * pw + x]; colIm[y] = im[y * pw + x]; }
    _fft1d(colRe, colIm, false);
    for (let y = 0; y < ph; y++) { re[y * pw + x] = colRe[y]; im[y * pw + x] = colIm[y]; }
  }
  return { re, im, width: pw, height: ph, origW: w, origH: h };
}

function _ifft2d(freq) {
  const { re, im, width: w, height: h, origW, origH } = freq;
  const N = w * h;
  const rowRe = new Float64Array(w), rowIm = new Float64Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) { rowRe[x] = re[y * w + x]; rowIm[x] = im[y * w + x]; }
    _fft1d(rowRe, rowIm, true);
    for (let x = 0; x < w; x++) { re[y * w + x] = rowRe[x]; im[y * w + x] = rowIm[x]; }
  }
  const colRe = new Float64Array(h), colIm = new Float64Array(h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) { colRe[y] = re[y * w + x]; colIm[y] = im[y * w + x]; }
    _fft1d(colRe, colIm, true);
    for (let y = 0; y < h; y++) { re[y * w + x] = colRe[y]; im[y * w + x] = colIm[y]; }
  }
  const ow = origW || w, oh = origH || h;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < N; i++) {
    const v = Math.round(Math.max(0, Math.min(255, re[i] / N)));
    out.data[i * 4] = v; out.data[i * 4 + 1] = v; out.data[i * 4 + 2] = v; out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = ow; cropCanvas.height = oh;
  cropCanvas.getContext('2d').drawImage(canvas, 0, 0, ow, oh, 0, 0, ow, oh);
  return cropCanvas.getContext('2d').getImageData(0, 0, ow, oh);
}

function _fftFilter(imageData, filterFn) {
  const freq = _fft2d(imageData);
  filterFn(freq);
  return _ifft2d(freq);
}

function _spectrumImage(freq) {
  const { re, im, width: w, height: h } = freq;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const out = ctx.createImageData(w, h);
  let maxVal = 0;
  const mag = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mag[i] = Math.log(1 + Math.sqrt(re[i] * re[i] + im[i] * im[i]));
    if (mag[i] > maxVal) maxVal = mag[i];
  }
  for (let i = 0; i < w * h; i++) {
    const v = Math.round((mag[i] / maxVal) * 255);
    out.data[i * 4] = v; out.data[i * 4 + 1] = v; out.data[i * 4 + 2] = v; out.data[i * 4 + 3] = 255;
  }
  return out;
}

window.ExperimentConfig = {


  /* ============================
   * 第1章 图像处理基础 (6个实验)
   * ============================ */

  'gray': {
    title: '图像灰度化',
    description: '将彩色RGB图像转换为灰度图像，理解加权平均法的原理与实现',
    categoryName: '基础',
    category: 'basic',
    chapter: 1,
    sample: 'rice.bmp',
    caseText: '在图像分析中，彩色信息往往不是必需的。灰度化是几乎所有后续处理的第一步——它将三维的RGB空间压缩为一维亮度值，大幅降低计算复杂度，同时保留图像的主要视觉特征。',
    principle: '加权平均灰度化公式: Gray = 0.299*R + 0.587*G + 0.114*B。该权重来源于NTSC标准，反映了人眼对绿色最敏感、对蓝色最不敏感的生理特性。简单平均法 Gray=(R+G+B)/3 会导致图像偏暗。',
    controls: [],
    run(imageData) {
      return ImageEngine.grayscale(imageData);
    }
  },

  'channel-split': {
    title: '通道分离与观察',
    description: '将RGB图像分离为红、绿、蓝三个单通道，观察各通道亮度差异',
    categoryName: '基础',
    category: 'basic',
    chapter: 1,
    sample: 'red-date-defect.jpg',
    caseText: '在红枣缺陷检测中，缺陷区域可能在红色通道中表现明显而在蓝色通道中不明显。通道分离帮助分析哪些通道对目标检测最有用，为后续选择性处理提供依据。',
    principle: 'RGB图像由三个矩阵叠加而成: I(x,y) = [R(x,y), G(x,y), B(x,y)]。通道分离就是分别提取这三个矩阵。不同物体在不同波段的反射率不同，因此各通道的对比度存在差异。',
    controls: [
      { key: 'channel', label: '显示通道', type: 'select', options: ['红色', '绿色', '蓝色'], default: '红色' }
    ],
    run(imageData, { channel = '红色' } = {}) {
      const map = { '红色': 'red', '绿色': 'green', '蓝色': 'blue' };
      return ImageEngine.colorChannel(imageData, map[channel] || 'red');
    }
  },

  'resize': {
    title: '图像缩放',
    description: '使用最近邻插值对图像进行放大或缩小，观察分辨率变化对图像质量的影响',
    categoryName: '基础',
    category: 'basic',
    chapter: 3,
    sample: 'rice.bmp',
    caseText: '在移动端部署图像识别时，输入图像需要缩放到模型要求的尺寸。不同的缩放算法（最近邻、双线性、双三次）在速度与质量之间取得不同的平衡。',
    principle: '最近邻插值: dst(x,y) = src(round(x/sx), round(y/sy))，其中 sx=dstW/srcW, sy=dstH/srcH。该方法速度快但会产生锯齿。双线性插值使用周围4个像素的加权平均，效果更平滑。',
    controls: [
      { key: 'scale', label: '缩放比例', type: 'range', min: 0.25, max: 2.0, step: 0.25, default: 0.5 }
    ],
    run(imageData, { scale = 0.5 } = {}) {
      const w = imageData.width, h = imageData.height;
      const nw = Math.round(w * scale), nh = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = nw; canvas.height = nh;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = w; tmpCanvas.height = h;
      tmpCanvas.getContext('2d').putImageData(imageData, 0, 0);
      ctx.drawImage(tmpCanvas, 0, 0, nw, nh);
      return ctx.getImageData(0, 0, nw, nh);
    }
  },

  'crop': {
    title: '图像裁剪',
    description: '从图像中裁剪指定区域，理解图像坐标系与ROI(感兴趣区域)概念',
    categoryName: '基础',
    category: 'basic',
    chapter: 3,
    sample: 'dehaze-sweden.jpg',
    caseText: '在遥感图像分析中，往往只需要处理图像中的特定区域。裁剪操作提取ROI(Region of Interest)，减少不必要的计算，同时避免无关区域对处理算法的干扰。',
    principle: '裁剪即从原图像矩阵中提取子矩阵: ROI = I[y:y+h, x:x+w]。需注意边界检查，确保裁剪区域不超出原图尺寸。图像坐标系以左上角为原点(0,0)，x向右、y向下。',
    controls: [
      { key: 'x', label: '起点X(%)', type: 'range', min: 0, max: 80, step: 5, default: 10 },
      { key: 'y', label: '起点Y(%)', type: 'range', min: 0, max: 80, step: 5, default: 10 },
      { key: 'w', label: '宽度(%)', type: 'range', min: 10, max: 100, step: 5, default: 50 },
      { key: 'h', label: '高度(%)', type: 'range', min: 10, max: 100, step: 5, default: 50 }
    ],
    run(imageData, { x = 10, y = 10, w = 50, h = 50 } = {}) {
      const iw = imageData.width, ih = imageData.height;
      const sx = Math.round(iw * x / 100), sy = Math.round(ih * y / 100);
      const sw = Math.round(iw * w / 100), sh = Math.round(ih * h / 100);
      const ex = Math.min(sx + sw, iw), ey = Math.min(sy + sh, ih);
      const cw = ex - sx, ch = ey - sy;
      const canvas = document.createElement('canvas');
      canvas.width = iw; canvas.height = ih;
      canvas.getContext('2d').putImageData(imageData, 0, 0);
      const outCanvas = document.createElement('canvas');
      outCanvas.width = cw; outCanvas.height = ch;
      outCanvas.getContext('2d').drawImage(canvas, sx, sy, cw, ch, 0, 0, cw, ch);
      return outCanvas.getContext('2d').getImageData(0, 0, cw, ch);
    }
  },

  'histogram': {
    title: '直方图计算与显示',
    description: '统计灰度图像各灰度级的像素数量，绘制灰度直方图',
    categoryName: '基础',
    category: 'basic',
    chapter: 4,
    sample: 'rice.bmp',
    caseText: '直方图是图像灰度分布的统计描述，是图像增强、阈值选取等处理的重要依据。通过观察直方图的峰谷分布，可以判断图像的对比度、亮度以及是否存在明显的目标-背景分离。',
    principle: '灰度直方图 H(k) = count{I(x,y) = k}, k=0,1,...,255。归一化直方图 p(k) = H(k)/N，可视为灰度的概率密度函数。直方图的均值反映图像亮度，方差反映对比度。',
    controls: [],
    run(imageData) {
      const gray = ImageEngine.grayscale(imageData);
      const d = gray.data;
      const hist = new Array(256).fill(0);
      for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
      const outW = 256, outH = 200;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, outW, outH);
      const maxH = Math.max(...hist);
      ctx.fillStyle = '#00d2ff';
      for (let k = 0; k < 256; k++) {
        const barH = Math.round((hist[k] / maxH) * (outH - 10));
        ctx.fillRect(k, outH - barH, 1, barH);
      }
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'noise': {
    title: '噪声添加与观察',
    description: '向图像添加高斯噪声和椒盐噪声，观察不同噪声类型对图像的影响',
    categoryName: '基础',
    category: 'basic',
    chapter: 1,
    sample: 'rice.bmp',
    caseText: '实际采集的图像不可避免地受到噪声污染。理解噪声的统计特性是设计有效去噪算法的前提。高斯噪声模拟传感器热噪声，椒盐噪声模拟传输误码和传感器坏点。',
    principle: '高斯噪声: I_new(x,y) = I(x,y) + n, n~N(0,sigma^2)。椒盐噪声: 以概率p将像素设为0(椒)或255(盐)。高斯噪声使图像整体模糊，椒盐噪声产生随机黑白亮点。',
    controls: [
      { key: 'type', label: '噪声类型', type: 'select', options: ['高斯噪声', '椒盐噪声'], default: '高斯噪声' },
      { key: 'intensity', label: '强度', type: 'range', min: 5, max: 50, step: 5, default: 20 }
    ],
    run(imageData, { type = '高斯噪声', intensity = 20 } = {}) {
      const out = ImageEngine.cloneImageData(imageData);
      const d = out.data;
      const len = d.length / 4;
      if (type === '椒盐噪声') {
        const prob = intensity / 1000;
        for (let i = 0; i < len; i++) {
          if (Math.random() < prob) {
            const v = Math.random() < 0.5 ? 0 : 255;
            d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v;
          }
        }
      } else {
        const sigma = intensity * 1.5;
        for (let i = 0; i < len; i++) {
          const n = sigma * (Math.random() + Math.random() + Math.random() - 1.5) * 0.816;
          d[i * 4] = ImageEngine.clamp(d[i * 4] + n);
          d[i * 4 + 1] = ImageEngine.clamp(d[i * 4 + 1] + n);
          d[i * 4 + 2] = ImageEngine.clamp(d[i * 4 + 2] + n);
        }
      }
      return out;
    }
  },


  /* ============================
   * 第2章 图像变换 (5个实验)
   * ============================ */

  'translate': {
    title: '图像平移',
    description: '对图像进行水平和垂直方向的平移变换，理解仿射变换基础',
    categoryName: '基础',
    category: 'basic',
    chapter: 2,
    sample: 'rice.bmp',
    caseText: '图像平移是最基本的几何变换，在图像配准、运动补偿等应用中广泛使用。平移操作将图像中每个像素按相同的方向和距离移动。',
    principle: '平移变换: x_new = x + tx, y_new = y + ty。用齐次坐标矩阵表示: [x_new, y_new, 1] = [x, y, 1] * [[1,0,0],[0,1,0],[tx,ty,1]]。平移后空出的区域通常填充黑色(0)或镜像复制。',
    controls: [
      { key: 'tx', label: '水平偏移(%)', type: 'range', min: -50, max: 50, step: 5, default: 20 },
      { key: 'ty', label: '垂直偏移(%)', type: 'range', min: -50, max: 50, step: 5, default: 10 }
    ],
    run(imageData, { tx = 20, ty = 10 } = {}) {
      const w = imageData.width, h = imageData.height;
      const dx = Math.round(w * tx / 100), dy = Math.round(h * ty / 100);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'black'; ctx.fillRect(0, 0, w, h);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = w; tmpCanvas.height = h;
      tmpCanvas.getContext('2d').putImageData(imageData, 0, 0);
      ctx.drawImage(tmpCanvas, dx, dy);
      return ctx.getContext('2d').getImageData(0, 0, w, h);
    }
  },

  'rotate': {
    title: '图像旋转',
    description: '围绕图像中心进行旋转变换，理解旋转矩阵与插值方法',
    categoryName: '基础',
    category: 'basic',
    chapter: 2,
    sample: 'rice.bmp',
    caseText: '在文档扫描校正和遥感图像配准中，旋转是常见操作。旋转后的像素坐标通常为浮点数，需要通过插值确定新像素值。',
    principle: '旋转变换(绕中心): x_new = cx + (x-cx)*cos(theta) - (y-cy)*sin(theta), y_new = cy + (x-cx)*sin(theta) + (y-cy)*cos(theta)。反向映射+双线性插值可避免空洞问题。',
    controls: [
      { key: 'angle', label: '旋转角度', type: 'range', min: 0, max: 360, step: 15, default: 45 }
    ],
    run(imageData, { angle = 45 } = {}) {
      const w = imageData.width, h = imageData.height;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'black'; ctx.fillRect(0, 0, w, h);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = w; tmpCanvas.height = h;
      tmpCanvas.getContext('2d').putImageData(imageData, 0, 0);
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.drawImage(tmpCanvas, -w / 2, -h / 2);
      return ctx.getImageData(0, 0, w, h);
    }
  },

  'flip': {
    title: '图像翻转',
    description: '对图像进行水平翻转和垂直翻转，理解镜像变换',
    categoryName: '基础',
    category: 'basic',
    chapter: 2,
    sample: 'dehaze-sweden.jpg',
    caseText: '在数据增强中，图像翻转是扩充训练样本的常用手段。水平翻转不改变图像内容含义（如人脸），但垂直翻转在大多数自然场景中不适用。',
    principle: '水平翻转: dst(x,y) = src(w-1-x, y)。垂直翻转: dst(x,y) = src(x, h-1-y)。翻转矩阵行列式det=-1，是等距变换中的反射变换，保持面积但改变手性。',
    controls: [
      { key: 'direction', label: '翻转方向', type: 'select', options: ['水平翻转', '垂直翻转', '水平+垂直'], default: '水平翻转' }
    ],
    run(imageData, { direction = '水平翻转' } = {}) {
      const w = imageData.width, h = imageData.height;
      const out = ImageEngine.cloneImageData(imageData);
      const d = imageData.data, o = out.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sx = x, sy = y;
          if (direction === '水平翻转' || direction === '水平+垂直') sx = w - 1 - x;
          if (direction === '垂直翻转' || direction === '水平+垂直') sy = h - 1 - y;
          const si = (sy * w + sx) * 4, di = (y * w + x) * 4;
          o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = 255;
        }
      }
      return out;
    }
  },

  'affine': {
    title: '仿射变换',
    description: '对图像进行错切(剪切)变换，理解一般仿射变换的矩阵表示',
    categoryName: '设计',
    category: 'design',
    chapter: 2,
    sample: 'rice.bmp',
    caseText: '仿射变换是图像处理中最常用的几何变换类型，它保持直线的"直线性"和平行线的"平行性"。在图像校正、透视变换预处理等场景中广泛使用。',
    principle: '仿射变换: [x_new, y_new] = [x, y] * A + [tx, ty]，其中A为2x2变换矩阵。当A=[[1,shy],[shx,1]]时为错切变换。仿射变换可由3组对应点唯一确定(6个未知数，6个方程)。',
    controls: [
      { key: 'shx', label: '水平错切', type: 'range', min: -0.5, max: 0.5, step: 0.05, default: 0.2 },
      { key: 'shy', label: '垂直错切', type: 'range', min: -0.5, max: 0.5, step: 0.05, default: 0.0 }
    ],
    run(imageData, { shx = 0.2, shy = 0.0 } = {}) {
      const w = imageData.width, h = imageData.height;
      const out = ImageEngine.cloneImageData(imageData);
      const d = imageData.data, o = out.data;
      o.fill(0);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const sx = Math.round(x + y * shx), sy = Math.round(y + x * shy);
          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const si = (sy * w + sx) * 4, di = (y * w + x) * 4;
            o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = 255;
          }
        }
      }
      return out;
    }
  },

  'projection': {
    title: '投影变换',
    description: '对图像进行透视投影变换，理解单应性矩阵与四点映射',
    categoryName: '设计',
    category: 'design',
    chapter: 2,
    sample: 'logs.jpg',
    caseText: '在文档扫描应用中，拍摄的文档往往是透视畸变的。通过检测文档四个角点并计算单应性矩阵，可以将畸变的文档校正为正面平视的效果。',
    principle: '投影变换: [wx_new, wy_new, w] = [x, y, 1] * H，其中H为3x3单应性矩阵。相比仿射变换(6自由度)，投影变换有8个自由度，可以处理透视畸变。四组对应点可唯一确定H。',
    controls: [
      { key: 'perspective', label: '透视强度', type: 'range', min: 0, max: 50, step: 5, default: 20 }
    ],
    run(imageData, { perspective = 20 } = {}) {
      const w = imageData.width, h = imageData.height;
      const out = ImageEngine.cloneImageData(imageData);
      const d = imageData.data, o = out.data;
      o.fill(0);
      const k = perspective / 100;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = (x - w / 2) / w, ny = (y - h / 2) / h;
          const denom = 1 + k * ny;
          if (denom <= 0) continue;
          const sx = Math.round((nx / denom + 0.5) * w);
          const sy = Math.round((ny / denom + 0.5) * h);
          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const si = (sy * w + sx) * 4, di = (y * w + x) * 4;
            o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = 255;
          }
        }
      }
      return out;
    }
  },


  /* ============================
   * 第3章 灰度变换 (5个实验)
   * ============================ */

  'invert': {
    title: '图像反色',
    description: '对灰度图像进行反色处理(负片效果)，理解线性灰度变换',
    categoryName: '基础',
    category: 'basic',
    chapter: 3,
    sample: 'rice.bmp',
    caseText: '反色变换在医学影像中常用于"底片"显示——某些细节在反色后更容易被观察到。反色也是许多图像特效的基础操作。',
    principle: '反色变换: s = (L-1) - r，其中r为输入灰度，s为输出灰度，L为灰度级数(通常256)。这是最简单的线性灰度变换，直方图关于中心对称翻转。',
    controls: [],
    run(imageData) {
      return ImageEngine.pointTransform(imageData, v => 255 - v);
    }
  },

  'gamma': {
    title: '伽马校正',
    description: '通过幂律变换调整图像亮度，理解非线性灰度映射',
    categoryName: '基础',
    category: 'basic',
    chapter: 4,
    sample: 'dehaze-sweden.jpg',
    caseText: '相机传感器的响应通常是非线性的，伽马校正用于补偿这种非线性。gamma<1时提亮暗部细节(如夜景增强)，gamma>1时压缩亮部(如高光抑制)。',
    principle: '幂律变换: s = c * r^gamma，其中c为常数，gamma为校正参数。gamma<1扩展暗部灰度级(暗区变亮)，gamma>1扩展亮部灰度级(亮区变暗)。显示器的gamma通常约为2.2。',
    controls: [
      { key: 'gamma', label: 'Gamma值', type: 'range', min: 0.1, max: 3.0, step: 0.1, default: 0.5 }
    ],
    run(imageData, { gamma: g = 0.5 } = {}) {
      return ImageEngine.pointTransform(imageData, v => {
        const norm = v / 255;
        return Math.round(Math.pow(norm, g) * 255);
      });
    }
  },

  'contrast-stretch': {
    title: '对比度拉伸',
    description: '通过分段线性变换扩展图像的灰度范围，增强对比度',
    categoryName: '基础',
    category: 'basic',
    chapter: 4,
    sample: 'weld.jpg',
    caseText: '焊缝图像的灰度范围往往较窄，对比度拉伸可以将灰度值映射到完整的[0,255]范围，使焊缝细节更加清晰可见。',
    principle: '线性拉伸: s = (r - rmin) / (rmax - rmin) * (smax - smin) + smin。其中[rmin,rmax]为原始灰度范围，[smin,smax]为目标范围。该方法保持灰度的相对关系不变。',
    controls: [
      { key: 'low', label: '下限(%)', type: 'range', min: 0, max: 40, step: 5, default: 5 },
      { key: 'high', label: '上限(%)', type: 'range', min: 60, max: 100, step: 5, default: 95 }
    ],
    run(imageData, { low = 5, high = 95 } = {}) {
      const rmin = Math.round(low * 2.55), rmax = Math.round(high * 2.55);
      const range = rmax - rmin || 1;
      return ImageEngine.pointTransform(imageData, v => {
        if (v <= rmin) return 0;
        if (v >= rmax) return 255;
        return Math.round((v - rmin) / range * 255);
      });
    }
  },

  'threshold': {
    title: '灰度阈值处理',
    description: '使用固定阈值将灰度图像转换为二值图像，实现目标与背景分离',
    categoryName: '基础',
    category: 'basic',
    chapter: 3,
    sample: 'rice.bmp',
    caseText: '在米粒计数应用中，阈值化是分割米粒与背景的关键步骤。选择合适的阈值直接决定分割质量——阈值过高会丢失小颗粒，过低则会将噪声误认为目标。',
    principle: '二值化: s = 255 if r >= T, else s = 0。阈值T的选择方法包括: 直方图双峰法(取谷底)、Otsu法(最大化类间方差)、迭代法。Otsu法公式: T = argmax(w0*w1*(u0-u1)^2)。',
    controls: [
      { key: 'threshold', label: '阈值', type: 'range', min: 0, max: 255, step: 1, default: 128 }
    ],
    run(imageData, { threshold: t = 128 } = {}) {
      return ImageEngine.thresholdSegment(imageData, t);
    }
  },

  'quantize': {
    title: '多级别量化',
    description: '将灰度图像量化为指定级别数，理解灰度分辨率与图像质量的关系',
    categoryName: '基础',
    category: 'basic',
    chapter: 3,
    sample: 'rice.bmp',
    caseText: '量化级别决定了图像的灰度分辨率。8级量化(3bit)会产生明显的伪轮廓效应，而2级量化就是二值化。理解量化有助于图像压缩和特征简化。',
    principle: '量化: 将[0,255]等分为L个区间，每个区间的像素值映射为该区间的中值。量化误差最大为 255/(2L)。当L=2时退化为二值化，L=256时不做任何量化。',
    controls: [
      { key: 'levels', label: '量化级别', type: 'range', min: 2, max: 64, step: 2, default: 8 }
    ],
    run(imageData, { levels = 8 } = {}) {
      return ImageEngine.quantize(imageData, levels);
    }
  },


  /* ============================
   * 第4章 空间域滤波 (5个实验)
   * ============================ */

  'smooth': {
    title: '平滑滤波',
    description: '使用均值滤波和中值滤波对图像进行平滑处理，比较线性与非线性滤波效果',
    categoryName: '基础',
    category: 'basic',
    chapter: 4,
    sample: 'rice.bmp',
    caseText: '平滑滤波是去除噪声的基本手段。均值滤波简单有效但会模糊边缘，中值滤波在去除椒盐噪声的同时能较好地保持边缘——这体现了线性与非线性滤波器的本质区别。',
    principle: '均值滤波: g(x,y) = (1/M) * sum f(s,t)，对所有邻域像素取平均。中值滤波: g(x,y) = median{f(s,t)}，取邻域中值。中值滤波对椒盐噪声效果优异，但对高斯噪声效果一般。',
    controls: [
      { key: 'type', label: '滤波类型', type: 'select', options: ['均值滤波', '中值滤波'], default: '均值滤波' },
      { key: 'size', label: '核大小', type: 'select', options: ['3x3', '5x5'], default: '3x3' }
    ],
    run(imageData, { type = '均值滤波', size = '3x3' } = {}) {
      if (type === '中值滤波') {
        return ImageEngine.spatialFilter(imageData, 'median', size === '5x5' ? 5 : 3);
      }
      const kernel = size === '5x5'
        ? [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1]
        : [1,1,1, 1,1,1, 1,1,1];
      const divisor = size === '5x5' ? 25 : 9;
      return ImageEngine.convolve(imageData, kernel, divisor);
    }
  },

  'sharpen': {
    title: '锐化滤波',
    description: '使用拉普拉斯算子和USM方法增强图像边缘与细节',
    categoryName: '基础',
    category: 'basic',
    chapter: 4,
    sample: 'dehaze-sweden.jpg',
    caseText: '锐化是图像增强的重要手段，在摄影后期、医学影像增强中广泛使用。拉普拉斯锐化通过增强二阶导数来突出细节，USM锐化则更加自然可控。',
    principle: '拉普拉斯核: [0,-1,0; -1,4,-1; 0,-1,0]，增强中心像素与邻域的差异。锐化公式: g = f + k*Laplacian(f)。USM: g = f + amount*(f - blur(f))，先模糊再与原图做差得到高频分量。',
    controls: [
      { key: 'strength', label: '锐化强度', type: 'range', min: 0.5, max: 3.0, step: 0.5, default: 1.0 }
    ],
    run(imageData, { strength = 1.0 } = {}) {
      const lapKernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];
      const lap = ImageEngine.convolve(imageData, lapKernel, 1);
      const out = ImageEngine.cloneImageData(imageData);
      const d = out.data, l = lap.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = ImageEngine.clamp(d[i] + strength * l[i]);
        d[i + 1] = ImageEngine.clamp(d[i + 1] + strength * l[i + 1]);
        d[i + 2] = ImageEngine.clamp(d[i + 2] + strength * l[i + 2]);
      }
      return out;
    }
  },

  'denoise': {
    title: '去噪处理',
    description: '对含噪图像进行去噪处理，比较不同滤波器在不同噪声下的表现',
    categoryName: '设计',
    category: 'design',
    chapter: 4,
    sample: 'rice.bmp',
    caseText: '去噪是图像预处理的核心任务。不同噪声类型需要不同的去噪策略——高斯噪声适合均值或高斯滤波，椒盐噪声适合中值滤波。实际应用中往往需要先判断噪声类型再选择算法。',
    principle: '高斯滤波器核: G(x,y) = (1/(2*pi*sigma^2)) * exp(-(x^2+y^2)/(2*sigma^2))。sigma越大平滑越强但边缘模糊越严重。双边滤波在此基础上加入灰度相似度权重，实现保边去噪。',
    controls: [
      { key: 'noiseType', label: '噪声类型', type: 'select', options: ['高斯噪声', '椒盐噪声'], default: '高斯噪声' },
      { key: 'filter', label: '去噪方法', type: 'select', options: ['均值滤波', '中值滤波', '高斯滤波'], default: '均值滤波' }
    ],
    run(imageData, { noiseType = '高斯噪声', filter = '均值滤波' } = {}) {
      // 先加噪
      const noisy = ImageEngine.cloneImageData(imageData);
      const d = noisy.data;
      const len = d.length / 4;
      if (noiseType === '椒盐噪声') {
        for (let i = 0; i < len; i++) {
          if (Math.random() < 0.02) {
            const v = Math.random() < 0.5 ? 0 : 255;
            d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v;
          }
        }
      } else {
        for (let i = 0; i < len; i++) {
          const n = 20 * (Math.random() + Math.random() + Math.random() - 1.5) * 0.816;
          d[i * 4] = ImageEngine.clamp(d[i * 4] + n);
          d[i * 4 + 1] = ImageEngine.clamp(d[i * 4 + 1] + n);
          d[i * 4 + 2] = ImageEngine.clamp(d[i * 4 + 2] + n);
        }
      }
      // 再去噪
      if (filter === '中值滤波') {
        return ImageEngine.spatialFilter(noisy, 'median', 3);
      } else if (filter === '高斯滤波') {
        return ImageEngine.convolve(noisy, [1,2,1, 2,4,2, 1,2,1], 16);
      }
      return ImageEngine.convolve(noisy, [1,1,1, 1,1,1, 1,1,1], 9);
    }
  },

  'gradient': {
    title: '梯度计算',
    description: '计算图像的梯度幅值和方向，理解一阶导数在图像处理中的意义',
    categoryName: '设计',
    category: 'design',
    chapter: 4,
    sample: 'rice.bmp',
    caseText: '梯度反映了图像灰度的变化率和方向，是边缘检测的基础。梯度幅值大的地方通常对应边缘或纹理区域，梯度方向指向灰度增长最快的方向。',
    principle: '梯度: nabla(f) = [df/dx, df/dy]。梯度幅值: |nabla(f)| = sqrt(Gx^2 + Gy^2)。梯度方向: theta = arctan(Gy/Gx)。实际计算中常用有限差分近似: Gx = f(x+1,y) - f(x,y)。',
    controls: [
      { key: 'mode', label: '显示模式', type: 'select', options: ['梯度幅值', '水平梯度', '垂直梯度'], default: '梯度幅值' }
    ],
    run(imageData, { mode = '梯度幅值' } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      const out = ImageEngine.cloneImageData(gray);
      const o = out.data;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4;
          const gx = d[i + 4] - d[i - 4];
          const gy = d[i + w * 4] - d[i - w * 4];
          let v;
          if (mode === '水平梯度') v = ImageEngine.clamp(gx + 128);
          else if (mode === '垂直梯度') v = ImageEngine.clamp(gy + 128);
          else v = ImageEngine.clamp(Math.sqrt(gx * gx + gy * gy));
          o[i] = o[i + 1] = o[i + 2] = v;
        }
      }
      return out;
    }
  },

  'directional': {
    title: '方向滤波',
    description: '使用方向性检测核提取特定角度的边缘特征',
    categoryName: '设计',
    category: 'design',
    chapter: 4,
    sample: 'logs.jpg',
    caseText: '在木材纹理分析中，不同方向的纹理代表不同的结构特征。方向滤波可以选择性地增强特定方向的边缘，抑制其他方向的特征。',
    principle: '方向核设计: 使核在一个方向上为正值、相反方向为负值。水平检测核: [-1,-1,-1; 0,0,0; 1,1,1]。垂直检测核: [-1,0,1; -1,0,1; -1,0,1]。对角线方向可通过旋转这些基本核得到。',
    controls: [
      { key: 'direction', label: '检测方向', type: 'select', options: ['水平', '垂直', '45度', '135度'], default: '水平' }
    ],
    run(imageData, { direction = '水平' } = {}) {
      const kernels = {
        '水平': [-1, -1, -1, 0, 0, 0, 1, 1, 1],
        '垂直': [-1, 0, 1, -1, 0, 1, -1, 0, 1],
        '45度': [-1, -1, 0, -1, 0, 1, 0, 1, 1],
        '135度': [0, 1, 1, -1, 0, 1, -1, -1, 0]
      };
      const k = kernels[direction] || kernels['水平'];
      return ImageEngine.convolve(imageData, k, 1);
    }
  },

  'emboss': {
    title: '浮雕效果',
    description: '使用非对称卷积核实现浮雕(Emboss)立体效果，理解方向性滤波的创意应用',
    categoryName: '设计',
    category: 'design',
    chapter: 4,
    sample: 'dehaze-sweden.jpg',
    caseText: '浮雕效果通过模拟光照方向使图像呈现三维立体感。它在艺术滤镜和图像特效中广泛应用，同时也是理解卷积核方向选择性的生动示例。',
    principle: '浮雕核: [-2,-1,0; -1,1,1; 0,1,2] + 128偏移。该核对左上到右下方向的灰度变化敏感，正差分加亮、负差分变暗，产生光照效果。加上128的灰度偏移使中性区域为灰色。',
    controls: [
      { key: 'direction', label: '光照方向', type: 'select', options: ['左上', '右上', '左下', '右下'], default: '左上' }
    ],
    run(imageData, { direction = '左上' } = {}) {
      const kernels = {
        '左上': [-2, -1, 0, -1, 1, 1, 0, 1, 2],
        '右上': [0, -1, -2, 1, 1, -1, 2, 1, 0],
        '左下': [0, 1, 2, -1, 1, 1, -2, -1, 0],
        '右下': [2, 1, 0, 1, 1, -1, 0, -1, -2]
      };
      const k = kernels[direction] || kernels['左上'];
      const result = ImageEngine.convolve(imageData, k, 1);
      // Add 128 offset for emboss look
      const d = result.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = ImageEngine.clamp(d[i] + 128);
        d[i + 1] = ImageEngine.clamp(d[i + 1] + 128);
        d[i + 2] = ImageEngine.clamp(d[i + 2] + 128);
      }
      return result;
    }
  },


  /* ============================
   * 第5章 频域处理 (5个实验)
   * ============================ */

  'fft': {
    title: '二维傅里叶变换',
    description: '对图像进行2D DFT并显示频谱图，理解频域分析基础',
    categoryName: '基础',
    category: 'basic',
    chapter: 5,
    sample: 'rice.bmp',
    caseText: '傅里叶变换将图像从空间域转换到频率域。频谱中的低频分量对应图像的平滑区域，高频分量对应边缘和细节。频域分析为滤波、压缩等操作提供了理论基础。',
    principle: '二维DFT: F(u,v) = sum_x sum_y f(x,y) * exp(-j*2*pi*(ux/M + vy/N))。频谱 |F(u,v)| 显示各频率分量的幅度。对数变换 log(1+|F|) 用于压缩动态范围以便显示。',
    controls: [],
    run(imageData) {
      const freq = _fft2d(imageData);
      return _spectrumImage(freq);
    }
  },

  'lowpass-freq': {
    title: '频域低通滤波',
    description: '在频域中使用理想低通滤波器去除高频分量，实现图像模糊',
    categoryName: '基础',
    category: 'basic',
    chapter: 5,
    sample: 'rice.bmp',
    caseText: '频域低通滤波让低频分量通过而抑制高频分量，效果类似于空间域的平滑滤波，但可以在频率维度精确控制截止频率。理想低通滤波会产生振铃效应。',
    principle: '理想低通: H(u,v) = 1 if D(u,v) <= D0, else 0。其中D(u,v) = sqrt((u-M/2)^2 + (v-N/2)^2)为到频率中心的距离。Butterworth低通: H = 1/(1+(D/D0)^(2n))，过渡更平滑。',
    controls: [
      { key: 'cutoff', label: '截止频率(%)', type: 'range', min: 5, max: 50, step: 5, default: 20 }
    ],
    run(imageData, { cutoff = 20 } = {}) {
      return _fftFilter(imageData, (freq) => {
        const { width: w, height: h } = freq;
        const d0 = cutoff / 100 * Math.min(w, h) / 2;
        for (let v = 0; v < h; v++) {
          for (let u = 0; u < w; u++) {
            const du = u - w / 2, dv = v - h / 2;
            const dist = Math.sqrt(du * du + dv * dv);
            if (dist > d0) {
              freq.re[v * w + u] = 0;
              freq.im[v * w + u] = 0;
            }
          }
        }
      });
    }
  },

  'highpass-freq': {
    title: '频域高通滤波',
    description: '在频域中使用高通滤波器增强高频分量，实现边缘提取',
    categoryName: '基础',
    category: 'basic',
    chapter: 5,
    sample: 'rice.bmp',
    caseText: '高通滤波抑制低频保留高频，等效于空间域的边缘增强。与空间域的拉普拉斯滤波相比，频域高通滤波可以精确控制截止频率，实现更灵活的频率选择。',
    principle: '理想高通: H(u,v) = 0 if D(u,v) <= D0, else 1。高通 = 1 - 低通。高斯高通: H = 1 - exp(-D^2/(2*D0^2))，无振铃效应。',
    controls: [
      { key: 'cutoff', label: '截止频率(%)', type: 'range', min: 5, max: 50, step: 5, default: 15 }
    ],
    run(imageData, { cutoff = 15 } = {}) {
      return _fftFilter(imageData, (freq) => {
        const { width: w, height: h } = freq;
        const d0 = cutoff / 100 * Math.min(w, h) / 2;
        for (let v = 0; v < h; v++) {
          for (let u = 0; u < w; u++) {
            const du = u - w / 2, dv = v - h / 2;
            const dist = Math.sqrt(du * du + dv * dv);
            if (dist <= d0) {
              freq.re[v * w + u] = 0;
              freq.im[v * w + u] = 0;
            }
          }
        }
      });
    }
  },

  'bandpass-freq': {
    title: '频域带通滤波',
    description: '选择特定频率范围的信号通过，抑制过低和过高的频率分量',
    categoryName: '设计',
    category: 'design',
    chapter: 5,
    sample: 'logs.jpg',
    caseText: '带通滤波在纹理分析中非常有用——特定的纹理周期对应特定的频率带。通过选择适当的频率带，可以提取感兴趣的纹理模式。',
    principle: '带通滤波: H(u,v) = 1 if D_low <= D(u,v) <= D_high, else 0。带通 = 低通(D_high) - 低通(D_low)。可用于提取特定尺度的纹理或周期性结构。',
    controls: [
      { key: 'low', label: '低频截止(%)', type: 'range', min: 5, max: 30, step: 5, default: 10 },
      { key: 'high', label: '高频截止(%)', type: 'range', min: 20, max: 60, step: 5, default: 35 }
    ],
    run(imageData, { low = 10, high = 35 } = {}) {
      return _fftFilter(imageData, (freq) => {
        const { width: w, height: h } = freq;
        const dLow = low / 100 * Math.min(w, h) / 2;
        const dHigh = high / 100 * Math.min(w, h) / 2;
        for (let v = 0; v < h; v++) {
          for (let u = 0; u < w; u++) {
            const du = u - w / 2, dv = v - h / 2;
            const dist = Math.sqrt(du * du + dv * dv);
            if (dist < dLow || dist > dHigh) {
              freq.re[v * w + u] = 0;
              freq.im[v * w + u] = 0;
            }
          }
        }
      });
    }
  },

  'homomorphic': {
    title: '同态滤波',
    description: '通过频域处理同时压缩动态范围和增强对比度，解决光照不均匀问题',
    categoryName: '设计',
    category: 'design',
    chapter: 5,
    sample: 'dehaze-sweden.jpg',
    caseText: '在光照不均匀的图像中(如阴影区域)，同态滤波可以压缩低频光照分量同时增强高频反射分量，使暗区细节可见而亮区不过曝。广泛用于遥感、医学影像。',
    principle: '图像模型: f(x,y) = i(x,y)*r(x,y)，光照i(低频) * 反射r(高频)。取对数: ln(f) = ln(i) + ln(r)，使乘法变加法。频域滤波: H(u,v) = (gH-gL)*(1-exp(-c*D^2/D0^2)) + gL。最后取指数恢复。',
    controls: [
      { key: 'gammaH', label: '高频增益', type: 'range', min: 1.0, max: 3.0, step: 0.2, default: 1.5 },
      { key: 'gammaL', label: '低频增益', type: 'range', min: 0.1, max: 1.0, step: 0.1, default: 0.5 }
    ],
    run(imageData, { gammaH = 1.5, gammaL = 0.5 } = {}) {
      const w = imageData.width, h = imageData.height;
      const gray = ImageEngine.grayscale(imageData);
      const d = gray.data;
      const pw = Math.pow(2, Math.ceil(Math.log2(w)));
      const ph = Math.pow(2, Math.ceil(Math.log2(h)));
      const N = pw * ph;
      const re = new Float64Array(N), im = new Float64Array(N);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const v = Math.max(1, d[(y * w + x) * 4]);
          re[y * pw + x] = Math.log(v);
        }
      }
      // Row FFT
      const rowRe = new Float64Array(pw), rowIm = new Float64Array(pw);
      for (let y = 0; y < ph; y++) {
        for (let x = 0; x < pw; x++) { rowRe[x] = re[y * pw + x]; rowIm[x] = im[y * pw + x]; }
        _fft1d(rowRe, rowIm, false);
        for (let x = 0; x < pw; x++) { re[y * pw + x] = rowRe[x]; im[y * pw + x] = rowIm[x]; }
      }
      // Col FFT
      const colRe = new Float64Array(ph), colIm = new Float64Array(ph);
      for (let x = 0; x < pw; x++) {
        for (let y = 0; y < ph; y++) { colRe[y] = re[y * pw + x]; colIm[y] = im[y * pw + x]; }
        _fft1d(colRe, colIm, false);
        for (let y = 0; y < ph; y++) { re[y * pw + x] = colRe[y]; im[y * pw + x] = colIm[y]; }
      }
      // Apply homomorphic filter
      const d0 = Math.min(pw, ph) * 0.1;
      const c = 1;
      for (let v = 0; v < ph; v++) {
        for (let u = 0; u < pw; u++) {
          const du = u - pw / 2, dv = v - ph / 2;
          const dist2 = du * du + dv * dv;
          const hf = (gammaH - gammaL) * (1 - Math.exp(-c * dist2 / (d0 * d0))) + gammaL;
          const idx = v * pw + u;
          re[idx] *= hf; im[idx] *= hf;
        }
      }
      // Inverse FFT
      const freq = { re, im, width: pw, height: ph, origW: w, origH: h };
      const result = _ifft2d(freq);
      const rd = result.data;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const out = ctx.createImageData(w, h);
      let minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < w * h; i++) {
        const v = rd[i * 4];
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const range = maxV - minV || 1;
      for (let i = 0; i < w * h; i++) {
        const v = Math.round(Math.exp(((rd[i * 4] - minV) / range) * Math.log(256)));
        out.data[i * 4] = Math.min(255, v);
        out.data[i * 4 + 1] = Math.min(255, v);
        out.data[i * 4 + 2] = Math.min(255, v);
        out.data[i * 4 + 3] = 255;
      }
      return out;
    }
  },

  /* ============================
   * 第6章 图像增强 (5个实验)
   * ============================ */

  'hist-eq': {
    title: '直方图均衡化',
    description: '通过累积分布函数映射实现直方图均衡，增强图像整体对比度',
    categoryName: '基础',
    category: 'basic',
    chapter: 6,
    sample: 'dehaze-sweden.jpg',
    caseText: '直方图均衡化是自适应的对比度增强方法——它不需要人工设定参数，自动将灰度分布拉平。在雾天图像增强、医学影像增强中效果显著。',
    principle: '均衡化变换: s = T(r) = (L-1) * CDF(r) = (L-1) * sum(k=0 to r) p(k)。变换后直方图近似均匀分布。CDF是累积分布函数，将灰度值映射到其在直方图中的累积概率位置。',
    controls: [],
    run(imageData) {
      return ImageEngine.histogramEqualize(imageData);
    }
  },

  'clahe': {
    title: '自适应直方图均衡',
    description: '将图像分块进行局部直方图均衡，解决全局均衡丢失局部细节的问题',
    categoryName: '设计',
    category: 'design',
    chapter: 6,
    sample: 'weld.jpg',
    caseText: '全局直方图均衡可能使某些区域的对比度反而降低。CLAHE(自适应直方图均衡)将图像分成小块分别均衡，并通过双线性插值消除块效应，是实际工业应用中的首选方法。',
    principle: 'CLAHE将图像分为NxM个网格，每个网格独立做直方图均衡，并用clipLimit限制对比度放大倍数。相邻网格间通过双线性插值过渡，消除边界不连续。',
    controls: [
      { key: 'gridSize', label: '网格大小', type: 'select', options: ['4x4', '8x8', '16x16'], default: '8x8' },
      { key: 'clipLimit', label: '裁剪限幅', type: 'range', min: 1, max: 5, step: 0.5, default: 2 }
    ],
    run(imageData, { gridSize = '8x8', clipLimit = 2 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      const gs = parseInt(gridSize);
      const bw = Math.ceil(w / gs), bh = Math.ceil(h / gs);
      const out = ImageEngine.cloneImageData(gray);
      const o = out.data;
      for (let gy = 0; gy < gs; gy++) {
        for (let gx = 0; gx < gs; gx++) {
          const x0 = gx * bw, y0 = gy * bh;
          const x1 = Math.min(x0 + bw, w), y1 = Math.min(y0 + bh, h);
          // Compute local histogram
          const hist = new Array(256).fill(0);
          let count = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              hist[d[(y * w + x) * 4]]++;
              count++;
            }
          }
          // Clip and redistribute
          const clipVal = Math.max(1, Math.round(clipLimit * count / 256));
          let excess = 0;
          for (let k = 0; k < 256; k++) {
            if (hist[k] > clipVal) { excess += hist[k] - clipVal; hist[k] = clipVal; }
          }
          const incr = Math.floor(excess / 256);
          let rem = excess - incr * 256;
          for (let k = 0; k < 256; k++) { hist[k] += incr; if (rem > 0) { hist[k]++; rem--; } }
          // Build CDF
          const cdf = new Array(256);
          cdf[0] = hist[0];
          for (let k = 1; k < 256; k++) cdf[k] = cdf[k - 1] + hist[k];
          const cdfMin = cdf.find(v => v > 0) || 0;
          // Apply mapping
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * w + x) * 4;
              const v = Math.round((cdf[d[i]] - cdfMin) / (count - cdfMin) * 255);
              o[i] = o[i + 1] = o[i + 2] = ImageEngine.clamp(v);
            }
          }
        }
      }
      return out;
    }
  },

  'log-transform': {
    title: '对数变换增强',
    description: '使用对数函数扩展暗区灰度级，增强低亮度区域的细节',
    categoryName: '基础',
    category: 'basic',
    chapter: 6,
    sample: 'dehaze-sweden.jpg',
    caseText: '在夜景或高动态范围场景中，暗部细节往往难以辨认。对数变换将暗区的灰度差异放大，同时压缩亮区的灰度范围，使整体细节更加均衡。',
    principle: '对数变换: s = c * log(1 + r)，其中c = 255/log(1 + max_r)。该变换的特点是: 当r较小时ds/dr较大(暗区扩展)，当r较大时ds/dr较小(亮区压缩)。傅里叶频谱的显示就用此变换。',
    controls: [
      { key: 'c', label: '常数c', type: 'range', min: 10, max: 100, step: 5, default: 45 }
    ],
    run(imageData, { c = 45 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const d = gray.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.round(c * Math.log(1 + d[i]));
        d[i] = d[i + 1] = d[i + 2] = ImageEngine.clamp(v);
      }
      return gray;
    }
  },

  'unsharp': {
    title: 'USM锐化',
    description: '非锐化掩模(USM)方法：先模糊图像，再与原图做差得到高频掩模，增强细节',
    categoryName: '设计',
    category: 'design',
    chapter: 6,
    sample: 'dehaze-sweden.jpg',
    caseText: 'USM锐化是Photoshop等图像处理软件中最常用的锐化方法。相比拉普拉斯锐化，USM可以通过调整模糊半径控制增强的频率范围，效果更加自然。',
    principle: 'USM步骤: 1) blurred = lowpass(original) 2) mask = original - blurred 3) result = original + amount * mask。amount控制锐化强度，模糊半径控制增强的频率范围。',
    controls: [
      { key: 'amount', label: '锐化量', type: 'range', min: 0.5, max: 3.0, step: 0.5, default: 1.5 },
      { key: 'radius', label: '模糊半径', type: 'select', options: ['小(3x3)', '中(5x5)'], default: '小(3x3)' }
    ],
    run(imageData, { amount = 1.5, radius = '小(3x3)' } = {}) {
      const kernel = radius === '中(5x5)'
        ? [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1]
        : [1,1,1, 1,1,1, 1,1,1];
      const divisor = radius === '中(5x5)' ? 25 : 9;
      const blurred = ImageEngine.convolve(imageData, kernel, divisor);
      const out = ImageEngine.cloneImageData(imageData);
      const d = out.data, b = blurred.data;
      for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          const mask = d[i + c] - b[i + c];
          d[i + c] = ImageEngine.clamp(d[i + c] + amount * mask);
        }
      }
      return out;
    }
  },

  'color-enhance': {
    title: '彩色图像增强',
    description: '在HSV色彩空间中对亮度通道进行直方图均衡，保持色彩不变',
    categoryName: '设计',
    category: 'design',
    chapter: 6,
    sample: 'red-date-defect.jpg',
    caseText: '直接对RGB三个通道分别做均衡化会改变图像的色彩平衡。正确做法是转换到HSV空间，只对V(亮度)通道做均衡，H(色调)和S(饱和度)保持不变。',
    principle: 'HSV色彩空间: H(色调,0-360度)描述颜色种类，S(饱和度,0-1)描述纯度，V(亮度,0-1)描述明暗。RGB转HSV后只处理V通道再转回，可以在增强对比度的同时保持色彩真实性。',
    controls: [
      { key: 'method', label: '增强方式', type: 'select', options: ['亮度均衡', '饱和度增强'], default: '亮度均衡' }
    ],
    run(imageData, { method = '亮度均衡' } = {}) {
      const w = imageData.width, h = imageData.height;
      const d = imageData.data;
      const out = ImageEngine.cloneImageData(imageData);
      const o = out.data;
      function rgb2hsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const v = max, s = max === 0 ? 0 : (max - min) / max;
        let hue = 0;
        if (max !== min) {
          const d = max - min;
          if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) hue = ((b - r) / d + 2) / 6;
          else hue = ((r - g) / d + 4) / 6;
        }
        return [hue, s, v];
      }
      function hsv2rgb(h, s, v) {
        const i = Math.floor(h * 6);
        const f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
        let r, g, b;
        switch (i % 6) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      }
      if (method === '亮度均衡') {
        // Collect V values
        const vs = [];
        for (let i = 0; i < d.length; i += 4) vs.push(rgb2hsv(d[i], d[i + 1], d[i + 2])[2]);
        // Build histogram and CDF for V
        const hist = new Array(256).fill(0);
        for (const v of vs) hist[Math.round(v * 255)]++;
        const cdf = new Array(256);
        cdf[0] = hist[0];
        for (let k = 1; k < 256; k++) cdf[k] = cdf[k - 1] + hist[k];
        const total = vs.length;
        for (let i = 0; i < d.length; i += 4) {
          const [hue, s, v] = rgb2hsv(d[i], d[i + 1], d[i + 2]);
          const newV = cdf[Math.round(v * 255)] / total;
          const [r, g, b] = hsv2rgb(hue, s, newV);
          o[i] = r; o[i + 1] = g; o[i + 2] = b;
        }
      } else {
        for (let i = 0; i < d.length; i += 4) {
          const [hue, s, v] = rgb2hsv(d[i], d[i + 1], d[i + 2]);
          const newS = Math.min(1, s * 1.5);
          const [r, g, b] = hsv2rgb(hue, newS, v);
          o[i] = r; o[i + 1] = g; o[i + 2] = b;
        }
      }
      return out;
    }
  },

  /* ============================
   * 第7章 图像复原 (5个实验)
   * ============================ */

  'motion-blur': {
    title: '运动模糊模拟',
    description: '模拟相机或物体的运动造成的线性运动模糊效果',
    categoryName: '基础',
    category: 'basic',
    chapter: 7,
    sample: 'rice.bmp',
    caseText: '运动模糊是摄影中最常见的退化因素之一。理解运动模糊的数学模型是后续逆滤波和维纳滤波复原的基础。运动模糊核的形状由运动方向和长度决定。',
    principle: '运动模糊核: h(x,y) = 1/L (沿运动方向的L个像素为1/L，其余为0)。频域: H(u,v) = (sin(pi*u*L)/(pi*u*L)) * exp(-j*pi*u*(L-1))。H的零点导致某些频率信息完全丢失。',
    controls: [
      { key: 'length', label: '模糊长度', type: 'range', min: 3, max: 21, step: 2, default: 9 },
      { key: 'angle', label: '角度', type: 'range', min: 0, max: 180, step: 15, default: 0 }
    ],
    run(imageData, { length = 9, angle = 0 } = {}) {
      const kernel = new Array(length * length).fill(0);
      const cx = Math.floor(length / 2), cy = Math.floor(length / 2);
      const cos = Math.cos(angle * Math.PI / 180), sin = Math.sin(angle * Math.PI / 180);
      for (let t = -cx; t <= cx; t++) {
        const x = Math.round(cx + t * cos), y = Math.round(cy + t * sin);
        if (x >= 0 && x < length && y >= 0 && y < length) {
          kernel[y * length + x] = 1;
        }
      }
      const sum = kernel.reduce((a, b) => a + b, 0) || 1;
      return ImageEngine.convolve(imageData, kernel, sum);
    }
  },

  'defocus-blur': {
    title: '离焦模糊模拟',
    description: '模拟镜头离焦造成的圆形散焦模糊效果',
    categoryName: '基础',
    category: 'basic',
    chapter: 7,
    sample: 'rice.bmp',
    caseText: '离焦模糊在显微镜成像和摄影中很常见。与运动模糊不同，离焦模糊的核是圆盘形的(散焦斑)。离焦程度由光圈和焦距决定。',
    principle: '离焦模糊核: h(x,y) = 1/(pi*R^2) if x^2+y^2 <= R^2, else 0。频域近似: H(u,v) ~ J1(2*pi*R*sqrt(u^2+v^2)) / (pi*R*sqrt(u^2+v^2))，其中J1为一阶贝塞尔函数。',
    controls: [
      { key: 'radius', label: '散焦半径', type: 'range', min: 1, max: 10, step: 1, default: 3 }
    ],
    run(imageData, { radius = 3 } = {}) {
      const size = radius * 2 + 1;
      const kernel = new Array(size * size).fill(0);
      let sum = 0;
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (x * x + y * y <= radius * radius) {
            kernel[(y + radius) * size + (x + radius)] = 1;
            sum++;
          }
        }
      }
      return ImageEngine.convolve(imageData, kernel, sum);
    }
  },

  'inverse-filter': {
    title: '逆滤波复原',
    description: '对退化图像应用逆滤波，尝试恢复原始图像(在频域中实现)',
    categoryName: '设计',
    category: 'design',
    chapter: 7,
    sample: 'rice.bmp',
    caseText: '逆滤波是最直接的复原方法——用退化函数的倒数去"撤销"退化。但在退化函数接近零的频率处，逆滤波会无限放大噪声，因此实际效果往往不理想。',
    principle: '退化模型: g = h*f + n。逆滤波: F_est = G/H。问题: 当H(u,v)趋近0时，F_est中的噪声项 N/H 会趋向无穷。解决方法包括伪逆滤波(设阈值)和维纳滤波。',
    controls: [
      { key: 'blurLength', label: '模糊长度', type: 'range', min: 3, max: 15, step: 2, default: 7 },
      { key: 'threshold', label: '阈值', type: 'range', min: 0.01, max: 0.5, step: 0.01, default: 0.1 }
    ],
    run(imageData, { blurLength = 7, threshold = 0.1 } = {}) {
      // Simulate motion blur
      const kernel = new Array(blurLength * blurLength).fill(0);
      const cx = Math.floor(blurLength / 2);
      for (let t = -cx; t <= cx; t++) kernel[cx * blurLength + (cx + t)] = 1;
      const blurred = ImageEngine.convolve(imageData, kernel, blurLength);
      // Apply inverse filter in frequency domain
      return _fftFilter(blurred, (freq) => {
        const { width: w, height: h } = freq;
        for (let v = 0; v < h; v++) {
          for (let u = 0; u < w; u++) {
            // Compute H(u,v) for horizontal motion blur
            const uf = (u - w / 2) / w;
            const arg = Math.PI * blurLength * uf;
            const hVal = Math.abs(Math.sin(arg) / (arg || 1));
            if (hVal < threshold) {
              freq.re[v * w + u] = 0;
              freq.im[v * w + u] = 0;
            } else {
              freq.re[v * w + u] /= (hVal * blurLength);
              freq.im[v * w + u] /= (hVal * blurLength);
            }
          }
        }
      });
    }
  },

  'wiener-filter': {
    title: '维纳滤波复原',
    description: '使用维纳滤波器在最小均方误差意义下进行最优图像复原',
    categoryName: '设计',
    category: 'design',
    chapter: 7,
    sample: 'rice.bmp',
    caseText: '维纳滤波是逆滤波的改进版本——它考虑了噪声的影响，在退化函数接近零时不会无限放大噪声。它是图像复原领域最经典的算法之一，被广泛应用于各种退化场景。',
    principle: '维纳滤波: F_est = [H*/(|H|^2 + K)] * G，其中K = Sn/Sf (噪声功率谱/信号功率谱)。当K=0时退化为逆滤波，K越大越偏向平滑。K的实际选取通常通过实验调优。',
    controls: [
      { key: 'blurLength', label: '模糊长度', type: 'range', min: 3, max: 15, step: 2, default: 7 },
      { key: 'K', label: '噪声参数K', type: 'range', min: 0.001, max: 0.1, step: 0.005, default: 0.02 }
    ],
    run(imageData, { blurLength = 7, K = 0.02 } = {}) {
      // Simulate motion blur + noise
      const kernel = new Array(blurLength * blurLength).fill(0);
      const cx = Math.floor(blurLength / 2);
      for (let t = -cx; t <= cx; t++) kernel[cx * blurLength + (cx + t)] = 1;
      const blurred = ImageEngine.convolve(imageData, kernel, blurLength);
      // Add slight noise
      const bd = blurred.data;
      for (let i = 0; i < bd.length; i += 4) {
        const n = 3 * (Math.random() + Math.random() + Math.random() - 1.5) * 0.816;
        bd[i] = ImageEngine.clamp(bd[i] + n);
        bd[i + 1] = ImageEngine.clamp(bd[i + 1] + n);
        bd[i + 2] = ImageEngine.clamp(bd[i + 2] + n);
      }
      // Wiener filter
      return _fftFilter(blurred, (freq) => {
        const { width: w, height: h } = freq;
        for (let v = 0; v < h; v++) {
          for (let u = 0; u < w; u++) {
            const uf = (u - w / 2) / w;
            const arg = Math.PI * blurLength * uf;
            const hVal = (Math.abs(arg) < 0.001) ? 1 : Math.sin(arg) / arg;
            const h2 = hVal * hVal;
            const wiener = hVal / (h2 + K);
            freq.re[v * w + u] *= wiener;
            freq.im[v * w + u] *= wiener;
          }
        }
      });
    }
  },

  'blind-deconv': {
    title: '盲反卷积估计',
    description: '在不知道退化函数的情况下，估计退化核并复原图像',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 7,
    sample: 'rice.bmp',
    caseText: '在实际应用中，退化函数往往是未知的。盲反卷积同时估计退化核和原始图像，是一个病态问题。通常假设核具有特定形式(如运动模糊的直线核)，并加入正则化约束。',
    principle: '盲反卷积: 已知 g=h*f+n, 求f和h。约束: h非负且sum(h)=1, f平滑。迭代算法: 交替优化f和h。简化方法: 先用边缘检测估计核方向，再用核长度搜索。',
    controls: [
      { key: 'iterCount', label: '迭代次数', type: 'range', min: 3, max: 15, step: 1, default: 5 },
      { key: 'kernelSize', label: '核大小', type: 'range', min: 3, max: 11, step: 2, default: 5 }
    ],
    run(imageData, { iterCount = 5, kernelSize = 5 } = {}) {
      // Simulate blur first
      const blurKernel = new Array(kernelSize * kernelSize).fill(0);
      const cx = Math.floor(kernelSize / 2);
      for (let t = -cx; t <= cx; t++) blurKernel[cx * kernelSize + (cx + t)] = 1;
      const blurred = ImageEngine.convolve(imageData, blurKernel, kernelSize);
      // Richardson-Lucy deconvolution (blind estimation)
      let estimate = ImageEngine.cloneImageData(blurred);
      for (let iter = 0; iter < iterCount; iter++) {
        const reblurred = ImageEngine.convolve(estimate, blurKernel, kernelSize);
        const ratio = ImageEngine.cloneImageData(estimate);
        const ed = estimate.data, rd = reblurred.data, ratd = ratio.data;
        for (let i = 0; i < ed.length; i += 4) {
          const r = rd[i] > 1 ? ed[i] / rd[i] : 1;
          ratd[i] = ratd[i + 1] = ratd[i + 2] = ImageEngine.clamp(r * 255);
        }
        const correction = ImageEngine.convolve(ratio, blurKernel, kernelSize);
        const cd = correction.data;
        for (let i = 0; i < ed.length; i += 4) {
          ed[i] = ImageEngine.clamp(ed[i] * cd[i] / 255);
          ed[i + 1] = ImageEngine.clamp(ed[i + 1] * cd[i + 1] / 255);
          ed[i + 2] = ImageEngine.clamp(ed[i + 2] * cd[i + 2] / 255);
        }
      }
      return estimate;
    }
  },

  /* ============================
   * 第8章 图像分割 (6个实验)
   * ============================ */

  'sobel': {
    title: 'Sobel边缘检测',
    description: '使用Sobel算子检测图像边缘，结合梯度幅值和方向信息',
    categoryName: '基础',
    category: 'basic',
    chapter: 8,
    sample: 'rice.bmp',
    caseText: 'Sobel算子是最经典的边缘检测算子之一，它结合了差分和平滑，对噪声有一定的抑制能力。在工业检测、车牌识别等应用中仍被广泛使用。',
    principle: 'Sobel水平核: [-1,0,1; -2,0,2; -1,0,1]。垂直核: [-1,-2,-1; 0,0,0; 1,2,2]。梯度幅值: G = sqrt(Gx^2 + Gy^2)。方向: theta = arctan(Gy/Gx)。相比简单差分，Sobel在垂直方向有平滑加权。',
    controls: [
      { key: 'threshold', label: '阈值', type: 'range', min: 10, max: 200, step: 10, default: 50 }
    ],
    run(imageData, { threshold = 50 } = {}) {
      return ImageEngine.sobelEdge(imageData, threshold);
    }
  },

  'canny': {
    title: 'Canny边缘检测',
    description: '实现Canny边缘检测器的核心步骤：高斯平滑、梯度计算、非极大值抑制',
    categoryName: '设计',
    category: 'design',
    chapter: 8,
    sample: 'rice.bmp',
    caseText: 'Canny边缘检测器在"好的检测、好的定位、单响应"三个准则下是最优的。它是目前实际应用中效果最好的传统边缘检测算法，广泛用于计算机视觉的特征提取。',
    principle: 'Canny步骤: 1) 高斯平滑去噪 2) Sobel梯度计算 3) 非极大值抑制(只保留局部最大值) 4) 双阈值检测(高低阈值连接边缘)。非极大值抑制使边缘只有一个像素宽。',
    controls: [
      { key: 'lowThresh', label: '低阈值', type: 'range', min: 10, max: 80, step: 5, default: 20 },
      { key: 'highThresh', label: '高阈值', type: 'range', min: 50, max: 200, step: 10, default: 80 }
    ],
    run(imageData, { lowThresh = 20, highThresh = 80 } = {}) {
      // Gaussian smooth
      const smooth = ImageEngine.convolve(imageData, [1,2,1, 2,4,2, 1,2,1], 16);
      // Sobel
      const sobel = ImageEngine.sobelEdge(smooth, lowThresh);
      // Threshold with high
      const out = ImageEngine.cloneImageData(sobel);
      const d = out.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = d[i] > highThresh ? 255 : (d[i] > lowThresh ? d[i] : 0);
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      return out;
    }
  },

  'threshold-seg': {
    title: '阈值分割',
    description: '使用Otsu自动阈值法或手动阈值进行图像二值分割',
    categoryName: '基础',
    category: 'basic',
    chapter: 8,
    sample: 'rice.bmp',
    caseText: '阈值分割是最简单直观的图像分割方法——将图像分为目标和背景两类。Otsu法自动选择使类间方差最大的阈值，在双峰直方图的图像上效果很好。',
    principle: 'Otsu法: T = argmax{w0(T)*w1(T)*[u0(T)-u1(T)]^2}。其中w0,w1为两类概率，u0,u1为两类均值。最大化类间方差等价于最小化类内方差。该方法假设直方图是双峰的。',
    controls: [
      { key: 'method', label: '阈值方法', type: 'select', options: ['手动阈值', 'Otsu自动'], default: 'Otsu自动' },
      { key: 'threshold', label: '手动阈值', type: 'range', min: 0, max: 255, step: 1, default: 128 }
    ],
    run(imageData, { method = 'Otsu自动', threshold: t = 128 } = {}) {
      if (method === 'Otsu自动') {
        const gray = ImageEngine.grayscale(imageData);
        const d = gray.data;
        const hist = new Array(256).fill(0);
        const N = d.length / 4;
        for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
        let sumAll = 0;
        for (let k = 0; k < 256; k++) sumAll += k * hist[k];
        let wB = 0, sumB = 0, maxVar = 0, bestT = 0;
        for (let k = 0; k < 256; k++) {
          wB += hist[k]; sumB += k * hist[k];
          const wF = N - wB;
          if (wB === 0 || wF === 0) continue;
          const mB = sumB / wB, mF = (sumAll - sumB) / wF;
          const between = wB * wF * (mB - mF) * (mB - mF);
          if (between > maxVar) { maxVar = between; bestT = k; }
        }
        return ImageEngine.thresholdSegment(imageData, bestT);
      }
      return ImageEngine.thresholdSegment(imageData, t);
    }
  },

  'region-grow': {
    title: '区域生长分割',
    description: '从种子点开始，将与种子灰度相似的相邻像素归入同一区域',
    categoryName: '设计',
    category: 'design',
    chapter: 8,
    sample: 'weld.jpg',
    caseText: '在焊缝检测中，区域生长可以从焊缝中心开始，逐步将灰度相近的相邻像素归入焊缝区域。该方法需要选择种子点和相似度阈值，适合分割灰度均匀的区域。',
    principle: '区域生长: 1) 选择种子点 2) 检查4邻域/8邻域像素 3) 若|灰度差|<阈值则归入区域 4) 对新加入的像素重复步骤2-3。该方法是"洪水填充"的灰度版本。',
    controls: [
      { key: 'seedX', label: '种子X(%)', type: 'range', min: 10, max: 90, step: 10, default: 50 },
      { key: 'seedY', label: '种子Y(%)', type: 'range', min: 10, max: 90, step: 10, default: 50 },
      { key: 'tolerance', label: '容差', type: 'range', min: 5, max: 50, step: 5, default: 20 }
    ],
    run(imageData, { seedX = 50, seedY = 50, tolerance = 20 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      const sx = Math.round(w * seedX / 100), sy = Math.round(h * seedY / 100);
      return ImageEngine.flood(gray, sx, sy, tolerance);
    }
  },

  'watershed': {
    title: '分水岭分割',
    description: '基于地形类比的图像分割方法，适用于粘连目标的分离',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 8,
    sample: 'rice.bmp',
    caseText: '在米粒计数中，粘连的米粒无法通过简单阈值分割。分水岭算法将灰度图像视为地形表面，通过模拟"浸水"过程找到自然分割线，能有效分离粘连目标。',
    principle: '分水岭: 将图像视为地形(灰度=海拔)，从局部极小值开始"注水"。当不同盆地的水相遇时筑坝——这些坝就是分水岭(分割线)。简化实现: 梯度图 + 距离变换 + 标记控制。',
    controls: [
      { key: 'threshold', label: '前景阈值', type: 'range', min: 50, max: 200, step: 10, default: 100 }
    ],
    run(imageData, { threshold = 100 } = {}) {
      // Simplified watershed using gradient + threshold
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      // Compute gradient magnitude
      const grad = new Float64Array(w * h);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const gx = d[(i + 1) * 4] - d[(i - 1) * 4];
          const gy = d[(i + w) * 4] - d[(i - w) * 4];
          grad[i] = Math.sqrt(gx * gx + gy * gy);
        }
      }
      // Threshold gradient to find boundaries
      const out = ImageEngine.cloneImageData(gray);
      const o = out.data;
      for (let i = 0; i < w * h; i++) {
        o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = grad[i] > threshold ? 255 : 0;
      }
      return out;
    }
  },

  'kmeans-seg': {
    title: 'K-means聚类分割',
    description: '使用K-means聚类算法将图像像素分为K个类别，实现无监督分割',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 8,
    sample: 'red-date-defect.jpg',
    caseText: 'K-means分割不需要预设阈值或种子点——它自动将像素按灰度(或颜色)聚类为K组。在红枣缺陷检测中，可以将像素分为正常、缺陷、背景等类别。',
    principle: 'K-means: 1) 随机选K个中心 2) 每个像素归入最近中心 3) 重新计算各类中心 4) 重复2-3直到收敛。收敛条件: 中心不再变化或变化小于阈值。复杂度O(N*K*iter)。',
    controls: [
      { key: 'K', label: '聚类数K', type: 'range', min: 2, max: 6, step: 1, default: 3 },
      { key: 'maxIter', label: '最大迭代', type: 'range', min: 5, max: 30, step: 5, default: 10 }
    ],
    run(imageData, { K = 3, maxIter = 10 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      const N = w * h;
      // Initialize centers
      const centers = new Float64Array(K);
      for (let k = 0; k < K; k++) centers[k] = (k + 0.5) * 256 / K;
      const labels = new Uint8Array(N);
      for (let iter = 0; iter < maxIter; iter++) {
        // Assign
        for (let i = 0; i < N; i++) {
          const v = d[i * 4];
          let minDist = Infinity, minK = 0;
          for (let k = 0; k < K; k++) {
            const dist = Math.abs(v - centers[k]);
            if (dist < minDist) { minDist = dist; minK = k; }
          }
          labels[i] = minK;
        }
        // Update centers
        const sums = new Float64Array(K), counts = new Float64Array(K);
        for (let i = 0; i < N; i++) {
          sums[labels[i]] += d[i * 4];
          counts[labels[i]]++;
        }
        for (let k = 0; k < K; k++) {
          if (counts[k] > 0) centers[k] = sums[k] / counts[k];
        }
      }
      // Color output
      const colors = [[0,0,255],[0,255,0],[255,0,0],[255,255,0],[0,255,255],[255,0,255]];
      const out = ImageEngine.cloneImageData(gray);
      const o = out.data;
      for (let i = 0; i < N; i++) {
        const c = colors[labels[i] % colors.length];
        o[i * 4] = c[0]; o[i * 4 + 1] = c[1]; o[i * 4 + 2] = c[2];
      }
      return out;
    }
  },

  /* ============================
   * 第9章 形态学处理 (6个实验)
   * ============================ */

  'erode': {
    title: '腐蚀操作',
    description: '对二值图像进行腐蚀操作，缩小目标区域并消除细小连接',
    categoryName: '基础',
    category: 'basic',
    chapter: 9,
    sample: 'rice.bmp',
    caseText: '腐蚀可以消除目标边缘的小突起和细线连接，在去除噪声点和分离粘连目标时非常有用。腐蚀后的目标面积会缩小。',
    principle: '腐蚀: A(-)B = {z | (B)z 包含于 A}。用结构元素B扫描图像，只有B完全覆盖目标像素时才保留中心点。等价于取邻域最小值(灰度腐蚀)。腐蚀可以消除小于结构元素的目标。',
    controls: [
      { key: 'threshold', label: '二值化阈值', type: 'range', min: 50, max: 200, step: 10, default: 128 },
      { key: 'radius', label: '结构元素半径', type: 'range', min: 1, max: 5, step: 1, default: 2 }
    ],
    run(imageData, { threshold = 128, radius = 2 } = {}) {
      const binary = ImageEngine.toBinary(imageData, threshold);
      return ImageEngine.morphology(binary, threshold, radius);
    }
  },

  'dilate': {
    title: '膨胀操作',
    description: '对二值图像进行膨胀操作，扩大目标区域并填充小孔洞',
    categoryName: '基础',
    category: 'basic',
    chapter: 9,
    sample: 'rice.bmp',
    caseText: '膨胀可以填充目标内部的小孔洞和裂缝，连接邻近的目标。在预处理中常与腐蚀配合使用——先膨胀填充孔洞，再腐蚀恢复大小。',
    principle: '膨胀: A(+)B = {z | (B^s)z 与 A 的交集非空}。用结构元素的反射扫描图像，只要B的任何元素覆盖目标像素就保留中心点。等价于取邻域最大值(灰度膨胀)。',
    controls: [
      { key: 'threshold', label: '二值化阈值', type: 'range', min: 50, max: 200, step: 10, default: 128 },
      { key: 'radius', label: '结构元素半径', type: 'range', min: 1, max: 5, step: 1, default: 2 }
    ],
    run(imageData, { threshold = 128, radius = 2 } = {}) {
      const binary = ImageEngine.toBinary(imageData, threshold);
      const w = binary.width, h = binary.height, d = binary.data;
      const out = ImageEngine.cloneImageData(binary);
      const o = out.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let maxVal = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                maxVal = Math.max(maxVal, d[(ny * w + nx) * 4]);
              }
            }
          }
          const i = (y * w + x) * 4;
          o[i] = o[i + 1] = o[i + 2] = maxVal;
        }
      }
      return out;
    }
  },

  'open-close': {
    title: '开闭运算',
    description: '开运算(先腐蚀后膨胀)和闭运算(先膨胀后腐蚀)的组合操作',
    categoryName: '基础',
    category: 'basic',
    chapter: 9,
    sample: 'rice.bmp',
    caseText: '开运算可以消除目标中细小的突出部分和窄的连接，同时基本保持目标大小不变。闭运算则填充目标中的小孔洞，连接邻近目标。它们是形态学中最实用的组合操作。',
    principle: '开运算: A.B = (A(-)B)(+)B。先腐蚀消除小目标，再膨胀恢复。闭运算: A.B = (A(+)B)(-)B。先膨胀填充孔洞，再腐蚀恢复。开运算去噪，闭运算填孔。',
    controls: [
      { key: 'operation', label: '运算类型', type: 'select', options: ['开运算', '闭运算'], default: '开运算' },
      { key: 'threshold', label: '二值化阈值', type: 'range', min: 50, max: 200, step: 10, default: 128 },
      { key: 'radius', label: '结构元素半径', type: 'range', min: 1, max: 5, step: 1, default: 2 }
    ],
    run(imageData, { operation = '开运算', threshold = 128, radius = 2 } = {}) {
      const binary = ImageEngine.toBinary(imageData, threshold);
      if (operation === '开运算') {
        return ImageEngine.morphology(binary, threshold, radius);
      }
      // Close = dilate then erode
      const w = binary.width, h = binary.height, d = binary.data;
      // Dilate
      const dilated = ImageEngine.cloneImageData(binary);
      const dd = dilated.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let maxVal = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) maxVal = Math.max(maxVal, d[(ny * w + nx) * 4]);
            }
          }
          dd[(y * w + x) * 4] = maxVal;
        }
      }
      // Erode
      return ImageEngine.morphology(dilated, threshold, radius);
    }
  },

  'morph-edge': {
    title: '形态学边缘检测',
    description: '利用形态学膨胀和腐蚀的差值来提取目标边缘',
    categoryName: '设计',
    category: 'design',
    chapter: 9,
    sample: 'rice.bmp',
    caseText: '形态学边缘检测相比梯度方法，对噪声更鲁棒且产生的边缘更细。在工业零件检测中，形态学边缘可以准确提取工件轮廓。',
    principle: '形态学梯度: 外梯度 = (A(+)B) - A，内梯度 = A - (A(-)B)，对称梯度 = (A(+)B) - (A(-)B)。外梯度得到目标外侧边缘，内梯度得到内侧边缘。',
    controls: [
      { key: 'threshold', label: '二值化阈值', type: 'range', min: 50, max: 200, step: 10, default: 128 },
      { key: 'radius', label: '结构元素半径', type: 'range', min: 1, max: 3, step: 1, default: 1 }
    ],
    run(imageData, { threshold = 128, radius = 1 } = {}) {
      const binary = ImageEngine.toBinary(imageData, threshold);
      const w = binary.width, h = binary.height, d = binary.data;
      // Dilate
      const dil = new Float64Array(w * h);
      const ero = new Float64Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let maxV = 0, minV = 255;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const v = d[(ny * w + nx) * 4];
                maxV = Math.max(maxV, v);
                minV = Math.min(minV, v);
              }
            }
          }
          dil[y * w + x] = maxV;
          ero[y * w + x] = minV;
        }
      }
      // Gradient = dilate - erode
      const out = ImageEngine.cloneImageData(binary);
      const o = out.data;
      for (let i = 0; i < w * h; i++) {
        const v = ImageEngine.clamp(dil[i] - ero[i]);
        o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = v;
      }
      return out;
    }
  },

  'skeleton': {
    title: '骨架提取',
    description: '通过迭代细化算法提取目标的中心骨架线',
    categoryName: '设计',
    category: 'design',
    chapter: 9,
    sample: 'rice.bmp',
    caseText: '骨架保留了目标的拓扑结构(连通性)和形状信息，同时大幅减少数据量。在字符识别、指纹识别、血管分析中，骨架提取是关键预处理步骤。',
    principle: 'Zhang-Suen细化: 迭代删除满足以下条件的边界像素: 1) 有2-6个非零邻域 2) 01转换恰好1次 3) 特定方向条件。交替两个子迭代直到不再变化。骨架 = 各次腐蚀结果的并集。',
    controls: [
      { key: 'threshold', label: '二值化阈值', type: 'range', min: 50, max: 200, step: 10, default: 128 }
    ],
    run(imageData, { threshold = 128 } = {}) {
      const binary = ImageEngine.toBinary(imageData, threshold);
      const w = binary.width, h = binary.height, d = binary.data;
      const img = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) img[i] = d[i * 4] > threshold ? 1 : 0;
      // Zhang-Suen thinning
      let changed = true;
      while (changed) {
        changed = false;
        for (let sub = 0; sub < 2; sub++) {
          const toRemove = [];
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              if (img[y * w + x] !== 1) continue;
              const p = [
                img[(y-1)*w+x], img[(y-1)*w+x+1], img[y*w+x+1], img[(y+1)*w+x+1],
                img[(y+1)*w+x], img[(y+1)*w+x-1], img[y*w+x-1], img[(y-1)*w+x-1]
              ];
              const sum = p.reduce((a, b) => a + b, 0);
              if (sum < 2 || sum > 6) continue;
              let transitions = 0;
              for (let i = 0; i < 8; i++) {
                if (p[i] === 0 && p[(i + 1) % 8] === 1) transitions++;
              }
              if (transitions !== 1) continue;
              if (sub === 0) {
                if (p[0] * p[2] * p[4] === 0 && p[2] * p[4] * p[6] === 0) toRemove.push(y * w + x);
              } else {
                if (p[0] * p[2] * p[6] === 0 && p[0] * p[4] * p[6] === 0) toRemove.push(y * w + x);
              }
            }
          }
          if (toRemove.length > 0) changed = true;
          for (const idx of toRemove) img[idx] = 0;
        }
      }
      const out = ImageEngine.cloneImageData(binary);
      const o = out.data;
      for (let i = 0; i < w * h; i++) {
        const v = img[i] ? 255 : 0;
        o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = v;
      }
      return out;
    }
  },

  'tophat': {
    title: '顶帽与底帽变换',
    description: '顶帽变换提取比周围亮的小目标，底帽变换提取比周围暗的小目标',
    categoryName: '设计',
    category: 'design',
    chapter: 9,
    sample: 'weld.jpg',
    caseText: '在焊缝X射线检测中，顶帽变换可以突出焊缝中的小缺陷(气孔、夹渣)——这些缺陷比周围区域略亮或略暗。顶帽 = 原图 - 开运算，消除大范围背景变化后保留小目标。',
    principle: '顶帽: TopHat(f) = f - f.B (原图减去开运算)。底帽: BottomHat(f) = f.B - f (闭运算减去原图)。顶帽提取比背景亮的小特征，底帽提取比背景暗的小特征。',
    controls: [
      { key: 'type', label: '变换类型', type: 'select', options: ['顶帽变换', '底帽变换'], default: '顶帽变换' },
      { key: 'threshold', label: '二值化阈值', type: 'range', min: 50, max: 200, step: 10, default: 128 },
      { key: 'radius', label: '结构元素半径', type: 'range', min: 2, max: 8, step: 1, default: 4 }
    ],
    run(imageData, { type = '顶帽变换', threshold = 128, radius = 4 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      // Opening: erode then dilate
      const eroded = new Float64Array(w * h);
      const opened = new Float64Array(w * h);
      // Erode
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let minV = 255;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) minV = Math.min(minV, d[(ny * w + nx) * 4]);
            }
          }
          eroded[y * w + x] = minV;
        }
      }
      // Dilate eroded
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let maxV = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) maxV = Math.max(maxV, eroded[ny * w + nx]);
            }
          }
          opened[y * w + x] = maxV;
        }
      }
      // Closed: dilate then erode
      const dilated = new Float64Array(w * h);
      const closed = new Float64Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let maxV = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) maxV = Math.max(maxV, d[(ny * w + nx) * 4]);
            }
          }
          dilated[y * w + x] = maxV;
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let minV = 255;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) minV = Math.min(minV, dilated[ny * w + nx]);
            }
          }
          closed[y * w + x] = minV;
        }
      }
      const out = ImageEngine.cloneImageData(gray);
      const o = out.data;
      for (let i = 0; i < w * h; i++) {
        const orig = d[i * 4];
        const v = type === '顶帽变换'
          ? ImageEngine.clamp(orig - opened[i] + 128)
          : ImageEngine.clamp(closed[i] - orig + 128);
        o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = v;
      }
      return out;
    }
  },

  /* ============================
   * 第10章 特征提取 (6个实验)
   * ============================ */

  'histogram-feature': {
    title: '直方图特征提取',
    description: '从灰度直方图中计算统计特征：均值、方差、偏度、峰度、熵',
    categoryName: '基础',
    category: 'basic',
    chapter: 10,
    sample: 'rice.bmp',
    caseText: '直方图统计特征是图像分类中最简单的特征描述子。均值反映亮度，方差反映对比度，偏度反映分布不对称性，峰度反映尖锐程度，熵反映信息量。',
    principle: '均值: u = sum(k*p(k))。方差: sigma^2 = sum((k-u)^2*p(k))。偏度: s = sum((k-u)^3*p(k))/sigma^3。峰度: kurt = sum((k-u)^4*p(k))/sigma^4 - 3。熵: H = -sum(p(k)*log2(p(k)))。',
    controls: [],
    run(imageData) {
      const gray = ImageEngine.grayscale(imageData);
      const d = gray.data;
      const hist = new Array(256).fill(0);
      const N = d.length / 4;
      for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
      const p = hist.map(h => h / N);
      let mean = 0;
      for (let k = 0; k < 256; k++) mean += k * p[k];
      let variance = 0;
      for (let k = 0; k < 256; k++) variance += (k - mean) ** 2 * p[k];
      const sigma = Math.sqrt(variance);
      let skew = 0, kurt = 0;
      if (sigma > 0) {
        for (let k = 0; k < 256; k++) {
          const z = (k - mean) / sigma;
          skew += z ** 3 * p[k];
          kurt += z ** 4 * p[k];
        }
      }
      let entropy = 0;
      for (let k = 0; k < 256; k++) if (p[k] > 0) entropy -= p[k] * Math.log2(p[k]);
      // Visualize as info card
      const outW = 300, outH = 120;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      ctx.fillStyle = '#00d2ff'; ctx.font = '14px monospace';
      ctx.fillText('Mean: ' + mean.toFixed(2), 10, 25);
      ctx.fillText('Variance: ' + variance.toFixed(2), 10, 45);
      ctx.fillText('StdDev: ' + sigma.toFixed(2), 10, 65);
      ctx.fillText('Skewness: ' + skew.toFixed(4), 10, 85);
      ctx.fillText('Kurtosis: ' + (kurt - 3).toFixed(4), 10, 105);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('Entropy: ' + entropy.toFixed(4), 170, 25);
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'glcm': {
    title: '灰度共生矩阵(GLCM)',
    description: '计算灰度共生矩阵并提取纹理特征：能量、对比度、相关性、熵',
    categoryName: '设计',
    category: 'design',
    chapter: 10,
    sample: 'logs.jpg',
    caseText: 'GLCM是纹理分析的经典方法。在木材分类中，不同树种的纹理有不同的GLCM特征——年轮清晰的木材对比度高，纹理细腻的木材能量高。',
    principle: 'GLCM: P(i,j,d,theta) = #{(x1,y1),(x2,y2) | f(x1,y1)=i, f(x2,y2)=j, 距离d, 方向theta}。能量 = sum(P^2)，对比度 = sum((i-j)^2*P)，相关性 = 像素对线性相关程度。',
    controls: [
      { key: 'distance', label: '距离d', type: 'range', min: 1, max: 5, step: 1, default: 1 },
      { key: 'angle', label: '方向', type: 'select', options: ['0度', '45度', '90度', '135度'], default: '0度' }
    ],
    run(imageData, { distance = 1, angle = '0度' } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      // Quantize to 16 levels for efficiency
      const q = v => Math.min(15, Math.floor(v / 16));
      const glcm = new Float64Array(16 * 16);
      const offsets = {
        '0度': [distance, 0], '45度': [distance, -distance],
        '90度': [0, distance], '135度': [-distance, -distance]
      };
      const [dx, dy] = offsets[angle] || [distance, 0];
      let total = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const i = q(d[(y * w + x) * 4]);
            const j = q(d[(ny * w + nx) * 4]);
            glcm[i * 16 + j]++;
            total++;
          }
        }
      }
      // Normalize
      if (total > 0) for (let i = 0; i < 256; i++) glcm[i] /= total;
      // Features
      let energy = 0, contrast = 0, entropy = 0;
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
          const p = glcm[i * 16 + j];
          energy += p * p;
          contrast += (i - j) ** 2 * p;
          if (p > 0) entropy -= p * Math.log2(p);
        }
      }
      // Display
      const outW = 256, outH = 200;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      // Draw GLCM matrix
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
          const v = Math.round(glcm[i * 16 + j] * 255 * 16);
          ctx.fillStyle = 'rgb(' + Math.min(255, v) + ',' + Math.min(255, v) + ',' + Math.min(255, v) + ')';
          ctx.fillRect(j * 8 + 10, i * 8 + 10, 8, 8);
        }
      }
      ctx.fillStyle = '#00d2ff'; ctx.font = '12px monospace';
      ctx.fillText('Energy: ' + energy.toFixed(4), 150, 30);
      ctx.fillText('Contrast: ' + contrast.toFixed(4), 150, 50);
      ctx.fillText('Entropy: ' + entropy.toFixed(4), 150, 70);
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'edge-feature': {
    title: '边缘特征统计',
    description: '检测边缘并统计边缘密度、平均长度、方向分布等特征',
    categoryName: '基础',
    category: 'basic',
    chapter: 10,
    sample: 'rice.bmp',
    caseText: '边缘特征反映了图像的结构复杂度。边缘密度高说明纹理丰富，边缘方向分布可以判断纹理的主方向。在图像分类和场景理解中非常有用。',
    principle: '边缘密度 = 边缘像素数 / 总像素数。边缘方向直方图: 统计各方向的边缘数量分布。Canny边缘后通过Hough变换可以进一步提取直线和圆等几何特征。',
    controls: [
      { key: 'threshold', label: '边缘阈值', type: 'range', min: 20, max: 150, step: 10, default: 50 }
    ],
    run(imageData, { threshold = 50 } = {}) {
      const edge = ImageEngine.sobelEdge(imageData, threshold);
      const w = edge.width, h = edge.height, d = edge.data;
      let edgeCount = 0;
      const dirHist = new Array(8).fill(0);
      const gray = ImageEngine.grayscale(imageData);
      const gd = gray.data;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (d[(y * w + x) * 4] > threshold) {
            edgeCount++;
            const gx = gd[(y * w + x + 1) * 4] - gd[(y * w + x - 1) * 4];
            const gy = gd[((y + 1) * w + x) * 4] - gd[((y - 1) * w + x) * 4];
            let angle = Math.atan2(gy, gx) * 180 / Math.PI;
            if (angle < 0) angle += 180;
            const bin = Math.floor(angle / 22.5) % 8;
            dirHist[bin]++;
          }
        }
      }
      const density = edgeCount / (w * h);
      // Visualize
      const outW = 256, outH = 180;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      ctx.fillStyle = '#00d2ff'; ctx.font = '13px monospace';
      ctx.fillText('Edge Count: ' + edgeCount, 10, 25);
      ctx.fillText('Density: ' + (density * 100).toFixed(2) + '%', 10, 45);
      const maxDir = Math.max(...dirHist, 1);
      ctx.fillStyle = '#ff6b6b';
      for (let i = 0; i < 8; i++) {
        const barH = Math.round((dirHist[i] / maxDir) * 80);
        ctx.fillRect(10 + i * 30, 160 - barH, 25, barH);
      }
      ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
      for (let i = 0; i < 8; i++) ctx.fillText((i * 22.5).toFixed(0) + '', 12 + i * 30, 175);
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'region-feature': {
    title: '区域特征描述',
    description: '分割后提取各连通区域的面积、周长、圆形度、离心率等形状特征',
    categoryName: '设计',
    category: 'design',
    chapter: 10,
    sample: 'rice.bmp',
    caseText: '在米粒品质检测中，通过区域特征可以自动分类: 完整米粒面积适中、圆形度较高，碎粒面积小，杂质形状不规则。区域特征是目标分类的基础。',
    principle: '面积 = 区域内像素数。周长 = 边界像素数。圆形度 = 4*pi*A/P^2 (越接近1越圆)。离心率 = 1-(b/a)^2 (a,b为等效椭圆长短轴)。紧凑度 = P^2/(4*pi*A)。',
    controls: [
      { key: 'threshold', label: '分割阈值', type: 'range', min: 50, max: 200, step: 10, default: 100 }
    ],
    run(imageData, { threshold = 100 } = {}) {
      const binary = ImageEngine.thresholdSegment(imageData, threshold);
      const count = ImageEngine.connectedCount(binary);
      const w = binary.width, h = binary.height, d = binary.data;
      // Label regions with BFS
      const labels = new Int32Array(w * h).fill(-1);
      let regionId = 0;
      const regions = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (d[idx * 4] > 128 && labels[idx] === -1) {
            const region = { pixels: 0, minX: w, minY: h, maxX: 0, maxY: 0, boundary: 0 };
            const queue = [idx];
            labels[idx] = regionId;
            while (queue.length > 0) {
              const ci = queue.shift();
              const cx = ci % w, cy = Math.floor(ci / w);
              region.pixels++;
              region.minX = Math.min(region.minX, cx);
              region.minY = Math.min(region.minY, cy);
              region.maxX = Math.max(region.maxX, cx);
              region.maxY = Math.max(region.maxY, cy);
              let isBoundary = false;
              for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h || d[(ny * w + nx) * 4] <= 128) {
                  isBoundary = true;
                } else if (labels[ny * w + nx] === -1) {
                  labels[ny * w + nx] = regionId;
                  queue.push(ny * w + nx);
                }
              }
              if (isBoundary) region.boundary++;
            }
            regions.push(region);
            regionId++;
          }
        }
      }
      // Display top regions
      const outW = 320, outH = 200;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      ctx.fillStyle = '#00d2ff'; ctx.font = '12px monospace';
      ctx.fillText('Regions: ' + regions.length, 10, 20);
      regions.sort((a, b) => b.pixels - a.pixels);
      for (let i = 0; i < Math.min(6, regions.length); i++) {
        const r = regions[i];
        const circularity = r.boundary > 0 ? (4 * Math.PI * r.pixels / (r.boundary * r.boundary)) : 0;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('R' + i + ': A=' + r.pixels + ' P=' + r.boundary + ' C=' + circularity.toFixed(2), 10, 40 + i * 22);
      }
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'hough': {
    title: 'Hough直线检测',
    description: '使用Hough变换检测图像中的直线，输出直线参数和检测结果',
    categoryName: '设计',
    category: 'design',
    chapter: 10,
    sample: 'logs.jpg',
    caseText: '在木材加工中，检测原木的直线边缘对于自动定位和切割非常重要。Hough变换将图像空间中的直线检测问题转换为参数空间中的峰值搜索问题。',
    principle: '直线参数化: rho = x*cos(theta) + y*sin(theta)。Hough空间H(rho,theta)对每个边缘点累加。峰值对应的(rho,theta)即为检测到的直线。该方法对断裂直线和噪声鲁棒。',
    controls: [
      { key: 'edgeThresh', label: '边缘阈值', type: 'range', min: 20, max: 100, step: 10, default: 50 },
      { key: 'voteThresh', label: '投票阈值', type: 'range', min: 20, max: 100, step: 5, default: 40 }
    ],
    run(imageData, { edgeThresh = 50, voteThresh = 40 } = {}) {
      const edge = ImageEngine.sobelEdge(imageData, edgeThresh);
      const w = edge.width, h = edge.height, d = edge.data;
      const maxRho = Math.ceil(Math.sqrt(w * w + h * h));
      const thetaSteps = 180;
      const accumulator = new Float64Array(maxRho * 2 * thetaSteps);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4] > edgeThresh) {
            for (let t = 0; t < thetaSteps; t++) {
              const theta = t * Math.PI / thetaSteps;
              const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta));
              accumulator[(rho + maxRho) * thetaSteps + t]++;
            }
          }
        }
      }
      // Draw detected lines on original
      const out = ImageEngine.cloneImageData(imageData);
      const o = out.data;
      let lineCount = 0;
      for (let r = 0; r < maxRho * 2; r++) {
        for (let t = 0; t < thetaSteps; t++) {
          if (accumulator[r * thetaSteps + t] >= voteThresh) {
            const rho = r - maxRho;
            const theta = t * Math.PI / thetaSteps;
            const cosT = Math.cos(theta), sinT = Math.sin(theta);
            lineCount++;
            if (lineCount > 20) break;
            for (let step = 0; step < Math.max(w, h); step++) {
              let px, py;
              if (Math.abs(sinT) > Math.abs(cosT)) {
                px = step; py = Math.round((rho - step * cosT) / sinT);
              } else {
                py = step; px = Math.round((rho - step * sinT) / cosT);
              }
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const i = (py * w + px) * 4;
                o[i] = 255; o[i + 1] = 0; o[i + 2] = 0;
              }
            }
          }
        }
      }
      return out;
    }
  },

  'template': {
    title: '模板匹配',
    description: '使用归一化互相关在图像中搜索与模板最相似的区域',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 10,
    sample: 'rice.bmp',
    caseText: '模板匹配是最简单的目标定位方法——用一个小的模板图像在大的搜索图像中滑动，计算每个位置的相似度。在工业定位、字符识别中有广泛应用。',
    principle: 'NCC(归一化互相关): NCC = sum(T*I) / (sqrt(sum(T^2)) * sqrt(sum(I^2)))。NCC范围[-1,1]，1表示完全匹配。对亮度和对比度变化具有一定的鲁棒性。',
    controls: [
      { key: 'tplSize', label: '模板大小(%)', type: 'range', min: 10, max: 40, step: 5, default: 20 },
      { key: 'tplX', label: '模板X(%)', type: 'range', min: 10, max: 70, step: 10, default: 30 },
      { key: 'tplY', label: '模板Y(%)', type: 'range', min: 10, max: 70, step: 10, default: 30 }
    ],
    run(imageData, { tplSize = 20, tplX = 30, tplY = 30 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      const tw = Math.round(w * tplSize / 100), th = Math.round(h * tplSize / 100);
      const tx = Math.round(w * tplX / 100), ty = Math.round(h * tplY / 100);
      // Extract template
      const tpl = new Float64Array(tw * th);
      let tplMean = 0;
      for (let y = 0; y < th; y++) {
        for (let x = 0; x < tw; x++) {
          tpl[y * tw + x] = d[((ty + y) * w + (tx + x)) * 4];
          tplMean += tpl[y * tw + x];
        }
      }
      tplMean /= (tw * th);
      let tplVar = 0;
      for (let i = 0; i < tw * th; i++) tplVar += (tpl[i] - tplMean) ** 2;
      tplVar = Math.sqrt(tplVar);
      // Search
      let bestNCC = -1, bestX = 0, bestY = 0;
      for (let sy = 0; sy <= h - th; sy += 2) {
        for (let sx = 0; sx <= w - tw; sx += 2) {
          let sum = 0, mean = 0;
          for (let y = 0; y < th; y++) {
            for (let x = 0; x < tw; x++) mean += d[((sy + y) * w + (sx + x)) * 4];
          }
          mean /= (tw * th);
          let imgVar = 0;
          for (let y = 0; y < th; y++) {
            for (let x = 0; x < tw; x++) {
              const iv = d[((sy + y) * w + (sx + x)) * 4] - mean;
              const tv = tpl[y * tw + x] - tplMean;
              sum += iv * tv;
              imgVar += iv * iv;
            }
          }
          imgVar = Math.sqrt(imgVar);
          const ncc = (tplVar > 0 && imgVar > 0) ? sum / (tplVar * imgVar) : 0;
          if (ncc > bestNCC) { bestNCC = ncc; bestX = sx; bestY = sy; }
        }
      }
      // Draw rectangle
      const out = ImageEngine.cloneImageData(imageData);
      const o = out.data;
      for (let x = bestX; x < bestX + tw; x++) {
        for (const y of [bestY, bestY + th - 1]) {
          if (y >= 0 && y < h && x >= 0 && x < w) {
            const i = (y * w + x) * 4;
            o[i] = 0; o[i + 1] = 255; o[i + 2] = 0;
          }
        }
      }
      for (let y = bestY; y < bestY + th; y++) {
        for (const x of [bestX, bestX + tw - 1]) {
          if (y >= 0 && y < h && x >= 0 && x < w) {
            const i = (y * w + x) * 4;
            o[i] = 0; o[i + 1] = 255; o[i + 2] = 0;
          }
        }
      }
      return out;
    }
  },

  /* ============================
   * 第11章 综合应用 (5个实验)
   * ============================ */

  'batch': {
    title: '批量图像处理',
    description: '对多张图像执行相同的处理流水线，实现自动化批量处理',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 11,
    sample: 'rice.bmp',
    caseText: '在工业生产线中，需要对大量图像执行相同的处理流程(如质检)。批量处理通过预设的处理流水线自动处理每一张图像，提高效率并保证一致性。',
    principle: '批量处理流水线: 对每张图像执行 [灰度化 -> 去噪 -> 增强 -> 分割 -> 特征提取] 的标准流程。流水线的设计需要考虑通用性和鲁棒性，参数应自适应调整。',
    controls: [
      { key: 'pipeline', label: '处理流水线', type: 'select', options: ['灰度+增强+分割', '去噪+锐化+边缘'], default: '灰度+增强+分割' }
    ],
    run(imageData, { pipeline = '灰度+增强+分割' } = {}) {
      let result = imageData;
      if (pipeline === '灰度+增强+分割') {
        result = ImageEngine.grayscale(result);
        result = ImageEngine.histogramEqualize(result);
        // Auto threshold (Otsu)
        const d = result.data;
        const hist = new Array(256).fill(0);
        const N = d.length / 4;
        for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
        let sumAll = 0;
        for (let k = 0; k < 256; k++) sumAll += k * hist[k];
        let wB = 0, sumB = 0, maxVar = 0, bestT = 128;
        for (let k = 0; k < 256; k++) {
          wB += hist[k]; sumB += k * hist[k];
          const wF = N - wB;
          if (wB === 0 || wF === 0) continue;
          const mB = sumB / wB, mF = (sumAll - sumB) / wF;
          if (wB * wF * (mB - mF) ** 2 > maxVar) { maxVar = wB * wF * (mB - mF) ** 2; bestT = k; }
        }
        result = ImageEngine.thresholdSegment(result, bestT);
      } else {
        result = ImageEngine.convolve(result, [1,2,1, 2,4,2, 1,2,1], 16);
        const lapKernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];
        const lap = ImageEngine.convolve(result, lapKernel, 1);
        const sharpened = ImageEngine.cloneImageData(result);
        const sd = sharpened.data, ld = lap.data;
        for (let i = 0; i < sd.length; i += 4) {
          sd[i] = ImageEngine.clamp(sd[i] + ld[i]);
          sd[i + 1] = ImageEngine.clamp(sd[i + 1] + ld[i + 1]);
          sd[i + 2] = ImageEngine.clamp(sd[i + 2] + ld[i + 2]);
        }
        result = ImageEngine.sobelEdge(sharpened, 50);
      }
      return result;
    }
  },

  'weld': {
    title: '焊缝缺陷检测',
    description: '对焊缝X射线图像进行缺陷自动检测，识别气孔、裂纹等缺陷',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 11,
    sample: 'weld.jpg',
    caseText: '焊缝X射线检测是工业质量控制的重要环节。通过图像增强突出缺陷区域，再用形态学处理和阈值分割提取缺陷，最后统计缺陷数量和面积。',
    principle: '检测流程: 1) 对比度增强(CLAHE) 2) 平滑去噪 3) 顶帽变换突出暗缺陷 4) 阈值分割 5) 连通域分析统计缺陷数量和面积。',
    controls: [
      { key: 'enhance', label: '增强强度', type: 'range', min: 1, max: 3, step: 0.5, default: 1.5 },
      { key: 'defectThresh', label: '缺陷阈值', type: 'range', min: 20, max: 100, step: 10, default: 50 }
    ],
    run(imageData, { enhance = 1.5, defectThresh = 50 } = {}) {
      let result = ImageEngine.grayscale(imageData);
      // Enhance contrast
      result = ImageEngine.histogramEqualize(result);
      // Smooth
      result = ImageEngine.convolve(result, [1,2,1, 2,4,2, 1,2,1], 16);
      // Invert for dark defect detection
      result = ImageEngine.pointTransform(result, v => 255 - v);
      // Threshold
      result = ImageEngine.thresholdSegment(result, 255 - defectThresh);
      // Count defects
      const count = ImageEngine.connectedCount(result);
      // Draw count info
      const w = result.width, h = result.height;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h + 30;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(result, 0, 0);
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, h, w, 30);
      ctx.fillStyle = '#ff6b6b'; ctx.font = '14px sans-serif';
      ctx.fillText('Detected defects: ' + count, 10, h + 20);
      return ctx.getImageData(0, 0, w, h + 30);
    }
  },

  'logcount': {
    title: '原木计数系统',
    description: '对原木截面图像进行自动计数，利用形态学分离和连通域分析',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 11,
    sample: 'logs.jpg',
    caseText: '在木材加工场，需要快速准确地统计原木数量。通过图像处理自动计数，可以替代人工清点，提高效率。核心挑战是分离粘连的原木截面。',
    principle: '计数流程: 1) 灰度化 2) 阈值分割得到二值图像 3) 开运算分离粘连目标 4) 连通域标记 5) 统计连通域数量。开运算的半径应略小于最小目标间距。',
    controls: [
      { key: 'threshold', label: '分割阈值', type: 'range', min: 50, max: 200, step: 10, default: 100 },
      { key: 'separateRadius', label: '分离半径', type: 'range', min: 1, max: 5, step: 1, default: 3 }
    ],
    run(imageData, { threshold = 100, separateRadius = 3 } = {}) {
      let result = ImageEngine.grayscale(imageData);
      result = ImageEngine.thresholdSegment(result, threshold);
      // Open to separate touching logs
      result = ImageEngine.morphology(result, threshold, separateRadius);
      const count = ImageEngine.connectedCount(result);
      const w = result.width, h = result.height;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h + 30;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(result, 0, 0);
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, h, w, 30);
      ctx.fillStyle = '#00d2ff'; ctx.font = '14px sans-serif';
      ctx.fillText('Log count: ' + count, 10, h + 20);
      return ctx.getImageData(0, 0, w, h + 30);
    }
  },

  'datesort': {
    title: '红枣缺陷分选',
    description: '对红枣图像进行缺陷检测和等级分类，实现自动化品质分选',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 11,
    sample: 'red-date-defect.jpg',
    caseText: '红枣品质分选需要检测表面缺陷(虫蛀、霉变、裂纹)并按缺陷面积分级。该实验综合运用灰度化、通道分析、阈值分割、形态学和区域特征提取。',
    principle: '分选流程: 1) 提取红色通道(缺陷在绿色通道更明显) 2) 自适应阈值分割 3) 形态学开运算去噪 4) 连通域分析统计缺陷 5) 按缺陷面积比分级: 优(0-5%)、良(5-15%)、差(>15%)。',
    controls: [
      { key: 'goodThresh', label: '优品上限(%)', type: 'range', min: 2, max: 10, step: 1, default: 5 },
      { key: 'fairThresh', label: '良品上限(%)', type: 'range', min: 10, max: 25, step: 5, default: 15 }
    ],
    run(imageData, { goodThresh = 5, fairThresh = 15 } = {}) {
      // Use green channel where defects are more visible
      const green = ImageEngine.colorChannel(imageData, 'green');
      const w = green.width, h = green.height, d = green.data;
      // Invert (defects are darker)
      const inv = ImageEngine.pointTransform(green, v => 255 - v);
      // Threshold
      const binary = ImageEngine.thresholdSegment(inv, 100);
      // Morphological opening
      const cleaned = ImageEngine.morphology(binary, 100, 2);
      // Count defect pixels
      const cd = cleaned.data;
      let defectPixels = 0, totalPixels = w * h;
      for (let i = 0; i < cd.length; i += 4) {
        if (cd[i] > 128) defectPixels++;
      }
      const defectRatio = (defectPixels / totalPixels) * 100;
      let grade = '优';
      if (defectRatio > fairThresh) grade = '差';
      else if (defectRatio > goodThresh) grade = '良';
      // Color the output
      const out = ImageEngine.cloneImageData(cleaned);
      const o = out.data;
      const gradeColor = grade === '优' ? [0, 255, 0] : grade === '良' ? [255, 255, 0] : [255, 0, 0];
      // Add grade bar
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h + 40;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(out, 0, 0);
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, h, w, 40);
      ctx.fillStyle = 'rgb(' + gradeColor.join(',') + ')';
      ctx.font = '16px sans-serif';
      ctx.fillText('Grade: ' + grade + ' (Defect: ' + defectRatio.toFixed(1) + '%)', 10, h + 25);
      return ctx.getImageData(0, 0, w, h + 40);
    }
  },

  'panorama': {
    title: '全景图像拼接',
    description: '模拟两幅有重叠区域的图像拼接，理解特征匹配和图像融合',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 11,
    sample: 'dehaze-sweden.jpg',
    caseText: '全景拼接通过检测相邻图像的重叠区域，找到最佳拼接缝并进行无缝融合。在地图制作、虚拟现实中广泛应用。简化版使用水平平移和线性融合。',
    principle: '拼接流程: 1) 特征点检测(SIFT/ORB) 2) 特征匹配 3) 估计变换矩阵 4) 图像变换对齐 5) 融合(加权平均消除接缝)。简化版: 直接将图像复制到右侧，重叠区域做alpha混合。',
    controls: [
      { key: 'overlap', label: '重叠比例(%)', type: 'range', min: 10, max: 50, step: 5, default: 30 },
      { key: 'blendWidth', label: '融合宽度(%)', type: 'range', min: 5, max: 30, step: 5, default: 15 }
    ],
    run(imageData, { overlap = 30, blendWidth = 15 } = {}) {
      const w = imageData.width, h = imageData.height, d = imageData.data;
      const overlapPx = Math.round(w * overlap / 100);
      const blendPx = Math.round(w * blendWidth / 100);
      const outW = w * 2 - overlapPx;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const out = ctx.createImageData(outW, h);
      const o = out.data;
      // Left image
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const si = (y * w + x) * 4;
          const di = (y * outW + x) * 4;
          o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = 255;
        }
      }
      // Right image (shifted, with slight color variation to simulate different shot)
      const rightStart = w - overlapPx;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const outX = rightStart + x;
          if (outX >= outW) continue;
          const si = (y * w + x) * 4;
          const di = (y * outW + outX) * 4;
          if (x < blendPx && outX < w) {
            // Blend zone
            const alpha = x / blendPx;
            o[di] = Math.round(o[di] * (1 - alpha) + d[si] * alpha);
            o[di + 1] = Math.round(o[di + 1] * (1 - alpha) + d[si + 1] * alpha);
            o[di + 2] = Math.round(o[di + 2] * (1 - alpha) + d[si + 2] * alpha);
          } else {
            o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = 255;
          }
        }
      }
      ctx.putImageData(out, 0, 0);
      return ctx.getImageData(0, 0, outW, h);
    }
  },

  /* ============================
   * 第12章 进阶研究 (5个实验)
   * ============================ */

  'region-desc': {
    title: '区域描述子',
    description: '计算区域的Hu不变矩、边界傅里叶描述子等高级形状描述子',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 12,
    sample: 'rice.bmp',
    caseText: '区域描述子用于目标识别和分类。Hu不变矩对平移、旋转、缩放具有不变性，是形状识别的经典特征。边界傅里叶描述子可以紧凑地表示复杂形状。',
    principle: '几何矩: m_pq = sum(x^p * y^q * f(x,y))。中心矩: u_pq = sum((x-xc)^p * (y-yc)^q * f(x,y))。Hu矩由7个不变矩组合构成，对仿射变换不变。傅里叶描述子: 对边界坐标做DFT。',
    controls: [
      { key: 'threshold', label: '分割阈值', type: 'range', min: 50, max: 200, step: 10, default: 100 }
    ],
    run(imageData, { threshold = 100 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      // Compute moments for foreground region
      let m00 = 0, m10 = 0, m01 = 0, m20 = 0, m11 = 0, m02 = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4] > threshold) {
            m00++; m10 += x; m01 += y; m20 += x * x; m11 += x * y; m02 += y * y;
          }
        }
      }
      const xc = m00 > 0 ? m10 / m00 : 0, yc = m00 > 0 ? m01 / m00 : 0;
      // Central moments
      let u20 = 0, u11 = 0, u02 = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4] > threshold) {
            u20 += (x - xc) ** 2; u11 += (x - xc) * (y - yc); u02 += (y - yc) ** 2;
          }
        }
      }
      const eta20 = m00 > 0 ? u20 / m00 ** 2 : 0;
      const eta11 = m00 > 0 ? u11 / m00 ** 2 : 0;
      const eta02 = m00 > 0 ? u02 / m00 ** 2 : 0;
      const hu1 = eta20 + eta02;
      const hu2 = (eta20 - eta02) ** 2 + 4 * eta11 ** 2;
      // Display
      const outW = 300, outH = 140;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      ctx.fillStyle = '#00d2ff'; ctx.font = '13px monospace';
      ctx.fillText('Area (m00): ' + m00, 10, 25);
      ctx.fillText('Centroid: (' + xc.toFixed(1) + ', ' + yc.toFixed(1) + ')', 10, 45);
      ctx.fillText('Hu1: ' + hu1.toFixed(6), 10, 70);
      ctx.fillText('Hu2: ' + hu2.toFixed(6), 10, 90);
      ctx.fillText('Eccentricity: ' + (u02 > u20 ? Math.sqrt(1 - u20 / (u02 || 1)) : Math.sqrt(1 - u02 / (u20 || 1))).toFixed(4), 10, 115);
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'boundary-desc': {
    title: '边界描述子',
    description: '提取目标边界并计算链码、傅里叶描述子等边界特征',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 12,
    sample: 'rice.bmp',
    caseText: '边界描述子用于形状识别——不同物体的边界形状不同。傅里叶描述子将复杂的边界曲线表示为有限个频率分量，是形状匹配的高效方法。',
    principle: '边界跟踪: 8邻域链码编码边界方向序列。傅里叶描述子: 将边界坐标(x(s),y(s))表示为复数z(s)=x(s)+jy(s)，对z(s)做DFT。低频分量描述整体形状，高频分量描述细节。',
    controls: [
      { key: 'threshold', label: '分割阈值', type: 'range', min: 50, max: 200, step: 10, default: 100 },
      { key: 'descriptors', label: '描述子数', type: 'range', min: 4, max: 20, step: 2, default: 8 }
    ],
    run(imageData, { threshold = 100, descriptors = 8 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      // Find boundary pixels
      const boundary = [];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (d[idx * 4] > threshold) {
            let isBoundary = false;
            for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
              if (d[((y + dy) * w + (x + dx)) * 4] <= threshold) { isBoundary = true; break; }
            }
            if (isBoundary) boundary.push({ x, y });
          }
        }
      }
      // Compute Fourier descriptors (simplified)
      const N = Math.min(boundary.length, 500);
      const fd = new Array(descriptors).fill(0);
      if (N > 0) {
        for (let k = 0; k < descriptors; k++) {
          let reSum = 0, imSum = 0;
          for (let n = 0; n < N; n++) {
            const angle = -2 * Math.PI * k * n / N;
            reSum += boundary[n].x * Math.cos(angle) - boundary[n].y * Math.sin(angle);
            imSum += boundary[n].x * Math.sin(angle) + boundary[n].y * Math.cos(angle);
          }
          fd[k] = Math.sqrt(reSum * reSum + imSum * imSum) / N;
        }
      }
      // Display
      const outW = 300, outH = 160;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      ctx.fillStyle = '#00d2ff'; ctx.font = '13px monospace';
      ctx.fillText('Boundary pixels: ' + boundary.length, 10, 25);
      ctx.fillText('Fourier Descriptors (|F_k|):', 10, 50);
      ctx.fillStyle = '#ff6b6b';
      const maxFD = Math.max(...fd, 1);
      for (let k = 0; k < descriptors; k++) {
        const barW = Math.round((fd[k] / maxFD) * 150);
        ctx.fillRect(10, 60 + k * 12, barW, 10);
        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
        ctx.fillText('F' + k + ':' + fd[k].toFixed(1), 170, 70 + k * 12);
        ctx.fillStyle = '#ff6b6b';
      }
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'moments': {
    title: '图像矩分析',
    description: '计算图像的几何矩和中心矩，用于目标定位和形状分析',
    categoryName: '设计',
    category: 'design',
    chapter: 12,
    sample: 'rice.bmp',
    caseText: '图像矩是图像处理中的基础数学工具。零阶矩给出面积，一阶矩给出质心，二阶矩给出方向性。在机器人视觉中，矩用于目标跟踪和姿态估计。',
    principle: '空间矩: m_pq = sum_x sum_y x^p * y^q * f(x,y)。质心: (xc, yc) = (m10/m00, m01/m00)。方向角: theta = 0.5 * atan(2*u11/(u20-u02))。等效椭圆: a=sqrt(2*(u20+u02+sqrt((u20-u02)^2+4u11^2))/m00)。',
    controls: [
      { key: 'threshold', label: '目标阈值', type: 'range', min: 50, max: 200, step: 10, default: 100 }
    ],
    run(imageData, { threshold = 100 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      let m00 = 0, m10 = 0, m01 = 0, m20 = 0, m11 = 0, m02 = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4] > threshold) {
            m00++; m10 += x; m01 += y; m20 += x * x; m11 += x * y; m02 += y * y;
          }
        }
      }
      if (m00 === 0) return ImageEngine.cloneImageData(gray);
      const xc = m10 / m00, yc = m01 / m00;
      const u20 = m20 - m00 * xc * xc;
      const u11 = m11 - m00 * xc * yc;
      const u02 = m02 - m00 * yc * yc;
      const theta = 0.5 * Math.atan2(2 * u11, u20 - u02);
      // Draw on image
      const out = ImageEngine.cloneImageData(imageData);
      const o = out.data;
      // Draw centroid cross
      const cx = Math.round(xc), cy = Math.round(yc);
      for (let dx = -10; dx <= 10; dx++) {
        const px = cx + dx, py = cy;
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const i = (py * w + px) * 4;
          o[i] = 0; o[i + 1] = 255; o[i + 2] = 0;
        }
      }
      for (let dy = -10; dy <= 10; dy++) {
        const px = cx, py = cy + dy;
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const i = (py * w + px) * 4;
          o[i] = 0; o[i + 1] = 255; o[i + 2] = 0;
        }
      }
      // Draw orientation line
      const len = 50;
      for (let t = -len; t <= len; t++) {
        const px = Math.round(cx + t * Math.cos(theta));
        const py = Math.round(cy + t * Math.sin(theta));
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const i = (py * w + px) * 4;
          o[i] = 255; o[i + 1] = 0; o[i + 2] = 0;
        }
      }
      return out;
    }
  },

  'classify': {
    title: '图像分类识别',
    description: '基于提取的特征对图像区域进行简单分类(最近邻分类器)',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 12,
    sample: 'red-date-defect.jpg',
    caseText: '图像分类是计算机视觉的核心任务。本实验使用手工特征(灰度统计+GLCM+边缘密度)和最近邻分类器，展示传统机器学习方法的基本原理。',
    principle: '特征向量: F = [mean, std, energy, contrast, edgeDensity]。KNN分类: 对测试样本找训练集中K个最近邻，投票决定类别。距离度量: 欧氏距离 d = sqrt(sum((fi-gi)^2))。',
    controls: [
      { key: 'K', label: '近邻数K', type: 'range', min: 1, max: 5, step: 1, default: 3 }
    ],
    run(imageData, { K = 3 } = {}) {
      const gray = ImageEngine.grayscale(imageData);
      const w = gray.width, h = gray.height, d = gray.data;
      // Extract features
      let mean = 0, variance = 0;
      const N = w * h;
      for (let i = 0; i < d.length; i += 4) mean += d[i];
      mean /= N;
      for (let i = 0; i < d.length; i += 4) variance += (d[i] - mean) ** 2;
      variance = Math.sqrt(variance / N);
      // Edge density
      const edge = ImageEngine.sobelEdge(imageData, 50);
      let edgeCount = 0;
      for (let i = 0; i < edge.data.length; i += 4) if (edge.data[i] > 50) edgeCount++;
      const edgeDensity = edgeCount / N;
      // Simulated training data (3 classes)
      const classes = [
        { name: '光滑表面', features: [120, 30, 0.8, 20, 0.05] },
        { name: '纹理表面', features: [100, 50, 0.3, 80, 0.15] },
        { name: '缺陷表面', features: [80, 60, 0.2, 150, 0.25] }
      ];
      const testFeatures = [mean, variance, 0.5, 50, edgeDensity * 100];
      // KNN
      const distances = classes.map(c => {
        let dist = 0;
        for (let i = 0; i < 5; i++) dist += (testFeatures[i] - c.features[i]) ** 2;
        return { name: c.name, dist: Math.sqrt(dist) };
      });
      distances.sort((a, b) => a.dist - b.dist);
      const predicted = distances[0].name;
      // Display
      const outW = 300, outH = 150;
      const canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, outW, outH);
      ctx.fillStyle = '#00d2ff'; ctx.font = '14px monospace';
      ctx.fillText('Predicted: ' + predicted, 10, 25);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Distances:', 10, 50);
      for (let i = 0; i < distances.length; i++) {
        ctx.fillText(distances[i].name + ': ' + distances[i].dist.toFixed(2), 10, 70 + i * 20);
      }
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('Features: mean=' + mean.toFixed(0) + ' std=' + variance.toFixed(0), 10, 140);
      return ctx.getImageData(0, 0, outW, outH);
    }
  },

  'pipeline': {
    title: '完整处理流水线',
    description: '构建从图像输入到结果输出的完整处理流水线，集成多种算法',
    categoryName: '综合',
    category: 'comprehensive',
    chapter: 12,
    sample: 'rice.bmp',
    caseText: '一个完整的图像处理系统包含: 预处理(去噪、增强)、分割(阈值、边缘)、特征提取(面积、形状)、后处理(形态学)和决策(计数、分类)。本实验集成全流程。',
    principle: '流水线: 输入 -> 灰度化 -> 高斯去噪 -> 直方图均衡 -> Otsu分割 -> 形态学开运算 -> 连通域标记 -> 特征提取 -> 结果输出。每一步都影响后续步骤，需要全局优化。',
    controls: [
      { key: 'denoiseLevel', label: '去噪级别', type: 'range', min: 1, max: 3, step: 1, default: 1 },
      { key: 'morphRadius', label: '形态学半径', type: 'range', min: 1, max: 4, step: 1, default: 2 }
    ],
    run(imageData, { denoiseLevel = 1, morphRadius = 2 } = {}) {
      // Step 1: Grayscale
      let result = ImageEngine.grayscale(imageData);
      // Step 2: Denoise (multiple passes based on level)
      for (let i = 0; i < denoiseLevel; i++) {
        result = ImageEngine.convolve(result, [1,2,1, 2,4,2, 1,2,1], 16);
      }
      // Step 3: Histogram equalize
      result = ImageEngine.histogramEqualize(result);
      // Step 4: Otsu threshold
      const d = result.data;
      const hist = new Array(256).fill(0);
      const N = d.length / 4;
      for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
      let sumAll = 0;
      for (let k = 0; k < 256; k++) sumAll += k * hist[k];
      let wB = 0, sumB = 0, maxVar = 0, bestT = 128;
      for (let k = 0; k < 256; k++) {
        wB += hist[k]; sumB += k * hist[k];
        const wF = N - wB;
        if (wB === 0 || wF === 0) continue;
        const mB = sumB / wB, mF = (sumAll - sumB) / wF;
        if (wB * wF * (mB - mF) ** 2 > maxVar) { maxVar = wB * wF * (mB - mF) ** 2; bestT = k; }
      }
      result = ImageEngine.thresholdSegment(result, bestT);
      // Step 5: Morphological opening
      result = ImageEngine.morphology(result, bestT, morphRadius);
      // Step 6: Connected components count
      const count = ImageEngine.connectedCount(result);
      // Step 7: Output with info overlay
      const w = result.width, h = result.height;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h + 50;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(result, 0, 0);
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, h, w, 50);
      ctx.fillStyle = '#00d2ff'; ctx.font = '12px monospace';
      ctx.fillText('Pipeline: Gray -> Denoise(x' + denoiseLevel + ') -> HistEq -> Otsu(' + bestT + ') -> Open(r=' + morphRadius + ')', 10, h + 20);
      ctx.fillStyle = '#ff6b6b'; ctx.font = '14px sans-serif';
      ctx.fillText('Objects detected: ' + count, 10, h + 42);
      return ctx.getImageData(0, 0, w, h + 50);
    }
  }
};

