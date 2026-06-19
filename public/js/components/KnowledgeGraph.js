var KnowledgeGraph = {
  name: 'KnowledgeGraph',
  props: {
    nodes: {
      type: Array,
      default: function() { return []; },
      // Each: { id, name, category?, importance?, difficulty? }
    },
    edges: {
      type: Array,
      default: function() { return []; },
      // Each: { source, target, weight?, label?, relationType? }
    },
    progress: {
      type: Object,
      default: function() { return {}; },
      // Mapping: node_id -> mastery_level (0-100)
    },
  },
  emits: ['select-node'],
  template: `
    <div class="relative w-full rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <!-- Legend -->
      <div class="absolute top-3 left-3 z-10 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm text-xs space-y-1.5">
        <div class="flex items-center gap-3">
          <span class="font-medium text-gray-600">掌握度:</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-gray-400"></span><span class="text-gray-500">未学习</span></span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-amber-400"></span><span class="text-gray-500">学习中</span></span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-emerald-500"></span><span class="text-gray-500">已掌握</span></span>
        </div>
        <div class="flex items-center gap-3 border-t border-gray-100 pt-1.5">
          <span class="font-medium text-gray-600">关系:</span>
          <span class="flex items-center gap-1"><span class="inline-block w-5 h-0.5 bg-indigo-500 rounded"></span><span class="text-gray-500">前置</span></span>
          <span class="flex items-center gap-1"><span class="inline-block w-5 border-t-2 border-dashed border-teal-500"></span><span class="text-gray-500">关联</span></span>
          <span class="flex items-center gap-1"><span class="inline-block w-5 h-0.5 bg-amber-500 rounded"></span><span class="text-gray-500">衍生</span></span>
        </div>
        <div class="flex items-center gap-3 border-t border-gray-100 pt-1.5">
          <span class="font-medium text-gray-600">类型:</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full border-2 border-gray-400 bg-gray-100"></span><span class="text-gray-500">概念</span></span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm border-2 border-gray-400 bg-gray-100"></span><span class="text-gray-500">算法</span></span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rotate-45 border-2 border-gray-400 bg-gray-100"></span><span class="text-gray-500">应用</span></span>
        </div>
      </div>

      <!-- Zoom controls -->
      <div class="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button @click="zoomIn" class="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 transition-colors" title="放大">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button @click="zoomOut" class="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 transition-colors" title="缩小">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
        <button @click="resetView" class="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 transition-colors" title="重置视图">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <!-- Hover tooltip -->
      <div v-if="hoveredNode" class="absolute bottom-3 left-3 z-10 px-4 py-3 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg max-w-xs">
        <p class="text-sm font-semibold text-gray-800">{{ hoveredNode.name }}</p>
        <p class="mt-1 text-xs text-gray-500">
          掌握度: <span :class="masteryColorClass(hoveredNode.id)" class="font-semibold">{{ getNodeMastery(hoveredNode.id) }}%</span>
        </p>
        <p v-if="hoveredNode.category" class="text-xs text-gray-400 mt-0.5">类型: {{ categoryLabel(hoveredNode.category) }}</p>
        <p v-if="hoveredNode.difficulty" class="text-xs text-gray-400 mt-0.5">难度: {{ '★'.repeat(hoveredNode.difficulty || 1) }}{{ '☆'.repeat(5 - (hoveredNode.difficulty || 1)) }}</p>
      </div>

      <!-- Chart container -->
      <div ref="graphContainer" style="height: 500px; width: 100%;"></div>
    </div>
  `,
  data: function() {
    return {
      chartInstance: null,
      hoveredNode: null,
    };
  },
  watch: {
    nodes: {
      deep: true,
      handler: function() { this.updateChart(); },
    },
    edges: {
      deep: true,
      handler: function() { this.updateChart(); },
    },
    progress: {
      deep: true,
      handler: function() { this.updateChart(); },
    },
  },
  computed: {
    chartOption: function() {
      var self = this;
      var chartNodes = this.nodes.map(function(node) {
        var mastery = self.getNodeMastery(node.id);
        var symbol = self.getCategorySymbol(node.category);
        return {
          id: String(node.id),
          name: node.name,
          symbolSize: self.calcSymbolSize(node),
          symbol: symbol,
          itemStyle: {
            color: self.getMasteryColor(mastery),
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 4,
            shadowColor: 'rgba(0,0,0,0.15)',
          },
          label: {
            show: true,
            fontSize: 11,
            color: '#374151',
            fontWeight: 'bold',
          },
          category: node.category || '',
          value: mastery,
          _raw: node,
        };
      });

      var relationLabels = { prerequisite: '前置', related: '关联', derived: '衍生' };
      var chartEdges = this.edges.map(function(edge) {
        var relType = edge.relationType || edge.relation_type || 'related';
        var style = self.getEdgeStyle(relType, edge.weight);
        var label = relationLabels[relType] || relType;
        var hasArrow = relType !== 'related';
        return {
          source: String(edge.source),
          target: String(edge.target),
          lineStyle: style,
          label: {
            show: true,
            formatter: label,
            fontSize: 9,
            color: style.color || '#94a3b8',
            opacity: 0.8,
          },
          edgeSymbol: hasArrow ? ['none', 'arrow'] : ['none', 'none'],
          edgeSymbolSize: hasArrow ? [0, 8] : [0, 0],
          _relType: relType,
        };
      });

      return {
        tooltip: { show: false },
        animationDuration: 800,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            type: 'graph',
            layout: 'force',
            data: chartNodes,
            links: chartEdges,
            roam: true,
            draggable: true,
            force: {
              repulsion: 300,
              gravity: 0.1,
              edgeLength: [80, 200],
              friction: 0.6,
            },
            emphasis: {
              focus: 'adjacency',
              lineStyle: {
                width: 3,
                opacity: 1,
                color: '#6366f1',
              },
              itemStyle: {
                shadowBlur: 12,
                shadowColor: 'rgba(99,102,241,0.4)',
              },
            },
          },
        ],
      };
    },
  },
  methods: {
    getNodeMastery: function(nodeId) {
      return this.progress[nodeId] || 0;
    },
    calcSymbolSize: function(node) {
      var base = 30;
      var importance = node.importance || 1;
      var difficulty = node.difficulty || 1;
      return base + (importance + difficulty) * 3;
    },
    getMasteryColor: function(mastery) {
      if (mastery === 0) return '#9ca3af';
      if (mastery < 80) return '#f59e0b';
      return '#10b981';
    },
    masteryColorClass: function(nodeId) {
      var m = this.getNodeMastery(nodeId);
      if (m === 0) return 'text-gray-500';
      if (m < 80) return 'text-amber-500';
      return 'text-emerald-500';
    },
    getCategorySymbol: function(category) {
      var cat = (category || '').toLowerCase();
      if (cat === 'algorithm') return 'roundRect';
      if (cat === 'application') return 'diamond';
      return 'circle';
    },
    categoryLabel: function(category) {
      var map = { concept: '概念', algorithm: '算法', application: '应用' };
      return map[(category || '').toLowerCase()] || category || '概念';
    },
    getEdgeStyle: function(relType, weight) {
      var w = weight || 0.5;
      var baseWidth = 1 + w * 1.5;
      var baseOpacity = 0.4 + w * 0.4;
      if (relType === 'prerequisite') {
        return { color: '#6366f1', width: baseWidth + 0.5, opacity: baseOpacity, curveness: 0.15, type: 'solid' };
      }
      if (relType === 'derived') {
        return { color: '#f59e0b', width: baseWidth, opacity: baseOpacity, curveness: 0.15, type: 'solid' };
      }
      // related (default)
      return { color: '#14b8a6', width: baseWidth, opacity: Math.min(baseOpacity, 0.6), curveness: 0.2, type: 'dashed' };
    },
    initChart: function() {
      if (!this.$refs.graphContainer) return;
      if (typeof echarts === 'undefined') {
        console.warn('[KnowledgeGraph] ECharts is not loaded.');
        return;
      }
      this.chartInstance = echarts.init(this.$refs.graphContainer);
      this.chartInstance.setOption(this.chartOption);

      var self = this;
      this.chartInstance.on('click', function(params) {
        if (params.dataType === 'node') {
          self.$emit('select-node', params.data._raw || params.data);
        }
      });

      this.chartInstance.on('mouseover', function(params) {
        if (params.dataType === 'node') {
          self.hoveredNode = params.data._raw || { id: params.data.id, name: params.data.name };
        }
      });

      this.chartInstance.on('mouseout', function(params) {
        if (params.dataType === 'node') {
          self.hoveredNode = null;
        }
      });
    },
    updateChart: function() {
      if (this.chartInstance) {
        this.chartInstance.setOption(this.chartOption, { notMerge: true });
      }
    },
    zoomIn: function() {
      if (!this.chartInstance) return;
      var option = this.chartInstance.getOption();
      if (option && option.series && option.series[0]) {
        var zoom = option.series[0].zoom || 1;
        this.chartInstance.setOption({
          series: [{ zoom: Math.min(zoom * 1.2, 5) }],
        });
      }
    },
    zoomOut: function() {
      if (!this.chartInstance) return;
      var option = this.chartInstance.getOption();
      if (option && option.series && option.series[0]) {
        var zoom = option.series[0].zoom || 1;
        this.chartInstance.setOption({
          series: [{ zoom: Math.max(zoom / 1.2, 0.2) }],
        });
      }
    },
    resetView: function() {
      if (!this.chartInstance) return;
      this.chartInstance.setOption({
        series: [{ zoom: 1, center: ['50%', '50%'] }],
      });
    },
    handleResize: function() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },
  },
  mounted: function() {
    this.initChart();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },
};
