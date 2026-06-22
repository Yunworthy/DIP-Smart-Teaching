var KnowledgeMap = {
  name: 'KnowledgeMap',
  template: `
    <div class="space-y-4">
      <!-- Top Controls -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">知识图谱</h1>
          <p class="mt-1 text-sm text-gray-500">已掌握 <span class="font-semibold text-indigo-600">{{ masteredCount }}</span> / 总计 {{ graphData.nodes.length }} 个知识点</p>
        </div>
        <div class="flex flex-col gap-2">
          <!-- Pill tab bar -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2">
            <button @click="activeView = 'all'"
              :class="viewTabClass('all')"
              class="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150">
              全部章节
            </button>
            <button v-for="ch in chapters" :key="ch.id"
              @click="activeView = String(ch.id)"
              :class="viewTabClass(String(ch.id))"
              class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150">
              {{ ch.title }}
            </button>
          </div>
          <!-- Stats line -->
          <div class="text-xs text-gray-500">
            当前视图: <span class="font-semibold text-gray-700">{{ filteredNodes.length }}</span> 个知识点, <span class="font-semibold text-gray-700">{{ filteredEdges.length }}</span> 条关系
          </div>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input v-model="searchQuery" type="text" placeholder="搜索知识点..."
              class="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 w-48"/>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="flex flex-wrap gap-2">
        <button v-for="sr in searchResults" :key="sr.id"
          @click="selectNodeById(sr.id)"
          class="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100">
          {{ sr.title || sr.name }}
        </button>
      </div>

      <!-- Graph + Side Panel -->
      <div class="flex flex-col lg:flex-row gap-4" style="min-height: 600px">
        <!-- Graph Area -->
        <div class="flex-1 min-w-0 relative">
          <div v-if="graphLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
            <div class="text-center">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-2"></div>
              <p class="text-xs text-gray-500">加载知识图谱...</p>
            </div>
          </div>
          <knowledge-graph
            v-if="!graphLoading"
            :nodes="chartNodes"
            :edges="chartEdges"
            :progress="simpleProgressMap"
            @select-node="onSelectNode"
          />
        </div>

        <!-- Right Panel (when node selected) -->
        <transition name="slide">
          <div v-if="selectedNode" class="w-full lg:w-80 lg:flex-shrink-0 rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-base font-semibold text-gray-900">{{ selectedNode.name }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                      :class="categoryClass(selectedNode.category)">{{ categoryLabel(selectedNode.category) }}</span>
                    <span v-if="selectedNode.chapterTitle" class="text-xs text-gray-400">{{ selectedNode.chapterTitle }}</span>
                  </div>
                </div>
                <button @click="selectedNode = null" class="text-gray-400 hover:text-gray-600">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-5 space-y-4 overflow-y-auto" style="max-height: 520px">
              <!-- Description -->
              <div>
                <p class="text-xs font-medium text-gray-500 mb-1">描述</p>
                <p class="text-sm text-gray-700">{{ selectedNode.description || '暂无描述信息。' }}</p>
              </div>

              <!-- Principle -->
              <div v-if="selectedNode.principle">
                <p class="text-xs font-medium text-gray-500 mb-1">原理讲解</p>
                <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ selectedNode.principle }}</p>
              </div>

              <!-- Difficulty -->
              <div>
                <p class="text-xs font-medium text-gray-500 mb-1">难度等级</p>
                <div class="flex items-center gap-1">
                  <svg v-for="i in 5" :key="i" class="h-4 w-4" :class="i <= (selectedNode.difficulty || 3) ? 'text-amber-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>

              <!-- Mastery -->
              <div>
                <p class="text-xs font-medium text-gray-500 mb-1">掌握程度</p>
                <div class="flex items-center gap-3">
                  <input type="range" min="0" max="100" :value="selectedNode.mastery || 0"
                    @change="updateMastery($event.target.value)"
                    class="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                  <span class="text-sm font-semibold text-indigo-600 w-10 text-right">{{ selectedNode.mastery || 0 }}%</span>
                </div>
              </div>

              <!-- Related Simulations -->
              <div v-if="selectedNode.simulations && selectedNode.simulations.length > 0">
                <p class="text-xs font-medium text-gray-500 mb-2">关联实验</p>
                <div class="space-y-1.5">
                  <button v-for="sim in selectedNode.simulations" :key="sim.key || sim"
                    @click="$router.push('/student/experiments/' + (sim.key || sim))"
                    class="w-full text-left text-xs px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-2">
                    <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    </svg>
                    {{ sim.title || sim.key || sim }}
                  </button>
                </div>
              </div>

              <!-- Related Knowledge Points -->
              <div v-if="selectedNode.related && selectedNode.related.length > 0">
                <p class="text-xs font-medium text-gray-500 mb-2">相关知识点</p>
                <div class="space-y-1.5">
                  <button v-for="rel in selectedNode.related" :key="rel.id || rel"
                    @click="selectByRel(rel)"
                    class="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between">
                    <span>{{ rel.name || rel }}</span>
                    <span v-if="rel.relationType" class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="relTypeClass(rel.relationType)">{{ relTypeLabel(rel.relationType) }}</span>
                  </button>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 pt-2">
                <button @click="markMastered"
                  class="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                  标记已掌握
                </button>
                <button @click="startLearning"
                  class="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors">
                  开始学习
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  `,
  data: function() {
    return {
      graphData: { nodes: [], links: [] },
      progressMap: {},
      chapters: [],
      activeView: 'all',
      searchQuery: '',
      selectedNode: null,
      graphLoading: true,
    };
  },
  computed: {
    masteredCount: function() {
      return Object.values(this.progressMap).filter(function(p) {
        return (p.mastery_level || p.mastery || 0) >= 80;
      }).length;
    },

    // Filtered nodes based on active view
    filteredNodes: function() {
      var nodes = this.graphData.nodes || [];
      if (this.activeView === 'all') return nodes;
      var viewId = parseInt(this.activeView);
      return nodes.filter(function(n) {
        return n.chapter_id === viewId;
      });
    },

    // Filtered edges: only edges where both source and target are in filtered nodes
    filteredEdges: function() {
      var nodeIds = new Set(this.filteredNodes.map(function(n) { return n.id; }));
      var links = this.graphData.links || [];
      return links.filter(function(l) {
        return nodeIds.has(l.source) && nodeIds.has(l.target);
      });
    },

    // Transform nodes for KnowledgeGraph component
    chartNodes: function() {
      return this.filteredNodes.map(function(n) {
        return {
          id: n.id,
          name: n.title || n.name || String(n.id),
          category: n.category || 'concept',
          importance: n.difficulty || 1,
          difficulty: n.difficulty || 1,
        };
      });
    },

    // Transform edges for KnowledgeGraph component
    chartEdges: function() {
      return this.filteredEdges.map(function(l) {
        return {
          source: l.source,
          target: l.target,
          weight: l.weight || 0.5,
          relationType: l.relation_type || 'related',
          label: l.relation_type || 'related',
        };
      });
    },

    // Simple progress map: nodeId -> mastery number
    simpleProgressMap: function() {
      var map = {};
      var pm = this.progressMap;
      Object.keys(pm).forEach(function(id) {
        map[id] = pm[id].mastery_level || pm[id].mastery || 0;
      });
      return map;
    },

    // Search results (max 10)
    searchResults: function() {
      if (!this.searchQuery || this.searchQuery.length < 1) return [];
      var q = this.searchQuery.toLowerCase();
      return (this.graphData.nodes || []).filter(function(n) {
        var title = (n.title || n.name || '').toLowerCase();
        return title.includes(q);
      }).slice(0, 10);
    }
  },
  mounted: function() {
    this.loadData();
  },
  methods: {
    loadData: function() {
      var self = this;
      self.graphLoading = true;
      Promise.allSettled([
        api.getKnowledgeGraph ? api.getKnowledgeGraph() : Promise.resolve({ data: { nodes: [], links: [] } }),
        api.getMyProgress(),
        api.getChapters()
      ]).then(function(results) {
        var graphRes = results[0];
        var progressRes = results[1];
        var chapRes = results[2];

        if (graphRes.status === 'fulfilled') {
          var g = graphRes.value.data || graphRes.value || {};
          var rawEdges = g.links || g.edges || [];
          // Normalize field names: API returns source_id/target_id, we use source/target
          var normalizedEdges = rawEdges.map(function(e) {
            return {
              id: e.id,
              source: e.source_id || e.source,
              target: e.target_id || e.target,
              relation_type: e.relation_type || 'related',
              weight: e.weight || 0.5,
            };
          });
          self.graphData = { nodes: g.nodes || [], links: normalizedEdges };
        }

        if (progressRes.status === 'fulfilled') {
          var list = progressRes.value.data || progressRes.value || [];
          self.progressMap = {};
          (Array.isArray(list) ? list : []).forEach(function(p) {
            var id = p.knowledge_point_id || p.kp_id || p.id;
            self.progressMap[id] = p;
          });
        }

        if (chapRes.status === 'fulfilled') {
          self.chapters = chapRes.value.data || chapRes.value || [];
        }

        self.graphLoading = false;
      }).catch(function(e) {
        console.error('KnowledgeMap load error:', e);
        self.graphLoading = false;
      });
    },

    onSelectNode: function(raw) {
      this.selectNodeFromRaw(raw);
    },

    selectNodeById: function(id) {
      var node = (this.graphData.nodes || []).find(function(n) { return n.id === id; });
      if (node) {
        this.selectNodeFromRaw(node);
      }
    },

    selectNodeFromRaw: function(raw) {
      if (!raw) return;
      var prog = this.progressMap[raw.id] || {};
      var self = this;

      // Find related knowledge points via edges
      var related = [];
      var links = this.graphData.links || [];
      var nodes = this.graphData.nodes || [];
      links.forEach(function(l) {
        var relId = null;
        if (l.source === raw.id || String(l.source) === String(raw.id)) {
          relId = l.target;
        } else if (l.target === raw.id || String(l.target) === String(raw.id)) {
          relId = l.source;
        }
        if (relId) {
          var relNode = nodes.find(function(n) { return n.id === relId; });
          if (relNode) {
            related.push({
              id: relNode.id,
              name: relNode.title || relNode.name || String(relNode.id),
              relationType: l.relation_type || 'related'
            });
          }
        }
      });

      this.selectedNode = {
        id: raw.id,
        name: raw.title || raw.name || String(raw.id),
        description: raw.description || '',
        principle: raw.principle || '',
        difficulty: raw.difficulty || 3,
        category: raw.category || 'concept',
        chapterTitle: raw.chapter_title || '',
        mastery: prog.mastery_level || prog.mastery || 0,
        simulations: raw.simulations || [],
        related: related
      };
    },

    selectByRel: function(rel) {
      var id = rel.id || rel;
      this.selectNodeById(id);
    },

    updateMastery: function(val) {
      if (!this.selectedNode) return;
      var self = this;
      var intVal = parseInt(val);
      this.selectedNode.mastery = intVal;
      api.updateProgress({
        knowledge_point_id: this.selectedNode.id,
        mastery_level: intVal,
        status: intVal >= 80 ? 'mastered' : intVal > 0 ? 'learning' : 'unlearned'
      }).then(function() {
        self.progressMap[self.selectedNode.id] = { mastery_level: intVal };
      }).catch(function() {
        store.notify('更新失败', 'error');
      });
    },

    markMastered: function() {
      if (!this.selectedNode) return;
      this.updateMastery(100);
      this.selectedNode.mastery = 100;
      store.notify('已标记为掌握', 'success');
    },

    startLearning: function() {
      if (!this.selectedNode) return;
      var raw = (this.graphData.nodes || []).find(function(n) { return n.id === this.selectedNode.id; }.bind(this));
      if (raw && raw.chapter_id) {
        this.$router.push('/student/courses/' + raw.chapter_id);
      } else {
        this.$router.push('/student/courses');
      }
    },

    categoryClass: function(cat) {
      var map = {
        concept: 'bg-blue-50 text-blue-700',
        algorithm: 'bg-emerald-50 text-emerald-700',
        application: 'bg-amber-50 text-amber-700'
      };
      return map[(cat || '').toLowerCase()] || 'bg-gray-50 text-gray-700';
    },

    categoryLabel: function(cat) {
      var map = { concept: '概念', algorithm: '算法', application: '应用' };
      return map[(cat || '').toLowerCase()] || cat || '概念';
    },

    relTypeLabel: function(type) {
      var map = { prerequisite: '前置', related: '关联', derived: '衍生' };
      return map[type] || type || '关联';
    },

    relTypeClass: function(type) {
      var map = {
        prerequisite: 'bg-indigo-100 text-indigo-700',
        related: 'bg-teal-100 text-teal-700',
        derived: 'bg-amber-100 text-amber-700'
      };
      return map[type] || 'bg-gray-100 text-gray-700';
    },

    viewTabClass: function(viewId) {
      if (this.activeView === viewId) {
        return 'bg-indigo-600 text-white shadow-md';
      }
      return 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200';
    }
  }
};
