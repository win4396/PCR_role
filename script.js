let classMap;
let myCanvas;
let num = 0;
let gifLoaded = false;
let blob;
const skeletonList = $('#skeletonList');
const loadSkeleton = $('#loadSkeleton');
const charaList = $('#charaList');
const classList = $('#classList');
const inputview = $('#inputview');
const toggleButton =  document.getElementById("toggleButton");
const topBox = document.getElementById("topBox");
const setting = document.getElementsByClassName("setting")[0];
const viewRect = document.getElementById("viewRect");

const outStopRule = [
    'idle',
    'idol',
    'jigi',
    '_run',
    'rpet',
    'uper',
    'loop',
];

function createTag(e,t,n){
    if(e === 'text')
        return document.createTextNode(t);
    let r = document.createElement(e);
    for(let i in t){
        if ("style" === i) 
            for (let a in t.style) 
                r.style[a] = t.style[a];
        else
            r.setAttribute(i,t[i]);
    }
    if(n) 
        r.appendChild(n);
    return r;
}

function weaponCalc(str){
    return str.length < 2 ? '0'+ str : str;
}

function removeStar(num){
    let str = String(num);
    const t = str.lastIndexOf('1')-1;
    return [num - Number(str[t])*10 + '',str.slice(t,t+1)];
}

function viewDataUpdate(){
    myCanvas.camera.viewRectData = [viewRect.offsetLeft,viewRect.offsetTop,viewRect.offsetWidth,viewRect.offsetHeight];
    $("#advWidth").val(viewRect.offsetWidth);
    $("#advHeight").val(viewRect.offsetHeight);
}

function loadAnimation(num,f){
    const select = $('#charaSpan'+num);
    select.empty();
    [
        ['闲置', 'idle'],
        ['准备', 'standBy'],
        ['走', 'walk'],
        ['跑', 'run'],
        ['跑（入场）', 'run_gamestart'],
        ['落地', 'landing'],
        ['攻击', 'attack'],
        ['攻击（扫荡）', 'attack_skipQuest'],
        ['庆祝-短', 'joy_short,hold,joy_short_return'],
        ['庆祝-长', 'joy_long,hold,joy_long_return'],
        ['受伤', 'damage'],
        ['死亡', 'die,stop'],
        ['合作-准备', 'multi_standBy'],
        ['合作-闲置', 'multi_idle_standBy'],
        ['合作-闲置（无武器）', 'multi_idle_noWeapon']
    ].forEach((i)=>{
        select.append(createTag('option',{value: i[1]},createTag('text',i[0])));
    })
    select.append(createTag('option',{value:'', disabled:''},createTag('text','---')));
    f.forEach((i)=>{
        i = i.name;
        if(!/^\d{6}_/.test(i)) return;
        let val = i;
        if(!/skill/.test(i) && /^\d{6}_/.test(i)) {
            if(outStopRule.indexOf(i.slice(i.length-4)) == -1) 
                val = i+',stop';
        }
              
        select.append(createTag('option',{value: val},
            createTag('text',i.replace(/\d{6}_skill(.+)/, '技能$1').replace(/\d{6}_joyResult/, '庆祝-角色特有'))));
    });
}

function animationQueueReset(order){
    [...spineGirl[order].nowQueue]= spineGirl[order].animationQueue;
    let a = spineGirl[order].nowQueue;
    
    if (a[0] == 'multi_standBy') {
        a.push('multi_idle_standBy');
    } 
    else if([
        'multi_idle_standBy', 
        'multi_idle_noWeapon',
        'idle', 
        'walk',
        'run', 
        'run_gamestart'
    ].indexOf(a[0]) == -1){
        if(outStopRule.indexOf(a[0].slice(a[0].length-4)) == -1)
                a.push('idle');   
    }
    let nextAnim = a.shift();
    if(!/^\d{6}/.test(nextAnim))
        nextAnim = spineGirl[order].weapon +'_'+ nextAnim;
    // spineGirl[num].animationQueue = a;
    spineGirl[order].spine.state.setAnimation(0, nextAnim, !a.length);
}

