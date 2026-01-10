import {
  existsSync,
  readdirSync,
  statSync,
  rmSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
} from "fs";
import { join, dirname } from "path";

const packagesToClean = ["@restorio/ui", "@restorio/types", "@restorio/api-client", "@restorio/auth"];

const nodeModulesPath = join(process.cwd(), "node_modules");

for (const packageName of packagesToClean) {
  const packagePath = join(nodeModulesPath, packageName);

  if (!existsSync(packagePath)) {
    continue;
  }

  const distPath = join(packagePath, "dist");
  const packageJsonPath = join(packagePath, "package.json");

  const filesToKeep = new Set<string>(["package.json", "node_modules"]);

  const copyRecursive = (src: string, dest: string): void => {
    let actualSrc = src;

    try {
      const srcStat = lstatSync(src);
      if (srcStat.isSymbolicLink()) {
        actualSrc = realpathSync(src);
      }
    } catch {}

    const srcStat = statSync(actualSrc);

    if (srcStat.isDirectory()) {
      if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true });
      }
      const entries = readdirSync(actualSrc);
      for (const entry of entries) {
        copyRecursive(join(actualSrc, entry), join(dest, entry));
      }
    } else {
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(actualSrc, dest);
    }
  };

  if (existsSync(distPath)) {
    let actualDistPath = distPath;
    try {
      const distStat = lstatSync(distPath);
      if (distStat.isSymbolicLink()) {
        actualDistPath = realpathSync(distPath);
      }
    } catch {}

    const distEntries = readdirSync(actualDistPath);

    for (const entry of distEntries) {
      const sourcePath = join(actualDistPath, entry);
      const targetPath = join(packagePath, entry);

      if (existsSync(targetPath)) {
        rmSync(targetPath, { recursive: true, force: true });
      }

      copyRecursive(sourcePath, targetPath);
      filesToKeep.add(entry);
    }

    rmSync(distPath, { recursive: true, force: true });
  }

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    if (packageJson.main && packageJson.main.startsWith("./dist/")) {
      packageJson.main = packageJson.main.replace("./dist/", "./");
    }
    if (packageJson.module && packageJson.module.startsWith("./dist/")) {
      packageJson.module = packageJson.module.replace("./dist/", "./");
    }
    if (packageJson.types && packageJson.types.startsWith("./dist/")) {
      packageJson.types = packageJson.types.replace("./dist/", "./");
    }
    if (packageJson.exports) {
      if (typeof packageJson.exports === "object" && packageJson.exports["."]) {
        const mainExport = packageJson.exports["."];
        if (typeof mainExport === "object") {
          if (mainExport.types && mainExport.types.startsWith("./dist/")) {
            mainExport.types = mainExport.types.replace("./dist/", "./");
          }
          if (mainExport.import && mainExport.import.startsWith("./dist/")) {
            mainExport.import = mainExport.import.replace("./dist/", "./");
          }
          if (mainExport.require && mainExport.require.startsWith("./dist/")) {
            mainExport.require = mainExport.require.replace("./dist/", "./");
          }
          if (mainExport.default && mainExport.default.startsWith("./dist/")) {
            mainExport.default = mainExport.default.replace("./dist/", "./");
          }
        }
      }
    }

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  }

  const entries = readdirSync(packagePath);

  for (const entry of entries) {
    if (filesToKeep.has(entry)) {
      continue;
    }

    const entryPath = join(packagePath, entry);
    const stats = statSync(entryPath);
    if (stats.isDirectory() || stats.isFile()) {
      rmSync(entryPath, { recursive: true, force: true });
    }
  }
}
