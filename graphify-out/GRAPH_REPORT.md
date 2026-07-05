# 📊 Graph Analysis Report

**Root:** `.`

## Summary

| Metric | Value |
|--------|-------|
| Nodes | 254 |
| Edges | 229 |
| Communities | 58 |
| Hyperedges | 0 |

### Confidence Breakdown

| Level | Count | Percentage |
|-------|-------|------------|
| EXTRACTED | 196 | 85.6% |
| INFERRED | 33 | 14.4% |
| AMBIGUOUS | 0 | 0.0% |

## 🌟 God Nodes (Most Connected)

| Node | Degree | Community |
|------|--------|-----------|
| DashboardPage | 0 | – |
| worker | 0 | – |
| App | 0 | – |
| log() | 0 | – |
| QueueDetailPage | 0 | – |
| AuthContext | 0 | – |
| DeadLetterPage | 0 | – |
| QueuesPage | 0 | – |
| main | 0 | – |
| SocketContext | 0 | – |

## 🔮 Surprising Connections

- **backend_src_controllers_jobcontroller_js_createjob** → **backend_src_controllers_jobcontroller_js_verifyqueueaccess** (calls)
- **backend_src_controllers_jobcontroller_js_listjobs** → **backend_src_controllers_jobcontroller_js_verifyqueueaccess** (calls)
- **backend_src_controllers_jobcontroller_js_getjob** → **backend_src_controllers_jobcontroller_js_verifyjobaccess** (calls)
- **backend_src_controllers_jobcontroller_js_retryjob** → **backend_src_controllers_jobcontroller_js_verifyjobaccess** (calls)
- **backend_src_controllers_jobcontroller_js_deletejob** → **backend_src_controllers_jobcontroller_js_verifyjobaccess** (calls)

## 🏘️ Communities

### Community 0 — worker (18 nodes, cohesion: 0.24)

- worker
- claimJob()
- computeNextCronRun()
- computeRetryDelay()
- executeJob()
- getWorkerId()
- log()
- onJobFailure()
- onJobSuccess()
- poll()
- processScheduledJobs()
- recoverDeadWorkerJobs()
- registerWorker()
- sendHeartbeat()
- setWorkerId()
- shutdown()
- simulateWork()
- start()

### Community 1 — DashboardPage (18 nodes, cohesion: 0.11)

- DashboardPage
- DashboardPage()
- ../components/StatusBadge/StatusBadge
- ../hooks/usePolling/usePolling
- ../hooks/useSocketEvent/useSocketEvent
- react/useState
- recharts/Bar
- recharts/BarChart
- recharts/CartesianGrid
- recharts/Legend
- recharts/Line
- recharts/LineChart
- recharts/ResponsiveContainer
- recharts/Tooltip
- recharts/XAxis
- recharts/YAxis
- ../services/api/api
- StatCard()

### Community 2 — App (15 nodes, cohesion: 0.13)

- App
- App()
- ./components/Layout/Layout
- ./components/ProtectedRoute/ProtectedRoute
- ./pages/DashboardPage/DashboardPage
- ./pages/DeadLetterPage/DeadLetterPage
- ./pages/LoginPage/LoginPage
- ./pages/ProjectsPage/ProjectsPage
- ./pages/QueueDetailPage/QueueDetailPage
- ./pages/QueuesPage/QueuesPage
- ./pages/RegisterPage/RegisterPage
- ./pages/WorkersPage/WorkersPage
- react-router-dom/Navigate
- react-router-dom/Route
- react-router-dom/Routes

### Community 3 — QueueDetailPage (12 nodes, cohesion: 0.17)

- QueueDetailPage
- ../components/JobDetailModal/JobDetailModal
- ../components/StatusBadge/StatusBadge
- ../hooks/useSocketEvent/useSocketEvent
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useParams
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api
- QueueDetailPage()

### Community 4 — AuthContext (10 nodes, cohesion: 0.20)

- AuthContext
- AuthProvider()
- react/createContext
- react-router-dom/useNavigate
- react/useCallback
- react/useContext
- react/useEffect
- react/useState
- ../services/api/api
- useAuth()

### Community 5 — DeadLetterPage (9 nodes, cohesion: 0.22)

