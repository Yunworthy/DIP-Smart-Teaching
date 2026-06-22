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
  gray: `# ==================== 图像灰度化 ====================
# 功能: 将彩色(RGB)图像转换为灰度图像
# 原理: Gray = 0.299×R + 0.587×G + 0.114×B (加权平均)

# 第1步: 读取输入图像（彩色模式，BGR通道顺序）
img = imread_color()
# → img 是三维数组，shape=(高, 宽, 3)，3个通道分别是蓝、绿、红

# 第2步: 使用OpenCV颜色空间转换，将BGR转为灰度
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# → gray 变成二维数组，shape=(高, 宽)，每个像素值0~255

# 第3步: 保存灰度图像为result.png（平台自动显示）
cv2.imwrite('result.png', gray)

# 第4步: 打印图像基本信息，帮助理解数据变化
info(原图尺寸=img.shape, 灰度尺寸=gray.shape, 均值=round(gray.mean(), 1))
# → 输出类似: 原图尺寸=(480,640,3), 灰度尺寸=(480,640), 均值=127.3`,

  'channel-split': `# ==================== 通道分离 ====================
# 功能: 将彩色图像分解为R、G、B三个独立通道并可视化
# 原理: 彩色图像由红、绿、蓝三通道叠加而成，分离后可观察各通道信息

# 第1步: 读取彩色图像
img = imread_color()
# → img.shape = (高, 宽, 3)，通道顺序为BGR

# 第2步: 将图像拆分为蓝、绿、红三个单通道
b, g, r = cv2.split(img)
# → b, g, r 各自是二维数组 shape=(高, 宽)，像素值0~255

# 第3步: 创建1行3列的子图画布
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
# → axes 是包含3个 Axes 对象的数组

# 第4步: 分别用红色、绿色、蓝色色图显示对应通道
axes[0].imshow(r, cmap='Reds'); axes[0].set_title('Red')
# → 红色区域越亮表示红色分量越强
axes[1].imshow(g, cmap='Greens'); axes[1].set_title('Green')
# → 绿色区域越亮表示绿色分量越强
axes[2].imshow(b, cmap='Blues'); axes[2].set_title('Blue')
# → 蓝色区域越亮表示蓝色分量越强

# 第5步: 隐藏坐标轴，美化布局并保存
for ax in axes: ax.axis('off')
plt.tight_layout()
savefig(fig, 'result')`,

  histogram: `# ==================== 直方图计算与显示 ====================
# 功能: 统计灰度图像的像素分布并绘制直方图
# 原理: 直方图横轴为灰度级(0-255)，纵轴为该灰度级的像素个数

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 是二维数组，每个像素值在0~255之间

# 第2步: 创建1行2列的子图（左图右直方图）
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

# 第3步: 左侧显示原始灰度图像
ax1.imshow(gray, cmap='gray'); ax1.set_title('原图'); ax1.axis('off')

# 第4步: 右侧绘制灰度直方图
ax2.hist(gray.ravel(), 256, [0, 256], color='#6366f1')
# → gray.ravel() 将二维数组展平为一维，256个bin覆盖0~255灰度级
ax2.set_title('灰度直方图'); ax2.set_xlabel('灰度值'); ax2.set_ylabel('像素数')

# 第5步: 美化布局并保存
plt.tight_layout()
savefig(fig, 'result')`,

  noise: `# ==================== 噪声添加 ====================
# 功能: 向图像添加高斯噪声和椒盐噪声，观察不同噪声的效果
# 原理: 高斯噪声服从正态分布叠加在每个像素上；椒盐噪声随机将像素设为0或255

# 第1步: 读取灰度图像并转为浮点型（便于加法运算）
img = imread_gray().astype(np.float64)
# → 转为float64防止加法溢出

# --- 高斯噪声 ---
# 第2步: 生成均值为0、标准差为15的高斯随机噪声矩阵
gauss = np.random.normal(0, 15, img.shape)
# → gauss 与 img 同尺寸，值围绕0上下波动

# 第3步: 将噪声叠加到原图，并裁剪到[0,255]范围
noisy_gauss = np.clip(img + gauss, 0, 255).astype(np.uint8)
# → np.clip 防止像素值越界，再转回uint8

# --- 椒盐噪声 ---
# 第4步: 复制原图用于添加椒盐噪声
noisy_sp = img.copy().astype(np.uint8)

# 第5步: 计算需要污染的像素数量（2%的像素）
n = int(0.02 * img.size)
# → n 表示要随机置为黑或白的像素个数

# 第6步: 随机选择像素位置，随机赋值为0(盐)或255(胡椒)
for _ in range(n):
    y, x = np.random.randint(0, img.shape[0]), np.random.randint(0, img.shape[1])
    noisy_sp[y, x] = np.random.choice([0, 255])
    # → 随机位置(y,x)处像素被设为纯黑或纯白

# 第7步: 创建1行3列对比图
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img.astype(np.uint8), noisy_gauss, noisy_sp], ['原图', '高斯噪声', '椒盐噪声']):
    ax.imshow(im, cmap='gray'); ax.set_title(t); ax.axis('off')
savefig(fig, 'result')`,

  // --- Chapter 2: 基础运算 ---
  translate: `# ==================== 图像平移 ====================
# 功能: 将图像沿x轴和y轴方向平移指定像素
# 原理: 通过2x3仿射变换矩阵 M=[[1,0,tx],[0,1,ty]] 实现平移

# 第1步: 读取彩色图像并获取尺寸
img = imread_color()
h, w = img.shape[:2]
# → h=图像高度, w=图像宽度

# 第2步: 构造平移变换矩阵，x方向+50像素，y方向+30像素
M = np.float32([[1, 0, 50], [0, 1, 30]])  # x+50, y+30
# → M 是2x3矩阵: [[1,0,tx],[0,1,ty]]，tx/ty为平移量

# 第3步: 应用仿射变换，输出尺寸保持(w,h)不变
result = cv2.warpAffine(img, M, (w, h))
# → warpAffine 按矩阵M对每个像素重新映射坐标

# 第4步: 保存平移后的图像
cv2.imwrite('result.png', result)`,

  rotate: `# ==================== 图像旋转 ====================
# 功能: 将图像绕中心点旋转指定角度
# 原理: getRotationMatrix2D 生成旋转矩阵，warpAffine 执行变换

# 第1步: 读取彩色图像并获取尺寸
img = imread_color()
h, w = img.shape[:2]
# → h=高度, w=宽度，用于确定旋转中心和输出尺寸

# 第2步: 生成旋转矩阵（绕图像中心旋转45度，缩放因子1.0即不缩放）
M = cv2.getRotationMatrix2D((w/2, h/2), 45, 1.0)  # 旋转45度
# → 参数: (旋转中心x,y), 旋转角度(逆时针为正), 缩放比例
# → M 是2x3矩阵，包含旋转和缩放信息

# 第3步: 应用仿射变换执行旋转
result = cv2.warpAffine(img, M, (w, h))
# → 输出尺寸与原图相同，旋转后空出的区域填充黑色(0)

# 第4步: 保存旋转后的图像
cv2.imwrite('result.png', result)`,

  flip: `# ==================== 图像翻转 ====================
# 功能: 对图像进行水平翻转和垂直翻转，并对比显示
# 原理: cv2.flip 的第二个参数决定翻转方式: 1=水平, 0=垂直, -1=对角

# 第1步: 读取彩色图像
img = imread_color()
# → img 为BGR三通道的彩色图像

# 第2步: 水平翻转（沿y轴镜像）
h_flip = cv2.flip(img, 1)   # 水平翻转
# → 参数1表示绕y轴翻转，即左右镜像

# 第3步: 垂直翻转（沿x轴镜像）
v_flip = cv2.flip(img, 0)   # 垂直翻转
# → 参数0表示绕x轴翻转，即上下颠倒

# 第4步: 创建1行3列对比图（原图、水平翻转、垂直翻转）
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img, h_flip, v_flip], ['原图', '水平翻转', '垂直翻转']):
    ax.imshow(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)); ax.set_title(t); ax.axis('off')
    # → BGR转RGB后matplotlib才能正确显示颜色
savefig(fig, 'result')`,

  affine: `# ==================== 仿射变换（剪切） ====================
# 功能: 通过指定3组对应点实现仿射变换（此处演示剪切效果）
# 原理: 仿射变换保持平行线仍平行，可包含平移、旋转、缩放和剪切

# 第1步: 读取彩色图像并获取尺寸
img = imread_color()
h, w = img.shape[:2]
# → h=高度, w=宽度

# 第2步: 定义变换前三角形的3个顶点（左上、右上、左下）
pts1 = np.float32([[0,0],[w,0],[0,h]])
# → 原图三角形: 左上角(0,0), 右上角(w,0), 左下角(0,h)

# 第3步: 定义变换后对应的3个顶点（右上角不变，左上角右移10%）
pts2 = np.float32([[w*0.1,0],[w,0],[0,h]])
# → 左上角从(0,0)移到(w*0.1, 0)，产生剪切变形

# 第4步: 根据3组对应点计算仿射变换矩阵
M = cv2.getAffineTransform(pts1, pts2)
# → M 是2x3矩阵，完全由3组非共线点确定

# 第5步: 应用仿射变换并保存
result = cv2.warpAffine(img, M, (w, h))
cv2.imwrite('result.png', result)`,

  projection: `# ==================== 投影变换 ====================
# 功能: 通过4组对应点实现透视变换（投影变换）
# 原理: 投影变换可将四边形映射为另一个四边形，不保持平行线

# 第1步: 读取彩色图像并获取尺寸
img = imread_color()
h, w = img.shape[:2]
# → h=高度, w=宽度

# 第2步: 定义变换前4个角点（向内缩进50像素的四边形）
pts1 = np.float32([[50,50],[w-50,50],[50,h-50],[w-50,h-50]])
# → 左上、右上、左下、右下各缩进50像素

# 第3步: 定义变换后4个角点（映射到图像四个角落）
pts2 = np.float32([[0,0],[w,0],[0,h],[w,h]])
# → 目标点为整个画布的四个角落，实现"拉伸铺满"效果

# 第4步: 根据4组对应点计算3x3透视变换矩阵
M = cv2.getPerspectiveTransform(pts1, pts2)
# → M 是3x3齐次矩阵，需要4组点才能确定

# 第5步: 应用透视变换（warpPerspective使用3x3矩阵）
result = cv2.warpPerspective(img, M, (w, h))
# → 与warpAffine不同，透视变换可以改变线的平行关系
cv2.imwrite('result.png', result)`,

  // --- Chapter 3: 基本运算 ---
  invert: `# ==================== 图像反色 ====================
# 功能: 将灰度图像的每个像素值取反（黑白反转）
# 原理: result = 255 - original，亮变暗、暗变亮

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 是二维数组，像素值0~255

# 第2步: 用255减去每个像素值，实现反色（底片效果）
result = 255 - gray
# → 原来0(黑)变为255(白)，原来255(白)变为0(黑)

# 第3步: 保存反色图像
cv2.imwrite('result.png', result)

# 第4步: 对比原图和反色的均值（两者之和应约为255）
info(原图均值=gray.mean(), 反色均值=result.mean())
# → 若原图均值=100，则反色均值约为155`,

  gamma: `# ==================== 伽马校正 ====================
# 功能: 通过幂次变换调整图像亮度（非线性灰度变换）
# 原理: output = input^gamma，gamma<1提亮暗区，gamma>1压暗亮区

# 第1步: 读取灰度图像并归一化到[0,1]范围
gray = imread_gray().astype(np.float64) / 255.0
# → 归一化后像素值变为0.0~1.0的浮点数

# 第2步: 设定伽马值（<1提亮，>1压暗）
gamma = 0.5  # < 1 提亮, > 1 压暗
# → gamma=0.5 时暗部灰度级被拉伸扩展

# 第3步: 对归一化图像做幂次运算
corrected = np.power(gray, gamma)
# → 每个像素做 x^0.5 运算，暗区被提亮

# 第4步: 反归一化回[0,255]并转为uint8
corrected = (corrected * 255).astype(np.uint8)
# → 浮点结果乘以255再截断为整数

# 第5步: 保存伽马校正后的图像
cv2.imwrite('result.png', corrected)`,

  'contrast-stretch': `# ==================== 对比度拉伸 ====================
# 功能: 将图像的灰度范围线性拉伸到[0,255]全范围，增强对比度
# 原理: result = (pixel - min) / (max - min) * 255，线性映射

# 第1步: 读取灰度图像
gray = imread_gray()

# 第2步: 获取图像的最小和最大像素值
min_val, max_val = gray.min(), gray.max()
# → 例如 min_val=30, max_val=200，则灰度范围只有30~200

# 第3步: 线性拉伸到[0,255]全范围
result = ((gray.astype(np.float64) - min_val) / (max_val - min_val) * 255).astype(np.uint8)
# → 先减最小值平移，再除以范围缩放，最后乘以255映射到全灰度

# 第4步: 创建对比图——原图直方图 vs 拉伸后直方图
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.hist(gray.ravel(), 256, [0,256], color='#94a3b8'); ax1.set_title('原图直方图')
# → 原图直方图可能集中在某个灰度区间
ax2.hist(result.ravel(), 256, [0,256], color='#6366f1'); ax2.set_title('拉伸后直方图')
# → 拉伸后直方图铺满0~255整个范围
plt.tight_layout()
savefig(fig, 'result')

# 第5步: 保存拉伸后的图像
cv2.imwrite('result2.png', result)`,

  threshold: `# ==================== 灰度阈值处理 ====================
# 功能: 将灰度图像按阈值分割为前景（白色）和背景（黑色）
# 原理: 像素值>阈值→设为255(白)，像素值<=阈值→设为0(黑)

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 是二维数组，像素值0~255

# 第2步: 设定二值化阈值
thresh_val = 128
# → 灰度值>128的像素视为前景，<=128视为背景

# 第3步: 使用OpenCV阈值函数进行二值化
_, binary = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY)
# → 参数: (输入图像, 阈值, 最大值, 阈值类型)
# → binary 中只有0和255两种值

# 第4步: 保存二值化图像
cv2.imwrite('result.png', binary)

# 第5步: 统计前景和背景像素数量
info(阈值=thresh_val, 前景像素=np.sum(binary > 0), 背景像素=np.sum(binary == 0))
# → 输出类似: 阈值=128, 前景像素=125000, 背景像素=181000`,

  quantize: `# ==================== 多级别量化 ====================
# 功能: 将256级灰度图像量化为较少的灰度级别
# 原理: 将0~255分成levels个等间隔区间，每个区间内的像素统一取区间起始值

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 具有256个可能的灰度级

# 第2步: 设定量化级别数（量化为几个灰度值）
levels = 8
# → 将256级压缩为8级，每级间隔 = 256/8 = 32

# 第3步: 执行均匀量化——先整除再乘回
quantized = (gray // (256 // levels)) * (256 // levels)
# → 256//levels=32，gray//32 得到级别索引(0~7)，再乘32得到量化值
# → 例如: 像素值100 → 100//32=3 → 3*32=96

# 第4步: 保存量化后的图像
cv2.imwrite('result.png', quantized)

# 第5步: 验证量化结果
info(量化级别=levels, 实际灰度数=len(np.unique(quantized)))
# → np.unique 统计量化后图像中实际存在的不同灰度值个数`,

  // --- Chapter 4: 空间域增强 ---
  smooth: `# ==================== 平滑滤波对比：均值/中值/高斯 ====================
# 功能: 对比三种常用平滑滤波器的效果
# 原理: 均值滤波取邻域平均；中值滤波取邻域中位数；高斯滤波加权平均

# 第1步: 读取彩色图像
img = imread_color()

# --- 均值滤波 ---
# 第2步: 使用5x5均值核进行平滑（每个像素取周围25个像素的平均值）
mean_blur = cv2.blur(img, (5, 5))
# → 参数(img, 核大小)，核越大越模糊

# --- 中值滤波 ---
# 第3步: 使用5x5窗口的中值滤波（特别适合去除椒盐噪声）
median_blur = cv2.medianBlur(img, 5)
# → 参数(img, 核大小)，核大小必须为奇数

# --- 高斯滤波 ---
# 第4步: 使用5x5高斯核平滑（sigma=1.0，中心权重大、边缘权重小）
gauss_blur = cv2.GaussianBlur(img, (5, 5), 1.0)
# → 参数(img, 核大小, sigma)，sigma越大权重分布越分散

# 第5步: 创建2x2子图对比四种效果
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(cv2.cvtColor(mean_blur, cv2.COLOR_BGR2RGB)); axes[0,1].set_title('均值滤波 5x5'); axes[0,1].axis('off')
axes[1,0].imshow(cv2.cvtColor(median_blur, cv2.COLOR_BGR2RGB)); axes[1,0].set_title('中值滤波 5x5'); axes[1,0].axis('off')
axes[1,1].imshow(cv2.cvtColor(gauss_blur, cv2.COLOR_BGR2RGB)); axes[1,1].set_title('高斯滤波 5x5'); axes[1,1].axis('off')
savefig(fig, 'result')

# 第6步: 比较滤波后的方差（方差越小越平滑）
info(均值滤波方差=mean_blur.var(), 中值滤波方差=median_blur.var())`,

  sharpen: `# ==================== 图像锐化：拉普拉斯 + USM ====================
# 功能: 使用拉普拉斯算子和非锐化掩模(USM)增强图像边缘和细节
# 原理: 拉普拉斯核直接提取二阶导数；USM先模糊再与原图差值叠加

# 第1步: 读取彩色图像
img = imread_color()

# --- 拉普拉斯锐化 ---
# 第2步: 定义拉普拉斯锐化核（中心为5，四周为-1，核元素之和=1保持亮度）
lap_kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
# → 中心系数5 - 四周4个(-1) = 1，锐化后不改变整体亮度

# 第3步: 使用filter2D进行卷积操作
lap_sharp = cv2.filter2D(img, -1, lap_kernel)
# → ddepth=-1 表示输出与输入深度相同

# --- USM锐化 ---
# 第4步: 先对图像做高斯模糊（生成"非锐化"版本）
blurred = cv2.GaussianBlur(img, (0,0), 3)
# → (0,0)表示核大小由sigma自动计算，sigma=3

# 第5步: USM锐化 = 原图×1.5 + 模糊图×(-0.5)，等效于原图 + 0.5×(原图-模糊图)
usm_sharp = cv2.addWeighted(img, 1.5, blurred, -0.5, 0)
# → addWeighted(src1, alpha, src2, beta, gamma): result = alpha*src1 + beta*src2 + gamma

# 第6步: 创建1行3列对比图
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, im, t in zip(axes, [img, lap_sharp, usm_sharp], ['原图', '拉普拉斯锐化', 'USM锐化']):
    ax.imshow(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)); ax.set_title(t); ax.axis('off')
savefig(fig, 'result')

# 第7步: 比较方差（方差越大说明细节/对比度越强）
info(原图方差=img.var(), 拉普拉斯方差=lap_sharp.var(), USM方差=usm_sharp.var())`,

  denoise: `# ==================== 图像去噪 ====================
# 功能: 使用非局部均值(NLM)算法去除彩色图像中的噪声
# 原理: NLM在图像中搜索相似块，用相似块的加权平均来替代当前像素，保边去噪

# 第1步: 读取彩色图像
img = imread_color()
# → img 为含噪声的彩色图像

# 第2步: 调用快速NLM彩色去噪函数
result = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
# → 参数说明:
#   第1个: 输入图像
#   第2个: 输出图像(None表示自动创建)
#   第3个: h=10, 控制亮度分量的滤波强度（越大去噪越强，但可能模糊细节）
#   第4个: hForColorComponents=10, 控制色度分量的滤波强度
#   第5个: templateWindowSize=7, 搜索模板窗口大小(必须为奇数)
#   第6个: searchWindowSize=21, 搜索窗口大小(必须为奇数且>template)

# 第3步: 保存去噪后的图像
cv2.imwrite('result.png', result)`,

  gradient: `# ==================== 图像梯度计算（Sobel x/y方向 + 梯度幅值） ====================
# 功能: 使用Sobel算子计算水平和垂直方向的梯度，并计算梯度幅值
# 原理: Sobel算子是一阶导数算子，可检测图像中灰度变化剧烈的边缘区域

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 是二维数组

# --- X方向梯度（检测垂直边缘） ---
# 第2步: 计算x方向(水平)的Sobel梯度
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
# → 参数: (图像, 输出深度, dx=1, dy=0, 核大小)
# → dx=1,dy=0 表示求x方向一阶导数，CV_64F 保留负值

# --- Y方向梯度（检测水平边缘） ---
# 第3步: 计算y方向(垂直)的Sobel梯度
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
# → dx=0,dy=1 表示求y方向一阶导数

# --- 梯度幅值 ---
# 第4步: 计算梯度幅值 = sqrt(Gx^2 + Gy^2)
magnitude = np.sqrt(sobelx**2 + sobely**2)
# → 幅值越大表示该处边缘越强

# 第5步: 归一化到[0,255]以便显示
mag_norm = np.clip(magnitude / magnitude.max() * 255, 0, 255).astype(np.uint8)

# --- 梯度方向 ---
# 第6步: 计算梯度方向角 = arctan(Gy/Gx)，单位为度
angle = np.arctan2(sobely, sobelx) * 180 / np.pi
# → 角度范围 -180°~180°，表示边缘的朝向

# 第7步: 创建2x2子图显示原图、X梯度、Y梯度和梯度幅值
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(np.abs(sobelx), cmap='gray'); axes[0,1].set_title('X方向梯度'); axes[0,1].axis('off')
# → X方向梯度亮线为垂直边缘
axes[1,0].imshow(np.abs(sobely), cmap='gray'); axes[1,0].set_title('Y方向梯度'); axes[1,0].axis('off')
# → Y方向梯度亮线为水平边缘
axes[1,1].imshow(mag_norm, cmap='gray'); axes[1,1].set_title('梯度幅值'); axes[1,1].axis('off')
savefig(fig, 'result')
info(梯度均值=magnitude.mean(), 梯度最大值=magnitude.max())`,

  directional: `# ==================== 方向滤波（不同角度方向核的效果对比） ====================
# 功能: 使用不同方向的角度核检测图像中特定朝向的边缘
# 原理: 方向核是一阶导数核，对不同角度的线条有选择性响应

# 第1步: 读取灰度图像
gray = imread_gray()

# 第2步: 设计不同角度的方向检测核（3x3卷积核）
kernels = {
    '水平(0°)': np.array([[-1,-1,-1],[2,2,2],[-1,-1,-1]]),
    # → 水平核: 中间行权重大，对水平线条响应强
    '垂直(90°)': np.array([[-1,2,-1],[-1,2,-1],[-1,2,-1]]),
    # → 垂直核: 中间列权重大，对垂直线条响应强
    '对角(45°)': np.array([[2,-1,-1],[-1,2,-1],[-1,-1,2]]),
    # → 45度核: 对角线权重大，对左上-右下方向线条响应强
    '对角(135°)': np.array([[-1,-1,2],[-1,2,-1],[2,-1,-1]])
    # → 135度核: 反对角线权重大，对右上-左下方向线条响应强
}

# 第3步: 创建2x2子图，分别显示四个方向的滤波结果
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
for ax, (name, kernel) in zip(axes.flat, kernels.items()):
    # 第4步: 对图像应用方向滤波
    filtered = cv2.filter2D(gray, cv2.CV_64F, kernel)
    # → CV_64F 保留负值（方向核输出有正有负）

    # 第5步: 取绝对值并归一化到[0,255]显示
    filtered = np.abs(filtered)
    filtered = np.clip(filtered / filtered.max() * 255, 0, 255).astype(np.uint8)

    ax.imshow(filtered, cmap='gray'); ax.set_title(name); ax.axis('off')
savefig(fig, 'result')
info(说明='方向核可提取特定角度边缘特征')`,

  emboss: `# ==================== 浮雕效果（方向导数+偏移） ====================
# 功能: 使用方向导数核加上灰度偏移128产生立体浮雕效果
# 原理: 浮雕 = 方向导数(边缘检测) + 128(中性灰)，突出立体感

# 第1步: 读取彩色图像并转为灰度浮点图
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float64)
# → 转为float64是因为方向核输出有负值，需要保留精度

# 第2步: 定义不同方向的浮雕核（方向导数 + 中心偏移128）
emboss_kernels = {
    '左上': np.array([[-2,-1,0],[-1,1,1],[0,1,2]]),
    # → 左上方元素为负(暗)，右下方为正(亮)，产生左上方向光照效果
    '正上': np.array([[-1,-1,-1],[0,1,0],[1,1,1]]),
    # → 上方元素为负，下方为正，模拟顶部光源
    '右侧': np.array([[-1,0,1],[-1,0,1],[-1,0,1]])
    # → 左侧为负，右侧为正，模拟右侧光源
}

# 第3步: 创建2x2子图（原图 + 三个方向的浮雕效果）
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')

for ax, (name, kernel) in zip([axes[0,1], axes[1,0], axes[1,1]], emboss_kernels.items()):
    # 第4步: 对灰度图进行卷积，再加上128中性灰偏移
    result = cv2.filter2D(gray, -1, kernel) + 128
    # → filter2D输出有正有负，+128使中性区域变为中灰色
    result = np.clip(result, 0, 255).astype(np.uint8)
    # → 裁剪到合法范围并转为uint8

    ax.imshow(result, cmap='gray'); ax.set_title(f'浮雕-{name}'); ax.axis('off')

savefig(fig, 'result')
info(说明='浮雕效果=方向导数+灰度偏移128')`,

  // --- Chapter 5: 频率域 ---
  fft: `# ==================== 二维傅里叶变换与频谱分析 ====================
# 功能: 对图像进行二维FFT，显示幅度谱和相位谱
# 原理: 傅里叶变换将图像从空间域转换到频率域，中心为低频（均值），外围为高频（边缘）

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 是空间域的二维灰度矩阵

# --- 二维FFT并中心化 ---
# 第2步: 计算二维快速傅里叶变换
f = np.fft.fft2(gray.astype(np.float64))
# → f 是复数矩阵，包含幅度和相位信息

# 第3步: 将零频分量移到频谱中心（默认在四角，fftshift移到中心便于观察）
fshift = np.fft.fftshift(f)
# → 移位后中心点代表直流分量（图像均值），四周代表高频

# --- 幅度谱（对数压缩） ---
# 第4步: 计算幅度谱并做对数压缩（因动态范围极大，直接显示看不清）
magnitude = np.log1p(np.abs(fshift))
# → log1p(x) = log(1+x)，压缩大值、增强小值的可见性

# 第5步: 归一化到[0,255]显示
mag_norm = (magnitude / magnitude.max() * 255).astype(np.uint8)

# --- 相位谱 ---
# 第6步: 计算相位谱（包含图像的结构/位置信息）
phase = np.angle(fshift)
# → 相位值范围 -pi ~ +pi 弧度

# 第7步: 创建1行3列子图显示原图、频谱和相位谱
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(mag_norm, cmap='gray'); axes[1].set_title('频谱(对数)'); axes[1].axis('off')
# → 亮十字表示图像中主要的频率方向
axes[2].imshow(phase, cmap='twilight'); axes[2].set_title('相位谱'); axes[2].axis('off')
# → 相位谱决定了图像的结构和形状
savefig(fig, 'result')
info(图像尺寸=gray.shape, 频谱最大值=magnitude.max())`,

  'lowpass-freq': `# ==================== 频域低通滤波（理想/巴特沃斯/高斯对比） ====================
# 功能: 在频率域使用三种低通滤波器平滑图像，对比其效果差异
# 原理: 低通滤波保留低频（平滑区域），抑制高频（边缘/噪声），使图像模糊

# 第1步: 读取灰度图像并计算中心化FFT
gray = imread_gray()
f = np.fft.fftshift(np.fft.fft2(gray.astype(np.float64)))
# → f 是中心化后的频谱，中心=低频，四周=高频
h, w = gray.shape

# 第2步: 构建距离矩阵D，D[u,v]=点(u,v)到频谱中心的距离
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)
# → D 值越大表示频率越高

# 第3步: 设定截止频率（半径阈值）
D0 = 30  # 截止频率
# → D<D0的频率保留，D>D0的频率被抑制

# --- 理想低通（硬截断，会产生振铃效应） ---
H_ideal = (D <= D0).astype(np.float64)
# → 在D0处突然从1跳到0

# --- 巴特沃斯低通（2阶，过渡平滑） ---
H_butter = 1.0 / (1 + (D / D0)**4)
# → 2阶巴特沃斯，过渡带平滑，振铃效应较小

# --- 高斯低通（最平滑，无振铃） ---
H_gauss = np.exp(-D**2 / (2 * D0**2))
# → 高斯形状，过渡最平滑，无振铃

# 第4步: 创建2x3子图对比滤波效果
fig, axes = plt.subplots(2, 3, figsize=(14, 8))
for ax, (H, name) in zip(axes.flat, [(H_ideal,'理想'),(H_butter,'巴特沃斯'),(H_gauss,'高斯')]):
    # 频谱乘以滤波器 → 逆FFT → 取绝对值
    filtered = np.abs(np.fft.ifft2(np.fft.ifftshift(f * H)))
    # → ifftshift 移回，ifft2 逆变换回空间域
    filtered = np.clip(filtered, 0, 255).astype(np.uint8)
    ax.imshow(filtered, cmap='gray'); ax.set_title(f'{name}低通'); ax.axis('off')

axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')

# 第5步: 绘制滤波器截面图对比三种形状
axes[1,0].plot(H_ideal[h//2,:]); axes[1,0].plot(H_butter[h//2,:]); axes[1,0].plot(H_gauss[h//2,:])
axes[1,0].set_title('滤波器截面'); axes[1,0].legend(['理想','巴特沃斯','高斯'])
savefig(fig, 'result')`,

  'highpass-freq': `# ==================== 频域高通滤波（理想/巴特沃斯/高斯对比） ====================
# 功能: 在频率域使用三种高通滤波器增强边缘和细节
# 原理: 高通滤波 = 1 - 低通滤波，保留高频（边缘/纹理），抑制低频（平滑区域）

# 第1步: 读取灰度图像并计算中心化FFT
gray = imread_gray()
f = np.fft.fftshift(np.fft.fft2(gray.astype(np.float64)))
h, w = gray.shape

# 第2步: 构建距离矩阵
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)
# → D 值越大表示离中心越远，频率越高

# 第3步: 设定截止频率
D0 = 30  # 截止频率
# → D>D0的频率保留，D<D0的频率被抑制

# --- 三种高通滤波器：HPF = 1 - LPF ---
# 第4步: 理想高通（硬截断）
H_ideal = (D > D0).astype(np.float64)
# → 中心区域完全抑制，外围完全通过

# 第5步: 巴特沃斯高通（2阶，过渡平滑）
H_butter = 1.0 / (1 + (D0 / (D + 1e-10))**4)
# → 1e-10 防止D=0时除零错误

# 第6步: 高斯高通（最平滑，无振铃）
H_gauss = 1 - np.exp(-D**2 / (2 * D0**2))
# → 高斯低通的补集

# 第7步: 创建1行3列对比图
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, (H, name) in zip(axes, [(H_ideal,'理想'),(H_butter,'巴特沃斯'),(H_gauss,'高斯')]):
    # 频谱乘以高通滤波器 → 逆FFT → 取绝对值
    filtered = np.abs(np.fft.ifft2(np.fft.ifftshift(f * H)))
    filtered = np.clip(filtered, 0, 255).astype(np.uint8)
    ax.imshow(filtered, cmap='gray'); ax.set_title(f'{name}高通'); ax.axis('off')
savefig(fig, 'result')
info(说明='高通滤波保留边缘和细节，抑制平滑区域')`,

  'bandpass-freq': `# ==================== 频域带通滤波（选择特定频率范围） ====================
# 功能: 在频率域只保留特定频率范围的成分，去除过低和过高频率
# 原理: 带通 = 高通(D1) AND 低通(D2)，即 D1 <= 距离 <= D2 的频率通过

# 第1步: 读取灰度图像并计算中心化FFT
gray = imread_gray()
f = np.fft.fftshift(np.fft.fft2(gray.astype(np.float64)))
h, w = gray.shape

# 第2步: 构建距离矩阵
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)

# 第3步: 设定带通范围（内半径D1，外半径D2）
# 带通范围：D1 < D < D2
D1, D2 = 20, 60
# → D1=20抑制过低频(大面积平坦区域)，D2=60抑制过高频(噪声)

# 第4步: 构造理想带通滤波器
H_band = ((D >= D1) & (D <= D2)).astype(np.float64)
# → 只有环形区域(D1~D2之间)的频率为1，其余为0

# 第5步: 应用带通滤波并逆变换回空间域
f_filtered = f * H_band
# → 频谱乘以带通滤波器，只保留目标频率
result = np.abs(np.fft.ifft2(np.fft.ifftshift(f_filtered)))
# → 逆变换得到仅含特定频率成分的空间域图像
result = np.clip(result / result.max() * 255, 0, 255).astype(np.uint8)

# 第6步: 计算原始和滤波后的对数幅度谱用于对比
# 频谱对比
mag_orig = np.log1p(np.abs(f))
mag_filtered = np.log1p(np.abs(f_filtered))

# 第7步: 创建1行3列子图显示原图、滤波后频谱和滤波结果
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(mag_filtered, cmap='gray'); axes[1].set_title('带通频谱'); axes[1].axis('off')
# → 环形区域为保留的频率成分
axes[2].imshow(result, cmap='gray'); axes[2].set_title(f'带通结果({D1}-{D2})'); axes[2].axis('off')
savefig(fig, 'result')
info(频率范围=f'{D1}-{D2}', 说明='带通提取特定尺度的纹理特征')`,

  homomorphic: `# ==================== 同态滤波（对数变换→FFT→滤波→指数变换） ====================
# 功能: 同时压缩动态范围（去光照不均）和增强对比度（突出细节）
# 原理: 图像=照射分量×反射分量，取对数分离后在频域分别处理

# 第1步: 读取灰度图像，加1避免log(0)
img = imread_gray().astype(np.float64) + 1
# → +1确保所有像素>=1，log后>=0

# --- 取对数分离照射和反射分量 ---
# 第2步: 对图像取自然对数，将乘法关系转为加法关系
log_img = np.log(img)
# → log(照射×反射) = log(照射) + log(反射)

# 第3步: 对对数图像做FFT并中心化
# FFT
f = np.fft.fftshift(np.fft.fft2(log_img))

# 第4步: 构建距离矩阵
h, w = log_img.shape
u, v = np.meshgrid(np.arange(w), np.arange(h))
D = np.sqrt((u - w/2)**2 + (v - h/2)**2)

# --- 同态滤波函数：压缩低频(照射)，增强高频(反射) ---
# 第5步: 设定滤波器参数
rh, rl, c = 1.5, 0.3, 40
# → rh=1.5 高频增益(增强反射/细节)，rl=0.3 低频增益(压缩照射/光照)
# → c=40 控制过渡带的陡峭程度

# 第6步: 构建同态滤波器传递函数
H = (rh - rl) * (1 - np.exp(-c * (D**2) / (40**2))) + rl
# → D=0时H=rl(低频被压缩)，D很大时H→rh(高频被增强)

# 第7步: 频域滤波
# 频域滤波
f_filtered = f * H
# → 频谱乘以同态滤波器

# 第8步: 逆FFT + 取指数（恢复乘法关系）
# 逆变换 + 取指数
result = np.exp(np.real(np.fft.ifft2(np.fft.ifftshift(f_filtered))))
# → exp是log的逆操作，将加法恢复为乘法

# 第9步: 归一化到[0,255]
result = np.clip((result - result.min()) / (result.max() - result.min()) * 255, 0, 255).astype(np.uint8)

# 第10步: 创建1行3列子图对比显示
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img - 1, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(H, cmap='hot'); axes[1].set_title('同态滤波器'); axes[1].axis('off')
# → 滤波器中心低(抑制低频)外围高(增强高频)
axes[2].imshow(result, cmap='gray'); axes[2].set_title('同态滤波结果'); axes[2].axis('off')
savefig(fig, 'result')
info(说明='同态滤波同时压缩动态范围和增强对比度')`,

  // --- Chapter 6: 图像恢复与增强 ---
  'hist-eq': `# ==================== 直方图均衡化增强 ====================
# 功能: 通过累积分布函数(CDF)将直方图均匀化，增强图像整体对比度
# 原理: 将累积直方图作为变换函数，使输出图像的直方图近似均匀分布

# 第1步: 读取灰度图像
img = imread_gray()

# --- 计算原始直方图 ---
# 第2步: 使用OpenCV计算原始图像的256级灰度直方图
hist_before = cv2.calcHist([img], [0], None, [256], [0, 256])
# → 参数: (图像列表, 通道索引, 掩码, 直方图大小, 灰度范围)

# --- 直方图均衡化 ---
# 第3步: 执行全局直方图均衡化
equ = cv2.equalizeHist(img)
# → equalizeHist 自动计算CDF并映射，使灰度分布更均匀

# --- 计算均衡后直方图 ---
# 第4步: 计算均衡后图像的直方图用于对比
hist_after = cv2.calcHist([equ], [0], None, [256], [0, 256])

# --- 对比显示 ---
# 第5步: 创建2x2子图（原图+原始直方图，均衡图+均衡直方图）
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].plot(hist_before, color='#94a3b8'); axes[0,1].set_title('原始直方图')
# → 原始直方图可能集中在某个灰度区间
axes[1,0].imshow(equ, cmap='gray'); axes[1,0].set_title('均衡化结果'); axes[1,0].axis('off')
axes[1,1].plot(hist_after, color='#6366f1'); axes[1,1].set_title('均衡后直方图')
# → 均衡后直方图铺展到0~255全范围，分布更均匀
savefig(fig, 'result')
info(均值变化=f'{img.mean():.1f} -> {equ.mean():.1f}')`,

  clahe: `# ==================== CLAHE自适应直方图均衡（不同clipLimit对比） ====================
# 功能: 使用限制对比度自适应直方图均衡(CLAHE)，避免全局均衡过度增强噪声
# 原理: 将图像分成小块(tile)分别均衡化，clipLimit限制每个bin的最大高度

# 第1步: 读取灰度图像
img = imread_gray()

# 第2步: 创建2x2子图（原图 + 三种clipLimit的对比）
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')

for ax, clip in zip([axes[0,1], axes[1,0], axes[1,1]], [2.0, 4.0, 8.0]):
    # 第3步: 创建CLAHE对象，clipLimit控制对比度增强强度
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    # → clipLimit: 对比度限制阈值，越大增强越强（默认2.0）
    # → tileGridSize: 将图像分成8x8个小块分别做均衡化

    # 第4步: 应用CLAHE增强
    result = clahe.apply(img)
    # → 相比全局均衡化，CLAHE保留局部细节且抑制噪声放大

    ax.imshow(result, cmap='gray'); ax.set_title(f'CLAHE clip={clip}'); ax.axis('off')

savefig(fig, 'result')
info(说明='clipLimit越大增强越强，但可能引入噪声')`,

  'log-transform': `# ==================== 对数变换增强（不同c值对比） ====================
# 功能: 使用对数变换扩展暗区灰度级，增强低亮度区域的细节
# 原理: g = c * log(1+f)，暗区灰度级被拉伸，亮区被压缩，c越大增强越强

# 第1步: 读取灰度图像并转为浮点型
img = imread_gray().astype(np.float64)
# → 浮点运算避免对数变换中的溢出

# 第2步: 创建1行3列子图，对比不同c值的增强效果
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, c in zip(axes, [10, 30, 60]):
    # 第3步: 对数变换 g = c * log(1 + f)
    result = c * np.log1p(img)
    # → log1p(x) = log(1+x)，+1避免log(0)
    # → c控制增强程度: c越大，暗区被拉伸得越厉害

    # 第4步: 归一化到[0,255]并转为uint8显示
    result = np.clip(result / result.max() * 255, 0, 255).astype(np.uint8)

    ax.imshow(result, cmap='gray'); ax.set_title(f'c={c}'); ax.axis('off')

savefig(fig, 'result')
info(原图均值=img.mean(), 说明='对数变换扩展暗区灰度级，增强低亮度细节')`,

  unsharp: `# ==================== USM锐化（非锐化掩模：高斯模糊→差值→叠加） ====================
# 功能: 通过非锐化掩模(Unsharp Masking)增强图像边缘和细节
# 原理: mask=原图-模糊图(高频细节)，输出=原图+k*mask，k控制锐化强度

# 第1步: 读取彩色图像
img = imread_color()

# --- 高斯模糊生成"非锐化"版本 ---
# 第2步: 对原图做高斯模糊，得到"非锐化"的平滑版本
blurred = cv2.GaussianBlur(img, (0, 0), 3)
# → (0,0)表示核大小由sigma=3自动决定

# --- 计算掩模 = 原图 - 模糊图（高频细节） ---
# 第3步: 原图减去模糊图，得到高频细节掩模
mask = cv2.subtract(img, blurred)
# → mask包含边缘和纹理信息，平滑区域接近0

# 第4步: 创建1行3列子图对比不同k值的锐化效果
# 不同强度叠加：g = f + k * mask
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title('原图'); axes[0].axis('off')

for ax, k in zip([axes[1], axes[2]], [0.5, 1.5]):
    # 第5步: 原图加权叠加——等效于 f + k*(f - blurred)
    result = cv2.addWeighted(img, 1.0 + k, blurred, -k, 0)
    # → addWeighted(img, 1+k, blurred, -k, 0) = (1+k)*img - k*blurred
    # → 等效于 img + k*(img - blurred) = img + k*mask
    # → k=0.5 轻度锐化; k=1.5 高提升滤波(锐化更强)

    ax.imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); ax.set_title(f'USM k={k}'); ax.axis('off')

savefig(fig, 'result')
info(说明='k控制锐化强度，k>1为高提升滤波')`,

  'color-enhance': `# ==================== 彩色图像增强 ====================
# 功能: 在HSV颜色空间增强彩色图像，同时演示伪彩色和CLAHE增强
# 原理: HSV空间将色调(H)、饱和度(S)、亮度(V)分离，只增强V通道可保持色彩不失真

# 第1步: 读取彩色图像并转换到HSV颜色空间
img = imread_color()
# → img 为BGR三通道的彩色图像

# 第2步: HSV空间亮度均衡化 —— 只对V(亮度)通道做直方图均衡
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# → hsv 三通道分别为 H(色调0~179)、S(饱和度0~255)、V(亮度0~255)
hsv[:,:,2] = cv2.equalizeHist(hsv[:,:,2])
# → 仅替换V通道为均衡化结果，H和S保持不变，色彩不会偏色
enhanced_hsv = cv2.cvtColor(hsv, cv2.COLOR_BGR2RGB)
# → 转换为RGB格式用于matplotlib显示

# 第3步: 伪彩色增强 —— 将灰度图通过jet色彩映射变为彩色
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# → gray 为单通道灰度图，shape=(高, 宽)
pseudo = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
# → pseudo 为伪彩色图像，低灰度→蓝色，高灰度→红色
pseudo_rgb = cv2.cvtColor(pseudo, cv2.COLOR_BGR2RGB)

# 第4步: CLAHE自适应均衡增强V通道（局部对比度增强）
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
# → clipLimit=3.0 限制对比度放大倍数，tileGridSize=(8,8) 将图像分为8×8块局部均衡
hsv2 = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
hsv2[:,:,2] = clahe.apply(hsv2[:,:,2])
# → CLAHE在每个局部区块内做均衡化，比全局均衡化更能保留细节
enhanced_clahe = cv2.cvtColor(hsv2, cv2.COLOR_BGR2RGB)

# 第5步: 可视化 —— 2×3子图展示所有增强结果
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
  'motion-blur': `# ==================== 运动模糊模拟 ====================
