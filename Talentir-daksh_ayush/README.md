# Talentir / Classroom Copilot

## Repository Overview

This repository contains a browser-based educational platform built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**. It combines a student/teacher/admin dashboard, simulation browser, assignments and tests, feedback and leaderboard modules, an AI tutoring prototype, and experimental classroom analytics.

There is also a separate legacy static demo under `index.html` + `app.js` that demonstrates an AI tutor/whiteboard flow using Gemini and D-ID. That demo is not part of the main Next.js application and contains hardcoded credentials that must be removed before production use.

---

## System Architecture

### Primary stack
- **Frontend**: Next.js app using the App Router
- **UI**: React + Tailwind CSS
- **State/persistence**: client-side localStorage
- **Data**: seed data in `lib/store.ts` and `data/simulations.ts`
- **Authentication**: simple localStorage-based auth in `lib/auth.tsx`
- **Machine learning prototype**: browser-side `face-api.js` loaded from CDN
- **External APIs**: OpenAI, Deepgram, D-ID/Gemini via browser fetch calls

### Application structure

- `app/`
  - `page.tsx` — login page
  - `layout.tsx` — root layout and provider injection
  - `globals.css` — global Tailwind + theme variables
  - `sim/[id]/page.tsx` — fullscreen simulation route
  - `(app)/` — authenticated app routes
- `app/(app)/layout.tsx` — authenticated page layout with sidebar and top nav
- `app/(app)/dashboard/page.tsx` — home dashboard
- `app/(app)/ai-tutor/page.tsx` — AI tutoring interface
- `app/(app)/simulations/page.tsx` — simulation browser
- `app/(app)/assignments/page.tsx` — assignment management
- `app/(app)/tests/page.tsx` — practice tests
- `app/(app)/analytics/page.tsx` — analytics dashboard
- `app/(app)/face-setup/page.tsx` — face enrollment prototype
- `app/(app)/live-class/page.tsx` — live class experience prototype
- `app/(app)/feedback/page.tsx` — feedback submission
- `app/(app)/leaderboard/page.tsx` — leaderboard
- `app/(app)/users/page.tsx` — admin user management
- `components/` — reusable UI components
- `lib/` — application logic utilities and storage helpers
- `data/` — simulation registry data
- `types/` — strong TypeScript types
- `public/` — static SVG assets
- `index.html`, `app.js`, `styles.css` — legacy standalone AI tutor demo

### Important entry points
- `/` — login gate
- `/dashboard` — main dashboard
- `/ai-tutor` — AI tutor interface
- `/simulations` — simulation browser and viewer
- `/assignments` — assignment workflow
- `/tests` — practice test workflow
- `/analytics` — analytics panel
- `/leaderboard` — leaderboard view
- `/feedback` — feedback exchange
- `/face-setup` — face enrollment module
- `/live-class` — live class prototype
- `/users` — admin user management

---

## Source modules and responsibilities

### `lib/auth.tsx`
- Provides `AuthProvider` and `useAuth`
- Persists logged-in user in `localStorage` under `cc-user`
- Handles login/logout state in the browser

### `lib/store.ts`
- Contains seeded domain data for users, assignments, tests, leaderboard, notifications, feedback, class summaries
- Exposes CRUD helpers backed by `localStorage`
- Acts as the application's current data layer
- No backend database exists

### `lib/filters.ts`
- Contains search and filter helpers for simulation browsing
- Performs subject, grade, difficulty, and text search matching

### `lib/learning.ts`
- Generates learning guidance content for simulation previews
- Uses metadata from simulation registry
- Does not use any AI service API for generation

### `data/simulations.ts`
- Registry of PhET simulations across Physics, Chemistry, Biology, Math
- Builds embeddable URLs and image thumbnails
- Provides metadata used by the simulation browser

### `types/`
- `types/simulation.ts` — simulation metadata, filters, learning content types
- `types/user.ts` — user roles, notifications, assignments, tests, leaderboard and analytics shapes

### `components/`
- `Sidebar.tsx` — authenticated navigation
- `NotificationBell.tsx` — notification dropdown and read state
- `SearchBar.tsx` — simulation search input
- `FilterBar.tsx` — filters for simulation category
- `SimulationCard.tsx` — simulation listing UI
- `SimulationViewer.tsx` — iframe viewer and sidebar learning panel

---

## Data flow

