import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const [tool, ...args] = process.argv.slice(2);
if (!["vinext", "vite", "capacitor"].includes(tool)) throw new Error("Unsupported tool");
const packageName = tool === "capacitor" ? "@capacitor/cli" : tool;
const packagePath = tool === "vinext"
  ? resolve(dirname(fileURLToPath(import.meta.resolve(tool))), "../package.json")
  : require.resolve(`${packageName}/package.json`);
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin[tool];
const preload = tool === "capacitor"
  ? ["--require", resolve("scripts/capacitor-os-workaround.cjs")]
  : [];
const child = spawn(process.execPath, [...preload, resolve(dirname(packagePath), bin), ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
    ...(tool === "capacitor" ? { CI: "1" } : {}),
  },
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
