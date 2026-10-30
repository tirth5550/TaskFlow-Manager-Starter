const assert = require("assert");

const isValidTaskTitle = (title) =>
  typeof title === "string" && title.trim().length > 0;

const isValidPriority = (priority) =>
  ["High", "Medium", "Low"].includes(priority);

const isValidStatus = (status) =>
  ["Pending", "In Progress", "Completed"].includes(status);

// Task title validation
assert.strictEqual(isValidTaskTitle("Prepare presentation"), true);
assert.strictEqual(isValidTaskTitle(" "), false);
assert.strictEqual(isValidTaskTitle(""), false);
assert.strictEqual(isValidTaskTitle(123), false);

// Priority and status validation
assert.strictEqual(isValidPriority("High"), true);
assert.strictEqual(isValidPriority("Urgent"), false);
assert.strictEqual(isValidStatus("Completed"), true);
assert.strictEqual(isValidStatus("Started"), false);

console.log("All TaskFlow validation tests passed!");