function changeClassList(weapon){
    let t = false;
   classList.find('option').each(function(){
       if($(this).val() == weapon){
           t = true;
           return false;
       }
   })
   if(!t){
       classList.append(createTag('option',{value: weapon},createTag('text',weapon )));
   }
   classList.val(weapon);
}

function searchClasses(query){
    
    let results = [];
    $('#star-box').empty();
    $('#results').remove();  
    for(let key in classMap){
        if(classMap[key].chinese_name.includes(query)){
            if((classMap[key].type != 0 && classMap[key].place != 0)|| classMap[key].hasSpecialBase)
                results.push({id:key,...classMap[key]})
        }
    }
    if(results.length === 0)    return;
    
    let offest = $('#search-box').offset();
    // $('#viewRect').after(`<div class='get' id="results" style='top:${offest.top+20}px;left:${offest.left}px;'></div>`)
    $('#viewRect').after(createTag('div',{class:'get',id:'results',style:{top:offest.top+20+'px',left:offest.left+'px'}})).queue(function(next){
        results.forEach(function(item) {    
            $('#results').append(createTag('div',{class:'show','data-val':item.id,'data-has6':item.hasRarity6},createTag("text",item.chinese_name)));  
            
        });
        $('#results').on('click','.show',function(event){
            resultDisplay($(event.currentTarget))
        });
        next();  
    })
    
}

function resultDisplay($eve){
    $('#search-box').val($eve.text());
    const val = $eve.data('val') | 0;
    if($eve.data('has6'))    $('#star-box').append(`<option value= ${val + 60}>6★</option>`);
        $('#star-box').append(`<option value= ${val + 30}>3★</option>`);
    $('#star-box').append(`<option value= ${val + 10}>1★</option>`);
    
    changeClassList(classMap[val].type);
    $('#results').remove();    
}

function appendCharaDiv(num,str){
    let a = `<div id = chara${num}>
        <span class="head-style">
        <span class = "charaSpanTitle" id = "charaSpanTitle${num}">${num+1}:${str}:</span><select class = "charaSpanSelect" id = "charaSpan${num}" title="动画列表"></select>
        <span>同步:</span><input type="checkbox" class="checkbox" data-id ="${num}a">
        <input type="button" class="button1" id = "charaButton${num}" value="播放" data-id ="${num}b" > 
        <span> X:</span><input type="number" value = "0" class="inputNumber" data-id ="${num}x">
        <span> Y:</span><input type="number" value = "0" class="inputNumber" data-id ="${num}y">
        <span>镜像:</span><input type="checkbox" class="checkbox" data-id ="${num}c">
        <span>翻转:</span><input type="checkbox" class="checkbox" data-id ="${num}d">  
        <span>去阴影:</span><input type="checkbox" class="checkbox" data-id ="${num}f">  
        <input type="button" class="button1" value="删除" data-id ="${num}e" > 
        </span></div>`;
    if(!document.getElementById("charaDiv").childNodes.length){
        $('#charaDiv').append(a);
        return;
    }
    for(let i of spineGirl){ 
        if(i != {}){
            if(i.order == num - 1){
                $('#chara'+i.order).after(a);
                return;
            }
            else if(i.order > num){
                $('#chara'+i.order).before(a);
                return;
            }  
        }
    }
    $('#charaDiv').append(a);
}

