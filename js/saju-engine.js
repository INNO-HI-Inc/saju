/* 사주 만세력 엔진 — 브라우저 JS 포팅 (서버 없이 클라이언트에서 계산)
 * Python saju-engine 과 동일 로직. 절기는 로컬 천문계산(Meeus)으로 전 연도 커버.
 * node 테스트/브라우저 양쪽 지원.
 */
(function (root) {
  "use strict";

  // ── 오행 ──
  var WOOD="목",FIRE="화",EARTH="토",METAL="금",WATER="수";
  var ELEMENTS=[WOOD,FIRE,EARTH,METAL,WATER];
  var GEN={목:FIRE,화:EARTH,토:METAL,금:WATER,수:WOOD};      // 상생
  var CON={목:EARTH,토:WATER,수:FIRE,화:METAL,금:WOOD};       // 상극

  // ── 천간 [ko,hanja,elem,yang] ──
  var STEMS=[["갑","甲",WOOD,true],["을","乙",WOOD,false],["병","丙",FIRE,true],
    ["정","丁",FIRE,false],["무","戊",EARTH,true],["기","己",EARTH,false],
    ["경","庚",METAL,true],["신","辛",METAL,false],["임","壬",WATER,true],["계","癸",WATER,false]];
  var S_KO=STEMS.map(function(s){return s[0];}), S_HJ=STEMS.map(function(s){return s[1];}),
      S_EL=STEMS.map(function(s){return s[2];}), S_YANG=STEMS.map(function(s){return s[3];});

  // ── 지지 [ko,hanja,elem,yang,animal] ──
  var BRANCHES=[["자","子",WATER,true,"쥐"],["축","丑",EARTH,false,"소"],["인","寅",WOOD,true,"호랑이"],
    ["묘","卯",WOOD,false,"토끼"],["진","辰",EARTH,true,"용"],["사","巳",FIRE,false,"뱀"],
    ["오","午",FIRE,true,"말"],["미","未",EARTH,false,"양"],["신","申",METAL,true,"원숭이"],
    ["유","酉",METAL,false,"닭"],["술","戌",EARTH,true,"개"],["해","亥",WATER,false,"돼지"]];
  var B_KO=BRANCHES.map(function(b){return b[0];}), B_HJ=BRANCHES.map(function(b){return b[1];}),
      B_EL=BRANCHES.map(function(b){return b[2];}), B_ANI=BRANCHES.map(function(b){return b[4];});

  // ── 지장간 {지지idx:[[천간idx,일수]...]} 정기=마지막 ──
  var HIDDEN={
    0:[[9,10],[8,20]],1:[[9,9],[7,3],[5,18]],2:[[4,7],[2,7],[0,16]],3:[[0,10],[1,20]],
    4:[[1,9],[9,3],[4,18]],5:[[4,7],[6,7],[2,16]],6:[[2,10],[5,9],[3,11]],7:[[3,9],[1,3],[5,18]],
    8:[[4,7],[8,7],[6,16]],9:[[6,10],[7,20]],10:[[7,9],[3,3],[4,18]],11:[[4,7],[0,7],[8,16]]};
  var MAIN={}; for(var bi=0;bi<12;bi++){MAIN[bi]=HIDDEN[bi][HIDDEN[bi].length-1][0];}

  // ── 십성표 ──
  var TEN={ "same동":"비견","same이":"겁재","iGen동":"식신","iGen이":"상관",
    "iCon동":"편재","iCon이":"정재","conMe동":"편관","conMe이":"정관","genMe동":"편인","genMe이":"정인"};

  // ── 12운성 ──
  var STAGES=["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
  var JANGSAENG={0:11,1:6,2:2,3:9,4:2,5:9,6:5,7:0,8:8,9:3};
  var TWELVE_LIFE={};
  for(var si=0;si<10;si++){var st=JANGSAENG[si],step=S_YANG[si]?1:-1,d={};
    for(var k=0;k<12;k++){d[((st+step*k)%12+12)%12]=STAGES[k];}TWELVE_LIFE[si]=d;}

  // ── 12신살 ──
  var SIN=["지살","년살","월살","망신살","장성살","반안살","역마살","육해살","화개살","겁살","재살","천살"];
  var TRIAD={8:"수",0:"수",4:"수",11:"목",3:"목",7:"목",2:"화",6:"화",10:"화",5:"금",9:"금",1:"금"};
  var JISAL={화:2,수:8,금:5,목:11};
  var TWELVE_SIN={};
  for(var b2=0;b2<12;b2++){var start=JISAL[TRIAD[b2]],dd={};
    for(var k2=0;k2<12;k2++){dd[(start+k2)%12]=SIN[k2];}TWELVE_SIN[b2]=dd;}

  function idx60(s,b){for(var i=0;i<60;i++){if(i%10===s&&i%12===b)return i;}return -1;}

  // ════════ 24절기 (Meeus) ════════
  var RAD=Math.PI/180, KST_MS=9*3600*1000;
  var JIE_DEG=[315,345,15,45,75,105,135,165,195,225,255,285];
  var JIE_BRANCH={315:2,345:3,15:4,45:5,75:6,105:7,135:8,165:9,195:10,225:11,255:0,285:1};

  function jdFromUTCms(ms){ return ms/86400000 + 2440587.5; }

  function deltaT(year){
    var t;
    if(year>=1986&&year<2005){t=year-2000;return 63.86+0.3345*t-0.060374*t*t+0.0017275*t*t*t+0.000651814*t*t*t*t+0.00002373599*t*t*t*t*t;}
    if(year>=2005&&year<2050){t=year-2000;return 62.92+0.32217*t+0.005589*t*t;}
    if(year>=1961&&year<1986){t=year-1975;return 45.45+1.067*t-t*t/260-t*t*t/718;}
    if(year>=1941&&year<1961){t=year-1950;return 29.07+0.407*t-t*t/233+t*t*t/2547;}
    if(year>=1920&&year<1941){t=year-1920;return 21.20+0.84493*t-0.076100*t*t+0.0020936*t*t*t;}
    if(year>=1900&&year<1920){t=year-1900;return -2.79+1.494119*t-0.0598939*t*t+0.0061966*t*t*t-0.000197*t*t*t*t;}
    if(year>=2050&&year<=2150){return -20+32*Math.pow((year-1820)/100,2)-0.5628*(2150-year);}
    var u=(year-1820)/100;return -20+32*u*u;
  }

  function sunLon(jde){ // 태양 겉보기황경(deg)
    var T=(jde-2451545.0)/36525.0;
    var L0=280.46646+36000.76983*T+0.0003032*T*T;
    var M=357.52911+35999.05029*T-0.0001537*T*T, Mr=M*RAD;
    var C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mr)
        +(0.019993-0.000101*T)*Math.sin(2*Mr)+0.000289*Math.sin(3*Mr);
    var tl=L0+C, om=125.04-1934.136*T;
    var ap=tl-0.00569-0.00478*Math.sin(om*RAD);
    return ((ap%360)+360)%360;
  }

  function lonAtMs(ms,year){ // KST/UTC 무관, 절대 instant(ms)에서의 황경
    var jde=jdFromUTCms(ms+deltaT(year)*1000);
    return sunLon(jde);
  }

  function signedDiff(lon,target){ return (((lon-target+180)%360)+360)%360-180; }

  // year(양력)에서 태양황경 target에 도달하는 절기 instant(ms, UTC epoch)
  function findTermMs(year,target){
    var day=86400000;
    var t=Date.UTC(year,0,1)-KST_MS; // KST 1/1 00:00 의 epoch
    var end=Date.UTC(year+1,0,2)-KST_MS;
    var prev=signedDiff(lonAtMs(t,year),target);
    while(t<end){
      var nxt=t+day, cur=signedDiff(lonAtMs(nxt,year),target);
      if(prev<0&&cur>=0){
        var lo=t,hi=nxt;
        for(var i=0;i<40;i++){var mid=(lo+hi)/2; if(signedDiff(lonAtMs(mid,year),target)<0)lo=mid;else hi=mid;}
        return (lo+hi)/2;
      }
      prev=cur; t=nxt;
    }
    throw new Error(year+"년 "+target+"° 절기 못찾음");
  }

  function ipchunMs(year){ return findTermMs(year,315); }

  function allJieAround(ms,year){
    var out=[];
    [year-1,year,year+1].forEach(function(yy){
      JIE_DEG.forEach(function(deg){ out.push([findTermMs(yy,deg),deg]); });
    });
    out.sort(function(a,b){return a[0]-b[0];});
    return out;
  }
  function monthBranchIdx(ms,year){
    var jies=allJieAround(ms,year),last=null;
    for(var i=0;i<jies.length;i++){ if(jies[i][0]<=ms)last=jies[i][1]; else break; }
    return JIE_BRANCH[last];
  }
  function prevNextJie(ms,year){
    var jies=allJieAround(ms,year),prev=null,next=null;
    for(var i=0;i<jies.length;i++){ if(jies[i][0]<=ms)prev=jies[i][0]; else {next=jies[i][0];break;} }
    return [prev,next];
  }

  // ════════ 4기둥 ════════
  function civilJDN(y,m,d){var a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3;
    return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;}
  var DAY_OFF=((22-civilJDN(1998,6,8))%60+60)%60; // 1998-06-08=병술(22)

  function mod(n,m){return ((n%m)+m)%m;}

  function pillar(s,b){
    s=mod(s,10);b=mod(b,12);var main=MAIN[b];
    return {stem_idx:s,branch_idx:b,stem:S_KO[s],stem_hanja:S_HJ[s],
      branch:B_KO[b],branch_hanja:B_HJ[b],ganji:S_KO[s]+B_KO[b],ganji_hanja:S_HJ[s]+B_HJ[b],
      animal:B_ANI[b],stem_elem:S_EL[s],stem_sign:S_YANG[s]?"+":"-",
      branch_elem:B_EL[b],branch_sign:S_YANG[main]?"+":"-"};
  }
  function hourBranchIdx(h){return mod(Math.floor((h+1)/2),12);}

  function computePillars(y,mo,d,h,mi,gender,lateZi){
    var birthMs=Date.UTC(y,mo-1,d,h-9,mi); // KST→epoch
    // 일주(자정/야자시)
    var dy=y,dm=mo,dd=d;
    if(lateZi&&h===23){var nd=new Date(Date.UTC(y,mo-1,d)+86400000);dy=nd.getUTCFullYear();dm=nd.getUTCMonth()+1;dd=nd.getUTCDate();}
    var jdn=civilJDN(dy,dm,dd),di60=mod(jdn+DAY_OFF,60),dayStem=di60%10,dayBranch=di60%12;
    // 년주(입춘)
    var sy=y; if(birthMs<ipchunMs(y))sy-=1;
    var yo=mod(sy-1984,60),yStem=yo%10,yBranch=yo%12;
    // 월주
    var mBranch=monthBranchIdx(birthMs,y);
    var IPWOL={0:2,5:2,1:4,6:4,2:6,7:6,3:8,8:8,4:0,9:0};
    var mStem=mod(IPWOL[yStem]+mod(mBranch-2,12),10);
    // 시주
    var hBranch=hourBranchIdx(h);
    var JASI={0:0,5:0,1:2,6:2,2:4,7:4,3:6,8:6,4:8,9:8};
    var hStem=mod(JASI[dayStem]+hBranch,10);
    return {year:pillar(yStem,yBranch),month:pillar(mStem,mBranch),
      day:pillar(dayStem,dayBranch),hour:pillar(hStem,hBranch),
      day_master_idx:dayStem,day_master:S_KO[dayStem],
      meta:{saju_year:sy,gender:gender,late_zi:lateZi,birth_ms:birthMs}};
  }

  // ════════ 파생 ════════
  function tenStar(dm,t){
    dm=mod(dm,10);t=mod(t,10);
    var de=S_EL[dm],dy=S_YANG[dm],te=S_EL[t],ty=S_YANG[t],rel;
    if(te===de)rel="same"; else if(GEN[de]===te)rel="iGen"; else if(CON[de]===te)rel="iCon";
    else if(GEN[te]===de)rel="genMe"; else if(CON[te]===de)rel="conMe"; else rel="same";
    return TEN[rel+(ty===dy?"동":"이")];
  }
  function branchTenStar(dm,b){return tenStar(dm,MAIN[mod(b,12)]);}
  function hiddenStems(b,dm){
    b=mod(b,12);var items=HIDDEN[b],str="",detail=[];
    items.forEach(function(it){str+=S_KO[it[0]];
      var e={stem:S_KO[it[0]],stem_hanja:S_HJ[it[0]],elem:S_EL[it[0]],days:it[1]};
      if(dm!=null)e.ten_star=tenStar(dm,it[0]);detail.push(e);});
    return {str:str,detail:detail};
  }
  function twelveLife(dm,b){return TWELVE_LIFE[mod(dm,10)][mod(b,12)];}
  function twelveSin(base,b){return TWELVE_SIN[mod(base,12)][mod(b,12)];}
  function elementCount(pil,weighted){
    var cnt={};ELEMENTS.forEach(function(e){cnt[e]=0;});
    ["year","month","day","hour"].forEach(function(k){var p=pil[k];cnt[p.stem_elem]+=1;
      if(!weighted)cnt[p.branch_elem]+=1;});
    if(weighted){["year","month","day","hour"].forEach(function(k){var b=pil[k].branch_idx;
      HIDDEN[b].forEach(function(it){cnt[S_EL[it[0]]]+=it[1]/30;});});}
    return cnt;
  }

  // ════════ 신강약/용신 ════════
  var BANDS=["극약","태약","신약","중화신약","중화신강","신강","태강","극왕"];
  var CUTS=[18,30,41,48,57,68,80];
  var POSW={year:1,month:3,day:2,hour:1};
  var ROOTW={장생:1,관대:1,건록:1,제왕:1,목욕:0.5,양:0.5,쇠:0.5,묘:0.1,병:0.2,사:0,절:0,태:0.3};
  function supports(de,e){return e===de||GEN[e]===de;}
  function deukFlags(pil){
    var de=S_EL[pil.day_master_idx];
    function bs(k){return supports(de,B_EL[pil[k].branch_idx]);}
    var cnt=elementCount(pil,true),sup=0,tot=0;
    ELEMENTS.forEach(function(e){tot+=cnt[e];if(supports(de,e))sup+=cnt[e];});
    return {득령:bs("month"),득지:bs("day"),득시:bs("hour"),득세:sup>tot/2};
  }
  function strength(pil){
    var dmI=pil.day_master_idx,de=S_EL[dmI],sup=1,opp=0,keys=["year","month","day","hour"];
    keys.forEach(function(k){if(k==="day")return;var e=pil[k].stem_elem;if(supports(de,e))sup+=1;else opp+=1;});
    keys.forEach(function(k){var w=POSW[k],b=pil[k].branch_idx;
      HIDDEN[b].forEach(function(it){var e=S_EL[it[0]],v=it[1]/30*w;if(supports(de,e))sup+=v;else opp+=v;});});
    var sr=sup/(sup+opp),rn=0,rd=0;
    keys.forEach(function(k){var w=POSW[k],life=twelveLife(dmI,pil[k].branch_idx);rn+=(ROOTW[life]||0)*w;rd+=w;});
    var rr=rn/rd,index=Math.round(100*(0.55*sr+0.45*rr)),band=BANDS[0];
    for(var i=0;i<CUTS.length;i++){if(index>=CUTS[i])band=BANDS[i+1];}
    return {index:index,band:band,is_strong:index>=CUTS[3],
      support_ratio:Math.round(sr*1e4)/1e4,root_ratio:Math.round(rr*1e4)/1e4,
      deuk:deukFlags(pil),band_index:BANDS.indexOf(band)};
  }
  var SEASON={2:"봄",3:"봄",4:"봄",5:"여름",6:"여름",7:"여름",8:"가을",9:"가을",10:"가을",11:"겨울",0:"겨울",1:"겨울"};
  function johu(pil){var s=SEASON[pil.month.branch_idx],dm=S_EL[pil.day_master_idx];
    if(s==="여름")return WATER;if(s==="겨울")return FIRE;if(s==="봄")return dm===WOOD?METAL:FIRE;return FIRE;}
  function eokbu(pil,st){var dm=S_EL[pil.day_master_idx];
    var conMe=ELEMENTS.filter(function(e){return CON[e]===dm;})[0];
    var iGen=GEN[dm],iCon=CON[dm],genMe=ELEMENTS.filter(function(e){return GEN[e]===dm;})[0];
    var cnt=elementCount(pil,true),cand;
    if(st.is_strong){cand=[conMe,iGen,iCon];}else{cand=[genMe,dm];}
    for(var i=0;i<cand.length;i++){if(cnt[cand[i]]>0)return cand[i];}
    return cand[0];
  }

  // ════════ 대운/세운 ════════
  function luckDir(yStem,gender){
    var yang=S_YANG[yStem],male=(gender==="M"||gender==="남");
    return (yang&&male)||(!yang&&!male);
  }
  function daeunNumber(birthMs,year,forward){
    var pn=prevNextJie(birthMs,year),days;
    if(forward)days=(pn[1]-birthMs)/86400000; else days=(birthMs-pn[0])/86400000;
    var num=Math.round(days/3);if(num<1)num=1;
    return {number:num,days_to_term:Math.round(days*1000)/1000};
  }
  function daeunList(pil,gender,count){
    count=count||10;var dmI=pil.day_master_idx,forward=luckDir(pil.year.stem_idx,gender);
    var num=daeunNumber(pil.meta.birth_ms,new Date(pil.meta.birth_ms).getUTCFullYear()+ (new Date(pil.meta.birth_ms).getUTCMonth()>=0?0:0), forward);
    var y=new Date(pil.meta.birth_ms+KST_MS).getUTCFullYear();
    num=daeunNumber(pil.meta.birth_ms,y,forward);
    var mi60=idx60(pil.month.stem_idx,pil.month.branch_idx),step=forward?1:-1,out=[];
    for(var k=0;k<count;k++){var i60=mod(mi60+step*(k+1),60),s=i60%10,b=i60%12;
      out.push({age:num.number+k*10,ganji:S_KO[s]+B_KO[b],ganji_hanja:S_HJ[s]+B_HJ[b],
        stem_ten_star:tenStar(dmI,s),branch_ten_star:branchTenStar(dmI,b),twelve_life:twelveLife(dmI,b),
        stem_elem:S_EL[s],branch_elem:B_EL[b]});}
    return {direction:forward?"순행":"역행",daeun_su:num,list:out};
  }
  function seunList(pil,startYear,count){
    count=count||10;var dmI=pil.day_master_idx,out=[];
    for(var y=startYear;y<startYear+count;y++){var i60=mod(y-1984,60),s=i60%10,b=i60%12;
      out.push({year:y,ganji:S_KO[s]+B_KO[b],ganji_hanja:S_HJ[s]+B_HJ[b],
        stem_ten_star:tenStar(dmI,s),branch_ten_star:branchTenStar(dmI,b),twelve_life:twelveLife(dmI,b),
        stem_elem:S_EL[s],branch_elem:B_EL[b]});}
    return out;
  }

  // ════════ 분석(오행%/십성%/관계도/별명/월운) ════════
  var COLOR={목:"푸른",화:"붉은",토:"노란",금:"하얀",수:"검은"};
  function nickname(si,bi){ return COLOR[S_EL[si%10]]+" "+B_ANI[bi%12]; }

  var TEN_ORDER=["비견","겁재","식신","상관","편재","정재","편관","정관","편인","정인"];
  function elemPct(pil){
    var c={}; ELEMENTS.forEach(function(e){c[e]=0;});
    ["year","month","day","hour"].forEach(function(k){ c[pil[k].stem_elem]++; c[pil[k].branch_elem]++; });
    var pct={}; ELEMENTS.forEach(function(e){ pct[e]=c[e]/8*100; });
    return {count:c, pct:pct};
  }
  function tenstarStats(pil,dmI){
    var counts={}; TEN_ORDER.forEach(function(t){counts[t]=0;});
    ["year","month","day","hour"].forEach(function(k){
      var ts=(k==="day")?"비견":tenStar(dmI,pil[k].stem_idx);
      counts[ts]++; counts[branchTenStar(dmI,pil[k].branch_idx)]++;
    });
    var pct={},dom="비견",max=-1;
    TEN_ORDER.forEach(function(t){ pct[t]=counts[t]/8*100; if(counts[t]>max){max=counts[t];dom=t;} });
    return {counts:counts, pct:pct, dominant:dom};
  }
  // 오행 관계도(일간 기준 5그룹 %)
  function elemGroups(pil,dmElem){
    var pct=elemPct(pil).pct;
    var iGen=GEN[dmElem], iCon=CON[dmElem];
    var genMe=ELEMENTS.filter(function(e){return GEN[e]===dmElem;})[0];
    var conMe=ELEMENTS.filter(function(e){return CON[e]===dmElem;})[0];
    return [
      {key:"비겁",elem:dmElem,pct:pct[dmElem]},
      {key:"식상",elem:iGen,pct:pct[iGen]},
      {key:"재성",elem:iCon,pct:pct[iCon]},
      {key:"관성",elem:conMe,pct:pct[conMe]},
      {key:"인성",elem:genMe,pct:pct[genMe]}
    ];
  }
  // 월운: 특정 연도의 12개월 간지(절기월). 그 해 년간 기준 월두법.
  function wolunList(pil,dmI,year){
    var yi60=mod(year-1984,60), yStem=yi60%10;
    var IPWOL={0:2,5:2,1:4,6:4,2:6,7:6,3:8,8:8,4:0,9:0};
    var ipwol=IPWOL[yStem], out=[];
    for(var i=0;i<12;i++){
      var bi=mod(2+i,12), si=mod(ipwol+i,10);
      var monLabel=((i+2>12)?(i+2-12):(i+2)); // 인월=2월 근사표기
      out.push({label:(i+1)+"월", mlabel:monLabel+"월",
        ganji:S_KO[si]+B_KO[bi], ganji_hanja:S_HJ[si]+B_HJ[bi],
        stem_ten_star:tenStar(dmI,si), branch_ten_star:branchTenStar(dmI,bi),
        twelve_life:twelveLife(dmI,bi), stem_elem:S_EL[si], branch_elem:B_EL[bi]});
    }
    return out;
  }
  // 신살/길성(주요 항목) — 일간·일지·년지 기준
  var CHEONEUL={0:[1,7],5:[1,7],1:[0,8],6:[0,8],2:[11,9],7:[11,9],3:[11,9],8:[11,9],4:[1,7],9:[3,5]};
  var MUNCHANG={0:5,1:6,2:8,3:9,4:8,5:9,6:11,7:0,8:2,9:3}; // 문창귀인(일간→지지)
  var YEOKMA={2:8,6:8,10:8, 8:2,0:2,4:2, 5:11,9:11,1:11, 11:5,3:5,7:5}; // 삼합기준 역마(지지)
  var HWAGAE={2:10,6:10,10:10, 8:4,0:4,4:4, 5:1,9:1,1:1, 11:7,3:7,7:7}; // 화개
  var DOHWA={2:3,6:3,10:3, 8:9,0:9,4:9, 5:6,9:6,1:6, 11:0,3:0,7:0}; // 도화(년살)
  var YANGIN={0:3,2:6,4:6,6:9,8:0}; // 양인(양간 일간→지지)
  function gilsinOf(pil,dmI){
    var res={}; var keys=["hour","day","month","year"];
    var dayBranch=pil.day.branch_idx, yearBranch=pil.year.branch_idx;
    keys.forEach(function(k){
      var bi=pil[k].branch_idx, tags=[];
      if(CHEONEUL[dmI] && CHEONEUL[dmI].indexOf(bi)>=0) tags.push("천을귀인");
      if(MUNCHANG[dmI]===bi) tags.push("문창귀인");
      if(YEOKMA[dayBranch]===bi || YEOKMA[yearBranch]===bi) tags.push("역마살");
      if(HWAGAE[dayBranch]===bi || HWAGAE[yearBranch]===bi) tags.push("화개살");
      if(DOHWA[dayBranch]===bi || DOHWA[yearBranch]===bi) tags.push("도화살");
      if(YANGIN[dmI]===bi) tags.push("양인살");
      // 괴강(경진·경술·임진·무술·임술 일주)
      var djg=pil.day.stem_idx+"-"+pil.day.branch_idx;
      if(k==="day" && ["6-4","6-10","8-4","4-10","8-10"].indexOf(djg)>=0) tags.push("괴강살");
      // 현침(갑·신 천간 + 묘·오·신·미 지지 계열 간이)
      res[k]=tags;
    });
    return res;
  }

  // ════════ 통합 ════════
  function pillarView(pil,key,dmI,sinBase){
    var p=pil[key],b=p.branch_idx;
    return {stem:{ko:p.stem,hanja:p.stem_hanja,elem:p.stem_elem,sign:p.stem_sign,
        ten_star:key==="day"?"일간":tenStar(dmI,p.stem_idx)},
      branch:{ko:p.branch,hanja:p.branch_hanja,elem:p.branch_elem,sign:p.branch_sign,
        animal:p.animal,ten_star:branchTenStar(dmI,b)},
      hidden_stems:hiddenStems(b,dmI),twelve_life:twelveLife(dmI,b),twelve_sin:twelveSin(sinBase,b),
      ganji:p.ganji,ganji_hanja:p.ganji_hanja};
  }
  function buildChart(y,mo,d,h,mi,gender,lateZi,seunSpan){
    mi=mi||0;gender=gender||"F";seunSpan=seunSpan||10;
    var pil=computePillars(y,mo,d,h,mi,gender,lateZi);
    var dmI=pil.day_master_idx,sinBase=pil.year.branch_idx;
    var chart={};["hour","day","month","year"].forEach(function(k){chart[k]=pillarView(pil,k,dmI,sinBase);});
    var st=strength(pil);
    var thisYear=new Date().getFullYear? y:y; // seun 기준: 출생연도부터
    return {
      input:{solar:y+"-"+pad(mo)+"-"+pad(d)+" "+pad(h)+":"+pad(mi),gender:gender,late_zi:lateZi},
      day_master:{ko:pil.day_master,hanja:S_HJ[dmI],elem:S_EL[dmI],sign:S_YANG[dmI]?"+":"-"},
      pillars:{"년주":pil.year.ganji,"월주":pil.month.ganji,"일주":pil.day.ganji,"시주":pil.hour.ganji,
        hanja:{"년주":pil.year.ganji_hanja,"월주":pil.month.ganji_hanja,"일주":pil.day.ganji_hanja,"시주":pil.hour.ganji_hanja}},
      chart:chart,
      elements:{count:elementCount(pil,false),weighted:elementCount(pil,true)},
      strength:st,
      yongshin:{johu:johu(pil),eokbu:eokbu(pil,st)},
      daeun:daeunList(pil,gender,10),
      seun:seunList(pil,y,seunSpan),
      wolun:wolunList(pil,dmI,y),
      nickname:nickname(pil.day.stem_idx,pil.day.branch_idx),
      elements2:elemPct(pil),
      tenstar:tenstarStats(pil,dmI),
      groups:elemGroups(pil,S_EL[dmI]),
      gilsin:gilsinOf(pil,dmI),
      meta:pil.meta,
      bands:BANDS
    };
  }
  function pad(n){return (n<10?"0":"")+n;}

  var API={buildChart:buildChart,ELEMENTS:ELEMENTS,BANDS:BANDS,
    _internal:{computePillars:computePillars,findTermMs:findTermMs,ipchunMs:ipchunMs,tenStar:tenStar}};
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
  root.SajuEngine=API;
})(typeof window!=="undefined"?window:this);
