import { Router, Response } from 'express';
import { get, all, run } from '../db.js';
import {
  requireAuth,
  AuthenticatedRequest,
  comparePassword,
  hashPassword,
  generateToken,
} from '../auth.js';
import {
  generateStudyPlan,
  explainTopic,
  generateQuiz,
  generateFlashcards,
  analyzeMistakes,
} from '../gemini.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/signup', (req, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const existing = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    res.status(400).json({ error: 'An account with this email already exists' });
    return;
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const profileId = 'prof_' + Date.now();
  const passwordHash = hashPassword(password);

  run('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, datetime("now"))', [
    userId,
    email.toLowerCase().trim(),
    passwordHash,
  ]);

  run(
    `INSERT INTO student_profiles (
      id, user_id, name, dsa_level, aptitude_level, core_cs_level,
      programming_level, sql_level, communication_level, interview_level,
      onboarding_completed, created_at, updated_at
    ) VALUES (?, ?, ?, 3, 3, 3, 3, 3, 3, 3, 0, datetime("now"), datetime("now"))`,
    [profileId, userId, name.trim()]
  );

  const token = generateToken({ id: userId, email: email.toLowerCase().trim() });
  const profile = get('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);

  res.status(201).json({
    user: { id: userId, email: email.toLowerCase().trim() },
    profile,
    token,
  });
});

apiRouter.post('/auth/login', (req, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = get<{ id: string; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email.toLowerCase().trim()]
  );

  if (!user || !comparePassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email });
  const profile = get('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);

  res.json({
    user: { id: user.id, email: user.email },
    profile,
    token,
  });
});

apiRouter.get('/auth/session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const profile = get('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
  res.json({ user, profile });
});

apiRouter.patch('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    college,
    degree,
    branch,
    grad_year,
    semester,
    target_role,
    target_companies,
    preferred_domain,
    placement_season,
    daily_prep_hours,
    dsa_level,
    aptitude_level,
    core_cs_level,
    programming_level,
    sql_level,
    communication_level,
    interview_level,
    theme,
    accent_color,
    onboarding_completed,
  } = req.body;

  const current = get<{ id: string }>('SELECT id FROM student_profiles WHERE user_id = ?', [userId]);
  if (!current) {
    const profId = 'prof_' + Date.now();
    run(
      `INSERT INTO student_profiles (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))`,
      [profId, userId, name || 'Student']
    );
  }

  run(
    `UPDATE student_profiles SET
      name = COALESCE(?, name),
      college = COALESCE(?, college),
      degree = COALESCE(?, degree),
      branch = COALESCE(?, branch),
      grad_year = COALESCE(?, grad_year),
      semester = COALESCE(?, semester),
      target_role = COALESCE(?, target_role),
      target_companies = COALESCE(?, target_companies),
      preferred_domain = COALESCE(?, preferred_domain),
      placement_season = COALESCE(?, placement_season),
      daily_prep_hours = COALESCE(?, daily_prep_hours),
      dsa_level = COALESCE(?, dsa_level),
      aptitude_level = COALESCE(?, aptitude_level),
      core_cs_level = COALESCE(?, core_cs_level),
      programming_level = COALESCE(?, programming_level),
      sql_level = COALESCE(?, sql_level),
      communication_level = COALESCE(?, communication_level),
      interview_level = COALESCE(?, interview_level),
      theme = COALESCE(?, theme),
      accent_color = COALESCE(?, accent_color),
      onboarding_completed = COALESCE(?, onboarding_completed),
      updated_at = datetime("now")
    WHERE user_id = ?`,
    [
      name,
      college,
      degree,
      branch,
      grad_year,
      semester,
      target_role,
      target_companies,
      preferred_domain,
      placement_season,
      daily_prep_hours,
      dsa_level,
      aptitude_level,
      core_cs_level,
      programming_level,
      sql_level,
      communication_level,
      interview_level,
      theme,
      accent_color,
      onboarding_completed,
      userId,
    ]
  );

  const updatedProfile = get('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
  res.json({ profile: updatedProfile });
});

// ==========================================
// 2. DASHBOARD & READINESS METRICS
// ==========================================