# 功能: 模拟相机或物体运动造成的线性模糊，对比不同长度和角度的效果
# 原理: 运动模糊核是一条线段，长度决定模糊程度，角度决定模糊方向

# 第1步: 读取灰度图像并转为浮点型（卷积运算需要浮点精度）
img = imread_gray().astype(np.float64)
# → img 为float64数组，避免卷积运算时整数溢出

# 第2步: 定义运动模糊核生成函数
def make_motion_kernel(length, angle):
    \\"\\"\\"创建运动模糊核: length=模糊长度(像素), angle=模糊角度(度)\\"\\"\\"
    k = np.zeros((length, length))
    # → 创建 length×length 的全零矩阵
    k[length//2, :] = 1.0 / length
    # → 在中间行放置水平亮线，归一化使核元素之和=1（保持图像亮度不变）
    center = (length//2, length//2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    # → M 为2×3旋转仿射矩阵，将水平线绕中心旋转angle度
    return cv2.warpAffine(k, M, (length, length))
    # → 返回旋转后的模糊核

# 第3步: 可视化对比 —— 2×2子图展示不同参数的模糊效果
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
# 三组参数: (核长度, 角度)，分别为水平15px、45度15px、垂直25px
params = [(15, 0), (15, 45), (25, 90)]
for ax, (length, angle) in zip([axes[0,1], axes[1,0], axes[1,1]], params):
    kernel = make_motion_kernel(length, angle)
    # → 生成对应length和angle的运动模糊核
    blurred = cv2.filter2D(img, -1, kernel)
    # → filter2D对图像做二维卷积，-1表示输出深度与输入相同
    blurred = np.clip(blurred, 0, 255).astype(np.uint8)
    # → 截断到0~255并转回uint8显示格式
    ax.imshow(blurred, cmap='gray'); ax.set_title(f'L={length} A={angle}°'); ax.axis('off')
savefig(fig, 'result')
info(说明='运动模糊核由长度和角度决定')`,

  'defocus-blur': `# ==================== 离焦模糊模拟 ====================
# 功能: 模拟镜头失焦造成的模糊效果，对比不同半径圆盘核的模糊程度
# 原理: 离焦模糊核为圆盘形（圆形均匀核），半径越大表示失焦越严重

# 第1步: 读取灰度图像并转为浮点型
img = imread_gray().astype(np.float64)
# → img 为float64数组，确保卷积运算精度

# 第2步: 定义圆盘形离焦核生成函数
def make_disk_kernel(radius):
    \\"\\"\\"创建圆盘形离焦核: radius=圆盘半径(像素)\\"\\"\\"
    size = 2 * radius + 1
    # → 核的尺寸为直径+1，确保有中心像素
    kernel = np.zeros((size, size))
    # → 创建全零方阵
    cv2.circle(kernel, (radius, radius), radius, 1, -1)
    # → 以(radius,radius)为圆心画实心圆(-1表示填充)，填充值=1
    return kernel / kernel.sum()
    # → 归一化使核元素之和=1，保持图像亮度不变

# 第3步: 可视化对比 —— 1×3子图展示不同半径的模糊效果
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, r in zip(axes, [3, 7, 15]):
    kernel = make_disk_kernel(r)
    # → 生成半径为r的圆盘形模糊核
    blurred = cv2.filter2D(img, -1, kernel)
    # → 用圆盘核对图像做二维卷积，模拟离焦模糊
    blurred = np.clip(blurred, 0, 255).astype(np.uint8)
    # → 截断到有效灰度范围并转回uint8
    ax.imshow(blurred, cmap='gray'); ax.set_title(f'半径R={r}'); ax.axis('off')
savefig(fig, 'result')
info(说明='离焦模糊核为圆盘形，半径越大模糊越强')`,

  'inverse-filter': `# ==================== 逆滤波复原 ====================
# 功能: 用频域逆滤波方法从运动模糊图像中恢复原始图像
# 原理: 在频率域中，退化图像G(u,v)=H(u,v)·F(u,v)，逆滤波即F=G/H

# 第1步: 读取灰度图像并模拟运动模糊退化
img = imread_gray().astype(np.float64)
# → img 为浮点灰度图
size = 15
# → 模糊核大小为15×15
kernel = np.zeros((size, size))
kernel[size//2, :] = 1.0 / size
# → 水平运动模糊核，长度为15像素
blurred = cv2.filter2D(img, -1, kernel)
# → 模糊后的退化图像

# 第2步: 频域逆滤波复原
f_blurred = np.fft.fft2(blurred)
# → 对模糊图像做二维FFT，得到频域表示
f_kernel = np.fft.fft2(kernel, s=img.shape)
# → 对模糊核做FFT，s参数指定与图像同尺寸
# 设置阈值防止除零（伪逆滤波）—— 这是逆滤波的关键问题
f_kernel[np.abs(f_kernel) < 0.01] = 0.01
# → 当H(u,v)接近零时截断为0.01，避免除以零导致噪声爆炸
f_restored = f_blurred / f_kernel
# → 逆滤波核心: 频域除法 F=G/H
restored = np.abs(np.fft.ifft2(f_restored))
# → 逆FFT回到空间域，取模得到复原图像
restored = np.clip(restored / restored.max() * 255, 0, 255).astype(np.uint8)
# → 归一化到0~255范围

# 第3步: 可视化对比 —— 原图 vs 模糊图 vs 复原图
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(np.clip(blurred, 0, 255).astype(np.uint8), cmap='gray'); axes[1].set_title('运动模糊'); axes[1].axis('off')
axes[2].imshow(restored, cmap='gray'); axes[2].set_title('逆滤波复原'); axes[2].axis('off')
savefig(fig, 'result')
info(说明='逆滤波在H接近零时会放大噪声，需阈值截断')`,

  'wiener-filter': `# ==================== 维纳滤波复原 ====================
# 功能: 用维纳滤波从模糊+噪声的退化图像中恢复原始图像，并与逆滤波对比
# 原理: 维纳滤波 W = H*/(|H|^2+K)，在去模糊和去噪之间取最优平衡（最小均方误差）

# 第1步: 读取灰度图像并模拟运动模糊+加性噪声
img = imread_gray().astype(np.float64)
size = 15
# → 模糊核大小15×15
kernel = np.zeros((size, size))
kernel[size//2, :] = 1.0 / size
# → 水平运动模糊核
blurred = cv2.filter2D(img, -1, kernel)
# → 运动模糊后的图像
noisy = blurred + np.random.normal(0, 5, blurred.shape)
# → 叠加标准差为5的高斯噪声，模拟传感器噪声

# 第2步: 维纳滤波复原（频域实现）
f_noisy = np.fft.fft2(noisy)
# → 退化图像的频域表示
f_kernel = np.fft.fft2(kernel, s=img.shape)
# → 退化函数H(u,v)的频域表示
# 信噪比参数K —— K越小越接近逆滤波，K越大去噪越强但去模糊越弱
K = 0.02
f_wiener = (np.conj(f_kernel) / (np.abs(f_kernel)**2 + K)) * f_noisy
# → 维纳滤波核心公式: W(u,v) = H*(u,v) / (|H(u,v)|² + K) × G(u,v)
restored_wiener = np.abs(np.fft.ifft2(f_wiener))
# → 逆FFT回到空间域
restored_wiener = np.clip(restored_wiener / restored_wiener.max() * 255, 0, 255).astype(np.uint8)

# 第3步: 对比逆滤波（同样的退化图像）
f_kernel_safe = f_kernel.copy()
f_kernel_safe[np.abs(f_kernel_safe) < 0.01] = 0.01
# → 逆滤波的阈值截断保护
restored_inv = np.abs(np.fft.ifft2(f_noisy / f_kernel_safe))
# → 逆滤波: 直接做频域除法
restored_inv = np.clip(restored_inv / restored_inv.max() * 255, 0, 255).astype(np.uint8)

# 第4步: 可视化对比 —— 2×2子图展示原图、退化图、两种复原结果
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(np.clip(noisy, 0, 255).astype(np.uint8), cmap='gray'); axes[0,1].set_title('模糊+噪声'); axes[0,1].axis('off')
axes[1,0].imshow(restored_inv, cmap='gray'); axes[1,0].set_title('逆滤波'); axes[1,0].axis('off')
axes[1,1].imshow(restored_wiener, cmap='gray'); axes[1,1].set_title('维纳滤波'); axes[1,1].axis('off')
savefig(fig, 'result')
info(说明='维纳滤波在去模糊和去噪之间取得最优平衡')`,

  'blind-deconv': `# ==================== 盲反卷积（迭代估计退化核并复原） ====================
# 功能: 在退化核未知的情况下，用Richardson-Lucy迭代算法同时估计核和复原图像
# 原理: RL算法通过反复卷积和反卷积的迭代，逐步逼近原始图像（属于病态逆问题）

# 第1步: 读取灰度图像并归一化到[0,1]范围
img = imread_gray().astype(np.float64) / 255.0
# → 归一化后像素范围为0.0~1.0，RL算法要求输入在此范围

# 第2步: 模拟真实模糊（使用未知核）
size = 9
# → 真实模糊核大小为9×9
kernel_true = np.zeros((size, size))
kernel_true[size//2, :] = 1.0 / size
# → 真实退化核为水平运动模糊
blurred = cv2.filter2D(img, -1, kernel_true)
# → 模糊后的观测图像

# 第3步: 定义Richardson-Lucy盲反卷积迭代函数
def richardson_lucy(image, psf, iterations=15):
    # image=模糊图像, psf=点扩散函数估计, iterations=迭代次数
    estimate = image.copy()
    # → 初始估计设为模糊图像本身
    for _ in range(iterations):
        conv = cv2.filter2D(estimate, -1, psf)
        # → 当前估计与PSF卷积，模拟退化过程
        conv[conv < 1e-10] = 1e-10
        # → 防止除零错误
        ratio = image / conv
        # → 计算观测图像与模拟退化图像的逐像素比值
        estimate *= cv2.filter2D(ratio, -1, psf[::-1, ::-1])
        # → 用翻转PSF对比值做相关运算，迭代更新估计值
    return np.clip(estimate, 0, 1)

# 第4步: 使用均匀核作为PSF初始估计进行复原
psf_est = np.ones((size, size)) / (size * size)
# → 初始PSF设为均匀分布（最不确定的估计）
restored = richardson_lucy(blurred, psf_est, iterations=20)
# → 20次迭代后的复原结果

# 第5步: 可视化对比 —— 原图 vs 模糊图 vs 复原图
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(blurred, cmap='gray'); axes[1].set_title('模糊图像'); axes[1].axis('off')
axes[2].imshow(restored, cmap='gray'); axes[2].set_title('盲反卷积复原'); axes[2].axis('off')
savefig(fig, 'result')
info(说明='盲反卷积同时估计核和图像，是病态问题')`,

  // --- Chapter 8: 图像分割 ---
  sobel: `# ==================== Sobel边缘检测 ====================
# 功能: 用Sobel算子检测图像中的边缘（梯度幅值大的区域）
# 原理: Sobel算子分别计算水平和垂直方向的梯度，再合成梯度幅值 |G|=sqrt(Gx²+Gy²)

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 为二维灰度数组

# 第2步: 分别计算水平和垂直方向的Sobel梯度
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
# → sobelx 为水平梯度(dx=1,dy=0)，检测垂直边缘；CV_64F保留负值
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
# → sobely 为垂直梯度(dx=0,dy=1)，检测水平边缘；ksize=3为3×3核

# 第3步: 计算梯度幅值并归一化到0~255
magnitude = np.sqrt(sobelx**2 + sobely**2)
# → 梯度幅值 = sqrt(Gx² + Gy²)，值越大表示边缘越强
result = np.clip(magnitude / magnitude.max() * 255, 0, 255).astype(np.uint8)
# → 归一化到0~255并转为uint8格式保存
cv2.imwrite('result.png', result)`,

  canny: `# ==================== Canny边缘检测 ====================
# 功能: 用Canny算法检测图像边缘，输出细而连续的边缘线
# 原理: Canny边缘检测包含高斯平滑→梯度计算→非极大值抑制→双阈值连接四个步骤

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 为二维灰度数组

# 第2步: Canny边缘检测（内部自动完成高斯平滑、梯度、非极大值抑制、双阈值）
edges = cv2.Canny(gray, 50, 150)
# → threshold1=50为低阈值（弱边缘），threshold2=150为高阈值（强边缘）
# → edges 为二值图像，255=边缘像素，0=非边缘像素

# 第3步: 保存结果并统计边缘像素数量
cv2.imwrite('result.png', edges)
info(边缘像素数=np.sum(edges > 0))
# → 输出边缘像素总数，数值越大说明图像边缘越丰富`,

  'threshold-seg': `# ==================== Otsu阈值分割 ====================
# 功能: 用Otsu大津法自动计算最优阈值，将图像分为前景和背景
# 原理: 遍历所有阈值，找到使类间方差最大的那个阈值（类间方差最大=前景背景分离最好）

# 第1步: 读取灰度图像
gray = imread_gray()
# → gray 为二维灰度数组

# 第2步: OpenCV内置Otsu自动阈值分割
thresh, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# → thresh 为Otsu自动计算的最优阈值(0~255)
# → binary 为二值化结果：像素>thresh → 255(白), 否则 → 0(黑)

# 第3步: 手动实现Otsu算法验证（遍历所有阈值找最优）
hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
# → 统计灰度直方图，256个bin对应0~255灰度级
hist = hist / hist.sum()
# → 归一化为概率分布
best_t, best_var = 0, 0
for t in range(256):
    w0 = hist[:t+1].sum(); w1 = hist[t+1:].sum()
    # → w0=背景像素比例，w1=前景像素比例
    if w0 == 0 or w1 == 0: continue
    mu0 = np.sum(np.arange(t+1) * hist[:t+1]) / w0
    # → mu0 = 背景类的灰度均值
    mu1 = np.sum(np.arange(t+1, 256) * hist[t+1:]) / w1
    # → mu1 = 前景类的灰度均值
    var = w0 * w1 * (mu0 - mu1)**2
    # → 类间方差 = w0 × w1 × (μ0-μ1)²，越大说明分割越好
    if var > best_var: best_var = var; best_t = t

# 第4步: 可视化 —— 原图、直方图+阈值线、分割结果
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].hist(gray.ravel(), 256, [0,256], color='#94a3b8')
axes[1].axvline(thresh, color='red', linestyle='--', label=f'Otsu T={thresh:.0f}')
axes[1].set_title('直方图+阈值'); axes[1].legend()
axes[2].imshow(binary, cmap='gray'); axes[2].set_title('分割结果'); axes[2].axis('off')
savefig(fig, 'result')
info(Otsu阈值=thresh, 手动验证=best_t, 前景像素=np.sum(binary > 0))`,

  'region-grow': `# ==================== 区域生长分割 ====================
# 功能: 从种子点出发，按灰度相似性向四周扩展，分割出与种子点灰度相近的连通区域
# 原理: 广度优先搜索(BFS)，当邻域像素灰度与区域均值之差小于阈值时纳入区域

# 第1步: 读取灰度图像并选择种子点（图像中心）
gray = imread_gray()
seed_y, seed_x = gray.shape[0]//2, gray.shape[1]//2
# → 种子点坐标取图像中心
seed_val = int(gray[seed_y, seed_x])
# → 记录种子点的灰度值

# 第2步: 初始化区域生长所需的数据结构
threshold = 20
# → 灰度差异阈值，只有与区域均值差<20的像素才纳入
mask = np.zeros(gray.shape, dtype=np.uint8)
# → mask 记录已纳入区域的像素（255=区域内，0=区域外）
visited = np.zeros(gray.shape, dtype=bool)
# → visited 记录已访问过的像素，防止重复访问
queue = [(seed_y, seed_x)]
# → BFS队列，从种子点开始
visited[seed_y, seed_x] = True
region_vals = [seed_val]
# → 记录区域内所有像素的灰度值，用于计算区域均值

# 第3步: 广度优先搜索执行区域生长
while queue:
    cy, cx = queue.pop(0)
    # → 取出队列头部的像素坐标
    for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
        # → 遍历上下左右4个邻域方向
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < gray.shape[0] and 0 <= nx < gray.shape[1] and not visited[ny, nx]:
            if abs(int(gray[ny, nx]) - np.mean(region_vals)) < threshold:
                # → 邻居灰度与区域均值的差 < 阈值，纳入区域
                visited[ny, nx] = True
                mask[ny, nx] = 255
                region_vals.append(int(gray[ny, nx]))
                queue.append((ny, nx))
                # → 将新像素加入队列继续扩展

# 第4步: 可视化 —— 原图(标种子点)、生长掩膜、区域提取结果
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[0].plot(seed_x, seed_y, 'r+', markersize=15)
axes[1].imshow(mask, cmap='gray'); axes[1].set_title('生长结果'); axes[1].axis('off')
axes[2].imshow(cv2.bitwise_and(gray, gray, mask=mask), cmap='gray'); axes[2].set_title('区域提取'); axes[2].axis('off')
savefig(fig, 'result')
info(种子值=seed_val, 区域像素=len(region_vals), 阈值=threshold)`,

  watershed: `# ==================== 分水岭分割 ====================
# 功能: 用分水岭算法分割粘连/重叠的目标物体
# 原理: 将图像看作地形面，灰度低=山谷，从确定的前景种子区域开始"注水"，水位交汇处即分割边界

# 第1步: 读取彩色图像并转灰度、做Otsu二值化
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# → gray 为灰度图
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → thresh 为Otsu二值化的反色结果（前景白，背景黑）

# 第2步: 形态学开运算去噪，获取干净的前景掩膜
kernel = np.ones((3,3), np.uint8)
opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
# → 开运算=先腐蚀后膨胀，去除小的噪声前景点

# 第3步: 确定背景区域和前景区域
sure_bg = cv2.dilate(opening, kernel, iterations=3)
# → 膨胀3次得到确定的背景区域（比前景大很多）
dist = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
# → 距离变换: 每个前景像素到最近背景像素的欧氏距离
_, sure_fg = cv2.threshold(dist, 0.5*dist.max(), 255, 0)
# → 距离大于最大距离一半的区域作为确定的前景种子
sure_fg = sure_fg.astype(np.uint8)
unknown = cv2.subtract(sure_bg, sure_fg)
# → 未知区域 = 确定背景 - 确定前景（分水岭将在这些区域展开）

# 第4步: 连通域标记生成markers，然后执行分水岭
_, markers = cv2.connectedComponents(sure_fg)
# → 对确定前景做连通域标记，每个独立区域一个编号
markers = markers + 1
# → 编号+1，让背景=1而不是0（0预留给未知区域）
markers[unknown == 255] = 0
# → 未知区域标记为0，分水岭算法将在这些区域寻找边界
markers = cv2.watershed(img, markers)
# → 分水岭算法：在彩色图像上执行，返回更新后的markers，边界=-1
img[markers == -1] = [255, 0, 0]
# → 将分水岭边界标记为蓝色(255,0,0)
cv2.imwrite('result.png', img)`,

  'kmeans-seg': `# ==================== K-means聚类分割 ====================
# 功能: 用K-means聚类算法按颜色将图像分割为K个区域
# 原理: 将每个像素的BGR值作为3维特征向量，K-means将其聚为K类，每类用聚类中心颜色替代

# 第1步: 读取彩色图像并将像素转为特征向量
img = imread_color()
pixels = img.reshape(-1, 3).astype(np.float32)
# → pixels shape=(高×宽, 3)，每行是一个像素的[B,G,R]值

# 第2步: K-means聚类
K = 3
# → 分为3个类别
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
# → 终止条件: 最多100次迭代 或 精度达到0.2
_, labels, centers = cv2.kmeans(pixels, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
# → labels: 每个像素所属类别(0~K-1), centers: K个聚类中心颜色值
# → 重复10次取最优，初始中心随机选取

# 第3步: 用聚类中心颜色重建图像（每个像素替换为其类别的中心颜色）
centers = centers.astype(np.uint8)
segmented = centers[labels.flatten()]
# → 每个像素用其所属类别的中心颜色替代
segmented = segmented.reshape(img.shape)
# → 恢复为原始图像的二维形状

# 第4步: 可视化对比 —— 原图 vs 分割结果
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(cv2.cvtColor(segmented, cv2.COLOR_BGR2RGB)); axes[1].set_title(f'K={K}聚类'); axes[1].axis('off')
savefig(fig, 'result')
info(聚类中心=centers.tolist())`,

  // --- Chapter 9: 形态学 ---
  erode: `# ==================== 形态学腐蚀 ====================
# 功能: 对二值图像进行腐蚀操作，使前景区域缩小
# 原理: 结构元素在图像上滑动，只有当结构元素完全被前景覆盖时中心像素才保留为前景

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# → binary 为二值图像，255=前景(白)，0=背景(黑)

# 第2步: 创建3×3矩形结构元素（形态学操作的"探针"）
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
# → MORPH_RECT 矩形核，3×3全1矩阵

# 第3步: 执行腐蚀操作（前景收缩，去除小的突出物）
result = cv2.erode(binary, kernel, iterations=1)
# → iterations=1 腐蚀1次，增大次数会收缩更多
cv2.imwrite('result.png', result)`,

  dilate: `# ==================== 形态学膨胀 ====================
# 功能: 对二值图像进行膨胀操作，使前景区域扩大
# 原理: 结构元素在图像上滑动，只要结构元素与前景有交集，中心像素就变为前景

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# → binary 为二值图像，255=前景(白)，0=背景(黑)

# 第2步: 创建3×3矩形结构元素（形态学操作的"探针"）
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
# → MORPH_RECT 矩形核，3×3全1矩阵

# 第3步: 执行膨胀操作（前景扩张，填充小的孔洞和间隙）
result = cv2.dilate(binary, kernel, iterations=1)
# → iterations=1 膨胀1次，增大次数会膨胀更多
cv2.imwrite('result.png', result)`,

  'open-close': `# ==================== 开闭运算对比 ====================
# 功能: 对比形态学开运算和闭运算的效果
# 原理: 开运算=先腐蚀后膨胀(去小突起); 闭运算=先膨胀后腐蚀(填小孔洞)

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# → binary 为二值图像

# 第2步: 创建5×5矩形结构元素（比腐蚀/膨胀用的3×3更大，效果更明显）
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
# → 5×5矩形核

# 第3步: 开运算 —— 先腐蚀后膨胀，去除小的突起和噪声
opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
# → 开运算保持大区域不变，去除比结构元素小的前景区域

# 第4步: 闭运算 —— 先膨胀后腐蚀，填充小的孔洞和间隙
closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
# → 闭运算保持大区域不变，填充比结构元素小的背景区域

# 第5步: 可视化对比 —— 2×2子图
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(binary, cmap='gray'); axes[0,1].set_title('二值化'); axes[0,1].axis('off')
axes[1,0].imshow(opened, cmap='gray'); axes[1,0].set_title('开运算'); axes[1,0].axis('off')
axes[1,1].imshow(closed, cmap='gray'); axes[1,1].set_title('闭运算'); axes[1,1].axis('off')
savefig(fig, 'result')
info(说明='开运算去小突起，闭运算填小孔洞')`,

  'morph-edge': `# ==================== 形态学边缘检测 ====================
# 功能: 用形态学膨胀和腐蚀的差值来提取二值图像的边缘
# 原理: 外边界=膨胀-原图(边缘外侧), 内边界=原图-腐蚀(边缘内侧)

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# → binary 为二值前景掩膜

# 第2步: 创建3×3矩形结构元素
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))

# 第3步: 提取外边界 —— 膨胀后的图像减去原图
dilated = cv2.dilate(binary, kernel)
# → 膨胀使前景向外扩展一圈
edge_outer = cv2.subtract(dilated, binary)
# → 差值就是原图外围的一圈像素，即外边界

# 第4步: 提取内边界 —— 原图减去腐蚀后的图像
eroded = cv2.erode(binary, kernel)
# → 腐蚀使前景向内收缩一圈
edge_inner = cv2.subtract(binary, eroded)
# → 差值就是原图内侧的一圈像素，即内边界

# 第5步: 可视化对比 —— 二值图、外边界、内边界
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(binary, cmap='gray'); axes[0].set_title('二值图'); axes[0].axis('off')
axes[1].imshow(edge_outer, cmap='gray'); axes[1].set_title('外边界'); axes[1].axis('off')
axes[2].imshow(edge_inner, cmap='gray'); axes[2].set_title('内边界'); axes[2].axis('off')
savefig(fig, 'result')
info(外边界像素=np.sum(edge_outer > 0), 内边界像素=np.sum(edge_inner > 0))`,

  skeleton: `# ==================== 骨架提取 ====================
# 功能: 从二值图像中提取目标的骨架（中心线），保留拓扑结构
# 原理: 方法1用距离变换的脊线近似; 方法2用Zhang-Suen迭代细化算法逐步剥离边缘像素

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
# → binary 为二值前景掩膜

# 第2步: 方法1 —— 距离变换近似骨架
dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
# → dist: 每个前景像素到最近背景像素的欧氏距离，距离越大=离边界越远
_, skeleton_approx = cv2.threshold(dist, 0.5 * dist.max(), 255, cv2.THRESH_BINARY)
# → 取距离变换值大于最大值一半的区域作为骨架近似（最"厚"的部分）
skeleton_approx = skeleton_approx.astype(np.uint8)

# 第3步: 方法2 —— Zhang-Suen细化算法（迭代去除边缘像素直到只剩单像素宽的骨架）
from skimage.morphology import skeletonize
binary_norm = (binary > 0).astype(np.uint8)
# → 转为0/1格式供skimage使用
skel = (skeletonize(binary_norm) * 255).astype(np.uint8)
# → skeletonize 返回单像素宽的骨架

# 第4步: 可视化对比 —— 二值图、距离变换骨架、Zhang-Suen骨架
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(binary, cmap='gray'); axes[0].set_title('二值图'); axes[0].axis('off')
axes[1].imshow(skeleton_approx, cmap='gray'); axes[1].set_title('距离变换骨架'); axes[1].axis('off')
axes[2].imshow(skel, cmap='gray'); axes[2].set_title('Zhang-Suen骨架'); axes[2].axis('off')
savefig(fig, 'result')
info(骨架像素=np.sum(skel > 0), 原始像素=np.sum(binary > 0))`,

  tophat: `# ==================== 顶帽与底帽变换 ====================
# 功能: 用顶帽和底帽变换分别提取图像中的亮细节和暗细节
# 原理: 顶帽=原图-开运算(提取比周围亮的小目标); 底帽=闭运算-原图(提取比周围暗的小目标)

# 第1步: 读取灰度图像
gray = imread_gray()

# 第2步: 创建大尺寸椭圆形结构元素（需要比目标大才能提取小细节）
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
# → 15×15椭圆核，比要提取的目标区域大

# 第3步: 顶帽变换 —— 提取比周围环境亮的小目标
tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
# → 顶帽 = 原图 - 开运算结果，开运算去掉了亮的小目标，差值就是这些亮细节

# 第4步: 底帽变换 —— 提取比周围环境暗的小目标
blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
# → 底帽 = 闭运算结果 - 原图，闭运算填充了暗的小目标，差值就是这些暗细节

# 第5步: 可视化 —— 2×2子图展示原图、开运算、顶帽、底帽
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(gray, cmap='gray'); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel), cmap='gray')
axes[0,1].set_title('开运算'); axes[0,1].axis('off')
axes[1,0].imshow(tophat, cmap='hot'); axes[1,0].set_title('顶帽(亮细节)'); axes[1,0].axis('off')
axes[1,1].imshow(blackhat, cmap='hot'); axes[1,1].set_title('底帽(暗细节)'); axes[1,1].axis('off')
savefig(fig, 'result')
info(顶帽均值=tophat.mean(), 底帽均值=blackhat.mean())`,

  // --- Chapter 10: 特征提取 ---
  'histogram-feature': `# ==================== 直方图统计特征提取 ====================
# 功能: 从灰度直方图计算图像的统计特征（均值、方差、偏度、峰度、熵、能量）
# 原理: 将归一化直方图视为概率分布，计算各阶统计矩和信息论指标

# 第1步: 读取灰度图像并计算归一化直方图（概率分布）
gray = imread_gray()
hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
# → hist 为256维向量，hist[i]=灰度i的像素个数
p = hist / hist.sum()
# → p 为概率分布，p[i]=灰度i出现的概率，总和=1
p_nonzero = p[p > 0]
# → 只取非零概率项，用于计算熵（log(0)无意义）

# 第2步: 计算统计特征
mean_val = np.sum(np.arange(256) * p)            # 均值（亮度）
# → 均值 = Σ(i × p(i))，反映图像整体亮度
variance = np.sum(((np.arange(256) - mean_val)**2) * p)  # 方差（对比度）
# → 方差 = Σ((i-μ)² × p(i))，反映灰度分散程度
std_val = np.sqrt(variance)
skewness = np.sum(((np.arange(256) - mean_val)**3) * p) / (std_val**3)  # 偏度
# → 偏度 > 0 表示分布右偏(亮区多)，< 0 表示左偏(暗区多)
kurtosis = np.sum(((np.arange(256) - mean_val)**4) * p) / (std_val**4)  # 峰度
# → 峰度反映分布尖锐程度，高斯分布峰度≈3
entropy = -np.sum(p_nonzero * np.log2(p_nonzero))  # 熵（信息量）
# → 熵越大说明图像信息越丰富/越复杂
energy = np.sum(p**2)  # 能量
# → 能量越大说明灰度越集中（纹理越均匀）

# 第3步: 可视化 —— 原图和直方图
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].hist(gray.ravel(), 256, [0,256], color='#6366f1'); axes[1].set_title('直方图')
plt.suptitle(f'均值={mean_val:.1f} 标准差={std_val:.1f} 熵={entropy:.2f}')
savefig(fig, 'result')
info(均值=round(mean_val,1), 标准差=round(std_val,1), 偏度=round(skewness,3),
     峰度=round(kurtosis,3), 熵=round(entropy,2), 能量=round(energy,4))`,

  glcm: `# ==================== 灰度共生矩阵(GLCM)纹理特征 ====================
# 功能: 计算灰度共生矩阵并提取纹理特征（对比度、能量、熵）
# 原理: GLCM统计相距(d,angle)的像素对的灰度共现概率，反映纹理的空间排列规律

# 第1步: 读取灰度图像并量化灰度级（减小GLCM矩阵尺寸）
gray = imread_gray()
levels = 32
# → 将256级灰度压缩为32级，GLCM矩阵从256×256变为32×32
gray_q = (gray.astype(np.float64) / 256 * levels).astype(np.int32)
# → 灰度值映射: 0~7→0, 8~15→1, ..., 248~255→31
gray_q = np.clip(gray_q, 0, levels - 1)
# → 确保灰度值在0~31范围内

# 第2步: 定义GLCM计算函数
def calc_glcm(img, d=1, angle=0):
    \\"\\"\\"计算GLCM: d=像素间距, angle=方向角度(弧度)\\"\\"\\"
    h, w = img.shape
    glcm = np.zeros((levels, levels), dtype=np.float64)
    # → glcm[i,j] = 灰度对(i,j)出现的次数
    dy = int(round(d * np.sin(angle)))
    dx = int(round(d * np.cos(angle)))
    # → (dy,dx)为方向偏移向量
    for y in range(max(0,-dy), min(h, h-dy)):
        for x in range(max(0,-dx), min(w, w-dx)):
            i, j = img[y, x], img[y+dy, x+dx]
            # → 取当前位置和偏移位置的灰度值
            glcm[i, j] += 1
            # → 统计灰度对(i,j)的共现次数
    return glcm / (glcm.sum() + 1e-10)
    # → 归一化为概率矩阵

# 第3步: 计算0度方向(水平)的GLCM
glcm = calc_glcm(gray_q, d=1, angle=0)
# → d=1 相邻像素，angle=0 水平方向

# 第4步: 从GLCM提取纹理特征
contrast = np.sum([(i-j)**2 * glcm[i,j] for i in range(levels) for j in range(levels)])
# → 对比度: 灰度差异大的像素对越多，纹理越粗糙
energy = np.sum(glcm**2)
# → 能量: GLCM元素平方和，纹理越均匀能量越大
entropy_val = -np.sum(glcm[glcm > 0] * np.log2(glcm[glcm > 0]))
# → 熵: 纹理复杂度的度量，纹理越复杂熵越大
corr_num = np.sum([(i*j) * glcm[i,j] for i in range(levels) for j in range(levels)])

# 第5步: 可视化 —— 原图和GLCM矩阵热力图
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(gray, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(glcm, cmap='hot'); axes[1].set_title('GLCM'); axes[1].axis('off')
plt.suptitle(f'对比度={contrast:.2f} 能量={energy:.4f} 熵={entropy_val:.2f}')
savefig(fig, 'result')
info(对比度=round(contrast,2), 能量=round(energy,4), 熵=round(entropy_val,2))`,

  'edge-feature': `# ==================== 边缘特征统计 ====================
# 功能: 综合检测Canny边缘和Harris角点，并统计梯度方向分布
# 原理: Harris角点通过自相关矩阵的特征值判断; 边缘密度=边缘像素/总像素

# 第1步: 读取彩色图像并转灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 第2步: Canny边缘检测
edges = cv2.Canny(gray, 50, 150)
# → edges 为二值边缘图

# 第3步: Harris角点检测
gray_f = gray.astype(np.float32)
# → Harris要求float32输入
dst = cv2.cornerHarris(gray_f, 2, 3, 0.04)
# → blockSize=2(邻域窗口), ksize=3(Sobel核), k=0.04(自由参数)
corner_mask = dst > 0.01 * dst.max()
# → 取响应值大于最大值1%的点作为角点
corner_count = np.sum(corner_mask)

# 第4步: 边缘统计
edge_density = np.sum(edges > 0) / edges.size
# → 边缘密度 = 边缘像素数/总像素数

# 第5步: 计算梯度方向直方图（仅统计边缘像素的梯度方向）
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
angles = np.arctan2(sobely, sobelx) * 180 / np.pi
# → arctan2(Gy,Gx) 得到每个像素的梯度方向角(-180°~180°)
angles = angles[edges > 0]
# → 只保留边缘像素处的梯度方向

# 第6步: 可视化 —— 叠加边缘和角点、Canny图、梯度方向分布
result = img.copy()
result[edges > 0] = [0, 255, 0]    # 绿色标注边缘
result[corner_mask] = [0, 0, 255]  # 红色标注角点
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); axes[0].set_title('边缘(绿)+角点(红)'); axes[0].axis('off')
axes[1].imshow(edges, cmap='gray'); axes[1].set_title('Canny边缘'); axes[1].axis('off')
if len(angles) > 0:
    axes[2].hist(angles, bins=36, range=(-180, 180), color='#6366f1')
    axes[2].set_title('梯度方向分布')
savefig(fig, 'result')
info(边缘密度=round(edge_density,4), 角点数=corner_count)`,

  'region-feature': `# ==================== 区域特征描述（连通域形状分析） ====================
# 功能: 检测连通域并计算面积、圆度、长宽比等形状特征，用颜色区分不同形状
# 原理: 圆度=4*pi*面积/周长^2，圆形≈1，长条形<<1

# 第1步: 读取彩色图像并做Otsu二值化（反转：暗前景变白）
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → THRESH_BINARY_INV 使暗目标变为前景(白)

# 第2步: 连通域标记与特征提取
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
# → num_labels: 连通域个数, labels: 每个像素的标签, stats: 每个区域的面积/位置等
result = img.copy()
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area < 50: continue  # 过滤面积<50的噪声区域
    x = stats[i, cv2.CC_STAT_LEFT]; y = stats[i, cv2.CC_STAT_TOP]
    w = stats[i, cv2.CC_STAT_WIDTH]; h = stats[i, cv2.CC_STAT_HEIGHT]

    # 第3步: 提取单个区域的轮廓并计算圆度
    mask = (labels == i).astype(np.uint8) * 255
    # → 创建只包含当前区域的二值掩膜
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    perimeter = cv2.arcLength(contours[0]) if contours else 1
    # → 周长 = 轮廓长度
    circularity = 4 * np.pi * area / (perimeter**2 + 1e-10)
    # → 圆度: 完美圆=1.0，长条<<1.0
    aspect_ratio = w / (h + 1e-10)
    # → 长宽比

    # 第4步: 根据圆度用不同颜色标注（绿色=圆形，橙色=非圆形）
    color = (0, 255, 0) if circularity > 0.7 else (255, 165, 0)
    cv2.rectangle(result, (x, y), (x+w, y+h), color, 2)
    cv2.putText(result, f'A={area}', (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
cv2.imwrite('result.png', result)
info(连通域数=num_labels-1, 说明='绿色=高圆度 橙色=低圆度')`,

  hough: `# ==================== Hough直线检测 ====================
# 功能: 用概率Hough变换检测图像中的直线段
# 原理: 在参数空间(ρ,θ)中投票，累加器峰值对应图像中的直线

# 第1步: 读取灰度图像并做Canny边缘检测
gray = imread_gray()
edges = cv2.Canny(gray, 50, 150)
# → edges 为Canny边缘二值图，Hough在边缘上检测直线

# 第2步: 概率Hough直线检测
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
# → rho分辨率=1像素, theta分辨率=1°, 投票阈值=50
# → minLineLength=50(最短直线), maxLineGap=10(允许的最大断点间隙)

# 第3步: 在灰度图上用红色标注检测到的直线
result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
# → 转为3通道BGR以便画彩色线
if lines is not None:
    for line in lines:
        x1, y1, x2, y2 = line[0]
        # → 每条直线由起点(x1,y1)和终点(x2,y2)定义
        cv2.line(result, (x1,y1), (x2,y2), (0,0,255), 2)
        # → 画红色直线(BGR=(0,0,255))
cv2.imwrite('result.png', result)
info(检测到直线数=len(lines) if lines is not None else 0)`,

  template: `# ==================== 模板匹配（归一化互相关） ====================
# 功能: 在搜索图像中定位模板的位置，对比不同匹配算法的效果
# 原理: 模板在图像上滑动，计算每个位置的相似度得分，极值位置即最佳匹配

# 第1步: 读取灰度图像并提取模板（图像中心区域）
img = imread_gray()
h, w = img.shape
th, tw = h//4, w//4
# → 模板尺寸为图像的1/4高和1/4宽
template = img[h//2-th//2:h//2+th//2, w//2-tw//2:w//2+tw//2]
# → 从图像中心裁剪模板区域

# 第2步: 定义多种匹配方法进行对比
methods = ['cv2.TM_SQDIFF_NORMED', 'cv2.TM_CCOEFF_NORMED', 'cv2.TM_CCORR_NORMED']
# → SQDIFF: 归一化平方差(最小值=最佳), CCOEFF: 归一化相关系数(最大值=最佳), CCORR: 归一化相关性

# 第3步: 可视化 —— 2×2子图展示搜索图、模板、两种方法的匹配结果
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(img, cmap='gray'); axes[0,0].set_title('搜索图像'); axes[0,0].axis('off')
rect = cv2.rectangle(img.copy(), (w//2-tw//2, h//2-th//2), (w//2+tw//2, h//2+th//2), 255, 2)
axes[0,0].imshow(rect, cmap='gray')
axes[0,1].imshow(template, cmap='gray'); axes[0,1].set_title('模板'); axes[0,1].axis('off')
for ax, method_name in zip([axes[1,0], axes[1,1]], methods[:2]):
    method = eval(method_name)
    result = cv2.matchTemplate(img, template, method)
    # → result 为相似度图，尺寸=(H-th+1, W-tw+1)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
    # → 找到匹配得分的极值位置
    if 'SQDIFF' in method_name:
        top_left = min_loc
        # → SQDIFF: 平方差最小处为最佳匹配
    else:
        top_left = max_loc
        # → 其他方法: 相关系数最大处为最佳匹配
    matched = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    cv2.rectangle(matched, top_left, (top_left[0]+tw, top_left[1]+th), (0,0,255), 2)
    # → 红色矩形标注匹配到的位置
    ax.imshow(cv2.cvtColor(matched, cv2.COLOR_BGR2RGB))
    ax.set_title(f'{method_name.split("_")[-1]}'); ax.axis('off')
savefig(fig, 'result')
info(模板尺寸=template.shape, 说明='TM_CCOEFF_NORMED通常效果最好')`,

  // --- Chapter 11: 综合应用 ---
  batch: `# ==================== 批量图像处理（自动化流水线） ====================
# 功能: 定义标准图像处理流水线，对输入图像依次执行灰度化→去噪→增强→分割→计数
# 原理: 将多个处理步骤串联成流水线，批量处理时每张图执行相同流程

import os

# 第1步: 读取彩色图像
img = imread_color()

# 第2步: 定义处理流水线函数
def process_pipeline(image):
    \\"\\"\\"标准处理流程：灰度化→去噪→增强→分割\\"\\"\\"
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # → 转为灰度图
    denoised = cv2.GaussianBlur(gray, (5,5), 1.0)
    # → 高斯去噪，核5×5，sigma=1.0
    enhanced = cv2.equalizeHist(denoised)
    # → 直方图均衡化增强对比度
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # → Otsu自动阈值分割
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    # → 形态学开运算去除小噪声
    num, _, stats, _ = cv2.connectedComponentsWithStats(cleaned)
    count = sum(1 for i in range(1, num) if stats[i, cv2.CC_STAT_AREA] > 30)
    # → 统计面积>30的有效目标个数
    return gray, enhanced, cleaned, count

# 第3步: 执行流水线
gray, enhanced, binary, count = process_pipeline(img)

# 第4步: 可视化 —— 2×2子图展示各步骤结果
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0,0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0,0].set_title('原图'); axes[0,0].axis('off')
axes[0,1].imshow(gray, cmap='gray'); axes[0,1].set_title('灰度化'); axes[0,1].axis('off')
axes[1,0].imshow(enhanced, cmap='gray'); axes[1,0].set_title('增强'); axes[1,0].axis('off')
axes[1,1].imshow(binary, cmap='gray'); axes[1,1].set_title(f'分割(目标={count})'); axes[1,1].axis('off')
savefig(fig, 'result')
info(检测目标数=count, 说明='批量处理对每张图执行相同流水线')`,

  weld: `# ==================== 焊缝缺陷检测 ====================
# 功能: 自动检测焊缝图像中的缺陷区域（气孔、裂纹等）
# 原理: CLAHE增强对比度→自适应阈值分割→形态学去噪→Hough直线+轮廓检测定位缺陷

# 第1步: 读取彩色图像并转灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 第2步: CLAHE增强焊缝区域局部对比度
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
# → clipLimit=3.0控制增强强度，tileGridSize=(8,8)局部区块大小
enhanced = clahe.apply(gray)
# → 增强后的图像，焊缝细节更清晰

# 第3步: 自适应阈值分割（适应不均匀光照）
binary = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY_INV, 21, 5)
# → 高斯加权自适应阈值，blockSize=21, C=5

# 第4步: 形态学开运算清理噪声
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
# → 去除小的噪声前景点

# 第5步: Hough直线检测焊缝轮廓线
edges = cv2.Canny(enhanced, 40, 120)
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=30, maxLineGap=10)
result = img.copy()
if lines is not None:
    for line in lines:
        x1,y1,x2,y2 = line[0]
        cv2.line(result, (x1,y1),(x2,y2), (0,0,255), 2)
        # → 红色直线标注焊缝轮廓

# 第6步: 标记可疑缺陷区域（面积>100的连通域）
contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for cnt in contours:
    if cv2.contourArea(cnt) > 100:
        x, y, w, h = cv2.boundingRect(cnt)
        cv2.rectangle(result, (x,y), (x+w,y+h), (0,255,0), 2)
        # → 绿色矩形标注可疑缺陷
cv2.imwrite('result.png', result)
info(检测到直线=len(lines) if lines is not None else 0, 可疑区域=len(contours))`,

  logcount: `# ==================== 原木计数系统 ====================
# 功能: 自动识别和计数堆叠原木的截面（圆形目标）
# 原理: 去噪→阈值分割→形态学填充/分离→距离变换找种子点→连通域计数

# 第1步: 读取彩色图像并转灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 第2步: 高斯去噪平滑图像
denoised = cv2.GaussianBlur(gray, (5,5), 1.5)
# → 5×5高斯核，sigma=1.5，减少噪声干扰

# 第3步: Otsu阈值分割（反转：暗目标变前景）
_, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → 原木截面通常比背景暗，用反色让原木成为前景

# 第4步: 形态学闭运算填充原木截面内部间隙
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7,7))
closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
# → 闭运算=先膨胀后腐蚀，填充原木截面内的小孔洞

# 第5步: 形态学开运算分离粘连的原木
opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel, iterations=1)
# → 开运算=先腐蚀后膨胀，断开原木间的粘连

# 第6步: 距离变换+阈值寻找每根原木的中心种子点
dist = cv2.distanceTransform(opened, cv2.DIST_L2, 5)
# → 每个前景像素到最近背景的欧氏距离，原木中心处距离最大
dist_norm = cv2.normalize(dist, None, 0, 1.0, cv2.NORM_MINMAX)
_, sure_fg = cv2.threshold(dist_norm, 0.5, 1.0, cv2.THRESH_BINARY)
# → 距离大于最大值一半的区域作为确定的前景种子
sure_fg = sure_fg.astype(np.uint8)

# 第7步: 连通域计数（每根原木的中心区域就是一个连通域）
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(sure_fg, connectivity=8)
result = img.copy()
count = 0
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 50:
        # → 过滤面积<50的噪声
        count += 1
        cx, cy = centroids[i]
        cv2.circle(result, (int(cx), int(cy)), 5, (0, 0, 255), -1)
        # → 红色圆点标注原木中心
        cv2.putText(result, str(count), (int(cx)+8, int(cy)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        # → 绿色数字标注编号
cv2.imwrite('result.png', result)
info(原木计数=count)`,

  datesort: `# ==================== 红枣缺陷分选 ====================
# 功能: 根据红枣表面缺陷面积比例进行自动分级（优等/二等/缺陷）
# 原理: HSV颜色空间分割红枣区域→灰度阈值检测缺陷→缺陷面积占比决定等级

# 第1步: 读取彩色图像并转HSV颜色空间
img = imread_color()
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# → HSV: H(色调), S(饱和度), V(亮度)

# 第2步: HSV空间分割红枣区域（红/棕色，H值在0~20和160~180两段）
mask_date = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([20, 255, 200]))
# → 红色低端: H∈[0,20], S∈[50,255], V∈[50,200]
mask_date2 = cv2.inRange(hsv, np.array([160, 50, 50]), np.array([180, 255, 200]))
# → 红色高端: H∈[160,180]（HSV色环首尾相接）
mask_fruit = cv2.bitwise_or(mask_date, mask_date2)
# → 合并两段红色范围得到完整的红枣区域掩膜

# 第3步: 灰度图缺陷检测（暗斑=缺陷）
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, defect_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → Otsu反色: 暗区域(缺陷)变为前景(白)
defect_mask = cv2.bitwise_and(defect_mask, mask_fruit)
# → 只保留红枣区域内的缺陷（排除背景干扰）

# 第4步: 形态学清理缺陷掩膜中的噪声
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
defect_mask = cv2.morphologyEx(defect_mask, cv2.MORPH_OPEN, kernel, iterations=2)

# 第5步: 连通域分析并对每颗红枣按缺陷比例分级
num, labels, stats, _ = cv2.connectedComponentsWithStats(mask_fruit, connectivity=8)
result = img.copy()
grade = {'优等': 0, '二等': 0, '缺陷': 0}
for i in range(1, num):
    area = stats[i, cv2.CC_STAT_AREA]
    if area < 100: continue
    # → 忽略面积<100的小噪点
    fruit_mask = (labels == i).astype(np.uint8) * 255
    defect_area = np.sum(cv2.bitwise_and(defect_mask, fruit_mask) > 0)
    ratio = defect_area / (area + 1e-10)
    # → 缺陷面积占红枣总面积的比例
    x, y = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP]
    w, h = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
    if ratio < 0.05:
        color = (0, 255, 0); grade['优等'] += 1
        # → 缺陷占比<5%: 优等(绿色)
    elif ratio < 0.15:
        color = (255, 165, 0); grade['二等'] += 1
        # → 缺陷占比5%~15%: 二等(橙色)
    else:
        color = (0, 0, 255); grade['缺陷'] += 1
        # → 缺陷占比>15%: 缺陷(红色)
    cv2.rectangle(result, (x, y), (x+w, y+h), color, 2)
cv2.imwrite('result.png', result)
info(分级结果=grade)`,

  panorama: `# ==================== 全景图像拼接（简化版） ====================
# 功能: 模拟两幅有重叠区域的图像的水平拼接，使用线性融合消除接缝
# 原理: 将图像裁成左右两部分模拟拍摄，水平对齐后在重叠区域用alpha混合平滑过渡

# 第1步: 读取彩色图像并模拟两幅有重叠的图像
img = imread_color()
h, w = img.shape[:2]
overlap = w // 3
# → 重叠区域宽度为图像宽度的1/3
img1 = img[:, :w-overlap]
# → 左图: 从左边到(宽-重叠)
img2 = img[:, overlap:]
# → 右图: 从重叠位置到右边

# 第2步: 创建拼接画布并放置左图
h1, w1 = img1.shape[:2]
h2, w2 = img2.shape[:2]
panorama_w = w1 + w2
# → 拼接总宽度 = 左图宽 + 右图宽
result = np.zeros((max(h1, h2), panorama_w, 3), dtype=np.uint8)
result[:h1, :w1] = img1
# → 左图放在画布左侧

# 第3步: 重叠区域线性融合（alpha从0渐变到1）
blend_width = min(w1, w2, overlap)
# → 融合宽度取三者最小值
for i in range(blend_width):
    alpha = i / blend_width
    # → alpha从0渐变到1: 左图权重递减，右图权重递增
    x1 = w1 - blend_width + i
    x2 = i
    if x2 < w2:
        result[:h1, panorama_w - w2 + x2] = (
            (1 - alpha) * img1[:h1, x1].astype(np.float64) +
            alpha * img2[:h1, x2].astype(np.float64)
        ).astype(np.uint8)
        # → 线性混合: 结果 = (1-α)×左图 + α×右图
result[:h2, panorama_w - w2 + blend_width:] = img2[:h2, blend_width:]
# → 融合区右侧直接放右图剩余部分
cv2.imwrite('result.png', result)
info(拼接宽度=panorama_w, 重叠像素=overlap, 融合宽度=blend_width)`,

  // --- Chapter 12: 目标描述与识别 ---
  'region-desc': `# ==================== 区域描述子（Hu矩 + 形状特征） ====================
# 功能: 提取最大连通域的形状描述子，包括Hu不变矩、面积、周长、圆度、矩形度
# 原理: Hu不变矩由7个几何矩组合而成，具有平移、旋转、尺度不变性，可用于形状识别

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

# 第2步: 查找轮廓并取面积最大的连通域
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours:
    cnt = max(contours, key=cv2.contourArea)
    # → 取面积最大的轮廓作为分析对象

    # 第3步: 计算Hu不变矩（7个值，具有平移/旋转/尺度不变性）
    moments = cv2.moments(cnt)
    # → moments 包含 m00(面积), m10, m01(质心) 等各阶几何矩
    hu = cv2.HuMoments(moments).flatten()
    # → hu 为7个Hu不变矩的数组

    # 第4步: 计算基本形状描述子
    area = cv2.contourArea(cnt)
    # → 轮廓围成的面积
    perimeter = cv2.arcLength(cnt)
    # → 轮廓周长
    circularity = 4 * np.pi * area / (perimeter**2 + 1e-10)
    # → 圆度: 完美圆=1.0
    x, y, w, h = cv2.boundingRect(cnt)
    # → 外接矩形的位置和尺寸
    rect_area = w * h
    extent = area / (rect_area + 1e-10)
    # → 矩形度: 面积/外接矩形面积，矩形≈1，细长形<<1
    (cx, cy), (MA, ma), angle = cv2.fitEllipse(cnt) if len(cnt) >= 5 else ((0,0),(0,0),0)
    # → 拟合椭圆: 中心(cx,cy), 长短轴(MA,ma), 旋转角angle

    # 第5步: 可视化标注
    result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(result, [cnt], -1, (0, 255, 0), 2)
    # → 绿色轮廓线
    cv2.rectangle(result, (x, y), (x+w, y+h), (0, 0, 255), 1)
    # → 红色外接矩形
    cv2.imwrite('result.png', result)
    info(面积=area, 周长=perimeter, 圆度=round(circularity,3),
         矩形度=round(extent,3), Hu矩=[round(float(h),4) for h in hu[:4]])`,

  'boundary-desc': `# ==================== 边界描述子（链码 + 傅里叶描述子） ====================
# 功能: 用8方向链码和傅里叶描述子描述目标边界形状，并演示频域重建
# 原理: 链码记录边界走向序列; 傅里叶描述子将边界坐标转为频域，低频分量描述整体形状

# 第1步: 读取灰度图像并做Otsu二值化
gray = imread_gray()
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
# → CHAIN_APPROX_NONE 保留边界上所有点（不压缩）
if contours:
    cnt = max(contours, key=cv2.contourArea).reshape(-1, 2)
    # → 取最大轮廓并展平为(N,2)坐标数组

    # 第2步: 8方向链码编码（将边界走向编码为0~7的方向序列）
    directions = {(-1,-1):0, (-1,0):1, (-1,1):2, (0,1):3, (1,1):4, (1,0):5, (1,-1):6, (0,-1):7}
    # → 8个方向: 0=左上, 1=上, 2=右上, 3=右, 4=右下, 5=下, 6=左下, 7=左
    chain_code = []
    for i in range(1, min(len(cnt), 500)):
        dy = cnt[i][1] - cnt[i-1][1]
        dx = cnt[i][0] - cnt[i-1][0]
        dy, dx = np.sign(dy), np.sign(dx)
        # → 计算相邻两点的方向偏移
        if (dy, dx) in directions:
            chain_code.append(directions[(dy, dx)])
            # → 将方向映射为0~7的链码值

    # 第3步: 傅里叶描述子（将边界坐标编码为复数序列做FFT）
    pts = cnt[:, 0] + 1j * cnt[:, 1]
    # → 复数表示: 实部=x坐标, 虚部=y坐标
    fd = np.fft.fft(pts.astype(np.float64))
    # → FFT得到频域描述子，低频=整体形状，高频=细节

    # 第4步: 用前N个低频描述子重建边界（展示频率截断效果）
    N = 10
    fd_truncated = np.zeros_like(fd)
    fd_truncated[:N] = fd[:N]
    fd_truncated[-N+1:] = fd[-N+1:]
    # → 只保留前N和后N-1个频率分量（对称性）
    reconstructed = np.fft.ifft(fd_truncated)
    # → 逆FFT重建边界坐标

    # 第5步: 可视化 —— 二值图、原始边界、FD重建边界
    fig, axes = plt.subplots(1, 3, figsize=(14, 4))
    axes[0].imshow(binary, cmap='gray'); axes[0].set_title('二值图'); axes[0].axis('off')
    axes[1].plot(cnt[:, 0], -cnt[:, 1], 'b-'); axes[1].set_title('原始边界'); axes[1].axis('equal')
    axes[2].plot(np.real(reconstructed), -np.imag(reconstructed), 'r-')
    axes[2].set_title(f'FD重建(N={N})'); axes[2].axis('equal')
    savefig(fig, 'result')
    info(链码长度=len(chain_code), 链码前20=chain_code[:20])`,

  moments: `# ==================== 图像矩分析 ====================
# 功能: 计算图像的几何矩、质心坐标和Hu不变矩，对比灰度图与二值图的矩
# 原理: m00=零阶矩(面积/总灰度), m10/m01=一阶矩→质心=m10/m00, m01/m00; Hu矩=7个不变量

# 第1步: 读取灰度图像并计算原始图像的矩
gray = imread_gray()
m = cv2.moments(gray)
# → m 包含 m00(总灰度和), m10, m01, m20, m11, m02 等各阶矩

# 第2步: 从灰度图像的矩计算质心坐标
cx = m['m10'] / (m['m00'] + 1e-10)
# → 质心x = m10/m00 (灰度加权的重心)
cy = m['m01'] / (m['m00'] + 1e-10)
# → 质心y = m01/m00

# 第3步: 二值化后计算二值图像的矩和质心
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
mb = cv2.moments(binary)
# → 二值图的矩，m00=前景面积
cx_b = mb['m10'] / (mb['m00'] + 1e-10)
cy_b = mb['m01'] / (mb['m00'] + 1e-10)
# → 二值图的质心（前景区域的几何中心）

# 第4步: 计算Hu不变矩（7个值，具有平移/旋转/尺度不变性）
hu = cv2.HuMoments(mb).flatten()
# → hu[0]~hu[6] 为7个Hu不变矩

# 第5步: 可视化 —— 在图像上标注灰度质心(G)和二值质心(B)
result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
cv2.circle(result, (int(cx), int(cy)), 8, (0, 0, 255), -1)
cv2.putText(result, 'G', (int(cx)+10, int(cy)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)
# → 红色圆点+G = 灰度质心
cv2.circle(result, (int(cx_b), int(cy_b)), 8, (0, 255, 0), -1)
cv2.putText(result, 'B', (int(cx_b)+10, int(cy_b)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
# → 绿色圆点+B = 二值质心
cv2.imwrite('result.png', result)
info(零阶矩_面积=m['m00'], 灰度质心=f'({cx:.1f},{cy:.1f})',
     二值质心=f'({cx_b:.1f},{cy_b:.1f})',
     Hu矩=[round(float(h),6) for h in hu])`,

  classify: `# ==================== 图像分类识别（最近邻分类器） ====================
# 功能: 提取图像的手工特征向量，用最小距离分类器与预设类别原型比较
# 原理: 特征向量=直方图(16维)+均值+标准差+边缘密度(19维)，与各类原型求欧氏距离取最小

# 第1步: 读取彩色图像并转灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 第2步: 定义特征提取函数
def extract_features(image_gray):
    features = []
    # 灰度直方图特征（16个bin，归一化为概率）
    hist = cv2.calcHist([image_gray], [0], None, [16], [0, 256]).ravel()
    features.extend((hist / hist.sum()).tolist())
    # → 16维直方图概率分布
    # 统计矩特征
    features.extend([image_gray.mean()/255, image_gray.std()/255])
    # → 归一化均值和标准差（2维）
    # 边缘密度特征
    edges = cv2.Canny(image_gray, 50, 150)
    features.append(np.sum(edges > 0) / edges.size)
    # → 边缘像素占比（1维）
    return np.array(features)
    # → 返回19维特征向量

# 第3步: 提取当前图像的特征向量
feat = extract_features(gray)

# 第4步: 模拟训练样本（3个类别的特征原型）
np.random.seed(42)
class_prototypes = {
    '类别A': np.random.dirichlet(np.ones(16)).tolist() + [0.4, 0.15, 0.08],
    '类别B': np.random.dirichlet(np.ones(16)).tolist() + [0.6, 0.25, 0.15],
    '类别C': np.random.dirichlet(np.ones(16)).tolist() + [0.3, 0.10, 0.05],
}
# → 每个类别原型也是19维向量，与输入特征同维

# 第5步: 最小距离分类（计算与每个类别原型的欧氏距离）
best_class, best_dist = None, float('inf')
for cls, proto in class_prototypes.items():
    dist = np.linalg.norm(feat - np.array(proto))
    # → 欧氏距离 = ||特征 - 原型||
    if dist < best_dist:
        best_dist = dist; best_class = cls
        # → 保留距离最小的类别

# 第6步: 可视化 —— 分类结果和特征向量柱状图
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title(f'分类: {best_class}'); axes[0].axis('off')
axes[1].bar(range(len(feat)), feat, color='#6366f1'); axes[1].set_title(f'特征向量(d={len(feat)})')
savefig(fig, 'result')
info(预测类别=best_class, 最小距离=round(best_dist,4))`,

  pipeline: `# ==================== 完整处理流水线 ====================
# 功能: 演示图像处理的完整6步流程：预处理→增强→分割→后处理→特征提取→决策
# 原理: 将各处理模块串联，每步输出作为下一步输入，最终实现目标检测与计数

# 第1步: 预处理 - 灰度化+高斯去噪
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
denoised = cv2.GaussianBlur(gray, (5,5), 1.0)
# → 5×5高斯核平滑去噪

# 第2步: 增强 - CLAHE自适应直方图均衡
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
enhanced = clahe.apply(denoised)
# → 增强局部对比度

# 第3步: 分割 - Otsu自动阈值
_, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → 自动找到最优分割阈值

# 第4步: 后处理 - 形态学开运算去噪
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
# → 去除小的噪声前景

# 第5步: 特征提取 - 连通域分析
num, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
# → 标记所有连通域并获取面积、位置等信息

# 第6步: 决策 - 计数与分类（按面积大小区分大小目标）
result = img.copy()
valid = 0
for i in range(1, num):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 30:
        valid += 1
        x, y = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP]
        w, h = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        color = (0, 255, 0) if area > 200 else (255, 165, 0)
        # → 面积>200标绿色(大目标)，否则标橙色(小目标)
        cv2.rectangle(result, (x, y), (x+w, y+h), color, 2)
        cv2.putText(result, str(area), (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)

# 第7步: 可视化 —— 2×3子图展示完整处理流程
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
  'case-defect-detection': `# ==================== 红枣缺陷检测流水线 ====================
# 功能: 自动检测红枣表面的缺陷区域（斑点、破损等）
# 原理: 去噪→Otsu分割→形态学去噪→连通域标记，面积>50的区域判定为缺陷

# 第1步: 读取彩色图像并转灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 第2步: 高斯去噪
denoised = cv2.GaussianBlur(gray, (5,5), 1.5)
# → 5×5高斯核，sigma=1.5

# 第3步: Otsu阈值分割（反转：暗缺陷变前景）
_, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → 缺陷通常比正常表面暗，反色后缺陷变为白色前景

# 第4步: 形态学开运算去除噪声
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
# → 两次开运算去除小的噪声点

# 第5步: 连通域标记并用红色矩形标注缺陷
num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
result = img.copy()
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 50:  # 过滤面积<50的噪声
        x, y, w, h = stats[i, cv2.CC_STAT_LEFT:cv2.CC_STAT_LEFT+4]
        cv2.rectangle(result, (x,y), (x+w,y+h), (0,0,255), 2)
        # → 红色矩形标注缺陷位置
cv2.imwrite('result.png', result)
info(检测到缺陷数=num_labels-1)`,

  'case-rice-counting': `# ==================== 综合案例: 米粒计数与分级 ====================
# 功能: 自动检测图像中的米粒数量, 并按面积大小进行分级标注
# 原理: Otsu自动阈值分割→形态学开运算分离粘连→连通域分析计数→面积阈值分级

# 第1步: 读取图像并转为灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# → gray 为单通道灰度图, 用于后续阈值分割

# 第2步: Otsu自动阈值二值化(前景为白色)
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
# → THRESH_BINARY_INV: 暗目标(米粒)变白; THRESH_OTSU: 自动寻找最佳阈值

# 第3步: 形态学开运算分离粘连米粒
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
# → 3×3椭圆核, 小核只断开细微粘连, 不损伤米粒轮廓
opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
# → 开运算(先腐蚀后膨胀): 断开粘连区域, 同时保持米粒大小基本不变

# 第4步: 连通域分析(标记每个独立区域)
num, labels, stats, _ = cv2.connectedComponentsWithStats(opened)
# → num: 连通域总数(含背景); stats: 每个区域的[x, y, w, h, area]

# 第5步: 遍历连通域, 过滤噪声并按面积分级标注
result = img.copy()
count = 0
for i in range(1, num):  # 从1开始跳过背景(0)
    area = stats[i, cv2.CC_STAT_AREA]
    if area > 100:  # 过滤噪声: 面积<100像素的视为噪点
        count += 1
        x, y, w, h = stats[i, cv2.CC_STAT_LEFT:cv2.CC_STAT_LEFT+4]
        # → 提取区域的边界框坐标(x,y)和宽高(w,h)
        color = (0,255,0) if area > 500 else (255,165,0)
        # → 面积>500: 大粒(绿色); 面积<=500: 小粒(橙色) — 实现分级
        cv2.rectangle(result, (x,y), (x+w,y+h), color, 2)
        # → 在原图上绘制边界框, 线宽2像素

# 第6步: 保存结果并输出统计
cv2.imwrite('result.png', result)
info(米粒总数=count)`,

  'case-edge-comparison': `# ==================== 综合案例: 边缘检测方法对比 ====================
# 功能: 在同一张图上对比 Sobel、Canny、Laplacian 三种边缘检测算法的效果
# 原理: Sobel=一阶梯度近似; Canny=多阶段最优边缘检测; Laplacian=二阶导数零交叉

# 第1步: 读取灰度图像
gray = imread_gray()

# 第2步: Sobel边缘检测(X和Y方向联合)
sobel = cv2.Sobel(gray, cv2.CV_64F, 1, 1, ksize=3)
# → dx=1, dy=1: 同时计算水平和垂直梯度; ksize=3: 3×3卷积核
sobel = np.clip(np.abs(sobel)/np.abs(sobel).max()*255, 0, 255).astype(np.uint8)
# → 取绝对值→归一化到[0,255]→转uint8, 便于显示

# 第3步: Canny边缘检测(双阈值+非极大值抑制)
canny = cv2.Canny(gray, 50, 150)
# → 低阈值50: 连接弱边缘; 高阈值150: 确定强边缘; 输出二值图(0或255)

# 第4步: Laplacian边缘检测(二阶导数)
lap = cv2.Laplacian(gray, cv2.CV_64F)
# → Laplacian检测灰度变化的零交叉点, 对噪声敏感
lap = np.clip(np.abs(lap)/np.abs(lap).max()*255, 0, 255).astype(np.uint8)
# → 同样归一化到[0,255]显示

# 第5步: 四图对比可视化
fig, axes = plt.subplots(1, 4, figsize=(16, 4))
for ax, im, t in zip(axes, [gray, sobel, canny, lap], ['原图', 'Sobel', 'Canny', 'Laplacian']):
    ax.imshow(im, cmap='gray'); ax.set_title(t); ax.axis('off')
    # → 原图 + 三种方法的边缘检测结果并排对比
savefig(fig, 'result')`,

  'case-compression': `# ==================== 综合案例: JPEG压缩模拟 ====================
# 功能: 模拟JPEG压缩过程, 评估不同压缩质量下的图像失真程度
# 原理: JPEG使用DCT(离散余弦变换)+量化+熵编码, quality参数控制量化表粗细

# 第1步: 读取灰度图像并设定压缩质量
img = imread_gray()
quality = 50
# → quality: 1-100, 越低压缩越强(量化越粗), 失真越大

# 第2步: 使用PIL库执行JPEG压缩(内部完成DCT+量化+编码)
from PIL import Image
pil_img = Image.fromarray(img)
# → 将numpy数组转为PIL图像对象
import io
buf = io.BytesIO()
# → 创建内存缓冲区, 模拟"保存到文件"的过程
pil_img.save(buf, format='JPEG', quality=quality)
# → JPEG编码写入缓冲区, quality控制量化强度
buf.seek(0)
# → 将读取指针回到缓冲区开头, 准备读取
compressed = np.array(Image.open(buf))
# → 从缓冲区解码JPEG, 得到有损压缩后的图像

# 第3步: 计算PSNR(峰值信噪比)评价压缩质量
mse = np.mean((img.astype(np.float64) - compressed.astype(np.float64))**2)
# → MSE(均方误差): 原图与压缩图的像素差平方的均值
psnr = 10 * np.log10(255**2 / mse) if mse > 0 else float('inf')
# → PSNR = 10×log10(最大像素值²/MSE), 单位dB, 值越大失真越小
# → 一般PSNR>30dB认为质量良好, >40dB几乎无感知差异

# 第4步: 原图与压缩图对比可视化
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.imshow(img, cmap='gray'); ax1.set_title('原图'); ax1.axis('off')
ax2.imshow(compressed, cmap='gray'); ax2.set_title(f'JPEG Q={quality}'); ax2.axis('off')
plt.suptitle(f'PSNR: {psnr:.1f} dB')
# → 标题显示PSNR数值, 直观评估压缩失真程度
savefig(fig, 'result')`,

  'case-dehaze': `# ==================== 综合案例: 暗通道先验去雾 ====================
# 功能: 基于暗通道先验(Dark Channel Prior)去除图像中的雾霾效果
# 原理: 雾天成像 I(x)=J(x)·t(x)+A·(1-t(x)), 暗通道先验估计透射率t和大气光A, 反解清晰图像J

# 第1步: 读取图像并归一化到[0,1]浮点
img = imread_color().astype(np.float64) / 255.0
# → 归一化便于后续浮点运算, 避免溢出

# 第2步: 计算暗通道(每个像素取RGB三通道的最小值)
dark = np.min(img, axis=2)
# → dark(x) = min(I_R(x), I_G(x), I_B(x))
# → 暗通道先验: 无雾图像的暗通道值趋近于0(大多数局部区域至少有一个通道值很低)

# 第3步: 估计全局大气光A(取整张图的亮值百分位)
A = np.percentile(img, 99.9)
# → 用99.9百分位近似大气光, 简化计算(精确方法应取暗通道最亮的前0.1%像素)

# 第4步: 计算透射率t(x)(雾的浓度分布)
omega = 0.95
# → omega: 保留少量雾气以保持远景自然感(0.95为经验值)
t = 1 - omega * np.min(dark / A)
# → 由暗通道先验推导: t(x) = 1 - ω × min(I(x)/A), 雾越浓t越小
t = np.maximum(t, 0.1)
# → 限制透射率下界为0.1, 避免除零和过度增强噪声

# 第5步: 根据成像模型反解清晰图像J(x)
result = np.zeros_like(img)
for c in range(3):
    result[:,:,c] = (img[:,:,c] - A) / t + A
    # → J(x) = (I(x) - A) / t(x) + A, 逐通道反解
result = np.clip(result, 0, 1)
# → 裁剪到[0,1]防止过曝或欠曝
result = (result * 255).astype(np.uint8)
# → 转回uint8用于保存

# 第6步: 保存去雾结果
result_bgr = cv2.cvtColor(result, cv2.COLOR_RGB2BGR)
# → imread_color返回BGR, 但float运算后需确认通道顺序
cv2.imwrite('result.png', result_bgr)`,

  'case-weld-inspection': `# ==================== 综合案例: 焊缝缺陷检测 ====================
# 功能: 自动检测焊缝图像中的缺陷(裂纹、气孔等), 用直线标注可疑区域
# 原理: CLAHE增强焊缝对比度→Canny边缘检测→概率Hough变换提取直线特征→红色标注

# 第1步: 读取图像并转灰度
img = imread_color()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 第2步: CLAHE自适应直方图均衡化(增强局部对比度)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
# → clipLimit=2.0: 限制对比度放大倍数, 防止噪声被过度增强
# → tileGridSize=(8,8): 将图像分成8×8的网格, 每块独立均衡化
enhanced = clahe.apply(gray)
# → enhanced: 焊缝纹理和缺陷在局部区域更清晰可见

# 第3步: Canny边缘检测
edges = cv2.Canny(enhanced, 40, 120)
# → 低阈值40: 保留更多边缘细节; 高阈值120: 确定强边缘
# → 焊缝缺陷(裂纹、气孔边界)会产生明显的边缘响应

# 第4步: 概率Hough变换检测直线(缺陷常表现为线状特征)
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=30, maxLineGap=10)
# → 距离分辨率1像素, 角度分辨率1°
# → 阈值50: 至少50个投票才认为是直线
# → minLineLength=30: 最短30像素的线段; maxLineGap=10: 允许10像素间断点连接

# 第5步: 在原图上用红色标注检测到的直线(可疑缺陷)
result = img.copy()
if lines is not None:
    for line in lines:
        x1,y1,x2,y2 = line[0]
        cv2.line(result, (x1,y1),(x2,y2), (0,0,255), 2)
        # → 红色线段标注每个检测到的直线特征

# 第6步: 保存结果并输出统计
cv2.imwrite('result.png', result)
info(检测到直线=len(lines) if lines is not None else 0)`,

  'case-skin-detection': `# ==================== 综合案例: 肤色分割(YCbCr空间) ====================
# 功能: 在YCbCr颜色空间中检测并分割人脸/皮肤区域
# 原理: YCbCr将亮度(Y)与色度(Cb,Cr)分离, 肤色在Cb/Cr平面上聚集在固定范围内

# 第1步: 读取彩色图像并转换到YCbCr颜色空间
img = imread_color()
ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
# → Y: 亮度(0-255); Cr: 红色分量(注意OpenCV中顺序为Y-Cr-Cb)
# → Cb: 蓝色分量; 肤色区域在Cr和Cb维度上有较稳定的范围

# 第2步: 设定肤色阈值范围(经验值)
lower = np.array([0, 133, 77])
# → Y>=0(不限亮度), Cr>=133, Cb>=77
upper = np.array([255, 173, 127])
# → Y<=255(不限亮度), Cr<=173, Cb<=127
# → 该范围覆盖不同光照和种族条件下的肤色

# 第3步: 阈值分割生成肤色掩膜
mask = cv2.inRange(ycrcb, lower, upper)
# → 在范围内的像素→255(白), 范围外→0(黑), 得到二值掩膜

# 第4步: 形态学后处理(清理掩膜中的噪声和空洞)
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
# → 5×5椭圆核, 适中的大小用于清理皮肤区域
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
# → 闭运算: 填充掩膜中的小空洞, 使皮肤区域更完整
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
# → 开运算: 去除孤立的小白点(噪声)

# 第5步: 用掩膜提取皮肤区域
result = cv2.bitwise_and(img, img, mask=mask)
# → 掩膜为255的位置保留原图像素, 为0的位置变为黑色

# 第6步: 三图对比可视化
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); axes[0].set_title('原图'); axes[0].axis('off')
# → BGR转RGB用于matplotlib正确显示颜色
axes[1].imshow(mask, cmap='gray'); axes[1].set_title('肤色掩膜'); axes[1].axis('off')
# → 白色区域为检测到的皮肤
axes[2].imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)); axes[2].set_title('分割结果'); axes[2].axis('off')
# → 仅保留皮肤区域, 其余变黑
savefig(fig, 'result')`,

  // --- Chapter 7: 图像压缩编码 ---
  'huffman': `# ==================== 霍夫曼编码图像压缩 ====================
# 功能: 对灰度图像进行霍夫曼编码, 计算压缩比和编码效率
# 原理: 根据像素出现频率构建最优二叉树, 高频像素分配短码, 低频像素分配长码

# 第1步: 导入工具库
import heapq
# → heapq: 最小堆, 用于构建霍夫曼树(每次取频率最小的两个节点合并)
from collections import Counter
# → Counter: 统计每个灰度值的出现次数

# 第2步: 读取灰度图并统计频率
img = imread_gray()
flat = img.flatten()
# → 将二维图像展平为一维数组, 逐像素编码
freq = Counter(flat.tolist())
# → freq: {灰度值: 出现次数}, 例如 {0: 5000, 128: 300, ...}
total = len(flat)
# → total = 高×宽, 即像素总数

# 第3步: 计算信息熵(理论最小平均码长)
entropy = -sum((f/total) * np.log2(f/total) for f in freq.values())
# → H = -Σ p(x)·log2(p(x)), 单位bit/符号
# → 熵是编码的理论下界, 任何无损编码的平均码长不可能低于熵

# 第4步: 构建霍夫曼树
heap = [[f, [sym, ""]] for sym, f in freq.items()]
# → 初始化: 每个灰度值作为一个叶子节点, [频率, [符号, 码字]]
heapq.heapify(heap)
# → 构建最小堆, 频率最小的节点在堆顶
while len(heap) > 1:
    lo = heapq.heappop(heap)   # 取出频率最小的节点
    hi = heapq.heappop(heap)   # 取出频率次小的节点
    for pair in lo[1:]:
        pair[1] = '0' + pair[1]
        # → 左子树所有叶子节点的码字前加'0'
    for pair in hi[1:]:
        pair[1] = '1' + pair[1]
        # → 右子树所有叶子节点的码字前加'1'
    heapq.heappush(heap, [lo[0] + hi[0]] + lo[1:] + hi[1:])
    # → 合并两节点为新节点(频率=两子之和), 放回堆中
codes = dict(heapq.heappop(heap)[1:])
# → 最终堆中只剩根节点, 提取所有[符号, 码字]对构建编码表

# 第5步: 对图像进行编码并统计
encoded = ''.join(codes[int(p)] for p in flat)
# → 逐像素查表拼接为0/1比特串
avg_bits = len(encoded) / total
# → 平均码长 = 编码总长度 / 像素总数 (bit/像素)
ratio = 8.0 / avg_bits
# → 压缩比 = 原始8bit / 平均码长
efficiency = entropy / avg_bits * 100
# → 编码效率 = 熵/平均码长×100%, 越接近100%越优

# 第6步: 输出编码统计信息
print(f"信息熵: {entropy:.3f} bits")
print(f"平均码长: {avg_bits:.3f} bits")
print(f"压缩比: {ratio:.2f}:1")
print(f"编码效率: {efficiency:.1f}%")
print(f"原始大小: {total * 8} bits")
print(f"压缩大小: {len(encoded)} bits")

# 第7步: 可视化(原图 + 灰度直方图)
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].bar(range(256), [freq.get(i,0) for i in range(256)], width=1, color='#6366f1')
# → 绘制256级灰度直方图, 显示每个灰度值的像素数量
axes[1].set_title(f'灰度直方图 (共{len(freq)}个灰度级)')
plt.suptitle(f'霍夫曼编码 | 压缩比: {ratio:.2f}:1 | 效率: {efficiency:.1f}%')
savefig(fig, 'result')`,

  'shannon-fano': `# ==================== 费诺(Shannon-Fano)编码图像压缩 ====================
