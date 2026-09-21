const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { GoogleGenerativeAI } = require('@google/generative-ai');


/**
 * Retrieve active course catalog formatted for AI context
 */
async function getCourseCatalogContext() {
  try {
    const courses = await Course.find({
      isPublished: true,
      approvalStatus: 'approved',
    })
      .populate('instructor', 'name headline email')
      .select('title slug description price currency category level whatYouWillLearn requirements instructor rating reviewsCount studentsCount isBestseller badge')
      .lean();

    return courses;
  } catch (err) {
    console.error('[AI Context] Error fetching courses:', err.message);
    return [];
  }
}

/**
 * Build rich system prompt with grounded course data
 */
function buildSystemPrompt(courses, currentCourse = null) {
  let catalogSummary = courses.map((c, i) => {
    return `Course ${i + 1}:
- Title: ${c.title}
- Slug: ${c.slug}
- Category: ${c.category || 'General'}
- Level: ${c.level || 'Beginner'}
- Price: ${c.price === 0 ? 'Free' : `${c.currency || 'INR'} ${c.price}`}
- Rating: ${c.rating || 4.8} (${c.reviewsCount || 0} reviews, ${c.studentsCount || 0} students)
- Instructor: ${c.instructor?.name || 'SkillPulse Expert'}
- Summary: ${c.description?.substring(0, 200) || ''}...
- What You Learn: ${(c.whatYouWillLearn || []).slice(0, 4).join(', ') || 'Practical industry skills'}
- Page Link: /courses/${c.slug}`;
  }).join('\n\n');

  let activePageNotice = '';
  if (currentCourse) {
    activePageNotice = `
CURRENTLY VIEWED COURSE:
The student is currently viewing the page for "${currentCourse.title}".
- Slug: ${currentCourse.slug}
- Price: ${currentCourse.price === 0 ? 'Free' : `${currentCourse.currency || 'INR'} ${currentCourse.price}`}
- Level: ${currentCourse.level}
- Description: ${currentCourse.description}
- Instructor: ${currentCourse.instructor?.name || 'SkillPulse Expert'}
When they ask questions like "tell me about this course", "is this for beginners?", or "what will I learn?", tailor your answer specifically to this course!
`;
  }

  return `You are PulseAI, the friendly and knowledgeable AI Learning Advisor for SkillPulse LMS.
Your mission is to guide learners, recommend the best courses tailored to their career goals, answer questions about courses, curriculum, pricing, certificates, and learning paths.

Platform Details:
- Platform Name: SkillPulse LMS
- Offers: Self-paced video courses, hands-on modules, quizzes, progress tracking, and verifiable certificates.
- Certificate: Available instantly upon completing 100% of lessons and quizzes in a course.
- Pricing & Access: One-time payment, lifetime access, secure payments via Razorpay.

Current Active Course Catalog:
${catalogSummary || 'No published courses currently available.'}

${activePageNotice}

Guidelines:
1. Always be warm, encouraging, concise, and professional.
2. Recommend specific courses from the catalog above whenever relevant. Quote the exact course title and price.
3. If recommending one or more courses, append their exact slugs at the end of your reply inside a tag like this:
   <<<RECOMMENDED_SLUGS: ["slug-1", "slug-2"]>>>
   Only use slugs that exist in the catalog above.
4. Format your output using neat Markdown (bullet points, bold highlights, concise paragraphs).
5. If the user asks something completely unrelated to education, careers, technology, or SkillPulse, gently answer and guide them back to discovering relevant courses.`;
}

/**
 * Intelligent Fallback Engine for when no API key is present or AI service fails
 */