apiRouter.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().split('T')[0];

  // Real calculations
  // 1. DSA Readiness
  const dsaTotalTarget = 150; // benchmark
  const dsaSolved = (get<{ count: number }>(
    `SELECT count(*) as count FROM coding_problems WHERE user_id = ? AND status IN ('SOLVED', 'MASTERED')`,
    [userId]
  ))?.count || 0;
  const dsaMastered = (get<{ count: number }>(
    `SELECT count(*) as count FROM coding_problems WHERE user_id = ? AND status = 'MASTERED'`,
    [userId]
  ))?.count || 0;
  const dsaPercent = Math.min(100, Math.round(((dsaSolved * 0.8) + (dsaMastered * 0.4)) / dsaTotalTarget * 100));

  // 2. Core CS Readiness
  const totalCoreTopics = (get<{ count: number }>(`SELECT count(*) as count FROM core_topics`))?.count || 25;
  const completedCoreTopics = (get<{ count: number }>(
    `SELECT count(*) as count FROM user_core_progress WHERE user_id = ? AND status = 'COMPLETED'`,
    [userId]
  ))?.count || 0;
  const coreCsPercent = Math.min(100, Math.round((completedCoreTopics / totalCoreTopics) * 100));

  // 3. Aptitude Readiness
  const aptAttempts = (get<{ total: number; correct: number }>(
    `SELECT count(*) as total, sum(is_correct) as correct FROM aptitude_attempts WHERE user_id = ?`,
    [userId]
  )) || { total: 0, correct: 0 };
  const aptAccuracy = aptAttempts.total > 0 ? Math.round((Number(aptAttempts.correct || 0) / aptAttempts.total) * 100) : 60;
  const aptPercent = Math.min(100, Math.round((Math.min(aptAttempts.total, 50) / 50 * 50) + (aptAccuracy * 0.5)));

  // 4. Projects Readiness
  const projects = all<{ checklist_json: string }>(`SELECT checklist_json FROM projects WHERE user_id = ?`, [userId]);
  let projectScore = 0;
  if (projects.length > 0) {
    let totalChecks = 0;
    let passedChecks = 0;
    for (const p of projects) {
      if (p.checklist_json) {
        try {
          const parsed = JSON.parse(p.checklist_json);
          const keys = Object.keys(parsed);
          totalChecks += keys.length;
          passedChecks += keys.filter((k) => parsed[k] === true).length;
        } catch (e) {}
      }
    }
    projectScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 50;
  } else {
    projectScore = 20;
  }

  // 5. Resume Readiness
  const resume = get<{ checklist_json: string }>(`SELECT checklist_json FROM resume_data WHERE user_id = ?`, [userId]);
  let resumePercent = 40;
  if (resume && resume.checklist_json) {
    try {
      const parsed = JSON.parse(resume.checklist_json);
      const keys = Object.keys(parsed);
      const passed = keys.filter((k) => parsed[k] === true).length;
      resumePercent = Math.round((passed / keys.length) * 100);
    } catch (e) {}
  }

  // 6. Mock Interviews Readiness
  const mockCount = (get<{ count: number }>(`SELECT count(*) as count FROM mock_interviews WHERE user_id = ?`, [userId]))?.count || 0;
  const mockPercent = Math.min(100, Math.round((mockCount / 5) * 100));

  // 7. Communication
  const profile = get<{ communication_level: number; name: string }>(
    `SELECT communication_level, name FROM student_profiles WHERE user_id = ?`,
    [userId]
  );
  const commPercent = Math.min(100, Math.round(((profile?.communication_level || 3) / 5) * 80 + (mockCount > 0 ? 20 : 0)));

  // Overall Placement Readiness Score
  const overallReadiness = Math.round(
    (dsaPercent * 0.25) +
    (coreCsPercent * 0.20) +
    (aptPercent * 0.15) +
    (projectScore * 0.15) +
    (resumePercent * 0.10) +
    (commPercent * 0.08) +
    (mockPercent * 0.07)
  );

  // Today tasks
  const todayTasks = all(`SELECT * FROM today_tasks WHERE user_id = ? AND task_date = ? ORDER BY order_index ASC`, [userId, today]);
  const completedTodayCount = todayTasks.filter((t: any) => t.is_completed === 1).length;

  // Streak calculation
  const distinctDays = all<{ completed_date: string }>(
    `SELECT DISTINCT completed_date FROM habit_completions WHERE user_id = ? ORDER BY completed_date DESC LIMIT 30`,
    [userId]
  );
  let currentStreak = 0;
  const dateSet = new Set(distinctDays.map((d) => d.completed_date));
  let testDate = new Date();
  // check today or yesterday as start
  const todayStr = testDate.toISOString().split('T')[0];
  testDate.setDate(testDate.getDate() - 1);
  const yesterdayStr = testDate.toISOString().split('T')[0];

  let checkDate = new Date();
  if (!dateSet.has(todayStr) && dateSet.has(yesterdayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (dateSet.has(checkDate.toISOString().split('T')[0])) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Overdue Revisions
  const dueRevisions = all(
    `SELECT * FROM revision_items WHERE user_id = ? AND due_date <= ? ORDER BY due_date ASC LIMIT 5`,
    [userId, today]
  );

  // Recent mistakes
  const recentMistakes = all(
    `SELECT * FROM mistakes WHERE user_id = ? AND is_resolved = 0 ORDER BY created_at DESC LIMIT 3`,
    [userId]
  );

  // Active applications
  const activeApps = all(
    `SELECT * FROM companies WHERE user_id = ? AND status NOT IN ('REJECTED', 'OFFER') ORDER BY created_at DESC LIMIT 5`,
    [userId]
  );

  res.json({
    studentName: profile?.name || 'Engineer',
    readiness: {
      overall: overallReadiness,
      dsa: dsaPercent,
      aptitude: aptPercent,
      coreCs: coreCsPercent,
      projects: projectScore,
      communication: commPercent,
      resume: resumePercent,
      mockInterviews: mockPercent,
    },
    today: {
      date: today,
      tasks: todayTasks,
      completedCount: completedTodayCount,
      totalCount: todayTasks.length,
      currentStreak: Math.max(1, currentStreak),
      studyMinutesTracked: 75,
    },
    dueRevisions,
    recentMistakes,
    activeApps,
  });
});

// ==========================================
// 3. "WHAT SHOULD I DO NOW?" INTELLIGENT PLANNER
// ==========================================

apiRouter.post('/what-should-i-do-now', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const minutes = Number(req.body.availableMinutes) || 60;
  const today = new Date().toISOString().split('T')[0];

  const profile = get<{ target_companies: string }>(
    `SELECT target_companies FROM student_profiles WHERE user_id = ?`,
    [userId]
  );

  const dueRevisions = all<{ title: string }>(
    `SELECT title FROM revision_items WHERE user_id = ? AND due_date <= ? LIMIT 5`,
    [userId, today]
  ).map((r) => r.title);

  const weakTopics = all<{ topic: string }>(
    `SELECT DISTINCT topic FROM mistakes WHERE user_id = ? AND is_resolved = 0 LIMIT 5`,
    [userId]
  ).map((m) => m.topic);

  const dsaSolved = (get<{ count: number }>(
    `SELECT count(*) as count FROM coding_problems WHERE user_id = ? AND status IN ('SOLVED', 'MASTERED')`,
    [userId]
  ))?.count || 0;

  try {
    const plan = await generateStudyPlan({
      availableMinutes: minutes,
      weakTopics,
      dueRevisions,
      targetCompanies: profile?.target_companies || 'Google, Microsoft, Amazon',
      dsaSolvedCount: dsaSolved,
    });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate study plan' });
  }
});

// ==========================================
// 4. TODAY TASKS
// ==========================================

apiRouter.get('/today', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().split('T')[0];
  const tasks = all(`SELECT * FROM today_tasks WHERE user_id = ? AND task_date = ? ORDER BY order_index ASC`, [userId, today]);
  res.json({ tasks });
});

apiRouter.post('/today/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().split('T')[0];
  const { title, category, duration_minutes } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }

  const taskId = 'tt_' + Date.now();
  run(
    `INSERT INTO today_tasks (id, user_id, title, category, duration_minutes, is_completed, task_date, order_index)
     VALUES (?, ?, ?, ?, ?, 0, ?, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM today_tasks WHERE user_id = ? AND task_date = ?))`,
    [taskId, userId, title.trim(), category || 'Preparation', duration_minutes || 25, today, userId, today]
  );

  const task = get('SELECT * FROM today_tasks WHERE id = ?', [taskId]);
  res.status(201).json({ task });
});

