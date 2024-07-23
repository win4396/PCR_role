$txtFiles = Get-ChildItem -Filter *.txt
foreach($file in $txtFiles){
    $newName = $file.BaseName  
    Rename-Item -Path $file.FullName -NewName "$newName"  
    Write-Host "Renamed $($file.FullName) to $newName"  
}  