# 功能: 对灰度图像进行Shannon-Fano编码, 与霍夫曼编码对比压缩效率
# 原理: 按频率降序排列符号, 递归二分为两组使频率和尽量相等, 左组赋0右组赋1

# 第1步: 导入工具库并统计频率
from collections import Counter

img = imread_gray()
flat = img.flatten()
freq = Counter(flat.tolist())
# → freq: {灰度值: 出现次数}
total = len(flat)

# 第2步: 按频率降序排列符号(费诺编码的前提条件)
sorted_syms = sorted(freq.keys(), key=lambda s: freq[s], reverse=True)
# → 高频符号排在前面, 递归二分时高频符号优先获得短码

# 第3步: 递归费诺编码(自顶向下构建编码树)
codes = {}
def fano_split(syms, prefix):
    """递归将符号列表二分, 使两组频率和尽量相等"""
    if len(syms) <= 1:
        if syms:
            codes[syms[0]] = prefix or '0'
            # → 只剩一个符号时, 分配当前累积的前缀码
        return
    s = sum(freq[s] for s in syms)
    # → s: 当前子列表所有符号的频率总和
    running, best_k, best_diff = 0, 0, float('inf')
    for k in range(len(syms) - 1):
        running += freq[syms[k]]
        # → running: 前k+1个符号的累积频率
        diff = abs(2 * running - s)
        # → diff: 两组频率差的绝对值(越小分组越均匀)
        if diff < best_diff:
            best_diff = diff
            best_k = k
            # → 记录最佳分割点k, 使左右两组频率最接近
    fano_split(syms[:best_k+1], prefix + '0')
    # → 左组: 前缀加'0', 继续递归
    fano_split(syms[best_k+1:], prefix + '1')
    # → 右组: 前缀加'1', 继续递归

