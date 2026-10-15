/**
 * The scorecards the interview room uses, as published on the public pages. Labels and descriptions
 * are copied from the backend (services/spring-boot/.../dto/feedback/FeedbackRubric.java);
 * tests/seo/content.check.mjs fails if they drift, so the public pages never describe a rubric the
 * product doesn't use.
 */

export interface RubricCriterion {
  label: string
  description: string
}

const COMMUNICATION: RubricCriterion = {
  label: 'Communication',
  description: 'Explained their thinking clearly and asked good clarifying questions',
}

export const RUBRICS = {
  problemSolving: [
    COMMUNICATION,
    { label: 'Problem solving', description: 'Broke the problem down and found a sound approach' },
    { label: 'Correctness', description: 'The solution works, including edge cases' },
    { label: 'Code quality', description: 'Readable, well-structured code with good naming' },
    { label: 'Testing', description: 'Tested the code and reasoned about complexity' },
  ],
  systemDesign: [
    COMMUNICATION,
    { label: 'Requirements', description: 'Clarified functional and non-functional requirements and scale' },
    { label: 'High-level design', description: 'Sensible components, data flow and APIs' },
    { label: 'Deep dive', description: 'Went deep on the hard parts: data model, bottlenecks, failure modes' },
    { label: 'Trade-offs', description: 'Weighed alternatives and justified decisions' },
  ],
  behavioral: [
    COMMUNICATION,
    { label: 'Structure', description: 'Answers followed a clear structure (e.g. STAR)' },
    { label: 'Impact', description: 'Showed concrete results and ownership' },
    { label: 'Self-awareness', description: 'Reflected on mistakes and what they learned' },
    { label: 'Motivation & fit', description: 'Clear motivation and alignment with the role' },
  ],
  technical: [
    COMMUNICATION,
    { label: 'Problem solving', description: 'Found a sound approach to the problems' },
    { label: 'Technical depth', description: 'Solid fundamentals and knowledge' },
    { label: 'Code quality', description: 'Readable, well-structured code' },
    { label: 'Design', description: 'Reasoned well about architecture and trade-offs' },
  ],
  /** How the candidate rates the interviewer. */
  forInterviewer: [
    { label: 'Clarity', description: 'Explained the problem and expectations clearly' },
    { label: 'Helpfulness', description: 'Gave useful hints and actionable feedback' },
    { label: 'Professionalism', description: 'Kind, respectful and well prepared' },
  ],
} satisfies Record<string, RubricCriterion[]>

/** The interviewer's overall signal, strongest first (frontend HIRE_SIGNAL_LABELS). */
export const HIRE_SIGNALS = ['Strong hire', 'Hire', 'Lean hire', 'Lean no hire', 'No hire', 'Strong no hire'] as const
