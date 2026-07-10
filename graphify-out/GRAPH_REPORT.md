# 📊 Graph Analysis Report

**Root:** `.`

## Summary

| Metric | Value |
|--------|-------|
| Nodes | 254 |
| Edges | 247 |
| Communities | 49 |
| Hyperedges | 0 |

### Confidence Breakdown

| Level | Count | Percentage |
|-------|-------|------------|
| EXTRACTED | 205 | 83.0% |
| INFERRED | 42 | 17.0% |
| AMBIGUOUS | 0 | 0.0% |

## 🌟 God Nodes (Most Connected)

| Node | Degree | Community |
|------|--------|-----------|
| DashboardPage | 0 | – |
| worker | 0 | – |
| App | 0 | – |
| log() | 0 | – |
| emitWorkerEvent() | 0 | – |
| QueueDetailPage | 0 | – |
| QueuesPage | 0 | – |
| JobsPage | 0 | – |
| AuthContext | 0 | – |
| main | 0 | – |

## 🔮 Surprising Connections

- **backend_src_controllers_jobcontroller_js_createjob** → **backend_src_controllers_jobcontroller_js_verifyqueueaccess** (calls)
- **backend_src_controllers_jobcontroller_js_listjobs** → **backend_src_controllers_jobcontroller_js_verifyqueueaccess** (calls)
- **backend_src_controllers_jobcontroller_js_getjob** → **backend_src_controllers_jobcontroller_js_verifyjobaccess** (calls)
- **backend_src_controllers_jobcontroller_js_retryjob** → **backend_src_controllers_jobcontroller_js_verifyjobaccess** (calls)
- **backend_src_controllers_jobcontroller_js_deletejob** → **backend_src_controllers_jobcontroller_js_verifyjobaccess** (calls)

## 🏘️ Communities

### Community 0 — DashboardPage (19 nodes, cohesion: 0.11)

- DashboardPage
- DashboardPage()
- ../hooks/usePolling/usePolling
- react/useRef
- react/useState
- recharts/CartesianGrid
- recharts/Cell
- recharts/Legend
- recharts/Line
- recharts/LineChart
- recharts/Pie
- recharts/PieChart
- recharts/ResponsiveContainer
- recharts/Tooltip
- recharts/XAxis
- recharts/YAxis
- ../services/api/api
- QueueStatusBadge()
- StatCard()

### Community 1 — worker (19 nodes, cohesion: 0.27)

- worker
- claimJob()
- computeNextCronRun()
- computeRetryDelay()
- emitWorkerEvent()
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

### Community 2 — App (17 nodes, cohesion: 0.12)

- App
- App()
- ./components/Layout/Layout
- ./components/ProtectedRoute/ProtectedRoute
- ./pages/CreateJobPage/CreateJobPage
- ./pages/DashboardPage/DashboardPage
- ./pages/DeadLetterPage/DeadLetterPage
- ./pages/JobsPage/JobsPage
- ./pages/LoginPage/LoginPage
- ./pages/ProjectsPage/ProjectsPage
- ./pages/QueueDetailPage/QueueDetailPage
- ./pages/QueuesPage/QueuesPage
- ./pages/RegisterPage/RegisterPage
- ./pages/WorkersPage/WorkersPage
- react-router-dom/Navigate
- react-router-dom/Route
- react-router-dom/Routes

### Community 3 — JobsPage (10 nodes, cohesion: 0.20)

- JobsPage
- ../components/JobDetailModal/JobDetailModal
- ../context/SocketContext/useSocket
- react-hot-toast/toast
- react-router-dom/Link
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api
- JobsPage()

### Community 4 — QueueDetailPage (10 nodes, cohesion: 0.20)

- QueueDetailPage
- ../components/JobDetailModal/JobDetailModal
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useParams
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api
- QueueDetailPage()

### Community 5 — AuthContext (10 nodes, cohesion: 0.20)

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

### Community 6 — QueuesPage (10 nodes, cohesion: 0.20)

- QueuesPage
- ../components/StatusBadge/StatusBadge
- ../context/SocketContext/useSocket
- react-hot-toast/toast
- react-router-dom/Link
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api
- QueuesPage()

### Community 7 — DeadLetterPage (9 nodes, cohesion: 0.22)

- DeadLetterPage
- DeadLetterPage()
- ../context/SocketContext/useSocket
- react-hot-toast/toast
- react/useCallback
- react/useEffect
- react/useMemo
- react/useState
- ../services/api/api

### Community 8 — SocketContext (9 nodes, cohesion: 0.22)

- SocketContext
- ./AuthContext/useAuth
- react/createContext
- react/useContext
- react/useEffect
- react/useState
- socket.io-client/io
- SocketProvider()
- useSocket()

### Community 9 — queueController (9 nodes, cohesion: 0.39)

- DeadLetterPage
- DeadLetterPage()
- ../components/AISummaryModal/AISummaryModal
- ../hooks/useSocketEvent/useSocketEvent
- react-hot-toast/toast
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api

### Community 10 — jobController (9 nodes, cohesion: 0.36)

- jobController
- createJob()
- deleteJob()
- getJob()
- listAllJobs()
- listJobs()
- retryJob()
- verifyJobAccess()
- verifyQueueAccess()

### Community 11 — main (9 nodes, cohesion: 0.22)

- main
- ./App/App
- ./context/AuthContext/AuthProvider
- ./context/SocketContext/SocketProvider
- ./index.css
- react-dom/client/createRoot
- react-hot-toast/Toaster
- react-router-dom/BrowserRouter
- react/StrictMode

