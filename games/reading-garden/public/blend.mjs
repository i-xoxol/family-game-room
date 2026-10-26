const clamp = n => Math.max(0, Math.min(1, n));

// A tap previews one sound. Only a left-to-right drag across the full rail
// requests the whole word; pointer-up alone never completes it.
export class BlendGesture {
  constructor(count) { this.count=count; this.cancel(); }
  begin(fraction) {
    this.cancel();const at=clamp(fraction);
    if(at>.2)return {sounds:[Math.min(this.count-1,Math.floor(at*this.count))],position:0,dragging:false};
    this.active=true;this.next=1;
    return {sounds:[0],position:0,dragging:true};
  }
  move(fraction) {
    if(!this.active)return {sounds:[],position:this.position};
    this.position=Math.max(this.position,clamp(fraction));
    const last=Math.min(this.count-1,Math.floor(this.position*this.count)),sounds=[];
    while(this.next<=last)sounds.push(this.next++);
    return {sounds,position:this.position};
  }
  end() {
    const complete=this.active&&this.position>=.92&&this.next===this.count;
    this.active=false;this.position=complete?1:0;
    return {complete,position:this.position};
  }
  cancel() {this.active=false;this.position=0;this.next=0;}
}
