# InnerView — Complete Figma Make Design Prompt

Design and build a complete, production-quality responsive web application called **InnerView**.

InnerView is a modern peer-to-peer mock interview platform for software engineers. It allows users to practice realistic technical interviews with other developers, find compatible interview partners, schedule interviews, conduct live collaborative interviews, solve coding problems, collaborate on system-design diagrams, communicate through video, submit solutions, and receive structured feedback.

The product should feel like a **premium developer-focused SaaS platform**, combining the polish and usability of products such as Linear, Vercel, GitHub, Notion, and modern IDEs, while maintaining a unique visual identity for InnerView.

---

# 1. PRODUCT PURPOSE

Many software engineering candidates struggle to prepare for technical interviews because traditional preparation does not reproduce the pressure, interaction, and structure of a real interview.

InnerView solves this by providing:

* Realistic peer-to-peer mock interviews
* Problem-solving / algorithm interviews
* System design interviews
* Technical knowledge interviews
* HR / behavioral interviews
* Interviewer and interviewee roles
* Matching based on user information and preferences
* Interview scheduling
* Calendar integration
* Real-time collaborative coding
* Coding problem hosting
* Test cases and code submissions
* Video communication
* Collaborative system-design canvas
* Structured interview feedback
* Performance and interview history
* AI-powered Interview Copilot for interviewers

The AI Copilot is a **silent interviewer assistant**. It does not communicate directly with the candidate. It provides contextual suggestions to the interviewer, such as hints, follow-up questions, and evaluation suggestions.

---

# 2. DATABASE IS THE SOURCE OF TRUTH

IMPORTANT:

Design the UI according to the provided InnerView MySQL database.

Do NOT invent unrelated entities or fields.

The existing database contains:

* users
* user_profiles
* user_languages
* programming_languages
* interviews
* interview_participants
* user_interview
* interview_problems
* problems
* problem_tags
* test_cases
* submissions
* feedback
* refresh_tokens

The UI must represent the relationships between these entities accurately.

---

# 3. USER DATA MODEL

## Users

A user contains:

* Name
* Email
* Password/authentication information
* Authentication provider
* Provider ID
* Account timestamps

The UI should primarily expose:

* Name
* Email
* Profile
* Programming languages

Do not expose security-related fields such as password hashes or refresh tokens.

---

# 4. USER PROFILE

The profile contains:

* Profile image
* Bio
* Experience level
* Preferred role
* Created date
* Updated date

Experience levels:

* Student
* Fresh Graduate
* Junior
* Mid Level
* Senior

Preferred roles:

* Interviewer
* Interviewee
* Both

Programming languages are connected through the user's language relationships.

Do not invent fields such as:

* Age
* Gender
* Location
* Salary
* Company
* University
* Years of experience

unless they are added to the actual backend later.

---

# 5. INTERVIEW DATA MODEL

An interview contains:

* ID
* Interview type
* Status
* Start time
* End time
* Duration
* Room ID
* Room size
* Owner
* Created date

Interview types:

* Problem Solving
* System Design
* Technical
* HR

Interview statuses:

* Scheduled
* Started
* Active
* Completed
* Cancelled

Participants are connected through:

`interview_participants`

and

`user_interview`

Participants have:

* User
* Interview
* Role
* Joined time
* Mute state where applicable

Roles:

* Interviewer
* Interviewee
* Both

---

# 6. PROBLEM DATA MODEL

Problems contain:

* Title
* Slug
* Statement
* Explanation
* Difficulty
* Active status
* Time limit
* Memory limit
* Solution code
* Solution language
* Creator
* Created date
* Updated date

Difficulty:

* Easy
* Medium
* Hard

Problems also have tags.

Examples:

* Array
* Hash Table
* String
* Dynamic Programming
* Graph
* Tree
* Binary Search
* Two Pointers

Use actual problem tags where available.

---

# 7. TEST CASE DATA MODEL

Test cases contain:

* Input
* Expected output
* Description
* Sample status
* Order index
* Weight
* Problem

Design the test-case UI around these fields.

---

# 8. SUBMISSION DATA MODEL

Submissions contain:

* Code
* Language
* Problem
* Interview
* User
* Score
* Submission status
* Compilation error
* Test results
* Total duration
* Submitted time

