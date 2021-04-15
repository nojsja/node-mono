# node-mono

#### 介绍
The node middle layer - lerna mono repo.

#### 软件架构

多个子项目分为多个 git 仓库分别管理，开发环境整合的时候，使用 node-mono 脚手架添加多个 packages，然后通过脚手架全局命令统一管理，比如：全局启动、统一打包、全局清理、内部 packages 本地依赖构建。

#### 项目初始化

1. 将子项目仓库拷贝到放入 packages 目录
2. 本地 packages 的相互依赖可以使用 `lerna add [依赖包] --scope [作用package]`进行手动指定，相当于建立 link 软链接。
3. 依赖关系确定后，使用 `yarn setup` 安装各个模块的外部依赖，因为使用了 `hoist`模式，公用外部依赖会被提升至顶层，每个单独的 package 只安装自己的依赖。为了简化内部模块管理，内部模块采用 git 协议指定的 npm模块，例如：`"@wavesnows/wave-test": "git+http://git.your-inc.com/wavesnows/wave-test.git#branch1"`。
4. 依赖安装完成后，可以使用 `yarn start` 启动项目，开发环境下可以配置一些稳定的子模块，不进行实时打包，只使用 dist 文件(待实现)。
5. 开发完成后，可以使用 `yarn build` 编译各个处于开发模式的子项目，并完成最后的 `dist` 整合，最终的生产环境文件目录结构为一个 index.js 文件的形式 + 多个 package.index.js 入口文件的形式。需要考虑生产环境下调试问题，因此采用 dist + src 文件整合打包的形式，并可以通过命令切换启动模式(待实现)。

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