$('#charaDiv').on('click','div span input[type="button"]',function(){
    const id = $(this).data('id');
    const num = id.slice(0,1);
    const type = id.slice(1);

    
    if(type === 'e'){
        const renum = Number(num) + 1;
        charaList.find('option[value='+renum+']').text(renum+'');
        spineGirl[num] = {};
        $('#chara'+num).remove();
    }
    else if(type === 'b'){      
        if('control' in spineGirl[num] && spineGirl[num].control.ready === true){
            const select = $('#charaSpan'+num);
               
            if(spineGirl[num].control.sync){
                myCanvas.camera.pause = true;
                spineGirl.forEach((i) => {
                    if('control' in i && i.control.ready && i.control.sync ){
                        const k = $('#charaSpan'+i.order).val();
                        i.selected.animation = k;
                        i.animationQueue = k.split(',');    
                        animationQueueReset(i.order);   
                    }
                });
                myCanvas.camera.pause = false;
            }
            else {
                const k = select.val();
                spineGirl[num].selected.animation = k;
                spineGirl[num].animationQueue = k.split(','); 
                animationQueueReset(num);  
            }   
        }
    }

        
})
$('#charaDiv').on('change','div span input[type="checkbox"]',function(){
    const id = $(this).data('id');
    const num = id.slice(0,1);
    const type = id.slice(1);
    const val = $(this).prop('checked');
    if(type === 'a'){
        spineGirl[num].control.sync = val;
    }
    else if(type === 'c'){
        spineGirl[num].control.flipX = val;
    }
    else if(type === 'd'){
        spineGirl[num].control.flipY = val;
    }
    else if(type === 'f'){
        spineGirl[num].control.shadow = val;
    }
})
$('#charaDiv').on('change','div span input[type="number"]',function(){
    const id = $(this).data('id');
    const num = id.slice(0,1);
    const type = id.slice(1);
    const val = Number($(this).val());
    if(type === 'x'){
        spineGirl[num].control.x = val;
    }
    else if(type === 'y'){
        spineGirl[num].control.y = val;
    }
})

charaList.on('change',function(){
    num = charaList.val() - 1;
    myCanvas.nowCharacter = num;
})


skeletonList.on('change',function(){
    let [character,] = removeStar(skeletonList.val());
    changeClassList(classMap[character].type);
})


loadSkeleton.on('click',async function(){

    const str = inputview.prop('checked') ? $("#star-box").val() : skeletonList.val();
    const [character,star] = removeStar(str);
    const characterMap = classMap[character];
    let weapon = characterMap.hasSpecialBase ? character : weaponCalc(classList.val());
    let t = spineGirl[num];
    let characterName;
    if('control' in t && t.control.ready === true){
        if(character === t.character && star === t.star && weapon === t.weapon)
            return;
        if(t != {})
            t.control.ready = false;
    }
    if(inputview.prop('checked'))
        characterName = $('#star-box').find(':selected').text()+characterMap.chinese_name;
    else
        characterName = skeletonList.find(':selected').text();
    charaList.find(':selected').text(characterName);
    spineGirl[num] ={
        order: num,
        character :character,
        characterName: characterName,
        weapon:weapon,
        star:star,
        spine_scale:0.4,
        spine:'',
        hasSpecialBase:characterMap.hasSpecialBase, 
        animationQueue:['idle'],
        nowQueue:[],
        control:{
            ready:false,
            flipX:false,
            flipY:false,
            sync:false,
            shadow:0,
            visable:-1,
            x:0,
            y:0,
        },
        selected:{
            class:classList.val(),
            animation:'idle'
        },
    };
    
    t = spineGirl[num];
    
    const errorInfo = {
        errorType: false,
        errorFileName: ''  
    }

    let c1 = charaLoad(t);
    
    if(c1.necessaryItem.length || c1.probablyItem.length){
        logInfo('加载主要文件...');
        let promises = c1.necessaryItem.map((i,e) =>      
            loadFile(c1.necessarySrc[e],i,getType(i))
            .then((data)=>{
                processData(c1.necessarySrc[e],i,data);
                LoadedID.push(i);
            })
        );    
        await Promise.all(promises).then(()=>{
            logInfo('加载次要文件...');
        })
        .catch((error)=>{
            errorInfo.errorType = true;
            errorInfo.errorFileName = error.fileName;
        })
        .finally(()=>{
            if(errorInfo.errorType){
                logErrorInfo(errorInfo.errorFileName);
                logClear();
                return;
            }  
        }); 

        promises = c1.probablyItem.map((i,e) =>    
            loadFile(c1.probablySrc[e],i,getType(i))
            .then((data)=>{
                processData(c1.probablySrc[e],i,data);
                LoadedID.push(i);
            })              
        );
        await Promise.allSettled(promises).then((result)=>{
            if(result.some((i)=>{return i.status == 'rejected'})){
                let cnt = 0;
                result.forEach((i,e)=>{
                    if(i.status == 'rejected'){
                        // console.log(c1.probablyItem[e]);
                        cnt ++;
                    }
                });
                logErrorInfo(cnt+'');
            }else
                logInfo('加载成功','success');   
            
        });

    }
    await loadSpineGirl(t,myCanvas).then(
        (data)=>{
            
            t.spine = data;    
            // t.spine.skeleton.x = -120 * t.order;
            // t.control.x = t.spine.skeleton.x;
            // t.control.y = t.spine.skeleton.y;
            

            if($('#chara'+num).length){
                $('#charaSpanTitle'+num).text(num+1+":"+characterName+":");
                $('#chara'+num+' span input[type="checkbox"]').trigger('change');
                $('#chara'+num+' span input[type="number"]').trigger('change');
            }
            else
                appendCharaDiv(num,characterName);
            loadAnimation(num,t.spine.state.data.skeletonData.animations);  
            t.control.ready = true;

    });
    //  console.log(t);
    logClear();
    
});


