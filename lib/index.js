"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const Vinyl = require('vinyl');
const treemap_1 = require("./plugins/treemap/treemap");
const package_1 = require("./plugins/package");
class ANA {
    constructor(mpDir, output) {
        this.mpDir = path.resolve(process.cwd(), mpDir);
        this.appFilePath = path.join(this.mpDir, 'app.json');
        this.fileMap = {};
        this.plugins = [];
        this.pluginMap = {};
        this.initPlugins();
        this.output = output || path.join(process.cwd(), 'treemap.html');
    }
    initPlugins() {
        this.register(new package_1.default(this));
        this.register(new treemap_1.default(this, this.output));
    }
    getPlugin(name) {
        return this.pluginMap[name];
    }
    register(p) {
        if (this.pluginMap[p.name]) {
            throw new Error(`插件${p.name}已存在`);
        }
        this.pluginMap[p.name] = p;
        this.plugins.push(p);
    }
    scanFiles() {
        return new Promise((resolve, reject) => {
            glob(`${this.mpDir}/**/*`, (err, files) => {
                if (err) {
                    return reject(err);
                }
                files.forEach((filePath) => {
                    const stat = fs.statSync(filePath);
                    this.fileMap[filePath] = new Vinyl({
                        cwd: process.cwd(),
                        base: path.parse(filePath).dir,
                        path: filePath,
                        stat,
                        contents: stat.isDirectory()
                            ? Buffer.from('')
                            : Buffer.from(fs.readFileSync(filePath, {
                                encoding: 'utf8'
                            }))
                    });
                });
                resolve(files);
            });
        });
    }
    async run() {
        await this.scanFiles();
        for (let i = 0; i < this.plugins.length; i++) {
            await this.plugins[i].run();
        }
    }
}
exports.default = ANA;
