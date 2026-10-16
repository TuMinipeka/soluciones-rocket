param(
    [string]$ListenAddress = '127.0.0.1',
    [ValidateRange(1, 65535)][int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envPath = Join-Path $repoRoot '.env'
$backendPath = Join-Path $repoRoot 'backend'
$pythonPath = Join-Path $repoRoot '.venv\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $envPath)) {
    throw 'Falta .env en la raíz del repositorio. Copia .env.example y configura las credenciales locales.'
}
if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw 'Falta .venv. Crea el entorno virtual e instala backend/requirements.txt.'
}

foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^\s*(?:#|$)') { continue }
    if ($line -notmatch '^([A-Z][A-Z0-9_]*)=(.*)$') {
        throw 'El archivo .env contiene una línea sin formato KEY=VALUE.'
    }
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
}

New-Item -ItemType Directory -Force -Path (Join-Path $backendPath 'data') | Out-Null
Push-Location $backendPath
try {
    & $pythonPath -m app.scripts.seed_demo
    if ($LASTEXITCODE -ne 0) { throw 'El SEED falló; FastAPI no se inició.' }
    & $pythonPath -m uvicorn app.main:app --host $ListenAddress --port $Port
    if ($LASTEXITCODE -ne 0) { throw 'FastAPI terminó con un error.' }
}
finally {
    Pop-Location
}
