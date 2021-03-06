## node-mono
> multi-repo structure powerd by yarn workspace / yarn link / ncc compiler.
#### ➣ 介绍
---
适用于 node.js(Express) 中间层 multi-repo 管理方案的脚手架工具。

#### ➣ 目录
---

```bash
[file] .npmrc -- npm 环境配置  
[file] config.json -- 项目配置文件(暂未使用)  
[file] package.json -- 项目基本信息和依赖包管理  

[dir ] packages -- 存放子项目的目录  

[dir ] cli -- 脚手架自带的cli脚本工具目录  
[file] ..... cli/index.js -- 脚手架运行文件  
[file] ..... cli/build.utils.js -- 用于工程构建的工具方法  
[file] ..... cli/package.json -- 用于脚手架cli脚本注册的配置文件  
```

#### ➣ 命令
---
- `start` - 在所有子项目中执行 start 操作。
- `start:entry` - 在入口基座项目中执行 start 操作。
- `setup` - 在整个项目空间安装 yarn 外部依赖并依次执行 _yarn registry:cli; yarn registry:unlink; yarn registry:link; yarn link:all_。
- `registry:cli` - 将本地 cli 脚本注册到全局。
- `registry:unlink` - 取消之前可能存在的仓库注册数据。
- `registry:link` - 将一个本地仓库注册到 yarn 本地全局空间。
- `link:all` - 读取子项目的 config.json 文件，在子项目之间建立必要的本地软链接，使子项目在开发环境下能本地互通访问。
- `reset` - 取消注子项目册信息并删除子项目已经安装的 npm 包。
- `build:subs` - 多个子项目并行执行打包
- `build:entry` - 入口基座项目执行打包
- `build:all` - 全局打包，相当于依次执行 _yarn reset; yarn setup; yarn build:subs; yarn build:entry_。


#### ➣ 软件架构
---

&nbsp;&nbsp;&nbsp;&nbsp; 多个子项目分为多个 git 仓库分别管理，开发环境整合的时候，使用 node-mono 脚手架添加多个 packages，然后通过脚手架全局命令统一管理，比如：建立 packages 之间的本地依赖软链接、全局启动、统一打包、全局清理、全局初始化。

##### 原理1：multi-repo 的管理方式探索

&nbsp;&nbsp;&nbsp;&nbsp; 整个脚手架仓库是使用 `yarn workspace` 特性进行管理的，即`hoist模式`，此模式下位于子目录下的子项目的公共依赖会被提升到顶层根目录 `node_modules` 进行安装，子项目之间如果依赖同一个模块的不同版本，那么这个模块的相应版本会分别在子项目目录下的 `node_modules` 目录安装。`hoist模式`下在子项目和脚手架项目下执行 `yarn install` 不存在区别。

##### 原理2：npm+git 协议简化子项目依赖问题
&nbsp;&nbsp;&nbsp;&nbsp; 为了简化子项目之间相互依赖管理(比如子项目A依赖子项目B)和部署问题，子项目的 npm 地址采用 git 协议指定在 package.json 文件中，例如：`"@node-mono/node-common-libs": "git+https://gitee.com/nojsja/node-common.git#master"`。执行 `yarn install` 安装时 npm 会将位于 git 仓库中的远程项目下载到 `node_modules` 目录下。

##### 原理3：使用 yarn link 解决开发环境多项目协同问题

&nbsp;&nbsp;&nbsp;&nbsp; 显然如果只是通过 `npm + git` 无法解决本地多个子项目共同开发时的实时预览代码更改问题，因此开发环境下使用 `yarn link` 机制先将各个子项目注册到开发机的 yarn 本地全局访问仓库(建立可全局访问的软链接)，然后再通过子项目中 `config.json` 配置文件读取需要进行本地开发的子项目模块(配置文件中生命的依赖模块的`registry.mode === local`)，将所有需要的开发中模块通过命令 `yarn link [子项目注册名]` 进行软链接到当前子模块的 `node_modules` 目录中。具体体现就是子项目 `node_modules` 目录中的某个其它子项目是一个软链接直接指向本地的的另一个子项目开发目录(位于 packages 目录下)，可以查看子项目 `node_modules` 文件夹下的软链接地址进行确认，如若更改 `config.json`中 `registry.mode`字段切换开发环境/生产环境，安全起见更改之后请执行清理`yarn reset`并重新初始化`yarn setup`。

##### 原理4：使用 ncc 编译工具打包各个子项目

&nbsp;&nbsp;&nbsp;&nbsp; 各个子项目被拆分成多个 git 仓库单独管理，打包的时候会通过 `ncc` 工具进行单独打包，每个子项目中都有自己的 `ncc.config` 进行打包声明，每个子项目打包的时候所有依赖的其它子项目均不会被打包进当前子项目的 `dist` 文件，即每个子项目中不存在其它子项目模块的文件。

##### 原理5：借助 entry 项目和 npm 安装机制进行生产环境构建

