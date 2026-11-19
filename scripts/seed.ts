/**
 * Reset demo store to seeded users + open jobs.
 * Usage: npm run seed
 */
import { resetDemoStore } from "../lib/demo/store";

const store = resetDemoStore();
console.log("Demo store reset.");
console.log(`Users: ${store.users.map((u) => u.email).join(", ")}`);
console.log(`Open jobs: ${store.jobs.length}`);
console.log("Password for all demo accounts: demo1234");
