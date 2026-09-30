(() => {
  const ids = ['start', 'experience', 'education', 'safran', 'capstone', 'coursework', 'contact'];
  const points = [[10, 56], [26, 48], [34, 52], [42, 57], [58, 46], [74, 54], [90, 47]];
  const names = ['About', 'Experience', 'Education', 'Safran project', 'Capstone', 'Coursework', 'Contact'];
  const sections = ids.map(id => document.getElementById(id));
  const menu = document.getElementById('journey-menu');

  const motionButton = document.getElementById('motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const frame = document.querySelector('.map-frame');
  const traveler = document.getElementById('traveler');
  // Code-native atmosphere: no paid assets or video downloads.
  const atmosphere = document.createElement('div');
  atmosphere.className = 'atmosphere';
  atmosphere.setAttribute('aria-hidden','true');
  for(let i=0;i<18;i++){
    const glint=document.createElement('i');
    glint.style.cssText=`left:${4+i*5.3}%;top:${15+(i*17)%63}%;animation-delay:${-i*.7}s`;
    atmosphere.append(glint);
  }
  frame.append(atmosphere);
  // Personal keepsakes share the map's horizontal camera and respect motion controls.
  [['aggie',8,22],['soccer',20,32],['basketball',29,20],['aggie',35,27],['sneaker',46,28],['sneaker',61,24],['soccer',76,24],['basketball',86,28],['sneaker',94,19]].forEach(([name,x,y])=>{
    const sprite=document.createElement('img');
    sprite.src=`images/personal-${name}.${name === 'aggie' ? 'svg' : 'png'}`;
    sprite.alt='';sprite.setAttribute('aria-hidden','true');
    sprite.className='personal-float';sprite.style.left=x+'%';sprite.style.top=(y+14)+'%';
    frame.append(sprite);
  });
  let paused = preference.matches, pending = false, scene = -1, current = -1;
  let renderedProgress = null, lastFrame = 0, previousWidth = 0, previousHeight = 0;
  const stops = [...document.querySelectorAll('.map-stop')];
  const previousButton=document.getElementById('previous-stop');
  const nextButton=document.getElementById('next-stop');
  let navigationTarget=null;
  function goToStop(delta){
    const base=navigationTarget===null?Math.max(0,current):navigationTarget;
    navigationTarget=Math.max(0,Math.min(ids.length-1,base+delta));
    const target=sections[navigationTarget];
    target.tabIndex=-1;target.focus({preventScroll:true});
    history.replaceState(null,'','#'+target.id);
    target.scrollIntoView({behavior:paused||preference.matches?'instant':'smooth',block:'start'});
  }
  previousButton.addEventListener('click',()=>goToStop(-1));
  nextButton.addEventListener('click',()=>goToStop(1));
  addEventListener('wheel',()=>{navigationTarget=null;},{passive:true});
  addEventListener('touchstart',()=>{navigationTarget=null;},{passive:true});
  motionButton.hidden = false;
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
    navigationTarget=null;
    const target=document.getElementById(link.hash.slice(1));
    if(target){target.tabIndex=-1;target.focus({preventScroll:true});}
  }));
  function setMotion() {
    document.body.classList.toggle('motion-paused',paused);
    document.documentElement.style.scrollBehavior = paused ? 'auto' : '';
    motionButton.textContent=paused?'Enable motion':'Pause motion';
    motionButton.setAttribute('aria-pressed',String(paused));
    schedule();
  }
  motionButton.addEventListener('click',()=>{paused=!paused;setMotion();});
  preference.addEventListener('change',()=>{paused=preference.matches;setMotion();});
  function update(now) {
    pending=false;
    const anchor = mobile.matches ? 170 : 140;
    let index=0;
    sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<=anchor)index=i;});
    const top=sections[index].getBoundingClientRect().top;
    const next=sections[index+1];
    const fraction=next ? Math.max(0,Math.min(1,(anchor-top)/(next.offsetTop-sections[index].offsetTop))) : 0;
    const targetProgress=index+fraction;
    const dt=Math.min(64,Math.max(1,now-lastFrame || 16.7));
    lastFrame=now;
    // Time-based damping stays consistent on both 60 Hz and high-refresh displays.
    if(renderedProgress===null || paused || preference.matches) renderedProgress=targetProgress;
    else renderedProgress+=(targetProgress-renderedProgress)*(1-Math.exp(-dt/110));
    const settling=Math.abs(targetProgress-renderedProgress)>.0001;
    if(!settling)renderedProgress=targetProgress;
    const visualIndex=Math.min(ids.length-1,Math.floor(renderedProgress));
    const blend=renderedProgress-visualIndex;
    const from=points[visualIndex],to=points[Math.min(visualIndex+1,ids.length-1)];
    const x=from[0]+(to[0]-from[0])*blend,y=from[1]+(to[1]-from[1])*blend;
    // Normal vertical scrolling moves the camera from left to right.
    const imageHeight=Math.max(innerHeight*(mobile.matches?1.3:1),innerWidth*3.4/4.2);
    const imageWidth=imageHeight*4.2;
    const targetX=mobile.matches?.5:.28;
    const offsetX=Math.max(innerWidth-imageWidth,Math.min(0,innerWidth*targetX-imageWidth*x/100));
    if(imageWidth!==previousWidth || imageHeight!==previousHeight){
      frame.style.width=imageWidth+'px';frame.style.height=imageHeight+'px';
      stops.forEach((a,i)=>{
        a.style.setProperty('--point-y',(imageHeight*points[i][1]/100)+'px');
        a.style.setProperty('--offset-px','0px');
      });
      previousWidth=imageWidth;previousHeight=imageHeight;
    }
    const offsetY=mobile.matches ? -imageHeight*.22 : innerHeight*.52-imageHeight*.52;
    frame.style.transform=`translate3d(${offsetX}px,${offsetY}px,0)`;
    traveler.style.left=x+'%';traveler.style.top=(imageHeight*y/100)+'px';
    const heading=Math.atan2((to[1]-from[1])*imageHeight,(to[0]-from[0])*imageWidth)*180/Math.PI;
    traveler.style.setProperty('--heading',heading+'deg');
    document.getElementById('progress').style.width=(renderedProgress/(ids.length-1)*100)+'%';
    if(current!==index){
      current=index;
      previousButton.disabled=index===0;
      nextButton.disabled=index===ids.length-1;
      previousButton.setAttribute('aria-label',index===0?'Beginning of portfolio':`Previous section: ${names[index-1]}`);
      nextButton.setAttribute('aria-label',index===ids.length-1?'End of portfolio':`Next section: ${names[index+1]}`);
      document.getElementById('current-stop').textContent='0'+(index+1)+' / '+names[index].toUpperCase();
      document.querySelectorAll('.map-stop, #journey-menu a').forEach(a=>{if(a.hash==='#'+ids[index])a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    }
    if(settling && !paused && !preference.matches && !document.hidden)schedule();
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);lastFrame=0;if(!document.hidden)schedule();});
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('hashchange',schedule);
  document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',schedule));
  if('ResizeObserver' in window)new ResizeObserver(schedule).observe(document.querySelector('main'));
  setMotion();
})();
