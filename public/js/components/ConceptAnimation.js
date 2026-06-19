/**
 * ConceptAnimation - Vue 3 CDN Global Component
 *
 * Renders interactive Canvas animations for knowledge points on the
 * image-simulation teaching platform.  An animation module registers
 * itself against one or more KP IDs via the global registry
 * (window.__conceptAnimations).  This component looks up the correct
 * factory by kpId and drives a step-based, optionally auto-playing,
 * canvas visualisation with an optional parameter slider.
 */
var ConceptAnimation = {
  name: 'ConceptAnimation',
  emits: [],
  props: {
    kpId: { type: Number, required: true },
    kpTitle: { type: String, default: '' },
    canvasWidth: { type: Number, default: 700 },
    canvasHeight: { type: Number, default: 400 }
  },
  template: `
    <div @click.stop class="concept-animation overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm font-semibold text-indigo-800">交互式动画演示</span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="prevStep" :disabled="currentStep <= 0"
                  class="px-3 py-1 text-xs rounded-lg bg-white border border-gray-200
                         hover:bg-gray-50 disabled:opacity-40 transition">上一步</button>

          <span class="text-xs text-gray-500 min-w-[60px] text-center">
            步骤 {{ currentStep + 1 }}/{{ totalSteps }}
          </span>

          <button @click="nextStep" :disabled="currentStep >= totalSteps - 1"
                  class="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white
                         hover:bg-indigo-700 disabled:opacity-40 transition">下一步</button>

          <button @click="reset"
                  class="px-3 py-1 text-xs rounded-lg bg-white border border-gray-200
                         hover:bg-gray-50 transition">重置</button>

          <button @click="toggleAutoPlay"
                  class="px-3 py-1 text-xs rounded-lg transition"
                  :class="autoPlaying
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200'">
            {{ autoPlaying ? '暂停' : '自动播放' }}
          </button>
        </div>
      </div>

      <div class="p-4">
        <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight"
                class="w-full border border-gray-100 rounded-lg bg-gray-50"></canvas>

        <div class="mt-3">
          <p class="text-sm text-gray-600" v-html="stepDescription"></p>
        </div>

        <div v-if="hasSlider" class="mt-3 flex items-center gap-3">
          <label class="text-xs text-gray-500 min-w-[80px]">{{ sliderLabel }}</label>
          <input type="range"
                 :min="sliderMin" :max="sliderMax" :step="sliderStep"
                 v-model.number="sliderValue"
                 @input="onSliderChange"
                 class="flex-1 h-2 rounded-lg appearance-none bg-gray-200 accent-indigo-600">
          <span class="text-xs font-mono text-gray-600 min-w-[40px] text-right">
            {{ sliderValue }}
          </span>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      currentStep: 0,
      totalSteps: 1,
      autoPlaying: false,
      autoTimer: null,
      animation: null,
      // Slider state
      sliderValue: 50,
      hasSlider: false,
      sliderLabel: '',
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
    };
  },

  computed: {
    stepDescription() {
      if (this.animation && this.animation.getStepDescription) {
        return this.animation.getStepDescription(this.currentStep);
      }
      return '';
    }
  },

  watch: {
    kpId() {
      this.initAnimation();
    }
  },

  mounted() {
    this.$nextTick(() => this.initAnimation());
  },

  beforeUnmount() {
    if (this.autoTimer) clearInterval(this.autoTimer);
  },

  methods: {
    /**
     * Look up the registered animation factory for the current kpId,
     * instantiate it, and perform the initial draw.
     */
    initAnimation() {
      // Stop any running auto-play
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
        this.autoPlaying = false;
      }

      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Look up animation from global registry
      const registry = window.__conceptAnimations;
      const animFactory = registry && registry[this.kpId];

      if (animFactory) {
        try {
          this.animation = animFactory(canvas, ctx);
          this.totalSteps  = this.animation.totalSteps || 1;
          this.hasSlider   = !!this.animation.hasSlider;

          if (this.hasSlider) {
            this.sliderLabel = this.animation.sliderLabel   || '参数';
            this.sliderMin   = this.animation.sliderMin      || 0;
            this.sliderMax   = this.animation.sliderMax      || 100;
            this.sliderStep  = this.animation.sliderStep     || 1;
            this.sliderValue = this.animation.sliderDefault  || 50;
          }

          this.currentStep = 0;
          this.draw();
          console.log('[Animation] KP ' + this.kpId + ' initialized, ' + this.totalSteps + ' steps');
        } catch (err) {
          console.error('[Animation] KP ' + this.kpId + ' init error:', err);
          ctx.fillStyle = '#fef2f2';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#dc2626';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('动画加载出错: ' + (err.message || '未知错误'), canvas.width / 2, canvas.height / 2);
          this.totalSteps = 1;
        }
      } else {
        // No animation registered for this KP — show placeholder
        console.log('[Animation] KP ' + this.kpId + ' (' + this.kpTitle + ') — 暂无动画, 已注册KP: ' + (registry ? Object.keys(registry).join(',') : 'none'));
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9ca3af';
        ctx.font      = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('此知识点暂无交互式动画', canvas.width / 2, canvas.height / 2);
        this.totalSteps = 1;
      }
    },

    /** Delegate drawing to the animation module. */
    draw() {
      if (this.animation && this.animation.draw) {
        try {
          this.animation.draw(this.currentStep, this.sliderValue);
        } catch (err) {
          console.error('[Animation] KP ' + this.kpId + ' draw error at step ' + this.currentStep + ':', err);
        }
      }
    },

    nextStep() {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        this.draw();
      }
    },

    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.draw();
      }
    },

    reset() {
      this.currentStep = 0;
      if (this.animation && this.animation.reset) this.animation.reset();
      this.draw();
    },

    toggleAutoPlay() {
      if (this.autoPlaying) {
        clearInterval(this.autoTimer);
        this.autoTimer  = null;
        this.autoPlaying = false;
      } else {
        this.autoPlaying = true;
        this.autoTimer = setInterval(() => {
          if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.draw();
          } else {
            clearInterval(this.autoTimer);
            this.autoTimer   = null;
            this.autoPlaying = false;
          }
        }, 1500);
      }
    },

    onSliderChange() {
      this.draw();
    }
  }
};