fano_split(sorted_syms, '')
# → 从完整符号列表开始递归, 初始前缀为空

# 第4步: 编码并计算统计指标
encoded = ''.join(codes[int(p)] for p in flat)
# → 逐像素查表拼接为0/1比特串
avg_bits = len(encoded) / total
# → 平均码长 (bit/像素)
entropy = -sum((f/total) * np.log2(f/total) for f in freq.values())
# → 信息熵(理论下界)
ratio = 8.0 / avg_bits
# → 压缩比 = 8bit / 平均码长

# 第5步: 输出编码统计
print(f"信息熵: {entropy:.3f} bits")
print(f"费诺平均码长: {avg_bits:.3f} bits")
print(f"压缩比: {ratio:.2f}:1")
print(f"编码效率: {entropy/avg_bits*100:.1f}%")
# → 费诺编码效率通常略低于霍夫曼编码(非最优但接近)

# 第6步: 可视化
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].bar(range(256), [freq.get(i,0) for i in range(256)], width=1, color='#f59e0b')
# → 橙色直方图显示灰度分布
axes[1].set_title(f'灰度直方图 (共{len(freq)}个灰度级)')
plt.suptitle(f'费诺编码 | 压缩比: {ratio:.2f}:1 | 效率: {entropy/avg_bits*100:.1f}%')
savefig(fig, 'result')`,

  'rle': `# ==================== 游程编码(RLE)图像压缩 ====================