### Community 12 — JobDetailModal (8 nodes, cohesion: 0.29)

- JobDetailModal
- fmt()
- ../components/StatusBadge/StatusBadge
- react/useEffect
- react/useState
- ../services/api/api
- InfoItem()
- JobDetailModal()

### Community 13 — projectController (8 nodes, cohesion: 0.25)

- projectController
- addMember()
- createProject()
- deleteProject()
- listMembers()
- listProjects()
- removeMember()
- updateMemberRole()

### Community 14 — ProjectsPage (8 nodes, cohesion: 0.25)

- ProjectsPage
- ../context/SocketContext/useSocket
- react-hot-toast/toast
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api
- ProjectsPage()

### Community 15 — RegisterPage (7 nodes, cohesion: 0.29)

- RegisterPage
- ../context/AuthContext/useAuth
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useNavigate
- react/useState
- RegisterPage()

### Community 16 — CreateJobPage (7 nodes, cohesion: 0.29)

- CreateJobPage
- CreateJobPage()
- react-hot-toast/toast
- react-router-dom/useNavigate
- react/useEffect
- react/useState
- ../services/api/api

### Community 17 — LoginPage (7 nodes, cohesion: 0.29)

- LoginPage
- ../context/AuthContext/useAuth
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useNavigate
- react/useState
- LoginPage()

### Community 18 — usePolling (7 nodes, cohesion: 0.29)

- usePolling
- ../context/SocketContext/useSocket
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api
- ProjectsPage()

### Community 19 — Layout (6 nodes, cohesion: 0.33)

- Layout
- ../context/AuthContext/useAuth
- react-router-dom/NavLink
- react-router-dom/Outlet
- react/useState
- Layout()

### Community 20 — WorkersPage (5 nodes, cohesion: 0.40)

- WorkersPage
- ../hooks/usePolling/usePolling
- react/useState
- usePolling()

### Community 21 — socket (4 nodes, cohesion: 0.50)

- socket
- emitEvent()
- getIo()
- initSocket()

### Community 22 — vite.config (4 nodes, cohesion: 0.50)

- vite.config
- @tailwindcss/vite/tailwindcss
- vite/defineConfig
- @vitejs/plugin-react/react

### Community 23 — ProtectedRoute (4 nodes, cohesion: 0.50)

- ProtectedRoute
- ../context/AuthContext/useAuth
- react-router-dom/Navigate
- ProtectedRoute()

### Community 24 — workerController (3 nodes, cohesion: 0.67)

- workerController
- getWorker()
- listWorkers()

### Community 25 — authController (3 nodes, cohesion: 0.67)

- authController
- login()
- register()

### Community 26 — dlqController (3 nodes, cohesion: 0.67)

- dlqController
- listDLQ()
- retryDLQ()

### Community 27 — validate (3 nodes, cohesion: 1.00)

- validate
- errorResponse()
- validate()

### Community 28 — test-worker (2 nodes, cohesion: 1.00)

- test-worker
- testWorkerFailure()

### Community 29 — api (2 nodes, cohesion: 1.00)

- dlqController
- listDLQ()
- retryDLQ()

### Community 30 — auth (2 nodes, cohesion: 1.00)

- auth
- authenticate()

### Community 31 — test-db (2 nodes, cohesion: 1.00)

- test-db
- migrate()

### Community 32 — statsController (2 nodes, cohesion: 1.00)

- statsController
- getDashboardStats()

### Community 33 — StatusBadge (2 nodes, cohesion: 1.00)

- StatusBadge
- StatusBadge()

### Community 34 — auth.test (1 nodes, cohesion: 1.00)

- emitHelper
- emitEvent()

### Community 35 — queue.test (1 nodes, cohesion: 1.00)

- worker.test

### Community 36 — server (1 nodes, cohesion: 1.00)

- server

### Community 37 — jest.config (1 nodes, cohesion: 1.00)

- jest.config

### Community 38 — dlq (1 nodes, cohesion: 1.00)

- dlq

### Community 39 — projects (1 nodes, cohesion: 1.00)

- projects

### Community 40 — jobs.test (1 nodes, cohesion: 1.00)

- jobs.test

### Community 41 — workers (1 nodes, cohesion: 1.00)

- workers

### Community 42 — worker.test (1 nodes, cohesion: 1.00)

- worker.test

### Community 43 — auth (1 nodes, cohesion: 1.00)

- auth

### Community 44 — index (1 nodes, cohesion: 1.00)

- index

### Community 45 — jobs (1 nodes, cohesion: 1.00)

- jobs

### Community 46 — stats (1 nodes, cohesion: 1.00)

- stats

### Community 47 — queues (1 nodes, cohesion: 1.00)

- queues

### Community 48 — setup (1 nodes, cohesion: 1.00)

- setup

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

**Thin communities** (< 3 nodes): 21 communities

## 💰 Token Cost

| File | Tokens |
|------|--------|
| input | 0 |
| output | 0 |
| **Total** | **0** |

## ❓ Suggested Questions

1. Can you verify the inferred relationships of 'log()' (degree 12)?
1. Can you verify the inferred relationships of 'emitWorkerEvent()' (degree 10)?
1. What role does 'server' play? It has no connections in the graph.
1. What role does 'jobs.test' play? It has no connections in the graph.
1. What role does 'stats' play? It has no connections in the graph.
1. What role does 'queue.test' play? It has no connections in the graph.
1. What role does 'dlq' play? It has no connections in the graph.

---
_Generated by graphify-rs_
