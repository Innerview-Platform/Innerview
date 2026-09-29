package com.innerview.spring.dto.feedback;

import com.innerview.spring.enums.InterviewType;
import java.util.List;

/** Scorecard criteria (each scored 1–5). */
public final class FeedbackRubric {
  private FeedbackRubric() {}

  public record Criterion(String id, String label, String description) {}

  private static final Criterion COMMUNICATION =
      new Criterion("communication", "Communication", "Explained their thinking clearly and asked good clarifying questions");

  /** How an interviewer rates the candidate, by interview type. */
  public static List<Criterion> forCandidate(InterviewType type) {
    if (type == null) type = InterviewType.TECHNICAL;
    return switch (type) {
      case PROBLEM_SOLVING -> List.of(
          COMMUNICATION,
          new Criterion("approach", "Problem solving", "Broke the problem down and found a sound approach"),
          new Criterion("correctness", "Correctness", "The solution works, including edge cases"),
          new Criterion("code_quality", "Code quality", "Readable, well-structured code with good naming"),
          new Criterion("testing", "Testing", "Tested the code and reasoned about complexity"));
      case SYSTEM_DESIGN -> List.of(
          COMMUNICATION,
          new Criterion("requirements", "Requirements", "Clarified functional and non-functional requirements and scale"),
          new Criterion("high_level_design", "High-level design", "Sensible components, data flow and APIs"),
          new Criterion("deep_dive", "Deep dive", "Went deep on the hard parts: data model, bottlenecks, failure modes"),
          new Criterion("trade_offs", "Trade-offs", "Weighed alternatives and justified decisions"));
      case HR -> List.of(
          COMMUNICATION,
          new Criterion("structure", "Structure", "Answers followed a clear structure (e.g. STAR)"),
          new Criterion("impact", "Impact", "Showed concrete results and ownership"),
          new Criterion("self_awareness", "Self-awareness", "Reflected on mistakes and what they learned"),
          new Criterion("motivation", "Motivation & fit", "Clear motivation and alignment with the role"));
      default -> List.of(
          COMMUNICATION,
          new Criterion("approach", "Problem solving", "Found a sound approach to the problems"),
          new Criterion("technical_depth", "Technical depth", "Solid fundamentals and knowledge"),
          new Criterion("code_quality", "Code quality", "Readable, well-structured code"),
          new Criterion("design", "Design", "Reasoned well about architecture and trade-offs"));
    };
  }

  /** How the candidate rates the interviewer (peer practice rates both ways). */
  public static final List<Criterion> FOR_INTERVIEWER = List.of(
      new Criterion("clarity", "Clarity", "Explained the problem and expectations clearly"),
      new Criterion("helpfulness", "Helpfulness", "Gave useful hints and actionable feedback"),
      new Criterion("professionalism", "Professionalism", "Kind, respectful and well prepared"));
}