const resizeObserver = new ResizeObserver((entries)=>{
    for (let entry of entries) {  
        // //console.log('元素的高度变化:', entry.contentRect.height);  
        // viewportWidth = window.innerWidth;
        toggleButton.style.left = (window.innerWidth - toggleButton.offsetWidth)/2+ "px";
        if(toggleButton.style.top != "0px"){
            toggleButton.style.top = topBox.offsetHeight  + "px"; 
        }
        else{
            topBox.style.top = "-" + topBox.offsetHeight + "px"; 
        }
    }  
}).observe(topBox);

$("#toggleButton").on("click",function(){
    if(this.style.top != "0px"){
        topBox.style.top = "-" + this.style.top; 
        this.style.top = "0px";   
        this.textContent = "\u25BC";   
        $('#results').addClass('hidden');
    }
    else{
        this.style.top = topBox.style.top.replace(/^\-/, '');
        topBox.style.top = "0px";
        this.textContent = "\u25B2";   
        $('#results').removeClass('hidden');
    }
});

$("#bg-color").on('input', function (event) {
    let newcolor = event.target.value;
    newcolor = newcolor.replace('#', '');    
    // if(newcolor.length != 6)    return;
    newcolor = parseInt(newcolor,16);
    myCanvas.bgColor.R = (newcolor >>> 16 & 0xFF) / 255;
    myCanvas.bgColor.G = (newcolor >>> 8 & 0xFF) / 255;
    myCanvas.bgColor.B = (newcolor  & 0xFF) / 255;
});

inputview.on("change",function () {
    $("#search-box").toggleClass('hidden');
    $("#star-box").toggleClass('hidden');
    skeletonList.toggleClass("hidden");
    $('#results').toggleClass('hidden');
    if ($(this).prop("checked")){   
        classList.val(myCanvas.switchClassList.after ? myCanvas.switchClassList.after:'0');
    }
    else{
        classList.val(myCanvas.switchClassList.before? myCanvas.switchClassList.before:'0');
    }
})

classList.on("change",function(){
    if(inputview.prop('checked'))   myCanvas.switchClassList.after = $(this).val();
    else                            myCanvas.switchClassList.before = $(this).val();
})

$('#speedList').on('change',function(){
    let value = parseFloat($('#speedList')[0].value);
    if(!isNaN(value))  (myCanvas.camera.speed = value);
})

$('#search-box').on('input',function(){
    let query = $(this).val(); 
    if (query.trim() !== '') {  
        searchClasses(query);  
    }else {  
        $('#results').remove();
    }  
});

$('#advImgNameInput').on('input',function(){
    myCanvas.customName = $(this).val(); 
 
});

$('#unfold').on('click',function(){
    $(this).toggleClass('hidden');
    $('#animationControlPanel').toggleClass('collapsed');
    $('#animationControlPanel').children().each(function(){
        $(this).toggleClass('hidden');
    });
    if($('#downloadGIF').hasClass('hidden') && (!$('#advOptionBox').hasClass('hidden'))){
        $('#advOption').prop('checked',false);
        $('#advOption').trigger('change');
    }
});