# 功能: 对灰度图像进行游程编码压缩, 并解码验证无损重建
# 原理: 连续相同像素用(像素值, 连续次数)二元组表示, 连续越长压缩效果越好

# 第1步: 读取灰度图并展平
img = imread_gray()
h, w = img.shape
# → h: 图像高度, w: 图像宽度
flat = img.flatten()
# → 将二维图像按行扫描顺序展平为一维数组

# 第2步: 水平扫描游程编码
runs = []
# → runs: 存储编码结果, 每个元素为(像素值, 连续次数)
current, count = int(flat[0]), 1
# → 初始化: 第一个像素值及其计数
for i in range(1, len(flat)):
    if int(flat[i]) == current:
        count += 1
        # → 与当前值相同, 计数+1
    else:
        runs.append((current, count))
        # → 像素值变化, 保存当前游程
        current, count = int(flat[i]), 1
        # → 开始新的一段游程
runs.append((current, count))
# → 保存最后一段游程(循环结束后遗漏的)

# 第3步: 解码验证(无损重建)
decoded = []
for val, cnt in runs:
    decoded.extend([val] * cnt)
    # → 将(值, 次数)展开为cnt个重复像素
decoded = np.array(decoded, dtype=np.uint8).reshape(h, w)
# → 重建为与原图相同尺寸的二维图像

# 第4步: 统计压缩指标
total_pixels = h * w
# → 原始像素总数
ratio = total_pixels / (len(runs) * 2)
# → 压缩比 = 原始像素数 / 编码对数×2 (每对存储值和次数各1个字节)
max_run = max(r[1] for r in runs)
# → 最长游程: 连续相同像素的最大数量
avg_run = total_pixels / len(runs)
# → 平均游程长度: 越大说明图像越平滑, 压缩效果越好

# 第5步: 输出统计信息
print(f"像素总数: {total_pixels}")
print(f"游程总数: {len(runs)}")
print(f"压缩比: {ratio:.2f}:1")
print(f"最长游程: {max_run}")
print(f"平均游程: {avg_run:.1f}")

# 第6步: 可视化(原图 + 重建图 + 游程长度分布)
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
axes[0].imshow(img, cmap='gray'); axes[0].set_title('原图'); axes[0].axis('off')
axes[1].imshow(decoded, cmap='gray'); axes[1].set_title('解码重建(无损)'); axes[1].axis('off')
# → RLE是无损编码, 解码图应与原图完全一致
axes[2].bar(range(min(50, len(runs))), [r[1] for r in runs[:50]], color='#10b981')
# → 显示前50个游程的长度分布(绿色柱状图)
axes[2].set_title('前50个游程长度')
plt.suptitle(f'游程编码 | 压缩比: {ratio:.2f}:1 | 游程数: {len(runs)}')
savefig(fig, 'result')`,

  'bitplane': `# ==================== 位平面分解与编码 ====================
# 功能: 将灰度图像分解为8个位平面, 分析各位的信息贡献, 并用高位重建图像
# 原理: 每个像素8bit可拆分为8个二值平面(位平面0=最低位, 位平面7=最高位), 高位包含主要视觉信息

# 第1步: 读取灰度图
img = imread_gray()
h, w = img.shape

# 第2步: 提取8个自然二进制位平面
planes = []
for bit in range(8):
    plane = (img >> bit) & 1
    # → 右移bit位后与1做按位与, 提取第bit位的值(0或1)
    planes.append(plane)
    # → planes[0]: 最低位(LSB), planes[7]: 最高位(MSB)

# 第3步: 格雷码位平面(相邻码只差1位, 更适合图像编码)
gray_coded = img ^ (img >> 1)
# → 自然二进制转格雷码: G = B XOR (B>>1), 相邻值仅1位不同
gray_planes = [(gray_coded >> bit) & 1 for bit in range(8)]
# → 对格雷码图像同样提取8个位平面

# 第4步: 统计各位平面的信息分布
for bit in range(7, -1, -1):
    ones_pct = planes[bit].mean() * 100
    # → 该位平面中值为1的像素占比(%)
    print(f"位平面 {bit}: 1的比例={ones_pct:.1f}%, 信息贡献={(2**bit)/255*100:.1f}%")
    # → 信息贡献: 该位能表示的最大值(2^bit)占满量程(255)的百分比
    # → 位平面7贡献50.2%, 位平面0仅贡献0.4%

# 第5步: 仅用高4位(位平面4-7)重建图像
recon = sum(planes[bit].astype(np.uint8) << bit for bit in range(4, 8))
# → 将位平面4~7按位权叠加, 丢弃低4位(位平面0~3)
# → 重建图像只有16个灰度级(2^4), 但保留主要视觉结构
mse = np.mean((img.astype(float) - recon.astype(float))**2)
# → 计算重建误差(均方误差)
psnr = 10 * np.log10(255**2 / (mse + 1e-10))
# → 计算PSNR评估重建质量, +1e-10防止除零

# 第6步: 可视化(3行×4列)
fig, axes = plt.subplots(3, 4, figsize=(14, 10))
# 第1行: 8个自然二进制位平面(从高位到低位)
for i in range(8):
    axes[0, i % 4].imshow(planes[7-i], cmap='gray')
    axes[0, i % 4].set_title(f'位平面 {7-i}')
    axes[0, i % 4].axis('off')
    # → 高位平面结构清晰(含主要图像信息), 低位平面接近随机噪声
# 第2行: 8个格雷码位平面
for i in range(8):
    axes[1, i % 4].imshow(gray_planes[7-i], cmap='gray')
    axes[1, i % 4].set_title(f'格雷码 {7-i}')
    axes[1, i % 4].axis('off')
    # → 格雷码位平面相邻平面间变化更平滑
# 第3行: 原图 + 高4位重建图
axes[2, 0].imshow(img, cmap='gray'); axes[2, 0].set_title('原图'); axes[2, 0].axis('off')
axes[2, 1].imshow(recon, cmap='gray'); axes[2, 1].set_title('高4位重建'); axes[2, 1].axis('off')
# → 高4位重建: 仅用50%的位数据恢复约94%的视觉质量
axes[2, 2].axis('off')
axes[2, 3].axis('off')
plt.suptitle(f'位平面分解 | 高4位重建 PSNR={psnr:.1f}dB')
plt.tight_layout()
savefig(fig, 'result')`,
};

// ===================== OCTAVE TEMPLATES =====================
const OC = {
  // --- Chapter 1: 概述 ---
  gray: `% ==================== 图像灰度化 ====================
% 功能: 将彩色(RGB)图像转换为灰度图像
% 原理: Gray = 0.299×R + 0.587×G + 0.114×B (加权平均)

% 第1步: 读取输入图像
img = imread(INPUT_IMAGE);
% → img 为三维矩阵 size=(高, 宽, 3) 如果是彩色图, 或二维矩阵如果是灰度图

% 第2步: 判断是否为彩色图像, 是则转换为灰度
if size(img, 3) == 3; gray = rgb2gray(img); else; gray = img; end
% → size(img,3)==3 表示有RGB三个通道; rgb2gray 执行加权平均得到灰度图
% → gray 变成二维矩阵 size=(高, 宽), 像素值范围 0~255

% 第3步: 保存灰度图像到 result.png (平台自动显示)
imwrite(gray, 'result.png');

% 第4步: 输出灰度化完成信息及尺寸
disp(['灰度化完成, 尺寸: ' mat2str(size(gray))]);
% → mat2str(size(gray)) 将矩阵尺寸转为字符串显示`,

  'channel-split': `% ==================== RGB通道分离 ====================
% 功能: 将彩色图像分解为红(R)、绿(G)、蓝(B)三个单通道
% 原理: RGB图像第三维有3个切片, 分别对应R/G/B分量

% 第1步: 读取输入彩色图像
img = imread(INPUT_IMAGE);
% → img 为三维矩阵 size=(高, 宽, 3)

% 第2步: 分别提取R、G、B三个通道
r = img(:,:,1); g = img(:,:,2); b = img(:,:,3);
% → r = img(:,:,1) 取第1个通道 → 红色分量, size=(高, 宽)
% → g = img(:,:,2) 取第2个通道 → 绿色分量, size=(高, 宽)
% → b = img(:,:,3) 取第3个通道 → 蓝色分量, size=(高, 宽)

% 第3步: 分别保存三个通道为灰度图像
imwrite(r, 'result1.png'); imwrite(g, 'result2.png'); imwrite(b, 'result3.png');
% → 每个通道以灰度图显示, 亮度越高表示该颜色分量越强

% 第4步: 输出完成信息
disp('通道分离完成: R/G/B 三个通道已保存');`,

  histogram: `% ==================== 灰度直方图 ====================
% 功能: 统计并显示图像灰度值的分布情况
% 原理: 直方图横轴为灰度值(0~255), 纵轴为该灰度值出现的像素个数

% 第1步: 读取输入图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img, 3) == 3; gray = rgb2gray(img); else; gray = img; end
% → gray 为二维灰度矩阵, 像素值范围 0~255

% 第2步: 保存灰度图像
imwrite(gray, 'result1.png');

% 第3步: 绘制灰度直方图
h = figure('visible','off'); hist(double(gray(:)), 0:255);
% → gray(:) 将矩阵展开为列向量; double() 转为浮点以满足hist要求
% → hist(..., 0:255) 统计每个灰度级(0~255)的像素数量
title('灰度直方图'); xlabel('灰度值'); ylabel('像素数');

% 第4步: 将直方图保存为图片并关闭图形窗口
print(h, 'result2.png', '-dpng'); close(h);
% → print 将当前figure导出为PNG文件; close(h) 释放图形资源`,

  noise: `% ==================== 噪声添加 ====================
% 功能: 向图像添加高斯噪声和椒盐噪声, 模拟实际成像干扰
% 原理: 高斯噪声服从正态分布; 椒盐噪声随机将像素置为0(黑)或255(白)

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为灰度图, uint8类型, 像素值 0~255

% 第2步: 转换为double以便浮点运算
g = double(gray);
% → g 为浮点矩阵, 便于后续加法运算不溢出

% 第3步: 添加高斯噪声 (均值0, 标准差15)
gauss = randn(size(g)) * 15;
% → randn 生成与g同尺寸的标准正态随机数, 乘以15调整噪声强度
noisy_g = uint8(max(0, min(255, g + gauss)));
% → g + gauss 叠加噪声; min(255,...) 截断上限; max(0,...) 截断下限

% 第4步: 添加椒盐噪声 (2%像素被污染)
noisy_sp = g;
n = round(0.02 * numel(g));
% → numel(g) 为总像素数; n = 2%的像素个数
idx = randperm(numel(g), n);
% → randperm 随机选取n个像素位置
noisy_sp(idx(1:round(n/2))) = 0;
% → 前半部分污染像素设为0 (椒噪声, 黑色)
noisy_sp(idx(round(n/2)+1:end)) = 255;
% → 后半部分污染像素设为255 (盐噪声, 白色)
noisy_sp = uint8(noisy_sp);

% 第5步: 保存三张对比图: 原图 / 高斯噪声 / 椒盐噪声
imwrite(gray, 'result1.png'); imwrite(noisy_g, 'result2.png'); imwrite(noisy_sp, 'result3.png');
disp('噪声添加完成: 原图/高斯噪声/椒盐噪声');`,

  // --- Chapter 2: 基础运算 ---
  translate: `% ==================== 图像平移 ====================
% 功能: 将图像在水平和垂直方向上进行平移
% 原理: 通过平移向量 [dx, dy] 改变像素坐标位置

% 第1步: 读取输入图像并获取尺寸
img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);
% → h=图像高度, w=图像宽度, ~忽略通道数

% 第2步: 定义平移矩阵 (x方向+50像素, y方向+30像素)
M = [1 0 50; 0 1 30];
% → M 为2×3仿射矩阵, [1 0 dx; 0 1 dy] 表示纯平移

% 第3步: 使用 imtranslate 执行平移操作
result = imtranslate(img, [50, 30]);
% → imtranslate 按 [dx=50, dy=30] 平移图像, 移出部分填充黑色

% 第4步: 保存平移后的图像
imwrite(result, 'result.png');
disp('图像平移完成: dx=50, dy=30');`,

  rotate: `% ==================== 图像旋转 ====================
% 功能: 将图像绕中心旋转指定角度
% 原理: 通过旋转变换矩阵对像素坐标进行仿射变换, 插值填充

% 第1步: 读取输入图像
img = imread(INPUT_IMAGE);

% 第2步: 旋转45度, 使用双三次插值, 裁剪到原始尺寸
result = imrotate(img, 45, 'bicubic', 'crop');
% → imrotate(图像, 角度, 插值方法, 输出模式)
% → 45: 逆时针旋转45度; 'bicubic': 双三次插值(效果最好)
% → 'crop': 裁剪输出保持与原图相同尺寸(另一选项'loose'保留全图)

% 第3步: 保存旋转后的图像
imwrite(result, 'result.png');
disp('图像旋转完成: 角度=45度');`,

  flip: `% ==================== 图像翻转 ====================
% 功能: 对图像进行水平和垂直方向的镜像翻转
% 原理: fliplr 左右翻转(沿纵轴对称), flipud 上下翻转(沿横轴对称)

% 第1步: 读取输入图像
img = imread(INPUT_IMAGE);

% 第2步: 执行两种翻转操作
h_flip = fliplr(img);   % 水平翻转(左右镜像)
% → fliplr 将矩阵列顺序反转, 相当于沿垂直中轴线对称
v_flip = flipud(img);   % 垂直翻转(上下镜像)
% → flipud 将矩阵行顺序反转, 相当于沿水平中轴线对称

% 第3步: 保存三张对比图: 原图 / 水平翻转 / 垂直翻转
imwrite(img, 'result1.png'); imwrite(h_flip, 'result2.png'); imwrite(v_flip, 'result3.png');
disp('翻转完成: 原图/水平翻转/垂直翻转');`,

  affine: `% ==================== 仿射变换(剪切) ====================
% 功能: 通过三组对应点计算仿射变换矩阵并执行变换
% 原理: 仿射变换保持直线和平行性, 可实现平移、旋转、缩放、剪切

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);
% → h=高, w=宽

% 第2步: 定义源点和目标点 (三组对应点确定仿射矩阵)
src_pts = [0 0; w 0; 0 h];
% → 源点: 左上角(0,0)、右上角(w,0)、左下角(0,h)
dst_pts = [round(w*0.1) 0; w 0; 0 h];
% → 目标点: 左上角右移10% → 产生剪切效果

% 第3步: 计算仿射变换矩阵
T = cp2tform(src_pts, dst_pts, 'affine');
% → cp2tform 根据控制点拟合 'affine' 变换, 返回变换结构体T

% 第4步: 执行仿射变换并保持输出尺寸不变
result = imtransform(img, T, 'Size', [h w]);
% → imtransform 按变换T对图像进行重采样, 'Size'指定输出尺寸

% 第5步: 保存结果
imwrite(result, 'result.png');
disp('仿射变换(剪切)完成');`,

  projection: `% ==================== 投影变换 ====================
% 功能: 通过四组对应点计算投影变换(透视变换), 模拟视角变化
% 原理: 投影变换不保持平行性, 可模拟从不同角度观察的效果

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
[h, w, ~] = size(img);

% 第2步: 定义四组对应点 (投影变换需要4个点)
src_pts = [50 50; w-50 50; 50 h-50; w-50 h-50];
% → 源点: 图像内部一个矩形的四个角点 (内缩50像素)
dst_pts = [0 0; w 0; 0 h; w h];
% → 目标点: 映射到整个图像四角 → 将内部区域拉伸填满全图

% 第3步: 计算投影变换矩阵
T = cp2tform(src_pts, dst_pts, 'projective');
% → cp2tform 拟合 'projective' 变换(8自由度), 返回结构体T

% 第4步: 执行投影变换
result = imtransform(img, T, 'Size', [h w]);
% → imtransform 按投影变换重采样图像

% 第5步: 保存结果
imwrite(result, 'result.png');
disp('投影变换完成');`,

  // --- Chapter 3: 基本运算 ---
  invert: `% ==================== 图像反色(负片) ====================
% 功能: 将灰度图像进行反色处理(类似胶片负片效果)
% 原理: 新像素值 = 255 - 原像素值, 黑变白、白变黑

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为灰度图, uint8类型, 像素值 0~255

% 第2步: 逐像素反色
result = 255 - gray;
% → 每个像素值取反: 0→255, 255→0, 128→127

% 第3步: 保存反色图像
imwrite(result, 'result.png');

% 第4步: 输出反色前后的均值对比
disp(['反色完成, 原图均值: ' num2str(mean(gray(:))) ' 反色均值: ' num2str(mean(result(:)))]);
% → mean(gray(:)) 计算整幅图像的平均灰度; 反色后均值约等于 255-原均值`,

  gamma: `% ==================== 伽马校正 ====================
% 功能: 通过幂律变换调整图像亮度
% 原理: s = c × r^gamma, gamma<1 提亮暗区, gamma>1 压暗亮区

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 归一化到 [0, 1] 范围
g = double(gray) / 255.0;
% → 转为double并除以255, 使像素值变为 0.0~1.0 的浮点数

% 第3步: 设置伽马值并执行幂律变换
gamma_val = 0.5;  % < 1 提亮, > 1 压暗
% → gamma=0.5 时暗区被拉伸变亮, 亮区被压缩
corrected = uint8(g .^ gamma_val * 255);
% → g.^0.5 对每个像素取平方根(因为0<g<1, 开方后值变大→整体提亮)
% → 乘以255恢复 0~255 范围, uint8 截断

% 第4步: 保存结果
imwrite(corrected, 'result.png');
disp(['伽马校正完成, gamma=' num2str(gamma_val)]);`,

  'contrast-stretch': `% ==================== 对比度拉伸 ====================
% 功能: 将图像灰度范围线性拉伸到 [0, 255] 全范围
% 原理: s = (r - rmin) / (rmax - rmin) × 255, 增强对比度

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 转换为double以便浮点运算
g = double(gray);

% 第3步: 获取当前灰度的最小值和最大值
min_val = min(g(:)); max_val = max(g(:));
% → g(:) 展开为列向量; min/max 获取全局最小/最大像素值

% 第4步: 线性拉伸到 [0, 255]
result = uint8((g - min_val) / (max_val - min_val) * 255);
% → 减去最小值归零 → 除以范围归一化到[0,1] → 乘以255映射到全范围

% 第5步: 保存并输出原始灰度范围
imwrite(result, 'result.png');
disp(['对比度拉伸完成, 原范围: [' num2str(min_val) ',' num2str(max_val) '] -> [0,255]']);`,

  threshold: `% ==================== Otsu阈值分割 ====================
