require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const StudyRoom = require('./models/StudyRoom');

async function seedStudyRooms() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lms_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for study room seeding...');

    // Find an instructor or user to be host
    let host = await User.findOne({ role: 'instructor' });
    if (!host) {
      host = await User.findOne({});
    }

    if (!host) {
      console.log('No user found in database to host rooms. Please register or seed users first.');
      process.exit(0);
    }

    const courses = await Course.find({}).limit(5);

    // Remove existing seed rooms to keep clean
    await StudyRoom.deleteMany({ title: { $in: [
      '🔥 Full-Stack React & Next.js Night Sprint',
      '🐍 Python Data Structures & LeetCode Sprint',
      '🎧 50m Deep Silent Pomodoro Focus Hub',
      '🎬 System Architecture & Cloud Microservices Co-Watch'
    ] } });

    const sampleRooms = [
      {
        title: '🔥 Full-Stack React & Next.js Night Sprint',
        topic: 'Mastering Server Components, App Router & SSR',
        description: 'Collaborative coding room for full-stack students. Let us tackle server actions, auth middleware, and state caching together!',
        course: courses[0] ? courses[0]._id : null,
        courseTitle: courses[0] ? courses[0].title : 'Full-Stack Web Development',
        host: host._id,
        hostName: host.name,
        roomCode: 'REACT9',
        isPrivate: false,
        maxParticipants: 16,
        mode: 'pair_programming',
        tags: ['React', 'NextJS', 'WebDev', 'FullStack'],
        activeMembers: [
          {
            user: host._id,
            name: host.name,
            avatar: host.avatar,
            currentGoal: 'Refactoring async state logic',
            joinedAt: new Date()
          },
          {
            name: 'Liam Vance',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            currentGoal: 'Building responsive dashboard layouts',
            joinedAt: new Date(Date.now() - 15 * 60000)
          },
          {
            name: 'Elena Rostova',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
            currentGoal: 'Debugging Tailwind responsive breakpoints',
            joinedAt: new Date(Date.now() - 30 * 60000)
          }
        ],
        sharedResource: {
          activeTab: 'code',
          scratchpadCode: `// 🔥 React State & Memoization Exercise
function useCounter(initialVal = 0) {
  let count = initialVal;
  const increment = () => ++count;
  const decrement = () => --count;
  return { count, increment, decrement };
}

const c = useCounter(10);
console.log("Initial count:", c.count);
console.log("After increment:", c.increment());
console.log("After increment 2:", c.increment());
`,
          scratchpadLanguage: 'javascript',
          notes: '## 📌 React Sprint Notes\n- Always memoize expensive calculations with useMemo\n- Ensure keys in list renders are stable IDs, not random UUIDs'
        },
        timerState: {
          mode: 'focus',
          duration: 1500,
          remaining: 1140,
          isRunning: true
        },
        messages: [
          {
            sender: { _id: host._id, name: 'System', role: 'system' },
            text: '🚀 Welcome to Full-Stack React & Next.js Night Sprint! Jump in and run code collaboratively.',
            type: 'system',
            createdAt: new Date(Date.now() - 40 * 60000)
          },
          {
            sender: { _id: host._id, name: host.name, role: 'instructor' },
            text: 'Hey everyone! Feel free to run the code in the scratchpad or ask any questions about server actions.',
            type: 'chat',
            createdAt: new Date(Date.now() - 25 * 60000)
          },
          {
            sender: { name: 'Liam Vance', role: 'student' },
            text: 'Love this scratchpad! Testing out custom hooks now.',
            type: 'chat',
            createdAt: new Date(Date.now() - 10 * 60000)
          }
        ]
      },
      {
        title: '🐍 Python Data Structures & LeetCode Sprint',
        topic: 'Binary Trees, Dynamic Programming & Graph Traversal',
        description: 'Cracking coding interview problems together. We solve 3 problems per session and explain our approaches.',
        course: courses[1] ? courses[1]._id : null,
        courseTitle: courses[1] ? courses[1].title : 'Python Masterclass',
        host: host._id,
        hostName: host.name,
        roomCode: 'PYTREE',
        isPrivate: false,
        maxParticipants: 12,
        mode: 'open_discussion',
        tags: ['Python', 'LeetCode', 'Algorithms', 'DSA'],
        activeMembers: [
          {
            user: host._id,
            name: host.name,
            avatar: host.avatar,
            currentGoal: 'Solving Invert Binary Tree & DFS',
            joinedAt: new Date()
          },
          {
            name: 'Aarav Patel',
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
            currentGoal: 'Practicing recursion on tree nodes',
            joinedAt: new Date(Date.now() - 20 * 60000)
          }
        ],
        sharedResource: {
          activeTab: 'code',
          scratchpadCode: `// 🌲 Binary Tree Node Definition & In-order Traversal
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function inorderTraversal(root) {
  const res = [];
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    res.push(node.val);
    traverse(node.right);
  }
  traverse(root);
  return res;
}

const root = new TreeNode(4, new TreeNode(2, new TreeNode(1), new TreeNode(3)), new TreeNode(7));
console.log("Traversed Array:", inorderTraversal(root));
`,
          scratchpadLanguage: 'javascript'
        },
        timerState: {
          mode: 'focus',
          duration: 1500,
          remaining: 900,
          isRunning: true
        }
      },
      {
        title: '🎧 50m Deep Silent Pomodoro Focus Hub',
        topic: 'Zero Distraction Solo/Group Study with Ambient Sounds',
        description: 'Quiet study room. Mic muted by default, ambient rain or lo-fi audio on, 50m focus + 10m break.',
        host: host._id,
        hostName: host.name,
        roomCode: 'FOCUS1',
        isPrivate: false,
        maxParticipants: 30,
        mode: 'deep_focus',
        tags: ['Pomodoro', 'SilentFocus', 'Productivity'],
        activeMembers: [
          {
            user: host._id,
            name: host.name,
            avatar: host.avatar,
            currentGoal: 'Reading Chapter 5 on Distributed Systems',
            joinedAt: new Date()
          },
          {
            name: 'Sophia Williams',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
            currentGoal: 'Completing final milestone project review',
            joinedAt: new Date(Date.now() - 45 * 60000)
          },
          {
            name: 'Carlos Mendez',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
            currentGoal: 'Studying for SQL database certification',
            joinedAt: new Date(Date.now() - 12 * 60000)
          }
        ],
        timerState: {
          mode: 'focus',
          duration: 3000,
          remaining: 2400,
          isRunning: true
        }
      }
    ];

    for (const roomData of sampleRooms) {
      const created = await StudyRoom.create(roomData);
      console.log(`✅ Created Study Room: "${created.title}" (Code: ${created.roomCode})`);
    }

    console.log('🎉 Seeded study rooms successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding study rooms:', err);
    process.exit(1);
  }
}

seedStudyRooms();
