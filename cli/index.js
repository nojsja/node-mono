#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const {
  copyDirSync, exec, execRealtime, console_log, removeDirSync,
  Interceptor, BuildEnvChecker, getNccCommand
} = require('./build.utils');

const envObj = {
  path: '',
  nccConf: null,
  config: null
};

const buildEnvChecker = new BuildEnvChecker(envObj);

/* -------------- logic define -------------- */

/*
   * 函数调用list
   * @param not-inherited 未继承方法
   * @param build:subs 执行子项目打包
   * @param build:entry 执行 entry 子项目打包
   * @param link:deps 建立本地仓库之间的软链接
   * @param clean 清理 dist 目录
   * @param --path | -p 指定执行目录，创建公用编译环境对象
   * @param --help | -h 查看帮助信息
   */
const func = {

  /* empty action in package.json */
  'not-inherited': Interceptor.use(function() {

    console_log(`\n >>>> Not inherited action in [${envObj.path}] <<<< \n`, 'yellow');

  }, [buildEnvChecker]),

  /* start building sub-packages */
  'build:subs': Interceptor.use( async function() {

    console_log(`\n >>>> Start building the sub project in \n [${envObj.path}] <<<< \n`, 'heavyGree');

    const command = getNccCommand(envObj);

    await execRealtime(command, { cwd: envObj.path });

    console_log(`\n >>>> Build the sub project successfully in \n [${envObj.path}] <<<< \n`);

  }, [buildEnvChecker]) ,

  /* start building entry-point package */
  'build:entry': Interceptor.use( async function() {

    console_log(`\n >>>> Start building the entry project in \n [${envObj.path}] <<<< \n`, 'heavyGree');

    // [01] 组装 ncc 命令
    const command = getNccCommand(envObj);
    const packageConf = require(`${envObj.path}/package.json`);

    // [02] 执行打包
    await execRealtime(command, { cwd: envObj.path });

    // [03] 生成子应用组合配置文件
    fs.writeFileSync(
      `${envObj.path}/dist/package.json`,
      JSON.stringify(Object.assign(packageConf, {
        "scripts": {
          "start": "node index.js"
        },
        "dependencies": envObj.config.registry.reduce((total, current) => {
          total[current.name] = `file:${path.join('../', current.path, 'dist')}`;
          return total;
        }, {}),
        "devDependencies": {}
      }), null, 2)
    );

    // [04] 开始执行子应用组合
    await execRealtime(`yarn install`, { cwd: `${envObj.path}/dist` });

    console_log(`\n >>>> Build the entry project successfully in \n [${envObj.path}] <<<< \n`);

  }, [buildEnvChecker]) ,


  /* link all local dependencies with yarn link */
  'link:deps': Interceptor.use(async function (env) {

    console_log(`\n >>>> Start linking local dependencies in \n [${envObj.path}] <<<< \n`, 'heavyGree');

    envObj.config.registry.forEach(async(item) => {
      if (item.mode !== 'remote') {
        await execRealtime(`yarn link ${item.name}`, { cwd: envObj.path });
      }
    });

    console_log(`\n >>>> Successfully link the project dependencies in \n [${envObj.path}] <<<< \n`, 'blue');

  }, [buildEnvChecker]),


  /* clean dist directory */
  'clean': Interceptor.use(async function (env) {

    console_log(`\n >>>> Start cleaning up dist resources in \n [${envObj.path}] <<<< \n`, 'heavyGree');

    if (fs.existsSync('./dist')) {
      removeDirSync('./dist');
    }

    console_log(`\n >>>> Successfully cleaned up dist resources in \n [${envObj.path}] <<<< \n`);

  }, [buildEnvChecker]),


  /* remove node_modules directory */
  'rm-modules': Interceptor.use(async function (env) {

    console_log(`\n >>>> Start removing node_modules in \n [${envObj.path}] <<<< \n`, 'heavyGree');

    removeDirSync('./node_modules');

    console_log(`\n >>>> Successfully remove node_modules in \n [${envObj.path}] <<<< \n`);

  }, [buildEnvChecker]),


  /* build command usage */
  '--help': function() {
    console_log('\
    \n\
    * description: node-mono-cli - auto command cli for node-mono project.\n\
    * command: node-mono-cli [config] [action] \n\
    |\n\
    |____ config: [--path | -p ] => the path to target build project.\n\
    |\n\
    |____ action: [--help | -h ] => show usage info.\n\
    |____ action: [build:subs   ] => start building sub-packages.\n\
    |____ action: [build:entry   ] => start building entry-point package.\n\
    |____ action: [link:deps   ] => link all local dependencies with yarn link.\n\
    |____ action: [clean       ] => clean dist directory.\n\
    |____ action: [rm-modules       ] => rm node_modules directory.\n\
    |\n\
    |____ example1: node-mono-cli rm-modules\n\
    |____ example2: node-mono-cli link:deps\n\
    |____ example3: node-mono-cli build:subs\n\
    |____ example4: node-mono-cli build:entry\n\
    |____ example5: node-mono-cli clean\n\
    \n\
    ')
  },
  '-h': function () {
    this['--help']();
  },


  '--path': function (p) {
    if (!fs.existsSync(p))
      return console_log(`The path - ${p} is not exists, please confirm again!`, 'white', 'red');
    envObj.nccConf = require(path.join(p, './ncc.config.js'));
    envObj.config = require(path.join(p, './config.json'));
    envObj.path = p;
  },
  '-p': function (p) {
    this['--path'](p);
  },

};

/* *************** Main Entry *************** */

/* Main */
function Main() {
  const params = process.argv.splice(2);
  const indexArray = [];
  let args;

  params.forEach((key, i) => {
    if (func[key] && (typeof func[key] === 'function'))
      indexArray.push(i);
  });

  indexArray.forEach((index, i) => {
    args = params.slice(index + 1, indexArray[i + 1]);

    if (args.length) {
      func[params[index]](...args);
    }
    else {
      func[params[index]]('');
    }

  });
}

Main();