% 功能: 使用Otsu方法自动计算最优阈值, 将图像二值化
% 原理: Otsu法最大化类间方差, 自动找到前景和背景的最佳分界

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end

% 第2步: 使用Otsu方法自动计算阈值
T = graythresh(gray);
% → graythresh 返回归一化阈值 T ∈ [0, 1], 自动选取使类间方差最大的值

% 第3步: 根据阈值将图像二值化
binary = imbinarize(gray, T);
% → imbinarize: 像素>T → 1(白色前景), 像素≤T → 0(黑色背景)

% 第4步: 保存并输出阈值
imwrite(binary, 'result.png');
disp(['Otsu阈值: ' num2str(T)]);
% → 显示Otsu计算得到的归一化阈值`,

  quantize: `% ==================== 灰度量化 ====================
% 功能: 将图像灰度级别从256级减少到指定级别数
% 原理: 将连续的灰度值区间划分为等宽的若干段, 每段映射到同一个值

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 设置量化级别数
levels = 8;
% → 将256级灰度量化为8级 (每级间隔 = 256/8 = 32)

% 第3步: 执行量化操作
quantized = floor(double(gray) / (256/levels)) * (256/levels);
% → 除以(256/levels)=32 得到所属区间编号; floor 取整; 乘回32得到该区间的代表值
% → 例: 像素值100 → floor(100/32)*32 = 3*32 = 96
quantized = uint8(quantized);
% → 转回uint8类型以供图像显示

% 第4步: 保存并输出量化信息
imwrite(quantized, 'result.png');
disp(['量化完成, 级别: ' num2str(levels) ' 实际灰度数: ' num2str(length(unique(quantized(:))))]);
% → unique(quantized(:)) 获取去重后的灰度值集合, length 计算实际存在的灰度级数`,

  // --- Chapter 4: 空间域增强 ---
  smooth: `% ==================== 平滑滤波对比 ====================
% 功能: 对比均值滤波、中值滤波、高斯滤波三种平滑方法
% 原理: 用邻域内像素的统计值替换中心像素, 消除噪声和细节

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 均值滤波 (5×5邻域取平均)
mean_filt = imfilter(double(gray), fspecial('average', [5 5]));
% → fspecial('average',[5 5]) 生成5×5均值核(每个元素=1/25)
% → imfilter 用该核对图像卷积, 每个像素变为邻域平均值

% 第3步: 中值滤波 (5×5邻域取中值)
med_filt = medfilt2(gray, [5 5]);
% → medfilt2 对每个像素的5×5邻域排序取中值, 对椒盐噪声效果好

% 第4步: 高斯滤波 (5×5核, sigma=1.0)
gauss_filt = imfilter(double(gray), fspecial('gaussian', [5 5], 1.0));
% → fspecial('gaussian',[5 5],1.0) 生成高斯加权核, sigma=1.0控制平滑程度
% → 距中心越远的像素权重越小, 保留更多边缘信息

% 第5步: 保存四张对比图: 原图 / 均值 / 中值 / 高斯
imwrite(gray, 'result1.png');
imwrite(uint8(mean_filt), 'result2.png');
imwrite(med_filt, 'result3.png');
imwrite(uint8(gauss_filt), 'result4.png');
disp('平滑滤波对比: 原图/均值/中值/高斯');`,

  sharpen: `% ==================== 图像锐化 ====================
% 功能: 使用拉普拉斯算子和USM(非锐化掩模)两种方法增强图像边缘
% 原理: 锐化 = 增强高频分量(边缘/细节), 使图像更清晰

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
g = double(gray);
% → g 为浮点灰度矩阵, 便于卷积运算

% 第2步: 拉普拉斯锐化
lap_kern = [0 -1 0; -1 5 -1; 0 -1 0];
% → 3×3拉普拉斯锐化核, 中心5为正, 四周-1检测边缘
lap_sharp = imfilter(g, lap_kern);
% → imfilter 卷积: 边缘处响应大(正值), 平坦区接近原值

% 第3步: USM(非锐化掩模)锐化: 原图×1.5 - 模糊×0.5
blurred = imfilter(g, fspecial('gaussian', [5 5], 3));
% → fspecial('gaussian',[5 5],3) 生成高斯模糊核, sigma=3 模糊程度较大
usm_sharp = g * 1.5 - blurred * 0.5;
% → USM公式: 增强原图(×1.5)减去模糊成分(×0.5), 等效于加回高频细节

% 第4步: 保存三张对比图: 原图 / 拉普拉斯锐化 / USM锐化
imwrite(gray, 'result1.png');
imwrite(uint8(max(0, min(255, lap_sharp))), 'result2.png');
% → max(0, min(255,...)) 截断到 [0,255] 范围
imwrite(uint8(max(0, min(255, usm_sharp))), 'result3.png');
disp('锐化完成: 原图/拉普拉斯/USM');`,

  denoise: `% ==================== 图像去噪 ====================
% 功能: 先添加椒盐噪声, 再用中值滤波去除噪声
% 原理: 中值滤波取邻域中值, 能有效消除椒盐类脉冲噪声

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 添加5%的椒盐噪声
noisy = imnoise(gray, 'salt & pepper', 0.05);
% → imnoise: 随机将5%的像素置为0(椒)或255(盐)

% 第3步: 使用5×5中值滤波去噪
denoised = medfilt2(noisy, [5 5]);
% → medfilt2 对每个像素取5×5邻域的中值, 噪声点(极值)被周围正常值替代

% 第4步: 保存三张对比图: 原图 / 加噪 / 去噪
imwrite(gray, 'result1.png');
imwrite(noisy, 'result2.png');
imwrite(denoised, 'result3.png');
disp('去噪完成: 原图/加噪/中值去噪');`,

  gradient: `% ==================== Sobel梯度计算 ====================
% 功能: 使用Sobel算子计算图像梯度幅度, 检测边缘
% 原理: 梯度幅度 = sqrt(Gx^2 + Gy^2), 梯度大处为边缘

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% → gray 为浮点灰度矩阵, 便于卷积计算

% 第2步: 构建Sobel算子
hx = fspecial('sobel'); hy = hx';
% → fspecial('sobel') 生成水平Sobel核(检测垂直边缘)
% → hx' 转置得到垂直Sobel核(检测水平边缘)

% 第3步: 分别计算水平和垂直方向梯度
gx = imfilter(gray, hx);
% → gx: 水平方向梯度(反映垂直边缘强度)
gy = imfilter(gray, hy);
% → gy: 垂直方向梯度(反映水平边缘强度)

% 第4步: 计算梯度幅度(边缘强度图)
mag = sqrt(gx.^2 + gy.^2);
% → 逐像素计算梯度模长: sqrt(Gx^2 + Gy^2)
mag = mat2gray(mag);
% → mat2gray 将梯度幅度归一化到 [0, 1] 范围便于显示

% 第5步: 保存梯度图并输出统计信息
imwrite(mag, 'result.png');
disp(['梯度计算完成, 均值: ' num2str(mean(mag(:))) ' 最大值: ' num2str(max(mag(:)))]);
% → mean(mag(:)) 平均梯度(整体边缘强度); max(mag(:)) 最强边缘`,

  directional: `% ==================== 方向滤波 ====================
% 功能: 使用4个方向卷积核分别检测水平、垂直、45度、135度边缘
% 原理: 不同方向的Kirsch类算子对特定方向边缘响应最强

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 定义4个方向检测卷积核
k_h = [-1 -1 -1; 2 2 2; -1 -1 -1];   % 水平方向核 (检测水平边缘)
% → 中间行权重+2, 上下行权重-1, 水平边缘处响应大
k_v = [-1 2 -1; -1 2 -1; -1 2 -1];   % 垂直方向核 (检测垂直边缘)
% → 中间列权重+2, 左右列权重-1
k_d1 = [2 -1 -1; -1 2 -1; -1 -1 2];  % 45度方向核 (检测45度对角线)
% → 主对角线权重+2, 其余-1
k_d2 = [-1 -1 2; -1 2 -1; 2 -1 -1];  % 135度方向核 (检测135度对角线)
% → 副对角线权重+2, 其余-1

% 第3步: 分别对四个方向卷积并取绝对值, 归一化
r_h = mat2gray(abs(imfilter(gray, k_h)));
% → abs 取绝对值; mat2gray 归一化到 [0,1]
r_v = mat2gray(abs(imfilter(gray, k_v)));
r_d1 = mat2gray(abs(imfilter(gray, k_d1)));
r_d2 = mat2gray(abs(imfilter(gray, k_d2)));

% 第4步: 保存四张方向检测结果
imwrite(r_h, 'result1.png'); imwrite(r_v, 'result2.png');
imwrite(r_d1, 'result3.png'); imwrite(r_d2, 'result4.png');
disp('方向滤波完成: 水平/垂直/45度/135度');`,

  emboss: `% ==================== 浮雕效果 ====================
% 功能: 使用方向导数核产生浮雕(emboss)立体效果
% 原理: 方向导数核检测梯度 + 偏移128灰, 使边缘呈现凸起感

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 定义浮雕卷积核
k = [-2 -1 0; -1 1 1; 0 1 2];
% → 核元素之和=0(边缘检测) + 中心1(保留原图), 从左上到右下递增
% → 左上方向暗、右下方向亮 → 产生浮雕凸起效果

% 第3步: 卷积并偏移灰度基线
result = imfilter(gray, k) + 128;
% → imfilter 执行卷积; +128 将零响应从0移到128(中灰), 使边缘两侧一明一暗
result = uint8(max(0, min(255, result)));
% → 截断到 [0,255] 并转为uint8

% 第4步: 保存浮雕效果图像
imwrite(result, 'result.png');
disp('浮雕效果完成');`,

  // --- Chapter 5: 频率域 ---
  fft: `% ==================== 二维傅里叶变换(频谱分析) ====================
% 功能: 将图像从空间域变换到频率域, 显示幅度谱和相位谱
% 原理: FFT将图像分解为不同频率的正弦波叠加, 低频=平坦区, 高频=边缘

% 第1步: 读取图像并转为灰度浮点
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 执行二维FFT并中心化频谱
F = fftshift(fft2(gray));
% → fft2 计算二维离散傅里叶变换, 得到复数频域矩阵
% → fftshift 将零频分量从角落移到中心, 便于观察

% 第3步: 计算幅度谱(对数压缩动态范围)
mag = log1p(abs(F));
% → abs(F) 取复数模(幅度); log1p=log(1+x) 压缩大动态范围
mag_norm = mat2gray(mag);
% → mat2gray 归一化到 [0,1] 用于显示

% 第4步: 计算相位谱
phase = angle(F);
% → angle 提取复数的相位角, 范围 [-π, π]

% 第5步: 保存幅度谱和相位谱
imwrite(mag_norm, 'result1.png');
% → result1: 幅度谱, 中心亮点表示低频能量集中
imwrite(mat2gray(phase), 'result2.png');
% → result2: 相位谱, 包含图像的结构信息
disp(['频谱分析完成, 尺寸: ' mat2str(size(gray))]);`,

  'lowpass-freq': `% ==================== 频域低通滤波 ====================
% 功能: 在频率域中滤除高频分量, 保留低频分量实现平滑效果
% 原理: 理想低通滤波器 H(u,v)=1 当 D(u,v)<=D0, 否则=0

% 第1步: 读取图像并转为灰度浮点
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 二维FFT并中心化
F = fftshift(fft2(gray));
% → F 为中心化后的复数频谱矩阵

% 第3步: 计算每个频率点到中心的距离
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
% → meshgrid 生成频率坐标网格, (u,v) 为每个频率点的坐标
D = sqrt((u - w/2).^2 + (v - h/2).^2);
% → D 为距频谱中心的欧氏距离, 中心=低频, 远处=高频

% 第4步: 构建理想低通滤波器 (截止频率 D0=30)
D0 = 30;
H_ideal = double(D <= D0);
% → D<=D0 的区域为1(通过), 其余为0(阻断), 产生圆形通带

% 第5步: 频域滤波并逆变换回空间域
filtered = abs(ifft2(ifftshift(F .* H_ideal)));
% → F.*H_ideal 频域相乘(滤波); ifftshift 反中心化; ifft2 逆变换; abs 取实部幅度
result = uint8(mat2gray(filtered) * 255);
% → mat2gray 归一化, 乘255转uint8

% 第6步: 保存滤波结果
imwrite(result, 'result.png');
disp(['频域低通滤波完成, 截止频率: ' num2str(D0)]);`,

  'highpass-freq': `% ==================== 频域高通滤波 ====================
% 功能: 在频率域中滤除低频分量, 保留高频分量实现边缘增强
% 原理: 理想高通滤波器 H(u,v)=1 当 D(u,v)>D0, 否则=0

% 第1步: 读取图像并转为灰度浮点
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 二维FFT并中心化
F = fftshift(fft2(gray));

% 第3步: 计算频率距离矩阵
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);
% → D 为每个频率点到零频中心的距离

% 第4步: 构建理想高通滤波器 (截止频率 D0=30)
D0 = 30;
H_hp = double(D > D0);
% → D>D0 的区域为1(通过高频), 中心附近为0(阻断低频)

% 第5步: 频域滤波并逆变换
filtered = abs(ifft2(ifftshift(F .* H_hp)));
% → 频域相乘滤波 → 反中心化 → 逆变换回空间域
result = uint8(mat2gray(filtered) * 255);

% 第6步: 保存高通滤波结果(只保留边缘和细节)
imwrite(result, 'result.png');
disp(['频域高通滤波完成, 截止频率: ' num2str(D0)]);`,

  'bandpass-freq': `% ==================== 频域带通滤波 ====================
% 功能: 只保留指定频率范围内的分量, 滤除过低和过高频率
% 原理: 理想带通滤波器 H(u,v)=1 当 D1<=D(u,v)<=D2, 否则=0

% 第1步: 读取图像并转为灰度浮点
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 二维FFT并中心化
F = fftshift(fft2(gray));

% 第3步: 计算频率距离矩阵
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);

% 第4步: 定义带通范围并构建滤波器
D1 = 20; D2 = 60;
% → D1=下限截止频率, D2=上限截止频率, 只保留环形频带
H_band = double(D >= D1 & D <= D2);
% → 在 D1 到 D2 之间的环形区域为1(通过), 其余为0(阻断)

% 第5步: 频域滤波并逆变换
filtered = abs(ifft2(ifftshift(F .* H_band)));
result = uint8(mat2gray(filtered) * 255);

% 第6步: 保存带通滤波结果
imwrite(result, 'result.png');
disp(['带通滤波完成, 范围: ' num2str(D1) '-' num2str(D2)]);`,

  homomorphic: `% ==================== 同态滤波 ====================
% 功能: 同时压缩图像动态范围(光照)并增强对比度(反射)
% 原理: 图像=光照×反射 → 取对数变为加法 → FFT → 滤波 → 指数还原

% 第1步: 读取图像并转为灰度浮点
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 取对数将乘法模型转为加法模型
img_log = log(gray + 1);
% → log(f+1): 加1防止log(0); 将光照(低频)和反射(高频)从乘积变为求和

% 第3步: 二维FFT并中心化
F = fftshift(fft2(img_log));

% 第4步: 计算频率距离矩阵
[h, w] = size(gray);
[u, v] = meshgrid(0:w-1, 0:h-1);
D = sqrt((u - w/2).^2 + (v - h/2).^2);

% 第5步: 构建高斯型同态滤波函数
rh = 1.5; rl = 0.3; c = 40; D0 = 40;
% → rh: 高频增益(>1, 增强反射细节); rl: 低频增益(<1, 压缩光照)
% → c: 过渡陡度; D0: 截止频率
H = (rh - rl) * (1 - exp(-c * (D.^2) / (D0^2))) + rl;
% → 高斯型高通: 低频处H≈rl(衰减), 高频处H≈rh(增强)

% 第6步: 频域滤波
F_filt = F .* H;
% → 频谱与滤波函数逐元素相乘

% 第7步: 逆变换并取指数还原
result = exp(real(ifft2(ifftshift(F_filt))));
% → ifftshift反中心化 → ifft2逆变换 → real取实部 → exp逆对数
result = uint8(mat2gray(result) * 255);

% 第8步: 保存同态滤波结果
imwrite(result, 'result.png');
disp('同态滤波完成');`,

  // --- Chapter 6: 图像恢复与增强 ---
  'hist-eq': `% ==================== 直方图均衡化 ====================
% 功能: 自动调整图像灰度分布, 使直方图近似均匀, 增强对比度
% 原理: 通过累积分布函数(CDF)映射, 将密集灰度区间拉伸到全范围

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 执行直方图均衡化
equ = histeq(gray);
% → histeq 自动计算CDF并映射灰度值, 使输出直方图近似均匀分布
% → equ 为均衡化后的图像, 对比度通常明显提升

% 第3步: 保存原图和均衡化后的图像对比
imwrite(gray, 'result1.png');
imwrite(equ, 'result2.png');

% 第4步: 输出均值对比
disp(['直方图均衡化完成, 均值: ' num2str(mean(gray(:))) ' -> ' num2str(mean(equ(:)))]);
% → 均衡化后均值通常接近128(中灰)`,

  clahe: `% ==================== CLAHE自适应直方图均衡化 ====================
% 功能: 局部自适应均衡化, 对比不同裁剪限幅(clipLimit)的效果
% 原理: 将图像分块, 每块独立均衡化, clipLimit限制对比度放大避免噪声

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 使用不同 clipLimit 参数执行CLAHE增强
r1 = adapthisteq(gray, 'ClipLimit', 0.01, 'NumTiles', [8 8]);
% → ClipLimit=0.01: 裁剪限幅较小, 增强效果温和
% → NumTiles=[8 8]: 将图像分为8×8=64个子块, 每块独立均衡
r2 = adapthisteq(gray, 'ClipLimit', 0.03, 'NumTiles', [8 8]);
% → ClipLimit=0.03: 中等增强
r3 = adapthisteq(gray, 'ClipLimit', 0.05, 'NumTiles', [8 8]);
% → ClipLimit=0.05: 强增强, 局部对比度更高但可能引入噪声

% 第3步: 保存四张对比图: 原图 / clip=0.01 / 0.03 / 0.05
imwrite(gray, 'result1.png'); imwrite(r1, 'result2.png');
imwrite(r2, 'result3.png'); imwrite(r3, 'result4.png');
disp('CLAHE对比完成: 原图/clip=0.01/0.03/0.05');`,

  'log-transform': `% ==================== 对数变换 ====================
% 功能: 通过非线性对数映射扩展暗区细节, 压缩亮区
% 原理: s = c × log(1 + r), c为缩放常数, 暗区被拉伸、亮区被压缩

% 第1步: 读取图像并转为灰度浮点
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 设置缩放常数并执行对数变换
c = 40;
% → c 控制输出亮度, 值越大输出越亮
result = c * log1p(gray);
% → log1p(gray) = log(1+gray), 加1防止log(0)
% → 对暗区(小值)拉伸明显, 对亮区(大值)压缩

% 第3步: 归一化并转为uint8
result = uint8(mat2gray(result) * 255);
% → mat2gray 归一化到 [0,1]; 乘255转为 0~255 范围

% 第4步: 保存并输出信息
imwrite(result, 'result.png');
disp(['对数变换完成, c=' num2str(c) ' 原图均值: ' num2str(mean(gray(:)))]);`,

  unsharp: `% ==================== USM非锐化掩模锐化 ====================
% 功能: 通过减去模糊版本来增强图像边缘和细节
% 原理: result = 原图 + k × (原图 - 模糊图), 其中 (原图-模糊) 即高频细节

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 生成模糊图像(掩模)
blurred = imfilter(gray, fspecial('gaussian', [5 5], 3));
% → fspecial('gaussian',[5 5],3) 生成5×5高斯核, sigma=3
% → blurred 为模糊版原图, 丢失了高频细节

% 第3步: USM锐化
k = 1.0;
% → k 为锐化强度系数, k越大边缘增强越明显
result = gray + k * (gray - blurred);
% → (gray - blurred) 提取高频细节; k×细节 加回原图 → 锐化效果

% 第4步: 截断到有效范围并保存
result = uint8(max(0, min(255, result)));
% → max(0,min(255,...)) 防止溢出
imwrite(result, 'result.png');
disp(['USM锐化完成, k=' num2str(k)]);`,

  'color-enhance': `% ==================== 彩色图像增强 ====================
% 功能: 在HSV色彩空间中对亮度(V)通道做均衡化, 保持色调和饱和度不变
% 原理: 仅增强亮度对比度, 避免直接对RGB均衡导致色彩偏移

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);

% 第2步: 判断是否为彩色图像
if size(img,3)==3
  % 第2a步: 转换为HSV色彩空间
  hsv = rgb2hsv(img);
  % → hsv(:,:,1)=色调H, hsv(:,:,2)=饱和度S, hsv(:,:,3)=亮度V
  % → H/S/V 均在 [0, 1] 范围

  % 第3步: 只对V(亮度)通道做直方图均衡化
  hsv(:,:,3) = histeq(uint8(hsv(:,:,3)*255)) / 255.0;
  % → 乘255转uint8 → histeq均衡化 → 除以255回到 [0,1]

  % 第4步: 转回RGB并保存
  enhanced = hsv2rgb(hsv);
  % → hsv2rgb 将增强后的HSV转回RGB
  imwrite(uint8(enhanced*255), 'result.png');
else
  % 灰度图像直接均衡化
  enhanced = histeq(img);
  imwrite(enhanced, 'result.png');
end
disp('彩色增强完成(HSV亮度均衡)');`,

  // --- Chapter 7: 图像压缩与退化 ---
  'motion-blur': `% ==================== 运动模糊 ====================
% 功能: 模拟相机或物体运动导致的线性运动模糊
% 原理: 运动模糊核(PSF)沿运动方向均匀分布, 卷积后产生拖影效果

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 设置运动模糊参数并生成核
len = 15; angle = 45;
% → len: 运动轨迹长度(像素), 越长模糊越严重
% → angle: 运动方向角度(度), 45度表示右上方向
kernel = fspecial('motion', len, angle);
% → fspecial('motion',len,angle) 生成运动模糊PSF核

% 第3步: 对图像施加运动模糊
blurred = imfilter(gray, kernel);
% → imfilter 执行卷积, 模拟运动模糊效果
result = uint8(max(0, min(255, blurred)));
% → 截断到 [0,255]

% 第4步: 保存模糊结果
imwrite(result, 'result.png');
disp(['运动模糊完成, 长度=' num2str(len) ' 角度=' num2str(angle)]);`,

  'defocus-blur': `% ==================== 离焦模糊 ====================
% 功能: 模拟镜头失焦导致的圆形弥散模糊
% 原理: 离焦PSF近似为圆盘核(disk), 像素被均匀扩散到圆形邻域

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 设置圆盘核半径并生成核
radius = 7;
% → radius: 圆盘半径(像素), 半径越大模糊越强
kernel = fspecial('disk', radius);
% → fspecial('disk',radius) 生成圆形均匀核, 模拟离焦弥散斑

% 第3步: 对图像施加离焦模糊
blurred = imfilter(gray, kernel);
result = uint8(max(0, min(255, blurred)));

% 第4步: 保存模糊结果
imwrite(result, 'result.png');
disp(['离焦模糊完成, 半径=' num2str(radius)]);`,

  'inverse-filter': `% ==================== 逆滤波图像复原 ====================
% 功能: 已知模糊核(PSF), 在频域通过除法复原原始图像
% 原理: G(u,v)=F(u,v)·H(u,v) → F(u,v)=G(u,v)/H(u,v), 需防止除零

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 模拟运动模糊 (已知PSF)
kernel = fspecial('motion', 15, 0);
% → 水平方向(length=15, angle=0)运动模糊核
blurred = imfilter(gray, kernel);
% → blurred 为退化后的模糊图像

% 第3步: 频域逆滤波复原
F_b = fft2(blurred);
% → 模糊图像的二维FFT
F_k = fft2(kernel, size(gray,1), size(gray,2));
% → 将PSF核零填充到图像尺寸后做FFT
F_k(abs(F_k) < 0.01) = 0.01;  % 阈值防除零
% → H(u,v)接近0的位置设为0.01, 防止除以极小值导致爆炸
F_r = F_b ./ F_k;
% → 频域除法: F(u,v) = G(u,v) / H(u,v) 逆滤波核心公式
restored = real(ifft2(F_r));
% → ifft2 逆变换回空间域; real 取实部(理论上虚部≈0)

% 第4步: 归一化并保存复原结果
result = uint8(mat2gray(restored) * 255);
imwrite(result, 'result.png');
disp('逆滤波复原完成');`,

  'wiener-filter': `% ==================== 维纳滤波图像复原 ====================
% 功能: 在已知PSF和噪声统计下, 用最小均方误差准则复原图像
% 原理: W(u,v) = [H*(u,v) / (|H|^2 + K)] × G(u,v), K为信噪比参数

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end

% 第2步: 模拟运动模糊 + 添加噪声
kernel = fspecial('motion', 15, 0);
blurred = imfilter(gray, kernel);
% → 先施加运动模糊
noisy = blurred + randn(size(gray)) * 5;
% → 添加标准差为5的高斯噪声, 模拟实际退化场景

% 第3步: 频域维纳滤波复原
F_n = fft2(noisy);
% → 退化图像的FFT
F_k = fft2(kernel, size(gray,1), size(gray,2));
% → PSF核的FFT (零填充到图像尺寸)
K = 0.02;  % 信噪比参数
% → K = 噪声功率/信号功率, 越大表示噪声越强, 复原越保守
F_w = (conj(F_k) ./ (abs(F_k).^2 + K)) .* F_n;
% → conj(F_k): H的共轭; abs(F_k).^2: |H|^2
% → 维纳滤波器 = H*/(|H|^2+K), 在逆滤波基础上加入正则化
restored = real(ifft2(F_w));
% → 逆变换回空间域

% 第4步: 归一化并保存复原结果
result = uint8(mat2gray(restored) * 255);
imwrite(result, 'result.png');
disp('维纳滤波复原完成');`,

  'blind-deconv': `% ==================== 盲反卷积图像复原 ====================
% 功能: 在PSF未知的情况下, 迭代估计清晰图像和模糊核
% 原理: Richardson-Lucy算法迭代: 估计→卷积→比较→修正, 逐步逼近真实图像

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img))/255; else; gray = double(img)/255; end
% → 归一化到 [0, 1] 范围, RL算法要求浮点输入

% 第2步: 模拟运动模糊 (实际场景中PSF未知)
kernel = fspecial('motion', 9, 0);
blurred = imfilter(gray, kernel);

% 第3步: 初始化PSF估计 (均匀核, 假设不知道真实核)
psf_est = ones(9) / 81;  % 初始均匀核估计
% → 9×9全1矩阵除以81, 表示初始猜测为均匀模糊
estimate = blurred;
% → 初始图像估计直接使用模糊图像

% 第4步: Richardson-Lucy迭代 (20次)
for iter = 1:20
  conv_est = imfilter(estimate, psf_est);
  % → 用当前估计的图像和PSF做卷积, 模拟退化
  conv_est(conv_est < 1e-10) = 1e-10;
  % → 防止除零, 将极小值设为下限
  ratio = blurred ./ conv_est;
  % → 实际模糊图 / 模拟模糊图 = 修正因子
  estimate = estimate .* imfilter(ratio, rot90(psf_est, 2));
  % → rot90(psf_est,2) 旋转180度得到转置核
  % → 修正因子经转置核滤波后乘回估计值 → 逐步改进
end

% 第5步: 将结果转回 uint8 并保存
result = uint8(max(0, min(255, estimate * 255)));
% → 乘255恢复灰度范围, 截断到 [0,255]
imwrite(result, 'result.png');
disp('盲反卷积复原完成(20次迭代)');`,

  // --- Chapter 8: 图像分割 ---
  sobel: `% ==================== Sobel边缘检测 ====================
% 功能: 使用Sobel算子检测图像边缘(梯度突变处)
% 原理: 分别计算水平/垂直梯度Gx,Gy, 合成梯度幅度 sqrt(Gx^2+Gy^2)

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=double(rgb2gray(img)); else; gray=double(img); end

% 第2步: 构建Sobel算子
hx = fspecial('sobel'); hy = hx';
% → fspecial('sobel') 生成3×3水平Sobel核 [-1 0 1; -2 0 2; -1 0 1]
% → hx' 转置得到垂直Sobel核

% 第3步: 计算水平和垂直梯度
gx = imfilter(gray, hx); gy = imfilter(gray, hy);
% → gx: 水平梯度(检测垂直边缘); gy: 垂直梯度(检测水平边缘)

% 第4步: 合成梯度幅度并归一化
mag = sqrt(gx.^2 + gy.^2);
% → 逐像素计算梯度模长, 边缘处值大
result = uint8(mat2gray(mag) * 255);
% → mat2gray 归一化到 [0,1], 乘255转uint8

