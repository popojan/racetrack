!function(i,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((i=i||self).QT={})}(this,(function(i){"use strict";class t{constructor(i,t,e,s,n){this.x=i,this.y=t,this.w=e,this.h=s,this.data=n}contains(i){return i.x>=this.x&&i.x<=this.x+this.w&&i.y>=this.y&&i.y<=this.y+this.h}intersects(i){return!(i.x>this.x+this.w||i.x+i.w<this.x||i.y>this.y+this.h||i.y+i.h<this.y)}}const e={capacity:4,removeEmptyNodes:!1,maximumDepth:-1,arePointsEqual:(i,t)=>i.x===t.x&&i.y===t.y};class s{constructor(i,t,s=[]){this.container=i,this.config=Object.assign({},e,t),this.isDivided=!1,this.points=[];for(const i of s)this.insertRecursive(i)}getTree(){let i;return i=this.isDivided?{ne:this.ne.getTree(),nw:this.nw.getTree(),se:this.se.getTree(),sw:this.sw.getTree()}:this.getNodePointAmount(),i}getAllPoints(){const i=[];return this.getAllPointsRecursive(i),i}getAllPointsRecursive(i){this.isDivided?(this.ne.getAllPointsRecursive(i),this.nw.getAllPointsRecursive(i),this.se.getAllPointsRecursive(i),this.sw.getAllPointsRecursive(i)):Array.prototype.push.apply(i,this.points.slice())}getNodePointAmount(){return this.points.length}divide(){const i=-1===this.config.maximumDepth?-1:this.config.maximumDepth-1,e=Object.assign({},this.config,{maximumDepth:i});this.isDivided=!0;const n=this.container.x,h=this.container.y,r=this.container.w/2,o=this.container.h/2;this.ne=new s(new t(n+r,h,r,o),e),this.nw=new s(new t(n,h,r,o),e),this.se=new s(new t(n+r,h+o,r,o),e),this.sw=new s(new t(n,h+o,r,o),e),this.insert(this.points.slice()),this.points.length=0,this.points=[]}remove(i){if(Array.isArray(i))for(const t of i)this.removeRecursive(t);else this.removeRecursive(i)}removeRecursive(i){if(this.container.contains(i))if(this.isDivided)this.ne.removeRecursive(i),this.nw.removeRecursive(i),this.se.removeRecursive(i),this.sw.removeRecursive(i),this.config.removeEmptyNodes&&(0!==this.ne.getNodePointAmount()||this.ne.isDivided||0!==this.nw.getNodePointAmount()||this.nw.isDivided||0!==this.se.getNodePointAmount()||this.se.isDivided||0!==this.sw.getNodePointAmount()||this.sw.isDivided||(this.isDivided=!1,delete this.ne,delete this.nw,delete this.se,delete this.sw));else{for(let t=this.points.length-1;t>=0;t--)this.config.arePointsEqual(i,this.points[t])&&this.points.splice(t,1)}}insert(i){if(Array.isArray(i)){let t=!0;for(const e of i)t=t&&this.insertRecursive(e);return t}return this.insertRecursive(i)}insertRecursive(i){if(!this.container.contains(i))return!1;if(!this.isDivided){if(this.getNodePointAmount()<this.config.capacity||0===this.config.maximumDepth)return this.points.push(i),!0;(-1===this.config.maximumDepth||this.config.maximumDepth>0)&&this.divide()}return!!this.isDivided&&(this.ne.insertRecursive(i)||this.nw.insertRecursive(i)||this.se.insertRecursive(i)||this.sw.insertRecursive(i))}query(i){const t=[];return this.queryRecursive(i,t),t}queryRecursive(i,t){if(i.intersects(this.container))if(this.isDivided)this.ne.queryRecursive(i,t),this.nw.queryRecursive(i,t),this.se.queryRecursive(i,t),this.sw.queryRecursive(i,t);else{const e=this.points.filter(t=>i.contains(t));Array.prototype.push.apply(t,e)}}clear(){this.points=[],this.isDivided=!1,delete this.ne,delete this.nw,delete this.se,delete this.sw}}i.Box=t,i.Circle=class{constructor(i,t,e,s){this.x=i,this.y=t,this.r=e,this.rPow2=this.r*this.r,this.data=s}euclideanDistancePow2(i,t){return Math.pow(i.x-t.x,2)+Math.pow(i.y-t.y,2)}contains(i){return this.euclideanDistancePow2(i,this)<=this.rPow2}intersects(i){const t=this.x-Math.max(i.x,Math.min(this.x,i.x+i.w)),e=this.y-Math.max(i.y,Math.min(this.y,i.y+i.h));return t*t+e*e<=this.rPow2}},i.Point=class{constructor(i,t,e){this.x=i,this.y=t,this.data=e}},i.QuadTree=s,Object.defineProperty(i,"__esModule",{value:!0})}));
//# sourceMappingURL=index.js.map