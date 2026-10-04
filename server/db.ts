import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database;
const dbDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'prepforge.sqlite');

let saveTimeout: NodeJS.Timeout | null = null;

export function persistDb(): void {
  if (!db) return;
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

export function schedulePersist(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistDb();
  }, 1000);
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    try {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log('Loaded existing PrepForge database from:', dbPath);
    } catch (err) {
      console.warn('Failed to load existing database file, creating fresh one:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Created fresh in-memory database, initializing schema...');
  }

  // Enforce foreign keys and WAL-like pragmas
  db.run("PRAGMA foreign_keys = ON;");

  createTables();
  seedInitialData();
  persistDb();

  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized! Call initDb() first.');
  }
  return db;
}

export function run(sql: string, params: any[] = []): void {
  const database = getDb();
  database.run(sql, params);
  schedulePersist();
}

export function get<T = any>(sql: string, params: any[] = []): T | null {
  const database = getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      college TEXT,
      degree TEXT,
      branch TEXT,
      grad_year INTEGER,
      semester INTEGER,
      target_role TEXT,
      target_companies TEXT,
      preferred_domain TEXT,
      placement_season TEXT,
      daily_prep_hours REAL DEFAULT 2.0,
      dsa_level INTEGER DEFAULT 3,
      aptitude_level INTEGER DEFAULT 3,
      core_cs_level INTEGER DEFAULT 3,
      programming_level INTEGER DEFAULT 3,
      sql_level INTEGER DEFAULT 3,
      communication_level INTEGER DEFAULT 3,
      interview_level INTEGER DEFAULT 3,
      avatar_url TEXT,
      theme TEXT DEFAULT 'system',
      accent_color TEXT DEFAULT 'indigo',
      onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      goal_days_per_week INTEGER DEFAULT 7,
      color TEXT DEFAULT 'indigo',
      icon TEXT DEFAULT 'CheckCircle2',
      start_date TEXT NOT NULL,
      archived INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(habit_id, completed_date),
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dsa_topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      order_index INTEGER NOT NULL,
      description TEXT,
      total_target INTEGER DEFAULT 25
    );

    CREATE TABLE IF NOT EXISTS coding_problems (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      url TEXT,
      difficulty TEXT NOT NULL,
      topic TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT STARTED',
      time_taken_minutes INTEGER DEFAULT 0,
      hint_used INTEGER DEFAULT 0,
      approach TEXT,
      complexity TEXT,
      notes TEXT,
      confidence INTEGER DEFAULT 3,
      revision_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS core_subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS core_topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      key_concepts TEXT,
      FOREIGN KEY(subject_id) REFERENCES core_subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_core_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, topic_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES core_topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS aptitude_questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      topic TEXT NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Medium'
    );

    CREATE TABLE IF NOT EXISTS aptitude_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_option TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      time_taken_seconds INTEGER DEFAULT 30,
      attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES aptitude_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sql_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL,
      schema_desc TEXT NOT NULL,
      starter_sql TEXT,
      solution_sql TEXT NOT NULL,
      explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS user_sql_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT STARTED',
      user_query TEXT,
      completed_at TEXT,
      UNIQUE(user_id, challenge_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(challenge_id) REFERENCES sql_challenges(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT,
      difficulty TEXT DEFAULT 'All Levels',
      url TEXT,
      tags TEXT,
      estimated_time_minutes INTEGER DEFAULT 15,
      is_global INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, resource_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      subject TEXT,
      topic TEXT,
      company TEXT,
      project TEXT,
      tags TEXT,
      is_bookmarked INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      problem_name TEXT NOT NULL,
      topic TEXT NOT NULL,
      mistake_desc TEXT NOT NULL,
      correct_approach TEXT NOT NULL,
      explanation TEXT,
      lesson_learned TEXT NOT NULL,
      confidence INTEGER DEFAULT 2,
      revision_date TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revision_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      topic_or_subject TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT,
      due_date TEXT NOT NULL,
      interval_days INTEGER DEFAULT 1,
      repetitions INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      package_details TEXT,
      eligibility TEXT,
      application_date TEXT,
      assessment_date TEXT,
      interview_date TEXT,
      status TEXT NOT NULL DEFAULT 'WISHLIST',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company_resources (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT,
      url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tech_stack TEXT,
      github_url TEXT,
      live_url TEXT,
      status TEXT DEFAULT 'IN PROGRESS',
      checklist_json TEXT,
      architecture_notes TEXT,
      demo_url TEXT,
      interview_explanation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resume_data (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      checklist_json TEXT,
      skills_summary TEXT,
      projects_highlight TEXT,
      certifications TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      sample_answer TEXT,
      my_notes TEXT,
      status TEXT DEFAULT 'Not Started',
      difficulty TEXT DEFAULT 'Medium',
      is_global INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mock_interviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      role TEXT NOT NULL,
      interview_date TEXT NOT NULL,
      technical_score INTEGER DEFAULT 7,
      communication_score INTEGER DEFAULT 7,
      problem_solving_score INTEGER DEFAULT 7,
      confidence INTEGER DEFAULT 3,
      feedback TEXT,
      improvement_areas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      notes TEXT,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_or_subject TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      session_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS today_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 25,
      is_completed INTEGER DEFAULT 0,
      task_date TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function seedInitialData() {
  const dsaCount = (get<{ count: number }>('SELECT count(*) as count FROM dsa_topics'))?.count || 0;
  if (dsaCount === 0) {
    const dsaTopics = [
      { id: 'dsa_arrays', name: 'Arrays', slug: 'arrays', order: 1, target: 30, desc: 'Prefix sums, kadane algorithm, two pointers, Dutch national flag' },
      { id: 'dsa_strings', name: 'Strings', slug: 'strings', order: 2, target: 25, desc: 'Anagrams, palindrome substrings, KMP, Rabin-Karp, sliding window' },
      { id: 'dsa_linked_lists', name: 'Linked Lists', slug: 'linked-lists', order: 3, target: 20, desc: 'Fast & slow pointers, reversal, cycle detection, merge sorted lists' },
      { id: 'dsa_stack', name: 'Stack', slug: 'stack', order: 4, target: 20, desc: 'Monotonic stack, next greater element, parenthesis validation' },
      { id: 'dsa_queue', name: 'Queue', slug: 'queue', order: 5, target: 15, desc: 'Circular queue, sliding window maximum with deque, queue via stacks' },
      { id: 'dsa_hashing', name: 'Hashing', slug: 'hashing', order: 6, target: 20, desc: 'Hash maps, collision resolution, frequency counting, 2-sum/4-sum' },
      { id: 'dsa_sorting', name: 'Sorting', slug: 'sorting', order: 7, target: 15, desc: 'Merge sort, quick sort, counting sort, cyclic sort patterns' },
      { id: 'dsa_binary_search', name: 'Binary Search', slug: 'binary-search', order: 8, target: 25, desc: 'Search on answer space, rotated sorted arrays, lower/upper bound' },
      { id: 'dsa_two_pointers', name: 'Two Pointers', slug: 'two-pointers', order: 9, target: 20, desc: 'Opposite ends, fast/slow, container with most water, 3-sum' },
      { id: 'dsa_sliding_window', name: 'Sliding Window', slug: 'sliding-window', order: 10, target: 25, desc: 'Fixed and variable windows, longest substring without repeating characters' },
      { id: 'dsa_recursion', name: 'Recursion', slug: 'recursion', order: 11, target: 15, desc: 'Base conditions, recurrence trees, subset generation' },
      { id: 'dsa_trees', name: 'Trees', slug: 'trees', order: 12, target: 30, desc: 'Binary tree traversals, LCA, diameter, BST operations, views' },
      { id: 'dsa_heaps', name: 'Heaps & Priority Queue', slug: 'heaps', order: 13, target: 20, desc: 'Min/Max heap, top K elements, merge K sorted lists, median finder' },
      { id: 'dsa_graphs', name: 'Graphs', slug: 'graphs', order: 14, target: 30, desc: 'BFS, DFS, Dijkstra, Bellman-Ford, Topological Sort, Disjoint Set Union' },
      { id: 'dsa_greedy', name: 'Greedy', slug: 'greedy', order: 15, target: 20, desc: 'Activity selection, fractional knapsack, jump game, interval scheduling' },
      { id: 'dsa_dp', name: 'Dynamic Programming', slug: 'dynamic-programming', order: 16, target: 35, desc: '1D DP, Knapsack 0/1, LCS, LIS, Matrix DP, DP with bitmasks' },
      { id: 'dsa_backtracking', name: 'Backtracking', slug: 'backtracking', order: 17, target: 15, desc: 'N-Queens, Sudoku solver, word search, permutations' },
      { id: 'dsa_bit_manipulation', name: 'Bit Manipulation', slug: 'bit-manipulation', order: 18, target: 15, desc: 'XOR tricks, single number, counting bits, power of two' },
    ];

    for (const t of dsaTopics) {
      db.run(
        `INSERT INTO dsa_topics (id, name, slug, order_index, description, total_target) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.name, t.slug, t.order, t.desc, t.target]
      );
    }
  }

  const csCount = (get<{ count: number }>('SELECT count(*) as count FROM core_subjects'))?.count || 0;
  if (csCount === 0) {
    const subjects = [
      {
        id: 'cs_dbms',
        name: 'Database Management Systems (DBMS)',
        slug: 'dbms',
        order: 1,
        desc: 'Relational model, ACID, Normalization, SQL indexing, Transactions, Concurrency control',
        topics: [
          { id: 'dbms_keys', name: 'Keys (Primary, Foreign, Candidate, Super)', slug: 'keys', order: 1, concepts: 'Difference between candidate and primary keys; composite vs simple keys.' },
          { id: 'dbms_er', name: 'ER Model & Relational Mapping', slug: 'er-model', order: 2, concepts: 'Entities, relationships, cardinalities, transforming ER diagrams into tables.' },
          { id: 'dbms_algebra', name: 'Relational Algebra', slug: 'relational-algebra', order: 3, concepts: 'Select, project, join, set operations, tuple relational calculus.' },
          { id: 'dbms_norm', name: 'Normalization (1NF, 2NF, 3NF, BCNF)', slug: 'normalization', order: 4, concepts: 'Functional dependencies, lossless join decomposition, dependency preservation.' },
          { id: 'dbms_trans', name: 'Transactions & ACID Properties', slug: 'transactions', order: 5, concepts: 'Atomicity, Consistency, Isolation levels (dirty read, non-repeatable read, phantom read), Durability.' },
          { id: 'dbms_concurr', name: 'Concurrency Control & 2PL', slug: 'concurrency', order: 6, concepts: 'Two-Phase Locking (2PL), deadlock prevention, detection, wound-wait vs wait-die.' },
          { id: 'dbms_index', name: 'Indexing & B/B+ Trees', slug: 'indexing', order: 7, concepts: 'Clustered vs non-clustered index, B+ tree leaf nodes, search complexity O(log N).' }
        ]
      },
      {
        id: 'cs_os',
        name: 'Operating Systems (OS)',
        slug: 'os',
        order: 2,
        desc: 'Process management, Threads, CPU scheduling, Synchronization, Deadlocks, Virtual memory',
        topics: [
          { id: 'os_proc', name: 'Processes vs Threads & Context Switching', slug: 'processes-threads', order: 1, concepts: 'PCB, thread stack vs heap, user-level vs kernel-level threads, fork() and exec().' },
          { id: 'os_sched', name: 'CPU Scheduling Algorithms', slug: 'cpu-scheduling', order: 2, concepts: 'FCFS, SJF, Round Robin with time quantum, Priority scheduling, multilevel queue.' },
          { id: 'os_sync', name: 'Process Synchronization & Semaphores', slug: 'synchronization', order: 3, concepts: 'Critical section problem, Peterson algorithm, Mutex vs Counting Semaphore, Producer-Consumer.' },
          { id: 'os_deadlock', name: 'Deadlocks & Banker Algorithm', slug: 'deadlocks', order: 4, concepts: 'Mutual exclusion, Hold and wait, No preemption, Circular wait. Deadlock avoidance vs detection.' },
          { id: 'os_mem', name: 'Memory Management & Paging', slug: 'memory-paging', order: 5, concepts: 'Logical vs physical address, Page table, TLB hit/miss, Internal and External fragmentation.' },
          { id: 'os_virt', name: 'Virtual Memory & Page Replacement', slug: 'virtual-memory', order: 6, concepts: 'Demand paging, Page fault handling, FIFO, LRU, Optimal replacement, Thrashing.' }
        ]
      },
      {
        id: 'cs_cn',
        name: 'Computer Networks (CN)',
        slug: 'cn',
        order: 3,
        desc: 'OSI vs TCP/IP, Routing, Flow control, TCP handshake, DNS, HTTP/HTTPS, WebSockets',
        topics: [
          { id: 'cn_models', name: 'OSI 7 Layers vs TCP/IP Protocol Suite', slug: 'osi-tcpip', order: 1, concepts: 'Encapsulation/decapsulation, PDU at each layer, roles of routers vs switches.' },
          { id: 'cn_tcp_udp', name: 'TCP vs UDP & 3-Way Handshake', slug: 'tcp-udp', order: 2, concepts: 'SYN, SYN-ACK, ACK, connection termination, flow control (sliding window), congestion control.' },
          { id: 'cn_ip', name: 'IP Addressing, Subnetting & CIDR', slug: 'ip-subnetting', order: 3, concepts: 'IPv4 vs IPv6, subnet mask calculation, network ID, broadcast address, NAT.' },
          { id: 'cn_routing', name: 'Routing Algorithms (Dijkstra, Distance Vector)', slug: 'routing', order: 4, concepts: 'OSPF, BGP, RIP, split horizon, poison reverse, link state vs distance vector.' },
          { id: 'cn_dns_http', name: 'DNS, HTTP/1.1 vs HTTP/2 vs HTTP/3', slug: 'dns-http', order: 5, concepts: 'Recursive vs iterative DNS queries, TLS handshake, HOL blocking, multiplexing.' }
        ]
      },
      {
        id: 'cs_oop',
        name: 'Object-Oriented Programming (OOP)',
        slug: 'oop',
        order: 4,
        desc: 'Inheritance, Polymorphism, Encapsulation, Abstraction, SOLID principles, Design patterns',
        topics: [
          { id: 'oop_pillars', name: '4 Core Pillars of OOP', slug: 'pillars', order: 1, concepts: 'Encapsulation (data hiding), Abstraction (interfaces/abstract classes), Inheritance, Polymorphism.' },
          { id: 'oop_poly', name: 'Compile-time vs Runtime Polymorphism', slug: 'polymorphism', order: 2, concepts: 'Method overloading vs overriding, virtual tables (vtable), dynamic binding.' },
          { id: 'oop_solid', name: 'SOLID Design Principles', slug: 'solid', order: 3, concepts: 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.' },
          { id: 'oop_patterns', name: 'Key Design Patterns (Factory, Singleton, Observer)', slug: 'design-patterns', order: 4, concepts: 'Creational, Structural, Behavioral patterns commonly asked in technical rounds.' }
        ]
      },
      {
        id: 'cs_sql',
        name: 'SQL & Database Querying',
        slug: 'sql',
        order: 5,
        desc: 'Advanced joins, Aggregations, Window functions, Subqueries, CTEs, Query optimization',
        topics: [
          { id: 'sql_joins', name: 'INNER, LEFT, RIGHT, FULL OUTER & CROSS JOIN', slug: 'joins', order: 1, concepts: 'Venn diagrams, handling NULL values, self-joins for hierarchical data.' },
          { id: 'sql_group', name: 'GROUP BY, HAVING, and Aggregation Functions', slug: 'group-by', order: 2, concepts: 'WHERE vs HAVING difference, COUNT(1) vs COUNT(column), SUM, AVG, MIN, MAX.' },
          { id: 'sql_window', name: 'Window Functions (ROW_NUMBER, RANK, DENSE_RANK)', slug: 'window-functions', order: 3, concepts: 'PARTITION BY, ORDER BY inside OVER(), LEAD, LAG, running totals.' },
          { id: 'sql_cte', name: 'Common Table Expressions (CTE) & Subqueries', slug: 'cte-subqueries', order: 4, concepts: 'WITH clauses, recursive CTEs, correlated subqueries vs joins.' }
        ]
      }
    ];

    for (const sub of subjects) {
      db.run(
        `INSERT INTO core_subjects (id, name, slug, description, order_index) VALUES (?, ?, ?, ?, ?)`,
        [sub.id, sub.name, sub.slug, sub.desc, sub.order]
      );
      for (const top of sub.topics) {
        db.run(
          `INSERT INTO core_topics (id, subject_id, name, slug, order_index, key_concepts) VALUES (?, ?, ?, ?, ?, ?)`,
          [top.id, sub.id, top.name, top.slug, top.order, top.concepts]
        );
      }
    }
  }

  const aptCount = (get<{ count: number }>('SELECT count(*) as count FROM aptitude_questions'))?.count || 0;
  if (aptCount === 0) {
    const questions = [
      {
        id: 'apt_1',
        cat: 'Quantitative',
        topic: 'Percentages & Profit/Loss',
        q: 'A merchant marks up his goods by 25% above cost price and then allows a discount of 10% on the marked price. What is his net profit percentage?',
        a: '12.5%',
        b: '15%',
        c: '10%',
        d: '14.2%',
        correct: 'A',
        exp: 'Let CP = 100. MP = 125. Discount = 10% of 125 = 12.5. SP = 125 - 12.5 = 112.5. Net Profit = 112.5 - 100 = 12.5%.'
      },
      {
        id: 'apt_2',
        cat: 'Quantitative',
        topic: 'Time & Work',
        q: 'Worker A can complete a task in 12 days, while Worker B can complete the same task in 18 days. If they work together for 4 days, what fraction of the work remains unfinished?',
        a: '1/3',
        b: '4/9',
        c: '5/9',
        d: '7/18',
        correct: 'B',
        exp: 'A rate = 1/12, B rate = 1/18. Combined rate = (3+2)/36 = 5/36 per day. In 4 days, work done = 4 * (5/36) = 20/36 = 5/9. Remaining work = 1 - 5/9 = 4/9.'
      },
      {
        id: 'apt_3',
        cat: 'Quantitative',
        topic: 'Probability',
        q: 'Two dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on the dice is a prime number?',
        a: '5/12',
        b: '7/18',
        c: '15/36',
        d: '1/2',
        correct: 'A',
        exp: 'Possible prime sums between 2 and 12 are {2, 3, 5, 7, 11}. Sum=2: (1,1) [1]. Sum=3: (1,2),(2,1) [2]. Sum=5: (1,4),(2,3),(3,2),(4,1) [4]. Sum=7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) [6]. Sum=11: (5,6),(6,5) [2]. Total favorable outcomes = 1+2+4+6+2 = 15. Probability = 15/36 = 5/12.'
      },
      {
        id: 'apt_4',
        cat: 'Logical Reasoning',
        topic: 'Blood Relations',
        q: 'Pointing to a photograph of a man, Priya said: "His mother is the only daughter of my mother." How is Priya related to the man?',
        a: 'Sister',
        b: 'Mother',
        c: 'Aunt',
        d: 'Grandmother',
        correct: 'B',
        exp: 'The only daughter of Priya\'s mother is Priya herself. Since Priya is the mother of the man in the photograph, she is his Mother.'
      },
      {
        id: 'apt_5',
        cat: 'Logical Reasoning',
        topic: 'Number Series',
        q: 'Identify the next number in the sequence: 4, 18, 48, 100, 180, ?',
        a: '252',
        b: '294',
        c: '312',
        d: '276',
        correct: 'B',
        exp: 'Pattern is n^3 - n^2 or n^2 * (n+1)?: 1^3-1^2=0. 2^3-2^2=4 (n=2). 3^3-3^2 = 27-9 = 18 (n=3). 4^3-4^2 = 64-16 = 48 (n=4). 5^3-5^2 = 125-25 = 100 (n=5). 6^3-6^2 = 216-36 = 180 (n=6). For n=7: 7^3-7^2 = 343-49 = 294.'
      },
      {
        id: 'apt_6',
        cat: 'Verbal',
        topic: 'Sentence Correction',
        q: 'Select the grammatically correct sentence:',
        a: 'Neither the manager nor the engineers was available for the technical debrief.',
        b: 'Neither the manager nor the engineers were available for the technical debrief.',
        c: 'Neither the manager or the engineers were available for the technical debrief.',
        d: 'Neither the manager nor the engineers has been available for the technical debrief.',
        correct: 'B',
        exp: 'With correlative conjunction "neither ... nor", the verb agrees with the closer subject ("the engineers" - plural), hence "were available" is grammatically sound.'
      }
    ];

    for (const q of questions) {
      db.run(
        `INSERT INTO aptitude_questions (id, category, topic, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id, q.cat, q.topic, q.q, q.a, q.b, q.c, q.d, q.correct, q.exp]
      );
    }
  }

  const sqlCount = (get<{ count: number }>('SELECT count(*) as count FROM sql_challenges'))?.count || 0;
  if (sqlCount === 0) {
    const challenges = [
      {
        id: 'sql_1',
        title: 'Second Highest Salary',
        category: 'Subqueries & Limits',
        diff: 'Medium',
        desc: 'Write an SQL query to retrieve the second highest salary from the Employee table. If there is no second highest salary, return NULL.',
        schema: 'Table Employee: (id INT PRIMARY KEY, salary INT, department_id INT)',
        starter: 'SELECT -- your query here\nFROM Employee;',
        solution: 'SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);',
        exp: 'Using subquery with MAX() or DENSE_RANK() handles duplicate salaries correctly and gracefully yields NULL when only 1 distinct salary exists.'
      },
      {
        id: 'sql_2',
        title: 'Consecutive Logins',
        category: 'Window Functions',
        diff: 'Hard',
        desc: 'Find all students who have logged into the platform for at least 3 consecutive days.',
        schema: 'Table Logins: (student_id INT, login_date DATE)',
        starter: 'WITH Ranked AS (\n  SELECT student_id, login_date,\n         ROW_NUMBER() OVER(PARTITION BY student_id ORDER BY login_date) as rn\n  FROM Logins\n)\nSELECT DISTINCT student_id FROM Ranked;',
        solution: 'WITH Grouped AS (\n  SELECT student_id, login_date,\n         DATE(login_date, \'-\' || ROW_NUMBER() OVER(PARTITION BY student_id ORDER BY login_date) || \' day\') AS grp\n  FROM (SELECT DISTINCT student_id, login_date FROM Logins)\n)\nSELECT student_id FROM Grouped GROUP BY student_id, grp HAVING COUNT(*) >= 3;',
        exp: 'Standard date subtraction technique where date minus ROW_NUMBER() generates an invariant group identifier for consecutive date sequences.'
      },
      {
        id: 'sql_3',
        title: 'Department Top 3 Earners',
        category: 'Window Functions',
        diff: 'Medium',
        desc: 'Find employees who earn in the top 3 distinct salaries in their respective department.',
        schema: 'Table Employee: (id INT, name VARCHAR, salary INT, department_id INT)\nTable Department: (id INT, name VARCHAR)',
        starter: 'SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary\nFROM Employee e\nJOIN Department d ON e.department_id = d.id;',
        solution: 'WITH RankedSalaries AS (\n  SELECT department_id, name, salary,\n         DENSE_RANK() OVER(PARTITION BY department_id ORDER BY salary DESC) as rank\n  FROM Employee\n)\nSELECT d.name AS Department, r.name AS Employee, r.salary AS Salary\nFROM RankedSalaries r\nJOIN Department d ON r.department_id = d.id\nWHERE r.rank <= 3;',
        exp: 'DENSE_RANK() is appropriate here because ties in salary must share the rank without skipping numbers.'
      }
    ];

    for (const c of challenges) {
      db.run(
        `INSERT INTO sql_challenges (id, title, category, difficulty, description, schema_desc, starter_sql, solution_sql, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.title, c.category, c.diff, c.desc, c.schema, c.starter, c.solution, c.exp]
      );
    }
  }

  const resCount = (get<{ count: number }>('SELECT count(*) as count FROM resources'))?.count || 0;
  if (resCount === 0) {
    const resources = [
      {
        id: 'res_1',
        title: 'NeetCode 150 - Curated DSA Practice Roadmap',
        desc: 'Essential 150 problems covering core patterns for top product companies and campus interviews.',
        type: 'ROADMAP',
        sub: 'DSA',
        topic: 'All DSA Topics',
        diff: 'All Levels',
        url: 'https://neetcode.io/roadmap',
        tags: 'dsa,interview,patterns,problems',
        time: 120
      },
      {
        id: 'res_2',
        title: 'DBMS Comprehensive Interview Cheat Sheet',
        desc: 'ACID transactions, B+ trees, isolation levels, normalization step-by-step breakdown with diagrams.',
        type: 'CHEAT SHEET',
        sub: 'DBMS',
        topic: 'Transactions & Normalization',
        diff: 'Intermediate',
        url: 'https://gateoverflow.in/dbms-notes',
        tags: 'dbms,core-cs,acid,normalization',
        time: 30
      },
      {
        id: 'res_3',
        title: 'Operating Systems System Call & Memory Masterclass',
        desc: 'In-depth notes on TLB caching, demand paging, thrashing prevention, and multi-threading race conditions.',
        type: 'NOTES',
        sub: 'OS',
        topic: 'Virtual Memory & Scheduling',
        diff: 'Intermediate',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
        tags: 'os,memory,processes,threads',
        time: 45
      },
      {
        id: 'res_4',
        title: 'Computer Networks Top 50 Interview Questions',
        desc: 'TCP 3-way handshake, TCP vs UDP flow control, DNS resolution hierarchy, and HTTP/3 QUIC protocol.',
        type: 'INTERVIEW',
        sub: 'Computer Networks',
        topic: 'TCP/IP & Application Protocols',
        diff: 'All Levels',
        url: 'https://www.geeksforgeeks.org/networking-interview-questions/',
        tags: 'networking,tcp,dns,interview',
        time: 40
      },
      {
        id: 'res_5',
        title: 'SQL Window Functions & CTE Practical Guide',
        desc: 'Master ROW_NUMBER(), DENSE_RANK(), LAG(), LEAD(), and recursive CTEs with real-world financial data.',
        type: 'PRACTICE',
        sub: 'SQL',
        topic: 'Window Functions & Aggregations',
        diff: 'Advanced',
        url: 'https://mode.com/sql-tutorial/sql-window-functions/',
        tags: 'sql,database,window-functions,cte',
        time: 60
      },
      {
        id: 'res_6',
        title: 'STAR Method Framework for Behavioral Interviews',
        desc: 'How to structure answers to "Tell me about a time you resolved a technical disagreement" with concrete impact.',
        type: 'ARTICLE',
        sub: 'Interview Preparation',
        topic: 'Behavioral & HR',
        diff: 'Beginner',
        url: 'https://hbr.org/2022/02/how-to-use-the-star-method',
        tags: 'behavioral,star,hr,interview',
        time: 20
      }
    ];

    for (const r of resources) {
      db.run(
        `INSERT INTO resources (id, title, description, type, subject, topic, difficulty, url, tags, estimated_time_minutes, is_global) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [r.id, r.title, r.desc, r.type, r.sub, r.topic, r.diff, r.url, r.tags, r.time]
      );
    }
  }

  const intCount = (get<{ count: number }>('SELECT count(*) as count FROM interview_questions'))?.count || 0;
  if (intCount === 0) {
    const questions = [
      {
        id: 'iq_1',
        cat: 'TECHNICAL INTERVIEW',
        q: 'What happens under the hood from the moment you type google.com into your browser and press Enter?',
        ans: '1. Browser checks cache (browser, OS, router). 2. DNS query to resolver, root, TLD, authoritative server. 3. TCP 3-way handshake (SYN, SYN-ACK, ACK). 4. TLS handshake for HTTPS. 5. HTTP GET request sent. 6. Server processes and returns HTTP 200 with HTML. 7. Browser parses DOM, CSSOM, executes scripts, and renders.',
        diff: 'Medium'
      },
      {
        id: 'iq_2',
        cat: 'TECHNICAL INTERVIEW',
        q: 'Why does B+ Tree indexing perform better than standard Binary Search Trees or Hash Indexes for relational databases?',
        ans: 'B+ trees store all data records in leaf nodes while internal nodes store routing keys, allowing high branching factor (order of 100+). This minimizes disk I/O depth to 3-4 levels. Furthermore, leaf nodes are linked sequentially, enabling ultra-fast range queries (BETWEEN x AND y) which hash tables cannot do efficiently.',
        diff: 'Hard'
      },
      {
        id: 'iq_3',
        cat: 'BEHAVIORAL INTERVIEW',
        q: 'Describe a situation where a software bug made it past your local testing into a demo or evaluation. How did you react?',
        ans: 'Structure using STAR: Situation (College project demo with real-time sockets), Task (Ensure zero crash during live faculty review), Action (Quickly isolated race condition in disconnection handler, deployed hotfix within 10 minutes, logged root cause in post-mortem), Result (Demo resumed smoothly, awarded top grade, added regression tests).',
        diff: 'Medium'
      },
      {
        id: 'iq_4',
        cat: 'PROJECT INTERVIEW',
        q: 'Walk me through the system architecture of your most complex project. Why did you choose your database and tech stack?',
        ans: 'Highlight: 1. Frontend layer (React, state management), 2. API gateway & caching, 3. Backend service architecture, 4. Data storage trade-offs (relational vs document store), 5. Security & authentication, 6. Bottlenecks solved.',
        diff: 'Hard'
      },
      {
        id: 'iq_5',
        cat: 'HR INTERVIEW',
        q: 'Where do you see yourself in 3 to 5 years, and how does this role align with your engineering goals?',
        ans: 'Focus on mastering production systems, taking ownership of scalable end-to-end features, mentoring incoming engineers, and deepening expertise in distributed architecture.',
        diff: 'Easy'
      }
    ];

    for (const iq of questions) {
      db.run(
        `INSERT INTO interview_questions (id, category, question, sample_answer, difficulty, is_global) VALUES (?, ?, ?, ?, ?, 1)`,
        [iq.id, iq.cat, iq.q, iq.ans, iq.diff]
      );
    }
  }
}
