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

  /* check env file and build dist resources with ncc. */
  'build-all': Interceptor.use( async function() {

    console_log(`\n >>>> Start building the whole project in \n [${envObj.path}] <<<< \n`, 'heavyGree');

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

    console_log(`\n >>>> Build the whole project successfully in \n [${envObj.path}] <<<< \n`);

  }, [buildEnvChecker]) ,


  /* link all local dependencies with yarn link */
  'link-deps': Interceptor.use(async function (env) {

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
    |____ action: [build-all   ] => start building package.\n\
    |____ action: [clean       ] => clean dist directory.\n\
    |____ action: [link-deps   ] => link all local dependencies with yarn link.\n\
    |\n\
    |____ example1: node-mono-cli rm-modules\n\
    |____ example2: node-mono-cli link-deps\n\
    |____ example3: node-mono-cli build-all\n\
    |____ example4: node-mono-cli clean\n\
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
