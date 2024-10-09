function canvasInit(canvasId){

    const config = { alpha:true };
    let mvp = new spine.webgl.Matrix4();
    let canvas = document.getElementById(canvasId);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    let gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
    if (!gl) {
        alert("WebGL is unavailable.");
        return;
    }

    let shader = spine.webgl.Shader.newTwoColoredTextured(gl);  
    let batcher = new spine.webgl.PolygonBatcher(gl);
 
    mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
    let skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
    skeletonRenderer.premultipliedAlpha = true;
    let debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
    [   'premultipliedAlpha',
        // 'drawRegionAttachments',
        // 'drawBoundingBoxes',
        // 'drawMeshHull',
        // 'drawMeshTriangles',
        // 'drawPaths',
        // 'drawSkeletonXY',
        // 'drawBones'
    ].forEach((i)=>{
        debugRenderer[i] = true;
    });
    let debugShader = spine.webgl.Shader.newColored(gl);
    let shapes = new spine.webgl.ShapeRenderer(gl);
    return{
        canvas : canvas,
        gl : gl,
        mvp : mvp,
        shader : shader,
        debugShader : debugShader,
        batcher : batcher,
        shapes : shapes,
        skeletonRenderer : skeletonRenderer,
        debugRenderer : debugRenderer,
        switchClassList :{
            before:'1',
            after:'1'
        },
        nowCharacter: 0,
        customName : "PcrImage",
        isScreenShot:false,
        isDrawing:false,
        gif:null,
        gifConfig : {
            fpsCount: 1,
            fpsInit: 4,
            gifNext: 0,
            gifDeparted: 0,
            gifStep: 0,
            gifPage: 0,
            gifLenth: 0,
            gifDelay: 0,
            gifDrawing: false,
        },
        camera : {
            viewRectData:[0,0,200,250],
            viewRectTemp:{
                moving:false,
                sizing:false
            },
            speed:1,
            width:canvas.clientWidth,
            height:canvas.clientHeight,
            acp:{
                scale: 1,
                top:0,
                left:0,
                bottom:0,
                right:0,
            },      
            pause: false,
        },
        bgColor :{
            R:0.5,
            G:0.5,
            B:0.5,
            A:0.8
        },
        bgMode:'none',
        viewBg:false,
        hasBgImg:false
    }
}

