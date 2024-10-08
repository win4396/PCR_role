
function loadFile(srcH,srcL,loadType,progress){
    return new Promise((resolve,reject)=>{
        const xhr = new XMLHttpRequest();
        // console.log(loadType,src)
        xhr.open('GET','data/'+srcH+srcL,true);
        if(loadType) xhr.responseType = loadType;
        if(progress) xhr.onprogress = progress;
        xhr.onload = function(){
            if(xhr.status == 200){
                resolve(xhr.response);
            }
            else{
                const errorInfo = {
                    error:xhr.status,
                    fileName:srcL
                }
                reject(errorInfo);
            }
        }
        xhr.onerror = function(){
            reject();
        }
        
        xhr.send();
    })
}

let allAtlasData = {};
let allBattleData = {};
let allWeaponData = {};
let allTexture2DData = {};
let allCharaBaseData = {};
let allCSpecialData = {};


function processData(srcH,srcL,data){
    const t = srcL.slice(0,6);
    if(srcH == 'atlas/'){
        allAtlasData[t] = data;
    }
    else if(srcH == 'battle/'){
        allBattleData[t] = sliceCyspAnimation(data);
    }
    else if(srcH == 'special/'){
        const s = srcL.slice(srcL.indexOf('_')+1,srcL.lastIndexOf('.'));
        if(s == 'CHARA_BASE'){
            allCharaBaseData[t] = sliceCyspAnimation(data,true);
        }
        else if(s == 'COMMON_BATTLE'){
            allWeaponData[t] = sliceCyspAnimation(data);
        }
        else{         
            if(allCSpecialData[t] === undefined){
                allCSpecialData[t] = {};
            }
            allCSpecialData[t][s] = sliceCyspAnimation(data);   
        }
    }
    else if(srcH == 'common_battle/'){
        const f = srcL.slice(0,srcL.indexOf('_'));
        allWeaponData[f] = sliceCyspAnimation(data);
    }
    else if(srcH == 'texture2D/'){
        allTexture2DData[t] = data;
    }
}


function getType(str){
    const last = str.lastIndexOf('.');

    switch(str.slice(last+1)){
        case 'json':
            return 'json';
        case 'atlas':
            return 'text';
        case 'png':
            return 'blob';
        case 'cysp':
            return 'arraybuffer';
        default:
            return 'text';
    }
}

function sliceCyspAnimation(buf,chara = false){
    
    if(chara){
        return buf.slice(64);
    }
    else{
        let view = new DataView(buf);
        let count = view.getInt32(12,true);
        return {
            count:count,
            data:buf.slice((count+1)*32)
        };
    }
    
   
}



let LoadedID = [];

function doublePush(str1,str2,a,b){
    if(!LoadedID.includes(str2)){
        a.push(str1)
        b.push(str2)
        // LoadedID.push(str2)
    }
}



function charaLoad(spineGirl){
    let necessaryItem = [];
    let probablyItem = [];
    let necessarySrc = [];
    let probablySrc = [];
    let realID = String(Number(spineGirl.character) + Number(spineGirl.star)*10);
    let weaponID = spineGirl.weapon;

    doublePush('texture2D/',realID+'.png',necessarySrc,necessaryItem);
    doublePush('atlas/',realID+'.atlas',necessarySrc,necessaryItem);
        
    if(spineGirl.hasSpecialBase){  
        realID = spineGirl.character;
        // weaponID = spineGirl.character;
        doublePush('special/',weaponID +'_COMMON_BATTLE.cysp',necessarySrc,necessaryItem);  
    }
    else{
        realID = '000000';
        
        doublePush('common_battle/',weaponID +'_COMMON_BATTLE.cysp',necessarySrc,necessaryItem);
    }
    
    doublePush('battle/',spineGirl.character+'_BATTLE.cysp',necessarySrc,necessaryItem);
    doublePush('special/',realID +'_CHARA_BASE.cysp',necessarySrc,necessaryItem);
    additionAnimations.forEach((i)=>{
        doublePush('special/',realID +'_' + i +'.cysp',probablySrc,probablyItem);
    })
        
    
    return{
        necessaryItem: necessaryItem,
        necessarySrc: necessarySrc,
        probablyItem: probablyItem,
        probablySrc: probablySrc
    }
}
