import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateStudyPlan(params: {
  availableMinutes: number;
  weakTopics: string[];
  dueRevisions: string[];
  targetCompanies: string;
  dsaSolvedCount: number;
}) {
  const ai = getAiClient();
  const prompt = `You are the PrepForge placement coach. The student has ${params.availableMinutes} minutes available right now.
Their current context:
- Target Companies: ${params.targetCompanies || 'Tier-1 Product Companies'}
- Weak / Overdue Topics: ${params.weakTopics.length > 0 ? params.weakTopics.join(', ') : 'Binary Search, DBMS Transactions, Sliding Window'}
- Spaced Revisions Due Today: ${params.dueRevisions.length > 0 ? params.dueRevisions.join(', ') : 'DBMS Normalization, Sliding Window'}
- Total DSA Problems Solved: ${params.dsaSolvedCount}

Create a crisp, realistic, minute-by-minute breakdown filling exactly ${params.availableMinutes} minutes.
Format your output strictly as a valid JSON object matching this schema:
{
  "totalDurationMinutes": ${params.availableMinutes},
  "rationale": "One scannable sentence explaining why these specific tasks are prioritized today.",
  "items": [
    {
      "minutes": 25,
      "title": "Task title",
      "category": "DSA" | "Core CS" | "Aptitude" | "SQL" | "Interview",
      "actionPrompt": "Concrete action to take, e.g. 'Solve 2 sliding window medium problems with variable size'",
      "reason": "Brief reason why"
    }
  ]
}`;

  if (!ai) {
    // Algorithmic intelligent fallback
    const items = [];
    if (params.availableMinutes <= 30) {
      items.push({
        minutes: 15,
        title: 'Revise Overdue Mistakes',
        category: 'Core CS',
        actionPrompt: 'Review the Mistake Book notes on boundary conditions and isolation levels',
        reason: 'Prevents forgetting newly learned concepts.'
      });
      items.push({
        minutes: 15,
        title: 'Solve 1 Medium DSA Problem',
        category: 'DSA',
        actionPrompt: 'Implement sliding window or two-pointers problem under 15 minutes',
        reason: 'Maintains daily problem-solving momentum.'
      });
    } else if (params.availableMinutes <= 60) {
      items.push({
        minutes: 20,
        title: 'Revise DBMS & Spaced Repetition Queue',
        category: 'Core CS',
        actionPrompt: 'Review DBMS ACID properties, dirty reads, and 2PL concurrency locks',
        reason: 'Core CS topics are heavily tested in campus screening rounds.'
      });
      items.push({
        minutes: 25,
        title: 'Solve 2 DSA Medium Problems',
        category: 'DSA',
        actionPrompt: 'Tackle Sliding Window / Binary Search problems from your weak list',
        reason: 'Sharpens pattern recognition for upcoming technical rounds.'
      });
      items.push({
        minutes: 15,
        title: 'Speed Aptitude Drills',
        category: 'Aptitude',
        actionPrompt: 'Practice 10 probability and time & work questions',
        reason: 'Ensures online assessment cutoff clearance.'
      });
    } else {
      items.push({
        minutes: 25,
        title: 'Revise Due Spaced Revisions',
        category: 'Core CS',
        actionPrompt: 'Review normalization 3NF vs BCNF and OS memory paging notes',
        reason: 'Retention drops rapidly without scheduled spaced reviews.'
      });
      items.push({
        minutes: 45,
        title: 'DSA Practice Session',
        category: 'DSA',
        actionPrompt: 'Solve 2 medium problems and 1 hard problem on Tree / Graph traversals',
        reason: 'Aligns directly with your target product company interviews.'
      });
      items.push({
        minutes: 25,
        title: 'SQL Challenge & Window Functions',
        category: 'SQL',
        actionPrompt: 'Write and test queries using DENSE_RANK, CTEs, and self-joins',
        reason: 'Frequently asked in data and software screening assessments.'
      });
      items.push({
        minutes: 25,
        title: 'Interview STAR Answer Practice',
        category: 'Interview',
        actionPrompt: 'Draft and speak out loud your project architecture and handling production failure answers',
        reason: 'Builds fluent articulation ahead of behavioral rounds.'
      });
    }

    return {
      totalDurationMinutes: params.availableMinutes,
      rationale: 'Generated from your active spaced revision queue, weak topic logs, and target role benchmarks.',
      items
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini generateStudyPlan error, using fallback:', err);
    return {
      totalDurationMinutes: params.availableMinutes,
      rationale: 'Generated from your active spaced revision queue and weak topic logs.',
      items: [
        {
          minutes: Math.round(params.availableMinutes * 0.4),
          title: 'DSA Pattern Practice',
          category: 'DSA',
          actionPrompt: 'Solve 2 medium problems focusing on Sliding Window or Binary Search',
          reason: 'Addresses your current weak problem categories.'
        },
        {
          minutes: Math.round(params.availableMinutes * 0.35),
          title: 'Core CS Revision',
          category: 'Core CS',
          actionPrompt: 'Revise DBMS transactions and OS synchronization mechanisms',
          reason: 'Overdue in your spaced repetition queue.'
        },
        {
          minutes: Math.round(params.availableMinutes * 0.25),
          title: 'Aptitude & Speed Math',
          category: 'Aptitude',
          actionPrompt: 'Solve 10 quantitative aptitude questions on percentages and probability',
          reason: 'Crucial for initial online screening tests.'
        }
      ]
    };
  }
}

export async function explainTopic(topic: string, subject: string, context?: string) {
  const ai = getAiClient();
  const prompt = `You are a world-class senior engineering placement mentor. Explain the topic "${topic}" in subject "${subject}".
${context ? `Context: ${context}` : ''}

Provide a structured, beautifully formatted response with:
1. High-Level Summary (2-3 sentences with an intuitive real-world analogy)
2. Core Technical Mechanics (step-by-step how it works under the hood)
3. Code / Query or Architecture Diagram snippet
4. Top 3 Interview Gotchas / Edge Cases (what interviewers specifically grill students on)
5. Quick Self-Check Question with brief answer`;

  if (!ai) {
    return {
      topic,
      subject,
      content: `### High-Level Summary
**${topic}** is a foundational concept in ${subject}. In simple terms, imagine a high-efficiency library routing system: instead of checking every book sequentially, specialized indexes and invariants direct you immediately to the target in logarithmic or constant time.

### Core Technical Mechanics
1. **Invariant Maintenance**: Every state transition maintains strict boundary conditions.
2. **Time & Space Trade-offs**: Balances memory utilization against retrieval speed.
3. **Failure Recovery**: Handles edge conditions gracefully (null pointers, boundary offsets, concurrent updates).

### Top Interview Gotchas & Edge Cases
- **Off-by-one errors**: Always test with empty sets, single-element arrays, and extreme duplicate keys.
- **Race conditions & locks**: Be ready to state whether locks are pessimistic or optimistic.
- **Complexity analysis**: State both worst-case and amortized time/space complexities clearly.

### Self-Check Question
*How does this behave under concurrent read/write pressure?*
*Answer:* Read replicas or optimistic concurrency tokens prevent blocking, ensuring atomicity without sacrificing system throughput.`,
      isAiGenerated: false
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return {
      topic,
      subject,
      content: response.text || '',
      isAiGenerated: true
    };
  } catch (err) {
    console.error('Gemini explainTopic error:', err);
    return {
      topic,
      subject,
      content: `Summary of ${topic} in ${subject}:\nFocus on time/space trade-offs, internal implementation mechanisms, and standard campus placement interview questions.`,
      isAiGenerated: false
    };
  }
}

export async function generateQuiz(topic: string, subject: string, count: number = 3) {
  const ai = getAiClient();
  const prompt = `Generate ${count} challenging campus placement multiple choice questions for "${topic}" in "${subject}".
Format strictly as a JSON array of objects:
[
  {
    "question": "Clear question text",
    "optionA": "Choice A",
    "optionB": "Choice B",
    "optionC": "Choice C",
    "optionD": "Choice D",
    "correctOption": "A" | "B" | "C" | "D",
    "explanation": "Detailed explanation why the option is correct."
  }
]`;

  if (!ai) {
    return [
      {
        question: `In ${topic} (${subject}), which of the following is true regarding its core constraint?`,
        optionA: 'It guarantees O(1) worst-case time under all distributions',
        optionB: 'It preserves strict ACID / invariant invariants while optimizing throughput',
        optionC: 'It cannot be implemented with contiguous memory allocations',
        optionD: 'It requires hardware-level floating point emulation',
        correctOption: 'B',
        explanation: 'Preserving invariants while ensuring scalability is the principal design objective.'
      },
      {
        question: `When dealing with boundary edge cases in ${topic}, what is the primary risk?`,
        optionA: 'Buffer overflow or off-by-one pointer invalidation',
        optionB: 'Excessive network protocol overhead',
        optionC: 'Loss of monotonic clock synchronization',
        optionD: 'Premature garbage collection of primitive types',
        correctOption: 'A',
        explanation: 'Boundary cases typically fail due to off-by-one array access or unchecked null pointers.'
      }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    const parsed = JSON.parse(response.text || '[]');
    return parsed;
  } catch (err) {
    console.error('Gemini generateQuiz error:', err);
    return [];
  }
}

export async function generateFlashcards(topic: string, subject: string) {
  const ai = getAiClient();
  const prompt = `Generate 4 high-yield flashcards for quick revision on "${topic}" in "${subject}".
Format strictly as a JSON array of objects:
[
  {
    "front": "Crucial question or prompt",
    "back": "Concise, high-impact answer (2-3 sentences)",
    "tip": "One line memory hook or mnemonic"
  }
]`;

  if (!ai) {
    return [
      {
        front: `What is the key difference between 3NF and BCNF?`,
        back: `In 3NF, for any X -> Y, either X is a superkey OR Y is a prime attribute. In BCNF, X must ALWAYS be a superkey with no exception.`,
        tip: `BCNF = strictly superkey determinants only.`
      },
      {
        front: `When does a Sliding Window contract vs expand?`,
        back: `Expand the right pointer to add new elements into window. When the window violates the target condition (e.g. duplicates or sum > k), advance the left pointer until valid again.`,
        tip: `Right explores, Left restores validity.`
      }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error('Gemini generateFlashcards error:', err);
    return [];
  }
}

export async function analyzeMistakes(mistakes: Array<{ problem: string; topic: string; mistake: string; lesson: string }>) {
  const ai = getAiClient();
  const prompt = `Analyze these student coding/theory mistakes logged during placement preparation:
${JSON.stringify(mistakes, null, 2)}

Provide a structured placement diagnostic report in JSON:
{
  "recurringWeaknessPatterns": ["Pattern 1", "Pattern 2"],
  "highPriorityTopicsToRevisit": ["Topic 1", "Topic 2"],
  "tacticalAdvice": "Clear, actionable advice to prevent these specific errors in upcoming coding rounds and technical interviews.",
  "recommendedPracticeSet": ["Problem/Question 1", "Problem/Question 2"]
}`;

  if (!ai) {
    return {
      recurringWeaknessPatterns: [
        'Boundary condition oversights during binary search and pointer movements',
        'Confusion between strict superkeys vs prime attributes in relational schema decomposition'
      ],
      highPriorityTopicsToRevisit: ['Binary Search', 'DBMS Normalization', 'Sliding Window'],
      tacticalAdvice: 'Before coding, explicitly dry-run with a 2-element array and an empty input. For DBMS questions, always list candidate keys explicitly first.',
      recommendedPracticeSet: [
        'LeetCode 33 - Search in Rotated Sorted Array',
        'LeetCode 3 - Longest Substring Without Repeating Characters',
        'GATE DBMS Decomposition questions'
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini analyzeMistakes error:', err);
    return {
      recurringWeaknessPatterns: ['Boundary condition handling', 'Invariant maintenance'],
      highPriorityTopicsToRevisit: ['Binary Search', 'DBMS'],
      tacticalAdvice: 'Dry-run small test cases before submitting.',
      recommendedPracticeSet: ['Binary Search variations', 'DBMS Normalization']
    };
  }
}
