export const currentUser = {
  id: 'u1',
  name: 'Hazem Barakat',
  email: 'hazem@example.com',
  profile: {
    avatar: null,
    bio: 'Backend engineer focused on distributed systems and algorithms. Preparing for senior-level interviews.',
    experienceLevel: 'Mid Level' as const,
    preferredRole: 'Both' as const,
  },
  languages: ['C++', 'Python', 'TypeScript', 'Go'],
  rating: 4.7,
  interviewCount: 23,
  isOnline: true,
}

export const users = [
  {
    id: 'u2',
    name: 'Ahmed Mohamed',
    email: 'ahmed@example.com',
    profile: {
      avatar: null,
      bio: 'Java developer specializing in Spring Boot and microservices. Strong in system design.',
      experienceLevel: 'Junior' as const,
      preferredRole: 'Both' as const,
    },
    languages: ['Java', 'Spring Boot', 'SQL'],
    rating: 4.8,
    interviewCount: 31,
    matchPercent: 98,
    availability: 'Today · 7:00 PM',
    isOnline: true,
  },
  {
    id: 'u3',
    name: 'Sara Hassan',
    email: 'sara@example.com',
    profile: {
      avatar: null,
      bio: 'Full-stack developer with expertise in React and Node.js. Passionate about clean code.',
      experienceLevel: 'Mid Level' as const,
      preferredRole: 'Interviewee' as const,
    },
    languages: ['TypeScript', 'React', 'Node.js', 'Python'],
    rating: 4.5,
    interviewCount: 18,
    matchPercent: 91,
    availability: 'Tomorrow · 2:00 PM',
    isOnline: false,
  },
  {
    id: 'u4',
    name: 'Omar Khalil',
    email: 'omar@example.com',
    profile: {
      avatar: null,
      bio: 'Senior software engineer with 5+ years. Loves helping others prepare for technical interviews.',
      experienceLevel: 'Senior' as const,
      preferredRole: 'Interviewer' as const,
    },
    languages: ['C++', 'Python', 'Rust', 'Go'],
    rating: 4.9,
    interviewCount: 67,
    matchPercent: 87,
    availability: 'Today · 9:00 PM',
    isOnline: true,
  },
  {
    id: 'u5',
    name: 'Lina Saad',
    email: 'lina@example.com',
    profile: {
      avatar: null,
      bio: 'Fresh graduate targeting FAANG companies. Practicing algorithms and system design daily.',
      experienceLevel: 'Fresh Graduate' as const,
      preferredRole: 'Interviewee' as const,
    },
    languages: ['Python', 'JavaScript', 'C++'],
    rating: 4.3,
    interviewCount: 9,
    matchPercent: 82,
    availability: 'Aug 12 · 5:00 PM',
    isOnline: true,
  },
]

export const interviews = [
  {
    id: 'i1',
    type: 'Problem Solving' as const,
    status: 'Scheduled' as const,
    startTime: 'Today · 7:00 PM',
    duration: 60,
    roomId: 'room-3f9k',
    partner: users[0],
    role: 'Interviewer' as const,
    problemIds: ['p1'],
  },
  {
    id: 'i2',
    type: 'System Design' as const,
    status: 'Completed' as const,
    startTime: 'Aug 8 · 3:00 PM',
    duration: 90,
    roomId: 'room-7a2m',
    partner: users[1],
    role: 'Interviewee' as const,
    rating: 4.5,
    problemIds: [],
  },
  {
    id: 'i3',
    type: 'HR' as const,
    status: 'Completed' as const,
    startTime: 'Aug 5 · 6:00 PM',
    duration: 30,
    roomId: 'room-9c1b',
    partner: users[2],
    role: 'Interviewee' as const,
    rating: 4.8,
    problemIds: [],
  },
  {
    id: 'i4',
    type: 'Technical' as const,
    status: 'Cancelled' as const,
    startTime: 'Aug 3 · 4:00 PM',
    duration: 60,
    roomId: 'room-2d8e',
    partner: users[1],
    role: 'Interviewer' as const,
    problemIds: [],
  },
  {
    id: 'i5',
    type: 'Problem Solving' as const,
    status: 'Scheduled' as const,
    startTime: 'Aug 12 · 5:00 PM',
    duration: 60,
    roomId: 'room-5x7y',
    partner: users[3],
    role: 'Interviewee' as const,
    problemIds: ['p2'],
  },
]

