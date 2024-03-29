var download_temp = false;
var pixelData = new Uint8Array(4);
var acp = [0,0,0,0,0,0];
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
var footHeight = document.getElementById("foot").offsetHeight; 
var topHeight = document.getElementById("topbox").offsetHeight;
var colorInput = document.getElementById('bg-color');  
var topbox = document.getElementById("topbox");
var animation_control_panel = document.getElementById("animation_control_panel");
var acp_up = document.getElementById("acp_up");
var acp_down = document.getElementById("acp_down");
var acp_left = document.getElementById("acp_left");
var acp_right = document.getElementById("acp_right");
var acp_zoomup = document.getElementById("acp_zoomup");
var acp_zoomdown = document.getElementById("acp_zoomdown");
var acp_movereset = document.getElementById("acp_movereset");
var acp_zoomreset = document.getElementById("acp_zoomreset");
var downloadimg = document.getElementById("downloadimg");

var viewportHeight = window.innerHeight;  
var viewportWidth = window.innerWidth;

var firstElementChild = topbox.firstChild;
var speedFactor = 1;
$('#speedList').change(function () {
    var value = parseFloat($('#speedList')[0].value);
    !isNaN(value) && (speedFactor = value);
});
var bgColor = [.3, .3, .3, 1];
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

function init() {

    toggleButton = document.getElementById("toggleButton");
    toggleButton.style.top = topbox.offsetHeight + "px";
    toggleButton.style.left = (viewportWidth - toggleButton.offsetWidth)/2+ "px";

    canvas = document.getElementById("canvas");
   // var ctx = canvas.getContext("2d");
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
                var name = json[i].name;
                var noAdded = json[i].type == "0" && !json[i].hasSpecialBase;

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

    window.addEventListener("resize",function(){
        //console.log("窗口正在改变 h=",window.innerHeight,"w=",window.innerWidth,"a=",topbox.offsetHeight);
        viewportWidth = window.innerWidth;
        toggleButton.style.left = (viewportWidth - toggleButton.offsetWidth)/2+ "px";
        if(toggleButton.style.top != "0px"){
            toggleButton.style.top = topbox.offsetHeight  + "px"; 
        }
        else{
            topbox.style.top = "-" + topbox.offsetHeight + "px"; 
        }

    });

    toggleButton.addEventListener("click",function(){
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

    animation_control_panel.addEventListener("mousedown",function(event){
        var offsetX,offsetY;
        offsetX = event.clientX - animation_control_panel.getBoundingClientRect().left;
        offsetY = event.clientY - animation_control_panel.getBoundingClientRect().top;
        function handleMouseMove(event) {
            animation_control_panel.style.left = (event.clientX - offsetX) + "px"; 
            animation_control_panel.style.top = (event.clientY - offsetY) + "px"; 
        }
        function handleMouseUp() {
            document.removeEventListener("mousemove",handleMouseMove);
            document.removeEventListener("mouseup",handleMouseUp);
        }
        
        document.addEventListener('mousemove', handleMouseMove);  
        document.addEventListener('mouseup', handleMouseUp);  
    });

    acp_up.addEventListener("click",function(){
        acp[0] += 10;
    }); 
    acp_down.addEventListener("click",function(){
        acp[1] += 10;
    }); 
    acp_left.addEventListener("click",function(){
        acp[2] += 10;
    }); 
    acp_right.addEventListener("click",function(){
        acp[3] += 10;
    }); 
    acp_zoomup.addEventListener("click",function(){
        acp[4] += 0.05;
    }); 
    acp_zoomdown.addEventListener("click",function(){
        acp[5] += 0.05;
    }); 
    acp_movereset.addEventListener("click",function(){
        acp.fill(0,0,4);
    });
    acp_zoomreset.addEventListener("click",function(){
        acp.fill(0,4,6);
        
    });  
    downloadimg.addEventListener("click",function(){
        download_temp = true;     
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
                localURL + baseId + "_CHARA_BASE.cysp",
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
        
        loadData(localURL+baseId+'_'+i+'.cysp',function(success,data){
            if (!success || data === null) return loading = false, loadingText.textContent = '加载共用骨架失败', progressBar.width = '100%', progressBar.opacity = 0;
            if(abort)   return;
            generalAdditionAnimations[baseId][i] = sliceCyspAnimation(data);   
            if(++doneCount == additionAnimations.length){
                console.log("进了这里");
                return loadClassAnimation();   
            } 
            loadingText.textContent = '加载额外动画(2/6)[' + doneCount + '/6]';
            progressBar.style.width = (10 + 15 * doneCount /6)+'%';
        },'arraybuffer');
    });
    if(doneCount == additionAnimations.length) return loadClassAnimation();
    loadingText.textContent = '加载额外动画(2/6)[' + doneCount + '/6]';
}

function loadClassAnimation(){
    progressBar.style.width = '25%';
    console.log("加载了一次");
    if (currentClassAnimData.type == currentClass)  loadCharaSkillAnimation();    
    else{
        loadingText.textContent = '加载职介动画(3/6)';
        loadData(localURL + getClass(currentClass) + '_COMMON_BATTLE.cysp',function(success,data){
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
        loadData(localURL + baseUnitId + '_BATTLE.cysp',function(success,data){
            if (!success || data === null) return loading = false, loadingText.textContent = '加载角色技能动画失败', progressBar.width = '100%', progressBar.opacity = 0; 
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
    loadData(localURL + loadingSkeleton.id + '.atlas',function(success,atlasText){
        if (!success) return loading = false, loadingText.textContent = '加载材质失败', progressBar.width = '100%', progressBar.opacity = 0; 
        progressBar.style.width = '80%';
        loadingText.textContent = '加载材质图片(6/6)';
        loadData(localURL + loadingSkeleton.id + '.png',function(success,blob){
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
                            if (nextAnim == 'stop') return;
                            if (nextAnim == 'hold') return setTimeout(tick, 1e3);
                            if (nextAnim.substr(0, 1) != '1') nextAnim = getClass(currentClassAnimData.type) + '_' + nextAnim;
                            console.log(nextAnim);
                            if((!animationQueue.length) && (looptmp))
                            {
                                animationQueue = $("#animationList")[0].value.split(',');
                                animationQueue.push('idle');  
                                nextAnim = animationQueue.shift();
                                if (!/^\d{6}/.test(nextAnim)) nextAnim = getClass(currentClassAnimData.type) + '_' + nextAnim;
                                
                            }
                            animationState.setAnimation(0, nextAnim, !animationQueue.length);
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
    $("#setAnimation").click(function () {
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
    });

    window.updateUI = function () {
        setupAnimationUI();
    };
    setupAnimationUI();
    colorInput.addEventListener('change', function (event) {
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
    lastFrameTime = now;
    delta *= speedFactor;

    // Update the MVP matrix to adjust for canvas size changes
    resize();
    var viewbg = $("#viewbackground").is(':checked');
    if(download_temp && viewbg)
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
    if(download_temp)
    {
        var dataURL = canvas.toDataURL('image/png');  
        let link = document.createElement('a');  
        link.download = 'webgl-output.png';  
        link.href = dataURL;  
        link.click();
        download_temp = false;
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
    var scaleX = bounds.size.x / canvas.width;
    var scaleY = bounds.size.y / canvas.height;
    var scale = Math.max(scaleX, scaleY) * 1.2;
    if (scale < 1) scale = 1;
    var width = canvas.width * (scale - acp[4] + acp[5]);
    var height = canvas.height * (scale - acp[4] + acp[5]);
    //console.log("w",width,"h",height,"w1",(centerX - width / 2),"h1",(centerY - height / 2));    
    mvp.ortho2d((centerX - width / 2)+acp[2]-acp[3] , (centerY - height / 2)+acp[1]-acp[0], width , height);
    //console.log("w:",(centerX - (width / 2)),"h:",(centerY - (height / 2)));
    gl.viewport(0, 0, canvas.width, canvas.height);
    
}
(function () {
    init();
})();
