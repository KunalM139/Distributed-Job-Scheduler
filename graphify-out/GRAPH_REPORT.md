# 📊 Graph Analysis Report

**Root:** `.`

## Summary

| Metric | Value |
|--------|-------|
| Nodes | 197 |
| Edges | 188 |
| Communities | 42 |
| Hyperedges | 0 |

### Confidence Breakdown

| Level | Count | Percentage |
|-------|-------|------------|
| EXTRACTED | 155 | 82.4% |
| INFERRED | 33 | 17.6% |
| AMBIGUOUS | 0 | 0.0% |

## 🌟 God Nodes (Most Connected)

| Node | Degree | Community |
|------|--------|-----------|
| worker | 0 | – |
| DashboardPage | 0 | – |
| App | 0 | – |
| log() | 0 | – |
| QueueDetailPage | 0 | – |
| AuthContext | 0 | – |
| queueController | 0 | – |
| jobController | 0 | – |
| JobDetailModal | 0 | – |
| QueuesPage | 0 | – |

## 🔮 Surprising Connections

- **src_controllers_jobcontroller_js_createjob** → **src_controllers_jobcontroller_js_verifyqueueaccess** (calls)
- **src_controllers_jobcontroller_js_listjobs** → **src_controllers_jobcontroller_js_verifyqueueaccess** (calls)
- **src_controllers_jobcontroller_js_getjob** → **src_controllers_jobcontroller_js_verifyjobaccess** (calls)
- **src_controllers_jobcontroller_js_retryjob** → **src_controllers_jobcontroller_js_verifyjobaccess** (calls)
- **src_controllers_jobcontroller_js_deletejob** → **src_controllers_jobcontroller_js_verifyjobaccess** (calls)

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

### Community 1 — DashboardPage (17 nodes, cohesion: 0.12)

- DashboardPage
- DashboardPage()
- ../components/StatusBadge/StatusBadge
- ../hooks/usePolling/usePolling
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

### Community 2 — App (14 nodes, cohesion: 0.14)

- App
- App()
- ./components/Layout/Layout
- ./components/ProtectedRoute/ProtectedRoute
- ./pages/DashboardPage/DashboardPage
- ./pages/DeadLetterPage/DeadLetterPage
- ./pages/LoginPage/LoginPage
- ./pages/QueueDetailPage/QueueDetailPage
- ./pages/QueuesPage/QueuesPage
- ./pages/RegisterPage/RegisterPage
- ./pages/WorkersPage/WorkersPage
- react-router-dom/Navigate
- react-router-dom/Route
- react-router-dom/Routes

### Community 3 — QueueDetailPage (11 nodes, cohesion: 0.18)

- QueueDetailPage
- ../components/JobDetailModal/JobDetailModal
- ../components/StatusBadge/StatusBadge
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

### Community 5 — queueController (9 nodes, cohesion: 0.39)

- queueController
- createQueue()
- getOwnedQueue()
- getQueueStats()
- listQueues()
- pauseQueue()
- resumeQueue()
- updateQueue()
- verifyProjectOwnership()

### Community 6 — QueuesPage (8 nodes, cohesion: 0.25)

- QueuesPage
- ../components/StatusBadge/StatusBadge
- react-hot-toast/toast
- react-router-dom/Link
- react/useEffect
- react/useState
- ../services/api/api
- QueuesPage()

### Community 7 — main (8 nodes, cohesion: 0.25)

- main
- ./App/App
- ./context/AuthContext/AuthProvider
- ./index.css
- react-dom/client/createRoot
- react-hot-toast/Toaster
- react-router-dom/BrowserRouter
- react/StrictMode

### Community 8 — JobDetailModal (8 nodes, cohesion: 0.29)

- JobDetailModal
- fmt()
- ../components/StatusBadge/StatusBadge
- react/useEffect
- react/useState
- ../services/api/api
- InfoItem()
- JobDetailModal()

### Community 9 — jobController (8 nodes, cohesion: 0.43)

- jobController
- createJob()
- deleteJob()
- getJob()
- listJobs()
- retryJob()
- verifyJobAccess()
- verifyQueueAccess()

### Community 10 — DeadLetterPage (7 nodes, cohesion: 0.29)

- DeadLetterPage
- DeadLetterPage()
- react-hot-toast/toast
- react/useCallback
- react/useEffect
- react/useState
- ../services/api/api

### Community 11 — LoginPage (7 nodes, cohesion: 0.29)

- LoginPage
- ../context/AuthContext/useAuth
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useNavigate
- react/useState
- LoginPage()

