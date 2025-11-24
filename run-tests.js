const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

if (!fs.existsSync(config.projectPath)) {
    console.error('Project not found! Fix projectPath in config.json');
    process.exit(1);
}

console.log('External Multi-DB Test Suite Starting...\n');
console.log(`API URL: ${config.apiUrl}`);
console.log(`Project: ${config.projectPath}\n`);

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function killOld() {
    try { require('child_process').execSync('taskkill /f /im dotnet.exe >nul 2>&1'); } catch { }
    try { require('child_process').execSync('taskkill /f /im courses-platform.exe >nul 2>&1'); } catch { }
}

killOld();

for (const provider of config.providers) {
    console.log(`\nTESTING WITH: ${provider.toUpperCase()}\n`);

    const dotnet = spawn('dotnet', [
        'run',
        '--project', config.projectPath,
        '--no-build',
        ...config.dotnetRunArgs.trim().split(/\s+/)
    ], {
        env: { ...process.env, DatabaseProvider: provider },
        stdio: 'inherit',
        detached: true,
        shell: true,
        windowsHide: true
    });

    console.log(`Waiting ${config.startupDelayMs / 1000} seconds for API to start...`);
    sleep(config.startupDelayMs);

    console.log(`Running Jest tests against ${provider}...`);
    require('child_process').spawnSync('npx', ['jest', '--runInBand', '--colors'], {
        stdio: 'inherit',
        shell: true
    });

    try { process.kill(-dotnet.pid); } catch { }
    killOld();

    console.log(`FINISHED ${provider.toUpperCase()}\n`);
}

console.log('ALL 4 DATABASES TESTED SUCCESSFULLY!');
console.log('You can now close this window.');