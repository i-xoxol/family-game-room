(function () {
  'use strict';
  var TAU = Math.PI * 2, cache = {};
  function circle(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } }
  function ellipse(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } }
  function rounded(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
  }
  function star(c, x, y, r, inner, rotation, fill) {
    c.beginPath();
    for (var i=0;i<10;i++) { var a=(rotation || -Math.PI/2)+i*Math.PI/5, d=i%2?inner:r; if(!i)c.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d);else c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d); }
    c.closePath(); if(fill){c.fillStyle=fill;c.fill();}
  }
  function gradient(c, x, y, r, light, dark) { var g=c.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r*1.2);g.addColorStop(0,light);g.addColorStop(1,dark);return g; }
  function finish(c, fill, stroke) { c.fillStyle=fill;c.fill();if(stroke!==false){c.lineWidth=2.3;c.strokeStyle=stroke || 'rgba(84,66,48,.26)';c.stroke();} }
  function face(c, x, y, spread, size) {
    c.lineCap='round';
    ellipse(c,x-spread-4,y+7,5.5,3.4,'rgba(239,117,119,.6)');ellipse(c,x+spread+4,y+7,5.5,3.4,'rgba(239,117,119,.6)');
    ellipse(c,x-spread,y,2.8*size,4*size,'#3a3d3b');ellipse(c,x+spread,y,2.8*size,4*size,'#3a3d3b');
    circle(c,x-spread-.7,y-1.5,1*size,'#fffbea');circle(c,x+spread-.7,y-1.5,1*size,'#fffbea');
    c.beginPath();c.moveTo(x-4*size,y+7*size);c.quadraticCurveTo(x,y+13*size,x+4*size,y+7*size);c.strokeStyle='#53443a';c.lineWidth=2*size;c.stroke();
  }
  function leaf(c,x,y,rotation,size,color) {
    c.save();c.translate(x,y);c.rotate(rotation);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-size,-size,size*.3,-size*1.8,0,-size*2);c.bezierCurveTo(size*1.3,-size,size,.1,0,0);finish(c,color || '#609a53',false);
    c.beginPath();c.moveTo(0,-2);c.lineTo(0,-size*1.6);c.strokeStyle='rgba(255,255,216,.35)';c.lineWidth=1.5;c.stroke();c.restore();
  }
  function berry(c) {
    c.beginPath();c.moveTo(0,-36);c.bezierCurveTo(48,-49,50,-15,26,21);c.bezierCurveTo(13,45,-1,56,-17,36);c.bezierCurveTo(-51,-2,-50,-43,0,-36);finish(c,gradient(c,0,0,52,'#ff9b8c','#dc4968'));
    c.save();c.clip();c.fillStyle='#ffde8f';
    for(var row=0;row<5;row++)for(var j=0;j<5;j++){var x=(j-2)*16+(row%2?7:0),y=-24+row*14;if(Math.abs(x)<37-row*3){ellipse(c,x,y,1.8,3.3,'#ffe9a7');}}
    c.restore();
    for(var i=0;i<5;i++)leaf(c,(i-2)*5,-31,(i-2)*.65,12,i%2?'#70ad64':'#599553');
    c.beginPath();c.moveTo(-22,-24);c.quadraticCurveTo(-31,-15,-28,-5);c.lineWidth=5;c.strokeStyle='rgba(255,240,209,.55)';c.lineCap='round';c.stroke();face(c,0,6,13,1);
  }
  function apple(c) {
    c.beginPath();c.moveTo(0,-30);c.bezierCurveTo(35,-58,57,-16,36,24);c.bezierCurveTo(22,51,10,43,0,44);c.bezierCurveTo(-12,46,-32,50,-42,11);c.bezierCurveTo(-54,-27,-25,-49,0,-30);finish(c,gradient(c,-2,0,54,'#ffb184','#ec6763'));
    c.beginPath();c.moveTo(0,-30);c.quadraticCurveTo(-3,-45,7,-53);c.lineWidth=6;c.strokeStyle='#8a6241';c.lineCap='round';c.stroke();leaf(c,5,-35,.8,14,'#729d4d');
    c.beginPath();c.moveTo(-28,-19);c.quadraticCurveTo(-38,-7,-32,4);c.strokeStyle='rgba(255,246,206,.62)';c.lineWidth=7;c.stroke();face(c,2,8,13,1);
  }
  function orange(c) {
    circle(c,0,3,43,gradient(c,0,0,47,'#ffd780','#f3a143'));c.strokeStyle='#da9b45';c.lineWidth=2;c.stroke();
    for(var i=0;i<35;i++){var a=i*2.4,r=12+(i%6)*4.4;circle(c,Math.cos(a)*r,Math.sin(a)*r+3,1.2,'rgba(212,133,47,.23)');}
    leaf(c,4,-35,.9,16,'#68a462');leaf(c,-1,-35,-.7,10,'#79b268');
    c.beginPath();c.arc(-4,-3,26,3.5,4.3);c.strokeStyle='rgba(255,252,213,.65)';c.lineWidth=7;c.lineCap='round';c.stroke();face(c,1,9,12,1);
  }
  function cookie(c) {
    c.beginPath();for(var i=0;i<48;i++){var a=i/48*TAU,r=i%4===0?44:42;if(!i)c.moveTo(Math.cos(a)*r,Math.sin(a)*r);else c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();finish(c,gradient(c,-3,-3,48,'#f6d598','#dca562'));
    circle(c,0,0,35);c.strokeStyle='rgba(189,125,60,.22)';c.lineWidth=1.5;c.stroke();
    [[-17,-22,7],[15,-25,6],[29,-5,5],[-29,7,6],[19,24,7],[-10,29,5],[-5,-3,5]].forEach(function(p){c.save();c.translate(p[0],p[1]);c.rotate(p[0]);rounded(c,-p[2],-p[2]*.7,p[2]*1.7,p[2]*1.5,2);finish(c,'#8e614a',false);c.restore();});
    for(var k=0;k<12;k++)circle(c,Math.cos(k*2.3)*32,Math.sin(k*2.3)*32,1.3,'#e0b16e');face(c,0,6,13,1);
  }
  function carrot(c) {
    c.save();c.rotate(.35);c.beginPath();c.moveTo(-22,-27);c.bezierCurveTo(-20,-43,20,-45,23,-27);c.bezierCurveTo(22,-9,8,48,0,52);c.bezierCurveTo(-8,50,-24,-9,-22,-27);finish(c,gradient(c,0,-14,58,'#ffbd6a','#ec8e3c'));
    c.save();c.clip();for(var i=0;i<4;i++){c.beginPath();c.moveTo(i%2?-25:7,-11+i*14);c.lineTo(i%2?-7:25,-14+i*14);c.strokeStyle='rgba(199,107,42,.38)';c.lineWidth=3;c.lineCap='round';c.stroke();}c.restore();
    leaf(c,-4,-32,-.55,17,'#6eaa54');leaf(c,1,-33,.15,20,'#58994f');leaf(c,6,-32,.7,17,'#83b85e');face(c,0,-5,8,.85);c.restore();
  }
  function icecream(c) {
    c.beginPath();c.moveTo(-29,-4);c.lineTo(30,-4);c.lineTo(4,53);c.quadraticCurveTo(0,60,-4,51);c.closePath();finish(c,'#dba367');
    c.save();c.clip();for(var i=-70;i<70;i+=13){c.beginPath();c.moveTo(i,0);c.lineTo(i+60,60);c.moveTo(i,60);c.lineTo(i+60,0);c.lineWidth=2;c.strokeStyle='#bd8855';c.stroke();}c.restore();
    circle(c,-17,-13,24,gradient(c,-17,-18,26,'#fff3d6','#f0d6ae'));circle(c,16,-13,24,gradient(c,12,-20,26,'#fbbfd2','#e896b9'));circle(c,0,-38,26,gradient(c,-4,-45,30,'#d6eecc','#9dccab'));
    [[-21,-21,1],[8,-48,2],[14,-10,0],[-8,-51,1],[4,-30,0]].forEach(function(p){c.save();c.translate(p[0],p[1]);c.rotate(p[0]);rounded(c,-1.5,-4,3,8,1.5);finish(c,['#f1c951','#b885c8','#fff6db'][p[2]],false);c.restore();});
    circle(c,4,-65,7,'#e77584');c.beginPath();c.moveTo(5,-71);c.quadraticCurveTo(13,-82,18,-73);c.lineWidth=2;c.strokeStyle='#719954';c.stroke();face(c,1,-15,12,.9);
  }
  function melon(c) {
    c.save();c.rotate(-.15);c.beginPath();c.moveTo(-47,-27);c.lineTo(47,-27);c.arc(0,-27,47,0,Math.PI);c.closePath();finish(c,'#78ae64');
    c.beginPath();c.moveTo(-41,-27);c.lineTo(41,-27);c.arc(0,-27,41,0,Math.PI);c.closePath();finish(c,'#f6eac2',false);
    c.beginPath();c.moveTo(-35,-27);c.lineTo(35,-27);c.arc(0,-27,35,0,Math.PI);c.closePath();finish(c,'#ee8290',false);
    [[-22,-20],[-8,-12],[21,-18],[1,-21],[12,-4],[-16,-3]].forEach(function(p){ellipse(c,p[0],p[1],1.7,3.2,'#85555b');});face(c,0,2,11,.85);c.restore();
  }
  function smallDonut(c) {
    ellipse(c,0,9,45,34,'#b67e4c');ellipse(c,0,0,45,34,gradient(c,-4,-7,48,'#f2bc7d','#d99459'));
    ellipse(c,0,-4,40,29,'#ed9fbd');ellipse(c,0,1,15,11,'#ac764d');ellipse(c,0,-2,13,9,'#f6e6c2');
    for(var i=0;i<14;i++){var a=i/14*TAU,r=28;c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r*.7-4);c.rotate(a+.6);rounded(c,-4,-1.5,8,3,1.5);finish(c,['#fff5b0','#a7d8d2','#b2abe0'][i%3],false);c.restore();}face(c,0,18,17,.8);
  }
  function sugarStar(c) {
    star(c,0,2,49,26,-Math.PI/2);finish(c,gradient(c,-4,-6,55,'#fff1a9','#ebbf4c'));
    star(c,0,1,39,21,-Math.PI/2);c.strokeStyle='rgba(255,253,217,.85)';c.lineWidth=2;c.stroke();face(c,0,4,12,1);
  }
  function cake(c) {
    rounded(c,-39,-9,78,48,9);finish(c,'#eaa3bb');rounded(c,-39,8,78,9,2);finish(c,'#fff1ce',false);
    ellipse(c,0,-9,39,12,'#fff2d6');c.beginPath();c.moveTo(-38,-8);c.lineTo(-38,2);c.bezierCurveTo(-34,18,-25,11,-24,1);c.bezierCurveTo(-20,-5,-17,20,-9,9);c.bezierCurveTo(-6,-2,-1,2,2,12);c.bezierCurveTo(11,20,14,0,18,1);c.bezierCurveTo(22,17,30,12,31,0);c.lineTo(38,-6);c.closePath();finish(c,'#fff2d6',false);
    for(var i=-1;i<=1;i++){rounded(c,i*17-2,-42,5,26,2);finish(c,['#9ccdd5','#c1aae2','#f3cb6d'][i+1],false);c.beginPath();c.moveTo(i*17,-43);c.bezierCurveTo(i*17-9,-49,i*17-2,-57,i*17,-60);c.bezierCurveTo(i*17+9,-48,i*17+7,-44,i*17,-43);finish(c,'#f4c75a',false);}face(c,0,28,14,.9);
  }
  var makers={berry:berry,apple:apple,orange:orange,cookie:cookie,carrot:carrot,icecream:icecream,melon:melon,donut:smallDonut,star:sugarStar,cake:cake};
  function sprite(type) {
    if(cache[type])return cache[type];
    var canvas=document.createElement('canvas');canvas.width=320;canvas.height=360;var c=canvas.getContext('2d');c.scale(2,2);c.translate(80,94);c.lineJoin='round';c.lineCap='round';(makers[type]||cookie)(c);cache[type]=canvas;return canvas;
  }
  function food(c,type,x,y,r,rotation,opacity){c.save();c.translate(x,y);c.rotate(rotation||0);c.globalAlpha=opacity===undefined?1:opacity;c.drawImage(sprite(type),-r*1.78,-r*2.09,r*3.56,r*4);c.restore();}
  function hole(c,x,y,r,skin,t,options) {
    options=options||{};var pop=options.pop||0,rainbow=options.rainbow||false;
    c.save();c.translate(x,y);c.scale(1+pop*.12,1-pop*.08);
    ellipse(c,0,r*.4,r*1.16,r*.45,'rgba(51,70,44,.13)');
    if(rainbow){c.save();c.scale(1,.71);c.lineWidth=r*.10;c.globalAlpha=.65;for(var j=0;j<6;j++){c.beginPath();c.arc(0,0,r*1.25,t+j*TAU/6,t+(j+1)*TAU/6-.1);c.strokeStyle=['#f2a1ba','#f9d269','#a8d78e','#8dcbd8','#aaa1e0','#e3afdc'][j];c.stroke();}c.restore();}
    c.save();c.scale(1,.72);
    circle(c,0,r*.16,r,'#9e6e42');circle(c,0,0,r,gradient(c,0,-r*.2,r,'#f2c285','#d79b60'));
    circle(c,0,-r*.04,r*.92,gradient(c,-r*.2,-r*.4,r,skin.icing,skin.shade));
    if(skin.id==='rainbow'){
      c.lineWidth=r*.25;for(var q=0;q<6;q++){c.beginPath();c.arc(0,-r*.04,r*.79,q*TAU/6,(q+1)*TAU/6+.02);c.strokeStyle=['#ee9ab3','#f2ca68','#acd195','#8ecdd8','#b2a4db','#e6a9d1'][q];c.stroke();}
    }
    c.beginPath();c.arc(0,-r*.04,r*.81,3.6,4.85);c.strokeStyle='rgba(255,255,227,.48)';c.lineWidth=r*.085;c.lineCap='round';c.stroke();
    for(var i=0;i<21;i++){var a=i*2.39996,rr=r*(.76+(i%3)*.045);c.save();c.translate(Math.cos(a)*rr,Math.sin(a)*rr-r*.04);c.rotate(a+.6);rounded(c,-r*.045,-r*.017,r*.09,r*.034,r*.017);finish(c,skin.sprinkles[i%skin.sprinkles.length],false);c.restore();}
    circle(c,0,r*.055,r*.65,'#ab7254');circle(c,0,r*.025,r*.594,gradient(c,0,-r*.2,r*.8,skin.hole,'#181b29'));
    c.save();circle(c,0,r*.025,r*.59);c.clip();
    for(var k=0;k<4;k++){c.beginPath();c.ellipse(Math.sin(t*.8+k)*r*.04,r*(.12+k*.025),r*(.5-k*.09),r*(.4-k*.07),t*.09+k*.45,0,TAU);c.strokeStyle='rgba(173,137,204,'+(.08+k*.018)+')';c.lineWidth=r*.026;c.stroke();}
    for(var n=0;n<8;n++){var angle=t*.26+n*2.399,rad=r*(.2+(n%3)*.12);circle(c,Math.cos(angle)*rad,Math.sin(angle)*rad,Math.max(.65,r*.012),'rgba(232,217,255,.35)');}c.restore();
    // The face sits on the frosting, leaving the opening easy to read.
    var blink=Math.sin(t*.8)> .996;
    ellipse(c,-r*.36,-r*.69,r*.055,blink?r*.015:r*.086,'#383b3a');ellipse(c,r*.36,-r*.69,r*.055,blink?r*.015:r*.086,'#383b3a');
    if(!blink){circle(c,-r*.375,-r*.72,r*.016,'#fff8df');circle(c,r*.345,-r*.72,r*.016,'#fff8df');}
    ellipse(c,-r*.52,-r*.62,r*.067,r*.03,'rgba(245,189,185,.6)');ellipse(c,r*.52,-r*.62,r*.067,r*.03,'rgba(245,189,185,.6)');
    c.beginPath();c.moveTo(-r*.10,r*.79);c.quadraticCurveTo(0,r*(.91+pop*.06),r*.1,r*.79);c.strokeStyle='#77524a';c.lineWidth=r*.032;c.stroke();
    if(skin.id==='rainbow'){star(c,0,-r*1.08,r*.2,r*.1,-Math.PI/2,'#f8d166');c.strokeStyle='#c6a44d';c.lineWidth=1;c.stroke();}
    c.restore();c.restore();
  }
  function seeded(seed) { return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}; }
  function background(w,h,index) {
    var canvas=document.createElement('canvas');canvas.width=Math.ceil(w);canvas.height=Math.ceil(h);var c=canvas.getContext('2d'),world=window.SnackLogic.WORLDS[index],rand=seeded(800+index),u=Math.min(w,h)/600;
    var g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,world.ground);g.addColorStop(1,world.color);c.fillStyle=g;c.fillRect(0,0,w,h);
    // Broad soft patches give the table a miniature storybook landscape.
    for(var i=0;i<9;i++){c.globalAlpha=.11;ellipse(c,rand()*w,rand()*h,(70+rand()*150)*u,(50+rand()*80)*u,i%2?'#fff4c8':world.edge);}c.globalAlpha=1;
    if(index===0||index===4){
      c.beginPath();c.moveTo(-50,h*.8);c.bezierCurveTo(w*.25,h*.35,w*.45,h*.95,w+70,h*.25);c.strokeStyle='rgba(248,236,190,.45)';c.lineWidth=45*u;c.stroke();
      c.setLineDash([2*u,14*u]);c.lineWidth=2*u;c.strokeStyle='rgba(173,176,112,.25)';c.stroke();c.setLineDash([]);
    }
    if(index===1){
      c.fillStyle='#9adadd';c.beginPath();c.moveTo(0,h*.74);c.bezierCurveTo(w*.35,h*.77,w*.58,h*.95,w,h*.78);c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fill();
      c.beginPath();c.moveTo(-10,h*.73);c.bezierCurveTo(w*.35,h*.76,w*.58,h*.94,w+10,h*.77);c.lineWidth=9*u;c.strokeStyle='rgba(255,255,235,.6)';c.stroke();
      for(i=0;i<10;i++){ellipse(c,rand()*w,h*(.85+rand()*.15),rand()*20*u+5,3*u,'rgba(230,253,239,.25)');}
    }
    if(index===2){
      c.save();c.translate(w*.7,h*.45);c.rotate(-.15);for(i=-12;i<20;i++){c.fillStyle=i%2?'rgba(255,249,221,.2)':'rgba(217,160,184,.1)';c.fillRect(i*70*u,-h*1.5,35*u,h*3);}c.restore();
    }
    if(index===3){for(i=0;i<16;i++){var rr=(14+rand()*32)*u;circle(c,rand()*w,rand()*h,rr,'rgba(120,117,170,.09)');c.strokeStyle='rgba(249,242,255,.23)';c.lineWidth=3*u;c.stroke();}}
    for(i=0;i<200;i++){var x=rand()*w,y=rand()*h;c.fillStyle=i%3?'rgba(79,113,66,.11)':'rgba(255,255,223,.5)';circle(c,x,y,(.7+rand())*u,c.fillStyle);}
    for(i=0;i<21;i++){
      var side=i%4,x1=side===0?rand()*w:side===1?w+rand()*18:side===2?rand()*w:-rand()*18,y1=side===0?-rand()*15:side===1?rand()*h:side===2?h+rand()*15:rand()*h,r=(22+rand()*25)*u;
      if(index===0||index===4){
        for(var j=0;j<4;j++)circle(c,x1+Math.cos(j*1.6)*r*.45,y1+Math.sin(j*1.6)*r*.4,r*.65,['#96bb76','#a2c383','#b4d096'][j%3]);
        if(i%3===0){for(j=0;j<5;j++)ellipse(c,x1+Math.cos(j*TAU/5)*r*.22,y1+Math.sin(j*TAU/5)*r*.22,r*.14,r*.1,'#fff5d5');circle(c,x1,y1,r*.1,'#e9c775');}
      }else if(index===1){c.save();c.translate(x1,y1);c.rotate(rand()*6);star(c,0,0,r*.6,r*.28,0,'#ecbfa1');c.restore();}
      else if(index===2){circle(c,x1,y1,r*.7,'#fff1cf');circle(c,x1,y1,r*.5,'#e7b5cd');circle(c,x1,y1,r*.22,world.ground);}
      else{star(c,x1,y1,r*.5,r*.22,rand()*6,'rgba(255,242,187,.7)');}
    }
    // A few tiny clovers sit at the edges rather than obstructing snacks.
    c.strokeStyle='rgba(255,255,224,.4)';c.lineWidth=2;c.strokeRect(10,10,w-20,h-20);
    return canvas;
  }
  window.SnackArt={food:food,hole:hole,background:background,star:star,circle:circle,ellipse:ellipse,rounded:rounded,sprite:sprite};
}());
