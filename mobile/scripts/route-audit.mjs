import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const navigatorPath = path.join(srcRoot, "navigation", "AppNavigator.tsx");

const read = (filePath) => fs.readFileSync(filePath, "utf8");

const walk = (dir) => {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(absolute));
      continue;
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      output.push(absolute);
    }
  }
  return output;
};

const navContent = read(navigatorPath);
const screenRegex = /<Stack\.Screen\s+name="([^"]+)"/g;
const screenNames = new Set();
let screenMatch;
while ((screenMatch = screenRegex.exec(navContent))) {
  screenNames.add(screenMatch[1]);
}

const files = walk(srcRoot);
const navigationCalls = [];
const navCallRegex = /navigation\.(navigate|replace|reset)\(\s*"([^"]+)"/g;

for (const filePath of files) {
  const content = read(filePath);
  let callMatch;
  while ((callMatch = navCallRegex.exec(content))) {
    navigationCalls.push({
      filePath,
      method: callMatch[1],
      route: callMatch[2],
    });
  }
}

const unknownRoutes = navigationCalls.filter((call) => !screenNames.has(call.route));
const profileCalls = navigationCalls.filter((call) => call.route === "Profile");

console.log("Route Audit Report");
console.log("==================");
console.log(`Screens in navigator: ${screenNames.size}`);
console.log(`Navigation calls found: ${navigationCalls.length}`);
console.log(`Calls to Profile: ${profileCalls.length}`);

if (profileCalls.length > 0) {
  console.log("\nProfile navigation calls:");
  for (const call of profileCalls) {
    console.log(`- ${path.relative(projectRoot, call.filePath)} -> ${call.method}(\"${call.route}\")`);
  }
}

if (unknownRoutes.length > 0) {
  console.log("\nUnknown routes used in navigation calls:");
  for (const call of unknownRoutes) {
    console.log(`- ${path.relative(projectRoot, call.filePath)} -> ${call.method}(\"${call.route}\")`);
  }
  process.exitCode = 1;
} else {
  console.log("\nNo unknown routes found.");
}
