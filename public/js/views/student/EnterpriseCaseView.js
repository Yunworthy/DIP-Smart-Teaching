/* ============================================================
 *  EnterpriseCaseView.js — 企业案例学习
 * ============================================================ */
var EnterpriseCaseView = {
  name: 'EnterpriseCaseView',
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-800">企业案例</h1>
        <p class="text-gray-400 text-sm mt-1">来自实际生产环境的图像处理应用案例</p>
      </div>

      <!-- Filter -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button v-for="cat in categories" :key="cat"
                @click="selectedCategory = cat"
                class="px-3 py-1.5 rounded-md text-sm transition-colors duration-150"
                :class="selectedCategory === cat ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'">
          {{ cat }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>

      <!-- Case Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="c in filteredCases" :key="c.id"
             @click="viewCase(c)"
             class="bg-white rounded-lg border border-gray-150 hover:border-gray-300 transition-colors duration-200 cursor-pointer overflow-hidden group"
             :style="{ borderLeftWidth: '3px', borderLeftColor: getBorderColor(c.category) }">
          <div class="p-5">
            <div class="flex items-center gap-2 mb-2.5">
              <span class="text-xs text-gray-400">{{ c.category }}</span>
              <span class="text-gray-200">·</span>
              <div class="flex items-center gap-0.5">
                <template v-for="s in 5">
                  <svg class="w-3 h-3" :class="s <= c.difficulty ? 'text-amber-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </template>
              </div>
            </div>
            <h3 class="text-[15px] font-medium text-gray-800 mb-1.5 leading-snug group-hover:text-gray-900">{{ c.title }}</h3>
            <p class="text-[13px] text-gray-400 line-clamp-2 leading-relaxed mb-3">{{ c.description }}</p>
            <div class="flex items-center pt-3 border-t border-gray-50">
              <span class="text-xs text-gray-300" v-if="c.chapter_title">{{ c.chapter_title }}</span>
              <span class="text-xs text-gray-400 ml-auto">详情 →</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Case Detail Modal with 5 Tabs -->
      <div v-if="selectedCase" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="selectedCase = null">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-gray-800">{{ selectedCase.title }}</h2>
              <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{{ selectedCase.category }}</span>
                <span>·</span>
                <span>难度 {{ selectedCase.difficulty }}/5</span>
                <span v-if="selectedCase.chapter_title">·</span>
                <span v-if="selectedCase.chapter_title">{{ selectedCase.chapter_title }}</span>
              </div>
            </div>
            <button @click="selectedCase = null" class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-500 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Tab Bar -->
          <div class="flex border-b border-gray-100 px-5">
            <button v-for="tab in tabs" :key="tab.key"
                    @click="activeTab = tab.key"
                    class="px-3 py-2.5 text-sm transition-colors relative"
                    :class="activeTab === tab.key ? 'text-gray-800 font-medium' : 'text-gray-400 hover:text-gray-600'">
              {{ tab.label }}
              <div v-if="activeTab === tab.key" class="absolute bottom-0 left-2 right-2 h-[2px] bg-gray-800 rounded-full"></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Tab 1: 案例背景 -->
            <div v-if="activeTab === 'background'" class="space-y-4">
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 class="text-sm font-semibold text-slate-700 mb-2">案例概述</h3>
                <p class="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{{ selectedCase.description }}</p>
              </div>
              <div v-if="selectedCase.content">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">详细介绍</h3>
                <div v-if="parseSections(selectedCase.content).length > 1" class="space-y-2.5">
                  <div v-for="(sec, idx) in parseSections(selectedCase.content)" :key="idx"
                       class="p-3.5 bg-white rounded-lg border border-gray-100">
                    <div class="text-xs font-medium text-gray-400 mb-1.5" v-if="sec.label">{{ sec.label }}</div>
                    <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ sec.content }}</p>
                  </div>
                </div>
                <div v-else class="p-4 bg-white rounded-lg border border-gray-100 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{{ selectedCase.content }}</div>
              </div>
            </div>

            <!-- Tab 2: 技术原理 -->
            <div v-if="activeTab === 'principle'" class="space-y-4">
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 class="text-sm font-semibold text-slate-700 mb-2">技术原理分析</h3>
                <p class="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{{ getPrincipleText() }}</p>
              </div>
            </div>

            <!-- Tab 3: 示例结果 -->
            <div v-if="activeTab === 'results'" class="space-y-4">
              <!-- Result Image -->
              <div v-if="selectedCase.sample_images" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div class="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <h3 class="text-sm font-medium text-gray-600">实验结果</h3>
                </div>
                <div class="p-4 flex justify-center bg-gray-50">
                  <img :src="selectedCase.sample_images"
                       :alt="selectedCase.title + ' 实验结果'"
                       class="max-w-full rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                       style="max-height: 420px; object-fit: contain;"
                       @click="lightboxImage = selectedCase.sample_images"
                       @error="$event.target.style.display='none'"
                       loading="lazy" />
                </div>
                <div class="px-4 pb-2.5 text-center">
                  <p class="text-xs text-gray-400">点击放大查看</p>
                </div>
              </div>
              <!-- Result Text -->
              <div v-if="selectedCase.results_text">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">实验数据详情</h3>
                <div v-if="parseSections(selectedCase.results_text).length > 1" class="space-y-2.5">
                  <div v-for="(sec, idx) in parseSections(selectedCase.results_text)" :key="idx"
                       class="p-3.5 bg-white rounded-lg border border-gray-100">
                    <div class="text-xs font-medium text-gray-400 mb-1.5" v-if="sec.label">{{ sec.label }}</div>
                    <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ sec.content }}</p>
                  </div>
                </div>
                <div v-else class="p-4 bg-white rounded-lg border border-gray-100">
                  <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ selectedCase.results_text }}</p>
                </div>
              </div>
              <div v-if="!selectedCase.results_text && !selectedCase.sample_images" class="text-center py-12 text-gray-400">
                <p>暂无结果数据</p>
              </div>
            </div>

            <!-- Tab 4: 结果分析 -->
            <div v-if="activeTab === 'analysis'" class="space-y-4">
              <div v-if="selectedCase.results_text">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">性能指标分析</h3>
                <div v-if="parseNumberedText(getAnalysisText()).length > 1" class="space-y-2.5">
                  <div v-for="(item, idx) in parseNumberedText(getAnalysisText())" :key="idx"
                       class="flex gap-3 items-start p-3.5 bg-white rounded-lg border border-gray-100">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 text-amber-600 text-xs font-medium flex items-center justify-center mt-0.5">{{ idx + 1 }}</span>
                    <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ item }}</p>
                  </div>
                </div>
                <div v-else class="p-4 bg-white rounded-lg border border-gray-100">
                  <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ getAnalysisText() }}</p>
                </div>
              </div>
              <div v-else class="text-center py-12 text-gray-400">
                <p>暂无分析数据</p>
              </div>
            </div>

            <!-- Tab 5: 生产问题 -->
            <div v-if="activeTab === 'production'" class="space-y-3">
              <div v-if="selectedCase.production_issues">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">实际生产中的挑战</h3>
                <div v-if="parseNumberedText(selectedCase.production_issues).length > 1" class="space-y-2.5">
                  <div v-for="(item, idx) in parseNumberedText(selectedCase.production_issues)" :key="idx"
                       class="flex gap-3 items-start p-3.5 bg-white rounded-lg border border-gray-100">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-red-50 text-red-500 text-xs font-medium flex items-center justify-center mt-0.5">{{ idx + 1 }}</span>
                    <p class="text-sm text-gray-600 leading-relaxed">{{ item }}</p>
                  </div>
                </div>
                <div v-else class="p-4 bg-white rounded-lg border border-gray-100">
                  <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ selectedCase.production_issues }}</p>
                </div>
              </div>
              <div v-else class="text-center py-12 text-gray-400">
                <p>暂无生产问题记录</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox -->
      <div v-if="lightboxImage" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 cursor-pointer" @click="lightboxImage = null">
        <button @click.stop="lightboxImage = null" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <img :src="lightboxImage" class="max-w-[95vw] max-h-[90vh] object-contain" @click.stop />
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredCases.length === 0" class="text-center py-16">
        <p class="text-gray-400 text-sm">该类别暂无案例</p>
      </div>
    </div>
  `,
  data() {
    return {
      cases: [],
      loading: true,
      selectedCategory: '全部',
      selectedCase: null,
      activeTab: 'background',
      lightboxImage: null,
      tabs: [
        { key: 'background', label: '案例背景' },
        { key: 'principle', label: '技术原理' },
        { key: 'results', label: '示例结果' },
        { key: 'analysis', label: '结果分析' },
        { key: 'production', label: '生产问题' },
      ],
    };
  },
  computed: {
    categories() {
      return ['全部', ...new Set(this.cases.map(c => c.category))];
    },
    filteredCases() {
      if (this.selectedCategory === '全部') return this.cases;
      return this.cases.filter(c => c.category === this.selectedCategory);
    },
  },
  watch: {
    selectedCase(val) {
      this.activeTab = 'background';
      if (!val) this.lightboxImage = null;
    }
  },
  async mounted() {
    try {
      const data = await api.getCases();
      this.cases = Array.isArray(data) ? data : (data.cases || []);
    } catch (e) { console.error(e); }
    this.loading = false;
  },
  methods: {
    viewCase(c) {
      this.selectedCase = c;
    },
    getPrincipleText() {
      if (!this.selectedCase || !this.selectedCase.content) return '暂无技术原理说明。';
      // Extract the technical principle portion from the content (first ~40% of content)
      const content = this.selectedCase.content;
      const midPoint = Math.floor(content.length * 0.6);
      const sentences = content.split(/[。！？]/);
      let principle = '';
      let charCount = 0;
      for (const s of sentences) {
        if (charCount > midPoint) break;
        principle += s + '。';
        charCount += s.length;
      }
      return principle || content;
    },
    getAnalysisText() {
      if (!this.selectedCase || !this.selectedCase.results_text) return '';
      const text = this.selectedCase.results_text;
      // Extract metrics and performance data
      const lines = text.split(/[。！？]/).filter(l =>
        l.includes('%') || l.includes('准确') || l.includes('mAP') ||
        l.includes('F1') || l.includes('精度') || l.includes('召回') ||
        l.includes('FPS') || l.includes('延迟') || l.includes('Dice') ||
        l.includes('PSNR') || l.includes('loss')
      );
      if (lines.length > 0) return lines.join('。\n') + '。';
      return text;
    },
    getCategoryColor(cat) {
      const colors = {
        '图像增强': 'bg-gradient-to-r from-blue-400 to-blue-600',
        '图像压缩': 'bg-gradient-to-r from-purple-400 to-purple-600',
        '工程应用': 'bg-gradient-to-r from-green-400 to-green-600',
        '工业检测': 'bg-gradient-to-r from-amber-400 to-amber-600',
        '目标计数': 'bg-gradient-to-r from-teal-400 to-teal-600',
        '综合应用': 'bg-gradient-to-r from-red-400 to-red-600',
        '深度学习': 'bg-gradient-to-r from-indigo-400 to-indigo-600',
        '智能分类': 'bg-gradient-to-r from-pink-400 to-pink-600',
        '目标检测': 'bg-gradient-to-r from-cyan-400 to-cyan-600',
        '语义分割': 'bg-gradient-to-r from-violet-400 to-violet-600',
        '人脸识别': 'bg-gradient-to-r from-rose-400 to-rose-600',
        'OCR识别': 'bg-gradient-to-r from-orange-400 to-orange-600',
        '自动驾驶': 'bg-gradient-to-r from-lime-400 to-lime-600',
        '风格迁移': 'bg-gradient-to-r from-fuchsia-400 to-fuchsia-600',
        '图像生成': 'bg-gradient-to-r from-sky-400 to-sky-600',
      };
      return colors[cat] || 'bg-gradient-to-r from-gray-400 to-gray-600';
    },
    getBorderColor(cat) {
      const colors = {
        '图像增强': '#60a5fa', '图像压缩': '#a78bfa', '工程应用': '#4ade80',
        '工业检测': '#fbbf24', '目标计数': '#2dd4bf', '综合应用': '#f87171',
        '深度学习': '#818cf8', '智能分类': '#f472b6', '目标检测': '#22d3ee',
        '语义分割': '#a78bfa', '人脸识别': '#fb7185', 'OCR识别': '#fb923c',
        '自动驾驶': '#a3e635', '风格迁移': '#e879f9', '图像生成': '#38bdf8',
      };
      return colors[cat] || '#9ca3af';
    },
    getCategoryBadgeColor(cat) {
      const colors = {
        '图像增强': 'bg-blue-50 text-blue-700',
        '图像压缩': 'bg-purple-50 text-purple-700',
        '工程应用': 'bg-green-50 text-green-700',
        '工业检测': 'bg-amber-50 text-amber-700',
        '目标计数': 'bg-teal-50 text-teal-700',
        '综合应用': 'bg-red-50 text-red-700',
        '深度学习': 'bg-indigo-50 text-indigo-700',
        '智能分类': 'bg-pink-50 text-pink-700',
        '目标检测': 'bg-cyan-50 text-cyan-700',
        '语义分割': 'bg-violet-50 text-violet-700',
        '人脸识别': 'bg-rose-50 text-rose-700',
        'OCR识别': 'bg-orange-50 text-orange-700',
        '自动驾驶': 'bg-lime-50 text-lime-700',
        '风格迁移': 'bg-fuchsia-50 text-fuchsia-700',
        '图像生成': 'bg-sky-50 text-sky-700',
      };
      return colors[cat] || 'bg-gray-50 text-gray-700';
    },
    parseNumberedText(text) {
      if (!text) return [];
      // Strip intro text before first numbered item
      var firstNum = text.search(/[\(（]\d+[\)）]/);
      if (firstNum < 0) return [];
      text = text.substring(firstNum);
      // Split on (1) (2) ... or （1）（2） patterns
      var parts = text.split(/[\(（]\d+[\)）]/);
      var items = [];
      for (var i = 0; i < parts.length; i++) {
        var t = parts[i].replace(/^[\s：:；;，,.。\uff0c\u3002]+|[\s；;，,.。\uff0c\u3002]+$/g, '').trim();
        if (t.length > 5) items.push(t);
      }
      return items;
    },
    parseSections(text) {
      if (!text) return [];
      // Split on section headers like "企业背景:" that appear at line start or after \n
      // Label must be 2-8 Chinese chars, followed by ：or :
      var sections = [];
      var lines = text.split(/\n/);
      var currentLabel = '', currentContent = '';
      var headerRe = /^([\u4e00-\u9fa5]{2,8})[：:]\s*/;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var m = line.match(headerRe);
        if (m) {
          // Save previous section
          if (currentLabel || currentContent) {
            sections.push({ label: currentLabel, content: currentContent.trim() });
          }
          currentLabel = m[1];
          currentContent = line.substring(m[0].length);
        } else {
          currentContent += (currentContent ? '\n' : '') + line;
        }
      }
      if (currentLabel || currentContent) {
        sections.push({ label: currentLabel, content: currentContent.trim() });
      }
      // If no sections found, return as single block
      if (sections.length <= 1 && !sections[0].label) {
        return [{ label: '', content: text }];
      }
      return sections;
    },
  },
};

var CaseDetailView = {
  name: 'CaseDetailView',
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <button @click="$router.push('/student/cases')" class="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        返回案例列表
      </button>
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>
      <div v-else-if="caseData" class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ caseData.title }}</h1>
        <p class="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{{ caseData.description }}</p>
        <div v-if="caseData.content" class="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">{{ caseData.content }}</div>
      </div>
    </div>
  `,
  data() {
    return { caseData: null, loading: true };
  },
  async mounted() {
    try {
      const id = this.$route.params.id;
      this.caseData = await api.getCase(id);
    } catch (e) { console.error(e); }
    this.loading = false;
  },
};