function generateFallbackResponse(query, courses, currentCourse = null) {
  const q = (query || '').toLowerCase().trim();

  // If viewing a specific course and asking about it
  if (currentCourse && (q.includes('this course') || q.includes('about this') || q.includes('what will i learn') || q.includes('how much') || q.includes('price'))) {
    const isFree = currentCourse.price === 0;
    const priceText = isFree ? 'Free' : `${currentCourse.currency || 'INR'} ${currentCourse.price}`;
    const skills = (currentCourse.whatYouWillLearn || []).length > 0
      ? currentCourse.whatYouWillLearn.map(s => `- ${s}`).join('\n')
      : '- Comprehensive real-world practical skills\n- Hands-on exercises and quizzes';

    return {
      reply: `You're currently viewing **${currentCourse.title}**!\n\n` +
        `**Key Details:**\n` +
        `- **Price**: ${priceText}\n` +
        `- **Difficulty**: ${currentCourse.level?.toUpperCase() || 'All Levels'}\n` +
        `- **Instructor**: ${currentCourse.instructor?.name || 'SkillPulse Expert'}\n` +
        `- **Rating**: ${currentCourse.rating || 4.8} / 5.0\n\n` +
        `**What You'll Learn:**\n${skills}\n\n` +
        `You can enroll directly by clicking **Enroll Now** or **Add to Cart** on this page for instant lifetime access!`,
      recommendedSlugs: [currentCourse.slug],
      suggestedQuestions: [
        'Does this course include a certificate?',
        'What are the prerequisites?',
        'Can you recommend related courses?'
      ]
    };
  }

  // Greeting
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(q)) {
    return {
      reply: `Hello! 👋 Welcome to **SkillPulse LMS**. I'm your AI Learning Assistant.\n\n` +
        `I can help you:\n` +
        `- 🎯 Find the right course for your career goals\n` +
        `- 💰 Check course pricing and current offers\n` +
        `- 📜 Explain how certificates and quizzes work\n` +
        `- 🚀 Guide your learning roadmap\n\n` +
        `What topic or skill are you interested in learning today?`,
      recommendedSlugs: courses.slice(0, 2).map(c => c.slug),
      suggestedQuestions: [
        'What are your most popular courses?',
        'Do you have courses for beginners?',
        'Do I get a certificate after completion?'
      ]
    };
  }

  // Certificate questions
  if (q.includes('certificate') || q.includes('certification') || q.includes('credential')) {
    return {
      reply: `Yes! 🎓 **Every course on SkillPulse comes with a verifiable Certificate of Completion**.\n\n` +
        `- Once you complete 100% of the lessons and pass the included quizzes, your certificate is automatically generated.\n` +
        `- Each certificate has a **unique verifiable ID** and can be viewed, downloaded, or shared to LinkedIn and your resume.\n` +
        `- You can access all your earned certificates anytime in your **Student Dashboard**!`,
      recommendedSlugs: courses.slice(0, 2).map(c => c.slug),
      suggestedQuestions: [
        'Show all courses',
        'How do I enroll in a course?',
        'Are the courses self-paced?'
      ]
    };
  }

  // Pricing / Payment / Refund
  if (q.includes('price') || q.includes('cost') || q.includes('free') || q.includes('payment') || q.includes('pay') || q.includes('refund')) {
    const freeCourses = courses.filter(c => c.price === 0);
    const paidCourses = courses.filter(c => c.price > 0);

    let priceInfo = `SkillPulse courses are priced affordably with **lifetime access** and zero recurring subscription fees.\n\n`;
    if (freeCourses.length > 0) {
      priceInfo += `✨ We also offer **free introductory courses** like *${freeCourses[0].title}*!\n\n`;
    }
    priceInfo += `- **Payment Methods**: We accept UPI, Credit/Debit Cards, and Net Banking securely via Razorpay.\n` +
      `- **Access**: Once enrolled, the curriculum, video lessons, and updates are yours forever.`;

    return {
      reply: priceInfo,
      recommendedSlugs: courses.slice(0, 3).map(c => c.slug),
      suggestedQuestions: [
        'Show all available courses',
        'Are there any coupons?',
        'Do courses have lifetime access?'
      ]
    };
  }

  // Course Search / Recommendations matching query
  const keywords = q.replace(/[^a-zA-Z0-9 ]/g, ' ').split(' ').filter(k => k.length > 2);
  const matched = courses.filter(c => {
    const haystack = `${c.title} ${c.description} ${c.category} ${c.level} ${(c.whatYouWillLearn || []).join(' ')}`.toLowerCase();
    return keywords.some(k => haystack.includes(k));
  });

  if (matched.length > 0) {
    const topMatches = matched.slice(0, 3);
    const list = topMatches.map(c => {
      const priceStr = c.price === 0 ? 'Free' : `${c.currency || 'INR'} ${c.price}`;
      return `### [${c.title}](/courses/${c.slug})\n` +
        `- **Level**: ${c.level?.toUpperCase() || 'Beginner'} | **Price**: ${priceStr} | **Rating**: ⭐ ${c.rating || 4.8}\n` +
        `- ${c.description?.substring(0, 140)}...`;
    }).join('\n\n');

    return {
      reply: `Here are the top courses matching your interest:\n\n${list}\n\nClick any course card below to view the syllabus and begin learning!`,
      recommendedSlugs: topMatches.map(c => c.slug),
      suggestedQuestions: [
        'Which course is best for a complete beginner?',
        'What are the course prerequisites?',
        'How does course enrollment work?'
      ]
    };
  }

  // Default fallback listing available courses
  const catalogList = courses.slice(0, 3).map(c => {
    const priceStr = c.price === 0 ? 'Free' : `${c.currency || 'INR'} ${c.price}`;
    return `• **${c.title}** (${c.level}) — ${priceStr}`;
  }).join('\n');

  return {
    reply: `Here are some of our popular courses available on SkillPulse:\n\n${catalogList}\n\n` +
      `You can ask me about any topic (e.g. *Web Development, Python, UI/UX*), questions about pricing, or which course is best for your current experience level!`,
    recommendedSlugs: courses.slice(0, 3).map(c => c.slug),
    suggestedQuestions: [
      'Show beginner courses',
      'Tell me about the certificates',
      'What are the highest-rated courses?'
    ]
  };
}

