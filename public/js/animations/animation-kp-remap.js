/**
 * Animation KP-ID Remap — fixes KP IDs to match the actual database.
 * MUST load after all animation modules.
 *
 * Some animation modules register at "guess" KP IDs that don't match the DB.
 * Additionally, newer modules may overwrite earlier registrations at the same IDs.
 * This file saves factory references, clears wrong IDs, and re-registers correctly.
 *
 * ─── Registration conflicts handled here ───
 *   hist-eq  [19,20]   overwritten by hist-spec [18,19,20]
 *   hist-spec [18,19,20] overwritten by bit-plane at 19, gamma-log-transform at 18
 *   convolution [31-34] overwritten by lowpass-filters [31-33] + highpass [34,35]
 *   fft [41-45]         overwritten by inverse-wiener [41,42] + geometric [43,44] + color-models [45-47]
 *   pseudocolor [48]    overwritten by color-space-convert [48,50]; re-register at 49
 *   edge-detect [60-63] overwritten by threshold at [62,63]
 *   erode-dilate [70,71]  wrong IDs (DB has 72,73)
 *   open-close [72,73]    wrong IDs (DB has 74,75)
 *
 * ─── Correct KP IDs from the database ───
 *    2: 采样与量化               → sampling-quantization
 *    5: 图像质量评价             → image-quality
 *   12: 像素邻域                 → pixel-neighborhood
 *   13: 灰度直方图定义           → gray-histogram
 *   14: 直方图均衡化(CDF)        → hist-eq
 *   15: 直方图规定化             → hist-spec
 *   16: 线性灰度变换             → gamma-log-transform
 *   17: 非线性灰度变换           → gamma-log-transform
 *   18: 分段灰度变换             → gamma-log-transform
 *   19: 位平面切片               → bit-plane
 *   21: 空间滤波基础(卷积)       → convolution
 *   22: 均值滤波                 → mean-median-gaussian
 *   23: 中值滤波                 → mean-median-gaussian
 *   24: 高斯滤波                 → mean-median-gaussian
 *   25: 拉普拉斯锐化             → laplacian-sharpen
 *   26: 非锐化掩蔽               → unsharp-masking
 *   27: Sobel/Prewitt算子       → edge-compare
 *   28: 滤波核设计原则           → filter-kernel
 *   29: 傅里叶变换原理           → fft
 *   30: 频谱分析与可视化         → fft
 *   31: 理想低通滤波器           → lowpass-filters
 *   32: 巴特沃斯低通滤波器       → lowpass-filters
 *   33: 高斯低通滤波器           → lowpass-filters
 *   34: 高通滤波器               → highpass-filters
 *   35: 带通带阻滤波器           → highpass-filters
 *   37: 图像退化模型             → degradation-model
 *   38: 噪声类型                 → noise-types
 *   40: 运动模糊                 → degradation-model
 *   41: 逆滤波                   → inverse-wiener
 *   42: 维纳滤波                 → inverse-wiener
 *   43: 几何失真校正             → geometric-correction
 *   44: 图像配准                 → geometric-correction
 *   45: RGB颜色模型              → color-models
 *   46: HSV颜色模型              → color-models
 *   47: YCbCr颜色模型            → color-models
 *   48: 彩色空间转换             → color-space-convert
 *   49: 伪彩色处理               → pseudocolor
 *   50: 全彩色图像处理           → color-space-convert
 *   52: 白平衡与色彩校正         → white-balance
 *   54: 霍夫曼编码               → huffman
 *   55: 行程编码(RLE)            → rle
 *   56: 算术编码                 → arithmetic-coding
 *   57: DCT变换编码              → dct
 *   59: JPEG标准流程             → jpeg-pipeline
 *   61: 阈值分割基础             → threshold
 *   62: Otsu自动阈值             → threshold
 *   63: 自适应阈值               → threshold
 *   64: Sobel边缘检测            → edge-detect
 *   65: Canny边缘检测            → edge-detect
 *   66: 霍夫变换(直线/圆)        → hough
 *   67: 区域生长                 → region-growing
 *   68: 区域分裂合并             → region-split-merge
 *   69: 分水岭分割               → watershed
 *   72: 腐蚀运算                 → erode-dilate
 *   73: 膨胀运算                 → erode-dilate
 *   74: 开运算                   → open-close
 *   75: 闭运算                   → open-close
 *   76: 击中击不中变换           → hit-miss
 *   77: 边界提取                 → morph-boundary-fill
 *   78: 孔洞填充                 → morph-boundary-fill
 *   79: 骨架化/细化              → skeleton
 *   80: 连通分量标记             → connected-component
 *   81: Harris角点检测           → harris
 *   82: HOG特征                  → hog
 *   84: 灰度共生矩阵(GLCM)      → glcm
 *   85: 局部二值模式(LBP)        → lbp
 *   89: 边界描述(链码)           → chain-code
 *   93: 模板匹配                 → template-matching
 *   96: PCA降维                  → pca
 *  105: 区域分裂合并             → region-split-merge
 *  106: 击中击不中变换           → hit-miss
 */
