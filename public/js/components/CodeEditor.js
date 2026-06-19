/**
 * CodeEditor.js — Vue component wrapping CodeMirror 5
 * Props: value (string), language ('python'|'octave'), readOnly (boolean)
 * Events: input (code string)
 */
var CodeEditor = {
  name: 'CodeEditor',
  template: '<div ref="container" class="code-editor-container"></div>',
  props: {
    value: { type: String, default: '' },
    language: { type: String, default: 'python' },
    readOnly: { type: Boolean, default: false }
  },
  data: function() {
    return { editor: null };
  },
  watch: {
    value: function(newVal) {
      if (this.editor && this.editor.getValue() !== newVal) {
        this.editor.setValue(newVal || '');
      }
    },
    language: function(newLang) {
      if (this.editor) {
        var mode = newLang === 'octave' ? 'text/x-octave' : 'text/x-python';
        this.editor.setOption('mode', mode);
      }
    }
  },
  mounted: function() {
    var self = this;
    if (typeof CodeMirror === 'undefined') {
      // Fallback if CodeMirror CDN fails
      this.$refs.container.innerHTML = '<textarea class="w-full font-mono text-sm p-3 border rounded" style="min-height:300px">' + (this.value || '') + '</textarea>';
      return;
    }
    var mode = this.language === 'octave' ? 'text/x-octave' : 'text/x-python';
    this.editor = CodeMirror(this.$refs.container, {
      value: this.value || '',
      mode: mode,
      theme: 'dracula',
      lineNumbers: true,
      lineWrapping: false,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      readOnly: this.readOnly,
      viewportMargin: 50,
      extraKeys: {
        'Tab': function(cm) {
          if (cm.somethingSelected()) {
            cm.indentSelection('add');
          } else {
            cm.replaceSelection('    ', 'end');
          }
        }
      }
    });
    this.editor.on('change', function() {
      self.$emit('input', self.editor.getValue());
    });
    // Set min height
    this.editor.setSize('100%', null);
    this.editor.getWrapperElement().style.minHeight = '300px';
  },
  methods: {
    getValue: function() {
      return this.editor ? this.editor.getValue() : '';
    },
    setValue: function(val) {
      if (this.editor) this.editor.setValue(val || '');
    },
    refresh: function() {
      if (this.editor) {
        var self = this;
        setTimeout(function() { self.editor.refresh(); }, 100);
      }
    }
  },
  beforeUnmount: function() {
    if (this.editor) {
      this.editor.toTextArea && this.editor.toTextArea();
      this.editor = null;
    }
  }
};