- DeadLetterPage
- DeadLetterPage()
- ../components/AISummaryModal/AISummaryModal
- ../hooks/useSocketEvent/useSocketEvent
- react-hot-toast/toast
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api

### Community 6 — main (9 nodes, cohesion: 0.22)

- main
- ./App/App
- ./context/AuthContext/AuthProvider
- ./context/SocketContext/SocketProvider
- ./index.css
- react-dom/client/createRoot
- react-hot-toast/Toaster
- react-router-dom/BrowserRouter
- react/StrictMode

### Community 7 — SocketContext (9 nodes, cohesion: 0.22)

- SocketContext
- ./AuthContext/useAuth
- react/createContext
- react/useContext
- react/useEffect
- react/useState
- socket.io-client/io
- SocketProvider()
- useSocket()

### Community 8 — QueuesPage (9 nodes, cohesion: 0.22)

- QueuesPage
- ../components/StatusBadge/StatusBadge
- ../hooks/useSocketEvent/useSocketEvent
- react-hot-toast/toast
- react-router-dom/Link
- react/useEffect
- react/useState
- ../services/api/api
- QueuesPage()

### Community 9 — queueController (9 nodes, cohesion: 0.39)

- queueController
- createQueue()
- getAccessibleQueue()
- getQueueStats()
- listQueues()
- pauseQueue()
- resumeQueue()
- updateQueue()
- verifyProjectAccess()

### Community 10 — jobController (8 nodes, cohesion: 0.43)

- jobController
- createJob()
- deleteJob()
- getJob()
- listJobs()
- retryJob()
- verifyJobAccess()
- verifyQueueAccess()

### Community 11 — JobDetailModal (8 nodes, cohesion: 0.29)

- JobDetailModal
- fmt()
- ../components/StatusBadge/StatusBadge
- react/useEffect
- react/useState
- ../services/api/api
- InfoItem()
- JobDetailModal()

### Community 12 — LoginPage (7 nodes, cohesion: 0.29)

- LoginPage
- ../context/AuthContext/useAuth
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useNavigate
- react/useState
- LoginPage()

### Community 13 — WorkersPage (7 nodes, cohesion: 0.29)

- WorkersPage
- ../components/StatusBadge/StatusBadge
- ../hooks/usePolling/usePolling
- ../hooks/useSocketEvent/useSocketEvent
- react/useState
- ../services/api/api
- WorkersPage()

### Community 14 — RegisterPage (7 nodes, cohesion: 0.29)

- RegisterPage
- ../context/AuthContext/useAuth
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useNavigate
- react/useState
- RegisterPage()

### Community 15 — ProjectsPage (6 nodes, cohesion: 0.33)

- ProjectsPage
- react-hot-toast/toast
- react/useEffect
- react/useState
- ../services/api/api
- ProjectsPage()

### Community 16 — Layout (6 nodes, cohesion: 0.33)

- Layout
- ../context/AuthContext/useAuth
- react-router-dom/NavLink
- react-router-dom/Outlet
- react/useState
- Layout()

### Community 17 — usePolling (6 nodes, cohesion: 0.33)

- usePolling
- react/useCallback
- react/useEffect
- react/useRef
- react/useState
- usePolling()

### Community 18 — useSocketEvent (5 nodes, cohesion: 0.40)

- useSocketEvent
- ../context/SocketContext/useSocket
- react/useEffect
- react/useRef
- useSocketEvent()

### Community 19 — memberController (5 nodes, cohesion: 0.40)

- memberController
- addMember()
- listMembers()
- removeMember()
- updateMember()

### Community 20 — projectController (4 nodes, cohesion: 0.50)

- projectController
- createProject()
- deleteProject()
- listProjects()

### Community 21 — ProtectedRoute (4 nodes, cohesion: 0.50)

- ProtectedRoute
- ../context/AuthContext/useAuth
- react-router-dom/Navigate
- ProtectedRoute()

### Community 22 — socketService (4 nodes, cohesion: 0.50)

- socketService
- emit()
- getIO()
- init()

### Community 23 — vite.config (4 nodes, cohesion: 0.50)

- vite.config
- @tailwindcss/vite/tailwindcss
- vite/defineConfig
- @vitejs/plugin-react/react

