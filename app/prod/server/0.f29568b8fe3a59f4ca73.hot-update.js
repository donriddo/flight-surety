exports.id=0,exports.modules={"./src/server/server.js":function(e,t,r){"use strict";r.r(t);var s=r("../build/contracts/FlightSuretyApp.json"),a=r("../build/contracts/FlightSuretyData.json"),n=r("./src/server/config.json"),o=r("web3"),l=r.n(o),c=r("express"),u=r.n(c);let i=n.localhost,d=new l.a(new l.a.providers.WebsocketProvider(i.url.replace("http","ws"))),h=new d.eth.Contract(s.abi,i.appAddress),g=new d.eth.Contract(a.abi,i.dataAddress);const{amIAuthorized:f,registerOracle:p,submitOracleResponse:m,REGISTRATION_FEE:V}=h.methods,{authorizeContract:w}=g.methods,x=[],A=[0,10,20,30,40,50];(async()=>{const e=await d.eth.getAccounts(),t=e.slice(e.length/2);d.eth.defaultAccount=e[0];const r=await f().call({from:e[0]});await d.eth.net.getId();r||(console.log("App contract is not authorized. Calling authorize contract"),await w(i.appAddress).send({from:e[0]}));const s=await V().call();t.forEach(async e=>{await p().send({from:e,value:s,gas:3e6})})})(),h.events.OracleRegistered({fromBlock:0},(function(e,t){if(e&&console.log(e),console.log(t),t.returnValues&&t.returnValues.oracle&&t.returnValues.indexes){const e=x.findIndex(e=>e.address===t.returnValues.oracle);e>-1?x[e].indexes=t.returnValues.indexes:x.push({address:t.returnValues.oracle,indexes:t.returnValues.indexes})}})),h.events.OracleRequest({fromBlock:0},(function(e,t){if(e&&console.log(e),console.log(t),t.returnValues&&t.returnValues.flightKey&&t.returnValues.index&&t.returnValues.airline&&t.returnValues.timestamp){x.filter(e=>e.indexes.includes(t.returnValues.index)).forEach(async e=>{try{await m(t.returnValues.index,t.returnValues.airline,t.returnValues.flightKey,t.returnValues.timestamp,A[Math.floor(Math.random()*A.length)])}catch(e){console.log(`Error submitting response to contract: ${e}`)}})}}));const v=u()();v.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),v.get("/api/oracles",(e,t)=>{t.send({message:"List of oracles retrieved successfully",data:x,meta:{total:x.length}})}),t.default=v}};