Statuses:

* Pending
* Running
* Accepted
* Wrong Answer
* Compile Error
* Runtime Error
* Time Limit Exceeded
* Memory Limit Exceeded
* Skipped

The UI must clearly communicate these states.

---

# 9. FEEDBACK DATA MODEL

Feedback contains:

* Rating
* Comment
* Interview
* Reviewer
* Reviewee
* Created date

The current database stores an overall rating and comment.

Therefore, do NOT create fake database fields such as:

* Communication score
* Confidence score
* Technical score
* Code quality score
* System design score

These can only be displayed as derived metrics if the application later implements them.

The main feedback experience should focus on:

**Overall Rating**

**Reviewer**

**Comment**

**Interview**

**Date**

---

# 10. BRAND IDENTITY

The product name is:

# InnerView

Create a modern minimal logo based on the concepts of:

* Interview
* Conversation
* Connection
* Perspective
* Code

The logo should work both as:

* Full desktop logo
* Small application icon

Create a simple geometric symbol that feels appropriate for a developer platform.

---

# 11. PRIMARY COLOR — VIOLET BLUE

The entire product should use **Violet Blue** as the primary brand color.

Primary:

**#6366F1**

Primary Hover:

**#818CF8**

Primary Dark:

**#4F46E5**

Secondary Violet:

**#8B5CF6**

Light Accent:

**#A78BFA**

Use Violet Blue consistently across the application.

Use it for:

* Primary CTA buttons
* Active sidebar item
* Active tabs
* Links
* Selected calendar dates
* Progress indicators
* Match percentage
* Important badges
* Focus states
* Chart highlights
* AI Copilot accent
* Selected states
* Brand logo

Do NOT use cyan as the primary accent.

Use gradients sparingly.

If gradients are used, keep them subtle:

**Violet Blue → Violet**

---

# 12. DARK THEME

Make dark mode the primary visual experience.

Background:

**#08090D**

Surface:

**#10121A**

Elevated Surface:

**#171925**

Border:

**#262938**

Primary Text:

**#F8FAFC**

Secondary Text:

**#A1A1AA**

Muted Text:

**#71717A**

Success:

**#22C55E**

Warning:

**#F59E0B**

Error:

**#EF4444**

The interface should feel elegant and sophisticated rather than completely black.

---

# 13. TYPOGRAPHY

Use:

**Inter**

or another modern SaaS sans-serif.

For code:

**JetBrains Mono**

or

**Fira Code**

Typography should have:

* Strong large page headings
* Medium-weight section headings
* Compact metadata
* High readability
* Clear hierarchy
* Comfortable line spacing

---

# 14. GLOBAL LAYOUT

Desktop target:

**1440px**

Use a persistent left sidebar for the authenticated application.

Sidebar:

Logo:

**InnerView**

Navigation:

* Dashboard
* Find Interview
* My Interviews
* Calendar
* Problems
* Practice
* Feedback
* Profile

Bottom:

* Notifications
* Settings
* Help

User section:

Avatar

User name

Experience level

Online status

The sidebar should be collapsible.

---

# 15. LANDING PAGE

Create a premium marketing landing page.

## Hero

Headline:

**Practice Interviews. Build Confidence. Get Hired.**

Subtitle:

**Realistic peer-to-peer mock interviews with collaborative coding, system design, structured feedback, and AI-powered interviewer assistance.**

Primary CTA:

**Start Practicing**

Secondary CTA:

**Explore Interviews**

Hero visual should show an actual InnerView interview workspace:

* Video participants
* Code editor
* Interview timer
* Problem panel
* AI Copilot
* Interview controls

Make it look like a real product screenshot rather than a generic illustration.

---

# 16. LANDING PAGE — STATISTICS

Display carefully selected platform statistics.

Example:

**10K+**
Mock Interviews

**5K+**
Developers

**95%**
Session Completion

**4.8/5**
Average Rating

If these are mock/demo values, visually treat them as illustrative sample data.

---

# 17. HOW IT WORKS

Create a four-step section:

### 01 — Create Your Profile

Add your experience level, preferred role, and programming languages.

### 02 — Find an Interview Partner

Discover compatible users and interview opportunities.

### 03 — Practice in a Real Interview