1. Login validates user name, role, and 4-digit PIN against seeded users in `lib/store.ts`.
2. Auth state is stored in `localStorage` and accessed by `AuthProvider`.
3. Page components read and update localStorage through `lib/store.ts` helpers.
4. Simulation browsing uses `data/simulations.ts` and filter utilities.
5. Face enrollment stores face descriptors in `localStorage` under `cc-face-profiles`.
6. Live session analytics stores session summaries under `cc-session-stats`.
7. No server-side persistence or database exists yet.

---

## Build and runtime configuration

- `package.json` defines `dev`, `build`, `start`, `lint`, and `sim` scripts
- `next.config.ts` enables remote images from `phet.colorado.edu`
- `tsconfig.json` configures TypeScript, paths, and JSX settings
- `postcss.config.mjs` and `app/globals.css` configure Tailwind CSS

---

## Existing ML / AI components

### `app/(app)/face-setup/page.tsx`
- Loads `face-api.js` from a CDN
- Captures a face from webcam video
- Extracts face descriptors and stores them locally
- Prototype for face enrollment

### `app/(app)/live-class/page.tsx`
- Loads face detection and expression models from CDN
- Uses webcam video and audio capture
- Tracks face counts, attention heuristics, speaking events, and simple participation metrics
- Uses browser speech recognition or Deepgram if configured
- Saves analytic summaries to localStorage
- This is a prototype, not a fully production-grade pipeline

### `app/(app)/ai-tutor/page.tsx`
- Uses environment-based OpenAI keys for chat completion
- Supports voice / avatar via D-ID-ish flows and browser speech synthesis
- Generates visual aid suggestions and simulation recommendations
- Uses heuristic prompt-based JSON parsing for resource selection

### `index.html` + `app.js`
- Legacy standalone AI tutor demo
- Contains hardcoded `DID_API_KEY` and `GEMINI_API_KEY` values
- Demonstrates a separate whiteboard/AI tutor experience
- This legacy path is currently insecure and should be refactored

---

## Security and technical debt

### Key issues
- No backend authentication or server-side authorization
- All core application state is stored in browser `localStorage`
- Secrets should never be hardcoded; the repository currently has `app.js` with an exposed D-ID/Gemini key
- No tests are present
- No API routes or database integration
- Face recognition and attendance features are experimental browser prototypes

### Primary risks
- Untrusted localStorage data can be modified by users
- Hardcoded credentials in `app.js` are a security vulnerability
- Current analytics and attention measures are heuristics, not validated measurements
- Face recognition on a generic Webcam may be inaccurate or biased

---

## Environment variables

The main app should use environment variables and avoid embedding secrets in code.

Required variables:
- `NEXT_PUBLIC_OPENAI_API_KEY` — OpenAI API key for chat and tutoring flows
- `NEXT_PUBLIC_DEEPGRAM_API_KEY` — Deepgram API key for optional speech transcription in live class

Recommended additional variables for future integrations:
- `NEXT_PUBLIC_DID_API_KEY` — D-ID voice/avatar service key
- `NEXT_PUBLIC_GEMINI_API_KEY` — Gemini API key if Gemini-based flows are restored

> Do not commit secrets to source control. Store them in `.env` or secure OS key stores.

---

## Existing runtime paths and page behavior

### Authentication
- Login page at `/` authenticates against seeded users in `store.ts`
- User roles: `student`, `teacher`, `admin`
- Auth state persists across refresh using `localStorage`

### Role behavior
- Students see dashboard, simulations, assignments, tests, analytics, feedback, leaderboard
- Teachers and admins see the same plus live class and face enrollment launch buttons
- Admins also see user management and deletion controls

### Data persistence
- Assignments, tests, leaderboard, notifications, feedback, summaries are persisted using `localStorage`
- Session analytics data is saved under `cc-session-stats`
- Face descriptors are saved under `cc-face-profiles`

---

## Feasibility study for `main_iip_app`

The current repository is a strong prototype for a classroom assistant, but it is not yet a packaged desktop application. A new desktop product called `main_iip_app` should be designed around a robust local architecture with dedicated camera ingestion, analytics services, and secure storage.

### Feasibility assessment