### Community 12 — RegisterPage (7 nodes, cohesion: 0.29)

- RegisterPage
- ../context/AuthContext/useAuth
- react-hot-toast/toast
- react-router-dom/Link
- react-router-dom/useNavigate
- react/useState
- RegisterPage()

### Community 13 — usePolling (6 nodes, cohesion: 0.33)

- usePolling
- react/useCallback
- react/useEffect
- react/useRef
- react/useState
- usePolling()

### Community 14 — Layout (6 nodes, cohesion: 0.33)

- Layout
- ../context/AuthContext/useAuth
- react-router-dom/NavLink
- react-router-dom/Outlet
- react/useState
- Layout()

### Community 15 — WorkersPage (6 nodes, cohesion: 0.33)

- WorkersPage
- ../components/StatusBadge/StatusBadge
- ../hooks/usePolling/usePolling
- react/useState
- ../services/api/api
- WorkersPage()

### Community 16 — ProtectedRoute (4 nodes, cohesion: 0.50)

- ProtectedRoute
- ../context/AuthContext/useAuth
- react-router-dom/Navigate
- ProtectedRoute()

### Community 17 — projectController (4 nodes, cohesion: 0.50)

- projectController
- createProject()
- deleteProject()
- listProjects()

### Community 18 — vite.config (4 nodes, cohesion: 0.50)

- vite.config
- @tailwindcss/vite/tailwindcss
- vite/defineConfig
- @vitejs/plugin-react/react

### Community 19 — dlqController (3 nodes, cohesion: 0.67)

- dlqController
- listDLQ()
- retryDLQ()

### Community 20 — authController (3 nodes, cohesion: 0.67)

- authController
- login()
- register()

### Community 21 — validate (3 nodes, cohesion: 1.00)

- validate
- errorResponse()
- validate()

### Community 22 — workerController (3 nodes, cohesion: 0.67)

- workerController
- getWorker()
- listWorkers()

### Community 23 — auth (2 nodes, cohesion: 1.00)

- auth
- authenticate()

### Community 24 — api (2 nodes, cohesion: 1.00)

- api
- axios/axios

### Community 25 — StatusBadge (2 nodes, cohesion: 1.00)

- StatusBadge
- StatusBadge()

### Community 26 — statsController (2 nodes, cohesion: 1.00)

- statsController
- getDashboardStats()

### Community 27 — auth (1 nodes, cohesion: 1.00)

- auth

### Community 28 — auth.test (1 nodes, cohesion: 1.00)

- auth.test

### Community 29 — workers (1 nodes, cohesion: 1.00)

- workers

### Community 30 — jobs (1 nodes, cohesion: 1.00)

- jobs

### Community 31 — dlq (1 nodes, cohesion: 1.00)

- dlq

### Community 32 — setup (1 nodes, cohesion: 1.00)

- setup

### Community 33 — worker.test (1 nodes, cohesion: 1.00)

- worker.test

### Community 34 — projects (1 nodes, cohesion: 1.00)

- projects

### Community 35 — jobs.test (1 nodes, cohesion: 1.00)

- jobs.test

### Community 36 — queues (1 nodes, cohesion: 1.00)

- queues

### Community 37 — queue.test (1 nodes, cohesion: 1.00)

- queue.test

### Community 38 — stats (1 nodes, cohesion: 1.00)

- stats

### Community 39 — server (1 nodes, cohesion: 1.00)

- server

### Community 40 — index (1 nodes, cohesion: 1.00)

- index

### Community 41 — jest.config (1 nodes, cohesion: 1.00)

- jest.config

## 🕳️ Knowledge Gaps

**Isolated nodes** (15):
- jest.config
- server
- index
- auth
- dlq
- jobs
- projects
- queues
- stats
- workers
- auth.test
- jobs.test
- queue.test
- setup
- worker.test

**Thin communities** (< 3 nodes): 19 communities

## 💰 Token Cost

| File | Tokens |
|------|--------|
| input | 0 |
| output | 0 |
| **Total** | **0** |

## ❓ Suggested Questions

1. Can you verify the inferred relationships of 'log()' (degree 12)?
1. What role does 'jobs.test' play? It has no connections in the graph.
1. What role does 'stats' play? It has no connections in the graph.
1. What role does 'setup' play? It has no connections in the graph.
1. What role does 'index' play? It has no connections in the graph.
1. What role does 'auth' play? It has no connections in the graph.
1. What role does 'queue.test' play? It has no connections in the graph.

---
_Generated by graphify-rs_
