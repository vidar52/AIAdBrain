export const THEMES = { violet: ['#7963ef','#ece8ff'], blue: ['#3480db','#e1f0ff'], mint: ['#178e79','#def6ee'], coral: ['#e66d53','#fff0e9'] };
export const SAMPLE = [
 ['2026-10-26','M001','家里网速慢？换个打开方式','痛点切入',120,10000,135,8,1],
 ['2026-10-27','M001','家里网速慢？换个打开方式','痛点切入',150,12000,170,10,1],
 ['2026-10-29','M001','家里网速慢？换个打开方式','痛点切入',180,15000,210,12,2],
 ['2026-10-26','M002','每个房间，都有好Wi-Fi','场景展示',140,13000,156,6,1],
 ['2026-10-28','M002','每个房间，都有好Wi-Fi','场景展示',200,18000,225,8,1],
 ['2026-10-30','M002','每个房间，都有好Wi-Fi','场景展示',130,11500,149,5,0],
 ['2026-10-27','M003','升级全屋Wi-Fi，现在预约','权益直给',160,20000,360,7,1],
 ['2026-10-29','M003','升级全屋Wi-Fi，现在预约','权益直给',180,23000,414,8,0],
 ['2026-10-31','M003','升级全屋Wi-Fi，现在预约','权益直给',210,25000,450,9,1],
 ['2026-10-28','M004','一家人的畅快，各有一份','家庭情境',100,9000,108,3,0],
 ['2026-10-30','M004','一家人的畅快，各有一份','家庭情境',130,11000,132,4,1],
 ['2026-10-31','M004','一家人的畅快，各有一份','家庭情境',150,12500,150,5,0]
].map(([date,id,name,angle,spend,impressions,clicks,leads,completions])=>({date,id,name,angle,spend,impressions,clicks,leads,completions}));
export function metrics(rows){
 const o=rows.reduce((a,r)=>{for(const k of ['spend','impressions','clicks','leads','completions'])a[k]+=(Number(r[k])||0);return a},{spend:0,impressions:0,clicks:0,leads:0,completions:0});
 return {...o,ctr:o.impressions?o.clicks/o.impressions:null,cvr:o.clicks?o.leads/o.clicks:null,cpl:o.leads?o.spend/o.leads:null,cpa:o.completions?o.spend/o.completions:null};
}
export function grouped(rows){const m=new Map;for(const r of rows){if(!m.has(r.id))m.set(r.id,{...r,rows:[]});m.get(r.id).rows.push(r)}return [...m.values()].map(g=>({...g,...metrics(g.rows)}))}
export function parseCSV(text){
 const all=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))all.push(row);row=[];field=''}else field+=c}
 if(quoted)throw Error('CSV 引号未闭合，请检查文件格式');row.push(field);if(row.some(x=>x.trim()))all.push(row);
 if(all.length<2)throw Error('请上传包含表头和至少一行数据的 CSV 文件');
 const aliases={date:['日期','date'],id:['素材ID','素材id','id','creative_id'],name:['素材名称','name','creative_name'],angle:['创意类型','angle'],spend:['消耗','spend','cost'],impressions:['曝光','曝光量','impressions'],clicks:['点击','点击量','clicks'],leads:['线索','线索量','leads'],completions:['竣工','竣工量','completions']};
 const heads=all.shift().map(v=>v.replace(/^\uFEFF/,'').trim());const ix={};for(const [k,a]of Object.entries(aliases))ix[k]=heads.findIndex(h=>a.includes(h));
 for(const k of ['date','id','name','spend','impressions','clicks','leads'])if(ix[k]<0)throw Error('缺少字段：'+aliases[k][0]);
 let keys=new Set;
 return all.map((r,i)=>{const out={};for(const k of ['date','id','name','angle'])out[k]=ix[k]<0?'未分类':(r[ix[k]]||'').trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(out.date)||!Number.isFinite(Date.parse(out.date))||new Date(out.date).toISOString().slice(0,10)!==out.date)throw Error(`第 ${i+2} 行日期应为有效的 YYYY-MM-DD`);if(!out.id||!out.name)throw Error(`第 ${i+2} 行素材 ID 和名称不能为空`);for(const k of ['spend','impressions','clicks','leads','completions']){out[k]=ix[k]<0?0:Number((r[ix[k]]||'0').replace(/[,￥¥\s]/g,''));if(!Number.isFinite(out[k])||out[k]<0)throw Error(`第 ${i+2} 行「${aliases[k][0]}」应为非负数字`);if(k!=='spend'&&!Number.isInteger(out[k]))throw Error(`第 ${i+2} 行「${aliases[k][0]}」应为整数`)}if(out.clicks>out.impressions||out.leads>out.clicks||out.completions>out.leads)throw Error(`第 ${i+2} 行漏斗数据不合理：曝光 ≥ 点击 ≥ 线索 ≥ 竣工`);let key=out.date+'|'+out.id;if(keys.has(key))throw Error(`第 ${i+2} 行日期 + 素材 ID 重复，请先按日汇总`);keys.add(key);return out});
}
export function toCSV(rows){return '\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c??'').replaceAll('"','""')+'"').join(',')).join('\r\n')}
export function makeScript(b){const angle=b.angle||'痛点切入';const titles={'痛点切入':`${b.pain||'家里 Wi-Fi 总不顺畅'}？`,'权益直给':`${b.product}，现在了解`,'场景展示':`${b.audience}的理想网络生活`,'家庭情境':'一家人的畅快，各有一份'};return [{time:'00–04s',title:titles[angle],body:b.audience+'，这件小事值得改善',shot:'开场提出需求，突出核心问题'},{time:'04–10s',title:b.selling,body:b.product,shot:'产品与卖点展示，避免叠加过多信息'},{time:'10–15s',title:b.cta,body:b.policy||'具体资费、覆盖范围及办理条件以当地实际为准',shot:'行动指引与办理条件同屏展示'}]}
export function makeVariants(brief,base){return ['痛点切入','权益直给','场景展示'].map((angle,i)=>({id:Date.now()+'-'+i,name:brief.product+' · '+angle,brief:{...brief,angle},theme:['violet','blue','mint'][i],scenes:makeScript({...brief,angle}),createdAt:new Date().toISOString(),parent:base||null,source:'rule'}))}
export function insight(g){if(g.leads<10)return {label:'继续观察',tone:'neutral',text:'累计线索少于 10 条，先积累样本，暂不判断优劣。'};if(g.ctr>=.015&&g.cvr<.04)return{label:'检查留资承接',tone:'orange',text:'点击率较高，但点击到留资不足 4%。优先检查卖点一致性、表单和落地页。'};return{label:'可进入 A/B 验证',tone:'green',text:'以当前 CPL 为基线，保持人群、出价和落地页一致，仅测试一个素材变量。'};}
