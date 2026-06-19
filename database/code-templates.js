/**
 * code-templates.js — Python/Octave code templates for all experiments
 * Each entry: { python, octave, requirements, aiHints, difficulty }
 */

// Helper to build AI hints JSON
function H(prompt, apis, tips, approach) {
  return JSON.stringify({ prompt, apis, tips, approach });
}

// Shorthand template builder
function T(py, oc, req, hints, diff) {
  return { python: py, octave: oc, requirements: req, ai_hints: hints, difficulty: diff || 2 };
}

// ===================== PYTHON TEMPLATES =====================

const PY = {
  // --- Chapter 1: 概述 ---
  gray: `# 图像灰度化
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cv2.imwrite('result.png', gray)
info(原图尺寸=img.shape, 灰度尺寸=gray.shape, 均值=round(gray.mean(), 1))`,

  'channel-split': `# 通道分离
img = imread_color()
b, g, r = cv2.split(img)
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
axes[0].imshow(r, cmap='Reds'); axes[0].set_title('Red')
axes[1].imshow(g, cmap='Greens'); axes[1].set_title('Green')
axes[2].imshow(b, cmap='Blues'); axes[2].set_title('Blue')
for ax in axes: ax.axis('off')
plt.tight_layout()
savefig(fig, 'result')`,

  resize: `# 图像缩放
img = imread_color()
h, w = img.shape[:2]
# 缩小到一半
small = cv2.resize(img, (w//2, h//2), interpolation=cv2.INTER_LINEAR)
# 放大到两倍
big = cv2.resize(img, (w*2, h*2), interpolation=cv2.INTER_CUBIC)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img, small, big], ['原图', '0.5x', '2x']):
    ax.imshow(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)); ax.set_title(f'{t} {im.shape[:2]}'); ax.axis('off')
savefig(fig, 'result')`,

  crop: `# 图像裁剪
img = imread_color()
h, w = img.shape[:2]
# 裁剪中心区域
cx, cy = w//4, h//4
cropped = img[cy:h-cy, cx:w-cx]
cv2.imwrite('result.png', cropped)
info(原图尺寸=img.shape, 裁剪后=cropped.shape)`,

  histogram: `# 直方图计算与显示
gray = imread_gray()
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.imshow(gray, cmap='gray'); ax1.set_title('原图'); ax1.axis('off')
ax2.hist(gray.ravel(), 256, [0, 256], color='#6366f1')
ax2.set_title('灰度直方图'); ax2.set_xlabel('灰度值'); ax2.set_ylabel('像素数')
plt.tight_layout()
savefig(fig, 'result')`,

  noise: `# 噪声添加
img = imread_gray().astype(np.float64)
# 高斯噪声
gauss = np.random.normal(0, 15, img.shape)
noisy_gauss = np.clip(img + gauss, 0, 255).astype(np.uint8)
# 椒盐噪声
noisy_sp = img.copy().astype(np.uint8)
n = int(0.02 * img.size)
for _ in range(n):
    y, x = np.random.randint(0, img.shape[0]), np.random.randint(0, img.shape[1])
    noisy_sp[y, x] = np.random.choice([0, 255])
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img.astype(np.uint8), noisy_gauss, noisy_sp], ['原图', '高斯噪声', '椒盐噪声']):
    ax.imshow(im, cmap='gray'); ax.set_title(t); ax.axis('off')
savefig(fig, 'result')`,

  // --- Chapter 2: 基础运算 ---
  translate: `# 图像平移
img = imread_color()
h, w = img.shape[:2]
M = np.float32([[1, 0, 50], [0, 1, 30]])  # x+50, y+30
result = cv2.warpAffine(img, M, (w, h))
cv2.imwrite('result.png', result)`,

  rotate: `# 图像旋转
img = imread_color()
h, w = img.shape[:2]
M = cv2.getRotationMatrix2D((w/2, h/2), 45, 1.0)  # 旋转45度
result = cv2.warpAffine(img, M, (w, h))
cv2.imwrite('result.png', result)`,

  flip: `# 图像翻转
img = imread_color()
h_flip = cv2.flip(img, 1)   # 水平翻转
v_flip = cv2.flip(img, 0)   # 垂直翻转
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img, h_flip, v_flip], ['原图', '水平翻转', '垂直翻转']):
    ax.imshow(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)); ax.set_title(t); ax.axis('off')
savefig(fig, 'result')`,

  affine: `# 仿射变换（剪切）
img = imread_color()
h, w = img.shape[:2]
pts1 = np.float32([[0,0],[w,0],[0,h]])
pts2 = np.float32([[w*0.1,0],[w,0],[0,h]])
M = cv2.getAffineTransform(pts1, pts2)
result = cv2.warpAffine(img, M, (w, h))
cv2.imwrite('result.png', result)`,

  projection: `# 投影变换
img = imread_color()
h, w = img.shape[:2]
pts1 = np.float32([[50,50],[w-50,50],[50,h-50],[w-50,h-50]])
pts2 = np.float32([[0,0],[w,0],[0,h],[w,h]])
M = cv2.getPerspectiveTransform(pts1, pts2)
result = cv2.warpPerspective(img, M, (w, h))
cv2.imwrite('result.png', result)`,

  // --- Chapter 3: 基本运算 ---
  invert: `# 图像反色
gray = imread_gray()
result = 255 - gray
cv2.imwrite('result.png', result)
info(原图均值=gray.mean(), 反色均值=result.mean())`,

  gamma: `# 伽马校正
gray = imread_gray().astype(np.float64) / 255.0
gamma = 0.5  # < 1 提亮, > 1 压暗
corrected = np.power(gray, gamma)
corrected = (corrected * 255).astype(np.uint8)
cv2.imwrite('result.png', corrected)`,

  'contrast-stretch': `# 对比度拉伸
gray = imread_gray()
min_val, max_val = gray.min(), gray.max()
result = ((gray.astype(np.float64) - min_val) / (max_val - min_val) * 255).astype(np.uint8)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.hist(gray.ravel(), 256, [0,256], color='#94a3b8'); ax1.set_title('原图直方图')
ax2.hist(result.ravel(), 256, [0,256], color='#6366f1'); ax2.set_title('拉伸后直方图')
plt.tight_layout()
savefig(fig, 'result')
cv2.imwrite('result2.png', result)`,

  threshold: `# 灰度阈值处理
gray = imread_gray()
thresh_val = 128
_, binary = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY)
cv2.imwrite('result.png', binary)
info(阈值=thresh_val, 前景像素=np.sum(binary > 0), 背景像素=np.sum(binary == 0))`,

  quantize: `# 多级别量化
gray = imread_gray()
levels = 8
quantized = (gray // (256 // levels)) * (256 // levels)
cv2.imwrite('result.png', quantized)
info(量化级别=levels, 实际灰度数=len(np.unique(quantized)))`,

  // --- Chapter 4: 空间域增强 ---
  smooth: `# 平滑滤波对比：均值/中值/高斯
img = imread_color()
# 均值滤波
mean_blur = cv2.blur(img, (5, 5))
# 中值滤波
median_blur = cv2.medianBlur(img, 5)
# 高斯滤波
gauss_blur = cv2.GaussianBlur(img, (5, 5), 1.0)
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(cv2.cvtColor(mean_blur, cv2.COLOR_BGR2RGB)); axes[0,1].set_title('均值滤波 5x5'); axes[0,1].axis('off')
axes[1,0].imshow(cv2.cvtColor(median_blur, cv2.COLOR_BGR2RGB)); axes[1,0].set_title('中值滤波 5x5'); axes[1,0].axis('off')
axes[1,1].imshow(cv2.cvtColor(gauss_blur, cv2.COLOR_BGR2RGB)); axes[1,1].set_title('高斯滤波 5x5'); axes[1,1].axis('off')
savefig(fig, 'result')
info(均值滤波方差=mean_blur.var(), 中值滤波方差=median_blur.var())`,

  sharpen: `# 图像锐化：拉普拉斯 + USM
img = imread_color()
# 拉普拉斯锐化
lap_kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
lap_sharp = cv2.filter2D(img, -1, lap_kernel)
# USM锐化：高斯模糊→差值→叠加
blurred = cv2.GaussianBlur(img, (0,0), 3)
usm_sharp = cv2.addWeighted(img, 1.5, blurred, -0.5, 0)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img, lap_sharp, usm_sharp], ['原图', '拉普拉斯锐化', 'USM锐化']):
    ax.imshow(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)); ax.set_title(t); ax.axis('off')
savefig(fig, 'result')
info(原图方差=img.var(), 拉普拉斯方差=lap_sharp.var(), USM方差=usm_sharp.var())`,

  denoise: `# 图像去噪
img = imread_color()
result = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
cv2.imwrite('result.png', result)`,

  gradient: `# 图像梯度计算（Sobel x/y方向 + 梯度幅值）
gray = imread_gray()
# Sobel x方向梯度
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
# Sobel y方向梯度
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
# 梯度幅值
magnitude = np.sqrt(sobelx**2 + sobely**2)
mag_norm = np.clip(magnitude / magnitude.max() * 255, 0, 255).astype(np.uint8)
# 梯度方向
angle = np.arctan2(sobely, sobelx) * 180 / np.pi
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(np.abs(sobelx), cmap='gray'); axes[0,1].set_title('X方向梯度'); axes[0,1].axis('off')
axes[1,0].imshow(np.abs(sobely), cmap='gray'); axes[1,0].set_title('Y方向梯度'); axes[1,0].axis('off')
axes[1,1].imshow(mag_norm, cmap='gray'); axes[1,1].set_title('梯度幅值'); axes[1,1].axis('off')
savefig(fig, 'result')
info(梯度均值=magnitude.mean(), 梯度最大值=magnitude.max())`,

  directional: `# 方向滤波（不同角度方向核的效果对比）
gray = imread_gray()
# 设计不同角度的方向检测核
kernels = {
    '水平(0°)': np.array([[-1,-1,-1],[2,2,2],[-1,-1,-1]]),
    '垂直(90°)': np.array([[-1,2,-1],[-1,2,-1],[-1,2,-1]]),
    '对角(45°)': np.array([[2,-1,-1],[-1,2,-1],[-1,-1,2]]),
    '对角(135°)': np.array([[-1,-1,2],[-1,2,-1],[2,-1,-1]])
}
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
for ax, (name, kernel) in zip(axes.flat, kernels.items()):
    # 应用方向滤波
    filtered = cv2.filter2D(gray, cv2.CV_64F, kernel)
    filtered = np.abs(filtered)
    filtered = np.clip(filtered / filtered.max() * 255, 0, 255).astype(np.uint8)
    ax.imshow(filtered, cmap='gray'); ax.set_title(name); ax.axis('off')
savefig(fig, 'result')
info(说明='方向核可提取特定角度边缘特征')`,

  emboss: `# 浮雕效果（方向导数+偏移）
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float64)
# 不同方向的浮雕核（方向导数 + 中心偏移128）
emboss_kernels = {
    '左上': np.array([[-2,-1,0],[-1,1,1],[0,1,2]]),
    '正上': np.array([[-1,-1,-1],[0,1,0],[1,1,1]]),
    '右侧': np.array([[-1,0,1],[-1,0,1],[-1,0,1]])
}
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')
for ax, (name, kernel) in zip([axes[0,1], axes[1,0], axes[1,1]], emboss_kernels.items()):
    result = cv2.filter2D(gray, -1, kernel) + 128
    result = np.clip(result, 0, 255).astype(np.uint8)
    ax.imshow(result, cmap='gray'); ax.set_title(f'浮雕-{name}'); ax.axis('off')
savefig(fig, 'result')
info(说明='浮雕效果=方向导数+灰度偏移128')`,

  // --- Chapter 5: 频率域 ---
  fft: `# 二维傅里叶变换与频谱分析
gray = imread_gray()
# 二维FFT并中心化
f = np.fft.fft2(gray.astype(np.float64))
fshift = np.fft.fftshift(f)
# 幅度谱（对数压缩）
magnitude = np.log1p(np.abs(fshift))
mag_norm = (magnitude / magnitude.max() * 255).astype(np.uint8)
# 相位谱
phase = np.angle(fshift)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(mag_norm, cmap='gray'); axes[1].set_title('频谱(对数)'); axes[1].axis('off')
axes[2].imshow(phase, cmap='twilight'); axes[2].set_title('相位谱'); axes[2].axis('off')
savefig(fig, 'result')
info(图像尺寸=gray.shape, 频谱最大值=magnitude.max())`,

  'lowpass-freq': `# 频域低通滤波（理想/巴特沃斯/高斯对比）
gray = imread_gray()
f = np.fft.fftshift(np.fft.fft2(gray.astype(np.float64)))
h, w = gray.shape
# 距离矩阵
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)
D0 = 30  # 截止频率
# 理想低通
H_ideal = (D <= D0).astype(np.float64)
# 巴特沃斯低通（2阶）
H_butter = 1.0 / (1 + (D / D0)**4)
# 高斯低通
H_gauss = np.exp(-D**2 / (2 * D0**2))
fig, axes = plt.subplots(2, 3, figsize=(14, 8))
for ax, (H, name) in zip(axes.flat, [(H_ideal,'理想'),(H_butter,'巴特沃斯'),(H_gauss,'高斯')]):
    filtered = np.abs(np.fft.ifft2(np.fft.ifftshift(f * H)))
    filtered = np.clip(filtered, 0, 255).astype(np.uint8)
    ax.imshow(filtered, cmap='gray'); ax.set_title(f'{name}低通'); ax.axis('off')
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
# 显示滤波器形状
axes[1,0].plot(H_ideal[h//2,:]); axes[1,0].plot(H_butter[h//2,:]); axes[1,0].plot(H_gauss[h//2,:])
axes[1,0].set_title('滤波器截面'); axes[1,0].legend(['理想','巴特沃斯','高斯'])
savefig(fig, 'result')`,

  'highpass-freq': `# 频域高通滤波（理想/巴特沃斯/高斯对比）
gray = imread_gray()
f = np.fft.fftshift(np.fft.fft2(gray.astype(np.float64)))
h, w = gray.shape
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)
D0 = 30  # 截止频率
# 三种高通滤波器：HPF = 1 - LPF
H_ideal = (D > D0).astype(np.float64)
H_butter = 1.0 / (1 + (D0 / (D + 1e-10))**4)
H_gauss = 1 - np.exp(-D**2 / (2 * D0**2))
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, (H, name) in zip(axes, [(H_ideal,'理想'),(H_butter,'巴特沃斯'),(H_gauss,'高斯')]):
    filtered = np.abs(np.fft.ifft2(np.fft.ifftshift(f * H)))
    filtered = np.clip(filtered, 0, 255).astype(np.uint8)
    ax.imshow(filtered, cmap='gray'); ax.set_title(f'{name}高通'); ax.axis('off')
savefig(fig, 'result')
info(说明='高通滤波保留边缘和细节，抑制平滑区域')`,

  'bandpass-freq': `# 频域带通滤波（选择特定频率范围）
gray = imread_gray()
f = np.fft.fftshift(np.fft.fft2(gray.astype(np.float64)))
h, w = gray.shape
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)
# 带通范围：D1 < D < D2
D1, D2 = 20, 60
H_band = ((D >= D1) & (D <= D2)).astype(np.float64)
# 应用带通滤波
f_filtered = f * H_band
result = np.abs(np.fft.ifft2(np.fft.ifftshift(f_filtered)))
result = np.clip(result / result.max() * 255, 0, 255).astype(np.uint8)
# 频谱对比
mag_orig = np.log1p(np.abs(f))
mag_filtered = np.log1p(np.abs(f_filtered))
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(mag_filtered, cmap='gray'); axes[1].set_title('带通频谱'); axes[1].axis('off')
axes[2].imshow(result, cmap='gray'); axes[2].set_title(f'带通结果({D1}-{D2})'); axes[2].axis('off')
savefig(fig, 'result')
info(频率范围=f'{D1}-{D2}', 说明='带通提取特定尺度的纹理特征')`,

  homomorphic: `# 同态滤波（对数变换→FFT→滤波→指数变换）
img = imread_gray().astype(np.float64) + 1
# 取对数分离照射和反射分量
log_img = np.log(img)
# FFT
f = np.fft.fftshift(np.fft.fft2(log_img))
h, w = log_img.shape
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)
# 同态滤波函数：压缩低频(照射)，增强高频(反射)
rh, rl, c = 1.5, 0.3, 40
H = (rh - rl) * (1 - np.exp(-c * (D**2) / (40**2))) + rl
# 频域滤波
f_filtered = f * H
# 逆变换 + 取指数
result = np.exp(np.real(np.fft.ifft2(np.fft.ifftshift(f_filtered))))
result = np.clip((result - result.min()) / (result.max() - result.min()) * 255, 0, 255).astype(np.uint8)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img - 1, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(H, cmap='hot'); axes[1].set_title('同态滤波器'); axes[1].axis('off')
axes[2].imshow(result, cmap='gray'); axes[2].set_title('同态滤波结果'); axes[2].axis('off')
savefig(fig, 'result')
info(说明='同态滤波同时压缩动态范围和增强对比度')`,

  // --- Chapter 6: 图像恢复与增强 ---
  'hist-eq': `# 直方图均衡化增强
img = imread_gray()
# 计算原始直方图
hist_before = cv2.calcHist([img], [0], None, [256], [0, 256])
# 直方图均衡化
equ = cv2.equalizeHist(img)
# 计算均衡后直方图
hist_after = cv2.calcHist([equ], [0], None, [256], [0, 256])
# 对比显示
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].plot(hist_before, color='#94a3b8'); axes[0,1].set_title('原始直方图')
axes[1,0].imshow(equ, cmap='gray'); axes[1,0].set_title('均衡化结果'); axes[1,0].axis('off')
axes[1,1].plot(hist_after, color='#6366f1'); axes[1,1].set_title('均衡后直方图')
savefig(fig, 'result')
info(均值变化=f'{img.mean():.1f} -> {equ.mean():.1f}')`,

  clahe: `# CLAHE自适应直方图均衡（不同clipLimit对比）
img = imread_gray()
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
for ax, clip in zip([axes[0,1], axes[1,0], axes[1,1]], [2.0, 4.0, 8.0]):
    # 创建CLAHE对象，clipLimit控制对比度增强强度
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    result = clahe.apply(img)
    ax.imshow(result, cmap='gray'); ax.set_title(f'CLAHE clip={clip}'); ax.axis('off')
savefig(fig, 'result')
info(说明='clipLimit越大增强越强，但可能引入噪声')`,

  'log-transform': `# 对数变换增强（不同c值对比）
img = imread_gray().astype(np.float64)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, c in zip(axes, [10, 30, 60]):
    # 对数变换：g = c * log(1 + f)
    result = c * np.log1p(img)
    result = np.clip(result / result.max() * 255, 0, 255).astype(np.uint8)
    ax.imshow(result, cmap='gray'); ax.set_title(f'c={c}'); ax.axis('off')
savefig(fig, 'result')
info(原图均值=img.mean(), 说明='对数变换扩展暗区灰度级，增强低亮度细节')`,

  unsharp: `# USM锐化（非锐化掩模：高斯模糊→差值→叠加）
img = imread_color()
# 高斯模糊生成"非锐化"版本
blurred = cv2.GaussianBlur(img, (0, 0), 3)
# 计算掩模 = 原图 - 模糊图（高频细节）
mask = cv2.subtract(img, blurred)
# 不同强度叠加：g = f + k * mask
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title('原图'); axes[0].axis('off')
for ax, k in zip([axes[1], axes[2]], [0.5, 1.5]):
    result = cv2.addWeighted(img, 1.0 + k, blurred, -k, 0)
    ax.imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); ax.set_title(f'USM k={k}'); ax.axis('off')
savefig(fig, 'result')
info(说明='k控制锐化强度，k>1为高提升滤波')`,

  'color-enhance': `# 彩色图像增强（HSV空间增强 + 伪彩色）
img = imread_color()
# 转HSV空间，只对V(亮度)通道均衡化
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
hsv[:,:,2] = cv2.equalizeHist(hsv[:,:,2])
enhanced_hsv = cv2.cvtColor(hsv, cv2.COLOR_BGR2RGB)
# 伪彩色增强（灰度→jet colormap映射）
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
pseudo = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
pseudo_rgb = cv2.cvtColor(pseudo, cv2.COLOR_BGR2RGB)
# CLAHE增强V通道
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
hsv2 = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
hsv2[:,:,2] = clahe.apply(hsv2[:,:,2])
enhanced_clahe = cv2.cvtColor(hsv2, cv2.COLOR_BGR2RGB)
fig, axes = plt.subplots(2, 3, figsize=(14, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(enhanced_hsv); axes[0,1].set_title('HSV亮度均衡'); axes[0,1].axis('off')
axes[0,2].imshow(pseudo_rgb); axes[0,2].set_title('伪彩色'); axes[0,2].axis('off')
axes[1,0].imshow(gray, cmap='gray'); axes[1,0].set_title('灰度图'); axes[1,0].axis('off')
axes[1,1].imshow(enhanced_clahe); axes[1,1].set_title('CLAHE增强'); axes[1,1].axis('off')
axes[1,2].imshow(hsv[:,:,1], cmap='hot'); axes[1,2].set_title('饱和度通道'); axes[1,2].axis('off')
savefig(fig, 'result')
info(说明='在HSV空间处理可保持色彩不失真')`,

  // --- Chapter 7: 图像压缩与退化 ---
  'motion-blur': `# 运动模糊模拟（不同角度/长度）
img = imread_gray().astype(np.float64)
def make_motion_kernel(length, angle):
    \"\"\"创建运动模糊核\"\"\"
    k = np.zeros((length, length))
    k[length//2, :] = 1.0 / length
    center = (length//2, length//2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(k, M, (length, length))
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
params = [(15, 0), (15, 45), (25, 90)]
for ax, (length, angle) in zip([axes[0,1], axes[1,0], axes[1,1]], params):
    kernel = make_motion_kernel(length, angle)
    blurred = cv2.filter2D(img, -1, kernel)
    blurred = np.clip(blurred, 0, 255).astype(np.uint8)
    ax.imshow(blurred, cmap='gray'); ax.set_title(f'L={length} A={angle}°'); ax.axis('off')
savefig(fig, 'result')
info(说明='运动模糊核由长度和角度决定')`,

  'defocus-blur': `# 离焦模糊模拟（不同半径圆盘核）
img = imread_gray().astype(np.float64)
def make_disk_kernel(radius):
    \"\"\"创建圆盘形离焦核\"\"\"
    size = 2 * radius + 1
    kernel = np.zeros((size, size))
    cv2.circle(kernel, (radius, radius), radius, 1, -1)
    return kernel / kernel.sum()
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, r in zip(axes, [3, 7, 15]):
    kernel = make_disk_kernel(r)
    blurred = cv2.filter2D(img, -1, kernel)
    blurred = np.clip(blurred, 0, 255).astype(np.uint8)
    ax.imshow(blurred, cmap='gray'); ax.set_title(f'半径R={r}'); ax.axis('off')
savefig(fig, 'result')
info(说明='离焦模糊核为圆盘形，半径越大模糊越强')`,

  'inverse-filter': `# 逆滤波复原
img = imread_gray().astype(np.float64)
# 模拟运动模糊退化
size = 15
kernel = np.zeros((size, size))
kernel[size//2, :] = 1.0 / size
blurred = cv2.filter2D(img, -1, kernel)
# 频域逆滤波复原
f_blurred = np.fft.fft2(blurred)
f_kernel = np.fft.fft2(kernel, s=img.shape)
# 设置阈值防止除零（伪逆滤波）
f_kernel[np.abs(f_kernel) < 0.01] = 0.01
f_restored = f_blurred / f_kernel
restored = np.abs(np.fft.ifft2(f_restored))
restored = np.clip(restored / restored.max() * 255, 0, 255).astype(np.uint8)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(np.clip(blurred, 0, 255).astype(np.uint8), cmap='gray'); axes[1].set_title('运动模糊'); axes[1].axis('off')
axes[2].imshow(restored, cmap='gray'); axes[2].set_title('逆滤波复原'); axes[2].axis('off')
savefig(fig, 'result')
info(说明='逆滤波在H接近零时会放大噪声，需阈值截断')`,

  'wiener-filter': `# 维纳滤波复原
img = imread_gray().astype(np.float64)
# 模拟运动模糊 + 噪声
size = 15
kernel = np.zeros((size, size))
kernel[size//2, :] = 1.0 / size
blurred = cv2.filter2D(img, -1, kernel)
noisy = blurred + np.random.normal(0, 5, blurred.shape)
# 维纳滤波（频域实现）
f_noisy = np.fft.fft2(noisy)
f_kernel = np.fft.fft2(kernel, s=img.shape)
# 信噪比参数K
K = 0.02
f_wiener = (np.conj(f_kernel) / (np.abs(f_kernel)**2 + K)) * f_noisy
restored_wiener = np.abs(np.fft.ifft2(f_wiener))
restored_wiener = np.clip(restored_wiener / restored_wiener.max() * 255, 0, 255).astype(np.uint8)
# 对比逆滤波
f_kernel_safe = f_kernel.copy()
f_kernel_safe[np.abs(f_kernel_safe) < 0.01] = 0.01
restored_inv = np.abs(np.fft.ifft2(f_noisy / f_kernel_safe))
restored_inv = np.clip(restored_inv / restored_inv.max() * 255, 0, 255).astype(np.uint8)
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(np.clip(noisy, 0, 255).astype(np.uint8), cmap='gray'); axes[0,1].set_title('模糊+噪声'); axes[0,1].axis('off')
axes[1,0].imshow(restored_inv, cmap='gray'); axes[1,0].set_title('逆滤波'); axes[1,0].axis('off')
axes[1,1].imshow(restored_wiener, cmap='gray'); axes[1,1].set_title('维纳滤波'); axes[1,1].axis('off')
savefig(fig, 'result')
info(说明='维纳滤波在去模糊和去噪之间取得最优平衡')`,

  'blind-deconv': `# 盲反卷积（迭代估计退化核并复原）
img = imread_gray().astype(np.float64) / 255.0
# 模拟模糊（未知核）
size = 9
kernel_true = np.zeros((size, size))
kernel_true[size//2, :] = 1.0 / size
blurred = cv2.filter2D(img, -1, kernel_true)
# Richardson-Lucy盲反卷积（简化实现）
def richardson_lucy(image, psf, iterations=15):
    estimate = image.copy()
    for _ in range(iterations):
        conv = cv2.filter2D(estimate, -1, psf)
        conv[conv < 1e-10] = 1e-10
        ratio = image / conv
        estimate *= cv2.filter2D(ratio, -1, psf[::-1, ::-1])
    return np.clip(estimate, 0, 1)
# 用初始估计核进行复原
psf_est = np.ones((size, size)) / (size * size)
restored = richardson_lucy(blurred, psf_est, iterations=20)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(blurred, cmap='gray'); axes[1].set_title('模糊图像'); axes[1].axis('off')
axes[2].imshow(restored, cmap='gray'); axes[2].set_title('盲反卷积复原'); axes[2].axis('off')
savefig(fig, 'result')
info(说明='盲反卷积同时估计核和图像，是病态问题')`,

  // --- Chapter 8: 图像分割 ---
  sobel: `# Sobel边缘检测
gray = imread_gray()
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
magnitude = np.sqrt(sobelx**2 + sobely**2)
result = np.clip(magnitude / magnitude.max() * 255, 0, 255).astype(np.uint8)
cv2.imwrite('result.png', result)`,

  canny: `# Canny边缘检测
gray = imread_gray()
edges = cv2.Canny(gray, 50, 150)
cv2.imwrite('result.png', edges)
info(边缘像素数=np.sum(edges > 0))`,

  'threshold-seg': `# Otsu阈值分割
gray = imread_gray()
# Otsu自动计算最优阈值
thresh, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# 手动实现Otsu验证
hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
hist = hist / hist.sum()
best_t, best_var = 0, 0
for t in range(256):
    w0 = hist[:t+1].sum(); w1 = hist[t+1:].sum()
    if w0 == 0 or w1 == 0: continue
    mu0 = np.sum(np.arange(t+1) * hist[:t+1]) / w0
    mu1 = np.sum(np.arange(t+1, 256) * hist[t+1:]) / w1
    var = w0 * w1 * (mu0 - mu1)**2
    if var > best_var: best_var = var; best_t = t
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].hist(gray.ravel(), 256, [0,256], color='#94a3b8')
axes[1].axvline(thresh, color='red', linestyle='--', label=f'Otsu T={thresh:.0f}')
axes[1].set_title('直方图+阈值'); axes[1].legend()
axes[2].imshow(binary, cmap='gray'); axes[2].set_title('分割结果'); axes[2].axis('off')
savefig(fig, 'result')
info(Otsu阈值=thresh, 手动验证=best_t, 前景像素=np.sum(binary > 0))`,

  'region-grow': `# 区域生长分割
gray = imread_gray()
# 选择种子点（图像中心）
seed_y, seed_x = gray.shape[0]//2, gray.shape[1]//2
seed_val = int(gray[seed_y, seed_x])
# 区域生长算法
threshold = 20  # 灰度差异阈值
mask = np.zeros(gray.shape, dtype=np.uint8)
visited = np.zeros(gray.shape, dtype=bool)
queue = [(seed_y, seed_x)]
visited[seed_y, seed_x] = True
region_vals = [seed_val]
while queue:
    cy, cx = queue.pop(0)
    for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < gray.shape[0] and 0 <= nx < gray.shape[1] and not visited[ny, nx]:
            if abs(int(gray[ny, nx]) - np.mean(region_vals)) < threshold:
                visited[ny, nx] = True
                mask[ny, nx] = 255
                region_vals.append(int(gray[ny, nx]))
                queue.append((ny, nx))
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[0].plot(seed_x, seed_y, 'r+', markersize=15)
axes[1].imshow(mask, cmap='gray'); axes[1].set_title('生长结果'); axes[1].axis('off')
axes[2].imshow(cv2.bitwise_and(gray, gray, mask=mask), cmap='gray'); axes[2].set_title('区域提取'); axes[2].axis('off')
savefig(fig, 'result')
info(种子值=seed_val, 区域像素=len(region_vals), 阈值=threshold)`,

  watershed: `# 分水岭分割
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
kernel = np.ones((3,3), np.uint8)
opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
sure_bg = cv2.dilate(opening, kernel, iterations=3)
dist = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
_, sure_fg = cv2.threshold(dist, 0.5*dist.max(), 255, 0)
sure_fg = sure_fg.astype(np.uint8)
unknown = cv2.subtract(sure_bg, sure_fg)
_, markers = cv2.connectedComponents(sure_fg)
markers = markers + 1
markers[unknown == 255] = 0
markers = cv2.watershed(img, markers)
img[markers == -1] = [255, 0, 0]
cv2.imwrite('result.png', img)`,

  'kmeans-seg': `# K-means聚类分割
img = imread_color()
# 将图像像素转为特征向量
pixels = img.reshape(-1, 3).astype(np.float32)
# K-means聚类
K = 3
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
_, labels, centers = cv2.kmeans(pixels, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
# 用聚类中心颜色重建图像
centers = centers.astype(np.uint8)
segmented = centers[labels.flatten()]
segmented = segmented.reshape(img.shape)
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(cv2.cvtColor(segmented, cv2.COLOR_BGR2RGB)); axes[1].set_title(f'K={K}聚类'); axes[1].axis('off')
savefig(fig, 'result')
info(聚类中心=centers.tolist())`,

  // --- Chapter 9: 形态学 ---
  erode: `# 腐蚀
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
result = cv2.erode(binary, kernel, iterations=1)
cv2.imwrite('result.png', result)`,

  dilate: `# 膨胀
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
result = cv2.dilate(binary, kernel, iterations=1)
cv2.imwrite('result.png', result)`,

  'open-close': `# 开闭运算对比
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
# 开运算：先腐蚀后膨胀，去除小目标
opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
# 闭运算：先膨胀后腐蚀，填充小孔洞
closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(binary, cmap='gray'); axes[0,1].set_title('二值化'); axes[0,1].axis('off')
axes[1,0].imshow(opened, cmap='gray'); axes[1,0].set_title('开运算'); axes[1,0].axis('off')
axes[1,1].imshow(closed, cmap='gray'); axes[1,1].set_title('闭运算'); axes[1,1].axis('off')
savefig(fig, 'result')
info(说明='开运算去小突起，闭运算填小孔洞')`,

  'morph-edge': `# 形态学边缘检测
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
# 外边界 = 膨胀 - 原图
dilated = cv2.dilate(binary, kernel)
edge_outer = cv2.subtract(dilated, binary)
# 内边界 = 原图 - 腐蚀
eroded = cv2.erode(binary, kernel)
edge_inner = cv2.subtract(binary, eroded)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(binary, cmap='gray'); axes[0].set_title('二值图'); axes[0].axis('off')
axes[1].imshow(edge_outer, cmap='gray'); axes[1].set_title('外边界'); axes[1].axis('off')
axes[2].imshow(edge_inner, cmap='gray'); axes[2].set_title('内边界'); axes[2].axis('off')
savefig(fig, 'result')
info(外边界像素=np.sum(edge_outer > 0), 内边界像素=np.sum(edge_inner > 0))`,

  skeleton: `# 骨架提取（距离变换 + 形态学细化）
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# 方法1：距离变换近似骨架
dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
# 取距离变换的局部极大值作为骨架近似
_, skeleton_approx = cv2.threshold(dist, 0.5 * dist.max(), 255, cv2.THRESH_BINARY)
skeleton_approx = skeleton_approx.astype(np.uint8)
# 方法2：Zhang-Suen细化算法
from skimage.morphology import skeletonize
binary_norm = (binary > 0).astype(np.uint8)
skel = (skeletonize(binary_norm) * 255).astype(np.uint8)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(binary, cmap='gray'); axes[0].set_title('二值图'); axes[0].axis('off')
axes[1].imshow(skeleton_approx, cmap='gray'); axes[1].set_title('距离变换骨架'); axes[1].axis('off')
axes[2].imshow(skel, cmap='gray'); axes[2].set_title('Zhang-Suen骨架'); axes[2].axis('off')
savefig(fig, 'result')
info(骨架像素=np.sum(skel > 0), 原始像素=np.sum(binary > 0))`,

  tophat: `# 顶帽与底帽变换
gray = imread_gray()
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
# 顶帽 = 原图 - 开运算（提取比周围亮的小目标）
tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
# 底帽 = 闭运算 - 原图（提取比周围暗的小目标）
blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel), cmap='gray')
axes[0,1].set_title('开运算'); axes[0,1].axis('off')
axes[1,0].imshow(tophat, cmap='hot'); axes[1,0].set_title('顶帽(亮细节)'); axes[1,0].axis('off')
axes[1,1].imshow(blackhat, cmap='hot'); axes[1,1].set_title('底帽(暗细节)'); axes[1,1].axis('off')
savefig(fig, 'result')
info(顶帽均值=tophat.mean(), 底帽均值=blackhat.mean())`,

  // --- Chapter 10: 特征提取 ---
  'histogram-feature': `# 直方图统计特征提取
gray = imread_gray()
# 归一化直方图（概率分布）
hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
p = hist / hist.sum()
p_nonzero = p[p > 0]
# 统计特征计算
mean_val = np.sum(np.arange(256) * p)            # 均值（亮度）
variance = np.sum(((np.arange(256) - mean_val)**2) * p)  # 方差（对比度）
std_val = np.sqrt(variance)
skewness = np.sum(((np.arange(256) - mean_val)**3) * p) / (std_val**3)  # 偏度
kurtosis = np.sum(((np.arange(256) - mean_val)**4) * p) / (std_val**4)  # 峰度
entropy = -np.sum(p_nonzero * np.log2(p_nonzero))  # 熵（信息量）
energy = np.sum(p**2)  # 能量
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].hist(gray.ravel(), 256, [0,256], color='#6366f1'); axes[1].set_title('直方图')
plt.suptitle(f'均值={mean_val:.1f} 标准差={std_val:.1f} 熵={entropy:.2f}')
savefig(fig, 'result')
info(均值=round(mean_val,1), 标准差=round(std_val,1), 偏度=round(skewness,3),
     峰度=round(kurtosis,3), 熵=round(entropy,2), 能量=round(energy,4))`,

  glcm: `# 灰度共生矩阵(GLCM)纹理特征
gray = imread_gray()
# 量化到较少灰度级以减小GLCM尺寸
levels = 32
gray_q = (gray.astype(np.float64) / 256 * levels).astype(np.int32)
gray_q = np.clip(gray_q, 0, levels - 1)
def calc_glcm(img, d=1, angle=0):
    \"\"\"计算GLCM矩阵\"\"\"
    h, w = img.shape
    glcm = np.zeros((levels, levels), dtype=np.float64)
    dy = int(round(d * np.sin(angle)))
    dx = int(round(d * np.cos(angle)))
    for y in range(max(0,-dy), min(h, h-dy)):
        for x in range(max(0,-dx), min(w, w-dx)):
            i, j = img[y, x], img[y+dy, x+dx]
            glcm[i, j] += 1
    return glcm / (glcm.sum() + 1e-10)
# 计算0°方向GLCM
glcm = calc_glcm(gray_q, d=1, angle=0)
# 纹理特征提取
contrast = np.sum([(i-j)**2 * glcm[i,j] for i in range(levels) for j in range(levels)])
energy = np.sum(glcm**2)
entropy_val = -np.sum(glcm[glcm > 0] * np.log2(glcm[glcm > 0]))
corr_num = np.sum([(i*j) * glcm[i,j] for i in range(levels) for j in range(levels)])
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(glcm, cmap='hot'); axes[1].set_title('GLCM'); axes[1].axis('off')
plt.suptitle(f'对比度={contrast:.2f} 能量={energy:.4f} 熵={entropy_val:.2f}')
savefig(fig, 'result')
info(对比度=round(contrast,2), 能量=round(energy,4), 熵=round(entropy_val,2))`,

  'edge-feature': `# 边缘特征统计（Harris角点 + 边缘密度）
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# Canny边缘检测
edges = cv2.Canny(gray, 50, 150)
# Harris角点检测
gray_f = gray.astype(np.float32)
dst = cv2.cornerHarris(gray_f, 2, 3, 0.04)
corner_mask = dst > 0.01 * dst.max()
corner_count = np.sum(corner_mask)
# 边缘统计
edge_density = np.sum(edges > 0) / edges.size
# 梯度方向直方图
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
angles = np.arctan2(sobely, sobelx) * 180 / np.pi
angles = angles[edges > 0]
# 可视化
result = img.copy()
result[edges > 0] = [0, 255, 0]    # 绿色边缘
result[corner_mask] = [0, 0, 255]  # 红色角点
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); axes[0].set_title('边缘(绿)+角点(红)'); axes[0].axis('off')
axes[1].imshow(edges, cmap='gray'); axes[1].set_title('Canny边缘'); axes[1].axis('off')
if len(angles) > 0:
    axes[2].hist(angles, bins=36, range=(-180, 180), color='#6366f1')
    axes[2].set_title('梯度方向分布')
savefig(fig, 'result')
info(边缘密度=round(edge_density,4), 角点数=corner_count)`,

  'region-feature': `# 区域特征描述（连通域形状分析）
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# 连通域标记与特征提取
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
result = img.copy()
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area < 50: continue  # 过滤噪声
    x = stats[i, cv2.CC_STAT_LEFT]; y = stats[i, cv2.CC_STAT_TOP]
    w = stats[i, cv2.CC_STAT_WIDTH]; h = stats[i, cv2.CC_STAT_HEIGHT]
    # 提取单个区域的轮廓计算圆度
    mask = (labels == i).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    perimeter = cv2.arcLength(contours[0]) if contours else 1
    circularity = 4 * np.pi * area / (perimeter**2 + 1e-10)
    aspect_ratio = w / (h + 1e-10)
    # 用不同颜色标注
    color = (0, 255, 0) if circularity > 0.7 else (255, 165, 0)
    cv2.rectangle(result, (x, y), (x+w, y+h), color, 2)
    cv2.putText(result, f'A={area}', (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
cv2.imwrite('result.png', result)
info(连通域数=num_labels-1, 说明='绿色=高圆度 橙色=低圆度')`,

  hough: `# Hough直线检测
gray = imread_gray()
edges = cv2.Canny(gray, 50, 150)
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
if lines is not None:
    for line in lines:
        x1, y1, x2, y2 = line[0]
        cv2.line(result, (x1,y1), (x2,y2), (0,0,255), 2)
cv2.imwrite('result.png', result)
info(检测到直线数=len(lines) if lines is not None else 0)`,

  template: `# 模板匹配（归一化互相关）
img = imread_gray()
h, w = img.shape
# 提取模板（图像中心区域）
th, tw = h//4, w//4
template = img[h//2-th//2:h//2+th//2, w//2-tw//2:w//2+tw//2]
# 多方法模板匹配
methods = ['cv2.TM_SQDIFF_NORMED', 'cv2.TM_CCOEFF_NORMED', 'cv2.TM_CCORR_NORMED']
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('搜索图像'); axes[0,0].axis('off')
rect = cv2.rectangle(img.copy(), (w//2-tw//2, h//2-th//2), (w//2+tw//2, h//2+th//2), 255, 2)
axes[0,0].imshow(rect, cmap='gray')
axes[0,1].imshow(template, cmap='gray'); axes[0,1].set_title('模板'); axes[0,1].axis('off')
for ax, method_name in zip([axes[1,0], axes[1,1]], methods[:2]):
    method = eval(method_name)
    result = cv2.matchTemplate(img, template, method)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
    if 'SQDIFF' in method_name:
        top_left = min_loc
    else:
        top_left = max_loc
    matched = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    cv2.rectangle(matched, top_left, (top_left[0]+tw, top_left[1]+th), (0,0,255), 2)
    ax.imshow(cv2.cvtColor(matched, cv2.COLOR_BGR2RGB))
    ax.set_title(f'{method_name.split("_")[-1]}'); ax.axis('off')
savefig(fig, 'result')
info(模板尺寸=template.shape, 说明='TM_CCOEFF_NORMED通常效果最好')`,

  // --- Chapter 11: 综合应用 ---
  batch: `# 批量图像处理（自动化流水线）
import os
img = imread_color()
# 定义处理流水线
def process_pipeline(image):
    \"\"\"标准处理流程：灰度化→去噪→增强→分割\"\"\"
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.GaussianBlur(gray, (5,5), 1.0)
    enhanced = cv2.equalizeHist(denoised)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    num, _, stats, _ = cv2.connectedComponentsWithStats(cleaned)
    count = sum(1 for i in range(1, num) if stats[i, cv2.CC_STAT_AREA] > 30)
    return gray, enhanced, cleaned, count
gray, enhanced, binary, count = process_pipeline(img)
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(gray, cmap='gray'); axes[0,1].set_title('灰度化'); axes[0,1].axis('off')
axes[1,0].imshow(enhanced, cmap='gray'); axes[1,0].set_title('增强'); axes[1,0].axis('off')
axes[1,1].imshow(binary, cmap='gray'); axes[1,1].set_title(f'分割(目标={count})'); axes[1,1].axis('off')
savefig(fig, 'result')
info(检测目标数=count, 说明='批量处理对每张图执行相同流水线')`,

  weld: `# 焊缝缺陷检测
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# CLAHE增强焊缝区域对比度
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
enhanced = clahe.apply(gray)
# 自适应阈值分割
binary = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY_INV, 21, 5)
# 形态学清理噪声
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
# Hough直线检测焊缝轮廓
edges = cv2.Canny(enhanced, 40, 120)
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=30, maxLineGap=10)
result = img.copy()
if lines is not None:
    for line in lines:
        x1,y1,x2,y2 = line[0]
        cv2.line(result, (x1,y1),(x2,y2), (0,0,255), 2)
# 标记可疑缺陷区域
contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for cnt in contours:
    if cv2.contourArea(cnt) > 100:
        x, y, w, h = cv2.boundingRect(cnt)
        cv2.rectangle(result, (x,y), (x+w,y+h), (0,255,0), 2)
cv2.imwrite('result.png', result)
info(检测到直线=len(lines) if lines is not None else 0, 可疑区域=len(contours))`,

  logcount: `# 原木计数系统
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# 高斯去噪
denoised = cv2.GaussianBlur(gray, (5,5), 1.5)
# Otsu阈值分割
_, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# 形态学闭运算填充原木截面间隙
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7,7))
closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
# 形态学开运算分离粘连
opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel, iterations=1)
# 距离变换 + 局部极大值寻找种子点
dist = cv2.distanceTransform(opened, cv2.DIST_L2, 5)
dist_norm = cv2.normalize(dist, None, 0, 1.0, cv2.NORM_MINMAX)
_, sure_fg = cv2.threshold(dist_norm, 0.5, 1.0, cv2.THRESH_BINARY)
sure_fg = sure_fg.astype(np.uint8)
# 连通域计数
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(sure_fg, connectivity=8)
result = img.copy()
count = 0
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 50:
        count += 1
        cx, cy = centroids[i]
        cv2.circle(result, (int(cx), int(cy)), 5, (0, 0, 255), -1)
        cv2.putText(result, str(count), (int(cx)+8, int(cy)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
cv2.imwrite('result.png', result)
info(原木计数=count)`,

  datesort: `# 红枣缺陷分选
img = imread_color()
# HSV空间分析颜色特征
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# 分割红枣区域（红/棕色）
mask_date = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([20, 255, 200]))
mask_date2 = cv2.inRange(hsv, np.array([160, 50, 50]), np.array([180, 255, 200]))
mask_fruit = cv2.bitwise_or(mask_date, mask_date2)
# 灰度图缺陷检测
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, defect_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
defect_mask = cv2.bitwise_and(defect_mask, mask_fruit)
# 形态学清理
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
defect_mask = cv2.morphologyEx(defect_mask, cv2.MORPH_OPEN, kernel, iterations=2)
# 连通域分析与分级
num, labels, stats, _ = cv2.connectedComponentsWithStats(mask_fruit, connectivity=8)
result = img.copy()
grade = {'优等': 0, '二等': 0, '缺陷': 0}
for i in range(1, num):
    area = stats[i, cv2.CC_STAT_AREA]
    if area < 100: continue
    fruit_mask = (labels == i).astype(np.uint8) * 255
    defect_area = np.sum(cv2.bitwise_and(defect_mask, fruit_mask) > 0)
    ratio = defect_area / (area + 1e-10)
    x, y = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP]
    w, h = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
    if ratio < 0.05:
        color = (0, 255, 0); grade['优等'] += 1
    elif ratio < 0.15:
        color = (255, 165, 0); grade['二等'] += 1
    else:
        color = (0, 0, 255); grade['缺陷'] += 1
    cv2.rectangle(result, (x, y), (x+w, y+h), color, 2)
cv2.imwrite('result.png', result)
info(分级结果=grade)`,

  panorama: `# 全景图像拼接（简化版：水平平移+线性融合）
img = imread_color()
h, w = img.shape[:2]
# 模拟两幅有重叠的图像
overlap = w // 3
img1 = img[:, :w-overlap]
img2 = img[:, overlap:]
# 水平拼接（模拟特征匹配后的对齐）
h1, w1 = img1.shape[:2]
h2, w2 = img2.shape[:2]
panorama_w = w1 + w2
result = np.zeros((max(h1, h2), panorama_w, 3), dtype=np.uint8)
result[:h1, :w1] = img1
# 重叠区域线性融合
blend_width = min(w1, w2, overlap)
for i in range(blend_width):
    alpha = i / blend_width
    x1 = w1 - blend_width + i
    x2 = i
    if x2 < w2:
        result[:h1, panorama_w - w2 + x2] = (
            (1 - alpha) * img1[:h1, x1].astype(np.float64) +
            alpha * img2[:h1, x2].astype(np.float64)
        ).astype(np.uint8)
result[:h2, panorama_w - w2 + blend_width:] = img2[:h2, blend_width:]
cv2.imwrite('result.png', result)
info(拼接宽度=panorama_w, 重叠像素=overlap, 融合宽度=blend_width)`,

  // --- Chapter 12: 目标描述与识别 ---
  'region-desc': `# 区域描述子（Hu矩 + 形状特征）
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# 连通域找最大区域
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours:
    cnt = max(contours, key=cv2.contourArea)
    # Hu不变矩（平移、旋转、尺度不变）
    moments = cv2.moments(cnt)
    hu = cv2.HuMoments(moments).flatten()
    # 基本形状描述子
    area = cv2.contourArea(cnt)
    perimeter = cv2.arcLength(cnt)
    circularity = 4 * np.pi * area / (perimeter**2 + 1e-10)
    x, y, w, h = cv2.boundingRect(cnt)
    rect_area = w * h
    extent = area / (rect_area + 1e-10)
    (cx, cy), (MA, ma), angle = cv2.fitEllipse(cnt) if len(cnt) >= 5 else ((0,0),(0,0),0)
    result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(result, [cnt], -1, (0, 255, 0), 2)
    cv2.rectangle(result, (x, y), (x+w, y+h), (0, 0, 255), 1)
    cv2.imwrite('result.png', result)
    info(面积=area, 周长=perimeter, 圆度=round(circularity,3),
         矩形度=round(extent,3), Hu矩=[round(float(h),4) for h in hu[:4]])`,

  'boundary-desc': `# 边界描述子（链码 + 傅里叶描述子）
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
if contours:
    cnt = max(contours, key=cv2.contourArea).reshape(-1, 2)
    # 8方向链码
    directions = {(-1,-1):0, (-1,0):1, (-1,1):2, (0,1):3, (1,1):4, (1,0):5, (1,-1):6, (0,-1):7}
    chain_code = []
    for i in range(1, min(len(cnt), 500)):
        dy = cnt[i][1] - cnt[i-1][1]
        dx = cnt[i][0] - cnt[i-1][0]
        dy, dx = np.sign(dy), np.sign(dx)
        if (dy, dx) in directions:
            chain_code.append(directions[(dy, dx)])
    # 傅里叶描述子
    pts = cnt[:, 0] + 1j * cnt[:, 1]
    fd = np.fft.fft(pts.astype(np.float64))
    # 用前N个描述子重建边界
    N = 10
    fd_truncated = np.zeros_like(fd)
    fd_truncated[:N] = fd[:N]
    fd_truncated[-N+1:] = fd[-N+1:]
    reconstructed = np.fft.ifft(fd_truncated)
    fig, axes = plt.subplots(1, 3, figsize=(14, 4))
    axes[0].imshow(binary, cmap='gray'); axes[0].set_title('二值图'); axes[0].axis('off')
    axes[1].plot(cnt[:, 0], -cnt[:, 1], 'b-'); axes[1].set_title('原始边界'); axes[1].axis('equal')
    axes[2].plot(np.real(reconstructed), -np.imag(reconstructed), 'r-')
    axes[2].set_title(f'FD重建(N={N})'); axes[2].axis('equal')
    savefig(fig, 'result')
    info(链码长度=len(chain_code), 链码前20=chain_code[:20])`,

  moments: `# 图像矩分析（几何矩 + 中心矩 + Hu不变矩）
gray = imread_gray()
# 计算原始图像的矩
m = cv2.moments(gray)
# 质心坐标
cx = m['m10'] / (m['m00'] + 1e-10)
cy = m['m01'] / (m['m00'] + 1e-10)
# 二值图像的矩
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
mb = cv2.moments(binary)
cx_b = mb['m10'] / (mb['m00'] + 1e-10)
cy_b = mb['m01'] / (mb['m00'] + 1e-10)
# Hu不变矩
hu = cv2.HuMoments(mb).flatten()
result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
cv2.circle(result, (int(cx), int(cy)), 8, (0, 0, 255), -1)
cv2.putText(result, 'G', (int(cx)+10, int(cy)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)
cv2.circle(result, (int(cx_b), int(cy_b)), 8, (0, 255, 0), -1)
cv2.putText(result, 'B', (int(cx_b)+10, int(cy_b)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
cv2.imwrite('result.png', result)
info(零阶矩_面积=m['m00'], 灰度质心=f'({cx:.1f},{cy:.1f})',
     二值质心=f'({cx_b:.1f},{cy_b:.1f})',
     Hu矩=[round(float(h),6) for h in hu])`,

  classify: `# 图像分类识别（基于手工特征的最近邻分类器）
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# 提取特征向量
def extract_features(image_gray):
    features = []
    # 灰度统计特征
    hist = cv2.calcHist([image_gray], [0], None, [16], [0, 256]).ravel()
    features.extend((hist / hist.sum()).tolist())
    # 统计矩
    features.extend([image_gray.mean()/255, image_gray.std()/255])
    # 边缘密度
    edges = cv2.Canny(image_gray, 50, 150)
    features.append(np.sum(edges > 0) / edges.size)
    return np.array(features)
feat = extract_features(gray)
# 模拟训练样本（不同类别的特征原型）
np.random.seed(42)
class_prototypes = {
    '类别A': np.random.dirichlet(np.ones(16)).tolist() + [0.4, 0.15, 0.08],
    '类别B': np.random.dirichlet(np.ones(16)).tolist() + [0.6, 0.25, 0.15],
    '类别C': np.random.dirichlet(np.ones(16)).tolist() + [0.3, 0.10, 0.05],
}
# 最小距离分类
best_class, best_dist = None, float('inf')
for cls, proto in class_prototypes.items():
    dist = np.linalg.norm(feat - np.array(proto))
    if dist < best_dist:
        best_dist = dist; best_class = cls
# 可视化
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title(f'分类: {best_class}'); axes[0].axis('off')
axes[1].bar(range(len(feat)), feat, color='#6366f1'); axes[1].set_title(f'特征向量(d={len(feat)})')
savefig(fig, 'result')
info(预测类别=best_class, 最小距离=round(best_dist,4))`,

  pipeline: `# 完整处理流水线（预处理→分割→特征→决策）
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# Step 1: 预处理 - 高斯去噪
denoised = cv2.GaussianBlur(gray, (5,5), 1.0)
# Step 2: 增强 - CLAHE自适应均衡
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
enhanced = clahe.apply(denoised)
# Step 3: 分割 - Otsu阈值
_, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# Step 4: 后处理 - 形态学开运算去噪
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
# Step 5: 特征提取 - 连通域分析
num, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
# Step 6: 决策 - 计数与分类
result = img.copy()
valid = 0
for i in range(1, num):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 30:
        valid += 1
        x, y = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP]
        w, h = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        color = (0, 255, 0) if area > 200 else (255, 165, 0)
        cv2.rectangle(result, (x, y), (x+w, y+h), color, 2)
        cv2.putText(result, str(area), (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
# 显示处理流程
fig, axes = plt.subplots(2, 3, figsize=(14, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('1.原图'); axes[0,0].axis('off')
axes[0,1].imshow(denoised, cmap='gray'); axes[0,1].set_title('2.去噪'); axes[0,1].axis('off')
axes[0,2].imshow(enhanced, cmap='gray'); axes[0,2].set_title('3.增强'); axes[0,2].axis('off')
axes[1,0].imshow(binary, cmap='gray'); axes[1,0].set_title('4.分割'); axes[1,0].axis('off')
axes[1,1].imshow(cleaned, cmap='gray'); axes[1,1].set_title('5.后处理'); axes[1,1].axis('off')
axes[1,2].imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); axes[1,2].set_title(f'6.结果(N={valid})'); axes[1,2].axis('off')
savefig(fig, 'result')
info(检测目标=valid, 步骤='预处理→增强→分割→后处理→特征→决策')`,

  // --- Chapter 12: 综合案例 ---
  'case-defect-detection': `# 红枣缺陷检测流水线
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# 高斯去噪
denoised = cv2.GaussianBlur(gray, (5,5), 1.5)
# Otsu阈值
_, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# 形态学开运算去噪
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
# 连通域标记
num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
result = img.copy()
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 50:  # 过滤小区域
        x, y, w, h = stats[i, cv2.CC_STAT_LEFT:cv2.CC_STAT_LEFT+4]
        cv2.rectangle(result, (x,y), (x+w,y+h), (0,0,255), 2)
cv2.imwrite('result.png', result)
info(检测到缺陷数=num_labels-1)`,

  'case-rice-counting': `# 米粒计数与分级
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# 形态学分离粘连
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
# 连通域
num, labels, stats, _ = cv2.connectedComponentsWithStats(opened)
result = img.copy()
count = 0
for i in range(1, num):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 100:  # 过滤噪声
        count += 1
        x, y, w, h = stats[i, cv2.CC_STAT_LEFT:cv2.CC_STAT_LEFT+4]
        color = (0,255,0) if area > 500 else (255,165,0)
        cv2.rectangle(result, (x,y), (x+w,y+h), color, 2)
cv2.imwrite('result.png', result)
info(米粒总数=count)`,

  'case-edge-comparison': `# 边缘检测方法对比
gray = imread_gray()
# Sobel
sobel = cv2.Sobel(gray, cv2.CV_64F, 1, 1, ksize=3)
sobel = np.clip(np.abs(sobel)/np.abs(sobel).max()*255, 0, 255).astype(np.uint8)
# Canny
canny = cv2.Canny(gray, 50, 150)
# Laplacian
lap = cv2.Laplacian(gray, cv2.CV_64F)
lap = np.clip(np.abs(lap)/np.abs(lap).max()*255, 0, 255).astype(np.uint8)
fig, axes = plt.subplots(1, 4, figsize=(16, 4))
for ax, im, t in zip(axes, [gray, sobel, canny, lap], ['原图', 'Sobel', 'Canny', 'Laplacian']):
    ax.imshow(im, cmap='gray'); ax.set_title(t); ax.axis('off')
savefig(fig, 'result')`,

  'case-compression': `# JPEG压缩模拟
img = imread_gray()
quality = 50
# 使用PIL进行JPEG压缩
from PIL import Image
pil_img = Image.fromarray(img)
import io
buf = io.BytesIO()
pil_img.save(buf, format='JPEG', quality=quality)
buf.seek(0)
compressed = np.array(Image.open(buf))
# 计算PSNR
mse = np.mean((img.astype(np.float64) - compressed.astype(np.float64))**2)
psnr = 10 * np.log10(255**2 / mse) if mse > 0 else float('inf')
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.imshow(img, cmap='gray'); ax1.set_title('原图'); ax1.axis('off')
ax2.imshow(compressed, cmap='gray'); ax2.set_title(f'JPEG Q={quality}'); ax2.axis('off')
plt.suptitle(f'PSNR: {psnr:.1f} dB')
savefig(fig, 'result')`,

  'case-dehaze': `# 暗通道去雾
img = imread_color().astype(np.float64) / 255.0
# 暗通道
dark = np.min(img, axis=2)
# 大气光估计
A = np.percentile(img, 99.9)
# 透射率
omega = 0.95
t = 1 - omega * np.min(dark / A)
t = np.maximum(t, 0.1)
# 去雾
result = np.zeros_like(img)
for c in range(3):
    result[:,:,c] = (img[:,:,c] - A) / t + A
result = np.clip(result, 0, 1)
result = (result * 255).astype(np.uint8)
result_bgr = cv2.cvtColor(result, cv2.COLOR_RGB2BGR)
cv2.imwrite('result.png', result_bgr)`,

  'case-weld-inspection': `# 焊缝缺陷检测
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# CLAHE增强
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
enhanced = clahe.apply(gray)
# 边缘检测
edges = cv2.Canny(enhanced, 40, 120)
# Hough直线
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=30, maxLineGap=10)
result = img.copy()
if lines is not None:
    for line in lines:
        x1,y1,x2,y2 = line[0]
        cv2.line(result, (x1,y1),(x2,y2), (0,0,255), 2)
cv2.imwrite('result.png', result)
info(检测到直线=len(lines) if lines is not None else 0)`,

  'case-skin-detection': `# 肤色分割（YCbCr空间）
img = imread_color()
ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
# 肤色范围
lower = np.array([0, 133, 77])
upper = np.array([255, 173, 127])
mask = cv2.inRange(ycrcb, lower, upper)
# 形态学清理
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
result = cv2.bitwise_and(img, img, mask=mask)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(mask, cmap='gray'); axes[1].set_title('肤色掩膜'); axes[1].axis('off')
axes[2].imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); axes[2].set_title('分割结果'); axes[2].axis('off')
savefig(fig, 'result')`,

  // --- Chapter 7: 图像压缩编码 ---
  'huffman': `# 霍夫曼编码图像压缩
import heapq
from collections import Counter

img = imread_gray()
flat = img.flatten()
freq = Counter(flat.tolist())
total = len(flat)

# 计算信息熵
entropy = -sum((f/total) * np.log2(f/total) for f in freq.values())

# 构建霍夫曼树
heap = [[f, [sym, ""]] for sym, f in freq.items()]
heapq.heapify(heap)
while len(heap) > 1:
    lo = heapq.heappop(heap)
    hi = heapq.heappop(heap)
    for pair in lo[1:]:
        pair[1] = '0' + pair[1]
    for pair in hi[1:]:
        pair[1] = '1' + pair[1]
    heapq.heappush(heap, [lo[0] + hi[0]] + lo[1:] + hi[1:])
codes = dict(heapq.heappop(heap)[1:])

# 编码
encoded = ''.join(codes[int(p)] for p in flat)
avg_bits = len(encoded) / total
ratio = 8.0 / avg_bits
efficiency = entropy / avg_bits * 100

print(f"信息熵: {entropy:.3f} bits")
print(f"平均码长: {avg_bits:.3f} bits")
print(f"压缩比: {ratio:.2f}:1")
print(f"编码效率: {efficiency:.1f}%")
print(f"原始大小: {total * 8} bits")
print(f"压缩大小: {len(encoded)} bits")

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].bar(range(256), [freq.get(i,0) for i in range(256)], width=1, color='#6366f1')
axes[1].set_title(f'灰度直方图 (共{len(freq)}个灰度级)')
plt.suptitle(f'霍夫曼编码 | 压缩比: {ratio:.2f}:1 | 效率: {efficiency:.1f}%')
savefig(fig, 'result')`,

  'shannon-fano': `# 费诺(Shannon-Fano)编码图像压缩
from collections import Counter

img = imread_gray()
flat = img.flatten()
freq = Counter(flat.tolist())
total = len(flat)

# 按频率降序排列
sorted_syms = sorted(freq.keys(), key=lambda s: freq[s], reverse=True)

# 递归费诺编码
codes = {}
def fano_split(syms, prefix):
    if len(syms) <= 1:
        if syms:
            codes[syms[0]] = prefix or '0'
        return
    s = sum(freq[s] for s in syms)
    running, best_k, best_diff = 0, 0, float('inf')
    for k in range(len(syms) - 1):
        running += freq[syms[k]]
        diff = abs(2 * running - s)
        if diff < best_diff:
            best_diff = diff
            best_k = k
    fano_split(syms[:best_k+1], prefix + '0')
    fano_split(syms[best_k+1:], prefix + '1')

fano_split(sorted_syms, '')

# 统计
encoded = ''.join(codes[int(p)] for p in flat)
avg_bits = len(encoded) / total
entropy = -sum((f/total) * np.log2(f/total) for f in freq.values())
ratio = 8.0 / avg_bits

print(f"信息熵: {entropy:.3f} bits")
print(f"费诺平均码长: {avg_bits:.3f} bits")
print(f"压缩比: {ratio:.2f}:1")
print(f"编码效率: {entropy/avg_bits*100:.1f}%")

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].bar(range(256), [freq.get(i,0) for i in range(256)], width=1, color='#f59e0b')
axes[1].set_title(f'灰度直方图 (共{len(freq)}个灰度级)')
plt.suptitle(f'费诺编码 | 压缩比: {ratio:.2f}:1 | 效率: {entropy/avg_bits*100:.1f}%')
savefig(fig, 'result')`,

  'rle': `# 游程编码(RLE)图像压缩
img = imread_gray()
h, w = img.shape
flat = img.flatten()

# 水平扫描游程编码
runs = []
current, count = int(flat[0]), 1
for i in range(1, len(flat)):
    if int(flat[i]) == current:
        count += 1
    else:
        runs.append((current, count))
        current, count = int(flat[i]), 1
runs.append((current, count))

# 解码验证
decoded = []
for val, cnt in runs:
    decoded.extend([val] * cnt)
decoded = np.array(decoded, dtype=np.uint8).reshape(h, w)

# 统计
total_pixels = h * w
ratio = total_pixels / (len(runs) * 2)
max_run = max(r[1] for r in runs)
avg_run = total_pixels / len(runs)

print(f"像素总数: {total_pixels}")
print(f"游程总数: {len(runs)}")
print(f"压缩比: {ratio:.2f}:1")
print(f"最长游程: {max_run}")
print(f"平均游程: {avg_run:.1f}")

fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(decoded, cmap='gray'); axes[1].set_title('解码重建(无损)'); axes[1].axis('off')
axes[2].bar(range(min(50, len(runs))), [r[1] for r in runs[:50]], color='#10b981')
axes[2].set_title('前50个游程长度')
plt.suptitle(f'游程编码 | 压缩比: {ratio:.2f}:1 | 游程数: {len(runs)}')
savefig(fig, 'result')`,

  'bitplane': `# 位平面分解与编码
img = imread_gray()
h, w = img.shape

# 提取8个位平面
planes = []
for bit in range(8):
    plane = (img >> bit) & 1
    planes.append(plane)

# 格雷码位平面
gray_coded = img ^ (img >> 1)
gray_planes = [(gray_coded >> bit) & 1 for bit in range(8)]

# 统计各位平面信息
for bit in range(7, -1, -1):
    ones_pct = planes[bit].mean() * 100
    print(f"位平面 {bit}: 1的比例={ones_pct:.1f}%, 信息贡献={(2**bit)/255*100:.1f}%")

# 仅用高位重建
recon = sum(planes[bit].astype(np.uint8) << bit for bit in range(4, 8))
mse = np.mean((img.astype(float) - recon.astype(float))**2)
psnr = 10 * np.log10(255**2 / (mse + 1e-10))

fig, axes = plt.subplots(3, 4, figsize=(14, 10))
for i in range(8):
    axes[0, i % 4].imshow(planes[7-i], cmap='gray')
    axes[0, i % 4].set_title(f'位平面 {7-i}')
    axes[0, i % 4].axis('off')
for i in range(8):
    axes[1, i % 4].imshow(gray_planes[7-i], cmap='gray')
    axes[1, i % 4].set_title(f'格雷码 {7-i}')
    axes[1, i % 4].axis('off')
axes[2, 0].imshow(img, cmap='gray'); axes[2, 0].set_title('原图'); axes[2, 0].axis('off')
axes[2, 1].imshow(recon, cmap='gray'); axes[2, 1].set_title('高4位重建'); axes[2, 1].axis('off')
axes[2, 2].axis('off')
axes[2, 3].axis('off')
plt.suptitle(f'位平面分解 | 高4位重建 PSNR={psnr:.1f}dB')
plt.tight_layout()
savefig(fig, 'result')`,
};

