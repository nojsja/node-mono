#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child = require('child_process');

/**
  * removeDirSync [remove dir sync vertion]
  * @author nojsja
  * @param  {[String]} _path [path to a directory]
  */
exports.removeDirSync = function(_path) {
  if( fs.existsSync(_path) ) {
    fs.rmdirSync(_path, {
      recursive: true,
    });
  }
};

/*
* 复制目录、子目录，及其中的文件
* @param src {String} 要复制的目录
* @param dist {String} 复制到目标目录
*/
exports.copyDirSync = (src, dist) => {
 const _copy = (src, dist) => {
   const paths = fs.readdirSync(src)
   paths.forEach((p) => {
     let _src = src + '/' +p;
     let _dist = dist + '/' +p;
     let stat = fs.statSync(_src)
     if(stat.isFile()) {// 判断是文件还是目录
       fs.writeFileSync(_dist, fs.readFileSync(_src));
     } else if(stat.isDirectory()) {
       exports.copyDirSync(_src, _dist)// 当是目录是，递归复制
     }
   })
 }

 const b = fs.existsSync(dist)
 if(!b){
   fs.mkdirSync(dist);//创建目录
 }
 _copy(src, dist);
}

/**
   * [exec 执行一个命令，阻塞输出信息到控制台]
   * @param  { [String] }  command    [命令]
   * @param  { [Array | String] }   params  [参数数组]
   * @param  { [Object] }  options [exec可定制的参数]
   * @return { Promise }           [返回Promise对象]
   */
exports.exec = (_command, _params=[], _options={}) => {
  const params = Array.isArray(_params) ? _params.join(' ') : '';
  const options = (String(_params) === '[object Object]') ? _params : (_options);
  const command = `${_command} ${params}`;
  
  console.log(params, options, command);

  return new Promise((resolve, reject) => {
    child.exec(command, options, (_err, _stdout, _stderr) => {
      if (_err) {
        exports.console_log(_err, 'red');
        resolve({code: 1, result: _err});
      } else if (_stderr && _stderr.toString()) {
        exports.console_log(_stderr, 'red');
        resolve({code: 1, result: _stderr});
      } else {
        console.log(_stdout);
        resolve({code: 0, result: _stdout});
      }
    });
  });
}

/**
   * [execRealtime 执行一个命令，实时输出信息到控制台]
   * @param  { [String] }  command    [命令]
   * @param  { [Array | String] }   params  [参数数组]
   * @param  { [Object] }  options [exec可定制的参数]
   * @return { Promise }           [返回Promise对象]
   */
  exports.execRealtime = (_command, _params=[], _options={}) => {
    const params = Array.isArray(_params) ? _params.join(' ') : '';
    const options = (String(_params) === '[object Object]') ? _params : (_options);
    const command = `${_command} ${params}`;
    let data = '', error = '';
    
    console.log(params, options, command);
  
    return new Promise((resolve, reject) => {
      const result = child.exec(command, options);
      
      result.stdout.on('data', (data) => {
        exports.console_log(data, 'white');
        data += `${data}`;
      });

      result.stderr.on('data', (data) => {
        exports.console_log(data, 'red');
        error += `${data}`;
      });

      result.on('close', (code) => {
        resolve({code, result: data, error});
      });
    });
  }

/**
   * [console_log 格式化颜色console.log]
   * @param  { [String] }  info    [输出的字符串]
   * @param  { [String] }   _color  [字体颜色-black | red | green(default) | yellow | blue | purple | heavyGree | white]
   * @param  { [Object] }  _bgcolor [背景颜色-black(default) | red | green | yellow | blue | purple | heavyGree | white]
   */
exports.console_log = (function() {
  const colorMap = {
      black:30,
      red: 31,
      green: 32,
      yellow: 33,
      blue: 34,
      purple: 35,
      heavyGree: 36,
      white: 37,
  }
  
  return (info, _color='green', _bgcolor='black') => {
    const color = colorMap[_color];
    const bgcolor = colorMap[_bgcolor] + 10;
    const colorFormat = color && bgcolor ? `${bgcolor};${color}m` : '\033[0m';
    console.log('\033[' + `${colorFormat}${info}` + '\033[0m') ;
  }
})();

/**
  * Interceptor [拦截器函数]
  * @author nojsja
  */
exports.Interceptor = class Interceptor {
  
  constructor(env) {
    this.env = env;
  }

  /**
    * use [静态函数，将拦截器和目标函数组装起来]
    * @author nojsja
    * @param  {[Function]} func [目标函数]
    * @param  {[Array]} pre [预处理器]
    * @param  {[Array]} after [后置处理器]
    * @return {[Function]} [组装好的函数]
    */
  static use = function(func, pre=[], after=[]) {

    return function(...args) {
      pre.forEach(p => {
        p.pre.apply(this, args);
      });

      func.apply(this, args);

      after.forEach(a => {
        a.after.apply(this, args);
      });
    }
  }
};

/**
  * BuildEnvChecker [构建环境监测]
  * @author nojsja
  */
exports.BuildEnvChecker = class BuildEnvChecker extends exports.Interceptor {

  constructor(env) {
    super(env);
  }

  /**
    * pre [前置处理逻辑]
    * @author nojsja
    * @param  {[Object]} config [配置文件1]
    * @param  {[Object]} nccConf [配置文件2]
    * @return {[Any]} [any]
    */
  pre = () => {
    if (!this.env || !this.env.config || !this.env.nccConf) {
      exports.console_log(`The params '--path' should be provided firstly!`, 'white', 'red');
      process.exit(1);
    }
  }
}