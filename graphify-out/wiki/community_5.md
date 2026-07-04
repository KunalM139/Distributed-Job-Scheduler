# Community 5: queueController

**Members:** 9

## Nodes

- **queueController** (`src_controllers_queuecontroller_js`, File, degree: 8)
- **createQueue()** (`src_controllers_queuecontroller_js_createqueue`, Function, degree: 2)
- **getOwnedQueue()** (`src_controllers_queuecontroller_js_getownedqueue`, Function, degree: 5)
- **getQueueStats()** (`src_controllers_queuecontroller_js_getqueuestats`, Function, degree: 2)
- **listQueues()** (`src_controllers_queuecontroller_js_listqueues`, Function, degree: 2)
- **pauseQueue()** (`src_controllers_queuecontroller_js_pausequeue`, Function, degree: 2)
- **resumeQueue()** (`src_controllers_queuecontroller_js_resumequeue`, Function, degree: 2)
- **updateQueue()** (`src_controllers_queuecontroller_js_updatequeue`, Function, degree: 2)
- **verifyProjectOwnership()** (`src_controllers_queuecontroller_js_verifyprojectownership`, Function, degree: 3)

## Relationships

- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_getownedqueue (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_verifyprojectownership (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_listqueues (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_createqueue (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_updatequeue (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_pausequeue (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_resumequeue (defines)
- src_controllers_queuecontroller_js → src_controllers_queuecontroller_js_getqueuestats (defines)
- src_controllers_queuecontroller_js_listqueues → src_controllers_queuecontroller_js_verifyprojectownership (calls)
- src_controllers_queuecontroller_js_createqueue → src_controllers_queuecontroller_js_verifyprojectownership (calls)
- src_controllers_queuecontroller_js_updatequeue → src_controllers_queuecontroller_js_getownedqueue (calls)
- src_controllers_queuecontroller_js_pausequeue → src_controllers_queuecontroller_js_getownedqueue (calls)
- src_controllers_queuecontroller_js_resumequeue → src_controllers_queuecontroller_js_getownedqueue (calls)
- src_controllers_queuecontroller_js_getqueuestats → src_controllers_queuecontroller_js_getownedqueue (calls)

