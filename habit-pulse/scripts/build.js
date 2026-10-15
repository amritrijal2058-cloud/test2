const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const f of ['index.html', 'app.js']) {
  fs.copyFileSync(path.join(root, 'src', f), path.join(www, f));
}
fs.copyFileSync(
  path.join(root, 'node_modules', 'lucide', 'dist', 'umd', 'lucide.min.js'),
  path.join(www, 'lucide.min.js')
);
execSync('npx tailwindcss -c tailwind.config.js -i src/input.css -o www/styles.css --minify', {
  cwd: root,
  stdio: 'inherit',
});
console.log('Built www/');
