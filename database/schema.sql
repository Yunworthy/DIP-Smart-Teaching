-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
    student_id TEXT,
    class_name TEXT,
    email TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

-- 课程章节表
CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sort_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT
);

-- 知识点表 (知识图谱节点)
CREATE TABLE IF NOT EXISTS knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER REFERENCES chapters(id),
    parent_id INTEGER REFERENCES knowledge_points(id),
    title TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    category TEXT DEFAULT 'concept',
    principle TEXT
);

-- 知识点关系表 (知识图谱边)
CREATE TABLE IF NOT EXISTS kp_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES knowledge_points(id),
    target_id INTEGER REFERENCES knowledge_points(id),
    relation_type TEXT DEFAULT 'prerequisite',
    weight REAL DEFAULT 1.0
);

-- 知识点与实验关联
CREATE TABLE IF NOT EXISTS kp_simulations (
    knowledge_point_id INTEGER REFERENCES knowledge_points(id),
    simulation_key TEXT NOT NULL,
    PRIMARY KEY (knowledge_point_id, simulation_key)
);

-- 仿真实验表
CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sim_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    chapter_id INTEGER REFERENCES chapters(id),
    category TEXT DEFAULT 'basic',
    parameters TEXT,
    sample_image TEXT,
    case_text TEXT,
    requirements TEXT,
    python_template TEXT,
    matlab_template TEXT,
    ai_hints TEXT,
    difficulty INTEGER DEFAULT 3
);

-- 代码提交记录表
CREATE TABLE IF NOT EXISTS code_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES users(id),
    simulation_key TEXT NOT NULL,
    language TEXT NOT NULL CHECK(language IN ('python','octave')),
    code TEXT NOT NULL,
    stdout TEXT,
    stderr TEXT,
    output_images TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','running','success','error','timeout')),
    execution_time REAL DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 企业案例表
CREATE TABLE IF NOT EXISTS enterprise_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    related_chapter_id INTEGER REFERENCES chapters(id),
    content TEXT,
    code_url TEXT,
    demo_video TEXT,
    sample_images TEXT,
    results_text TEXT,
    production_issues TEXT,
    difficulty INTEGER DEFAULT 3
);

-- 作业表
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('homework','lab_report','comprehensive')),
    chapter_id INTEGER REFERENCES chapters(id),
    simulation_key TEXT,
    deadline DATETIME,
    max_score INTEGER DEFAULT 100,
    grading_rubric TEXT,
    is_published INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 作业提交表
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER REFERENCES assignments(id),
    student_id INTEGER REFERENCES users(id),
    content TEXT,
    file_path TEXT,
    simulation_result TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','reviewed','returned','graded')),
    score INTEGER,
    feedback TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at DATETIME
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES users(id),
    knowledge_point_id INTEGER REFERENCES knowledge_points(id),
    mastery_level INTEGER DEFAULT 0,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    simulation_completed INTEGER DEFAULT 0,
    UNIQUE(student_id, knowledge_point_id)
);

-- 系统公告
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT,
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教学资源表
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('ppt','experiment_guide','case','video','document','image','other')),
    description TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size INTEGER,
    url TEXT,
    uploader_id INTEGER REFERENCES users(id),
    chapter_id INTEGER REFERENCES chapters(id),
    download_count INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 题库
CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER REFERENCES chapters(id),
    type TEXT NOT NULL CHECK(type IN ('single_choice','multi_choice','true_false','fill_blank','short_answer')),
    content TEXT NOT NULL,
    options TEXT,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER DEFAULT 3,
    score_weight INTEGER DEFAULT 5,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 考试
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id),
    chapter_ids TEXT,
    duration_minutes INTEGER DEFAULT 60,
    total_score INTEGER DEFAULT 100,
    pass_score INTEGER DEFAULT 60,
    question_count INTEGER DEFAULT 20,
    shuffle_questions INTEGER DEFAULT 1,
    shuffle_options INTEGER DEFAULT 1,
    is_published INTEGER DEFAULT 0,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 考试题目关联
CREATE TABLE IF NOT EXISTS exam_questions_map (
    exam_id INTEGER REFERENCES exams(id),
    question_id INTEGER REFERENCES exam_questions(id),
    sort_order INTEGER DEFAULT 0,
    score INTEGER DEFAULT 5,
    PRIMARY KEY (exam_id, question_id)
);

-- 考试作答记录
CREATE TABLE IF NOT EXISTS exam_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER REFERENCES exams(id),
    student_id INTEGER REFERENCES users(id),
    answers TEXT,
    question_order TEXT,
    total_score INTEGER,
    objective_score INTEGER,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted','graded','timed_out'))
);

-- 用户通知
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('assignment_graded','assignment_published','exam_published','system','announcement')),
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    username TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    detail TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HTTP请求日志
CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT,
    path TEXT,
    status_code INTEGER,
    response_time REAL,
    user_id INTEGER,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kp_chapter ON knowledge_points(chapter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON learning_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_code_sub_student ON code_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_code_sub_sim ON code_submissions(simulation_key);
CREATE INDEX IF NOT EXISTS idx_exam_q_chapter ON exam_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_reqlog_created ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
