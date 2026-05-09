import { relative, sep } from "node:path";

export function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function escapeRegex(char: string): string {
  return char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

export function globToRegExp(glob: string): RegExp {
  let pattern = "^";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === "*" && next === "*") {
      const after = glob[index + 2];
      if (after === "/") {
        pattern += "(?:.*/)?";
        index += 2;
      } else {
        pattern += ".*";
        index += 1;
      }
    } else if (char === "*") {
      pattern += "[^/]*";
    } else if (char === "?") {
      pattern += "[^/]";
    } else {
      pattern += escapeRegex(char ?? "");
    }
  }
  pattern += "$";
  return new RegExp(pattern);
}

export function matchesAny(relativePath: string, globs: string[]): boolean {
  const normalized = relativePath.replace(/^\.\//, "");
  return globs.some((glob) => globToRegExp(glob).test(normalized));
}

export function relativePosix(root: string, path: string): string {
  return toPosix(relative(root, path));
}
