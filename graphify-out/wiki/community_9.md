# Community 9: jobController

**Members:** 8

## Nodes

- **jobController** (`src_controllers_jobcontroller_js`, File, degree: 7)
- **createJob()** (`src_controllers_jobcontroller_js_createjob`, Function, degree: 2)
- **deleteJob()** (`src_controllers_jobcontroller_js_deletejob`, Function, degree: 2)
- **getJob()** (`src_controllers_jobcontroller_js_getjob`, Function, degree: 2)
- **listJobs()** (`src_controllers_jobcontroller_js_listjobs`, Function, degree: 2)
- **retryJob()** (`src_controllers_jobcontroller_js_retryjob`, Function, degree: 2)
- **verifyJobAccess()** (`src_controllers_jobcontroller_js_verifyjobaccess`, Function, degree: 4)
- **verifyQueueAccess()** (`src_controllers_jobcontroller_js_verifyqueueaccess`, Function, degree: 3)

## Relationships

- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_verifyqueueaccess (defines)
- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_verifyjobaccess (defines)
- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_createjob (defines)
- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_listjobs (defines)
- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_getjob (defines)
- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_retryjob (defines)
- src_controllers_jobcontroller_js → src_controllers_jobcontroller_js_deletejob (defines)
- src_controllers_jobcontroller_js_createjob → src_controllers_jobcontroller_js_verifyqueueaccess (calls)
- src_controllers_jobcontroller_js_listjobs → src_controllers_jobcontroller_js_verifyqueueaccess (calls)
- src_controllers_jobcontroller_js_getjob → src_controllers_jobcontroller_js_verifyjobaccess (calls)
- src_controllers_jobcontroller_js_retryjob → src_controllers_jobcontroller_js_verifyjobaccess (calls)
- src_controllers_jobcontroller_js_deletejob → src_controllers_jobcontroller_js_verifyjobaccess (calls)

