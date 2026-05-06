/* eslint-disable */

import type { AttributifyAttributes } from "@unocss/preset-attributify";

declare interface Window {
  // extend the window
  monaco: typeof m | undefined;
  MonacoEnvironment: Environment;
}

// File System Access API — permission methods missing from TypeScript's built-in lib
declare global {
  interface FileSystemHandle {
    queryPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
    requestPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
    keys(): AsyncIterableIterator<string>;
    entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
  }
}

declare module "*.vue" {
  import { type DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "@vue/runtime-dom" {
  interface HTMLAttributes extends AttributifyAttributes {}
}