Use video, collaborative coding, or system-design tools.

### 04 — Get Feedback

Receive ratings and comments after the interview.

---

# 18. INTERVIEW TYPES

Create four premium cards.

## Problem Solving

Practice algorithm and coding interviews.

Icon:
Code / Terminal

## System Design

Design scalable architectures collaboratively.

Icon:
Architecture / Network

## Technical

Practice computer science and technical knowledge questions.

Icon:
CPU / Book

## HR / Behavioral

Practice behavioral and HR interview questions.

Icon:
Message / User

Each card should use Violet Blue as its visual accent.

---

# 19. LANDING PAGE FEATURES

Create a feature section highlighting:

### Collaborative Coding

Real-time shared code editor.

### Smart Matching

Find compatible interview partners.

### Live Video

Real-time one-to-one or multi-participant communication.

### System Design Canvas

Collaboratively draw architecture diagrams.

### AI Interview Copilot

Help interviewers ask better questions and guide candidates.

### Structured Feedback

Review interview performance after every session.

---

# 20. AUTHENTICATION

Create polished authentication screens.

## Login

Fields:

Email

Password

Buttons:

**Sign In**

**Continue with Google**

Links:

Forgot Password

Create Account

---

# 21. REGISTER

Fields:

Full Name

Email

Password

Confirm Password

After registration, create onboarding.

---

# 22. ONBOARDING

Create a multi-step onboarding flow.

Step 1:

**Experience Level**

* Student
* Fresh Graduate
* Junior
* Mid Level
* Senior

Step 2:

**Preferred Role**

* Interviewer
* Interviewee
* Both

Step 3:

**Programming Languages**

Select multiple languages.

Step 4:

**Bio**

Short professional description.

Finish:

**Create My Profile**

The onboarding should correspond directly to the existing profile/language data model.

---

# 23. DASHBOARD

Top:

**Good morning, [User Name] 👋**

Subtitle:

**Ready for your next interview?**

Primary CTA:

**Find an Interview**

---

## Upcoming Interview Card

Use actual interview data.

Display:

Interview Type

Partner

Role

Date

Time

Duration

Status

Example:

**Problem Solving Interview**

Ahmed Mohamed

Interviewer

Today · 7:00 PM

60 min

● Scheduled

Button:

**Join Interview**

---

# 24. DASHBOARD STATISTICS

Create cards:

### Interviews Completed

### Average Rating

### Problems Solved

### Interviews This Month

These should represent metrics that can be derived from interviews, submissions, and feedback.

---

# 25. DASHBOARD PERFORMANCE

Create a clean performance chart.

Possible derived metrics:

* Completed interviews over time
* Average feedback rating
* Problems solved
* Submission success rate

Do not create database fields that do not exist.

---

# 26. FIND INTERVIEW

Page title:

**Find Your Next Interview**

Subtitle:

**Connect with developers and practice together.**

Filters:

Interview Type

Difficulty where applicable

Experience Level

Preferred Role

Programming Language

Availability

---

# 27. MATCH USER CARD

Create premium user cards.

Display:

Avatar

Name

Experience Level

Preferred Role

Programming Languages

Bio

Average Rating derived from feedback

Interview type

Availability

Match percentage if implemented by the application

Example:

**Ahmed Mohamed**

Junior

Both

⭐ 4.8

Java · Spring Boot · SQL

**98% Match**

Available:

Today · 7:00 PM

Buttons:

**Invite**

**View Profile**

---

# 28. AUTO MATCH

Make this a prominent CTA:

**Auto Match Me**

Use a small explanatory message:

"Find an interview partner based on your profile, role, skills, and availability."

---

# 29. SCHEDULING

Create a modern scheduling flow.

Step 1:

Interview Type

Step 2:

Partner

Step 3:

Date

Step 4:

Time

Step 5:

Duration

Step 6:

Confirmation

Duration options:

30 min

45 min

60 min

90 min

Calendar should clearly show available and selected slots.

Primary button:

**Schedule Interview**

Secondary:

**Add to Google Calendar**

---

# 30. CALENDAR PAGE

Create a full calendar page.

Views:

Month

Week

Day

Display scheduled interviews.

Use Violet Blue for selected/current interview.

Calendar event should show:

Interview Type

Partner

Time

Status