// ===================== OCTAVE TEMPLATES =====================
const OC = {
  // --- Chapter 1: 概述 ---
  gray: `img = imread(INPUT_IMAGE);
if size(img, 3) == 3; gray = rgb2gray(img); else; gray = img; end
imwrite(gray, 'result.png');
disp(['灰度化完成, 尺寸: ' mat2str(size(gray))]);`,

  'channel-split': `img = imread(INPUT_IMAGE);
r = img(:,:,1); g = img(:,:,2); b = img(:,:,3);
imwrite(r, 'result1.png'); imwrite(g, 'result2.png'); imwrite(b, 'result3.png');
disp('通道分离完成: R/G/B 三个通道已保存');`,

  resize: `img = imread(INPUT_IMAGE);
small = imresize(img, 0.5);
big = imresize(img, 2.0);
imwrite(small, 'result1.png');
imwrite(big, 'result2.png');
disp(['缩小: ' mat2str(size(small)) ' 放大: ' mat2str(size(big))]);`,

  crop: `img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);
% 裁剪中心区域
cy = round(h/4); cx = round(w/4);
cropped = img(cy+1:h-cy, cx+1:w-cx, :);
imwrite(cropped, 'result.png');
disp(['裁剪完成, 原图: ' mat2str([h w]) ' 裁剪后: ' mat2str(size(cropped))]);`,

  histogram: `img = imread(INPUT_IMAGE);
if size(img, 3) == 3; gray = rgb2gray(img); else; gray = img; end
imwrite(gray, 'result1.png');
% 保存直方图
h = figure('visible','off'); hist(double(gray(:)), 0:255);
title('灰度直方图'); xlabel('灰度值'); ylabel('像素数');
print(h, 'result2.png', '-dpng'); close(h);`,

  noise: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
g = double(gray);
% 高斯噪声
gauss = randn(size(g)) * 15;
noisy_g = uint8(max(0, min(255, g + gauss)));
% 椒盐噪声
noisy_sp = g;
n = round(0.02 * numel(g));
idx = randperm(numel(g), n);
noisy_sp(idx(1:round(n/2))) = 0;
noisy_sp(idx(round(n/2)+1:end)) = 255;
noisy_sp = uint8(noisy_sp);
imwrite(gray, 'result1.png'); imwrite(noisy_g, 'result2.png'); imwrite(noisy_sp, 'result3.png');
disp('噪声添加完成: 原图/高斯噪声/椒盐噪声');`,

  // --- Chapter 2: 基础运算 ---
  translate: `img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);
