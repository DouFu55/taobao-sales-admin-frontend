//1. 导入axios对象
import axios from "axios";
//2. 创建对象实例，create方法
const Server = axios.create({
    //请求接口的基础地址
    baseURL: 'http://127.0.0.1:30001/', 
    //设置超时时间
    timeout: 4000 
})

// 请求拦截器
Server.interceptors.request.use(config => {

    // 给管理后台的接口设置header头，添加Authorzation属性
    let token = sessionStorage.getItem('token')
    config.headers['Authorization'] = token//给header头添加token值

    return config
}, error => {
    // 出现异常
    return Promise.reject(error);
})

// 响应拦截器
Server.interceptors.response.use(response =>{

    // 后台正常响应的状态，如果是200， 说明后台处理没有问题
   /*  if (response.status == 200) {
        return response.data;
    } */
    // return response.data 可以在这里统一的获取后台响应的数据进行返回，而这里面就没有请求头那些
    if (response.data.code === 400) {
        return Promise.reject(new Error(response.data.message || 'Error'));
    }
    if (response.data.code === 500) {
        return Promise.reject(new Error(response.data.message || 'Error'));
    }
    return response.data;
}, error => {
    return Promise.reject(error);
})


export default Server // 导出自定义创建 axios 对象
