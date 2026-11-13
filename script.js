const games = [
 {id:'number',name:'Number Hunt',cat:'puzzle',icon:'🔢',desc:'Guess the secret number in as few tries as possible.',glow:'#8d5bff'},
 {id:'memory',name:'Memory Match',cat:'puzzle',icon:'🧠',desc:'Flip cards and find all matching pairs.',glow:'#e35bca'},
 {id:'word',name:'Word Scramble',cat:'puzzle',icon:'🔤',desc:'Unscramble the letters to reveal the word.',glow:'#4c9eff'},
 {id:'math',name:'Math Sprint',cat:'puzzle',icon:'➗',desc:'Solve quick maths questions against the clock.',glow:'#53d6a2'},
 {id:'reaction',name:'Reaction Rush',cat:'arcade',icon:'⚡',desc:'Test your reflexes and beat your best time.',glow:'#e9bd4d'},
 {id:'target',name:'Target Tap',cat:'arcade',icon:'🎯',desc:'Hit the moving target as many times as you can.',glow:'#ed6d85'},
 {id:'rps',name:'Rock Paper Scissors',cat:'strategy',icon:'✊',desc:'Outsmart the computer in this classic duel.',glow:'#7a9cff'},
 {id:'tictactoe',name:'Tic Tac Toe',cat:'strategy',icon:'❎',desc:'Play a quick match against a simple computer opponent.',glow:'#b47aff'},
 {id:'snake',name:'Neon Snake',cat:'arcade',icon:'🐍',desc:'Collect glowing dots and avoid your own tail.',glow:'#53d6a2'},
 {id:'quiz',name:'Quick Quiz',cat:'strategy',icon:'💡',desc:'Answer five general knowledge questions.',glow:'#e6a45a'}
];
const grid=document.getElementById('gameGrid'), search=document.getElementById('searchInput');
let activeFilter='all';
const RECORDS_KEY='nexoraPersonalRecordsV1';

/* Nexora sound system: Web Audio, explicitly unlocked by the Sound button. */
const SOUND_KEY='nexoraSoundEnabled';
let soundEnabled=localStorage.getItem(SOUND_KEY)==='true',audioCtx=null,musicTimer=null,musicStep=0;
const soundToggle=document.getElementById('soundToggle');
function getAudio(){
 const AudioClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioClass)return null;
 if(!audioCtx)audioCtx=new AudioClass();
 return audioCtx;
}
function unlockAudio(){
 const ctx=getAudio();
 if(!ctx)return Promise.reject(new Error('Web Audio is not supported in this browser.'));
 return (ctx.state==='suspended'?ctx.resume():Promise.resolve()).then(()=>ctx);
}
function tone(freq,duration=.18,wave='sine',volume=.12,delay=0){
 if(!soundEnabled)return;
 unlockAudio().then(ctx=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime+delay;
  osc.type=wave;osc.frequency.setValueAtTime(freq,now);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(volume,now+.025);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.05);
 }).catch(()=>{});
}
function playSfx(kind='tap'){
 if(kind==='win'){tone(523,.2,'sine',.13);tone(659,.22,'sine',.12,.16);tone(784,.3,'sine',.12,.34);}
 else if(kind==='lose'){tone(220,.25,'triangle',.12);tone(165,.3,'triangle',.1,.2);}
 else if(kind==='match'){tone(660,.16,'sine',.12);tone(880,.2,'sine',.12,.14);}
 else{tone(440,.09,'triangle',.07);}
}
function startMusic(){
 if(!soundEnabled||musicTimer)return;
 unlockAudio().then(ctx=>{
  if(!soundEnabled||musicTimer)return;
  const notes=[196,246.94,293.66,246.94,174.61,220,261.63,220];
  const playNote=()=>{
   if(!soundEnabled)return;
   const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type='sine';osc.frequency.value=notes[musicStep++%notes.length];
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.045,now+.04);
   gain.gain.exponentialRampToValueAtTime(.0001,now+.65);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.7);
  };
  playNote();musicTimer=setInterval(playNote,850);
 }).catch(()=>{});
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}}
function updateSoundButton(){
 if(!soundToggle)return;
 soundToggle.textContent=soundEnabled?'🔊 Sound On':'🔇 Enable Sound';
 soundToggle.setAttribute('aria-pressed',String(soundEnabled));
 soundToggle.setAttribute('aria-label',soundEnabled?'Turn sound off':'Enable game sounds');
}
if(soundToggle){
 updateSoundButton();
 soundToggle.addEventListener('click',()=>{
  soundEnabled=!soundEnabled;localStorage.setItem(SOUND_KEY,String(soundEnabled));
  if(soundEnabled){
   unlockAudio().then(()=>{playSfx('win');startMusic();}).catch(()=>{soundEnabled=false;localStorage.setItem(SOUND_KEY,'false');updateSoundButton();alert('Your browser is blocking audio. Please open this site in Chrome and allow sound.');});
  }else stopMusic();
  updateSoundButton();
 });
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');
 if(b&&b!==soundToggle)playSfx('tap');
 if(soundEnabled)startMusic();
});
document.addEventListener('keydown',()=>{if(soundEnabled)startMusic();},{once:true});