Clicking an event opens interview details.

---

# 31. MY INTERVIEWS

Create tabs:

**Upcoming**

**Completed**

**Cancelled**

Upcoming statuses:

Scheduled

Started

Active

Completed tab:

Completed interviews.

Cancelled tab:

Cancelled interviews.

Each card displays:

Interview Type

Participant

Role

Date

Time

Duration

Status

Actions:

Join

View Details

Reschedule

Cancel

---

# 32. INTERVIEW DETAILS

Create a detailed interview page.

Header:

**Problem Solving Interview**

Status:

● Completed

Date

Time

Duration

Room ID

---

## Participants

Ahmed Mohamed

Interviewer

Hazem Barakat

Interviewee

---

## Problems

Show problems connected through `interview_problems`.

---

## Submissions

Show submissions connected to this interview.

---

## Feedback

Show feedback connected to this interview.

---

# 33. LIVE INTERVIEW WORKSPACE

This is the core product screen.

Create a professional IDE-like interface.

Top bar:

InnerView

**Problem Solving Interview**

● ACTIVE

Timer:

**42:18**

Actions:

Settings

More

End Interview

---

# 34. LIVE VIDEO

Create a video area for participants.

Each tile contains:

Avatar/video

Name

Role

Microphone state

Camera state

Connection state

Use a subtle green online indicator.

Support:

* Mute
* Unmute
* Camera
* Camera Off
* End Call
* Full Screen

---

# 35. PROBLEM-SOLVING INTERVIEW WORKSPACE

For `PROBLEM_SOLVING` interviews:

Use a three-part layout.

LEFT:

Problem statement.

CENTER:

Collaborative code editor.

RIGHT:

Video + AI Copilot for interviewer.

---

# 36. PROBLEM PANEL

Display:

Problem title

Difficulty

Tags

Statement

Examples

Constraints

Time limit

Memory limit

---

# 37. CODE EDITOR

Use an IDE-like editor.

Top toolbar:

Language selector

Run

Submit

Reset

Editor:

Line numbers

Syntax highlighting

Code folding

Tabs

Monospace typography

Example:

C++

solution.cpp

---

# 38. TEST CASES

Bottom panel:

Tabs:

Sample Tests

Test Cases

Output

Submission History

Show:

Input

Expected Output

Actual Output

Status

Execution Time

---

# 39. CODE EXECUTION

When Run is clicked, display a realistic execution state:

**Running...**

Then:

✓ Test 1 Passed

✓ Test 2 Passed

✕ Test 3 Failed

Display execution time.

---

# 40. SUBMISSION

Show:

**Submit Solution**

After submission:

Status

Score

Execution time

Test results

Compilation error if applicable

Use the actual submission status values.

---

# 41. SUBMISSION HISTORY

Create a table:

Status

Problem

Language

Score

Execution Time

Submitted At

Example:

✓ Accepted

Two Sum

C++

100

42ms

2 min ago

---

# 42. AI INTERVIEW COPILOT

IMPORTANT:

The AI Copilot is ONLY visible to the interviewer.

It should NOT be shown to the candidate.

The Copilot is a silent assistant that monitors the collaborative interview environment and gives contextual guidance to the interviewer.

Design it as a compact professional assistant panel.

Header:

**AI Copilot**

Status:

● Listening

---

Example:

### Candidate Progress

"Candidate has identified a hash-map based approach."

### Suggested Follow-up

"Can you explain the time complexity of your approach?"

Button:

**Use Suggestion**

### Hint

"Consider asking the candidate about memory trade-offs."

### Evaluation Suggestion

"Candidate is progressing well."

Buttons:

Use

Dismiss

The AI should never visually dominate the interview workspace.

It should feel like an unobtrusive developer assistant.

---

# 43. SYSTEM DESIGN INTERVIEW

For `SYSTEM_DESIGN` interviews, replace the code editor with a collaborative architecture canvas.

Workspace:

Top bar:

System Design Interview

Timer

Participants

End Interview

---

# 44. SYSTEM DESIGN CANVAS

Create an infinite canvas.

Toolbar:

Select

Text

Arrow

API

Server

Database

Cache

Queue

Load Balancer

Cloud

Delete

Zoom

Undo

Redo

Example architecture:

Client

