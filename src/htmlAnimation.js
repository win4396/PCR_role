let logName = [];
let maskBoolen = false;

function typeClass(type){
    if (type == 'error')
        return 'errorLog'
    if (type == 'success')
        return 'successLog'
    if (type == 'warning')
        return 'warningLog'
    else
        return ''
}

function logInfo(str,type='massage'){
    const name = 'm'+Date.now();
    logName.push(name);
    
    $('#a1').append(`<div id=${name} class='aclass ${typeClass(type)}'>${str}</div>`);
    if(!maskBoolen){
        $('#b1').removeClass('hidden');
        $('#a1').removeClass('hidden'); 
    }
    setTimeout(() => { 
        $('#'+name).addClass('aclassShow');
    }, 1); 
}

function logErrorInfo(str){
    const t = str.slice(str.indexOf('_')+1,str.lastIndexOf('.'));
    const f = str.slice(str.lastIndexOf('.')+1);
    if (f == 'json')
        return logInfo('角色信息失败','error')   
    if(f == 'png')
        return logInfo('加载材质图片失败','error')   
    if(f == 'atlas')
        return logInfo('加载材质失败','error')   
    if(t == 'COMMON_BATTLE')
        return logInfo('加载角职介动画失败','error')
    if(t == 'BATTLE')
        return logInfo('加载角色技能动画失败','error')
    if(t == 'CHARA_BASE')
        return logInfo('加载共用骨架失败','error')
    else{
        return logInfo('缺少'+str+'个额外动画','warning')
    }
}

function logClear(){
    setTimeout(() => {  
        $('#b1').addClass('hidden');
    }, 0);
    setTimeout(() => {   
        logName.forEach((i) => {
            $('#'+i).removeClass('aclassShow');
            
        }); 
        setTimeout(() => {  
            logName = [];
            $('#a1').empty();    
            $('#a1').addClass('hidden'); 
        }, 600); 
    }, 800); 
    
}


