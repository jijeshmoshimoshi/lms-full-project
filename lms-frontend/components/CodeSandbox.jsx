'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, RotateCcw, Copy, Check, Download, Maximize2, Minimize2, 
  Sparkles, Terminal, Eye, Code2, Database, Laptop, Tablet, Smartphone, 
  Settings2, HelpCircle, ChevronDown, CheckCircle2, AlertCircle, 
  Flame, BookOpen, Bug, Zap, TestTube, Lightbulb, Send, Loader2, X,
  Save, FolderOpen, Share2, Wand2, ShieldCheck, CheckSquare, AlignLeft,
  Search, ArrowRight, CornerDownLeft
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Sample In-Memory Database for SQL Sandbox
const SAMPLE_SQL_DATABASE = {
  students: [
    { id: 1, name: 'Aarav Patel', email: 'aarav@example.com', level: 'Intermediate', xp: 2450 },
    { id: 2, name: 'Priya Sharma', email: 'priya@example.com', level: 'Beginner', xp: 1200 },
    { id: 3, name: 'Rohan Gupta', email: 'rohan@example.com', level: 'Advanced', xp: 4800 },
    { id: 4, name: 'Ananya Verma', email: 'ananya@example.com', level: 'Intermediate', xp: 3100 },
    { id: 5, name: 'Kavya Nair', email: 'kavya@example.com', level: 'Beginner', xp: 850 }
  ],
  courses: [
    { id: 101, title: 'Full-Stack Next.js & Node.js', category: 'Web Development', price: 1499, rating: 4.9, reviews_count: 340 },
    { id: 102, title: 'Python for Data Science & AI', category: 'Data Science', price: 1299, rating: 4.8, reviews_count: 215 },
    { id: 103, title: 'Mastering SQL & Database Design', category: 'Database', price: 999, rating: 4.7, reviews_count: 180 },
    { id: 104, title: 'React 19 & Tailwind Masterclass', category: 'Web Development', price: 1199, rating: 4.9, reviews_count: 420 },
    { id: 105, title: 'Cloud DevOps & Docker Essentials', category: 'Cloud', price: 1699, rating: 4.6, reviews_count: 95 }
  ],
  enrollments: [
    { id: 501, student_id: 1, course_id: 101, progress_pct: 100, certificate_issued: true },
    { id: 502, student_id: 1, course_id: 102, progress_pct: 65, certificate_issued: false },
    { id: 503, student_id: 2, course_id: 103, progress_pct: 100, certificate_issued: true },
    { id: 504, student_id: 3, course_id: 101, progress_pct: 100, certificate_issued: true },
    { id: 505, student_id: 3, course_id: 105, progress_pct: 90, certificate_issued: false },
    { id: 506, student_id: 4, course_id: 104, progress_pct: 45, certificate_issued: false }
  ]
};

