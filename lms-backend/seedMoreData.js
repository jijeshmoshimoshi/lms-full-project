require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Module = require('./models/Module');
const Lesson = require('./models/Lesson');
const Enrollment = require('./models/Enrollment');

const sampleVideoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
];

const instructorsData = [
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@skillpulse.edu',
    password: 'Password@123',
    role: 'instructor',
    headline: 'Senior AI Research Scientist & ML Engineer',
    bio: 'Ex-Google AI researcher with 10+ years of experience in deep learning, computer vision, and neural network architecture.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
    payoutStatus: 'active',
    razorpayAccountId: 'acc_priya_sharma_01',
    payoutSchedule: 'monthly',
  },
  {
    name: 'Alex Chen',
    email: 'alex.chen@skillpulse.edu',
    password: 'Password@123',
    role: 'instructor',
    headline: 'Principal Cloud Architect & DevOps Consultant',
    bio: 'AWS & Kubernetes certified architect who has built and automated infrastructure handling billions of cloud requests.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
    payoutStatus: 'active',
    razorpayAccountId: 'acc_alex_chen_02',
    payoutSchedule: 'weekly',
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@skillpulse.edu',
    password: 'Password@123',
    role: 'instructor',
    headline: 'Lead UI/UX Designer & Design Systems Lead',
    bio: 'Award-winning product designer formerly at Airbnb. Dedicated to building world-class digital experiences and scalable design systems.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
    payoutStatus: 'active',
    razorpayAccountId: 'acc_sarah_jenkins_03',
    payoutSchedule: 'monthly',
  },
  {
    name: 'Rajesh Nair',
    email: 'rajesh.nair@skillpulse.edu',
    password: 'Password@123',
    role: 'instructor',
    headline: 'Staff Security Specialist & Ethical Hacker',
    bio: 'Certified ethical hacker (CEH & CISSP) with 12+ years conducting penetration testing and hardening enterprise architectures.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
    payoutStatus: 'active',
    razorpayAccountId: 'acc_rajesh_nair_04',
    payoutSchedule: 'monthly',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@skillpulse.edu',
    password: 'Password@123',
    role: 'instructor',
    headline: 'Senior Mobile Engineer (Flutter & React Native)',
    bio: 'Mobile systems engineer with 20+ shipped apps across the App Store and Google Play with over 5 million downloads.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
    payoutStatus: 'active',
    razorpayAccountId: 'acc_elena_rostova_05',
    payoutSchedule: 'weekly',
  },
];