| Requested feature | Feasible | Notes |
|---|---|---|
| Attendance tracking from classroom cameras | Yes, with caveats | Feasible using face detection/recognition and enrollment; accuracy depends on camera quality, lighting, occlusion, and enrollment coverage |
| Long-term student identification | Moderate | Can be achieved with face descriptors and identity matching, but not guaranteed under masks or extreme angles |
| Temporary occlusion handling | Moderate | Possible with temporal tracking and re-identification, but edge cases will fail |
| Head orientation / rough attention | Possible | Head pose estimation from landmarks can infer rough orientation; not precise gaze direction |
| Eye direction estimation | Limited | Standard classroom webcams produce noisy gaze estimates; treat as heuristic |
| Looking at teacher/desk/windows | Estimate only | These should be reported as probabilistic observations, not certainties |
| Attention score generation | Possible | Use combined face, expression, and engagement heuristics, but accuracy is context-sensitive |
| Social interaction frequency | Possible at a basic level | Use speaker diarization and proximity; friend inference is speculative |
| Seating analysis and correlations | Possible | Correlations can be computed, but causality is not guaranteed |
| Seating optimization engine | Feasible | Generate candidate seating plans using attention and interaction constraints |
| Voice command support | Yes | Browser or desktop speech recognition can support commands like “Generate optimal seating plan” |
| Behavioral analytics reports | Yes | Statistical summaries and time-series charts are feasible |

### Realistic vs. speculative capabilities

- **Realistic**: attendance marking, session summaries, basic attention metrics, participation counts, AI-assisted tutoring, seating plan optimization based on known metrics.
- **Estimate-only**: eye gaze direction, exact teacher-facing behavior, friendship probability, speaker identity from camera alone.
- **Unreliable from camera footage alone**: whether a student is actually paying attention to learning content, exact conversational sentiment, private relationships, cognitive state.

### Scientific validation and limitations

- **Attendance**: high reliability when faces are enrolled and cameras cover the classroom; reduce error with multiple cameras and identity verification.
- **Gaze/attention**: head orientation and eye direction are noisy; use as soft signals rather than hard labels.
- **Social graphs**: camera/audio co-occurrence can show who speaks near whom, but not true friendship or social affinity.
- **Seating correlations**: valid as descriptive analytics, but not as proof of causation.
- **Failure modes**:
  - poor lighting or motion blur
  - occluded faces or face coverings
  - privacy objections and consent issues
  - model bias across skin tones, ages, and camera angles
  - audio crosstalk and unreliable speech diarization

### Privacy, ethical, and bias considerations

- Student and teacher video/audio capture requires explicit consent.
- Avoid using the system for punitive surveillance.
- Store sensitive biometric data locally and securely.
- Build transparency into the UI: allow review, correction, and deletion of face data.
- Document bias risks and avoid claims of psychological inference.
- Use attention metrics only as guidance, not evaluation.

---

## Proposed architecture for `main_iip_app`

A robust desktop architecture should include the following layers:

1. **Desktop UI Layer**
   - Electron/Tauri or native desktop wrapper
   - React-based interface for dashboard, analytics, seating, and reports
   - Local route handling and secure storage

2. **Camera Ingestion Service**
   - Captures video streams from classroom cameras
   - Normalizes resolution and frame rate
   - Provides frames to vision services

3. **Face Recognition Service**
   - Detects faces and computes descriptors
   - Matches against enrolled students
   - Handles identity tracking across frames

4. **Pose/Gaze Estimation Service**
   - Estimates head orientation and eye direction
   - Produces coarse attention direction labels
   - Detects looking-at-teacher / looking-away events as probabilities

5. **Speaker Identification Service**
   - Uses audio capture and diarization
   - Detects speaking events and maps them to students/teacher
   - Optionally uses Deepgram or local transcription

6. **Analytics Engine**
   - Aggregates attendance, attention, participation, social, and seating data
   - Computes time-series metrics, class averages, and correlations
   - Stores results in a local database

7. **Seating Optimization Engine**
   - Accepts constraints and objective weights
   - Generates candidate seat plans to improve attention and reduce chatter
   - Exposes voice command triggers for plan generation

8. **Reporting and Visualization**
   - Generates dashboards, heatmaps, scorecards, and exportable summaries
   - Supports interactive exploration and comparison

9. **Voice Command Service**
   - Recognizes commands like “Generate optimal seating plan”
   - Maps natural language to app actions

10. **Persistence Layer**
    - SQLite or local JSON/IndexedDB store
    - Stores enrolled profiles, attendance logs, session analytics, seating maps, and options

### Component details

#### Desktop Application Shell
- Responsibilities: wrap the web UI, access local devices, manage lifecycle
- Inputs: user interactions, env config, local data
- Outputs: polished desktop app experience, launchable across OSes
- Dependencies: Electron/Tauri, Node runtime, React
- Scalability: one instance manages one classroom; can support local multi-camera input

