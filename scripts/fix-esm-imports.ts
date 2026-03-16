import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function walk(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) walk(full);
    else if (file.endsWith('.ts')) fixFile(full);
  }
}

function fixFile(file: string) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/from\s+['"](\.\.?\/[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js') || p1.endsWith('.ts')) return match;
    return `from '${p1}.js'`;
  });

  fs.writeFileSync(file, content);
}

walk(path.join(ROOT, 'apps'));
walk(path.join(ROOT, 'workers'));

console.log('ESM import fix complete');
