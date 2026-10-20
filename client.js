window.__ModuleLoader__.load({id:'dsh-mermaid',factory:(require)=>{
 const React=require('react'),h=React.createElement;
 function Diagram({phase,block}){
  if(phase!=='result')return h('div',{role:'status'},'Rendering Mermaid diagram…');
  const value=block.meta?.mermaid;
  if(block.isError||!value)return h('details',null,h('summary',null,'Mermaid rendering failed'),h('pre',{style:{whiteSpace:'pre-wrap'}},(block.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n')));
  let url;try{url=new URL(value.imageUrl,location.href);if(url.origin!==location.origin||!/^\/plugins\/dsh-mermaid\/images\/[a-f0-9]{48}\.png$/.test(url.pathname))return null;}catch{return null;}
  return h('figure',{style:{margin:'8px 0',padding:12,border:'1px solid var(--dsw-alias-border-l1)',borderRadius:12}},h('figcaption',null,value.title),h('a',{href:url.href,target:'_blank',rel:'noopener noreferrer'},h('img',{src:url.href,alt:value.title,style:{display:'block',width:'100%',maxWidth:1200,height:'auto',marginTop:8,borderRadius:6}})),h('details',null,h('summary',null,'Mermaid source'),h('pre',{style:{whiteSpace:'pre-wrap',overflow:'auto',maxHeight:240}},block.args?.value?.source||block.call?.argsRaw||'')));
 }
 return {inject:['slots'],apply(ctx){ctx.slots.inject('tool.call.toolview',()=>ctx.slots.register({name:'tool.call.toolview',key:'mermaid_render'},Diagram));}};
}});