% 第5步: 保存边缘检测结果
imwrite(result, 'result.png');
disp('Sobel边缘检测完成');`,

  canny: `% ==================== Canny边缘检测 ====================
% 功能: 使用Canny算法检测图像边缘, 输出二值边缘图
% 原理: 高斯平滑→梯度计算→非极大值抑制→双阈值连接, 抗噪且定位准

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 执行Canny边缘检测
edges = edge(gray, 'canny', [0.1 0.3]);
% → edge(图像, 'canny', [低阈值, 高阈值])
% → 低阈值=0.1: 低于此值的像素被排除
% → 高阈值=0.3: 高于此值的像素确定为边缘
% → 介于两者之间的像素: 若与强边缘相连则保留(滞后连接)

% 第3步: 保存边缘检测结果
imwrite(edges, 'result.png');
disp(['Canny边缘检测完成, 边缘像素: ' num2str(sum(edges(:)))]);
% → sum(edges(:)) 统计值为1(白色)的像素个数, 即边缘点总数`,

  'threshold-seg': `% ==================== Otsu阈值分割 ====================
% 功能: 使用Otsu方法自动确定阈值, 将图像分割为前景和背景
% 原理: Otsu法遍历所有可能阈值, 选取使类间方差最大的阈值

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end

% 第2步: 使用Otsu方法自动计算最优阈值
T = graythresh(gray);
% → graythresh 返回归一化阈值 T ∈ [0,1], 最大化前景与背景的类间方差

% 第3步: 根据阈值生成二值图像
binary = imbinarize(gray, T);
% → 像素灰度 > T×255 → 1(前景,白色); 像素灰度 ≤ T×255 → 0(背景,黑色)

% 第4步: 保存分割结果并输出信息
imwrite(binary, 'result.png');
disp(['Otsu分割完成, 阈值=' num2str(T) ' 前景像素=' num2str(sum(binary(:)))]);
% → sum(binary(:)) 统计白色(前景)像素的个数`,

  'region-grow': `% ==================== 区域生长分割 ====================
% 功能: 从种子点出发, 将灰度相近的相邻像素合并为同一区域
% 原理: 迭代检查区域边界邻域, 若邻域像素与区域均值之差小于阈值则合并

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
[h, w] = size(gray);

% 第2步: 选择种子点 (图像中心)
sy = round(h/2); sx = round(w/2);
% → (sy, sx) 为种子点坐标, 取图像中心
seed_val = gray(sy, sx);
% → seed_val 记录种子点的灰度值
thresh_val = 20;
% → 容差阈值: 像素灰度与区域均值之差 < 20 才合并

% 第3步: 初始化区域掩模
mask = false(h, w);
% → mask 为逻辑矩阵, false=未选中, true=属于区域
mask(sy, sx) = true;
% → 种子点标记为区域起点

% 第4步: 迭代区域生长
changed = true;
while changed
  changed = false;
  region_mean = mean(gray(mask));
  % → 计算当前区域内所有像素的平均灰度
  for dy = -1:1
    for dx = -1:1
      if dy==0 && dx==0; continue; end
      % → 跳过中心点(自身), 只检查8邻域
      shifted = circshift(mask, [dy dx]);
      % → circshift 将mask平移(dy,dx), 得到邻域候选位置
      candidates = shifted & ~mask;
      % → candidates: 在区域邻域但尚未加入区域的像素
      diff = abs(gray - region_mean) < thresh_val;
      % → diff: 灰度与区域均值之差 < 阈值的像素
      new_pts = candidates & diff;
      % → new_pts: 同时满足邻域条件和灰度条件的像素
      if any(new_pts(:))
        mask = mask | new_pts;
        % → 将新像素加入区域
        changed = true;
        % → 有新增像素则继续迭代
      end
    end
  end
end

% 第5步: 用掩模提取区域并保存
result = uint8(mask) .* uint8(gray);
% → mask=1的区域保留原灰度, mask=0的区域置黑
imwrite(result, 'result.png');
disp(['区域生长完成, 种子值=' num2str(seed_val) ' 区域像素=' num2str(sum(mask(:)))]);`,

  watershed: `% ==================== 分水岭分割 ====================
% 功能: 使用分水岭算法将图像分割为多个区域
% 原理: 将灰度图视为地形(亮=山峰), 从低处灌水, 不同盆地交汇处即分水岭线

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 二值化得到前景掩模
bw = imbinarize(gray, graythresh(gray));
% → graythresh 自动计算Otsu阈值; imbinarize 生成二值图

% 第3步: 计算距离变换并取负值
D = -bwdist(~bw);
% → bwdist(~bw): 背景像素到最近前景像素的欧氏距离
% → 取负值: 使前景中心成为"谷底"(分水岭从谷底开始灌水)
D(~bw) = -Inf;
% → 背景区域设为-Inf(无穷深), 防止背景参与分水岭

% 第4步: 执行分水岭变换
L = watershed(D);
% → watershed 返回标记矩阵L, L=0为分水岭线, L>0为各区域编号

% 第5步: 在原图上标记分水岭边界
result = img;
if size(result,3)==3
  result(L==0) = 255;
  % → 分水岭线(标签=0)的像素设为白色
else
  result(L==0) = 255;
end

% 第6步: 保存分割结果
imwrite(result, 'result.png');
disp(['分水岭分割完成, 区域数=' num2str(max(L(:)))]);
% → max(L(:)) 为最大标签号, 即分割出的区域总数`,

  'kmeans-seg': `% ==================== K-means聚类分割 ====================
% 功能: 将图像像素按颜色聚类为K个区域, 实现图像分割
% 原理: K-means迭代: 分配→更新中心→再分配, 最小化类内距离

% 第1步: 读取输入图像并获取尺寸
img = imread(INPUT_IMAGE);
[h, w, c] = size(img);
% → h=高, w=宽, c=通道数(彩色图c=3)

% 第2步: 将图像像素展开为 N×c 的特征矩阵
pixels = double(reshape(img, [], c));
% → reshape(img,[],c) 将三维图像重排为 (h×w)行 × c列 的矩阵
% → 每行代表一个像素的RGB(或灰度)值

% 第3步: 执行K-means聚类
K = 3;
% → K=3: 将所有像素分为3类
idx = kmeans(pixels, K, 'MaxIter', 50);
% → kmeans(数据, 类数, 'MaxIter', 最大迭代次数)
% → idx: 每个像素所属的类别标签 (1, 2, 或 3)

% 第4步: 计算每个聚类的中心颜色
centers = zeros(K, c);
for i = 1:K
  centers(i,:) = mean(pixels(idx==i, :));
  % → 第i类所有像素的均值 → 该类的代表颜色
end

% 第5步: 用聚类中心颜色替换原像素
seg = centers(idx, :);
% → 每个像素替换为所属类的中心颜色, 产生色块化效果
result = uint8(reshape(seg, [h, w, c]));
% → reshape 回原始图像尺寸

% 第6步: 保存分割结果
imwrite(result, 'result.png');
disp(['K-means分割完成, K=' num2str(K)]);`,

  // --- Chapter 9: 形态学 ---
  erode: `% ==================== 形态学腐蚀 ====================
% 功能: 对二值图像执行腐蚀操作, 缩小前景区域
% 原理: 结构元素在图像上滑动, 只有当结构元素完全包含在前景内时中心才为1

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end

% 第2步: 二值化
binary = imbinarize(gray, graythresh(gray));
% → graythresh 自动计算Otsu阈值; imbinarize 生成二值图

% 第3步: 创建结构元素 (半径为2的圆盘)
se = strel('disk', 2);
% → strel('disk',2) 生成半径2的圆形结构元素, 用于定义邻域形状

% 第4步: 执行腐蚀操作
result = imerode(binary, se);
% → imerode: 前景(白色)区域缩小, 边界被"侵蚀"
% → 效果: 去除小于结构元素的突起, 分离细连接

% 第5步: 保存腐蚀结果
imwrite(result, 'result.png');
disp('腐蚀完成');`,

  dilate: `% ==================== 形态学膨胀 ====================
% 功能: 对二值图像执行膨胀操作, 扩大前景区域
% 原理: 结构元素在图像上滑动, 只要结构元素与前景有交集, 中心就设为1

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray=rgb2gray(img); else; gray=img; end

% 第2步: 二值化
binary = imbinarize(gray, graythresh(gray));

% 第3步: 创建结构元素 (半径为2的圆盘)
se = strel('disk', 2);
% → strel('disk',2) 生成半径2的圆形结构元素

% 第4步: 执行膨胀操作
result = imdilate(binary, se);
% → imdilate: 前景(白色)区域扩大, 边界被"膨胀"
% → 效果: 填补小孔洞, 连接邻近物体, 平滑边界

% 第5步: 保存膨胀结果
imwrite(result, 'result.png');
disp('膨胀完成');`,

  'open-close': `% ==================== 开运算与闭运算 ====================
% 功能: 对比形态学开运算和闭运算的效果
% 原理: 开运算=先腐蚀后膨胀(去小目标); 闭运算=先膨胀后腐蚀(填小孔洞)

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 二值化
binary = imbinarize(gray, graythresh(gray));

% 第3步: 创建结构元素 (半径为3的圆盘)
se = strel('disk', 3);
% → strel('disk',3) 定义邻域形状, 半径决定操作的尺度

% 第4步: 开运算 (先腐蚀后膨胀)
opened = imopen(binary, se);
% → imopen: 去除小于结构元素的白色突起和孤立小点
% → 效果: 断开细连接, 平滑大物体边界

% 第5步: 闭运算 (先膨胀后腐蚀)
closed = imclose(binary, se);
% → imclose: 填充小于结构元素的黑色孔洞和裂缝
% → 效果: 连接近距离物体, 填充内部空隙

% 第6步: 保存三张对比图: 二值图 / 开运算 / 闭运算
imwrite(binary, 'result1.png');
imwrite(opened, 'result2.png');
imwrite(closed, 'result3.png');
disp('开闭运算对比: 二值图/开运算/闭运算');`,

  'morph-edge': `% ==================== 形态学边缘检测 ====================
% 功能: 通过膨胀-腐蚀差集提取二值图像的内边界和外边界
% 原理: 外边界=膨胀-原图; 内边界=原图-腐蚀

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 二值化
binary = imbinarize(gray, graythresh(gray));

% 第3步: 创建结构元素 (半径为1的小圆盘)
se = strel('disk', 1);
% → 半径1: 只检测最外/最内一层像素的边缘

% 第4步: 外边界检测 (膨胀 - 原图)
dilated = imdilate(binary, se);
% → 膨胀后前景向外扩展一层
edge_outer = dilated & ~binary;
% → 膨胀结果中去除原图 → 只剩向外扩展的那一圈 → 外边界

% 第5步: 内边界检测 (原图 - 腐蚀)
eroded = imerode(binary, se);
% → 腐蚀后前景向内收缩一层
edge_inner = binary & ~eroded;
% → 原图中去除腐蚀结果 → 只剩被腐蚀掉的那一圈 → 内边界

% 第6步: 保存外边界和内边界
imwrite(edge_outer, 'result1.png');
imwrite(edge_inner, 'result2.png');
disp(['形态学边缘: 外边界=' num2str(sum(edge_outer(:))) ' 内边界=' num2str(sum(edge_inner(:)))]);
% → sum(...) 统计边界像素的个数`,

  skeleton: `% ==================== 骨架提取 ====================
% 功能: 将二值前景区域细化为单像素宽度的骨架(中轴线)
% 原理: 迭代腐蚀并保留不破坏连通性的像素, 直到无法继续细化

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 二值化
binary = imbinarize(gray, graythresh(gray));

% 第3步: 骨架提取
skel = bwmorph(binary, 'skel', Inf);
% → bwmorph(二值图, 'skel', Inf) 迭代执行骨架化直到收敛
% → 'skel': 形态学骨架化操作; Inf: 无限次迭代直到不再变化
% → skel 为单像素宽的骨架线

% 第4步: 保存原二值图和骨架对比
imwrite(binary, 'result1.png');
imwrite(skel, 'result2.png');
disp(['骨架提取完成, 骨架像素=' num2str(sum(skel(:))) ' 原始像素=' num2str(sum(binary(:)))]);
% → sum(skel(:)) 骨架点个数; sum(binary(:)) 原始前景点个数
% → 骨架像素远少于原始像素, 体现细化效果`,

  tophat: `% ==================== 顶帽与底帽变换 ====================
% 功能: 顶帽提取比周围亮的小目标; 底帽提取比周围暗的小目标
% 原理: 顶帽=原图-开运算; 底帽=闭运算-原图

% 第1步: 加载图像处理包并读取图像
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end

% 第2步: 创建较大的结构元素
se = strel('disk', 8);
% → 半径8的圆盘: 决定"周围区域"的尺度, 只提取比结构元素小的目标

% 第3步: 顶帽变换 (原图 - 开运算)
tophat = imtophat(gray, se);
% → imtophat: 开运算去除小亮目标, 原图减开运算 → 得到被去除的小亮目标
% → 效果: 亮背景上的暗细节也被抑制, 突出小亮斑

% 第4步: 底帽变换 (闭运算 - 原图)
bothat = imbothat(gray, se);
% → imbothat: 闭运算填充小暗目标, 闭运算减原图 → 得到被填充的小暗目标
% → 效果: 暗背景上的亮细节也被抑制, 突出小暗斑

% 第5步: 保存顶帽和底帽结果
imwrite(tophat, 'result1.png');
% → result1: 顶帽图像, 亮处为小亮目标
imwrite(bothat, 'result2.png');
% → result2: 底帽图像, 亮处为小暗目标
disp(['顶帽均值=' num2str(mean(tophat(:))) ' 底帽均值=' num2str(mean(bothat(:)))]);
% → 均值越大说明提取出的小目标越多`,

  // --- Chapter 10: 特征提取 ---
  'histogram-feature': `% ==================== 直方图特征提取 ====================
% 功能: 从灰度图像中计算直方图统计特征(均值、标准差、熵、能量)
% 原理: 将灰度直方图归一化为概率分布，再基于概率分布计算各统计量

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% → gray 为 double 类型二维矩阵，像素值范围 0~255

% 第2步: 计算归一化直方图(概率分布)
[counts, ~] = hist(gray(:), 0:255);
% → counts 是长度为256的向量，counts(k) 表示灰度值 k-1 出现的次数
p = counts / sum(counts);
% → p 是归一化概率，sum(p) = 1
p_nz = p(p > 0);
% → p_nz 仅保留非零概率，避免 log2(0) 出错

% 第3步: 计算统计特征
mean_val = sum((0:255) .* p);
% → 均值 = Σ(k × p(k))，反映图像整体亮度
var_val = sum(((0:255) - mean_val).^2 .* p);
% → 方差 = Σ((k-均值)² × p(k))，反映灰度分散程度
std_val = sqrt(var_val);
% → 标准差 = √方差
entropy_val = -sum(p_nz .* log2(p_nz));
% → 信息熵 = -Σ(p×log2(p))，反映图像信息量，值越大纹理越复杂
energy_val = sum(p.^2);
% → 能量 = Σ(p²)，反映灰度均匀程度，值越大灰度越集中

% 第4步: 输出特征数值
disp(['均值=' num2str(mean_val) ' 标准差=' num2str(std_val) ...
      ' 熵=' num2str(entropy_val) ' 能量=' num2str(energy_val)]);

% 第5步: 绘制直方图并保存
h = figure('visible','off'); hist(gray(:), 0:255);
title(['直方图特征: 均值=' num2str(round(mean_val)) ' 熵=' num2str(round(entropy_val,2))]);
print(h, 'result.png', '-dpng'); close(h);
% → 将直方图导出为 result.png 供平台显示`,

  glcm: `% ==================== 灰度共生矩阵(GLCM)纹理特征 ====================
% 功能: 计算灰度共生矩阵并提取纹理特征(对比度、能量、熵)
% 原理: GLCM描述的是在特定方向和距离上，两个像素灰度值共同出现的概率

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: 量化到16级灰度（降低计算量）
gray_q = uint8(double(gray)/256*16);
% → 灰度从0~255压缩到0~15，减少GLCM矩阵大小

% 第3步: 计算灰度共生矩阵
glcm = graycomatrix(gray_q, 'NumLevels', 16, 'Offset', [0 1]);
% → Offset=[0 1]表示水平方向相邻像素；glcm是16×16矩阵
glcm_norm = double(glcm) / sum(glcm(:));
% → 归一化使矩阵元素之和为1，变成概率分布

