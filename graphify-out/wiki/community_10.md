# Community 10: jobController

**Members:** 9

## Nodes

- **jobController** (`backend_src_controllers_jobcontroller_js`, File, degree: 8)
- **createJob()** (`backend_src_controllers_jobcontroller_js_createjob`, Function, degree: 2)
- **deleteJob()** (`backend_src_controllers_jobcontroller_js_deletejob`, Function, degree: 2)
- **getJob()** (`backend_src_controllers_jobcontroller_js_getjob`, Function, degree: 2)
- **listAllJobs()** (`backend_src_controllers_jobcontroller_js_listalljobs`, Function, degree: 1)
- **listJobs()** (`backend_src_controllers_jobcontroller_js_listjobs`, Function, degree: 2)
- **retryJob()** (`backend_src_controllers_jobcontroller_js_retryjob`, Function, degree: 2)
- **verifyJobAccess()** (`backend_src_controllers_jobcontroller_js_verifyjobaccess`, Function, degree: 4)
- **verifyQueueAccess()** (`backend_src_controllers_jobcontroller_js_verifyqueueaccess`, Function, degree: 3)

## Relationships

- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_verifyqueueaccess (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_verifyjobaccess (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_createjob (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_listjobs (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_listalljobs (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_getjob (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_retryjob (defines)
- backend_src_controllers_jobcontroller_js → backend_src_controllers_jobcontroller_js_deletejob (defines)
- backend_src_controllers_jobcontroller_js_createjob → backend_src_controllers_jobcontroller_js_verifyqueueaccess (calls)
- backend_src_controllers_jobcontroller_js_listjobs → backend_src_controllers_jobcontroller_js_verifyqueueaccess (calls)
- backend_src_controllers_jobcontroller_js_getjob → backend_src_controllers_jobcontroller_js_verifyjobaccess (calls)
- backend_src_controllers_jobcontroller_js_retryjob → backend_src_controllers_jobcontroller_js_verifyjobaccess (calls)
- backend_src_controllers_jobcontroller_js_deletejob → backend_src_controllers_jobcontroller_js_verifyjobaccess (calls)

