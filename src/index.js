const K8sDataReader = require("./K8sDataReader.js");
const NocasService = require("./NocasService");
const schedule = require('node-schedule');
const config = require("./config.json");
const command = "command：node index.js /kube/config nocas-ip:port [namespace]";

class K8sRegister {
    constructor(k8sConfig,nacosConfig,namespace) {
        this.k8sConfig = k8sConfig;
        if(namespace == undefined){
            this.namespace = "default";
        }else{
            this.namespace = namespace;
        }
        this.nconfig = {
            serverList: nacosConfig, 
            namespace: 'public',
        }
        //console.log(this.namespace);
        this.nocasService = null;
        this.listService = []
    }

    start() {
        this.getNodeIp(this.registerService);
    }

    registerService(data,that) {
        that.nocasService =new NocasService(that.nconfig);
        schedule.scheduleJob('0,30 * * * * *', () => {
            that.getSvcMetaData(data,that);
        });
    }

    getSvcMetaData(nodeDatas,that) {
        let k8sDataReader = new K8sDataReader(that.k8sConfig);
        k8sDataReader.getSvcMetaData(that.namespace, function (data) {
            var delData = that.calculateDeleteData(that.listService,data);
            that.listService = data;
            for(let i =0;i< data.length;i++){
                let svc = data[i];
                that.registerServiceNocasByConfig(svc,nodeDatas["node1"]);
            }
            for(let n =0;n< delData.length;n++){
                let svc = delData[n];
                that.deregisterServiceNocasByConfig(svc,nodeDatas["node1"]);
            }
        })
    }

    registerServiceNocasByConfig(svc,ip){
        if(config.type === "1"){
            if(config.extranet){
                let extranetip = config.extranet[ip];
                if(extranetip != null && extranetip != undefined){
                    ip = extranetip;
                }
            }
            this.registerServiceNocas(svc.name,ip,svc.nodePort);
        }else{
            this.registerServiceNocas(svc.name,svc.clusterIP,svc.port);
        }
    }

    deregisterServiceNocasByConfig(svc,ip){
        if(config.type === "1"){
            if(config.extranet){
                let extranetip = config.extranet[ip];
                if(extranetip != null && extranetip != undefined){
                    ip = extranetip;
                }
            }
            this.deregisterServiceNocas(svc.name,ip,svc.nodePort);
        }else{
            this.deregisterServiceNocas(svc.name,svc.clusterIP,svc.port);
        }
    }

    calculateDeleteData(oldData,newData){
        let delData = []
        let n = 0;
        for(let i = 0;i < oldData.length; i++){
            let isDel = true;
            for(let j =0;j< newData.length;j++){
                if(oldData[i].name == newData[j].name){
                    isDel = false;
                    break;
                }
            }
            if(isDel){
                delData[n] =  oldData[i];
                n++;
            }
        }
        return delData;
    }

    registerServiceNocas(name,ip,port){
        this.nocasService.registerInstance(name,{
            "ip": ip,
            "port": port
        });
    }

    deregisterServiceNocas(name,ip,port){
        this.nocasService.deregisterInstance(name,{
            "ip": ip,
            "port": port
        });
    }

    getNodeIp(cb) {
        var that = this;
        let k8sDataReader = new K8sDataReader(this.k8sConfig);
        k8sDataReader.getNodeMetaData(function (data) {
            
            cb(data,that);
        })
    }
}

function main(k8sConfig,nacosConfig,namespace) {
    var k8sRegister = new K8sRegister(k8sConfig,nacosConfig,namespace);
    k8sRegister.start();
}

var args = process.argv.splice(2)
if(args.length == 0){
   console.log(command);
}else if(args.length == 1){
   if(args[0] == "debug"){
      main("./config","127.0.0.1:8848","tt");
   }else{
      console.log(command);
   }
   
}else if(args.length == 2){
    main(args[0],args[1]);
}else{
    main(args[0],args[1],args[2]);
}

module.exports = K8sRegister;
