import React, { useState } from 'react';
import { Map, ArrowRight, CheckCircle2, Circle, BookOpen, Code2, RotateCw } from 'lucide-react';
import { ActiveView } from '../layout/Sidebar';

interface RoadmapsViewProps {
  onNavigateToView: (view: ActiveView) => void;
}

export function RoadmapsView({ onNavigateToView }: RoadmapsViewProps) {
  const [activeRoadmap, setActiveRoadmap] = useState<'dsa' | 'corecs' | 'sprint'>('dsa');

  const dsaSteps = [
    { num: '01', title: 'Arrays & Two Pointers', desc: 'Prefix sums, Kadane algorithm, two sum, Dutch National Flag, container with most water', target: 25 },
    { num: '02', title: 'Strings & Sliding Window', desc: 'Variable and fixed windows, anagrams, palindrome checks, longest substring without repeats', target: 20 },
    { num: '03', title: 'Sorting & Binary Search', desc: 'Search in rotated arrays, lower/upper bounds, capacity allocation on answer space', target: 20 },
    { num: '04', title: 'Linked Lists & Fast/Slow Pointers', desc: 'Cycle detection, linked list reversal, merge k sorted lists, intersection points', target: 15 },
    { num: '05', title: 'Stacks, Queues & Monotonic Sequences', desc: 'Next greater element, valid parentheses, sliding window maximum with deque', target: 15 },
    { num: '06', title: 'Hashing & Frequency Maps', desc: 'Hash collisions, 4-sum, continuous subarrays with target sum, count of distinct elements', target: 15 },
    { num: '07', title: 'Recursion & Backtracking', desc: 'Subset generation, permutations, N-Queens, Sudoku solver, word search matrix', target: 15 },
    { num: '08', title: 'Binary Trees & BSTs', desc: 'Level order traversal, Lowest Common Ancestor (LCA), diameter, tree views, validate BST', target: 25 },
    { num: '09', title: 'Heaps & Priority Queues', desc: 'Min/max heap implementations, top K frequent elements, running median finder', target: 15 },
    { num: '10', title: 'Graphs & Disjoint Sets', desc: 'BFS, DFS, Dijkstra, topological sort (Kahn algorithm), cycle detection in directed graphs', target: 25 },
    { num: '11', title: 'Greedy Strategies & Intervals', desc: 'Activity selection, merge overlapping intervals, gas station tour, jump game', target: 15 },
    { num: '12', title: 'Dynamic Programming (1D & 2D)', desc: '0/1 Knapsack, Coin Change, Longest Common Subsequence, Edit Distance, Matrix chain', target: 30 },
  ];

  const coreCsSteps = [
    { num: '01', title: 'DBMS Relational Modeling & Normalization', desc: '1NF, 2NF, 3NF, BCNF lossless join and dependency preservation verification', target: 5 },
    { num: '02', title: 'DBMS Transactions & Concurrency Control', desc: 'ACID properties, dirty/non-repeatable reads, 2-Phase Locking, deadlocks', target: 6 },
    { num: '03', title: 'OS Process Management & Synchronization', desc: 'Process vs thread memory spaces, semaphores, mutexes, dining philosophers', target: 6 },
    { num: '04', title: 'OS Virtual Memory & Page Replacement', desc: 'Paging, TLB hits/misses, FIFO vs LRU, thrashing and working set models', target: 5 },
    { num: '05', title: 'Computer Networks TCP/IP Architecture', desc: '3-Way handshake, sliding window flow control, slow start congestion control', target: 6 },
    { num: '06', title: 'Network Protocols & Web Architecture', desc: 'DNS recursive lookups, HTTP/1.1 vs HTTP/2 multiplexing, TLS handshake', target: 5 },
    { num: '07', title: 'Object-Oriented Programming & SOLID', desc: 'Inheritance, polymorphism vtables, encapsulation, 5 SOLID architectural principles', target: 4 },
  ];

  const sprintWeeks = [
    { num: 'W1-W3', title: 'Foundational DSA Patterns', desc: 'Master Arrays, Strings, Sliding Window, and Binary Search. Target: 40 solved.' },
    { num: 'W4-W6', title: 'Linear Structures & DBMS', desc: 'Linked Lists, Stacks, Queues, DBMS transactions and SQL window queries.' },
    { num: 'W7-W9', title: 'Hierarchical Structures & OS', desc: 'Trees, BST, Heaps, Operating Systems memory management and scheduling.' },
    { num: 'W10-W12', title: 'Graphs, DP & Networks', desc: 'Graph traversals, shortest path, 2D dynamic programming, and Computer Networks.' },
    { num: 'W13-W14', title: 'Mock Interviews & Company Packs', desc: 'Daily timed mock interviews, resume tuning, and company past papers.' },
  ];

  const activeSteps =
    activeRoadmap === 'dsa' ? dsaSteps : activeRoadmap === 'corecs' ? coreCsSteps : sprintWeeks;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Placement Learning Roadmaps
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Structured step-by-step pathways connecting: LEARN → PRACTICE → REVISE
          </p>
        </div>

        {/* Roadmap Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-lg shrink-0">
          <button
            onClick={() => setActiveRoadmap('dsa')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeRoadmap === 'dsa'
                ? 'bg-white dark:bg-stone-900 text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            DSA Placement Roadmap
          </button>
          <button
            onClick={() => setActiveRoadmap('corecs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeRoadmap === 'corecs'
                ? 'bg-white dark:bg-stone-900 text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Core CS Mastery
          </button>
          <button
            onClick={() => setActiveRoadmap('sprint')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeRoadmap === 'sprint'
                ? 'bg-white dark:bg-stone-900 text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            90-Day Placement Sprint
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {activeSteps.map((step, idx) => (
          <div
            key={idx}
            className="p-5 md:p-6 bg-card border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group hover:border-stone-300 dark:hover:border-stone-700 transition-all"
          >
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-secondary border border-stone-200 dark:border-stone-700 flex items-center justify-center font-mono font-bold text-sm text-foreground shrink-0">
                {step.num}
              </div>

              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold text-sm text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>

            {/* Triad Actions: LEARN -> PRACTICE -> REVISE */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => onNavigateToView('resources')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-foreground rounded-lg transition-colors"
                title="Open learning resources"
              >
                <BookOpen className="w-3 h-3 text-stone-500" />
                <span>Learn</span>
              </button>

              <button
                onClick={() => onNavigateToView(activeRoadmap === 'dsa' ? 'dsa' : 'corecs')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 rounded-lg transition-colors"
                title="Practice problems"
              >
                <Code2 className="w-3 h-3" />
                <span>Practice</span>
              </button>

              <button
                onClick={() => onNavigateToView('revision')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 rounded-lg transition-colors"
                title="Queue for revision"
              >
                <RotateCw className="w-3 h-3 text-amber-600" />
                <span>Revise</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
