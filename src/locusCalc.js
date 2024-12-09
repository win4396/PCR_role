//轨迹计算
//给予坐标计算方程
//给予方程和步数计算坐标组

const locusCalc = {
    line(x1, y1, x2, y2){
        const m = (y2 - y1) / (x2 - x1);
        const b = y1 - m * x1;
        if(x1 === x2 && y1 === y2){
            return [0,0];
        }
      
        return [m,b];
    }
}