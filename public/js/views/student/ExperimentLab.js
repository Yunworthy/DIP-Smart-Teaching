var ExperimentLab = {
  name: 'ExperimentLab',
  template: `
    <div class="space-y-6">
      <!-- ==================== EXPERIMENT LIST VIEW ==================== -->
      <div v-if="!currentKey">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">编程实验室</h1>
            <p class="mt-1 text-sm text-gray-500">编写Python或MATLAB代码完成图像处理实验，支持AI辅助编程</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded font-medium">Python</span>
            <span class="px-2 py-1 bg-orange-50 text-orange-600 rounded font-medium">Octave/MATLAB</span>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex gap-1 mb-6 border-b border-gray-200">
          <button @click="labTab='sim'"
            class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
            :class="labTab==='sim' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            仿真实验
          </button>
          <button @click="labTab='course'"
            class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
            :class="labTab==='course' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            课内实验
          </button>
        </div>

        <!-- ====== SIM EXPERIMENTS (existing) ====== -->
        <div v-if="labTab==='sim'">
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

        <!-- ====== COURSE EXPERIMENTS ====== -->
        <div v-if="labTab==='course'">
          <div class="mb-5 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p class="text-sm text-amber-800">
              课内实验需按照实验指导书要求独立完成，每个实验提供编程环境和实验指导。完成后可提交实验报告。
            </p>
          </div>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div v-for="exp in courseExperiments" :key="exp.id"
              class="group rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all">
              <div class="h-28 relative overflow-hidden flex items-end p-5 bg-gradient-to-br from-slate-600 to-slate-800">
                <span class="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-medium bg-white/20 text-white backdrop-blur-sm">{{ exp.hours }}</span>
                <span class="text-5xl font-black text-white/10 absolute right-4 -bottom-2 select-none">{{ exp.num }}</span>
                <div>
                  <span class="text-[10px] text-slate-300 font-medium">实验{{ exp.num }}</span>
                  <h3 class="text-base font-bold text-white mt-0.5 group-hover:text-indigo-200 transition-colors">{{ exp.title }}</h3>
                </div>
              </div>
              <div class="p-4">
                <p class="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">{{ exp.description }}</p>
                <button @click="openCourseExp(exp)"
                  class="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                  开始编程
                </button>
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
              <span v-if="!isCourseExp" class="text-xs px-2 py-0.5 rounded-full font-medium" :class="catClass(experiment.category)">{{ catLabel(experiment.category) }}</span>
              <span v-if="!isCourseExp" class="text-xs text-amber-500">
                <span v-for="s in (experiment.difficulty || 2)" :key="s">★</span>
              </span>
              <span v-if="isCourseExp" class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">课内实验 · {{ experiment.hours }}</span>
            </div>
            <p v-if="!isCourseExp" class="text-xs text-gray-500 mt-0.5">{{ experiment.chapter_title }}</p>
            <p v-else class="text-xs text-gray-500 mt-0.5">数字图像处理A · 实验指导书</p>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="flex flex-col xl:flex-row gap-5">
          <!-- LEFT COLUMN -->
          <div class="xl:w-[420px] flex-shrink-0 space-y-4">

            <!-- ======= Course Experiment Guidance Panels ======= -->
            <template v-if="isCourseExp">
              <!-- Purpose -->
              <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <button @click="toggleGuide('purpose')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                    <h3 class="text-sm font-semibold text-gray-900">实验目的</h3>
                  </div>
                  <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':guideExpanded.purpose}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div v-if="guideExpanded.purpose" class="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ experiment.purpose }}</p>
                </div>
              </div>

              <!-- Content -->
              <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <button @click="toggleGuide('content')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">2</span>
                    <h3 class="text-sm font-semibold text-gray-900">实验内容</h3>
                  </div>
                  <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':guideExpanded.content}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div v-if="guideExpanded.content" class="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                  <div v-for="(item, idx) in experiment.content" :key="idx" class="flex gap-3 text-xs text-gray-600 leading-relaxed">
                    <span class="flex-shrink-0 w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{{ idx + 1 }}</span>
                    <span>{{ item }}</span>
                  </div>
                </div>
              </div>

              <!-- Principle -->
              <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <button @click="toggleGuide('principle')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">3</span>
                    <h3 class="text-sm font-semibold text-gray-900">实验原理</h3>
                  </div>
                  <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':guideExpanded.principle}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div v-if="guideExpanded.principle" class="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ experiment.principle }}</p>
                </div>
              </div>

              <!-- MATLAB Reference -->
              <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <button @click="toggleGuide('matlabRef')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">4</span>
                    <h3 class="text-sm font-semibold text-gray-900">参考函数</h3>
                  </div>
                  <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':guideExpanded.matlabRef}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div v-if="guideExpanded.matlabRef" class="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div class="bg-gray-50 rounded-lg p-3 font-mono text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{{ experiment.matlabRef }}</div>
                </div>
              </div>

              <!-- Requirements -->
              <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <button @click="toggleGuide('requirements')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">5</span>
                    <h3 class="text-sm font-semibold text-gray-900">实验要求</h3>
                  </div>
                  <svg class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180':guideExpanded.requirements}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div v-if="guideExpanded.requirements" class="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{{ experiment.requirements }}</p>
                </div>
              </div>
            </template>

            <!-- ======= Sim Experiment Panels (existing) ======= -->
            <template v-if="!isCourseExp">
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
            </template>

            <!-- ======= Shared: Image upload for course experiments ======= -->
            <div v-if="isCourseExp" class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-900">输入图像</h3>
                <label class="cursor-pointer text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">
                  上传<input type="file" accept="image/*" class="hidden" @change="handleUpload"/>
                </label>
              </div>
              <div class="rounded-lg overflow-hidden border border-gray-200 bg-gray-50" style="aspect-ratio:4/3">
                <img v-if="sourceImageUrl" :src="sourceImageUrl" class="w-full h-full object-contain"/>
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">请上传待处理的图像</div>
              </div>
              <p v-if="sourceImageName" class="text-[10px] text-gray-400 mt-1 truncate">{{ sourceImageName }}</p>
            </div>
          </div>

          <!-- RIGHT COLUMN: Code + Results (shared) -->
          <div class="flex-1 min-w-0 space-y-4">
            <!-- Code Editor -->
            <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <!-- Language Tabs & Toolbar -->
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
                <button @click="enableEdit" class="text-xs px-2 py-1 mr-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 font-medium" title="点击编辑代码">
                  ✏️ 编辑代码
                </button>
                <button @click="copyCode" class="text-xs text-gray-400 hover:text-gray-600 p-2" title="复制代码">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
                <button @click="resetCode" class="text-xs text-gray-400 hover:text-gray-600 p-2" title="重置为模板">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
              </div>
              <!-- Native textarea editor — guaranteed editable -->
              <div ref="editorContainer" class="code-editor-container">
                <textarea ref="codeArea"
                  :value="code"
                  @input="code = $event.target.value"
                  @keydown.tab.prevent="insertTab"
                  class="lab-code-textarea"
                  spellcheck="false"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  placeholder="在此输入或修改代码..."></textarea>
              </div>
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
      // Tab
      labTab: 'sim',
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
      submitSummary: '',
      // Course experiment guide panels
      guideExpanded: {
        purpose: true,
        content: true,
        principle: false,
        matlabRef: false,
        requirements: true
      },
      // Course experiments data
      courseExperiments: [
        {
          id: 'course-exp1',
          num: '一',
          title: '图像的输入输出、表示及评价',
          hours: '2学时',
          description: '学习数字图像的计算机描述和存储格式，熟悉MATLAB环境下图像的类型及其转换，熟练掌握图像输入输出的基本技术。学习图像统计指标的计算，研究采样、量化分辨率对图像质量的影响。',
          purpose: '1. 学习数字图像的计算机描述和存储格式，熟悉MATLAB环境下图像的类型及其转换，熟练掌握图像输入输出的基本技术。\n2. 学习图像统计指标的计算、熟悉各项指标在图像处理中的意义。\n3. 研究图像采样、量化分辨率对图像质量的影响。',
          content: [
            '熟悉MATLAB图像处理环境，应用MATLAB图像处理环境完成图像的输入输出。从外部存储器/计算机内存输入一幅彩色图像，将其变换成索引图像、灰度图像、二值图像，并在同一画面输出四幅图像。',
            '从外部存储器/计算机内存输入一幅灰度图像，变成索引图像、彩色图像并输出。',
            '计算彩色图像、索引图像、灰度图像、二值图像的大小，计算存储空间、灰度平均值、灰度标准差、自协方差、相关系数。',
            '选定一幅灰度图像，设计不同的采样标准，分析采样标准对图像质量的影响。例如一幅M*N的图像，分别以1/2M*N、1/4M*N、1/8M*N等采样。',
            '选定一幅图像，设计不同的量化标准，比较不同量化标准对图像质量的影响。例如，分别采用256、128、32、16等灰度级量化一幅图像。'
          ],
          principle: '图像的表示：数字图像分为彩色图像、索引图像、灰度图像、二值图像。\n\n彩色图像使用红、绿、蓝三种颜色表示。每种颜色分为256级，每级使用8位表示，共用24位表示一个像素，可以描述1677万种色彩。\n\n索引图像能表示256种颜色，每种色彩使用24位表示，以索引矩阵的方式存储，占用256*24的空间，图像以8位表示一个像素。\n\n灰度图像只含亮度信息，每个像素用8位二进制数表示；二值图像只含两种信息，黑和白，只用一位二进制数表示一个像素。\n\n不同类型图像之间的转换：彩色图像可以转换为索引图像，按照索引矩阵以最接近颜色替换完成。彩色图像、索引图像转换为灰度图像只保留亮度信息。彩色、索引、灰度图像转换为二值图像采用阈值分割的方法。灰度图像转换成彩色图像采用索引的方式。\n\n采样、量化原理：对于连续图像f(x,y)进行采样量化变成数字图像，分两步进行：首先在空间上对图像进行采样，将空间连续的图像转换成离散的像素集合；第二步对每一个像素的亮度进行量化处理，使得像素函数成为可以用二进制数表示的整数。采样、量化的过程会产生误差，影响图像质量。\n\n描述图像的统计参数：图像的大小M*N，灰度平均值，灰度标准差，图像的相关系数。',
          matlabRef: 'imread(\'name\')          — 读取图像\nimshow()                 — 显示图像\nsubimage / subplot       — 显示多幅图像\n[m,n] = size(I)          — 求图像大小\nImfinfo                  — 了解图像信息\nimpixel                  — 确定像素值\nmean2                    — 计算灰度平均值\nstd2                     — 计算灰度标准差\nrgb2gray(RGB)            — RGB转灰度\ngray2ind(I,n)            — 灰度转索引\nind2gray(x,map)          — 索引转灰度\nrgb2ind(RGB,n)           — RGB转索引\nind2rgb(x,map)           — 索引转RGB\nim2bw(I,level)           — 灰度转二值\nim2bw(RGB,level)         — 彩色转二值\nimagesc(I,[0,256])       — 灰度图像缩放显示\ncolormap(gray)           — 灰度调色板',
          requirements: '1. 进实验室前必须设计好程序。\n2. 认真调试，记录结果。\n3. 实验报告必须有实验结论分析。',
          pythonTemplate: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom PIL import Image\n\n# ===== 实验一：图像的输入输出、表示及评价 =====\n\n# 1. 读取图像并进行类型转换\n# TODO: 读取彩色图像，转换为灰度图、索引图、二值图\n# 提示: Image.open() / img.convert(\'L\') / img.convert(\'1\')\n\n\n# 2. 计算图像统计参数\n# TODO: 计算图像大小、灰度平均值、标准差、相关系数\n# 提示: np.mean() / np.std() / np.corrcoef()\n\n\n# 3. 不同采样率对图像质量的影响\n# TODO: 对图像进行1/2、1/4、1/8采样\n# 提示: img.resize()\n\n\n# 4. 不同量化级别对图像质量的影响\n# TODO: 分别用256、128、32、16级量化\n# 提示: (img // levels) * (256 // levels)\n\n\nplt.tight_layout()\nplt.show()\n',
          octaveTemplate: '% ===== 实验一：图像的输入输出、表示及评价 =====\n\n% 1. 读取图像并进行类型转换\n% TODO: 读取彩色图像，转换为灰度图、索引图、二值图\n% 提示: imread() / rgb2gray() / gray2ind() / im2bw()\n\n\n% 2. 计算图像统计参数\n% TODO: 计算图像大小、灰度平均值、标准差\n% 提示: size() / mean2() / std2() / imfinfo()\n\n\n% 3. 不同采样率对图像质量的影响\n% TODO: 对图像进行1/2、1/4、1/8采样\n% 提示: I(1:2:end, 1:2:end)\n\n\n% 4. 不同量化级别对图像质量的影响\n% TODO: 分别用256、128、32、16级量化\n% 提示: floor(double(I)/levels)*levels\n\n\n'
        },
        {
          id: 'course-exp2',
          num: '二',
          title: '图像增强与几何运算',
          hours: '2学时',
          description: '熟练掌握图像的灰度变换增强、直方图处理、平滑滤波、锐化处理的原理和应用。掌握图像的旋转、缩放、剪切等几何操作，以及图像的加减乘除运算。',
          purpose: '1. 熟练掌握图像的灰度变换增强，二维滤波增强，锐化处理的原理。\n2. 自如的应用MATLAB环境对图像进行灰度变换、直方图处理，平滑处理，锐化处理。\n3. 熟练掌握图像的几何操作原理，图像几何变换的程序设计技术，可以按要求完成对任意图像几何变换。',
          content: [
            '对已知图像作灰度变换增强，求出图像的直方图，将原图像亮度提高20和降低40后再作直方图，在同一画面输出。',
            '作出已知图像的直方图，对图像进行直方图修正（均衡化），分析修正结果。',
            '利用线性函数、对数函数、幂函数对图像进行处理，分析不同变换函数对同一图像处理的结果。',
            '对图像进行反转、拉伸、gamma校正等处理，分析几种不同处理的结果。',
            '设计程序将已知图像添加椒盐噪声，分别用均匀滤波和中值滤波处理，与原图像在同一画面输出，分析结果。',
            '设计程序求出已知图像中目标物的轮廓，与原图像在同一画面输出。',
            '对图像进行锐化处理。',
            '图像旋转40度后与原图像在同一画面输出。',
            '图像缩小到1/3后与原图像在同一画面输出。',
            '图像放大3倍后与原图像在同一画面输出。',
            '从已知图像中剪切出指定区域后与原图像在同一画面输出。',
            '分别对两幅不同的图像进行加减乘除运算，分析结果。'
          ],
          principle: '灰度变换：灰度变换是直接对像素进行处理，常用三种基本函数——线性函数、对数函数、幂函数。可以完成图像的反转、拉伸、gamma校正等，改变图像对比度、增加灰度宽度。\n\n直方图校正：直方图是图像的灰度概率统计图，修改直方图可以改变图像灰度分布状态，从而改变图像对比度。\n\n图像滤波器：图像滤波器实质上是一种离散卷积处理，也叫掩膜操作。通过使用不同模板获得不同结果。平滑模板使图像模糊但可消除噪声，锐化模板可以提高线、点的立体效果从而实现图像分割的功能。\n\n图像几何运算：图像的几何运算又称几何变换，用于使原始图像产生大小、形式和位置等变换效果。包括图像的平移、旋转、镜像、转置、缩放等。',
          matlabRef: 'imadjust(I,[low high],[bottom top],gamma)  — 灰度调整\nhisteq(I,n)                               — 直方图均衡化\nimhist(A)                                  — 显示直方图\nfspecial(\'type\')                           — 创建滤波算子\n  \'average\' 均值滤波   \'gaussian\' 高斯滤波\n  \'laplacian\' 拉普拉斯  \'log\' 拉普拉斯-高斯\n  \'prewitt\' 边缘增强    \'sobel\' 边缘提取\n  \'unsharp\' 对比度增强\nimfilter(I,H)                              — 图像滤波\nfilter2(h,I)                               — 二维滤波\nimnoise(I,type)                            — 添加噪声\nmedfilt2(I,[m,n])                          — 中值滤波\nwiener2(I,[m,n])                           — 自适应滤波\nedge(I,\'method\')                           — 边缘检测\nimrotate(A,angle,method)                   — 图像旋转\nimresize(A,m,method)                       — 图像缩放\nimcrop(I,RECT)                             — 图像剪切\nimadd / imsubtract / immultiply / imdivide — 图像运算',
          requirements: '1. 进实验室前必须设计好程序。\n2. 认真调试，记录结果。\n3. 实验报告必须有实验结论分析。',
          pythonTemplate: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom PIL import Image, ImageFilter, ImageEnhance\nfrom scipy import ndimage\n\n# ===== 实验二：图像增强与几何运算 =====\n\n# 1. 灰度变换增强 + 直方图\n# TODO: 亮度调整，绘制直方图对比\n# 提示: ImageEnhance.Brightness() / plt.hist()\n\n\n# 2. 直方图均衡化\n# TODO: 对图像进行直方图均衡化\n# 提示: img.convert(\'L\') 后使用 ImageOps.equalize() 或手动实现\n\n\n# 3. 灰度变换函数（线性/对数/幂函数）\n# TODO: 应用不同变换函数处理图像\n# 提示: np.log(1+img) / np.power(img/255, gamma)*255\n\n\n# 4. 添加噪声 + 滤波\n# TODO: 添加椒盐噪声，分别用均值滤波和中值滤波处理\n# 提示: ndimage.median_filter() / ImageFilter.GaussianBlur()\n\n\n# 5. 图像锐化\n# TODO: 使用拉普拉斯算子或Sobel算子锐化\n# 提示: ndimage.sobel() / ImageFilter.SHARPEN\n\n\n# 6. 几何运算（旋转/缩放/剪切）\n# TODO: 旋转40度，缩小1/3，放大3倍\n# 提示: img.rotate() / img.resize()\n\n\n# 7. 图像加减乘除运算\n# TODO: 对两幅图像进行运算\n# 提示: ImageChops.add() / ImageChops.subtract()\n\n\nplt.tight_layout()\nplt.show()\n',
          octaveTemplate: '% ===== 实验二：图像增强与几何运算 =====\n\n% 1. 灰度变换增强 + 直方图\n% TODO: 亮度调整，绘制直方图对比\n% 提示: imadjust(I,[0 1],[0 1],gamma) / imhist()\n\n\n% 2. 直方图均衡化\n% TODO: 对图像进行直方图均衡化\n% 提示: histeq(I,64)\n\n\n% 3. 灰度变换函数（线性/对数/幂函数）\n% TODO: 应用不同变换函数处理图像\n% 提示: log(1+double(I)) / double(I).^gamma\n\n\n% 4. 添加噪声 + 滤波\n% TODO: 添加椒盐噪声，分别用均值滤波和中值滤波处理\n% 提示: imnoise(I,\'salt & pepper\') / filter2(fspecial(\'average\')) / medfilt2()\n\n\n% 5. 图像锐化\n% TODO: 使用拉普拉斯或Sobel算子锐化\n% 提示: fspecial(\'laplacian\') / edge(I,\'sobel\')\n\n\n% 6. 几何运算（旋转/缩放/剪切）\n% TODO: 旋转40度，缩小1/3，放大3倍\n% 提示: imrotate(A,40) / imresize(A,1/3) / imresize(A,3)\n\n\n% 7. 图像加减乘除运算\n% TODO: 对两幅图像进行运算\n% 提示: imadd() / imsubtract() / immultiply() / imdivide()\n\n\n'
        },
        {
          id: 'course-exp3',
          num: '三',
          title: '图像的频域变换处理',
          hours: '2学时',
          description: '掌握Fourier变换、DCT变换的算法实现，理解频域变换的物理意义。利用傅里叶变换和离散余弦变换处理图像，进行频域滤波和图像压缩。',
          purpose: '1. 掌握Fourier、DCT变换的算法实现，并初步理解Fourier、DCT变换的物理意义。\n2. 利用傅里叶变换、离散余弦变换处理图像。',
          content: [
            '设计程序生成一幅图像，利用fft2函数对图像进行傅里叶变换。输出图像的幅频特性，查看变换后的参数。',
            '利用ifft2函数完成傅里叶反变换，并输出。',
            '利用dct2函数对图像进行离散余弦变换，输出幅频特性。',
            '利用idct2函数完成离散余弦反变换。',
            '利用DCT变换对图像进行压缩处理，计算压缩前后的图像大小。',
            '输入一幅图像并对其进行FFT变换，分别选择频域低通、高通滤波器对同一幅图像进行滤波处理，将滤波后的两幅图像与原图像进行比较，分析结果。'
          ],
          principle: '傅里叶变换：将图像从空间域转换到频率域，揭示图像中不同频率成分的分布。F(u,v) = sum{f(x,y) * exp(-j*2*pi*(ux/M + vy/N))}。\n\n离散余弦变换（DCT）：DCT变换将图像能量集中在少数系数上，广泛用于图像压缩。C(u,v) = alpha(u)*alpha(v) * sum{f(x,y)*cos((2x+1)*u*pi/(2M))*cos((2y+1)*v*pi/(2N))}。\n\n低通滤波器：传递函数在通带内的所有频率分量完全无损通过，阻带内所有频率分量完全衰减。理想低通滤波器截止频率为D0时，H(u,v)=1当D(u,v)<=D0，否则H(u,v)=0。\n\n高通滤波器：将高频成分通过，使低频成分削弱，经傅立叶逆变换得到边缘锐化的图像。理想高通滤波器截止频率为D0时，H(u,v)=0当D(u,v)<=D0，否则H(u,v)=1。',
          matlabRef: 'fft2(A)                — 二维傅里叶变换\nfftshift(F)            — 将零频移到中心\nifft2(F)               — 傅里叶反变换\nabs(F)                 — 求幅值\nlog(abs(F))            — 对数幅值（便于显示）\ndct2(A)                — 二维DCT变换\nidct2(B)               — DCT反变换\nimshow(log(abs(F)),[]) — 显示频谱图',
          requirements: '1. 进实验室前必须设计好程序。\n2. 认真调试，记录结果。\n3. 实验报告必须有实验结论分析。',
          pythonTemplate: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom PIL import Image\nfrom scipy.fftpack import dct, idct\n\n# ===== 实验三：图像的频域变换处理 =====\n\n# 1. 傅里叶变换及幅频特性\n# TODO: 对图像进行FFT，显示频谱图\n# 提示: np.fft.fft2() / np.fft.fftshift() / np.log(1+np.abs())\n\n\n# 2. 傅里叶反变换\n# TODO: 对频谱进行反变换恢复图像\n# 提示: np.fft.ifft2() / np.fft.ifftshift()\n\n\n# 3. DCT变换及幅频特性\n# TODO: 对图像进行DCT变换\n# 提示: dct(dct(img.T, norm=\'ortho\').T, norm=\'ortho\')\n\n\n# 4. DCT反变换\n# TODO: 进行DCT反变换恢复图像\n# 提示: idct(idct(dct_img.T, norm=\'ortho\').T, norm=\'ortho\')\n\n\n# 5. DCT压缩\n# TODO: 保留部分DCT系数实现压缩，比较压缩前后大小\n# 提示: 设置阈值将小系数置零\n\n\n# 6. 频域低通/高通滤波\n# TODO: 设计理想低通和高通滤波器，对FFT结果滤波后反变换\n# 提示: 构建距离矩阵D，H_lp = (D < D0).astype(float)\n\n\nplt.tight_layout()\nplt.show()\n',
          octaveTemplate: '% ===== 实验三：图像的频域变换处理 =====\n\n% 1. 傅里叶变换及幅频特性\n% TODO: 对图像进行FFT，显示频谱图\n% 提示: fft2() / fftshift() / log(abs())\n\n\n% 2. 傅里叶反变换\n% TODO: 对频谱进行反变换恢复图像\n% 提示: ifft2() / ifftshift()\n\n\n% 3. DCT变换及幅频特性\n% TODO: 对图像进行DCT变换\n% 提示: dct2()\n\n\n% 4. DCT反变换\n% TODO: 进行DCT反变换恢复图像\n% 提示: idct2()\n\n\n% 5. DCT压缩\n% TODO: 保留部分DCT系数实现压缩\n% 提示: 设置阈值将小系数置零\n\n\n% 6. 频域低通/高通滤波\n% TODO: 设计理想低通和高通滤波器\n% 提示: 构建距离矩阵D，H = double(D <= D0)\n\n\n'
        },
        {
          id: 'course-exp4',
          num: '四',
          title: '图像分割',
          hours: '2学时',
          description: '熟悉图像分割的概念、原理和方法。应用MATLAB环境对图像进行阈值分割、边缘检测（Roberts、Prewitt、Sobel算子）以及区域生长。',
          purpose: '1. 熟悉图像分割的概念、原理、方法。\n2. 应用MATLAB环境对图像进行阈值分割、边缘检测。',
          content: [
            '对已知图像作阈值分割，选择不同的阈值进行分割，分析不同阈值对同一图像处理的结果，研究阈值选择的方法。',
            '对已知图像利用不同算子进行边缘检测，分析比较检测结果。',
            '设计区域生长程序，利用区域生长方法进行图像分割。'
          ],
          principle: '图像分割就是将图像分成互不重叠的区域，提取感兴趣的目标。常用方法有阈值分割、边缘检测、区域生长。\n\n阈值分割：若图像中目标和背景具有不同的灰度集合，且两个灰度集合可用一个灰度级阈值T进行分割。设图像为f(x,y)，其灰度范围是[0,L]，在0和L之间选择合适的阈值T，大于T的像素归为目标（1），小于等于T的归为背景（0）。\n\n边缘检测：用差分、梯度、拉普拉斯算子及各种高通滤波处理方法对图像边缘进行增强，再进行门限化处理即可用于边缘检测。\n\n梯度算子：梯度对应于一阶导数。常用算子包括：\n- Roberts算子：2x2对角差分\n- Prewitt算子：3x3水平和垂直差分\n- Sobel算子：3x3加权水平和垂直差分\n\n区域生长：从种子点开始，将与种子点性质相似的相邻像素合并到同一区域，反复迭代直到没有满足条件的像素可加入。',
          matlabRef: 'im2bw(I, level)         — 阈值二值化\ngraythresh(I)           — 自动求最优阈值（Otsu法）\nedge(I, \'roberts\')      — Roberts边缘检测\nedge(I, \'prewitt\')      — Prewitt边缘检测\nedge(I, \'sobel\')        — Sobel边缘检测\nedge(I, \'canny\')        — Canny边缘检测\nfspecial(\'prewitt\')     — Prewitt算子\nfspecial(\'sobel\')       — Sobel算子\nfspecial(\'laplacian\')   — 拉普拉斯算子\nbwlabel(BW)             — 连通区域标记\nregionprops(L)          — 区域属性测量',
          requirements: '1. 进实验室前必须设计好程序。\n2. 认真调试，记录结果。\n3. 实验报告必须有实验结论分析。',
          pythonTemplate: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom PIL import Image\nfrom scipy import ndimage\n\n# ===== 实验四：图像分割 =====\n\n# 1. 阈值分割\n# TODO: 选择不同阈值对图像进行分割，比较结果\n# 提示: img > threshold / 尝试 Otsu 自动阈值\n\n\n# 2. 边缘检测（不同算子比较）\n# TODO: 分别用 Roberts、Prewitt、Sobel 算子进行边缘检测\n# 提示: ndimage.sobel() / 自定义卷积核\n\n\n# 3. 区域生长\n# TODO: 实现区域生长算法\n# 提示: 选择种子点，BFS/DFS扩展相似像素\n\n\nplt.tight_layout()\nplt.show()\n',
          octaveTemplate: '% ===== 实验四：图像分割 =====\n\n% 1. 阈值分割\n% TODO: 选择不同阈值对图像进行分割，比较结果\n% 提示: im2bw(I, level) / graythresh(I)\n\n\n% 2. 边缘检测（不同算子比较）\n% TODO: 分别用 Roberts、Prewitt、Sobel 算子进行边缘检测\n% 提示: edge(I, \'roberts\') / edge(I, \'prewitt\') / edge(I, \'sobel\')\n\n\n% 3. 区域生长\n% TODO: 实现区域生长算法\n% 提示: 选择种子点，循环扩展相邻相似像素\n\n\n'
        },
        {
          id: 'course-exp5',
          num: '五',
          title: '综合实验',
          hours: '2学时',
          description: '开放性课题，学生自主命题。自主选择图像，完成对图像的处理和分析，至少包括灰度化、滤波、增强、分割、压缩编码、特征提取、形态学处理等内容中的三类操作以上。',
          purpose: '熟悉图像处理、图像分析的各类概念、原理、方法。应用MATLAB环境对图像进行综合设计。',
          content: [
            '课下进行分组和相关知识学习，确定综合实践课题题目报老师审核。',
            '完成整体课题的代码编写工作。',
            '利用图像处理设备进行在线图像处理。',
            '自主选择不同的图像，完成对该图像的处理和分析。',
            '至少包括以下操作中的三类以上：图像灰度化、滤波、增强、分割、压缩编码、特征提取、形态学处理。'
          ],
          principle: '综合实验要求运用前面四个实验中学习的各类图像处理技术，对图像进行完整的处理和分析流程。\n\n建议的实验流程：\n1. 图像输入与预处理（灰度化、去噪）\n2. 图像增强（灰度变换、直方图处理）\n3. 图像分割（阈值分割、边缘检测）\n4. 特征提取（面积、周长、质心等）\n5. 形态学处理（腐蚀、膨胀、开闭运算）\n6. 结果分析与可视化\n\n学生可根据自己选择的课题，灵活组合各类处理技术。',
          matlabRef: '% 综合实验可用前面所有实验中的函数\n% 额外参考：\nimopen(BW, se)          — 形态学开运算\nimclose(BW, se)         — 形态学闭运算\nimerode(BW, se)         — 腐蚀\nimdilate(BW, se)        — 膨胀\nstrel(\'disk\', r)        — 创建结构元素\nbwarea(BW)              — 计算二值图像面积\nbwperim(BW)             — 计算边界\nregionprops(L, props)   — 区域属性\nbwlabel(BW, conn)       — 连通域标记',
          requirements: '1. 进实验室前必须设计好程序。\n2. 认真调试，记录结果。\n3. 实验报告必须有实验结论分析。\n4. 至少包含三类以上图像处理操作。\n5. 学生自主选题，需经老师审核。',
          pythonTemplate: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom PIL import Image, ImageFilter\nfrom scipy import ndimage\n\n# ===== 实验五：综合实验 =====\n# 请自主选题并设计完整的图像处理流程\n# 至少包含以下三类操作：\n# 灰度化、滤波、增强、分割、压缩、特征提取、形态学处理\n\n# TODO: 编写你的综合实验代码\n\n\nplt.tight_layout()\nplt.show()\n',
          octaveTemplate: '% ===== 实验五：综合实验 =====\n% 请自主选题并设计完整的图像处理流程\n% 至少包含以下三类操作：\n% 灰度化、滤波、增强、分割、压缩、特征提取、形态学处理\n\n% TODO: 编写你的综合实验代码\n\n\n'
        }
      ]
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
    },
    isCourseExp: function() {
      return this.currentKey && this.currentKey.indexOf('course-exp') === 0;
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

    // ---- Toggle course experiment guide panel ----
    toggleGuide: function(section) {
      this.guideExpanded[section] = !this.guideExpanded[section];
    },

    // ---- Open course experiment ----
    openCourseExp: function(exp) {
      this.currentKey = exp.id;
      this.experiment = exp;
      this.runResult = null;
      this.sourceImageBase64 = '';
      this.sourceImageUrl = '';
      this.sourceImageName = '';
      this.pythonTemplate = exp.pythonTemplate || '# TODO: 编写Python代码\n';
      this.octaveTemplate = exp.octaveTemplate || '% TODO: 编写Octave/MATLAB代码\n';
      this.code = this.language === 'python' ? this.pythonTemplate : this.octaveTemplate;
      this.aiHints = null;
      this.showInfo = true;
      this.showAIHints = false;
      // Reset guide panels
      this.guideExpanded = {
        purpose: true,
        content: true,
        principle: false,
        matlabRef: false,
        requirements: true
      };
      var self = this;
      // Textarea updates automatically via :value binding
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
        // Textarea updates automatically via :value binding
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
    },

    onCodeInput: function(val) {
      this.code = val;
    },

    resetCode: function() {
      this.code = this.language === 'python' ? this.pythonTemplate : this.octaveTemplate;
    },

    enableEdit: function() {
      // Focus the textarea so user can start editing immediately
      if (this.$refs.codeArea) {
        this.$refs.codeArea.focus();
        if (window.store) store.notify('代码编辑区已激活，可以直接修改代码', 'success');
      }
    },

    insertTab: function(e) {
      var ta = e.target;
      var start = ta.selectionStart;
      var end = ta.selectionEnd;
      var val = ta.value;
      this.code = val.substring(0, start) + '    ' + val.substring(end);
      var self = this;
      this.$nextTick(function() {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    },

    copyCode: function() {
      navigator.clipboard.writeText(this.code).then(function() {
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
      var code = this.code;
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
      var code = this.code;
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