% 第4步: 计算纹理特征
contrast = sum(sum(((repmat((1:16)',1,16) - repmat(1:16,16,1)).^2) .* glcm_norm));
% → 对比度 = Σ((i-j)² × p(i,j))，值越大纹理越粗糙
energy = sum(glcm_norm(:).^2);
% → 能量 = Σ(p²)，值越大表示灰度对越均匀集中
p_nz = glcm_norm(glcm_norm > 0);
entropy_val = -sum(p_nz .* log2(p_nz));
% → 熵 = -Σ(p×log2(p))，值越大纹理越复杂不规则

% 第5步: 输出特征值
disp(['GLCM: 对比度=' num2str(contrast) ' 能量=' num2str(energy) ' 熵=' num2str(entropy_val)]);

% 第6步: 可视化GLCM矩阵
h = figure('visible','off'); imagesc(glcm_norm); colorbar; title('GLCM');
print(h, 'result.png', '-dpng'); close(h);
% → 以伪彩色图像显示16×16的GLCM归一化矩阵`,

  'edge-feature': `% ==================== 边缘特征提取 ====================
% 功能: 检测图像边缘并计算边缘密度和角点数量
% 原理: Canny算子通过高斯平滑+梯度计算+非极大值抑制+双阈值检测边缘

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: Canny边缘检测
edges = edge(gray, 'canny');
% → edges 是二值矩阵(0/1)，1表示边缘像素

% 第3步: 计算边缘密度
edge_density = sum(edges(:)) / numel(edges);
% → 边缘密度 = 边缘像素数 / 总像素数，值越大说明边缘越多

% 第4步: Harris角点检测
h_corners = corner(gray, 'Harris');
% → h_corners 是 N×2 矩阵，每行是一个角点的(y,x)坐标
n_corners = size(h_corners, 1);
% → 角点总数

% 第5步: 输出特征统计
disp(['边缘密度=' num2str(edge_density) ' 角点数=' num2str(n_corners)]);

% 第6步: 在原图上叠加红色边缘显示
result = img;
if size(result,3)==3
  result(:,:,1) = max(result(:,:,1), edges * 255);
  % → R通道: 边缘位置设为255(红色)
  result(:,:,2) = min(result(:,:,2), uint8(~edges) * 255);
  % → G通道: 边缘位置设为0
end
imwrite(result, 'result.png');
% → 保存边缘叠加图，红色线条标记边缘位置`,

  'region-feature': `% ==================== 连通域特征提取 ====================
% 功能: 对二值图像进行连通域标记，提取面积、周长等特征，并画矩形框
% 原理: 8邻域连通域标记将相邻前景像素归为同一区域，再用regionprops提取属性

% 第1步: 读取图像并二值化
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
% → binary 为逻辑矩阵，1=前景(白), 0=背景(黑)

% 第2步: 连通域标记与特征提取
[L, num] = bwlabel(binary, 8);
% → L 是标记矩阵，每个连通域有唯一整数值；num 是连通域总数
stats = regionprops(L, 'Area', 'Perimeter', 'BoundingBox', 'Centroid');
% → stats 是结构体数组，包含每个区域的面积、周长、外接矩形、质心
disp(['连通域数: ' num2str(num)]);

% 第3步: 在原图上画红色矩形框标记各区域
result = img;
for i = 1:num
  if stats(i).Area > 50
    % → 过滤面积≤50的小噪点区域
    bb = stats(i).BoundingBox;
    % → bb = [x起点, y起点, 宽度, 高度]
    % 画矩形(确定边界坐标并裁剪到图像范围内)
    r1 = max(1,round(bb(2))); r2 = min(size(result,1),round(bb(2)+bb(4)));
    c1 = max(1,round(bb(1))); c2 = min(size(result,2),round(bb(1)+bb(3)));
    if size(result,3)==3
      result(r1,c1:c2,1) = 255; result(r1,c1:c2,2) = 0; result(r1,c1:c2,3) = 0;
      result(r2,c1:c2,1) = 255; result(r2,c1:c2,2) = 0; result(r2,c1:c2,3) = 0;
      result(r1:r2,c1,1) = 255; result(r1:r2,c1,2) = 0; result(r1:r2,c1,3) = 0;
      result(r1:r2,c2,1) = 255; result(r1:r2,c2,2) = 0; result(r1:r2,c2,3) = 0;
      % → 上下左右四条边设为红色(R=255,G=0,B=0)
    end
  end
end
imwrite(result, 'result.png');
% → 保存带有红色矩形框的标注结果`,

  hough: `% ==================== Hough变换直线检测 ====================
% 功能: 使用Hough变换从边缘图像中检测直线段
% 原理: 将图像空间的直线映射到参数空间(θ,ρ)的峰值点，通过寻找峰值检测直线

% 第1步: 读取图像并提取边缘
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
edges = edge(gray, 'canny');
% → edges 是二值边缘图，作为Hough变换的输入

% 第2步: Hough变换
[H, theta, rho] = hough(edges);
% → H 是累加矩阵(θ×ρ)；theta 是角度向量；rho 是距离向量
peaks = houghpeaks(H, 10, 'threshold', ceil(0.3*max(H(:))));
% → 在H中找最多10个峰值，阈值为最大值的30%
lines = houghlines(edges, theta, rho, peaks, 'FillGap', 10, 'MinLength', 50);
% → 提取线段：FillGap=10允许10像素间隔连接，MinLength=50最短50像素

% 第3步: 输出检测结果
disp(['Hough检测直线: ' num2str(length(lines)) ' 条']);

% 第4步: 在原图上标记直线端点
result = img;
if size(result,3)==3
  for k = 1:length(lines)
    xy = [lines(k).point1; lines(k).point2];
    % → xy 是 2×2 矩阵: [x1,y1; x2,y2]
    r1 = round(xy(1,2)); c1 = round(xy(1,1));
    r2 = round(xy(2,2)); c2 = round(xy(2,1));
    % 简化: 在端点画红色标记
    result(max(1,min(r1,size(result,1))), max(1,min(c1,size(result,2))), :) = [255 0 0];
    result(max(1,min(r2,size(result,1))), max(1,min(c2,size(result,2))), :) = [255 0 0];
    % → 将线段两端点设为红色(RGB=[255,0,0])
  end
end
imwrite(result, 'result.png');
% → 保存带有红色端点标记的结果图`,

  template: `% ==================== 模板匹配(归一化互相关) ====================
% 功能: 从图像中心提取模板，然后在整幅图像中搜索最佳匹配位置
% 原理: 归一化互相关(NCC)衡量模板与图像子区域的相似度，值为[-1,1]，1表示完全匹配

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
[h, w] = size(gray);
% → h=图像高度, w=图像宽度

% 第2步: 提取模板(图像中心区域)
th = round(h/4); tw = round(w/4);
% → 模板大小为原图的1/4
ty = round(h/2 - th/2); tx = round(w/2 - tw/2);
% → 模板起始位置: 居中裁剪
tmpl = gray(ty:ty+th-1, tx:tx+tw-1);
% → tmpl 是从灰度图中心裁剪的模板子图

% 第3步: 归一化互相关匹配
C = normxcorr2(tmpl, gray);
% → C 是相关系数矩阵，大小=(h+th-1)×(w+tw-1)，峰值处即最佳匹配
[~, max_idx] = max(C(:));
[peak_y, peak_x] = ind2sub(size(C), max_idx);
% → peak_x, peak_y 是相关矩阵中的峰值位置

% 第4步: 输出匹配结果
disp(['模板匹配完成, 最佳位置: (' num2str(peak_x) ',' num2str(peak_y) ')']);

% 第5步: 可视化相关系数图
h_fig = figure('visible','off');
imshow(C, []); title('归一化互相关');
print(h_fig, 'result.png', '-dpng'); close(h_fig);
% → 显示互相关热力图，亮点即为匹配位置`,

  // --- Chapter 11: 综合应用 ---
  batch: `% ==================== 批量处理流水线 ====================
% 功能: 对图像执行完整的处理流水线(灰度→去噪→增强→分割→计数)
% 原理: 模拟工业批量检测流程，依次应用多种图像处理技术

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: 高斯去噪(标准差σ=2)
denoised = imgaussfilt(gray, 2);
% → 平滑图像，减少高频噪声

% 第3步: 直方图均衡化增强对比度
enhanced = histeq(denoised);
% → 将灰度分布拉伸到全范围，增强整体对比度

% 第4步: Otsu自动阈值二值化
binary = imbinarize(enhanced, graythresh(enhanced));
% → graythresh 自动计算最优阈值，binary 为逻辑矩阵

% 第5步: 形态学开运算清理小噪点
se = strel('disk', 1);
% → 半径为1的圆盘结构元素
cleaned = imopen(binary, se);
% → 先腐蚀后膨胀，去除细小前景噪声

% 第6步: 连通域标记与计数
[L, num] = bwlabel(cleaned, 8);
stats = regionprops(L, 'Area');
count = sum([stats.Area] > 30);
% → 统计面积>30像素的有效目标数

% 第7步: 输出结果
disp(['批量处理流水线: 检测目标=' num2str(count)]);
imwrite(cleaned, 'result.png');
% → 保存二值化分割结果`,

  weld: `% ==================== 焊缝缺陷检测 ====================
% 功能: 对焊缝图像进行增强、边缘检测和形态学清理，定位可能的缺陷区域
% 原理: CLAHE自适应直方图增强突出焊缝细节，Canny检测边缘后形态学去除噪声

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: CLAHE自适应直方图增强
enhanced = adapthisteq(gray, 'ClipLimit', 0.03, 'NumTiles', [8 8]);
% → ClipLimit=0.03限制对比度放大倍数，防止噪声过度增强
% → NumTiles=[8 8]将图像分成8×8个子块分别处理

% 第3步: Canny边缘检测(自定义双阈值)
edges = edge(enhanced, 'canny', [0.1 0.3]);
% → 低阈值0.1，高阈值0.3；高于0.3的确定为边缘，0.1~0.3的连接

% 第4步: 形态学清理噪声
se = strel('disk', 1);
% → 半径为1的圆盘结构元素
cleaned = imopen(edges, se);
% → 开运算去除孤立噪点，保留连续边缘

% 第5步: 保存结果
imwrite(cleaned, 'result.png');
disp('焊缝缺陷检测完成');
% → 输出清理后的边缘图，可用于后续缺陷分析`,

  logcount: `% ==================== 原木截面计数 ====================
% 功能: 通过去噪、分割和形态学处理自动计数原木截面
% 原理: 高斯去噪后Otsu二值化分割前景，形态学闭开运算清理后统计连通域

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: 高斯去噪 + Otsu自动分割
denoised = imgaussfilt(gray, 1.5);
% → σ=1.5的高斯滤波平滑噪声
binary = imbinarize(denoised, graythresh(denoised));
% → Otsu算法自动确定最佳二值化阈值

% 第3步: 形态学闭运算+开运算
se = strel('disk', 4);
% → 半径为4的圆盘结构元素，适合原木截面大小
closed = imclose(binary, se);
% → 闭运算(先膨胀后腐蚀)：填充前景中的小孔洞
opened = imopen(closed, se);
% → 开运算(先腐蚀后膨胀)：去除细小噪声

% 第4步: 距离变换(备用)
D = bwdist(~opened);
% → D(p) = 像素p到最近背景像素的距离，可用于分离重叠目标

% 第5步: 连通域标记与计数
[L, num] = bwlabel(opened, 8);
stats = regionprops(L, 'Area');
count = sum([stats.Area] > 50);
% → 仅统计面积>50像素的较大连通域，排除噪声

% 第6步: 输出结果
disp(['原木计数: ' num2str(count)]);
imwrite(opened, 'result.png');
% → 保存形态学清理后的二值图像`,

  datesort: `% ==================== 红枣自动分选 ====================
% 功能: 根据面积大小将红枣分为优等品和缺陷品两类
% 原理: Otsu分割提取前景，连通域分析根据面积阈值进行品质分类

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: Otsu分割 + 形态学清理
binary = imbinarize(gray, graythresh(gray));
% → 自动阈值二值化，分离红枣与背景
se = strel('disk', 2);
% → 半径为2的圆盘结构元素
cleaned = imopen(binary, se);
% → 开运算去除细小噪声和粘连

% 第3步: 连通域标记
[L, num] = bwlabel(cleaned, 8);
% → L 是标记矩阵，num 是连通域总数
stats = regionprops(L, 'Area');
% → 提取每个区域的面积特征

% 第4步: 品质分类（按面积阈值判断）
good = sum([stats.Area] > 500);
% → 面积>500像素: 优等品（完整大红枣）
defect = sum([stats.Area] > 50 & [stats.Area] <= 500);
% → 面积50~500像素: 缺陷品（残次或小红枣）

% 第5步: 输出分选结果
disp(['红枣分选: 优等=' num2str(good) ' 缺陷=' num2str(defect)]);
imwrite(cleaned, 'result.png');
% → 保存清理后的二值分割结果`,

  panorama: `% ==================== 全景图像拼接 ====================
% 功能: 模拟将一幅图像拆分为左右两幅有重叠的图像，再水平拼接
% 原理: 模拟全景拍摄中两幅有重叠区域的图像水平拼接过程

% 第1步: 读取原图并获取尺寸
img = imread(INPUT_IMAGE);
[h, w, c] = size(img);
% → h=高度, w=宽度, c=通道数(彩色为3)

% 第2步: 模拟两幅重叠图像
overlap = round(w/3);
% → 重叠区域为宽度的1/3
img1 = img(:, 1:w-overlap, :);
% → 左图: 从第1列到 w-overlap 列
img2 = img(:, overlap+1:end, :);
% → 右图: 从 overlap+1 列到末尾，与左图有 overlap 像素重叠
[h1, w1, ~] = size(img1);
[h2, w2, ~] = size(img2);
% → 获取左右子图的尺寸

% 第3步: 水平拼接（直接拼接，无融合）
pan_w = w1 + w2;
% → 拼接后总宽度 = 左图宽 + 右图宽
result = zeros(max(h1,h2), pan_w, c, 'uint8');
% → 创建全零画布（取最大高度）
result(1:h1, 1:w1, :) = img1;
% → 左图放在画布左侧
result(1:h2, w1+1:pan_w, :) = img2;
% → 右图放在画布右侧

% 第4步: 保存并输出信息
imwrite(result, 'result.png');
disp(['全景拼接完成, 宽度=' num2str(pan_w) ' 重叠=' num2str(overlap)]);
% → 拼接结果保存到 result.png`,

  // --- Chapter 12: 目标描述与识别 ---
  'region-desc': `% ==================== 区域形状描述 ====================
% 功能: 提取最大连通域的形状描述特征(面积、周长、圆度、离心率)
% 原理: 通过几何特征描述子量化目标区域的形状属性，用于分类识别

% 第1步: 读取图像并二值化
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
% → binary 为逻辑矩阵

% 第2步: 连通域标记与多特征提取
[L, num] = bwlabel(binary, 8);
% → 8邻域连通域标记
stats = regionprops(L, 'Area', 'Perimeter', 'BoundingBox', 'Eccentricity', 'Orientation');
% → 提取面积、周长、外接矩形、离心率、方向角

% 第3步: 找到面积最大的区域并计算形状描述子
if num > 0
  [~, max_idx] = max([stats.Area]);
  % → 找到面积最大的连通域索引
  s = stats(max_idx);
  % → s 包含该区域的所有形状属性
  circ = 4 * pi * s.Area / (s.Perimeter^2 + 1e-10);
  % → 圆度 = 4πA/P²，圆形=1，越偏离圆形越小
  disp(['最大区域: 面积=' num2str(s.Area) ' 周长=' num2str(s.Perimeter) ...
        ' 圆度=' num2str(circ) ' 离心率=' num2str(s.Eccentricity)]);
  % → 离心率: 0=圆形，接近1=细长条状
end
imwrite(binary, 'result.png');
% → 保存二值化结果`,

  'boundary-desc': `% ==================== 边界描述子(傅里叶描述子) ====================
% 功能: 提取目标边界并使用傅里叶描述子进行边界形状描述与重建
% 原理: 将边界坐标表示为复数序列，通过FFT得到频域描述子，截断后IFFT可重建平滑边界

% 第1步: 读取图像并二值化
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
binary = imbinarize(gray, graythresh(gray));
% → binary 为逻辑矩阵

% 第2步: 提取边界轮廓
B = bwboundaries(binary, 8);
% → B 是元胞数组，每个元素是一个连通域的边界坐标序列

% 第3步: 傅里叶描述子计算与重建
if ~isempty(B)
  b = B{1};
  % → b 是 N×2 矩阵，列为[y坐标, x坐标]
  pts = b(:,2) + 1j * b(:,1);
  % → 将边界点转为复数序列: z = x + j*y
  fd = fft(double(pts));
  % → FFT得到傅里叶描述子，低频=整体形状，高频=细节

  % 第4步: 用前N个描述子重建边界(低通滤波)
  N = 10;
  fd_trunc = zeros(size(fd));
  fd_trunc(1:N) = fd(1:N);
  % → 保留正频率的前N个低频分量
  fd_trunc(end-N+2:end) = fd(end-N+2:end);
  % → 保留对应的负频率分量（共轭对称）
  recon = ifft(fd_trunc);
  % → IFFT重建边界，N越大重建越精细

  % 第5步: 绘制原始边界与重建边界对比
  h_fig = figure('visible','off');
  subplot(1,2,1); plot(b(:,2), -b(:,1)); axis equal; title('原始边界');
  % → 左侧: 完整原始边界
  subplot(1,2,2); plot(real(recon), -imag(recon), 'r'); axis equal;
  title(['FD重建(N=' num2str(N) ')']);
  % → 右侧: 仅用10个描述子重建的红色平滑边界
  print(h_fig, 'result.png', '-dpng'); close(h_fig);
  disp(['边界描述子: 链码长度=' num2str(length(b))]);
  % → 链码长度 = 边界点总数
end`,

  moments: `% ==================== 几何矩与质心计算 ====================
% 功能: 计算图像的零阶矩(面积)和一阶矩，由此确定目标的质心位置
% 原理: m00=ΣI(x,y)(零阶矩), m10=Σx·I(x,y), m01=Σy·I(x,y); 质心=(m10/m00, m01/m00)

% 第1步: 读取图像并转为double灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img)); else; gray = double(img); end
% → gray 为 double 类型，像素值0~255

% 第2步: 计算几何矩
m00 = sum(gray(:));
% → 零阶矩 = 所有像素值之和（反映"面积"或"质量"）
[h, w] = size(gray);
[x, y] = meshgrid(1:w, 1:h);
% → x, y 是坐标网格矩阵
m10 = sum(sum(x .* gray));
% → 一阶矩 m10 = Σ(x × 灰度值)
m01 = sum(sum(y .* gray));
% → 一阶矩 m01 = Σ(y × 灰度值)

% 第3步: 计算质心坐标
cx = m10 / (m00 + 1e-10);
% → 质心x坐标，加1e-10防止除零
cy = m01 / (m00 + 1e-10);
% → 质心y坐标
disp(['零阶矩(面积)=' num2str(m00) ' 质心=(' num2str(cx) ',' num2str(cy) ')']);

% 第4步: 在图像上标记质心（红色方块）
gray_u8 = uint8(gray);
result = cat(3, gray_u8, gray_u8, gray_u8);
% → 将灰度图扩展为3通道RGB图像
rc = max(1,min(round(cy),h)); cc = max(1,min(round(cx),w));
% → 将质心坐标裁剪到图像范围内
result(max(1,rc-3):min(h,rc+3), max(1,cc-3):min(w,cc+3), 1) = 255;
result(max(1,rc-3):min(h,rc+3), max(1,cc-3):min(w,cc+3), 2) = 0;
result(max(1,rc-3):min(h,rc+3), max(1,cc-3):min(w,cc+3), 3) = 0;
% → 在质心位置画7×7红色方块(R=255, G=0, B=0)
imwrite(result, 'result.png');
% → 保存带质心标记的结果图`,

  classify: `% ==================== 图像特征提取与分类 ====================
% 功能: 提取图像的多维特征向量(直方图+统计量+边缘密度)用于分类
% 原理: 将灰度直方图(16级)、均值、标准差、边缘密度拼接为特征向量，可视化展示

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: 提取灰度直方图特征(16级量化)
[counts, ~] = hist(double(gray(:)), linspace(0,255,16));
% → counts 是长度为16的向量，将256级灰度归并到16个区间
feat = [counts/sum(counts), mean(gray(:))/255, std(double(gray(:)))/255];
% → 特征向量 = [归一化直方图(16维), 归一化均值, 归一化标准差]

% 第3步: 追加边缘密度特征
edges = edge(gray, 'canny');
% → Canny边缘检测
feat = [feat, sum(edges(:))/numel(edges)];
% → 追加边缘密度到特征向量末尾，总维度=16+1+1+1=19

% 第4步: 输出特征维度
disp(['特征向量维度=' num2str(length(feat))]);

% 第5步: 可视化特征向量
h_fig = figure('visible','off');
bar(feat); title(['特征向量(d=' num2str(length(feat)) ')']);
print(h_fig, 'result.png', '-dpng'); close(h_fig);
% → 以柱状图显示19维特征向量`,

  pipeline: `% ==================== 图像处理完整流水线 ====================
% 功能: 演示从原始图像到目标检测的完整5步处理流水线
% 原理: 去噪→增强→分割→后处理→分析，每一步输出作为下一步输入

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% Step 1: 高斯去噪(σ=1.0)
denoised = imgaussfilt(gray, 1.0);
% → 轻度平滑，去除高频噪声同时保留边缘

% Step 2: CLAHE自适应直方图增强
enhanced = adapthisteq(denoised, 'ClipLimit', 0.02, 'NumTiles', [8 8]);
% → ClipLimit=0.02控制对比度放大，NumTiles=8×8分块处理

% Step 3: Otsu自动阈值分割
binary = imbinarize(enhanced, graythresh(enhanced));
% → graythresh返回最优阈值，imbinarize生成二值图

% Step 4: 形态学后处理(开运算清理)
se = strel('disk', 1);
% → 半径为1的圆盘结构元素
cleaned = imopen(binary, se);
% → 开运算去除孤立小噪点

% Step 5: 连通域分析(标记+计数)
[L, num] = bwlabel(cleaned, 8);
% → 8邻域连通域标记
stats = regionprops(L, 'Area');
% → 提取每个区域的面积
valid = sum([stats.Area] > 30);
% → 统计面积>30的有效目标数

% 第6步: 输出流水线结果
disp(['流水线完成: 检测目标=' num2str(valid) ' 步骤=去噪→增强→分割→后处理']);
imwrite(cleaned, 'result.png');
% → 保存最终分割结果`,

  // --- Chapter 12: 综合案例 ---
  'case-defect-detection': `% ==================== 综合案例: 表面缺陷检测 ====================
% 功能: 对产品表面图像进行去噪、分割、标记，自动检测并计数缺陷区域
% 原理: 高斯去噪+Otsu二值化+形态学开运算清理，连通域分析定位缺陷并画矩形框

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: 高斯去噪(σ=1.5)
denoised = imgaussfilt(gray, 1.5);
% → 平滑噪声，减少误检

% 第3步: Otsu自动二值化
binary = imbinarize(denoised, graythresh(denoised));
% → 自动确定前景/背景分离阈值

% 第4步: 形态学开运算去除小噪点
se = strel('disk', 2);
% → 半径为2的圆盘结构元素
cleaned = imopen(binary, se);
% → 去除面积小于结构元素的小噪声区域

% 第5步: 连通域标记与缺陷检测
[L, num] = bwlabel(cleaned, 8);
% → num = 连通域总数
stats = regionprops(L, 'Area', 'BoundingBox');
% → 提取每个区域的面积和边界框
result = img;
count = 0;
for i = 1:num
  if stats(i).Area > 50
    % → 仅保留面积>50的缺陷（过滤噪点）
    count = count + 1;
    bb = stats(i).BoundingBox;
    % → bb = [x, y, 宽, 高]
    % 画红色矩形框标记缺陷
    r1 = max(1,round(bb(2))); r2 = min(size(result,1),round(bb(2)+bb(4)));
    c1 = max(1,round(bb(1))); c2 = min(size(result,2),round(bb(1)+bb(3)));
    if size(result,3)==3
      result(r1,c1:c2,1) = 255; result(r1,c1:c2,2) = 0; result(r1,c1:c2,3) = 0;
      result(r2,c1:c2,1) = 255; result(r2,c1:c2,2) = 0; result(r2,c1:c2,3) = 0;
      result(r1:r2,c1,1) = 255; result(r1:r2,c1,2) = 0; result(r1:r2,c1,3) = 0;
      result(r1:r2,c2,1) = 255; result(r1:r2,c2,2) = 0; result(r1:r2,c2,3) = 0;
      % → 在缺陷区域四周画红色边框
    end
  end
end
imwrite(result, 'result.png');
disp(['缺陷检测完成, 检测到: ' num2str(count)]);
% → 保存标记结果并输出缺陷数量`,

  'case-rice-counting': `% ==================== 综合案例: 米粒计数 ====================
% 功能: 自动检测并计数图像中的米粒数量
% 原理: Otsu二值化后形态学开运算分离粘连米粒，连通域标记统计有效目标

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: Otsu自动二值化
binary = imbinarize(gray, graythresh(gray));
% → 前景(米粒)为1，背景为0

% 第3步: 形态学开运算分离粘连米粒
se = strel('disk', 2);
% → 半径为2的圆盘，近似米粒接触区域大小
opened = imopen(binary, se);
% → 先腐蚀断开粘连，再膨胀恢复米粒大小

% 第4步: 连通域标记与计数
[L, num] = bwlabel(opened, 8);
% → 每个分离的米粒获得唯一标记值
stats = regionprops(L, 'Area');
% → 提取各区域的面积
count = sum([stats.Area] > 100);
% → 仅统计面积>100像素的米粒，排除碎屑和噪声

% 第5步: 输出结果
disp(['米粒计数: ' num2str(count)]);
imwrite(opened, 'result.png');
% → 保存形态学处理后的二值图像`,

  'case-edge-comparison': `% ==================== 综合案例: 边缘检测方法对比 ====================
% 功能: 对同一图像分别使用Sobel、Canny、Prewitt三种算子检测边缘并对比
% 原理: Sobel/Prewitt基于一阶梯度，Canny增加了非极大值抑制和双阈值，效果更好

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: Sobel边缘检测
sobel = edge(gray, 'sobel');
% → Sobel算子: 3×3卷积核计算水平和垂直梯度，对噪声有一定平滑

% 第3步: Canny边缘检测
canny = edge(gray, 'canny');
% → Canny: 高斯平滑→梯度→非极大值抑制→双阈值→边缘连接

% 第4步: Prewitt边缘检测
prewitt = edge(gray, 'prewitt');
% → Prewitt算子: 与Sobel类似但权重不同，对噪声更敏感

% 第5步: 保存四张对比图
imwrite(gray, 'result1.png');
% → result1: 原始灰度图
imwrite(sobel, 'result2.png');
% → result2: Sobel边缘
imwrite(canny, 'result3.png');
% → result3: Canny边缘（通常最精细）
imwrite(prewitt, 'result4.png');
% → result4: Prewitt边缘
disp('边缘检测方法对比: Sobel/Canny/Prewitt');`,

  'case-compression': `% ==================== 综合案例: JPEG压缩模拟 ====================
% 功能: 模拟JPEG压缩的核心流程(DCT分块→量化→IDCT)并计算PSNR
% 原理: 将图像分成8×8块，对每块做DCT变换，用量化矩阵除以并取整，再IDCT重建

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: 准备DCT压缩参数
g = double(gray);
% → 转为double进行浮点运算
block_size = 8;
% → JPEG标准分块大小为8×8
[h, w] = size(g);
q_matrix = ones(block_size) * 10;  % 量化矩阵
% → 所有频率系数除以10后取整，值越大压缩率越高但质量越低
compressed = g;
% → 初始化压缩结果矩阵

% 第3步: 分块DCT压缩(遍历每个8×8块)
for r = 1:block_size:h-block_size+1
  for c = 1:block_size:w-block_size+1
    block = g(r:r+block_size-1, c:c+block_size-1);
    % → 取出当前8×8图像块
    dct_block = dct2(block);
    % → 二维DCT变换，能量集中到左上角低频区
    quantized = round(dct_block ./ q_matrix) .* q_matrix;
    % → 量化: 先除以量化矩阵取整(有损)，再乘回来
    compressed(r:r+block_size-1, c:c+block_size-1) = idct2(quantized);
    % → IDCT重建该块，放回结果矩阵
  end
end

% 第4步: 计算压缩质量指标
mse = mean((g(:) - compressed(:)).^2);
% → 均方误差 MSE = 原始与重建的像素差平方均值
psnr = 10 * log10(255^2 / (mse + 1e-10));
% → 峰值信噪比 PSNR，值越大质量越好(通常>30dB可接受)
disp(['JPEG模拟: PSNR=' num2str(psnr) ' dB']);
imwrite(uint8(compressed), 'result.png');
% → 保存压缩重建后的图像`,

  'case-dehaze': `% ==================== 综合案例: 暗通道去雾 ====================
% 功能: 基于暗通道先验算法对雾天图像进行去雾增强
% 原理: J(x) = (I(x) - A) / t(x) + A，其中A为大气光，t为透射率

% 第1步: 读取图像并归一化
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = double(rgb2gray(img))/255; else; gray = double(img)/255; end
% → gray 归一化到 [0, 1]

% 第2步: 暗通道计算(简化: 用灰度图近似)
dark = gray;
% → 暗通道 = 每个像素邻域内最小通道值（此处简化为灰度值）

% 第3步: 估计大气光A(取最亮的0.1%像素)
A = prctile(gray(:), 99.9);
% → A 近似为图像中最亮像素的灰度值

% 第4步: 计算透射率t
omega = 0.95;
% → omega 保留5%的雾气，避免过度去雾导致不自然
t = 1 - omega * dark / A;
% → 透射率公式: t = 1 - ω × dark_channel / A
t = max(t, 0.1);
% → 透射率下限设为0.1，防止除以接近零的值

% 第5步: 去雾重建
g = double(rgb2gray(imread(INPUT_IMAGE)))/255;
% → 重新读取并归一化（使用灰度图进行去雾）
result = (g - A) ./ t + A;
% → 去雾公式: J = (I - A) / t + A
result = max(0, min(1, result));
% → 裁剪到 [0, 1] 范围

% 第6步: 保存结果
imwrite(uint8(result*255), 'result.png');
disp('暗通道去雾完成');
% → 输出增强后的去雾图像`,

  'case-weld-inspection': `% ==================== 综合案例: 焊缝质量检测 ====================
% 功能: 对焊缝X光图像进行增强、边缘检测和Hough直线检测，评估焊缝质量
% 原理: CLAHE增强焊缝细节→Canny提取边缘→Hough变换检测直线结构

% 第1步: 读取图像并转为灰度
pkg load image;
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵

% 第2步: CLAHE自适应增强
enhanced = adapthisteq(gray, 'ClipLimit', 0.02, 'NumTiles', [8 8]);
% → 增强焊缝区域的局部对比度，使缺陷更明显

% 第3步: Canny边缘检测(自定义阈值)
edges = edge(enhanced, 'canny', [0.1 0.3]);
% → 低阈值0.1、高阈值0.3，检测焊缝边缘

% 第4步: Hough变换检测直线
[H, theta, rho] = hough(edges);
% → Hough变换得到累加矩阵
peaks = houghpeaks(H, 10, 'threshold', ceil(0.3*max(H(:))));
% → 提取最多10个峰值点
lines = houghlines(edges, theta, rho, peaks, 'FillGap', 10, 'MinLength', 30);
% → 提取直线段，最小长度30像素

% 第5步: 输出并保存结果
disp(['焊缝检测: 直线=' num2str(length(lines))]);
imwrite(edges, 'result.png');
% → 保存边缘检测结果，直线数量反映焊缝结构完整性`,

  'case-skin-detection': `% ==================== 综合案例: 肤色检测(YCbCr空间) ====================
% 功能: 在YCbCr颜色空间中根据Cr/Cb范围检测肤色区域，输出肤色掩模
% 原理: 肤色在YCbCr空间有较稳定的分布: Cr∈[133,173], Cb∈[77,127]

% 第1步: 读取图像并判断是否为彩色
img = imread(INPUT_IMAGE);
if size(img,3)==3
  % 第2步: 分离RGB三通道
  r = double(img(:,:,1)); g = double(img(:,:,2)); b = double(img(:,:,3));
  % → r, g, b 分别为红、绿、蓝通道的double矩阵

  % 第3步: RGB转YCbCr颜色空间
  Y = 0.299*r + 0.587*g + 0.114*b;
  % → Y 是亮度分量
  Cb = 128 - 0.168736*r - 0.331264*g + 0.5*b;
  % → Cb 是蓝色色度分量
  Cr = 128 + 0.5*r - 0.418688*g - 0.081312*b;
  % → Cr 是红色色度分量

  % 第4步: 肤色区域判定
  mask = (Cr >= 133 & Cr <= 173) & (Cb >= 77 & Cb <= 127);
  % → 满足Cr和Cb范围的像素标记为肤色(1=肤色, 0=非肤色)

  % 第5步: 用掩模提取肤色区域
  result = img;
  result(:,:,1) = uint8(double(img(:,:,1)) .* mask);
  result(:,:,2) = uint8(double(img(:,:,2)) .* mask);
  result(:,:,3) = uint8(double(img(:,:,3)) .* mask);
  % → 非肤色区域变为黑色，仅保留肤色像素

  % 第6步: 保存结果
  imwrite(result, 'result.png');
  disp('肤色分割完成(YCbCr空间)');
else
  % 灰度图像无法进行肤色检测
  imwrite(img, 'result.png');
  disp('需要彩色图像');
end`,

  // --- Chapter 7: 图像压缩编码 ---
  'huffman': `% ==================== Huffman编码压缩 ====================
% 功能: 对图像灰度值进行Huffman编码，计算信息熵、平均码长和压缩比
% 原理: Huffman编码根据符号出现概率构建最优前缀码，高频符号分配短码

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
flat = double(gray(:));
% → flat 是将图像展平为一维列向量
total = length(flat);
% → total = 总像素数

% 第2步: 统计各灰度值的频率和概率
freq = hist(flat, 0:255);
% → freq(k) 是灰度值 k-1 出现的次数
symbols = find(freq > 0) - 1;
% → symbols 是实际出现过的灰度值列表
p = freq(freq > 0) / total;
% → p 是对应灰度值的概率

% 第3步: 计算信息熵
entropy = -sum(p .* log2(p));
% → 信息熵 H = -Σ(p×log2(p))，理论最小平均码长

% 第4步: 构建Huffman编码字典并编码
[dict, avglen] = huffmandict(symbols, p);
% → dict 是码本(符号→码字映射)，avglen 是加权平均码长
encoded = huffmanenco(flat, dict);
% → 将全部像素用Huffman码编码为二进制串
ratio = 8 / avglen;
% → 压缩比 = 原始8bit / 平均码长

% 第5步: 输出编码统计信息
fprintf('信息熵: %.3f bits\\n', entropy);
% → 信息熵（理论下界）
fprintf('平均码长: %.3f bits\\n', avglen);
% → Huffman编码的实际平均码长
fprintf('压缩比: %.2f:1\\n', ratio);
% → 相对原始8bit的压缩倍数
fprintf('编码效率: %.1f%%\\n', entropy/avglen*100);
% → 效率 = 信息熵/平均码长，越接近100%越优

% 第6步: 可视化
subplot(1,2,1); imshow(gray); title('原图');
% → 左侧显示原始灰度图
subplot(1,2,2); bar(0:255, freq); title('灰度直方图');
% → 右侧显示灰度频率分布`,

  'shannon-fano': `% ==================== Shannon-Fano编码 ====================
% 功能: 模拟Shannon-Fano编码过程，计算信息熵和近似压缩比
% 原理: Shannon-Fano编码将符号按概率排序后递归二分，使两组概率尽量相等

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
flat = double(gray(:));
% → flat 是展平的一维像素向量
total = length(flat);
% → total = 总像素数

% 第2步: 统计频率和概率
freq = hist(flat, 0:255);
% → freq 是256级灰度的频率统计
valid = freq > 0;
symbols = find(valid) - 1;
% → symbols 是实际出现的灰度值
counts = freq(valid);
p = counts / total;
% → p 是各灰度值的出现概率

% 第3步: 计算信息熵
entropy = -sum(p .* log2(p));
% → 信息熵 H = -Σ(p×log2(p))
avglen = -sum(p .* log2(p)) * 1.1; % 费诺码接近熵的1.1倍
% → Shannon-Fano平均码长近似为熵的1.1倍（效率略低于Huffman）
ratio = 8 / avglen;
% → 压缩比 = 原始8bit / 近似平均码长

% 第4步: 输出编码统计
fprintf('信息熵: %.3f bits\\n', entropy);
% → 理论最小平均码长
fprintf('费诺平均码长: ~%.3f bits\\n', avglen);
% → Shannon-Fano编码的近似平均码长
fprintf('压缩比: ~%.2f:1\\n', ratio);
% → 近似压缩倍数

% 第5步: 可视化
subplot(1,2,1); imshow(gray); title('原图');
% → 左侧显示原图
subplot(1,2,2); bar(0:255, freq); title('灰度直方图');
% → 右侧显示灰度频率分布`,

  'rle': `% ==================== 游程编码(RLE) ====================
% 功能: 对图像像素序列进行游程编码，统计游程数量和压缩比
% 原理: 将连续相同值的像素用(值, 次数)对表示，如 AAAAABBB → (A,5)(B,3)

% 第1步: 读取图像并展平为一维行向量
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
flat = double(gray(:))';
% → flat 是1×N行向量，N=总像素数
n = length(flat);
% → n = 像素总数

% 第2步: 游程编码(遍历像素序列)
vals = flat(1); cnts = 1;
% → 初始化: 第一个像素值和计数1
for i = 2:n
    if flat(i) == flat(i-1)
        cnts(end) = cnts(end) + 1;
        % → 与前一个像素相同，当前游程计数+1
    else
        vals = [vals, flat(i)];
        cnts = [cnts, 1];
        % → 值变化，开始新游程
    end
end
% → vals = 游程值序列, cnts = 对应游程长度序列

% 第3步: 计算压缩统计
ratio = n / (length(vals) * 2);
% → 压缩比 = 原始像素数 / (游程数×2)，每游程存(值,次数)两个数
fprintf('像素总数: %d\\n', n);
% → 原始数据量
fprintf('游程总数: %d\\n', length(vals));
% → 编码后的数据对数量
fprintf('压缩比: %.2f:1\\n', ratio);
% → 压缩效率（大面积均匀区域压缩比高）
fprintf('最长游程: %d\\n', max(cnts));
% → 最长连续相同像素数

% 第4步: 可视化
subplot(1,2,1); imshow(gray); title('原图');
% → 左侧显示原图
subplot(1,2,2); bar(cnts(1:min(50,end))); title('前50个游程长度');
% → 右侧显示前50个游程的长度分布`,

  'bitplane': `% ==================== 位平面分解与分析 ====================
% 功能: 将灰度图像分解为8个位平面，分析各位的信息量，并用高4位重建图像
% 原理: 每个像素8bit，第k位平面提取所有像素的第k位，高位含主要信息

% 第1步: 读取图像并转为灰度
img = imread(INPUT_IMAGE);
if size(img,3)==3; gray = rgb2gray(img); else; gray = img; end
% → gray 为 uint8 二维矩阵，每像素8bit

% 第2步: 逐位提取并显示8个位平面
figure;
for bit = 7:-1:0
    plane = bitget(gray, bit+1);
    % → bitget提取第(bit+1)位（bitget从1开始），plane为0/1矩阵
    subplot(2, 4, 8-bit);
    imshow(plane);
    title(sprintf('位平面 %d', bit));
    % → 在2×4子图网格中显示各位平面
    pct = mean(double(plane(:))) * 100;
    % → pct = 位平面中1的比例(%)
    fprintf('位平面 %d: 1的比例 = %.1f%%\\n', bit, pct);
    % → 位平面7(最高位)含最重要信息，位平面0(最低位)几乎是噪声
end

% 第3步: 仅用高4位(bit7~bit4)重建图像
recon = uint8(zeros(size(gray)));
% → 初始化全零重建矩阵
for bit = 4:7
    recon = recon + bitget(gray, bit+1) * 2^bit;
    % → 累加各位平面的贡献: 位值×2^bit
end
% → recon 仅包含高4位信息，相当于16级灰度

% 第4步: 计算重建质量
mse = mean(double(gray(:) - recon(:)).^2);
% → 均方误差
psnr = 10 * log10(255^2 / (mse + 1e-10));
% → 峰值信噪比
fprintf('高4位重建 PSNR: %.1f dB\\n', psnr);
% → 通常高4位重建PSNR>30dB，说明大部分信息在高位`,
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
  'gray': 1, 'channel-split': 1, 'histogram': 2, 'noise': 2,
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
