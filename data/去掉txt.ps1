$folders = @("battle", "atlas","common_battle","special") 

foreach($folder in $folders){   
    $txtFiles = Get-ChildItem -Path ".\$folder" -Filter *.txt -Recurse
    foreach($file in $txtFiles){
        $newName = $file.BaseName  
        Rename-Item -Path $file.FullName -NewName "$newName"  
        Write-Host "Renamed $($file.FullName) to $newName"  
    } 
}
 