/**
 * Main chat handler: Uses Gemini, OpenAI, or Fallback
 */
exports.generateChatResponse = async ({ message, history = [], currentPath = '', courseSlug = null }) => {
  const allCourses = await getCourseCatalogContext();
  let currentCourse = null;

  if (courseSlug) {
    currentCourse = allCourses.find(c => c.slug === courseSlug) || null;
    if (!currentCourse) {
      try {
        currentCourse = await Course.findOne({ slug: courseSlug })
          .populate('instructor', 'name headline')
          .lean();
      } catch (_) {}
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let replyText = '';
  let recommendedSlugs = [];

  // 1. Try Google Gemini
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(allCourses, currentCourse),
      });

      // Format history for Gemini SDK
      const contents = [];      
      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => {
          if (h.role && h.content) {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }],
            });
          }
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      replyText = response.text();
    } catch (err) {
      console.warn('[AI Service] Gemini call failed, trying next provider or fallback:', err.message);
    }
  }

  // 2. Try OpenAI if Gemini was not available or failed
  if (!replyText && openaiKey) {
    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt(allCourses, currentCourse) },
      ];

      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => {
          if (h.role && h.content) {
            messages.push({
              role: h.role === 'user' ? 'user' : 'assistant',
              content: h.content,
            });
          }
        });
      }
      messages.push({ role: 'user', content: message });

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          temperature: 0.7,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        replyText = data.choices?.[0]?.message?.content || '';
      } else {
        const errText = await resp.text();
        console.warn('[AI Service] OpenAI error:', errText);
      }
    } catch (err) {
      console.warn('[AI Service] OpenAI call error:', err.message);
    }
  }

  // 3. If LLM replied, parse recommended slugs
  if (replyText) {
    const slugMatch = replyText.match(/<<<RECOMMENDED_SLUGS:\s*(\[[^\]]+\])>>>/i);
    if (slugMatch) {
      try {
        const parsed = JSON.parse(slugMatch[1]);
        if (Array.isArray(parsed)) {
          recommendedSlugs = parsed;
        }
      } catch (_) {}
      replyText = replyText.replace(/<<<RECOMMENDED_SLUGS:[^>]+>>>/gi, '').trim();
    }

    // Auto-detect course slugs mentioned in the text if not captured
    allCourses.forEach(c => {
      if (!recommendedSlugs.includes(c.slug) && (
        replyText.toLowerCase().includes(c.title.toLowerCase()) ||
        replyText.toLowerCase().includes(`/courses/${c.slug}`.toLowerCase())
      )) {
        recommendedSlugs.push(c.slug);
      }
    });

    // Populate matched courses object
    const matchedCourses = allCourses
      .filter(c => recommendedSlugs.includes(c.slug))
      .slice(0, 4)
      .map(c => ({
        _id: c._id,
        title: c.title,
        slug: c.slug,
        price: c.price,
        currency: c.currency || 'INR',
        thumbnail: c.thumbnail,
        level: c.level,
        category: c.category,
        rating: c.rating || 4.8,
        reviewsCount: c.reviewsCount || 0,
        instructorName: c.instructor?.name || 'SkillPulse Expert',
      }));

    return {
      reply: replyText,
      matchedCourses,
      provider: geminiKey ? 'gemini' : 'openai',
      suggestedQuestions: [
        'Tell me more about the curriculum',
        'Are there any prerequisites?',
        'How do I receive my certificate?'
      ],
    };
  }

  // 4. Robust smart catalog fallback
  const fallback = generateFallbackResponse(message, allCourses, currentCourse);
  const matchedCourses = allCourses
    .filter(c => fallback.recommendedSlugs?.includes(c.slug))
    .slice(0, 4)
    .map(c => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      price: c.price,
      currency: c.currency || 'INR',
      thumbnail: c.thumbnail,
      level: c.level,
      category: c.category,
      rating: c.rating || 4.8,
      reviewsCount: c.reviewsCount || 0,
      instructorName: c.instructor?.name || 'SkillPulse Expert',
    }));

  return {
    reply: fallback.reply,
    matchedCourses,
    provider: 'smart-catalog-engine',
    suggestedQuestions: fallback.suggestedQuestions,
  };
};