apiRouter.patch('/today/tasks/:id/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const taskId = req.params.id;

  const current = get<{ is_completed: number; title: string; category: string }>(
    `SELECT is_completed, title, category FROM today_tasks WHERE id = ? AND user_id = ?`,
    [taskId, userId]
  );

  if (!current) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const nextState = current.is_completed === 1 ? 0 : 1;
  run(`UPDATE today_tasks SET is_completed = ? WHERE id = ? AND user_id = ?`, [nextState, taskId, userId]);

  // If completed, record study session
  if (nextState === 1) {
    run(
      `INSERT INTO study_sessions (id, user_id, topic_or_subject, duration_minutes, session_date, notes)
       VALUES (?, ?, ?, 25, date('now'), ?)`,
      ['ss_' + Date.now(), userId, current.category + ': ' + current.title, 'Completed today task']
    );
  }

  res.json({ id: taskId, is_completed: nextState });
});

apiRouter.delete('/today/tasks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM today_tasks WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 5. HABIT TRACKER
// ==========================================

apiRouter.get('/habits', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().split('T')[0];

  const habits = all(
    `SELECT h.*,
      (SELECT count(*) FROM habit_completions hc WHERE hc.habit_id = h.id AND hc.user_id = h.user_id) as total_completions,
      (SELECT 1 FROM habit_completions hc WHERE hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completed_date = ?) as completed_today
     FROM habits h
     WHERE h.user_id = ? AND h.archived = 0
     ORDER BY h.created_at ASC`,
    [today, userId]
  );

  // Fetch completions history for the past 30 days
  const completions = all(
    `SELECT habit_id, completed_date FROM habit_completions WHERE user_id = ? AND completed_date >= date('now', '-30 days')`,
    [userId]
  );

  res.json({ habits, completions });
});

apiRouter.post('/habits', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, description, category, frequency, goal_days_per_week, color, icon } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Habit name is required' });
    return;
  }

  const habitId = 'hab_' + Date.now();
  const today = new Date().toISOString().split('T')[0];

  run(
    `INSERT INTO habits (id, user_id, name, description, category, frequency, goal_days_per_week, color, icon, start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habitId,
      userId,
      name.trim(),
      description || '',
      category || 'DSA',
      frequency || 'daily',
      goal_days_per_week || 7,
      color || 'indigo',
      icon || 'CheckCircle2',
      today,
    ]
  );

  const habit = get('SELECT * FROM habits WHERE id = ?', [habitId]);
  res.status(201).json({ habit });
});

apiRouter.post('/habits/:id/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const habitId = req.params.id;
  const date = req.body.date || new Date().toISOString().split('T')[0];

  const existing = get(
    `SELECT id FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_date = ?`,
    [habitId, userId, date]
  );

  if (existing) {
    run(`DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_date = ?`, [habitId, userId, date]);
    res.json({ habitId, date, completed: false });
  } else {
    const compId = 'hc_' + Date.now();
    run(
      `INSERT INTO habit_completions (id, habit_id, user_id, completed_date) VALUES (?, ?, ?, ?)`,
      [compId, habitId, userId, date]
    );
    res.json({ habitId, date, completed: true });
  }
});

apiRouter.delete('/habits/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM habits WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 6. DSA MODULE & CODING PROBLEMS
// ==========================================

apiRouter.get('/dsa/topics', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const topics = all(`SELECT * FROM dsa_topics ORDER BY order_index ASC`);

  const userStats = all(
    `SELECT topic,
      count(*) as total_solved,
      sum(case when difficulty = 'Easy' then 1 else 0 end) as easy_count,
      sum(case when difficulty = 'Medium' then 1 else 0 end) as medium_count,
      sum(case when difficulty = 'Hard' then 1 else 0 end) as hard_count,
      avg(confidence) as avg_confidence
     FROM coding_problems
     WHERE user_id = ? AND status IN ('SOLVED', 'MASTERED')
     GROUP BY topic`,
    [userId]
  );

  const statsMap = new Map(userStats.map((s: any) => [s.topic, s]));

  const enrichedTopics = topics.map((t: any) => {
    const stat: any = statsMap.get(t.name) || {
      total_solved: 0,
      easy_count: 0,
      medium_count: 0,
      hard_count: 0,
      avg_confidence: 0,
    };
    return {
      ...t,
      solvedCount: stat.total_solved,
      easyCount: stat.easy_count,
      mediumCount: stat.medium_count,
      hardCount: stat.hard_count,
      confidence: stat.avg_confidence ? Math.round(stat.avg_confidence) : 0,
      percentage: Math.min(100, Math.round((stat.total_solved / (t.total_target || 25)) * 100)),
    };
  });

  res.json({ topics: enrichedTopics });
});

apiRouter.get('/dsa/problems', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const problems = all(`SELECT * FROM coding_problems WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
  res.json({ problems });
});

