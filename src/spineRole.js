
let additionAnimations = ['DEAR', 'NO_WEAPON', 'POSING', 'RACE', 'RUN_JUMP', 'SMILE'];
let lastFrameTime;
let spineGirl = Array(6).fill({});
let spineRole_ctx = null;
let spineRole_canvas = null;

function loadSpineGirl(spineGirl,myCanvas){
    return new Promise((resolve, reject) => { 
        const img = new Image();
        const src = String(Number(spineGirl.character) + Number(spineGirl.star)*10);
        const charaBaseID = spineGirl.hasSpecialBase ? spineGirl.character : '000000';
        const weaponID = spineGirl.hasSpecialBase ? spineGirl.character : spineGirl.weapon;
        const characterID = spineGirl.character;
        img.onload = function(){
            let imgTexture = new spine.webgl.GLTexture(myCanvas.gl,img);
            URL.revokeObjectURL(img.src);
            let atlas = new spine.TextureAtlas(allAtlasData[src], function(path){
                return imgTexture;
            });
            let atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            let additionAnimations = Object.values(allCSpecialData[charaBaseID]);

            let animationCount = 0;
            animationCount += allWeaponData[weaponID].count;
            animationCount += allBattleData[characterID].count;
            additionAnimations.forEach((i)=>{
                animationCount += i.count;
            });

            
            let newBuffSize = allCharaBaseData[charaBaseID].byteLength + 1 +
                allWeaponData[weaponID].data.byteLength +
                allBattleData[characterID].data.byteLength;
            additionAnimations.forEach((i)=>{
                newBuffSize += i.data.byteLength;
            });
            let newBuff = new Uint8Array(newBuffSize);
            let offset = 0;
            newBuff.set(new Uint8Array(allCharaBaseData[charaBaseID]),offset);
            offset += allCharaBaseData[charaBaseID].byteLength;
            
            newBuff[offset] = animationCount;
            offset++;

            newBuff.set(new Uint8Array(allWeaponData[weaponID].data),offset);
            offset += allWeaponData[weaponID].data.byteLength;
            newBuff.set(new Uint8Array(allBattleData[characterID].data),offset);
            offset += allBattleData[characterID].data.byteLength;
            additionAnimations.forEach((i)=>{
                newBuff.set(new Uint8Array(i.data),offset);
                offset += i.data.byteLength;
            });
            let skeletonBinary = new spine.SkeletonBinary(atlasLoader);
            skeletonBinary.scale = spineGirl.spine_scale;
            let skeletonData = skeletonBinary.readSkeletonData(newBuff.buffer);
            let skeleton = new spine.Skeleton(skeletonData);
            skeleton.setSkinByName('default');
            let bounds = calculateSetupPoseBounds(skeleton);

            let animationStateData = new spine.AnimationStateData(skeleton.data);
            animationStateData.defaultMix = 0.05;
            // console.log(animationStateData);
            
            let animationState = new spine.AnimationState(animationStateData);
            animationState.setAnimation(0, weaponID+'_idle', true);
            
            animationState.addListener({
                // start: function (track) {
                //     //console.log("Animation on track " + track.trackIndex + " started");
                // },
                // interrupt: function (track) {
                //     console.log("Animation on track " + track.trackIndex + " interrupted");
                // },
                // end: function (track) {
                //     //console.log("Animation on track " + track.trackIndex + " ended");
                // },
                // disposed: function (track) {
                //     //console.log("Animation on track " + track.trackIndex + " disposed");
                // },
                complete: function tick(track) {
                    ////console.log("Animation on track " + track.trackIndex + " completed");
                    if (spineGirl.nowQueue.length) {
                        var nextAnim = spineGirl.nowQueue.shift();
                        if (nextAnim == 'stop') {
                            if(myCanvas.isDrawing && (spineGirl.order == myCanvas.nowCharacter)){
                                gifDownload(myCanvas);
                            }
                            return;
                        }

                            
                        if (nextAnim == 'hold') return setTimeout(tick, 1e3);
                        if (nextAnim.substring(0, 1) != '1')
                             nextAnim = weaponID + '_' + nextAnim;
                        //console.log(nextAnim);
                        // if(!spineGirl.animationQueue.length)
                        // {
                        //     spineGirl.animationQueue = $("#animationList")[0].value.split(',');
                              
                        //     nextAnim = animationQueue.shift();
                        //     if (!/^\d{6}/.test(nextAnim)) nextAnim = getClass(currentClassAnimData.type) + '_' + nextAnim;
                            
                        // }
                        spineGirl.spine.state.setAnimation(0, nextAnim, !spineGirl.nowQueue.length);
                        ////console.log(window.skeleton.state.tracks[0].animationEnd);
                    }
                },
                // event: function (track, event) {
                //     console.log("Event on track " + track.trackIndex + ": " + JSON.stringify(event));
                // }
            });
            
            // console.log(animationState);
            
            resolve({ skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: true });
        }
        img.src = URL.createObjectURL(allTexture2DData[src]);
    });
}