/**
 * Initial dynamic prompt suggestions based on page context
 */
exports.getInitialSuggestions = async (courseSlug = null) => {
  if (courseSlug) {
    const course = await Course.findOne({ slug: courseSlug }).select('title level price').lean();
    if (course) {
      return [
        `What will I learn in "${course.title}"?`,
        `Is this suitable for a ${course.level} student?`,
        `Does this course include a certificate?`,
        `Are there practical projects in this course?`
      ];
    }
  }

  return [
    'What courses are available for beginners?',
    'Show me the highest-rated courses',
    'Do you offer verified completion certificates?',
    'How does lifetime course access work?'
  ];
};

/**
 * AI Code Assistant for Interactive Sandbox
 */
exports.assistCode = async ({ code, language, action, prompt = '' }) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let taskPrompt = '';
  switch (action) {
    case 'explain':
      taskPrompt = `You are an expert coding mentor at SkillPulse LMS. Explain the following ${language} code step-by-step in clear, easy-to-understand terms. Break down how it works, explain any key algorithms or data structures, and highlight best practices:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      break;
    case 'fix':
      taskPrompt = `You are an expert debugging engineer at SkillPulse LMS. Analyze the following ${language} code for syntax errors, logical bugs, edge cases, and runtime pitfalls. Point out exactly what is wrong, why it causes an issue, and provide the complete corrected code with explanations:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      break;
    case 'optimize':
      taskPrompt = `You are a performance optimization expert at SkillPulse LMS. Review the following ${language} code and refactor it for better performance (time/space complexity), modern syntax, clean code patterns, and readability. Explain the optimizations made and provide the refactored code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      break;
    case 'test':
      taskPrompt = `You are a software testing engineer at SkillPulse LMS. Write 3-5 unit tests or test challenge cases for the following ${language} code. Include edge cases (empty inputs, boundaries, invalid types) and show the expected output:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      break;
    default:
      taskPrompt = `You are an expert ${language} coding mentor at SkillPulse LMS. Answer the student's question regarding this code.\nStudent Question: ${prompt}\n\n\`\`\`${language}\n${code}\n\`\`\``;
  }

  let replyText = '';

  // 1. Try Google Gemini
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const result = await model.generateContent(taskPrompt);
      const response = await result.response;
      replyText = response.text();
    } catch (err) {
      console.warn('[AI Code Assist] Gemini error:', err.message);
    }
  }

  // 2. Try OpenAI
  if (!replyText && openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: taskPrompt }],
          temperature: 0.5,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        replyText = data.choices?.[0]?.message?.content || '';
      }
    } catch (err) {
      console.warn('[AI Code Assist] OpenAI error:', err.message);
    }
  }

  // 3. Fallback engine
  if (!replyText) {
    if (action === 'explain') {
      replyText = `### 💡 Code Explanation (${language.toUpperCase()})\n\n` +
        `**Overview:**\nThis ${language} snippet contains ${code.split('\n').length} lines of code.\n\n` +
        `**Key Observations:**\n` +
        `- **Language:** ${language}\n` +
        `- **Structure:** Defines functions, logic, and operational statements for execution.\n` +
        `- **Execution Flow:** Runs sequentially in the browser runtime environment.\n\n` +
        `*Tip: Run the code using the Run button (Ctrl+Enter) to observe output in the integrated console!*`;
    } else if (action === 'fix') {
      replyText = `### 🛠️ Debugging Analysis (${language.toUpperCase()})\n\n` +
        `**Review Checkpoints:**\n` +
        `1. Check variable declarations and scope (ensure variables are properly initialized before use).\n` +
        `2. Verify syntax: check matching brackets \`{}\`, \`()\`, \`[]\` and quotes.\n` +
        `3. If using asynchronous operations, ensure Promises or \`async/await\` are properly handled.\n\n` +
        `*Run your code to inspect any live runtime errors and stack traces in the Console below.*`;
    } else if (action === 'optimize') {
      replyText = `### 🚀 Optimization Recommendations (${language.toUpperCase()})\n\n` +
        `- **Readability:** Use descriptive variable names and modular helper functions.\n` +
        `- **Performance:** Avoid redundant iterations and prefer built-in functional methods.\n` +
        `- **Modern Syntax:** Prefer modern language features (ES6+ arrow functions, destructuring, list comprehensions in Python).`;
    } else {
      replyText = `### 🧪 Test Cases & Verification (${language.toUpperCase()})\n\n` +
        `- **Test 1 (Standard input):** Verify expected output for typical arguments.\n` +
        `- **Test 2 (Boundary):** Test with zero, null, or empty data structures.\n` +
        `- **Test 3 (Stress):** Test with multiple large dataset items.`;
    }
  }

  return {
    success: true,
    reply: replyText,
    action,
    language,
  };
};

