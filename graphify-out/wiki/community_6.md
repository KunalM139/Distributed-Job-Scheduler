# Community 6: queueController

**Members:** 9

## Nodes

- **queueController** (`backend_src_controllers_queuecontroller_js`, File, degree: 8)
- **createQueue()** (`backend_src_controllers_queuecontroller_js_createqueue`, Function, degree: 2)
- **getAccessibleQueue()** (`backend_src_controllers_queuecontroller_js_getaccessiblequeue`, Function, degree: 5)
- **getQueueStats()** (`backend_src_controllers_queuecontroller_js_getqueuestats`, Function, degree: 2)
- **listQueues()** (`backend_src_controllers_queuecontroller_js_listqueues`, Function, degree: 2)
- **pauseQueue()** (`backend_src_controllers_queuecontroller_js_pausequeue`, Function, degree: 2)
- **resumeQueue()** (`backend_src_controllers_queuecontroller_js_resumequeue`, Function, degree: 2)
- **updateQueue()** (`backend_src_controllers_queuecontroller_js_updatequeue`, Function, degree: 2)
- **verifyProjectAccess()** (`backend_src_controllers_queuecontroller_js_verifyprojectaccess`, Function, degree: 3)

## Relationships

- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_getaccessiblequeue (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_verifyprojectaccess (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_listqueues (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_createqueue (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_updatequeue (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_pausequeue (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_resumequeue (defines)
- backend_src_controllers_queuecontroller_js → backend_src_controllers_queuecontroller_js_getqueuestats (defines)
- backend_src_controllers_queuecontroller_js_listqueues → backend_src_controllers_queuecontroller_js_verifyprojectaccess (calls)
- backend_src_controllers_queuecontroller_js_createqueue → backend_src_controllers_queuecontroller_js_verifyprojectaccess (calls)
- backend_src_controllers_queuecontroller_js_updatequeue → backend_src_controllers_queuecontroller_js_getaccessiblequeue (calls)
- backend_src_controllers_queuecontroller_js_pausequeue → backend_src_controllers_queuecontroller_js_getaccessiblequeue (calls)
- backend_src_controllers_queuecontroller_js_resumequeue → backend_src_controllers_queuecontroller_js_getaccessiblequeue (calls)
- backend_src_controllers_queuecontroller_js_getqueuestats → backend_src_controllers_queuecontroller_js_getaccessiblequeue (calls)