↓

API Gateway

↓

Load Balancer

↓

Application Servers

↓

Redis

↓

Database

Use clean architecture components.

Cards should have subtle Violet Blue accents.

---

# 45. SYSTEM DESIGN SIDE PANEL

Show:

Participants

Interview Notes

AI Copilot

The AI Copilot can suggest:

"Ask about scalability."

"Explore database consistency."

"How does the system handle failures?"

"Ask about caching strategy."

Again, this is interviewer-only.

---

# 46. TECHNICAL INTERVIEW

For `TECHNICAL` interviews create:

Video

Interview timer

Question panel

Notes

Interview controls

Example:

**Question**

"Explain the difference between a process and a thread."

Buttons:

Previous

Next

Mark Question

---

# 47. HR INTERVIEW

Create a conversational interview interface.

Example question:

**Tell me about a challenging project you worked on.**

Show:

Question

Timer

Video

Notes

Next Question

Previous Question

---

# 48. PROBLEM LIBRARY

Page title:

**Problem Library**

Search:

"Search problems..."

Filters:

Difficulty

Tags

Language

Active status

---

Problem cards:

### Two Sum

Easy

Array · Hash Table

Time Limit: 1000ms

Memory: 256MB

● Active

Button:

**View Problem**

---

# 49. PROBLEM DETAILS

Create a detailed problem page.

Header:

Two Sum

Easy

Tags:

Array

Hash Table

Sections:

Problem Statement

Examples

Constraints

Test Cases

Time Limit

Memory Limit

Solution Language

Explanation

---

# 50. FEEDBACK PAGE

Page title:

**Interview Feedback**

Main card:

**4.5 / 5**

★★★★★

Reviewer:

Ahmed Mohamed

Interview:

Problem Solving

Date:

August 10, 2026

---

Comment:

"Strong problem-solving approach and clear communication."

---

Create sections:

### Strengths

These can be derived from the written feedback or displayed as qualitative content.

### Areas to Improve

Show recommendations based on feedback where available.

Do not fabricate separate numerical scoring dimensions that do not exist in the database.

---

# 51. PROFILE PAGE

Create a professional developer profile.

Header:

Large avatar

Name

Experience Level

Rating

Interview count

Bio

---

## Programming Languages

Display languages from `user_languages`.

Examples:

Java

C++

Python

JavaScript

TypeScript

---

## Interview Preferences

Preferred Role:

Both

---

## Interview History

Show previous interviews.

Each entry:

Interview Type

Role

Date

Status

Rating

---

# 52. NOTIFICATIONS

Create notification center.

Notifications should correspond to realistic application events:

* Interview scheduled
* Interview invitation
* Interview accepted
* Interview starting soon
* Interview started
* Interview completed
* Feedback received
* Submission completed
* Submission failed

Use:

Unread indicator

Timestamp

Relevant icon

Violet Blue accent for unread notifications.

---

# 53. SETTINGS

Create settings page.

Sections:

### Account

Name

Email

Profile image

Bio

### Security

Password

Authentication provider

Security options

### Interview Preferences

Preferred role

Preferred interview types

Programming languages

### Notifications

Interview reminders

Feedback notifications

Match notifications

### Appearance

Dark

Light

System

Maintain the Violet Blue identity in all themes.

---

# 54. EMPTY STATES

Design polished empty states.

Example:

### No Upcoming Interviews

**Your calendar is clear.**

"Find an interview partner and start practicing."

Button:

**Find an Interview**

---

### No Matches

**No perfect match yet.**

"Try expanding your preferences."

Button:

**Adjust Preferences**

---

### No Feedback

**No feedback yet.**

"Complete an interview to receive structured feedback."

---

# 55. LOADING STATES

Create skeleton loaders for:

* Dashboard
* User cards
* Interview cards
* Problem cards
* Feedback
* Profile

Use subtle animated skeletons.

---

# 56. ERROR STATES

Example:

**Something went wrong.**

"Unable to load your interviews."

Button:

**Try Again**

Use the error color only for actual errors.

---

# 57. TOASTS

Create reusable toast notifications.

Success:

**Interview scheduled successfully.**

Error:

**Unable to schedule interview.**

Info:

**Your interview starts in 15 minutes.**

Submission:

