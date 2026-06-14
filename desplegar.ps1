param(
    [string]$EnvFile = (Join-Path $PSScriptRoot 'deploy.local.env')
)

$ErrorActionPreference = 'Stop'

function Load-EnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

Load-EnvFile -Path $EnvFile

$ftpHost = if ($env:FTP_HOST) { $env:FTP_HOST } else { 'ftp.awardspace.net' }
$ftpUser = $env:FTP_USER
$ftpPass = $env:FTP_PASS
$remoteRoot = if ($env:FTP_REMOTE) { $env:FTP_REMOTE } else { '/www/goyito.atwebpages.com/public_html' }
$distPath = Join-Path $PSScriptRoot 'dist'

if (-not $ftpUser -or -not $ftpPass) {
    throw 'Faltan credenciales FTP. Crea deploy.local.env con FTP_USER y FTP_PASS.'
}
if (-not (Test-Path $distPath)) {
    throw 'No existe dist/. Ejecuta npm run build primero.'
}

function Invoke-FtpRequest {
    param(
        [string]$Uri,
        [string]$Method,
        [byte[]]$Body = $null
    )

    $request = [System.Net.FtpWebRequest]::Create($Uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $request.Method = $Method
    $request.UseBinary = $true
    $request.UsePassive = $true
    $request.KeepAlive = $false

    if ($Body) {
        $request.ContentLength = $Body.Length
        $stream = $request.GetRequestStream()
        $stream.Write($Body, 0, $Body.Length)
        $stream.Close()
    }

    $response = $request.GetResponse()
    $response.Close() | Out-Null
}

function Ensure-FtpDirectory {
    param([string]$RemotePath)

    $parts = ($RemotePath.Trim('/') -split '/')
    $current = ''
    foreach ($part in $parts) {
        $current += "/$part"
        try {
            Invoke-FtpRequest -Uri "ftp://$ftpHost$current/" -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)
        } catch {
            if ($_.Exception.Message -notmatch '550') { throw }
        }
    }
}

function Upload-File {
    param(
        [string]$LocalFile,
        [string]$RemoteFile
    )

    $remoteDir = [System.IO.Path]::GetDirectoryName($RemoteFile).Replace('\', '/')
    if ($remoteDir) {
        Ensure-FtpDirectory -RemotePath $remoteDir
    }

    $bytes = [System.IO.File]::ReadAllBytes($LocalFile)
    Invoke-FtpRequest -Uri "ftp://$ftpHost$RemoteFile" -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile) -Body $bytes
    Write-Host "Subido: $RemoteFile"
}

Write-Host "Compilando..."
Push-Location $PSScriptRoot
npm run build | Out-Host
Pop-Location

Write-Host "Subiendo dist a ftp://$ftpHost$remoteRoot ..."
$files = Get-ChildItem -Path $distPath -Recurse -File
foreach ($file in $files) {
    $relative = $file.FullName.Substring($distPath.Length).Replace('\', '/')
    Upload-File -LocalFile $file.FullName -RemoteFile "$remoteRoot$relative"
}

Write-Host 'Despliegue completado: https://goyito.atwebpages.com'