% 平移矩阵: x+50, y+30
M = [1 0 50; 0 1 30];
% 使用 imtranslate 或手动仿射
result = imtranslate(img, [50, 30]);
imwrite(result, 'result.png');
disp('图像平移完成: dx=50, dy=30');`,

  rotate: `img = imread(INPUT_IMAGE);
% 旋转45度
result = imrotate(img, 45, 'bicubic', 'crop');
imwrite(result, 'result.png');
disp('图像旋转完成: 角度=45度');`,

  flip: `img = imread(INPUT_IMAGE);
h_flip = fliplr(img);   % 水平翻转
v_flip = flipud(img);   % 垂直翻转
imwrite(img, 'result1.png'); imwrite(h_flip, 'result2.png'); imwrite(v_flip, 'result3.png');
disp('翻转完成: 原图/水平翻转/垂直翻转');`,

  affine: `pkg load image;
img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);
% 仿射变换: 剪切效果
src_pts = [0 0; w 0; 0 h];
dst_pts = [round(w*0.1) 0; w 0; 0 h];
% 计算仿射矩阵
T = cp2tform(src_pts, dst_pts, 'affine');
result = imtransform(img, T, 'Size', [h w]);
imwrite(result, 'result.png');
disp('仿射变换(剪切)完成');`,

  projection: `pkg load image;