const studentsData = [
  {
    name: 'Ananya Gupta',
    email: 'ananya.gupta@skillpulse.edu',
    password: 'Password@123',
    role: 'student',
    headline: 'Aspiring Fullstack Developer',
    bio: 'Learning full-stack web development and excited to build modern SaaS web apps.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@skillpulse.edu',
    password: 'Password@123',
    role: 'student',
    headline: 'Computer Science Undergraduate',
    bio: 'Final year CS student focusing on cloud infrastructure, microservices, and Docker.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@skillpulse.edu',
    password: 'Password@123',
    role: 'student',
    headline: 'Junior Frontend Engineer',
    bio: 'Working with React & Next.js, leveling up my design system and UI engineering skills.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@skillpulse.edu',
    password: 'Password@123',
    role: 'student',
    headline: 'Data Analyst & ML Enthusiast',
    bio: 'Transforming raw business data into actionable ML models and predictive dashboards.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  },
  {
    name: 'Sophia Martinez',
    email: 'sophia.martinez@skillpulse.edu',
    password: 'Password@123',
    role: 'student',
    headline: 'Product Designer & Creative Thinker',
    bio: 'Passionate about human-centered design, prototyping, and user journey mapping.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  },
];

const coursesDef = [
  // 1 & 2 for Dr. Priya Sharma
  {
    instructorEmail: 'priya.sharma@skillpulse.edu',
    title: 'Applied Deep Learning with PyTorch',
    slugBase: 'applied-deep-learning-pytorch',
    subtitle: 'Build, train, and deploy production-ready neural networks and transformer models',
    description: 'Master deep learning fundamentals, computer vision with CNNs, natural language processing with Transformers, and production deployment using PyTorch and TorchScript.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80',
    category: 'Artificial Intelligence',
    level: 'intermediate',
    price: 799,
    originalPrice: 2499,
    isOfferActive: true,
    offerBadgeText: 'Trending',
    rating: 4.9,
    reviewsCount: 18,
    studentsCount: 142,
    whatYouWillLearn: [
      'Build Convolutional Neural Networks for vision tasks',
      'Implement attention mechanisms and fine-tune Transformers',
      'Train, optimize, and debug deep neural networks in PyTorch',
      'Deploy models as high-performance REST APIs with FastAPI and Docker'
    ],
    requirements: [
      'Basic Python programming experience',
      'Foundational understanding of linear algebra and calculus'
    ],
    whoThisCourseIsFor: [
      'Python developers entering the field of AI/ML',
      'Data analysts looking to transition to Deep Learning engineering'
    ],
    modules: [
      {
        title: 'Module 1: Tensors, Autograd & Core Architecture',
        lessons: [
          { title: 'PyTorch Tensors, GPU Acceleration & Autograd', duration: 15, isFreePreview: true, contentType: 'video' },
          { title: 'Constructing Custom Datasets & DataLoaders', duration: 18, isFreePreview: false, contentType: 'video' },
          { title: 'Training Loops, Loss Functions & Backpropagation Guide', duration: 10, isFreePreview: false, contentType: 'document' },
        ],
      },
      {
        title: 'Module 2: Vision & Modern Transformers',
        lessons: [
          { title: 'Convolutional Networks for Image Classification', duration: 22, isFreePreview: false, contentType: 'video' },
          { title: 'Fine-Tuning Pre-trained HuggingFace Transformers', duration: 25, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },
  {
    instructorEmail: 'priya.sharma@skillpulse.edu',
    title: 'Generative AI & LLM Application Engineering',
    slugBase: 'generative-ai-llm-application-engineering',
    subtitle: 'Build real-world LLM apps with LangChain, LlamaIndex, RAG, and Vector Databases',
    description: 'A practical, engineering-first guide to building enterprise-ready GenAI systems. Learn Retrieval-Augmented Generation (RAG), embeddings, fine-tuning, and multi-agent systems.',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    category: 'Artificial Intelligence',
    level: 'advanced',
    price: 999,
    originalPrice: 3499,
    isOfferActive: true,
    offerBadgeText: 'Hot Deal',
    rating: 4.8,
    reviewsCount: 24,
    studentsCount: 189,
    whatYouWillLearn: [
      'Architect production RAG pipelines with Pinecone and ChromaDB',
      'Implement multi-agent workflows using LangGraph and AutoGen',
      'Optimize prompt engineering, token economy, and semantic caching',
      'Evaluate LLM outputs and secure applications against prompt injection'
    ],
    requirements: [
      'Solid Python knowledge',
      'Basic familiarity with OpenAI APIs or HuggingFace models'
    ],
    whoThisCourseIsFor: [
      'Software engineers wanting to build real Generative AI products',
      'Founders and technical leads building AI wrappers and enterprise assistants'
    ],
    modules: [
      {
        title: 'Module 1: Foundations of LLMs & Vector Search',
        lessons: [
          { title: 'Architecting Modern LLM Applications', duration: 14, isFreePreview: true, contentType: 'video' },
          { title: 'Embeddings, Chunking Strategies & Vector Stores', duration: 20, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Advanced RAG & Multi-Agent Workflows',
        lessons: [
          { title: 'Building Hybrid Search & Re-ranking Pipelines', duration: 28, isFreePreview: false, contentType: 'video' },
          { title: 'LangGraph State Machines for Multi-Agent Collaboration', duration: 32, isFreePreview: false, contentType: 'video' },
          { title: 'Production Security & Prompt Injection Mitigation', duration: 15, isFreePreview: false, contentType: 'document' },
        ],
      },
    ],
  },

  // 3 & 4 for Alex Chen
  {
    instructorEmail: 'alex.chen@skillpulse.edu',
    title: 'AWS Certified Solutions Architect & Cloud Engineering',
    slugBase: 'aws-certified-solutions-architect',
    subtitle: 'From zero to AWS certified architect with practical labs and architecture blueprints',
    description: 'Comprehensive preparation for the AWS Solutions Architect Associate exam alongside real-world architectural design, VPC networking, IAM security, and auto-scaling microservices.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    category: 'Cloud Computing',
    level: 'beginner',
    price: 699,
    originalPrice: 2199,
    isOfferActive: true,
    offerBadgeText: 'Bestseller',
    rating: 4.9,
    reviewsCount: 31,
    studentsCount: 260,
    whatYouWillLearn: [
      'Design highly available, fault-tolerant architectures on AWS',
      'Configure VPCs, Subnets, Route Tables, NAT Gateways, and Security Groups',
      'Deploy resilient compute with EC2, ECS, and AWS Lambda',
      'Architect relational and NoSQL storage with RDS Aurora and DynamoDB'
    ],
    requirements: [
      'Basic knowledge of operating systems and networking concepts'
    ],
    whoThisCourseIsFor: [
      'DevOps engineers, sysadmins, and software engineers targeting AWS certification'
    ],
    modules: [
      {
        title: 'Module 1: Core Networking & Compute',
        lessons: [
          { title: 'AWS Global Infrastructure & High Availability Design', duration: 16, isFreePreview: true, contentType: 'video' },
          { title: 'Mastering VPC, Subnetting & Bastion Hosts', duration: 24, isFreePreview: false, contentType: 'video' },
          { title: 'EC2 Auto-Scaling Groups & Application Load Balancers', duration: 19, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Cloud Storage & Database Architecture',
        lessons: [
          { title: 'S3 Lifecycle Rules, Replication & Bucket Policies', duration: 15, isFreePreview: false, contentType: 'video' },
          { title: 'Aurora Serverless vs DynamoDB Performance Optimization', duration: 22, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },
  {
    instructorEmail: 'alex.chen@skillpulse.edu',
    title: 'Docker & Kubernetes: Production Microservices Mastery',
    slugBase: 'docker-kubernetes-production-mastery',
    subtitle: 'Containerize, orchestrate, and automate container workloads at enterprise scale',
    description: 'Learn containerization from low-level cgroups and namespaces to multi-stage Docker builds, Kubernetes manifests, Helm charts, ingress controllers, and GitOps deployments with ArgoCD.',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80',
    category: 'DevOps',
    level: 'intermediate',
    price: 849,
    originalPrice: 2899,
    isOfferActive: true,
    offerBadgeText: '50% OFF',
    rating: 4.8,
    reviewsCount: 15,
    studentsCount: 112,
    whatYouWillLearn: [
      'Build ultra-slim, secure container images using multi-stage builds',
      'Deploy and scale resilient pods, services, and stateful sets',
      'Package microservices with Helm 3 templates',
      'Implement zero-downtime rolling updates and automated rollbacks'
    ],
    requirements: [
      'Familiarity with Linux command line and modern web apps'
    ],
    whoThisCourseIsFor: [
      'Backend developers and DevOps engineers transitioning to containerized workloads'
    ],
    modules: [
      {
        title: 'Module 1: Docker Deep-Dive & Image Optimization',
        lessons: [
          { title: 'Linux Containers Under the Hood: Namespaces & CGroups', duration: 18, isFreePreview: true, contentType: 'video' },
          { title: 'Multi-Stage Builds & Distroless Base Images', duration: 20, isFreePreview: false, contentType: 'video' },
          { title: 'Docker Compose for Local Microservices Orchestration', duration: 14, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Kubernetes Orchestration & Helm',
        lessons: [
          { title: 'Pods, Deployments, ReplicaSets & Cluster Architecture', duration: 26, isFreePreview: false, contentType: 'video' },
          { title: 'Ingress Nginx, TLS Automation & Cert-Manager', duration: 22, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },

  // 5 & 6 for Sarah Jenkins
  {
    instructorEmail: 'sarah.jenkins@skillpulse.edu',
    title: 'Modern UI/UX Design Masterclass with Figma',
    slugBase: 'modern-ui-ux-design-figma',
    subtitle: 'From user research and wireframing to pixel-perfect interactive prototypes',
    description: 'Transform ideas into visually stunning, high-converting digital products. Master Figma Auto-Layout 5.0, variables, design tokens, micro-interactions, and professional UX research methods.',
    thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    category: 'UI/UX Design',
    level: 'beginner',
    price: 599,
    originalPrice: 1999,
    isOfferActive: true,
    offerBadgeText: 'Popular',
    rating: 4.9,
    reviewsCount: 42,
    studentsCount: 310,
    whatYouWillLearn: [
      'Master advanced Figma features: Auto-Layout, Components, and Variants',
      'Conduct user interviews, persona mapping, and usability testing',
      'Design accessible, high-contrast typography and color schemes',
      'Build interactive, clickable high-fidelity prototypes for stakeholder presentations'
    ],
    requirements: [
      'A computer with access to Figma (free tier is sufficient)'
    ],
    whoThisCourseIsFor: [
      'Beginners wanting to launch a high-paying UI/UX design career',
      'Frontend developers wanting to sharpen visual design intuition'
    ],
    modules: [
      {
        title: 'Module 1: UX Foundations & User Journey Mapping',
        lessons: [
          { title: 'The UX Double Diamond Framework Explained', duration: 12, isFreePreview: true, contentType: 'video' },
          { title: 'Creating High-Converting Wireframes & User Flows', duration: 18, isFreePreview: false, contentType: 'video' },
          { title: 'Usability Testing Kit & Template Cheatsheet', duration: 8, isFreePreview: false, contentType: 'document' },
        ],
      },
      {
        title: 'Module 2: Figma Power User & High-Fidelity UI',
        lessons: [
          { title: 'Mastering Auto-Layout & Responsive Fluid Layouts', duration: 25, isFreePreview: false, contentType: 'video' },
          { title: 'Building Interactive Component Variants & Micro-interactions', duration: 20, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },
  {
    instructorEmail: 'sarah.jenkins@skillpulse.edu',
    title: 'Design Systems & Enterprise Product Design',
    slugBase: 'design-systems-enterprise-product-design',
    subtitle: 'Build, maintain, and scale tokens, components, and governance across multi-disciplinary teams',
    description: 'Learn how modern tech giants like Spotify, Airbnb, and Shopify build cohesive design systems. Master Figma variables, code-to-design token synchronization, documentation, and versioning.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    category: 'UI/UX Design',
    level: 'advanced',
    price: 749,
    originalPrice: 2299,
    isOfferActive: true,
    offerBadgeText: 'Featured',
    rating: 4.8,
    reviewsCount: 16,
    studentsCount: 95,
    whatYouWillLearn: [
      'Structure semantic design tokens for color, spacing, and typography',
      'Synchronize Figma design tokens with GitHub and CSS/Tailwind',
      'Design accessible (WCAG 2.1 AAA) complex data tables and dashboards',
      'Set up design system governance, versioning, and contribution workflows'
    ],
    requirements: [
      'Experience working with Figma components and libraries'
    ],
    whoThisCourseIsFor: [
      'Mid-to-Senior UI/UX Designers and Lead Frontend Engineers'
    ],
    modules: [
      {
        title: 'Module 1: Design Token Architecture',
        lessons: [
          { title: 'Global vs Semantic vs Component Tokens', duration: 16, isFreePreview: true, contentType: 'video' },
          { title: 'Figma Variables & Dark Mode Theming Modes', duration: 22, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Enterprise Components & Governance',
        lessons: [
          { title: 'Complex Data Grids, Filters & Modal States', duration: 28, isFreePreview: false, contentType: 'video' },
          { title: 'Automating Design System Documentation with Storybook', duration: 20, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },

  // 7 & 8 for Rajesh Nair
  {
    instructorEmail: 'rajesh.nair@skillpulse.edu',
    title: 'Complete Ethical Hacking & Penetration Testing',
    slugBase: 'ethical-hacking-penetration-testing',
    subtitle: 'Master Kali Linux, network scanning, web app vulnerabilities, and exploit techniques',
    description: 'A hands-on, labs-driven ethical hacking bootcamp covering the latest penetration testing methodologies, OWASP Top 10 vulnerabilities, Nmap, Metasploit, Wireshark, and privilege escalation.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    category: 'Cyber Security',
    level: 'beginner',
    price: 899,
    originalPrice: 2999,
    isOfferActive: true,
    offerBadgeText: 'Exclusive',
    rating: 4.9,
    reviewsCount: 38,
    studentsCount: 220,
    whatYouWillLearn: [
      'Set up a secure Kali Linux and vulnerable virtual machine lab',
      'Perform detailed reconnaissance and vulnerability scanning with Nmap',
      'Identify and exploit OWASP Top 10 (SQLi, XSS, CSRF, SSRF)',
      'Execute privilege escalation on Linux and Windows target hosts'
    ],
    requirements: [
      'A computer capable of running VirtualBox or VMware',
      'Basic familiarity with computer networking and terminal commands'
    ],
    whoThisCourseIsFor: [
      'Aspiring security analysts, penetration testers, and ethical hackers'
    ],
    modules: [
      {
        title: 'Module 1: Lab Setup & Target Reconnaissance',
        lessons: [
          { title: 'Configuring Virtual Hacking Lab with Kali Linux', duration: 15, isFreePreview: true, contentType: 'video' },
          { title: 'Port Scanning & Service Enumeration with Nmap', duration: 24, isFreePreview: false, contentType: 'video' },
          { title: 'Passive Information Gathering & OSINT Frameworks', duration: 18, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Web App Penetration & Exploitation',
        lessons: [
          { title: 'Exploiting SQL Injection & Authentication Bypasses', duration: 30, isFreePreview: false, contentType: 'video' },
          { title: 'Server-Side Request Forgery (SSRF) & Remote Code Execution', duration: 26, isFreePreview: false, contentType: 'video' },
          { title: 'Penetration Testing Executive Report Template', duration: 12, isFreePreview: false, contentType: 'document' },
        ],
      },
    ],
  },
  {
    instructorEmail: 'rajesh.nair@skillpulse.edu',
    title: 'Network Defense & Incident Response Bootcamp',
    slugBase: 'network-defense-incident-response',
    subtitle: 'Detect, analyze, and neutralize advanced cyber threats across modern networks',
    description: 'Learn blue team operations: SIEM monitoring with Splunk, packet inspection with Wireshark, digital forensics, memory analysis with Volatility, and automated threat containment.',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    category: 'Cyber Security',
    level: 'intermediate',
    price: 799,
    originalPrice: 2599,
    isOfferActive: true,
    offerBadgeText: 'Trending',
    rating: 4.8,
    reviewsCount: 19,
    studentsCount: 130,
    whatYouWillLearn: [
      'Configure and ingest telemetry into modern SIEM platforms',
      'Analyze malicious PCAP traffic and detect C2 beaconing',
      'Extract volatile memory artifacts and perform triage analysis',
      'Implement incident response playbooks for ransomware and data breaches'
    ],
    requirements: [
      'Basic knowledge of TCP/IP protocols and operating systems'
    ],
    whoThisCourseIsFor: [
      'SOC analysts, security engineers, and network administrators'
    ],
    modules: [
      {
        title: 'Module 1: Traffic Analysis & SIEM Detection',
        lessons: [
          { title: 'Analyzing Encrypted vs Malicious Traffic in Wireshark', duration: 20, isFreePreview: true, contentType: 'video' },
          { title: 'Building Real-time SOC Dashboards in Splunk', duration: 25, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Incident Response Playbooks',
        lessons: [
          { title: 'Live Memory Forensics with Volatility 3', duration: 24, isFreePreview: false, contentType: 'video' },
          { title: 'Ransomware Containment & Root Cause Analysis', duration: 28, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },

  // 9 & 10 for Elena Rostova
  {
    instructorEmail: 'elena.rostova@skillpulse.edu',
    title: 'Flutter & Dart: Build Multiplatform iOS & Android Apps',
    slugBase: 'flutter-dart-build-ios-android-apps',
    subtitle: 'Build fast, native quality mobile apps for iOS, Android, and web from a single codebase',
    description: 'Learn modern Flutter development with Dart. Covers state management with Bloc and Riverpod, custom animations, REST and GraphQL integrations, Firebase auth, and App Store releases.',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
    category: 'Mobile Development',
    level: 'beginner',
    price: 649,
    originalPrice: 2399,
    isOfferActive: true,
    offerBadgeText: 'Best Value',
    rating: 4.9,
    reviewsCount: 35,
    studentsCount: 275,
    whatYouWillLearn: [
      'Build beautiful, fluid native UIs with Flutter widget trees',
      'Manage scalable reactive application state using Riverpod & Bloc',
      'Integrate device APIs: Camera, Geolocation, Biometrics, and Push Notifications',
      'Prepare, sign, and publish apps to Apple App Store and Google Play Store'
    ],
    requirements: [
      'Basic programming knowledge in any object-oriented language'
    ],
    whoThisCourseIsFor: [
      'Developers wanting to build iOS and Android apps without maintaining two codebases'
    ],
    modules: [
      {
        title: 'Module 1: Dart Deep Dive & Flutter Widget Trees',
        lessons: [
          { title: 'Dart 3 Syntax, Records & Pattern Matching', duration: 16, isFreePreview: true, contentType: 'video' },
          { title: 'Stateless vs Stateful Widgets & Layout Fundamentals', duration: 22, isFreePreview: false, contentType: 'video' },
          { title: 'Building Adaptive Responsive UIs for Phone & Tablet', duration: 18, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: Reactive State & Networking',
        lessons: [
          { title: 'Enterprise State Management with Riverpod 2.0', duration: 26, isFreePreview: false, contentType: 'video' },
          { title: 'Dio HTTP Client, Interceptors & Offline Caching', duration: 21, isFreePreview: false, contentType: 'video' },
        ],
      },
    ],
  },
  {
    instructorEmail: 'elena.rostova@skillpulse.edu',
    title: 'React Native & Expo: Complete Mobile Developer Guide',
    slugBase: 'react-native-expo-complete-guide',
    subtitle: 'Leverage your React knowledge to build high-performance native iOS and Android apps',
    description: 'Harness the power of React Native with the modern Expo Router. Master native animations with Reanimated 3, gesture handling, SQLite offline sync, and EAS cloud builds.',
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80',
    category: 'Mobile Development',
    level: 'intermediate',
    price: 749,
    originalPrice: 2499,
    isOfferActive: true,
    offerBadgeText: 'Top Rated',
    rating: 4.8,
    reviewsCount: 22,
    studentsCount: 165,
    whatYouWillLearn: [
      'Build native iOS and Android apps using React and Expo Router',
      'Implement 60fps smooth animations with React Native Reanimated 3',
      'Work with Native Wind (TailwindCSS) for rapid mobile styling',
      'Automate builds and over-the-air updates with Expo Application Services (EAS)'
    ],
    requirements: [
      'Good familiarity with modern JavaScript and React hooks'
    ],
    whoThisCourseIsFor: [
      'Web developers seeking a fast transition into mobile app development'
    ],
    modules: [
      {
        title: 'Module 1: Expo Router & Native Fundamentals',
        lessons: [
          { title: 'File-based Routing in Expo Router v3', duration: 15, isFreePreview: true, contentType: 'video' },
          { title: 'Native UI Elements: Safe Area, FlatList & Modal Navigation', duration: 24, isFreePreview: false, contentType: 'video' },
        ],
      },
      {
        title: 'Module 2: 60FPS Animations & Native Hardware',
        lessons: [
          { title: 'Spring Animations & Gesture Handlers with Reanimated 3', duration: 25, isFreePreview: false, contentType: 'video' },
          { title: 'Offline-First Architecture with TanStack Query & SQLite', duration: 28, isFreePreview: false, contentType: 'video' },
          { title: 'Expo Application Services (EAS) Deployment Checklist', duration: 10, isFreePreview: false, contentType: 'document' },
        ],
      },
    ],
  },
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Seed / Upsert Instructors
    console.log('\n--- Seeding Instructors ---');
    const createdInstructors = {};
    for (const inst of instructorsData) {
      let user = await User.findOne({ email: inst.email });
      if (!user) {
        user = await User.create(inst);
        console.log(`Created instructor: ${user.name} (${user.email})`);
      } else {
        user.name = inst.name;
        user.role = 'instructor';
        user.headline = inst.headline;
        user.bio = inst.bio;
        user.avatar = inst.avatar;
        user.isVerified = true;
        user.payoutStatus = 'active';
        user.razorpayAccountId = inst.razorpayAccountId;
        await user.save();
        console.log(`Updated existing instructor: ${user.name} (${user.email})`);
      }
      createdInstructors[inst.email] = user;
    }

    // 2. Seed / Upsert Students
    console.log('\n--- Seeding Students ---');
    const createdStudents = [];
    for (const stu of studentsData) {
      let user = await User.findOne({ email: stu.email });
      if (!user) {
        user = await User.create(stu);
        console.log(`Created student: ${user.name} (${user.email})`);
      } else {
        user.name = stu.name;
        user.role = 'student';
        user.headline = stu.headline;
        user.bio = stu.bio;
        user.avatar = stu.avatar;
        user.isVerified = true;
        await user.save();
        console.log(`Updated existing student: ${user.name} (${user.email})`);
      }
      createdStudents.push(user);
    }

    // 3. Seed Courses with Modules and Lessons
    console.log('\n--- Seeding Courses, Modules & Lessons ---');
    let coursesCreatedCount = 0;
    const seededCourseList = [];

    for (const courseData of coursesDef) {
      const instructor = createdInstructors[courseData.instructorEmail];
      if (!instructor) {
        console.error(`Instructor not found for ${courseData.instructorEmail}`);
        continue;
      }

      // Check if course with this title already exists
      let existingCourse = await Course.findOne({ title: courseData.title });

      if (existingCourse) {
        console.log(`Course already exists: "${courseData.title}" (slug: ${existingCourse.slug})`);
        seededCourseList.push(existingCourse);
        continue;
      }

      const slug = `${courseData.slugBase}-${Date.now().toString().slice(-4)}`;
      
      const newCourse = new Course({
        title: courseData.title,
        slug,
        subtitle: courseData.subtitle,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        price: courseData.price,
        originalPrice: courseData.originalPrice,
        isOfferActive: courseData.isOfferActive,
        offerBadgeText: courseData.offerBadgeText,
        offerExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currency: 'INR',
        platformSharePercent: 30,
        instructorSharePercent: 70,
        category: courseData.category,
        level: courseData.level,
        instructor: instructor._id,
        isPublished: true,
        approvalStatus: 'approved',
        submittedAt: new Date(),
        reviewedAt: new Date(),
        rating: courseData.rating,
        reviewsCount: courseData.reviewsCount,
        studentsCount: courseData.studentsCount,
        whatYouWillLearn: courseData.whatYouWillLearn,
        requirements: courseData.requirements,
        whoThisCourseIsFor: courseData.whoThisCourseIsFor,
        language: 'English',
        modules: [],
      });

      await newCourse.save();

      // Create Modules & Lessons
      const moduleIds = [];
      let modOrder = 0;

      for (const modData of courseData.modules) {
        const mod = new Module({
          title: modData.title,
          course: newCourse._id,
          order: modOrder++,
          lessons: [],
        });
        await mod.save();

        const lessonIds = [];
        let lessonOrder = 0;

        for (const lesData of modData.lessons) {
          const sampleVideo = sampleVideoUrls[lessonOrder % sampleVideoUrls.length];
          const lesson = new Lesson({
            title: lesData.title,
            module: mod._id,
            contentType: lesData.contentType || 'video',
            videoUrl: lesData.contentType === 'video' ? sampleVideo : '',
            videoType: 'direct',
            duration: lesData.duration || 10,
            order: lessonOrder++,
            isFreePreview: lesData.isFreePreview || false,
            content: `Detailed guide and source references for: ${lesData.title}`,
          });
          await lesson.save();
          lessonIds.push(lesson._id);
        }

        mod.lessons = lessonIds;
        await mod.save();
        moduleIds.push(mod._id);
      }

      newCourse.modules = moduleIds;
      await newCourse.save();

      coursesCreatedCount++;
      seededCourseList.push(newCourse);
      console.log(`Successfully created course: "${newCourse.title}" (slug: ${newCourse.slug}) with ${moduleIds.length} modules.`);
    }

    // 4. Enroll sample students in a few courses for realistic activity
    console.log('\n--- Enrolling Students in Sample Courses ---');
    for (let i = 0; i < createdStudents.length; i++) {
      const student = createdStudents[i];
      // Pick 2 courses for each student
      const coursesToEnroll = [seededCourseList[i % seededCourseList.length], seededCourseList[(i + 3) % seededCourseList.length]];

      for (const course of coursesToEnroll) {
        if (!course) continue;
        const exists = await Enrollment.findOne({ student: student._id, course: course._id });
        if (!exists) {
          await Enrollment.create({
            student: student._id,
            course: course._id,
            progressPercent: Math.floor(Math.random() * 60) + 10,
            enrolledAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
          });
          console.log(`Enrolled ${student.name} into "${course.title}"`);
        }
      }
    }

    console.log('\nSeeding completed successfully!');
    console.log(`- Instructors added/updated: ${instructorsData.length}`);
    console.log(`- Students added/updated: ${studentsData.length}`);
    console.log(`- Courses added: ${coursesCreatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
