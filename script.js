let CustomName = "PcrImage";
let FormalName = '';
var bgColor = [.3, .3, .3, 1];
var acp = [0,0,0,0,0,0];
var viewrectData = [0,0,200,250];
var viewrectTemp = {moving:false,sizing:false};
var localURL = 'data/';
var looptmp = 0;
var animation_fps = 0;
//var window = this;
window.skeleton = {};

var lastFrameTime = Date.now() / 1000;
var canvas;
var shader;
var batcher;
var gl;
var mvp = new spine.webgl.Matrix4();
var skeletonRenderer;
var debugRenderer;
var debugShader;
var shapes;
var toggleButton;
var activeSkeleton = "";
var pendingAnimation = "";
var progressBar;
var classMap;
var animationQueue = [];
var loadingText = document.getElementById("loading-text");
var skeletonList = document.getElementById("skeletonList");
var classList = document.getElementById("classList");
var animationProgressBar = document.getElementById("animation-progress");
var topbox = document.getElementById("topbox");
var setting = document.getElementsByClassName("setting")[0];
var viewrect = document.getElementById("viewrect");
const footHeight = document.getElementById("foot").offsetHeight; 
const viewportHeight = window.innerHeight;  
let viewportWidth = window.innerWidth;

var firstElementChild = topbox.firstChild;
var speedFactor = 1;

let cutImg = null;//
let ctx = '';//cutImg.getContext("2d");
let gif = null;
let isDrawing = false;
let isScreenShot = false;
 
let gifConfig = {
    fpsCount: 1,
    fpsInit: 4,
    gifNext: 0,
    gifDeparted: 0,
    gifStep: 0,
    gifPage: 0,
    gifLenth: 0,
    gifDelay: 0,
    gifDrawing: false,

};
$('#speedList').change(function () {
    var value = parseFloat($('#speedList')[0].value);
    !isNaN(value) && (speedFactor = value);
});
$("#acp_up").on("click",function () {
    acp[0] += 10;
}); 
$("#acp_down").on("click",function () {
    acp[1] += 10;
}); 
$("#acp_left").on("click",function () {
    acp[2] += 10;
}); 
$("#acp_right").on("click",function () {
    acp[3] += 10;
}); 
$("#acp_zoomup").on("click",function () {
    if(acp[4] != (-16))
        acp[4] --;
}); 
$("#acp_zoomdown").on("click",function () {
    if(acp[4] != 16)
        acp[4] ++;
}); 
$("#acp_movereset").on("click",function () {
    acp.fill(0,0,4);
});
$("#acp_zoomreset").on("click",function () {
    acp.fill(0,4,6);
});  
$("#viewbackground").one("click",function () {
    alert("透明背景生成GIF会有白点   介意者慎用!");
});
$("#viewrange").on("change",function () {
    viewrectTemp.sizing = this.checked; 
    $("#viewrect").css("visibility",this.checked ? "visible":"hidden");
    $("#advWidth").prop("disabled",!viewrectTemp.sizing);
    $("#advHeight").prop("disabled",!viewrectTemp.sizing);
    $("#advWidth").val(viewrectData[2]);
    $("#advHeight").val(viewrectData[3]);
});
$("#downloadImg").on("click",function () {
    isScreenShot = true;     
}); 

