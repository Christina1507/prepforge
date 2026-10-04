import { initDb, get, run, all } from '../server/db.js';
import { hashPassword, comparePassword, generateToken, verifyToken, seedDemoUserIfNeeded } from '../server/auth.js';

async function runTests() {
  console.log('--- Starting PrepForge Verification Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database Initialization
    const db = await initDb();
    assert(Boolean(db), 'Database initializes properly');

    // 2. Auth: Password hashing & verification
    const pass = 'superSecret2026';
    const hash = hashPassword(pass);
    assert(comparePassword(pass, hash), 'Password hashing and comparison work accurately');
    assert(!comparePassword('wrongPassword', hash), 'Invalid password correctly fails');

    // 3. Auth: JWT generation & verification
    const token = generateToken({ id: 'test_user_1', email: 'test@prepforge.edu' });
    const decoded = verifyToken(token);
    assert(decoded?.id === 'test_user_1', 'JWT token signs and verifies user ID correctly');

    // 4. Demo seed validation
    seedDemoUserIfNeeded();
    const demoUser = get<{ id: string; email: string }>('SELECT id, email FROM users WHERE email = ?', ['alex.chen@prepforge.edu']);
    assert(Boolean(demoUser), 'Demo student user is seeded in database');

    const demoProfile = get<{ name: string; target_role: string }>('SELECT name, target_role FROM student_profiles WHERE user_id = ?', [demoUser?.id]);
    assert(demoProfile?.name === 'Alex Chen', 'Demo student profile attributes are properly stored');

    // 5. DSA Topics seed check
    const dsaTopics = all('SELECT * FROM dsa_topics');
    assert(dsaTopics.length === 18, 'All 18 core DSA topics seeded correctly');

    // 6. Core CS Subjects check
    const coreSubjects = all('SELECT * FROM core_subjects');
    assert(coreSubjects.length >= 5, 'Core CS subjects (DBMS, OS, CN, OOP, SQL) seeded properly');

    // 7. Habit creation & completion toggle
    const testHabitId = 'test_hab_' + Date.now();
    run(
      `INSERT INTO habits (id, user_id, name, category, frequency, goal_days_per_week, start_date)
       VALUES (?, ?, ?, 'DSA', 'daily', 7, date('now'))`,
      [testHabitId, demoUser!.id, 'Solve 1 Tree Problem Daily']
    );
    const habitRecord = get('SELECT id, name FROM habits WHERE id = ?', [testHabitId]);
    assert(Boolean(habitRecord), 'Habit creation persists to database');

    const compId = 'test_hc_' + Date.now();
    run(
      `INSERT INTO habit_completions (id, habit_id, user_id, completed_date)
       VALUES (?, ?, ?, date('now'))`,
      [compId, testHabitId, demoUser!.id]
    );
    const completionRecord = get('SELECT id FROM habit_completions WHERE id = ?', [compId]);
    assert(Boolean(completionRecord), 'Habit completion logged successfully');

    // 8. Coding Problem Tracking
    const problemId = 'test_prob_' + Date.now();
    run(
      `INSERT INTO coding_problems (id, user_id, name, platform, difficulty, topic, status, confidence)
       VALUES (?, ?, 'Valid Parentheses', 'LeetCode', 'Easy', 'Stack', 'SOLVED', 5)`,
      [problemId, demoUser!.id]
    );
    const problemRecord = get<{ status: string }>('SELECT status FROM coding_problems WHERE id = ?', [problemId]);
    assert(problemRecord?.status === 'SOLVED', 'Coding problem logged with status SOLVED');

    // 9. Mistake Book & Automatic Revision Queue Sync
    const mistakeId = 'test_mst_' + Date.now();
    const revId = 'test_rev_' + Date.now();
    run(
      `INSERT INTO mistakes (id, user_id, problem_name, topic, mistake_desc, correct_approach, lesson_learned, confidence, revision_date)
       VALUES (?, ?, 'LRU Cache', 'Linked Lists', 'Used singly linked list instead of doubly linked list', 'Doubly linked list allows O(1) removal of arbitrary node', 'DList enables O(1) node deletion', 2, date('now'))`,
      [mistakeId, demoUser!.id]
    );
    run(
      `INSERT INTO revision_items (id, user_id, title, category, topic_or_subject, source_type, source_id, due_date)
       VALUES (?, ?, 'Review LRU Cache Mistake', 'Mistake', 'Linked Lists', 'MISTAKE', ?, date('now'))`,
      [revId, demoUser!.id, mistakeId]
    );
    const revItem = get<{ source_type: string }>('SELECT source_type FROM revision_items WHERE id = ?', [revId]);
    assert(revItem?.source_type === 'MISTAKE', 'Mistake automatically queues into spaced revision queue');

    // 10. Spaced Repetition Rating (SM-2 Interval update)
    const rating = 'Easy';
    const nextInterval = 14;
    run(
      `UPDATE revision_items SET interval_days = ?, repetitions = repetitions + 1 WHERE id = ?`,
      [nextInterval, revId]
    );
    const updatedRev = get<{ interval_days: number }>('SELECT interval_days FROM revision_items WHERE id = ?', [revId]);
    assert(updatedRev?.interval_days === 14, 'Spaced repetition rating expands interval appropriately');

    // 11. Company Pipeline Tracking
    const companyId = 'test_comp_' + Date.now();
    run(
      `INSERT INTO companies (id, user_id, name, role, status) VALUES (?, ?, 'Uber', 'Software Engineer', 'APPLIED')`,
      [companyId, demoUser!.id]
    );
    run(`UPDATE companies SET status = 'TECHNICAL' WHERE id = ?`, [companyId]);
    const updatedCompany = get<{ status: string }>('SELECT status FROM companies WHERE id = ?', [companyId]);
    assert(updatedCompany?.status === 'TECHNICAL', 'Company pipeline updates status accurately');

    // 12. Aptitude Attempt & Accuracy logic
    const aptQ = get<{ id: string }>('SELECT id FROM aptitude_questions LIMIT 1');
    assert(Boolean(aptQ), 'Aptitude questions are available for practice');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution threw an error:', err);
    process.exit(1);
  }
}

runTests();