img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);
% 投影变换: 四点对应
src_pts = [50 50; w-50 50; 50 h-50; w-50 h-50];
dst_pts = [0 0; w 0; 0 h; w h];
T = cp2tform(src_pts, dst_pts, 'projective');
result = imtransform(img, T, 'Size', [h w]);
imwrite(result, 'result.png');
disp('投影变换完成');`,

  // --- Chapter 3: 基本运算 ---
  invert: `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
result = 255 - gray;
imwrite(result, 'result.png');
disp(['反色完成, 原图均值: ' num2str(mean(gray(:))) ' 反色均值: ' num2str(mean(result(:)))]);`,

  gamma: `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
g = double(gray) / 255.0;
gamma_val = 0.5;  % < 1 提亮, > 1 压暗
corrected = uint8(g .^ gamma_val * 255);
imwrite(corrected, 'result.png');
disp(['伽马校正完成, gamma=' num2str(gamma_val)]);`,

  'contrast-stretch': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
g = double(gray);
min_val = min(g(:)); max_val = max(g(:));
result = uint8((g - min_val) / (max_val - min_val) * 255);
imwrite(result, 'result.png');
disp(['对比度拉伸完成, 原范围: [' num2str(min_val) ',' num2str(max_val) '] -> [0,255]']);`,

  threshold: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end