$("#viewRange").on("change",function () {
    const t = myCanvas.camera.viewRectTemp;
    const f = myCanvas.camera.viewRectData;
    
    t.sizing = $(this).prop('checked'); 
    $("#viewRect").css("visibility",t.sizing ? "visible":"hidden");
    $("#advWidth").prop("disabled",!t.sizing);
    $("#advHeight").prop("disabled",!t.sizing);
    $("#advWidth").val(f[2]);
    $("#advHeight").val(f[3]);
});


// 拖拽事件
$("#viewRect").on("mousedown touchstart",function(event){
    if(myCanvas.camera.viewRectTemp.moving) return;

    let offsetX,offsetY,input;
    if(event.type === 'touchstart')
        input = event.touches[0];
    else
        input = event;
    
    offsetX = input.clientX - viewRect.offsetLeft;
    offsetY = input.clientY - viewRect.offsetTop;
    function handleMouseMove(event) {
        event.preventDefault(); // 阻止页面滚动  
        if(event.type === 'touchmove')
            $("#viewRect").css({"left":(event.touches[0].clientX - offsetX) +"px",
                                "top":(event.touches[0].clientY - offsetY) +"px"});
        else
            $("#viewRect").css({"left":(event.clientX - offsetX) +"px",
                                "top":(event.clientY - offsetY) +"px"});
    }
    function handleMouseUp() {
        viewDataUpdate();
        if(event.type === 'touchstart'){
            document.removeEventListener("touchmove",handleMouseMove);
            document.removeEventListener("touchend",handleMouseUp);
        }
        else{
            document.removeEventListener("mousemove",handleMouseMove);
            document.removeEventListener("mouseup",handleMouseUp);
        }
    }
    
    if(event.type === 'touchstart'){
        document.addEventListener("touchmove",handleMouseMove);
        document.addEventListener("touchend",handleMouseUp);
    }
    else{
        document.addEventListener('mousemove', handleMouseMove);  
        document.addEventListener("mouseup",handleMouseUp);
    }
});

// 缩放事件
$("#viewRectResize").on("mousedown touchstart",function (event) {
    const viewRectTemp = myCanvas.camera.viewRectTemp;
    
    viewRectTemp.moving = true;
    if(event.type === 'touchstart')
        myCanvas.camera.viewRectData = [event.touches[0].clientX,event.touches[0].clientY,viewRect.offsetWidth,viewRect.offsetHeight];
    else 
        myCanvas.camera.viewRectData = [event.clientX,event.clientY,viewRect.offsetWidth,viewRect.offsetHeight];
    function handleMouseMove(event){
        const viewRectData = myCanvas.camera.viewRectData;
        if(!viewRectTemp.moving)    return;
        event.preventDefault(); // 阻止页面滚动  
        let dx,dy;
        if(event.type === 'touchmove'){
            dx = event.touches[0].clientX - viewRectData[0];
            dy = event.touches[0].clientY - viewRectData[1];
        }
        else{
            dx = event.clientX - viewRectData[0];
            dy = event.clientY - viewRectData[1];
        }
 
        $("#viewRect").css({"width":(dx + viewRectData[2]) +"px",
                            "height":(dy + viewRectData[3]) +"px"});
        $("#advWidth").val(viewRect.offsetWidth);
        $("#advHeight").val(viewRect.offsetHeight);
    }
    function handleMouseUp() {
        viewRectTemp.moving = false;
        viewDataUpdate();
        if(event.type === 'touchstart'){
            document.removeEventListener("touchmove",handleMouseMove);
            document.removeEventListener("touchend",handleMouseUp);
        }
        else{
            document.removeEventListener("mousemove",handleMouseMove);
            document.removeEventListener("mouseup",handleMouseUp);
        }
    }
    if(event.type === 'touchstart'){
        document.addEventListener("touchmove",handleMouseMove);
        document.addEventListener("touchend",handleMouseUp);
    }
    else{
        document.addEventListener('mousemove', handleMouseMove);  
        document.addEventListener("mouseup",handleMouseUp);
    }
});

