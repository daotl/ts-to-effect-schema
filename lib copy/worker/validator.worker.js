"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const threads_1 = require("threads");
const validateGeneratedTypes_1 = require("../core/validateGeneratedTypes");
/**
 * Expose validateGeneratedTypes as a worker
 */
(0, threads_1.expose)(validateGeneratedTypes_1.validateGeneratedTypes);
//# sourceMappingURL=validator.worker.js.map