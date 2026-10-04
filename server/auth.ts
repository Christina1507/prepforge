import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { get, run, all } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prepforge-jwt-super-secret-key-2026';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    return;
  }

  // Verify user still exists in database
  const dbUser = get<{ id: string; email: string }>('SELECT id, email FROM users WHERE id = ?', [user.id]);
  if (!dbUser) {
    res.status(401).json({ error: 'Unauthorized: User not found' });
    return;
  }

  req.user = dbUser;
  next();
}

export function seedDemoUserIfNeeded(): void {
  const existingUser = get<{ id: string; email: string }>('SELECT id, email FROM users LIMIT 1');
  if (!existingUser) {
    const demoId = 'user_demo_101';
    const passwordHash = hashPassword('prepforge2026');
    const today = new Date().toISOString().split('T')[0];

    run(
      `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [demoId, 'alex.chen@prepforge.edu', passwordHash]
    );

    run(
      `INSERT INTO student_profiles (
        id, user_id, name, college, degree, branch, grad_year, semester,
        target_role, target_companies, preferred_domain, placement_season,
        daily_prep_hours, dsa_level, aptitude_level, core_cs_level,
        programming_level, sql_level, communication_level, interview_level,
        theme, accent_color, onboarding_completed, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )`,
      [
        'prof_demo_101',
        demoId,
        'Alex Chen',
        'National Institute of Technology',
        'B.Tech',
        'Computer Science & Engineering',
        2027,
        6,
        'Software Development Engineer (SDE-1)',
        'Google, Microsoft, Amazon, Atlassian, Stripe',
        'Backend & Distributed Systems',
        'Fall 2026 / Campus Placement',
        2.5,
        4, 3, 4, 4, 4, 3, 3,
        'system',
        'indigo',
        1
      ]
    );

    // Initial habits
    const defaultHabits = [
      { id: 'hab_1', name: 'Solve 2 DSA Problems', desc: 'Focus on medium level patterns (sliding window, binary search)', cat: 'DSA', target: 7, color: 'indigo', icon: 'Code2' },
      { id: 'hab_2', name: 'Revise Core CS Topic', desc: 'OS, DBMS, CN or System Design quick revision notes', cat: 'Core CS', target: 5, color: 'emerald', icon: 'BookOpen' },
      { id: 'hab_3', name: 'Practice 15 Aptitude Questions', desc: 'Speed math, probability and logical deduction drills', cat: 'Aptitude', target: 5, color: 'amber', icon: 'Calculator' },
      { id: 'hab_4', name: 'SQL Query Challenge', desc: 'Solve one window function or complex join problem', cat: 'SQL', target: 4, color: 'sky', icon: 'Database' },
      { id: 'hab_5', name: 'Project Development / GitHub', desc: 'Commit feature code and document architecture', cat: 'Projects', target: 4, color: 'violet', icon: 'GitPullRequest' }
    ];

    for (const h of defaultHabits) {
      run(
        `INSERT INTO habits (id, user_id, name, description, category, frequency, goal_days_per_week, color, icon, start_date)
         VALUES (?, ?, ?, ?, ?, 'daily', ?, ?, ?, ?)`,
        [h.id, demoId, h.name, h.desc, h.cat, h.target, h.color, h.icon, today]
      );
    }

    // Mark 3 completions for today and yesterday for realism
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    run(`INSERT INTO habit_completions (id, habit_id, user_id, completed_date) VALUES (?, ?, ?, ?)`, ['hc_1', 'hab_1', demoId, today]);
    run(`INSERT INTO habit_completions (id, habit_id, user_id, completed_date) VALUES (?, ?, ?, ?)`, ['hc_2', 'hab_2', demoId, today]);
    run(`INSERT INTO habit_completions (id, habit_id, user_id, completed_date) VALUES (?, ?, ?, ?)`, ['hc_3', 'hab_1', demoId, yesterday]);
    run(`INSERT INTO habit_completions (id, habit_id, user_id, completed_date) VALUES (?, ?, ?, ?)`, ['hc_4', 'hab_3', demoId, yesterday]);

    // Initial coding problems tracked
    const sampleProblems = [
      { id: 'cp_1', name: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', diff: 'Medium', topic: 'Sliding Window', status: 'SOLVED', time: 24, notes: 'Maintain window set or last seen index map to shrink left pointer.', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', conf: 4 },
      { id: 'cp_2', name: 'Trapping Rain Water', platform: 'LeetCode', diff: 'Hard', topic: 'Two Pointers', status: 'NEEDS REVISION', time: 42, notes: 'Prefix max vs two pointers from left & right. Need to revisit space-optimized approach.', url: 'https://leetcode.com/problems/trapping-rain-water/', conf: 3 },
      { id: 'cp_3', name: 'Binary Tree Level Order Traversal', platform: 'LeetCode', diff: 'Medium', topic: 'Trees', status: 'MASTERED', time: 18, notes: 'Standard BFS with queue tracking level size in each iteration.', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', conf: 5 },
      { id: 'cp_4', name: 'Coin Change', platform: 'LeetCode', diff: 'Medium', topic: 'Dynamic Programming', status: 'SOLVED', time: 30, notes: 'Unbounded knapsack style 1D DP array initialized to infinity.', url: 'https://leetcode.com/problems/coin-change/', conf: 4 },
      { id: 'cp_5', name: 'Course Schedule (Cycle in Directed Graph)', platform: 'LeetCode', diff: 'Medium', topic: 'Graphs', status: 'SOLVED', time: 28, notes: 'Kahn algorithm with indegree array or DFS with 3-color visited array.', url: 'https://leetcode.com/problems/course-schedule/', conf: 4 },
      { id: 'cp_6', name: 'Merge Intervals', platform: 'LeetCode', diff: 'Medium', topic: 'Sorting', status: 'SOLVED', time: 15, notes: 'Sort by start time, compare current interval with last merged.', url: 'https://leetcode.com/problems/merge-intervals/', conf: 5 }
    ];

    for (const p of sampleProblems) {
      run(
        `INSERT INTO coding_problems (id, user_id, name, platform, url, difficulty, topic, status, time_taken_minutes, notes, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [p.id, demoId, p.name, p.platform, p.url, p.diff, p.topic, p.status, p.time, p.notes, p.conf]
      );
    }

    // Core CS topic progress
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_1', ?, 'dbms_keys', 'COMPLETED')`, [demoId]);
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_2', ?, 'dbms_er', 'COMPLETED')`, [demoId]);
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_3', ?, 'dbms_algebra', 'COMPLETED')`, [demoId]);
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_4', ?, 'dbms_norm', 'IN_PROGRESS')`, [demoId]);
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_5', ?, 'os_proc', 'COMPLETED')`, [demoId]);
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_6', ?, 'os_sched', 'COMPLETED')`, [demoId]);
    run(`INSERT INTO user_core_progress (id, user_id, topic_id, status) VALUES ('ucp_7', ?, 'cn_models', 'COMPLETED')`, [demoId]);

    // Sample Mistakes in Mistake Book
    run(
      `INSERT INTO mistakes (id, user_id, problem_name, topic, mistake_desc, correct_approach, explanation, lesson_learned, confidence, revision_date, is_resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        'mst_1',
        demoId,
        'Search in Rotated Sorted Array',
        'Binary Search',
        'Did not check whether mid fell on the left sorted half or right sorted half before deciding branch.',
        'First determine if nums[left] <= nums[mid]. If so, left half is strictly sorted. Check if target lies between nums[left] and nums[mid].',
        'In a rotated array, at least one half (left or right) is guaranteed to be strictly sorted at all times.',
        'Always establish which partition is strictly ordered first before discarding search space.',
        2,
        today
      ]
    );

    run(
      `INSERT INTO mistakes (id, user_id, problem_name, topic, mistake_desc, correct_approach, explanation, lesson_learned, confidence, revision_date, is_resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        'mst_2',
        demoId,
        'DBMS Normalization 3NF vs BCNF',
        'DBMS',
        'Forgot that in BCNF, every determinant must be a candidate key, whereas in 3NF the RHS can be a prime attribute.',
        'For alpha -> beta: in 3NF, either alpha is superkey OR beta is prime. In BCNF, alpha MUST be superkey with no exception.',
        'BCNF is strictly stronger than 3NF. All BCNF tables are in 3NF, but not vice versa.',
        'Write out all candidate keys before evaluating functional dependencies.',
        3,
        today
      ]
    );

    // Initial Revision Items (Due today & upcoming)
    run(
      `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, due_date, interval_days, repetitions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['rev_1', demoId, 'DBMS Transactions & Isolation Levels', 'Core CS', 'DBMS', 'TOPIC', today, 1, 1]
    );
    run(
      `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, due_date, interval_days, repetitions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['rev_2', demoId, 'Sliding Window Variable Sized Templates', 'DSA', 'Sliding Window', 'DSA_TOPIC', today, 2, 2]
    );
    run(
      `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, due_date, interval_days, repetitions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['rev_3', demoId, 'SQL Window Functions (DENSE_RANK vs RANK)', 'SQL', 'SQL Practice', 'SQL', today, 3, 2]
    );

    // Initial Company Applications Pipeline
    run(
      `INSERT INTO companies (id, user_id, name, role, package_details, eligibility, application_date, assessment_date, interview_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'comp_1',
        demoId,
        'Google',
        'Software Engineer, Early Career',
        '₹32 - 45 LPA',
        'B.Tech CSE/IT, CGPA >= 7.5, no active backlogs',
        '2026-08-15',
        '2026-09-10',
        '2026-10-18',
        'TECHNICAL',
        'Round 1 cleared. Prepping graphs, DP, and system architecture for round 2.'
      ]
    );
    run(
      `INSERT INTO companies (id, user_id, name, role, package_details, eligibility, application_date, assessment_date, interview_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'comp_2',
        demoId,
        'Microsoft',
        'Software Engineer (SDE-1)',
        '₹28 - 36 LPA',
        'B.Tech all circuital branches, CGPA >= 7.0',
        '2026-08-20',
        '2026-09-25',
        null,
        'ONLINE ASSESSMENT',
        'Online Codility assessment link received. 3 coding problems in 90 mins.'
      ]
    );
    run(
      `INSERT INTO companies (id, user_id, name, role, package_details, eligibility, application_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'comp_3',
        demoId,
        'Atlassian',
        'Associate Software Engineer',
        '₹35 - 52 LPA',
        'B.Tech CSE, CGPA >= 8.0',
        '2026-08-01',
        'WISHLIST',
        'Strong focus on clean OOP, design patterns, and value-based behavioral interview.'
      ]
    );

    // Initial Projects
    run(
      `INSERT INTO projects (id, user_id, title, description, tech_stack, github_url, live_url, status, checklist_json, architecture_notes, demo_url, interview_explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'proj_1',
        demoId,
        'Distributed Task Queue & Job Scheduler',
        'High-throughput asynchronous task worker queue with Redis backing, exponential backoff retries, and dead-letter queue inspection dashboard.',
        'Go, Redis, Docker, PostgreSQL, Prometheus',
        'https://github.com/alexchen/distributed-task-queue',
        'https://queue-demo.alexchen.dev',
        'COMPLETED',
        JSON.stringify({
          github: true,
          readme: true,
          deployment: true,
          architecture: true,
          demo_video: false,
          interview_explanation: true
        }),
        'Leader-follower worker nodes utilizing Redis Streams consumer groups for atomic job delivery without duplicate execution.',
        'https://youtu.be/sample-queue-demo',
        'Discussed idempotency guarantees, handling network partitions during task execution, and how visibility timeouts prevent dropped tasks.'
      ]
    );

    // Initial Resume checklist
    run(
      `INSERT INTO resume_data (id, user_id, checklist_json, skills_summary, projects_highlight, certifications, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'res_demo_101',
        demoId,
        JSON.stringify({
          education: true,
          skills: true,
          projects: true,
          internship: true,
          achievements: true,
          certifications: true,
          github: true,
          linkedin: true,
          coding_profiles: true,
          contact_info: true,
          formatting: true,
          grammar: true
        }),
        'Languages: C++, Java, TypeScript, Go, Python\nDatabases: PostgreSQL, Redis, SQLite, MongoDB\nCore: DSA, Operating Systems, Computer Networks, DBMS, System Design\nTools: Docker, Git, Linux, Kubernetes, Postman',
        'Featured: Distributed Task Queue (Go/Redis), Real-time Collaborative Code Editor (WebSockets/React)',
        'AWS Certified Cloud Practitioner, Meta Front-End Specialization',
        'Resume tuned with strong action verbs (Architected, Engineered, Reduced latency by 42%). One page clean format.'
      ]
    );

    // Initial Today Tasks
    const sampleTodayTasks = [
      { id: 'tt_1', title: 'Solve 2 Sliding Window Problems', cat: 'DSA', dur: 30, comp: 1 },
      { id: 'tt_2', title: 'Revise DBMS Transactions & 2PL', cat: 'Core CS', dur: 20, comp: 1 },
      { id: 'tt_3', title: 'Practice 15 Quantitative Aptitude Questions', cat: 'Aptitude', dur: 25, comp: 0 },
      { id: 'tt_4', title: 'Solve Department Top Earners SQL Challenge', cat: 'SQL', dur: 20, comp: 0 },
      { id: 'tt_5', title: 'Review Distributed Queue Architecture Notes', cat: 'Projects', dur: 15, comp: 1 },
      { id: 'tt_6', title: 'Practice "Tell Me About Yourself" & STAR Answers', cat: 'Interview', dur: 15, comp: 0 }
    ];

    for (let i = 0; i < sampleTodayTasks.length; i++) {
      const t = sampleTodayTasks[i];
      run(
        `INSERT INTO today_tasks (id, user_id, title, category, duration_minutes, is_completed, task_date, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, demoId, t.title, t.cat, t.dur, t.comp, today, i]
      );
    }

    // Initial Mock Interview
    run(
      `INSERT INTO mock_interviews (id, user_id, company_name, role, interview_date, technical_score, communication_score, problem_solving_score, confidence, feedback, improvement_areas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'mock_1',
        demoId,
        'Peer Mock - Google Simulation',
        'SDE-1',
        yesterday,
        8, 7, 8, 4,
        'Good structured thinking. Clarified constraints and edge cases for the graph traversal problem before writing code.',
        'Spend less time writing verbose variable names in live coding; articulate time/space trade-offs earlier in the discussion.'
      ]
    );

    // Initial Calendar Events
    run(
      `INSERT INTO calendar_events (id, user_id, title, category, event_date, start_time, end_time, notes, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      ['cal_1', demoId, 'Microsoft Online Assessment', 'Assessment', '2026-10-08', '14:00', '16:00', 'Codility link on test portal. Keep scratchpad ready.']
    );
    run(
      `INSERT INTO calendar_events (id, user_id, title, category, event_date, start_time, end_time, notes, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      ['cal_2', demoId, 'Google Round 2 Technical Interview', 'Interview', '2026-10-18', '11:00', '12:00', 'Google Meet video round with senior engineer. Focus on system logic & graphs.']
    );

    console.log('Demo user seeded successfully: alex.chen@prepforge.edu / prepforge2026');
  }
}