$("#downloadGIF").on("click",function(){
    var w,h;
    if(viewrectTemp.sizing){
        createCutImg();
        w = viewrectData[2];
        h = viewrectData[3];
    }
    else{
        w = canvas.width;
        h = canvas.height;
    }
    
    gif = new GIF({
        workers: Number($("#gifWorkers").val()),
        quality: Number($("#gifQuality").val()),
       // workerScript:"/gif.worker.js",
        debug: false,
        width: w,
        height: h
    });
    gifConfig.fpsInit= Number($("#gifFrame").val());    
    gifConfig.gifDelay= Number($("#gifDelay").val());
    
    isDrawing = true;
    $("#setAnimation").click();
});
$("#settingplay").on("click",function(){
    $("#setAnimation").click();
});
$("#advOption").on("change",function(){
    $("#advOptionBox").css("visibility", this.checked ? "visible":"hidden");
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
const resizeObserver = new ResizeObserver((entries)=>{
    for (let entry of entries) {  
        console.log('元素的高度变化:', entry.contentRect.height);  
        viewportWidth = window.innerWidth;
        toggleButton.style.left = (viewportWidth - toggleButton.offsetWidth)/2+ "px";
        if(toggleButton.style.top != "0px"){
            toggleButton.style.top = topbox.offsetHeight  + "px"; 
        }
        else{
            topbox.style.top = "-" + topbox.offsetHeight + "px"; 
        }
        }  
});
resizeObserver.observe(topbox);

$("#toggleButton").on("click",function(){
    if(toggleButton.style.top != "0px"){
        topbox.style.top = "-" + toggleButton.style.top; 
        toggleButton.style.top = "0px";   
        toggleButton.textContent = "V";   
    }
    else{
        toggleButton.style.top = topbox.style.top.replace(/^\-/, '');
        topbox.style.top = "0px";
        toggleButton.textContent = "^";   
    }
});
//触摸事件
$("#viewrect").on("touchstart",function(event){
    if(viewrectTemp.moving) return;
    
    var offsetX,offsetY;
    offsetX = event.touches[0].clientX - viewrect.offsetLeft;
    offsetY = event.touches[0].clientY - viewrect.offsetTop;
    function handleTouchMove(event) {
        event.preventDefault(); // 阻止页面滚动  
        $("#viewrect").css({"left":(event.touches[0].clientX - offsetX) +"px",
                            "top":(event.touches[0].clientY - offsetY) +"px"});
    }
    function handleTouchEnd() {
        viewDataUpdate();
        document.removeEventListener("touchmove",handleTouchMove);
        document.removeEventListener("touchend",handleTouchEnd);
    }
    
    document.addEventListener('touchmove', handleTouchMove);  
    document.addEventListener('touchend', handleTouchEnd);  
});
$("#viewrectResize").on("touchstart",function (event) {
    viewrectTemp.moving = true;
    viewrectData = [event.touches[0].clientX,
                    event.touches[0].clientY,
                    viewrect.offsetWidth,
                    viewrect.offsetHeight];
    function handleTouchMove(event){
        if(!viewrectTemp.moving)    return;
        var dx = event.touches[0].clientX - viewrectData[0];
        var dy = event.touches[0].clientY - viewrectData[1];
        $("#viewrect").css({"width":(dx +viewrectData[2]) +"px",
                            "height":(dy +viewrectData[3]) +"px"
                        });
        $("#advWidth").val = viewrect.offsetWidth;
        $("#advHeight").val = viewrect.offsetHeight;
        
    }
    function handleTouchEnd() {
        viewrectTemp.moving = false;
        viewDataUpdate();
        document.removeEventListener("touchmove",handleTouchMove);
        document.removeEventListener("touchend",handleTouchEnd);
    }
    document.addEventListener('touchmove', handleTouchMove);  
    document.addEventListener("touchend",handleTouchEnd);
});
$("#animationControlPanel").on("touchstart",function (event) {
    var offsetX,offsetY;
    offsetX = event.touches[0].clientX - setting.getBoundingClientRect().left;
    offsetY = event.touches[0].clientY - setting.getBoundingClientRect().top;
    function handleTouchMove(event) {
        $(".setting").css({"left":(event.touches[0].clientX - offsetX) +"px",
                            "top":(event.touches[0].clientY - offsetY) +"px"});
    }
    function handleTouchEnd() {
        document.removeEventListener("touchmove",handleTouchMove);
        document.removeEventListener("touchend",handleTouchEnd);
    }
    
    document.addEventListener('touchmove', handleTouchMove);  
    document.addEventListener('touchend', handleTouchEnd);  
});
// 鼠标事件
$("#viewrect").on("mousedown",function(event){
    if(viewrectTemp.moving) return;
    var offsetX,offsetY;
    offsetX = event.clientX - viewrect.offsetLeft;
    offsetY = event.clientY - viewrect.offsetTop;
    function handleMouseMove(event) {
        $("#viewrect").css({"left":(event.clientX - offsetX) +"px",
                            "top":(event.clientY - offsetY) +"px"});
    }
    function handleMouseUp() {
        viewDataUpdate();
        document.removeEventListener("mousemove",handleMouseMove);
        document.removeEventListener("mouseup",handleMouseUp);
    }
    
    document.addEventListener('mousemove', handleMouseMove);  
    document.addEventListener('mouseup', handleMouseUp);  
});
$("#viewrectResize").on("mousedown",function (event) {
    viewrectTemp.moving = true;
    viewrectData = [event.clientX,event.clientY,viewrect.offsetWidth,viewrect.offsetHeight];
    function handleMouseMove(event){
        if(!viewrectTemp.moving)    return;
        var dx = event.clientX - viewrectData[0];
        var dy = event.clientY - viewrectData[1];
        $("#viewrect").css({"width":(dx +viewrectData[2]) +"px",
                            "height":(dy +viewrectData[3]) +"px"});
        $("#advWidth").val = viewrect.offsetWidth;
        $("#advHeight").val = viewrect.offsetHeight;
    }
    function handleMouseUp() {
        viewrectTemp.moving = false;
        viewDataUpdate();
        document.removeEventListener("mousemove",handleMouseMove);
        document.removeEventListener("mouseup",handleMouseUp);
    }
    document.addEventListener('mousemove', handleMouseMove);  
    document.addEventListener("mouseup",handleMouseUp);
});
$("#animationControlPanel").on("mousedown",function(event){
    var offsetX,offsetY;
    offsetX = event.clientX - setting.getBoundingClientRect().left;
    offsetY = event.clientY - setting.getBoundingClientRect().top;
    function handleMouseMove(event) {
        $(".setting").css({"left":(event.clientX - offsetX) +"px",
                            "top":(event.clientY - offsetY) +"px"});
    
    }
    function handleMouseUp() {
        document.removeEventListener("mousemove",handleMouseMove);
        document.removeEventListener("mouseup",handleMouseUp);
    }
    
    document.addEventListener('mousemove', handleMouseMove);  
    document.addEventListener('mouseup', handleMouseUp);  
});


function _(e, t, n) {
    var r = null;
    if ("text" === e) return document.createTextNode(t);
    r = document.createElement(e);
    for (var l in t)
        if ("style" === l) for (var a in t.style) r.style[a] = t.style[a];
        else if ("className" === l) r.className = t[l];
        else if ("event" === l) for (var a in t[l]) r.addEventListener(a, t[l][a]);
        else r.setAttribute(l, t[l]);
    if (n) for (var s = 0; s < n.length; s++) null != n[s] && r.appendChild(n[s]);
    return r;
}

function getClass(i){
    return (i < 10 ? "0"+i: i.toString());
}
function chagneAddress(i){
    return (i < 100 ? "common_battle/"+getClass(i) : "special/"+getClass(i));
}
function loadData(url, cb, loadType, progress) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    if (loadType) xhr.responseType = loadType;
    if (progress) xhr.onprogress = progress;
    xhr.onload = function () {
        if (xhr.status == 200) {
            //console.log("Response received:", xhr.response);
            cb(true, xhr.response);
        } else {
            //console.error("Request failed with status:", xhr.status);
            cb(false);
        }
    };
    xhr.onerror = function () {
        //console.error("Request encountered an error");
        cb(false);
    };
    xhr.send();
}
function sliceCyspAnimation(buf) {
    var view = new DataView(buf);
    var count = view.getInt32(12,true);

    return {
        count:count,
        data:buf.slice((count+1)*32)
    };
}

function createCutImg(){
    if(cutImg == null){
        cutImg = document.createElement('canvas');
        //ctx = cutImg.getContext('2d');
        ctx = cutImg.getContext('2d',{willReadFrequently: true});
        cutImg.width = viewrectData[2];
        cutImg.height = viewrectData[3];
       
    }
    console.log(viewrectData);          
}
function imgDownload(item,flag){
    var link = document.createElement('a');  
    if(flag) 
        ctx.drawImage(gl.canvas,...viewrectData,0,0,viewrectData[2],viewrectData[3]);
    
    link.href = item.toDataURL('image/png'); 
    link.download = ( $("#advImgNameCKBox").is(":checked") ? CustomName : FormalName) +'.png';
       
    link.click();                  
}
function viewDataUpdate(){
    viewrectData = [viewrect.offsetLeft,viewrect.offsetTop,viewrect.offsetWidth,viewrect.offsetHeight];
    $("#advWidth").val(viewrect.offsetWidth);
    $("#advHeight").val(viewrect.offsetHeight);
}

function init() {

    toggleButton = document.getElementById("toggleButton");
    toggleButton.style.top = topbox.offsetHeight + "px";
    toggleButton.style.left = (viewportWidth - toggleButton.offsetWidth)/2+ "px";

    canvas = document.getElementById("canvas");
   
    var config = { alpha: true };
    gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
    if (!gl) {
        alert("WebGL is unavailable.");
        return;
    }

    shader = spine.webgl.Shader.newTwoColoredTextured(gl);
    batcher = new spine.webgl.PolygonBatcher(gl);
    mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
    skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
    debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
    debugRenderer.drawRegionAttachments = true;
    debugRenderer.drawBoundingBoxes = true;
    debugRenderer.drawMeshHull = true;
    debugRenderer.drawMeshTriangles = true;
    debugRenderer.drawPaths = true;
    debugShader = spine.webgl.Shader.newColored(gl);
    shapes = new spine.webgl.ShapeRenderer(gl);

    loadData(
        "classMap.json",
        function (success, json) {
            if (!success) return alert("加载角色信息失败");

            classMap = json;
            skeletonList.firstElementChild.remove();

            Object.keys(json).forEach(function (i) {
                var name = json[i].chinese_name;
                var noAdded = json[i].type == 0 && !json[i].hasSpecialBase;

                if (i == '190801')
                    skeletonList.appendChild(_("option", { value: '', disabled: "" }, [_("text", "以下为剧情过场角色")]));
                if (noAdded) {
                    skeletonList.appendChild(_("option", { value: i, disabled: "" }, [_("text", name + "(未实装)")]));
                } else {
                    skeletonList.appendChild(_("option", { value: i * 1 + 10 }, [_("text", "1★" + name)]));
                    skeletonList.appendChild(_("option", { value: i * 1 + 30 }, [_("text", "3★" + name)]));
                    if (json[i].hasRarity6) skeletonList.appendChild(_("option", { value: i * 1 + 60 }, [_("text", "6★" + name)]));
                }
            });

            loadingText.textContent = "";

            $(skeletonList).change(function () {
                var baseUnitId = skeletonList.value | 0;
                baseUnitId -= (baseUnitId % 100) - 1;
                var classList = $("#classList")[0];
                var val = classMap[baseUnitId].type;
                classList.value = val;
                if (!classList.value) {
                    classList.appendChild(_("option", { value: val }, [_("text", val)]));
                    classList.value = val;
                }
            });
            if (location.hash.slice(1)) {
                skeletonList.value = location.hash.slice(1);
                skeletonList.dispatchEvent(new Event("change"));
                document.getElementById("loadSkeleton").click();
            }
        },
        "json"
    );
    document.getElementById("loadSkeleton").addEventListener("click", function () {
        if (!skeletonList.value || !classList.value) return;
        //判断输入与当前动画id是否相同,如果是,不执行
        if (activeSkeleton == skeletonList.value && currentClass == classList.value) return;
        load(skeletonList.value, classList.value);
        
    });


    // setInterval(function(){
    //     console.log("fps=",animation_fps);
    //     animation_fps = 0;
    // },1000);
}
var additionAnimations = ['DEAR', 'NO_WEAPON', 'POSING', 'RACE', 'RUN_JUMP', 'SMILE'];

var loading = false;
var loadingSkeleton;
var generalBattleSkeletonData = {};
var generalAdditionAnimations = {};
var currentTexture;
var currentClassAnimData = {
    type: 0,
    data: {}
};
var currentCharaAnimData = {
    id: 0,
    data: {}
};
var currentClass = '1';
var currentSkeletonBuffer;

function getGIF(){
    console.log("当前动画帧数为",gifConfig.gifPage,",动画时长为"+gifConfig.gifLenth+"秒");
    isDrawing = false;
    gifConfig.gifDrawing = true;
    try{
        gif.on('finished',function(blob){
            const link = document.createElement('a');  
            //const url = URL.createObjectURL(blob);
            //console.log("url:",url)
            //link.href = url;
            link.href = URL.createObjectURL(blob);
            link.download = ( $("#advImgNameCKBox").is(":checked") ? CustomName : FormalName) +'.gif';  
            link.click();  

            gif = null; 
            gifConfig.gifNext = 0;
            gifConfig.gifDeparted = 0;
            gifConfig.gifPage = 0;
            gifConfig.gifDrawing = false;   
        });   
        gif.render();
    } catch(error) {
        alert("生成GIF失败,请刷新页面重试!");
    }    
}
//  保存之后再写
//saveSkeleton.addEventListener('click', function (e) {});

function load(unit_id, class_id) {
    //saveSkeleton.style.display = "none";
    //判断是否在加载动画,如果是,不执行
    if (loading) return;
    loading = true;
    if ((activeSkeleton == unit_id) && (currentClass == classList.value)) return;
    currentClass = class_id;
    var baseUnitId = unit_id | 0;
    baseUnitId -= (baseUnitId % 100) - 1;
    loadingSkeleton = { id: unit_id | 0, info: classMap[baseUnitId], baseId: "000000" };
    if (progressBar) progressBar.remove();
    progressBar = document.body.appendChild(_("div", { className: "img-progress", style: { width: "5px", opacity: 1} }));
    topbox.insertBefore(progressBar,firstElementChild);
    progressBar.style.width = "0";

    if (loadingSkeleton.info.hasSpecialBase) {
        loadingSkeleton.baseId = baseUnitId;
        currentClass = baseUnitId;
    }
    var baseId = loadingSkeleton.baseId;

    if (!generalBattleSkeletonData[baseId]) {
        (loadingText.textContent = "加载骨骼(1/6)"),
            loadData(
                localURL + "special/" + baseId + "_CHARA_BASE.cysp",
                function (success, data) {
                    if (!success || data === null) return loading = false, loadingText.textContent = '加载共用骨架失败', progressBar.width = '100%', progressBar.opacity = 0;
                    generalBattleSkeletonData[baseId] = data;
                    loadAdditionAnimation();
                },
                "arraybuffer"
            );
    } else 
    loadAdditionAnimation();
}
function loadAdditionAnimation() {
    progressBar.style.width = '10%';
    var doneCount = 0,abort = false;
    var baseId = loadingSkeleton.baseId;
    generalAdditionAnimations[baseId] = generalAdditionAnimations[baseId] || {};
    additionAnimations.forEach(function(i){
        if(generalAdditionAnimations[baseId][i])    return doneCount ++;  
        
        loadData(localURL+ "special/" +baseId+'_'+i+'.cysp',function(success,data){
            if (!success || data === null) return loading = false, loadingText.textContent = '加载共用骨架失败', progressBar.width = '100%', progressBar.opacity = 0;
            if(abort)   return;
            generalAdditionAnimations[baseId][i] = sliceCyspAnimation(data);   
            if(++doneCount == additionAnimations.length){
                //console.log("进了这里");
                return loadClassAnimation();   
            } 
            loadingText.textContent = '加载额外动画(2/6)[' + doneCount + '/6]';
            progressBar.style.width = (10 + 15 * doneCount /6)+'%';
        },'arraybuffer');
    });
    //if(doneCount == additionAnimations.length) return loadClassAnimation();
    if(additionAnimations.length) return loadClassAnimation();
    loadingText.textContent = '加载额外动画(2/6)[' + doneCount + '/6]';
}

function loadClassAnimation(){
    progressBar.style.width = '25%';
    //console.log("加载了一次");
    if (currentClassAnimData.type == currentClass)  loadCharaSkillAnimation();    
    else{
        loadingText.textContent = '加载职介动画(3/6)';
        loadData(localURL  + chagneAddress(currentClass) + '_COMMON_BATTLE.cysp',function(success,data){
            if (!success || data === null)  return loading = false, loadingText.textContent = '加载角职介动画失败', progressBar.width = '100%', progressBar.opacity = 0;
            currentClassAnimData = {
                type: currentClass,
                data: sliceCyspAnimation(data)
            }
            loadCharaSkillAnimation();
        },'arraybuffer');
    }
        

}
function loadCharaSkillAnimation(){
    progressBar.style.width = '40%';
    var baseUnitId = loadingSkeleton.id;
    baseUnitId -= baseUnitId%100 - 1;
    if(currentCharaAnimData.id == baseUnitId)   loadTexture();
    else{
        loadingText.textContent = '加载角色技能动画(4/6)';
        loadData(localURL + "battle/" + baseUnitId + '_BATTLE.cysp',function(success,data){
            if (!success || data === null)
                return loading = false, loadingText.textContent = '加载角色技能动画失败', progressBar.width = '100%', progressBar.opacity = 0; 
            currentCharaAnimData = {
                id: baseUnitId,
                data: sliceCyspAnimation(data)
            }
            loadTexture();
        },'arraybuffer');
    }   
};
function loadTexture(){
    progressBar.style.width = '60%';
    loadingText.textContent = '加载材质(5/6)';
    loadData(localURL+ "atlas/" + loadingSkeleton.id + '.atlas',function(success,atlasText){
        if (!success) return loading = false, loadingText.textContent = '加载材质失败', progressBar.width = '100%', progressBar.opacity = 0; 
        progressBar.style.width = '80%';
        loadingText.textContent = '加载材质图片(6/6)';
        loadData(localURL + "texture2D/" + loadingSkeleton.id + '.png',function(success,blob){
            if (!success) return loading = false, loadingText.textContent = '加载材质图片失败'; 
            var img = new Image();
            img.onload = function(){
                progressBar.style.width = '100%';
                progressBar.style.opacity = 0;
                var created = !!window.skeleton.skeleton;
                if(created){
                    window.skeleton.state.clearTracks();
                    window.skeleton.state.clearListeners();
                    gl.deleteTexture(currentTexture.texture);
                }

                var imgTexture = new spine.webgl.GLTexture(gl,img);
                URL.revokeObjectURL(img.src);
                var atlas = new spine.TextureAtlas(atlasText, function(path){
                    return imgTexture;
                });
                currentTexture = imgTexture;
                var atlasLoader = new spine.AtlasAttachmentLoader(atlas);
    
                var baseId = loadingSkeleton.baseId;
                var additionAnimations = Object.values(generalAdditionAnimations[baseId]);

                var animationCount = 0;
                var classAnimCount = currentClassAnimData.data.count;
                animationCount += classAnimCount;
                var unitAnimCount = currentCharaAnimData.data.count;
                animationCount += unitAnimCount;
                additionAnimations.forEach(function (i) {
                    animationCount += i.count;
                })
                //assume always no more than 128 animations
                var newBuffSize = generalBattleSkeletonData[baseId].byteLength - 64 + 1 +
                        currentClassAnimData.data.data.byteLength +
                        currentCharaAnimData.data.data.byteLength;
                additionAnimations.forEach(function (i) {
                    newBuffSize += i.data.byteLength;
                })
                var newBuff = new Uint8Array(newBuffSize);
                var offset = 0;
                newBuff.set(new Uint8Array(generalBattleSkeletonData[baseId].slice(64)), 0);
                offset += generalBattleSkeletonData[baseId].byteLength - 64;
                newBuff[offset] = animationCount;
                offset++;
                newBuff.set(new Uint8Array(currentClassAnimData.data.data), offset);
                offset += currentClassAnimData.data.data.byteLength;
                newBuff.set(new Uint8Array(currentCharaAnimData.data.data), offset);
                offset += currentCharaAnimData.data.data.byteLength;
                additionAnimations.forEach(function (i) {
                    newBuff.set(new Uint8Array(i.data), offset);
                    offset += i.data.byteLength;
                })

                var skeletonBinary = new spine.SkeletonBinary(atlasLoader);
                var skeletonData = skeletonBinary.readSkeletonData(newBuff.buffer);
                var skeleton = new spine.Skeleton(skeletonData);
                skeleton.setSkinByName('default');
                var bounds = calculateBounds(skeleton);

                var animationStateData = new spine.AnimationStateData(skeleton.data);
                var animationState = new spine.AnimationState(animationStateData);
                animationState.setAnimation(0, getClass(currentClass) + '_idle', true);
                animationState.addListener({
                    /*start: function (track) {
                        console.log("Animation on track " + track.trackIndex + " started");
                    },
                    interrupt: function (track) {
                        console.log("Animation on track " + track.trackIndex + " interrupted");
                    },
                    end: function (track) {
                        console.log("Animation on track " + track.trackIndex + " ended");
                    },
                    disposed: function (track) {
                        console.log("Animation on track " + track.trackIndex + " disposed");
                    },*/
                    complete: function tick(track) {
                        //console.log("Animation on track " + track.trackIndex + " completed");
                        if (animationQueue.length) {
                            var nextAnim = animationQueue.shift();
                            if (nextAnim == 'stop') {
                                if(isDrawing){
                                    getGIF(); 
                                }
                                return;
                            }

                                
                            if (nextAnim == 'hold') return setTimeout(tick, 1e3);
                            if (nextAnim.substr(0, 1) != '1') nextAnim = getClass(currentClassAnimData.type) + '_' + nextAnim;
                            console.log(nextAnim);
                            if((!animationQueue.length) && (looptmp))
                            {
                                animationQueue = $("#animationList")[0].value.split(',');
                                  
                                nextAnim = animationQueue.shift();
                                if (!/^\d{6}/.test(nextAnim)) nextAnim = getClass(currentClassAnimData.type) + '_' + nextAnim;
                                
                            }
                            animationState.setAnimation(0, nextAnim, !animationQueue.length);
                            //console.log(window.skeleton.state.tracks[0].animationEnd);
                        }
                    },
                    /*event: function (track, event) {
                        console.log("Event on track " + track.trackIndex + ": " + JSON.stringify(event));
                    }*/
                });
                window.skeleton = { skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: true }
                loading = false;
                loadingText.textContent = '';
                (window.updateUI || setupUI)();
                if (!created) {
                    canvas.style.width = '99%';
                    requestAnimationFrame(render);
                    FormalName = $("#skeletonList option:selected").text() + " "+
                                $("#classList option:selected").text()    +" "+
                                $("#animationList option:selected").text() ;
                    setTimeout(function () {
                        canvas.style.width = '';
                    }, 0)
                }
                activeSkeleton = loadingSkeleton.id;

                currentSkeletonBuffer = newBuff.buffer;
                if (navigator.platform == 'Win32') {
                    //saveSkeleton.style.display = '';
                }
            }
            img.src = URL.createObjectURL(blob);
            $(".setting").css("visibility","visible");
        },'blob',function(e){//由返回函数控制最后的进度条
            var perc = e.loaded / e.total * 20 + 80;
            progressBar.style.width = perc + '%';   
        });
    },'text');
}

function calculateBounds(skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    var offset = new spine.Vector2();
    var size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    offset.y = 0
    return { offset: offset, size: size };
}

function setupUI() {
    var skeletonList = $("#skeletonList");
    var setupAnimationUI = function () {
        var animationList = $("#animationList");
        animationList.empty();
        var skeleton = window.skeleton.skeleton;
        var state = window.skeleton.state;
        var activeAnimation = state.tracks[0].animation.name;
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
        ].forEach(function (i) {
            animationList[0].appendChild(_('option', { value: i[1] }, [_('text', i[0])]));
        });
        animationList[0].appendChild(_('option', { disabled: '' }, [_('text', '---')]));
        skeleton.data.animations.forEach(function (i) {
            i = i.name;
            if (!/^\d{6}_/.test(i)) return;
            var val = i;
            if (!/skill/.test(i)) val = i + ',stop';
            animationList[0].appendChild(_('option', { value: val }, [
                _('text', i.replace(/\d{6}_skill(.+)/, '技能$1').replace(/\d{6}_joyResult/, '庆祝-角色特有'))
            ]));
        })
    }
    $("#setAnimation").on("click",function () {
        var animationState = skeleton.state, forceNoLoop = false;
        animationQueue = $("#animationList")[0].value.split(',');
        //looptmp = (animationQueue[0] == 'landing') ? 1 : 0;
        
        if (animationQueue[0] == 'multi_standBy') {
            animationQueue.push('multi_idle_standBy');
        } 
        
        else if ([
            'multi_idle_standBy', 'multi_idle_noWeapon', 'idle', 'walk', 'run', 'run_gamestart'
        ].indexOf(animationQueue[0]) == -1) {
            animationQueue.push('idle');     
        }
        console.log(animationQueue);
        var nextAnim = animationQueue.shift();
        if (!/^\d{6}/.test(nextAnim)) nextAnim = getClass(currentClassAnimData.type) + '_' + nextAnim;
        
        console.log(nextAnim,forceNoLoop);
        animationState.setAnimation(0, nextAnim, !animationQueue.length && !forceNoLoop);
        
        gifConfig.gifLenth = animationState.tracks[0].animationEnd.toFixed(3);
        console.log("当前动作时长为"+gifConfig.gifLenth+"秒");

        FormalName = $("#skeletonList option:selected").text() + " "+
                     $("#classList option:selected").text()    +" "+
                     $("#animationList option:selected").text() ;
    });

    window.updateUI = function () {
        setupAnimationUI();
    };
    setupAnimationUI();
    $("#bg-color").on('change', function (event) {
        var newcolor = event.target.value;
        newcolor = newcolor.replace('#', '');    
        //console.log(newcolor);
        if(newcolor.length != 6)    return;
        newcolor = parseInt(newcolor,16);
        bgColor = [
            (newcolor >>> 16 & 0xFF) / 255,
            (newcolor >>> 8 & 0xFF) / 255,
            (newcolor & 0xFF) / 255
        ];
        //console.log(bgColor);
    });
}

