/**
 * CodeEditor.js — Vue component wrapping CodeMirror 5
 * Props: value (string), language ('python'|'octave'), readOnly (boolean)
 * Events: input (code string)
 *
 * NOTE: Parent must call $refs.editor.setValue(code) when switching
 * templates or languages. The value prop is only used for initial content.
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
    return { editor: null, fallbackTextarea: null };
  },
  watch: {
    language: function(newLang) {
      if (this.editor) {
        var mode = newLang === 'octave' ? 'text/x-octave' : 'text/x-python';
        this.editor.setOption('mode', mode);
      }
    }
  },
  mounted: function() {
    var self = this;
    console.log('[CodeEditor v2.1] mounted, CodeMirror available:', typeof CodeMirror !== 'undefined', 'readOnly:', this.readOnly, 'language:', this.language);

    // ---- CodeMirror path ----
    if (typeof CodeMirror !== 'undefined') {
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
        readOnly: !!this.readOnly,
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

      this.editor.setSize('100%', null);
      this.editor.getWrapperElement().style.minHeight = '300px';

      // Delayed refresh to ensure layout is settled
      setTimeout(function() { self.editor.refresh(); }, 300);
      return;
    }

    // ---- Fallback textarea path ----
    console.warn('[CodeEditor] CodeMirror not available, using fallback textarea');
    var ta = document.createElement('textarea');
    ta.className = 'w-full font-mono text-sm p-3 border rounded bg-gray-900 text-green-300';
    ta.style.cssText = 'min-height:300px; resize:vertical; outline:none; tab-size:4;';
    ta.spellcheck = false;
    ta.value = this.value || '';
    ta.readOnly = !!this.readOnly;

    ta.addEventListener('input', function() {
      self.$emit('input', ta.value);
    });
    ta.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var start = ta.selectionStart;
        var end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + '    ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 4;
        self.$emit('input', ta.value);
      }
    });

    this.$refs.container.appendChild(ta);
    this.fallbackTextarea = ta;
  },

  methods: {
    getValue: function() {
      if (this.editor) return this.editor.getValue();
      if (this.fallbackTextarea) return this.fallbackTextarea.value;
      return '';
    },
    setValue: function(val) {
      var v = val || '';
      console.log('[CodeEditor] setValue called, length:', v.length, 'hasEditor:', !!this.editor);
      if (this.editor) {
        // Use operation to batch the update and avoid change-event feedback
        var self = this;
        this.editor.operation(function() {
          var cur = self.editor.getValue();
          if (cur !== v) {
            self.editor.setValue(v);
          }
        });
      } else if (this.fallbackTextarea) {
        this.fallbackTextarea.value = v;
      }
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
    this.fallbackTextarea = null;
  }
};