**Solution submitted successfully.**

---

# 58. COMPONENT SYSTEM

Create a complete reusable design system.

Components:

* Button
* Input
* Select
* Checkbox
* Radio
* Toggle
* Badge
* Avatar
* Tooltip
* Modal
* Toast
* Dropdown
* Tabs
* Calendar
* Date Picker
* Card
* User Card
* Interview Card
* Problem Card
* Feedback Card
* Rating
* Progress Bar
* Sidebar
* Navbar
* Video Tile
* Interview Timer
* Code Editor
* Problem Panel
* Test Case Panel
* Submission Panel
* AI Copilot
* System Design Canvas
* Notification Item

Each component should have:

Default

Hover

Active

Disabled

Loading

Success

Error

states where appropriate.

---

# 59. RESPONSIVE DESIGN

Design desktop first at:

**1440px**

Then support:

1280px

1024px

768px

390px

---

## Desktop

Persistent sidebar.

Multi-column layouts.

Large interview workspace.

---

## Tablet

Collapsible sidebar.

Responsive cards.

Two-column interview workspace where possible.

---

## Mobile

Use:

Bottom navigation

Hamburger menu

Stacked cards

Responsive video tiles

Collapsible problem panel

Collapsible AI Copilot

Touch-friendly controls

For the live interview room, prioritize:

1. Video
2. Problem
3. Code editor
4. Controls

---

# 60. MICRO-INTERACTIONS

Add subtle premium animations:

* Button hover
* Sidebar transitions
* Card hover
* Tab transitions
* Notification appearance
* Match percentage animation
* Interview countdown
* Online indicator
* Code execution state
* Submission state
* AI suggestion appearance
* Calendar selection

Do not over-animate the interface.

---

# 61. UX PRINCIPLES

Prioritize:

### Clarity

Users should immediately understand what they can do.

### Speed

Important actions should be one or two clicks away.

### Professionalism

The product should feel suitable for serious interview preparation.

### Real-time awareness

Clearly communicate:

* Online
* Connecting
* Joined
* Running
* Submitted
* Active
* Completed

### Minimal cognitive load

The live interview workspace must never feel cluttered.

---

# 62. IMPORTANT ACTIONS

Make these visually prominent:

**Find Interview**

**Schedule Interview**

**Join Interview**

**Start Interview**

**Run Code**

**Submit Solution**

**End Interview**

**Send Invitation**

**Submit Feedback**

Use Violet Blue as the main action color.

Use red only for destructive actions such as:

**Cancel Interview**

**End Interview**

---

# 63. DESIGN LANGUAGE

The final application should look like a serious production SaaS platform.

Visual references:

**Linear**
for spacing and product polish.

**Vercel**
for minimalism and typography.

**GitHub**
for developer-oriented interfaces.

**Modern IDEs**
for the coding environment.

**Notion**
for information organization.

But do NOT directly copy any of these products.

Create an original InnerView visual identity.

---

# 64. WHAT TO AVOID

Do NOT create:

* Generic Bootstrap dashboard
* Generic admin panel
* Excessive gradients
* Excessive glassmorphism
* Excessive rounded cards
* Cartoon illustrations
* Neon gaming aesthetic
* Too many colors
* Cyan as the primary color
* Fake database fields
* Fake complex analytics
* Fake profile information
* Unnecessary decorative elements

---

# 65. FINAL PRODUCT EXPERIENCE

The finished InnerView application should communicate:

**"This is where developers practice real interviews."**

The user should be able to visually understand the complete journey:

**Create Profile**
→
**Find Partner**
→
**Schedule Interview**
→
**Join Interview**
→
**Solve Problem / Design System**
→
**Submit Solution**
→
**Receive Feedback**
→
**Improve**

The most important screen is the **Live Interview Workspace**. Make it feel like a polished combination of a video meeting platform, modern IDE, and professional interview tool.

The second most important experience is **Find Interview**, where users discover compatible partners.

The third is **Feedback**, where users can clearly understand their previous performance.

Maintain one consistent **Violet Blue** design language across every page.

Use realistic sample data that matches the database schema, while keeping the architecture flexible enough to connect to the actual backend later.

Build the complete responsive application with all major pages, reusable components, states, interactions, realistic data, and a cohesive design system.