/**
 * Inline AI Code Autocomplete & Next Token Predictor
 */
exports.autocompleteCode = async ({ prefix = '', suffix = '', language = 'javascript' }) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `You are a high-speed inline code autocomplete engine for ${language}.
Given the code preceding the cursor and following the cursor, generate ONLY the immediate completion (1 to 4 lines).
DO NOT wrap in markdown backticks. DO NOT output explanations. ONLY OUTPUT THE RAW CODE TO INSERT.

<CODE_BEFORE_CURSOR>
${prefix.slice(-1500)}
</CODE_BEFORE_CURSOR>

<CODE_AFTER_CURSOR>
${suffix.slice(0, 500)}
</CODE_AFTER_CURSOR>

Completion:`;

  let completion = '';

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      completion = response.text().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
    } catch (err) {
      console.warn('[AI Autocomplete] Gemini error:', err.message);
    }
  }

  if (!completion && openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 150,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        completion = data.choices?.[0]?.message?.content || '';
        completion = completion.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      }
    } catch (err) {
      console.warn('[AI Autocomplete] OpenAI error:', err.message);
    }
  }

  // Fallback intelligent completion
  if (!completion) {
    const lastLine = prefix.trim().split('\n').pop() || '';
    if (lastLine.endsWith('function') || lastLine.includes('function ')) {
      completion = ' main() {\n  return true;\n}';
    } else if (lastLine.includes('console.')) {
      completion = 'log("Debug point:", data);';
    } else if (lastLine.includes('for (')) {
      completion = 'let i = 0; i < items.length; i++) {\n  \n}';
    } else if (lastLine.includes('def ')) {
      completion = 'process_data(params):\n    return params';
    } else if (lastLine.toUpperCase().includes('SELECT ')) {
      completion = '* FROM courses WHERE rating >= 4.5 ORDER BY price DESC;';
    } else {
      completion = '// Auto-completed snippet\n';
    }
  }

  return {
    success: true,
    completion: completion.trimStart(),
  };
};