function calculateSetupPoseBounds (skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    let offset = new spine.Vector2();
    let size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    return { offset: offset, size: size };
}

function createPngCanvas(camera){
    if(spineRole_canvas == null){
        spineRole_canvas = document.createElement('canvas');
        spineRole_ctx = spineRole_canvas.getContext('2d',{willReadFrequently: true});
        spineRole_canvas.width = camera.viewRectData[2];
        spineRole_canvas.height = camera.viewRectData[3];
    }        
}


function imgDownload(e,f,b){
    const link = document.createElement('a');  
    let t;
    if(!f){
        spineRole_canvas.width = e.canvas.width;
        spineRole_canvas.height = e.canvas.height;
        if(e.hasBgImg && !e.viewBg)
            spineRole_ctx.drawImage($("#myImg")[0],0,0,e.canvas.width,e.canvas.height,0,0,e.canvas.width,e.canvas.height);
        spineRole_ctx.drawImage(e.gl.canvas,0,0,e.canvas.width,e.canvas.height,0,0,e.canvas.width,e.canvas.height);   
    }
    else{
        if(e.hasBgImg && !e.viewBg)
            spineRole_ctx.drawImage($("#myImg")[0],...b,0,0,b[2],b[3]);
        spineRole_ctx.drawImage(e.gl.canvas,...b,0,0,b[2],b[3]);   
    }
         
    
    t = spineRole_canvas;  

    link.href = t.toDataURL('image/png');
   
    link.download = ( $("#advImgNameCKBox").is(":checked") ? e.customName : spineGirl[e.nowCharacter].characterName)+'.png';
  
    link.click(); 

    spineRole_canvas = null;
    spineRole_ctx = null;
}

function gifDownload(e){
    e.isDrawing = false;
    e.gifConfig.gifDrawing = true;
    logInfo('GIF合成中...');
    try{
        e.gif.on('finished',function(blob){
            const link = document.createElement('a');  
            link.href = URL.createObjectURL(blob);
            link.download = ( $("#advImgNameCKBox").is(":checked") ? e.customName : spineGirl[e.nowCharacter].characterName)+'.gif';
            link.click();  

            e.gif = null; 
            e.gifConfig.gifNext = 0;
            e.gifConfig.gifDeparted = 0;
            e.gifConfig.gifPage = 0;
            e.gifConfig.gifDrawing = false; 
              
            spineRole_canvas = null;
            spineRole_ctx = null;
            logClear();
        });   
        e.gif.render();
    } catch(error) {
        logInfo("生成失败,刷新试试?",'error');  
        setTimeout(() => {  
            logClear();
        }, 300);
    } 
    
}

function resize (canvas) {
    const t = canvas.camera.acp;
    canvas.canvas.width = canvas.canvas.clientWidth;
    canvas.canvas.height = canvas.canvas.clientHeight;

    let width = canvas.canvas.width / (1 + t.scale * 0.05);
    let height = canvas.canvas.height / (1 + t.scale * 0.05);
    
    canvas.mvp.ortho2d(-width / 2 + t.left-t.right, 200-height / 2+ t.bottom-t.top, width, height);
    canvas.gl.viewport(0, 0, canvas.canvas.width, canvas.canvas.height);
}

