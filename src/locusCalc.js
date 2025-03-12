//轨迹计算
//给予坐标计算方程
//给予方程和步数计算坐标组
(function(){
    
    // function line(x1, y1, x2, y2){
    //     const m = (y2 - y1) / (x2 - x1);
    //     const b = y1 - m * x1;
    //     if(x1 === x2 && y1 === y2){
    //         return [0,0];
    //     }
    //     return [m,b];
    // }
    function beyondTheScreenCheck(data){
        if(Math.abs(data.x) > 1920 || Math.abs(data.y) > 1080)
            return false;
        else 
            return true;
    }
    class Line{
        constructor(x1,y1,x2,y2,step){
            step = (step === void 0 || step === 0) ? 1 : step;

            this.x1 = x1;
            this.x2 = x2;
            this.y1 = y1;
            this.y2 = y2;
            this.pointArray = [];
            this.m = (y2 - y1) / (x2 - x1);
            this.len = Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
            const part = Math.floor(this.len);

            for(let i = 0;i<part;i+=step){
                let t= i/part;
                const l = t*this.len;
                const f = this.getPoint(l);
                if(beyondTheScreenCheck(f))
                    this.pointArray.push(f)
            }

        }
        getLength(t){
            return this.length * t;
        }
        getPoint(l){
            if(!Number.isFinite(this.m)){
                return {
                    x: 0,
                    y: this.y2 - this.y1 > 0 ? (this.y1 + l):(this.y1 - l) 
                }
            }
            else{
                const x = Math.sqrt(l*l/(this.m * this.m + 1));
                return {
                    x: this.x2 - this.x1 > 0 ?(this.x1+x):(this.x1-x),
                    y: this.y2 - this.y1 > 0 ? (this.m > 0 ?(this.y1+this.m*x):(this.y1-this.m*x)):(this.m > 0 ?(this.y1-this.m*x):(this.y1+this.m*x))
                }
            }
        }
        getPointArray(){
            return this.pointArray;
        }
    }
    class Curve{
        constructor(x1, y1, x2, y2, cx, cy,step) {
            this.x1 = x1;
            this.x2 = x2;
            this.cx = cx;
            this.cy = cy;
            this.y1 = y1;
            this.y2 = y2;
            this.pointArray = [];
            step = (step === void 0 || step === 0) ? 1 : step;
            this.init();
            const len = this.getLength(1);
            const part = Math.floor(len);

            for(let i = 0;i<part;i+=step){
                let t= i/part;
                const l = t*len;
                t = this.invertL(t,l);
                const f = this.getPoint(t);
                if(beyondTheScreenCheck(f))
                    this.pointArray.push(f)
            }
            
        }
        init(){
            const ax = this.x1 + this.x2 - 2*this.cx;
            const ay = this.y1 + this.y2 - 2*this.cy;
            const bx = 2 * this.cx - 2 * this.x1;
            const by = 2 * this.cy - 2 * this.y1;

            this.A = 4 *(ax * ax + ay * ay);
            this.B = 4 *(ax * bx + ay * by);
            this.C = bx * bx + by * by;
        }
        getLength(t){
            const t1 = Math.sqrt(this.C + t *(this.B + t * this.A));
            const t2 = 2 * this.A * t * t1  + this.B * (t1 - Math.sqrt(this.C));
            const t3 = Math.log(this.B + 2 * Math.sqrt(this.A) * Math.sqrt(this.C));
            const t4 = Math.log(this.B + 2 * this.A * t + 2 * Math.sqrt(this.A) * t1);
            const t5 = 2 * Math.sqrt(this.A) * t2;
            const t6 = (this.B * this.B - 4 * this.A * this.C) * (t3 - t4);
            return (t5 + t6)/(8 * Math.pow(this.A,1.5));
        }

        invertL(t,l){
            let t1 = t,t2;
            do{
                t2 = t1 - (this.getLength(t1) - l) / Math.sqrt(this.C + t1 *(this.B + t1 * this.A));
                if (Math.abs(t1 - t2) < 0.001) {
                    break;
                }
                t1 = t2;
            }while(true);
            return t2;
        }

        getPoint(t){
            const next = 1 - t;
            return {
                x:next * next * this.x1 + 2 * t * next * this.cx + t * t *this.x2 ,
                y:next * next * this.y1 + 2 * t * next * this.cy + t * t *this.y2 
            }
        }
        getPointArray(){
            return this.pointArray;
        }
    }
    
    
    const locusCalc = {
        line:Line,
        curve:Curve
    }
    window.locusCalc = locusCalc;
})();


// const locusCalc = {
//     line:function(x1, y1, x2, y2){
//         const m = (y2 - y1) / (x2 - x1);
//         const b = y1 - m * x1;
//         if(x1 === x2 && y1 === y2){
//             return [0,0];
//         }
      
//         return [m,b];
//     },
//     curve_length:function(){
        
//     },
//     curve:function(x1, y1, cx, cy, x2, y2){
//         const ax = x1 + x2 - 2*cx;
//         const ay = y1 + y2 - 2*cy;
//         const bx = 2 * (cx - x1);
//         const by = 2 * (cy - y1);

//         const A = 4 *(ax * ax + ay * ay);
//         const B = 4 *(ax * bx + ay * by);
//         const C = bx * bx + by * by;

//         const t1 = line
//     }
// }