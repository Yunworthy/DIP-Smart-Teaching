var ExperimentLab = {
  name: 'ExperimentLab',
  template: `
    <div class="space-y-6">
      <!-- ==================== EXPERIMENT LIST VIEW ==================== -->
      <div v-if="!currentKey">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">编程实验室</h1>
            <p class="mt-1 text-sm text-gray-500">编写Python或MATLAB代码完成图像处理实验，支持AI辅助编程</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded font-medium">Python</span>
            <span class="px-2 py-1 bg-orange-50 text-orange-600 rounded font-medium">Octave/MATLAB</span>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>

        <div v-else class="space-y-8">
          <div v-for="(group, chapter) in groupedExperiments" :key="chapter">
            <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span class="inline-block h-5 w-1 rounded bg-indigo-500"></span>
              {{ chapter }}
              <span class="text-xs text-gray-400 font-normal">({{ group.length }})</span>
            </h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="exp in group" :key="exp.sim_key"
                class="group rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all cursor-pointer card-lift"
                @click="loadExperiment(exp.sim_key)">
                <div class="h-32 relative overflow-hidden flex items-center justify-center"
                  :class="'exp-cover-ch' + (exp.chapter_id || 1)">
                  <img v-if="exp.sample_image" :src="'/' + exp.sample_image" class="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <span class="text-6xl font-bold text-white/20 select-none">{{ exp.title.charAt(0) }}</span>
                  <span class="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/90 backdrop-blur-sm"
                    :class="catClass(exp.category)">{{ catLabel(exp.category) }}</span>
                  <span class="absolute bottom-2 left-2 text-[10px] text-white/70">
                    <span v-for="s in (exp.difficulty || 2)" :key="s">★</span>
                  </span>
                </div>
                <div class="p-4">
                  <h3 class="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-700">{{ exp.title }}</h3>
                  <p class="text-xs text-gray-500 line-clamp-2 mb-3">{{ exp.description }}</p>
                  <button @click.stop="loadExperiment(exp.sim_key)"
                    class="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                    开始编程
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== EXPERIMENT DETAIL VIEW ==================== -->
      <div v-else class="space-y-5">
        <!-- Header -->
        <div class="flex items-center gap-4 flex-wrap">
          <button @click="goBack"
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50">
            <svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl font-bold text-gray-900">{{ experiment.title }}</h1>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="catClass(experiment.category)">{{ catLabel(experiment.category) }}</span>
              <span class="text-xs text-amber-500">
                <span v-for="s in (experiment.difficulty || 2)" :key="s">★</span>
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ experiment.chapter_title }}</p>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="flex flex-col xl:flex-row gap-5">
          <!-- LEFT COLUMN: Info + Image + AI -->
          <div class="xl:w-96 flex-shrink-0 space-y-4">
            <!-- Source Image -->
            <div class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-900">输入图像</h3>
                <div class="flex gap-1">
                  <label class="cursor-pointer text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">
                    上传<input type="file" accept="image/*" class="hidden" @change="handleUpload"/>
                  </label>
                  <button @click="loadSample" class="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">样例</button>
                </div>
              </div>
              <div class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50" style="aspect-ratio:4/3">
                <img v-if="sourceImageUrl" :src="sourceImageUrl" class="w-full h-full object-contain"/>
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">请上传图像或加载样例</div>
              </div>
              <p v-if="sourceImageName" class="text-[10px] text-gray-400 mt-1 truncate">{{ sourceImageName }}</p>
            </div>

            <!-- Experiment Info (collapsible) -->
            <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <button @click="showInfo = !showInfo" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <h3 class="text-sm font-semibold text-gray-900">实验说明</h3>
                <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':showInfo}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="showInfo" class="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                <div v-if="experiment.requirements">
                  <p class="text-[10px] font-medium text-indigo-600 uppercase mb-1">实验要求</p>
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ experiment.requirements }}</p>
                </div>
                <div v-if="experiment.description">
                  <p class="text-[10px] font-medium text-indigo-600 uppercase mb-1">实验描述</p>
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ experiment.description }}</p>
                </div>
                <div v-if="experiment.case_text">
                  <p class="text-[10px] font-medium text-indigo-600 uppercase mb-1">应用场景</p>
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ experiment.case_text }}</p>
                </div>
              </div>
            </div>

            <!-- AI Hints Panel (collapsible) -->
            <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <button @click="showAIHints = !showAIHints" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  <h3 class="text-sm font-semibold text-gray-900">AI编程辅助</h3>
                </div>
                <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':showAIHints}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="showAIHints" class="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                <div v-if="aiHints && aiHints.prompt">
                  <p class="text-[10px] font-medium text-amber-600 uppercase mb-1">推荐Prompt（复制到AI工具使用）</p>
                  <div class="bg-amber-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed relative">
                    <p class="whitespace-pre-line">{{ aiHints.prompt }}</p>
                    <button @click="copyPrompt" class="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-white rounded border border-amber-200 text-amber-600 hover:bg-amber-50">复制</button>
                  </div>
                </div>
                <div v-if="aiHints && aiHints.apis && aiHints.apis.length">
                  <p class="text-[10px] font-medium text-amber-600 uppercase mb-1">关键API</p>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="a in aiHints.apis" :key="a" class="text-[10px] px-2 py-0.5 bg-gray-100 rounded font-mono text-gray-600">{{ a }}</span>
                  </div>
                </div>
                <div v-if="aiHints && aiHints.tips && aiHints.tips.length">
                  <p class="text-[10px] font-medium text-amber-600 uppercase mb-1">常见错误</p>
                  <ul class="text-xs text-gray-600 space-y-1">
                    <li v-for="(t,i) in aiHints.tips" :key="i" class="flex items-start gap-1.5">
                      <span class="text-red-400 mt-0.5">●</span><span>{{ t }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="aiHints && aiHints.approach">
                  <p class="text-[10px] font-medium text-amber-600 uppercase mb-1">实现思路</p>
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ aiHints.approach }}</p>
                </div>
              </div>
            </div>

            <!-- Knowledge Points -->
            <div v-if="experiment.knowledge_points && experiment.knowledge_points.length" class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <h3 class="text-sm font-semibold text-gray-900 mb-2">关联知识点</h3>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="kp in experiment.knowledge_points" :key="kp.id" class="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">{{ kp.title }}</span>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Code + Results -->
          <div class="flex-1 min-w-0 space-y-4">
            <!-- Code Editor -->
            <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <!-- Language Tabs -->
              <div class="flex items-center border-b border-gray-100 px-4">
                <button @click="switchLanguage('python')"
                  class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  :class="language === 'python' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
                  Python
                </button>
                <button @click="switchLanguage('octave')"
                  class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  :class="language === 'octave' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
                  Octave/MATLAB
                </button>
                <div class="flex-1"></div>
                <button @click="copyCode" class="text-xs text-gray-400 hover:text-gray-600 p-2" title="复制代码">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
                <button @click="resetCode" class="text-xs text-gray-400 hover:text-gray-600 p-2" title="重置为模板">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
              </div>
              <!-- Editor -->
              <code-editor ref="editor" :value="code" :language="language" @input="onCodeInput"></code-editor>
            </div>

            <!-- Run Button Bar -->
            <div class="flex items-center gap-3">
              <button @click="runCode" :disabled="running"
                class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2">
                <svg v-if="!running" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                </svg>
                <svg v-else class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ running ? '运行中...' : '运行代码' }}
              </button>
              <span v-if="runResult && runResult.executionTime" class="text-xs text-gray-400">耗时 {{ runResult.executionTime.toFixed(1) }}s</span>
              <span v-if="runResult && runResult.exitCode === 0" class="text-xs text-emerald-600 font-medium">✓ 成功</span>
              <span v-else-if="runResult && runResult.exitCode !== 0" class="text-xs text-red-600 font-medium">✗ 失败</span>
            </div>

            <!-- Results Area -->
            <div v-if="runResult" class="space-y-4">
              <!-- Output Images -->
              <div v-if="runResult.images && runResult.images.length > 0" class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">输出图像 ({{ runResult.images.length }})</h3>
                <div class="grid gap-3" :class="runResult.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'">
                  <div v-for="(img, idx) in runResult.images" :key="idx" class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img :src="img.data" :alt="img.name" class="w-full object-contain" style="max-height:400px"/>
                    <p class="text-[10px] text-gray-400 text-center py-1">{{ img.name }}</p>
                  </div>
                </div>
              </div>

              <!-- Console Output -->
              <div class="rounded-xl bg-gray-900 shadow-sm overflow-hidden">
                <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
                  <div class="flex gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  </div>
                  <span class="text-xs text-gray-400 font-medium">控制台输出</span>
                </div>
                <div class="p-4 font-mono text-xs max-h-64 overflow-auto">
                  <pre v-if="runResult.stdout" class="text-green-400 whitespace-pre-wrap">{{ runResult.stdout }}</pre>
                  <pre v-if="runResult.stderr" class="text-red-400 whitespace-pre-wrap mt-2">{{ runResult.stderr }}</pre>
                  <p v-if="!runResult.stdout && !runResult.stderr" class="text-gray-500">无输出</p>
                </div>
              </div>
            </div>

            <!-- Submit Experiment -->
            <div class="flex justify-end">
              <button @click="showSubmitModal = true"
                class="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 inline-flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                提交实验
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SUBMIT MODAL ==================== -->
      <div v-if="showSubmitModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showSubmitModal = false">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">提交实验结果</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">实验总结</label>
              <textarea v-model="submitSummary" rows="4"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="描述你的实验方法、参数选择和实验发现..."></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showSubmitModal = false" class="rounded-lg px-4 py-2 text-sm text-gray-700 border border-gray-200 hover:bg-gray-50">取消</button>
            <button @click="submitExperiment" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">提交</button>
          </div>
        </div>
      </div>
    </div>
  `,

  data: function() {
    return {
      // List
      experiments: [],
      loading: true,
      // Detail
      currentKey: null,
      experiment: {},
      // Code
      language: 'python',
      code: '',
      pythonTemplate: '',
      octaveTemplate: '',
      // Image
      sourceImageBase64: '',
      sourceImageUrl: '',
      sourceImageName: '',
      // Execution
      running: false,
      runResult: null,
      // AI hints
      aiHints: null,
      // UI
      showInfo: true,
      showAIHints: false,
      showSubmitModal: false,
      submitSummary: ''
    };
  },

  computed: {
    groupedExperiments: function() {
      var groups = {};
      this.experiments.forEach(function(exp) {
        var ch = exp.chapter_title || ('第' + exp.chapter_id + '章');
        if (!groups[ch]) groups[ch] = [];
        groups[ch].push(exp);
      });
      return groups;
    }
  },

  methods: {
    catClass: function(cat) {
      var map = { basic: 'bg-blue-50 text-blue-600', design: 'bg-purple-50 text-purple-600', algorithm: 'bg-emerald-50 text-emerald-600', comprehensive: 'bg-amber-50 text-amber-600' };
      return map[cat] || 'bg-gray-50 text-gray-600';
    },
    catLabel: function(cat) {
      var map = { basic: '基础', design: '设计', algorithm: '算法', comprehensive: '综合' };
      return map[cat] || cat || '基础';
    },

    // ---- Load experiments from API ----
    loadExperimentList: function() {
      var self = this;
      self.loading = true;
      api.getSimulations().then(function(data) {
        self.experiments = data;
        self.loading = false;
      }).catch(function() { self.loading = false; });
    },

    // ---- Load single experiment detail ----
    loadExperiment: function(key) {
      var self = this;
      self.currentKey = key;
      self.runResult = null;
      api.getSimulation(key).then(function(sim) {
        self.experiment = sim;
        self.pythonTemplate = sim.python_template || '# TODO: 编写Python代码\n';
        self.octaveTemplate = sim.matlab_template || '% TODO: 编写Octave/MATLAB代码\n';
        self.code = self.language === 'python' ? self.pythonTemplate : self.octaveTemplate;
        self.aiHints = sim.ai_hints || null;
        self.showInfo = true;
        self.showAIHints = false;
        // Load sample image if available
        if (sim.sample_image) {
          self.loadSampleImage(sim.sample_image);
        } else {
          self.sourceImageBase64 = '';
          self.sourceImageUrl = '';
          self.sourceImageName = '';
        }
        // Refresh editor after DOM update
        self.$nextTick(function() {
          if (self.$refs.editor && self.$refs.editor.refresh) {
            self.$refs.editor.refresh();
          }
        });
      }).catch(function(err) {
        console.error('Load experiment error:', err);
      });
    },

    goBack: function() {
      this.currentKey = null;
      this.experiment = {};
      this.code = '';
      this.runResult = null;
      this.sourceImageBase64 = '';
      this.sourceImageUrl = '';
    },

    // ---- Language switching ----
    switchLanguage: function(lang) {
      this.language = lang;
      this.code = lang === 'python' ? this.pythonTemplate : this.octaveTemplate;
      var self = this;
      this.$nextTick(function() {
        if (self.$refs.editor) {
          self.$refs.editor.setValue(self.code);
          self.$refs.editor.refresh();
        }
      });
    },

    onCodeInput: function(val) {
      this.code = val;
    },

    resetCode: function() {
      this.code = this.language === 'python' ? this.pythonTemplate : this.octaveTemplate;
      if (this.$refs.editor) this.$refs.editor.setValue(this.code);
    },

    copyCode: function() {
      var code = this.$refs.editor ? this.$refs.editor.getValue() : this.code;
      navigator.clipboard.writeText(code).then(function() {
        if (window.store) store.notify('代码已复制到剪贴板', 'success');
      });
    },

    copyPrompt: function() {
      if (this.aiHints && this.aiHints.prompt) {
        navigator.clipboard.writeText(this.aiHints.prompt).then(function() {
          if (window.store) store.notify('Prompt已复制，粘贴到AI工具中使用', 'success');
        });
      }
    },

    // ---- Image handling ----
    handleUpload: function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var self = this;
      var reader = new FileReader();
      reader.onload = function(ev) {
        self.sourceImageBase64 = ev.target.result;
        self.sourceImageUrl = ev.target.result;
        self.sourceImageName = file.name;
      };
      reader.readAsDataURL(file);
    },

    loadSample: function() {
      var sim = this.experiment;
      if (sim && sim.sample_image) {
        this.loadSampleImage(sim.sample_image);
      } else {
        if (window.store) store.notify('该实验无样例图像', 'error');
      }
    },

    loadSampleImage: function(samplePath) {
      var self = this;
      // Convert assets/samples/xxx to /images/samples/xxx
      var url = samplePath.replace('assets/', '/images/');
      fetch(url).then(function(res) {
        if (!res.ok) throw new Error('Failed to load sample');
        return res.blob();
      }).then(function(blob) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          self.sourceImageBase64 = ev.target.result;
          self.sourceImageUrl = ev.target.result;
          self.sourceImageName = samplePath.split('/').pop();
        };
        reader.readAsDataURL(blob);
      }).catch(function() {
        if (window.store) store.notify('样例图像加载失败', 'error');
      });
    },

    // ---- Code execution ----
    runCode: function() {
      var self = this;
      if (!this.sourceImageBase64) {
        if (window.store) store.notify('请先上传或加载样例图像', 'error');
        return;
      }
      var code = this.$refs.editor ? this.$refs.editor.getValue() : this.code;
      if (!code.trim()) {
        if (window.store) store.notify('请先编写代码', 'error');
        return;
      }

      this.running = true;
      this.runResult = null;

      api.runCode({
        code: code,
        language: this.language,
        imageData: this.sourceImageBase64,
        simulationKey: this.currentKey
      }).then(function(result) {
        self.runResult = result;
        self.running = false;
        if (result.exitCode === 0) {
          if (window.store) store.notify('代码执行成功', 'success');
        } else {
          if (window.store) store.notify('代码执行出错，请查看控制台输出', 'error');
        }
      }).catch(function(err) {
        self.running = false;
        self.runResult = { stdout: '', stderr: err.message, images: [], exitCode: -1, executionTime: 0 };
      });
    },

    // ---- Submit experiment ----
    submitExperiment: function() {
      var self = this;
      var code = this.$refs.editor ? this.$refs.editor.getValue() : this.code;
      api.submitAssignment({
        content: this.submitSummary,
        simulation_result: JSON.stringify({
          language: this.language,
          code: code,
          result: this.runResult
        }),
        simulation_key: this.currentKey,
        type: 'lab_report'
      }).then(function() {
        self.showSubmitModal = false;
        self.submitSummary = '';
        if (window.store) store.notify('实验结果已提交', 'success');
      }).catch(function(err) {
        if (window.store) store.notify('提交失败: ' + err.message, 'error');
      });
    }
  },

  mounted: function() {
    // Check if route has a key param
    if (this.$route && this.$route.params && this.$route.params.key) {
      this.loadExperiment(this.$route.params.key);
    } else {
      this.loadExperimentList();
    }
  }
};