function getRecords(){try{return JSON.parse(localStorage.getItem(RECORDS_KEY)||'{}')}catch(e){return {}}}
function saveRecord(id,score,detail=''){if(!Number.isFinite(score))return;const records=getRecords(),old=records[id];if(!old||score>old.score){records[id]={score,detail,date:new Date().toLocaleDateString()};try{localStorage.setItem(RECORDS_KEY,JSON.stringify(records));}catch(e){}renderRecords();}}
function renderRecords(){const box=document.getElementById('leaderboardList');if(!box)return;const records=getRecords(),items=games.filter(g=>records[g.id]).sort((a,b)=>records[b.id].score-records[a.id].score);box.innerHTML=items.length?items.map((g,i)=>{const r=records[g.id];return '<div class="record-row"><span class="record-rank">#'+(i+1)+'</span><span class="record-icon">'+g.icon+'</span><span class="record-name">'+g.name+'<small>'+r.date+(r.detail?' · '+r.detail:'')+'</small></span><strong>'+r.score+'</strong></div>';}).join(''):'<div class="records-empty">🎮 Play a game to set your first personal best!</div>';}
document.getElementById('resetRecords')?.addEventListener('click',()=>{if(confirm('Clear all personal best records saved in this browser?')){localStorage.removeItem(RECORDS_KEY);renderRecords();}});
renderRecords();
function render(){const q=search.value.toLowerCase();const list=games.filter(g=>(activeFilter==='all'||g.cat===activeFilter)&&(g.name.toLowerCase().includes(q)||g.desc.toLowerCase().includes(q)));grid.innerHTML=list.map(g=>`<article class="game-card"><div class="game-art" style="--art-glow:${g.glow}55">${g.icon}</div><div class="game-info"><small>${g.cat}</small><h3>${g.name}</h3><p>${g.desc}</p><button class="play-btn" data-game="${g.id}">PLAY NOW　→</button></div></article>`).join('');document.getElementById('emptyState').hidden=list.length!==0;}
document.querySelectorAll('.category-card').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.category-card').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeFilter=b.dataset.filter;render();}));
search.addEventListener('input',render);document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('menuBtn').onclick=()=>document.querySelector('.topbar nav').classList.toggle('show');
const modal=document.getElementById('gameModal'), area=document.getElementById('gameArea'), title=document.getElementById('gameTitle'), help=document.getElementById('gameHelp');
document.getElementById('closeModal').onclick=closeGame;modal.addEventListener('click',e=>{if(e.target===modal)closeGame()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGame()});
function closeGame(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');area.innerHTML='';}
function openGame(id){const g=games.find(x=>x.id===id);title.textContent=g.name;document.getElementById('gameCategory').textContent=g.cat.toUpperCase()+' GAME';modal.classList.add('open');modal.setAttribute('aria-hidden','false');area.innerHTML='';help.textContent='';({number:numberGame,memory:memoryGame,word:wordGame,math:mathGame,reaction:reactionGame,target:targetGame,rps:rpsGame,tictactoe:ticGame,snake:snakeGame,quiz:quizGame}[id])();}
grid.addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b)openGame(b.dataset.game)});
function button(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;return b}
function say(t){const p=document.createElement('p');p.className='result';p.textContent=t;area.append(p);playSfx('win')}
function numberGame(){let secret=Math.floor(Math.random()*100)+1,tries=0;area.innerHTML='<div><p>I am thinking of a number from 1 to 100.</p><input id="guess" type="number" min="1" max="100" step="1" placeholder="1–100"><button id="check">Guess</button><p id="feedback" class="result">You have unlimited tries. Good luck!</p></div>';const check=()=>{const input=document.getElementById('guess'),n=Number(input.value),feedback=document.getElementById('feedback');if(input.value.trim()===''||!Number.isInteger(n)||n<1||n>100){feedback.textContent='Please enter a whole number from 1 to 100.';return;}tries++;if(n===secret){feedback.textContent='Correct! You found it in '+tries+' guesses.';saveRecord('number',Math.max(1,1000-tries*10),tries+' guesses');playSfx('win');document.getElementById('check').disabled=true;input.disabled=true;}else{feedback.textContent=n<secret?'Too low — try a higher number!':'Too high — try a lower number!';}};document.getElementById('check').onclick=check;document.getElementById('guess').onkeydown=e=>{if(e.key==='Enter')check()};help.textContent='Enter a number and use the hints to find the secret number.';}
function memoryGame(){const icons=['🍉','🚀','🐱','🎮','🍀','⭐','🍉','🚀','🐱','🎮','🍀','⭐'];icons.sort(()=>Math.random()-.5);let open=[],matched=0,lock=false,moves=0;area.innerHTML='<div><p id="memStatus">Moves: 0 · Pairs: 0/6</p><div class="memory-grid" id="memGrid"></div></div>';const board=document.getElementById('memGrid');icons.forEach((ic,i)=>{const b=button('?',()=>{if(lock||b.dataset.done||open.includes(i))return;b.textContent=ic;open.push(i);if(open.length===2){moves++;lock=true;const [a,c]=open;if(icons[a]===icons[c]){playSfx('match');[a,c].forEach(k=>{board.children[k].dataset.done='1';board.children[k].style.opacity='.4'});matched++;lock=false;open=[];}else setTimeout(()=>{[a,c].forEach(k=>board.children[k].textContent='?');open=[];lock=false;},700);}document.getElementById('memStatus').textContent=`Moves: ${moves} · Pairs: ${matched}/6`;if(matched===6){saveRecord('memory',Math.max(1,1000-moves*20),moves+' moves');say(`You matched every pair in ${moves} moves!`);}});board.append(b)});help.textContent='Flip two cards at a time. Match all six pairs.';}
function wordGame(){const words=['GALAXY','PUZZLE','ROCKET','PLANET','GAMING'];let word=words[Math.floor(Math.random()*words.length)],scr=word.split('').sort(()=>Math.random()-.5).join('');area.innerHTML=`<div><div class="big">${scr}</div><p>Unscramble the letters</p><input id="wordGuess" placeholder="Your answer"><button id="wordCheck">Submit</button><p id="wordFeedback" class="result"></p></div>`;document.getElementById('wordCheck').onclick=()=>{const v=document.getElementById('wordGuess').value.trim().toUpperCase();if(v===word){document.getElementById('wordFeedback').textContent='Correct! Great job.';saveRecord('word',100,'solved '+word);playSfx('win');document.getElementById('wordCheck').disabled=true;}else{document.getElementById('wordFeedback').textContent='Not quite — try again!'}};help.textContent='Rearrange the letters to make a gaming-related word.';}
function mathGame(){let score=0,left=30,timer;area.innerHTML='<div><div class="big" id="mathTime">30</div><h3 id="mathQ"></h3><input id="mathAns" type="number" placeholder="Answer"><button id="mathGo">Submit</button><p id="mathScore" class="result">Score: 0</p></div>';const next=()=>{let a=Math.ceil(Math.random()*12),b=Math.ceil(Math.random()*12);window.mathAnswer=a*b;document.getElementById('mathQ').textContent=`${a} × ${b} = ?`;};next();document.getElementById('mathGo').onclick=()=>{if(Number(document.getElementById('mathAns').value)===window.mathAnswer)score++;document.getElementById('mathScore').textContent='Score: '+score;document.getElementById('mathAns').value='';next()};timer=setInterval(()=>{left--;document.getElementById('mathTime').textContent=left;if(left<=0){clearInterval(timer);saveRecord('math',score,score+' correct answers');say(`Time's up! Final score: ${score}`);document.getElementById('mathGo').disabled=true}},1000);help.textContent='Answer as many multiplication questions as possible in 30 seconds.';}
function reactionGame(){area.innerHTML='<div><p id="reactText">Press start, then wait for the panel to turn green.</p><button id="reactStart">Start test</button></div>';let start=0,timeout;const b=document.getElementById('reactStart');b.onclick=()=>{b.disabled=true;b.textContent='Wait for green...';area.style.background='#271b31';timeout=setTimeout(()=>{area.style.background='#103324';start=performance.now();b.disabled=false;b.textContent='TAP NOW!';document.getElementById('reactText').textContent='GO!'},1200+Math.random()*3000);b.onclick=()=>{if(!start){clearTimeout(timeout);document.getElementById('reactText').textContent='Too soon! Press start to try again.';b.textContent='Try again';b.onclick=()=>reactionGame();return}let ms=Math.round(performance.now()-start);document.getElementById('reactText').textContent=`Your reaction time: ${ms} ms`;saveRecord('reaction',Math.max(1,1000-ms),ms+' ms');b.textContent='Try again';b.onclick=()=>reactionGame();start=0;area.style.background='#0c0b13';};};help.textContent='Wait until the panel turns green, then tap as quickly as possible.';}
function targetGame(){let hits=0,left=15;area.innerHTML='<div><p id="targetStatus">Hits: 0 · Time: 15</p><button class="target" id="targetDot" aria-label="Target">●</button></div>';const dot=document.getElementById('targetDot');dot.onclick=()=>{hits++;document.getElementById('targetStatus').textContent=`Hits: ${hits} · Time: ${left}`;dot.style.transform=`translate(${Math.random()*70-35}px,${Math.random()*35-17}px)`};const t=setInterval(()=>{left--;document.getElementById('targetStatus').textContent=`Hits: ${hits} · Time: ${left}`;if(left<=0){clearInterval(t);dot.disabled=true;saveRecord('target',hits,hits+' hits');say(`Time's up! You hit the target ${hits} times.`)}},1000);help.textContent='Tap the target as many times as possible before time runs out.';}
function rpsGame(){area.innerHTML='<div class="rps-game"><p class="rps-intro">Choose your move and challenge the Nexora bot!</p><div class="rps-arena"><div class="rps-player"><span class="rps-side-label">YOU</span><div class="rps-hand" id="rpsYouHand">❔</div><strong id="rpsYouMove">Your hand</strong></div><div class="rps-versus">VS</div><div class="rps-player"><span class="rps-side-label">NEXORA BOT</span><div class="rps-hand rps-bot-hand" id="rpsBotHand">❔</div><strong id="rpsBotMove">Bot hand</strong></div></div><div class="rps-outcome" id="rpsResult" aria-live="polite">Make your move!</div><div class="rps-scoreboard"><span>YOU <b id="rpsYouScore">0</b></span><span class="rps-score-divider">—</span><span>BOT <b id="rpsBotScore">0</b></span></div><p class="rps-round" id="rpsRound">Round 1</p><div class="rps-choices" id="rpsButtons"></div><button type="button" class="rps-reset" id="rpsReset">Reset match</button></div>';let you=0,comp=0,round=0;const names=['Rock','Paper','Scissors'],hands=['✊','✋','✌️'];const youHand=document.getElementById('rpsYouHand'),botHand=document.getElementById('rpsBotHand');function updateScore(){document.getElementById('rpsYouScore').textContent=you;document.getElementById('rpsBotScore').textContent=comp;document.getElementById('rpsRound').textContent='Round '+(round+1);}function play(i){const c=Math.floor(Math.random()*3);round++;youHand.textContent=hands[i];botHand.textContent=hands[c];document.getElementById('rpsYouMove').textContent=names[i];document.getElementById('rpsBotMove').textContent=names[c];youHand.classList.remove('rps-reveal');botHand.classList.remove('rps-reveal');void youHand.offsetWidth;youHand.classList.add('rps-reveal');botHand.classList.add('rps-reveal');let result=i===c?'🤝 It is a draw!':(i-c+3)%3===1?'🎉 You win this round!':'🤖 Bot wins this round!';if(i!==c){if((i-c+3)%3===1)you++;else comp++;}document.getElementById('rpsResult').textContent=result;playSfx(i===c?'match':((i-c+3)%3===1?'win':'lose'));updateScore();saveRecord('rps',you,you+' wins');}names.forEach((name,i)=>{const b=button(hands[i]+' '+name,()=>play(i));b.className='rps-choice';document.getElementById('rpsButtons').append(b)});document.getElementById('rpsReset').onclick=()=>{you=0;comp=0;round=0;youHand.textContent='❔';botHand.textContent='❔';document.getElementById('rpsYouMove').textContent='Your hand';document.getElementById('rpsBotMove').textContent='Bot hand';document.getElementById('rpsResult').textContent='Make your move!';updateScore();};help.textContent='Rock beats scissors, scissors beat paper, and paper beats rock. The hand icons reveal both moves after every round.';}function ticGame(){let board=Array(9).fill(''),done=false;area.innerHTML='<div><div class="tic-grid" id="ticGrid"></div><p id="ticStatus" class="result">Your turn (X)</p><button id="ticReset">New round</button></div>';const el=document.getElementById('ticGrid');function check(){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(const l of lines)if(board[l[0]]&&board[l[0]]===board[l[1]]&&board[l[1]]===board[l[2]])return board[l[0]];return board.every(Boolean)?'draw':null}function draw(){el.innerHTML='';board.forEach((v,i)=>{const b=button(v||' ',()=>{if(done||board[i])return;board[i]='X';draw();let w=check();if(w){finish(w);return}let options=board.map((v,j)=>v?null:j).filter(v=>v!==null);if(options.length){board[options[Math.floor(Math.random()*options.length)]]='O';draw();w=check();if(w)finish(w)}});el.append(b)});}function finish(w){done=true;if(w==='X'){saveRecord('tictactoe',1,'win');playSfx('win')}else playSfx(w==='draw'?'match':'lose');document.getElementById('ticStatus').textContent=w==='draw'?'It is a draw!':w==='X'?'You win!':'Computer wins!'}document.getElementById('ticReset').onclick=()=>{board.fill('');done=false;document.getElementById('ticStatus').textContent='Your turn (X)';draw()};draw();help.textContent='Get three X marks in a row before the computer gets three O marks.';}
function snakeGame(){area.innerHTML='<div class="snake-game"><p>Use the arrow buttons or keyboard to move. Eat the dot!</p><canvas id="snakeCanvas" width="300" height="240" aria-label="Snake game board"></canvas><p id="snakeScore" class="result">Score: 0</p><div class="snake-controls" aria-label="Snake movement controls"><button type="button" data-dir="up" aria-label="Move up">▲</button><div><button type="button" data-dir="left" aria-label="Move left">◀</button><button type="button" data-dir="down" aria-label="Move down">▼</button><button type="button" data-dir="right" aria-label="Move right">▶</button></div></div><button id="snakeStart">Start / Restart</button></div>';const c=document.getElementById('snakeCanvas'),ctx=c.getContext('2d');let snake,dir,food,score,timer,dead;function reset(){clearInterval(timer);snake=[{x:6,y:5},{x:5,y:5},{x:4,y:5}];dir={x:1,y:0};food={x:10,y:5};score=0;dead=false;document.getElementById('snakeScore').textContent='Score: 0';draw();timer=setInterval(step,130)}function draw(){ctx.fillStyle='#11101a';ctx.fillRect(0,0,300,240);ctx.fillStyle='#e66bdb';ctx.fillRect(food.x*15,food.y*15,13,13);ctx.fillStyle='#75edb3';snake.forEach(p=>ctx.fillRect(p.x*15,p.y*15,13,13))}function step(){let h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(h.x<0||h.x>=20||h.y<0||h.y>=16||snake.some(p=>p.x===h.x&&p.y===h.y)){clearInterval(timer);dead=true;saveRecord('snake',score,score+' dots');say(`Game over! Score: ${score}`);return}snake.unshift(h);if(h.x===food.x&&h.y===food.y){score++;food={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*16)};document.getElementById('snakeScore').textContent='Score: '+score}else snake.pop();draw()}const directions={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};function changeDirection(next){if(!next||!dir)return;if(!(next.x===-dir.x&&next.y===-dir.y))dir=next;}const keyHandler=e=>{const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};const key=keys[e.key];if(key){changeDirection(directions[key]);e.preventDefault();}};document.addEventListener('keydown',keyHandler);area.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();changeDirection(directions[b.dataset.dir]);});});document.getElementById('snakeStart').onclick=reset;reset();help.textContent='Use the on-screen arrow buttons or keyboard arrows / WASD. Avoid walls and your own tail.';}
function quizGame(){const qs=[['Which planet is known as the Red Planet?',['Mars','Venus','Jupiter'],0],['How many sides does a hexagon have?',['Five','Six','Eight'],1],['What is 9 × 7?',['56','63','72'],1],['Which ocean is the largest?',['Atlantic','Indian','Pacific'],2],['What does CPU stand for?',['Central Processing Unit','Computer Power Utility','Core Program Unit'],0]];let i=0,score=0;function show(){if(i===qs.length){saveRecord('quiz',score,score+'/5 correct');area.innerHTML=`<div><div class="big">${score}/5</div><p>Quiz complete!</p><button id="quizAgain">Play again</button></div>`;document.getElementById('quizAgain').onclick=()=>quizGame();return}const q=qs[i];area.innerHTML=`<div><p>Question ${i+1} of 5</p><h3>${q[0]}</h3><div id="quizOptions"></div><p id="quizFeedback" class="result"></p></div>`;q[1].forEach((a,j)=>document.getElementById('quizOptions').append(button(a,()=>{if(j===q[2]){score++;playSfx('match')}else playSfx('lose');i++;show()})))}show();help.textContent='Choose one answer for each of the five questions.';}
render();