export const problems = [
  {
    id: 'p1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy' as const,
    tags: ['Array', 'Hash Table'],
    timeLimit: 1000,
    memoryLimit: 256,
    isActive: true,
    statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9.' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6.' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', '-10⁹ ≤ target ≤ 10⁹'],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', description: 'Basic case', isSample: true, order: 0, weight: 1 },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', description: 'Duplicate values', isSample: true, order: 1, weight: 1 },
      { input: '[3,3]\n6', expectedOutput: '[0,1]', description: 'Same value', isSample: false, order: 2, weight: 1 },
    ],
  },
  {
    id: 'p2',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    difficulty: 'Medium' as const,
    tags: ['String', 'Sliding Window', 'Hash Table'],
    timeLimit: 2000,
    memoryLimit: 256,
    isActive: true,
    statement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
    ],
    constraints: ['0 ≤ s.length ≤ 5 × 10⁴', 's consists of English letters, digits, symbols and spaces.'],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3', description: 'Standard case', isSample: true, order: 0, weight: 1 },
      { input: '"bbbbb"', expectedOutput: '1', description: 'All same', isSample: true, order: 1, weight: 1 },
    ],
  },
  {
    id: 'p3',
    title: 'Merge K Sorted Lists',
    slug: 'merge-k-sorted-lists',
    difficulty: 'Hard' as const,
    tags: ['Linked List', 'Heap', 'Divide and Conquer'],
    timeLimit: 1000,
    memoryLimit: 256,
    isActive: true,
    statement: 'You are given an array of `k` linked-lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'Merging all lists.' },
    ],
    constraints: ['k == lists.length', '0 ≤ k ≤ 10⁴', '0 ≤ lists[i].length ≤ 500'],
    testCases: [],
  },
  {
    id: 'p4',
    title: 'Binary Tree Maximum Path Sum',
    slug: 'binary-tree-maximum-path-sum',
    difficulty: 'Hard' as const,
    tags: ['Tree', 'Dynamic Programming', 'DFS'],
    timeLimit: 1000,
    memoryLimit: 256,
    isActive: true,
    statement: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. Given the root of a binary tree, return the maximum path sum of any non-empty path.',
    examples: [],
    constraints: ['The number of nodes in the tree is in the range [1, 3 × 10⁴]'],
    testCases: [],
  },
  {
    id: 'p5',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy' as const,
    tags: ['String', 'Stack'],
    timeLimit: 1000,
    memoryLimit: 256,
    isActive: true,
    statement: 'Given a string s containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Valid.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'Valid.' },
      { input: 's = "(]"', output: 'false', explanation: 'Invalid.' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁴'],
    testCases: [],
  },
]

export const submissions = [
  {
    id: 's1',
    problemId: 'p1',
    problemTitle: 'Two Sum',
    language: 'C++',
    status: 'Accepted' as const,
    score: 100,
    executionTime: '42ms',
    submittedAt: '2 min ago',
    code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement))
                return {seen[complement], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  },
  {
    id: 's2',
    problemId: 'p2',
    problemTitle: 'Longest Substring',
    language: 'Python',
    status: 'Wrong Answer' as const,
    score: 60,
    executionTime: '89ms',
    submittedAt: '1 day ago',
    code: '',
  },
]

export const feedbackList = [
  {
    id: 'f1',
    rating: 4.5,
    comment: 'Strong problem-solving approach and clear communication. Identified the hash-map optimization quickly and explained the time complexity accurately. Could improve on edge case handling.',
    reviewer: users[0],
    interviewType: 'Problem Solving',
    date: 'August 8, 2026',
    interviewId: 'i2',
  },
  {
    id: 'f2',
    rating: 4.8,
    comment: 'Excellent behavioral responses with concrete examples. STAR method used effectively throughout. Very composed under pressure.',
    reviewer: users[1],
    interviewType: 'HR',
    date: 'August 5, 2026',
    interviewId: 'i3',
  },
]

export const notifications = [
  {
    id: 'n1',
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: 'Ahmed Mohamed scheduled a Problem Solving interview for Today at 7:00 PM.',
    time: '30 min ago',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'feedback_received',
    title: 'New Feedback',
    message: 'You received feedback from Ahmed Mohamed for your System Design interview.',
    time: '2 days ago',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'interview_starting',
    title: 'Interview Starting Soon',
    message: 'Your interview with Sara Hassan starts in 15 minutes.',
    time: '3 days ago',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'submission_accepted',
    title: 'Submission Accepted',
    message: 'Your solution for "Two Sum" was accepted with score 100.',
    time: '3 days ago',
    isRead: true,
  },
]

export const calendarEvents = [
  { id: 'e1', date: '2026-08-10', time: '19:00', type: 'Problem Solving', partner: 'Ahmed Mohamed', status: 'Scheduled' },
  { id: 'e2', date: '2026-08-12', time: '17:00', type: 'Problem Solving', partner: 'Lina Saad', status: 'Scheduled' },
  { id: 'e3', date: '2026-08-08', time: '15:00', type: 'System Design', partner: 'Sara Hassan', status: 'Completed' },
  { id: 'e4', date: '2026-08-05', time: '18:00', type: 'HR', partner: 'Omar Khalil', status: 'Completed' },
]

export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'onboarding'
  | 'dashboard'
  | 'find-interview'
  | 'my-interviews'
  | 'calendar'
  | 'problems'
  | 'live-interview'
  | 'system-design'
  | 'feedback'
  | 'profile'
  | 'settings'
  | 'notifications'
