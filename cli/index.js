#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const {
  copyDirSync, exec, execRealtime, console_log, removeDirSync,
  Interceptor, BuildEnvChecker
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
   * @param build-all 执行打包
   * @param --help | -h 查看帮助信息
   */
const func = {
  'test': function() {
    copyDirSync('./view/dist', './service/dist');
  },

  /* build for all platform */
  'build-all': Interceptor.use( async function() {
    let command = `ncc build ${envObj.nccConf.entry}`;

    command += Object.keys(envObj.nccConf).reduce((total, current) => {
      if (current === 'entry') return total;

      total += ' ';
      total +=
        envObj.nccConf[current] instanceof Array ?
        envObj.nccConf[current].map(item => `${current} ${item}`).join(' ') :
        `${current} ${envObj.nccConf[current]} `;

      return total;
    }, ' ');

    await execRealtime(command, { cwd: envObj.path });

  }, [buildEnvChecker]) ,

  'link-deps': Interceptor.use(async function (env) {

    envObj.config.registry.forEach(async(item) => {
      if (item.mode !== 'remote') {
        await execRealtime(`yarn link ${item.name}`, { cwd: envObj.path });
      }
    });
    console_log(`\nlink-deps finishied!`);

  }, [buildEnvChecker]),

  'clean': async function (env) {
    if (fs.existsSync('./dist')) {
      removeDirSync('./dist');
    }
    await execRealtime('git checkout -- dist', { cwd: envObj.path });
    console_log(`\nclean finishied!`);
  },

  'rm-modules': async function (env) {
    removeDirSync('./node_modules');
  },

  /* build command usage */
  '--help': function() {
    console_log('\
    \n\
    description: build command for RhinoDisk.\n\
    command: node build.js [action] [config]\n\
    |\n\
    |\n\
    |______ param: [--help | -h ] => show usage info.\n\
    |______ param: [build-win   ] [--edit | --office] => build package for windows, the default conf file is ./service/config.json.\n\
    |______ param: [build-linux ] [--edit | --office] => build package for linux, the default conf file is ./service/config.json\n\
    |______ param: [build-mac   ] [--edit | --office] => build package for mac, the default conf file is ./service/config.json\n\
    |______ param: [build-all   ] [--edit | --office] => build package for all platform, the default conf file is ./service/config.json\n\
    |______ param: [clean-build ] => clean build directory after build\n\
    |\n\
    |______ example1: node build.js build-win\n\
    |______ example2: node build.js build-linux\n\
    |______ example3: node build.js build-mac\n\
    |______ example4: node build.js build-all\n\
    |______ example5: node build.js build-win --edit\n\
    |______ example6: node build.js build-win --office\n\
    |______ example7: node build.js --help\n\
    |______ example8: node build.js clean-build\n\
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
    if (func[key] && (typeof func[key] === 'function')) indexArray.push(i);
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
