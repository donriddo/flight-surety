exports.id=0,exports.modules={"./src/server/server.js":function(e,o,t){"use strict";t.r(o);var s=t("../build/contracts/FlightSuretyApp.json"),r=t("../build/contracts/FlightSuretyData.json"),a=t("./src/server/config.json"),n=t("web3"),c=t.n(n),l=t("express"),d=t.n(l);let i=a.localhost,u=new c.a(new c.a.providers.WebsocketProvider(i.url.replace("http","ws"))),h=new u.eth.Contract(s.abi,i.appAddress),p=new u.eth.Contract(r.abi,i.dataAddress);(async()=>{const e=u.eth.getAccounts();u.eth.defaultAccount=e[0],console.log(h.methods),console.log(p.methods);const{amIAuthorized:o}=h.methods,{authorizeContract:t}=p.methods;console.log({authorizeContract:t,amIAuthorized:o}),await o.call()||(console.log("App contract is not authorized. Calling authorize contract"),await t(deployedNetwork.address).send({from:(void 0).account}))})(),h.events.OracleRequest({fromBlock:0},(function(e,o){e&&console.log(e),console.log(o)}));const g=d()();g.get("/api",(e,o)=>{o.send({message:"An API for use with your Dapp!"})}),o.default=g}};