### Community 24 — notifyService (3 nodes, cohesion: 0.67)

- notifyService
- start()
- stop()

### Community 25 — AISummaryModal (3 nodes, cohesion: 0.67)

- AISummaryModal
- AISummaryModal()
- react/useEffect

### Community 26 — authController (3 nodes, cohesion: 0.67)

- authController
- login()
- register()

### Community 27 — workerController (3 nodes, cohesion: 0.67)

- workerController
- getWorker()
- listWorkers()

### Community 28 — validate (3 nodes, cohesion: 1.00)

- validate
- errorResponse()
- validate()

### Community 29 — dlqController (3 nodes, cohesion: 0.67)

- dlqController
- listDLQ()
- retryDLQ()

### Community 30 — migrate (2 nodes, cohesion: 1.00)

- migrate
- run()

### Community 31 — backfill-project-members (2 nodes, cohesion: 1.00)

- backfill-project-members
- runMigration()

### Community 32 — aiSummaryService (2 nodes, cohesion: 1.00)

- aiSummaryService
- generateFailureSummary()

### Community 33 — statsController (2 nodes, cohesion: 1.00)

- statsController
- getDashboardStats()

### Community 34 — rbac (2 nodes, cohesion: 1.00)

- rbac
- requireRole()

### Community 35 — StatusBadge (2 nodes, cohesion: 1.00)

- StatusBadge
- StatusBadge()

### Community 36 — api (2 nodes, cohesion: 1.00)

- api
- axios/axios

### Community 37 — auth (2 nodes, cohesion: 1.00)

- auth
- authenticate()

### Community 38 — emitHelper (2 nodes, cohesion: 1.00)

- emitHelper
- emitEvent()

### Community 39 — rateLimiter (1 nodes, cohesion: 1.00)

- rateLimiter

### Community 40 — members (1 nodes, cohesion: 1.00)

- members

### Community 41 — jobs.test (1 nodes, cohesion: 1.00)

- jobs.test

### Community 42 — auth.test (1 nodes, cohesion: 1.00)

- auth.test

### Community 43 — worker.test (1 nodes, cohesion: 1.00)

- worker.test

### Community 44 — server (1 nodes, cohesion: 1.00)

- server

### Community 45 — setup (1 nodes, cohesion: 1.00)

- setup

### Community 46 — projects (1 nodes, cohesion: 1.00)

- projects

### Community 47 — queues (1 nodes, cohesion: 1.00)

- queues

### Community 48 — workers (1 nodes, cohesion: 1.00)

- workers

### Community 49 — stats (1 nodes, cohesion: 1.00)

- stats

### Community 50 — dlq.test (1 nodes, cohesion: 1.00)

- dlq.test

### Community 51 — jobs (1 nodes, cohesion: 1.00)

- jobs

### Community 52 — index (1 nodes, cohesion: 1.00)

- index

### Community 53 — jest.config (1 nodes, cohesion: 1.00)

- jest.config

### Community 54 — dlq (1 nodes, cohesion: 1.00)

- dlq

### Community 55 — projects.test (1 nodes, cohesion: 1.00)

- projects.test

### Community 56 — queue.test (1 nodes, cohesion: 1.00)

- queue.test

### Community 57 — auth (1 nodes, cohesion: 1.00)

- auth

## 🕳️ Knowledge Gaps

**Isolated nodes** (19):
- jest.config
- server
- index
- rateLimiter
- auth
- dlq
- jobs
- members
- projects
- queues
- stats
- workers
- auth.test
- dlq.test
- jobs.test
- projects.test
- queue.test
- setup
- worker.test

**Thin communities** (< 3 nodes): 28 communities

## 💰 Token Cost

| File | Tokens |
|------|--------|
| input | 0 |
| output | 0 |
| **Total** | **0** |

## ❓ Suggested Questions

1. Can you verify the inferred relationships of 'log()' (degree 12)?
1. What role does 'members' play? It has no connections in the graph.
1. What role does 'server' play? It has no connections in the graph.
1. What role does 'index' play? It has no connections in the graph.
1. What role does 'workers' play? It has no connections in the graph.
1. What role does 'jobs' play? It has no connections in the graph.
1. What role does 'projects' play? It has no connections in the graph.

---
_Generated by graphify-rs_
