exports.id=0,exports.modules={"./src/server/server.js":function(e,t,o){"use strict";o.r(t);var s=o("../build/contracts/FlightSuretyApp.json"),r=o("../build/contracts/FlightSuretyData.json"),a=o("./src/server/config.json"),n=o("web3"),c=o.n(n),l=o("express"),i=o.n(l);let d=a.localhost,u=new c.a(new c.a.providers.WebsocketProvider(d.url.replace("http","ws"))),h=new u.eth.Contract(s.abi,d.appAddress),g=new u.eth.Contract(r.abi,d.dataAddress);(async()=>{const e=await u.eth.getAccounts();e.slice(e.length/2);u.eth.defaultAccount=e[0];const{amIAuthorized:t,registerOracle:o,getMyIndexes:s,REGISTRATION_FEE:r}=h.methods,{authorizeContract:a}=g.methods,n=await t().call({from:e[0]}),c=await u.eth.net.getId();n||(console.log("App contract is not authorized. Calling authorize contract"),await a(h.networks[c].address).send({from:e[0]}));const l=await r().call();console.log(l)})(),h.events.OracleRequest({fromBlock:0},(function(e,t){e&&console.log(e),console.log(t)}));const p=i()();p.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),t.default=p}};