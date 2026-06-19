var ExperimentReport = {
  name: 'ExperimentReport',
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">实验报告</h1>
          <p class="mt-1 text-sm text-gray-500">生成并提交实验报告</p>
        </div>
        <div class="flex gap-3">
          <button @click="previewMode = !previewMode"
            class="rounded-lg px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
            :class="previewMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {{ previewMode ? '编辑模式' : '预览模式' }}
          </button>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-if="!previewMode" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-5">
          <!-- Experiment Select -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">选择实验</label>
            <select v-model="selectedExperiment" @change="onExperimentChange"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option value="">请选择实验...</option>
              <option v-for="exp in experimentOptions" :key="exp.key" :value="exp.key">{{ exp.title }}</option>
            </select>
          </div>

          <!-- Title -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">报告标题</label>
            <input v-model="report.title" type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="实验报告标题"/>
          </div>

          <!-- Parameters Summary -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">实验参数记录</label>
            <textarea v-model="report.parameters" rows="3"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="实验所用参数（可从实验中自动填充）"></textarea>
          </div>

          <!-- Result Images -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-3">实验结果截图</label>
            <div class="grid grid-cols-2 gap-4 mb-3">
              <div class="rounded-lg border border-gray-200 overflow-hidden">
                <img v-if="report.srcImage" :src="report.srcImage" class="w-full h-40 object-cover"/>
                <div v-else class="h-40 bg-gray-50 flex items-center justify-center text-xs text-gray-400">原始图像</div>
              </div>
              <div class="rounded-lg border border-gray-200 overflow-hidden">
                <img v-if="report.dstImage" :src="report.dstImage" class="w-full h-40 object-cover"/>
                <div v-else class="h-40 bg-gray-50 flex items-center justify-center text-xs text-gray-400">处理结果</div>
              </div>
            </div>
            <div class="flex gap-2">
              <label class="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                上传原始图像
                <input type="file" accept="image/*" class="hidden" @change="uploadImage($event, 'src')"/>
              </label>
              <label class="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                上传处理结果
                <input type="file" accept="image/*" class="hidden" @change="uploadImage($event, 'dst')"/>
              </label>
            </div>
          </div>

          <!-- Observations -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">实验观察与分析</label>
            <textarea v-model="report.observations" rows="4"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="描述实验过程中观察到的现象..."></textarea>
          </div>

          <!-- Conclusions -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">实验结论</label>
            <textarea v-model="report.conclusions" rows="4"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="总结实验结论和心得体会..."></textarea>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100 sticky top-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">报告信息</h3>
            <div class="space-y-3 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-500">实验名称:</span>
                <span class="text-gray-800 font-medium">{{ selectedExperiment || '未选择' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">提交人:</span>
                <span class="text-gray-800 font-medium">{{ (store.user && store.user.real_name) || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">学号:</span>
                <span class="text-gray-800 font-medium">{{ (store.user && store.user.student_id) || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">日期:</span>
                <span class="text-gray-800 font-medium">{{ todayDate }}</span>
              </div>
            </div>
            <button @click="submitReport" :disabled="submitting"
              class="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2">
              <svg v-if="submitting" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8"/>
              </svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ submitting ? '提交中...' : '提交报告' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Mode -->
      <div v-else class="max-w-3xl mx-auto">
        <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
            <h2 class="text-2xl font-bold">{{ report.title || '实验报告' }}</h2>
            <p class="text-indigo-200 mt-2">{{ (store.user && store.user.real_name) || '' }} · {{ (store.user && store.user.student_id) || '' }} · {{ todayDate }}</p>
          </div>
          <div class="p-8 space-y-6">
            <section>
              <h3 class="text-base font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">一、实验名称</h3>
              <p class="text-sm text-gray-600">{{ selectedExperiment || '（未选择）' }}</p>
            </section>
            <section>
              <h3 class="text-base font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">二、实验参数</h3>
              <p class="text-sm text-gray-600 whitespace-pre-line">{{ report.parameters || '（无参数记录）' }}</p>
            </section>
            <section>
              <h3 class="text-base font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">三、实验结果</h3>
              <div v-if="report.srcImage || report.dstImage" class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-500 mb-1">原始图像</p>
                  <img v-if="report.srcImage" :src="report.srcImage" class="w-full rounded-lg border"/>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1">处理结果</p>
                  <img v-if="report.dstImage" :src="report.dstImage" class="w-full rounded-lg border"/>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400">（未附截图）</p>
            </section>
            <section>
              <h3 class="text-base font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">四、实验观察</h3>
              <p class="text-sm text-gray-600 whitespace-pre-line">{{ report.observations || '（无观察记录）' }}</p>
            </section>
            <section>
              <h3 class="text-base font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">五、实验结论</h3>
              <p class="text-sm text-gray-600 whitespace-pre-line">{{ report.conclusions || '（无结论）' }}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      selectedExperiment: '',
      previewMode: false,
      submitting: false,
      experimentOptions: [],
      report: {
        title: '',
        parameters: '',
        srcImage: '',
        dstImage: '',
        observations: '',
        conclusions: ''
      },
      todayDate: ''
    };
  },
  mounted() {
    const now = new Date();
    this.todayDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    this.loadExperiments();
  },
  methods: {
    loadExperiments() {
      try {
        if (window.ExperimentConfig) {
          this.experimentOptions = Object.keys(window.ExperimentConfig).map(key => ({
            key: key,
            title: window.ExperimentConfig[key].title || key
          }));
        }
      } catch (e) {
        this.experimentOptions = [];
      }
    },
    onExperimentChange() {
      const exp = this.experimentOptions.find(e => e.key === this.selectedExperiment);
      if (exp) {
        this.report.title = exp.title + ' 实验报告';
        const config = window.ExperimentConfig ? window.ExperimentConfig[this.selectedExperiment] : null;
        if (config && config.parameters) {
          this.report.parameters = config.parameters.map(p => p.label + ': ' + (p.default || p.min)).join('\n');
        }
      }
    },
    uploadImage(e, type) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'src') this.report.srcImage = ev.target.result;
        else this.report.dstImage = ev.target.result;
      };
      reader.readAsDataURL(file);
    },
    async submitReport() {
      if (!this.selectedExperiment) {
        store.notify('请选择实验', 'error');
        return;
      }
      if (!this.report.title) {
        store.notify('请填写报告标题', 'error');
        return;
      }
      this.submitting = true;
      try {
        await api.submitAssignment({
          type: 'report',
          experiment_key: this.selectedExperiment,
          title: this.report.title,
          parameters: this.report.parameters,
          src_image: this.report.srcImage,
          dst_image: this.report.dstImage,
          observations: this.report.observations,
          conclusions: this.report.conclusions
        });
        store.notify('报告提交成功', 'success');
        this.previewMode = false;
      } catch (e) {
        store.notify('提交失败: ' + (e.message || '未知错误'), 'error');
      } finally {
        this.submitting = false;
      }
    }
  }
};
