import path from 'path'; import fs from 'fs'; import { v4 as uuid } from 'uuid';
export function localUpload(file) { const ext = path.extname(file.originalname || '.jpg'); const name = `${uuid()}${ext}`; const target = path.join(process.cwd(), 'server', 'uploads', name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.renameSync(file.path, target); return `/uploads/${name}`; }