#### Camera Ingestion Service
- Responsibilities: ingest live classroom feeds, pre-process frames
- Inputs: camera devices or IP cameras
- Outputs: normalized frame streams for vision services
- Dependencies: OpenCV, Media APIs, hardware drivers
- Scalability: support multiple cameras and asynchronous capture

#### Face Recognition Service
- Responsibilities: identify enrolled students, track presence
- Inputs: video frames, enrolled face database
- Outputs: face IDs, bounding boxes, confidence scores
- Dependencies: face-api.js, ONNX, TensorFlow.js, local model assets
- Scalability: moderate; more cameras require more compute

#### Pose Estimation Service
- Responsibilities: estimate head orientation and gaze direction
- Inputs: face landmarks, video frames
- Outputs: attention direction labels, head pose scores
- Dependencies: MediaPipe Face Mesh, pose models
- Scalability: compute-heavy but manageable on modern desktops

#### Speaker Identification Service
- Responsibilities: transcribe audio, detect who speaks
- Inputs: microphone stream, optional Deepgram API
- Outputs: speaker activity timeline, transcript
- Dependencies: Deepgram, Web Speech API, browser audio APIs
- Scalability: dependent on audio stream quality and service limits

#### Analytics Engine
- Responsibilities: compute attendance, attention, social, seating metrics
- Inputs: detection streams, speech events, session metadata
- Outputs: dashboards, reports, correlation scores
- Dependencies: data persistence layer, numeric libraries
- Scalability: can aggregate large session logs with moderate CPU usage

#### Seating Optimization Engine
- Responsibilities: generate seating plans using learned signals
- Inputs: student metrics, friend groups, seat map
- Outputs: candidate seat assignments and score comparisons
- Dependencies: optimization algorithms, constraint solver
- Scalability: small classrooms are easy; large classes need more optimization time

#### Reporting System
- Responsibilities: visualize metrics, export summaries
- Inputs: analytics results, session history
- Outputs: charts, graphs, PDF/CSV exports
- Dependencies: charting libraries, UI components
- Scalability: UI only, scalable to many sessions

---

## Implementation roadmap for `main_iip_app`

### Phase 1: Foundation and validation
1. Set up desktop shell using Electron or Tauri.
2. Migrate the current Next.js UI patterns into the desktop app.
3. Implement local storage persistence with SQLite or JSON stores.
4. Create secure env config support; remove hardcoded keys.
5. Validate camera capture and build a simple face detection prototype.

### Phase 2: Attendance and identity
1. Build face enrollment flow and local descriptor storage.
2. Implement real-time face detection and matching for attendance.
3. Add identity tracking and present/absent reporting.
4. Test across lighting conditions and multiple face angles.

### Phase 3: Attention and engagement
1. Add head pose and facial expression estimation.
2. Create attention scoring heuristics.
3. Build dashboard metrics for class-level and student-level attention.
4. Validate with ground-truth classroom observation if available.

### Phase 4: Audio and interaction analytics
1. Integrate speech transcription (Deepgram / browser STT).
2. Add speaking event detection and participation counts.
3. Prototype social interaction inference from speaker co-occurrence.
4. Add simple friend/interaction heatmap visualizations.

### Phase 5: Seating analysis and optimization
1. Build seat map editor and student-seat mapping.
2. Correlate attention/interaction with seating positions.
3. Implement optimization algorithm for seating plans.
4. Add voice command support for plan generation.

### Phase 6: Reporting and validation
1. Add report export and session history navigation.
2. Define validation tests for attendance and attention metrics.
3. Document privacy, consent, and ethical guardrails.
4. Harden the app for real-world classroom use.

---

## Risks and mitigation

- **Hardware variability**: test on multiple cameras and classrooms.
- **Privacy concerns**: obtain consent, provide opt-out, minimize biometric storage.
- **Model bias**: validate on diverse faces and lighting conditions.
- **Audio reliability**: support fallback browser recognition when Deepgram is unavailable.
- **Security**: remove hardcoded keys and keep secrets in `.env`.

---

## Notes for immediate work

- The current primary codebase is a web prototype, not a desktop app.
- `index.html` / `app.js` contain legacy demo logic and hardcoded API keys; this is a security issue.
- Focus the first desktop design on a clean separation between UI, camera ingestion, analytics, and persistence.
- Start with the existing Next.js page structure as a UX reference, but do not treat the current localStorage-only store as the final architecture.

---

## How to run the existing app

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open the app at `http://localhost:3000`

For the legacy standalone demo, open `index.html` in a browser, but be aware that it contains hardcoded API keys and does not use the same authenticated Next.js app.