T = graythresh(gray);
binary = imbinarize(gray, T);
imwrite(binary, 'result.png');
disp(['Otsu阈值: ' num2str(T)]);`,

  quantize: `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
levels = 8;
quantized = floor(double(gray) / (256/levels)) * (256/levels);
quantized = uint8(quantized);
imwrite(quantized, 'result.png');
disp(['量化完成, 级别: ' num2str(levels) ' 实际灰度数: ' num2str(length(unique(quantized(:))))]);`,

  // --- Chapter 4: 空间域增强 ---
  smooth: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 均值滤波
mean_filt = imfilter(double(gray), fspecial('average', [5 5]));
% 中值滤波
med_filt = medfilt2(gray, [5 5]);
% 高斯滤波
gauss_filt = imfilter(double(gray), fspecial('gaussian', [5 5], 1.0));
imwrite(gray, 'result1.png');
imwrite(uint8(mean_filt), 'result2.png');
imwrite(med_filt, 'result3.png');
imwrite(uint8(gauss_filt), 'result4.png');
disp('平滑滤波对比: 原图/均值/中值/高斯');`,

  sharpen: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
g = double(gray);
% 拉普拉斯锐化
lap_kern = [0 -1 0; -1 5 -1; 0 -1 0];
lap_sharp = imfilter(g, lap_kern);
% USM锐化: 原图*1.5 - 模糊*0.5
blurred = imfilter(g, fspecial('gaussian', [5 5], 3));
usm_sharp = g * 1.5 - blurred * 0.5;
imwrite(gray, 'result1.png');
imwrite(uint8(max(0, min(255, lap_sharp))), 'result2.png');
imwrite(uint8(max(0, min(255, usm_sharp))), 'result3.png');
disp('锐化完成: 原图/拉普拉斯/USM');`,

  denoise: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 添加噪声后中值滤波去噪
noisy = imnoise(gray, 'salt & pepper', 0.05);
denoised = medfilt2(noisy, [5 5]);
imwrite(gray, 'result1.png');
imwrite(noisy, 'result2.png');
imwrite(denoised, 'result3.png');
disp('去噪完成: 原图/加噪/中值去噪');`,

  gradient: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% Sobel梯度
hx = fspecial('sobel'); hy = hx';
gx = imfilter(gray, hx);
gy = imfilter(gray, hy);
mag = sqrt(gx.^2 + gy.^2);
mag = mat2gray(mag);
imwrite(mag, 'result.png');
disp(['梯度计算完成, 均值: ' num2str(mean(mag(:))) ' 最大值: ' num2str(max(mag(:)))]);`,

  directional: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 方向检测核
k_h = [-1 -1 -1; 2 2 2; -1 -1 -1];   % 水平
k_v = [-1 2 -1; -1 2 -1; -1 2 -1];   % 垂直
k_d1 = [2 -1 -1; -1 2 -1; -1 -1 2];  % 45度
k_d2 = [-1 -1 2; -1 2 -1; 2 -1 -1];  % 135度
r_h = mat2gray(abs(imfilter(gray, k_h)));
r_v = mat2gray(abs(imfilter(gray, k_v)));
r_d1 = mat2gray(abs(imfilter(gray, k_d1)));
r_d2 = mat2gray(abs(imfilter(gray, k_d2)));
imwrite(r_h, 'result1.png'); imwrite(r_v, 'result2.png');
imwrite(r_d1, 'result3.png'); imwrite(r_d2, 'result4.png');
disp('方向滤波完成: 水平/垂直/45度/135度');`,

  emboss: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 浮雕核(方向导数+偏移128)
k = [-2 -1 0; -1 1 1; 0 1 2];
result = imfilter(gray, k) + 128;
result = uint8(max(0, min(255, result)));
imwrite(result, 'result.png');
disp('浮雕效果完成');`,

  // --- Chapter 5: 频率域 ---
  fft: `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 二维FFT并中心化
F = fftshift(fft2(gray));
% 幅度谱(对数压缩)
mag = log1p(abs(F));
mag_norm = mat2gray(mag);
% 相位谱
phase = angle(F);
imwrite(mag_norm, 'result1.png');
imwrite(mat2gray(phase), 'result2.png');
disp(['频谱分析完成, 尺寸: ' mat2str(size(gray))]);`,

  'lowpass-freq': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
F = fftshift(fft2(gray));
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);
D0 = 30;
% 理想低通
H_ideal = double(D <= D0);
filtered = abs(ifft2(ifftshift(F .* H_ideal)));
result = uint8(mat2gray(filtered) * 255);
imwrite(result, 'result.png');
disp(['频域低通滤波完成, 截止频率: ' num2str(D0)]);`,

  'highpass-freq': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
F = fftshift(fft2(gray));
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);
D0 = 30;
% 理想高通
H_hp = double(D > D0);
filtered = abs(ifft2(ifftshift(F .* H_hp)));
result = uint8(mat2gray(filtered) * 255);
imwrite(result, 'result.png');
disp(['频域高通滤波完成, 截止频率: ' num2str(D0)]);`,

  'bandpass-freq': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
F = fftshift(fft2(gray));
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);
% 带通范围: D1 < D < D2
D1 = 20; D2 = 60;
H_band = double(D >= D1 & D <= D2);
filtered = abs(ifft2(ifftshift(F .* H_band)));
result = uint8(mat2gray(filtered) * 255);
imwrite(result, 'result.png');
disp(['带通滤波完成, 范围: ' num2str(D1) '-' num2str(D2)]);`,

  homomorphic: `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 同态滤波: 取对数 → FFT → 滤波 → 指数
img_log = log(gray + 1);
F = fftshift(fft2(img_log));
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);
% 同态滤波函数: rh=1.5, rl=0.3, c=40
rh = 1.5; rl = 0.3; c = 40; D0 = 40;
H = (rh - rl) * (1 - exp(-c * (D.^2) / (D0^2))) + rl;
F_filt = F .* H;
result = exp(real(ifft2(ifftshift(F_filt))));
result = uint8(mat2gray(result) * 255);
imwrite(result, 'result.png');
disp('同态滤波完成');`,

  // --- Chapter 6: 图像恢复与增强 ---
  'hist-eq': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
equ = histeq(gray);
imwrite(gray, 'result1.png');
imwrite(equ, 'result2.png');
disp(['直方图均衡化完成, 均值: ' num2str(mean(gray(:))) ' -> ' num2str(mean(equ(:)))]);`,

  clahe: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 不同clipLimit的CLAHE增强
r1 = adapthisteq(gray, 'ClipLimit', 0.01, 'NumTiles', [8 8]);
r2 = adapthisteq(gray, 'ClipLimit', 0.03, 'NumTiles', [8 8]);
r3 = adapthisteq(gray, 'ClipLimit', 0.05, 'NumTiles', [8 8]);
imwrite(gray, 'result1.png'); imwrite(r1, 'result2.png');
imwrite(r2, 'result3.png'); imwrite(r3, 'result4.png');
disp('CLAHE对比完成: 原图/clip=0.01/0.03/0.05');`,

  'log-transform': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 对数变换: g = c * log(1 + f)
c = 40;
result = c * log1p(gray);
result = uint8(mat2gray(result) * 255);
imwrite(result, 'result.png');
disp(['对数变换完成, c=' num2str(c) ' 原图均值: ' num2str(mean(gray(:)))]);`,

  unsharp: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% USM锐化: 原图 + k * (原图 - 模糊)
blurred = imfilter(gray, fspecial('gaussian', [5 5], 3));
k = 1.0;
result = gray + k * (gray - blurred);
result = uint8(max(0, min(255, result)));
imwrite(result, 'result.png');
disp(['USM锐化完成, k=' num2str(k)]);`,

  'color-enhance': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3
  % HSV空间: 只对V通道均衡化
  hsv = rgb2hsv(img);
  hsv(:,:,3) = histeq(uint8(hsv(:,:,3)*255)) / 255.0;
  enhanced = hsv2rgb(hsv);
  imwrite(uint8(enhanced*255), 'result.png');
else
  enhanced = histeq(img);
  imwrite(enhanced, 'result.png');
end
disp('彩色增强完成(HSV亮度均衡)');`,

  // --- Chapter 7: 图像压缩与退化 ---
  'motion-blur': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 运动模糊核: 长度15, 角度45度
len = 15; angle = 45;
kernel = fspecial('motion', len, angle);
blurred = imfilter(gray, kernel);
result = uint8(max(0, min(255, blurred)));
imwrite(result, 'result.png');
disp(['运动模糊完成, 长度=' num2str(len) ' 角度=' num2str(angle)]);`,

  'defocus-blur': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 离焦模糊: 圆盘核
radius = 7;
kernel = fspecial('disk', radius);
blurred = imfilter(gray, kernel);
result = uint8(max(0, min(255, blurred)));
imwrite(result, 'result.png');
disp(['离焦模糊完成, 半径=' num2str(radius)]);`,

  'inverse-filter': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 模拟运动模糊
kernel = fspecial('motion', 15, 0);
blurred = imfilter(gray, kernel);
% 频域逆滤波复原
F_b = fft2(blurred);
F_k = fft2(kernel, size(gray,1), size(gray,2));
F_k(abs(F_k) < 0.01) = 0.01;  % 阈值防除零
F_r = F_b ./ F_k;
restored = real(ifft2(F_r));
result = uint8(mat2gray(restored) * 255);
imwrite(result, 'result.png');
disp('逆滤波复原完成');`,

  'wiener-filter': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 模拟模糊+噪声
kernel = fspecial('motion', 15, 0);
blurred = imfilter(gray, kernel);
noisy = blurred + randn(size(gray)) * 5;
% 维纳滤波(频域)
F_n = fft2(noisy);
F_k = fft2(kernel, size(gray,1), size(gray,2));
K = 0.02;  % 信噪比参数
F_w = (conj(F_k) ./ (abs(F_k).^2 + K)) .* F_n;
restored = real(ifft2(F_w));
result = uint8(mat2gray(restored) * 255);
imwrite(result, 'result.png');
disp('维纳滤波复原完成');`,

  'blind-deconv': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img))/255; else; gray = double(img)/255; end
% 模拟模糊
kernel = fspecial('motion', 9, 0);
blurred = imfilter(gray, kernel);
% Richardson-Lucy盲反卷积(简化)
psf_est = ones(9) / 81;  % 初始均匀核估计
estimate = blurred;
for iter = 1:20
  conv_est = imfilter(estimate, psf_est);
  conv_est(conv_est < 1e-10) = 1e-10;
  ratio = blurred ./ conv_est;
  estimate = estimate .* imfilter(ratio, rot90(psf_est, 2));
end
result = uint8(max(0, min(255, estimate * 255)));
imwrite(result, 'result.png');
disp('盲反卷积复原完成(20次迭代)');`,

  // --- Chapter 8: 图像分割 ---
  sobel: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=double(rgb2gray(img)); else; gray=double(img); end
hx = fspecial('sobel'); hy = hx';
gx = imfilter(gray, hx); gy = imfilter(gray, hy);
mag = sqrt(gx.^2 + gy.^2);
result = uint8(mat2gray(mag) * 255);
imwrite(result, 'result.png');
disp('Sobel边缘检测完成');`,

  canny: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
edges = edge(gray, 'canny', [0.1 0.3]);
imwrite(edges, 'result.png');
disp(['Canny边缘检测完成, 边缘像素: ' num2str(sum(edges(:)))]);`,

  'threshold-seg': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end