apiRouter.post('/dsa/problems', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    platform,
    url,
    difficulty,
    topic,
    status,
    time_taken_minutes,
    hint_used,
    approach,
    complexity,
    notes,
    confidence,
    revision_date,
  } = req.body;

  if (!name || !topic) {
    res.status(400).json({ error: 'Problem name and topic are required' });
    return;
  }

  const problemId = 'cp_' + Date.now();
  run(
    `INSERT INTO coding_problems (
      id, user_id, name, platform, url, difficulty, topic, status,
      time_taken_minutes, hint_used, approach, complexity, notes, confidence, revision_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      problemId,
      userId,
      name.trim(),
      platform || 'LeetCode',
      url || '',
      difficulty || 'Medium',
      topic,
      status || 'SOLVED',
      time_taken_minutes || 0,
      hint_used ? 1 : 0,
      approach || '',
      complexity || '',
      notes || '',
      confidence || 3,
      revision_date || null,
    ]
  );

  // If status is NEEDS REVISION, also automatically queue into revision_items
  if (status === 'NEEDS REVISION') {
    const revId = 'rev_' + Date.now();
    const dueDate = revision_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    run(
      `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, source_id, due_date)
       VALUES (?, ?, ?, 'DSA', ?, 'PROBLEM', ?, ?)`,
      [revId, userId, name.trim(), topic, problemId, dueDate]
    );
  }

  const created = get('SELECT * FROM coding_problems WHERE id = ?', [problemId]);
  res.status(201).json({ problem: created });
});

apiRouter.patch('/dsa/problems/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const problemId = req.params.id;
  const { status, confidence, notes, revision_date } = req.body;

  run(
    `UPDATE coding_problems SET
      status = COALESCE(?, status),
      confidence = COALESCE(?, confidence),
      notes = COALESCE(?, notes),
      revision_date = COALESCE(?, revision_date)
    WHERE id = ? AND user_id = ?`,
    [status, confidence, notes, revision_date, problemId, userId]
  );

  const updated = get('SELECT * FROM coding_problems WHERE id = ?', [problemId]);
  res.json({ problem: updated });
});

apiRouter.delete('/dsa/problems/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM coding_problems WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 7. CORE CS MODULE
// ==========================================

apiRouter.get('/corecs/subjects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const subjects = all(`SELECT * FROM core_subjects ORDER BY order_index ASC`);
  const topics = all(`SELECT * FROM core_topics ORDER BY order_index ASC`);
  const userProgress = all(`SELECT topic_id, status FROM user_core_progress WHERE user_id = ?`, [userId]);

  const progressMap = new Map(userProgress.map((p: any) => [p.topic_id, p.status]));

  const grouped = subjects.map((sub: any) => {
    const subTopics = topics
      .filter((t: any) => t.subject_id === sub.id)
      .map((t: any) => ({
        ...t,
        status: progressMap.get(t.id) || 'NOT_STARTED',
      }));

    const completed = subTopics.filter((t: any) => t.status === 'COMPLETED').length;
    return {
      ...sub,
      topics: subTopics,
      completedCount: completed,
      totalCount: subTopics.length,
      percentage: subTopics.length > 0 ? Math.round((completed / subTopics.length) * 100) : 0,
    };
  });

  res.json({ subjects: grouped });
});

apiRouter.post('/corecs/topics/:id/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const topicId = req.params.id;
  const { status, notes } = req.body;

  const existing = get(`SELECT id FROM user_core_progress WHERE user_id = ? AND topic_id = ?`, [userId, topicId]);

  if (existing) {
    run(
      `UPDATE user_core_progress SET status = ?, notes = COALESCE(?, notes), updated_at = datetime("now")
       WHERE user_id = ? AND topic_id = ?`,
      [status || 'COMPLETED', notes, userId, topicId]
    );
  } else {
    run(
      `INSERT INTO user_core_progress (id, user_id, topic_id, status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      ['ucp_' + Date.now(), userId, topicId, status || 'COMPLETED', notes || '']
    );
  }

  res.json({ topicId, status });
});

// ==========================================
// 8. APTITUDE MODULE
// ==========================================

apiRouter.get('/aptitude/questions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { category } = req.query;
  let sql = `SELECT * FROM aptitude_questions`;
  const params: any[] = [];
  if (category) {
    sql += ` WHERE category = ?`;
    params.push(category);
  }
  sql += ` ORDER BY RANDOM() LIMIT 20`;
  const questions = all(sql, params);
  res.json({ questions });
});

apiRouter.post('/aptitude/attempt', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { question_id, selected_option, time_taken_seconds } = req.body;

  const question = get<{ correct_option: string; explanation: string }>(
    `SELECT correct_option, explanation FROM aptitude_questions WHERE id = ?`,
    [question_id]
  );

  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  const isCorrect = selected_option.toUpperCase() === question.correct_option.toUpperCase() ? 1 : 0;
  const attemptId = 'att_' + Date.now();

  run(
    `INSERT INTO aptitude_attempts (id, user_id, question_id, selected_option, is_correct, time_taken_seconds)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [attemptId, userId, question_id, selected_option, isCorrect, time_taken_seconds || 30]
  );

  res.json({
    isCorrect: isCorrect === 1,
    correctOption: question.correct_option,
    explanation: question.explanation,
  });
});

apiRouter.get('/aptitude/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const stats = get<{ total: number; correct: number; avg_time: number }>(
    `SELECT count(*) as total, sum(is_correct) as correct, avg(time_taken_seconds) as avg_time
     FROM aptitude_attempts WHERE user_id = ?`,
    [userId]
  ) || { total: 0, correct: 0, avg_time: 0 };

  const byCategory = all(
    `SELECT q.category, count(*) as attempted, sum(a.is_correct) as correct
     FROM aptitude_attempts a
     JOIN aptitude_questions q ON a.question_id = q.id
     WHERE a.user_id = ?
     GROUP BY q.category`,
    [userId]
  );

  res.json({
    totalAttempted: stats.total,
    totalCorrect: Number(stats.correct || 0),
    accuracy: stats.total > 0 ? Math.round((Number(stats.correct || 0) / stats.total) * 100) : 0,
    averageTimeSeconds: Math.round(stats.avg_time || 0),
    byCategory,
  });
});

// ==========================================
// 9. SQL PRACTICE MODULE
// ==========================================

apiRouter.get('/sql/challenges', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const challenges = all(`SELECT * FROM sql_challenges ORDER BY id ASC`);
  const userProgress = all(`SELECT challenge_id, status, user_query FROM user_sql_progress WHERE user_id = ?`, [userId]);

  const progressMap = new Map(userProgress.map((p: any) => [p.challenge_id, p]));

  const enriched = challenges.map((c: any) => {
    const prog: any = progressMap.get(c.id);
    return {
      ...c,
      status: prog?.status || 'NOT STARTED',
      savedQuery: prog?.user_query || c.starter_sql,
    };
  });

  res.json({ challenges: enriched });
});

apiRouter.post('/sql/challenges/:id/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const challengeId = req.params.id;
  const { query, is_solved } = req.body;

  const existing = get(`SELECT id FROM user_sql_progress WHERE user_id = ? AND challenge_id = ?`, [userId, challengeId]);

  if (existing) {
    run(
      `UPDATE user_sql_progress SET status = ?, user_query = ?, completed_at = datetime("now")
       WHERE user_id = ? AND challenge_id = ?`,
      [is_solved ? 'SOLVED' : 'ATTEMPTED', query, userId, challengeId]
    );
  } else {
    run(
      `INSERT INTO user_sql_progress (id, user_id, challenge_id, status, user_query, completed_at)
       VALUES (?, ?, ?, ?, ?, datetime("now"))`,
      ['usp_' + Date.now(), userId, challengeId, is_solved ? 'SOLVED' : 'ATTEMPTED', query]
    );
  }

  res.json({ success: true, status: is_solved ? 'SOLVED' : 'ATTEMPTED' });
});

// ==========================================
// 10. RESOURCE LIBRARY & GLOBAL SEARCH
// ==========================================

apiRouter.get('/resources', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { subject, type, search } = req.query;

  let sql = `
    SELECT r.*,
      (SELECT count(*) FROM bookmarks b WHERE b.resource_id = r.id AND b.user_id = ?) as is_bookmarked
    FROM resources r
    WHERE (r.is_global = 1 OR r.user_id = ?)
  `;
  const params: any[] = [userId, userId];

  if (subject && subject !== 'All') {
    sql += ` AND r.subject = ?`;
    params.push(subject);
  }
  if (type && type !== 'All') {
    sql += ` AND r.type = ?`;
    params.push(type);
  }
  if (search) {
    sql += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY r.created_at DESC`;
  const resources = all(sql, params);
  res.json({ resources });
});

