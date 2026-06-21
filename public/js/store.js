/* ============================================================
 *  store.js — Global reactive store (Vue 3 global build)
 * ============================================================ */

const { reactive, ref, computed, watch, onMounted, nextTick } = Vue;

// ============================================================
//  AUTH_BYPASS: 临时关闭登录验证（恢复时改为 false）
// ============================================================
var AUTH_BYPASS = true;

var store = reactive({
  // ---- Auth state ----
  user: null,
  token: localStorage.getItem('dip-token') || null,
  isLoggedIn: !!localStorage.getItem('dip-token'),

  // Bypass mode: true when user entered via portal (no real login)
  bypassMode: AUTH_BYPASS,

  // ---- UI state ----
  sidebarOpen: (function() {
    const stored = localStorage.getItem('dip-sidebar');
    if (stored !== null) return stored === 'true';
    // Default: closed on mobile, open on desktop
    return window.innerWidth >= 1024;
  })(),
  loading: false,

  // ---- Welcome overlay ----
  showWelcome: false,
  welcomeRole: '',
  welcomeFading: false,

  // ---- Exam protection flag ----
  // When true, store.logout() will NOT redirect away from the current page.
  // Set by ExamTake component during active exams.
  examInProgress: false,

  /**
   * Show a welcome splash screen, auto-dismiss after delay
   * @param {'student'|'teacher'|'admin'} role
   * @param {number} duration ms to show (default 2200)
   */
  triggerWelcome(role, duration) {
    var self = this;
    duration = duration || 2200;
    self.showWelcome = true;
    self.welcomeRole = role;
    self.welcomeFading = false;
    setTimeout(function() {
      self.welcomeFading = true;
      setTimeout(function() {
        self.showWelcome = false;
        self.welcomeFading = false;
      }, 600);
    }, duration);
  },

  // ---- Notifications (toast queue) ----
  notifications: [],
  _notifyId: 0,

  /**
   * Persist login state
   */
  login(token, user) {
    this.token = token;
    this.user = user;
    this.isLoggedIn = true;
    localStorage.setItem('dip-token', token);
  },

  /**
   * Bypass mode: set a mock user without token (for portal entry)
   * @param {'student'|'teacher'|'admin'} role
   */
  initBypass(role) {
    if (this.user && this.user.role === role) return; // already set
    this.token = null;
    this.bypassMode = true;
    this.isLoggedIn = true;
    this.user = { id: 1, role: role, username: 'demo', name: role === 'student' ? '学生用户' : '教师用户' };
  },

  /**
   * Clear all auth state and redirect to portal/login
   */
  logout() {
    this.token = null;
    this.user = null;
    this.isLoggedIn = false;
    localStorage.removeItem('dip-token');
    // Do NOT redirect during active exam — the exam page handles its own navigation
    if (this.examInProgress) return;
    // If router is available, navigate to portal (bypass) or login
    if (window.router) {
      var target = AUTH_BYPASS ? '/' : '/login';
      window.router.push(target).catch(() => {});
    }
  },

  /**
   * Push a toast notification
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration  ms before auto-dismiss (0 = sticky)
   */
  notify(message, type = 'success', duration = 3000) {
    const id = ++this._notifyId;
    const notification = { id, message, type, visible: true };
    this.notifications.push(notification);

    if (duration > 0) {
      setTimeout(() => {
        notification.visible = false;
        // Remove from array after fade-out
        setTimeout(() => {
          const idx = this.notifications.findIndex(n => n.id === id);
          if (idx !== -1) this.notifications.splice(idx, 1);
        }, 300);
      }, duration);
    }

    return id;
  },

  /**
   * Manually dismiss a notification
   */
  dismissNotification(id) {
    const idx = this.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.notifications[idx].visible = false;
      setTimeout(() => {
        const i = this.notifications.findIndex(n => n.id === id);
        if (i !== -1) this.notifications.splice(i, 1);
      }, 300);
    }
  },

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    localStorage.setItem('dip-sidebar', this.sidebarOpen);
  },

  // ---- Role helpers ----
  get sidebarCollapsed() {
    return !this.sidebarOpen;
  },
  get isStudent() {
    return this.user && this.user.role === 'student';
  },
  get isTeacher() {
    return this.user && (this.user.role === 'teacher' || this.user.role === 'admin');
  },
  get isAdmin() {
    return this.user && this.user.role === 'admin';
  },
});