$("#animationControlPanel").on("mousedown touchstart",function(event){
    let offsetX,offsetY,input;
    if(event.type === 'touchstart')
        input = event.touches[0];
    else
        input = event;
    offsetX = input.clientX - setting.getBoundingClientRect().left;
    offsetY = input.clientY - setting.getBoundingClientRect().top;
    function handleMouseMove(event) {
        if(event.type === 'touchmove')
            $(".setting").css({"left":(event.touches[0].clientX - offsetX) +"px",
                "top":(event.touches[0].clientY - offsetY) +"px"});
        else
            $(".setting").css({"left":(event.clientX - offsetX) +"px",
                                "top":(event.clientY - offsetY) +"px"}); 
    }
    function handleMouseUp() {
        if(event.type === 'touchstart'){
            document.removeEventListener("touchmove",handleMouseMove);
            document.removeEventListener("touchend",handleMouseUp);
        }
        else{
            document.removeEventListener("mousemove",handleMouseMove);
            document.removeEventListener("mouseup",handleMouseUp);
        }
    }
    
    if(event.type === 'touchstart'){
        document.addEventListener("touchmove",handleMouseMove);
        document.addEventListener("touchend",handleMouseUp);
    }
    else{
        document.addEventListener('mousemove', handleMouseMove);  
        document.addEventListener("mouseup",handleMouseUp);
    }
});

$("#advWidth").on('input',function(){
    $("#viewRect").css("width",$(this).val() +"px");
});
$("#advHeight").on('input',function(){
    $("#viewRect").css("height",$(this).val() +"px");
});

$("#advOption").on("change",function(){
    $("#advOptionBox").toggleClass('hidden');
});
$("#advImgNameCKBox").on("change",function(){
    $("#advImgNameInput").prop("disabled",!this.checked);
});
$("#gifWorkers").on("change",function(){
    $("#name01").text($(this).val());
});
$("#gifQuality").on("change",function(){
    $("#name02").text($(this).val());
});
$("#gifFrame").on("change",function(){
    $("#name03").text($(this).val());
});
$("#gifDelay").on("change",function(){
    $("#name04").text($(this).val());
});
$("#acp_up").on("click",function () {
    myCanvas.camera.acp.top += 10;
}); 
$("#acp_down").on("click",function () {
    myCanvas.camera.acp.bottom += 10;
}); 
$("#acp_left").on("click",function () {
    myCanvas.camera.acp.left += 10;
}); 
$("#acp_right").on("click",function () {
    myCanvas.camera.acp.right += 10;
}); 
$("#acp_zoomup").on("click",function () {
    const t = myCanvas.camera.acp;
    if(t.scale < 19)  t.scale ++;     
}); 
$("#acp_zoomdown").on("click",function () { 
    const t = myCanvas.camera.acp;
    if(t.scale > -19) t.scale --;
}); 
$("#acp_movereset").on("click",function () {
    const t = myCanvas.camera.acp;
    t.top = 0;
    t.left = 0;
    t.bottom = 0;
    t.right = 0;
});
$("#acp_zoomreset").on("click",function () {
    const t = myCanvas.camera.acp;
    t.scale = 0;
}); 

$("#downloadImg").on("click",function () {
    myCanvas.isScreenShot = true;     
}); 

$("#viewbackground").on("change",function () {
    myCanvas.viewBg = $(this).prop('checked');   
}); 

$("#downloadGIF").on("click", async function(){

    if(!gifLoaded){
        logInfo('加载GIF文件...');
        let x = new Promise((resolve,reject)=>{
            const xhr = new XMLHttpRequest();
            // console.log(loadType,src)
            xhr.open('GET','https://cdn.bootcdn.net/ajax/libs/gif.js/0.2.0/gif.worker.js',true);
            xhr.responseType = 'blob';
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
        }).then((data)=>{
            blob = data;
        });

        await Promise.all([import("https://cdn.bootcdn.net/ajax/libs/gif.js/0.2.0/gif.js"),x]).then((result)=>{
            gifLoaded = true;
            logClear();
        }).catch((error)=>{
            logInfo('加载失败,刷新试试?','error');
            setTimeout(() => {  
                logClear();
            }, 300);
            return;
        });     
    }
    
    if('control' in spineGirl[num] && spineGirl[num].control.ready === true){
        let w,h;
        createPngCanvas(myCanvas.camera);
        if(myCanvas.camera.viewRectTemp.sizing){
            
            w = myCanvas.camera.viewRectData[2];
            h = myCanvas.camera.viewRectData[3];
        }
        else{
            w = myCanvas.canvas.width;
            h = myCanvas.canvas.height;
            spineRole_canvas.width = w;
            spineRole_canvas.height = h;
        }
     
        myCanvas.gif = new GIF({
            workers: Number($("#gifWorkers").val()),
            quality: Number($("#gifQuality").val()),
            workerScript: URL.createObjectURL(blob),
            debug: false,
            transparent:'#000000',
            width: w,
            height: h
        });
        
        myCanvas.gifConfig.fpsInit= Number($("#gifFrame").val());    
        myCanvas.gifConfig.gifDelay= Number($("#gifDelay").val());
        console.log(myCanvas.gif);
        console.log(myCanvas.gifConfig);
        myCanvas.isDrawing = true;
        $("#charaButton"+num).trigger('click');
    }
});

