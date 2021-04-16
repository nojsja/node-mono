const path = require('path');
const fs = require('fs');
const { copyDirSync, exec, execRealtime, console_log, removeDirSync } = require('./build.utils');
const nccConf = require('./ncc.config.js');
const config = require('./config.json');
/*
   * 函数调用list
   * @param build-all 执行打包
   * @param --help | -h 查看帮助信息
   */
const func = {
  'test': () => {
    copyDirSync('./view/dist', './service/dist');
  },
  /* build for all platform */
  'build-all': async (env) => {
    let command = `ncc build ${nccConf.entry}`;

    command += Object.keys(nccConf).reduce((total, current) => {
      if (current === 'entry') return total;

      total += ' ';
      total +=
        nccConf[current] instanceof Array ?
        nccConf[current].map(item => `${current} ${item}`).join(' ') :
        `${current} ${nccConf[current]} `;

      return total;
    }, ' ');

    await execRealtime(command, { cwd: __dirname });
  },
  'link-deps': async (env) => {
    config.registry.forEach(async(item) => {
      if (item.mode !== 'remote') {
        await execRealtime(`yarn link ${item.name}`, { cwd: __dirname });
      }
    });
    console_log(`\nlink-deps finishied!`);
  },
  'clean': async (env) => {
    if (fs.existsSync('./dist')) {
      removeDirSync('./dist');
    }
    await execRealtime('git checkout -- dist', { cwd: __dirname });
    console_log(`\nclean finishied!`);
  },
  'rm-modules': async (env) => {
    removeDirSync('./node_modules');
  },
  /* build command usage */
  '--help': () => {
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
  '-h': () => {
    func['--help']();
  }
};

/* Main */
function Main() {
  const params = process.argv.splice(2);
  const indexArray = [];
  let args;

  params.forEach((key, i) => {
    if (func[key] && (typeof func[key] === 'function')) indexArray.push(i);
  });
  
  indexArray.forEach((index, i) => {
    args = indexArray.slice(index + 1, indexArray[i + 1]).map(i => params[i]);
    if (args.length)
      func[params[index]](...args);
    else
      func[params[index]]('');
  });
}

Main();