/**
 * Format raw seconds into standard MM:SS string
 */
function formatSeconds(secs) {
  const s = Math.floor(secs || 0);
  const m = Math.floor(s / 60);
  const remS = s % 60;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) {
    return `${h}:${remM < 10 ? '0' : ''}${remM}:${remS < 10 ? '0' : ''}${remS}`;
  }
  return `${remM < 10 ? '0' : ''}${remM}:${remS < 10 ? '0' : ''}${remS}`;
}

/**
 * Helper to build intelligent, topic-aligned transcript checkpoints for any video lecture
 */
function buildSyntheticTranscript(title = 'Introduction to Course Concept', durationMins = 10) {
  const totalSeconds = Math.max(120, (durationMins || 10) * 60);
  const step = Math.floor(totalSeconds / 6);

  const cleanTitle = title || 'Lecture Overview';

  return [
    {
      seconds: 0,
      timestamp: '00:00',
      title: 'Introduction & Agenda',
      text: `Welcome to this lecture on "${cleanTitle}". In this session, we will explore the foundational principles, real-world motivation, and project architecture.`,
      speaker: 'Instructor'
    },
    {
      seconds: Math.min(step, 45),
      timestamp: formatSeconds(Math.min(step, 45)),
      title: 'Core Concept Explanation',
      text: `Let's break down the core mechanics of ${cleanTitle}. We'll examine how data flows through the system, configuration variables, and why this design pattern is preferred in production.`,
      speaker: 'Instructor'
    },
    {
      seconds: step * 2,
      timestamp: formatSeconds(step * 2),
      title: 'Hands-on Implementation & Code Demo',
      text: `Now let's switch to the code editor. Watch closely as we write the primary implementation for ${cleanTitle}, set up error handlers, and connect API routes.`,
      speaker: 'Instructor'
    },
    {
      seconds: step * 3,
      timestamp: formatSeconds(step * 3),
      title: 'Debugging Common Pitfalls & Edge Cases',
      text: `A very common issue students encounter with ${cleanTitle} is improper state synchronization and token lifecycle validation. Here is how you identify and fix that bug.`,
      speaker: 'Instructor'
    },
    {
      seconds: step * 4,
      timestamp: formatSeconds(step * 4),
      title: 'Performance & Best Practices',
      text: `Let's review optimization strategies. We will refactor this section to reduce database queries and ensure security standards are strictly enforced.`,
      speaker: 'Instructor'
    },
    {
      seconds: Math.max(step * 5, totalSeconds - 30),
      timestamp: formatSeconds(Math.max(step * 5, totalSeconds - 30)),
      title: 'Summary & Next Steps',
      text: `To summarize what we learned in "${cleanTitle}": always sanitize inputs, handle edge cases, and test your endpoints. In the next video, we build upon this foundation.`,
      speaker: 'Instructor'
    }
  ];
}

/**
 * Retrieve or generate time-stamped transcript for a lesson
 */
exports.getLessonTranscript = async ({ lessonId, lessonTitle = '', duration = 10 }) => {
  try {
    if (lessonId && lessonId.length === 24) {
      const lesson = await Lesson.findById(lessonId).select('title transcript duration').lean();
      if (lesson && Array.isArray(lesson.transcript) && lesson.transcript.length > 0) {
        return lesson.transcript;
      }
      if (lesson) {
        return buildSyntheticTranscript(lesson.title || lessonTitle, lesson.duration || duration);
      }
    }
    return buildSyntheticTranscript(lessonTitle, duration);
  } catch (err) {
    console.warn('[AI Service] Get transcript error:', err.message);
    return buildSyntheticTranscript(lessonTitle, duration);
  }
};

