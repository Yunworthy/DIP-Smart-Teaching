/* ============================================================
 *  api.js — API wrapper with JWT auto-attach & error handling
 * ============================================================ */

var api = {
  /**
   * Core request method.
   * Automatically attaches Authorization header when a token is present.
   * Parses JSON responses and surfaces errors via store notifications.
   *
   * @param {string} method  HTTP method (GET, POST, PUT, DELETE)
   * @param {string} url     Path relative to origin, e.g. "/api/auth/login"
   * @param {*}      [body]  Request payload (will be JSON-serialized)
   * @returns {Promise<*>}   Parsed response body
   */
  async request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };

    if (store.token) {
      headers['Authorization'] = `Bearer ${store.token}`;
    }

    const config = { method, headers };
    if (body !== undefined && body !== null) {
      config.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, config);

      // Handle 401 — token expired or invalid
      if (res.status === 401) {
        if (AUTH_BYPASS) {
          // In bypass mode, ignore 401 (backend should auto-authenticate)
          return {};
        }
        if (store.examInProgress) {
          // During exam, don't logout/redirect — just throw so the caller can handle
          throw new Error('认证已过期，请在提交试卷后重新登录');
        }
        store.logout();
        throw new Error('登录已过期，请重新登录');
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || data.error || `请求失败 (${res.status})`;
        store.notify(msg, 'error');
        throw new Error(msg);
      }

      return data;
    } catch (err) {
      // Network errors (fetch itself threw)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const msg = '网络连接失败，请检查网络';
        store.notify(msg, 'error');
        throw new Error(msg);
      }
      throw err;
    }
  },

  // ------------------------------------------------------------------
  //  Auth
  // ------------------------------------------------------------------

  login(username, password) {
    return this.request('POST', '/api/auth/login', { username, password });
  },

  getMe() {
    return this.request('GET', '/api/auth/me');
  },

  changePassword(oldPassword, newPassword) {
    return this.request('PUT', '/api/auth/password', { oldPassword, newPassword });
  },

  registerUser(data) {
    return this.request('POST', '/api/admin/users', data);
  },

  // ------------------------------------------------------------------
  //  Chapters
  // ------------------------------------------------------------------

  getChapters() {
    return this.request('GET', '/api/chapters');
  },

  getChapter(id) {
    return this.request('GET', `/api/chapters/${id}`);
  },

  // ------------------------------------------------------------------
  //  Simulations
  // ------------------------------------------------------------------

  getSimulations() {
    return this.request('GET', '/api/simulations');
  },

  getSimulation(key) {
    return this.request('GET', `/api/simulations/${key}`);
  },

  // ------------------------------------------------------------------
  //  Code Execution
  // ------------------------------------------------------------------

  runCode(data) {
    return this.request('POST', '/api/code/run', data);
  },

  runSteps(data) {
    return this.request('POST', '/api/code/run-steps', data);
  },

  getCodeSubmissions(simKey) {
    return this.request('GET', `/api/code/submissions/${simKey}`);
  },

  // ------------------------------------------------------------------
  //  Assignments
  // ------------------------------------------------------------------

  getAssignments() {
    return this.request('GET', '/api/assignments');
  },

  createAssignment(data) {
    return this.request('POST', '/api/assignments', data);
  },

  updateAssignment(id, data) {
    return this.request('PUT', `/api/assignments/${id}`, data);
  },

  deleteAssignment(id) {
    return this.request('DELETE', `/api/assignments/${id}`);
  },

  getAssignmentSubmissions(id) {
    return this.request('GET', `/api/assignments/${id}/submissions`);
  },

  // ------------------------------------------------------------------
  //  Submissions
  // ------------------------------------------------------------------

  submitAssignment(data) {
    return this.request('POST', '/api/submissions', data);
  },

  getMySubmissions() {
    return this.request('GET', '/api/submissions/mine');
  },

  reviewSubmission(id, data) {
    return this.request('PUT', `/api/submissions/${id}/review`, data);
  },

  batchReviewSubmissions(data) {
    return this.request('POST', '/api/submissions/batch-review', data);
  },

  // ------------------------------------------------------------------
  //  File Upload
  // ------------------------------------------------------------------

  async uploadFile(formData) {
    const headers = {};
    if (store.token) {
      headers['Authorization'] = `Bearer ${store.token}`;
    }
    // Don't set Content-Type - browser will set it with boundary for multipart
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    if (res.status === 401) {
      if (!AUTH_BYPASS) store.logout();
      throw new Error('登录已过期，请重新登录');
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '上传失败');
    }
    return data;
  },

  // ------------------------------------------------------------------
  //  Enterprise Cases
  // ------------------------------------------------------------------

  getCases() {
    return this.request('GET', '/api/cases');
  },

  getCase(id) {
    return this.request('GET', `/api/cases/${id}`);
  },

  // ------------------------------------------------------------------
  //  Knowledge Graph
  // ------------------------------------------------------------------

  /**
   * Get knowledge graph data.
   * @param {number|string} [chapterId]  If provided, fetch chapter-specific graph
   */
  getKnowledgeGraph(chapterId) {
    const url = chapterId
      ? `/api/knowledge-graph/${chapterId}`
      : '/api/knowledge-graph';
    return this.request('GET', url);
  },

  updateProgress(data) {
    return this.request('PUT', '/api/knowledge-graph/progress', data);
  },

  getMyProgress() {
    return this.request('GET', '/api/knowledge-graph/progress');
  },

  // ------------------------------------------------------------------
  //  Resources
  // ------------------------------------------------------------------

  getResources() {
    return this.request('GET', '/api/resources');
  },

  async uploadResource(formData) {
    const headers = {};
    if (store.token) {
      headers['Authorization'] = `Bearer ${store.token}`;
    }
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    if (res.status === 401) {
      if (!AUTH_BYPASS) store.logout();
      throw new Error('登录已过期，请重新登录');
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '上传资源失败');
    }
    return data;
  },

  updateResource(id, data) {
    return this.request('PUT', `/api/resources/${id}`, data);
  },

  deleteResource(id) {
    return this.request('DELETE', `/api/resources/${id}`);
  },

  // ------------------------------------------------------------------
  //  Admin
  // ------------------------------------------------------------------

  getAdminStats() {
    return this.request('GET', '/api/admin/stats');
  },

  getUsers(page = 1, limit = 20) {
    return this.request('GET', `/api/admin/users?page=${page}&limit=${limit}`);
  },

  createUser(data) {
    return this.request('POST', '/api/admin/users', data);
  },

  updateUser(id, data) {
    return this.request('PUT', `/api/admin/users/${id}`, data);
  },

  deleteUser(id) {
    return this.request('DELETE', `/api/admin/users/${id}`);
  },

  createAnnouncement(data) {
    return this.request('POST', '/api/announcements', data);
  },

  getAnnouncements() {
    return this.request('GET', '/api/announcements');
  },

  // ------------------------------------------------------------------
  //  Announcements (CRUD)
  // ------------------------------------------------------------------

  updateAnnouncement(id, data) {
    return this.request('PUT', `/api/announcements/${id}`, data);
  },

  deleteAnnouncement(id) {
    return this.request('DELETE', `/api/announcements/${id}`);
  },

  // ------------------------------------------------------------------
  //  Course Management (teacher)
  // ------------------------------------------------------------------

  updateChapter(id, data) {
    return this.request('PUT', `/api/chapters/${id}`, data);
  },

  addKnowledgePoint(chapterId, data) {
    return this.request('POST', `/api/chapters/${chapterId}/knowledge-points`, data);
  },

  updateKnowledgePoint(kpId, data) {
    return this.request('PUT', `/api/chapters/knowledge-points/${kpId}`, data);
  },

  deleteKnowledgePoint(kpId) {
    return this.request('DELETE', `/api/chapters/knowledge-points/${kpId}`);
  },

  // ------------------------------------------------------------------
  //  Simulation Management (teacher)
  // ------------------------------------------------------------------

  updateSimulation(id, data) {
    return this.request('PUT', `/api/simulations/${id}`, data);
  },

  // ------------------------------------------------------------------
  //  Admin Settings
  // ------------------------------------------------------------------

  resetPassword(userId, data) {
    return this.request('PUT', `/api/admin/users/${userId}/reset-password`, data);
  },
};
