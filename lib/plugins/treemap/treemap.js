"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../../interfaces/plugin");
const model_1 = require("./model");
const path = require("path");
const fse = require("fs-extra");
const nunjucks = require('nunjucks');
const chalk = require('chalk');
class Treemap extends plugin_1.default {
    constructor(ana, output) {
        super(ana, 'treemap');
        this.output = path.resolve(process.cwd(), output);
    }
    getPackageFileTree(p) {
        const treeMap = {};
        p.files.forEach((file) => {
            let pathname = file.path.replace(this.ana.mpDir, ''), dirname = file.dirname.replace(this.ana.mpDir, '');
            if (!treeMap[pathname]) {
                treeMap[pathname] = new model_1.DiskData(pathname, pathname, file.stat.size);
            }
            if (!treeMap[dirname]) {
                treeMap[dirname] = new model_1.DiskData(dirname, dirname);
            }
            treeMap[dirname].children.push(treeMap[pathname]);
            treeMap[dirname].value += treeMap[pathname].value;
        });
        const d = treeMap[p.path.replace(this.ana.mpDir, '')];
        d.name = p.name;
        return d;
    }
    async run() {
        this.diskData = [];
        const appPackage = this.ana.getPlugin('package');
        this.diskData.push(this.getPackageFileTree(appPackage.mainPackage));
        Object.keys(appPackage.subPackages).forEach((subPackageName) => {
            this.diskData.push(this.getPackageFileTree(appPackage.subPackages[subPackageName]));
        });
        const res = nunjucks.render(path.join(__dirname, '../../../tml.html'), {
            diskData: JSON.stringify(this.diskData)
        });
        console.log(chalk.green(`输出分析文件到${this.output}`));
        fse.outputFileSync(this.output, res);
    }
}
exports.default = Treemap;
