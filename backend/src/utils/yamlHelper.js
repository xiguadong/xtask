import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

export function readYaml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

export function writeYaml(filePath, data) {
  fs.writeFileSync(filePath, yaml.dump(data), 'utf8');
}
