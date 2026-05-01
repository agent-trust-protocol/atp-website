import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';

const execAsync = promisify(exec);

async function checkNodeVersion(): Promise<{ status: 'pass' | 'warn' | 'fail'; output: string; detail: string }> {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.replace('v', '').split('.')[0], 10);
    if (major >= 18) {
      return { status: 'pass', output: `node --version → ${version}`, detail: `Detected: ${version}` };
    }
    return {
      status: 'fail',
      output: `node --version → ${version}`,
      detail: `Detected: ${version} — need ≥ 18`
    };
  } catch {
    return { status: 'fail', output: 'node --version → command not found', detail: 'Node.js not found in PATH' };
  }
}

async function checkNpm(): Promise<{ status: 'pass' | 'warn' | 'fail'; output: string; detail: string }> {
  try {
    const { stdout } = await execAsync('npm --version');
    return { status: 'pass', output: `npm --version → ${stdout.trim()}`, detail: `npm ${stdout.trim()} found` };
  } catch {
    return { status: 'fail', output: 'npm --version → command not found', detail: 'npm not found in PATH' };
  }
}

async function checkPort(port: number): Promise<{ status: 'pass' | 'warn' | 'fail'; output: string; detail: string }> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve({
        status: 'warn',
        output: `Port ${port} → in use`,
        detail: `Port ${port} is already occupied`
      });
    });
    server.once('listening', () => {
      server.close();
      resolve({
        status: 'pass',
        output: `lsof -i :${port} → (no output — port is free)`,
        detail: `Port ${port} is free`
      });
    });
    server.listen(port, '127.0.0.1');
  });
}

export async function GET() {
  const [node, npm, port] = await Promise.all([
    checkNodeVersion(),
    checkNpm(),
    checkPort(3456)
  ]);

  const checks = [
    { id: 'node', label: 'Node.js ≥ 18', ...node },
    { id: 'npm', label: 'npm available', ...npm },
    { id: 'port', label: 'Port 3456 free', ...port }
  ];

  return NextResponse.json({ checks });
}