function render() {
    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;
   
    //console.log(delta);
    lastFrameTime = now;
    delta *= speedFactor;
    // Update the MVP matrix to adjust for canvas size changes
    resize();
    var viewbg = $("#viewbackground").is(':checked');
    if((isScreenShot || isDrawing) && viewbg)
        gl.clearColor(0,0,0,0);
    else
        gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Apply the animation state based on the delta time.
    var state = window.skeleton.state;
    var skeleton = window.skeleton.skeleton;
    //var bounds = window.skeleton.bounds;
    var premultipliedAlpha = window.skeleton.premultipliedAlpha;
    state.update(delta);
    state.apply(skeleton);
    skeleton.updateWorldTransform();

    {
        var progressCtx = animationProgressBar.getContext('2d');
        var track = state.tracks[0];
        var width = 400 * ((track.animationLast - track.animationStart) / (track.animationEnd - track.animationStart));
        progressCtx.clearRect(0, 0, 400, 4);
        progressCtx.fillStyle = '#40b5ff';
        progressCtx.fillRect(0, 0, width, 4);
        //console.log(width)

        if(isDrawing) {
            if(width < 0)   {
                gifConfig.fpsCount ++;
                //gifConfig.gifLenth = track.animationEnd.toFixed(3);
            }
                
            else{
                gifConfig.gifStep += delta;
                gifConfig.gifDeparted =  gifConfig.gifNext;
                gifConfig.gifNext = width;   
                if(gifConfig.gifDeparted > gifConfig.gifNext){
                    getGIF();       
                }
            }       
        }
    }

    // Bind the shader and set the texture and model-view-projection matrix.
    shader.bind();
    shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
    shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

    // Start the batch and tell the SkeletonRenderer to render the active skeleton.
    batcher.begin(shader);

    skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
    skeletonRenderer.draw(batcher, skeleton);
    
 
    batcher.end();

    shader.unbind();

    // draw debug information
    var debug = $('#debug').is(':checked');
    if (debug) {
        debugShader.bind();
        debugShader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);
        debugRenderer.premultipliedAlpha = premultipliedAlpha;
        shapes.begin(debugShader);
        debugRenderer.draw(shapes, skeleton);
        shapes.end();
        debugShader.unbind();
    }

    requestAnimationFrame(render);
    if(isScreenShot)
    {
        if(viewrectTemp.sizing){
            createCutImg(); 
            ctx.clearRect(0, 0, cutImg.width, cutImg.height);        
            imgDownload(cutImg,viewrectTemp.sizing);     
        }
        else  
            imgDownload(canvas,viewrectTemp.sizing);       
        
        isScreenShot = false;
    }
    if(isDrawing)
    {
        if(--gifConfig.fpsCount == 0)
        {  
            const delay =  gifConfig.gifDelay+ Math.floor(gifConfig.gifStep * 1e3) ;
            //console.log("帧时间:",delay,gifConfig.gifDelay);
            gifConfig.gifStep = 0;
            gifConfig.fpsCount = gifConfig.fpsInit;
            gifConfig.gifPage ++;
            if(viewrectTemp.sizing){
                if(viewbg){
                    ctx.clearRect(0, 0, cutImg.width, cutImg.height);
                    //ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    //ctx.fillRect(0, 0, cutImg.width, cutImg.height);   
                }
                    
                ctx.drawImage(gl.canvas, ...viewrectData,0,0,cutImg.width, cutImg.height);        
                gif.addFrame(ctx, { copy: true, delay: delay});
            }
            else   
                gif.addFrame(gl,{copy: true,delay: delay});
        }    
    } 
    //animation_fps ++;
}

function resize() {
    var w = viewportWidth;
    var h = viewportHeight-footHeight-2;
    var bounds = window.skeleton.bounds;
    if (canvas.width != w || canvas.height != h) {
        canvas.width = w;
        canvas.height = h;
    }

    // magic
    var centerX = bounds.offset.x + bounds.size.x / 2;
    var centerY = bounds.offset.y + bounds.size.y / 2;
    //var scaleX = bounds.size.x / canvas.width;
    //var scaleY = bounds.size.y / canvas.height;
    // var scale = Math.max(scaleX, scaleY) * 1.2;
    //if (scale < 1) scale = 1;
    var scale = 2 + acp[4]*0.05;
    var width = canvas.width * scale;
    var height = canvas.height * scale;
    //console.log("w",width,"h",height,"w1",(centerX - width / 2),"h1",(centerY - height / 2));    
    mvp.ortho2d((centerX - width / 2)+acp[2]-acp[3] , (centerY - height / 2)+acp[1]-acp[0], width , height);
    //console.log("w:",(centerX - (width / 2)),"h:",(centerY - (height / 2)));
    gl.viewport(0, 0, canvas.width, canvas.height);
    
}
(function () {
    init();
})();
