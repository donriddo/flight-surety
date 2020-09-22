exports.id=0,exports.modules={"./src/server/server.js":function(e,t,o){"use strict";o.r(t);var s=o("../build/contracts/FlightSuretyApp.json"),a=o("../build/contracts/FlightSuretyData.json"),r=o("./src/server/config.json"),n=o("web3"),c=o.n(n),l=o("express"),i=o.n(l);let d=r.localhost,u=new c.a(new c.a.providers.WebsocketProvider(d.url.replace("http","ws"))),h=new u.eth.Contract(s.abi,d.appAddress),p=new u.eth.Contract(a.abi,d.dataAddress);(async()=>{const e=await u.eth.getAccounts();e.slice(e.length/2);u.eth.defaultAccount=e[0];const{amIAuthorized:t,registerOracle:o,getMyIndexes:s,REGISTRATION_FEE:a}=h.methods,{authorizeContract:r}=p.methods,n=await t().call({from:e[0]});await u.eth.net.getId();n||(console.log("App contract is not authorized. Calling authorize contract"),await r(d.appAddress).send({from:e[0]}));const c=await a().call();console.log(c)})(),h.events.OracleRequest({fromBlock:0},(function(e,t){e&&console.log(e),console.log(t)}));const g=i()();g.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),t.default=g}};