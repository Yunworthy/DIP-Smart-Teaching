var ChartPanel = {
  name: 'ChartPanel',
  props: {
    option: {
      type: Object,
      default: () => ({}),
    },
    height: {
      type: String,
      default: '300px',
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  template: `
    <div class="relative w-full rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <!-- Loading overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span class="text-xs text-gray-400">加载图表中...</span>
        </div>
      </div>

      <!-- Chart container -->
      <div ref="chartContainer" :style="{ height: height, width: '100%' }"></div>
    </div>
  `,
  data() {
    return {
      chartInstance: null,
    };
  },
  watch: {
    option: {
      deep: true,
      handler(newOption) {
        if (this.chartInstance && newOption) {
          this.chartInstance.setOption(newOption, { notMerge: false, lazyUpdate: true });
        }
      },
    },
  },
  methods: {
    initChart() {
      if (!this.$refs.chartContainer) return;
      if (typeof echarts === 'undefined') {
        console.warn('[ChartPanel] ECharts is not loaded.');
        return;
      }
      this.chartInstance = echarts.init(this.$refs.chartContainer);
      if (this.option && Object.keys(this.option).length > 0) {
        this.chartInstance.setOption(this.option);
      }
    },
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },
    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
    },
  },
  mounted() {
    this.initChart();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.destroyChart();
  },
};