$("#settingPlay").on("click", async function(){
    if('control' in spineGirl[num] && spineGirl[num].control.ready)
        $("#charaButton"+num).trigger('click');
})

$("#charaSub").on("click",function(){
    const len = charaList.find('option').length;
    
    charaList.prop('selectedIndex',((num === 0 ? len  : num) - 1)%len);
    charaList.trigger('change');
})

$("#charaAdd").on("click",function(){
    const len = charaList.find('option').length;
    
    charaList.prop('selectedIndex',(num+1)%len);
    charaList.trigger('change');
})

$("#canvasOpacity").on("change",function(){
    let opacity = $(this).val();
    if(opacity>100) opacity = 100;
    if(opacity<0) opacity = 0;

    myCanvas.bgColor.A = (100-opacity)/100;
    console.log(myCanvas.bgColor);
    
})

$('#bgMode input[name="gender"]').on("change",function(){
    $('#myImg').css("object-fit",$(this).val());
    myCanvas.bgMode = $(this).val();
})  

$("#fileInput").on("change",function(event){
    const fileInput = document.getElementById('fileInput');  
    const myImg = document.getElementById('myImg');  
    let files = event.target.files;
    if (files.length){
        const reader = new FileReader();
        reader.onload = function(e) {  
            myImg.src = e.target.result;  
            myCanvas.hasBgImg = true;
        } 
        reader.readAsDataURL(files[0]);   
    }
})

$("#upLoadImg").on("click",function(){
    $("#fileInput").trigger('click');
})

function init(){
    
    toggleButton.style.top = topBox.offsetHeight + "px";
    toggleButton.style.left = (window.innerWidth - toggleButton.offsetWidth)/2+ "px";


    myCanvas = canvasInit('canvas');
    // console.log(myCanvas);
    
    lastFrameTime = Date.now() / 1000;
    requestAnimationFrame(()=>{
        render(myCanvas);
    });
    loadFile('','classMap.json','json').then((json)=>{
        classMap = json;   
        skeletonList.children().first().remove();
        let other = '';
        Object.keys(json).forEach((i)=>{
            let name = json[i].chinese_name;
            let noAdded = json[i].type === 0 && !json[i].hasSpecialBase && json[i].place == 0;
            if(i=='190801') {
                other = '（助战）';
                skeletonList.append(createTag('option',{value: '',disabled:''},createTag('text','以下为剧情过场角色')));
            }
                
            if(noAdded)
                skeletonList.append(createTag('option',{value: '',disabled:''},createTag('text',name +other+'(未实装)')));
            else{
                skeletonList.append(createTag('option',{value: i*1+ 10},createTag('text','1★'+name+other )));
                skeletonList.append(createTag('option',{value: i*1+ 30},createTag('text','3★'+name+other )));
                if(json[i].hasRarity6)
                    skeletonList.append(createTag('option',{value: i*1+ 60},createTag('text','6★'+name )));
            }
        })
        for(let i=1;i<=6;i++)
            charaList.append(createTag('option',{value: i },createTag('text',i)));
        loadSkeleton.prop('disabled',false);

    }).catch(()=>{
        logErrorInfo('classMap.json');
    })
}

window.onload = function(){
    init();
}