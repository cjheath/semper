jQuery.fn.tabOverride=function(e){function u(e){var r=e.keyCode,u,a,f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T;if(r!==9&&(r!==13||!o.autoIndent)||e.ctrlKey||e.altKey)return;n=!1,f=this.value,d=this.scrollTop;if(document.selection)l=document.selection.createRange(),g=l.text,c=l.duplicate(),c.moveToElementText(this),c.setEndPoint("EndToEnd",l),m=c.text.length,v=m-g.length,s>1?(h=f.slice(0,v).split(i).length-1,p=g.split(i).length-1):h=p=0;else{if(typeof this.selectionStart=="undefined")return;v=this.selectionStart,m=this.selectionEnd,g=f.slice(v,m)}if(r===9)u=t,a=u.length,w=0,E=0,S=0,v!==m&&g.indexOf("\n")!==-1?(v===0||f.charAt(v-1)==="\n"?y=v:y=f.lastIndexOf("\n",v-1)+1,m===f.length||f.charAt(m)==="\n"?b=m:(b=f.indexOf("\n",m),b===-1&&(b=f.length)),e.shiftKey?(f.slice(y).indexOf(u)===0&&(y===v?g=g.slice(a):S=a,E=a),this.value=f.slice(0,y)+f.slice(y+S,v)+g.replace(new RegExp("\n"+u,"g"),function(){return w+=1,"\n"})+f.slice(m),l?(l.collapse(),l.moveEnd("character",m-E-w*a-p-h),l.moveStart("character",v-S-h),l.select()):(this.selectionStart=v-S,this.selectionEnd=m-E-w*a)):(w=1,this.value=f.slice(0,y)+u+f.slice(y,v)+g.replace(/\n/g,function(){return w+=1,"\n"+u})+f.slice(m),l?(l.collapse(),l.moveEnd("character",m+w*a-p-h),l.moveStart("character",v+a-h),l.select()):(this.selectionStart=v+a,this.selectionEnd=m+w*a,this.scrollTop=d))):e.shiftKey?f.slice(v-a).indexOf(u)===0&&(this.value=f.slice(0,v-a)+f.slice(v),l?(l.move("character",v-a-h),l.select()):(this.selectionEnd=this.selectionStart=v-a,this.scrollTop=d)):l?(l.text=u,l.select()):(this.value=f.slice(0,v)+u+f.slice(m),this.selectionEnd=this.selectionStart=v+a,this.scrollTop=d);else if(o.autoIndent){if(v===0||f.charAt(v-1)==="\n"){n=!0;return}y=f.lastIndexOf("\n",v-1)+1,b=f.indexOf("\n",v),b===-1&&(b=f.length),x=f.slice(y,b).match(/^[ \t]*/)[0],T=x.length;if(v<y+T){n=!0;return}l?(l.text="\n"+x,l.select()):(this.value=f.slice(0,v)+"\n"+x+f.slice(m),this.selectionEnd=this.selectionStart=v+s+T,this.scrollTop=d)}e.preventDefault()}function a(e){var t=e.keyCode;(t===9||t===13&&o.autoIndent&&!n)&&!e.ctrlKey&&!e.altKey&&e.preventDefault()}var t="	",n=!1,r=document.createElement("textarea"),i,s,o;return o=function(t){return this.each(function(){e(this).unbind(".tabOverride")}),(!arguments.length||t)&&this.each(function(){this.nodeName&&this.nodeName.toLowerCase()==="textarea"&&e(this).bind("keydown.tabOverride",u).bind("keypress.tabOverride",a)}),this},o.getTabSize=function(){return o.tabSize()},o.setTabSize=function(e){o.tabSize(e)},o.tabSize=function(e){if(!arguments.length)return t==="	"?0:t.length;var n;if(!e)t="	";else if(typeof e=="number"&&e>0){t="";for(n=0;n<e;n+=1)t+=" "}},o.autoIndent=!1,r.value="\n",i=r.value,s=i.length,r=null,o}(jQuery);