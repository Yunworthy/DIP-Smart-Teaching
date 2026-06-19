/**
 * migrate-12chapters.js
 * Migrates the database from 10-chapter to 12-chapter structure (matching PPT files).
 *
 * NOTE: Uses db.exec() with raw SQL instead of prepare().run() due to a
 * parameter binding lag bug in the db.js wrapper when switching between
 * different prepared statement objects.
 *
 * PPT chapter structure (target):
 *  1. 绪论  2. 数字图像处理基础  3. 数字图像的基本运算
 *  4. 空间域图像增强  5. 频率域图像处理  6. 图像恢复
 *  7. 图像压缩编码  8. 图像分割  9. 图像特征提取
 * 10. 彩色图像处理  11. 形态学图像处理  12. 目标表示与描述
 */

// Helper: escape single quotes for SQL strings
function esc(s) { return s.replace(/'/g, "''"); }

// Helper: batch UPDATE using exec
function updateChapterId(db, table, column, newChapterId, ids) {
  for (const id of ids) {
    db.exec(`UPDATE ${table} SET ${column}=${newChapterId} WHERE id=${id}`);
  }
}

function migrate(db) {
  console.log('[migrate] Starting 10->12 chapter migration...');

  // Temporarily disable FK checks during bulk migration
  db.exec('PRAGMA foreign_keys = OFF');

  // ============================================================
  // Step 1: Insert new chapters and rename existing ones
  // ============================================================

  // Insert new chapters (2, 3 will be ignored if they already exist)
  db.exec(`INSERT OR IGNORE INTO chapters (id, sort_order, title, subtitle, description) VALUES
    (2, 2, '数字图像处理基础', '图像形成、采样量化与像素关系',
     '系统学习电磁波谱与人眼视觉特性、图像形成模型、采样与量化、空间分辨率与灰度分辨率、像素邻域与距离度量、图像显示与文件格式。')`);
  db.exec(`INSERT OR IGNORE INTO chapters (id, sort_order, title, subtitle, description) VALUES
    (3, 3, '数字图像的基本运算', '灰度变换、直方图与几何运算',
     '掌握灰度反转、对数变换、灰度直方图、图像代数运算（加减）和几何运算（平移、旋转、镜像、缩放），建立图像处理的基本操作能力。')`);
  db.exec(`INSERT OR IGNORE INTO chapters (id, sort_order, title, subtitle, description) VALUES
    (11, 11, '形态学图像处理', '集合论基础与形态运算',
     '学习数学形态学基础（集合论、腐蚀、膨胀、开运算、闭运算），掌握形态滤波、边界提取、区域填充、骨架提取和物体识别等应用。')`);
  db.exec(`INSERT OR IGNORE INTO chapters (id, sort_order, title, subtitle, description) VALUES
    (12, 12, '目标表示与描述', '边界/区域表示与描述子',
     '掌握目标表示和描述方法，包括链码、多边形近似、边界描述子（傅里叶描述子、统计矩）、区域表示与描述（拓扑、不变矩）和关系描述。')`);

  // Rename ALL 12 chapters to match PPT structure
  const chapterData = [
    [1, '绪论', '数字图像处理概述与MATLAB基础', '介绍数字图像处理的基本概念、系统组成、应用领域，以及MATLAB编程环境与图像处理工具箱的基本使用。'],
    [2, '数字图像处理基础', '图像形成、采样量化与像素关系', '系统学习电磁波谱与人眼视觉特性、图像形成模型、采样与量化、空间分辨率与灰度分辨率、像素邻域与距离度量、图像显示与文件格式。'],
    [3, '数字图像的基本运算', '灰度变换、直方图与几何运算', '掌握灰度反转、对数变换、灰度直方图、图像代数运算（加减）和几何运算（平移、旋转、镜像、缩放），建立图像处理的基本操作能力。'],
    [4, '空间域图像增强', '点运算、直方图增强与空间滤波', '深入学习空间域图像增强技术，包括对比度增强、窗切片、直方图均衡化与规定化、空间平滑滤波（邻域平均、中值滤波）、空间锐化滤波（梯度、拉普拉斯）。'],
    [5, '频率域图像处理', '傅里叶变换与频域滤波', '理解二维离散傅里叶变换的定义与性质，掌握频域低通、高通、带通/带阻滤波器的设计与应用。'],
    [6, '图像恢复', '退化模型与复原技术', '学习图像退化的数学模型，掌握逆滤波、维纳滤波、运动模糊恢复、噪声分析与去噪、几何失真校正等图像恢复技术。'],
    [7, '图像压缩编码', '冗余消除与编码技术', '理解图像数据冗余类型与信息熵，掌握DCT变换、霍夫曼编码、算术编码、位平面编码、游程编码、变换编码及图像质量评价方法。'],
    [8, '图像分割', '阈值、边缘与区域分割', '学习图像分割的主要方法，包括阈值分割、边缘检测、Hough变换、轮廓跟踪、区域生长和分裂合并。'],
    [9, '图像特征提取', '边缘、角点、纹理与形状特征', '掌握图像特征提取方法，包括梯度/二阶微分/Marr边缘检测、SUSAN角点检测、纹理特征（直方图矩、GLCM、结构/频谱方法）、形状与统计特征。'],
    [10, '彩色图像处理', '颜色模型与彩色增强', '理解三基色原理和CIE色度图，掌握RGB/HSI/CMYK/YUV颜色模型及转换，学习彩色变换、增强、平滑、锐化、边缘检测和分割方法。'],
    [11, '形态学图像处理', '集合论基础与形态运算', '学习数学形态学基础（集合论、腐蚀、膨胀、开运算、闭运算），掌握形态滤波、边界提取、区域填充、骨架提取和物体识别等应用。'],
    [12, '目标表示与描述', '边界/区域表示与描述子', '掌握目标表示和描述方法，包括链码、多边形近似、边界描述子（傅里叶描述子、统计矩）、区域表示与描述（拓扑、不变矩）和关系描述。'],
  ];

  for (const [id, title, subtitle, desc] of chapterData) {
    db.exec(`UPDATE chapters SET title='${esc(title)}', subtitle='${esc(subtitle)}', description='${esc(desc)}', sort_order=${id} WHERE id=${id}`);
  }

  console.log('[migrate] Chapters updated to 12-chapter structure.');

  // ============================================================
  // Step 2: Reassign KP chapter_ids based on actual content
  // ============================================================

  // KPs 1-10 -> split between Ch1 (绪论) and Ch2 (基础)
  const kpMap = {
    1: 1, 2: 2, 3: 2, 4: 1, 5: 1, 6: 2, 7: 2, 8: 1, 9: 1, 10: 1,
    11: 2, 12: 2, 13: 3, 14: 4, 15: 4, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3,
  };
  for (const [kpId, chId] of Object.entries(kpMap)) {
    db.exec(`UPDATE knowledge_points SET chapter_id=${chId} WHERE id=${kpId}`);
  }

  // Bulk KP reassignments
  updateChapterId(db, 'knowledge_points', 'chapter_id', 4, Array.from({length: 8}, (_, i) => 21 + i));   // 21-28 -> Ch4
  updateChapterId(db, 'knowledge_points', 'chapter_id', 5, Array.from({length: 8}, (_, i) => 29 + i));   // 29-36 -> Ch5
  updateChapterId(db, 'knowledge_points', 'chapter_id', 6, Array.from({length: 8}, (_, i) => 37 + i));   // 37-44 -> Ch6
  updateChapterId(db, 'knowledge_points', 'chapter_id', 10, Array.from({length: 8}, (_, i) => 45 + i));  // 45-52 -> Ch10
  updateChapterId(db, 'knowledge_points', 'chapter_id', 7, Array.from({length: 8}, (_, i) => 53 + i));   // 53-60 -> Ch7
  updateChapterId(db, 'knowledge_points', 'chapter_id', 8, Array.from({length: 10}, (_, i) => 61 + i));  // 61-70 -> Ch8
  updateChapterId(db, 'knowledge_points', 'chapter_id', 11, Array.from({length: 10}, (_, i) => 71 + i)); // 71-80 -> Ch11
  updateChapterId(db, 'knowledge_points', 'chapter_id', 9, Array.from({length: 8}, (_, i) => 81 + i));   // 81-88 -> Ch9
  updateChapterId(db, 'knowledge_points', 'chapter_id', 12, Array.from({length: 16}, (_, i) => 89 + i)); // 89-104 -> Ch12
  db.exec('UPDATE knowledge_points SET chapter_id=8 WHERE id=105');   // 区域分裂合并 -> Ch8
  db.exec('UPDATE knowledge_points SET chapter_id=11 WHERE id=106');  // 击中击不中 -> Ch11

  // Insert new KP107: 基于点运算的空间增强 -> Ch4
  db.exec(`INSERT OR IGNORE INTO knowledge_points (id, chapter_id, parent_id, title, description, difficulty, sort_order, category, principle) VALUES
    (107, 4, NULL, '基于点运算的空间增强', '灰度变换与对比度增强的点运算方法', 2, 9, 'algorithm',
     '点运算是指输出像素值仅取决于对应输入像素值的图像处理方法，包括伽马校正（幂律变换）和对比度拉伸（分段线性变换）。伽马校正 g=c*f^gamma 通过调整gamma参数控制亮暗区域的对比度；对比度拉伸通过扩展感兴趣灰度区间的动态范围来增强图像。这类方法计算简单、效果直观，是空间域增强的基础。')`);

  // Link KP107 to gamma and contrast-stretch simulations
  db.exec("INSERT OR IGNORE INTO kp_simulations (knowledge_point_id, simulation_key) VALUES (107, 'gamma')");
  db.exec("INSERT OR IGNORE INTO kp_simulations (knowledge_point_id, simulation_key) VALUES (107, 'contrast-stretch')");

  console.log('[migrate] KP chapter_ids updated.');

  // ============================================================
  // Step 3: Reassign simulation chapter_ids (using actual sim_keys from seed.js)
  // ============================================================

  // Ch1 (绪论): basic image ops from old Ch1 (gray, channel-split only)
  for (const key of ['gray', 'channel-split'])
    db.exec(`UPDATE simulations SET chapter_id=1 WHERE sim_key='${key}'`);
  // Ch2 (基础): noise/quantization from old Ch1
  for (const key of ['noise', 'quantize'])
    db.exec(`UPDATE simulations SET chapter_id=2 WHERE sim_key='${key}'`);
  // Ch3 (基本运算): geometric transforms + gray-level ops
  for (const key of ['translate', 'rotate', 'flip', 'affine', 'projection', 'invert', 'threshold'])
    db.exec(`UPDATE simulations SET chapter_id=3 WHERE sim_key='${key}'`);
  // Ch4 (空间域增强): spatial filtering + enhancement from old Ch2 + old Ch4 + histogram/gamma/contrast-stretch
  for (const key of ['smooth', 'sharpen', 'denoise', 'gradient', 'directional', 'emboss', 'hist-eq', 'clahe', 'log-transform', 'unsharp', 'histogram', 'gamma', 'contrast-stretch'])
    db.exec(`UPDATE simulations SET chapter_id=4 WHERE sim_key='${key}'`);
  // Ch5 (频率域): from old Ch3
  for (const key of ['fft', 'lowpass-freq', 'highpass-freq', 'bandpass-freq', 'homomorphic'])
    db.exec(`UPDATE simulations SET chapter_id=5 WHERE sim_key='${key}'`);
  // Ch6 (图像恢复): from old Ch5
  for (const key of ['motion-blur', 'defocus-blur', 'inverse-filter', 'wiener-filter', 'blind-deconv'])
    db.exec(`UPDATE simulations SET chapter_id=6 WHERE sim_key='${key}'`);
  // Ch7 (图像压缩编码): compression experiments
  for (const key of ['case-compression','huffman','shannon-fano','rle','bitplane'])
    db.exec(`UPDATE simulations SET chapter_id=7 WHERE sim_key='${key}'`);
  // Ch8 (图像分割): from old Ch6
  for (const key of ['sobel', 'canny', 'threshold-seg', 'region-grow', 'watershed', 'kmeans-seg'])
    db.exec(`UPDATE simulations SET chapter_id=8 WHERE sim_key='${key}'`);
  // Ch9 (特征提取): from old Ch8
  for (const key of ['histogram-feature', 'glcm', 'edge-feature', 'region-feature', 'hough', 'template'])
    db.exec(`UPDATE simulations SET chapter_id=9 WHERE sim_key='${key}'`);
  // Ch10 (彩色): from old Ch4
  db.exec("UPDATE simulations SET chapter_id=10 WHERE sim_key='color-enhance'");
  // Ch11 (形态学): from old Ch7
  for (const key of ['erode', 'dilate', 'open-close', 'morph-edge', 'skeleton', 'tophat'])
    db.exec(`UPDATE simulations SET chapter_id=11 WHERE sim_key='${key}'`);
  // Ch12 (目标表示): from old Ch9 + old Ch10
  for (const key of ['batch', 'weld', 'logcount', 'datesort', 'panorama', 'region-desc', 'boundary-desc', 'moments', 'classify', 'pipeline'])
    db.exec(`UPDATE simulations SET chapter_id=12 WHERE sim_key='${key}'`);
  // Case experiments from old Ch10
  db.exec("UPDATE simulations SET chapter_id=12 WHERE sim_key='case-defect-detection'");
  db.exec("UPDATE simulations SET chapter_id=12 WHERE sim_key='case-rice-counting'");
  db.exec("UPDATE simulations SET chapter_id=12 WHERE sim_key='case-dehaze'");
  db.exec("UPDATE simulations SET chapter_id=10 WHERE sim_key='case-edge-comparison'");
  db.exec("UPDATE simulations SET chapter_id=10 WHERE sim_key='case-weld-inspection'");
  db.exec("UPDATE simulations SET chapter_id=10 WHERE sim_key='case-skin-detection'");

  console.log('[migrate] Simulation chapter_ids updated.');

  // ============================================================
  // Step 4: Reassign enterprise_cases related_chapter_id
  // ============================================================
  db.exec('UPDATE enterprise_cases SET related_chapter_id=8 WHERE id IN (1, 2)');
  db.exec('UPDATE enterprise_cases SET related_chapter_id=9 WHERE id=3');
  updateChapterId(db, 'enterprise_cases', 'related_chapter_id', 12, [4, 5, 6, 7, 8]);
  db.exec('UPDATE enterprise_cases SET related_chapter_id=9 WHERE id=9');
  updateChapterId(db, 'enterprise_cases', 'related_chapter_id', 12, Array.from({length: 12}, (_, i) => 10 + i));

  console.log('[migrate] Enterprise case chapter_ids updated.');

  // ============================================================
  // Step 5: Reassign assignments chapter_ids
  // ============================================================
  // Homework: id -> new chapter_id
  const assignMap = {1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:11, 10:10, 11:9, 12:12};
  for (const [id, ch] of Object.entries(assignMap)) {
    db.exec(`UPDATE assignments SET chapter_id=${ch} WHERE id=${id}`);
  }
  // Lab reports
  db.exec('UPDATE assignments SET chapter_id=1 WHERE id=13');
  db.exec('UPDATE assignments SET chapter_id=4 WHERE id=14');
  db.exec('UPDATE assignments SET chapter_id=6 WHERE id=15');
  db.exec('UPDATE assignments SET chapter_id=8 WHERE id=16');
  db.exec('UPDATE assignments SET chapter_id=12 WHERE id=17');

  console.log('[migrate] Assignment chapter_ids updated.');

  // ============================================================
  // Step 6: Reassign resources chapter_ids
  // ============================================================
  db.exec('UPDATE resources SET chapter_id=1 WHERE id=1');
  db.exec('UPDATE resources SET chapter_id=4 WHERE id=2');
  db.exec('UPDATE resources SET chapter_id=1 WHERE id=3');
  db.exec('UPDATE resources SET chapter_id=4 WHERE id=4');
  db.exec('UPDATE resources SET chapter_id=5 WHERE id=5');
  db.exec('UPDATE resources SET chapter_id=8 WHERE id=6');

  console.log('[migrate] Resource chapter_ids updated.');

  // ============================================================
  // Step 7: Reassign exam_questions chapter_ids
  // ============================================================
  db.exec('UPDATE exam_questions SET chapter_id=1 WHERE id=1');
  db.exec('UPDATE exam_questions SET chapter_id=2 WHERE id=2');
  db.exec('UPDATE exam_questions SET chapter_id=1 WHERE id=3');
  db.exec('UPDATE exam_questions SET chapter_id=4 WHERE id=4');
  updateChapterId(db, 'exam_questions', 'chapter_id', 5, [5, 6, 7, 8]);     // freq domain
  updateChapterId(db, 'exam_questions', 'chapter_id', 6, [9, 10, 11]);       // restoration
  updateChapterId(db, 'exam_questions', 'chapter_id', 10, [12, 13, 14]);     // color
  updateChapterId(db, 'exam_questions', 'chapter_id', 7, [15, 16, 17]);      // compression
  updateChapterId(db, 'exam_questions', 'chapter_id', 8, [18, 19, 20, 21]);  // segmentation
  updateChapterId(db, 'exam_questions', 'chapter_id', 11, [22, 23, 24, 25]); // morphology
  updateChapterId(db, 'exam_questions', 'chapter_id', 9, [26, 27, 28]);      // feature extraction
  updateChapterId(db, 'exam_questions', 'chapter_id', 12, [29, 30, 31, 32, 33, 34, 35]); // object representation

  console.log('[migrate] Exam question chapter_ids updated.');

  // ============================================================
  // Step 8: Update sample exam chapter_ids
  // ============================================================
  try {
    db.exec("UPDATE exams SET chapter_ids='1,2,3,4,5,6,7,8,9,10,11,12' WHERE id=1");
    console.log('[migrate] Sample exam chapter_ids updated.');
  } catch (e) {
    console.log('[migrate] No exams table or sample exam to update.');
  }

  // ============================================================
  // Step 9: Update assignment titles to match new chapter numbers
  // ============================================================
  const titleMap = {
    1: '第1章作业：绪论',
    2: '第2章作业：数字图像处理基础',
    3: '第3章作业：数字图像的基本运算',
    4: '第4章作业：空间域图像增强',
    5: '第5章作业：频率域图像处理',
    6: '第6章作业：图像恢复',
    7: '第7章作业：图像压缩编码',
    8: '第8章作业：图像分割',
    9: '第11章作业：形态学图像处理',
    10: '第10章作业：彩色图像处理',
    11: '第9章作业：图像特征提取',
    12: '第12章作业：目标表示与描述',
  };
  for (const [id, title] of Object.entries(titleMap)) {
    db.exec(`UPDATE assignments SET title='${esc(title)}' WHERE id=${id}`);
  }

  console.log('[migrate] Assignment titles updated.');

  // ============================================================
  // Done - re-enable FK checks
  // ============================================================
  db.exec('PRAGMA foreign_keys = ON');

  console.log('[migrate] Migration complete!');
  console.log('[migrate] 10 chapters -> 12 chapters matching PPT structure.');
}

module.exports = { migrate };
