import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

console.log("🚀 Building TransitOS for DigitalPlat VistaPanel...");

// 1. Run standard Vite / Nitro build
execSync("npm run build", { stdio: "inherit" });

const outDir = path.resolve(process.cwd(), "digitalplat-vistapanel-package");
const distDir = path.resolve(process.cwd(), "dist");

// 2. Prepare folder
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 3. Copy static assets
console.log("📦 Copying compiled assets and icons...");
execSync(`cp -r ${distDir}/assets ${outDir}/`);
for (const f of ["favicon.ico", "logo.svg", "robots.txt", "site.webmanifest"]) {
  const src = path.join(distDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, f));
  }
}

// 4. Generate index.html from SSR renderer
console.log("🌐 Generating index.html shell...");
const ssrMod = await import(`${distDir}/_worker.js/_ssr/ssr.mjs`);
const res = await ssrMod.default.fetch(new Request("http://localhost/login"));
const html = await res.text();
fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");

// 5. Create Apache .htaccess
console.log("⚙️  Creating Apache .htaccess for VistaPanel...");
const htaccessContent = `# Apache Configuration for DigitalPlat / VistaPanel Shared Hosting
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve existing files/directories directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Route all other URLs to index.html for SPA client routing
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>
`;
fs.writeFileSync(path.join(outDir, ".htaccess"), htaccessContent, "utf-8");

// 6. Create zip bundle
console.log("🗜️  Creating digitalplat-htdocs.zip archive...");
execSync(`cd "${outDir}" && zip -r ../digitalplat-htdocs.zip ./* .htaccess && cd ..`, {
  stdio: "inherit",
});

console.log("✅ DigitalPlat VistaPanel package ready!");
console.log(`📁 Files directory: ${outDir}`);
console.log(`📦 Zip archive: ${path.resolve(process.cwd(), "digitalplat-htdocs.zip")}`);