&nbsp;&nbsp;&nbsp;&nbsp; 所有子项目中有一个运行着基础环境的 `entry 项目`，它会引入其余所有的`业务子模块`和`公共子模块`，最后的 `yarn build:entry`命令即是对这个模块进行打包，打包第一步之后的 entry项目 `dist` 文件中也不包含所有其它子项目模块，因此需要第二步在`dist`目录中动态创建 `package.json`，将在 `config.json` 中声明的所有其它子项目模块依赖写入 `package.json` 文件的 `dependencies` 字段，并且 npm 包的地址协议需要指定为本地`file:`协议，例如：`"@node-mono/node-common-libs": "file:/path/to/common-libs"`，然后在`[entry]/dist/`目录中执行`yarn install`，这样子所有依赖的其它子项目模块就会被复制到 `[entry]/dist/node_modules` 目录下了。

&nbsp;&nbsp;&nbsp;&nbsp; 至此完成 entry 项目的打包，将 `[entry]/dist` 目录复制到任意文件夹中都可以使用`node index.js`成功运行起来，整个 `dist` 文件夹已经是一个独立的生产环境项目文件了。


#### ➣ 安装基础环境
---

1. 安装 yarn@1.x
```bash
npm install -g yarn
```
2. 查看 yarn 的使用帮助
```bash
# 查看帮助
yarn --help

# ------ 常见命令 ------ #

# 安装当前项目中的所有包
yarn install

# 安装一个包
yarn add [package]@[versiun]

# 全局安装一个包
yarn global add [package]@[versiun]

# 删除一个包
yarn remove [package]
```

#### ➣ 项目开发指引
---

1. 将各个子项目 git 仓库放入 packages 目录作为多个子项目管理。

2. 在脚手架根目录执行 `yarn setup` 运行初始化流程，相当于依次执行以下命令：
```bash
# [01 - 统一安装管理项目 npm 依赖(hoist模式)]
$: yarn install
# [02 - 将 cli 脚本注册为全局命令]
$: yarn registry:cli
# [03 - 进入各个子项目目录取消可能存在的 yarn link 全局注册]
$: yarn registry:unlink
# [04 - 进入各个子项目目录执行本地 yarn link 全局注册]
$: yarn registry:link
# [05 - 进入各个子项目目录使用上一步的注册信息并根据子项目 config.json 对本地子项目之间的相互依赖进行本地链接]
$: yarn link:all
```
3. 配置位于子项目中的 `config.json` 的 `registry` 字段

> 注意的是 `registry` 数组中所有声明的依赖子项目都需要在 package.json 文件中的 `dependencies` 字段里声明下载地址(npm+git)。每个模块的 `mode` 属性指明当前开发环境下此模块的加载和引用方式，`mode` 的可选值为 `remote | local`。`local` 值表示当前子项目加载此依赖子模块时使用其中声明的 `path` 属性指向的一个目录进行本地加载，`remote` 值表示当前子项目加载此依赖子模块时使用 `package.json` 的 `dependencies` 字段里的相应声明从远程仓库下载到本地`node_modules`目录并加载。这两种方式的区别就是：remote 方式指明的依赖在最终打包时会被放入引用它的子项目自己的 `node_modules` 目录下，因此建议当需要特殊引入某个依赖包的某个版本时使用此方式；而 local 方式指明的依赖在最终打包时会被放入 `根 node_modules` 目录下作为一个公共依赖模块被加载。
```json
{
  "module": "@node-mono/[模块名]",
  "registry": [
    {
      "name": "@node-mono/[依赖的其它子项目名]",
      "path": "../node-common",
      "mode": "remote",
      "env": {
        "development": "index.js",
        "production": "dist/index.js"
      }
    }
  ]
}
```
这里再对 `remote | local` 模式做一个实例说明：  

&nbsp;&nbsp;&nbsp;&nbsp; 有 A、B、C、D 四个子项目。A 作为基座项目，它依赖子项目 B 、C (`2.0.0`版本) 、D；子项目 B 依赖子项目 C (`2.0.0`版本) 、子项目 D 依赖子项目的 C (`1.0.0`) 版本。由于 D 和 B 依赖 C 的不同版本，因此可以将 C (`2.0.0`版本) 作为公用版本放在 `根 node_modules` 目录下，将 C(`1.0.0`版本) 作为 子项目 D 依赖的特殊版本放入子项目 D 自己的 `node_modules` 目录下。所以子项目 A/B 的 `config.json` 中 C 模块的 mode 值为 `local`，即当前本地开发的最新版本 `2.0.0`版本，子项目 D 的 `config.json` 中 C 模块的 mode 值为 `remote`，且需要配合其 `package.json` 声明的版本号 `1.0.0`，表明需要使用 C 的特殊版本进行远程下载然后本地加载。

4. 依赖安装完成后，可以使用 `yarn start:entry` 启动入口基座项目，开发环境下可以配置一些稳定的子模块。

5. 开发完成后，使用 `build:all` 编译各个处于开发模式的子项目，并完成最后的 `dist` 整合，整合后的文件位于基座应用根目录中的`dist`目录下，直接拷贝整个目录到服务器上即可直接运行。