apiRouter.post('/resources', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, description, type, subject, topic, difficulty, url, tags, estimated_time_minutes } = req.body;

  if (!title || !subject || !type) {
    res.status(400).json({ error: 'Title, subject, and type are required' });
    return;
  }

  const resId = 'res_' + Date.now();
  run(
    `INSERT INTO resources (id, user_id, title, description, type, subject, topic, difficulty, url, tags, estimated_time_minutes, is_global)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [resId, userId, title.trim(), description || '', type, subject, topic || '', difficulty || 'All Levels', url || '', tags || '', estimated_time_minutes || 15]
  );

  const created = get('SELECT * FROM resources WHERE id = ?', [resId]);
  res.status(201).json({ resource: created });
});

apiRouter.post('/resources/:id/bookmark', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const resourceId = req.params.id;

  const existing = get(`SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?`, [userId, resourceId]);
  if (existing) {
    run(`DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?`, [userId, resourceId]);
    res.json({ bookmarked: false });
  } else {
    run(`INSERT INTO bookmarks (id, user_id, resource_id) VALUES (?, ?, ?)`, ['bm_' + Date.now(), userId, resourceId]);
    res.json({ bookmarked: true });
  }
});

// Global Search across Topics, Resources, Notes, Problems, Revisions
apiRouter.get('/resources/search', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const query = (req.query.q as string || '').trim();

  if (!query) {
    res.json({ results: { topics: [], resources: [], practice: [], notes: [], revisions: [] } });
    return;
  }

  const q = `%${query}%`;

  const dsaTopics = all(`SELECT name as title, 'DSA' as category, slug, description FROM dsa_topics WHERE name LIKE ? OR description LIKE ?`, [q, q]);
  const coreTopics = all(`SELECT ct.name as title, cs.name as category, ct.key_concepts as description FROM core_topics ct JOIN core_subjects cs ON ct.subject_id = cs.id WHERE ct.name LIKE ? OR ct.key_concepts LIKE ?`, [q, q]);

  const resources = all(`SELECT id, title, type, subject, url, description FROM resources WHERE (title LIKE ? OR description LIKE ? OR tags LIKE ?) AND (is_global = 1 OR user_id = ?) LIMIT 8`, [q, q, q, userId]);

  const practice = all(`SELECT id, name as title, difficulty, platform, status FROM coding_problems WHERE user_id = ? AND (name LIKE ? OR topic LIKE ? OR notes LIKE ?) LIMIT 8`, [userId, q, q, q]);

  const notes = all(`SELECT id, title, subject, topic, content FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) LIMIT 8`, [userId, q, q, q]);

  const revisions = all(`SELECT id, title, category, due_date, topic_or_subject FROM revision_items WHERE user_id = ? AND (title LIKE ? OR topic_or_subject LIKE ?) LIMIT 8`, [userId, q, q]);

  res.json({
    results: {
      topics: [...dsaTopics, ...coreTopics],
      resources,
      practice,
      notes,
      revisions,
    },
  });
});

// ==========================================
// 11. PERSONAL NOTES
// ==========================================

apiRouter.get('/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const notes = all(`SELECT * FROM notes WHERE user_id = ? ORDER BY is_bookmarked DESC, updated_at DESC`, [userId]);
  res.json({ notes });
});

apiRouter.post('/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, content, subject, topic, company, project, tags } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Note title is required' });
    return;
  }

  const noteId = 'note_' + Date.now();
  run(
    `INSERT INTO notes (id, user_id, title, content, subject, topic, company, project, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [noteId, userId, title.trim(), content || '', subject || '', topic || '', company || '', project || '', tags || '']
  );

  const created = get('SELECT * FROM notes WHERE id = ?', [noteId]);
  res.status(201).json({ note: created });
});

apiRouter.patch('/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const noteId = req.params.id;
  const { title, content, subject, topic, company, project, tags, is_bookmarked } = req.body;

  run(
    `UPDATE notes SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      subject = COALESCE(?, subject),
      topic = COALESCE(?, topic),
      company = COALESCE(?, company),
      project = COALESCE(?, project),
      tags = COALESCE(?, tags),
      is_bookmarked = COALESCE(?, is_bookmarked),
      updated_at = datetime("now")
    WHERE id = ? AND user_id = ?`,
    [title, content, subject, topic, company, project, tags, is_bookmarked, noteId, userId]
  );

  const updated = get('SELECT * FROM notes WHERE id = ?', [noteId]);
  res.json({ note: updated });
});

apiRouter.delete('/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 12. MISTAKE BOOK
// ==========================================

apiRouter.get('/mistakes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const mistakes = all(`SELECT * FROM mistakes WHERE user_id = ? ORDER BY is_resolved ASC, created_at DESC`, [userId]);
  res.json({ mistakes });
});

