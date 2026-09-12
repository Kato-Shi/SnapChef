/* eslint-disable @typescript-eslint/no-require-imports */
const os = require("node:os");

try {
  os.userInfo();
} catch {
  os.userInfo = () => ({
    uid: -1,
    gid: -1,
    username: process.env.USERNAME || "developer",
    homedir: process.env.USERPROFILE || process.cwd(),
    shell: process.env.COMSPEC || "cmd.exe",
  });
}