function render(canvas){
    const camera = canvas.camera;
    const bgColor = canvas.bgColor;
    const now = Date.now() / 1000;
    const num = canvas.nowCharacter;
    const gl = canvas.gl;
    let delta = now - lastFrameTime;
    delta *= camera.speed;
    lastFrameTime = now;

    //resize
    resize(canvas);


    if(canvas.viewBg && (canvas.isScreenShot || canvas.isDrawing))
        gl.clearColor(0,0,0,0);
    else
    gl.clearColor(bgColor.R,bgColor.G,bgColor.B,bgColor.A);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(!camera.pause){
        spineGirl.forEach((i)=>{
            if('control' in i && i.control.ready === true){
                i.spine.skeleton.flipX = i.control.flipX;
                i.spine.skeleton.flipY = i.control.flipY;
                i.spine.skeleton.x = i.control.x;
                i.spine.skeleton.y = i.control.y;
                i.spine.state.update(delta);
                i.spine.state.apply(i.spine.skeleton);
                i.spine.skeleton.updateWorldTransform();
                
            }     
        });
    }
    
    
    canvas.shader.bind();
    canvas.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
    canvas.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, canvas.mvp.values);

    canvas.batcher.begin(canvas.shader);

    spineGirl.forEach((i)=>{
    if('control' in i && i.control.ready === true && !camera.pause){
        canvas.skeletonRenderer.draw(canvas.batcher, i.spine.skeleton,i.control.shadow,i.control.visable);}
    });
    canvas.batcher.end();
    canvas.shader.unbind();
    if(canvas.isScreenShot){
        createPngCanvas(camera);
        if(camera.viewRectTemp.sizing){
            
            spineRole_ctx.clearRect(...camera.viewRectData);     
        }
        imgDownload(canvas,camera.viewRectTemp.sizing,camera.viewRectData);
         
        canvas.isScreenShot = false; 
    }
    

    if(canvas.isDrawing){
        const track = spineGirl[num].spine.state.tracks[0];
        const width = 400 * (track.animationLast - track.animationStart) / (track.animationEnd - track.animationStart);
        const gifConfig = canvas.gifConfig;

        if('control' in spineGirl[num] && spineGirl[num].control.ready === true){
           
            if(width < 0){
                gifConfig.fpsCount ++;
            }
            else{
                gifConfig.gifStep += delta;
                gifConfig.gifDeparted =  gifConfig.gifNext;
                gifConfig.gifNext = width;   
                if(gifConfig.gifDeparted > gifConfig.gifNext){
                    gifDownload(canvas);
                }
            }
        }

        if((--gifConfig.fpsCount == 0) && (!gifConfig.gifDrawing)){
            const delay =  gifConfig.gifDelay+ Math.floor(gifConfig.gifStep * 1e3) ;
    

            ////console.log("帧时间:",delay,gifConfig.gifDelay);
            gifConfig.gifStep = 0;
            gifConfig.fpsCount = gifConfig.fpsInit;
            gifConfig.gifPage ++;
            
           
            if(camera.viewRectTemp.sizing){
                spineRole_ctx.clearRect(0,0,camera.viewRectData[2],camera.viewRectData[3]); 
                if(canvas.hasBgImg)
                    spineRole_ctx.drawImage($("#myImg")[0], ...camera.viewRectData,0,0,camera.viewRectData[2],camera.viewRectData[3]);  
                spineRole_ctx.drawImage(gl.canvas, ...camera.viewRectData,0,0,camera.viewRectData[2],camera.viewRectData[3]);

            }
            else{
                spineRole_ctx.clearRect(0,0,canvas.canvas.width,canvas.canvas.height); 
                if(canvas.hasBgImg)
                    spineRole_ctx.drawImage($("#myImg")[0],0,0,canvas.canvas.width,canvas.canvas.height,0,0,canvas.canvas.width,canvas.canvas.height);
                spineRole_ctx.drawImage(gl.canvas,0,0,canvas.canvas.width,canvas.canvas.height,0,0,canvas.canvas.width,canvas.canvas.height);
            }  
                     
            canvas.gif.addFrame(spineRole_ctx, { copy: true, delay: delay});
        }  
        
    }
    
    requestAnimationFrame(()=>{
        render(canvas);
    });
}