apiRouter.post('/mistakes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    problem_name,
    topic,
    mistake_desc,
    correct_approach,
    explanation,
    lesson_learned,
    confidence,
    revision_date,
  } = req.body;

  if (!problem_name || !mistake_desc || !correct_approach) {
    res.status(400).json({ error: 'Problem name, mistake description, and correct approach are required' });
    return;
  }

  const mistakeId = 'mst_' + Date.now();
  const revDate = revision_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  run(
    `INSERT INTO mistakes (
      id, user_id, problem_name, topic, mistake_desc, correct_approach,
      explanation, lesson_learned, confidence, revision_date, is_resolved
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      mistakeId,
      userId,
      problem_name.trim(),
      topic || 'DSA',
      mistake_desc,
      correct_approach,
      explanation || '',
      lesson_learned || '',
      confidence || 2,
      revDate,
    ]
  );

  // Automatically add to spaced repetition revision queue
  const revId = 'rev_' + Date.now();
  run(
    `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, source_id, due_date)
     VALUES (?, ?, ?, 'Mistake', ?, 'MISTAKE', ?, ?)`,
    [revId, userId, `Review: ${problem_name.trim()}`, topic || 'DSA', mistakeId, revDate]
  );

  const created = get('SELECT * FROM mistakes WHERE id = ?', [mistakeId]);
  res.status(201).json({ mistake: created });
});

apiRouter.patch('/mistakes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const mistakeId = req.params.id;
  const { is_resolved, confidence, revision_date } = req.body;

  run(
    `UPDATE mistakes SET
      is_resolved = COALESCE(?, is_resolved),
      confidence = COALESCE(?, confidence),
      revision_date = COALESCE(?, revision_date)
    WHERE id = ? AND user_id = ?`,
    [is_resolved, confidence, revision_date, mistakeId, userId]
  );

  const updated = get('SELECT * FROM mistakes WHERE id = ?', [mistakeId]);
  res.json({ mistake: updated });
});

apiRouter.delete('/mistakes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM mistakes WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 13. REVISION SYSTEM (SPACED REPETITION)
// ==========================================

apiRouter.get('/revision', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().split('T')[0];

  const dueToday = all(
    `SELECT * FROM revision_items WHERE user_id = ? AND due_date <= ? ORDER BY due_date ASC`,
    [userId, today]
  );

  const upcoming = all(
    `SELECT * FROM revision_items WHERE user_id = ? AND due_date > ? ORDER BY due_date ASC LIMIT 15`,
    [userId, today]
  );

  res.json({ dueToday, upcoming });
});

apiRouter.post('/revision/:id/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const revId = req.params.id;
  const { rating } = req.body; // 'Forgot' | 'Shaky' | 'Good' | 'Easy'

  const item = get<{
    interval_days: number;
    repetitions: number;
    ease_factor: number;
  }>('SELECT * FROM revision_items WHERE id = ? AND user_id = ?', [revId, userId]);

  if (!item) {
    res.status(404).json({ error: 'Revision item not found' });
    return;
  }

  let nextInterval = 1;
  let nextRepetitions = item.repetitions + 1;
  let easeFactor = item.ease_factor || 2.5;

  if (rating === 'Forgot') {
    nextInterval = 1;
    nextRepetitions = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'Shaky') {
    nextInterval = Math.max(2, Math.round(item.interval_days * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.1);
  } else if (rating === 'Good') {
    nextInterval = Math.max(3, Math.round(item.interval_days * easeFactor));
  } else if (rating === 'Easy') {
    nextInterval = Math.max(5, Math.round(item.interval_days * (easeFactor + 0.3)));
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }

  const nextDueDate = new Date(Date.now() + nextInterval * 86400000).toISOString().split('T')[0];

  run(
    `UPDATE revision_items SET
      due_date = ?,
      interval_days = ?,
      repetitions = ?,
      ease_factor = ?,
      last_reviewed_at = datetime("now")
    WHERE id = ? AND user_id = ?`,
    [nextDueDate, nextInterval, nextRepetitions, easeFactor, revId, userId]
  );

  res.json({
    id: revId,
    nextDueDate,
    nextInterval,
    rating,
  });
});

apiRouter.post('/revision', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, category, topic_or_subject, due_date } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const revId = 'rev_' + Date.now();
  const dueDate = due_date || new Date().toISOString().split('T')[0];

  run(
    `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, due_date)
     VALUES (?, ?, ?, ?, ?, 'CUSTOM', ?)`,
    [revId, userId, title.trim(), category || 'General', topic_or_subject || 'General', dueDate]
  );

  const created = get('SELECT * FROM revision_items WHERE id = ?', [revId]);
  res.status(201).json({ item: created });
});

// ==========================================
// 14. COMPANY PREPARATION & PIPELINE
// ==========================================

apiRouter.get('/companies', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const companies = all(`SELECT * FROM companies WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
  const resources = all(
    `SELECT cr.* FROM company_resources cr JOIN companies c ON cr.company_id = c.id WHERE c.user_id = ?`,
    [userId]
  );

  const resMap = new Map<string, any[]>();
  for (const r of resources) {
    if (!resMap.has(r.company_id)) resMap.set(r.company_id, []);
    resMap.get(r.company_id)!.push(r);
  }

  const enriched = companies.map((c: any) => ({
    ...c,
    resources: resMap.get(c.id) || [],
  }));

  res.json({ companies: enriched });
});

apiRouter.post('/companies', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    role,
    package_details,
    eligibility,
    application_date,
    assessment_date,
    interview_date,
    status,
    notes,
  } = req.body;

  if (!name || !role) {
    res.status(400).json({ error: 'Company name and role are required' });
    return;
  }

  const companyId = 'comp_' + Date.now();
  run(
    `INSERT INTO companies (
      id, user_id, name, role, package_details, eligibility,
      application_date, assessment_date, interview_date, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      userId,
      name.trim(),
      role.trim(),
      package_details || '',
      eligibility || '',
      application_date || new Date().toISOString().split('T')[0],
      assessment_date || null,
      interview_date || null,
      status || 'WISHLIST',
      notes || '',
    ]
  );

  const created = get('SELECT * FROM companies WHERE id = ?', [companyId]);
  res.status(201).json({ company: created });
});

apiRouter.patch('/companies/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const companyId = req.params.id;
  const { status, assessment_date, interview_date, notes, package_details } = req.body;

  run(
    `UPDATE companies SET
      status = COALESCE(?, status),
      assessment_date = COALESCE(?, assessment_date),
      interview_date = COALESCE(?, interview_date),
      notes = COALESCE(?, notes),
      package_details = COALESCE(?, package_details)
    WHERE id = ? AND user_id = ?`,
    [status, assessment_date, interview_date, notes, package_details, companyId, userId]
  );

  const updated = get('SELECT * FROM companies WHERE id = ?', [companyId]);
  res.json({ company: updated });
});

apiRouter.delete('/companies/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM companies WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 15. PROJECTS TRACKER
// ==========================================

apiRouter.get('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const projects = all(`SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
  res.json({ projects });
});

