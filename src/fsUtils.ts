import { promisify } from "util";
import fs from "fs";

export const readFile = promisify(fs.readFile);

export async function readJson<T>(path: string): Promise<T> {
  const json = await readFile(path, 'utf-8');
  return JSON.parse(json);
}
