const InternalIP = "InternalIP";
var path = __dirname;
class K8sDataReader {

    constructor(config) {
        const k8s = require('@kubernetes/client-node');
        const kc = new k8s.KubeConfig();
        //kc.loadFromDefault();
        kc.loadFromFile(config);
        this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    }

    getSvcMetaData(namespace , cb){
        var that = this;
        this.k8sApi.listNamespacedService(namespace).then((res) =>{
            //console.log(res.body.items[0]);
            let svcdata = that.getSvcs(res.body);
            if(cb){
                cb(svcdata);
            }
        })
    }

    getNodeMetaData(cb){
        this.k8sApi.listNode().then((res)=>{
            var data = {};
            let items = res.body.items;
            for(let i =0;i< items.length;i++){
                let addresses = items[i].status.addresses;
                let name = items[i].metadata.name;
                var adsid = "";
                for(let j = 0;j< addresses.length;j++){
                    if(InternalIP  === addresses[j].type){
                        adsid = addresses[j].address;
                    }
                }
                data[name] = adsid;
            }
            if(cb){
                cb(data);
            }
            
        })
    }

    getSvcs(body){
        let svcs = [];
        let items = body.items;
        if(items){
            for(let i =0;i< items.length;i++){
                svcs[i] = this.getSvcMeta(items[i]);
            }
        }
        return svcs;
     }
     
     getSvcMeta(item){
         var svc = {}
         svc.name = item.metadata.name;
         svc.clusterIP = item.spec.clusterIP;
         svc.type = item.spec.type;
         //svc.ports = []
         //console.log(item.spec.ports);
         for( let i = 0; i< item.spec.ports.length;i++){
             let port = item.spec.ports[i];
             svc.nodePort = port.nodePort;
             svc.port = port.port;
             //svc.ports[i].nodePort = port.nodePort;
             //svc.ports[i].port = port.port;
             //svc.ports[i].targetPort = port.targetPort;
         }
         return svc;
     }

}
module.exports = K8sDataReader;