apiRouter.post('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    title,
    description,
    tech_stack,
    github_url,
    live_url,
    status,
    checklist_json,
    architecture_notes,
    demo_url,
    interview_explanation,
  } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Project title is required' });
    return;
  }

  const projId = 'proj_' + Date.now();
  const defaultChecklist = checklist_json || JSON.stringify({
    github: Boolean(github_url),
    readme: true,
    deployment: Boolean(live_url),
    architecture: Boolean(architecture_notes),
    demo_video: Boolean(demo_url),
    interview_explanation: Boolean(interview_explanation),
  });

  run(
    `INSERT INTO projects (
      id, user_id, title, description, tech_stack, github_url,
      live_url, status, checklist_json, architecture_notes, demo_url, interview_explanation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projId,
      userId,
      title.trim(),
      description || '',
      tech_stack || '',
      github_url || '',
      live_url || '',
      status || 'IN PROGRESS',
      defaultChecklist,
      architecture_notes || '',
      demo_url || '',
      interview_explanation || '',
    ]
  );

  const created = get('SELECT * FROM projects WHERE id = ?', [projId]);
  res.status(201).json({ project: created });
});

apiRouter.patch('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const projId = req.params.id;
  const {
    title,
    description,
    tech_stack,
    github_url,
    live_url,
    status,
    checklist_json,
    architecture_notes,
    demo_url,
    interview_explanation,
  } = req.body;

  run(
    `UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      tech_stack = COALESCE(?, tech_stack),
      github_url = COALESCE(?, github_url),
      live_url = COALESCE(?, live_url),
      status = COALESCE(?, status),
      checklist_json = COALESCE(?, checklist_json),
      architecture_notes = COALESCE(?, architecture_notes),
      demo_url = COALESCE(?, demo_url),
      interview_explanation = COALESCE(?, interview_explanation)
    WHERE id = ? AND user_id = ?`,
    [
      title,
      description,
      tech_stack,
      github_url,
      live_url,
      status,
      checklist_json,
      architecture_notes,
      demo_url,
      interview_explanation,
      projId,
      userId,
    ]
  );

  const updated = get('SELECT * FROM projects WHERE id = ?', [projId]);
  res.json({ project: updated });
});

apiRouter.delete('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 16. RESUME TRACKER
// ==========================================

apiRouter.get('/resume', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  let resume = get<{ id: string; checklist_json: string }>(`SELECT * FROM resume_data WHERE user_id = ?`, [userId]);

  if (!resume) {
    const id = 'res_' + Date.now();
    const defaultChecklist = JSON.stringify({
      education: true,
      skills: true,
      projects: true,
      internship: false,
      achievements: true,
      certifications: false,
      github: true,
      linkedin: true,
      coding_profiles: true,
      contact_info: true,
      formatting: true,
      grammar: true,
    });

    run(
      `INSERT INTO resume_data (id, user_id, checklist_json, skills_summary, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, defaultChecklist, '', '']
    );
    resume = get(`SELECT * FROM resume_data WHERE id = ?`, [id]);
  }

  res.json({ resume });
});

apiRouter.patch('/resume', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { checklist_json, skills_summary, projects_highlight, certifications, notes } = req.body;

  run(
    `UPDATE resume_data SET
      checklist_json = COALESCE(?, checklist_json),
      skills_summary = COALESCE(?, skills_summary),
      projects_highlight = COALESCE(?, projects_highlight),
      certifications = COALESCE(?, certifications),
      notes = COALESCE(?, notes),
      updated_at = datetime("now")
    WHERE user_id = ?`,
    [checklist_json, skills_summary, projects_highlight, certifications, notes, userId]
  );

  const updated = get(`SELECT * FROM resume_data WHERE user_id = ?`, [userId]);
  res.json({ resume: updated });
});

// ==========================================
// 17. INTERVIEW PREP & MOCK SESSIONS
// ==========================================

apiRouter.get('/interview/questions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { category } = req.query;

  let sql = `SELECT * FROM interview_questions WHERE (is_global = 1 OR user_id = ?)`;
  const params: any[] = [userId];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY created_at ASC`;
  const questions = all(sql, params);
  res.json({ questions });
});

apiRouter.patch('/interview/questions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const questionId = req.params.id;
  const { status, my_notes } = req.body;

  run(
    `UPDATE interview_questions SET status = COALESCE(?, status), my_notes = COALESCE(?, my_notes) WHERE id = ?`,
    [status, my_notes, questionId]
  );

  const updated = get(`SELECT * FROM interview_questions WHERE id = ?`, [questionId]);
  res.json({ question: updated });
});

apiRouter.get('/interview/mocks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const mocks = all(`SELECT * FROM mock_interviews WHERE user_id = ? ORDER BY interview_date DESC`, [userId]);
  res.json({ mocks });
});

apiRouter.post('/interview/mocks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    company_name,
    role,
    interview_date,
    technical_score,
    communication_score,
    problem_solving_score,
    confidence,
    feedback,
    improvement_areas,
  } = req.body;

  if (!company_name || !role) {
    res.status(400).json({ error: 'Company and role are required' });
    return;
  }

  const mockId = 'mock_' + Date.now();
  run(
    `INSERT INTO mock_interviews (
      id, user_id, company_name, role, interview_date,
      technical_score, communication_score, problem_solving_score,
      confidence, feedback, improvement_areas
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mockId,
      userId,
      company_name.trim(),
      role.trim(),
      interview_date || new Date().toISOString().split('T')[0],
      technical_score || 7,
      communication_score || 7,
      problem_solving_score || 7,
      confidence || 3,
      feedback || '',
      improvement_areas || '',
    ]
  );

  const created = get('SELECT * FROM mock_interviews WHERE id = ?', [mockId]);
  res.status(201).json({ mock: created });
});