(function () {
  var reg = window.__conceptAnimations;
  if (!reg) return;

  // ── Save factory references before clearing ──
  // hist-eq: registered at [19,20], overwritten by hist-spec then bit-plane.
  //          Saved by hist-eq-anim.js on window.
  var histEq     = window.__histEqFactory;
  // hist-spec: registered at [18,19,20], but gamma-log-transform overwrites 18,
  //            bit-plane overwrites 19. Saved by hist-spec-anim.js on window.
  var histSpec   = window.__histSpecFactory;
  // bit-plane: registered at [19], last writer at that slot.
  var bitPlane   = reg[19];
  // convolution: registered at [31-34], overwritten by lowpass/highpass.
  //              Saved by convolution-anim.js on window.
  var conv       = window.__convFactory;
  // fft: registered at [41-45], overwritten by inverse-wiener/geometric/color-models.
  //      Saved by fft-anim.js on window.
  var fft        = window.__fftFactory;
  // pseudocolor: registered at [48], overwritten by color-space-convert.
  //              Saved by pseudocolor-anim.js on window.
  var pseudocolor = window.__pseudocolorFactory;
  // edge-detect: registered at [60,61,62,63]. reg[60] survives (threshold overwrites 62,63).
  var edgeDetect = reg[60];
  // threshold: registered at [62,63,64], last writer at those slots.
  var threshold  = reg[62];
  // erode-dilate: registered at [70,71] — not overwritten, just wrong IDs.
  var erodeDilate = reg[70];
  // open-close: registered at [72,73] — not overwritten, just wrong IDs.
  var openClose   = reg[72];

  // ── Clear all wrong registrations ──
  // Note: KP 31-34 were originally convolution, now correctly held by lowpass/highpass.
  //       KP 41-45 were originally fft, now correctly held by inverse-wiener/geometric/color-models.
  //       Only clear IDs where the current registration is WRONG and needs re-mapping.
  var wrongIds = [
    19, 20,                           // hist-eq/bit-plane intermediate (18 is correct: gamma-log-transform)
    60, 61, 62, 63, 64,               // edge-detect/threshold intermediate
    70, 71, 72, 73                    // erode-dilate/open-close wrong IDs
  ];
  wrongIds.forEach(function (id) { delete reg[id]; });

  // ── Re-register with CORRECT KP IDs ──
  if (histEq) {
    registerAnimation(14, histEq);           // 直方图均衡化
  }
  if (histSpec) {
    registerAnimation(15, histSpec);         // 直方图规定化
  }
  if (bitPlane) {
    registerAnimation(19, bitPlane);         // 位平面切片
  }
  if (conv) {
    registerAnimation(21, conv);             // 空间滤波基础(卷积)
  }
  if (fft) {
    registerAnimation(29, fft);                // 傅里叶变换原理
    registerAnimation(30, fft);                // 频谱分析与可视化
  }
  if (pseudocolor) {
    registerAnimation(49, pseudocolor);      // 伪彩色处理
  }
  if (threshold) {
    registerAnimation(61, threshold);        // 阈值分割基础
    registerAnimation(62, threshold);        // Otsu自动阈值
    registerAnimation(63, threshold);        // 自适应阈值
  }
  if (edgeDetect) {
    registerAnimation(64, edgeDetect);       // Sobel边缘检测
    registerAnimation(65, edgeDetect);       // Canny边缘检测
  }
  if (erodeDilate) {
    registerAnimation(72, erodeDilate);      // 腐蚀运算
    registerAnimation(73, erodeDilate);      // 膨胀运算
  }
  if (openClose) {
    registerAnimation(74, openClose);        // 开运算
    registerAnimation(75, openClose);        // 闭运算
  }

  console.log('[Animations] Remap complete — ' + Object.keys(reg).length + ' animation(s) registered for KP IDs: ' + Object.keys(reg).sort(function(a,b){return a-b}).join(', '));
})();
