import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const dir = mkdtempSync(join(tmpdir(), 'decision-lab-test-'));
after(() => rmSync(dir, { recursive: true, force: true }));
for (const name of ['materials', 'random', 'world', 'movement', 'reactions', 'simulation', 'presets']) {
  const source = readFileSync(new URL(`../src/prototypes/cellular-material/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const path = join(dir, `${name}.mjs`); mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, outputText.replace(/from ['"]([.][^'"]+)['"]/g, 'from "$1.mjs"'));
}
const load = name => import(pathToFileURL(join(dir, `${name}.mjs`)));
const { World, paintBrush, paintLine } = await load('world');
const { stepSimulation: step } = await load('simulation');
const { createPreset } = await load('presets');
const at = (w,x,y) => w.cells[w.index(x,y)];
for(const material of ['sand','water']) test(`${material} falls exactly one cell per normal tick`,()=>{
 const w=new World(7,8);w.set(3,0,material);step(w);assert.equal(at(w,3,1).material,material);assert.equal(w.stats.movedCells,1);assert.equal(at(w,3,1).updatedAt,1);
 assert.equal(w.traces[3].chosen,'down');assert.equal(w.traces[3].to,10);
});
test('sand uses free diagonal and cannot exchange with water',()=>{
 const w=new World(5,3);w.set(2,1,'sand');w.set(2,2,'wood');step(w);assert.equal(at(w,1,2).material,'sand');
 const v=new World(1,2);v.set(0,0,'sand');v.set(0,1,'water');step(v);assert.equal(at(v,0,0).material,'sand');assert.equal(at(v,0,1).material,'water');
});
test('horizontal water guard prevents same-tick repeated movement toward an opening',()=>{
 const w=new World(9,4);for(let x=0;x<9;x++)if(x!==7)w.set(x,2,'wood');w.set(2,1,'water');step(w);assert.equal(at(w,3,1).material,'water');assert.equal(w.stats.movedCells,1);
});
test('bug mode visibly cascades a grain through multiple rows',()=>{
 const w=new World(3,8);w.mode='bug';w.set(1,0,'sand');step(w);assert.equal(at(w,1,7).material,'sand');assert.equal(w.stats.movedCells,7);
});
test('equal drops use deterministic parity tie-break and fixed-left policy',()=>{
 for(const [lateral,tick,x] of [['alternate',0,3],['alternate',1,5],['left',1,3]]){
 const run=()=>{const w=new World(9,4);w.lateral=lateral;w.tick=tick;for(let c=0;c<9;c++)if(c!==1&&c!==7)w.set(c,2,'wood');w.set(4,1,'water');step(w);return w};
 const w=run();assert.equal(at(w,x,1).material,'water');assert.deepEqual(w.cells,run().cells);assert.deepEqual(w.traces[13].waterSearch,{leftDropDistance:3,rightDropDistance:3});
 }
});
test('stable water remains unchanged for 200 ticks with zero moves',()=>{
 const w=new World(9,3);for(let x=0;x<9;x++)w.set(x,2,'wood');for(let x=2;x<7;x++)w.set(x,1,'water');
 for(let i=0;i<20;i++)step(w);const snapshot=w.cells.map(c=>c.material);
 for(let i=0;i<200;i++){step(w);assert.deepEqual(w.cells.map(c=>c.material),snapshot);assert.equal(w.stats.movedCells,0)}
});
test('nearby opening attracts water one cell at a time until it falls below floor',()=>{
 const w=new World(10,5);for(let x=0;x<10;x++)if(x!==7)w.set(x,2,'wood');w.set(2,1,'water');
 step(w);assert.equal(at(w,3,1).material,'water');assert.deepEqual(w.traces[12].waterSearch,{leftDropDistance:undefined,rightDropDistance:5});
 for(let i=0;i<8;i++){step(w);assert.ok(w.stats.movedCells<=1)}assert.equal(at(w,7,4).material,'water');
});
test('Air on both sides without a lower opening causes Stay and no fake free-horizontal trace',()=>{
 const w=new World(9,3);for(let x=0;x<9;x++)w.set(x,2,'wood');w.set(3,1,'water');step(w);
 assert.equal(at(w,3,1).material,'water');assert.equal(w.stats.movedCells,0);assert.equal(w.traces[12].chosen,'stay');assert.deepEqual(w.traces[12].waterSearch,{leftDropDistance:undefined,rightDropDistance:undefined});assert.equal(w.traces[12].checks.length,3);
});
test('search prefers nearer drop, stops at non-Air and respects range and boundaries',()=>{
 const make=(hole)=>{const w=new World(17,4);for(let x=0;x<17;x++)if(!hole.includes(x))w.set(x,2,'wood');w.set(8,1,'water');return w};
 let w=make([5,13]);w.tick=1;step(w);assert.equal(at(w,7,1).material,'water');
 w=make([13]);w.set(10,1,'wood');step(w);assert.equal(w.stats.movedCells,0);
 w=make([15]);step(w);assert.equal(w.stats.movedCells,0);
 w=make([14]);step(w);assert.equal(at(w,9,1).material,'water');
 w=new World(1,1);w.set(0,0,'water');step(w);assert.equal(w.stats.movedCells,0);
});
test('wood is static; fire expires at its finite lifetime',()=>{
 const w=new World(5,5);w.set(0,0,'wood');w.set(4,4,'fire',3);step(w);assert.equal(at(w,4,4).life,2);step(w);step(w);assert.equal(at(w,4,4).material,'air');assert.equal(at(w,0,0).material,'wood');assert.equal(w.traces[24].chosen,'expired');
});
test('seeded ignition is reproducible and newly ignited cells wait until next tick',()=>{
 let found=false;
 for(let seed=0;seed<3000&&!found;seed++){
 const a=new World(3,3,seed),b=new World(3,3,seed);
 for(const w of [a,b]){w.set(1,1,'fire',90);w.set(1,0,'wood');step(w)}
 assert.deepEqual(a.cells,b.cells);
 if(at(a,1,0).material==='fire'){found=true;const life=at(a,1,0).life;assert.ok(life>=30&&life<=90);assert.equal(a.traces[1],undefined);assert.equal(at(a,1,0).updatedAt,1);step(a);assert.equal(at(a,1,0).life,life-1)}
 }
 assert.ok(found);
});
test('preset reset and identical painted inputs reproduce the complete simulation',()=>{
 const run=()=>{const w=createPreset('mixed',42);for(let t=0;t<80;t++){if(t===5)paintLine(w,[10,2],[20,3],'fire',2);step(w)}return w};
 const a=run(),b=run();assert.deepEqual(a.cells,b.cells);assert.deepEqual(a.traces,b.traces);assert.deepEqual(createPreset('mixed',42),createPreset('mixed',42));
});
test('movement conserves sand and water across many ticks and solid boundaries',()=>{
 const w=createPreset('mixed');const count=m=>w.cells.filter(c=>c.material===m).length;const before=[count('sand'),count('water')];for(let i=0;i<120;i++)step(w);assert.deepEqual([count('sand'),count('water')],before);assert.equal(w.index(-1,0),-1);assert.equal(w.index(120,0),-1);
});
test('brush clips boundaries, connected strokes have no gaps, Air erases',()=>{
 const w=new World(12,5);paintLine(w,[0,2],[11,2],'wood',1);assert.equal(w.cells.filter(c=>c.material==='wood').length,12);paintBrush(w,0,0,'sand',4);assert.equal(w.cells.length,60);paintLine(w,[0,2],[11,2],'air',1);assert.ok(w.cells.slice(24,36).every(c=>c.material==='air'));
});
test('last scan records actual history when the mode is changed',()=>{
 const w=new World();step(w);w.mode='bug';w.lateral='left';assert.deepEqual(w.lastScan,{bottomUp:true,forward:true});step(w);assert.deepEqual(w.lastScan,{bottomUp:false,forward:true});
});
