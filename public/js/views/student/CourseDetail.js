var CourseDetail = {
  name: 'CourseDetail',
  template: `
    <div class="space-y-6">
      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 rounded-lg skeleton-shimmer"></div>
          <div class="space-y-2 flex-1">
            <div class="h-6 w-48 skeleton-shimmer rounded"></div>
            <div class="h-4 w-32 skeleton-shimmer rounded"></div>
          </div>
        </div>
        <div class="border-b border-gray-200 mb-6">
          <div class="flex gap-8">
            <div v-for="n in 4" :key="n" class="h-4 w-16 skeleton-shimmer rounded py-3"></div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-for="n in 4" :key="n" class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <div class="flex items-start justify-between mb-3">
              <div class="h-4 w-32 skeleton-shimmer rounded"></div>
              <div class="h-5 w-12 skeleton-shimmer rounded-full"></div>
            </div>
            <div class="h-3 w-full skeleton-shimmer rounded mb-2"></div>
            <div class="h-3 w-3/4 skeleton-shimmer rounded mb-4"></div>
            <div class="flex items-center justify-between">
              <div class="flex gap-1">
                <div v-for="i in 5" :key="i" class="h-3.5 w-3.5 skeleton-shimmer rounded-full"></div>
              </div>
              <div class="h-6 w-6 skeleton-shimmer rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <template v-else>
      <div class="flex items-center gap-4">
        <button @click="$router.push('/student/courses')"
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
          <svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ chapter.title || '章节详情' }}</h1>
          <p v-if="chapter.subtitle" class="text-sm text-indigo-500">{{ chapter.subtitle }}</p>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Main Content -->
        <div class="flex-1 min-w-0">
          <!-- Tabs -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="flex gap-4 sm:gap-8 overflow-x-auto">
              <button v-for="tab in tabs" :key="tab.key"
                @click="activeTab = tab.key"
                class="py-3 text-sm font-medium border-b-2 transition-colors"
                :class="activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- 知识点 Tab -->
          <div v-if="activeTab === 'knowledge'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="kp in knowledgePoints" :key="kp.id"
              class="rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer"
              @click="toggleKp(kp.id, $event)">
              <div class="flex items-start justify-between mb-2">
                <h4 class="text-sm font-semibold text-gray-900 flex-1">{{ kp.title || kp.name }}</h4>
                <span class="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="categoryClass(kp.category)">{{ kp.category || '基础' }}</span>
              </div>
              <p class="text-xs text-gray-500 line-clamp-2 mb-3">{{ kp.description || '掌握图像处理的核心概念。' }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <svg v-for="i in 5" :key="i" class="h-3.5 w-3.5" :class="i <= (kp.difficulty || 3) ? 'text-amber-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div class="relative h-6 w-6">
                  <svg class="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#e5e7eb" stroke-width="2"/>
                    <circle cx="12" cy="12" r="10" fill="none" :stroke="getMasteryColor(kp)" stroke-width="2"
                      :stroke-dasharray="62.8" :stroke-dashoffset="62.8 - (62.8 * getMastery(kp.id) / 100)" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
              <div v-if="expandedKp === kp.id" class="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div v-if="kp.principle" class="bg-indigo-50 rounded-lg p-3">
                  <p class="text-xs font-medium text-indigo-700 mb-1">原理讲解</p>
                  <p class="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{{ kp.principle }}</p>
                </div>
                <p v-else class="text-xs text-gray-600 whitespace-pre-line">{{ kp.description || '暂无详细描述。' }}</p>
                <div @click.stop v-if="hasAnimation(kp.id)">
                  <button @click="openAnimModal(kp.id, kp.title || kp.name)"
                    class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    </svg>
                    打开交互式动画
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                  </button>
                </div>
                <div v-if="kp.simulations && kp.simulations.length > 0">
                  <p class="text-xs font-medium text-gray-700 mb-2">关联实验:</p>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="sim in kp.simulations" :key="sim.key || sim"
                      @click.stop="$router.push('/student/experiments/' + (sim.key || sim))"
                      class="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                      {{ sim.title || sim.key || sim }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 仿真实验 Tab -->
          <div v-if="activeTab === 'experiments'" class="space-y-4">
            <div v-for="exp in experiments" :key="exp.key || exp.id"
              class="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                  <svg class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900">{{ exp.title || exp.name }}</h4>
                  <p class="text-xs text-gray-500">{{ exp.category || '基础实验' }}</p>
                </div>
              </div>
              <button @click="$router.push('/student/experiments/' + (exp.key || exp.id))"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                进入实验
              </button>
            </div>
            <div v-if="experiments.length === 0" class="text-center py-12 text-gray-400">暂无关联实验</div>
          </div>

          <!-- 原理分析 Tab -->
          <div v-if="activeTab === 'principles'" class="space-y-4">
            <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ chapter.title }} - 原理分析</h3>
              <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {{ chapter.description || '本章将深入讲解相关的数学原理、算法实现以及在实际场景中的应用。' }}
              </p>
            </div>
            <div v-for="kp in knowledgePoints" :key="'principle-'+kp.id"
              class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div class="flex items-center gap-2 mb-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h4 class="text-sm font-semibold text-gray-900">{{ kp.title }}</h4>
                <span class="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="categoryClass(kp.category)">{{ kp.category || '基础' }}</span>
              </div>
              <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {{ kp.principle || kp.description || '暂无原理说明。' }}
              </p>
            </div>
            <div v-if="knowledgePoints.length === 0" class="text-center py-12 text-gray-400">暂无知识点数据</div>
          </div>

          <!-- 学习资源 Tab -->
          <div v-if="activeTab === 'resources'" class="space-y-4">
            <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">课件资源</h4>
              <div class="space-y-2">
                <a v-for="(res, i) in resources" :key="i" :href="res.url" target="_blank"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="flex h-8 w-8 items-center justify-center rounded bg-blue-50">
                    <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-gray-700">{{ res.name }}</p>
                    <p class="text-xs text-gray-400">{{ res.type }}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="lg:w-72 flex-shrink-0">
          <div class="sticky top-4 space-y-4">
            <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">章节进度</h3>
              <div class="text-center mb-4">
                <div class="relative inline-block h-20 w-20">
                  <svg class="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" stroke-width="6"/>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" stroke-width="6"
                      :stroke-dasharray="213.6" :stroke-dashoffset="213.6 - (213.6 * chapterProgress / 100)" stroke-linecap="round"/>
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center text-lg font-bold text-indigo-600">
                    {{ chapterProgress }}%
                  </span>
                </div>
              </div>
              <div class="space-y-2">
                <div v-for="kp in knowledgePoints" :key="'sb-'+kp.id" class="flex items-center justify-between py-1">
                  <span class="text-xs text-gray-600 truncate flex-1">{{ kp.title || kp.name }}</span>
                  <button @click="markComplete(kp.id)"
                    class="ml-2 flex h-5 w-5 items-center justify-center rounded border transition-colors"
                    :class="getMastery(kp.id) >= 80 ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-indigo-400'">
                    <svg v-if="getMastery(kp.id) >= 80" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- Animation Modal -->
      <teleport to="body">
      <div v-if="animModalKp !== null" class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
           @click.self="closeAnimModal">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeAnimModal"></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-auto animate-fade-in">
          <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 rounded-t-xl">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900">{{ animModalTitle }}</h3>
                <p class="text-xs text-gray-500">交互式动画演示</p>
              </div>
            </div>
            <button @click="closeAnimModal"
                    class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-6">
            <concept-animation v-if="animModalKp !== null"
              :kp-id="animModalKp"
              :kp-title="animModalTitle"
              :canvas-width="960"
              :canvas-height="550">
            </concept-animation>
          </div>
        </div>
      </div>
      </teleport>
    </div>
  `,
  data() {
    return {
      loading: true,
      chapter: {},
      knowledgePoints: [],
      experiments: [],
      progress: [],
      activeTab: 'knowledge',
      expandedKp: null,
      animModalKp: null,
      animModalTitle: '',
      tabs: [
        { key: 'knowledge', label: '知识点' },
        { key: 'experiments', label: '仿真实验' },
        { key: 'principles', label: '原理分析' },
        { key: 'resources', label: '学习资源' }
      ],
      resources: []
    };
  },
  computed: {
    chapterProgress() {
      if (this.knowledgePoints.length === 0) return 0;
      const mastered = this.knowledgePoints.filter(kp => this.getMastery(kp.id) >= 80).length;
      return Math.round((mastered / this.knowledgePoints.length) * 100);
    }
  },
  async mounted() {
    await this.loadChapter();
    this._escHandler = (e) => { if (e.key === 'Escape') this.closeAnimModal(); };
    document.addEventListener('keydown', this._escHandler);
  },
  beforeUnmount() {
    if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
    document.body.style.overflow = '';
  },
  watch: {
    '$route.params.id': {
      handler() { this.loadChapter(); },
      immediate: false
    }
  },
  methods: {
    hasAnimation(kpId) {
      return !!(window.__conceptAnimations && window.__conceptAnimations[kpId]);
    },
    async loadChapter() {
      this.loading = true;
      const id = this.$route.params.id;
      try {
        const [chapRes, progRes] = await Promise.allSettled([
          api.getChapter(id),
          api.getMyProgress()
        ]);
        if (chapRes.status === 'fulfilled') {
          this.chapter = chapRes.value.data || chapRes.value || {};
          this.knowledgePoints = this.chapter.knowledge_points || this.chapter.kps || [];
          this.experiments = this.chapter.simulations || this.chapter.experiments || [];
        }
        if (progRes.status === 'fulfilled') {
          this.progress = progRes.value.data || progRes.value || [];
        }
        this.resources = [
          { name: '第' + (this.chapter.chapter_number || '') + '章 课件 PPT', url: '/resources/ch' + id + '.pptx', type: 'PowerPoint 演示文稿' },
          { name: '实验指导书', url: '/resources/ch' + id + '_guide.pdf', type: 'PDF 文档' },
          { name: '参考资料', url: '/resources/ch' + id + '_ref.pdf', type: 'PDF 文档' }
        ];
      } catch (e) {
        console.error('CourseDetail error:', e);
      } finally {
        this.loading = false;
      }
    },
    toggleKp(id, event) {
      if (event && event.target && event.target.closest('.concept-animation')) return;
      this.expandedKp = this.expandedKp === id ? null : id;
    },
    openAnimModal(kpId, title) {
      this.animModalKp = kpId;
      this.animModalTitle = title;
      document.body.style.overflow = 'hidden';
    },
    closeAnimModal() {
      this.animModalKp = null;
      this.animModalTitle = '';
      document.body.style.overflow = '';
    },
    getMastery(kpId) {
      const p = this.progress.find(x => x.knowledge_point_id === kpId || x.kp_id === kpId);
      return p ? (p.mastery_level || 0) : 0;
    },
    getMasteryColor(kp) {
      const m = this.getMastery(kp.id);
      if (m >= 80) return '#10b981';
      if (m >= 40) return '#f59e0b';
      return '#e5e7eb';
    },
    async markComplete(kpId) {
      try {
        await api.updateProgress({ knowledge_point_id: kpId, mastery_level: 100, status: 'mastered' });
        const idx = this.progress.findIndex(x => x.knowledge_point_id === kpId || x.kp_id === kpId);
        if (idx >= 0) this.progress[idx].mastery_level = 100;
        else this.progress.push({ knowledge_point_id: kpId, mastery_level: 100 });
        store.notify('已标记为掌握', 'success');
      } catch (e) {
        store.notify('操作失败', 'error');
      }
    },
    categoryClass(cat) {
      const map = { '基础': 'bg-blue-50 text-blue-700', '进阶': 'bg-amber-50 text-amber-700', '高级': 'bg-rose-50 text-rose-700' };
      return map[cat] || 'bg-gray-50 text-gray-700';
    }
  }
};