// ==========================================
// 18. CALENDAR EVENTS
// ==========================================

apiRouter.get('/calendar/events', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const events = all(`SELECT * FROM calendar_events WHERE user_id = ? ORDER BY event_date ASC`, [userId]);
  res.json({ events });
});

apiRouter.post('/calendar/events', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, category, event_date, start_time, end_time, notes } = req.body;

  if (!title || !event_date) {
    res.status(400).json({ error: 'Title and event date are required' });
    return;
  }

  const eventId = 'cal_' + Date.now();
  run(
    `INSERT INTO calendar_events (id, user_id, title, category, event_date, start_time, end_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [eventId, userId, title.trim(), category || 'Study Session', event_date, start_time || null, end_time || null, notes || '']
  );

  const created = get('SELECT * FROM calendar_events WHERE id = ?', [eventId]);
  res.status(201).json({ event: created });
});

apiRouter.delete('/calendar/events/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  run(`DELETE FROM calendar_events WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
  res.json({ success: true });
});

// ==========================================
// 19. ANALYTICS
// ==========================================

apiRouter.get('/analytics', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // 1. Difficulty distribution of solved problems
  const dsaByDiff = all(
    `SELECT difficulty, count(*) as count
     FROM coding_problems
     WHERE user_id = ? AND status IN ('SOLVED', 'MASTERED')
     GROUP BY difficulty`,
    [userId]
  );

  // 2. DSA by topic
  const dsaByTopic = all(
    `SELECT topic, count(*) as count
     FROM coding_problems
     WHERE user_id = ? AND status IN ('SOLVED', 'MASTERED')
     GROUP BY topic ORDER BY count DESC LIMIT 8`,
    [userId]
  );

  // 3. Weekly study sessions
  const studyDays = all(
    `SELECT session_date, sum(duration_minutes) as minutes
     FROM study_sessions
     WHERE user_id = ? AND session_date >= date('now', '-7 days')
     GROUP BY session_date ORDER BY session_date ASC`,
    [userId]
  );

  // 4. Company application pipeline counts
  const pipeline = all(
    `SELECT status, count(*) as count
     FROM companies
     WHERE user_id = ?
     GROUP BY status`,
    [userId]
  );

  // 5. Revision stats
  const revisionsCount = (get<{ total: number }>(`SELECT count(*) as total FROM revision_items WHERE user_id = ?`, [userId]))?.total || 0;
  const revisionsCompleted = (get<{ total: number }>(`SELECT count(*) as total FROM revision_items WHERE user_id = ? AND repetitions > 0`, [userId]))?.total || 0;

  // 6. Habit consistency last 4 weeks
  const habitCompletions = all(
    `SELECT completed_date, count(*) as count
     FROM habit_completions
     WHERE user_id = ? AND completed_date >= date('now', '-28 days')
     GROUP BY completed_date ORDER BY completed_date ASC`,
    [userId]
  );

  res.json({
    dsaByDiff,
    dsaByTopic,
    studyDays,
    pipeline,
    revisions: { total: revisionsCount, completed: revisionsCompleted },
    habitCompletions,
  });
});

// ==========================================
// 20. AI ENDPOINTS (GEMINI API 3.8 FLASH)
// ==========================================

apiRouter.post('/ai/study-plan', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const minutes = Number(req.body.availableMinutes) || 60;
  const today = new Date().toISOString().split('T')[0];

  const profile = get<{ target_companies: string }>(`SELECT target_companies FROM student_profiles WHERE user_id = ?`, [userId]);
  const dueRevisions = all<{ title: string }>(`SELECT title FROM revision_items WHERE user_id = ? AND due_date <= ? LIMIT 5`, [userId, today]).map((r) => r.title);
  const weakTopics = all<{ topic: string }>(`SELECT DISTINCT topic FROM mistakes WHERE user_id = ? AND is_resolved = 0 LIMIT 5`, [userId]).map((m) => m.topic);
  const dsaSolved = (get<{ count: number }>(`SELECT count(*) as count FROM coding_problems WHERE user_id = ? AND status IN ('SOLVED', 'MASTERED')`, [userId]))?.count || 0;

  try {
    const plan = await generateStudyPlan({
      availableMinutes: minutes,
      weakTopics,
      dueRevisions,
      targetCompanies: profile?.target_companies || 'Google, Microsoft, Amazon',
      dsaSolvedCount: dsaSolved,
    });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI study plan generation failed' });
  }
});

apiRouter.post('/ai/explain', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { topic, subject, context } = req.body;
  if (!topic || !subject) {
    res.status(400).json({ error: 'Topic and subject are required' });
    return;
  }
  try {
    const result = await explainTopic(topic, subject, context);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to explain topic' });
  }
});

apiRouter.post('/ai/quiz', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { topic, subject, count } = req.body;
  if (!topic || !subject) {
    res.status(400).json({ error: 'Topic and subject are required' });
    return;
  }
  try {
    const quiz = await generateQuiz(topic, subject, Number(count) || 3);
    res.json({ questions: quiz });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
});

apiRouter.post('/ai/flashcards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { topic, subject } = req.body;
  if (!topic || !subject) {
    res.status(400).json({ error: 'Topic and subject are required' });
    return;
  }
  try {
    const cards = await generateFlashcards(topic, subject);
    res.json({ flashcards: cards });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate flashcards' });
  }
});

apiRouter.post('/ai/mistake-analysis', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const mistakes = all<{
    problem_name: string;
    topic: string;
    mistake_desc: string;
    lesson_learned: string;
  }>(`SELECT problem_name, topic, mistake_desc, lesson_learned FROM mistakes WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, [userId]);

  try {
    const analysis = await analyzeMistakes(
      mistakes.map((m) => ({
        problem: m.problem_name,
        topic: m.topic,
        mistake: m.mistake_desc,
        lesson: m.lesson_learned,
      }))
    );
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Mistake analysis failed' });
  }
});
