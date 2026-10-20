import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,mkdir,rename,rm,access} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export function validateSource(source){
 if(typeof source!=='string'||!source.trim()||source.length>30000)throw Error('Provide Mermaid source between 1 and 30,000 characters.');
 if(/%%\s*\{|^\s*---\s*$/m.test(source))throw Error('Inline Mermaid configuration and YAML frontmatter are disabled. Supply diagram syntax only.');
 if(/\b(?:click|href)\b|(?:https?:|file:|javascript:|data:|<\/?(?:script|iframe|img|foreignObject))/i.test(source))throw Error('External links, resources and active HTML are disabled in diagrams.');
 return source.trim();
}
export class Renderer {
 constructor(root,config){this.root=root;this.config=config;this.children=new Set();this.pending=0;this.queue=Promise.resolve();this.closed=false;}
 render(source,title,signal){validateSource(source);if(this.closed)throw Error('Plugin is disabled.');if(this.pending>=8)throw Error('Diagram queue is full; retry shortly.');this.pending++;const job=this.queue.catch(()=>{}).then(()=>this.perform(source,title,signal));this.queue=job;return job.finally(()=>this.pending--);}
 async browser(){if(this.config.browserPath){await access(this.config.browserPath);return this.config.browserPath;}const {default:puppeteer}=await import('puppeteer');try{const p=puppeteer.executablePath();await access(p);return p;}catch{throw Error('Chromium is not installed. In the plugin directory run: pnpm exec puppeteer browsers install chrome. Or configure this plugin’s browserPath to an existing Chromium executable.');}}
 async perform(source,title,signal){
  if(this.closed)throw Error('Plugin is disabled.');signal?.throwIfAborted();await mkdir(this.root,{recursive:true,mode:0o700});const tmp=await mkdtemp(join(this.root,'.render-'));
  try{
   const input=join(tmp,'diagram.mmd'),output=join(tmp,'diagram.png');await writeFile(input,validateSource(source),{mode:0o600});
   await writeFile(join(tmp,'mermaid.json'),JSON.stringify({securityLevel:'strict',startOnLoad:false,maxTextSize:30000,maxEdges:500,suppressErrorRendering:true,htmlLabels:false,flowchart:{htmlLabels:false},secure:['securityLevel','maxTextSize','maxEdges','htmlLabels','startOnLoad','suppressErrorRendering']}));
   await writeFile(join(tmp,'browser.json'),JSON.stringify({executablePath:await this.browser(),args:this.config.disableBrowserSandbox?['--no-sandbox']:[]}));
   const cli=join(dirname(require.resolve('@mermaid-js/mermaid-cli')),'cli.js');
   await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[cli,'-i',input,'-o',output,'-p',join(tmp,'browser.json'),'-c',join(tmp,'mermaid.json'),'-t','neutral','-b','white','-w','1200','-H','900','-s','1.5'],{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});this.children.add(child);let log='',done=false;
    const fail=e=>{if(done)return;done=true;kill(child);reject(e);};const abort=()=>fail(signal.reason||Error('Cancelled'));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
    const timer=setTimeout(()=>fail(Error('Diagram rendering exceeded 45 seconds.')),45000);
    const append=b=>log=(log+String(b)).slice(-2000);child.stdout.on('data',append);child.stderr.on('data',append);
    child.on('error',fail);child.on('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);this.children.delete(child);if(done)return;done=true;code===0?resolve():reject(Error('Mermaid rendering failed. Check the syntax. '+log));});
   });
   signal?.throwIfAborted();const bytes=await readFile(output);if(bytes.length>8*1024*1024)throw Error('Diagram image exceeds 8 MiB; simplify it.');if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Renderer did not produce a PNG.');
   const id=randomBytes(24).toString('hex');await writeFile(join(tmp,'source.mmd'),source,{mode:0o600});await writeFile(join(tmp,'receipt.json'),JSON.stringify({title,createdAt:Date.now(),bytes:bytes.length}),{mode:0o600});await rename(tmp,join(this.root,id));return{id,title,bytes:bytes.length};
  }catch(e){await rm(tmp,{recursive:true,force:true});throw e;}
 }
 async dispose(){this.closed=true;for(const child of this.children)kill(child);await this.queue.catch(()=>{});}
}

function kill(child){try{if(process.platform==='win32')child.kill('SIGKILL');else process.kill(-child.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}}
