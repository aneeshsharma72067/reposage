import { compressDiff } from '../../packages/shared/src/diffCompression';

const files = [
  {
    filename: 'src/api/user.ts',
    additions: 40,
    deletions: 5,
    patch: `
+ export function getUser() {
+   return { id: 1, name: "John" }
+ }

- export function getUser() {
-   return { id: 1 }
- }
`,
  },
  {
    filename: 'package-lock.json',
    additions: 1000,
    deletions: 1000,
    patch: 'huge lock file diff',
  },
];

const compressed = compressDiff(files);

console.log(JSON.stringify(compressed, null, 2));

