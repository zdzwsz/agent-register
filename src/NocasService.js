const NacosNamingClient = require('nacos').NacosNamingClient;
const logger = console;

const defaultConfig={
        logger,
        serverList: '127.0.0.1:8848',
        namespace: 'public',
}

class NacosService{
    constructor(config){
        if(config == undefined){
            config = defaultConfig;
        }else{
            config.logger = logger;
        }
        this.client = new NacosNamingClient(config);
        this.client.ready();
    }

    registerInstance(serviceName,ipconfig){
        this.client.registerInstance(serviceName, ipconfig);
    }

    deregisterInstance(serviceName,ipconfig){
        this.client.deregisterInstance(serviceName,ipconfig);
    }

    close(){
        this.client._close();
    }
}

module.exports = NacosService;