/**
 * "Ask the Video" Semantic Search & Timestamp Identification
 */
exports.searchVideoTranscript = async ({ query, lessonId, lessonTitle = '', courseTitle = '', duration = 10 }) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Get lesson transcript
  const transcript = await exports.getLessonTranscript({ lessonId, lessonTitle, duration });

  // Format transcript segments for prompt context
  const transcriptContext = transcript.map((seg, idx) => {
    return `[${idx + 1}] Timestamp: ${seg.timestamp} (${seg.seconds}s) | Topic: "${seg.title}"\nContent: "${seg.text}"`;
  }).join('\n\n');

  const prompt = `You are the AI Video Navigator for SkillPulse LMS.
A student is watching a video lecture titled "${lessonTitle}" in the course "${courseTitle || 'Development Masterclass'}".
Total video duration: ~${duration || 10} minutes.

Here is the exact time-coded transcript of this video lecture:
=========================================
${transcriptContext}
=========================================

Student's Question: "${query}"

Your Mission:
1. Identify the EXACT timestamp (in seconds and MM:SS format) where the instructor addresses the student's question.
2. Give a direct, helpful, concise answer (2-3 sentences).
3. Identify 1 to 2 other related key moments in this video.

Respond ONLY with a valid JSON object matching this schema without markdown codeblocks:
{
  "directAnswer": "Direct concise explanation answering their question...",
  "primaryTimestamp": {
    "seconds": 120,
    "formattedTime": "02:00",
    "topic": "Core Implementation",
    "snippet": "Instructor explains..."
  },
  "relatedMoments": [
    {
      "seconds": 45,
      "formattedTime": "00:45",
      "topic": "Architecture Overview",
      "snippet": "Why this approach is used..."
    }
  ],
  "summary": "Key summary takeaway"
}`;

  let parsedResult = null;

  // 1. Try Gemini
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const rawText = (await result.response).text().trim();
      const cleanJson = rawText.replace(/^```json\n?/i, '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('[Ask Video] Gemini parsing error:', err.message);
    }
  }

  // 2. Try OpenAI
  if (!parsedResult && openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const rawContent = data.choices?.[0]?.message?.content || '';
        const cleanJson = rawContent.replace(/^```json\n?/i, '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        parsedResult = JSON.parse(cleanJson);
      }
    } catch (err) {
      console.warn('[Ask Video] OpenAI parsing error:', err.message);
    }
  }

  // 3. Fallback Smart Semantic Transcript Matching Engine
  if (!parsedResult) {
    const qLower = (query || '').toLowerCase();
    const words = qLower.split(/\s+/).filter(w => w.length > 2);

    let bestSegment = transcript[1] || transcript[0];
    let highestScore = 0;

    transcript.forEach(seg => {
      let score = 0;
      const combined = `${seg.title} ${seg.text}`.toLowerCase();
      words.forEach(w => {
        if (combined.includes(w)) score += 1;
      });
      if (score > highestScore) {
        highestScore = score;
        bestSegment = seg;
      }
    });

    const otherMoments = transcript
      .filter(seg => seg.seconds !== bestSegment.seconds)
      .slice(0, 2)
      .map(seg => ({
        seconds: seg.seconds,
        formattedTime: seg.timestamp,
        topic: seg.title,
        snippet: seg.text.substring(0, 90) + '...',
      }));

    parsedResult = {
      directAnswer: `In "${lessonTitle}", the instructor covers this in the "${bestSegment.title}" segment. Here, the concepts, syntax, and execution flow are explained step-by-step.`,
      primaryTimestamp: {
        seconds: bestSegment.seconds,
        formattedTime: bestSegment.timestamp,
        topic: bestSegment.title,
        snippet: bestSegment.text.substring(0, 120) + '...',
      },
      relatedMoments: otherMoments,
      summary: `Jump directly to ${bestSegment.timestamp} to watch the instructor demonstrate this topic.`,
    };
  }

  return {
    success: true,
    query,
    lessonTitle,
    transcript,
    ...parsedResult,
  };
};



