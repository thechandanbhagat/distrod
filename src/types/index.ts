// @group Types : Core domain types for distrod WSL Dashboard

// @group Types > Distro : WSL distribution types
export type WslVersion = 1 | 2;

export type DistroStatus = "running" | "stopped" | "installing" | "unknown";

export interface Distro {
  name: string;
  version: WslVersion;
  status: DistroStatus;
  isDefault: boolean;
  kernelVersion?: string;
}

// @group Types > Resource : Resource monitoring types
export interface ResourceSnapshot {
  timestamp: number;
  cpuPercent: number;
  memoryRss: number;  // bytes
  memoryVsz: number;  // bytes
  diskUsed: number;   // bytes
  diskTotal: number;  // bytes
}

export interface ResourceHistory {
  distroName: string;
  snapshots: ResourceSnapshot[];
}

export interface ResourceThresholds {
  cpuPercent: number;
  memoryPercent: number;
}

// @group Types > Process : Linux process types
export interface LinuxProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
  user: string;
  command: string;
}

// @group Types > File : Filesystem types
export type FileKind = "file" | "dir" | "symlink";

export interface FsEntry {
  name: string;
  path: string;
  kind: FileKind;
  size?: number;
  permissions?: string;
  owner?: string;
  modifiedAt?: number;
  children?: FsEntry[];
}

// @group Types > Network : WSL network types
export interface NetworkInfo {
  distroName: string;
  ipAddress: string;
  gateway: string;
}

export interface PortForwardRule {
  listenAddress: string;
  listenPort: number;
  connectAddress: string;
  connectPort: number;
}

// @group Types > Snapshot : Backup/restore types
export interface Snapshot {
  id: string;
  distroName: string;
  filePath: string;
  createdAt: number;
  sizeBytes: number;
  label?: string;
}

// @group Types > Terminal : Terminal tab types
export interface TerminalTab {
  id: string;
  distroName: string;
  title: string;
}

// @group Types > Services : Systemd service record
export interface ServiceInfo {
  name: string;
  load: string;
  active: string; // "active" | "inactive" | "failed" | "activating" | ...
  sub: string;    // "running" | "exited" | "dead" | ...
  description: string;
}

// @group Types > Nginx : Nginx status snapshot
export interface NginxInfo {
  installed: boolean;
  running: boolean;
  version: string | null;
  configOk: boolean | null;
  configTestOutput: string | null;
}

// @group Types > UI : Shared UI types
export type Page =
  | "distros"
  | "resources"
  | "processes"
  | "files"
  | "terminal"
  | "network"
  | "snapshots"
  | "services"
  | "nginx"
  | "settings";
