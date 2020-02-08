import path from 'path';

export function getDirName(filePath: string) {
  const { dir } = path.parse(filePath);
  return dir;
}

export function getFileName(filePath: string) {
  const { dir, name } = path.parse(filePath);
  return path.join(dir, name);
}
