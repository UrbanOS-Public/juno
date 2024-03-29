import * as path from "path";
import { readFileSync } from "fs";
import { ITerraformDependable } from "cdktf";

export type DependsOn = { dependsOn: ITerraformDependable[] };

export const loadFileContentsAsString = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath)).toString();

export const replaceAll = (
  string: string,
  find: string,
  replacement: string
) => {
  return string.replace(new RegExp(find, "g"), replacement);
};
