exports.id=0,exports.modules={"./src/server/server.js":function(e,t,o){"use strict";o.r(t);var s=o("../build/contracts/FlightSuretyApp.json"),r=o("../build/contracts/FlightSuretyData.json"),a=o("./src/server/config.json"),n=o("web3"),c=o.n(n),l=o("express"),d=o.n(l);let i=a.localhost,u=new c.a(new c.a.providers.WebsocketProvider(i.url.replace("http","ws"))),p=new u.eth.Contract(s.abi,i.appAddress),h=new u.eth.Contract(r.abi,i.dataAddress);(async()=>{const e=u.eth.getAccounts();u.eth.defaultAccount=e[0];const{amIAuthorized:t}=p.methods,{authorizeContract:o}=h.methods;await t.call()||(console.log("App contract is not authorized. Calling authorize contract"),await o(deployedNetwork.address).send({from:(void 0).account}))})(),p.events.OracleRequest({fromBlock:0},(function(e,t){e&&console.log(e),console.log(t)}));const g=d()();g.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),t.default=g}};