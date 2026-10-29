/* BeeNews prayer-time calculation (no network needed).
   Astronomical method after PrayTimes.org (Hamid Zarrabi-Zadeh, LGPL); UAE parameters by default:
   Fajr 18.2°, Isha 18.2°, Asr standard (Shafi'i), with the UAE minute adjustments
   (sunrise −3, Dhuhr +3, Asr +3, Maghrib +3). Times are calculated, so they can differ from the
   official IACAD/Awqaf timetable by a minute or two. */
(function(g){
  const dtr=d=>d*Math.PI/180, rtd=r=>r*180/Math.PI;
  const sin=d=>Math.sin(dtr(d)), cos=d=>Math.cos(dtr(d)), tan=d=>Math.tan(dtr(d));
  const asin=x=>rtd(Math.asin(x)), acos=x=>rtd(Math.acos(x)), atan2=(y,x)=>rtd(Math.atan2(y,x)), acot=x=>rtd(Math.atan(1/x));
  const fix=(a,b)=>{ a=a-b*Math.floor(a/b); return a<0?a+b:a; };
  function julian(y,m,d){ if(m<=2){y-=1;m+=12;} const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
    return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5; }
  function sunPos(jd){ const D=jd-2451545.0, gg=fix(357.529+0.98560028*D,360), q=fix(280.459+0.98564736*D,360);
    const L=fix(q+1.915*sin(gg)+0.020*sin(2*gg),360), e=23.439-0.00000036*D;
    const RA=atan2(cos(e)*sin(L),cos(L))/15; return {decl:asin(sin(e)*sin(L)), eqt:q/15-fix(RA,24)}; }
  const METHODS = {
    UAE:     {fajr:18.2, isha:18.2, adj:{sunrise:-3, dhuhr:3, asr:3, maghrib:3}},
    Karachi: {fajr:18,   isha:18,   adj:{}}
  };
  function times(date, lat, lng, tz, method){
    const M=METHODS[method||"UAE"];
    const jd=julian(date.y,date.m,date.d)-lng/(15*24);
    const midDay=t=>fix(12-sunPos(jd+t).eqt,24);
    const angleTime=(a,t,ccw)=>{ const s=sunPos(jd+t), noon=midDay(t);
      const T=acos((-sin(a)-sin(s.decl)*sin(lat))/(cos(s.decl)*cos(lat)))/15; return noon+(ccw?-T:T); };
    const asr=(f,t)=>{ const d=sunPos(jd+t).decl; return angleTime(-acot(f+tan(Math.abs(lat-d))),t); };
    // first pass with default day portions, second pass refined (as PrayTimes does)
    let tt={fajr:5,sunrise:6,dhuhr:12,asr:13,maghrib:18,isha:18};
    for(let i=0;i<2;i++){
      const p={}; for(const k in tt) p[k]=tt[k]/24;
      tt={fajr:angleTime(M.fajr,p.fajr,true), sunrise:angleTime(0.833,p.sunrise,true), dhuhr:midDay(p.dhuhr),
          asr:asr(1,p.asr), maghrib:angleTime(0.833,p.maghrib), isha:angleTime(M.isha,p.isha)};
    }
    const out={};
    for(const k in tt){ let h=tt[k]+tz-lng/15+(M.adj[k]||0)/60; h=fix(h,24);
      const mins=Math.round(h*60); out[k]={h:Math.floor(mins/60)%24, m:mins%60}; }
    return out;
  }
  g.BeePray={times};
})(window);