% Otsu自动阈值
T = graythresh(gray);
binary = imbinarize(gray, T);
imwrite(binary, 'result.png');
disp(['Otsu分割完成, 阈值=' num2str(T) ' 前景像素=' num2str(sum(binary(:)))]);`,

  'region-grow': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
[h, w] = size(gray);
% 种子点: 图像中心
sy = round(h/2); sx = round(w/2);
seed_val = gray(sy, sx);
thresh_val = 20;
mask = false(h, w);
mask(sy, sx) = true;
changed = true;
while changed
  changed = false;
  region_mean = mean(gray(mask));
  for dy = -1:1
    for dx = -1:1
      if dy==0 && dx==0; continue; end
      shifted = circshift(mask, [dy dx]);
      candidates = shifted & ~mask;
      diff = abs(gray - region_mean) < thresh_val;
      new_pts = candidates & diff;
      if any(new_pts(:))
        mask = mask | new_pts;
        changed = true;
      end
    end
  end
end
result = uint8(mask) .* uint8(gray);
imwrite(result, 'result.png');
disp(['区域生长完成, 种子值=' num2str(seed_val) ' 区域像素=' num2str(sum(mask(:)))]);`,

  watershed: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 分水岭分割
bw = imbinarize(gray, graythresh(gray));
D = -bwdist(~bw);
D(~bw) = -Inf;
L = watershed(D);
% 标记分水岭边界
result = img;
if size(result,3)==3
  result(L==0) = 255;
else
  result(L==0) = 255;
end
imwrite(result, 'result.png');
disp(['分水岭分割完成, 区域数=' num2str(max(L(:)))]);`,

  'kmeans-seg': `img = imread(INPUT_IMAGE);
[h, w, c] = size(img);
pixels = double(reshape(img, [], c));
% K-means聚类(K=3)
K = 3;
idx = kmeans(pixels, K, 'MaxIter', 50);
centers = zeros(K, c);
for i = 1:K
  centers(i,:) = mean(pixels(idx==i, :));
end
seg = centers(idx, :);
result = uint8(reshape(seg, [h, w, c]));
imwrite(result, 'result.png');
disp(['K-means分割完成, K=' num2str(K)]);`,

  // --- Chapter 9: 形态学 ---
  erode: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end
binary = imbinarize(gray, graythresh(gray));
se = strel('disk', 2);
result = imerode(binary, se);
imwrite(result, 'result.png');
disp('腐蚀完成');`,

  dilate: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end
binary = imbinarize(gray, graythresh(gray));
se = strel('disk', 2);
result = imdilate(binary, se);
imwrite(result, 'result.png');
disp('膨胀完成');`,

  'open-close': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
se = strel('disk', 3);
% 开运算: 先腐蚀后膨胀, 去小目标
opened = imopen(binary, se);
% 闭运算: 先膨胀后腐蚀, 填小孔洞
closed = imclose(binary, se);
imwrite(binary, 'result1.png');
imwrite(opened, 'result2.png');
imwrite(closed, 'result3.png');
disp('开闭运算对比: 二值图/开运算/闭运算');`,

  'morph-edge': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
se = strel('disk', 1);
% 外边界 = 膨胀 - 原图
dilated = imdilate(binary, se);
edge_outer = dilated & ~binary;
% 内边界 = 原图 - 腐蚀
eroded = imerode(binary, se);
edge_inner = binary & ~eroded;
imwrite(edge_outer, 'result1.png');
imwrite(edge_inner, 'result2.png');
disp(['形态学边缘: 外边界=' num2str(sum(edge_outer(:))) ' 内边界=' num2str(sum(edge_inner(:)))]);`,

  skeleton: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
% 骨架提取: 迭代细化
skel = bwmorph(binary, 'skel', Inf);
imwrite(binary, 'result1.png');
imwrite(skel, 'result2.png');
disp(['骨架提取完成, 骨架像素=' num2str(sum(skel(:))) ' 原始像素=' num2str(sum(binary(:)))]);`,

  tophat: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
se = strel('disk', 8);
% 顶帽 = 原图 - 开运算(提取比周围亮的小目标)
tophat = imtophat(gray, se);
% 底帽 = 闭运算 - 原图(提取比周围暗的小目标)
bothat = imbothat(gray, se);
imwrite(tophat, 'result1.png');
imwrite(bothat, 'result2.png');
disp(['顶帽均值=' num2str(mean(tophat(:))) ' 底帽均值=' num2str(mean(bothat(:)))]);`,

  // --- Chapter 10: 特征提取 ---
  'histogram-feature': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 归一化直方图
[counts, ~] = hist(gray(:), 0:255);
p = counts / sum(counts);
p_nz = p(p > 0);
% 统计特征
mean_val = sum((0:255) .* p);
var_val = sum(((0:255) - mean_val).^2 .* p);
std_val = sqrt(var_val);
entropy_val = -sum(p_nz .* log2(p_nz));
energy_val = sum(p.^2);
disp(['均值=' num2str(mean_val) ' 标准差=' num2str(std_val) ...
      ' 熵=' num2str(entropy_val) ' 能量=' num2str(energy_val)]);
h = figure('visible','off'); hist(gray(:), 0:255);
title(['直方图特征: 均值=' num2str(round(mean_val)) ' 熵=' num2str(round(entropy_val,2))]);
print(h, 'result.png', '-dpng'); close(h);`,

  glcm: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 量化到16级