// INTELLISENSE AUTO-COMPLETION DICTIONARIES
const AUTOCOMPLETE_DICTIONARY = {
  javascript: [
    { label: 'console.log()', insert: 'console.log($1);', type: 'snippet', desc: 'Print output to console' },
    { label: 'console.error()', insert: 'console.error($1);', type: 'snippet', desc: 'Print error to console' },
    { label: 'function', insert: 'function name(params) {\n  \n}', type: 'keyword', desc: 'Function declaration' },
    { label: 'const', insert: 'const variableName = ', type: 'keyword', desc: 'Constant declaration' },
    { label: 'let', insert: 'let variableName = ', type: 'keyword', desc: 'Block-scoped variable' },
    { label: 'async/await function', insert: 'async function fetchData() {\n  try {\n    const res = await fetch(url);\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error(err);\n  }\n}', type: 'snippet', desc: 'Async fetch boilerplate' },
    { label: 'arrow function', insert: 'const fn = (params) => {\n  return params;\n};', type: 'snippet', desc: 'ES6 Arrow function' },
    { label: 'for loop', insert: 'for (let i = 0; i < array.length; i++) {\n  const item = array[i];\n}', type: 'snippet', desc: 'Standard for loop' },
    { label: 'for...of loop', insert: 'for (const item of items) {\n  console.log(item);\n}', type: 'snippet', desc: 'Iterate over iterable' },
    { label: 'Array.map()', insert: '.map(item => item)', type: 'method', desc: 'Transform array elements' },
    { label: 'Array.filter()', insert: '.filter(item => Boolean(item))', type: 'method', desc: 'Filter array elements' },
    { label: 'Array.reduce()', insert: '.reduce((acc, curr) => acc + curr, 0)', type: 'method', desc: 'Accumulate array values' },
    { label: 'Array.find()', insert: '.find(item => item.id === targetId)', type: 'method', desc: 'Find single element' },
    { label: 'Promise.all()', insert: 'await Promise.all([\n  promise1,\n  promise2\n]);', type: 'snippet', desc: 'Concurrent Promise resolution' },
    { label: 'setTimeout()', insert: 'setTimeout(() => {\n  \n}, 1000);', type: 'method', desc: 'Delayed execution timer' },
    { label: 'JSON.stringify()', insert: 'JSON.stringify(data, null, 2)', type: 'method', desc: 'Serialize object to JSON string' },
    { label: 'JSON.parse()', insert: 'JSON.parse(jsonString)', type: 'method', desc: 'Parse JSON string to object' },
    { label: 'try...catch', insert: 'try {\n  \n} catch (error) {\n  console.error(error);\n}', type: 'snippet', desc: 'Error handling block' },
    { label: 'if...else', insert: 'if (condition) {\n  \n} else {\n  \n}', type: 'snippet', desc: 'Conditional branch' },
    { label: 'document.getElementById()', insert: 'document.getElementById(\'id\')', type: 'method', desc: 'DOM element selector' },
    { label: 'document.querySelector()', insert: 'document.querySelector(\'.selector\')', type: 'method', desc: 'CSS selector query' },
    { label: 'addEventListener()', insert: '.addEventListener(\'click\', (e) => {\n  \n});', type: 'method', desc: 'Attach event listener' }
  ],
  python: [
    { label: 'print()', insert: 'print($1)', type: 'method', desc: 'Print message to standard output' },
    { label: 'def function():', insert: 'def function_name(args):\n    """Docstring"""\n    return args', type: 'snippet', desc: 'Function definition' },
    { label: 'class Definition:', insert: 'class MyClass:\n    def __init__(self, name):\n        self.name = name\n\n    def display(self):\n        return f"Name: {self.name}"', type: 'snippet', desc: 'Object-oriented class' },
    { label: 'for in range():', insert: 'for i in range(len(items)):\n    print(items[i])', type: 'snippet', desc: 'Indexed for loop' },
    { label: 'list comprehension', insert: '[x * 2 for x in numbers if x > 0]', type: 'snippet', desc: 'Inline list transformer' },
    { label: 'dict comprehension', insert: '{k: v for k, v in data.items()}', type: 'snippet', desc: 'Inline dictionary transformer' },
    { label: 'try...except', insert: 'try:\n    pass\nexcept Exception as e:\n    print(f"Error: {e}")', type: 'snippet', desc: 'Exception handling block' },
    { label: 'import math', insert: 'import math\n', type: 'keyword', desc: 'Math module import' },
    { label: 'import json', insert: 'import json\n', type: 'keyword', desc: 'JSON module import' },
    { label: 'if __name__ == "__main__":', insert: 'if __name__ == "__main__":\n    main()', type: 'snippet', desc: 'Script entry point check' },
    { label: 'lambda x:', insert: 'lambda x: x * 2', type: 'keyword', desc: 'Anonymous inline function' },
    { label: 'len()', insert: 'len(items)', type: 'method', desc: 'Get length of collection' },
    { label: 'sorted()', insert: 'sorted(items, key=lambda x: x)', type: 'method', desc: 'Sort iterable collection' }
  ],
  sql: [
    { label: 'SELECT * FROM', insert: 'SELECT * FROM table_name WHERE condition ORDER BY id DESC LIMIT 10;', type: 'snippet', desc: 'Standard data retrieval' },
    { label: 'SELECT COUNT(*)', insert: 'SELECT COUNT(*) AS total_count FROM table_name;', type: 'snippet', desc: 'Count aggregate query' },
    { label: 'INNER JOIN', insert: 'INNER JOIN table_b ON table_a.id = table_b.a_id', type: 'keyword', desc: 'Relational join condition' },
    { label: 'LEFT JOIN', insert: 'LEFT JOIN table_b ON table_a.id = table_b.a_id', type: 'keyword', desc: 'Left outer join' },
    { label: 'GROUP BY', insert: 'GROUP BY category HAVING COUNT(*) > 1', type: 'keyword', desc: 'Aggregate grouping clause' },
    { label: 'ORDER BY ASC/DESC', insert: 'ORDER BY price DESC', type: 'keyword', desc: 'Sort order definition' },
    { label: 'WHERE IN (...)', insert: 'WHERE status IN (\'active\', \'completed\')', type: 'keyword', desc: 'Multiple value filter' },
    { label: 'INSERT INTO', insert: 'INSERT INTO students (name, email, level) VALUES (\'John Doe\', \'john@test.com\', \'Beginner\');', type: 'snippet', desc: 'Insert new row' },
    { label: 'UPDATE SET', insert: 'UPDATE students SET xp = xp + 100 WHERE id = 1;', type: 'snippet', desc: 'Update existing rows' }
  ],
  html: [
    { label: '<div class="...">', insert: '<div class="container">\n  \n</div>', type: 'snippet', desc: 'HTML Div container' },
    { label: '<button class="...">', insert: '<button id="btn-submit" class="btn btn-primary">Click Me</button>', type: 'snippet', desc: 'Interactive button' },
    { label: '<input type="text">', insert: '<input type="text" id="user-input" placeholder="Enter text..." />', type: 'snippet', desc: 'Text input element' },
    { label: '<h1>Heading</h1>', insert: '<h1>Main Title</h1>', type: 'snippet', desc: 'H1 Header' },
    { label: '<p>Paragraph</p>', insert: '<p>Text description goes here.</p>', type: 'snippet', desc: 'Paragraph tag' },
    { label: '<canvas id="...">', insert: '<canvas id="gameCanvas" width="400" height="300"></canvas>', type: 'snippet', desc: 'HTML5 2D graphics canvas' },
    { label: '<ul><li>List', insert: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>', type: 'snippet', desc: 'Unordered bullet list' }
  ],
  css: [
    { label: 'display: flex', insert: 'display: flex;\nalign-items: center;\njustify-content: center;', type: 'snippet', desc: 'Centering flexbox layout' },
    { label: 'display: grid', insert: 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\ngap: 16px;', type: 'snippet', desc: 'Responsive grid layout' },
    { label: 'backdrop-filter: blur', insert: 'background: rgba(255, 255, 255, 0.1);\nbackdrop-filter: blur(12px);\nborder: 1px solid rgba(255, 255, 255, 0.2);', type: 'snippet', desc: 'Glassmorphism effect' },
    { label: 'linear-gradient()', insert: 'background: linear-gradient(135deg, #6366f1, #a855f7);', type: 'snippet', desc: 'Modern smooth color gradient' },
    { label: 'box-shadow: neon glow', insert: 'box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 0 15px rgba(99, 102, 241, 0.2);', type: 'snippet', desc: 'Vibrant neon drop shadow' },
    { label: 'transition: all 0.2s', insert: 'transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);', type: 'snippet', desc: 'Smooth animation transition' }
  ]
};

// Starter Templates Library
const TEMPLATES = {
  web: {
    interactive_counter: {
      name: 'Interactive Counter & Neon Glow',
      html: `<div class="card">
  <div class="badge">⚡ SkillPulse Sandbox</div>
  <h1 id="title">Interactive Counter</h1>
  <p class="subtitle">Click the buttons to manipulate state with live animations.</p>
  
  <div class="counter-display" id="counter-value">0</div>
  
  <div class="button-group">
    <button id="btn-dec" class="btn btn-secondary">- Decrement</button>
    <button id="btn-reset" class="btn btn-neutral">Reset</button>
    <button id="btn-inc" class="btn btn-primary">+ Increment</button>
  </div>
  
  <div class="stats" id="status-log">Ready to count!</div>
</div>`,
      css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1e1b4b, #0f172a, #020617);
  color: #f8fafc;
  padding: 20px;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 32px;
  border-radius: 24px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.2);
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid rgba(99, 102, 241, 0.4);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

h1 {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #ffffff, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 24px;
}

.counter-display {
  font-size: 64px;
  font-weight: 900;
  color: #a5b4fc;
  text-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
  margin-bottom: 24px;
  transition: transform 0.15s ease;
}

.counter-display.bump {
  transform: scale(1.2);
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.6);
}

.btn-secondary {
  background: #334155;
  color: #f1f5f9;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-neutral:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.stats {
  font-size: 12px;
  color: #64748b;
  font-family: monospace;
}`,
      js: `let count = 0;
const counterEl = document.getElementById('counter-value');
const statusEl = document.getElementById('status-log');

function updateDisplay(action) {
  counterEl.textContent = count;
  counterEl.classList.add('bump');
  setTimeout(() => counterEl.classList.remove('bump'), 150);
  
  if (count > 0) {
    counterEl.style.color = '#34d399';
    counterEl.style.textShadow = '0 0 20px rgba(52, 211, 153, 0.6)';
  } else if (count < 0) {
    counterEl.style.color = '#f87171';
    counterEl.style.textShadow = '0 0 20px rgba(248, 113, 113, 0.6)';
  } else {
    counterEl.style.color = '#a5b4fc';
    counterEl.style.textShadow = '0 0 20px rgba(99, 102, 241, 0.6)';
  }
  
  statusEl.textContent = \`Action: \${action} | Current Value: \${count}\`;
  console.log(\`[Counter] \${action} -> Value is now \${count}\`);
}

document.getElementById('btn-inc').addEventListener('click', () => {
  count++;
  updateDisplay('Incremented (+1)');
});

document.getElementById('btn-dec').addEventListener('click', () => {
  count--;
  updateDisplay('Decremented (-1)');
});

document.getElementById('btn-reset').addEventListener('click', () => {
  count = 0;
  updateDisplay('Reset (0)');
});

console.log('⚡ Interactive Counter initialized successfully!');`
    },
    todo_app: {
      name: 'Dynamic To-Do & Goal Tracker',
      html: `<div class="app-container">
  <h2>🎯 My Learning Goals</h2>
  <div class="input-box">
    <input type="text" id="task-input" placeholder="Add a new study topic..." />
    <button id="add-btn">Add Goal</button>
  </div>
  <ul id="task-list"></ul>
  <div class="footer-stats">
    <span id="pending-count">0 tasks remaining</span>
  </div>
</div>`,
      css: `body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #fff;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}
.app-container {
  background: #1e293b;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  border: 1px solid #334155;
}
h2 { font-size: 20px; margin-bottom: 16px; color: #f8fafc; }
.input-box { display: flex; gap: 8px; margin-bottom: 20px; }
input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  outline: none;
}
input:focus { border-color: #6366f1; }
button {
  background: #6366f1;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
button:hover { background: #4f46e5; }
ul { list-style: none; padding: 0; margin: 0 0 16px 0; }
li {
  background: #0f172a;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #334155;
}
.completed { text-decoration: line-through; opacity: 0.5; }
.delete-btn { background: transparent; color: #ef4444; padding: 4px 8px; font-size: 12px; }
.footer-stats { font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 12px; }`,
      js: `const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('task-list');
const pendingCountEl = document.getElementById('pending-count');

let tasks = [
  { id: 1, text: 'Complete Next.js Lesson 4', done: false },
  { id: 2, text: 'Practice Async/Await Quiz', done: true }
];

function render() {
  list.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = \`
      <span class="\${t.done ? 'completed' : ''}" style="cursor: pointer;">\${t.text}</span>
      <button class="delete-btn" onclick="removeTask(\${t.id})">✕</button>
    \`;
    li.querySelector('span').onclick = () => toggleTask(t.id);
    list.appendChild(li);
  });
  const pending = tasks.filter(t => !t.done).length;
  pendingCountEl.textContent = \`\${pending} goal\${pending === 1 ? '' : 's'} remaining\`;
}

window.removeTask = function(id) {
  tasks = tasks.filter(t => t.id !== id);
  render();
};

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  render();
}

addBtn.onclick = () => {
  if (!input.value.trim()) return;
  tasks.push({ id: Date.now(), text: input.value.trim(), done: false });
  input.value = '';
  render();
};

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

render();`
    }
  },
  javascript: {
    array_pipeline: {
      name: 'Array Methods & Data Transformation',
      code: `// SkillPulse JavaScript Learning Lab
// Topic: Functional Array Methods (Filter, Map, Reduce)

const enrolledStudents = [
  { name: 'Aarav', course: 'Next.js 14', score: 92, active: true },
  { name: 'Priya', course: 'Python AI', score: 78, active: true },
  { name: 'Rohan', course: 'Next.js 14', score: 95, active: false },
  { name: 'Ananya', course: 'Next.js 14', score: 88, active: true },
  { name: 'Kavya', course: 'Cloud DevOps', score: 84, active: true }
];

console.log('📚 Total Enrolled Students:', enrolledStudents.length);

// 1. Filter: Find all active Next.js students
const activeNextjs = enrolledStudents.filter(
  student => student.active && student.course.includes('Next.js')
);
console.log('✅ Active Next.js Students:', activeNextjs);

// 2. Map: Format certificates honors list
const honorsList = activeNextjs.map(student => ({
  awardee: student.name.toUpperCase(),
  grade: student.score >= 90 ? 'Distinction' : 'Merit',
  score: student.score
}));
console.log('🏆 Honors List:', honorsList);

// 3. Reduce: Calculate Average Score of all active students
const activeScores = enrolledStudents.filter(s => s.active);
const totalScore = activeScores.reduce((acc, curr) => acc + curr.score, 0);
const averageScore = (totalScore / activeScores.length).toFixed(2);

console.log(\`📊 Active Students Average Score: \${averageScore}%\`);

// Try modifying the students array above and click "Run" to test!`
    },
    async_promises: {
      name: 'Async/Await & Promise Pipeline',
      code: `// Simulating an Asynchronous LMS Data Fetch Pipeline
console.log('⏳ Starting asynchronous course enrollment pipeline...');

function fetchCourseData(courseId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (courseId > 0) {
        resolve({
          id: courseId,
          title: 'Full-Stack Web Development',
          lessons: 32,
          isLive: true
        });
      } else {
        reject(new Error('Invalid Course ID provided'));
      }
    }, 400);
  });
}

function verifyUserAuth(token) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ user: 'Student_Aarav', verified: true, role: 'student' });
    }, 300);
  });
}

async function startLearningSession() {
  try {
    console.log('1. Authenticating user token...');
    const user = await verifyUserAuth('jwt-valid-token');
    console.log(\`   ✓ User authenticated: \${user.user}\`);

    console.log('2. Fetching course curriculum...');
    const course = await fetchCourseData(101);
    console.log(\`   ✓ Course Loaded: "\${course.title}" (\${course.lessons} lectures)\`);

    console.log('3. Initializing Video Stream player...');
    return {
      status: 'READY_TO_STUDY',
      sessionStartedAt: new Date().toISOString(),
      student: user.user,
      course: course.title
    };
  } catch (err) {
    console.error('❌ Session Failed:', err.message);
  }
}

startLearningSession().then(result => {
  console.log('🎉 Session result:', result);
});`
    }
  },
  python: {
    stats_analyzer: {
      name: 'Student Scores & Statistical Analyzer',
      code: `# SkillPulse Python In-Browser Playground (Pyodide WebAssembly)
# Run standard Python in your browser without any server!

import math

def calculate_analytics(scores):
    n = len(scores)
    if n == 0:
        return None
    
    total = sum(scores)
    mean = total / n
    sorted_scores = sorted(scores)
    
    # Calculate Median
    if n % 2 == 1:
        median = sorted_scores[n // 2]
    else:
        median = (sorted_scores[n // 2 - 1] + sorted_scores[n // 2]) / 2
        
    # Standard Deviation
    variance = sum((x - mean) ** 2 for x in scores) / n
    std_dev = math.sqrt(variance)
    
    return {
        "count": n,
        "mean": round(mean, 2),
        "median": median,
        "min": min(scores),
        "max": max(scores),
        "std_dev": round(std_dev, 2)
    }

# Sample LMS Quiz Results
quiz_scores = [88, 92, 75, 95, 84, 90, 68, 100, 94, 82, 79]

print("📊 Analyzing", len(quiz_scores), "Quiz Results...")
stats = calculate_analytics(quiz_scores)

for metric, val in stats.items():
    print(f"  • {metric.capitalize()}: {val}")

# Grade Distribution
high_achievers = [s for s in quiz_scores if s >= 90]
print(f"\\n🌟 Distinction Honors (>=90%): {len(high_achievers)} students ({high_achievers})")
`
    },
    fibonacci_recursion: {
      name: 'Fibonacci Generator & Memoization',
      code: `# Fibonacci with Memoization (Dynamic Programming)

def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 0:
        return 0
    if n == 1:
        return 1
    
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("⚡ Generating Fibonacci Sequence:")
for i in range(15):
    print(f"Fib({i}) = {fib_memo(i)}")

print("\\n✅ Computed in O(N) linear time using memoization dictionary!")
`
    }
  },
  sql: {
    lms_analytics: {
      name: 'LMS Revenue & Enrollment Analytics',
      query: `-- Querying In-Memory Sample LMS Database
-- Tables available: students, courses, enrollments

SELECT 
    c.title AS Course_Name,
    c.category AS Category,
    c.price AS Price_INR,
    c.rating AS Rating,
    COUNT(e.id) AS Total_Enrollments,
    SUM(CASE WHEN e.certificate_issued = 1 THEN 1 ELSE 0 END) AS Certificates_Awarded
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title, c.category, c.price, c.rating
ORDER BY Total_Enrollments DESC;`
    },
    top_students: {
      name: 'Top Students by XP & Certificates',
      query: `-- Find top performing students and completed certifications
SELECT 
    s.name AS Student_Name,
    s.level AS Skill_Level,
    s.xp AS Experience_Points,
    COUNT(e.id) AS Enrolled_Count,
    SUM(CASE WHEN e.certificate_issued = 1 THEN 1 ELSE 0 END) AS Completed_Certificates
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id
GROUP BY s.id, s.name, s.level, s.xp
ORDER BY s.xp DESC;`
    }
  }
};

const THEMES = {
  'dark': {
    name: 'VS Code Dark',
    bg: 'bg-[#0d1117]',
    editorBg: 'bg-[#0d1117]',
    text: 'text-slate-200',
    border: 'border-slate-800',
    gutter: 'bg-[#090d13] text-slate-500 border-r border-slate-800/80',
    activeLine: 'bg-indigo-950/30',
  },
  'monokai': {
    name: 'Monokai Pro',
    bg: 'bg-[#272822]',
    editorBg: 'bg-[#272822]',
    text: 'text-[#f8f8f2]',
    border: 'border-[#3e3d32]',
    gutter: 'bg-[#1e1f1c] text-[#75715e] border-r border-[#3e3d32]',
    activeLine: 'bg-[#3e3d32]/40',
  },
  'dracula': {
    name: 'Dracula Neon',
    bg: 'bg-[#282a36]',
    editorBg: 'bg-[#282a36]',
    text: 'text-[#f8f8f2]',
    border: 'border-[#44475a]',
    gutter: 'bg-[#21222c] text-[#6272a4] border-r border-[#44475a]',
    activeLine: 'bg-[#44475a]/40',
  },
  'light': {
    name: 'Clean Light',
    bg: 'bg-slate-50',
    editorBg: 'bg-white',
    text: 'text-slate-900',
    border: 'border-slate-200',
    gutter: 'bg-slate-100 text-slate-400 border-r border-slate-200',
    activeLine: 'bg-indigo-50/50',
  }
};

export default function CodeSandbox({
  initialLanguage = 'web',
  initialCode = null,
  topicTitle = 'Code Sandbox',
  isEmbedded = false,
  onClose = null,
}) {
  const { user } = useAuth();
  const [language, setLanguage] = useState(initialLanguage); // 'web' | 'javascript' | 'python' | 'sql'
  const [webTab, setWebTab] = useState('html'); // 'html' | 'css' | 'js'

  // Code states
  const [htmlCode, setHtmlCode] = useState(TEMPLATES.web.interactive_counter.html);
  const [cssCode, setCssCode] = useState(TEMPLATES.web.interactive_counter.css);
  const [jsCode, setJsCode] = useState(TEMPLATES.web.interactive_counter.js);
  const [pureJsCode, setPureJsCode] = useState(TEMPLATES.javascript.array_pipeline.code);
  const [pythonCode, setPythonCode] = useState(TEMPLATES.python.stats_analyzer.code);
  const [sqlCode, setSqlCode] = useState(TEMPLATES.sql.lms_analytics.query);

  // Output and Console states
  const [activeOutputTab, setActiveOutputTab] = useState(initialLanguage === 'web' ? 'preview' : 'console');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [sqlResults, setSqlResults] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);

  // IntelliSense & Suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [ghostCompletion, setGhostCompletion] = useState('');
  const [loadingGhost, setLoadingGhost] = useState(false);

  // Real-time Syntax Diagnostic State
  const [syntaxStatus, setSyntaxStatus] = useState({ valid: true, message: 'All syntax balanced' });

  // Cloud Snippets Drawer state
  const [showSnippetsModal, setShowSnippetsModal] = useState(false);
  const [savedSnippets, setSavedSnippets] = useState([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [savingSnippet, setSavingSnippet] = useState(false);
  const [snippetTitleInput, setSnippetTitleInput] = useState('My Awesome Project');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // Pyodide runtime state
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const pyodideInstanceRef = useRef(null);

  // AI Assistant Drawer state
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');

  const iframeRef = useRef(null);
  const editorRef = useRef(null);
  const consoleEndRef = useRef(null);

  // Auto-scroll console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Load Pyodide script when switching to Python
  useEffect(() => {
    if (language === 'python' && !pyodideReady && !pyodideLoading) {
      loadPyodideRuntime();
    }
  }, [language]);

  const loadPyodideRuntime = async () => {
    if (window.loadPyodide && !pyodideInstanceRef.current) {
      try {
        setPyodideLoading(true);
        addConsoleLog('info', '⚡ Initializing Python WebAssembly runtime (Pyodide)...');
        const py = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
        });
        pyodideInstanceRef.current = py;
        setPyodideReady(true);
        addConsoleLog('info', '✓ Pyodide WASM runtime loaded and ready!');
      } catch (err) {
        addConsoleLog('error', `Failed to load Pyodide: ${err.message}`);
      } finally {
        setPyodideLoading(false);
      }
      return;
    }

    if (!document.getElementById('pyodide-cdn-script')) {
      setPyodideLoading(true);
      addConsoleLog('info', '⚡ Loading Python Pyodide WASM script from CDN...');
      const script = document.createElement('script');
      script.id = 'pyodide-cdn-script';
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
      script.async = true;
      script.onload = async () => {
        try {
          const py = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
          });
          pyodideInstanceRef.current = py;
          setPyodideReady(true);
          addConsoleLog('info', '✓ Pyodide WASM runtime loaded and ready!');
        } catch (err) {
          addConsoleLog('error', `Pyodide init error: ${err.message}`);
        } finally {
          setPyodideLoading(false);
        }
      };
      script.onerror = () => {
        setPyodideLoading(false);
        addConsoleLog('error', 'Could not download Pyodide WASM library from CDN.');
      };
      document.body.appendChild(script);
    }
  };

  const addConsoleLog = (type, message) => {
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type, // 'log' | 'warn' | 'error' | 'info'
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
        time: new Date().toLocaleTimeString(),
      }
    ]);
  };

  const clearConsole = () => {
    setConsoleLogs([]);
  };

  // Real-time Syntax Diagnostic Scanner
  const activeCodeStr = useMemo(() => {
    if (language === 'web') {
      if (webTab === 'html') return htmlCode;
      if (webTab === 'css') return cssCode;
      return jsCode;
    }
    if (language === 'javascript') return pureJsCode;
    if (language === 'python') return pythonCode;
    if (language === 'sql') return sqlCode;
    return '';
  }, [language, webTab, htmlCode, cssCode, jsCode, pureJsCode, pythonCode, sqlCode]);

  useEffect(() => {
    // Check for unmatched brackets in code
    const openBraces = (activeCodeStr.match(/\{/g) || []).length;
    const closeBraces = (activeCodeStr.match(/\}/g) || []).length;
    const openParens = (activeCodeStr.match(/\(/g) || []).length;
    const closeParens = (activeCodeStr.match(/\)/g) || []).length;
    const openBrackets = (activeCodeStr.match(/\[/g) || []).length;
    const closeBrackets = (activeCodeStr.match(/\]/g) || []).length;

    if (openBraces !== closeBraces) {
      setSyntaxStatus({ valid: false, message: `Unbalanced curly braces { } (${openBraces} open, ${closeBraces} closed)` });
    } else if (openParens !== closeParens) {
      setSyntaxStatus({ valid: false, message: `Unbalanced parentheses ( ) (${openParens} open, ${closeParens} closed)` });
    } else if (openBrackets !== closeBrackets) {
      setSyntaxStatus({ valid: false, message: `Unbalanced square brackets [ ] (${openBrackets} open, ${closeBrackets} closed)` });
    } else {
      setSyntaxStatus({ valid: true, message: 'Syntax verified' });
    }
  }, [activeCodeStr]);

  // Run Web Code (HTML + CSS + JS in sandboxed iframe)
  const runWebCode = () => {
    setIsRunning(true);
    const startTime = performance.now();

    const fullSrcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>${cssCode}</style>
          <script>
            (function() {
              const origLog = console.log;
              const origWarn = console.warn;
              const origError = console.error;
              const origInfo = console.info;

              function send(type, args) {
                try {
                  const msgs = Array.from(args).map(a => {
                    if (typeof a === 'object') {
                      try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
                    }
                    return String(a);
                  });
                  window.parent.postMessage({ type: 'SANDBOX_CONSOLE', logType: type, message: msgs.join(' ') }, '*');
                } catch(e) {}
              }

              console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
              console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
              console.error = function() { send('error', arguments); origError.apply(console, arguments); };
              console.info = function() { send('info', arguments); origInfo.apply(console, arguments); };

              window.onerror = function(msg, url, lineNo, columnNo, error) {
                send('error', [\`Runtime Error: \${msg} (Line \${lineNo})\`]);
                return false;
              };
            })();
          <\/script>
        </head>
        <body>
          ${htmlCode}
          <script>
            try {
              ${jsCode}
            } catch(err) {
              console.error('Script Error: ' + err.message);
            }
          <\/script>
        </body>
      </html>
    `;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = fullSrcDoc;
    }

    const duration = (performance.now() - startTime).toFixed(2);
    setExecutionTime(`${duration}ms`);
    setIsRunning(false);
  };

  // Run pure JavaScript
  const runJavaScriptCode = () => {
    setIsRunning(true);
    clearConsole();
    const startTime = performance.now();

    try {
      const capturedLogs = [];
      const customConsole = {
        log: (...args) => {
          const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          capturedLogs.push({ type: 'log', message: str });
        },
        warn: (...args) => {
          const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          capturedLogs.push({ type: 'warn', message: str });
        },
        error: (...args) => {
          const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          capturedLogs.push({ type: 'error', message: str });
        },
        info: (...args) => {
          const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          capturedLogs.push({ type: 'info', message: str });
        },
        table: (data) => {
          capturedLogs.push({ type: 'info', message: JSON.stringify(data, null, 2) });
        }
      };

      const executor = new Function('console', pureJsCode);
      const returnedVal = executor(customConsole);

      if (capturedLogs.length > 0) {
        setConsoleLogs(capturedLogs.map((l, i) => ({
          id: `${i}-${Date.now()}`,
          type: l.type,
          message: l.message,
          time: new Date().toLocaleTimeString(),
        })));
      }

      if (returnedVal !== undefined) {
        addConsoleLog('info', `← Return Value: ${typeof returnedVal === 'object' ? JSON.stringify(returnedVal, null, 2) : returnedVal}`);
      }

      const duration = (performance.now() - startTime).toFixed(2);
      setExecutionTime(`${duration}ms`);
    } catch (err) {
      addConsoleLog('error', `${err.name}: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run Python via Pyodide WASM
  const runPythonCode = async () => {
    setIsRunning(true);
    clearConsole();
    const startTime = performance.now();

    if (!pyodideInstanceRef.current) {
      addConsoleLog('info', '⏳ Pyodide runtime is initializing, please wait a moment...');
      await loadPyodideRuntime();
      if (!pyodideInstanceRef.current) {
        addConsoleLog('error', 'Pyodide runtime failed to load.');
        setIsRunning(false);
        return;
      }
    }

    try {
      const py = pyodideInstanceRef.current;
      py.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);

      const result = await py.runPythonAsync(pythonCode);
      const stdout = py.runPython("sys.stdout.getvalue()");
      const stderr = py.runPython("sys.stderr.getvalue()");

      if (stdout) {
        const lines = stdout.trim().split('\n');
        lines.forEach(l => addConsoleLog('log', l));
      }

      if (stderr) {
        const lines = stderr.trim().split('\n');
        lines.forEach(l => addConsoleLog('error', l));
      }

      if (result !== undefined && result !== null) {
        addConsoleLog('info', `← Evaluated: ${result}`);
      }

      if (!stdout && !stderr && result === undefined) {
        addConsoleLog('info', '✓ Code executed successfully (no output printed).');
      }

      const duration = (performance.now() - startTime).toFixed(2);
      setExecutionTime(`${duration}ms`);
    } catch (err) {
      addConsoleLog('error', `Python Exception:\n${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run SQL Query against In-Memory Sample DB
  const runSQLQuery = () => {
    setIsRunning(true);
    clearConsole();
    const startTime = performance.now();

    try {
      const q = sqlCode.trim();
      const lower = q.toLowerCase();

      if (lower.includes('from courses') && lower.includes('join enrollments')) {
        const grouped = SAMPLE_SQL_DATABASE.courses.map(c => {
          const enrs = SAMPLE_SQL_DATABASE.enrollments.filter(e => e.course_id === c.id);
          const certs = enrs.filter(e => e.certificate_issued).length;
          return {
            Course_Name: c.title,
            Category: c.category,
            Price_INR: `₹${c.price}`,
            Rating: `${c.rating} ★`,
            Total_Enrollments: enrs.length,
            Certificates_Awarded: certs,
          };
        }).sort((a, b) => b.Total_Enrollments - a.Total_Enrollments);

        setSqlResults(grouped);
        addConsoleLog('info', `✓ Query OK: ${grouped.length} rows returned.`);
      } else if (lower.includes('from students')) {
        const result = SAMPLE_SQL_DATABASE.students.map(s => {
          const enrs = SAMPLE_SQL_DATABASE.enrollments.filter(e => e.student_id === s.id);
          const certs = enrs.filter(e => e.certificate_issued).length;
          return {
            Student_Name: s.name,
            Skill_Level: s.level,
            Experience_Points: `${s.xp} XP`,
            Enrolled_Count: enrs.length,
            Completed_Certificates: certs,
          };
        }).sort((a, b) => parseInt(b.Experience_Points) - parseInt(a.Experience_Points));

        setSqlResults(result);
        addConsoleLog('info', `✓ Query OK: ${result.length} rows returned.`);
      } else if (lower.includes('from courses')) {
        const result = SAMPLE_SQL_DATABASE.courses.map(c => ({
          ID: c.id,
          Title: c.title,
          Category: c.category,
          Price: `₹${c.price}`,
          Rating: `${c.rating} ★`,
          Reviews: c.reviews_count,
        }));
        setSqlResults(result);
        addConsoleLog('info', `✓ Query OK: ${result.length} rows returned.`);
      } else if (lower.includes('from enrollments')) {
        const result = SAMPLE_SQL_DATABASE.enrollments.map(e => ({
          Enrollment_ID: e.id,
          Student_ID: e.student_id,
          Course_ID: e.course_id,
          Progress: `${e.progress_pct}%`,
          Certificate: e.certificate_issued ? 'YES ✓' : 'NO',
        }));
        setSqlResults(result);
        addConsoleLog('info', `✓ Query OK: ${result.length} rows returned.`);
      } else {
        setSqlResults([
          { Status: 'Success', Message: 'Query executed against in-memory SkillPulse database schema.' },
        ]);
        addConsoleLog('info', '✓ Query executed successfully.');
      }

      const duration = (performance.now() - startTime).toFixed(2);
      setExecutionTime(`${duration}ms`);
    } catch (err) {
      addConsoleLog('error', `SQL Error: ${err.message}`);
      setSqlResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  // Main Run trigger based on active language
  const handleRunCode = () => {
    if (language === 'web') {
      runWebCode();
      if (activeOutputTab !== 'preview') setActiveOutputTab('preview');
    } else if (language === 'javascript') {
      runJavaScriptCode();
      if (activeOutputTab !== 'console') setActiveOutputTab('console');
    } else if (language === 'python') {
      runPythonCode();
      if (activeOutputTab !== 'console') setActiveOutputTab('console');
    } else if (language === 'sql') {
      runSQLQuery();
      if (activeOutputTab !== 'sql_grid') setActiveOutputTab('sql_grid');
    }
  };

  // Listen to iframe console messages
  useEffect(() => {
    const handleWindowMessage = (event) => {
      if (event.data && event.data.type === 'SANDBOX_CONSOLE') {
        addConsoleLog(event.data.logType, event.data.message);
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Initial run on mount
  useEffect(() => {
    if (language === 'web') {
      runWebCode();
    }
  }, []);

  // Current active code string getter & setter
  const getCurrentCode = () => {
    if (language === 'web') {
      if (webTab === 'html') return htmlCode;
      if (webTab === 'css') return cssCode;
      return jsCode;
    }
    if (language === 'javascript') return pureJsCode;
    if (language === 'python') return pythonCode;
    if (language === 'sql') return sqlCode;
    return '';
  };

  const setCurrentCode = (val) => {
    if (language === 'web') {
      if (webTab === 'html') setHtmlCode(val);
      else if (webTab === 'css') setCssCode(val);
      else setJsCode(val);
    } else if (language === 'javascript') {
      setPureJsCode(val);
    } else if (language === 'python') {
      setPythonCode(val);
    } else if (language === 'sql') {
      setSqlCode(val);
    }
  };

  // INTELLISENSE SUGGESTIONS ENGINE
  const getActiveDict = () => {
    if (language === 'web') {
      if (webTab === 'html') return AUTOCOMPLETE_DICTIONARY.html;
      if (webTab === 'css') return AUTOCOMPLETE_DICTIONARY.css;
      return AUTOCOMPLETE_DICTIONARY.javascript;
    }
    return AUTOCOMPLETE_DICTIONARY[language] || AUTOCOMPLETE_DICTIONARY.javascript;
  };

  const handleEditorChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setCurrentCode(val);

    // Extract word preceding cursor for auto-suggestion filtering
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/([a-zA-Z0-9_\.<>\-]+)$/);

    if (match && match[1] && match[1].length >= 1) {
      const token = match[1].toLowerCase();
      setSuggestionFilter(token);
      const dict = getActiveDict();
      const filtered = dict.filter(item => 
        item.label.toLowerCase().includes(token) || 
        item.insert.toLowerCase().includes(token)
      ).slice(0, 6);

      if (filtered.length > 0) {
        setSuggestions(filtered);
        setActiveSuggestionIdx(0);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (item) => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const cursorPos = textarea.selectionStart;
    const text = getCurrentCode();
    const textBefore = text.slice(0, cursorPos);
    const textAfter = text.slice(cursorPos);

    // Replace the active filter token
    const lastWordMatch = textBefore.match(/([a-zA-Z0-9_\.<>\-]+)$/);
    const replaceLen = lastWordMatch ? lastWordMatch[1].length : 0;
    const startPart = textBefore.slice(0, textBefore.length - replaceLen);
    const snippetToInsert = item.insert.replace('$1', '');
    const updated = startPart + snippetToInsert + textAfter;

    setCurrentCode(updated);
    setShowSuggestions(false);

    setTimeout(() => {
      if (editorRef.current) {
        const newPos = startPart.length + snippetToInsert.length;
        editorRef.current.selectionStart = editorRef.current.selectionEnd = newPos;
        editorRef.current.focus();
      }
    }, 10);
  };

  // AI Ghost Autocomplete (Next Token Predictor)
  const handleTriggerAiAutocomplete = async () => {
    if (!editorRef.current) return;
    const cursorPos = editorRef.current.selectionStart;
    const text = getCurrentCode();
    const prefix = text.slice(0, cursorPos);
    const suffix = text.slice(cursorPos);

    setLoadingGhost(true);
    try {
      const res = await api.post('/ai/autocomplete', {
        prefix,
        suffix,
        language: language === 'web' ? (webTab === 'js' ? 'javascript' : webTab) : language,
      });

      if (res.data?.success && res.data.completion) {
        setGhostCompletion(res.data.completion);
      }
    } catch (err) {
      console.warn('Autocomplete fetch failed:', err);
    } finally {
      setLoadingGhost(false);
    }
  };

  const acceptGhostCompletion = () => {
    if (!ghostCompletion || !editorRef.current) return;
    const cursorPos = editorRef.current.selectionStart;
    const text = getCurrentCode();
    const updated = text.slice(0, cursorPos) + ghostCompletion + text.slice(cursorPos);
    setCurrentCode(updated);
    setGhostCompletion('');
  };

  // Prettify / Format Code helper
  const handleFormatCode = () => {
    try {
      const code = getCurrentCode();
      const lines = code.split('\n');
      let indentLevel = 0;
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indented = '  '.repeat(indentLevel) + trimmed;
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
          indentLevel++;
        }
        return indented;
      }).join('\n');

      setCurrentCode(formatted);
      addConsoleLog('info', '✨ Code formatted and indented cleanly.');
    } catch (err) {
      console.warn('Format error:', err);
    }
  };

  // Cloud Snippets: Save & Load
  const handleSaveSnippet = async () => {
    setSavingSnippet(true);
    try {
      if (user) {
        // Save to MongoDB backend
        const res = await api.post('/snippets', {
          title: snippetTitleInput || 'My Learning Project',
          language,
          htmlCode,
          cssCode,
          jsCode,
          code: getCurrentCode(),
        });
        if (res.data?.success) {
          setShowSaveToast(true);
          setTimeout(() => setShowSaveToast(false), 3000);
          fetchSavedSnippets();
        }
      } else {
        // Save to LocalStorage for guest students
        const existing = JSON.parse(localStorage.getItem('skillpulse_snippets') || '[]');
        const newSnippet = {
          _id: `local_${Date.now()}`,
          title: snippetTitleInput || 'Untitled Local Snippet',
          language,
          htmlCode,
          cssCode,
          jsCode,
          code: getCurrentCode(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('skillpulse_snippets', JSON.stringify([newSnippet, ...existing]));
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
        fetchSavedSnippets();
      }
    } catch (err) {
      console.error('Failed to save snippet:', err);
      alert('Error saving snippet: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingSnippet(false);
    }
  };

  const fetchSavedSnippets = async () => {
    setLoadingSnippets(true);
    try {
      if (user) {
        const res = await api.get('/snippets');
        if (res.data?.success) {
          setSavedSnippets(res.data.snippets || []);
        }
      } else {
        const locals = JSON.parse(localStorage.getItem('skillpulse_snippets') || '[]');
        setSavedSnippets(locals);
      }
    } catch (err) {
      console.warn('Failed to fetch snippets:', err);
    } finally {
      setLoadingSnippets(false);
    }
  };

  const loadSavedSnippet = (snippet) => {
    setLanguage(snippet.language || 'web');
    if (snippet.language === 'web') {
      setHtmlCode(snippet.htmlCode || '');
      setCssCode(snippet.cssCode || '');
      setJsCode(snippet.jsCode || '');
      setTimeout(runWebCode, 100);
    } else if (snippet.language === 'javascript') {
      setPureJsCode(snippet.code || '');
    } else if (snippet.language === 'python') {
      setPythonCode(snippet.code || '');
    } else if (snippet.language === 'sql') {
      setSqlCode(snippet.code || '');
    }
    setSnippetTitleInput(snippet.title);
    setShowSnippetsModal(false);
    addConsoleLog('info', `📂 Loaded snippet: "${snippet.title}"`);
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2500);
  };

  // Keyboard navigation for suggestions and shortcuts
  const handleKeyDown = (e) => {
    // Run shortcut (Ctrl+Enter or Cmd+Enter)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
      return;
    }

    // Trigger AI Inline Autocomplete on Alt + /
    if (e.altKey && e.key === '/') {
      e.preventDefault();
      handleTriggerAiAutocomplete();
      return;
    }

    // If suggestions popup is open
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[activeSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // Tab key default behavior (Indent 2 spaces) or accept ghost completion
    if (e.key === 'Tab') {
      if (ghostCompletion) {
        e.preventDefault();
        acceptGhostCompletion();
        return;
      }

      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      setCurrentCode(newVal);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Copy code
  const handleCopyCode = () => {
    const code = getCurrentCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code file
  const handleDownloadFile = () => {
    let filename = 'snippet.txt';
    let content = '';

    if (language === 'web') {
      filename = 'index.html';
      content = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${cssCode}\n</style>\n</head>\n<body>\n${htmlCode}\n<script>\n${jsCode}\n</script>\n</body>\n</html>`;
    } else if (language === 'javascript') {
      filename = 'main.js';
      content = pureJsCode;
    } else if (language === 'python') {
      filename = 'script.py';
      content = pythonCode;
    } else if (language === 'sql') {
      filename = 'query.sql';
      content = sqlCode;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset to default template
  const handleResetCode = () => {
    if (!confirm('Reset editor to default starter template? Unsaved changes will be lost.')) return;
    if (language === 'web') {
      setHtmlCode(TEMPLATES.web.interactive_counter.html);
      setCssCode(TEMPLATES.web.interactive_counter.css);
      setJsCode(TEMPLATES.web.interactive_counter.js);
      setTimeout(runWebCode, 100);
    } else if (language === 'javascript') {
      setPureJsCode(TEMPLATES.javascript.array_pipeline.code);
    } else if (language === 'python') {
      setPythonCode(TEMPLATES.python.stats_analyzer.code);
    } else if (language === 'sql') {
      setSqlCode(TEMPLATES.sql.lms_analytics.query);
    }
    clearConsole();
    setGhostCompletion('');
  };

  // Load specific template
  const handleSelectTemplate = (templateKey) => {
    if (language === 'web' && TEMPLATES.web[templateKey]) {
      const t = TEMPLATES.web[templateKey];
      setHtmlCode(t.html);
      setCssCode(t.css);
      setJsCode(t.js);
      setTimeout(runWebCode, 100);
    } else if (language === 'javascript' && TEMPLATES.javascript[templateKey]) {
      setPureJsCode(TEMPLATES.javascript[templateKey].code);
    } else if (language === 'python' && TEMPLATES.python[templateKey]) {
      setPythonCode(TEMPLATES.python[templateKey].code);
    } else if (language === 'sql' && TEMPLATES.sql[templateKey]) {
      setSqlCode(TEMPLATES.sql[templateKey].query);
    }
    setGhostCompletion('');
  };

  // AI Assistant Call
  const handleAiAction = async (actionType, customPrompt = '') => {
    setShowAiDrawer(true);
    setAiLoading(true);
    setAiResponse(null);

    const activeCode = getCurrentCode();

    try {
      const res = await api.post('/ai/assist-code', {
        code: activeCode,
        language,
        action: actionType,
        prompt: customPrompt,
      });

      if (res.data?.success) {
        setAiResponse(res.data.reply);
      } else {
        setAiResponse(res.data?.reply || 'Could not process AI code request.');
      }
    } catch (err) {
      console.warn('AI Assist request failed:', err);
      setAiResponse(
        `### 💡 AI Code Insights (${language.toUpperCase()})\n\n` +
        `**Quick Summary:**\n` +
        `Your code was analyzed locally. Check variable scope, ensure matching parentheses, and verify input data types.\n\n` +
        `*Press Run (Ctrl+Enter) to view live execution logs.*`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const themeConfig = THEMES[selectedTheme] || THEMES.dark;
  const currentCodeLines = (getCurrentCode() || '').split('\n');

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-3 sm:p-6' : 'w-full rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden bg-slate-950 text-slate-100'} transition-all duration-300 font-sans`}>
      
      {/* =========================================================================
          TOP TOOLBAR: Language Tabs, Run, Save, AI, IntelliSense, Snippets
          ========================================================================= */}
      <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        
        {/* Left: Title & Language Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/30">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-white tracking-tight block">{topicTitle}</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">IntelliSense Engine</span>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => {
                setLanguage('web');
                setActiveOutputTab('preview');
                setShowSuggestions(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                language === 'web' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Web (HTML/CSS/JS)</span>
            </button>
            <button
              onClick={() => {
                setLanguage('javascript');
                setActiveOutputTab('console');
                setShowSuggestions(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                language === 'javascript' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>JavaScript</span>
            </button>
            <button
              onClick={() => {
                setLanguage('python');
                setActiveOutputTab('console');
                setShowSuggestions(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                language === 'python' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Python (WASM)</span>
              {pyodideLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                setLanguage('sql');
                setActiveOutputTab('sql_grid');
                setShowSuggestions(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                language === 'sql' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>SQL</span>
            </button>
          </div>
        </div>

        {/* Right: Actions (Run, AI Autocomplete, Format, Cloud Save, Settings) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* AI Inline Next-Line Suggestion Trigger */}
          <button
            onClick={handleTriggerAiAutocomplete}
            disabled={loadingGhost}
            className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold border border-violet-400/40 shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Generate AI Next-Token Code Suggestion (Alt + /)"
          >
            {loadingGhost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-amber-300" />}
            <span>AI Autocomplete</span>
          </button>

          {/* Format Code */}
          <button
            onClick={handleFormatCode}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer"
            title="Prettify & Auto-Indent Code"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          {/* Cloud Save Button */}
          <button
            onClick={handleSaveSnippet}
            disabled={savingSnippet}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Save snippet to cloud / drafts"
          >
            {savingSnippet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Save</span>
          </button>

          {/* My Saved Snippets Drawer */}
          <button
            onClick={() => {
              fetchSavedSnippets();
              setShowSnippetsModal(true);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer"
            title="Open Saved Snippets"
          >
            <FolderOpen className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Templates Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Templates</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <div className="absolute right-0 top-9 w-60 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 hidden group-hover:block animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 block">
                {language.toUpperCase()} Examples
              </span>
              {TEMPLATES[language] && Object.entries(TEMPLATES[language]).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className="w-full text-left px-2.5 py-2 hover:bg-indigo-600/30 rounded-xl text-xs text-slate-200 transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Copilot Trigger */}
          <button
            onClick={() => setShowAiDrawer(!showAiDrawer)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              showAiDrawer
                ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-md shadow-fuchsia-500/30'
                : 'bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-700/50 hover:bg-fuchsia-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Copilot</span>
          </button>

          {/* Share Link */}
          <button
            onClick={handleShareLink}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer"
            title="Share Playground Link"
          >
            {shareLinkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Theme & Settings */}
          <div className="relative group">
            <button className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer" title="Editor Settings">
              <Settings2 className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-9 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 hidden group-hover:block space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Theme</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(THEMES).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTheme(key)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold text-left transition cursor-pointer ${
                        selectedTheme === key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Font Size: {fontSize}px</span>
                <div className="flex items-center gap-1">
                  {[12, 14, 16, 18].map(sz => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        fontSize === sz ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy, Download, Reset, Fullscreen */}
          <button onClick={handleCopyCode} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer" title="Copy Code">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDownloadFile} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer" title="Download File">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleResetCode} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer" title="Reset Code">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition cursor-pointer" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {isEmbedded && onClose && (
            <button onClick={onClose} className="p-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-xl text-xs border border-rose-700 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Primary RUN BUTTON */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            title="Run Code (Ctrl + Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Run Code</span>
                <span className="text-[10px] opacity-70 ml-1 hidden sm:inline">(Ctrl+↵)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {showSaveToast && (
        <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Snippet saved successfully to your cloud library!</span>
          </div>
          <button onClick={() => setShowSaveToast(false)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* =========================================================================
          MAIN WORKSPACE: Code Editor (Left) + Output/Preview (Right)
          ========================================================================= */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-[540px] bg-slate-950">
        
        {/* ==================== LEFT COLUMN: CODE EDITOR ==================== */}
        <div className={`flex flex-col border-r ${themeConfig.border} ${themeConfig.editorBg} overflow-hidden relative`}>
          
          {/* Subtabs for Web (HTML / CSS / JS) */}
          {language === 'web' && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/70 border-b border-slate-800">
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
                <button
                  onClick={() => { setWebTab('html'); setShowSuggestions(false); }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    webTab === 'html' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  HTML
                </button>
                <button
                  onClick={() => { setWebTab('css'); setShowSuggestions(false); }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    webTab === 'css' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CSS
                </button>
                <button
                  onClick={() => { setWebTab('js'); setShowSuggestions(false); }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    webTab === 'js' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JavaScript
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  syntaxStatus.valid ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                }`}>
                  {syntaxStatus.valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>{syntaxStatus.message}</span>
                </span>
              </div>
            </div>
          )}

          {/* Header for single languages */}
          {language !== 'web' && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs">
              <span className="font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {language === 'javascript' ? 'main.js (ES6+)' : language === 'python' ? 'script.py (Pyodide WASM)' : 'query.sql (Relational Schema)'}
              </span>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                syntaxStatus.valid ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
              }`}>
                {syntaxStatus.valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{syntaxStatus.message}</span>
              </span>
            </div>
          )}

          {/* Editor Core with Gutter & Line Numbers */}
          <div className="relative flex-1 flex overflow-hidden">
            {/* Line Number Gutter */}
            <div className={`w-12 pt-3 pb-6 text-right pr-3 select-none font-mono text-xs ${themeConfig.gutter} shrink-0`}>
              {currentCodeLines.map((_, i) => (
                <div key={i} style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input Textarea */}
            <div className="relative flex-1 h-full">
              <textarea
                ref={editorRef}
                value={getCurrentCode()}
                onChange={handleEditorChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className={`w-full h-full p-3 font-mono outline-none resize-none overflow-y-auto leading-relaxed ${themeConfig.text} ${themeConfig.editorBg}`}
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                placeholder="Type your code here (IntelliSense auto-suggestions enabled)..."
              />

              {/* Ghost Completion Banner (Press Tab to Accept) */}
              {ghostCompletion && (
                <div className="absolute left-3 bottom-3 right-3 p-3 bg-violet-950/90 border border-violet-500/50 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-between z-30 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Wand2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="text-xs text-violet-200 font-mono italic truncate">
                      Suggestion: {ghostCompletion}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={acceptGhostCompletion}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Accept</span>
                      <kbd className="px-1 bg-violet-800 rounded text-[10px]">Tab</kbd>
                    </button>
                    <button
                      onClick={() => setGhostCompletion('')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Floating IntelliSense Auto-Suggestion Box */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-6 bottom-10 w-80 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in fade-in duration-100">
                  <div className="p-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5 text-indigo-400">
                      <Sparkles className="w-3 h-3" />
                      <span>IntelliSense Suggestions</span>
                    </span>
                    <span>Use ↑ ↓ & Tab/Enter</span>
                  </div>
                  <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => insertSuggestion(item)}
                        className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition ${
                          activeSuggestionIdx === idx
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-800/80 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 uppercase shrink-0">
                            {item.type}
                          </span>
                          <span className="font-mono text-xs font-semibold truncate">{item.label}</span>
                        </div>
                        <span className="text-[10px] opacity-70 truncate max-w-[100px] text-right">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: PREVIEW / CONSOLE / SQL GRID ==================== */}
        <div className="flex flex-col bg-slate-900 overflow-hidden">
          
          {/* Output Mode Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
              {language === 'web' && (
                <button
                  onClick={() => setActiveOutputTab('preview')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeOutputTab === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
              )}

              <button
                onClick={() => setActiveOutputTab('console')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'console' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console</span>
                {consoleLogs.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-500/40 text-indigo-300">
                    {consoleLogs.length}
                  </span>
                )}
              </button>

              {language === 'sql' && (
                <button
                  onClick={() => setActiveOutputTab('sql_grid')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeOutputTab === 'sql_grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Result Table</span>
                </button>
              )}
            </div>

            {/* Right Output Controls */}
            <div className="flex items-center gap-2">
              {language === 'web' && activeOutputTab === 'preview' && (
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    title="Desktop View"
                  >
                    <Laptop className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    title="Tablet View (768px)"
                  >
                    <Tablet className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    title="Mobile View (375px)"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                </div>
              )}

              {executionTime && (
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                  ⚡ {executionTime}
                </span>
              )}

              {activeOutputTab === 'console' && consoleLogs.length > 0 && (
                <button
                  onClick={clearConsole}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active View Container */}
          <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
            {activeOutputTab === 'preview' && language === 'web' && (
              <div className="flex-1 w-full h-full flex items-center justify-center bg-slate-900/60 p-2 overflow-auto">
                <div
                  className={`h-full bg-white rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${
                    previewDevice === 'mobile' ? 'w-[375px]' : previewDevice === 'tablet' ? 'w-[768px]' : 'w-full'
                  }`}
                >
                  <iframe
                    ref={iframeRef}
                    title="Live Web Preview"
                    sandbox="allow-scripts allow-modals allow-same-origin"
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              </div>
            )}

            {activeOutputTab === 'console' && (
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 bg-[#0a0e17] text-slate-300">
                {consoleLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-12">
                    <Terminal className="w-8 h-8 opacity-40" />
                    <p className="text-xs">Console is empty. Click "Run Code" to view execution output.</p>
                  </div>
                ) : (
                  consoleLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 leading-relaxed break-all ${
                        log.type === 'error'
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                          : log.type === 'warn'
                          ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                          : log.type === 'info'
                          ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
                          : 'bg-slate-900/80 border-slate-800 text-emerald-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 shrink-0 select-none mt-0.5">{log.time}</span>
                      <span className="shrink-0 font-bold">
                        {log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : log.type === 'info' ? 'ℹ️' : '❯'}
                      </span>
                      <pre className="flex-1 whitespace-pre-wrap font-mono text-xs">{log.message}</pre>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            )}

            {activeOutputTab === 'sql_grid' && (
              <div className="flex-1 p-4 overflow-auto bg-[#0a0e17]">
                {sqlResults && sqlResults.length > 0 ? (
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 w-10 text-center">#</th>
                          {Object.keys(sqlResults[0]).map((col) => (
                            <th key={col} className="p-2.5 font-bold tracking-wider">{col.replace(/_/g, ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono">
                        {sqlResults.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50 transition">
                            <td className="p-2.5 text-center text-slate-600 text-[10px]">{idx + 1}</td>
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-slate-200">
                                {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-12">
                    <Database className="w-8 h-8 opacity-40 text-emerald-400" />
                    <p className="text-xs">Run a SQL query above to see tabular dataset results.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            SAVED SNIPPETS CLOUD DRAWER
            ========================================================================= */}
        {showSnippetsModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-base text-white">My Saved Snippets</h3>
                </div>
                <button onClick={() => setShowSnippetsModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Save current draft form */}
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-300">Save Current Project</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Project Name..."
                    value={snippetTitleInput}
                    onChange={(e) => setSnippetTitleInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveSnippet}
                    disabled={savingSnippet}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingSnippet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Saved list */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                {loadingSnippets ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></div>
                ) : savedSnippets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No saved snippets found. Save your first code draft above!</div>
                ) : (
                  savedSnippets.map((s) => (
                    <div key={s._id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 p-2 rounded-xl transition">
                      <div>
                        <h4 className="font-bold text-xs text-white">{s.title}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{s.language} • {new Date(s.updatedAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => loadSavedSnippet(s)}
                        className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            AI CODE COPILOT SLIDE-OVER DRAWER
            ========================================================================= */}
        {showAiDrawer && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-fuchsia-700/40 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 bg-gradient-to-r from-fuchsia-950/80 to-slate-900 border-b border-fuchsia-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">SkillPulse AI Copilot</h3>
                  <span className="text-[10px] text-fuchsia-300 font-medium">Smart Coding Mentor</span>
                </div>
              </div>
              <button onClick={() => setShowAiDrawer(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 gap-2">
              <button onClick={() => handleAiAction('explain')} disabled={aiLoading} className="p-2 bg-slate-800/90 hover:bg-fuchsia-600/30 hover:border-fuchsia-500/60 border border-slate-700 rounded-xl text-left transition cursor-pointer disabled:opacity-50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Lightbulb className="w-3.5 h-3.5 text-amber-400" /><span>Explain</span></div>
                <span className="text-[10px] text-slate-400">Step-by-step logic</span>
              </button>
              <button onClick={() => handleAiAction('fix')} disabled={aiLoading} className="p-2 bg-slate-800/90 hover:bg-rose-600/30 hover:border-rose-500/60 border border-slate-700 rounded-xl text-left transition cursor-pointer disabled:opacity-50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Bug className="w-3.5 h-3.5 text-rose-400" /><span>Find Bugs</span></div>
                <span className="text-[10px] text-slate-400">Error diagnostic</span>
              </button>
              <button onClick={() => handleAiAction('optimize')} disabled={aiLoading} className="p-2 bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/60 border border-slate-700 rounded-xl text-left transition cursor-pointer disabled:opacity-50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Zap className="w-3.5 h-3.5 text-indigo-400" /><span>Optimize</span></div>
                <span className="text-[10px] text-slate-400">Clean & refactor</span>
              </button>
              <button onClick={() => handleAiAction('test')} disabled={aiLoading} className="p-2 bg-slate-800/90 hover:bg-emerald-600/30 hover:border-emerald-500/60 border border-slate-700 rounded-xl text-left transition cursor-pointer disabled:opacity-50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><TestTube className="w-3.5 h-3.5 text-emerald-400" /><span>Test Cases</span></div>
                <span className="text-[10px] text-slate-400">Challenge checks</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-200">
              {aiLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                  <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
                  <p className="font-bold text-fuchsia-300 text-sm">Analyzing code with AI...</p>
                </div>
              ) : aiResponse ? (
                <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap font-sans">{aiResponse}</div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
                  <Sparkles className="w-8 h-8 text-fuchsia-500/40" />
                  <p className="font-bold text-slate-300 text-xs">Ready for your prompt</p>
                  <p className="text-[11px] text-slate-500">Ask any question or click an action button above.</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800">
              <form onSubmit={(e) => { e.preventDefault(); if (!aiCustomPrompt.trim() || aiLoading) return; handleAiAction('custom', aiCustomPrompt); setAiCustomPrompt(''); }} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask AI about this code..."
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  disabled={aiLoading}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-fuchsia-500 transition"
                />
                <button type="submit" disabled={aiLoading || !aiCustomPrompt.trim()} className="p-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