gray_q = uint8(double(gray)/256*16);
% 计算GLCM
glcm = graycomatrix(gray_q, 'NumLevels', 16, 'Offset', [0 1]);
glcm_norm = double(glcm) / sum(glcm(:));
% 纹理特征
contrast = sum(sum(((repmat((1:16)',1,16) - repmat(1:16,16,1)).^2) .* glcm_norm));
energy = sum(glcm_norm(:).^2);
p_nz = glcm_norm(glcm_norm > 0);
entropy_val = -sum(p_nz .* log2(p_nz));
disp(['GLCM: 对比度=' num2str(contrast) ' 能量=' num2str(energy) ' 熵=' num2str(entropy_val)]);
h = figure('visible','off'); imagesc(glcm_norm); colorbar; title('GLCM');
print(h, 'result.png', '-dpng'); close(h);`,

  'edge-feature': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% Canny边缘
edges = edge(gray, 'canny');
% 边缘密度
edge_density = sum(edges(:)) / numel(edges);
% Harris角点(简化: 用edge的sobel结果近似)
h_corners = corner(gray, 'Harris');
n_corners = size(h_corners, 1);
disp(['边缘密度=' num2str(edge_density) ' 角点数=' num2str(n_corners)]);
result = img;
if size(result,3)==3
  result(:,:,1) = max(result(:,:,1), edges * 255);
  result(:,:,2) = min(result(:,:,2), uint8(~edges) * 255);
end
imwrite(result, 'result.png');`,

  'region-feature': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
% 连通域标记与特征
[L, num] = bwlabel(binary, 8);
stats = regionprops(L, 'Area', 'Perimeter', 'BoundingBox', 'Centroid');
disp(['连通域数: ' num2str(num)]);
result = img;
for i = 1:num
  if stats(i).Area > 50
    bb = stats(i).BoundingBox;
    % 画矩形
    r1 = max(1,round(bb(2))); r2 = min(size(result,1),round(bb(2)+bb(4)));
    c1 = max(1,round(bb(1))); c2 = min(size(result,2),round(bb(1)+bb(3)));
    if size(result,3)==3
      result(r1,c1:c2,1) = 255; result(r1,c1:c2,2) = 0; result(r1,c1:c2,3) = 0;
      result(r2,c1:c2,1) = 255; result(r2,c1:c2,2) = 0; result(r2,c1:c2,3) = 0;
      result(r1:r2,c1,1) = 255; result(r1:r2,c1,2) = 0; result(r1:r2,c1,3) = 0;
      result(r1:r2,c2,1) = 255; result(r1:r2,c2,2) = 0; result(r1:r2,c2,3) = 0;
    end
  end
end
imwrite(result, 'result.png');`,

  hough: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
edges = edge(gray, 'canny');
% Hough变换检测直线
[H, theta, rho] = hough(edges);
peaks = houghpeaks(H, 10, 'threshold', ceil(0.3*max(H(:))));
lines = houghlines(edges, theta, rho, peaks, 'FillGap', 10, 'MinLength', 50);
disp(['Hough检测直线: ' num2str(length(lines)) ' 条']);
result = img;
if size(result,3)==3
  for k = 1:length(lines)
    xy = [lines(k).point1; lines(k).point2];
    r1 = round(xy(1,2)); c1 = round(xy(1,1));
    r2 = round(xy(2,2)); c2 = round(xy(2,1));
    % 简化: 在端点画标记
    result(max(1,min(r1,size(result,1))), max(1,min(c1,size(result,2))), :) = [255 0 0];
    result(max(1,min(r2,size(result,1))), max(1,min(c2,size(result,2))), :) = [255 0 0];
  end
end
imwrite(result, 'result.png');`,

  template: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
[h, w] = size(gray);
% 提取模板(图像中心区域)
th = round(h/4); tw = round(w/4);
ty = round(h/2 - th/2); tx = round(w/2 - tw/2);
tmpl = gray(ty:ty+th-1, tx:tx+tw-1);
% 归一化互相关匹配
C = normxcorr2(tmpl, gray);
[~, max_idx] = max(C(:));
[peak_y, peak_x] = ind2sub(size(C), max_idx);
disp(['模板匹配完成, 最佳位置: (' num2str(peak_x) ',' num2str(peak_y) ')']);
h_fig = figure('visible','off');
imshow(C, []); title('归一化互相关');
print(h_fig, 'result.png', '-dpng'); close(h_fig);`,

  // --- Chapter 11: 综合应用 ---
  batch: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 处理流水线: 灰度→去噪→增强→分割
denoised = imgaussfilt(gray, 2);
enhanced = histeq(denoised);
binary = imbinarize(enhanced, graythresh(enhanced));
se = strel('disk', 1);
cleaned = imopen(binary, se);
[L, num] = bwlabel(cleaned, 8);
stats = regionprops(L, 'Area');
count = sum([stats.Area] > 30);
disp(['批量处理流水线: 检测目标=' num2str(count)]);
imwrite(cleaned, 'result.png');`,

  weld: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% CLAHE增强
enhanced = adapthisteq(gray, 'ClipLimit', 0.03, 'NumTiles', [8 8]);
% 边缘检测
edges = edge(enhanced, 'canny', [0.1 0.3]);
% 形态学清理
se = strel('disk', 1);
cleaned = imopen(edges, se);
imwrite(cleaned, 'result.png');
disp('焊缝缺陷检测完成');`,

  logcount: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 去噪 + Otsu分割
denoised = imgaussfilt(gray, 1.5);
binary = imbinarize(denoised, graythresh(denoised));
% 形态学操作
se = strel('disk', 4);
closed = imclose(binary, se);
opened = imopen(closed, se);
% 距离变换 + 局部极大
D = bwdist(~opened);
[L, num] = bwlabel(opened, 8);
stats = regionprops(L, 'Area');
count = sum([stats.Area] > 50);
disp(['原木计数: ' num2str(count)]);
imwrite(opened, 'result.png');`,

  datesort: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% Otsu分割 + 连通域分析
binary = imbinarize(gray, graythresh(gray));
se = strel('disk', 2);
cleaned = imopen(binary, se);
[L, num] = bwlabel(cleaned, 8);
stats = regionprops(L, 'Area');
good = sum([stats.Area] > 500);
defect = sum([stats.Area] > 50 & [stats.Area] <= 500);
disp(['红枣分选: 优等=' num2str(good) ' 缺陷=' num2str(defect)]);
imwrite(cleaned, 'result.png');`,

  panorama: `img = imread(INPUT_IMAGE);
[h, w, c] = size(img);
% 模拟两幅重叠图像并拼接
overlap = round(w/3);
img1 = img(:, 1:w-overlap, :);
img2 = img(:, overlap+1:end, :);
[h1, w1, ~] = size(img1);
[h2, w2, ~] = size(img2);
% 水平拼接
pan_w = w1 + w2;
result = zeros(max(h1,h2), pan_w, c, 'uint8');
result(1:h1, 1:w1, :) = img1;
result(1:h2, w1+1:pan_w, :) = img2;
imwrite(result, 'result.png');
disp(['全景拼接完成, 宽度=' num2str(pan_w) ' 重叠=' num2str(overlap)]);`,

  // --- Chapter 12: 目标描述与识别 ---
  'region-desc': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
[L, num] = bwlabel(binary, 8);
stats = regionprops(L, 'Area', 'Perimeter', 'BoundingBox', 'Eccentricity', 'Orientation');
if num > 0
  [~, max_idx] = max([stats.Area]);
  s = stats(max_idx);
  circ = 4 * pi * s.Area / (s.Perimeter^2 + 1e-10);
  disp(['最大区域: 面积=' num2str(s.Area) ' 周长=' num2str(s.Perimeter) ...
        ' 圆度=' num2str(circ) ' 离心率=' num2str(s.Eccentricity)]);
end
imwrite(binary, 'result.png');`,

  'boundary-desc': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
B = bwboundaries(binary, 8);
if ~isempty(B)
  b = B{1};
  % 傅里叶描述子
  pts = b(:,2) + 1j * b(:,1);
  fd = fft(double(pts));
  % 用前10个描述子重建
  N = 10;
  fd_trunc = zeros(size(fd));
  fd_trunc(1:N) = fd(1:N);
  fd_trunc(end-N+2:end) = fd(end-N+2:end);
  recon = ifft(fd_trunc);
  h_fig = figure('visible','off');
  subplot(1,2,1); plot(b(:,2), -b(:,1)); axis equal; title('原始边界');
  subplot(1,2,2); plot(real(recon), -imag(recon), 'r'); axis equal;
  title(['FD重建(N=' num2str(N) ')']);
  print(h_fig, 'result.png', '-dpng'); close(h_fig);
  disp(['边界描述子: 链码长度=' num2str(length(b))]);
end`,

  moments: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% 几何矩
m00 = sum(gray(:));
[h, w] = size(gray);
[x, y] = meshgrid(1:w, 1:h);
m10 = sum(sum(x .* gray));
m01 = sum(sum(y .* gray));
cx = m10 / (m00 + 1e-10);
cy = m01 / (m00 + 1e-10);
disp(['零阶矩(面积)=' num2str(m00) ' 质心=(' num2str(cx) ',' num2str(cy) ')']);
% 标记质心
gray_u8 = uint8(gray);
result = cat(3, gray_u8, gray_u8, gray_u8);
rc = max(1,min(round(cy),h)); cc = max(1,min(round(cx),w));
result(max(1,rc-3):min(h,rc+3), max(1,cc-3):min(w,cc+3), 1) = 255;
result(max(1,rc-3):min(h,rc+3), max(1,cc-3):min(w,cc+3), 2) = 0;
result(max(1,rc-3):min(h,rc+3), max(1,cc-3):min(w,cc+3), 3) = 0;
imwrite(result, 'result.png');`,

  classify: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 特征提取: 灰度直方图(16级) + 均值 + 标准差 + 边缘密度
[counts, ~] = hist(double(gray(:)), linspace(0,255,16));
feat = [counts/sum(counts), mean(gray(:))/255, std(double(gray(:)))/255];
edges = edge(gray, 'canny');
feat = [feat, sum(edges(:))/numel(edges)];
disp(['特征向量维度=' num2str(length(feat))]);
% 简单分类(演示用)
h_fig = figure('visible','off');
bar(feat); title(['特征向量(d=' num2str(length(feat)) ')']);
print(h_fig, 'result.png', '-dpng'); close(h_fig);`,

  pipeline: `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% Step 1: 高斯去噪
denoised = imgaussfilt(gray, 1.0);
% Step 2: CLAHE增强
enhanced = adapthisteq(denoised, 'ClipLimit', 0.02, 'NumTiles', [8 8]);
% Step 3: Otsu分割
binary = imbinarize(enhanced, graythresh(enhanced));
% Step 4: 形态学后处理
se = strel('disk', 1);
cleaned = imopen(binary, se);
% Step 5: 连通域分析
[L, num] = bwlabel(cleaned, 8);
stats = regionprops(L, 'Area');
valid = sum([stats.Area] > 30);
disp(['流水线完成: 检测目标=' num2str(valid) ' 步骤=去噪→增强→分割→后处理']);
imwrite(cleaned, 'result.png');`,

  // --- Chapter 12: 综合案例 ---
  'case-defect-detection': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% 高斯去噪
denoised = imgaussfilt(gray, 1.5);
% Otsu二值化
binary = imbinarize(denoised, graythresh(denoised));
% 形态学开运算去噪
se = strel('disk', 2);
cleaned = imopen(binary, se);
% 连通域标记
[L, num] = bwlabel(cleaned, 8);
stats = regionprops(L, 'Area', 'BoundingBox');
result = img;
count = 0;
for i = 1:num
  if stats(i).Area > 50
    count = count + 1;
    bb = stats(i).BoundingBox;
    r1 = max(1,round(bb(2))); r2 = min(size(result,1),round(bb(2)+bb(4)));
    c1 = max(1,round(bb(1))); c2 = min(size(result,2),round(bb(1)+bb(3)));
    if size(result,3)==3
      result(r1,c1:c2,1) = 255; result(r1,c1:c2,2) = 0; result(r1,c1:c2,3) = 0;
      result(r2,c1:c2,1) = 255; result(r2,c1:c2,2) = 0; result(r2,c1:c2,3) = 0;
      result(r1:r2,c1,1) = 255; result(r1:r2,c1,2) = 0; result(r1:r2,c1,3) = 0;
      result(r1:r2,c2,1) = 255; result(r1:r2,c2,2) = 0; result(r1:r2,c2,3) = 0;
    end
  end
end
imwrite(result, 'result.png');
disp(['缺陷检测完成, 检测到: ' num2str(count)]);`,

  'case-rice-counting': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
% 形态学分离粘连
se = strel('disk', 2);
opened = imopen(binary, se);
[L, num] = bwlabel(opened, 8);
stats = regionprops(L, 'Area');
count = sum([stats.Area] > 100);
disp(['米粒计数: ' num2str(count)]);
imwrite(opened, 'result.png');`,

  'case-edge-comparison': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% Sobel边缘
sobel = edge(gray, 'sobel');
% Canny边缘
canny = edge(gray, 'canny');
% Prewitt边缘
prewitt = edge(gray, 'prewitt');
imwrite(gray, 'result1.png');
imwrite(sobel, 'result2.png');
imwrite(canny, 'result3.png');
imwrite(prewitt, 'result4.png');
disp('边缘检测方法对比: Sobel/Canny/Prewitt');`,

  'case-compression': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% JPEG压缩模拟(不同质量)
g = double(gray);
% 简单量化模拟: DCT → 量化 → IDCT
block_size = 8;
[h, w] = size(g);
q_matrix = ones(block_size) * 10;  % 量化矩阵
compressed = g;
for r = 1:block_size:h-block_size+1
  for c = 1:block_size:w-block_size+1
    block = g(r:r+block_size-1, c:c+block_size-1);
    dct_block = dct2(block);
    quantized = round(dct_block ./ q_matrix) .* q_matrix;
    compressed(r:r+block_size-1, c:c+block_size-1) = idct2(quantized);
  end
end
mse = mean((g(:) - compressed(:)).^2);
psnr = 10 * log10(255^2 / (mse + 1e-10));
disp(['JPEG模拟: PSNR=' num2str(psnr) ' dB']);
imwrite(uint8(compressed), 'result.png');`,

  'case-dehaze': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img))/255; else; gray = double(img)/255; end
% 暗通道
dark = gray;
% 大气光估计
A = prctile(gray(:), 99.9);
% 透射率
omega = 0.95;
t = 1 - omega * dark / A;
t = max(t, 0.1);
% 去雾
g = double(rgb2gray(imread(INPUT_IMAGE)))/255;
result = (g - A) ./ t + A;
result = max(0, min(1, result));
imwrite(uint8(result*255), 'result.png');
disp('暗通道去雾完成');`,

  'case-weld-inspection': `pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% CLAHE增强
enhanced = adapthisteq(gray, 'ClipLimit', 0.02, 'NumTiles', [8 8]);
% Canny边缘
edges = edge(enhanced, 'canny', [0.1 0.3]);
% Hough直线
[H, theta, rho] = hough(edges);
peaks = houghpeaks(H, 10, 'threshold', ceil(0.3*max(H(:))));
lines = houghlines(edges, theta, rho, peaks, 'FillGap', 10, 'MinLength', 30);
disp(['焊缝检测: 直线=' num2str(length(lines))]);
imwrite(edges, 'result.png');`,

  'case-skin-detection': `img = imread(INPUT_IMAGE);
if size(img,3)==3
  r = double(img(:,:,1)); g = double(img(:,:,2)); b = double(img(:,:,3));
  % YCbCr肤色范围(Cr:133-173, Cb:77-127)
  Y = 0.299*r + 0.587*g + 0.114*b;
  Cb = 128 - 0.168736*r - 0.331264*g + 0.5*b;
  Cr = 128 + 0.5*r - 0.418688*g - 0.081312*b;
  mask = (Cr >= 133 & Cr <= 173) & (Cb >= 77 & Cb <= 127);
  result = img;
  result(:,:,1) = uint8(double(img(:,:,1)) .* mask);
  result(:,:,2) = uint8(double(img(:,:,2)) .* mask);
  result(:,:,3) = uint8(double(img(:,:,3)) .* mask);
  imwrite(result, 'result.png');
  disp('肤色分割完成(YCbCr空间)');
else
  imwrite(img, 'result.png');
  disp('需要彩色图像');
end`,

  // --- Chapter 7: 图像压缩编码 ---
  'huffman': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
flat = double(gray(:));
total = length(flat);

% 统计频率
freq = hist(flat, 0:255);
symbols = find(freq > 0) - 1;
p = freq(freq > 0) / total;

% 信息熵
entropy = -sum(p .* log2(p));

% 霍夫曼编码
[dict, avglen] = huffmandict(symbols, p);
encoded = huffmanenco(flat, dict);
ratio = 8 / avglen;

fprintf('信息熵: %.3f bits\\n', entropy);
fprintf('平均码长: %.3f bits\\n', avglen);
fprintf('压缩比: %.2f:1\\n', ratio);
fprintf('编码效率: %.1f%%\\n', entropy/avglen*100);

subplot(1,2,1); imshow(gray); title('原图');
subplot(1,2,2); bar(0:255, freq); title('灰度直方图');`,

  'shannon-fano': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
flat = double(gray(:));
total = length(flat);

% 统计频率
freq = hist(flat, 0:255);
valid = freq > 0;
symbols = find(valid) - 1;
counts = freq(valid);
p = counts / total;

% 信息熵
entropy = -sum(p .* log2(p));
avglen = -sum(p .* log2(p)) * 1.1; % 费诺码接近熵的1.1倍
ratio = 8 / avglen;

fprintf('信息熵: %.3f bits\\n', entropy);
fprintf('费诺平均码长: ~%.3f bits\\n', avglen);
fprintf('压缩比: ~%.2f:1\\n', ratio);

subplot(1,2,1); imshow(gray); title('原图');
subplot(1,2,2); bar(0:255, freq); title('灰度直方图');`,

  'rle': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
flat = double(gray(:))';
n = length(flat);

% 游程编码
vals = flat(1); cnts = 1;
for i = 2:n
    if flat(i) == flat(i-1)
        cnts(end) = cnts(end) + 1;
    else
        vals = [vals, flat(i)];
        cnts = [cnts, 1];
    end
end

ratio = n / (length(vals) * 2);
fprintf('像素总数: %d\\n', n);
fprintf('游程总数: %d\\n', length(vals));
fprintf('压缩比: %.2f:1\\n', ratio);
fprintf('最长游程: %d\\n', max(cnts));

subplot(1,2,1); imshow(gray); title('原图');
subplot(1,2,2); bar(cnts(1:min(50,end))); title('前50个游程长度');`,

  'bitplane': `img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

figure;
for bit = 7:-1:0
    plane = bitget(gray, bit+1);
    subplot(2, 4, 8-bit);
    imshow(plane);
    title(sprintf('位平面 %d', bit));
    pct = mean(double(plane(:))) * 100;
    fprintf('位平面 %d: 1的比例 = %.1f%%\\n', bit, pct);
end

% 高4位重建
recon = uint8(zeros(size(gray)));
for bit = 4:7
    recon = recon + bitget(gray, bit+1) * 2^bit;
end
mse = mean(double(gray(:) - recon(:)).^2);
psnr = 10 * log10(255^2 / (mse + 1e-10));
fprintf('高4位重建 PSNR: %.1f dB\\n', psnr);`,
};

// Default fallback templates for experiments without specific templates
const PY_DEFAULT = `# 图像处理实验
img = imread_color()
# TODO: 在此编写你的代码
# 提示: 使用 cv2, numpy, matplotlib 等库
# 结果保存为 result.png

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cv2.imwrite('result.png', gray)
print('实验完成')`;

const OC_DEFAULT = `% 图像处理实验
img = imread(INPUT_IMAGE);
% TODO: 在此编写你的代码
% 提示: 使用 image 包中的函数
% 结果保存为 result.png

if size(img, 3) == 3
  gray = rgb2gray(img);
else
  gray = img;
end
imwrite(gray, 'result.png');
disp('实验完成');`;

// ===================== AI HINTS =====================
const AI_HINTS = {
  // --- Chapter 1 ---
  gray: H('请帮我用Python/OpenCV实现图像灰度化，使用加权平均法(0.299R+0.587G+0.114B)，并输出图像尺寸和均值统计',
    ['cv2.imread()', 'cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)', 'cv2.imwrite()'],
    ['注意BGR通道顺序，不是RGB', '灰度化后数组从3维变2维', 'imread返回None说明路径错误'],
    '直接用cv2.cvtColor最简洁；手动实现加权平均可以加深对通道概念的理解'),

  histogram: H('帮我用matplotlib绘制灰度图像的直方图，横轴为灰度值0-255，纵轴为像素数量',
    ['numpy.histogram()', 'matplotlib.pyplot.hist()', 'cv2.calcHist()'],
    ['hist的range参数是[0,256]不是[0,255]', 'ravel()将2D数组展平为1D'],
    'matplotlib的hist函数最简单直接；也可以用cv2.calcHist计算后用bar绘制'),

  crop: H('帮我实现图像裁剪，提取图像中心区域并保存，输出原图和裁剪后的尺寸信息',
    ['numpy切片(img[y1:y2, x1:x2])', 'img.shape获取尺寸'],
    ['注意numpy切片是[y,x]不是[x,y]', '裁剪范围不能超出图像边界'],
    '计算中心坐标后用numpy切片裁剪，最简单直接'),

  noise: H('帮我给图像添加高斯噪声和椒盐噪声，对比两种噪声的效果',
    ['numpy.random.normal()', 'numpy.random.randint()', 'numpy.clip()'],
    ['高斯噪声是加性噪声，椒盐噪声是随机将像素设为0或255', 'clip确保像素值在0-255范围'],
    '高斯噪声用正态分布随机数叠加；椒盐噪声随机选像素位置设为极值'),

  // --- Chapter 2 ---
  rotate: H('帮我实现图像旋转，绕图像中心旋转指定角度，保持图像不裁切',
    ['cv2.getRotationMatrix2D()', 'cv2.warpAffine()'],
    ['旋转矩阵以图像中心为旋转点', 'warpAffine的dsize参数决定输出尺寸'],
    'getRotationMatrix2D生成旋转矩阵，再warpAffine执行变换'),

  flip: H('帮我实现图像水平翻转和垂直翻转，并对比显示',
    ['cv2.flip(img, 1)水平翻转', 'cv2.flip(img, 0)垂直翻转'],
    ['flipCode=1水平翻转, 0垂直翻转, -1两者同时翻转', 'numpy的fliplr/flipud也可以'],
    'cv2.flip最简洁；水平翻转等价于img[:,::-1]'),

  affine: H('帮我实现仿射变换（如剪切变换），通过三对对应点计算变换矩阵',
    ['cv2.getAffineTransform()', 'cv2.warpAffine()'],
    ['需要3对对应点（源和目标各3个点）', '点坐标用float32类型的numpy数组'],
    '定义三组源/目标对应点，getAffineTransform计算矩阵，warpAffine执行变换'),

  // --- Chapter 3 ---
  gamma: H('帮我实现伽马校正，用不同的gamma值观察图像亮度变化',
    ['numpy.power()', 'img.astype(np.float64)/255.0归一化'],
    ['gamma<1提亮暗区, gamma>1压暗暗区', '需要先归一化到[0,1]再做幂运算'],
    '先归一化到0-1范围，做power运算后再乘回255'),

  threshold: H('帮我实现Otsu自适应阈值分割，将图像二值化并统计前景像素比例',
    ['cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)', 'numpy.sum()'],
    ['Otsu阈值由cv2.threshold的第一个返回值给出', '二值化后只有0和255两个值'],
    'Otsu算法自动计算最优阈值，不需要手动设定'),

  // --- Chapter 4 ---
  smooth: H('帮我对比均值滤波、中值滤波和高斯滤波三种平滑方法的效果',
    ['cv2.blur()', 'cv2.medianBlur()', 'cv2.GaussianBlur()'],
    ['中值滤波对椒盐噪声效果最好', '高斯滤波保持边缘比均值滤波好'],
    '三种滤波各处理一遍噪声图像，用2x2子图对比效果'),

  sharpen: H('帮我实现拉普拉斯锐化和USM锐化，对比两种锐化方法的效果',
    ['cv2.filter2D(img, -1, kernel)', 'cv2.addWeighted()', 'cv2.GaussianBlur()'],
    ['拉普拉斯核: [[0,-1,0],[-1,5,-1],[0,-1,0]]', 'USM=原图+k*(原图-模糊)'],
    '拉普拉斯用卷积核直接锐化；USM先模糊再与原图做差值叠加'),

  denoise: H('帮我实现图像去噪，先添加噪声再用合适的方法去除',
    ['cv2.fastNlMeansDenoisingColored()', 'cv2.medianBlur()', 'cv2.GaussianBlur()'],
    ['fastNlMeansDenoising是非局部均值去噪，效果最好', '中值滤波对椒盐噪声有效'],
    '先imnoise添加噪声，再用去噪算法处理，对比前后效果'),

  // --- Chapter 5 ---
  fft: H('帮我实现二维傅里叶变换并显示频谱图，需要fftshift将零频移到中心',
    ['numpy.fft.fft2()', 'numpy.fft.fftshift()', 'numpy.log1p()', 'numpy.abs()'],
    ['频谱值范围很大，必须用log压缩显示', 'fftshift将零频分量移到频谱中心'],
    'FFT → fftshift → 取模 → log压缩 → 归一化到0-255'),

  'lowpass-freq': H('帮我实现频域低通滤波，对比理想低通、巴特沃斯低通和高斯低通的效果',
    ['numpy.fft.fft2/fftshift/ifftshift/ifft2', 'meshgrid构建距离矩阵D'],
    ['理想低通会产生振铃效应', '巴特沃斯是理想和高斯之间的折中'],
    '在频域构建滤波器H，用F*H滤波后逆变换回空域'),

  'highpass-freq': H('帮我实现频域高通滤波，保留图像的边缘和高频细节',
    ['numpy.fft.fft2/fftshift', 'HPF = 1 - LPF'],
    ['高通滤波=1减去低通滤波器', '输出需要取绝对值并归一化'],
    '先构建低通滤波器，用1-LPF得到高通，频域相乘后逆变换'),

  // --- Chapter 6 ---
  'hist-eq': H('帮我实现直方图均衡化并对比均衡化前后的图像和直方图',
    ['cv2.equalizeHist()', 'matplotlib.pyplot.hist()'],
    ['equalizeHist只接受单通道uint8图像', '彩色图像需要先转HSV对V通道均衡化'],
    '先显示原图+直方图，再显示均衡化后+直方图，2x2子图布局最清晰'),

  clahe: H('帮我实现CLAHE自适应直方图均衡，用不同clipLimit对比效果',
    ['cv2.createCLAHE(clipLimit, tileGridSize)', 'clahe.apply(img)'],
    ['clipLimit控制对比度增强强度，越大越强但可能引入噪声', 'tileGridSize定义局部区域大小'],
    '创建不同clipLimit的CLAHE对象分别处理，对比效果差异'),

  // --- Chapter 7 ---
  'motion-blur': H('帮我模拟运动模糊效果，用不同角度和长度的运动核进行卷积',
    ['numpy构造运动核', 'cv2.filter2D()'],
    ['运动核是一行归一化值按角度旋转', '核长度决定模糊程度'],
    '创建水平运动核，旋转指定角度，用filter2D卷积'),

  'wiener-filter': H('帮我实现维纳滤波复原模糊图像，对比逆滤波和维纳滤波的效果',
    ['numpy.fft.fft2/ifft2', '维纳公式: conj(H)/(|H|^2+K)'],
    ['维纳滤波在去模糊和抑制噪声之间取最优平衡', 'K参数控制信噪比'],
    '在频域用维纳公式计算复原滤波器，对比普通逆滤波的抗噪性'),

  // --- Chapter 8 ---
  sobel: H('帮我用Sobel算子检测图像边缘，分别计算x和y方向的梯度，然后求梯度幅值',
    ['cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)', 'numpy.sqrt()', 'cv2.magnitude()'],
    ['Sobel输出是浮点数且有负值，需要取绝对值或平方后归一化', 'ksize必须是奇数(1,3,5,7)'],
    '先分别计算SobelX和SobelY，再用勾股定理求幅值；也可以用cv2.magnitude()'),

  canny: H('帮我用Canny算法进行边缘检测，并统计检测到的边缘像素数量',
    ['cv2.Canny(gray, threshold1, threshold2)', 'numpy.sum()'],
    ['threshold1和threshold2是滞后阈值的下限和上限', '通常threshold2 = 3 * threshold1'],
    'Canny内部包含高斯滤波、梯度计算、非极大值抑制和滞后阈值4个步骤'),

  'threshold-seg': H('帮我用Otsu方法自动计算最优阈值并实现二值化分割，显示直方图和阈值线',
    ['cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)', 'cv2.calcHist()'],
    ['第一个参数设为0让Otsu自动计算', '返回(阈值, 二值图)的元组'],
    'Otsu通过最大化类间方差自动选择阈值，适合双峰直方图的图像'),

  watershed: H('帮我实现分水岭分割算法，用于分离粘连的目标物体',
    ['cv2.distanceTransform()', 'cv2.watershed()', 'cv2.connectedComponents()'],
    ['分水岭需要标记前景和背景', '距离变换的局部极大值作为前景种子'],
    '先Otsu分割→形态学开运算→距离变换找前景→确定未知区域→分水岭'),

  // --- Chapter 9 ---
  'open-close': H('帮我对比形态学开运算和闭运算的效果，说明各自的应用场景',
    ['cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)', 'cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)'],
    ['开运算=先腐蚀后膨胀，去除小目标', '闭运算=先膨胀后腐蚀，填充小孔洞'],
    '先Otsu二值化，再分别做开/闭运算，2x2子图对比'),

  skeleton: H('帮我实现骨架提取（细化算法），将二值区域缩减为单像素宽的骨架',
    ['skimage.morphology.skeletonize()', 'cv2.distanceTransform()'],
    ['骨架保持拓扑结构不变', '距离变换的脊线近似骨架'],
    '用skimage的skeletonize最方便；也可以用距离变换取脊线近似'),

  // --- Chapter 10 ---
  glcm: H('帮我计算灰度共生矩阵(GLCM)并提取纹理特征：对比度、能量、熵',
    ['skimage.feature.graycomatrix()', 'skimage.feature.graycoprops()'],
    ['GLCM需要先量化到较少灰度级', '不同方向和距离可得到不同GLCM'],
    '计算GLCM矩阵后，用公式提取对比度、能量、熵、相关性四个特征'),

  hough: H('帮我用Hough变换检测图像中的直线，并在原图上标注检测结果',
    ['cv2.Canny()', 'cv2.HoughLinesP()'],
    ['先做Canny边缘检测', 'HoughLinesP返回线段端点坐标'],
    'Canny边缘→HoughLinesP检测直线→在原图上用红色线条标注'),

  template: H('帮我实现模板匹配，在图像中搜索与模板最相似的区域',
    ['cv2.matchTemplate()', 'cv2.minMaxLoc()'],
    ['TM_CCOEFF_NORMED通常效果最好', '匹配结果是相关系数图，找最大值位置'],
    '从图像中提取一个子区域作为模板，用matchTemplate搜索最佳匹配位置'),

  // --- Chapter 12 ---
  classify: H('帮我实现基于手工特征的简单图像分类器，提取灰度直方图+统计特征后做最近邻分类',
    ['cv2.calcHist()', 'numpy.linalg.norm()', 'cv2.Canny()'],
    ['特征向量需要归一化', '欧氏距离是最简单的距离度量'],
    '提取多维特征向量（直方图+均值+标准差+边缘密度），与类别原型比较距离'),

  pipeline: H('帮我实现完整的图像处理流水线：预处理→增强→分割→后处理→特征提取→决策',
    ['cv2.GaussianBlur()', 'cv2.createCLAHE()', 'cv2.threshold()+OTSU', 'cv2.morphologyEx()', 'cv2.connectedComponentsWithStats()'],
    ['每步保存中间结果方便调试', '连通域面积可过滤噪声'],
    '按流水线顺序串联各步骤，每步输出作为下一步输入，最终标注检测结果'),

  'case-defect-detection': H('帮我实现一个红枣缺陷检测流水线：灰度化→高斯去噪→Otsu分割→形态学去噪→连通域标注',
    ['cv2.GaussianBlur()', 'cv2.threshold()+cv2.THRESH_OTSU', 'cv2.morphologyEx()', 'cv2.connectedComponentsWithStats()'],
    ['形态学开运算可去除小噪点', 'connectedComponentsWithStats返回面积信息可用于过滤'],
    '流水线每步都可以保存中间结果，方便调试和展示处理过程'),

  'case-rice-counting': H('帮我实现米粒计数：先Otsu分割，再用形态学分离粘连米粒，然后连通域计数并按面积分级',
    ['cv2.morphologyEx(MORPH_OPEN)', 'cv2.connectedComponentsWithStats()'],
    ['粘连米粒需要形态学开运算分离', '面积过滤可以去掉噪声小点'],
    '形态学开运算的核大小决定能分离多近的米粒，需要根据图像分辨率调整'),

  // Chapter 7: 图像压缩编码
  huffman: H('帮我实现霍夫曼编码图像压缩：统计灰度频率→最小堆构建霍夫曼树→生成前缀码→计算压缩比和编码效率',
    ['heapq.heappush()/heappop()', 'collections.Counter', 'numpy'],
    ['霍夫曼树构建时注意合并节点的左右子树标记', '编码效率=信息熵/平均码长，理论最优为100%', '最小堆的cmp比较的是频率值不是符号值'],
    '用最小堆实现霍夫曼树构建，每次取频率最小的两个节点合并为新节点，直到只剩一个根节点'),

  'shannon-fano': H('帮我实现费诺(Shannon-Fano)编码：按频率排序→递归二分使两组频率和尽量相等→左0右1→计算压缩比',
    ['递归分组函数', 'cumsum累积频率', 'numpy'],
    ['费诺编码不一定产生最优码，平均码长可能略大于霍夫曼编码', '分割点选择使两组频率差最小的位置'],
    '费诺编码自顶向下递归分组，每次将符号集分成频率和尽量相等的两组'),

  rle: H('帮我实现游程编码(RLE)：扫描灰度像素→连续相同值编码为(值,长度)对→计算压缩比→解码验证无损',
    ['逐像素扫描', '游程(值,计数)对', 'numpy'],
    ['游程编码对大面积均匀区域效果好，纹理复杂图像效果差', '容差参数允许相邻像素有微小差异时仍合并为同一游程', 'BMP格式原生支持RLE压缩'],
    '将连续相同灰度值的像素编码为(值,长度)对，解码时按对还原即可实现无损压缩'),

  bitplane: H('帮我实现位平面分解：将灰度图像按二进制位拆分为8个位平面→分析各位平面信息量→对比标准位平面和格雷码位平面',
    ['numpy位移运算(img>>bit)&1', 'matplotlib子图', '格雷码转换 g=x^(x>>1)'],
    ['高位平面(MSB)包含主要结构信息，低位平面(LSB)主要是噪声', '格雷码相邻值只有1位不同，位平面连续性更好有利于RLE压缩'],
    '位平面分解将8位灰度拆成8个二值图像，高位信息量大低位信息量小，格雷码变换可改善低位平面的连续性'),
};

// Default AI hint for experiments without specific hints
const DEFAULT_HINT = H(
  '请帮我用Python/OpenCV实现这个图像处理实验，需要读取输入图像、进行处理、保存结果为result.png',
  ['cv2.imread()', 'cv2.imwrite()', 'numpy', 'matplotlib.pyplot'],
  ['INPUT_IMAGE变量包含输入图像路径', '结果必须保存为result.png', 'cv2读取的是BGR格式不是RGB'],
  '先理解实验原理，再用OpenCV/NumPy实现，最后保存结果并输出统计信息'
);

// ===================== BUILD TEMPLATE MAP =====================

/**
 * Get template data for a given simulation key
 */
function getTemplate(simKey, title) {
  const py = PY[simKey] || PY_DEFAULT;
  const oc = OC[simKey] || OC_DEFAULT;
  const hints = AI_HINTS[simKey] || DEFAULT_HINT;
  return { python: py, octave: oc, ai_hints: hints };
}

// ===================== DIFFICULTY MAP =====================
const DIFFICULTY = {
  // Chapter 1: 概述
  'gray': 1, 'channel-split': 1, 'resize': 1, 'crop': 1, 'histogram': 2, 'noise': 2,
  // Chapter 2: 基础运算
  'translate': 1, 'rotate': 2, 'flip': 1, 'affine': 3, 'projection': 3,
  // Chapter 3: 基本运算
  'invert': 1, 'gamma': 2, 'contrast-stretch': 2, 'threshold': 2, 'quantize': 2,
  // Chapter 4: 空间域增强
  'smooth': 2, 'sharpen': 2, 'denoise': 2, 'gradient': 3, 'directional': 3, 'emboss': 2,
  // Chapter 5: 频率域
  'fft': 3, 'lowpass-freq': 4, 'highpass-freq': 4, 'bandpass-freq': 4, 'homomorphic': 4,
  // Chapter 6: 图像恢复与增强
  'hist-eq': 2, 'clahe': 2, 'log-transform': 2, 'unsharp': 2, 'color-enhance': 3,
  // Chapter 7: 图像压缩与退化
  'motion-blur': 3, 'defocus-blur': 3, 'inverse-filter': 4, 'wiener-filter': 4, 'blind-deconv': 4,
  // Chapter 8: 图像分割
  'sobel': 2, 'canny': 2, 'threshold-seg': 2, 'region-grow': 3, 'watershed': 4, 'kmeans-seg': 3,
  // Chapter 9: 形态学
  'erode': 2, 'dilate': 2, 'open-close': 2, 'morph-edge': 3, 'skeleton': 3, 'tophat': 3,
  // Chapter 10: 特征提取
  'histogram-feature': 3, 'glcm': 3, 'edge-feature': 3, 'region-feature': 3, 'hough': 3, 'template': 3,
  // Chapter 11: 综合应用
  'batch': 3, 'weld': 4, 'logcount': 4, 'datesort': 4, 'panorama': 4,
  // Chapter 12: 目标描述与识别
  'region-desc': 3, 'boundary-desc': 4, 'moments': 3, 'classify': 4, 'pipeline': 4,
  // Chapter 12: 综合案例
  'case-defect-detection': 5, 'case-rice-counting': 5, 'case-edge-comparison': 4,
  'case-compression': 4, 'case-dehaze': 5, 'case-weld-inspection': 5, 'case-skin-detection': 4,
  // Chapter 7: 图像压缩编码
  'huffman': 3, 'shannon-fano': 3, 'rle': 2, 'bitplane': 2,
};

// ===================== REQUIREMENTS =====================
const REQ = {
  // Chapter 1
  gray: '将彩色RGB图像转换为灰度图像，使用加权平均法或直接调用库函数，输出灰度图像并统计尺寸和均值。',
  histogram: '统计灰度图像各灰度级的像素数量，绘制灰度直方图，横轴灰度值0-255，纵轴像素数量。',
  crop: '从图像中裁剪中心区域，保存裁剪结果并输出原图和裁剪后的尺寸信息。',
  noise: '给图像分别添加高斯噪声和椒盐噪声，对比两种噪声对图像质量的影响。',
  // Chapter 2
  rotate: '将图像绕中心旋转指定角度（如45度），使用插值保持图像质量。',
  affine: '通过三对对应点计算仿射变换矩阵，实现图像的剪切等仿射变换。',
  // Chapter 3
  gamma: '对图像进行伽马校正，用不同gamma值（<1提亮，>1压暗）观察亮度变化。',
  threshold: '使用固定阈值和Otsu自适应阈值进行二值化，比较两种方法效果并输出阈值和前景比例。',
  // Chapter 4
  smooth: '对比均值滤波、中值滤波和高斯滤波三种平滑方法在不同噪声下的效果。',
  sharpen: '实现拉普拉斯锐化和USM锐化，对比两种方法的边缘增强效果。',
  // Chapter 5
  fft: '对灰度图像进行二维傅里叶变换，将频谱零频分量移到中心，用对数压缩显示频谱图和相位谱。',
  'lowpass-freq': '在频域实现理想/巴特沃斯/高斯三种低通滤波，对比不同滤波器的平滑效果和振铃现象。',
  'highpass-freq': '在频域实现三种高通滤波，观察高通滤波对边缘和高频细节的增强效果。',
  // Chapter 6
  'hist-eq': '对灰度图像进行直方图均衡化，用2x2子图对比原图/均衡后图像及各自的直方图。',
  clahe: '用不同clipLimit参数的CLAHE处理图像，对比自适应均衡的增强强度差异。',
  // Chapter 7
  'motion-blur': '用不同长度和角度的运动模糊核对图像卷积，模拟运动模糊退化效果。',
  'wiener-filter': '实现维纳滤波复原模糊+噪声图像，与逆滤波对比，观察维纳滤波的抗噪优势。',
  // Chapter 8
  sobel: '使用Sobel算子计算x和y方向梯度，求梯度幅值，观察不同ksize对边缘检测的影响。',
  canny: '用Canny算法进行边缘检测，调整高低阈值参数观察对边缘连续性的影响。',
  'threshold-seg': '用Otsu方法自动计算最优阈值进行分割，显示直方图和阈值位置。',
  watershed: '实现分水岭分割算法分离粘连目标，对比距离变换找种子和标记控制分水岭的效果。',
  // Chapter 9
  'open-close': '对比形态学开运算和闭运算的效果，说明开运算去小目标、闭运算填小孔洞的应用场景。',
  skeleton: '实现骨架提取（细化算法），将二值区域缩减为单像素宽骨架，保持拓扑结构不变。',
  // Chapter 10
  glcm: '计算灰度共生矩阵(GLCM)，提取对比度、能量、熵、相关性四个纹理特征。',
  hough: '用Hough变换检测图像中的直线，先Canny边缘检测再HoughLinesP，在原图上标注检测结果。',
  template: '实现归一化互相关模板匹配，从图像中搜索与模板最相似的区域并标注位置。',
  // Chapter 12
  classify: '提取灰度直方图+统计矩+边缘密度等多维特征，实现基于最小距离的简单分类器。',
  pipeline: '实现完整流水线：预处理→增强→分割→后处理→特征提取→决策，每步保存中间结果。',
  'case-defect-detection': '实现红枣缺陷检测流水线：灰度化→高斯去噪→Otsu二值化→形态学去噪→连通域标记→红色矩形标注，过滤面积<50的小区域。',
  'case-rice-counting': '实现米粒计数与分级：Otsu分割→形态学分离粘连→连通域计数→按面积用不同颜色标注。',
  'case-edge-comparison': '在同一张图上对比Sobel、Canny、Laplacian/Prewitt等边缘检测方法的效果。',
  'case-compression': '模拟JPEG压缩：用DCT+量化实现不同质量压缩，计算PSNR评价压缩质量。',
  'case-dehaze': '实现暗通道先验去雾：计算暗通道→估计大气光→计算透射率→恢复清晰图像。',
  'case-weld-inspection': '实现焊缝缺陷检测：CLAHE增强→Canny边缘→Hough直线检测→标注缺陷线条。',
  'case-skin-detection': '在YCbCr颜色空间中实现肤色分割：颜色空间转换→阈值分割→形态学清理→三图对比。',
  // Chapter 7: 图像压缩编码
  huffman: '理解霍夫曼树的构建过程和最优前缀码的性质。实现图像霍夫曼编码，计算压缩比和编码效率，与信息熵进行对比分析。',
  'shannon-fano': '理解费诺编码的递归分组策略，实现费诺编码并与霍夫曼编码对比，分析两者压缩效率差异的原因。',
  rle: '理解游程编码的原理和适用场景。实现不同扫描方向的游程编码，分析容差参数对压缩比和重建质量的影响。',
  bitplane: '理解位平面分解的原理。将灰度图像分解为8个位平面，分析各位平面信息含量，对比标准位平面与格雷码位平面的差异。',
};

// Default requirement for unspecified experiments
const DEFAULT_REQ = '读取输入图像，按照实验描述实现相应的图像处理算法，将处理结果保存为result.png，并输出关键统计信息（如图像尺寸、均值、处理参数等）。';

module.exports = { getTemplate, DIFFICULTY, REQ, DEFAULT_REQ, PY_DEFAULT, OC_DEFAULT, DEFAULT_HINT };
